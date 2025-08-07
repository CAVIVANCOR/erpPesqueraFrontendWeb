// src/components/kardexAlmacen/KardexAlmacenForm.jsx
// Formulario profesional para KardexAlmacen. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearKardexAlmacen, actualizarKardexAlmacen } from '../../api/kardexAlmacen';

/**
 * Formulario para gestión de KardexAlmacen
 * Sistema complejo de trazabilidad con múltiples campos organizados en pestañas
 */
const KardexAlmacenForm = ({ movimiento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [conceptosMovimiento, setConceptosMovimiento] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (movimiento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        empresaId: movimiento.empresaId ? Number(movimiento.empresaId) : null,
        almacenId: movimiento.almacenId ? Number(movimiento.almacenId) : null,
        productoId: movimiento.productoId ? Number(movimiento.productoId) : null,
        clienteId: movimiento.clienteId ? Number(movimiento.clienteId) : null,
        custodia: movimiento.custodia || false,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : null,
        ingreso: movimiento.ingreso || false,
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        conceptoMovAlmacenId: movimiento.conceptoMovAlmacenId ? Number(movimiento.conceptoMovAlmacenId) : null,
        documentoId: movimiento.documentoId ? Number(movimiento.documentoId) : null,
        detalleId: movimiento.detalleId ? Number(movimiento.detalleId) : null,
        cantidad: movimiento.cantidad ? Number(movimiento.cantidad) : 0,
        peso: movimiento.peso ? Number(movimiento.peso) : 0,
        lote: movimiento.lote || '',
        fechaVencimiento: movimiento.fechaVencimiento ? new Date(movimiento.fechaVencimiento) : null,
        fechaProduccion: movimiento.fechaProduccion ? new Date(movimiento.fechaProduccion) : null,
        fechaIngreso: movimiento.fechaIngreso ? new Date(movimiento.fechaIngreso) : null,
        numContenedor: movimiento.numContenedor || '',
        nroSerie: movimiento.nroSerie || '',
        paletaAlmacenId: movimiento.paletaAlmacenId ? Number(movimiento.paletaAlmacenId) : null,
        ubicacionId: movimiento.ubicacionId ? Number(movimiento.ubicacionId) : null,
        estadoId: movimiento.estadoId ? Number(movimiento.estadoId) : null,
        saldoCantidad: movimiento.saldoCantidad ? Number(movimiento.saldoCantidad) : 0,
        saldoPeso: movimiento.saldoPeso ? Number(movimiento.saldoPeso) : 0,
        costoUnitarioPromedio: movimiento.costoUnitarioPromedio ? Number(movimiento.costoUnitarioPromedio) : 0,
        costoSaldoPromedio: movimiento.costoSaldoPromedio ? Number(movimiento.costoSaldoPromedio) : 0,
        saldoDetCantidad: movimiento.saldoDetCantidad ? Number(movimiento.saldoDetCantidad) : 0,
        saldoDetPeso: movimiento.saldoDetPeso ? Number(movimiento.saldoDetPeso) : 0,
        costoUnitario: movimiento.costoUnitario ? Number(movimiento.costoUnitario) : 0,
        observaciones: movimiento.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        empresaId: null,
        almacenId: null,
        productoId: null,
        clienteId: null,
        custodia: false,
        fechaMovimiento: new Date(),
        ingreso: false,
        tipoMovimientoId: null,
        conceptoMovAlmacenId: null,
        documentoId: null,
        detalleId: null,
        cantidad: 0,
        peso: 0,
        lote: '',
        fechaVencimiento: null,
        fechaProduccion: null,
        fechaIngreso: null,
        numContenedor: '',
        nroSerie: '',
        paletaAlmacenId: null,
        ubicacionId: null,
        estadoId: null,
        saldoCantidad: 0,
        saldoPeso: 0,
        costoUnitarioPromedio: 0,
        costoSaldoPromedio: 0,
        saldoDetCantidad: 0,
        saldoDetPeso: 0,
        costoUnitario: 0,
        observaciones: ''
      });
    }
  }, [movimiento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
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

      setTiposMovimiento([
        { id: 1, nombre: 'Ingreso por Compra' },
        { id: 2, nombre: 'Egreso por Venta' },
        { id: 3, nombre: 'Transferencia' }
      ]);

      setConceptosMovimiento([
        { id: 1, descripcion: 'Compra Nacional' },
        { id: 2, descripcion: 'Venta Local' },
        { id: 3, descripcion: 'Ajuste Inventario' }
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
        fechaMovimiento: data.fechaMovimiento,
        ingreso: Boolean(data.ingreso),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        conceptoMovAlmacenId: Number(data.conceptoMovAlmacenId),
        documentoId: data.documentoId ? Number(data.documentoId) : null,
        detalleId: data.detalleId ? Number(data.detalleId) : null,
        cantidad: Number(data.cantidad),
        peso: data.peso ? Number(data.peso) : null,
        lote: data.lote || null,
        fechaVencimiento: data.fechaVencimiento || null,
        fechaProduccion: data.fechaProduccion || null,
        fechaIngreso: data.fechaIngreso || null,
        numContenedor: data.numContenedor || null,
        nroSerie: data.nroSerie || null,
        paletaAlmacenId: data.paletaAlmacenId ? Number(data.paletaAlmacenId) : null,
        ubicacionId: data.ubicacionId ? Number(data.ubicacionId) : null,
        estadoId: data.estadoId ? Number(data.estadoId) : null,
        saldoCantidad: Number(data.saldoCantidad),
        saldoPeso: data.saldoPeso ? Number(data.saldoPeso) : null,
        costoUnitarioPromedio: data.costoUnitarioPromedio ? Number(data.costoUnitarioPromedio) : null,
        costoSaldoPromedio: data.costoSaldoPromedio ? Number(data.costoSaldoPromedio) : null,
        saldoDetCantidad: data.saldoDetCantidad ? Number(data.saldoDetCantidad) : null,
        saldoDetPeso: data.saldoDetPeso ? Number(data.saldoDetPeso) : null,
        costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
        observaciones: data.observaciones || null
      };
      if (movimiento?.id) {
        await actualizarKardexAlmacen(movimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de kardex actualizado correctamente'
        });
      } else {
        await crearKardexAlmacen(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento de kardex creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el movimiento de kardex'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kardex-almacen-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
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

              {/* Ingreso */}
              <div className="col-12 md:col-6">
                <label htmlFor="ingreso" className="block text-900 font-medium mb-2">
                  Tipo de Movimiento
                </label>
                <Controller
                  name="ingreso"
                  control={control}
                  render={({ field }) => (
                    <div className="flex align-items-center">
                      <Checkbox
                        id="ingreso"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                      <label htmlFor="ingreso" className="ml-2">
                        Es ingreso (desmarcar para egreso)
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Movimiento y Cantidades */}
          <TabPanel header="Movimiento y Cantidades">
            <div className="grid">
              {/* Fecha de Movimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
                  Fecha de Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: 'La fecha de movimiento es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      className={errors.fechaMovimiento ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <small className="p-error">{errors.fechaMovimiento.message}</small>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="tipoMovimientoId" className="block text-900 font-medium mb-2">
                  Tipo de Movimiento *
                </label>
                <Controller
                  name="tipoMovimientoId"
                  control={control}
                  rules={{ required: 'El tipo de movimiento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovimientoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposMovimiento.map(t => ({ ...t, id: Number(t.id) }))}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione un tipo"
                      className={errors.tipoMovimientoId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.tipoMovimientoId && (
                  <small className="p-error">{errors.tipoMovimientoId.message}</small>
                )}
              </div>

              {/* Concepto de Movimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="conceptoMovAlmacenId" className="block text-900 font-medium mb-2">
                  Concepto de Movimiento *
                </label>
                <Controller
                  name="conceptoMovAlmacenId"
                  control={control}
                  rules={{ required: 'El concepto de movimiento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="conceptoMovAlmacenId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={conceptosMovimiento.map(c => ({ ...c, id: Number(c.id) }))}
                      optionLabel="descripcion"
                      optionValue="id"
                      placeholder="Seleccione un concepto"
                      className={errors.conceptoMovAlmacenId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.conceptoMovAlmacenId && (
                  <small className="p-error">{errors.conceptoMovAlmacenId.message}</small>
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
                  rules={{ required: 'La cantidad es obligatoria' }}
                  render={({ field }) => (
                    <InputNumber
                      id="cantidad"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      placeholder="0.00"
                      className={errors.cantidad ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.cantidad && (
                  <small className="p-error">{errors.cantidad.message}</small>
                )}
              </div>

              {/* Peso */}
              <div className="col-12 md:col-4">
                <label htmlFor="peso" className="block text-900 font-medium mb-2">
                  Peso
                </label>
                <Controller
                  name="peso"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="peso"
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

              {/* Costo Unitario */}
              <div className="col-12 md:col-4">
                <label htmlFor="costoUnitario" className="block text-900 font-medium mb-2">
                  Costo Unitario
                </label>
                <Controller
                  name="costoUnitario"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="costoUnitario"
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
          </TabPanel>

          {/* Pestaña 3: Saldos y Observaciones */}
          <TabPanel header="Saldos y Observaciones">
            <div className="grid">
              {/* Saldo Cantidad */}
              <div className="col-12 md:col-6">
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
              <div className="col-12 md:col-6">
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
                      placeholder="Observaciones del movimiento..."
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
            label={movimiento?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default KardexAlmacenForm;
