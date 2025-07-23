// src/components/detGastosComprasProd/DetGastosComprasProdForm.jsx
// Formulario profesional para DetGastosComprasProd con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearDetGastosComprasProd, actualizarDetGastosComprasProd } from '../../api/detGastosComprasProd';
import { getCotizacionesCompras } from '../../api/cotizacionCompras';
import { getEntregasARendirPCompras } from '../../api/entregaARendirPCompras';
import { getDetMovsEntregaRendirPCompras } from '../../api/detMovsEntregaRendirPCompras';

/**
 * Componente DetGastosComprasProdForm
 * Formulario para gestión de gastos de compras de producción
 * Incluye validaciones y relaciones según patrón ERP Megui
 */
const DetGastosComprasProdForm = ({ gasto, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      cotizacionComprasId: null,
      entregaARendirPComprasId: null,
      detMovEntregaRendirPComprasId: null,
      costoProduccionId: null,
      monto: 0.00,
      fechaRegistro: new Date()
    }
  });

  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [costosProduccion] = useState([
    { id: 1, label: 'Costo Materia Prima', value: 1 },
    { id: 2, label: 'Costo Mano de Obra', value: 2 },
    { id: 3, label: 'Costo Indirecto Fabricación', value: 3 },
    { id: 4, label: 'Costo Transporte', value: 4 },
    { id: 5, label: 'Costo Almacenamiento', value: 5 }
  ]);
  const toast = useRef(null);

  // Observar entrega seleccionada para filtrar movimientos
  const entregaSeleccionada = watch('entregaARendirPComprasId');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (gasto) {
      // Cargar datos del gasto para edición
      reset({
        cotizacionComprasId: gasto.cotizacionComprasId ? Number(gasto.cotizacionComprasId) : null,
        entregaARendirPComprasId: gasto.entregaARendirPComprasId ? Number(gasto.entregaARendirPComprasId) : null,
        detMovEntregaRendirPComprasId: gasto.detMovEntregaRendirPComprasId ? Number(gasto.detMovEntregaRendirPComprasId) : null,
        costoProduccionId: gasto.costoProduccionId ? Number(gasto.costoProduccionId) : null,
        monto: Number(gasto.monto) || 0.00,
        fechaRegistro: gasto.fechaRegistro ? new Date(gasto.fechaRegistro) : new Date()
      });
    }
  }, [gasto, reset]);

  useEffect(() => {
    // Filtrar movimientos cuando cambia la entrega
    if (entregaSeleccionada) {
      cargarMovimientosPorEntrega(entregaSeleccionada);
    } else {
      setMovimientos([]);
    }
  }, [entregaSeleccionada]);

  const cargarDatos = async () => {
    try {
      const [
        cotizacionesData,
        entregasData
      ] = await Promise.all([
        getCotizacionesCompras(),
        getEntregasARendirPCompras()
      ]);

      // Normalizar IDs según regla ERP Megui
      setCotizaciones(cotizacionesData.map(c => ({
        ...c,
        id: Number(c.id),
        label: `${c.empresa?.razonSocial} - ${c.tipoProducto?.nombre}`,
        value: Number(c.id)
      })));

      setEntregas(entregasData.map(e => ({
        ...e,
        id: Number(e.id),
        label: `Entrega #${e.id} - ${e.responsable?.nombres} ${e.responsable?.apellidos}`,
        value: Number(e.id)
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

  const cargarMovimientosPorEntrega = async (entregaId) => {
    try {
      const movimientosData = await getDetMovsEntregaRendirPCompras();
      
      // Filtrar movimientos por entrega seleccionada
      const movimientosFiltrados = movimientosData
        .filter(m => Number(m.entregaARendirPComprasId) === Number(entregaId))
        .map(m => ({
          ...m,
          id: Number(m.id),
          label: `Mov #${m.id} - ${m.descripcion || 'Sin descripción'} - ${Number(m.monto).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}`,
          value: Number(m.id)
        }));

      setMovimientos(movimientosFiltrados);

    } catch (error) {
      console.error('Error al cargar movimientos:', error);
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
        cotizacionComprasId: Number(data.cotizacionComprasId),
        entregaARendirPComprasId: Number(data.entregaARendirPComprasId),
        detMovEntregaRendirPComprasId: Number(data.detMovEntregaRendirPComprasId),
        costoProduccionId: Number(data.costoProduccionId),
        monto: Number(data.monto),
        fechaRegistro: data.fechaRegistro ? data.fechaRegistro.toISOString() : new Date().toISOString()
      };

      console.log('Payload DetGastosComprasProd:', payload);

      if (gasto?.id) {
        await updateDetGastosComprasProd(gasto.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Gasto de compras actualizado correctamente'
        });
      } else {
        await createDetGastosComprasProd(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Gasto de compras creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar gasto de compras:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el gasto de compras'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-gastos-compras-prod-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="cotizacionComprasId" className="block text-900 font-medium mb-2">
              Cotización de Compras *
            </label>
            <Controller
              name="cotizacionComprasId"
              control={control}
              rules={{ required: 'La cotización de compras es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="cotizacionComprasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={cotizaciones}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cotización de compras"
                  className={`w-full ${errors.cotizacionComprasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.cotizacionComprasId && (
              <small className="p-error">{errors.cotizacionComprasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="entregaARendirPComprasId" className="block text-900 font-medium mb-2">
              Entrega a Rendir *
            </label>
            <Controller
              name="entregaARendirPComprasId"
              control={control}
              rules={{ required: 'La entrega a rendir es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="entregaARendirPComprasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={entregas}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar entrega a rendir"
                  className={`w-full ${errors.entregaARendirPComprasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.entregaARendirPComprasId && (
              <small className="p-error">{errors.entregaARendirPComprasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="detMovEntregaRendirPComprasId" className="block text-900 font-medium mb-2">
              Movimiento de Entrega *
            </label>
            <Controller
              name="detMovEntregaRendirPComprasId"
              control={control}
              rules={{ required: 'El movimiento de entrega es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="detMovEntregaRendirPComprasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={movimientos}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar movimiento de entrega"
                  className={`w-full ${errors.detMovEntregaRendirPComprasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                  disabled={!entregaSeleccionada}
                />
              )}
            />
            {errors.detMovEntregaRendirPComprasId && (
              <small className="p-error">{errors.detMovEntregaRendirPComprasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="costoProduccionId" className="block text-900 font-medium mb-2">
              Tipo de Costo de Producción *
            </label>
            <Controller
              name="costoProduccionId"
              control={control}
              rules={{ required: 'El tipo de costo de producción es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="costoProduccionId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={costosProduccion}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo de costo"
                  className={`w-full ${errors.costoProduccionId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.costoProduccionId && (
              <small className="p-error">{errors.costoProduccionId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto *
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
                  placeholder="Monto del gasto"
                  className={`w-full ${errors.monto ? 'p-invalid' : ''}`}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0.01}
                />
              )}
            />
            {errors.monto && (
              <small className="p-error">{errors.monto.message}</small>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="fechaRegistro" className="block text-900 font-medium mb-2">
              Fecha de Registro *
            </label>
            <Controller
              name="fechaRegistro"
              control={control}
              rules={{ required: 'La fecha de registro es obligatoria' }}
              render={({ field }) => (
                <Calendar
                  id="fechaRegistro"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccionar fecha de registro"
                  className={`w-full ${errors.fechaRegistro ? 'p-invalid' : ''}`}
                  dateFormat="dd/mm/yy"
                  showIcon
                  maxDate={new Date()}
                />
              )}
            />
            {errors.fechaRegistro && (
              <small className="p-error">{errors.fechaRegistro.message}</small>
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
            label={gasto?.id ? 'Actualizar' : 'Crear'}
            icon={gasto?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default DetGastosComprasProdForm;
