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
import { crearDetCalaPescaConsumo, actualizarDetCalaPescaConsumo } from '../../api/detCalaPescaConsumo';
// Importar APIs necesarias
import { getCalasFaenaConsumo } from '../../api/calaFaenaConsumo';
import { getEspecies } from '../../api/especie';

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

  // Observar cambios para cálculos automáticos
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
      setLoading(true);

      // Cargar Calas desde API
      const calasData = await getCalasFaenaConsumo();
      setCalas(calasData.map(cala => ({
        id: Number(cala.id),
        numeroCala: cala.numeroCala || `CALA-${cala.id}`,
        faenaDescripcion: cala.faenaPescaConsumo?.descripcion || `Faena ${cala.faenaPescaConsumoId}`,
        pesoTotal: Number(cala.pesoTotal) || 0
      })));

      // Cargar Especies desde API
      const especiesData = await getEspecies();
      setEspecies(especiesData.map(especie => ({
        id: Number(especie.id),
        nombreCientifico: especie.nombreCientifico,
        nombreComun: especie.nombreComun,
        familia: especie.familia || 'Sin clasificar'
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

  const calcularPorcentajeAutomatico = () => {
    const calaSeleccionada = calas.find(c => c.id === watch('calaFaenaConsumoId'));
    if (!calaSeleccionada || !pesoEspecie || !calaSeleccionada.pesoTotal) return null;
    
    const porcentaje = (pesoEspecie / calaSeleccionada.pesoTotal) * 100;
    return Math.round(porcentaje * 100) / 100; // Redondear a 2 decimales
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        calaFaenaConsumoId: Number(data.calaFaenaConsumoId),
        especieId: Number(data.especieId),
        pesoEspecie: Number(data.pesoEspecie),
        porcentajeEspecie: data.porcentajeEspecie ? Number(data.porcentajeEspecie) : calcularPorcentajeAutomatico(),
        tallaPromedio: data.tallaPromedio ? Number(data.tallaPromedio) : null,
        estadoFrescura: data.estadoFrescura?.trim() || null,
        observaciones: data.observaciones?.trim() || null
      };

      // Validaciones adicionales
      if (payload.pesoEspecie <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso de la especie debe ser mayor a 0'
        });
        return;
      }

      if (payload.porcentajeEspecie && (payload.porcentajeEspecie < 0 || payload.porcentajeEspecie > 100)) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El porcentaje debe estar entre 0 y 100'
        });
        return;
      }

      if (payload.tallaPromedio && payload.tallaPromedio <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'La talla promedio debe ser mayor a 0'
        });
        return;
      }

      if (detalle?.id) {
        await actualizarDetCalaPescaConsumo(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cala actualizado correctamente'
        });
      } else {
        await crearDetCalaPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cala creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el detalle de cala'
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
          {/* Pestaña 1: Información Principal */}
          <TabPanel header="Información Principal">
            <div className="grid">
              {/* Cala de Faena Consumo */}
              <div className="col-12">
                <label htmlFor="calaFaenaConsumoId" className="block text-900 font-medium mb-2">
                  Cala de Faena *
                </label>
                <Controller
                  name="calaFaenaConsumoId"
                  control={control}
                  rules={{ required: 'La cala de faena es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="calaFaenaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={calas.map(cala => ({ 
                        ...cala, 
                        id: Number(cala.id),
                        nombreCompleto: `${cala.numeroCala} - ${cala.faenaDescripcion} (${cala.pesoTotal} kg)`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una cala de faena"
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
                      options={especies.map(especie => ({ 
                        ...especie, 
                        id: Number(especie.id),
                        nombreCompleto: `${especie.nombreComun} (${especie.nombreCientifico}) - ${especie.familia}`
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

              {/* Peso de la Especie */}
              <div className="col-6">
                <label htmlFor="pesoEspecie" className="block text-900 font-medium mb-2">
                  Peso de la Especie (kg) *
                </label>
                <Controller
                  name="pesoEspecie"
                  control={control}
                  rules={{ 
                    required: 'El peso de la especie es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoEspecie"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="0.00"
                      className={errors.pesoEspecie ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoEspecie && (
                  <small className="p-error">{errors.pesoEspecie.message}</small>
                )}
              </div>

              {/* Porcentaje de la Especie */}
              <div className="col-6">
                <label htmlFor="porcentajeEspecie" className="block text-900 font-medium mb-2">
                  Porcentaje de la Especie (%)
                </label>
                <Controller
                  name="porcentajeEspecie"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="porcentajeEspecie"
                      value={field.value || calcularPorcentajeAutomatico()}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      max={100}
                      placeholder="0.00"
                      suffix="%"
                    />
                  )}
                />
                <small className="text-blue-600">
                  Se calcula automáticamente si no se especifica
                </small>
              </div>

              {/* Talla Promedio */}
              <div className="col-6">
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
                      mode="decimal"
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      min={0}
                      placeholder="0.0"
                      suffix=" cm"
                    />
                  )}
                />
              </div>

              {/* Estado de Frescura */}
              <div className="col-6">
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
                      placeholder="Ingrese observaciones adicionales sobre el detalle de la cala..."
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
                  <h5 className="mb-3">Resumen del Detalle de Cala</h5>
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
                      <strong>Peso:</strong> {watch('pesoEspecie') || 0} kg
                    </div>
                    <div className="col-6">
                      <strong>Porcentaje:</strong> {
                        watch('porcentajeEspecie') || calcularPorcentajeAutomatico() || 0
                      }%
                    </div>
                    <div className="col-6">
                      <strong>Talla Promedio:</strong> {watch('tallaPromedio') || 'N/A'} cm
                    </div>
                    <div className="col-6">
                      <strong>Estado de Frescura:</strong> {watch('estadoFrescura') || 'Sin especificar'}
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