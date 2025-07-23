// src/components/detDescargaFaenaConsumo/DetDescargaFaenaConsumoForm.jsx
// Formulario profesional para DetDescargaFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { createDetDescargaFaenaConsumo, updateDetDescargaFaenaConsumo } from '../../api/detDescargaFaenaConsumo';

/**
 * Formulario para gestión de DetDescargaFaenaConsumo
 * Organizado en pestañas para mejor UX
 */
const DetDescargaFaenaConsumoForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [descargas, setDescargas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const toast = useRef(null);

  const pesoBruto = watch('pesoBruto');
  const pesoTara = watch('pesoTara');
  const precioUnitario = watch('precioUnitario');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      reset({
        descargaFaenaConsumoId: detalle.descargaFaenaConsumoId ? Number(detalle.descargaFaenaConsumoId) : null,
        especieId: detalle.especieId ? Number(detalle.especieId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        cantidadCajas: detalle.cantidadCajas || null,
        pesoBruto: detalle.pesoBruto || null,
        pesoNeto: detalle.pesoNeto || null,
        pesoTara: detalle.pesoTara || null,
        talla: detalle.talla || '',
        calibre: detalle.calibre || '',
        presentacion: detalle.presentacion || 'ENTERO',
        gradoFrescura: detalle.gradoFrescura || 'A',
        porcentajeHielo: detalle.porcentajeHielo || null,
        loteProduccion: detalle.loteProduccion || '',
        codigoTrazabilidad: detalle.codigoTrazabilidad || '',
        fechaCaptura: detalle.fechaCaptura ? new Date(detalle.fechaCaptura) : null,
        zonaCaptura: detalle.zonaCaptura || '',
        destinoProducto: detalle.destinoProducto || 'MERCADO_NACIONAL',
        clienteDestino: detalle.clienteDestino ? Number(detalle.clienteDestino) : null,
        precioUnitario: detalle.precioUnitario || null,
        observaciones: detalle.observaciones || ''
      });
    } else {
      reset({
        descargaFaenaConsumoId: null,
        especieId: null,
        productoId: null,
        cantidadCajas: null,
        pesoBruto: null,
        pesoNeto: null,
        pesoTara: null,
        talla: '',
        calibre: '',
        presentacion: 'ENTERO',
        gradoFrescura: 'A',
        porcentajeHielo: null,
        loteProduccion: '',
        codigoTrazabilidad: '',
        fechaCaptura: null,
        zonaCaptura: '',
        destinoProducto: 'MERCADO_NACIONAL',
        clienteDestino: null,
        precioUnitario: null,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setDescargas([
        { id: 1, numeroDescarga: 'DESC-2024-001', fechaDescarga: '2024-01-15', embarcacion: 'Don Lucho I' },
        { id: 2, numeroDescarga: 'DESC-2024-002', fechaDescarga: '2024-01-18', embarcacion: 'María del Carmen' }
      ]);

      setEspecies([
        { id: 1, nombreCientifico: 'Engraulis ringens', nombreComun: 'Anchoveta', familia: 'Engraulidae' },
        { id: 2, nombreCientifico: 'Trachurus murphyi', nombreComun: 'Jurel', familia: 'Carangidae' },
        { id: 3, nombreCientifico: 'Scomber japonicus', nombreComun: 'Caballa', familia: 'Scombridae' }
      ]);

      setProductos([
        { id: 1, codigo: 'PROD001', nombre: 'Filete de Anchoveta Fresco', categoria: 'Fresco' },
        { id: 2, codigo: 'PROD002', nombre: 'Jurel Entero Congelado', categoria: 'Congelado' }
      ]);

      setClientes([
        { id: 1, razonSocial: 'Distribuidora Marina S.A.C.', nombreComercial: 'DIMASA', ruc: '20123456789' },
        { id: 2, razonSocial: 'Exportadora del Pacífico S.A.', nombreComercial: 'EXPACIFIC', ruc: '20987654321' }
      ]);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const calcularPesoNeto = () => {
    if (!pesoBruto) return null;
    const tara = pesoTara || 0;
    return pesoBruto - tara;
  };

  const calcularValorTotal = () => {
    const pesoNeto = calcularPesoNeto();
    if (!precioUnitario || !pesoNeto) return null;
    return precioUnitario * pesoNeto;
  };

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearPrecio = (precio) => {
    if (!precio) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(precio);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (!data.pesoBruto || data.pesoBruto <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso bruto debe ser mayor a cero'
        });
        return;
      }

      const pesoNetoCalculado = calcularPesoNeto();
      if (pesoNetoCalculado <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso neto debe ser mayor a cero'
        });
        return;
      }
      
      const payload = {
        descargaFaenaConsumoId: Number(data.descargaFaenaConsumoId),
        especieId: Number(data.especieId),
        productoId: data.productoId ? Number(data.productoId) : null,
        cantidadCajas: data.cantidadCajas ? Number(data.cantidadCajas) : null,
        pesoBruto: Number(data.pesoBruto),
        pesoNeto: Number(pesoNetoCalculado),
        pesoTara: data.pesoTara ? Number(data.pesoTara) : null,
        talla: data.talla?.trim() || null,
        calibre: data.calibre?.trim() || null,
        presentacion: data.presentacion || 'ENTERO',
        gradoFrescura: data.gradoFrescura || 'A',
        porcentajeHielo: data.porcentajeHielo ? Number(data.porcentajeHielo) : null,
        loteProduccion: data.loteProduccion?.trim() || null,
        codigoTrazabilidad: data.codigoTrazabilidad?.trim() || null,
        fechaCaptura: data.fechaCaptura || null,
        zonaCaptura: data.zonaCaptura?.trim() || null,
        destinoProducto: data.destinoProducto || 'MERCADO_NACIONAL',
        clienteDestino: data.clienteDestino ? Number(data.clienteDestino) : null,
        precioUnitario: data.precioUnitario ? Number(data.precioUnitario) : null,
        valorTotal: calcularValorTotal() ? Number(calcularValorTotal().toFixed(2)) : null,
        observaciones: data.observaciones?.trim() || null
      };

      console.log('Payload DetDescargaFaenaConsumo:', payload);

      if (detalle?.id) {
        await updateDetDescargaFaenaConsumo(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await createDetDescargaFaenaConsumo(payload);
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
    <div className="det-descarga-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          <TabPanel header="Información General">
            <div className="grid">
              <div className="col-12">
                <label htmlFor="descargaFaenaConsumoId" className="block text-900 font-medium mb-2">
                  Descarga de Faena *
                </label>
                <Controller
                  name="descargaFaenaConsumoId"
                  control={control}
                  rules={{ required: 'La descarga es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="descargaFaenaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={descargas.map(d => ({ 
                        ...d, 
                        id: Number(d.id),
                        nombreCompleto: `${d.numeroDescarga} - ${d.embarcacion} (${d.fechaDescarga})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una descarga"
                      className={errors.descargaFaenaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.descargaFaenaConsumoId && (
                  <small className="p-error">{errors.descargaFaenaConsumoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
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
                        nombreCompleto: `${e.nombreComun} (${e.nombreCientifico})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione especie"
                      className={errors.especieId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.especieId && (
                  <small className="p-error">{errors.especieId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="productoId" className="block text-900 font-medium mb-2">
                  Producto
                </label>
                <Controller
                  name="productoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="productoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={productos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.codigo} - ${p.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione producto"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="presentacion" className="block text-900 font-medium mb-2">
                  Presentación
                </label>
                <Controller
                  name="presentacion"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="presentacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Entero', value: 'ENTERO' },
                        { label: 'Filete', value: 'FILETE' },
                        { label: 'Trozo', value: 'TROZO' },
                        { label: 'Pulpa', value: 'PULPA' }
                      ]}
                      placeholder="Seleccione presentación"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="talla" className="block text-900 font-medium mb-2">
                  Talla
                </label>
                <Controller
                  name="talla"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="talla"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: Grande, Mediana"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="calibre" className="block text-900 font-medium mb-2">
                  Calibre
                </label>
                <Controller
                  name="calibre"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="calibre"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: 1, 2, 3"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Pesos y Calidad">
            <div className="grid">
              <div className="col-12 md:col-4">
                <label htmlFor="cantidadCajas" className="block text-900 font-medium mb-2">
                  Cantidad de Cajas
                </label>
                <Controller
                  name="cantidadCajas"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="cantidadCajas"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0"
                      min={0}
                      maxFractionDigits={0}
                      suffix=" cajas"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="pesoBruto" className="block text-900 font-medium mb-2">
                  Peso Bruto (kg) *
                </label>
                <Controller
                  name="pesoBruto"
                  control={control}
                  rules={{ 
                    required: 'El peso bruto es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a cero' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoBruto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                      className={errors.pesoBruto ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoBruto && (
                  <small className="p-error">{errors.pesoBruto.message}</small>
                )}
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="pesoTara" className="block text-900 font-medium mb-2">
                  Peso Tara (kg)
                </label>
                <Controller
                  name="pesoTara"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTara"
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

              {pesoBruto && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h6 className="mb-2 text-blue-800">Cálculos Automáticos</h6>
                    <div className="grid">
                      <div className="col-6">
                        <strong>Peso Neto:</strong>
                        <div className="text-lg font-bold text-green-600">
                          {formatearPeso(calcularPesoNeto())}
                        </div>
                      </div>
                      {precioUnitario && (
                        <div className="col-6">
                          <strong>Valor Total:</strong>
                          <div className="text-lg font-bold text-orange-600">
                            {formatearPrecio(calcularValorTotal())}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="col-12 md:col-4">
                <label htmlFor="gradoFrescura" className="block text-900 font-medium mb-2">
                  Grado de Frescura
                </label>
                <Controller
                  name="gradoFrescura"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="gradoFrescura"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'A - Excelente', value: 'A' },
                        { label: 'B - Bueno', value: 'B' },
                        { label: 'C - Regular', value: 'C' }
                      ]}
                      placeholder="Seleccione grado"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="porcentajeHielo" className="block text-900 font-medium mb-2">
                  Porcentaje de Hielo (%)
                </label>
                <Controller
                  name="porcentajeHielo"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="porcentajeHielo"
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
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="precioUnitario" className="block text-900 font-medium mb-2">
                  Precio Unitario (S/)
                </label>
                <Controller
                  name="precioUnitario"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="precioUnitario"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0000"
                      min={0}
                      maxFractionDigits={4}
                      prefix="S/ "
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Trazabilidad">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="loteProduccion" className="block text-900 font-medium mb-2">
                  Lote de Producción
                </label>
                <Controller
                  name="loteProduccion"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="loteProduccion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: LOTE-2024-001"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="codigoTrazabilidad" className="block text-900 font-medium mb-2">
                  Código de Trazabilidad
                </label>
                <Controller
                  name="codigoTrazabilidad"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="codigoTrazabilidad"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: TRZ-2024-001"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaCaptura" className="block text-900 font-medium mb-2">
                  Fecha de Captura
                </label>
                <Controller
                  name="fechaCaptura"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaCaptura"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="Seleccione fecha"
                      showIcon
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="zonaCaptura" className="block text-900 font-medium mb-2">
                  Zona de Captura
                </label>
                <Controller
                  name="zonaCaptura"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="zonaCaptura"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: Zona Norte, Paita"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="destinoProducto" className="block text-900 font-medium mb-2">
                  Destino del Producto
                </label>
                <Controller
                  name="destinoProducto"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="destinoProducto"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Exportación', value: 'EXPORTACION' },
                        { label: 'Mercado Nacional', value: 'MERCADO_NACIONAL' },
                        { label: 'Industrial', value: 'INDUSTRIAL' }
                      ]}
                      placeholder="Seleccione destino"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="clienteDestino" className="block text-900 font-medium mb-2">
                  Cliente Destino
                </label>
                <Controller
                  name="clienteDestino"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="clienteDestino"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={clientes.map(c => ({ 
                        ...c, 
                        id: Number(c.id),
                        nombreCompleto: `${c.razonSocial} (${c.nombreComercial})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione cliente"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

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
                      placeholder="Observaciones sobre el detalle: calidad, defectos, condiciones especiales, etc."
                    />
                  )}
                />
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

export default DetDescargaFaenaConsumoForm;
