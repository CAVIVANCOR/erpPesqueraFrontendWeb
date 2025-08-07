// src/components/detCalaFaenaConsumoProduce/DetCalaFaenaConsumoProduceForm.jsx
// Formulario profesional para DetCalaFaenaConsumoProduce. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetCalaFaenaConsumoProduce, updateDetCalaFaenaConsumoProduce } from '../../api/detCalaFaenaConsumoProduce';

/**
 * Formulario para gestión de DetCalaFaenaConsumoProduce
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetCalaFaenaConsumoProduceForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const toast = useRef(null);

  // Observar valores para cálculos automáticos
  const pesoProducto = watch('pesoProducto');
  const rendimiento = watch('rendimiento');
  const merma = watch('merma');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        calaFaenaConsumoProduceId: detalle.calaFaenaConsumoProduceId ? Number(detalle.calaFaenaConsumoProduceId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        pesoProducto: detalle.pesoProducto || null,
        porcentajeProducto: detalle.porcentajeProducto || null,
        rendimiento: detalle.rendimiento || null,
        merma: detalle.merma || null,
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        calaFaenaConsumoProduceId: null,
        productoId: null,
        pesoProducto: null,
        porcentajeProducto: null,
        rendimiento: null,
        merma: null,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setProducciones([
        { id: 1, tipoProduccion: 'FRESCO', pesoProducido: 1200.50, calidad: 'PREMIUM' },
        { id: 2, tipoProduccion: 'CONGELADO', pesoProducido: 1800.75, calidad: 'PRIMERA' },
        { id: 3, tipoProduccion: 'CONSERVA', pesoProducido: 950.25, calidad: 'PRIMERA' },
        { id: 4, tipoProduccion: 'HARINA', pesoProducido: 2200.00, calidad: 'SEGUNDA' }
      ]);

      setProductos([
        { id: 1, codigo: 'PROD001', nombre: 'Filete de Anchoveta Fresco', categoria: 'Fresco', unidadMedida: 'kg' },
        { id: 2, codigo: 'PROD002', nombre: 'Jurel Entero Congelado', categoria: 'Congelado', unidadMedida: 'kg' },
        { id: 3, codigo: 'PROD003', nombre: 'Conserva de Caballa', categoria: 'Conserva', unidadMedida: 'lata' },
        { id: 4, codigo: 'PROD004', nombre: 'Harina de Pescado Premium', categoria: 'Harina', unidadMedida: 'kg' },
        { id: 5, codigo: 'PROD005', nombre: 'Aceite de Pescado Refinado', categoria: 'Aceite', unidadMedida: 'litro' },
        { id: 6, codigo: 'PROD006', nombre: 'Perico Fresco Exportación', categoria: 'Fresco', unidadMedida: 'kg' },
        { id: 7, codigo: 'PROD007', nombre: 'Bonito en Conserva', categoria: 'Conserva', unidadMedida: 'lata' },
        { id: 8, codigo: 'PROD008', nombre: 'Sardina Congelada', categoria: 'Congelado', unidadMedida: 'kg' }
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
    const produccionSeleccionada = producciones.find(p => p.id === watch('calaFaenaConsumoProduceId'));
    if (!produccionSeleccionada || !pesoProducto || !produccionSeleccionada.pesoProducido) return null;
    
    return (pesoProducto / produccionSeleccionada.pesoProducido) * 100;
  };

  const getRendimientoColor = (rendimiento) => {
    if (!rendimiento) return 'text-gray-600';
    if (rendimiento >= 80) return 'text-green-600';
    if (rendimiento >= 60) return 'text-blue-600';
    if (rendimiento >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMermaColor = (merma) => {
    if (!merma) return 'text-gray-600';
    if (merma <= 5) return 'text-green-600';
    if (merma <= 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRendimientoDescripcion = (rendimiento) => {
    if (!rendimiento) return '';
    if (rendimiento >= 80) return 'Excelente rendimiento';
    if (rendimiento >= 60) return 'Buen rendimiento';
    if (rendimiento >= 40) return 'Rendimiento regular';
    return 'Bajo rendimiento';
  };

  const getMermaDescripcion = (merma) => {
    if (!merma) return '';
    if (merma <= 5) return 'Merma baja - Excelente proceso';
    if (merma <= 15) return 'Merma normal - Proceso estándar';
    return 'Merma alta - Revisar proceso';
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
      
      // Validar peso del producto
      if (!data.pesoProducto || data.pesoProducto <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso del producto debe ser mayor a cero'
        });
        return;
      }
      
      // Validar que rendimiento + merma no excedan 100%
      if (data.rendimiento && data.merma && (data.rendimiento + data.merma) > 100) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'La suma de rendimiento y merma no puede exceder 100%'
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        calaFaenaConsumoProduceId: Number(data.calaFaenaConsumoProduceId),
        productoId: Number(data.productoId),
        pesoProducto: Number(data.pesoProducto),
        porcentajeProducto: data.porcentajeProducto ? Number(data.porcentajeProducto) : null,
        rendimiento: data.rendimiento ? Number(data.rendimiento) : null,
        merma: data.merma ? Number(data.merma) : null,
        observaciones: data.observaciones?.trim() || null
      };

      // Si no se especificó porcentaje, calcularlo automáticamente
      if (!payload.porcentajeProducto) {
        const porcentajeCalculado = calcularPorcentajeAutomatico();
        if (porcentajeCalculado) {
          payload.porcentajeProducto = Number(porcentajeCalculado.toFixed(2));
        }
      }
      if (detalle?.id) {
        await updateDetCalaFaenaConsumoProduce(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await createDetCalaFaenaConsumoProduce(payload);
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
    <div className="det-cala-faena-consumo-produce-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Producción de Cala */}
              <div className="col-12">
                <label htmlFor="calaFaenaConsumoProduceId" className="block text-900 font-medium mb-2">
                  Producción de Cala *
                </label>
                <Controller
                  name="calaFaenaConsumoProduceId"
                  control={control}
                  rules={{ required: 'La producción es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="calaFaenaConsumoProduceId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={producciones.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.id} - ${p.tipoProduccion} (${formatearPeso(p.pesoProducido)}) - ${p.calidad}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una producción"
                      className={errors.calaFaenaConsumoProduceId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.calaFaenaConsumoProduceId && (
                  <small className="p-error">{errors.calaFaenaConsumoProduceId.message}</small>
                )}
              </div>

              {/* Producto */}
              <div className="col-12">
                <label htmlFor="productoId" className="block text-900 font-medium mb-2">
                  Producto *
                </label>
                <Controller
                  name="productoId"
                  control={control}
                  rules={{ required: 'El producto es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="productoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={productos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.codigo} - ${p.nombre} (${p.categoria}) - ${p.unidadMedida}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un producto"
                      className={errors.productoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.productoId && (
                  <small className="p-error">{errors.productoId.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Peso y Porcentaje */}
          <TabPanel header="Peso y Porcentaje">
            <div className="grid">
              {/* Peso del Producto */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoProducto" className="block text-900 font-medium mb-2">
                  Peso del Producto (kg) *
                </label>
                <Controller
                  name="pesoProducto"
                  control={control}
                  rules={{ 
                    required: 'El peso es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a cero' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoProducto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                      className={errors.pesoProducto ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoProducto && (
                  <small className="p-error">{errors.pesoProducto.message}</small>
                )}
              </div>

              {/* Porcentaje del Producto */}
              <div className="col-12 md:col-6">
                <label htmlFor="porcentajeProducto" className="block text-900 font-medium mb-2">
                  Porcentaje del Producto (%)
                </label>
                <Controller
                  name="porcentajeProducto"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="porcentajeProducto"
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
                  Si no se especifica, se calculará automáticamente basado en el peso total de la producción
                </small>
              </div>

              {/* Cálculo Automático de Porcentaje */}
              {pesoProducto && watch('calaFaenaConsumoProduceId') && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Cálculo Automático</h6>
                    <div className="grid">
                      <div className="col-4">
                        <strong>Peso Producto:</strong>
                        <div className="text-lg font-bold text-green-600">
                          {formatearPeso(pesoProducto)}
                        </div>
                      </div>
                      <div className="col-4">
                        <strong>Peso Total Producción:</strong>
                        <div className="text-lg font-bold text-blue-600">
                          {(() => {
                            const prod = producciones.find(p => p.id === watch('calaFaenaConsumoProduceId'));
                            return prod ? formatearPeso(prod.pesoProducido) : '0.00 kg';
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

          {/* Pestaña 3: Rendimiento y Merma */}
          <TabPanel header="Rendimiento y Merma">
            <div className="grid">
              {/* Rendimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="rendimiento" className="block text-900 font-medium mb-2">
                  Rendimiento (%)
                </label>
                <Controller
                  name="rendimiento"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="rendimiento"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0"
                      min={0}
                      max={100}
                      maxFractionDigits={1}
                      suffix="%"
                    />
                  )}
                />
                <small className="text-blue-600">
                  Porcentaje de aprovechamiento del producto
                </small>
              </div>

              {/* Merma */}
              <div className="col-12 md:col-6">
                <label htmlFor="merma" className="block text-900 font-medium mb-2">
                  Merma (%)
                </label>
                <Controller
                  name="merma"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="merma"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0"
                      min={0}
                      max={100}
                      maxFractionDigits={1}
                      suffix="%"
                    />
                  )}
                />
                <small className="text-blue-600">
                  Porcentaje de pérdida durante el procesamiento
                </small>
              </div>

              {/* Información de Rendimiento y Merma */}
              {(rendimiento || merma) && (
                <div className="col-12">
                  <div className="card p-3 bg-gray-50">
                    <h6 className="mb-2 text-gray-800">Análisis de Eficiencia</h6>
                    <div className="grid">
                      {rendimiento && (
                        <div className="col-6">
                          <strong>Rendimiento:</strong>
                          <div className={`text-lg font-bold ${getRendimientoColor(rendimiento)}`}>
                            {formatearPorcentaje(rendimiento)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getRendimientoDescripcion(rendimiento)}
                          </div>
                        </div>
                      )}
                      {merma && (
                        <div className="col-6">
                          <strong>Merma:</strong>
                          <div className={`text-lg font-bold ${getMermaColor(merma)}`}>
                            {formatearPorcentaje(merma)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getMermaDescripcion(merma)}
                          </div>
                        </div>
                      )}
                      {rendimiento && merma && (
                        <div className="col-12 mt-2">
                          <strong>Total Contabilizado:</strong>
                          <div className={`text-lg font-bold ${(rendimiento + merma) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatearPorcentaje(rendimiento + merma)}
                            {(rendimiento + merma) > 100 && ' (¡Excede 100%!)'}
                          </div>
                        </div>
                      )}
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
                      placeholder="Observaciones sobre el producto: proceso de elaboración, calidad, condiciones especiales, etc."
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
                  <h5 className="mb-3">Resumen del Detalle de Producción</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Producción:</strong> {
                        (() => {
                          const prod = producciones.find(p => p.id === watch('calaFaenaConsumoProduceId'));
                          return prod ? `${prod.tipoProduccion} (${prod.calidad})` : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Producto:</strong> {
                        (() => {
                          const producto = productos.find(p => p.id === watch('productoId'));
                          return producto ? producto.nombre : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Peso:</strong> {formatearPeso(pesoProducto)}
                    </div>
                    <div className="col-6">
                      <strong>Porcentaje:</strong> {
                        watch('porcentajeProducto') ? 
                        formatearPorcentaje(watch('porcentajeProducto')) : 
                        (calcularPorcentajeAutomatico() ? 
                          `${formatearPorcentaje(calcularPorcentajeAutomatico())} (calculado)` : 
                          'Sin definir')
                      }
                    </div>
                    <div className="col-6">
                      <strong>Rendimiento:</strong> 
                      <span className={`ml-2 font-bold ${getRendimientoColor(rendimiento)}`}>
                        {rendimiento ? formatearPorcentaje(rendimiento) : 'Sin definir'}
                      </span>
                    </div>
                    <div className="col-6">
                      <strong>Merma:</strong> 
                      <span className={`ml-2 font-bold ${getMermaColor(merma)}`}>
                        {merma ? formatearPorcentaje(merma) : 'Sin definir'}
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

export default DetCalaFaenaConsumoProduceForm;
