// src/components/ordenCompra/OrdenCompraForm.jsx
// Formulario profesional para OrdenCompra. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createOrdenCompra, updateOrdenCompra } from '../../api/ordenCompra';

/**
 * Formulario para gestión de OrdenCompra
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX debido a la cantidad de campos
 */
const OrdenCompraForm = ({ orden, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [compradores, setCompradores] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [condicionesPago, setCondicionesPago] = useState([]);
  const toast = useRef(null);

  // Observar montos para cálculos automáticos
  const montoSubtotal = watch('montoSubtotal');
  const montoImpuestos = watch('montoImpuestos');
  const montoDescuento = watch('montoDescuento');
  const montoFinal = (montoSubtotal || 0) + (montoImpuestos || 0) - (montoDescuento || 0);

  // Opciones para dropdowns
  const estadosOptions = [
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'ENVIADA', label: 'Enviada' },
    { value: 'CONFIRMADA', label: 'Confirmada' },
    { value: 'RECIBIDA', label: 'Recibida' },
    { value: 'FACTURADA', label: 'Facturada' },
    { value: 'CANCELADA', label: 'Cancelada' }
  ];

  const prioridadOptions = [
    { value: 'ALTA', label: 'Alta' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'BAJA', label: 'Baja' }
  ];

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (orden) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        numero: orden.numero || '',
        fechaOrden: orden.fechaOrden ? new Date(orden.fechaOrden) : new Date(),
        fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : null,
        proveedorId: orden.proveedorId ? Number(orden.proveedorId) : null,
        estado: orden.estado || 'BORRADOR',
        prioridad: orden.prioridad || 'MEDIA',
        compradorId: orden.compradorId ? Number(orden.compradorId) : null,
        centroCostoId: orden.centroCostoId ? Number(orden.centroCostoId) : null,
        monedaId: orden.monedaId ? Number(orden.monedaId) : null,
        tipoCambio: orden.tipoCambio || 1,
        condicionPagoId: orden.condicionPagoId ? Number(orden.condicionPagoId) : null,
        montoSubtotal: orden.montoSubtotal || 0,
        montoImpuestos: orden.montoImpuestos || 0,
        montoDescuento: orden.montoDescuento || 0,
        montoTotal: orden.montoTotal || 0,
        montoFinal: orden.montoFinal || 0,
        observaciones: orden.observaciones || '',
        terminosCondiciones: orden.terminosCondiciones || '',
        direccionEntrega: orden.direccionEntrega || '',
        contactoProveedor: orden.contactoProveedor || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        numero: '',
        fechaOrden: new Date(),
        fechaEntrega: null,
        proveedorId: null,
        estado: 'BORRADOR',
        prioridad: 'MEDIA',
        compradorId: null,
        centroCostoId: null,
        monedaId: null,
        tipoCambio: 1,
        condicionPagoId: null,
        montoSubtotal: 0,
        montoImpuestos: 0,
        montoDescuento: 0,
        montoTotal: 0,
        montoFinal: 0,
        observaciones: '',
        terminosCondiciones: '',
        direccionEntrega: '',
        contactoProveedor: ''
      });
    }
  }, [orden, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setProveedores([
        { id: 1, razonSocial: 'Proveedor Industrial SAC', ruc: '20123456789' },
        { id: 2, razonSocial: 'Suministros Marítimos EIRL', ruc: '20987654321' },
        { id: 3, razonSocial: 'Equipos y Repuestos SA', ruc: '20456789123' }
      ]);
      
      setCompradores([
        { id: 1, nombres: 'Ana', apellidos: 'Martín' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez' },
        { id: 3, nombres: 'Elena', apellidos: 'Torres' }
      ]);

      setCentrosCosto([
        { id: 1, nombre: 'Administración', codigo: 'ADM' },
        { id: 2, nombre: 'Producción', codigo: 'PROD' },
        { id: 3, nombre: 'Mantenimiento', codigo: 'MANT' }
      ]);

      setMonedas([
        { id: 1, nombre: 'Soles', codigo: 'PEN', simbolo: 'S/' },
        { id: 2, nombre: 'Dólares', codigo: 'USD', simbolo: '$' }
      ]);

      setCondicionesPago([
        { id: 1, descripcion: 'Contado', dias: 0 },
        { id: 2, descripcion: '30 días', dias: 30 },
        { id: 3, descripcion: '60 días', dias: 60 },
        { id: 4, descripcion: '90 días', dias: 90 }
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
        numero: data.numero,
        fechaOrden: data.fechaOrden,
        fechaEntrega: data.fechaEntrega || null,
        proveedorId: Number(data.proveedorId),
        estado: data.estado,
        prioridad: data.prioridad,
        compradorId: data.compradorId ? Number(data.compradorId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        tipoCambio: Number(data.tipoCambio) || 1,
        condicionPagoId: data.condicionPagoId ? Number(data.condicionPagoId) : null,
        montoSubtotal: Number(data.montoSubtotal) || 0,
        montoImpuestos: Number(data.montoImpuestos) || 0,
        montoDescuento: Number(data.montoDescuento) || 0,
        montoTotal: Number(data.montoTotal) || 0,
        montoFinal: montoFinal,
        observaciones: data.observaciones || null,
        terminosCondiciones: data.terminosCondiciones || null,
        direccionEntrega: data.direccionEntrega || null,
        contactoProveedor: data.contactoProveedor || null
      };
      if (orden?.id) {
        await updateOrdenCompra(orden.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de compra actualizada correctamente'
        });
      } else {
        await createOrdenCompra(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de compra creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la orden de compra'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orden-compra-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Número */}
              <div className="col-12 md:col-6">
                <label htmlFor="numero" className="block text-900 font-medium mb-2">
                  Número de Orden *
                </label>
                <Controller
                  name="numero"
                  control={control}
                  rules={{ required: 'El número es obligatorio' }}
                  render={({ field }) => (
                    <InputText
                      id="numero"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="OC-2024-001"
                      className={errors.numero ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.numero && (
                  <small className="p-error">{errors.numero.message}</small>
                )}
              </div>

              {/* Estado */}
              <div className="col-12 md:col-6">
                <label htmlFor="estado" className="block text-900 font-medium mb-2">
                  Estado *
                </label>
                <Controller
                  name="estado"
                  control={control}
                  rules={{ required: 'El estado es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="estado"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={estadosOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione un estado"
                      className={errors.estado ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.estado && (
                  <small className="p-error">{errors.estado.message}</small>
                )}
              </div>

              {/* Fecha Orden */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaOrden" className="block text-900 font-medium mb-2">
                  Fecha de Orden *
                </label>
                <Controller
                  name="fechaOrden"
                  control={control}
                  rules={{ required: 'La fecha de orden es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaOrden"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      className={errors.fechaOrden ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaOrden && (
                  <small className="p-error">{errors.fechaOrden.message}</small>
                )}
              </div>

              {/* Fecha Entrega */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaEntrega" className="block text-900 font-medium mb-2">
                  Fecha de Entrega
                </label>
                <Controller
                  name="fechaEntrega"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEntrega"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Proveedor */}
              <div className="col-12">
                <label htmlFor="proveedorId" className="block text-900 font-medium mb-2">
                  Proveedor *
                </label>
                <Controller
                  name="proveedorId"
                  control={control}
                  rules={{ required: 'El proveedor es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="proveedorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={proveedores.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.ruc} - ${p.razonSocial}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un proveedor"
                      className={errors.proveedorId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.proveedorId && (
                  <small className="p-error">{errors.proveedorId.message}</small>
                )}
              </div>

              {/* Prioridad */}
              <div className="col-12 md:col-4">
                <label htmlFor="prioridad" className="block text-900 font-medium mb-2">
                  Prioridad *
                </label>
                <Controller
                  name="prioridad"
                  control={control}
                  rules={{ required: 'La prioridad es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="prioridad"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={prioridadOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione prioridad"
                      className={errors.prioridad ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.prioridad && (
                  <small className="p-error">{errors.prioridad.message}</small>
                )}
              </div>

              {/* Comprador */}
              <div className="col-12 md:col-4">
                <label htmlFor="compradorId" className="block text-900 font-medium mb-2">
                  Comprador
                </label>
                <Controller
                  name="compradorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="compradorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={compradores.map(c => ({ 
                        ...c, 
                        id: Number(c.id),
                        nombreCompleto: `${c.nombres} ${c.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione comprador"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Centro de Costo */}
              <div className="col-12 md:col-4">
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
                      placeholder="Seleccione centro de costo"
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Montos y Condiciones */}
          <TabPanel header="Montos y Condiciones">
            <div className="grid">
              {/* Moneda */}
              <div className="col-12 md:col-6">
                <label htmlFor="monedaId" className="block text-900 font-medium mb-2">
                  Moneda
                </label>
                <Controller
                  name="monedaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="monedaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={monedas.map(m => ({ 
                        ...m, 
                        id: Number(m.id),
                        nombreCompleto: `${m.simbolo} - ${m.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione moneda"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Tipo de Cambio */}
              <div className="col-12 md:col-6">
                <label htmlFor="tipoCambio" className="block text-900 font-medium mb-2">
                  Tipo de Cambio
                </label>
                <Controller
                  name="tipoCambio"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="tipoCambio"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={4}
                      maxFractionDigits={4}
                      min={0}
                      placeholder="1.0000"
                    />
                  )}
                />
              </div>

              {/* Condición de Pago */}
              <div className="col-12">
                <label htmlFor="condicionPagoId" className="block text-900 font-medium mb-2">
                  Condición de Pago
                </label>
                <Controller
                  name="condicionPagoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="condicionPagoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={condicionesPago.map(cp => ({ 
                        ...cp, 
                        id: Number(cp.id),
                        nombreCompleto: `${cp.descripcion} (${cp.dias} días)`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione condición de pago"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Monto Subtotal */}
              <div className="col-12 md:col-3">
                <label htmlFor="montoSubtotal" className="block text-900 font-medium mb-2">
                  Subtotal
                </label>
                <Controller
                  name="montoSubtotal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="montoSubtotal"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="S/ 0.00"
                    />
                  )}
                />
              </div>

              {/* Monto Impuestos */}
              <div className="col-12 md:col-3">
                <label htmlFor="montoImpuestos" className="block text-900 font-medium mb-2">
                  Impuestos
                </label>
                <Controller
                  name="montoImpuestos"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="montoImpuestos"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="S/ 0.00"
                    />
                  )}
                />
              </div>

              {/* Monto Descuento */}
              <div className="col-12 md:col-3">
                <label htmlFor="montoDescuento" className="block text-900 font-medium mb-2">
                  Descuento
                </label>
                <Controller
                  name="montoDescuento"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="montoDescuento"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      placeholder="S/ 0.00"
                    />
                  )}
                />
              </div>

              {/* Monto Final (Calculado) */}
              <div className="col-12 md:col-3">
                <label className="block text-900 font-medium mb-2">
                  Total Final
                </label>
                <div className="p-inputtext p-component p-disabled">
                  S/ {montoFinal.toFixed(2)}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Detalles Adicionales */}
          <TabPanel header="Detalles Adicionales">
            <div className="grid">
              {/* Dirección de Entrega */}
              <div className="col-12">
                <label htmlFor="direccionEntrega" className="block text-900 font-medium mb-2">
                  Dirección de Entrega
                </label>
                <Controller
                  name="direccionEntrega"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="direccionEntrega"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={2}
                      placeholder="Dirección completa de entrega..."
                    />
                  )}
                />
              </div>

              {/* Contacto Proveedor */}
              <div className="col-12">
                <label htmlFor="contactoProveedor" className="block text-900 font-medium mb-2">
                  Contacto del Proveedor
                </label>
                <Controller
                  name="contactoProveedor"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="contactoProveedor"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={2}
                      placeholder="Información de contacto del proveedor..."
                    />
                  )}
                />
              </div>

              {/* Términos y Condiciones */}
              <div className="col-12">
                <label htmlFor="terminosCondiciones" className="block text-900 font-medium mb-2">
                  Términos y Condiciones
                </label>
                <Controller
                  name="terminosCondiciones"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="terminosCondiciones"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={4}
                      placeholder="Términos y condiciones de la orden de compra..."
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
                      placeholder="Observaciones adicionales..."
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
            label={orden?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default OrdenCompraForm;
