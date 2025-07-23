// src/components/liqNovedadPescaConsumo/LiqNovedadPescaConsumoForm.jsx
// Formulario profesional para LiqNovedadPescaConsumo. Cumple regla transversal ERP Megui:
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
import { createLiqNovedadPescaConsumo, updateLiqNovedadPescaConsumo } from '../../api/liqNovedadPescaConsumo';
import { getAllNovedadPescaConsumo } from '../../api/novedadPescaConsumo';
import { getEmpresas } from '../../api/empresa';
import { getPersonal } from '../../api/personal';

/**
 * Componente LiqNovedadPescaConsumoForm
 * Formulario profesional para gestión de liquidaciones de novedades de pesca de consumo
 * Organizado en pestañas para mejor UX en formularios complejos
 */
const LiqNovedadPescaConsumoForm = ({ liquidacion, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [novedades, setNovedades] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const toast = useRef(null);

  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      novedadPescaConsumoId: null,
      empresaId: null,
      numeroLiquidacion: '',
      fechaLiquidacion: null,
      fechaInicio: null,
      fechaFin: null,
      tipoNovedad: 'OPERACIONAL',
      impactoEconomico: 'BAJO',
      responsableLiquidacion: null,
      verificadoPor: null,
      fechaVerificacion: null,
      estado: 'BORRADOR',
      totalIngresos: 0.00,
      totalEgresos: 0.00,
      saldoFinal: 0.00,
      numeroActaConformidad: '',
      fechaActaConformidad: null,
      urlPdfLiquidacion: '',
      urlExcelDetalle: '',
      observaciones: ''
    }
  });

  // Observar cambios en ingresos y egresos para calcular saldo automáticamente
  const totalIngresos = watch('totalIngresos');
  const totalEgresos = watch('totalEgresos');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (liquidacion) {
      reset({
        novedadPescaConsumoId: liquidacion.novedadPescaConsumoId,
        empresaId: liquidacion.empresaId,
        numeroLiquidacion: liquidacion.numeroLiquidacion || '',
        fechaLiquidacion: liquidacion.fechaLiquidacion ? new Date(liquidacion.fechaLiquidacion) : null,
        fechaInicio: liquidacion.fechaInicio ? new Date(liquidacion.fechaInicio) : null,
        fechaFin: liquidacion.fechaFin ? new Date(liquidacion.fechaFin) : null,
        tipoNovedad: liquidacion.tipoNovedad || 'OPERACIONAL',
        impactoEconomico: liquidacion.impactoEconomico || 'BAJO',
        responsableLiquidacion: liquidacion.responsableLiquidacion,
        verificadoPor: liquidacion.verificadoPor,
        fechaVerificacion: liquidacion.fechaVerificacion ? new Date(liquidacion.fechaVerificacion) : null,
        estado: liquidacion.estado || 'BORRADOR',
        totalIngresos: liquidacion.totalIngresos || 0.00,
        totalEgresos: liquidacion.totalEgresos || 0.00,
        saldoFinal: liquidacion.saldoFinal || 0.00,
        numeroActaConformidad: liquidacion.numeroActaConformidad || '',
        fechaActaConformidad: liquidacion.fechaActaConformidad ? new Date(liquidacion.fechaActaConformidad) : null,
        urlPdfLiquidacion: liquidacion.urlPdfLiquidacion || '',
        urlExcelDetalle: liquidacion.urlExcelDetalle || '',
        observaciones: liquidacion.observaciones || ''
      });
    }
  }, [liquidacion, reset]);

  // Calcular saldo automáticamente cuando cambien ingresos o egresos
  useEffect(() => {
    const ingresos = totalIngresos || 0;
    const egresos = totalEgresos || 0;
    const saldo = ingresos - egresos;
    
    // Solo actualizar si hay cambio significativo
    if (Math.abs(saldo - (watch('saldoFinal') || 0)) > 0.01) {
      reset(prevData => ({
        ...prevData,
        saldoFinal: saldo
      }));
    }
  }, [totalIngresos, totalEgresos, reset, watch]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [novedadesData, empresasData, personalData] = await Promise.all([
        getAllNovedadPescaConsumo(),
        getEmpresas(),
        getPersonal()
      ]);
      
      // Normalizar IDs a numéricos según regla profesional ERP Megui
      setNovedades(novedadesData.map(n => ({ ...n, id: Number(n.id) })));
      setEmpresas(empresasData.map(e => ({ ...e, id: Number(e.id) })));
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
        novedadPescaConsumoId: data.novedadPescaConsumoId,
        empresaId: data.empresaId,
        numeroLiquidacion: data.numeroLiquidacion?.trim(),
        fechaLiquidacion: data.fechaLiquidacion,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        tipoNovedad: data.tipoNovedad,
        impactoEconomico: data.impactoEconomico,
        responsableLiquidacion: data.responsableLiquidacion || null,
        verificadoPor: data.verificadoPor || null,
        fechaVerificacion: data.fechaVerificacion || null,
        estado: data.estado,
        totalIngresos: data.totalIngresos || 0,
        totalEgresos: data.totalEgresos || 0,
        saldoFinal: data.saldoFinal || 0,
        numeroActaConformidad: data.numeroActaConformidad?.trim() || null,
        fechaActaConformidad: data.fechaActaConformidad || null,
        urlPdfLiquidacion: data.urlPdfLiquidacion?.trim() || null,
        urlExcelDetalle: data.urlExcelDetalle?.trim() || null,
        observaciones: data.observaciones?.trim() || null
      };

      // Log para depuración según regla profesional ERP Megui
      console.log('Payload LiqNovedadPescaConsumo:', payload);

      if (liquidacion) {
        await updateLiqNovedadPescaConsumo(liquidacion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación actualizada correctamente'
        });
      } else {
        await createLiqNovedadPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación creada correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar liquidación:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar la liquidación'
      });
    } finally {
      setLoading(false);
    }
  };

  // Opciones para tipos de novedad
  const tiposNovedadOptions = [
    { label: 'Operacional', value: 'OPERACIONAL' },
    { label: 'Técnica', value: 'TECNICA' },
    { label: 'Administrativa', value: 'ADMINISTRATIVA' },
    { label: 'Emergencia', value: 'EMERGENCIA' }
  ];

  // Opciones para impacto económico
  const impactosEconomicoOptions = [
    { label: 'Bajo', value: 'BAJO' },
    { label: 'Medio', value: 'MEDIO' },
    { label: 'Alto', value: 'ALTO' },
    { label: 'Crítico', value: 'CRITICO' }
  ];

  // Opciones para estados
  const estadosOptions = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada', value: 'APROBADA' },
    { label: 'Rechazada', value: 'RECHAZADA' },
    { label: 'Anulada', value: 'ANULADA' }
  ];

  return (
    <div className="liq-novedad-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="novedadPescaConsumoId" className="block text-900 font-medium mb-2">
                  Novedad de Pesca *
                </label>
                <Controller
                  name="novedadPescaConsumoId"
                  control={control}
                  rules={{ required: 'La novedad de pesca es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="novedadPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={novedades}
                      optionLabel="numeroNovedad"
                      optionValue="id"
                      placeholder="Seleccionar novedad"
                      className={`w-full ${errors.novedadPescaConsumoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                      emptyMessage="No hay novedades disponibles"
                    />
                  )}
                />
                {errors.novedadPescaConsumoId && (
                  <small className="p-error">{errors.novedadPescaConsumoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
                  Empresa *
                </label>
                <Controller
                  name="empresaId"
                  control={control}
                  rules={{ required: 'La empresa es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="empresaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={empresas}
                      optionLabel="razonSocial"
                      optionValue="id"
                      placeholder="Seleccionar empresa"
                      className={`w-full ${errors.empresaId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                      emptyMessage="No hay empresas disponibles"
                    />
                  )}
                />
                {errors.empresaId && (
                  <small className="p-error">{errors.empresaId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="numeroLiquidacion" className="block text-900 font-medium mb-2">
                  Número de Liquidación *
                </label>
                <Controller
                  name="numeroLiquidacion"
                  control={control}
                  rules={{ 
                    required: 'El número de liquidación es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="numeroLiquidacion"
                      {...field}
                      placeholder="Ej: LIQNOV-2024-001"
                      className={`w-full ${errors.numeroLiquidacion ? 'p-invalid' : ''}`}
                      maxLength={50}
                    />
                  )}
                />
                {errors.numeroLiquidacion && (
                  <small className="p-error">{errors.numeroLiquidacion.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
                  Fecha de Liquidación *
                </label>
                <Controller
                  name="fechaLiquidacion"
                  control={control}
                  rules={{ required: 'La fecha de liquidación es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaLiquidacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className={`w-full ${errors.fechaLiquidacion ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                      maxDate={new Date()}
                    />
                  )}
                />
                {errors.fechaLiquidacion && (
                  <small className="p-error">{errors.fechaLiquidacion.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaInicio" className="block text-900 font-medium mb-2">
                  Fecha de Inicio *
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  rules={{ required: 'La fecha de inicio es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaInicio"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className={`w-full ${errors.fechaInicio ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                    />
                  )}
                />
                {errors.fechaInicio && (
                  <small className="p-error">{errors.fechaInicio.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaFin" className="block text-900 font-medium mb-2">
                  Fecha de Fin *
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  rules={{ required: 'La fecha de fin es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaFin"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className={`w-full ${errors.fechaFin ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                    />
                  )}
                />
                {errors.fechaFin && (
                  <small className="p-error">{errors.fechaFin.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="tipoNovedad" className="block text-900 font-medium mb-2">
                  Tipo de Novedad
                </label>
                <Controller
                  name="tipoNovedad"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoNovedad"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposNovedadOptions}
                      placeholder="Seleccionar tipo"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="impactoEconomico" className="block text-900 font-medium mb-2">
                  Impacto Económico
                </label>
                <Controller
                  name="impactoEconomico"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="impactoEconomico"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={impactosEconomicoOptions}
                      placeholder="Seleccionar impacto"
                      className="w-full"
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

          {/* Pestaña 2: Responsables y Verificación */}
          <TabPanel header="Responsables y Verificación">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="responsableLiquidacion" className="block text-900 font-medium mb-2">
                  Responsable de Liquidación
                </label>
                <Controller
                  name="responsableLiquidacion"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableLiquidacion"
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
                <label htmlFor="verificadoPor" className="block text-900 font-medium mb-2">
                  Verificado Por
                </label>
                <Controller
                  name="verificadoPor"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="verificadoPor"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                      optionValue="id"
                      placeholder="Seleccionar verificador"
                      className="w-full"
                      filter
                      showClear
                      emptyMessage="No hay personal disponible"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaVerificacion" className="block text-900 font-medium mb-2">
                  Fecha de Verificación
                </label>
                <Controller
                  name="fechaVerificacion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaVerificacion"
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
                <label htmlFor="numeroActaConformidad" className="block text-900 font-medium mb-2">
                  Número de Acta de Conformidad
                </label>
                <Controller
                  name="numeroActaConformidad"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroActaConformidad"
                      {...field}
                      placeholder="Ej: ACTA-NOV-2024-001"
                      className="w-full"
                      maxLength={50}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaActaConformidad" className="block text-900 font-medium mb-2">
                  Fecha de Acta de Conformidad
                </label>
                <Controller
                  name="fechaActaConformidad"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaActaConformidad"
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
            </div>
          </TabPanel>

          {/* Pestaña 3: Montos y Documentos */}
          <TabPanel header="Montos y Documentos">
            <div className="grid">
              <div className="col-12 md:col-4">
                <label htmlFor="totalIngresos" className="block text-900 font-medium mb-2">
                  Total Ingresos (S/)
                </label>
                <Controller
                  name="totalIngresos"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="totalIngresos"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      className="w-full"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="totalEgresos" className="block text-900 font-medium mb-2">
                  Total Egresos (S/)
                </label>
                <Controller
                  name="totalEgresos"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="totalEgresos"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      className="w-full"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="saldoFinal" className="block text-900 font-medium mb-2">
                  Saldo Final (S/)
                </label>
                <Controller
                  name="saldoFinal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="saldoFinal"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      className="w-full"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      disabled
                    />
                  )}
                />
                <small className="text-gray-600">Se calcula automáticamente: Ingresos - Egresos</small>
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="urlPdfLiquidacion" className="block text-900 font-medium mb-2">
                  URL PDF Liquidación
                </label>
                <Controller
                  name="urlPdfLiquidacion"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlPdfLiquidacion"
                      {...field}
                      placeholder="https://..."
                      className="w-full"
                      maxLength={500}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="urlExcelDetalle" className="block text-900 font-medium mb-2">
                  URL Excel Detalle
                </label>
                <Controller
                  name="urlExcelDetalle"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlExcelDetalle"
                      {...field}
                      placeholder="https://..."
                      className="w-full"
                      maxLength={500}
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
                      placeholder="Observaciones adicionales sobre la novedad y su liquidación..."
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
            label={liquidacion ? 'Actualizar' : 'Crear'}
            icon="pi pi-save"
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default LiqNovedadPescaConsumoForm;
