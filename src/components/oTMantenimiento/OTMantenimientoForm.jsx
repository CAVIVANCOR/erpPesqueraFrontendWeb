/**
 * Formulario profesional para OTMantenimiento (Órdenes de Trabajo de Mantenimiento)
 * Utiliza react-hook-form con Controller para validaciones y manejo de estado.
 * Implementa el patrón estándar ERP Megui con validaciones completas.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearOrdenTrabajo, actualizarOrdenTrabajo } from '../../api/oTMantenimiento';
import { getEmpresas } from '../../api/empresa';
import { getSedes } from '../../api/sedes';
import { getActivos } from '../../api/activo';
import { getAllTipoMantenimiento } from '../../api/tipoMantenimiento';
import { getAllMotivoOriginoOT } from '../../api/motivoOriginoOT';
import { getPersonal } from '../../api/personal';

/**
 * Esquema de validación con Yup para OTMantenimiento
 * Define las reglas de validación para todos los campos del formulario
 */
const validationSchema = yup.object().shape({
  codigo: yup
    .string()
    .required('El código es obligatorio')
    .max(30, 'El código no puede exceder 30 caracteres'),
  empresaId: yup
    .number()
    .required('La empresa es obligatoria')
    .positive('Debe seleccionar una empresa válida'),
  sedeId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar una sede válida'),
  activoId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un activo válido'),
  tipoMantenimientoId: yup
    .number()
    .required('El tipo de mantenimiento es obligatorio')
    .positive('Debe seleccionar un tipo válido'),
  motivoOriginoId: yup
    .number()
    .required('El motivo de origen es obligatorio')
    .positive('Debe seleccionar un motivo válido'),
  fechaProgramada: yup
    .date()
    .nullable()
    .min(new Date(), 'La fecha programada debe ser futura'),
  fechaInicio: yup
    .date()
    .nullable(),
  fechaFin: yup
    .date()
    .nullable()
    .when('fechaInicio', (fechaInicio, schema) => {
      return fechaInicio
        ? schema.min(fechaInicio, 'La fecha fin debe ser posterior a la fecha inicio')
        : schema;
    }),
  solicitanteId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un solicitante válido'),
  responsableId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un responsable válido'),
  autorizadoPorId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un autorizador válido'),
  descripcion: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  causa: yup
    .string()
    .max(500, 'La causa no puede exceder 500 caracteres'),
  solucion: yup
    .string()
    .max(500, 'La solución no puede exceder 500 caracteres'),
  observaciones: yup
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
});

/**
 * Componente OTMantenimientoForm
 * Formulario para crear y editar órdenes de trabajo de mantenimiento
 */
const OTMantenimientoForm = ({ ordenTrabajo, onSave, onCancel }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para los combos
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [sedesFiltradas, setSedesFiltradas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [motivosOrigen, setMotivosOrigen] = useState([]);
  const [personal, setPersonal] = useState([]);

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      codigo: '',
      empresaId: null,
      sedeId: null,
      activoId: null,
      tipoMantenimientoId: null,
      motivoOriginoId: null,
      prioridadAlta: false,
      fechaProgramada: null,
      fechaInicio: null,
      fechaFin: null,
      solicitanteId: null,
      responsableId: null,
      autorizadoPorId: null,
      descripcion: '',
      causa: '',
      solucion: '',
      observaciones: ''
    }
  });

  // Watch para empresa seleccionada (para filtrar sedes)
  const empresaSeleccionada = watch('empresaId');

  /**
   * Carga los datos iniciales para los combos
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          empresasData,
          sedesData,
          activosData,
          tiposData,
          motivosData,
          personalData
        ] = await Promise.all([
          getEmpresas(),
          getSedes(),
          getActivos(),
          getAllTipoMantenimiento(),
          getAllMotivoOriginoOT(),
          getPersonal()
        ]);

        // Normalizar IDs según regla ERP Megui
        setEmpresas(empresasData.map(e => ({ ...e, id: Number(e.id) })));
        setSedes(sedesData.map(s => ({ ...s, id: Number(s.id), empresaId: Number(s.empresaId) })));
        setActivos(activosData.map(a => ({ ...a, id: Number(a.id) })));
        setTiposMantenimiento(tiposData.map(t => ({ ...t, id: Number(t.id) })));
        setMotivosOrigen(motivosData.map(m => ({ ...m, id: Number(m.id) })));
        setPersonal(personalData.map(p => ({ ...p, id: Number(p.id) })));

        // Si hay una orden de trabajo para editar, cargar sus datos
        if (ordenTrabajo) {
          reset({
            codigo: ordenTrabajo.codigo || '',
            empresaId: ordenTrabajo.empresaId ? Number(ordenTrabajo.empresaId) : null,
            sedeId: ordenTrabajo.sedeId ? Number(ordenTrabajo.sedeId) : null,
            activoId: ordenTrabajo.activoId ? Number(ordenTrabajo.activoId) : null,
            tipoMantenimientoId: ordenTrabajo.tipoMantenimientoId ? Number(ordenTrabajo.tipoMantenimientoId) : null,
            motivoOriginoId: ordenTrabajo.motivoOriginoId ? Number(ordenTrabajo.motivoOriginoId) : null,
            prioridadAlta: ordenTrabajo.prioridadAlta || false,
            fechaProgramada: ordenTrabajo.fechaProgramada ? new Date(ordenTrabajo.fechaProgramada) : null,
            fechaInicio: ordenTrabajo.fechaInicio ? new Date(ordenTrabajo.fechaInicio) : null,
            fechaFin: ordenTrabajo.fechaFin ? new Date(ordenTrabajo.fechaFin) : null,
            solicitanteId: ordenTrabajo.solicitanteId ? Number(ordenTrabajo.solicitanteId) : null,
            responsableId: ordenTrabajo.responsableId ? Number(ordenTrabajo.responsableId) : null,
            autorizadoPorId: ordenTrabajo.autorizadoPorId ? Number(ordenTrabajo.autorizadoPorId) : null,
            descripcion: ordenTrabajo.descripcion || '',
            causa: ordenTrabajo.causa || '',
            solucion: ordenTrabajo.solucion || '',
            observaciones: ordenTrabajo.observaciones || ''
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los datos del formulario'
        });
      }
    };

    cargarDatos();
  }, [ordenTrabajo, reset]);

  /**
   * Efecto para filtrar sedes según empresa seleccionada
   */
  useEffect(() => {
    if (empresaSeleccionada && sedes.length > 0) {
      const sedesFiltradas = sedes.filter(sede => sede.empresaId === Number(empresaSeleccionada));
      setSedesFiltradas(sedesFiltradas);
      
      // Limpiar sede seleccionada si no pertenece a la empresa
      const sedeActual = watch('sedeId');
      if (sedeActual && !sedesFiltradas.find(s => s.id === sedeActual)) {
        setValue('sedeId', null);
      }
    } else {
      setSedesFiltradas([]);
      setValue('sedeId', null);
    }
  }, [empresaSeleccionada, sedes, setValue, watch]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con normalización de datos
      const payload = {
        codigo: data.codigo.trim().toUpperCase(),
        empresaId: Number(data.empresaId),
        sedeId: data.sedeId ? Number(data.sedeId) : null,
        activoId: data.activoId ? Number(data.activoId) : null,
        tipoMantenimientoId: Number(data.tipoMantenimientoId),
        motivoOriginoId: Number(data.motivoOriginoId),
        prioridadAlta: Boolean(data.prioridadAlta),
        fechaProgramada: data.fechaProgramada || null,
        fechaInicio: data.fechaInicio || null,
        fechaFin: data.fechaFin || null,
        solicitanteId: data.solicitanteId ? Number(data.solicitanteId) : null,
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        autorizadoPorId: data.autorizadoPorId ? Number(data.autorizadoPorId) : null,
        descripcion: data.descripcion?.trim() || null,
        causa: data.causa?.trim() || null,
        solucion: data.solucion?.trim() || null,
        observaciones: data.observaciones?.trim() || null
      };
      if (ordenTrabajo?.id) {
        await actualizarOrdenTrabajo(ordenTrabajo.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de trabajo actualizada correctamente'
        });
      } else {
        await crearOrdenTrabajo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de trabajo creada correctamente'
        });
      }

      onSave?.();
    } catch (error) {
      console.error('Error al guardar orden de trabajo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar la orden de trabajo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="formgrid grid">
              {/* Código */}
              <div className="field col-12 md:col-6">
                <label htmlFor="codigo" className="block text-900 font-medium mb-2">
                  Código *
                </label>
                <Controller
                  name="codigo"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="codigo"
                      {...field}
                      placeholder="Ingrese el código de la OT"
                      className={`w-full ${errors.codigo ? 'p-invalid' : ''}`}
                      maxLength={30}
                    />
                  )}
                />
                {errors.codigo && (
                  <small className="p-error">{errors.codigo.message}</small>
                )}
              </div>

              {/* Empresa */}
              <div className="field col-12 md:col-6">
                <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
                  Empresa *
                </label>
                <Controller
                  name="empresaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="empresaId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={empresas}
                      optionLabel="razonSocial"
                      optionValue="id"
                      placeholder="Seleccione una empresa"
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

              {/* Sede */}
              <div className="field col-12 md:col-6">
                <label htmlFor="sedeId" className="block text-900 font-medium mb-2">
                  Sede
                </label>
                <Controller
                  name="sedeId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="sedeId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={sedesFiltradas}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione una sede"
                      className={`w-full ${errors.sedeId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                      disabled={!empresaSeleccionada}
                    />
                  )}
                />
                {errors.sedeId && (
                  <small className="p-error">{errors.sedeId.message}</small>
                )}
              </div>

              {/* Activo */}
              <div className="field col-12 md:col-6">
                <label htmlFor="activoId" className="block text-900 font-medium mb-2">
                  Activo
                </label>
                <Controller
                  name="activoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="activoId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={activos}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione un activo"
                      className={`w-full ${errors.activoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.activoId && (
                  <small className="p-error">{errors.activoId.message}</small>
                )}
              </div>

              {/* Tipo de Mantenimiento */}
              <div className="field col-12 md:col-6">
                <label htmlFor="tipoMantenimientoId" className="block text-900 font-medium mb-2">
                  Tipo de Mantenimiento *
                </label>
                <Controller
                  name="tipoMantenimientoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMantenimientoId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={tiposMantenimiento}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione el tipo"
                      className={`w-full ${errors.tipoMantenimientoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.tipoMantenimientoId && (
                  <small className="p-error">{errors.tipoMantenimientoId.message}</small>
                )}
              </div>

              {/* Motivo de Origen */}
              <div className="field col-12 md:col-6">
                <label htmlFor="motivoOriginoId" className="block text-900 font-medium mb-2">
                  Motivo de Origen *
                </label>
                <Controller
                  name="motivoOriginoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="motivoOriginoId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={motivosOrigen}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione el motivo"
                      className={`w-full ${errors.motivoOriginoId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.motivoOriginoId && (
                  <small className="p-error">{errors.motivoOriginoId.message}</small>
                )}
              </div>

              {/* Prioridad Alta */}
              <div className="field col-12 md:col-6">
                <div className="flex align-items-center">
                  <Controller
                    name="prioridadAlta"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="prioridadAlta"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.checked)}
                        className="mr-2"
                      />
                    )}
                  />
                  <label htmlFor="prioridadAlta" className="text-900 font-medium">
                    Prioridad Alta
                  </label>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Responsables */}
          <TabPanel header="Fechas y Responsables">
            <div className="formgrid grid">
              {/* Fecha Programada */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaProgramada" className="block text-900 font-medium mb-2">
                  Fecha Programada
                </label>
                <Controller
                  name="fechaProgramada"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaProgramada"
                      {...field}
                      placeholder="Seleccione fecha"
                      className={`w-full ${errors.fechaProgramada ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                      showButtonBar
                    />
                  )}
                />
                {errors.fechaProgramada && (
                  <small className="p-error">{errors.fechaProgramada.message}</small>
                )}
              </div>

              {/* Fecha Inicio */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaInicio" className="block text-900 font-medium mb-2">
                  Fecha Inicio
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaInicio"
                      {...field}
                      placeholder="Seleccione fecha"
                      className={`w-full ${errors.fechaInicio ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                      showButtonBar
                    />
                  )}
                />
                {errors.fechaInicio && (
                  <small className="p-error">{errors.fechaInicio.message}</small>
                )}
              </div>

              {/* Fecha Fin */}
              <div className="field col-12 md:col-4">
                <label htmlFor="fechaFin" className="block text-900 font-medium mb-2">
                  Fecha Fin
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaFin"
                      {...field}
                      placeholder="Seleccione fecha"
                      className={`w-full ${errors.fechaFin ? 'p-invalid' : ''}`}
                      dateFormat="dd/mm/yy"
                      showIcon
                      showButtonBar
                    />
                  )}
                />
                {errors.fechaFin && (
                  <small className="p-error">{errors.fechaFin.message}</small>
                )}
              </div>

              {/* Solicitante */}
              <div className="field col-12 md:col-4">
                <label htmlFor="solicitanteId" className="block text-900 font-medium mb-2">
                  Solicitante
                </label>
                <Controller
                  name="solicitanteId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="solicitanteId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={personal}
                      optionLabel="nombres"
                      optionValue="id"
                      placeholder="Seleccione solicitante"
                      className={`w-full ${errors.solicitanteId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.solicitanteId && (
                  <small className="p-error">{errors.solicitanteId.message}</small>
                )}
              </div>

              {/* Responsable */}
              <div className="field col-12 md:col-4">
                <label htmlFor="responsableId" className="block text-900 font-medium mb-2">
                  Responsable
                </label>
                <Controller
                  name="responsableId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={personal}
                      optionLabel="nombres"
                      optionValue="id"
                      placeholder="Seleccione responsable"
                      className={`w-full ${errors.responsableId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.responsableId && (
                  <small className="p-error">{errors.responsableId.message}</small>
                )}
              </div>

              {/* Autorizado Por */}
              <div className="field col-12 md:col-4">
                <label htmlFor="autorizadoPorId" className="block text-900 font-medium mb-2">
                  Autorizado Por
                </label>
                <Controller
                  name="autorizadoPorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="autorizadoPorId"
                      {...field}
                      value={field.value ? Number(field.value) : null}
                      options={personal}
                      optionLabel="nombres"
                      optionValue="id"
                      placeholder="Seleccione autorizador"
                      className={`w-full ${errors.autorizadoPorId ? 'p-invalid' : ''}`}
                      filter
                      showClear
                    />
                  )}
                />
                {errors.autorizadoPorId && (
                  <small className="p-error">{errors.autorizadoPorId.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Descripción y Observaciones */}
          <TabPanel header="Descripción y Observaciones">
            <div className="formgrid grid">
              {/* Descripción */}
              <div className="field col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      placeholder="Descripción detallada de la orden de trabajo"
                      className={`w-full ${errors.descripcion ? 'p-invalid' : ''}`}
                      rows={3}
                      maxLength={500}
                    />
                  )}
                />
                {errors.descripcion && (
                  <small className="p-error">{errors.descripcion.message}</small>
                )}
              </div>

              {/* Causa */}
              <div className="field col-12">
                <label htmlFor="causa" className="block text-900 font-medium mb-2">
                  Causa
                </label>
                <Controller
                  name="causa"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="causa"
                      {...field}
                      placeholder="Causa que origina la orden de trabajo"
                      className={`w-full ${errors.causa ? 'p-invalid' : ''}`}
                      rows={3}
                      maxLength={500}
                    />
                  )}
                />
                {errors.causa && (
                  <small className="p-error">{errors.causa.message}</small>
                )}
              </div>

              {/* Solución */}
              <div className="field col-12">
                <label htmlFor="solucion" className="block text-900 font-medium mb-2">
                  Solución
                </label>
                <Controller
                  name="solucion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="solucion"
                      {...field}
                      placeholder="Solución aplicada o propuesta"
                      className={`w-full ${errors.solucion ? 'p-invalid' : ''}`}
                      rows={3}
                      maxLength={500}
                    />
                  )}
                />
                {errors.solucion && (
                  <small className="p-error">{errors.solucion.message}</small>
                )}
              </div>

              {/* Observaciones */}
              <div className="field col-12">
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
                      placeholder="Observaciones adicionales"
                      className={`w-full ${errors.observaciones ? 'p-invalid' : ''}`}
                      rows={4}
                      maxLength={1000}
                    />
                  )}
                />
                {errors.observaciones && (
                  <small className="p-error">{errors.observaciones.message}</small>
                )}
              </div>
            </div>
          </TabPanel>
        </TabView>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            outlined
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={ordenTrabajo?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
          />
        </div>
      </form>
    </>
  );
};

export default OTMantenimientoForm;
