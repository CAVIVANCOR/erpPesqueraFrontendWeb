// src/components/detallePreFactura/DetallePreFacturaForm.jsx
// Formulario profesional para DetallePreFactura. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetallePreFactura, updateDetallePreFactura } from '../../api/detallePreFactura';

/**
 * Formulario para gestión de DetallePreFactura
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetallePreFacturaForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [preFacturas, setPreFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const toast = useRef(null);

  // Observar campos para cálculos automáticos
  const cantidad = watch('cantidad');
  const precioUnitario = watch('precioUnitario');
  const porcentajeIgv = watch('porcentajeIgv');
  
  // Cálculos automáticos
  const subtotal = (cantidad || 0) * (precioUnitario || 0);
  const igv = subtotal * ((porcentajeIgv || 0) / 100);
  const total = subtotal + igv;

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        preFacturaId: detalle.preFacturaId ? Number(detalle.preFacturaId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        centroCostoId: detalle.centroCostoId ? Number(detalle.centroCostoId) : null,
        cantidad: detalle.cantidad || 0,
        precioUnitario: detalle.precioUnitario || 0,
        subtotal: detalle.subtotal || 0,
        porcentajeIgv: detalle.porcentajeIgv || 18,
        igv: detalle.igv || 0,
        total: detalle.total || 0,
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        preFacturaId: null,
        productoId: null,
        centroCostoId: null,
        cantidad: 0,
        precioUnitario: 0,
        subtotal: 0,
        porcentajeIgv: 18, // IGV por defecto en Perú
        igv: 0,
        total: 0,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setPreFacturas([
        { id: 1, numero: 'PF-2024-001' },
        { id: 2, numero: 'PF-2024-002' },
        { id: 3, numero: 'PF-2024-003' }
      ]);
      
      setProductos([
        { id: 1, nombre: 'Pescado Fresco Premium', codigo: 'PES-001' },
        { id: 2, nombre: 'Harina de Pescado', codigo: 'HAR-001' },
        { id: 3, nombre: 'Aceite de Pescado', codigo: 'ACE-001' },
        { id: 4, nombre: 'Conservas de Atún', codigo: 'CON-001' },
        { id: 5, nombre: 'Filetes de Pescado', codigo: 'FIL-001' },
        { id: 6, nombre: 'Productos Congelados', codigo: 'CON-002' }
      ]);

      setCentrosCosto([
        { id: 1, nombre: 'Producción', codigo: 'PROD' },
        { id: 2, nombre: 'Ventas', codigo: 'VTA' },
        { id: 3, nombre: 'Administración', codigo: 'ADM' },
        { id: 4, nombre: 'Logística', codigo: 'LOG' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos y cálculos actualizados
      const payload = {
        preFacturaId: Number(data.preFacturaId),
        productoId: Number(data.productoId),
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        cantidad: Number(data.cantidad),
        precioUnitario: Number(data.precioUnitario),
        subtotal: subtotal,
        porcentajeIgv: Number(data.porcentajeIgv) || 18,
        igv: igv,
        total: total,
        observaciones: data.observaciones || null
      };

      console.log('Payload DetallePreFactura:', payload); // Log para depuración

      if (detalle?.id) {
        await updateDetallePreFactura(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await createDetallePreFactura(payload);
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
    <div className="detalle-pre-factura-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información del Producto */}
          <TabPanel header="Información del Producto">
            <div className="grid">
              {/* Pre-Factura */}
              <div className="col-12">
                <label htmlFor="preFacturaId" className="block text-900 font-medium mb-2">
                  Pre-Factura *
                </label>
                <Controller
                  name="preFacturaId"
                  control={control}
                  rules={{ required: 'La pre-factura es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="preFacturaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={preFacturas.map(pf => ({ ...pf, id: Number(pf.id) }))}
                      optionLabel="numero"
                      optionValue="id"
                      placeholder="Seleccione una pre-factura"
                      className={errors.preFacturaId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.preFacturaId && (
                  <small className="p-error">{errors.preFacturaId.message}</small>
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
                        nombreCompleto: `${p.codigo} - ${p.nombre}`
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

              {/* Centro de Costo */}
              <div className="col-12">
                <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
                  Centro de Costo
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={centrosCosto.map(cc => ({ 
                        ...cc, 
                        id: Number(cc.id),
                        nombreCompleto: `${cc.codigo} - ${cc.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un centro de costo"
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Cantidades y Precios */}
          <TabPanel header="Cantidades y Precios">
            <div className="grid">
              {/* Cantidad */}
              <div className="col-12 md:col-6">
                <label htmlFor="cantidad" className="block text-900 font-medium mb-2">
                  Cantidad *
                </label>
                <Controller
                  name="cantidad"
                  control={control}
                  rules={{ 
                    required: 'La cantidad es obligatoria',
                    min: { value: 0.01, message: 'La cantidad debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="cantidad"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="0.00"
                      className={errors.cantidad ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.cantidad && (
                  <small className="p-error">{errors.cantidad.message}</small>
                )}
              </div>

              {/* Precio Unitario */}
              <div className="col-12 md:col-6">
                <label htmlFor="precioUnitario" className="block text-900 font-medium mb-2">
                  Precio Unitario *
                </label>
                <Controller
                  name="precioUnitario"
                  control={control}
                  rules={{ 
                    required: 'El precio unitario es obligatorio',
                    min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="precioUnitario"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="S/ 0.00"
                      className={errors.precioUnitario ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.precioUnitario && (
                  <small className="p-error">{errors.precioUnitario.message}</small>
                )}
              </div>

              {/* Subtotal (Solo lectura) */}
              <div className="col-12 md:col-4">
                <label className="block text-900 font-medium mb-2">
                  Subtotal
                </label>
                <div className="p-inputtext p-component p-disabled">
                  S/ {subtotal.toFixed(2)}
                </div>
              </div>

              {/* Porcentaje IGV */}
              <div className="col-12 md:col-4">
                <label htmlFor="porcentajeIgv" className="block text-900 font-medium mb-2">
                  Porcentaje IGV
                </label>
                <Controller
                  name="porcentajeIgv"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="porcentajeIgv"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      max={100}
                      suffix="%"
                      placeholder="18.00%"
                    />
                  )}
                />
              </div>

              {/* IGV (Solo lectura) */}
              <div className="col-12 md:col-4">
                <label className="block text-900 font-medium mb-2">
                  IGV
                </label>
                <div className="p-inputtext p-component p-disabled">
                  S/ {igv.toFixed(2)}
                </div>
              </div>

              {/* Total (Solo lectura) */}
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">
                  <strong>Total (Incluye IGV)</strong>
                </label>
                <div className="p-inputtext p-component p-disabled" style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  S/ {total.toFixed(2)}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Observaciones */}
          <TabPanel header="Observaciones">
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
                      rows={6}
                      placeholder="Observaciones sobre el detalle de la pre-factura..."
                    />
                  )}
                />
              </div>

              {/* Resumen de Cálculos */}
              <div className="col-12">
                <div className="card p-3 bg-gray-50">
                  <h5 className="mb-3">Resumen de Cálculos</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Cantidad:</strong> {(cantidad || 0).toFixed(2)}
                    </div>
                    <div className="col-6">
                      <strong>Precio Unit.:</strong> S/ {(precioUnitario || 0).toFixed(2)}
                    </div>
                    <div className="col-6">
                      <strong>Subtotal:</strong> S/ {subtotal.toFixed(2)}
                    </div>
                    <div className="col-6">
                      <strong>IGV ({(porcentajeIgv || 0).toFixed(2)}%):</strong> S/ {igv.toFixed(2)}
                    </div>
                    <div className="col-12">
                      <div className="text-xl font-bold text-primary">
                        <strong>Total Final: S/ {total.toFixed(2)}</strong>
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

export default DetallePreFacturaForm;
