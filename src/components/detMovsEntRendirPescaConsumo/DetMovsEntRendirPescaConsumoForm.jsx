// src/components/detMovsEntRendirPescaConsumo/DetMovsEntRendirPescaConsumoForm.jsx
// Formulario profesional para DetMovsEntRendirPescaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetMovsEntRendirPescaConsumo, updateDetMovsEntRendirPescaConsumo } from '../../api/detMovsEntRendirPescaConsumo';

/**
 * Formulario para gestión de DetMovsEntRendirPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetMovsEntRendirPescaConsumoForm = ({ movimiento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [entregasARendir, setEntregasARendir] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const toast = useRef(null);

  // Observar tipo de movimiento para cambiar UI
  const tipoMovimiento = watch('tipoMovimiento');
  const monto = watch('monto');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        entregaARendirPescaConsumoId: movimiento.entregaARendirPescaConsumoId ? Number(movimiento.entregaARendirPescaConsumoId) : null,
        tipoMovEntregaRendirId: movimiento.tipoMovEntregaRendirId ? Number(movimiento.tipoMovEntregaRendirId) : null,
        tipoMovimiento: movimiento.tipoMovimiento || '',
        concepto: movimiento.concepto || '',
        monto: movimiento.monto || 0,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        observaciones: movimiento.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        entregaARendirPescaConsumoId: null,
        tipoMovEntregaRendirId: null,
        tipoMovimiento: '',
        concepto: '',
        monto: 0,
        fechaMovimiento: new Date(),
        observaciones: ''
      });
    }
  }, [movimiento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setEntregasARendir([
        { id: 1, descripcion: 'Entrega Novedad Anchoveta - Enero 2024', estado: 'Pendiente' },
        { id: 2, descripcion: 'Entrega Novedad Jurel - Enero 2024', estado: 'Liquidada' },
        { id: 3, descripcion: 'Entrega Novedad Caballa - Enero 2024', estado: 'Pendiente' },
        { id: 4, descripcion: 'Entrega Novedad Perico - Enero 2024', estado: 'Pendiente' }
      ]);

      setTiposMovimiento([
        { id: 1, codigo: 'ING001', descripcion: 'Ingreso por Venta de Pescado', tipoMovimiento: 'INGRESO' },
        { id: 2, codigo: 'EGR001', descripcion: 'Egreso por Combustible', tipoMovimiento: 'EGRESO' },
        { id: 3, codigo: 'EGR002', descripcion: 'Egreso por Víveres', tipoMovimiento: 'EGRESO' },
        { id: 4, codigo: 'EGR003', descripcion: 'Egreso por Hielo', tipoMovimiento: 'EGRESO' },
        { id: 5, codigo: 'EGR004', descripcion: 'Egreso por Reparaciones', tipoMovimiento: 'EGRESO' },
        { id: 6, codigo: 'TRF001', descripcion: 'Transferencia entre Entregas', tipoMovimiento: 'TRANSFERENCIA' },
        { id: 7, codigo: 'AJU001', descripcion: 'Ajuste por Diferencia', tipoMovimiento: 'AJUSTE' },
        { id: 8, codigo: 'ING002', descripcion: 'Ingreso por Bonificación', tipoMovimiento: 'INGRESO' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const getTipoMovimientoColor = (tipo) => {
    const colores = {
      'INGRESO': 'text-green-600',
      'EGRESO': 'text-red-600',
      'TRANSFERENCIA': 'text-blue-600',
      'AJUSTE': 'text-orange-600'
    };
    return colores[tipo] || 'text-gray-600';
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(valor);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar monto
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El monto debe ser mayor a cero'
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        entregaARendirPescaConsumoId: Number(data.entregaARendirPescaConsumoId),
        tipoMovEntregaRendirId: Number(data.tipoMovEntregaRendirId),
        tipoMovimiento: data.tipoMovimiento,
        concepto: data.concepto?.trim() || null,
        monto: Number(data.monto),
        fechaMovimiento: data.fechaMovimiento ? data.fechaMovimiento.toISOString() : new Date().toISOString(),
        observaciones: data.observaciones?.trim() || null
      };

      console.log('Payload DetMovsEntRendirPescaConsumo:', payload); // Log para depuración

      if (movimiento?.id) {
        await updateDetMovsEntRendirPescaConsumo(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento actualizado correctamente'
        });
      } else {
        await createDetMovsEntRendirPescaConsumo(payload);
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
    <div className="det-movs-ent-rendir-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Entrega a Rendir */}
              <div className="col-12">
                <label htmlFor="entregaARendirPescaConsumoId" className="block text-900 font-medium mb-2">
                  Entrega a Rendir *
                </label>
                <Controller
                  name="entregaARendirPescaConsumoId"
                  control={control}
                  rules={{ required: 'La entrega a rendir es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="entregaARendirPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={entregasARendir.map(ear => ({ 
                        ...ear, 
                        id: Number(ear.id),
                        nombreCompleto: `${ear.id} - ${ear.descripcion} (${ear.estado})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una entrega a rendir"
                      className={errors.entregaARendirPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.entregaARendirPescaConsumoId && (
                  <small className="p-error">{errors.entregaARendirPescaConsumoId.message}</small>
                )}
              </div>

              {/* Tipo de Movimiento de Entrega a Rendir */}
              <div className="col-12">
                <label htmlFor="tipoMovEntregaRendirId" className="block text-900 font-medium mb-2">
                  Tipo de Movimiento *
                </label>
                <Controller
                  name="tipoMovEntregaRendirId"
                  control={control}
                  rules={{ required: 'El tipo de movimiento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovEntregaRendirId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => {
                        field.onChange(e.value);
                        // Auto-completar tipo de movimiento basado en la selección
                        const tipoSeleccionado = tiposMovimiento.find(tm => tm.id === e.value);
                        if (tipoSeleccionado) {
                          reset(prev => ({
                            ...prev,
                            tipoMovEntregaRendirId: e.value,
                            tipoMovimiento: tipoSeleccionado.tipoMovimiento,
                            concepto: tipoSeleccionado.descripcion
                          }));
                        }
                      }}
                      options={tiposMovimiento.map(tm => ({ 
                        ...tm, 
                        id: Number(tm.id),
                        nombreCompleto: `${tm.codigo} - ${tm.descripcion} (${tm.tipoMovimiento})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione tipo de movimiento"
                      className={errors.tipoMovEntregaRendirId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.tipoMovEntregaRendirId && (
                  <small className="p-error">{errors.tipoMovEntregaRendirId.message}</small>
                )}
              </div>

              {/* Tipo de Movimiento (Auto-completado) */}
              <div className="col-12 md:col-6">
                <label htmlFor="tipoMovimiento" className="block text-900 font-medium mb-2">
                  Clasificación *
                </label>
                <Controller
                  name="tipoMovimiento"
                  control={control}
                  rules={{ required: 'La clasificación es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Ingreso', value: 'INGRESO' },
                        { label: 'Egreso', value: 'EGRESO' },
                        { label: 'Transferencia', value: 'TRANSFERENCIA' },
                        { label: 'Ajuste', value: 'AJUSTE' }
                      ]}
                      placeholder="Seleccione clasificación"
                      className={errors.tipoMovimiento ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.tipoMovimiento && (
                  <small className="p-error">{errors.tipoMovimiento.message}</small>
                )}
              </div>

              {/* Fecha de Movimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
                  Fecha de Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: 'La fecha es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      className={errors.fechaMovimiento ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <small className="p-error">{errors.fechaMovimiento.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Concepto y Monto */}
          <TabPanel header="Concepto y Monto">
            <div className="grid">
              {/* Concepto */}
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
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Descripción del movimiento"
                      className={errors.concepto ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.concepto && (
                  <small className="p-error">{errors.concepto.message}</small>
                )}
              </div>

              {/* Monto */}
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
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      placeholder="0.00"
                      className={errors.monto ? 'p-invalid' : ''}
                      min={0}
                      maxFractionDigits={2}
                    />
                  )}
                />
                {errors.monto && (
                  <small className="p-error">{errors.monto.message}</small>
                )}
              </div>

              {/* Vista previa del monto */}
              {monto > 0 && (
                <div className="col-12 md:col-6">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Vista Previa</h6>
                    <div className={`text-xl font-bold ${getTipoMovimientoColor(tipoMovimiento)}`}>
                      {tipoMovimiento === 'EGRESO' ? '- ' : '+ '}
                      {formatearMoneda(monto)}
                    </div>
                    <div className="text-sm text-blue-600">
                      {tipoMovimiento || 'Sin clasificar'}
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
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
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={4}
                      placeholder="Observaciones adicionales sobre el movimiento..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen del Movimiento</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Entrega:</strong> {
                        entregasARendir.find(ear => ear.id === watch('entregaARendirPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Tipo:</strong> {
                        (() => {
                          const tm = tiposMovimiento.find(t => t.id === watch('tipoMovEntregaRendirId'));
                          return tm ? `${tm.codigo} - ${tm.descripcion}` : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Clasificación:</strong> 
                      <span className={`ml-2 font-bold ${getTipoMovimientoColor(tipoMovimiento)}`}>
                        {tipoMovimiento || 'Sin definir'}
                      </span>
                    </div>
                    <div className="col-6">
                      <strong>Fecha:</strong> {
                        watch('fechaMovimiento') ? 
                        watch('fechaMovimiento').toLocaleString('es-PE') : 
                        'Sin definir'
                      }
                    </div>
                    <div className="col-12">
                      <strong>Concepto:</strong> {watch('concepto') || 'Sin definir'}
                    </div>
                    <div className="col-12">
                      <div className="text-2xl font-bold">
                        <strong>Monto:</strong> 
                        <span className={`ml-2 ${getTipoMovimientoColor(tipoMovimiento)}`}>
                          {tipoMovimiento === 'EGRESO' ? '- ' : '+ '}
                          {formatearMoneda(monto)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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

export default DetMovsEntRendirPescaConsumoForm;
