// src/components/movLiquidacionFaenaConsumo/MovLiquidacionFaenaConsumoForm.jsx
// Formulario profesional para MovLiquidacionFaenaConsumo. Cumple regla transversal ERP Megui:
// - Normalización de IDs numéricos en combos, validaciones frontend, documentación en español
// - Campos decimales con exactamente 2 decimales, autenticación JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { createMovLiquidacionFaenaConsumo, updateMovLiquidacionFaenaConsumo } from '../../api/movLiquidacionFaenaConsumo';
import { getAllLiquidacionFaenaConsumo } from '../../api/liquidacionFaenaConsumo';
import { getCentrosCosto } from '../../api/centroCosto';
import { getPersonal } from '../../api/personal';

/**
 * Componente MovLiquidacionFaenaConsumoForm
 * Formulario profesional para gestión de movimientos de liquidaciones de faenas de consumo
 * Organizado en pestañas para mejor UX en formularios complejos
 */
const MovLiquidacionFaenaConsumoForm = ({ movimiento, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [personal, setPersonal] = useState([]);
  const toast = useRef(null);

  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      liquidacionFaenaConsumoId: null,
      numeroMovimiento: '',
      fechaMovimiento: null,
      tipoMovimiento: 'INGRESO',
      concepto: '',
      descripcion: '',
      monto: 0.00,
      montoOriginal: null,
      centroCostoId: null,
      responsableMovimiento: null,
      fechaVencimiento: null,
      estado: 'REGISTRADO',
      tipoDocumento: '',
      serieDocumento: '',
      numeroDocumento: '',
      fechaDocumento: null,
      validadoPor: null,
      fechaValidacion: null,
      observaciones: ''
    }
  });

  // Observar tipo de movimiento para ajustar el signo del monto
  const tipoMovimiento = watch('tipoMovimiento');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (movimiento) {
      reset({
        liquidacionFaenaConsumoId: movimiento.liquidacionFaenaConsumoId,
        numeroMovimiento: movimiento.numeroMovimiento || '',
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : null,
        tipoMovimiento: movimiento.tipoMovimiento || 'INGRESO',
        concepto: movimiento.concepto || '',
        descripcion: movimiento.descripcion || '',
        monto: movimiento.monto || 0.00,
        montoOriginal: movimiento.montoOriginal || null,
        centroCostoId: movimiento.centroCostoId,
        responsableMovimiento: movimiento.responsableMovimiento,
        fechaVencimiento: movimiento.fechaVencimiento ? new Date(movimiento.fechaVencimiento) : null,
        estado: movimiento.estado || 'REGISTRADO',
        tipoDocumento: movimiento.tipoDocumento || '',
        serieDocumento: movimiento.serieDocumento || '',
        numeroDocumento: movimiento.numeroDocumento || '',
        fechaDocumento: movimiento.fechaDocumento ? new Date(movimiento.fechaDocumento) : null,
        validadoPor: movimiento.validadoPor,
        fechaValidacion: movimiento.fechaValidacion ? new Date(movimiento.fechaValidacion) : null,
        observaciones: movimiento.observaciones || ''
      });
    }
  }, [movimiento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [liquidacionesData, centrosCostoData, personalData] = await Promise.all([
        getAllLiquidacionFaenaConsumo(),
        getCentrosCosto(),
        getPersonal()
      ]);
      
      // Normalizar IDs a numéricos según regla profesional ERP Megui
      setLiquidaciones(liquidacionesData.map(l => ({ ...l, id: Number(l.id) })));
      setCentrosCosto(centrosCostoData.map(c => ({ ...c, id: Number(c.id) })));
      setPersonal(personalData.map(p => ({ ...p, id: Number(p.id) })));
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con validaciones
      const payload = {
        liquidacionFaenaConsumoId: data.liquidacionFaenaConsumoId,
        numeroMovimiento: data.numeroMovimiento?.trim(),
        fechaMovimiento: data.fechaMovimiento,
        tipoMovimiento: data.tipoMovimiento,
        concepto: data.concepto?.trim(),
        descripcion: data.descripcion?.trim() || null,
        monto: data.monto || 0,
        montoOriginal: data.montoOriginal || null,
        centroCostoId: data.centroCostoId || null,
        responsableMovimiento: data.responsableMovimiento || null,
        fechaVencimiento: data.fechaVencimiento || null,
        estado: data.estado,
        tipoDocumento: data.tipoDocumento?.trim() || null,
        serieDocumento: data.serieDocumento?.trim() || null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaDocumento: data.fechaDocumento || null,
        validadoPor: data.validadoPor || null,
        fechaValidacion: data.fechaValidacion || null,
        observaciones: data.observaciones?.trim() || null
      };
      if (movimiento) {
        await updateMovLiquidacionFaenaConsumo(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento actualizado correctamente'
        });
      } else {
        await createMovLiquidacionFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el movimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  // Opciones para tipos de movimiento
  const tiposMovimientoOptions = [
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Egreso', value: 'EGRESO' },
    { label: 'Ajuste', value: 'AJUSTE' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' }
  ];

  // Opciones para estados
  const estadosOptions = [
    { label: 'Registrado', value: 'REGISTRADO' },
    { label: 'Validado', value: 'VALIDADO' },
    { label: 'Anulado', value: 'ANULADO' },
    { label: 'Pendiente', value: 'PENDIENTE' }
  ];

  // Opciones para tipos de documento
  const tiposDocumentoOptions = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Recibo', value: 'RECIBO' },
    { label: 'Nota de Crédito', value: 'NOTA_CREDITO' },
    { label: 'Nota de Débito', value: 'NOTA_DEBITO' },
    { label: 'Comprobante Interno', value: 'COMPROBANTE_INTERNO' }
  ];

  return (
    <div className="mov-liquidacion-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="liquidacionFaenaConsumoId" className="block text-900 font-medium mb-2">
                  Liquidación de Faena *
                </label>
                <Controller
                  name="liquidacionFaenaConsumoId"
                  control={control}
                  rules={{ required: 'La liquidación de faena es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="liquidacionFaenaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={liquidaciones}
                      optionLabel="numeroLiquidacion"
                      optionValue="id"
                      placeholder="Seleccionar liquidación"
                      className={`w-full ${errors.liquidacionFaenaConsumoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                      emptyMessage="No hay liquidaciones disponibles"
                    />
                  )}
                />
                {errors.liquidacionFaenaConsumoId && (
                  <small className="p-error">{errors.liquidacionFaenaConsumoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="numeroMovimiento" className="block text-900 font-medium mb-2">
                  Número de Movimiento *
                </label>
                <Controller
                  name="numeroMovimiento"
                  control={control}
                  rules={{ 
                    required: 'El número de movimiento es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="numeroMovimiento"
                      {...field}
                      placeholder="Ej: MOV-2024-001"
                      className={`w-full ${errors.numeroMovimiento ? 'p-invalid' : ''}`}
                      maxLength={50}
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
                      maxDate={new Date()}
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
                      options={tiposMovimientoOptions}
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
                  rules={{ 
                    required: 'El concepto es obligatorio',
                    minLength: { value: 5, message: 'Mínimo 5 caracteres' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="concepto"
                      {...field}
                      placeholder="Ej: Venta de pescado, Combustible, Mantenimiento..."
                      className={`w-full ${errors.concepto ? 'p-invalid' : ''}`}
                      maxLength={200}
                    />
                  )}
                />
                {errors.concepto && (
                  <small className="p-error">{errors.concepto.message}</small>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      placeholder="Descripción detallada del movimiento..."
                      className="w-full"
                      rows={3}
                      maxLength={500}
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Montos y Centro de Costo */}
          <TabPanel header="Montos y Centro de Costo">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="monto" className="block text-900 font-medium mb-2">
                  Monto (S/) *
                </label>
                <Controller
                  name="monto"
                  control={control}
                  rules={{ 
                    required: 'El monto es obligatorio',
                    validate: value => value !== 0 || 'El monto debe ser diferente de cero'
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
                <small className="text-gray-600">
                  {tipoMovimiento === 'EGRESO' ? 'Monto negativo para egresos' : 'Monto positivo para ingresos'}
                </small>
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="montoOriginal" className="block text-900 font-medium mb-2">
                  Monto Original (S/)
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
                <small className="text-gray-600">Para casos de ajustes o correcciones</small>
              </div>

              <div className="col-12 md:col-6">
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
                      optionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                      optionValue="id"
                      placeholder="Seleccionar centro de costo"
                      className="w-full"
                      filter
                      showClear
                      emptyMessage="No hay centros de costo disponibles"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
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
                      optionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                      optionValue="id"
                      placeholder="Seleccionar responsable"
                      className="w-full"
                      filter
                      showClear
                      emptyMessage="No hay personal disponible"
                    />
                  )}
                />
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
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
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
                      options={estadosOptions}
                      placeholder="Seleccionar estado"
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Documentos y Validación */}
          <TabPanel header="Documentos y Validación">
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
                      options={tiposDocumentoOptions}
                      placeholder="Seleccionar tipo"
                      className="w-full"
                      showClear
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
                      placeholder="Ej: F001, B001"
                      className="w-full"
                      maxLength={10}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="numeroDocumento" className="block text-900 font-medium mb-2">
                  Número del Documento
                </label>
                <Controller
                  name="numeroDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroDocumento"
                      {...field}
                      placeholder="Ej: 00000123"
                      className="w-full"
                      maxLength={20}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaDocumento" className="block text-900 font-medium mb-2">
                  Fecha del Documento
                </label>
                <Controller
                  name="fechaDocumento"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaDocumento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className="w-full"
                      dateFormat="dd/mm/yy"
                      showIcon
                      maxDate={new Date()}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="validadoPor" className="block text-900 font-medium mb-2">
                  Validado Por
                </label>
                <Controller
                  name="validadoPor"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="validadoPor"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                      optionValue="id"
                      placeholder="Seleccionar validador"
                      className="w-full"
                      filter
                      showClear
                      emptyMessage="No hay personal disponible"
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
                      maxDate={new Date()}
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
                      placeholder="Observaciones adicionales..."
                      className="w-full"
                      rows={4}
                      maxLength={1000}
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
            label={movimiento ? 'Actualizar' : 'Crear'}
            icon="pi pi-save"
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default MovLiquidacionFaenaConsumoForm;
