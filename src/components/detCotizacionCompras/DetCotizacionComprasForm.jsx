// src/components/detCotizacionCompras/DetCotizacionComprasForm.jsx
// Formulario profesional para DetCotizacionCompras con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearDetalleCotizacionCompras, actualizarDetalleCotizacionCompras } from '../../api/detCotizacionCompras';
import { getCotizacionesCompras } from '../../api/cotizacionCompras';
import { getProductos } from '../../api/producto';
import { getUnidadesMedida } from '../../api/unidadMedida';

/**
 * Componente DetCotizacionComprasForm
 * Formulario para gestión de detalles de cotizaciones de compras
 * Incluye validaciones y relaciones según patrón ERP Megui
 */
const DetCotizacionComprasForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      cotizacionComprasId: null,
      productoId: null,
      cantidad: 1.00,
      unidadMedidaId: null,
      precioUnitario: 0.00,
      observaciones: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const toast = useRef(null);

  // Observar producto seleccionado para obtener su unidad de medida por defecto
  const productoSeleccionado = watch('productoId');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Cargar datos del detalle para edición
      reset({
        cotizacionComprasId: detalle.cotizacionComprasId ? Number(detalle.cotizacionComprasId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        cantidad: Number(detalle.cantidad) || 1.00,
        unidadMedidaId: detalle.unidadMedidaId ? Number(detalle.unidadMedidaId) : null,
        precioUnitario: Number(detalle.precioUnitario) || 0.00,
        observaciones: detalle.observaciones || ''
      });
    }
  }, [detalle, reset]);

  useEffect(() => {
    // Establecer unidad de medida por defecto del producto seleccionado
    if (productoSeleccionado && productos.length > 0) {
      const producto = productos.find(p => p.id === Number(productoSeleccionado));
      if (producto && producto.unidadMedidaId && !detalle) {
        // Solo establecer por defecto si es un nuevo registro
        reset(prev => ({
          ...prev,
          unidadMedidaId: Number(producto.unidadMedidaId)
        }));
      }
    }
  }, [productoSeleccionado, productos, detalle, reset]);

  const cargarDatos = async () => {
    try {
      const [
        cotizacionesData,
        productosData,
        unidadesData
      ] = await Promise.all([
        getCotizacionesCompras(),
        getProductos(),
        getUnidadesMedida()
      ]);

      // Normalizar IDs según regla ERP Megui
      setCotizaciones(cotizacionesData.map(c => ({
        ...c,
        id: Number(c.id),
        label: `${c.empresa?.razonSocial} - ${c.tipoProducto?.nombre}`,
        value: Number(c.id)
      })));

      setProductos(productosData.map(p => ({
        ...p,
        id: Number(p.id),
        label: `${p.codigo} - ${p.nombre}`,
        value: Number(p.id)
      })));

      setUnidadesMedida(unidadesData.map(u => ({
        ...u,
        id: Number(u.id),
        label: u.nombre,
        value: Number(u.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validaciones de negocio
      if (data.cantidad <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'La cantidad debe ser mayor a cero'
        });
        return;
      }

      if (data.precioUnitario < 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El precio unitario no puede ser negativo'
        });
        return;
      }

      // Preparar payload con validaciones
      const payload = {
        cotizacionComprasId: Number(data.cotizacionComprasId),
        productoId: Number(data.productoId),
        cantidad: Number(data.cantidad),
        unidadMedidaId: Number(data.unidadMedidaId),
        precioUnitario: Number(data.precioUnitario),
        observaciones: data.observaciones?.trim() || null
      };
      if (detalle?.id) {
        await actualizarDetalleCotizacionCompras(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cotización actualizado correctamente'
        });
      } else {
        await crearDetalleCotizacionCompras(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cotización creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar detalle de cotización:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el detalle de cotización'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="detalle-cotizacion-compras-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="cotizacionComprasId" className="block text-900 font-medium mb-2">
              Cotización de Compras *
            </label>
            <Controller
              name="cotizacionComprasId"
              control={control}
              rules={{ required: 'La cotización de compras es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="cotizacionComprasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={cotizaciones}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cotización de compras"
                  className={`w-full ${errors.cotizacionComprasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.cotizacionComprasId && (
              <small className="p-error">{errors.cotizacionComprasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
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
                  options={productos}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar producto"
                  className={`w-full ${errors.productoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.productoId && (
              <small className="p-error">{errors.productoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
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
                  options={unidadesMedida}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar unidad de medida"
                  className={`w-full ${errors.unidadMedidaId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.unidadMedidaId && (
              <small className="p-error">{errors.unidadMedidaId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="cantidad" className="block text-900 font-medium mb-2">
              Cantidad *
            </label>
            <Controller
              name="cantidad"
              control={control}
              rules={{ 
                required: 'La cantidad es obligatoria',
                min: { value: 0.01, message: 'La cantidad debe ser mayor a cero' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="cantidad"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Cantidad"
                  className={`w-full ${errors.cantidad ? 'p-invalid' : ''}`}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0.01}
                />
              )}
            />
            {errors.cantidad && (
              <small className="p-error">{errors.cantidad.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="precioUnitario" className="block text-900 font-medium mb-2">
              Precio Unitario *
            </label>
            <Controller
              name="precioUnitario"
              control={control}
              rules={{ 
                required: 'El precio unitario es obligatorio',
                min: { value: 0, message: 'El precio unitario no puede ser negativo' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="precioUnitario"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Precio unitario"
                  className={`w-full ${errors.precioUnitario ? 'p-invalid' : ''}`}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
            {errors.precioUnitario && (
              <small className="p-error">{errors.precioUnitario.message}</small>
            )}
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
                  placeholder="Observaciones del detalle"
                  className="w-full"
                  rows={3}
                  maxLength={500}
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
            disabled={loading}
          />
          <Button
            type="submit"
            label={detalle?.id ? 'Actualizar' : 'Crear'}
            icon={detalle?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default DetCotizacionComprasForm;
