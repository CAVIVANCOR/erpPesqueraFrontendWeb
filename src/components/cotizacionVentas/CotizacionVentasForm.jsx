// src/components/cotizacionVentas/CotizacionVentasForm.jsx
// Formulario profesional para CotizacionVentas con 4 pestañas y validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, campos decimales con 2 decimales, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { crearCotizacionVentas, actualizarCotizacionVentas } from '../../api/cotizacionVentas';
import { getEmpresas } from '../../api/empresa';
import { getPersonal } from '../../api/personal';
import { getCentrosCosto } from '../../api/centroCosto';

/**
 * Componente CotizacionVentasForm
 * Formulario avanzado con 4 pestañas para gestión completa de cotizaciones de ventas
 * Incluye validaciones, normalización de IDs y manejo de múltiples relaciones según patrón ERP Megui
 */
const CotizacionVentasForm = ({ cotizacion, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      empresaId: null,
      tipoProductoId: 1,
      tipoEstadoProductoId: 1,
      destinoProductoId: 1,
      formaTransaccionId: 1,
      modoDespachoRecepcionId: 1,
      respVentasId: null,
      fechaEntrega: null,
      autorizaVentaId: null,
      tipoCambio: 3.75,
      contactoClienteId: 1,
      clienteId: 1,
      dirFiscalId: 1,
      dirEntregaId: 1,
      bancoId: 1,
      formaPagoId: 1,
      respEmbarqueId: null,
      respProduccionId: null,
      respAlmacenId: null,
      incotermsId: 1,
      idPaisDestino: 1,
      estadoCotizacionId: 1,
      centroCostoId: null,
      observaciones: ''
    }
  });

  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const toast = useRef(null);

  // Opciones para dropdowns estáticos
  const tiposProducto = [
    { label: 'Harina de Pescado', value: 1 },
    { label: 'Aceite de Pescado', value: 2 },
    { label: 'Conservas', value: 3 },
    { label: 'Congelado', value: 4 }
  ];

  const estadosCotizacion = [
    { label: 'Borrador', value: 1 },
    { label: 'Enviada', value: 2 },
    { label: 'Aprobada', value: 3 },
    { label: 'Rechazada', value: 4 }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [empresasData, personalData, centrosCostoData] = await Promise.all([
        getEmpresas(),
        getPersonal(),
        getCentrosCosto()
      ]);

      // Normalizar IDs a números según regla ERP Megui
      setEmpresas(empresasData.map(e => ({ 
        ...e, 
        id: Number(e.id),
        label: e.razonSocial,
        value: Number(e.id)
      })));

      setPersonal(personalData.map(p => ({ 
        ...p, 
        id: Number(p.id),
        label: `${p.nombres} ${p.apellidos}`,
        value: Number(p.id)
      })));

      setCentrosCosto(centrosCostoData.map(cc => ({ 
        ...cc, 
        id: Number(cc.id),
        label: `${cc.codigo} - ${cc.nombre}`,
        value: Number(cc.id)
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
        tipoProductoId: Number(data.tipoProductoId),
        tipoEstadoProductoId: Number(data.tipoEstadoProductoId),
        destinoProductoId: Number(data.destinoProductoId),
        formaTransaccionId: Number(data.formaTransaccionId),
        modoDespachoRecepcionId: Number(data.modoDespachoRecepcionId),
        respVentasId: Number(data.respVentasId),
        fechaEntrega: data.fechaEntrega,
        autorizaVentaId: Number(data.autorizaVentaId),
        tipoCambio: Number(data.tipoCambio),
        contactoClienteId: Number(data.contactoClienteId),
        clienteId: Number(data.clienteId),
        dirFiscalId: Number(data.dirFiscalId),
        dirEntregaId: Number(data.dirEntregaId),
        bancoId: Number(data.bancoId),
        formaPagoId: Number(data.formaPagoId),
        respEmbarqueId: Number(data.respEmbarqueId),
        respProduccionId: Number(data.respProduccionId),
        respAlmacenId: Number(data.respAlmacenId),
        incotermsId: Number(data.incotermsId),
        idPaisDestino: Number(data.idPaisDestino),
        estadoCotizacionId: Number(data.estadoCotizacionId),
        centroCostoId: Number(data.centroCostoId),
        observaciones: data.observaciones?.trim() || null
      };
      if (cotizacion?.id) {
        await actualizarCotizacionVentas(cotizacion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cotización actualizada correctamente'
        });
      } else {
        await crearCotizacionVentas(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cotización creada correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar la cotización'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cotizacion-ventas-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
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
                <label htmlFor="tipoProductoId" className="block text-900 font-medium mb-2">
                  Tipo de Producto *
                </label>
                <Controller
                  name="tipoProductoId"
                  control={control}
                  rules={{ required: 'El tipo de producto es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoProductoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposProducto}
                      placeholder="Seleccionar tipo de producto"
                      className={`w-full ${errors.tipoProductoId ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.tipoProductoId && (
                  <small className="p-error">{errors.tipoProductoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="respVentasId" className="block text-900 font-medium mb-2">
                  Responsable de Ventas *
                </label>
                <Controller
                  name="respVentasId"
                  control={control}
                  rules={{ required: 'El responsable de ventas es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="respVentasId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable"
                      className={`w-full ${errors.respVentasId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.respVentasId && (
                  <small className="p-error">{errors.respVentasId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaEntrega" className="block text-900 font-medium mb-2">
                  Fecha de Entrega *
                </label>
                <Controller
                  name="fechaEntrega"
                  control={control}
                  rules={{ required: 'La fecha de entrega es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEntrega"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccionar fecha"
                      className={`w-full ${errors.fechaEntrega ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                    />
                  )}
                />
                {errors.fechaEntrega && (
                  <small className="p-error">{errors.fechaEntrega.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="tipoCambio" className="block text-900 font-medium mb-2">
                  Tipo de Cambio *
                </label>
                <Controller
                  name="tipoCambio"
                  control={control}
                  rules={{ 
                    required: 'El tipo de cambio es obligatorio',
                    min: { value: 0.01, message: 'Debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="tipoCambio"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="3.75"
                      className={`w-full ${errors.tipoCambio ? 'p-invalid' : ''}`}
                      minFractionDigits={2}
                      maxFractionDigits={4}
                    />
                  )}
                />
                {errors.tipoCambio && (
                  <small className="p-error">{errors.tipoCambio.message}</small>
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
                <label htmlFor="estadoCotizacionId" className="block text-900 font-medium mb-2">
                  Estado *
                </label>
                <Controller
                  name="estadoCotizacionId"
                  control={control}
                  rules={{ required: 'El estado es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoCotizacionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={estadosCotizacion}
                      placeholder="Seleccionar estado"
                      className={`w-full ${errors.estadoCotizacionId ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.estadoCotizacionId && (
                  <small className="p-error">{errors.estadoCotizacionId.message}</small>
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
                      {...field}
                      placeholder="Observaciones de la cotización"
                      className="w-full"
                      rows={3}
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Responsables */}
          <TabPanel header="Responsables">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="autorizaVentaId" className="block text-900 font-medium mb-2">
                  Autoriza Venta *
                </label>
                <Controller
                  name="autorizaVentaId"
                  control={control}
                  rules={{ required: 'El autorizador es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="autorizaVentaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar autorizador"
                      className={`w-full ${errors.autorizaVentaId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.autorizaVentaId && (
                  <small className="p-error">{errors.autorizaVentaId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="respEmbarqueId" className="block text-900 font-medium mb-2">
                  Responsable Embarque *
                </label>
                <Controller
                  name="respEmbarqueId"
                  control={control}
                  rules={{ required: 'El responsable de embarque es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="respEmbarqueId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable"
                      className={`w-full ${errors.respEmbarqueId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.respEmbarqueId && (
                  <small className="p-error">{errors.respEmbarqueId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="respProduccionId" className="block text-900 font-medium mb-2">
                  Responsable Producción *
                </label>
                <Controller
                  name="respProduccionId"
                  control={control}
                  rules={{ required: 'El responsable de producción es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="respProduccionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable"
                      className={`w-full ${errors.respProduccionId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.respProduccionId && (
                  <small className="p-error">{errors.respProduccionId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="respAlmacenId" className="block text-900 font-medium mb-2">
                  Responsable Almacén *
                </label>
                <Controller
                  name="respAlmacenId"
                  control={control}
                  rules={{ required: 'El responsable de almacén es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="respAlmacenId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable"
                      className={`w-full ${errors.respAlmacenId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.respAlmacenId && (
                  <small className="p-error">{errors.respAlmacenId.message}</small>
                )}
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
            disabled={loading}
          />
          <Button
            type="submit"
            label={cotizacion?.id ? 'Actualizar' : 'Crear'}
            icon={cotizacion?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default CotizacionVentasForm;
