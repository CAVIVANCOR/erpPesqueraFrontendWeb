/**
 * Formulario profesional para DetDocsReqCotizaCompras
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona documentos requeridos para cotizaciones de compras con relaciones y estados.
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de IDs y campos según regla ERP Megui
 * - Combos dependientes para cotizaciones y tipos de documento
 * - Gestión de fechas con Calendar de PrimeReact
 * - Manejo de archivos con URLs públicas
 * - Estados de entrega y validación con checkboxes
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { crearDetalleDocReqCotizaCompra, actualizarDetalleDocReqCotizaCompra } from '../../api/detDocsReqCotizaCompras';
import { getCotizacionesCompras } from '../../api/cotizacionCompras';
import { getTiposDocumento } from '../../api/tipoDocumento';
import { getUsuarios } from '../../api/usuarios';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  cotizacionCompraId: yup
    .number()
    .required('La cotización de compra es obligatoria')
    .positive('Debe seleccionar una cotización válida'),
  
  tipoDocumentoId: yup
    .number()
    .required('El tipo de documento es obligatorio')
    .positive('Debe seleccionar un tipo de documento válido'),
  
  numeroDocumento: yup
    .string()
    .max(50, 'El número de documento no puede exceder 50 caracteres'),
  
  fechaVencimiento: yup
    .date()
    .nullable()
    .min(new Date(), 'La fecha de vencimiento debe ser futura'),
  
  fechaEntrega: yup
    .date()
    .nullable(),
  
  fechaValidacion: yup
    .date()
    .nullable(),
  
  observaciones: yup
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres'),
  
  urlArchivo: yup
    .string()
    .url('Debe ser una URL válida')
    .max(255, 'La URL no puede exceder 255 caracteres'),
  
  validadoPorId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un validador válido'),
  
  obligatorio: yup
    .boolean(),
  
  entregado: yup
    .boolean(),
  
  validado: yup
    .boolean()
});

/**
 * Componente DetDocsReqCotizaComprasForm
 * Formulario para crear y editar documentos requeridos para cotizaciones de compras
 */
const DetDocsReqCotizaComprasForm = ({ detalle, onSave, onCancel }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Estados para combos
  const [cotizaciones, setCotizaciones] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      cotizacionCompraId: null,
      tipoDocumentoId: null,
      numeroDocumento: '',
      fechaVencimiento: null,
      fechaEntrega: null,
      fechaValidacion: null,
      observaciones: '',
      urlArchivo: '',
      validadoPorId: null,
      obligatorio: false,
      entregado: false,
      validado: false
    }
  });

  // Watch para validaciones dependientes
  const entregadoValue = watch('entregado');
  const validadoValue = watch('validado');

  /**
   * Carga inicial de datos para combos
   */
  useEffect(() => {
    cargarDatosCombos();
  }, []);

  /**
   * Efecto para cargar datos cuando se edita un detalle existente
   */
  useEffect(() => {
    if (detalle) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        cotizacionCompraId: detalle.cotizacionCompraId ? Number(detalle.cotizacionCompraId) : null,
        tipoDocumentoId: detalle.tipoDocumentoId ? Number(detalle.tipoDocumentoId) : null,
        numeroDocumento: detalle.numeroDocumento?.trim() || '',
        fechaVencimiento: detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null,
        fechaEntrega: detalle.fechaEntrega ? new Date(detalle.fechaEntrega) : null,
        fechaValidacion: detalle.fechaValidacion ? new Date(detalle.fechaValidacion) : null,
        observaciones: detalle.observaciones?.trim() || '',
        urlArchivo: detalle.urlArchivo?.trim() || '',
        validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
        obligatorio: Boolean(detalle.obligatorio),
        entregado: Boolean(detalle.entregado),
        validado: Boolean(detalle.validado)
      });
    } else {
      // Reset para nuevo registro
      reset({
        cotizacionCompraId: null,
        tipoDocumentoId: null,
        numeroDocumento: '',
        fechaVencimiento: null,
        fechaEntrega: null,
        fechaValidacion: null,
        observaciones: '',
        urlArchivo: '',
        validadoPorId: null,
        obligatorio: false,
        entregado: false,
        validado: false
      });
    }
  }, [detalle, reset]);

  /**
   * Carga datos para los combos desde las APIs
   */
  const cargarDatosCombos = async () => {
    try {
      setLoadingCombos(true);
      
      const [cotizacionesData, tiposDocData, usuariosData] = await Promise.all([
        getCotizacionesCompras(),
        getTiposDocumento(),
        getUsuarios()
      ]);

      // Normalización de datos para combos según regla ERP Megui
      setCotizaciones(cotizacionesData.map(cot => ({
        label: `${cot.codigo} - ${cot.proveedor?.razonSocial || 'Sin proveedor'}`,
        value: Number(cot.id)
      })));

      setTiposDocumento(tiposDocData.map(tipo => ({
        label: tipo.nombre,
        value: Number(tipo.id)
      })));

      setUsuarios(usuariosData.map(usuario => ({
        label: `${usuario.nombre} ${usuario.apellido}`,
        value: Number(usuario.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos de combos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos para los combos'
      });
    } finally {
      setLoadingCombos(false);
    }
  };

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el detalle según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        cotizacionCompraId: Number(data.cotizacionCompraId),
        tipoDocumentoId: Number(data.tipoDocumentoId),
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento).toISOString() : null,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega).toISOString() : null,
        fechaValidacion: data.fechaValidacion ? new Date(data.fechaValidacion).toISOString() : null,
        observaciones: data.observaciones?.trim() || null,
        urlArchivo: data.urlArchivo?.trim() || null,
        validadoPorId: data.validadoPorId ? Number(data.validadoPorId) : null,
        obligatorio: Boolean(data.obligatorio),
        entregado: Boolean(data.entregado),
        validado: Boolean(data.validado)
      };

      let resultado;
      if (detalle?.id) {
        // Actualizar detalle existente
        resultado = await actualizarDetalleDocReqCotizaCompra(detalle.id, datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido actualizado correctamente'
        });
      } else {
        // Crear nuevo detalle
        resultado = await crearDetalleDocReqCotizaCompra(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido creado correctamente'
        });
      }      
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar documento requerido:', error);
      
      // Mostrar error específico del servidor o error genérico
      const mensajeError = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el documento requerido';
      
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: mensajeError
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="formgrid grid">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          
          {/* Pestaña: Información General */}
          <TabPanel header="Información General" leftIcon="pi pi-info-circle">
            <div className="formgrid grid">
              
              {/* Cotización de Compra */}
              <div className="field col-12 md:col-6">
                <label htmlFor="cotizacionCompraId" className="font-bold">
                  Cotización de Compra *
                </label>
                <Controller
                  name="cotizacionCompraId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="cotizacionCompraId"
                      value={field.value ? Number(field.value) : null}
                      options={cotizaciones}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione una cotización"
                      className={errors.cotizacionCompraId ? 'p-invalid' : ''}
                      filter
                      showClear
                      loading={loadingCombos}
                    />
                  )}
                />
                {errors.cotizacionCompraId && (
                  <small className="p-error">{errors.cotizacionCompraId.message}</small>
                )}
              </div>

              {/* Tipo de Documento */}
              <div className="field col-12 md:col-6">
                <label htmlFor="tipoDocumentoId" className="font-bold">
                  Tipo de Documento *
                </label>
                <Controller
                  name="tipoDocumentoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoDocumentoId"
                      value={field.value ? Number(field.value) : null}
                      options={tiposDocumento}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione un tipo"
                      className={errors.tipoDocumentoId ? 'p-invalid' : ''}
                      filter
                      showClear
                      loading={loadingCombos}
                    />
                  )}
                />
                {errors.tipoDocumentoId && (
                  <small className="p-error">{errors.tipoDocumentoId.message}</small>
                )}
              </div>

              {/* Número de Documento */}
              <div className="field col-12 md:col-6">
                <label htmlFor="numeroDocumento" className="font-bold">
                  Número de Documento
                </label>
                <Controller
                  name="numeroDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroDocumento"
                      {...field}
                      placeholder="Número del documento"
                      className={errors.numeroDocumento ? 'p-invalid' : ''}
                      maxLength={50}
                    />
                  )}
                />
                {errors.numeroDocumento && (
                  <small className="p-error">{errors.numeroDocumento.message}</small>
                )}
              </div>

              {/* URL del Archivo */}
              <div className="field col-12 md:col-6">
                <label htmlFor="urlArchivo" className="font-bold">
                  URL del Archivo
                </label>
                <Controller
                  name="urlArchivo"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlArchivo"
                      {...field}
                      placeholder="https://ejemplo.com/archivo.pdf"
                      className={errors.urlArchivo ? 'p-invalid' : ''}
                      maxLength={255}
                    />
                  )}
                />
                {errors.urlArchivo && (
                  <small className="p-error">{errors.urlArchivo.message}</small>
                )}
              </div>

              {/* Estados */}
              <div className="field col-12">
                <div className="formgrid grid">
                  <div className="field col-12 md:col-4">
                    <div className="flex align-items-center">
                      <Controller
                        name="obligatorio"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="obligatorio"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <label htmlFor="obligatorio" className="font-bold">
                        Documento obligatorio
                      </label>
                    </div>
                  </div>

                  <div className="field col-12 md:col-4">
                    <div className="flex align-items-center">
                      <Controller
                        name="entregado"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="entregado"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <label htmlFor="entregado" className="font-bold">
                        Documento entregado
                      </label>
                    </div>
                  </div>

                  <div className="field col-12 md:col-4">
                    <div className="flex align-items-center">
                      <Controller
                        name="validado"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="validado"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.checked)}
                            className="mr-2"
                          />
                        )}
                      />
                      <label htmlFor="validado" className="font-bold">
                        Documento validado
                      </label>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </TabPanel>

          {/* Pestaña: Fechas y Validación */}
          <TabPanel header="Fechas y Validación" leftIcon="pi pi-calendar">
            <div className="formgrid grid">
              
              {/* Fecha de Vencimiento */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaVencimiento" className="font-bold">
                  Fecha de Vencimiento
                </label>
                <Controller
                  name="fechaVencimiento"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaVencimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha"
                      className={errors.fechaVencimiento ? 'p-invalid' : ''}
                      showIcon
                      dateFormat="dd/mm/yy"
                      showButtonBar
                    />
                  )}
                />
                {errors.fechaVencimiento && (
                  <small className="p-error">{errors.fechaVencimiento.message}</small>
                )}
              </div>

              {/* Fecha de Entrega */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaEntrega" className="font-bold">
                  Fecha de Entrega
                </label>
                <Controller
                  name="fechaEntrega"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEntrega"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha"
                      className={errors.fechaEntrega ? 'p-invalid' : ''}
                      showIcon
                      dateFormat="dd/mm/yy"
                      showButtonBar
                      disabled={!entregadoValue}
                    />
                  )}
                />
                {errors.fechaEntrega && (
                  <small className="p-error">{errors.fechaEntrega.message}</small>
                )}
                {!entregadoValue && (
                  <small className="text-600">
                    Marque "Documento entregado" para habilitar esta fecha
                  </small>
                )}
              </div>

              {/* Fecha de Validación */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaValidacion" className="font-bold">
                  Fecha de Validación
                </label>
                <Controller
                  name="fechaValidacion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaValidacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha"
                      className={errors.fechaValidacion ? 'p-invalid' : ''}
                      showIcon
                      dateFormat="dd/mm/yy"
                      showButtonBar
                      disabled={!validadoValue}
                    />
                  )}
                />
                {errors.fechaValidacion && (
                  <small className="p-error">{errors.fechaValidacion.message}</small>
                )}
                {!validadoValue && (
                  <small className="text-600">
                    Marque "Documento validado" para habilitar esta fecha
                  </small>
                )}
              </div>

              {/* Validado Por */}
              <div className="field col-12">
                <label htmlFor="validadoPorId" className="font-bold">
                  Validado Por
                </label>
                <Controller
                  name="validadoPorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="validadoPorId"
                      value={field.value ? Number(field.value) : null}
                      options={usuarios}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione un validador"
                      className={errors.validadoPorId ? 'p-invalid' : ''}
                      filter
                      showClear
                      loading={loadingCombos}
                      disabled={!validadoValue}
                    />
                  )}
                />
                {errors.validadoPorId && (
                  <small className="p-error">{errors.validadoPorId.message}</small>
                )}
                {!validadoValue && (
                  <small className="text-600">
                    Marque "Documento validado" para seleccionar un validador
                  </small>
                )}
              </div>

            </div>
          </TabPanel>

          {/* Pestaña: Observaciones */}
          <TabPanel header="Observaciones" leftIcon="pi pi-comment">
            <div className="formgrid grid">
              
              {/* Observaciones */}
              <div className="field col-12">
                <label htmlFor="observaciones" className="font-bold">
                  Observaciones
                </label>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="observaciones"
                      {...field}
                      placeholder="Observaciones adicionales sobre el documento..."
                      className={errors.observaciones ? 'p-invalid' : ''}
                      rows={6}
                      maxLength={500}
                    />
                  )}
                />
                {errors.observaciones && (
                  <small className="p-error">{errors.observaciones.message}</small>
                )}
                <small className="text-600">
                  Máximo 500 caracteres
                </small>
              </div>

            </div>
          </TabPanel>

        </TabView>

        {/* Botones de acción */}
        <div className="field col-12">
          <div className="flex justify-content-end gap-2 pt-4">
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={handleCancel}
              disabled={loading}
            />
            <Button
              type="submit"
              label={detalle?.id ? 'Actualizar' : 'Crear'}
              icon={detalle?.id ? 'pi pi-check' : 'pi pi-plus'}
              className="p-button-primary"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default DetDocsReqCotizaComprasForm;
