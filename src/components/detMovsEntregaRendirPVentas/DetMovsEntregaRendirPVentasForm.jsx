// src/components/detMovsEntregaRendirPVentas/DetMovsEntregaRendirPVentasForm.jsx
// Formulario profesional para DetMovsEntregaRendirPVentas con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearDetMovsEntregaRendirPVentas, actualizarDetMovsEntregaRendirPVentas } from '../../api/detMovsEntregaRendirPVentas';
import { getAllEntregaARendirPVentas } from '../../api/entregaARendirPVentas';
import { getPersonal } from '../../api/personal';
import { getTiposMovEntregaRendir } from '../../api/tipoMovEntregaRendir';
import { getCentrosCosto } from '../../api/centroCosto';

/**
 * Componente DetMovsEntregaRendirPVentasForm
 * Formulario para gestión de movimientos de entregas a rendir de ventas
 * Incluye validaciones y relaciones con entregas según patrón ERP Megui
 */
const DetMovsEntregaRendirPVentasForm = ({ movimiento, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      entregaARendirPVentasId: null,
      responsableId: null,
      fechaMovimiento: new Date(),
      tipoMovimientoId: null,
      centroCostoId: null,
      monto: 0,
      descripcion: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [entregas, setEntregas] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Cargar datos del movimiento para edición
      reset({
        entregaARendirPVentasId: movimiento.entregaARendirPVentasId ? Number(movimiento.entregaARendirPVentasId) : null,
        responsableId: movimiento.responsableId ? Number(movimiento.responsableId) : null,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        monto: Number(movimiento.monto) || 0,
        descripcion: movimiento.descripcion || ''
      });
    }
  }, [movimiento, reset]);

  const cargarDatos = async () => {
    try {
      const [
        entregasData,
        responsablesData,
        tiposMovimientoData,
        centrosCostoData
      ] = await Promise.all([
        getAllEntregaARendirPVentas(),
        getPersonal(),
        getTiposMovEntregaRendir(),
        getCentrosCosto()
      ]);

      // Normalizar IDs según regla ERP Megui
      // Filtrar solo entregas no liquidadas
      setEntregas(entregasData
        .filter(e => !e.entregaLiquidada)
        .map(e => ({
          ...e,
          id: Number(e.id),
          label: `${e.cotizacionVentas?.numeroDocumento} - ${e.cotizacionVentas?.cliente?.razonSocial || 'Sin cliente'}`,
          value: Number(e.id)
        })));

      setResponsables(responsablesData.map(r => ({
        ...r,
        id: Number(r.id),
        label: `${r.nombres} ${r.apellidos}`,
        value: Number(r.id)
      })));

      setTiposMovimiento(tiposMovimientoData.map(t => ({
        ...t,
        id: Number(t.id),
        label: t.nombre,
        value: Number(t.id)
      })));

      setCentrosCosto(centrosCostoData.map(cc => ({
        ...cc,
        id: Number(cc.id),
        label: cc.nombre,
        value: Number(cc.id)
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

      // Validaciones de negocio
      if (data.monto <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El monto debe ser mayor a cero'
        });
        return;
      }

      // Preparar payload con validaciones
      const payload = {
        entregaARendirPVentasId: Number(data.entregaARendirPVentasId),
        responsableId: Number(data.responsableId),
        fechaMovimiento: data.fechaMovimiento.toISOString(),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        centroCostoId: Number(data.centroCostoId),
        monto: Number(data.monto),
        descripcion: data.descripcion?.trim() || null
      };

      console.log('Payload DetMovsEntregaRendirPVentas:', payload);

      if (movimiento?.id) {
        await actualizarDetMovsEntregaRendirPVentas(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de entrega actualizado correctamente'
        });
      } else {
        await crearDetMovsEntregaRendirPVentas(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de entrega creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar movimiento de entrega:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el movimiento de entrega'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-movs-entrega-rendir-p-ventas-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="entregaARendirPVentasId" className="block text-900 font-medium mb-2">
              Entrega a Rendir *
            </label>
            <Controller
              name="entregaARendirPVentasId"
              control={control}
              rules={{ required: 'La entrega a rendir es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="entregaARendirPVentasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={entregas}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar entrega a rendir"
                  className={`w-full ${errors.entregaARendirPVentasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.entregaARendirPVentasId && (
              <small className="p-error">{errors.entregaARendirPVentasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="responsableId" className="block text-900 font-medium mb-2">
              Responsable *
            </label>
            <Controller
              name="responsableId"
              control={control}
              rules={{ required: 'El responsable es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="responsableId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={responsables}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar responsable"
                  className={`w-full ${errors.responsableId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.responsableId && (
              <small className="p-error">{errors.responsableId.message}</small>
            )}
          </div>

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
                  options={tiposMovimiento}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo de movimiento"
                  className={`w-full ${errors.tipoMovimientoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <small className="p-error">{errors.tipoMovimientoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: 'El centro de costo es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={centrosCosto}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar centro de costo"
                  className={`w-full ${errors.centroCostoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.centroCostoId && (
              <small className="p-error">{errors.centroCostoId.message}</small>
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
                  placeholder="Seleccionar fecha de movimiento"
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
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto (S/) *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ 
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a cero' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Ingrese el monto"
                  className={`w-full ${errors.monto ? 'p-invalid' : ''}`}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
            {errors.monto && (
              <small className="p-error">{errors.monto.message}</small>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ 
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              }}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  placeholder="Descripción del movimiento (opcional)"
                  className={`w-full ${errors.descripcion ? 'p-invalid' : ''}`}
                  rows={3}
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
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

export default DetMovsEntregaRendirPVentasForm;
