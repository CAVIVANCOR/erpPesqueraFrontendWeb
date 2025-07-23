// src/components/cotizacionCompras/CotizacionComprasForm.jsx
// Formulario profesional para CotizacionCompras con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearCotizacionCompras, actualizarCotizacionCompras } from '../../api/cotizacionCompras';
import { getEmpresas } from '../../api/empresa';
import { getTiposProducto } from '../../api/tipoProducto';
import { getAllTipoEstadoProducto } from '../../api/tipoEstadoProducto';
import { getDestinosProducto } from '../../api/destinoProducto';
import { getAllFormaTransaccion } from '../../api/formaTransaccion';
import { getAllModoDespachoRecepcion } from '../../api/modoDespachoRecepcion';
import { getPersonal } from '../../api/personal';
import { getBancos } from '../../api/banco';
import { getEntidadesComerciales } from '../../api/entidadComercial';
import { getContactosEntidad } from '../../api/contactoEntidad';
import { getDireccionesEntidad } from '../../api/direccionEntidad';

/**
 * Componente CotizacionComprasForm
 * Formulario para gestión de cotizaciones de compras con múltiples pestañas
 * Incluye validaciones y relaciones complejas según patrón ERP Megui
 */
const CotizacionComprasForm = ({ cotizacion, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      empresaId: null,
      tipoProductoId: null,
      tipoEstadoProductoId: null,
      destinoProductoId: null,
      formaTransaccionId: null,
      modoDespachoRecepcionId: null,
      respComprasId: null,
      respProduccionId: null,
      fechaEntrega: null,
      autorizaCompraId: null,
      tipoCambio: 1.0000,
      contactoProveedorId: null,
      direccionProveedorId: null,
      proveedorMateriaPrimaId: null,
      bancoId: null
    }
  });

  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstado, setTiposEstado] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [formasTransaccion, setFormasTransaccion] = useState([]);
  const [modosDespacho, setModosDespacho] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const toast = useRef(null);

  // Observar proveedor seleccionado para filtrar contactos y direcciones
  const proveedorSeleccionado = watch('proveedorMateriaPrimaId');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (cotizacion) {
      // Cargar datos de la cotización para edición
      reset({
        empresaId: cotizacion.empresaId ? Number(cotizacion.empresaId) : null,
        tipoProductoId: cotizacion.tipoProductoId ? Number(cotizacion.tipoProductoId) : null,
        tipoEstadoProductoId: cotizacion.tipoEstadoProductoId ? Number(cotizacion.tipoEstadoProductoId) : null,
        destinoProductoId: cotizacion.destinoProductoId ? Number(cotizacion.destinoProductoId) : null,
        formaTransaccionId: cotizacion.formaTransaccionId ? Number(cotizacion.formaTransaccionId) : null,
        modoDespachoRecepcionId: cotizacion.modoDespachoRecepcionId ? Number(cotizacion.modoDespachoRecepcionId) : null,
        respComprasId: cotizacion.respComprasId ? Number(cotizacion.respComprasId) : null,
        respProduccionId: cotizacion.respProduccionId ? Number(cotizacion.respProduccionId) : null,
        fechaEntrega: cotizacion.fechaEntrega ? new Date(cotizacion.fechaEntrega) : null,
        autorizaCompraId: cotizacion.autorizaCompraId ? Number(cotizacion.autorizaCompraId) : null,
        tipoCambio: Number(cotizacion.tipoCambio) || 1.0000,
        contactoProveedorId: cotizacion.contactoProveedorId ? Number(cotizacion.contactoProveedorId) : null,
        direccionProveedorId: cotizacion.direccionProveedorId ? Number(cotizacion.direccionProveedorId) : null,
        proveedorMateriaPrimaId: cotizacion.proveedorMateriaPrimaId ? Number(cotizacion.proveedorMateriaPrimaId) : null,
        bancoId: cotizacion.bancoId ? Number(cotizacion.bancoId) : null
      });
    }
  }, [cotizacion, reset]);

  useEffect(() => {
    // Filtrar contactos y direcciones cuando cambia el proveedor
    if (proveedorSeleccionado) {
      cargarContactosYDirecciones(proveedorSeleccionado);
    }
  }, [proveedorSeleccionado]);

  const cargarDatos = async () => {
    try {
      const [
        empresasData,
        tiposProductoData,
        tiposEstadoData,
        destinosData,
        formasTransaccionData,
        modosDespachoData,
        personalData,
        bancosData,
        proveedoresData
      ] = await Promise.all([
        getEmpresas(),
        getTiposProducto(),
        getTiposEstadoProducto(),
        getDestinosProducto(),
        getFormasTransaccion(),
        getModosDespachoRecepcion(),
        getPersonal(),
        getBancos(),
        getEntidadesComerciales()
      ]);

      // Normalizar IDs según regla ERP Megui
      setEmpresas(empresasData.map(e => ({
        ...e,
        id: Number(e.id),
        label: e.razonSocial,
        value: Number(e.id)
      })));

      setTiposProducto(tiposProductoData.map(t => ({
        ...t,
        id: Number(t.id),
        label: t.nombre,
        value: Number(t.id)
      })));

      setTiposEstado(tiposEstadoData.map(t => ({
        ...t,
        id: Number(t.id),
        label: t.nombre,
        value: Number(t.id)
      })));

      setDestinos(destinosData.map(d => ({
        ...d,
        id: Number(d.id),
        label: d.nombre,
        value: Number(d.id)
      })));

      setFormasTransaccion(formasTransaccionData.map(f => ({
        ...f,
        id: Number(f.id),
        label: f.nombre,
        value: Number(f.id)
      })));

      setModosDespacho(modosDespachoData.map(m => ({
        ...m,
        id: Number(m.id),
        label: m.nombre,
        value: Number(m.id)
      })));

      setPersonal(personalData.map(p => ({
        ...p,
        id: Number(p.id),
        label: `${p.nombres} ${p.apellidos}`,
        value: Number(p.id)
      })));

      setBancos(bancosData.map(b => ({
        ...b,
        id: Number(b.id),
        label: b.nombre,
        value: Number(b.id)
      })));

      // Filtrar solo proveedores
      setProveedores(proveedoresData
        .filter(p => p.esProveedor)
        .map(p => ({
          ...p,
          id: Number(p.id),
          label: p.razonSocial,
          value: Number(p.id)
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

  const cargarContactosYDirecciones = async (proveedorId) => {
    try {
      const [contactosData, direccionesData] = await Promise.all([
        getContactosEntidad(),
        getDireccionesEntidad()
      ]);

      // Filtrar por proveedor seleccionado
      const contactosFiltrados = contactosData
        .filter(c => Number(c.entidadComercialId) === Number(proveedorId))
        .map(c => ({
          ...c,
          id: Number(c.id),
          label: `${c.nombres} ${c.apellidos} - ${c.cargo || 'Sin cargo'}`,
          value: Number(c.id)
        }));

      const direccionesFiltradas = direccionesData
        .filter(d => Number(d.entidadComercialId) === Number(proveedorId))
        .map(d => ({
          ...d,
          id: Number(d.id),
          label: `${d.direccion} - ${d.distrito || 'Sin distrito'}`,
          value: Number(d.id)
        }));

      setContactos(contactosFiltrados);
      setDirecciones(direccionesFiltradas);

    } catch (error) {
      console.error('Error al cargar contactos y direcciones:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validaciones de negocio
      if (data.fechaEntrega && new Date(data.fechaEntrega) <= new Date()) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'La fecha de entrega debe ser posterior a la fecha actual'
        });
        return;
      }

      // Preparar payload con validaciones
      const payload = {
        empresaId: Number(data.empresaId),
        tipoProductoId: Number(data.tipoProductoId),
        tipoEstadoProductoId: Number(data.tipoEstadoProductoId),
        destinoProductoId: Number(data.destinoProductoId),
        formaTransaccionId: Number(data.formaTransaccionId),
        modoDespachoRecepcionId: data.modoDespachoRecepcionId ? Number(data.modoDespachoRecepcionId) : null,
        respComprasId: data.respComprasId ? Number(data.respComprasId) : null,
        respProduccionId: data.respProduccionId ? Number(data.respProduccionId) : null,
        fechaEntrega: data.fechaEntrega ? data.fechaEntrega.toISOString() : null,
        autorizaCompraId: data.autorizaCompraId ? Number(data.autorizaCompraId) : null,
        tipoCambio: Number(data.tipoCambio) || null,
        contactoProveedorId: data.contactoProveedorId ? Number(data.contactoProveedorId) : null,
        direccionProveedorId: data.direccionProveedorId ? Number(data.direccionProveedorId) : null,
        proveedorMateriaPrimaId: data.proveedorMateriaPrimaId ? Number(data.proveedorMateriaPrimaId) : null,
        bancoId: data.bancoId ? Number(data.bancoId) : null
      };

      console.log('Payload CotizacionCompras:', payload);

      if (cotizacion?.id) {
        await actualizarCotizacionCompras(cotizacion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cotización de compras actualizada correctamente'
        });
      } else {
        await crearCotizacionCompras(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cotización de compras creada correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar cotización de compras:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar la cotización de compras'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cotizacion-compras-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabView>
          <TabPanel header="Información General" leftIcon="pi pi-info-circle">
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
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar tipo de producto"
                      className={`w-full ${errors.tipoProductoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.tipoProductoId && (
                  <small className="p-error">{errors.tipoProductoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="tipoEstadoProductoId" className="block text-900 font-medium mb-2">
                  Estado del Producto *
                </label>
                <Controller
                  name="tipoEstadoProductoId"
                  control={control}
                  rules={{ required: 'El estado del producto es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoEstadoProductoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposEstado}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar estado del producto"
                      className={`w-full ${errors.tipoEstadoProductoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.tipoEstadoProductoId && (
                  <small className="p-error">{errors.tipoEstadoProductoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="destinoProductoId" className="block text-900 font-medium mb-2">
                  Destino del Producto *
                </label>
                <Controller
                  name="destinoProductoId"
                  control={control}
                  rules={{ required: 'El destino del producto es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="destinoProductoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={destinos}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar destino del producto"
                      className={`w-full ${errors.destinoProductoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.destinoProductoId && (
                  <small className="p-error">{errors.destinoProductoId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="formaTransaccionId" className="block text-900 font-medium mb-2">
                  Forma de Transacción *
                </label>
                <Controller
                  name="formaTransaccionId"
                  control={control}
                  rules={{ required: 'La forma de transacción es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="formaTransaccionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={formasTransaccion}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar forma de transacción"
                      className={`w-full ${errors.formaTransaccionId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.formaTransaccionId && (
                  <small className="p-error">{errors.formaTransaccionId.message}</small>
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
                      placeholder="Seleccionar fecha de entrega"
                      className={`w-full ${errors.fechaEntrega ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                      minDate={new Date()}
                    />
                  )}
                />
                {errors.fechaEntrega && (
                  <small className="p-error">{errors.fechaEntrega.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Responsables y Logística" leftIcon="pi pi-users">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="respComprasId" className="block text-900 font-medium mb-2">
                  Responsable de Compras
                </label>
                <Controller
                  name="respComprasId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="respComprasId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable de compras"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="respProduccionId" className="block text-900 font-medium mb-2">
                  Responsable de Producción
                </label>
                <Controller
                  name="respProduccionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="respProduccionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar responsable de producción"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="autorizaCompraId" className="block text-900 font-medium mb-2">
                  Autoriza Compra
                </label>
                <Controller
                  name="autorizaCompraId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="autorizaCompraId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar quien autoriza la compra"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="modoDespachoRecepcionId" className="block text-900 font-medium mb-2">
                  Modo de Despacho/Recepción
                </label>
                <Controller
                  name="modoDespachoRecepcionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="modoDespachoRecepcionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={modosDespacho}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar modo de despacho/recepción"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Proveedor y Financiero" leftIcon="pi pi-dollar">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="proveedorMateriaPrimaId" className="block text-900 font-medium mb-2">
                  Proveedor de Materia Prima
                </label>
                <Controller
                  name="proveedorMateriaPrimaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="proveedorMateriaPrimaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={proveedores}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar proveedor"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="contactoProveedorId" className="block text-900 font-medium mb-2">
                  Contacto del Proveedor
                </label>
                <Controller
                  name="contactoProveedorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="contactoProveedorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={contactos}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar contacto del proveedor"
                      className="w-full"
                      filter
                      showClear
                      disabled={!proveedorSeleccionado}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="direccionProveedorId" className="block text-900 font-medium mb-2">
                  Dirección del Proveedor
                </label>
                <Controller
                  name="direccionProveedorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="direccionProveedorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={direcciones}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar dirección del proveedor"
                      className="w-full"
                      filter
                      showClear
                      disabled={!proveedorSeleccionado}
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="bancoId" className="block text-900 font-medium mb-2">
                  Banco
                </label>
                <Controller
                  name="bancoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="bancoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={bancos}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar banco"
                      className="w-full"
                      filter
                      showClear
                    />
                  )}
                />
              </div>

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
                      placeholder="Tipo de cambio"
                      className="w-full"
                      minFractionDigits={4}
                      maxFractionDigits={4}
                      min={0}
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

export default CotizacionComprasForm;
