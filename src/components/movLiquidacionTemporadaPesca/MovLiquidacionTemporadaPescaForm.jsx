// src/components/movLiquidacionTemporadaPesca/MovLiquidacionTemporadaPescaForm.jsx
// Formulario profesional para MovLiquidacionTemporadaPesca. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { crearMovLiquidacionTemporadaPesca, actualizarMovLiquidacionTemporadaPesca } from '../../api/movLiquidacionTemporadaPesca';

/**
 * Formulario para gestión de MovLiquidacionTemporadaPesca
 * Maneja creación y edición con validaciones y combos normalizados
 */
const MovLiquidacionTemporadaPescaForm = ({ movimiento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        liquidacionTemporadaId: movimiento.liquidacionTemporadaId ? Number(movimiento.liquidacionTemporadaId) : null,
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        monto: movimiento.monto ? Number(movimiento.monto) : 0,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : null
      });
    } else {
      // Reset para nuevo registro
      reset({
        liquidacionTemporadaId: null,
        tipoMovimientoId: null,
        monto: 0,
        centroCostoId: null,
        fechaMovimiento: new Date()
      });
    }
  }, [movimiento, reset, liquidaciones, tiposMovimiento, centrosCosto]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // const [liquidacionesData, tiposMovimientoData, centrosCostoData] = await Promise.all([
      //   getAllLiquidacionTemporadaPesca(),
      //   getAllTipoMovimiento(),
      //   getAllCentroCosto()
      // ]);
      
      // Datos de ejemplo mientras se implementan las APIs
      setLiquidaciones([
        { id: 1, descripcion: 'Liquidación Temporada 2024-1' },
        { id: 2, descripcion: 'Liquidación Temporada 2024-2' }
      ]);
      
      setTiposMovimiento([
        { id: 1, nombre: 'Ingreso' },
        { id: 2, nombre: 'Egreso' },
        { id: 3, nombre: 'Transferencia' }
      ]);
      
      setCentrosCosto([
        { id: 1, nombre: 'Centro Costo 1' },
        { id: 2, nombre: 'Centro Costo 2' },
        { id: 3, nombre: 'Centro Costo 3' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        liquidacionTemporadaId: Number(data.liquidacionTemporadaId),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        monto: Number(data.monto),
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        fechaMovimiento: data.fechaMovimiento
      };

      console.log('Payload MovLiquidacionTemporadaPesca:', payload); // Log para depuración

      if (movimiento?.id) {
        await actualizarMovLiquidacionTemporadaPesca(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento actualizado correctamente'
        });
      } else {
        await crearMovLiquidacionTemporadaPesca(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el movimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mov-liquidacion-temporada-pesca-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Liquidación de Temporada */}
          <div className="col-12 md:col-6">
            <label htmlFor="liquidacionTemporadaId" className="block text-900 font-medium mb-2">
              Liquidación de Temporada *
            </label>
            <Controller
              name="liquidacionTemporadaId"
              control={control}
              rules={{ required: 'La liquidación de temporada es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="liquidacionTemporadaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={liquidaciones.map(l => ({ ...l, id: Number(l.id) }))}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione una liquidación"
                  className={errors.liquidacionTemporadaId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.liquidacionTemporadaId && (
              <small className="p-error">{errors.liquidacionTemporadaId.message}</small>
            )}
          </div>

          {/* Tipo de Movimiento */}
          <div className="col-12 md:col-6">
            <label htmlFor="tipoMovimientoId" className="block text-900 font-medium mb-2">
              Tipo de Movimiento *
            </label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              rules={{ required: 'El tipo de movimiento es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposMovimiento.map(t => ({ ...t, id: Number(t.id) }))}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione un tipo"
                  className={errors.tipoMovimientoId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <small className="p-error">{errors.tipoMovimientoId.message}</small>
            )}
          </div>

          {/* Monto */}
          <div className="col-12 md:col-6">
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ required: 'El monto es obligatorio' }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
                  className={errors.monto ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.monto && (
              <small className="p-error">{errors.monto.message}</small>
            )}
          </div>

          {/* Centro de Costo */}
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
                  options={centrosCosto.map(c => ({ ...c, id: Number(c.id) }))}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione un centro de costo"
                  showClear
                />
              )}
            />
          </div>

          {/* Fecha de Movimiento */}
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
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  className={errors.fechaMovimiento ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <small className="p-error">{errors.fechaMovimiento.message}</small>
            )}
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
          />
          <Button
            type="submit"
            label={movimiento?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default MovLiquidacionTemporadaPescaForm;
