// src/components/preFactura/PreFacturaForm.jsx
// Formulario profesional para PreFactura. Cumple regla transversal ERP Megui:
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
import { createPreFactura, updatePreFactura } from '../../api/preFactura';

/**
 * Formulario para gestión de PreFactura
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX debido a la cantidad de campos
 */
const PreFacturaForm = ({ preFactura, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [condicionesPago, setCondicionesPago] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const toast = useRef(null);

  // Observar montos para cálculos automáticos
  const subtotal = watch('subtotal');
  const impuestos = watch('impuestos');
  const descuentos = watch('descuentos');
  const total = (subtotal || 0) + (impuestos || 0) - (descuentos || 0);

  // Opciones para dropdowns
  const estadosOptions = [
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'FACTURADA', label: 'Facturada' },
    { value: 'CANCELADA', label: 'Cancelada' }
  ];

  const tipoDocumentoOptions = [
    { value: 'FACTURA', label: 'Factura' },
    { value: 'BOLETA', label: 'Boleta de Venta' },
    { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
    { value: 'NOTA_DEBITO', label: 'Nota de Débito' }
  ];

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (preFactura) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        numero: preFactura.numero || '',
        fechaEmision: preFactura.fechaEmision ? new Date(preFactura.fechaEmision) : new Date(),
        fechaVencimiento: preFactura.fechaVencimiento ? new Date(preFactura.fechaVencimiento) : null,
        tipoDocumento: preFactura.tipoDocumento || 'FACTURA',
        clienteId: preFactura.clienteId ? Number(preFactura.clienteId) : null,
        estado: preFactura.estado || 'BORRADOR',
        monedaId: preFactura.monedaId ? Number(preFactura.monedaId) : null,
        tipoCambio: preFactura.tipoCambio || 1,
        condicionPagoId: preFactura.condicionPagoId ? Number(preFactura.condicionPagoId) : null,
        subtotal: preFactura.subtotal || 0,
        impuestos: preFactura.impuestos || 0,
        descuentos: preFactura.descuentos || 0,
        total: preFactura.total || 0,
        vendedorId: preFactura.vendedorId ? Number(preFactura.vendedorId) : null,
        observaciones: preFactura.observaciones || '',
        terminosCondiciones: preFactura.terminosCondiciones || '',
        direccionEntrega: preFactura.direccionEntrega || '',
        movSalidaAlmacenId: preFactura.movSalidaAlmacenId ? Number(preFactura.movSalidaAlmacenId) : null,
        incotermId: preFactura.incotermId ? Number(preFactura.incotermId) : null
      });
    } else {
      // Reset para nuevo registro
      reset({
        numero: '',
        fechaEmision: new Date(),
        fechaVencimiento: null,
        tipoDocumento: 'FACTURA',
        clienteId: null,
        estado: 'BORRADOR',
        monedaId: null,
        tipoCambio: 1,
        condicionPagoId: null,
        subtotal: 0,
        impuestos: 0,
        descuentos: 0,
        total: 0,
        vendedorId: null,
        observaciones: '',
        terminosCondiciones: '',
        direccionEntrega: '',
        movSalidaAlmacenId: null,
        incotermId: null
      });
    }
  }, [preFactura, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setClientes([
        { id: 1, razonSocial: 'Cliente Corporativo SAC', ruc: '20123456789' },
        { id: 2, razonSocial: 'Empresa Pesquera del Norte EIRL', ruc: '20987654321' },
        { id: 3, razonSocial: 'Distribuidora Marina SA', ruc: '20456789123' }
      ]);
      
      setVendedores([
        { id: 1, nombres: 'Carlos', apellidos: 'Vendedor' },
        { id: 2, nombres: 'Ana', apellidos: 'Comercial' },
        { id: 3, nombres: 'Luis', apellidos: 'Ventas' }
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

      setAlmacenes([
        { id: 1, nombre: 'Almacén Principal', codigo: 'ALM-01' },
        { id: 2, nombre: 'Almacén Productos Terminados', codigo: 'ALM-02' },
        { id: 3, nombre: 'Almacén Materias Primas', codigo: 'ALM-03' }
      ]);

      setIncoterms([
        { id: 1, codigo: 'FOB', descripcion: 'Free On Board' },
        { id: 2, codigo: 'CIF', descripcion: 'Cost, Insurance and Freight' },
        { id: 3, codigo: 'EXW', descripcion: 'Ex Works' }
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
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento || null,
        tipoDocumento: data.tipoDocumento,
        clienteId: Number(data.clienteId),
        estado: data.estado,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        tipoCambio: Number(data.tipoCambio) || 1,
        condicionPagoId: data.condicionPagoId ? Number(data.condicionPagoId) : null,
        subtotal: Number(data.subtotal) || 0,
        impuestos: Number(data.impuestos) || 0,
        descuentos: Number(data.descuentos) || 0,
        total: total,
        vendedorId: data.vendedorId ? Number(data.vendedorId) : null,
        observaciones: data.observaciones || null,
        terminosCondiciones: data.terminosCondiciones || null,
        direccionEntrega: data.direccionEntrega || null,
        movSalidaAlmacenId: data.movSalidaAlmacenId ? Number(data.movSalidaAlmacenId) : null,
        incotermId: data.incotermId ? Number(data.incotermId) : null
      };

      console.log('Payload PreFactura:', payload); // Log para depuración

      if (preFactura?.id) {
        await updatePreFactura(preFactura.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pre-factura actualizada correctamente'
        });
      } else {
        await createPreFactura(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pre-factura creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la pre-factura'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pre-factura-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Número */}
              <div className="col-12 md:col-6">
                <label htmlFor="numero" className="block text-900 font-medium mb-2">
                  Número de Pre-Factura *
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
                      placeholder="PF-2024-001"
                      className={errors.numero ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.numero && (
                  <small className="p-error">{errors.numero.message}</small>
                )}
              </div>

              {/* Tipo de Documento */}
              <div className="col-12 md:col-6">
                <label htmlFor="tipoDocumento" className="block text-900 font-medium mb-2">
                  Tipo de Documento *
                </label>
                <Controller
                  name="tipoDocumento"
                  control={control}
                  rules={{ required: 'El tipo de documento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoDocumento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={tipoDocumentoOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione tipo de documento"
                      className={errors.tipoDocumento ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.tipoDocumento && (
                  <small className="p-error">{errors.tipoDocumento.message}</small>
                )}
              </div>

              {/* Fecha Emisión */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaEmision" className="block text-900 font-medium mb-2">
                  Fecha de Emisión *
                </label>
                <Controller
                  name="fechaEmision"
                  control={control}
                  rules={{ required: 'La fecha de emisión es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEmision"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      className={errors.fechaEmision ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaEmision && (
                  <small className="p-error">{errors.fechaEmision.message}</small>
                )}
              </div>

              {/* Fecha Vencimiento */}
              <div className="col-12 md:col-6">
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

              {/* Cliente */}
              <div className="col-12">
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
                      options={clientes.map(c => ({ 
                        ...c, 
                        id: Number(c.id),
                        nombreCompleto: `${c.ruc} - ${c.razonSocial}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un cliente"
                      className={errors.clienteId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.clienteId && (
                  <small className="p-error">{errors.clienteId.message}</small>
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

              {/* Vendedor */}
              <div className="col-12 md:col-6">
                <label htmlFor="vendedorId" className="block text-900 font-medium mb-2">
                  Vendedor
                </label>
                <Controller
                  name="vendedorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="vendedorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={vendedores.map(v => ({ 
                        ...v, 
                        id: Number(v.id),
                        nombreCompleto: `${v.nombres} ${v.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un vendedor"
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

              {/* Subtotal */}
              <div className="col-12 md:col-3">
                <label htmlFor="subtotal" className="block text-900 font-medium mb-2">
                  Subtotal
                </label>
                <Controller
                  name="subtotal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="subtotal"
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

              {/* Impuestos */}
              <div className="col-12 md:col-3">
                <label htmlFor="impuestos" className="block text-900 font-medium mb-2">
                  Impuestos
                </label>
                <Controller
                  name="impuestos"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="impuestos"
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

              {/* Descuentos */}
              <div className="col-12 md:col-3">
                <label htmlFor="descuentos" className="block text-900 font-medium mb-2">
                  Descuentos
                </label>
                <Controller
                  name="descuentos"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="descuentos"
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

              {/* Total (Calculado) */}
              <div className="col-12 md:col-3">
                <label className="block text-900 font-medium mb-2">
                  Total
                </label>
                <div className="p-inputtext p-component p-disabled">
                  S/ {total.toFixed(2)}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Detalles Adicionales */}
          <TabPanel header="Detalles Adicionales">
            <div className="grid">
              {/* Movimiento Salida Almacén */}
              <div className="col-12 md:col-6">
                <label htmlFor="movSalidaAlmacenId" className="block text-900 font-medium mb-2">
                  Movimiento de Salida de Almacén
                </label>
                <Controller
                  name="movSalidaAlmacenId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="movSalidaAlmacenId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={almacenes.map(a => ({ 
                        ...a, 
                        id: Number(a.id),
                        nombreCompleto: `${a.codigo} - ${a.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione almacén"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Incoterm */}
              <div className="col-12 md:col-6">
                <label htmlFor="incotermId" className="block text-900 font-medium mb-2">
                  Incoterm
                </label>
                <Controller
                  name="incotermId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="incotermId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={incoterms.map(i => ({ 
                        ...i, 
                        id: Number(i.id),
                        nombreCompleto: `${i.codigo} - ${i.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione incoterm"
                      showClear
                    />
                  )}
                />
              </div>

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
                      placeholder="Términos y condiciones de la pre-factura..."
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
            label={preFactura?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default PreFacturaForm;
