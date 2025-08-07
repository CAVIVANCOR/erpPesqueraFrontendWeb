// src/components/detCotizacionVentas/DetCotizacionVentasForm.jsx
// Formulario profesional para DetCotizacionVentas con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, campos decimales con 2 decimales, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { createDetCotizacionVentas, updateDetCotizacionVentas } from '../../api/detCotizacionVentas';
import { getCotizacionesVentas } from '../../api/cotizacionVentas';
import { getProductos } from '../../api/producto';
import { getEmpresas } from '../../api/empresa';
import { getCentrosCosto } from '../../api/centroCosto';
import { getMonedas } from '../../api/moneda';

/**
 * Componente DetCotizacionVentasForm
 * Formulario para gestión de detalles de cotizaciones de ventas
 * Incluye validaciones, normalización de IDs y cálculos automáticos según patrón ERP Megui
 */
const DetCotizacionVentasForm = ({ detalle, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      empresaId: null,
      cotizacionVentasId: null,
      productoId: null,
      clienteId: 1,
      cantidad: 0.00,
      precioUnitario: 0.00,
      monedaId: 1,
      movSalidaAlmacenId: 1,
      prefacturaVentaId: null,
      observaciones: '',
      centroCostoId: null
    }
  });

  const [empresas, setEmpresas] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  // Opciones para dropdowns estáticos
  const clientes = [
    { label: 'Distribuidora Internacional SAC', value: 1 },
    { label: 'Global Fish Trading Ltd', value: 2 },
    { label: 'European Seafood Import', value: 3 },
    { label: 'Asian Marine Products', value: 4 }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (detalle) {
      // Cargar datos del detalle para edición
      reset({
        ...detalle,
        empresaId: detalle.empresaId ? Number(detalle.empresaId) : null,
        cotizacionVentasId: detalle.cotizacionVentasId ? Number(detalle.cotizacionVentasId) : null,
        productoId: detalle.productoId ? Number(detalle.productoId) : null,
        clienteId: Number(detalle.clienteId || 1),
        monedaId: Number(detalle.monedaId || 1),
        movSalidaAlmacenId: Number(detalle.movSalidaAlmacenId || 1),
        prefacturaVentaId: detalle.prefacturaVentaId ? Number(detalle.prefacturaVentaId) : null,
        centroCostoId: detalle.centroCostoId ? Number(detalle.centroCostoId) : null,
        cantidad: Number(detalle.cantidad || 0),
        precioUnitario: Number(detalle.precioUnitario || 0)
      });
    }
  }, [detalle, reset]);

  const cargarDatos = async () => {
    try {
      const [
        empresasData, 
        cotizacionesData, 
        productosData, 
        centrosCostoData, 
        monedasData
      ] = await Promise.all([
        getEmpresas(),
        getCotizacionesVentas(),
        getProductos(),
        getCentrosCosto(),
        getMonedas()
      ]);

      // Normalizar IDs a números según regla ERP Megui
      setEmpresas(empresasData.map(e => ({ 
        ...e, 
        id: Number(e.id),
        label: e.razonSocial,
        value: Number(e.id)
      })));

      setCotizaciones(cotizacionesData.map(c => ({ 
        ...c, 
        id: Number(c.id),
        label: `COT-${String(c.id).padStart(6, '0')} - ${c.tipoProducto?.nombre || 'N/A'}`,
        value: Number(c.id)
      })));

      setProductos(productosData.map(p => ({ 
        ...p, 
        id: Number(p.id),
        label: `${p.codigo} - ${p.nombre}`,
        value: Number(p.id)
      })));

      setCentrosCosto(centrosCostoData.map(cc => ({ 
        ...cc, 
        id: Number(cc.id),
        label: `${cc.codigo} - ${cc.nombre}`,
        value: Number(cc.id)
      })));

      setMonedas(monedasData.map(m => ({ 
        ...m, 
        id: Number(m.id),
        label: `${m.codigo} - ${m.nombre}`,
        value: Number(m.id)
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

      // Preparar payload con validaciones
      const payload = {
        empresaId: Number(data.empresaId),
        cotizacionVentasId: Number(data.cotizacionVentasId),
        productoId: Number(data.productoId),
        clienteId: Number(data.clienteId),
        cantidad: Number(data.cantidad),
        precioUnitario: Number(data.precioUnitario),
        monedaId: Number(data.monedaId),
        movSalidaAlmacenId: Number(data.movSalidaAlmacenId),
        prefacturaVentaId: data.prefacturaVentaId ? Number(data.prefacturaVentaId) : null,
        observaciones: data.observaciones?.trim() || null,
        centroCostoId: Number(data.centroCostoId)
      };
      if (detalle?.id) {
        await updateDetCotizacionVentas(detalle.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cotización actualizado correctamente'
        });
      } else {
        await createDetCotizacionVentas(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de cotización creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar detalle:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el detalle de cotización'
      });
    } finally {
      setLoading(false);
    }
  };

  // Observar cambios para cálculos automáticos
  const cantidad = watch('cantidad');
  const precioUnitario = watch('precioUnitario');
  const total = (cantidad || 0) * (precioUnitario || 0);

  return (
    <div className="det-cotizacion-ventas-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12 md:col-6">
            <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: 'La empresa es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={empresas}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar empresa"
                  className={`w-full ${errors.empresaId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="cotizacionVentasId" className="block text-900 font-medium mb-2">
              Cotización de Ventas *
            </label>
            <Controller
              name="cotizacionVentasId"
              control={control}
              rules={{ required: 'La cotización es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="cotizacionVentasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={cotizaciones}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cotización"
                  className={`w-full ${errors.cotizacionVentasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.cotizacionVentasId && (
              <small className="p-error">{errors.cotizacionVentasId.message}</small>
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
            <label htmlFor="clienteId" className="block text-900 font-medium mb-2">
              Cliente *
            </label>
            <Controller
              name="clienteId"
              control={control}
              rules={{ required: 'El cliente es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="clienteId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={clientes}
                  placeholder="Seleccionar cliente"
                  className={`w-full ${errors.clienteId ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.clienteId && (
              <small className="p-error">{errors.clienteId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="cantidad" className="block text-900 font-medium mb-2">
              Cantidad (TM) *
            </label>
            <Controller
              name="cantidad"
              control={control}
              rules={{ 
                required: 'La cantidad es obligatoria',
                min: { value: 0.01, message: 'Debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="cantidad"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  className={`w-full ${errors.cantidad ? 'p-invalid' : ''}`}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  suffix=" TM"
                />
              )}
            />
            {errors.cantidad && (
              <small className="p-error">{errors.cantidad.message}</small>
            )}
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="precioUnitario" className="block text-900 font-medium mb-2">
              Precio Unitario *
            </label>
            <Controller
              name="precioUnitario"
              control={control}
              rules={{ 
                required: 'El precio unitario es obligatorio',
                min: { value: 0.01, message: 'Debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="precioUnitario"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  className={`w-full ${errors.precioUnitario ? 'p-invalid' : ''}`}
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                />
              )}
            />
            {errors.precioUnitario && (
              <small className="p-error">{errors.precioUnitario.message}</small>
            )}
          </div>

          <div className="col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">
              Total Calculado
            </label>
            <div className="p-3 bg-gray-100 border-round text-right">
              <span className="font-bold text-green-600 text-lg">
                ${total.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="monedaId" className="block text-900 font-medium mb-2">
              Moneda *
            </label>
            <Controller
              name="monedaId"
              control={control}
              rules={{ required: 'La moneda es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="monedaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={monedas}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar moneda"
                  className={`w-full ${errors.monedaId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.monedaId && (
              <small className="p-error">{errors.monedaId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: 'El centro de costo es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={centrosCosto}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar centro de costo"
                  className={`w-full ${errors.centroCostoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.centroCostoId && (
              <small className="p-error">{errors.centroCostoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="movSalidaAlmacenId" className="block text-900 font-medium mb-2">
              Movimiento Salida Almacén *
            </label>
            <Controller
              name="movSalidaAlmacenId"
              control={control}
              rules={{ required: 'El movimiento de almacén es obligatorio' }}
              render={({ field }) => (
                <InputNumber
                  id="movSalidaAlmacenId"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="ID del movimiento"
                  className={`w-full ${errors.movSalidaAlmacenId ? 'p-invalid' : ''}`}
                  useGrouping={false}
                />
              )}
            />
            {errors.movSalidaAlmacenId && (
              <small className="p-error">{errors.movSalidaAlmacenId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="prefacturaVentaId" className="block text-900 font-medium mb-2">
              Prefactura de Venta
            </label>
            <Controller
              name="prefacturaVentaId"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="prefacturaVentaId"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="ID de la prefactura (opcional)"
                  className="w-full"
                  useGrouping={false}
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
                  {...field}
                  placeholder="Observaciones del detalle de cotización"
                  className="w-full"
                  rows={3}
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

export default DetCotizacionVentasForm;
