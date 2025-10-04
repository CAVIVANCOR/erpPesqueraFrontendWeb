// src/components/calaFaenaConsumo/CalaFaenaConsumoForm.jsx
// Formulario profesional para CalaFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { crearCalaFaenaConsumo, actualizarCalaFaenaConsumo } from '../../api/calaFaenaConsumo';
// Importar API necesaria según tabla de equivalencias
import { getFaenasPescaConsumo } from '../../api/faenaPescaConsumo';

/**
 * Formulario para gestión de CalaFaenaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const CalaFaenaConsumoForm = ({ cala, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const toast = useRef(null);

  // Observar fechas para validación y cálculo de duración
  const fechaHoraInicio = watch('fechaHoraInicio');
  const fechaHoraFin = watch('fechaHoraFin');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (cala) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        faenaPescaConsumoId: cala.faenaPescaConsumoId ? Number(cala.faenaPescaConsumoId) : null,
        numeroCala: cala.numeroCala || '',
        fechaHoraInicio: cala.fechaHoraInicio ? new Date(cala.fechaHoraInicio) : null,
        fechaHoraFin: cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null,
        latitud: cala.latitud || null,
        longitud: cala.longitud || null,
        profundidad: cala.profundidad || null,
        temperatura: cala.temperatura || null,
        pesoTotal: cala.pesoTotal || null,
        observaciones: cala.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        numeroCala: '',
        fechaHoraInicio: null,
        fechaHoraFin: null,
        latitud: null,
        longitud: null,
        profundidad: null,
        temperatura: null,
        pesoTotal: null,
        observaciones: ''
      });
    }
  }, [cala, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar FaenaPescaConsumo desde API
      const faenasData = await getFaenasPescaConsumo();
      const faenasFormateadas = faenasData.map(f => ({
        id: Number(f.id),
        descripcion: f.descripcion || `Faena ${f.id}`,
        fechaSalida: f.fechaSalida,
        embarcacion: f.embarcacion?.nombre || 'Sin embarcación',
        nombreCompleto: `${f.id} - ${f.descripcion || `Faena ${f.id}`} (${f.embarcacion?.nombre || 'Sin embarcación'})`
      }));
      setFaenas(faenasFormateadas);
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos desde las APIs'
      });
    } finally {
      setLoading(false);
    }
  };

  const validarFechas = () => {
    if (fechaHoraInicio && fechaHoraFin && fechaHoraInicio >= fechaHoraFin) {
      return 'La fecha/hora de fin debe ser posterior a la de inicio';
    }
    return true;
  };

  const calcularDuracion = () => {
    if (!fechaHoraInicio || !fechaHoraFin) return '';
    
    const duracionMs = fechaHoraFin - fechaHoraInicio;
    if (duracionMs <= 0) return '';
    
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  const validarCoordenadas = (latitud, longitud) => {
    if ((latitud && !longitud) || (!latitud && longitud)) {
      return 'Debe especificar tanto latitud como longitud';
    }
    
    if (latitud && (latitud < -90 || latitud > 90)) {
      return 'La latitud debe estar entre -90 y 90 grados';
    }
    
    if (longitud && (longitud < -180 || longitud > 180)) {
      return 'La longitud debe estar entre -180 y 180 grados';
    }
    
    return true;
  };

  const formatearCoordenadas = (lat, lng) => {
    if (!lat || !lng) return '';
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar fechas
      const validacionFechas = validarFechas();
      if (validacionFechas !== true) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: validacionFechas
        });
        return;
      }
      
      // Validar coordenadas
      const validacionCoordenadas = validarCoordenadas(data.latitud, data.longitud);
      if (validacionCoordenadas !== true) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: validacionCoordenadas
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        numeroCala: data.numeroCala?.trim() || null,
        fechaHoraInicio: data.fechaHoraInicio ? data.fechaHoraInicio.toISOString() : null,
        fechaHoraFin: data.fechaHoraFin ? data.fechaHoraFin.toISOString() : null,
        latitud: data.latitud ? Number(data.latitud) : null,
        longitud: data.longitud ? Number(data.longitud) : null,
        profundidad: data.profundidad ? Number(data.profundidad) : null,
        temperatura: data.temperatura !== null && data.temperatura !== undefined ? Number(data.temperatura) : null,
        pesoTotal: data.pesoTotal ? Number(data.pesoTotal) : null,
        observaciones: data.observaciones?.trim() || null
      };
      if (cala?.id) {
        await actualizarCalaFaenaConsumo(cala.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cala actualizada correctamente'
        });
      } else {
        await crearCalaFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cala creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la cala'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cala-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Faena de Pesca Consumo */}
              <div className="col-12">
                <label htmlFor="faenaPescaConsumoId" className="block text-900 font-medium mb-2">
                  Faena de Pesca *
                </label>
                <Controller
                  name="faenaPescaConsumoId"
                  control={control}
                  rules={{ required: 'La faena es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="faenaPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={faenas}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una faena"
                      className={errors.faenaPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.faenaPescaConsumoId && (
                  <small className="p-error">{errors.faenaPescaConsumoId.message}</small>
                )}
              </div>

              {/* Número de Cala */}
              <div className="col-12 md:col-6">
                <label htmlFor="numeroCala" className="block text-900 font-medium mb-2">
                  Número de Cala
                </label>
                <Controller
                  name="numeroCala"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroCala"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: CALA-001, C-01, etc."
                    />
                  )}
                />
              </div>

              {/* Peso Total */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoTotal" className="block text-900 font-medium mb-2">
                  Peso Total (kg)
                </label>
                <Controller
                  name="pesoTotal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTotal"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Tiempos */}
          <TabPanel header="Fechas y Tiempos">
            <div className="grid">
              {/* Fecha/Hora de Inicio */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraInicio" className="block text-900 font-medium mb-2">
                  Fecha/Hora de Inicio
                </label>
                <Controller
                  name="fechaHoraInicio"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraInicio"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha/hora de inicio"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                    />
                  )}
                />
              </div>

              {/* Fecha/Hora de Fin */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraFin" className="block text-900 font-medium mb-2">
                  Fecha/Hora de Fin
                </label>
                <Controller
                  name="fechaHoraFin"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraFin"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha/hora de fin"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      minDate={fechaHoraInicio}
                    />
                  )}
                />
              </div>

              {/* Duración Calculada */}
              {fechaHoraInicio && fechaHoraFin && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h5 className="mb-2 text-blue-800">Duración de la Cala</h5>
                    <div className="text-2xl font-bold text-blue-600">
                      {calcularDuracion()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Ubicación y Condiciones */}
          <TabPanel header="Ubicación y Condiciones">
            <div className="grid">
              {/* Latitud */}
              <div className="col-12 md:col-6">
                <label htmlFor="latitud" className="block text-900 font-medium mb-2">
                  Latitud (grados)
                </label>
                <Controller
                  name="latitud"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="latitud"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="-12.046374"
                      min={-90}
                      max={90}
                      maxFractionDigits={6}
                      suffix="°"
                    />
                  )}
                />
                <small className="text-blue-600">Rango: -90° a 90° (negativo = Sur)</small>
              </div>

              {/* Longitud */}
              <div className="col-12 md:col-6">
                <label htmlFor="longitud" className="block text-900 font-medium mb-2">
                  Longitud (grados)
                </label>
                <Controller
                  name="longitud"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="longitud"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="-77.042793"
                      min={-180}
                      max={180}
                      maxFractionDigits={6}
                      suffix="°"
                    />
                  )}
                />
                <small className="text-blue-600">Rango: -180° a 180° (negativo = Oeste)</small>
              </div>

              {/* Coordenadas Formateadas */}
              {watch('latitud') && watch('longitud') && (
                <div className="col-12">
                  <div className="card p-3 bg-green-50">
                    <h6 className="mb-2 text-green-800">Coordenadas</h6>
                    <div className="text-lg font-bold text-green-600">
                      {formatearCoordenadas(watch('latitud'), watch('longitud'))}
                    </div>
                  </div>
                </div>
              )}

              {/* Profundidad */}
              <div className="col-12 md:col-6">
                <label htmlFor="profundidad" className="block text-900 font-medium mb-2">
                  Profundidad (metros)
                </label>
                <Controller
                  name="profundidad"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="profundidad"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0"
                      min={0}
                      maxFractionDigits={1}
                      suffix=" m"
                    />
                  )}
                />
              </div>

              {/* Temperatura */}
              <div className="col-12 md:col-6">
                <label htmlFor="temperatura" className="block text-900 font-medium mb-2">
                  Temperatura del Agua (°C)
                </label>
                <Controller
                  name="temperatura"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="temperatura"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="15.5"
                      min={-10}
                      max={50}
                      maxFractionDigits={1}
                      suffix="°C"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 4: Observaciones y Resumen */}
          <TabPanel header="Observaciones y Resumen">
            <div className="grid">
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
                      rows={5}
                      placeholder="Observaciones sobre la cala: condiciones del mar, especies encontradas, dificultades, etc."
                    />
                  )}
                />
              </div>

              {/* Resumen */}
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen de la Cala</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Faena:</strong> {
                        faenas.find(f => f.id === watch('faenaPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Número:</strong> {watch('numeroCala') || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>Peso Total:</strong> {
                        watch('pesoTotal') ? `${watch('pesoTotal')} kg` : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Duración:</strong> {calcularDuracion() || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>Profundidad:</strong> {
                        watch('profundidad') ? `${watch('profundidad')} m` : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Temperatura:</strong> {
                        watch('temperatura') !== null && watch('temperatura') !== undefined ? 
                        `${watch('temperatura')}°C` : 'Sin definir'
                      }
                    </div>
                    {watch('latitud') && watch('longitud') && (
                      <div className="col-12">
                        <strong>Ubicación:</strong> {formatearCoordenadas(watch('latitud'), watch('longitud'))}
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
            label={cala?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default CalaFaenaConsumoForm;