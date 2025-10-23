// src/components/detalleOrdenCompra/DetalleOrdenCompraForm.jsx
// Formulario profesional para DetalleOrdenCompra. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearDetalleOrdenCompra, actualizarDetalleOrdenCompra } from '../../api/detalleOrdenCompra';

/**
 * Formulario para gestión de DetalleOrdenCompra
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetalleOrdenCompraForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const toast = useRef(null);

  // Observar cantidad y precio unitario para calcular subtotal
  const cantidadPedida = watch('cantidadPedida');
  const precioUnitario = watch('precioUnitario');
  const subtotal = (cantidadPedida || 0) * (precioUnitario || 0);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        ordenCompraId: detalle.ordenCompraId ? Number(detalle.ordenCompraId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        descripcion: detalle.descripcion || '',
        cantidadPedida: detalle.cantidadPedida || 0,
        cantidadRecibida: detalle.cantidadRecibida || 0,
        unidadMedidaId: detalle.unidadMedidaId ? Number(detalle.unidadMedidaId) : null,
        precioUnitario: detalle.precioUnitario || 0,
        fechaEntregaRequerida: detalle.fechaEntregaRequerida ? new Date(detalle.fechaEntregaRequerida) : null,
        fechaEntregaReal: detalle.fechaEntregaReal ? new Date(detalle.fechaEntregaReal) : null,
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        ordenCompraId: null,
        productoId: null,
        descripcion: '',
        cantidadPedida: 0,
        cantidadRecibida: 0,
        unidadMedidaId: null,
        precioUnitario: 0,
        fechaEntregaRequerida: null,
        fechaEntregaReal: null,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setOrdenesCompra([
        { id: 1, numero: 'OC-2024-001' },
        { id: 2, numero: 'OC-2024-002' },
        { id: 3, numero: 'OC-2024-003' }
      ]);
      
      setProductos([
        { id: 1, nombre: 'Aceite Motor 15W40', codigo: 'ACE-001' },
        { id: 2, nombre: 'Filtro de Aceite', codigo: 'FIL-001' },
        { id: 3, nombre: 'Empaque Bomba', codigo: 'EMP-001' },
        { id: 4, nombre: 'Tornillo M8x20', codigo: 'TOR-001' },
        { id: 5, nombre: 'Cable Eléctrico 12AWG', codigo: 'CAB-001' },
        { id: 6, nombre: 'Válvula de Presión', codigo: 'VAL-001' }
      ]);

      setUnidadesMedida([
        { id: 1, nombre: 'Litros', abreviatura: 'L' },
        { id: 2, nombre: 'Unidades', abreviatura: 'UND' },
        { id: 3, nombre: 'Metros', abreviatura: 'M' },
        { id: 4, nombre: 'Kilogramos', abreviatura: 'KG' },
        { id: 5, nombre: 'Cajas', abreviatura: 'CAJ' },
        { id: 6, nombre: 'Galones', abreviatura: 'GAL' }
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
      
      // Preparar payload con tipos correctos
      const payload = {
        ordenCompraId: Number(data.ordenCompraId),
        productoId: Number(data.productoId),
        descripcion: data.descripcion || null,
        cantidadPedida: Number(data.cantidadPedida),
        cantidadRecibida: Number(data.cantidadRecibida) || 0,
        unidadMedidaId: Number(data.unidadMedidaId),
        precioUnitario: Number(data.precioUnitario),
        fechaEntregaRequerida: data.fechaEntregaRequerida || null,
        fechaEntregaReal: data.fechaEntregaReal || null,
        observaciones: data.observaciones || null
      };
      if (detalle?.id) {
        await updateDetalleOrdenCompra(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await createDetalleOrdenCompra(payload);
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
    <div className="detalle-orden-compra-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información del Producto */}
          <TabPanel header="Información del Producto">
            <div className="grid">
              {/* Orden de Compra */}
              <div className="col-12">
                <label htmlFor="ordenCompraId" className="block text-900 font-medium mb-2">
                  Orden de Compra *
                </label>
                <Controller
                  name="ordenCompraId"
                  control={control}
                  rules={{ required: 'La orden de compra es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="ordenCompraId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={ordenesCompra.map(oc => ({ ...oc, id: Number(oc.id) }))}
                      optionLabel="numero"
                      optionValue="id"
                      placeholder="Seleccione una orden de compra"
                      className={errors.ordenCompraId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.ordenCompraId && (
                  <small className="p-error">{errors.ordenCompraId.message}</small>
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

              {/* Descripción */}
              <div className="col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={2}
                      placeholder="Descripción adicional del producto..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Cantidades y Precios */}
          <TabPanel header="Cantidades y Precios">
            <div className="grid">
              {/* Cantidad Pedida */}
              <div className="col-12 md:col-4">
                <label htmlFor="cantidadPedida" className="block text-900 font-medium mb-2">
                  Cantidad Pedida *
                </label>
                <Controller
                  name="cantidadPedida"
                  control={control}
                  rules={{ 
                    required: 'La cantidad pedida es obligatoria',
                    min: { value: 0.01, message: 'La cantidad debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="cantidadPedida"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="0.00"
                      className={errors.cantidadPedida ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.cantidadPedida && (
                  <small className="p-error">{errors.cantidadPedida.message}</small>
                )}
              </div>

              {/* Cantidad Recibida */}
              <div className="col-12 md:col-4">
                <label htmlFor="cantidadRecibida" className="block text-900 font-medium mb-2">
                  Cantidad Recibida
                </label>
                <Controller
                  name="cantidadRecibida"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="cantidadRecibida"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="0.00"
                    />
                  )}
                />
              </div>

              {/* Unidad de Medida */}
              <div className="col-12 md:col-4">
                <label htmlFor="unidadMedidaId" className="block text-900 font-medium mb-2">
                  Unidad de Medida *
                </label>
                <Controller
                  name="unidadMedidaId"
                  control={control}
                  rules={{ required: 'La unidad de medida es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="unidadMedidaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={unidadesMedida.map(u => ({ 
                        ...u, 
                        id: Number(u.id),
                        nombreCompleto: `${u.abreviatura} - ${u.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione unidad"
                      className={errors.unidadMedidaId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.unidadMedidaId && (
                  <small className="p-error">{errors.unidadMedidaId.message}</small>
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
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">
                  Subtotal
                </label>
                <div className="p-inputtext p-component p-disabled">
                  S/ {subtotal.toFixed(2)}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Fechas y Observaciones */}
          <TabPanel header="Fechas y Observaciones">
            <div className="grid">
              {/* Fecha Entrega Requerida */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaEntregaRequerida" className="block text-900 font-medium mb-2">
                  Fecha de Entrega Requerida
                </label>
                <Controller
                  name="fechaEntregaRequerida"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEntregaRequerida"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha Entrega Real */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaEntregaReal" className="block text-900 font-medium mb-2">
                  Fecha de Entrega Real
                </label>
                <Controller
                  name="fechaEntregaReal"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEntregaReal"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

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
                      placeholder="Observaciones sobre el detalle de la orden..."
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

export default DetalleOrdenCompraForm;
