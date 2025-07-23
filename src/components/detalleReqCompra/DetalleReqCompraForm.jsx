// src/components/detalleReqCompra/DetalleReqCompraForm.jsx
// Formulario profesional para DetalleReqCompra. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { crearDetalleReqCompra, actualizarDetalleReqCompra } from '../../api/detalleReqCompra';

/**
 * Formulario para gestión de DetalleReqCompra
 * Maneja creación y edición con validaciones y combos normalizados
 */
const DetalleReqCompraForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [requerimientos, setRequerimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const toast = useRef(null);

  // Observar cantidad y precio unitario para calcular subtotal
  const cantidad = watch('cantidad');
  const precioUnitario = watch('precioUnitario');
  const subtotal = (cantidad || 0) * (precioUnitario || 0);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        requerimientoCompraId: detalle.requerimientoCompraId ? Number(detalle.requerimientoCompraId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        descripcion: detalle.descripcion || '',
        cantidad: detalle.cantidad || 0,
        unidadMedidaId: detalle.unidadMedidaId ? Number(detalle.unidadMedidaId) : null,
        precioUnitario: detalle.precioUnitario || 0,
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        requerimientoCompraId: null,
        productoId: null,
        descripcion: '',
        cantidad: 0,
        unidadMedidaId: null,
        precioUnitario: 0,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setRequerimientos([
        { id: 1, numero: 'REQ-2024-001' },
        { id: 2, numero: 'REQ-2024-002' },
        { id: 3, numero: 'REQ-2024-003' }
      ]);
      
      setProductos([
        { id: 1, nombre: 'Aceite Motor 15W40', codigo: 'ACE-001' },
        { id: 2, nombre: 'Filtro de Aceite', codigo: 'FIL-001' },
        { id: 3, nombre: 'Empaque Bomba', codigo: 'EMP-001' },
        { id: 4, nombre: 'Tornillo M8x20', codigo: 'TOR-001' },
        { id: 5, nombre: 'Cable Eléctrico 12AWG', codigo: 'CAB-001' }
      ]);

      setUnidadesMedida([
        { id: 1, nombre: 'Litros', abreviatura: 'L' },
        { id: 2, nombre: 'Unidades', abreviatura: 'UND' },
        { id: 3, nombre: 'Metros', abreviatura: 'M' },
        { id: 4, nombre: 'Kilogramos', abreviatura: 'KG' },
        { id: 5, nombre: 'Cajas', abreviatura: 'CAJ' }
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
        requerimientoCompraId: Number(data.requerimientoCompraId),
        productoId: Number(data.productoId),
        descripcion: data.descripcion || null,
        cantidad: Number(data.cantidad),
        unidadMedidaId: Number(data.unidadMedidaId),
        precioUnitario: Number(data.precioUnitario),
        observaciones: data.observaciones || null
      };

      console.log('Payload DetalleReqCompra:', payload); // Log para depuración

      if (detalle?.id) {
        await actualizarDetalleReqCompra(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle actualizado correctamente'
        });
      } else {
        await crearDetalleReqCompra(payload);
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
    <div className="detalle-req-compra-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Requerimiento */}
          <div className="col-12">
            <label htmlFor="requerimientoCompraId" className="block text-900 font-medium mb-2">
              Requerimiento de Compra *
            </label>
            <Controller
              name="requerimientoCompraId"
              control={control}
              rules={{ required: 'El requerimiento es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="requerimientoCompraId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={requerimientos.map(r => ({ ...r, id: Number(r.id) }))}
                  optionLabel="numero"
                  optionValue="id"
                  placeholder="Seleccione un requerimiento"
                  className={errors.requerimientoCompraId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.requerimientoCompraId && (
              <small className="p-error">{errors.requerimientoCompraId.message}</small>
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

          {/* Cantidad */}
          <div className="col-12 md:col-4">
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
          <div className="col-12 md:col-4">
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
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              Subtotal
            </label>
            <div className="p-inputtext p-component p-disabled">
              S/ {subtotal.toFixed(2)}
            </div>
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
                  rows={3}
                  placeholder="Observaciones sobre el detalle..."
                />
              )}
            />
          </div>
        </div>

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

export default DetalleReqCompraForm;
