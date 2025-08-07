// src/components/requerimientoCompra/RequerimientoCompraForm.jsx
// Formulario profesional para RequerimientoCompra. Cumple regla transversal ERP Megui:
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
import { crearRequerimientoCompra, actualizarRequerimientoCompra } from '../../api/requerimientoCompra';

/**
 * Formulario para gestión de RequerimientoCompra
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX debido a la cantidad de campos
 */
const RequerimientoCompraForm = ({ requerimiento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [solicitantes, setSolicitantes] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [aprobadores, setAprobadores] = useState([]);
  const toast = useRef(null);

  // Opciones para dropdowns
  const estadosOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
    { value: 'PROCESADO', label: 'Procesado' }
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
    if (requerimiento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        numero: requerimiento.numero || '',
        fechaSolicitud: requerimiento.fechaSolicitud ? new Date(requerimiento.fechaSolicitud) : new Date(),
        fechaRequerida: requerimiento.fechaRequerida ? new Date(requerimiento.fechaRequerida) : null,
        solicitanteId: requerimiento.solicitanteId ? Number(requerimiento.solicitanteId) : null,
        centroCostoId: requerimiento.centroCostoId ? Number(requerimiento.centroCostoId) : null,
        estado: requerimiento.estado || 'PENDIENTE',
        prioridad: requerimiento.prioridad || 'MEDIA',
        montoTotal: requerimiento.montoTotal || 0,
        observaciones: requerimiento.observaciones || '',
        justificacion: requerimiento.justificacion || '',
        aprobadorId: requerimiento.aprobadorId ? Number(requerimiento.aprobadorId) : null,
        fechaAprobacion: requerimiento.fechaAprobacion ? new Date(requerimiento.fechaAprobacion) : null,
        observacionesAprobacion: requerimiento.observacionesAprobacion || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        numero: '',
        fechaSolicitud: new Date(),
        fechaRequerida: null,
        solicitanteId: null,
        centroCostoId: null,
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        montoTotal: 0,
        observaciones: '',
        justificacion: '',
        aprobadorId: null,
        fechaAprobacion: null,
        observacionesAprobacion: ''
      });
    }
  }, [requerimiento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setSolicitantes([
        { id: 1, nombres: 'Juan', apellidos: 'Pérez' },
        { id: 2, nombres: 'María', apellidos: 'García' },
        { id: 3, nombres: 'Carlos', apellidos: 'López' }
      ]);
      
      setCentrosCosto([
        { id: 1, nombre: 'Administración', codigo: 'ADM' },
        { id: 2, nombre: 'Producción', codigo: 'PROD' },
        { id: 3, nombre: 'Mantenimiento', codigo: 'MANT' },
        { id: 4, nombre: 'Ventas', codigo: 'VTA' }
      ]);

      setAprobadores([
        { id: 1, nombres: 'Ana', apellidos: 'Martín' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez' },
        { id: 3, nombres: 'Elena', apellidos: 'Torres' }
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
        fechaSolicitud: data.fechaSolicitud,
        fechaRequerida: data.fechaRequerida || null,
        solicitanteId: data.solicitanteId ? Number(data.solicitanteId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        estado: data.estado,
        prioridad: data.prioridad,
        montoTotal: Number(data.montoTotal) || 0,
        observaciones: data.observaciones || null,
        justificacion: data.justificacion || null,
        aprobadorId: data.aprobadorId ? Number(data.aprobadorId) : null,
        fechaAprobacion: data.fechaAprobacion || null,
        observacionesAprobacion: data.observacionesAprobacion || null
      };
      if (requerimiento?.id) {
        await actualizarRequerimientoCompra(requerimiento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Requerimiento actualizado correctamente'
        });
      } else {
        await crearRequerimientoCompra(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Requerimiento creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el requerimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="requerimiento-compra-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
            <div className="grid">
              {/* Número */}
              <div className="col-12 md:col-6">
                <label htmlFor="numero" className="block text-900 font-medium mb-2">
                  Número de Requerimiento *
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
                      placeholder="REQ-2024-001"
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

              {/* Fecha Solicitud */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaSolicitud" className="block text-900 font-medium mb-2">
                  Fecha de Solicitud *
                </label>
                <Controller
                  name="fechaSolicitud"
                  control={control}
                  rules={{ required: 'La fecha de solicitud es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaSolicitud"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      className={errors.fechaSolicitud ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaSolicitud && (
                  <small className="p-error">{errors.fechaSolicitud.message}</small>
                )}
              </div>

              {/* Fecha Requerida */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaRequerida" className="block text-900 font-medium mb-2">
                  Fecha Requerida
                </label>
                <Controller
                  name="fechaRequerida"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaRequerida"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Solicitante */}
              <div className="col-12 md:col-6">
                <label htmlFor="solicitanteId" className="block text-900 font-medium mb-2">
                  Solicitante
                </label>
                <Controller
                  name="solicitanteId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="solicitanteId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={solicitantes.map(s => ({ 
                        ...s, 
                        id: Number(s.id),
                        nombreCompleto: `${s.nombres} ${s.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un solicitante"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Centro de Costo */}
              <div className="col-12 md:col-6">
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
                      placeholder="Seleccione un centro de costo"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Prioridad */}
              <div className="col-12 md:col-6">
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
                      placeholder="Seleccione una prioridad"
                      className={errors.prioridad ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.prioridad && (
                  <small className="p-error">{errors.prioridad.message}</small>
                )}
              </div>

              {/* Monto Total */}
              <div className="col-12 md:col-6">
                <label htmlFor="montoTotal" className="block text-900 font-medium mb-2">
                  Monto Total
                </label>
                <Controller
                  name="montoTotal"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="montoTotal"
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
            </div>
          </TabPanel>

          {/* Pestaña 2: Detalles y Justificación */}
          <TabPanel header="Detalles y Justificación">
            <div className="grid">
              {/* Justificación */}
              <div className="col-12">
                <label htmlFor="justificacion" className="block text-900 font-medium mb-2">
                  Justificación
                </label>
                <Controller
                  name="justificacion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="justificacion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={4}
                      placeholder="Justificación del requerimiento de compra..."
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

          {/* Pestaña 3: Aprobación */}
          <TabPanel header="Aprobación">
            <div className="grid">
              {/* Aprobador */}
              <div className="col-12 md:col-6">
                <label htmlFor="aprobadorId" className="block text-900 font-medium mb-2">
                  Aprobador
                </label>
                <Controller
                  name="aprobadorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="aprobadorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={aprobadores.map(a => ({ 
                        ...a, 
                        id: Number(a.id),
                        nombreCompleto: `${a.nombres} ${a.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un aprobador"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha Aprobación */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaAprobacion" className="block text-900 font-medium mb-2">
                  Fecha de Aprobación
                </label>
                <Controller
                  name="fechaAprobacion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaAprobacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Observaciones de Aprobación */}
              <div className="col-12">
                <label htmlFor="observacionesAprobacion" className="block text-900 font-medium mb-2">
                  Observaciones de Aprobación
                </label>
                <Controller
                  name="observacionesAprobacion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="observacionesAprobacion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      placeholder="Observaciones del proceso de aprobación..."
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
            label={requerimiento?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default RequerimientoCompraForm;
