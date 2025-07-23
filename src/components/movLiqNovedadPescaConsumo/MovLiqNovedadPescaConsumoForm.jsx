// src/components/movLiqNovedadPescaConsumo/MovLiqNovedadPescaConsumoForm.jsx
// Formulario profesional para MovLiqNovedadPescaConsumo con 3 pestañas y validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, campos decimales con 2 decimales, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import { createMovLiqNovedadPescaConsumo, updateMovLiqNovedadPescaConsumo } from '../../api/movLiqNovedadPescaConsumo';
import { getAllLiqNovedadPescaConsumo } from '../../api/liqNovedadPescaConsumo';
import { getAllCentroCosto } from '../../api/centroCosto';
import { getPersonal } from '../../api/personal';

/**
 * Componente MovLiqNovedadPescaConsumoForm
 * Formulario avanzado con 3 pestañas para gestión completa de movimientos de liquidación de novedad
 * Incluye cálculos automáticos, validaciones y normalización de IDs según patrón ERP Megui
 */
const MovLiqNovedadPescaConsumoForm = ({ movimiento, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      liqNovedadPescaConsumoId: null,
      numeroMovimiento: '',
      fechaMovimiento: new Date(),
      tipoMovimiento: 'INGRESO',
      concepto: '',
      descripcion: '',
      monto: 0.00,
      montoOriginal: 0.00,
      centroCostoId: null,
      responsableMovimiento: null,
      estado: 'REGISTRADO',
      prioridad: 'MEDIA',
      fechaVencimiento: null,
      fechaValidacion: null,
      tipoDocumento: '',
      numeroDocumento: '',
      serieDocumento: '',
      observaciones: '',
      requiereAprobacion: false,
      aprobadoPor: null,
      fechaAprobacion: null,
      motivoRechazo: '',
      urlDocumento: ''
    }
  });

  const [liquidaciones, setLiquidaciones] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const toast = useRef(null);

  // Opciones para dropdowns
  const tiposMovimiento = [
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Egreso', value: 'EGRESO' },
    { label: 'Ajuste', value: 'AJUSTE' },
    { label: 'Compensación', value: 'COMPENSACION' },
    { label: 'Penalización', value: 'PENALIZACION' }
  ];

  const estados = [
    { label: 'Registrado', value: 'REGISTRADO' },
    { label: 'Validado', value: 'VALIDADO' },
    { label: 'Anulado', value: 'ANULADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Procesado', value: 'PROCESADO' }
  ];

  const prioridades = [
    { label: 'Baja', value: 'BAJA' },
    { label: 'Media', value: 'MEDIA' },
    { label: 'Alta', value: 'ALTA' },
    { label: 'Urgente', value: 'URGENTE' }
  ];

  const tiposDocumento = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Nota de Crédito', value: 'NOTA_CREDITO' },
    { label: 'Nota de Débito', value: 'NOTA_DEBITO' },
    { label: 'Recibo', value: 'RECIBO' },
    { label: 'Comprobante', value: 'COMPROBANTE' },
    { label: 'Orden de Pago', value: 'ORDEN_PAGO' },
    { label: 'Otro', value: 'OTRO' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Cargar datos del movimiento para edición
      reset({
        ...movimiento,
        liqNovedadPescaConsumoId: movimiento.liqNovedadPescaConsumoId ? Number(movimiento.liqNovedadPescaConsumoId) : null,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        responsableMovimiento: movimiento.responsableMovimiento ? Number(movimiento.responsableMovimiento) : null,
        aprobadoPor: movimiento.aprobadoPor ? Number(movimiento.aprobadoPor) : null,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        fechaVencimiento: movimiento.fechaVencimiento ? new Date(movimiento.fechaVencimiento) : null,
        fechaValidacion: movimiento.fechaValidacion ? new Date(movimiento.fechaValidacion) : null,
        fechaAprobacion: movimiento.fechaAprobacion ? new Date(movimiento.fechaAprobacion) : null,
        monto: Number(movimiento.monto || 0),
        montoOriginal: Number(movimiento.montoOriginal || 0),
        requiereAprobacion: Boolean(movimiento.requiereAprobacion)
      });
    }
  }, [movimiento, reset]);

  const cargarDatos = async () => {
    try {
      const [liquidacionesData, centrosCostoData, personalData] = await Promise.all([
        getAllLiqNovedadPescaConsumo(),
        getAllCentroCosto(),
        getPersonal()
      ]);

      // Normalizar IDs a números según regla ERP Megui
      setLiquidaciones(liquidacionesData.map(l => ({ 
        ...l, 
        id: Number(l.id),
        label: `${l.numeroLiquidacion} - ${l.novedadPescaConsumo?.numeroNovedad || 'N/A'}`,
        value: Number(l.id)
      })));

      setCentrosCosto(centrosCostoData.map(cc => ({ 
        ...cc, 
        id: Number(cc.id),
        label: `${cc.codigo} - ${cc.nombre}`,
        value: Number(cc.id)
      })));

      setPersonal(personalData.map(p => ({ 
        ...p, 
        id: Number(p.id),
        label: `${p.nombres} ${p.apellidos}`,
        value: Number(p.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        liqNovedadPescaConsumoId: Number(data.liqNovedadPescaConsumoId),
        numeroMovimiento: data.numeroMovimiento.trim(),
        fechaMovimiento: data.fechaMovimiento,
        tipoMovimiento: data.tipoMovimiento,
        concepto: data.concepto.trim(),
        descripcion: data.descripcion?.trim() || null,
        monto: Number(data.monto),
        montoOriginal: Number(data.montoOriginal || data.monto),
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        responsableMovimiento: data.responsableMovimiento ? Number(data.responsableMovimiento) : null,
        estado: data.estado || 'REGISTRADO',
        prioridad: data.prioridad || 'MEDIA',
        fechaVencimiento: data.fechaVencimiento || null,
        fechaValidacion: data.fechaValidacion || null,
        tipoDocumento: data.tipoDocumento?.trim() || null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        serieDocumento: data.serieDocumento?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        requiereAprobacion: Boolean(data.requiereAprobacion),
        aprobadoPor: data.aprobadoPor ? Number(data.aprobadoPor) : null,
        fechaAprobacion: data.fechaAprobacion || null,
        motivoRechazo: data.motivoRechazo?.trim() || null,
        urlDocumento: data.urlDocumento?.trim() || null
      };

      console.log('Payload MovLiqNovedadPescaConsumo:', payload);

      if (movimiento?.id) {
        await updateMovLiqNovedadPescaConsumo(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de liquidación de novedad actualizado correctamente'
        });
      } else {
        await createMovLiqNovedadPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de liquidación de novedad creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el movimiento de liquidación de novedad'
      });
    } finally {
      setLoading(false);
    }
  };

  // Observar cambios en el monto para actualizar monto original automáticamente
  const montoActual = watch('monto');
  const montoOriginal = watch('montoOriginal');

  useEffect(() => {
    if (montoActual && !montoOriginal && !movimiento?.id) {
      setValue('montoOriginal', montoActual);
    }
  }, [montoActual, montoOriginal, setValue, movimiento?.id]);

  return (
    <div className="mov-liq-novedad-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="liqNovedadPescaConsumoId" className="block text-900 font-medium mb-2">
                  Liquidación de Novedad *
                </label>
                <Controller
                  name="liqNovedadPescaConsumoId"
                  control={control}
                  rules={{ required: 'La liquidación de novedad es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="liqNovedadPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={liquidaciones}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar liquidación de novedad"
                      className={`w-full ${errors.liqNovedadPescaConsumoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.liqNovedadPescaConsumoId && (
                  <small className="p-error">{errors.liqNovedadPescaConsumoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="numeroMovimiento" className="block text-900 font-medium mb-2">
                  Número de Movimiento *
                </label>
                <Controller
                  name="numeroMovimiento"
                  control={control}
                  rules={{ required: 'El número de movimiento es obligatorio' }}
                  render={({ field }) => (
                    <InputText
                      id="numeroMovimiento"
                      {...field}
                      placeholder="Ej: MOV-LIQNOV-2024-001"
                      className={`w-full ${errors.numeroMovimiento ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.numeroMovimiento && (
                  <small className="p-error">{errors.numeroMovimiento.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
                  Fecha de Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: 'La fecha de movimiento es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className={`w-full ${errors.fechaMovimiento ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <small className="p-error">{errors.fechaMovimiento.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="tipoMovimiento" className="block text-900 font-medium mb-2">
                  Tipo de Movimiento *
                </label>
                <Controller
                  name="tipoMovimiento"
                  control={control}
                  rules={{ required: 'El tipo de movimiento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposMovimiento}
                      placeholder="Seleccionar tipo"
                      className={`w-full ${errors.tipoMovimiento ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.tipoMovimiento && (
                  <small className="p-error">{errors.tipoMovimiento.message}</small>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="concepto" className="block text-900 font-medium mb-2">
                  Concepto *
                </label>
                <Controller
                  name="concepto"
                  control={control}
                  rules={{ required: 'El concepto es obligatorio' }}
                  render={({ field }) => (
                    <InputText
                      id="concepto"
                      {...field}
                      placeholder="Descripción del concepto del movimiento"
                      className={`w-full ${errors.concepto ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.concepto && (
                  <small className="p-error">{errors.concepto.message}</small>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción Detallada
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      placeholder="Descripción detallada del movimiento"
                      className="w-full"
                      rows={3}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="estado" className="block text-900 font-medium mb-2">
                  Estado
                </label>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estado"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={estados}
                      placeholder="Seleccionar estado"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="prioridad" className="block text-900 font-medium mb-2">
                  Prioridad
                </label>
                <Controller
                  name="prioridad"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="prioridad"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={prioridades}
                      placeholder="Seleccionar prioridad"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
                  Centro de Costo
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={centrosCosto}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar centro de costo"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Montos y Fechas */}
          <TabPanel header="Montos y Fechas">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="monto" className="block text-900 font-medium mb-2">
                  Monto *
                </label>
                <Controller
                  name="monto"
                  control={control}
                  rules={{ 
                    required: 'El monto es obligatorio',
                    min: { value: 0, message: 'El monto no puede ser negativo' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="monto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      className={`w-full ${errors.monto ? 'p-invalid' : ''}`}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                    />
                  )}
                />
                {errors.monto && (
                  <small className="p-error">{errors.monto.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="montoOriginal" className="block text-900 font-medium mb-2">
                  Monto Original
                </label>
                <Controller
                  name="montoOriginal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="montoOriginal"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      className="w-full"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                    />
                  )}
                />
                <small className="text-600">Se asigna automáticamente si está vacío</small>
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaVencimiento" className="block text-900 font-medium mb-2">
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
                      placeholder="Seleccionar fecha"
                      className="w-full"
                      dateFormat="dd/mm/yy"
                      showIcon
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaValidacion" className="block text-900 font-medium mb-2">
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
                      placeholder="Seleccionar fecha"
                      className="w-full"
                      dateFormat="dd/mm/yy"
                      showIcon
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12">
                <label htmlFor="responsableMovimiento" className="block text-900 font-medium mb-2">
                  Responsable del Movimiento
                </label>
                <Controller
                  name="responsableMovimiento"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableMovimiento"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Documentos y Aprobación */}
          <TabPanel header="Documentos y Aprobación">
            <div className="grid">
              <div className="col-12 md:col-4">
                <label htmlFor="tipoDocumento" className="block text-900 font-medium mb-2">
                  Tipo de Documento
                </label>
                <Controller
                  name="tipoDocumento"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoDocumento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposDocumento}
                      placeholder="Seleccionar tipo"
                      className="w-full"
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="numeroDocumento" className="block text-900 font-medium mb-2">
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
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="serieDocumento" className="block text-900 font-medium mb-2">
                  Serie del Documento
                </label>
                <Controller
                  name="serieDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="serieDocumento"
                      {...field}
                      placeholder="Serie del documento"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12">
                <label htmlFor="urlDocumento" className="block text-900 font-medium mb-2">
                  URL del Documento
                </label>
                <Controller
                  name="urlDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlDocumento"
                      {...field}
                      placeholder="https://ejemplo.com/documento.pdf"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12">
                <div className="field-checkbox">
                  <Controller
                    name="requiereAprobacion"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="requiereAprobacion"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                    )}
                  />
                  <label htmlFor="requiereAprobacion" className="ml-2">
                    Requiere Aprobación
                  </label>
                </div>
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="aprobadoPor" className="block text-900 font-medium mb-2">
                  Aprobado Por
                </label>
                <Controller
                  name="aprobadoPor"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="aprobadoPor"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar aprobador"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaAprobacion" className="block text-900 font-medium mb-2">
                  Fecha de Aprobación
                </label>
                <Controller
                  name="fechaAprobacion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaAprobacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className="w-full"
                      dateFormat="dd/mm/yy"
                      showIcon
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12">
                <label htmlFor="motivoRechazo" className="block text-900 font-medium mb-2">
                  Motivo de Rechazo
                </label>
                <Controller
                  name="motivoRechazo"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="motivoRechazo"
                      {...field}
                      placeholder="Motivo del rechazo (si aplica)"
                      className="w-full"
                      rows={2}
                    />
                  )}
                />
              </div>

              <div className="col-12">
                <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
                  Observaciones
                </label>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="observaciones"
                      {...field}
                      placeholder="Observaciones adicionales"
                      className="w-full"
                      rows={3}
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>
        </TabView>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={movimiento?.id ? 'Actualizar' : 'Crear'}
            icon={movimiento?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default MovLiqNovedadPescaConsumoForm;
