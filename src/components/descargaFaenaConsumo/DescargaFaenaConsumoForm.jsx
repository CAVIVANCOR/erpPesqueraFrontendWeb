// src/components/descargaFaenaConsumo/DescargaFaenaConsumoForm.jsx
// Formulario profesional para DescargaFaenaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearDescargaFaenaConsumo, actualizarDescargaFaenaConsumo } from '../../api/descargaFaenaConsumo';
// Importar APIs necesarias según tabla de equivalencias
import { getFaenasPescaConsumo } from '../../api/faenaPescaConsumo';
import { getEmbarcaciones } from '../../api/embarcacion';
import { getPuertosPesca } from '../../api/puertoPesca';
import { getEmpresas } from '../../api/empresa';
import { getPersonal } from '../../api/personal';
// Importar API centralizada de estados
import { getEstadosMultiFuncion } from '../../api/estadoMultiFuncion';

/**
 * Formulario para gestión de DescargaFaenaConsumo
 * Organizado en pestañas para mejor UX
 */
const DescargaFaenaConsumoForm = ({ descarga, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [estadosProducto, setEstadosProducto] = useState([]);
  const [calidadesProducto, setCalidadesProducto] = useState([]);
  const [estadosDescarga, setEstadosDescarga] = useState([]);
  const toast = useRef(null);

  const pesoTotalDescargado = watch('pesoTotalDescargado');
  const pesoTotalDeclarado = watch('pesoTotalDeclarado');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (descarga) {
      reset({
        faenaPescaConsumoId: descarga.faenaPescaConsumoId ? Number(descarga.faenaPescaConsumoId) : null,
        embarcacionId: descarga.embarcacionId ? Number(descarga.embarcacionId) : null,
        puertoDescargaId: descarga.puertoDescargaId ? Number(descarga.puertoDescargaId) : null,
        empresaId: descarga.empresaId ? Number(descarga.empresaId) : null,
        numeroDescarga: descarga.numeroDescarga || '',
        pesoTotalDescargado: descarga.pesoTotalDescargado || null,
        pesoTotalDeclarado: descarga.pesoTotalDeclarado || null,
        temperaturaProducto: descarga.temperaturaProducto || null,
        estadoProductoId: descarga.estadoProductoId ? Number(descarga.estadoProductoId) : null,
        calidadProductoId: descarga.calidadProductoId ? Number(descarga.calidadProductoId) : null,
        observaciones: descarga.observaciones || '',
        estadoDescargaId: descarga.estadoDescargaId ? Number(descarga.estadoDescargaId) : null,
        fechaHoraFondeo: descarga.fechaHoraFondeo ? new Date(descarga.fechaHoraFondeo) : null,
        latitudFondeo: descarga.latitudFondeo || null,
        longitudFondeo: descarga.longitudFondeo || null,
        puertoFondeoId: descarga.puertoFondeoId ? Number(descarga.puertoFondeoId) : null,
        fechaHoraArriboPuerto: descarga.fechaHoraArriboPuerto ? new Date(descarga.fechaHoraArriboPuerto) : null,
        fechaHoraLlegadaPuerto: descarga.fechaHoraLlegadaPuerto ? new Date(descarga.fechaHoraLlegadaPuerto) : null,
        fechaHoraInicioDescarga: descarga.fechaHoraInicioDescarga ? new Date(descarga.fechaHoraInicioDescarga) : null,
        fechaHoraFinDescarga: descarga.fechaHoraFinDescarga ? new Date(descarga.fechaHoraFinDescarga) : null
      });
    } else {
      reset({
        faenaPescaConsumoId: null,
        embarcacionId: null,
        puertoDescargaId: null,
        empresaId: null,
        numeroDescarga: '',
        pesoTotalDescargado: null,
        pesoTotalDeclarado: null,
        temperaturaProducto: null,
        estadoProductoId: null,
        calidadProductoId: null,
        observaciones: '',
        estadoDescargaId: null,
        fechaHoraFondeo: null,
        latitudFondeo: null,
        longitudFondeo: null,
        puertoFondeoId: null,
        fechaHoraArriboPuerto: null,
        fechaHoraLlegadaPuerto: null,
        fechaHoraInicioDescarga: null,
        fechaHoraFinDescarga: null
      });
    }
  }, [descarga, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar FaenaPescaConsumo desde API
      const faenasData = await getFaenasPescaConsumo();
      setFaenas(faenasData.map(f => ({
        label: `${f.numeroFaena || `Faena ${f.id}`} - ${f.embarcacion?.nombre || ''}`,
        value: Number(f.id)
      })));

      // Cargar Embarcaciones desde API
      const embarcacionesData = await getEmbarcaciones();
      setEmbarcaciones(embarcacionesData.map(e => ({
        label: `${e.nombre} - ${e.matricula || ''}`,
        value: Number(e.id)
      })));

      // Cargar Puertos desde API
      const puertosData = await getPuertosPesca();
      setPuertos(puertosData.map(p => ({
        label: `${p.nombre} - ${p.codigo || ''}`,
        value: Number(p.id)
      })));

      // Cargar Empresas desde API
      const empresasData = await getEmpresas();
      setEmpresas(empresasData.map(e => ({
        label: `${e.razonSocial} - ${e.ruc || ''}`,
        value: Number(e.id)
      })));

      // Cargar Personal desde API
      const personalData = await getPersonal();
      setPersonal(personalData.map(p => ({
        label: `${p.nombres} ${p.apellidos}`,
        value: Number(p.id)
      })));

      // Cargar Estados de Producto desde EstadoMultiFuncion
      const estadosProductoData = await getEstadosMultiFuncion('ESTADO_PRODUCTO');
      setEstadosProducto(estadosProductoData.map(ep => ({
        label: ep.nombre,
        value: Number(ep.id)
      })));

      // Cargar Calidades de Producto desde EstadoMultiFuncion
      const calidadesProductoData = await getEstadosMultiFuncion('CALIDAD_PRODUCTO');
      setCalidadesProducto(calidadesProductoData.map(cp => ({
        label: cp.nombre,
        value: Number(cp.id)
      })));

      // Cargar Estados de Descarga desde EstadoMultiFuncion
      const estadosDescargaData = await getEstadosMultiFuncion('ESTADO_DESCARGA');
      setEstadosDescarga(estadosDescargaData.map(ed => ({
        label: ed.nombre,
        value: Number(ed.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos desde las APIs'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para botones de fecha automática
  const actualizarFechaArriboPuerto = () => {
    const ahora = new Date();
    setValue('fechaHoraArriboPuerto', ahora);
    toast.current?.show({
      severity: 'info',
      summary: 'Fecha Actualizada',
      detail: `Arribo a Puerto: ${ahora.toLocaleString('es-PE')}`
    });
  };

  const actualizarFechaLlegadaPuerto = () => {
    const ahora = new Date();
    setValue('fechaHoraLlegadaPuerto', ahora);
    toast.current?.show({
      severity: 'info',
      summary: 'Fecha Actualizada',
      detail: `Llegada a Puerto: ${ahora.toLocaleString('es-PE')}`
    });
  };

  const actualizarFechaInicioDescarga = () => {
    const ahora = new Date();
    setValue('fechaHoraInicioDescarga', ahora);
    toast.current?.show({
      severity: 'success',
      summary: 'Fecha Actualizada',
      detail: `Inicio Descarga: ${ahora.toLocaleString('es-PE')}`
    });
  };

  const actualizarFechaFinDescarga = () => {
    const ahora = new Date();
    setValue('fechaHoraFinDescarga', ahora);
    toast.current?.show({
      severity: 'success',
      summary: 'Fecha Actualizada',
      detail: `Fin Descarga: ${ahora.toLocaleString('es-PE')}`
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const payload = {
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        puertoDescargaId: data.puertoDescargaId ? Number(data.puertoDescargaId) : null,
        empresaId: data.empresaId ? Number(data.empresaId) : null,
        numeroDescarga: data.numeroDescarga?.trim() || null,
        pesoTotalDescargado: data.pesoTotalDescargado || null,
        pesoTotalDeclarado: data.pesoTotalDeclarado || null,
        temperaturaProducto: data.temperaturaProducto || null,
        estadoProductoId: data.estadoProductoId ? Number(data.estadoProductoId) : null,
        calidadProductoId: data.calidadProductoId ? Number(data.calidadProductoId) : null,
        observaciones: data.observaciones?.trim() || null,
        estadoDescargaId: data.estadoDescargaId ? Number(data.estadoDescargaId) : null,
        fechaHoraFondeo: data.fechaHoraFondeo ? data.fechaHoraFondeo.toISOString() : null,
        latitudFondeo: data.latitudFondeo || null,
        longitudFondeo: data.longitudFondeo || null,
        puertoFondeoId: data.puertoFondeoId ? Number(data.puertoFondeoId) : null,
        fechaHoraArriboPuerto: data.fechaHoraArriboPuerto ? data.fechaHoraArriboPuerto.toISOString() : null,
        fechaHoraLlegadaPuerto: data.fechaHoraLlegadaPuerto ? data.fechaHoraLlegadaPuerto.toISOString() : null,
        fechaHoraInicioDescarga: data.fechaHoraInicioDescarga ? data.fechaHoraInicioDescarga.toISOString() : null,
        fechaHoraFinDescarga: data.fechaHoraFinDescarga ? data.fechaHoraFinDescarga.toISOString() : null
      };

      if (descarga?.id) {
        await actualizarDescargaFaenaConsumo(descarga.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Descarga actualizada correctamente'
        });
      } else {
        await crearDescargaFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Descarga creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error al guardar descarga:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la descarga'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="descarga-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Faena de Pesca Consumo */}
              <div className="col-12">
                <label htmlFor="faenaPescaConsumoId" className="block text-900 font-medium mb-2">
                  Faena de Pesca Consumo *
                </label>
                <Controller
                  name="faenaPescaConsumoId"
                  control={control}
                  rules={{ required: 'La faena es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="faenaPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={faenas}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione una faena"
                      className={errors.faenaPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.faenaPescaConsumoId && (
                  <small className="p-error">{errors.faenaPescaConsumoId.message}</small>
                )}
              </div>

              {/* Embarcación */}
              <div className="col-12 md:col-6">
                <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
                  Embarcación
                </label>
                <Controller
                  name="embarcacionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="embarcacionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={embarcaciones}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione embarcación"
                      filter
                    />
                  )}
                />
              </div>

              {/* Puerto de Descarga */}
              <div className="col-12 md:col-6">
                <label htmlFor="puertoDescargaId" className="block text-900 font-medium mb-2">
                  Puerto de Descarga
                </label>
                <Controller
                  name="puertoDescargaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="puertoDescargaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={puertos}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione puerto"
                      filter
                    />
                  )}
                />
              </div>

              {/* Empresa */}
              <div className="col-12 md:col-6">
                <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
                  Empresa
                </label>
                <Controller
                  name="empresaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="empresaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={empresas}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione empresa"
                      filter
                    />
                  )}
                />
              </div>

              {/* Número de Descarga */}
              <div className="col-12 md:col-6">
                <label htmlFor="numeroDescarga" className="block text-900 font-medium mb-2">
                  Número de Descarga
                </label>
                <Controller
                  name="numeroDescarga"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroDescarga"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Número de descarga"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Producto y Estados */}
          <TabPanel header="Producto y Estados">
            <div className="grid">
              {/* Peso Total Descargado */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoTotalDescargado" className="block text-900 font-medium mb-2">
                  Peso Total Descargado (kg)
                </label>
                <Controller
                  name="pesoTotalDescargado"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTotalDescargado"
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

              {/* Peso Total Declarado */}
              <div className="col-12 md:col-6">
                <label htmlFor="pesoTotalDeclarado" className="block text-900 font-medium mb-2">
                  Peso Total Declarado (kg)
                </label>
                <Controller
                  name="pesoTotalDeclarado"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTotalDeclarado"
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

              {/* Temperatura del Producto */}
              <div className="col-12 md:col-4">
                <label htmlFor="temperaturaProducto" className="block text-900 font-medium mb-2">
                  Temperatura (°C)
                </label>
                <Controller
                  name="temperaturaProducto"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="temperaturaProducto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      placeholder="0.0"
                      suffix=" °C"
                    />
                  )}
                />
              </div>

              {/* Estado del Producto */}
              <div className="col-12 md:col-4">
                <label htmlFor="estadoProductoId" className="block text-900 font-medium mb-2">
                  Estado del Producto
                </label>
                <Controller
                  name="estadoProductoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoProductoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={estadosProducto}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione estado"
                    />
                  )}
                />
              </div>

              {/* Calidad del Producto */}
              <div className="col-12 md:col-4">
                <label htmlFor="calidadProductoId" className="block text-900 font-medium mb-2">
                  Calidad del Producto
                </label>
                <Controller
                  name="calidadProductoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="calidadProductoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={calidadesProducto}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione calidad"
                    />
                  )}
                />
              </div>

              {/* Estado de Descarga */}
              <div className="col-12">
                <label htmlFor="estadoDescargaId" className="block text-900 font-medium mb-2">
                  Estado de Descarga
                </label>
                <Controller
                  name="estadoDescargaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoDescargaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={estadosDescarga}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione estado de descarga"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Fechas Automáticas */}
          <TabPanel header="Fechas Automáticas">
            <div className="grid">
              {/* Botones de Fecha Automática */}
              <div className="col-12">
                <h5 className="mb-3">Actualizar Fechas Automáticamente</h5>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    type="button"
                    label="Arribar a Puerto"
                    icon="pi pi-clock"
                    size="small"
                    className="p-button-info"
                    onClick={actualizarFechaArriboPuerto}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    label="Llego a Puerto"
                    icon="pi pi-clock"
                    size="small"
                    className="p-button-info"
                    onClick={actualizarFechaLlegadaPuerto}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    label="Iniciar Descarga"
                    icon="pi pi-clock"
                    size="small"
                    className="p-button-success"
                    onClick={actualizarFechaInicioDescarga}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    label="Fin Descarga"
                    icon="pi pi-clock"
                    size="small"
                    className="p-button-success"
                    onClick={actualizarFechaFinDescarga}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Fechas de Puerto */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraArriboPuerto" className="block text-900 font-medium mb-2">
                  Fecha/Hora Arribo Puerto
                </label>
                <Controller
                  name="fechaHoraArriboPuerto"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraArriboPuerto"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Fecha/hora arribo"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraLlegadaPuerto" className="block text-900 font-medium mb-2">
                  Fecha/Hora Llegada Puerto
                </label>
                <Controller
                  name="fechaHoraLlegadaPuerto"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraLlegadaPuerto"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Fecha/hora llegada"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                    />
                  )}
                />
              </div>

              {/* Fechas de Descarga */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraInicioDescarga" className="block text-900 font-medium mb-2">
                  Fecha/Hora Inicio Descarga
                </label>
                <Controller
                  name="fechaHoraInicioDescarga"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraInicioDescarga"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Fecha/hora inicio"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaHoraFinDescarga" className="block text-900 font-medium mb-2">
                  Fecha/Hora Fin Descarga
                </label>
                <Controller
                  name="fechaHoraFinDescarga"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaHoraFinDescarga"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Fecha/hora fin"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
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
                      rows={4}
                      placeholder="Observaciones sobre la descarga..."
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
            label={descarga?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DescargaFaenaConsumoForm;