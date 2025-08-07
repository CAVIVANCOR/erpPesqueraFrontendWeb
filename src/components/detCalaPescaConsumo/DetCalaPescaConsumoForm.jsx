// src/components/detCalaPescaConsumo/DetCalaPescaConsumoForm.jsx
// Formulario profesional para DetCalaPescaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetCalaPescaConsumo, updateDetCalaPescaConsumo } from '../../api/detCalaPescaConsumo';

/**
 * Formulario para gestión de DetCalaPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetCalaPescaConsumoForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [calas, setCalas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const toast = useRef(null);

  // Observar peso para calcular porcentaje automáticamente
  const pesoEspecie = watch('pesoEspecie');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        calaFaenaConsumoId: detalle.calaFaenaConsumoId ? Number(detalle.calaFaenaConsumoId) : null,
        especieId: detalle.especieId ? Number(detalle.especieId) : null,
        pesoEspecie: detalle.pesoEspecie || null,
        porcentajeEspecie: detalle.porcentajeEspecie || null,
        tallaPromedio: detalle.tallaPromedio || null,
        estadoFrescura: detalle.estadoFrescura || '',
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        calaFaenaConsumoId: null,
        especieId: null,
        pesoEspecie: null,
        porcentajeEspecie: null,
        tallaPromedio: null,
        estadoFrescura: '',
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setCalas([
        { id: 1, numeroCala: 'CALA-001', faenaDescripcion: 'Faena Anchoveta - Paracas 001', pesoTotal: 1500.50 },
        { id: 2, numeroCala: 'CALA-002', faenaDescripcion: 'Faena Jurel - Chimbote 002', pesoTotal: 2200.75 },
        { id: 3, numeroCala: 'CALA-003', faenaDescripcion: 'Faena Caballa - Callao 003', pesoTotal: 1800.25 },
        { id: 4, numeroCala: 'CALA-004', faenaDescripcion: 'Faena Perico - Paita 004', pesoTotal: 950.00 }
      ]);

      setEspecies([
        { id: 1, nombreCientifico: 'Engraulis ringens', nombreComun: 'Anchoveta', familia: 'Engraulidae' },
        { id: 2, nombreCientifico: 'Trachurus murphyi', nombreComun: 'Jurel', familia: 'Carangidae' },
        { id: 3, nombreCientifico: 'Scomber japonicus', nombreComun: 'Caballa', familia: 'Scombridae' },
        { id: 4, nombreCientifico: 'Coryphaena hippurus', nombreComun: 'Perico', familia: 'Coryphaenidae' },
        { id: 5, nombreCientifico: 'Sarda chiliensis', nombreComun: 'Bonito', familia: 'Scombridae' },
        { id: 6, nombreCientifico: 'Sardinops sagax', nombreComun: 'Sardina', familia: 'Clupeidae' },
        { id: 7, nombreCientifico: 'Merluccius gayi', nombreComun: 'Merluza', familia: 'Merlucciidae' },
        { id: 8, nombreCientifico: 'Thunnus albacares', nombreComun: 'Atún Aleta Amarilla', familia: 'Scombridae' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const calcularPorcentajeAutomatico = () => {
    const calaSeleccionada = calas.find(c => c.id === watch('calaFaenaConsumoId'));
    if (!calaSeleccionada || !pesoEspecie || !calaSeleccionada.pesoTotal) return null;
    
    return (pesoEspecie / calaSeleccionada.pesoTotal) * 100;
  };

  const getEstadoFrescuraColor = (estado) => {
    const colores = {
      'EXCELENTE': 'text-green-600',
      'BUENO': 'text-blue-600',
      'REGULAR': 'text-orange-600',
      'MALO': 'text-red-600'
    };
    return colores[estado] || 'text-gray-600';
  };

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearPorcentaje = (porcentaje) => {
    if (!porcentaje) return '0.00%';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(porcentaje) + '%';
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar peso
      if (!data.pesoEspecie || data.pesoEspecie <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso de la especie debe ser mayor a cero'
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        calaFaenaConsumoId: Number(data.calaFaenaConsumoId),
        especieId: Number(data.especieId),
        pesoEspecie: Number(data.pesoEspecie),
        porcentajeEspecie: data.porcentajeEspecie ? Number(data.porcentajeEspecie) : null,
        tallaPromedio: data.tallaPromedio ? Number(data.tallaPromedio) : null,
        estadoFrescura: data.estadoFrescura || null,
        observaciones: data.observaciones?.trim() || null
      };

      // Si no se especificó porcentaje, calcularlo automáticamente
      if (!payload.porcentajeEspecie) {
        const porcentajeCalculado = calcularPorcentajeAutomatico();
        if (porcentajeCalculado) {
          payload.porcentajeEspecie = Number(porcentajeCalculado.toFixed(2));
        }
      }
      if (detalle?.id) {
        await updateDetCalaPescaConsumo(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await createDetCalaPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el detalle'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-cala-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Cala de Faena Consumo */}
              <div className="col-12">
                <label htmlFor="calaFaenaConsumoId" className="block text-900 font-medium mb-2">
                  Cala de Faena *
                </label>
                <Controller
                  name="calaFaenaConsumoId"
                  control={control}
                  rules={{ required: 'La cala es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="calaFaenaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={calas.map(c => ({ 
                        ...c, 
                        id: Number(c.id),
                        nombreCompleto: `${c.numeroCala} - ${c.faenaDescripcion} (${formatearPeso(c.pesoTotal)})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una cala"
                      className={errors.calaFaenaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.calaFaenaConsumoId && (
                  <small className="p-error">{errors.calaFaenaConsumoId.message}</small>
                )}
              </div>

              {/* Especie */}
              <div className="col-12">
                <label htmlFor="especieId" className="block text-900 font-medium mb-2">
                  Especie *
                </label>
                <Controller
                  name="especieId"
                  control={control}
                  rules={{ required: 'La especie es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="especieId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={especies.map(e => ({ 
                        ...e, 
                        id: Number(e.id),
                        nombreCompleto: `${e.nombreComun} (${e.nombreCientifico}) - ${e.familia}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una especie"
                      className={errors.especieId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.especieId && (
                  <small className="p-error">{errors.especieId.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Peso y Porcentaje */}
          <TabPanel header="Peso y Porcentaje">
            <div className="grid">
              {/* Peso de la Especie */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoEspecie" className="block text-900 font-medium mb-2">
                  Peso de la Especie (kg) *
                </label>
                <Controller
                  name="pesoEspecie"
                  control={control}
                  rules={{ 
                    required: 'El peso es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a cero' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoEspecie"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                      className={errors.pesoEspecie ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoEspecie && (
                  <small className="p-error">{errors.pesoEspecie.message}</small>
                )}
              </div>

              {/* Porcentaje de la Especie */}
              <div className="col-12 md:col-6">
                <label htmlFor="porcentajeEspecie" className="block text-900 font-medium mb-2">
                  Porcentaje de la Especie (%)
                </label>
                <Controller
                  name="porcentajeEspecie"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="porcentajeEspecie"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      max={100}
                      maxFractionDigits={2}
                      suffix="%"
                    />
                  )}
                />
                <small className="text-blue-600">
                  Si no se especifica, se calculará automáticamente basado en el peso total de la cala
                </small>
              </div>

              {/* Cálculo Automático de Porcentaje */}
              {pesoEspecie && watch('calaFaenaConsumoId') && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Cálculo Automático</h6>
                    <div className="grid">
                      <div className="col-4">
                        <strong>Peso Especie:</strong>
                        <div className="text-lg font-bold text-green-600">
                          {formatearPeso(pesoEspecie)}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Peso Total Cala:</strong>
                        <div className="text-lg font-bold text-blue-600">
                          {(() => {
                            const cala = calas.find(c => c.id === watch('calaFaenaConsumoId'));
                            return cala ? formatearPeso(cala.pesoTotal) : '0.00 kg';
                          })()}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Porcentaje Calculado:</strong>
                        <div className="text-lg font-bold text-orange-600">
                          {(() => {
                            const porcentaje = calcularPorcentajeAutomatico();
                            return porcentaje ? formatearPorcentaje(porcentaje) : '0.00%';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Características Biológicas */}
          <TabPanel header="Características Biológicas">
            <div className="grid">
              {/* Talla Promedio */}
              <div className="col-12 md:col-6">
                <label htmlFor="tallaPromedio" className="block text-900 font-medium mb-2">
                  Talla Promedio (cm)
                </label>
                <Controller
                  name="tallaPromedio"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="tallaPromedio"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0"
                      min={0}
                      maxFractionDigits={1}
                      suffix=" cm"
                    />
                  )}
                />
              </div>

              {/* Estado de Frescura */}
              <div className="col-12 md:col-6">
                <label htmlFor="estadoFrescura" className="block text-900 font-medium mb-2">
                  Estado de Frescura
                </label>
                <Controller
                  name="estadoFrescura"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoFrescura"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Excelente', value: 'EXCELENTE' },
                        { label: 'Bueno', value: 'BUENO' },
                        { label: 'Regular', value: 'REGULAR' },
                        { label: 'Malo', value: 'MALO' }
                      ]}
                      placeholder="Seleccione estado de frescura"
                    />
                  )}
                />
              </div>

              {/* Información del Estado de Frescura */}
              {watch('estadoFrescura') && (
                <div className="col-12">
                  <div className="card p-3 bg-green-50">
                    <h6 className="mb-2 text-green-800">Estado de Frescura</h6>
                    <div className={`text-xl font-bold ${getEstadoFrescuraColor(watch('estadoFrescura'))}`}>
                      {(() => {
                        const estados = {
                          'EXCELENTE': 'Excelente - Pescado fresco, ideal para consumo',
                          'BUENO': 'Bueno - Pescado en buen estado, apto para consumo',
                          'REGULAR': 'Regular - Pescado aceptable, requiere procesamiento rápido',
                          'MALO': 'Malo - Pescado deteriorado, no apto para consumo humano'
                        };
                        return estados[watch('estadoFrescura')] || watch('estadoFrescura');
                      })()}
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
                      placeholder="Observaciones sobre la especie: tamaño, calidad, condiciones especiales, etc."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 4: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen del Detalle de Especie</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Cala:</strong> {
                        (() => {
                          const cala = calas.find(c => c.id === watch('calaFaenaConsumoId'));
                          return cala ? cala.numeroCala : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Especie:</strong> {
                        (() => {
                          const especie = especies.find(e => e.id === watch('especieId'));
                          return especie ? especie.nombreComun : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Peso:</strong> {formatearPeso(pesoEspecie)}
                    </div>
                    <div className="col-6">
                      <strong>Porcentaje:</strong> {
                        watch('porcentajeEspecie') ? 
                        formatearPorcentaje(watch('porcentajeEspecie')) : 
                        (calcularPorcentajeAutomatico() ? 
                          `${formatearPorcentaje(calcularPorcentajeAutomatico())} (calculado)` : 
                          'Sin definir')
                      }
                    </div>
                    <div className="col-6">
                      <strong>Talla Promedio:</strong> {
                        watch('tallaPromedio') ? `${watch('tallaPromedio')} cm` : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Frescura:</strong> 
                      <span className={`ml-2 font-bold ${getEstadoFrescuraColor(watch('estadoFrescura'))}`}>
                        {watch('estadoFrescura') || 'Sin definir'}
                      </span>
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
            label={detalle?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetCalaPescaConsumoForm;
