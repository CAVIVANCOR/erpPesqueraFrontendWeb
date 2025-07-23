// src/components/saldosDetProductoCliente/SaldosDetProductoClienteForm.jsx
// Formulario profesional para SaldosDetProductoCliente. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearSaldosDetProductoCliente, actualizarSaldosDetProductoCliente } from '../../api/saldosDetProductoCliente';

/**
 * Formulario para gestión de SaldosDetProductoCliente
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX debido a la cantidad de campos
 */
const SaldosDetProductoClienteForm = ({ saldo, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [paletas, setPaletas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estados, setEstados] = useState([]);
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
        lote: saldo.lote || '',
        fechaVencimiento: saldo.fechaVencimiento ? new Date(saldo.fechaVencimiento) : null,
        fechaProduccion: saldo.fechaProduccion ? new Date(saldo.fechaProduccion) : null,
        fechaIngreso: saldo.fechaIngreso ? new Date(saldo.fechaIngreso) : null,
        numContenedor: saldo.numContenedor || '',
        nroSerie: saldo.nroSerie || '',
        paletaAlmacenId: saldo.paletaAlmacenId ? Number(saldo.paletaAlmacenId) : null,
        ubicacionId: saldo.ubicacionId ? Number(saldo.ubicacionId) : null,
        estadoId: saldo.estadoId ? Number(saldo.estadoId) : null,
        saldoCantidad: saldo.saldoCantidad ? Number(saldo.saldoCantidad) : 0,
        saldoPeso: saldo.saldoPeso ? Number(saldo.saldoPeso) : 0
      });
    } else {
      // Reset para nuevo registro
      reset({
        empresaId: null,
        almacenId: null,
        productoId: null,
        clienteId: null,
        custodia: false,
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
        saldoPeso: 0
      });
    }
  }, [saldo, reset]);

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

      setPaletas([
        { id: 1, codigo: 'PAL001' },
        { id: 2, codigo: 'PAL002' }
      ]);

      setUbicaciones([
        { id: 1, codigo: 'UBI001', descripcion: 'Ubicación 1' },
        { id: 2, codigo: 'UBI002', descripcion: 'Ubicación 2' }
      ]);

      setEstados([
        { id: 1, nombre: 'Disponible' },
        { id: 2, nombre: 'Reservado' },
        { id: 3, nombre: 'En tránsito' }
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
        saldoPeso: data.saldoPeso ? Number(data.saldoPeso) : null
      };

      console.log('Payload SaldosDetProductoCliente:', payload); // Log para depuración

      if (saldo?.id) {
        await actualizarSaldosDetProductoCliente(saldo.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Saldo detallado actualizado correctamente'
        });
      } else {
        await crearSaldosDetProductoCliente(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Saldo detallado creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el saldo detallado'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saldos-det-producto-cliente-form">
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
            </div>
          </TabPanel>

          {/* Pestaña 2: Trazabilidad */}
          <TabPanel header="Trazabilidad">
            <div className="grid">
              {/* Lote */}
              <div className="col-12 md:col-6">
                <label htmlFor="lote" className="block text-900 font-medium mb-2">
                  Lote
                </label>
                <Controller
                  name="lote"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="lote"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Código de lote"
                    />
                  )}
                />
              </div>

              {/* Número de Contenedor */}
              <div className="col-12 md:col-6">
                <label htmlFor="numContenedor" className="block text-900 font-medium mb-2">
                  Número de Contenedor
                </label>
                <Controller
                  name="numContenedor"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numContenedor"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Número de contenedor"
                    />
                  )}
                />
              </div>

              {/* Número de Serie */}
              <div className="col-12 md:col-6">
                <label htmlFor="nroSerie" className="block text-900 font-medium mb-2">
                  Número de Serie
                </label>
                <Controller
                  name="nroSerie"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="nroSerie"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Número de serie"
                    />
                  )}
                />
              </div>

              {/* Fecha de Vencimiento */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaVencimiento" className="block text-900 font-medium mb-2">
                  Fecha de Vencimiento
                </label>
                <Controller
                  name="fechaVencimiento"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaVencimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha de Producción */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaProduccion" className="block text-900 font-medium mb-2">
                  Fecha de Producción
                </label>
                <Controller
                  name="fechaProduccion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaProduccion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha de Ingreso */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaIngreso" className="block text-900 font-medium mb-2">
                  Fecha de Ingreso
                </label>
                <Controller
                  name="fechaIngreso"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaIngreso"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Ubicación y Saldos */}
          <TabPanel header="Ubicación y Saldos">
            <div className="grid">
              {/* Paleta de Almacén */}
              <div className="col-12 md:col-4">
                <label htmlFor="paletaAlmacenId" className="block text-900 font-medium mb-2">
                  Paleta de Almacén
                </label>
                <Controller
                  name="paletaAlmacenId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="paletaAlmacenId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={paletas.map(p => ({ ...p, id: Number(p.id) }))}
                      optionLabel="codigo"
                      optionValue="id"
                      placeholder="Seleccione una paleta"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Ubicación */}
              <div className="col-12 md:col-4">
                <label htmlFor="ubicacionId" className="block text-900 font-medium mb-2">
                  Ubicación
                </label>
                <Controller
                  name="ubicacionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="ubicacionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={ubicaciones.map(u => ({ 
                        ...u, 
                        id: Number(u.id),
                        descripcionCompleta: `${u.codigo} - ${u.descripcion}`
                      }))}
                      optionLabel="descripcionCompleta"
                      optionValue="id"
                      placeholder="Seleccione una ubicación"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Estado */}
              <div className="col-12 md:col-4">
                <label htmlFor="estadoId" className="block text-900 font-medium mb-2">
                  Estado
                </label>
                <Controller
                  name="estadoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={estados.map(e => ({ ...e, id: Number(e.id) }))}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione un estado"
                      showClear
                    />
                  )}
                />
              </div>

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

export default SaldosDetProductoClienteForm;
