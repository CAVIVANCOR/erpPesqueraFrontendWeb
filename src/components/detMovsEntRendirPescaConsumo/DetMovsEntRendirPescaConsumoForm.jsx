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
import { crearDetMovEntRendirPescaConsumo, actualizarDetMovEntRendirPescaConsumo } from '../../api/detMovsEntRendirPescaConsumo';
// Importar APIs necesarias
import { getEntregasARendirPescaConsumo } from '../../api/entregaARendirPescaConsumo';
import { getTiposMovimiento } from '../../api/tipoMovimiento';

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

  // Observar tipo de movimiento para mostrar información adicional
  const tipoMovimientoSeleccionado = watch('tipoMovimientoId');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        entregaARendirPescaConsumoId: movimiento.entregaARendirPescaConsumoId ? Number(movimiento.entregaARendirPescaConsumoId) : null,
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        concepto: movimiento.concepto || '',
        monto: movimiento.monto || 0,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        observaciones: movimiento.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        entregaARendirPescaConsumoId: null,
        tipoMovimientoId: null,
        concepto: '',
        monto: 0,
        fechaMovimiento: new Date(),
        observaciones: ''
      });
    }
  }, [movimiento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar Entregas a Rendir desde API
      const entregasData = await getEntregasARendirPescaConsumo();
      setEntregasARendir(entregasData.map(entrega => ({
        id: Number(entrega.id),
        descripcion: entrega.descripcion || `Entrega ${entrega.id}`,
        estado: entrega.entregaLiquidada ? 'Liquidada' : 'Pendiente'
      })));

      // Cargar Tipos de Movimiento desde API
      const tiposData = await getTiposMovimiento();
      setTiposMovimiento(tiposData.map(tipo => ({
        id: Number(tipo.id),
        codigo: tipo.codigo,
        descripcion: tipo.descripcion,
        tipoMovimiento: tipo.tipoMovimiento || tipo.tipo
      })));
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    } finally {
      setLoading(false);
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        entregaARendirPescaConsumoId: Number(data.entregaARendirPescaConsumoId),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        concepto: data.concepto?.trim() || null,
        monto: Number(data.monto),
        fechaMovimiento: data.fechaMovimiento ? data.fechaMovimiento.toISOString() : new Date().toISOString(),
        observaciones: data.observaciones?.trim() || null
      };

      // Validaciones adicionales
      if (payload.monto === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El monto debe ser diferente de cero'
        });
        return;
      }

      if (!payload.concepto) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El concepto es obligatorio'
        });
        return;
      }

      if (movimiento?.id) {
        await actualizarDetMovEntRendirPescaConsumo(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento actualizado correctamente'
        });
      } else {
        await crearDetMovEntRendirPescaConsumo(payload);
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
          {/* Pestaña 1: Información Principal */}
          <TabPanel header="Información Principal">
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
                      options={entregasARendir.map(entrega => ({ 
                        ...entrega, 
                        id: Number(entrega.id),
                        nombreCompleto: `${entrega.id} - ${entrega.descripcion} (${entrega.estado})`
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

              {/* Tipo de Movimiento */}
              <div className="col-12">
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
                      options={tiposMovimiento.map(tipo => ({ 
                        ...tipo, 
                        id: Number(tipo.id),
                        nombreCompleto: `${tipo.codigo} - ${tipo.descripcion} (${tipo.tipoMovimiento})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un tipo de movimiento"
                      className={errors.tipoMovimientoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.tipoMovimientoId && (
                  <small className="p-error">{errors.tipoMovimientoId.message}</small>
                )}
              </div>

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
                      placeholder="Ingrese el concepto del movimiento"
                      className={errors.concepto ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.concepto && (
                  <small className="p-error">{errors.concepto.message}</small>
                )}
              </div>

              {/* Monto */}
              <div className="col-6">
                <label htmlFor="monto" className="block text-900 font-medium mb-2">
                  Monto *
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
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      placeholder="0.00"
                      className={errors.monto ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.monto && (
                  <small className="p-error">{errors.monto.message}</small>
                )}
              </div>

              {/* Fecha del Movimiento */}
              <div className="col-6">
                <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
                  Fecha del Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: 'La fecha del movimiento es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha del movimiento"
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

              {/* Información del Tipo de Movimiento */}
              {tipoMovimientoSeleccionado && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Información del Tipo de Movimiento</h6>
                    <div className="grid">
                      <div className="col-4">
                        <strong>Código:</strong>
                        <div className="text-lg font-bold text-blue-600">
                          {(() => {
                            const tipo = tiposMovimiento.find(t => t.id === tipoMovimientoSeleccionado);
                            return tipo ? tipo.codigo : 'N/A';
                          })()}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Descripción:</strong>
                        <div className="text-lg font-bold text-gray-600">
                          {(() => {
                            const tipo = tiposMovimiento.find(t => t.id === tipoMovimientoSeleccionado);
                            return tipo ? tipo.descripcion : 'N/A';
                          })()}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Tipo:</strong>
                        <div className={`text-lg font-bold ${(() => {
                          const tipo = tiposMovimiento.find(t => t.id === tipoMovimientoSeleccionado);
                          return tipo ? getTipoMovimientoColor(tipo.tipoMovimiento) : 'text-gray-600';
                        })()}`}>
                          {(() => {
                            const tipo = tiposMovimiento.find(t => t.id === tipoMovimientoSeleccionado);
                            return tipo ? tipo.tipoMovimiento : 'N/A';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 2: Observaciones */}
          <TabPanel header="Observaciones">
            <div className="grid">
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
                      rows={5}
                      placeholder="Ingrese observaciones adicionales sobre el movimiento..."
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
                      <strong>Entrega a Rendir:</strong> {
                        (() => {
                          const entrega = entregasARendir.find(e => e.id === watch('entregaARendirPescaConsumoId'));
                          return entrega ? entrega.descripcion : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Tipo de Movimiento:</strong> {
                        (() => {
                          const tipo = tiposMovimiento.find(t => t.id === watch('tipoMovimientoId'));
                          return tipo ? `${tipo.codigo} - ${tipo.descripcion}` : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Concepto:</strong> {watch('concepto') || 'Sin especificar'}
                    </div>
                    <div className="col-6">
                      <strong>Monto:</strong> {
                        new Intl.NumberFormat('es-PE', {
                          style: 'currency',
                          currency: 'PEN'
                        }).format(watch('monto') || 0)
                      }
                    </div>
                    <div className="col-6">
                      <strong>Fecha:</strong> {
                        watch('fechaMovimiento') ? 
                        watch('fechaMovimiento').toLocaleString('es-PE') : 
                        'Sin especificar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Clasificación:</strong> 
                      <span className={`ml-2 font-bold ${(() => {
                        const tipo = tiposMovimiento.find(t => t.id === watch('tipoMovimientoId'));
                        return tipo ? getTipoMovimientoColor(tipo.tipoMovimiento) : 'text-gray-600';
                      })()}`}>
                        {(() => {
                          const tipo = tiposMovimiento.find(t => t.id === watch('tipoMovimientoId'));
                          return tipo ? tipo.tipoMovimiento : 'Sin clasificar';
                        })()}
                      </span>
                    </div>
                    {watch('observaciones') && (
                      <div className="col-12">
                        <strong>Observaciones:</strong>
                        <div className="mt-2 p-2 bg-white border-round">
                          {watch('observaciones')}
                        </div>
                      </div>
                    )}
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