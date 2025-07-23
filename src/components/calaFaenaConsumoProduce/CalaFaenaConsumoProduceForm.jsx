// src/components/calaFaenaConsumoProduce/CalaFaenaConsumoProduceForm.jsx
// Formulario profesional para CalaFaenaConsumoProduce. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createCalaFaenaConsumoProduce, updateCalaFaenaConsumoProduce } from '../../api/calaFaenaConsumoProduce';

/**
 * Formulario para gestión de CalaFaenaConsumoProduce
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const CalaFaenaConsumoProduceForm = ({ produccion, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [calas, setCalas] = useState([]);
  const toast = useRef(null);

  // Observar tipo de producción para mostrar campos específicos
  const tipoProduccion = watch('tipoProduccion');
  const pesoProducido = watch('pesoProducido');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (produccion) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        calaFaenaConsumoId: produccion.calaFaenaConsumoId ? Number(produccion.calaFaenaConsumoId) : null,
        tipoProduccion: produccion.tipoProduccion || '',
        fechaProduccion: produccion.fechaProduccion ? new Date(produccion.fechaProduccion) : new Date(),
        pesoProducido: produccion.pesoProducido || null,
        temperaturaAlmacenamiento: produccion.temperaturaAlmacenamiento || null,
        calidad: produccion.calidad || '',
        observaciones: produccion.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        calaFaenaConsumoId: null,
        tipoProduccion: '',
        fechaProduccion: new Date(),
        pesoProducido: null,
        temperaturaAlmacenamiento: null,
        calidad: '',
        observaciones: ''
      });
    }
  }, [produccion, reset]);

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
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const getTipoProduccionInfo = (tipo) => {
    const tipos = {
      'FRESCO': {
        label: 'Fresco',
        descripcion: 'Pescado fresco para consumo directo',
        tempRecomendada: { min: 0, max: 4 },
        color: 'text-green-600'
      },
      'CONGELADO': {
        label: 'Congelado',
        descripcion: 'Pescado congelado para conservación',
        tempRecomendada: { min: -18, max: -15 },
        color: 'text-blue-600'
      },
      'CONSERVA': {
        label: 'Conserva',
        descripcion: 'Pescado procesado en conserva',
        tempRecomendada: { min: 15, max: 25 },
        color: 'text-orange-600'
      },
      'HARINA': {
        label: 'Harina de Pescado',
        descripcion: 'Harina para alimento balanceado',
        tempRecomendada: { min: 15, max: 30 },
        color: 'text-gray-600'
      },
      'ACEITE': {
        label: 'Aceite de Pescado',
        descripcion: 'Aceite extraído del pescado',
        tempRecomendada: { min: 10, max: 25 },
        color: 'text-yellow-600'
      }
    };
    return tipos[tipo] || null;
  };

  const getCalidadInfo = (calidad) => {
    const calidades = {
      'PREMIUM': {
        label: 'Premium',
        descripcion: 'Calidad superior, excelente para exportación',
        color: 'text-green-600'
      },
      'PRIMERA': {
        label: 'Primera',
        descripcion: 'Buena calidad, apta para mercado nacional',
        color: 'text-blue-600'
      },
      'SEGUNDA': {
        label: 'Segunda',
        descripcion: 'Calidad regular, para procesamiento',
        color: 'text-orange-600'
      },
      'TERCERA': {
        label: 'Tercera',
        descripcion: 'Calidad básica, para harina o aceite',
        color: 'text-red-600'
      }
    };
    return calidades[calidad] || null;
  };

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearTemperatura = (temp) => {
    if (temp === null || temp === undefined) return '';
    return `${temp}°C`;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar peso producido
      if (!data.pesoProducido || data.pesoProducido <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso producido debe ser mayor a cero'
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        calaFaenaConsumoId: Number(data.calaFaenaConsumoId),
        tipoProduccion: data.tipoProduccion,
        fechaProduccion: data.fechaProduccion ? data.fechaProduccion.toISOString() : new Date().toISOString(),
        pesoProducido: Number(data.pesoProducido),
        temperaturaAlmacenamiento: data.temperaturaAlmacenamiento !== null && data.temperaturaAlmacenamiento !== undefined ? Number(data.temperaturaAlmacenamiento) : null,
        calidad: data.calidad || null,
        observaciones: data.observaciones?.trim() || null
      };

      console.log('Payload CalaFaenaConsumoProduce:', payload); // Log para depuración

      if (produccion?.id) {
        await updateCalaFaenaConsumoProduce(produccion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producción actualizada correctamente'
        });
      } else {
        await createCalaFaenaConsumoProduce(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producción creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la producción'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cala-faena-consumo-produce-form">
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

              {/* Tipo de Producción */}
              <div className="col-12 md:col-6">
                <label htmlFor="tipoProduccion" className="block text-900 font-medium mb-2">
                  Tipo de Producción *
                </label>
                <Controller
                  name="tipoProduccion"
                  control={control}
                  rules={{ required: 'El tipo de producción es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoProduccion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Fresco', value: 'FRESCO' },
                        { label: 'Congelado', value: 'CONGELADO' },
                        { label: 'Conserva', value: 'CONSERVA' },
                        { label: 'Harina de Pescado', value: 'HARINA' },
                        { label: 'Aceite de Pescado', value: 'ACEITE' }
                      ]}
                      placeholder="Seleccione tipo de producción"
                      className={errors.tipoProduccion ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.tipoProduccion && (
                  <small className="p-error">{errors.tipoProduccion.message}</small>
                )}
              </div>

              {/* Fecha de Producción */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaProduccion" className="block text-900 font-medium mb-2">
                  Fecha de Producción *
                </label>
                <Controller
                  name="fechaProduccion"
                  control={control}
                  rules={{ required: 'La fecha es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaProduccion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      className={errors.fechaProduccion ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaProduccion && (
                  <small className="p-error">{errors.fechaProduccion.message}</small>
                )}
              </div>

              {/* Información del Tipo de Producción */}
              {tipoProduccion && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Información del Tipo de Producción</h6>
                    <div className={`text-lg font-bold ${getTipoProduccionInfo(tipoProduccion)?.color}`}>
                      {getTipoProduccionInfo(tipoProduccion)?.label}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {getTipoProduccionInfo(tipoProduccion)?.descripcion}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      <strong>Temperatura recomendada:</strong> {
                        getTipoProduccionInfo(tipoProduccion)?.tempRecomendada ? 
                        `${getTipoProduccionInfo(tipoProduccion).tempRecomendada.min}°C a ${getTipoProduccionInfo(tipoProduccion).tempRecomendada.max}°C` :
                        'No especificada'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 2: Peso y Temperatura */}
          <TabPanel header="Peso y Temperatura">
            <div className="grid">
              {/* Peso Producido */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoProducido" className="block text-900 font-medium mb-2">
                  Peso Producido (kg) *
                </label>
                <Controller
                  name="pesoProducido"
                  control={control}
                  rules={{ 
                    required: 'El peso es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a cero' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoProducido"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                      className={errors.pesoProducido ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoProducido && (
                  <small className="p-error">{errors.pesoProducido.message}</small>
                )}
              </div>

              {/* Temperatura de Almacenamiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="temperaturaAlmacenamiento" className="block text-900 font-medium mb-2">
                  Temperatura de Almacenamiento (°C)
                </label>
                <Controller
                  name="temperaturaAlmacenamiento"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="temperaturaAlmacenamiento"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0"
                      min={-30}
                      max={50}
                      maxFractionDigits={1}
                      suffix="°C"
                    />
                  )}
                />
                {tipoProduccion && getTipoProduccionInfo(tipoProduccion)?.tempRecomendada && (
                  <small className="text-blue-600">
                    Recomendado: {getTipoProduccionInfo(tipoProduccion).tempRecomendada.min}°C a {getTipoProduccionInfo(tipoProduccion).tempRecomendada.max}°C
                  </small>
                )}
              </div>

              {/* Vista previa del peso */}
              {pesoProducido > 0 && (
                <div className="col-12">
                  <div className="card p-3 bg-green-50">
                    <h6 className="mb-2 text-green-800">Resumen de Producción</h6>
                    <div className="grid">
                      <div className="col-4">
                        <strong>Peso Producido:</strong>
                        <div className="text-xl font-bold text-green-600">
                          {formatearPeso(pesoProducido)}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Tipo:</strong>
                        <div className={`text-lg font-bold ${getTipoProduccionInfo(tipoProduccion)?.color}`}>
                          {getTipoProduccionInfo(tipoProduccion)?.label || tipoProduccion}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Temperatura:</strong>
                        <div className="text-lg font-bold text-blue-600">
                          {watch('temperaturaAlmacenamiento') !== null && watch('temperaturaAlmacenamiento') !== undefined ? 
                            formatearTemperatura(watch('temperaturaAlmacenamiento')) : 
                            'Sin especificar'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Calidad y Observaciones */}
          <TabPanel header="Calidad y Observaciones">
            <div className="grid">
              {/* Calidad */}
              <div className="col-12 md:col-6">
                <label htmlFor="calidad" className="block text-900 font-medium mb-2">
                  Calidad del Producto
                </label>
                <Controller
                  name="calidad"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="calidad"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Premium', value: 'PREMIUM' },
                        { label: 'Primera', value: 'PRIMERA' },
                        { label: 'Segunda', value: 'SEGUNDA' },
                        { label: 'Tercera', value: 'TERCERA' }
                      ]}
                      placeholder="Seleccione calidad"
                    />
                  )}
                />
              </div>

              {/* Información de Calidad */}
              {watch('calidad') && (
                <div className="col-12 md:col-6">
                  <div className="card p-3 bg-gray-50">
                    <h6 className="mb-2 text-gray-800">Información de Calidad</h6>
                    <div className={`text-lg font-bold ${getCalidadInfo(watch('calidad'))?.color}`}>
                      {getCalidadInfo(watch('calidad'))?.label}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {getCalidadInfo(watch('calidad'))?.descripcion}
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
                      rows={5}
                      placeholder="Observaciones sobre la producción: proceso utilizado, condiciones especiales, control de calidad, etc."
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
                  <h5 className="mb-3">Resumen de la Producción</h5>
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
                      <strong>Tipo de Producción:</strong> 
                      <span className={`ml-2 font-bold ${getTipoProduccionInfo(tipoProduccion)?.color}`}>
                        {getTipoProduccionInfo(tipoProduccion)?.label || tipoProduccion || 'Sin definir'}
                      </span>
                    </div>
                    <div className="col-6">
                      <strong>Peso Producido:</strong> {formatearPeso(pesoProducido)}
                    </div>
                    <div className="col-6">
                      <strong>Fecha:</strong> {
                        watch('fechaProduccion') ? 
                        watch('fechaProduccion').toLocaleString('es-PE') : 
                        'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Temperatura:</strong> {
                        watch('temperaturaAlmacenamiento') !== null && watch('temperaturaAlmacenamiento') !== undefined ? 
                        formatearTemperatura(watch('temperaturaAlmacenamiento')) : 
                        'Sin especificar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Calidad:</strong> 
                      <span className={`ml-2 font-bold ${getCalidadInfo(watch('calidad'))?.color}`}>
                        {getCalidadInfo(watch('calidad'))?.label || watch('calidad') || 'Sin definir'}
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
            label={produccion?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default CalaFaenaConsumoProduceForm;
