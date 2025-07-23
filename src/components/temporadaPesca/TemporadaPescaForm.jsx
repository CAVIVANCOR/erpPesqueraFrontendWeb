/**
 * Formulario para gestión de Temporadas de Pesca
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con empresas, bahías y especies
 * - Gestión de cuotas con formato decimal
 * - Control de fechas de inicio y fin con validaciones
 * - Upload de archivos PDF para resoluciones
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas (fechas, cuotas, superposición)
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { getBahias } from '../../api/bahia';
import { getTemporadasPesca, getTemporadaPescaPorId, crearTemporadaPesca, actualizarTemporadaPesca, subirDocumentoTemporada } from '../../api/temporadaPesca';

/**
 * Componente de formulario para temporadas de pesca
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const TemporadaPescaForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  empresas = [],
  especies = []
}) => {
  // Estados locales
  const [bahias, setBahias] = useState([]);
  const [bahiasFiltradas, setBahiasFiltradas] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [archivoSubido, setArchivoSubido] = useState(null);
  const [validandoSuperposicion, setValidandoSuperposicion] = useState(false);

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      empresaId: null,
      BahiaId: null,
      especieId: null,
      nombre: '',
      fechaInicio: null,
      fechaFin: null,
      numeroResolucion: '',
      urlResolucionPdf: '',
      cuotaPropiaTon: null,
      cuotaAlquiladaTon: null
    }
  });

  // Observar cambios en empresa para filtrar bahías
  const empresaSeleccionada = watch('empresaId');
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  const especieSeleccionada = watch('especieId');

  /**
   * Cargar bahías al montar el componente
   */
  useEffect(() => {
    cargarBahias();
  }, []);

  /**
   * Filtrar bahías cuando cambie la empresa seleccionada
   */
  useEffect(() => {
    if (empresaSeleccionada && bahias.length > 0) {
      const bahiasFiltradas = bahias.filter(bahia => 
        bahia.empresaId === Number(empresaSeleccionada)
      );
      setBahiasFiltradas(bahiasFiltradas);
      
      // Limpiar bahía seleccionada si no pertenece a la nueva empresa
      const bahiaActual = watch('BahiaId');
      if (bahiaActual && !bahiasFiltradas.find(b => b.id === Number(bahiaActual))) {
        setValue('BahiaId', null);
      }
    } else {
      setBahiasFiltradas([]);
      setValue('BahiaId', null);
    }
  }, [empresaSeleccionada, bahias, setValue, watch]);

  /**
   * Validar superposición cuando cambien fechas o especie
   */
  useEffect(() => {
    if (fechaInicio && fechaFin && especieSeleccionada && empresaSeleccionada) {
      validarSuperposicionFechas();
    }
  }, [fechaInicio, fechaFin, especieSeleccionada, empresaSeleccionada]);

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        empresaId: Number(editingItem.empresaId),
        BahiaId: Number(editingItem.BahiaId),
        especieId: Number(editingItem.especieId),
        nombre: editingItem.nombre,
        fechaInicio: new Date(editingItem.fechaInicio),
        fechaFin: new Date(editingItem.fechaFin),
        numeroResolucion: editingItem.numeroResolucion || '',
        urlResolucionPdf: editingItem.urlResolucionPdf || '',
        cuotaPropiaTon: editingItem.cuotaPropiaTon ? Number(editingItem.cuotaPropiaTon) : null,
        cuotaAlquiladaTon: editingItem.cuotaAlquiladaTon ? Number(editingItem.cuotaAlquiladaTon) : null
      });
      
      if (editingItem.urlResolucionPdf) {
        setArchivoSubido({
          name: editingItem.numeroResolucion + '.pdf',
          url: editingItem.urlResolucionPdf
        });
      }
    } else {
      reset({
        empresaId: null,
        BahiaId: null,
        especieId: null,
        nombre: '',
        fechaInicio: null,
        fechaFin: null,
        numeroResolucion: '',
        urlResolucionPdf: '',
        cuotaPropiaTon: null,
        cuotaAlquiladaTon: null
      });
      setArchivoSubido(null);
    }
  }, [editingItem, reset]);

  /**
   * Cargar bahías disponibles
   */
  const cargarBahias = async () => {
    try {
      const data = await bahiaApi.getAll();
      setBahias(data);
    } catch (error) {
      console.error('Error al cargar bahías:', error);
    }
  };

  /**
   * Validar superposición de fechas con otras temporadas
   */
  const validarSuperposicionFechas = async () => {
    try {
      setValidandoSuperposicion(true);
      
      const datos = {
        empresaId: Number(empresaSeleccionada),
        especieId: Number(especieSeleccionada),
        fechaInicio: fechaInicio,
        fechaFin: fechaFin
      };

      const resultado = await temporadaPescaApi.validarSuperposicion(
        datos, 
        editingItem?.id
      );

      if (resultado.haySuperposicion) {
        // Mostrar advertencia de superposición
        console.warn('Superposición detectada:', resultado.temporadasSuperpuestas);
      }
    } catch (error) {
      console.error('Error al validar superposición:', error);
    } finally {
      setValidandoSuperposicion(false);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      empresaId: Number(data.empresaId),
      BahiaId: Number(data.BahiaId),
      especieId: Number(data.especieId),
      nombre: data.nombre.trim(),
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
      numeroResolucion: data.numeroResolucion?.trim() || null,
      urlResolucionPdf: data.urlResolucionPdf?.trim() || archivoSubido?.url || null,
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon ? Number(data.cuotaAlquiladaTon) : null
    };

    onSave(formData);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    reset();
    setArchivoSubido(null);
    setUploadProgress(0);
    onHide();
  };

  /**
   * Manejar upload de archivo PDF
   */
  const onUpload = async (event) => {
    const file = event.files[0];
    
    try {
      setUploadProgress(0);
      
      // Simular progreso de upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const resultado = await temporadaPescaApi.uploadResolucionPdf(file);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setArchivoSubido({
        name: file.name,
        url: resultado.url
      });
      
      setValue('urlResolucionPdf', resultado.url);
      
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      console.error('Error al subir archivo:', error);
      setUploadProgress(0);
    }
  };

  /**
   * Preparar opciones de empresas para el dropdown
   */
  const empresasOptions = empresas.map(empresa => ({
    label: empresa.nombre,
    value: Number(empresa.id)
  }));

  /**
   * Preparar opciones de bahías filtradas para el dropdown
   */
  const bahiasOptions = bahiasFiltradas.map(bahia => ({
    label: `${bahia.nombre} - ${bahia.descripcion || 'Sin descripción'}`,
    value: Number(bahia.id)
  }));

  /**
   * Preparar opciones de especies para el dropdown
   */
  const especiesOptions = especies.map(especie => ({
    label: especie.nombre,
    value: Number(especie.id)
  }));

  /**
   * Template personalizado para upload de archivos
   */
  const uploadTemplate = (options) => {
    return (
      <div className="flex align-items-center gap-3 p-3 border-2 border-dashed surface-border border-round">
        <i className="pi pi-cloud-upload text-4xl text-primary"></i>
        <div className="flex-1">
          <p className="m-0 font-semibold">Arrastrar archivo PDF aquí</p>
          <p className="m-0 text-sm text-500">o hacer clic para seleccionar</p>
        </div>
        <Button
          {...options}
          icon="pi pi-upload"
          className="p-button-outlined"
        />
      </div>
    );
  };

  /**
   * Footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={handleHide}
      />
      <Button
        label={editingItem ? "Actualizar" : "Crear"}
        icon="pi pi-check"
        onClick={handleSubmit(onSubmit)}
        loading={validandoSuperposicion}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '900px' }}
      header={editingItem ? "Editar Temporada de Pesca" : "Nueva Temporada de Pesca"}
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Empresa */}
          <div className="col-6">
            <label htmlFor="empresaId" className="font-semibold">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: 'La empresa es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={empresasOptions}
                  placeholder="Seleccione una empresa"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.empresaId })}
                />
              )}
            />
            {errors.empresaId && (
              <Message severity="error" text={errors.empresaId.message} />
            )}
          </div>

          {/* Bahía */}
          <div className="col-6">
            <label htmlFor="BahiaId" className="font-semibold">
              Bahía *
            </label>
            <Controller
              name="BahiaId"
              control={control}
              rules={{ required: 'La bahía es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="BahiaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={bahiasOptions}
                  placeholder={empresaSeleccionada ? "Seleccione una bahía" : "Primero seleccione empresa"}
                  filter
                  showClear
                  disabled={!empresaSeleccionada}
                  className={classNames({ 'p-invalid': errors.BahiaId })}
                />
              )}
            />
            {errors.BahiaId && (
              <Message severity="error" text={errors.BahiaId.message} />
            )}
          </div>

          {/* Especie */}
          <div className="col-6">
            <label htmlFor="especieId" className="font-semibold">
              Especie *
            </label>
            <Controller
              name="especieId"
              control={control}
              rules={{ required: 'La especie es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="especieId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={especiesOptions}
                  placeholder="Seleccione una especie"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.especieId })}
                />
              )}
            />
            {errors.especieId && (
              <Message severity="error" text={errors.especieId.message} />
            )}
          </div>

          {/* Nombre de Temporada */}
          <div className="col-6">
            <label htmlFor="nombre" className="font-semibold">
              Nombre de Temporada *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{ 
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  {...field}
                  placeholder="Ej: Temporada Anchoveta 2024"
                  className={classNames({ 'p-invalid': errors.nombre })}
                />
              )}
            />
            {errors.nombre && (
              <Message severity="error" text={errors.nombre.message} />
            )}
          </div>

          {/* Fecha de Inicio */}
          <div className="col-6">
            <label htmlFor="fechaInicio" className="font-semibold">
              Fecha de Inicio *
            </label>
            <Controller
              name="fechaInicio"
              control={control}
              rules={{ 
                required: 'La fecha de inicio es obligatoria',
                validate: (value) => {
                  const fin = watch('fechaFin');
                  if (fin && value >= fin) {
                    return 'La fecha de inicio debe ser anterior a la fecha de fin';
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaInicio"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha de inicio"
                  showIcon
                  className={classNames({ 'p-invalid': errors.fechaInicio })}
                />
              )}
            />
            {errors.fechaInicio && (
              <Message severity="error" text={errors.fechaInicio.message} />
            )}
          </div>

          {/* Fecha de Fin */}
          <div className="col-6">
            <label htmlFor="fechaFin" className="font-semibold">
              Fecha de Fin *
            </label>
            <Controller
              name="fechaFin"
              control={control}
              rules={{ 
                required: 'La fecha de fin es obligatoria',
                validate: (value) => {
                  const inicio = watch('fechaInicio');
                  if (inicio && value <= inicio) {
                    return 'La fecha de fin debe ser posterior a la fecha de inicio';
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaFin"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha de fin"
                  showIcon
                  className={classNames({ 'p-invalid': errors.fechaFin })}
                />
              )}
            />
            {errors.fechaFin && (
              <Message severity="error" text={errors.fechaFin.message} />
            )}
          </div>

          {/* Cuota Propia */}
          <div className="col-6">
            <label htmlFor="cuotaPropiaTon" className="font-semibold">
              Cuota Propia (Toneladas)
            </label>
            <Controller
              name="cuotaPropiaTon"
              control={control}
              rules={{
                min: { value: 0, message: 'La cuota no puede ser negativa' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="cuotaPropiaTon"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="0.00"
                  suffix=" Ton"
                  className={classNames({ 'p-invalid': errors.cuotaPropiaTon })}
                />
              )}
            />
            {errors.cuotaPropiaTon && (
              <Message severity="error" text={errors.cuotaPropiaTon.message} />
            )}
          </div>

          {/* Cuota Alquilada */}
          <div className="col-6">
            <label htmlFor="cuotaAlquiladaTon" className="font-semibold">
              Cuota Alquilada (Toneladas)
            </label>
            <Controller
              name="cuotaAlquiladaTon"
              control={control}
              rules={{
                min: { value: 0, message: 'La cuota no puede ser negativa' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="cuotaAlquiladaTon"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="0.00"
                  suffix=" Ton"
                  className={classNames({ 'p-invalid': errors.cuotaAlquiladaTon })}
                />
              )}
            />
            {errors.cuotaAlquiladaTon && (
              <Message severity="error" text={errors.cuotaAlquiladaTon.message} />
            )}
          </div>

          {/* Número de Resolución */}
          <div className="col-6">
            <label htmlFor="numeroResolucion" className="font-semibold">
              Número de Resolución
            </label>
            <Controller
              name="numeroResolucion"
              control={control}
              render={({ field }) => (
                <InputText
                  id="numeroResolucion"
                  {...field}
                  placeholder="Ej: R.M. N° 123-2024-PRODUCE"
                  className={classNames({ 'p-invalid': errors.numeroResolucion })}
                />
              )}
            />
            <small className="text-muted">
              Número de la resolución ministerial o administrativa
            </small>
          </div>

          {/* Upload de Resolución PDF */}
          <div className="col-6">
            <label className="font-semibold">
              Archivo de Resolución (PDF)
            </label>
            <FileUpload
              mode="basic"
              accept="application/pdf"
              maxFileSize={5000000}
              onUpload={onUpload}
              chooseOptions={{
                label: 'Seleccionar PDF',
                icon: 'pi pi-file-pdf'
              }}
              uploadHandler={onUpload}
              customUpload
            />
            
            {uploadProgress > 0 && (
              <ProgressBar 
                value={uploadProgress} 
                className="mt-2"
                style={{ height: '6px' }}
              />
            )}
            
            {archivoSubido && (
              <div className="mt-2">
                <Tag
                  value={archivoSubido.name}
                  severity="success"
                  icon="pi pi-file-pdf"
                />
                {archivoSubido.url && (
                  <Button
                    icon="pi pi-eye"
                    className="p-button-text p-button-sm ml-2"
                    tooltip="Ver archivo"
                    onClick={() => window.open(archivoSubido.url, '_blank')}
                  />
                )}
              </div>
            )}
            
            <small className="text-muted">
              Archivo PDF de la resolución (máximo 5MB)
            </small>
          </div>

          {/* Indicador de validación de superposición */}
          {validandoSuperposicion && (
            <div className="col-12">
              <Message
                severity="info"
                text="Validando superposición de fechas con otras temporadas..."
                className="w-full"
              />
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
};

export default TemporadaPescaForm;
