// src/components/saldosProductoCliente/SaldosProductoClienteForm.jsx
// Formulario profesional para SaldosProductoCliente. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { crearSaldosProductoCliente, actualizarSaldosProductoCliente } from '../../api/saldosProductoCliente';

/**
 * Formulario para gestión de SaldosProductoCliente
 * Maneja creación y edición con validaciones y combos normalizados
 */
const SaldosProductoClienteForm = ({ saldo, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (saldo) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        empresaId: saldo.empresaId ? Number(saldo.empresaId) : null,
        almacenId: saldo.almacenId ? Number(saldo.almacenId) : null,
        productoId: saldo.productoId ? Number(saldo.productoId) : null,
        clienteId: saldo.clienteId ? Number(saldo.clienteId) : null,
        custodia: saldo.custodia || false,
        saldoCantidad: saldo.saldoCantidad ? Number(saldo.saldoCantidad) : 0,
        saldoPeso: saldo.saldoPeso ? Number(saldo.saldoPeso) : 0,
        costoUnitarioPromedio: saldo.costoUnitarioPromedio ? Number(saldo.costoUnitarioPromedio) : 0
      });
    } else {
      // Reset para nuevo registro
      reset({
        empresaId: null,
        almacenId: null,
        productoId: null,
        clienteId: null,
        custodia: false,
        saldoCantidad: 0,
        saldoPeso: 0,
        costoUnitarioPromedio: 0
      });
    }
  }, [saldo, reset, empresas, almacenes, productos, clientes]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // const [empresasData, almacenesData, productosData, clientesData] = await Promise.all([
      //   getAllEmpresas(),
      //   getAllAlmacenes(),
      //   getAllProducto(),
      //   getAllEntidadComercial()
      // ]);
      
      // Datos de ejemplo mientras se implementan las APIs
      setEmpresas([
        { id: 1, razonSocial: 'Empresa Pesquera 1' },
        { id: 2, razonSocial: 'Empresa Pesquera 2' }
      ]);
      
      setAlmacenes([
        { id: 1, nombre: 'Almacén Principal' },
        { id: 2, nombre: 'Almacén Secundario' }
      ]);
      
      setProductos([
        { id: 1, codigo: 'PROD001', descripcionBase: 'Producto 1' },
        { id: 2, codigo: 'PROD002', descripcionBase: 'Producto 2' }
      ]);
      
      setClientes([
        { id: 1, razonSocial: 'Cliente 1' },
        { id: 2, razonSocial: 'Cliente 2' }
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
        empresaId: Number(data.empresaId),
        almacenId: Number(data.almacenId),
        productoId: Number(data.productoId),
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        custodia: Boolean(data.custodia),
        saldoCantidad: Number(data.saldoCantidad),
        saldoPeso: data.saldoPeso ? Number(data.saldoPeso) : null,
        costoUnitarioPromedio: data.costoUnitarioPromedio ? Number(data.costoUnitarioPromedio) : null
      };

      console.log('Payload SaldosProductoCliente:', payload); // Log para depuración

      if (saldo?.id) {
        await actualizarSaldosProductoCliente(saldo.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Saldo actualizado correctamente'
        });
      } else {
        await crearSaldosProductoCliente(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Saldo creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el saldo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saldos-producto-cliente-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Empresa */}
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
                  options={empresas.map(e => ({ ...e, id: Number(e.id) }))}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione una empresa"
                  className={errors.empresaId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>

          {/* Almacén */}
          <div className="col-12 md:col-6">
            <label htmlFor="almacenId" className="block text-900 font-medium mb-2">
              Almacén *
            </label>
            <Controller
              name="almacenId"
              control={control}
              rules={{ required: 'El almacén es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="almacenId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={almacenes.map(a => ({ ...a, id: Number(a.id) }))}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione un almacén"
                  className={errors.almacenId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.almacenId && (
              <small className="p-error">{errors.almacenId.message}</small>
            )}
          </div>

          {/* Producto */}
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
                  options={productos.map(p => ({ 
                    ...p, 
                    id: Number(p.id),
                    descripcionCompleta: `${p.codigo} - ${p.descripcionBase}`
                  }))}
                  optionLabel="descripcionCompleta"
                  optionValue="id"
                  placeholder="Seleccione un producto"
                  className={errors.productoId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.productoId && (
              <small className="p-error">{errors.productoId.message}</small>
            )}
          </div>

          {/* Cliente */}
          <div className="col-12 md:col-6">
            <label htmlFor="clienteId" className="block text-900 font-medium mb-2">
              Cliente
            </label>
            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="clienteId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={clientes.map(c => ({ ...c, id: Number(c.id) }))}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione un cliente"
                  showClear
                />
              )}
            />
          </div>

          {/* Custodia */}
          <div className="col-12 md:col-6">
            <label htmlFor="custodia" className="block text-900 font-medium mb-2">
              Custodia
            </label>
            <Controller
              name="custodia"
              control={control}
              render={({ field }) => (
                <div className="flex align-items-center">
                  <Checkbox
                    id="custodia"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                  <label htmlFor="custodia" className="ml-2">
                    Producto en custodia
                  </label>
                </div>
              )}
            />
          </div>

          {/* Saldo Cantidad */}
          <div className="col-12 md:col-4">
            <label htmlFor="saldoCantidad" className="block text-900 font-medium mb-2">
              Saldo Cantidad *
            </label>
            <Controller
              name="saldoCantidad"
              control={control}
              rules={{ required: 'El saldo de cantidad es obligatorio' }}
              render={({ field }) => (
                <InputNumber
                  id="saldoCantidad"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
                  className={errors.saldoCantidad ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.saldoCantidad && (
              <small className="p-error">{errors.saldoCantidad.message}</small>
            )}
          </div>

          {/* Saldo Peso */}
          <div className="col-12 md:col-4">
            <label htmlFor="saldoPeso" className="block text-900 font-medium mb-2">
              Saldo Peso
            </label>
            <Controller
              name="saldoPeso"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="saldoPeso"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
                />
              )}
            />
          </div>

          {/* Costo Unitario Promedio */}
          <div className="col-12 md:col-4">
            <label htmlFor="costoUnitarioPromedio" className="block text-900 font-medium mb-2">
              Costo Unitario Promedio
            </label>
            <Controller
              name="costoUnitarioPromedio"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="costoUnitarioPromedio"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
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
            label={saldo?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default SaldosProductoClienteForm;
