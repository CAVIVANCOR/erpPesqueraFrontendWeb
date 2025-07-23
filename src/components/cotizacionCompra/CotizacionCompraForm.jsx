/**
 * Formulario para gestión de Cotizaciones de Compra
 * 
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y reglas de negocio
 * - Formulario organizado en pestañas (TabView) para mejor UX
 * - Normalización de IDs numéricos en combos según regla ERP Megui
 * - Integración con APIs usando funciones en español
 * - Campos decimales con exactamente 2 decimales para montos
 * - Cumple estándar ERP Megui completo
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';
import { crearCotizacionCompras, actualizarCotizacionCompras } from '../../api/cotizacionCompras';
import { getEmpresas } from '../../api/empresa';
import { getTiposProducto } from '../../api/tipoProducto';
import { getAllTipoEstadoProducto } from '../../api/tipoEstadoProducto';
import { getDestinosProducto } from '../../api/destinoProducto';

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  empresaId: yup
    .number()
    .required('La empresa es obligatoria')
    .positive('Debe seleccionar una empresa válida'),
  numero: yup
    .string()
    .required('El número de cotización es obligatorio')
    .max(50, 'El número no puede exceder 50 caracteres')
    .trim(),
  tipoProductoId: yup
    .number()
    .required('El tipo de producto es obligatorio')
    .positive('Debe seleccionar un tipo de producto válido'),
  tipoEstadoProductoId: yup
    .number()
    .required('El tipo de estado de producto es obligatorio')
    .positive('Debe seleccionar un tipo de estado válido'),
  destinoProductoId: yup
    .number()
    .required('El destino de producto es obligatorio')
    .positive('Debe seleccionar un destino válido'),
  fechaCotizacion: yup
    .date()
    .required('La fecha de cotización es obligatoria'),
  fechaEntrega: yup
    .date()
    .required('La fecha de entrega es obligatoria')
    .min(new Date(), 'La fecha de entrega debe ser futura'),
  montoTotal: yup
    .number()
    .min(0, 'El monto total debe ser mayor o igual a 0')
    .nullable(),
  estado: yup
    .string()
    .oneOf(['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CONVERTIDA'], 'Estado inválido')
    .default('BORRADOR'),
  observaciones: yup
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .nullable(),
  activo: yup.boolean().default(true)
});

const CotizacionCompraForm = ({ cotizacion, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const esEdicion = !!cotizacion;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      empresaId: null,
      numero: '',
      tipoProductoId: null,
      tipoEstadoProductoId: null,
      destinoProductoId: null,
      fechaCotizacion: new Date(),
      fechaEntrega: null,
      montoTotal: 0,
      estado: 'BORRADOR',
      observaciones: '',
      activo: true
    }
  });

  // Opciones de estado
  const estadosOptions = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Enviada', value: 'ENVIADA' },
    { label: 'Aprobada', value: 'APROBADA' },
    { label: 'Rechazada', value: 'RECHAZADA' },
    { label: 'Vencida', value: 'VENCIDA' },
    { label: 'Convertida', value: 'CONVERTIDA' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (cotizacion) {
      setValue('empresaId', cotizacion.empresaId ? Number(cotizacion.empresaId) : null);
      setValue('numero', cotizacion.numero || '');
      setValue('tipoProductoId', cotizacion.tipoProductoId ? Number(cotizacion.tipoProductoId) : null);
      setValue('tipoEstadoProductoId', cotizacion.tipoEstadoProductoId ? Number(cotizacion.tipoEstadoProductoId) : null);
      setValue('destinoProductoId', cotizacion.destinoProductoId ? Number(cotizacion.destinoProductoId) : null);
      setValue('fechaCotizacion', cotizacion.fechaCotizacion ? new Date(cotizacion.fechaCotizacion) : new Date());
      setValue('fechaEntrega', cotizacion.fechaEntrega ? new Date(cotizacion.fechaEntrega) : null);
      setValue('montoTotal', cotizacion.montoTotal || 0);
      setValue('estado', cotizacion.estado || 'BORRADOR');
      setValue('observaciones', cotizacion.observaciones || '');
      setValue('activo', cotizacion.activo !== undefined ? cotizacion.activo : true);
    } else {
      reset({
        empresaId: null,
        numero: '',
        tipoProductoId: null,
        tipoEstadoProductoId: null,
        destinoProductoId: null,
        fechaCotizacion: new Date(),
        fechaEntrega: null,
        montoTotal: 0,
        estado: 'BORRADOR',
        observaciones: '',
        activo: true
      });
    }
  }, [cotizacion, setValue, reset]);

  /**
   * Carga los datos iniciales para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      const [
        empresasData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData
      ] = await Promise.all([
        getEmpresas(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getDestinosProducto()
      ]);

      // Normalizar IDs a números para los combos
      setEmpresas(empresasData.map(item => ({
        ...item,
        value: Number(item.id),
        label: item.nombre
      })));

      setTiposProducto(tiposProductoData.map(item => ({
        ...item,
        value: Number(item.id),
        label: item.nombre
      })));

      setTiposEstadoProducto(tiposEstadoProductoData.map(item => ({
        ...item,
        value: Number(item.id),
        label: item.nombre
      })));

      setDestinosProducto(destinosProductoData.map(item => ({
        ...item,
        value: Number(item.id),
        label: item.nombre
      })));
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        empresaId: Number(data.empresaId),
        numero: data.numero.trim(),
        tipoProductoId: Number(data.tipoProductoId),
        tipoEstadoProductoId: Number(data.tipoEstadoProductoId),
        destinoProductoId: Number(data.destinoProductoId),
        fechaCotizacion: data.fechaCotizacion,
        fechaEntrega: data.fechaEntrega,
        montoTotal: Number(data.montoTotal) || 0,
        estado: data.estado,
        observaciones: data.observaciones?.trim() || null,
        activo: Boolean(data.activo)
      };

      if (esEdicion) {
        await actualizarCotizacionCompras(cotizacion.id, datosNormalizados);
      } else {
        await crearCotizacionCompras(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error('Error al guardar cotización de compra:', error);
      // El manejo de errores se realiza en el componente padre
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      'p-invalid': errors[fieldName]
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <TabView>
        {/* Pestaña: Información General */}
        <TabPanel header="Información General">
          <div className="p-grid p-formgrid">
            {/* Empresa */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="empresaId" className="p-d-block">
                Empresa <span className="p-error">*</span>
              </label>
              <Controller
                name="empresaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="empresaId"
                    value={field.value ? Number(field.value) : null}
                    onChange={(e) => field.onChange(e.value)}
                    options={empresas}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione una empresa"
                    className={getFieldClass('empresaId')}
                    filter
                    showClear
                  />
                )}
              />
              {errors.empresaId && (
                <small className="p-error p-d-block">
                  {errors.empresaId.message}
                </small>
              )}
            </div>

            {/* Número */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="numero" className="p-d-block">
                Número de Cotización <span className="p-error">*</span>
              </label>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numero"
                    {...field}
                    placeholder="Ingrese el número de cotización"
                    className={getFieldClass('numero')}
                    maxLength={50}
                  />
                )}
              />
              {errors.numero && (
                <small className="p-error p-d-block">
                  {errors.numero.message}
                </small>
              )}
            </div>

            {/* Tipo de Producto */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="tipoProductoId" className="p-d-block">
                Tipo de Producto <span className="p-error">*</span>
              </label>
              <Controller
                name="tipoProductoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoProductoId"
                    value={field.value ? Number(field.value) : null}
                    onChange={(e) => field.onChange(e.value)}
                    options={tiposProducto}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un tipo de producto"
                    className={getFieldClass('tipoProductoId')}
                    filter
                    showClear
                  />
                )}
              />
              {errors.tipoProductoId && (
                <small className="p-error p-d-block">
                  {errors.tipoProductoId.message}
                </small>
              )}
            </div>

            {/* Tipo Estado Producto */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="tipoEstadoProductoId" className="p-d-block">
                Estado del Producto <span className="p-error">*</span>
              </label>
              <Controller
                name="tipoEstadoProductoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoEstadoProductoId"
                    value={field.value ? Number(field.value) : null}
                    onChange={(e) => field.onChange(e.value)}
                    options={tiposEstadoProducto}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un estado"
                    className={getFieldClass('tipoEstadoProductoId')}
                    filter
                    showClear
                  />
                )}
              />
              {errors.tipoEstadoProductoId && (
                <small className="p-error p-d-block">
                  {errors.tipoEstadoProductoId.message}
                </small>
              )}
            </div>

            {/* Destino Producto */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="destinoProductoId" className="p-d-block">
                Destino del Producto <span className="p-error">*</span>
              </label>
              <Controller
                name="destinoProductoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="destinoProductoId"
                    value={field.value ? Number(field.value) : null}
                    onChange={(e) => field.onChange(e.value)}
                    options={destinosProducto}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un destino"
                    className={getFieldClass('destinoProductoId')}
                    filter
                    showClear
                  />
                )}
              />
              {errors.destinoProductoId && (
                <small className="p-error p-d-block">
                  {errors.destinoProductoId.message}
                </small>
              )}
            </div>

            {/* Estado */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="estado" className="p-d-block">
                Estado de la Cotización
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadosOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un estado"
                    className={getFieldClass('estado')}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error p-d-block">
                  {errors.estado.message}
                </small>
              )}
            </div>
          </div>
        </TabPanel>

        {/* Pestaña: Fechas y Montos */}
        <TabPanel header="Fechas y Montos">
          <div className="p-grid p-formgrid">
            {/* Fecha Cotización */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="fechaCotizacion" className="p-d-block">
                Fecha de Cotización <span className="p-error">*</span>
              </label>
              <Controller
                name="fechaCotizacion"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaCotizacion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione la fecha de cotización"
                    className={getFieldClass('fechaCotizacion')}
                    dateFormat="dd/mm/yy"
                    showIcon
                  />
                )}
              />
              {errors.fechaCotizacion && (
                <small className="p-error p-d-block">
                  {errors.fechaCotizacion.message}
                </small>
              )}
            </div>

            {/* Fecha Entrega */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="fechaEntrega" className="p-d-block">
                Fecha de Entrega <span className="p-error">*</span>
              </label>
              <Controller
                name="fechaEntrega"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEntrega"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione la fecha de entrega"
                    className={getFieldClass('fechaEntrega')}
                    dateFormat="dd/mm/yy"
                    showIcon
                    minDate={new Date()}
                  />
                )}
              />
              {errors.fechaEntrega && (
                <small className="p-error p-d-block">
                  {errors.fechaEntrega.message}
                </small>
              )}
            </div>

            {/* Monto Total */}
            <div className="p-col-12 p-md-6 p-field">
              <label htmlFor="montoTotal" className="p-d-block">
                Monto Total
              </label>
              <Controller
                name="montoTotal"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="montoTotal"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    placeholder="Ingrese el monto total"
                    className={getFieldClass('montoTotal')}
                    mode="currency"
                    currency="PEN"
                    locale="es-ES"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                  />
                )}
              />
              {errors.montoTotal && (
                <small className="p-error p-d-block">
                  {errors.montoTotal.message}
                </small>
              )}
            </div>

            {/* Campo Activo */}
            <div className="p-col-12 p-md-6 p-field">
              <div className="p-field-checkbox">
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                      className={getFieldClass('activo')}
                    />
                  )}
                />
                <label htmlFor="activo" className="p-checkbox-label">
                  Activo
                </label>
              </div>
              {errors.activo && (
                <small className="p-error p-d-block">
                  {errors.activo.message}
                </small>
              )}
            </div>

            {/* Observaciones */}
            <div className="p-col-12 p-field">
              <label htmlFor="observaciones" className="p-d-block">
                Observaciones
              </label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    {...field}
                    placeholder="Ingrese observaciones adicionales"
                    rows={4}
                    className={getFieldClass('observaciones')}
                    maxLength={1000}
                  />
                )}
              />
              {errors.observaciones && (
                <small className="p-error p-d-block">
                  {errors.observaciones.message}
                </small>
              )}
            </div>
          </div>
        </TabPanel>
      </TabView>

      {/* Botones de acción */}
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary p-mr-2"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          type="submit"
          label={esEdicion ? 'Actualizar' : 'Crear'}
          icon={esEdicion ? 'pi pi-check' : 'pi pi-plus'}
          loading={loading}
          disabled={loading}
        />
      </div>
    </form>
  );
};

export default CotizacionCompraForm;
