/**
 * Formulario profesional para DetDocsReqCotizaVentas
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona documentos requeridos para cotizaciones de ventas con pestañas organizadas.
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de IDs y campos según regla ERP Megui
 * - Organización en pestañas para mejor UX
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
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearDetalleDocReqCotizaVentas, actualizarDetalleDocReqCotizaVentas } from '../../api/detDocsReqCotizaVentas';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  cotizacionVentaId: yup
    .number()
    .required('La cotización de venta es obligatoria')
    .positive('Debe seleccionar una cotización válida'),
  
  tipoDocumentoId: yup
    .number()
    .required('El tipo de documento es obligatorio')
    .positive('Debe seleccionar un tipo de documento válido'),
  
  obligatorio: yup
    .boolean(),
  
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
  
  entregado: yup
    .boolean(),
  
  validado: yup
    .boolean()
});

/**
 * Componente DetDocsReqCotizaVentasForm
 * Formulario para crear y editar documentos requeridos para cotizaciones de ventas
 */
const DetDocsReqCotizaVentasForm = ({ documento, onSave, onCancel }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [cotizacionesVenta, setCotizacionesVenta] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [validadores, setValidadores] = useState([]);

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
      cotizacionVentaId: null,
      tipoDocumentoId: null,
      obligatorio: false,
      numeroDocumento: '',
      fechaVencimiento: null,
      fechaEntrega: null,
      fechaValidacion: null,
      observaciones: '',
      urlArchivo: '',
      validadoPorId: null,
      entregado: false,
      validado: false
    }
  });

  // Watch para campos dependientes
  const entregadoValue = watch('entregado');

  /**
   * Carga los datos iniciales para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      // Aquí cargarías los datos reales desde las APIs correspondientes
      // Por ahora usamos datos de ejemplo
      setCotizacionesVenta([
        { id: 1, codigo: 'COT-001', cliente: 'Cliente A' },
        { id: 2, codigo: 'COT-002', cliente: 'Cliente B' },
        { id: 3, codigo: 'COT-003', cliente: 'Cliente C' }
      ]);

      setTiposDocumento([
        { id: 1, nombre: 'Factura Proforma' },
        { id: 2, nombre: 'Orden de Compra' },
        { id: 3, nombre: 'Certificado de Calidad' },
        { id: 4, nombre: 'Documento de Transporte' },
        { id: 5, nombre: 'Póliza de Seguro' }
      ]);

      setValidadores([
        { id: 1, nombres: 'Juan Pérez', cargo: 'Supervisor Ventas' },
        { id: 2, nombres: 'María García', cargo: 'Jefe Comercial' },
        { id: 3, nombres: 'Carlos López', cargo: 'Gerente Ventas' }
      ]);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  /**
   * Efecto para cargar datos cuando se edita un documento existente
   */
  useEffect(() => {
    if (documento) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        cotizacionVentaId: documento.cotizacionVentaId ? Number(documento.cotizacionVentaId) : null,
        tipoDocumentoId: documento.tipoDocumentoId ? Number(documento.tipoDocumentoId) : null,
        obligatorio: Boolean(documento.obligatorio),
        numeroDocumento: documento.numeroDocumento || '',
        fechaVencimiento: documento.fechaVencimiento ? new Date(documento.fechaVencimiento) : null,
        fechaEntrega: documento.fechaEntrega ? new Date(documento.fechaEntrega) : null,
        fechaValidacion: documento.fechaValidacion ? new Date(documento.fechaValidacion) : null,
        observaciones: documento.observaciones || '',
        urlArchivo: documento.urlArchivo || '',
        validadoPorId: documento.validadoPorId ? Number(documento.validadoPorId) : null,
        entregado: Boolean(documento.entregado),
        validado: Boolean(documento.validado)
      });
    } else {
      // Reset para nuevo registro
      reset({
        cotizacionVentaId: null,
        tipoDocumentoId: null,
        obligatorio: false,
        numeroDocumento: '',
        fechaVencimiento: null,
        fechaEntrega: null,
        fechaValidacion: null,
        observaciones: '',
        urlArchivo: '',
        validadoPorId: null,
        entregado: false,
        validado: false
      });
    }
  }, [documento, reset]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el documento requerido según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        cotizacionVentaId: Number(data.cotizacionVentaId),
        tipoDocumentoId: Number(data.tipoDocumentoId),
        obligatorio: Boolean(data.obligatorio),
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento).toISOString() : null,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega).toISOString() : null,
        fechaValidacion: data.fechaValidacion ? new Date(data.fechaValidacion).toISOString() : null,
        observaciones: data.observaciones?.trim() || null,
        urlArchivo: data.urlArchivo?.trim() || null,
        validadoPorId: data.validadoPorId ? Number(data.validadoPorId) : null,
        entregado: Boolean(data.entregado),
        validado: Boolean(data.validado)
      };

      let resultado;
      if (documento?.id) {
        // Actualizar documento existente
        resultado = await actualizarDetalleDocReqCotizaVentas(documento.id, datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido actualizado correctamente'
        });
      } else {
        // Crear nuevo documento
        resultado = await crearDetalleDocReqCotizaVentas(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido creado correctamente'
        });
      }

      console.log('Documento requerido guardado:', resultado);
      
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
        
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica" leftIcon="pi pi-info-circle mr-2">
            
            {/* Cotización de Venta */}
            <div className="field col-12 md:col-6">
              <label htmlFor="cotizacionVentaId" className="font-bold">
                Cotización de Venta *
              </label>
              <Controller
                name="cotizacionVentaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="cotizacionVentaId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={cotizacionesVenta}
                    optionLabel="codigo"
                    optionValue="id"
                    placeholder="Seleccione una cotización"
                    className={errors.cotizacionVentaId ? 'p-invalid' : ''}
                    filter
                    showClear
                  />
                )}
              />
              {errors.cotizacionVentaId && (
                <small className="p-error">{errors.cotizacionVentaId.message}</small>
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
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={tiposDocumento}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione un tipo de documento"
                    className={errors.tipoDocumentoId ? 'p-invalid' : ''}
                    filter
                    showClear
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

            {/* Fecha de Vencimiento */}
            <div className="field col-12 md:col-6">
              <label htmlFor="fechaVencimiento" className="font-bold">
                Fecha de Vencimiento
              </label>
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVencimiento"
                    {...field}
                    placeholder="Seleccione fecha de vencimiento"
                    className={errors.fechaVencimiento ? 'p-invalid' : ''}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                  />
                )}
              />
              {errors.fechaVencimiento && (
                <small className="p-error">{errors.fechaVencimiento.message}</small>
              )}
            </div>

            {/* Estados */}
            <div className="field col-12">
              <div className="flex flex-wrap gap-4">
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

                {entregadoValue && (
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
                )}
              </div>
            </div>

          </TabPanel>

          {/* Pestaña 2: Fechas y Validación */}
          <TabPanel header="Fechas y Validación" leftIcon="pi pi-calendar mr-2">
            
            {/* Fecha de Entrega */}
            <div className="field col-12 md:col-6">
              <label htmlFor="fechaEntrega" className="font-bold">
                Fecha de Entrega
              </label>
              <Controller
                name="fechaEntrega"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEntrega"
                    {...field}
                    placeholder="Seleccione fecha de entrega"
                    className={errors.fechaEntrega ? 'p-invalid' : ''}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                  />
                )}
              />
              {errors.fechaEntrega && (
                <small className="p-error">{errors.fechaEntrega.message}</small>
              )}
            </div>

            {/* Fecha de Validación */}
            <div className="field col-12 md:col-6">
              <label htmlFor="fechaValidacion" className="font-bold">
                Fecha de Validación
              </label>
              <Controller
                name="fechaValidacion"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaValidacion"
                    {...field}
                    placeholder="Seleccione fecha de validación"
                    className={errors.fechaValidacion ? 'p-invalid' : ''}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                  />
                )}
              />
              {errors.fechaValidacion && (
                <small className="p-error">{errors.fechaValidacion.message}</small>
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
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={validadores}
                    optionLabel="nombres"
                    optionValue="id"
                    placeholder="Seleccione el validador"
                    className={errors.validadoPorId ? 'p-invalid' : ''}
                    filter
                    showClear
                  />
                )}
              />
              {errors.validadoPorId && (
                <small className="p-error">{errors.validadoPorId.message}</small>
              )}
            </div>

          </TabPanel>

          {/* Pestaña 3: Archivo y Observaciones */}
          <TabPanel header="Archivo y Observaciones" leftIcon="pi pi-file mr-2">
            
            {/* URL del Archivo */}
            <div className="field col-12">
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
                    rows={4}
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
              label={documento?.id ? 'Actualizar' : 'Crear'}
              icon={documento?.id ? 'pi pi-check' : 'pi pi-plus'}
              className="p-button-primary"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default DetDocsReqCotizaVentasForm;
