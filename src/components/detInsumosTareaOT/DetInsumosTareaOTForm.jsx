// src/components/detInsumosTareaOT/DetInsumosTareaOTForm.jsx
// Formulario profesional para DetInsumosTareaOT. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { createDetInsumosTareaOT, updateDetInsumosTareaOT } from '../../api/detInsumosTareaOT';

/**
 * Formulario para gestión de DetInsumosTareaOT
 * Maneja creación y edición con validaciones y combos normalizados
 */
const DetInsumosTareaOTForm = ({ insumo, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const toast = useRef(null);

  // Observar cantidad y costo unitario para calcular total
  const cantidad = watch('cantidad');
  const costoUnitario = watch('costoUnitario');
  const costoTotal = (cantidad || 0) * (costoUnitario || 0);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (insumo) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        detTareaOtId: insumo.detTareaOtId ? Number(insumo.detTareaOtId) : null,
        productoId: insumo.productoId ? Number(insumo.productoId) : null,
        cantidad: insumo.cantidad || 0,
        unidadMedidaId: insumo.unidadMedidaId ? Number(insumo.unidadMedidaId) : null,
        costoUnitario: insumo.costoUnitario || 0,
        observaciones: insumo.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        detTareaOtId: null,
        productoId: null,
        cantidad: 0,
        unidadMedidaId: null,
        costoUnitario: 0,
        observaciones: ''
      });
    }
  }, [insumo, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setTareas([
        { id: 1, descripcion: 'Cambio de aceite motor principal' },
        { id: 2, descripcion: 'Reparación sistema hidráulico' },
        { id: 3, descripcion: 'Mantenimiento preventivo bomba' }
      ]);
      
      setProductos([
        { id: 1, nombre: 'Aceite Motor 15W40', codigo: 'ACE-001' },
        { id: 2, nombre: 'Filtro de Aceite', codigo: 'FIL-001' },
        { id: 3, nombre: 'Empaque Bomba', codigo: 'EMP-001' },
        { id: 4, nombre: 'Tornillo M8x20', codigo: 'TOR-001' }
      ]);

      setUnidadesMedida([
        { id: 1, nombre: 'Litros', abreviatura: 'L' },
        { id: 2, nombre: 'Unidades', abreviatura: 'UND' },
        { id: 3, nombre: 'Metros', abreviatura: 'M' },
        { id: 4, nombre: 'Kilogramos', abreviatura: 'KG' }
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
        detTareaOtId: Number(data.detTareaOtId),
        productoId: Number(data.productoId),
        cantidad: Number(data.cantidad),
        unidadMedidaId: Number(data.unidadMedidaId),
        costoUnitario: Number(data.costoUnitario),
        observaciones: data.observaciones || null
      };

      console.log('Payload DetInsumosTareaOT:', payload); // Log para depuración

      if (insumo?.id) {
        await updateDetInsumosTareaOT(insumo.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Insumo actualizado correctamente'
        });
      } else {
        await createDetInsumosTareaOT(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Insumo creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el insumo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-insumos-tarea-ot-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Tarea */}
          <div className="col-12">
            <label htmlFor="detTareaOtId" className="block text-900 font-medium mb-2">
              Tarea de OT *
            </label>
            <Controller
              name="detTareaOtId"
              control={control}
              rules={{ required: 'La tarea es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="detTareaOtId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={tareas.map(t => ({ ...t, id: Number(t.id) }))}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione una tarea"
                  className={errors.detTareaOtId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.detTareaOtId && (
              <small className="p-error">{errors.detTareaOtId.message}</small>
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

          {/* Costo Unitario */}
          <div className="col-12 md:col-4">
            <label htmlFor="costoUnitario" className="block text-900 font-medium mb-2">
              Costo Unitario *
            </label>
            <Controller
              name="costoUnitario"
              control={control}
              rules={{ 
                required: 'El costo unitario es obligatorio',
                min: { value: 0, message: 'El costo debe ser mayor o igual a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="costoUnitario"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="S/ 0.00"
                  className={errors.costoUnitario ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.costoUnitario && (
              <small className="p-error">{errors.costoUnitario.message}</small>
            )}
          </div>

          {/* Costo Total (Solo lectura) */}
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              Costo Total
            </label>
            <div className="p-inputtext p-component p-disabled">
              S/ {costoTotal.toFixed(2)}
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
                  placeholder="Observaciones sobre el insumo..."
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
            label={insumo?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetInsumosTareaOTForm;
