/**
 * Formulario para gestión de Embarcaciones
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con activos, tipos de embarcación y estados
 * - Gestión de medidas técnicas con formato decimal
 * - Control de características del motor y equipos
 * - Validación de unicidad en matrícula y activoId
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas para embarcaciones pesqueras
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
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { classNames } from 'primereact/utils';
import { getEmbarcaciones, getEmbarcacionPorId, crearEmbarcacion, actualizarEmbarcacion, eliminarEmbarcacion } from '../../api/embarcacion';
import { getEntidadesComerciales } from '../../api/entidadComercial';

/**
 * Componente de formulario para embarcaciones
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const EmbarcacionForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  tiposEmbarcacion = [],
  estadosActivo = [],
  activos = []
}) => {
  // Estados locales
  const [proveedoresGps, setProveedoresGps] = useState([]);
  const [validandoMatricula, setValidandoMatricula] = useState(false);
  const [validandoActivo, setValidandoActivo] = useState(false);

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
      activoId: null,
      matricula: '',
      tipoEmbarcacionId: null,
      estadoActivoId: null,
      capacidadBodegaTon: null,
      esloraM: null,
      mangaM: null,
      puntalM: null,
      motorMarca: '',
      motorPotenciaHp: null,
      anioFabricacion: null,
      proveedorGpsId: null,
      tabletMarca: '',
      tabletModelo: ''
    }
  });

  // Observar cambios en matrícula y activo para validaciones
  const matricula = watch('matricula');
  const activoId = watch('activoId');

  /**
   * Cargar proveedores GPS al montar el componente
   */
  useEffect(() => {
    cargarProveedoresGps();
  }, []);

  /**
   * Validar matrícula cuando cambie
   */
  useEffect(() => {
    if (matricula && matricula.length >= 3) {
      validarMatricula();
    }
  }, [matricula]);

  /**
   * Validar activoId cuando cambie
   */
  useEffect(() => {
    if (activoId) {
      validarActivoId();
    }
  }, [activoId]);

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        activoId: Number(editingItem.activoId),
        matricula: editingItem.matricula,
        tipoEmbarcacionId: Number(editingItem.tipoEmbarcacionId),
        estadoActivoId: Number(editingItem.estadoActivoId),
        capacidadBodegaTon: editingItem.capacidadBodegaTon ? Number(editingItem.capacidadBodegaTon) : null,
        esloraM: editingItem.esloraM ? Number(editingItem.esloraM) : null,
        mangaM: editingItem.mangaM ? Number(editingItem.mangaM) : null,
        puntalM: editingItem.puntalM ? Number(editingItem.puntalM) : null,
        motorMarca: editingItem.motorMarca || '',
        motorPotenciaHp: editingItem.motorPotenciaHp ? Number(editingItem.motorPotenciaHp) : null,
        anioFabricacion: editingItem.anioFabricacion ? Number(editingItem.anioFabricacion) : null,
        proveedorGpsId: editingItem.proveedorGpsId ? Number(editingItem.proveedorGpsId) : null,
        tabletMarca: editingItem.tabletMarca || '',
        tabletModelo: editingItem.tabletModelo || ''
      });
    } else {
      reset({
        activoId: null,
        matricula: '',
        tipoEmbarcacionId: null,
        estadoActivoId: null,
        capacidadBodegaTon: null,
        esloraM: null,
        mangaM: null,
        puntalM: null,
        motorMarca: '',
        motorPotenciaHp: null,
        anioFabricacion: null,
        proveedorGpsId: null,
        tabletMarca: '',
        tabletModelo: ''
      });
    }
  }, [editingItem, reset]);

  /**
   * Cargar proveedores GPS
   */
  const cargarProveedoresGps = async () => {
    try {
      // Asumiendo que los proveedores GPS son entidades comerciales
      const data = await entidadComercialApi.getAll({ tipoProveedor: 'GPS' });
      setProveedoresGps(data);
    } catch (error) {
      console.error('Error al cargar proveedores GPS:', error);
    }
  };

  /**
   * Validar unicidad de matrícula
   */
  const validarMatricula = async () => {
    try {
      setValidandoMatricula(true);
      
      const resultado = await embarcacionApi.validarMatricula(
        matricula,
        editingItem?.id
      );

      if (!resultado.esUnica) {
        console.warn('Matrícula ya existe:', resultado.embarcacionExistente);
      }
    } catch (error) {
      console.error('Error al validar matrícula:', error);
    } finally {
      setValidandoMatricula(false);
    }
  };

  /**
   * Validar unicidad de activoId
   */
  const validarActivoId = async () => {
    try {
      setValidandoActivo(true);
      
      const resultado = await embarcacionApi.validarActivoId(
        activoId,
        editingItem?.id
      );

      if (!resultado.esUnico) {
        console.warn('Activo ya asignado:', resultado.embarcacionExistente);
      }
    } catch (error) {
      console.error('Error al validar activo:', error);
    } finally {
      setValidandoActivo(false);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      activoId: Number(data.activoId),
      matricula: data.matricula.trim().toUpperCase(),
      tipoEmbarcacionId: Number(data.tipoEmbarcacionId),
      estadoActivoId: Number(data.estadoActivoId),
      capacidadBodegaTon: data.capacidadBodegaTon ? Number(data.capacidadBodegaTon) : null,
      esloraM: data.esloraM ? Number(data.esloraM) : null,
      mangaM: data.mangaM ? Number(data.mangaM) : null,
      puntalM: data.puntalM ? Number(data.puntalM) : null,
      motorMarca: data.motorMarca?.trim() || null,
      motorPotenciaHp: data.motorPotenciaHp ? Number(data.motorPotenciaHp) : null,
      anioFabricacion: data.anioFabricacion ? Number(data.anioFabricacion) : null,
      proveedorGpsId: data.proveedorGpsId ? Number(data.proveedorGpsId) : null,
      tabletMarca: data.tabletMarca?.trim() || null,
      tabletModelo: data.tabletModelo?.trim() || null
    };

    onSave(formData);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    reset();
    onHide();
  };

  /**
   * Preparar opciones de activos para el dropdown
   */
  const activosOptions = activos.map(activo => ({
    label: `${activo.nombre} - ${activo.descripcion || 'Sin descripción'}`,
    value: Number(activo.id)
  }));

  /**
   * Preparar opciones de tipos de embarcación para el dropdown
   */
  const tiposEmbarcacionOptions = tiposEmbarcacion.map(tipo => ({
    label: tipo.nombre,
    value: Number(tipo.id)
  }));

  /**
   * Preparar opciones de estados activo para el dropdown
   */
  const estadosActivoOptions = estadosActivo.map(estado => ({
    label: estado.nombre,
    value: Number(estado.id)
  }));

  /**
   * Preparar opciones de proveedores GPS para el dropdown
   */
  const proveedoresGpsOptions = proveedoresGps.map(proveedor => ({
    label: proveedor.nombre,
    value: Number(proveedor.id)
  }));

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
        loading={validandoMatricula || validandoActivo}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '1000px' }}
      header={editingItem ? "Editar Embarcación" : "Nueva Embarcación"}
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        {/* Información Básica */}
        <Panel header="Información Básica" className="mb-4">
          <div className="grid">
            {/* Activo */}
            <div className="col-6">
              <label htmlFor="activoId" className="font-semibold">
                Activo *
              </label>
              <Controller
                name="activoId"
                control={control}
                rules={{ required: 'El activo es obligatorio' }}
                render={({ field }) => (
                  <Dropdown
                    id="activoId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={activosOptions}
                    placeholder="Seleccione un activo"
                    filter
                    showClear
                    className={classNames({ 'p-invalid': errors.activoId })}
                  />
                )}
              />
              {errors.activoId && (
                <Message severity="error" text={errors.activoId.message} />
              )}
              {validandoActivo && (
                <Message severity="info" text="Validando unicidad del activo..." />
              )}
            </div>

            {/* Matrícula */}
            <div className="col-6">
              <label htmlFor="matricula" className="font-semibold">
                Matrícula *
              </label>
              <Controller
                name="matricula"
                control={control}
                rules={{ 
                  required: 'La matrícula es obligatoria',
                  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  pattern: {
                    value: /^[A-Z0-9-]+$/i,
                    message: 'Solo letras, números y guiones'
                  }
                }}
                render={({ field }) => (
                  <InputText
                    id="matricula"
                    {...field}
                    value={field.value.toUpperCase()}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC-123"
                    className={classNames({ 'p-invalid': errors.matricula })}
                  />
                )}
              />
              {errors.matricula && (
                <Message severity="error" text={errors.matricula.message} />
              )}
              {validandoMatricula && (
                <Message severity="info" text="Validando unicidad de matrícula..." />
              )}
            </div>

            {/* Tipo de Embarcación */}
            <div className="col-6">
              <label htmlFor="tipoEmbarcacionId" className="font-semibold">
                Tipo de Embarcación *
              </label>
              <Controller
                name="tipoEmbarcacionId"
                control={control}
                rules={{ required: 'El tipo de embarcación es obligatorio' }}
                render={({ field }) => (
                  <Dropdown
                    id="tipoEmbarcacionId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={tiposEmbarcacionOptions}
                    placeholder="Seleccione un tipo"
                    filter
                    showClear
                    className={classNames({ 'p-invalid': errors.tipoEmbarcacionId })}
                  />
                )}
              />
              {errors.tipoEmbarcacionId && (
                <Message severity="error" text={errors.tipoEmbarcacionId.message} />
              )}
            </div>

            {/* Estado Activo */}
            <div className="col-6">
              <label htmlFor="estadoActivoId" className="font-semibold">
                Estado *
              </label>
              <Controller
                name="estadoActivoId"
                control={control}
                rules={{ required: 'El estado es obligatorio' }}
                render={({ field }) => (
                  <Dropdown
                    id="estadoActivoId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={estadosActivoOptions}
                    placeholder="Seleccione un estado"
                    filter
                    showClear
                    className={classNames({ 'p-invalid': errors.estadoActivoId })}
                  />
                )}
              />
              {errors.estadoActivoId && (
                <Message severity="error" text={errors.estadoActivoId.message} />
              )}
            </div>
          </div>
        </Panel>

        {/* Características Técnicas */}
        <Panel header="Características Técnicas" className="mb-4">
          <div className="grid">
            {/* Capacidad de Bodega */}
            <div className="col-6">
              <label htmlFor="capacidadBodegaTon" className="font-semibold">
                Capacidad de Bodega (Toneladas)
              </label>
              <Controller
                name="capacidadBodegaTon"
                control={control}
                rules={{
                  min: { value: 0.01, message: 'Debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="capacidadBodegaTon"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" Ton"
                    className={classNames({ 'p-invalid': errors.capacidadBodegaTon })}
                  />
                )}
              />
              {errors.capacidadBodegaTon && (
                <Message severity="error" text={errors.capacidadBodegaTon.message} />
              )}
            </div>

            {/* Año de Fabricación */}
            <div className="col-6">
              <label htmlFor="anioFabricacion" className="font-semibold">
                Año de Fabricación
              </label>
              <Controller
                name="anioFabricacion"
                control={control}
                rules={{
                  min: { value: 1900, message: 'Año mínimo: 1900' },
                  max: { value: new Date().getFullYear(), message: `Año máximo: ${new Date().getFullYear()}` }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="anioFabricacion"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    useGrouping={false}
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder="YYYY"
                    className={classNames({ 'p-invalid': errors.anioFabricacion })}
                  />
                )}
              />
              {errors.anioFabricacion && (
                <Message severity="error" text={errors.anioFabricacion.message} />
              )}
            </div>

            {/* Eslora */}
            <div className="col-4">
              <label htmlFor="esloraM" className="font-semibold">
                Eslora (metros)
              </label>
              <Controller
                name="esloraM"
                control={control}
                rules={{
                  min: { value: 0.01, message: 'Debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="esloraM"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" m"
                    className={classNames({ 'p-invalid': errors.esloraM })}
                  />
                )}
              />
              {errors.esloraM && (
                <Message severity="error" text={errors.esloraM.message} />
              )}
            </div>

            {/* Manga */}
            <div className="col-4">
              <label htmlFor="mangaM" className="font-semibold">
                Manga (metros)
              </label>
              <Controller
                name="mangaM"
                control={control}
                rules={{
                  min: { value: 0.01, message: 'Debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="mangaM"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" m"
                    className={classNames({ 'p-invalid': errors.mangaM })}
                  />
                )}
              />
              {errors.mangaM && (
                <Message severity="error" text={errors.mangaM.message} />
              )}
            </div>

            {/* Puntal */}
            <div className="col-4">
              <label htmlFor="puntalM" className="font-semibold">
                Puntal (metros)
              </label>
              <Controller
                name="puntalM"
                control={control}
                rules={{
                  min: { value: 0.01, message: 'Debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="puntalM"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" m"
                    className={classNames({ 'p-invalid': errors.puntalM })}
                  />
                )}
              />
              {errors.puntalM && (
                <Message severity="error" text={errors.puntalM.message} />
              )}
            </div>
          </div>
        </Panel>

        {/* Motor */}
        <Panel header="Información del Motor" className="mb-4">
          <div className="grid">
            {/* Marca del Motor */}
            <div className="col-6">
              <label htmlFor="motorMarca" className="font-semibold">
                Marca del Motor
              </label>
              <Controller
                name="motorMarca"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="motorMarca"
                    {...field}
                    placeholder="Ej: Caterpillar, Volvo, etc."
                    className={classNames({ 'p-invalid': errors.motorMarca })}
                  />
                )}
              />
            </div>

            {/* Potencia del Motor */}
            <div className="col-6">
              <label htmlFor="motorPotenciaHp" className="font-semibold">
                Potencia (HP)
              </label>
              <Controller
                name="motorPotenciaHp"
                control={control}
                rules={{
                  min: { value: 1, message: 'Debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <InputNumber
                    id="motorPotenciaHp"
                    {...field}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    placeholder="0"
                    suffix=" HP"
                    className={classNames({ 'p-invalid': errors.motorPotenciaHp })}
                  />
                )}
              />
              {errors.motorPotenciaHp && (
                <Message severity="error" text={errors.motorPotenciaHp.message} />
              )}
            </div>
          </div>
        </Panel>

        {/* Equipos */}
        <Panel header="Equipos y Tecnología" className="mb-4">
          <div className="grid">
            {/* Proveedor GPS */}
            <div className="col-12">
              <label htmlFor="proveedorGpsId" className="font-semibold">
                Proveedor GPS
              </label>
              <Controller
                name="proveedorGpsId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="proveedorGpsId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={proveedoresGpsOptions}
                    placeholder="Seleccione proveedor GPS (opcional)"
                    filter
                    showClear
                    className={classNames({ 'p-invalid': errors.proveedorGpsId })}
                  />
                )}
              />
            </div>

            {/* Marca de Tablet */}
            <div className="col-6">
              <label htmlFor="tabletMarca" className="font-semibold">
                Marca de Tablet
              </label>
              <Controller
                name="tabletMarca"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="tabletMarca"
                    {...field}
                    placeholder="Ej: Samsung, iPad, etc."
                    className={classNames({ 'p-invalid': errors.tabletMarca })}
                  />
                )}
              />
            </div>

            {/* Modelo de Tablet */}
            <div className="col-6">
              <label htmlFor="tabletModelo" className="font-semibold">
                Modelo de Tablet
              </label>
              <Controller
                name="tabletModelo"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="tabletModelo"
                    {...field}
                    placeholder="Ej: Galaxy Tab A, iPad Air, etc."
                    className={classNames({ 'p-invalid': errors.tabletModelo })}
                  />
                )}
              />
            </div>
          </div>
        </Panel>
      </form>
    </Dialog>
  );
};

export default EmbarcacionForm;
