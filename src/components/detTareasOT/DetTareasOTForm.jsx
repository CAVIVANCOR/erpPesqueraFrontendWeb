// src/components/detTareasOT/DetTareasOTForm.jsx
// Formulario profesional para DetTareasOT. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetTareasOT, updateDetTareasOT } from '../../api/detTareasOT';

/**
 * Formulario para gestión de DetTareasOT
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX debido a la cantidad de campos
 */
const DetTareasOTForm = ({ tarea, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [ordenesMantenimiento, setOrdenesMantenimiento] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [validadores, setValidadores] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (tarea) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        otMantenimientoId: tarea.otMantenimientoId ? Number(tarea.otMantenimientoId) : null,
        descripcion: tarea.descripcion || '',
        responsableId: tarea.responsableId ? Number(tarea.responsableId) : null,
        fechaProgramada: tarea.fechaProgramada ? new Date(tarea.fechaProgramada) : null,
        fechaInicio: tarea.fechaInicio ? new Date(tarea.fechaInicio) : null,
        fechaFin: tarea.fechaFin ? new Date(tarea.fechaFin) : null,
        realizado: tarea.realizado || false,
        observaciones: tarea.observaciones || '',
        urlFotosAntesPdf: tarea.urlFotosAntesPdf || '',
        adjuntoCotizacionUno: tarea.adjuntoCotizacionUno || false,
        urlCotizacionUnoPdf: tarea.urlCotizacionUnoPdf || '',
        adjuntoCotizacionDos: tarea.adjuntoCotizacionDos || false,
        urlCotizacionDosPdf: tarea.urlCotizacionDosPdf || '',
        validaTerminoTareaId: tarea.validaTerminoTareaId ? Number(tarea.validaTerminoTareaId) : null,
        fechaValidaTerminoTarea: tarea.fechaValidaTerminoTarea ? new Date(tarea.fechaValidaTerminoTarea) : null
      });
    } else {
      // Reset para nuevo registro
      reset({
        otMantenimientoId: null,
        descripcion: '',
        responsableId: null,
        fechaProgramada: null,
        fechaInicio: null,
        fechaFin: null,
        realizado: false,
        observaciones: '',
        urlFotosAntesPdf: '',
        adjuntoCotizacionUno: false,
        urlCotizacionUnoPdf: '',
        adjuntoCotizacionDos: false,
        urlCotizacionDosPdf: '',
        validaTerminoTareaId: null,
        fechaValidaTerminoTarea: null
      });
    }
  }, [tarea, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setOrdenesMantenimiento([
        { id: 1, codigo: 'OT-001', descripcion: 'Mantenimiento Preventivo Motor' },
        { id: 2, codigo: 'OT-002', descripcion: 'Reparación Sistema Hidráulico' },
        { id: 3, codigo: 'OT-003', descripcion: 'Cambio de Filtros' }
      ]);
      
      setResponsables([
        { id: 1, nombres: 'Juan', apellidos: 'Pérez' },
        { id: 2, nombres: 'María', apellidos: 'García' },
        { id: 3, nombres: 'Carlos', apellidos: 'López' }
      ]);

      setValidadores([
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
        otMantenimientoId: Number(data.otMantenimientoId),
        descripcion: data.descripcion,
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        fechaProgramada: data.fechaProgramada || null,
        fechaInicio: data.fechaInicio || null,
        fechaFin: data.fechaFin || null,
        realizado: Boolean(data.realizado),
        observaciones: data.observaciones || null,
        urlFotosAntesPdf: data.urlFotosAntesPdf || null,
        adjuntoCotizacionUno: Boolean(data.adjuntoCotizacionUno),
        urlCotizacionUnoPdf: data.urlCotizacionUnoPdf || null,
        adjuntoCotizacionDos: Boolean(data.adjuntoCotizacionDos),
        urlCotizacionDosPdf: data.urlCotizacionDosPdf || null,
        validaTerminoTareaId: data.validaTerminoTareaId ? Number(data.validaTerminoTareaId) : null,
        fechaValidaTerminoTarea: data.fechaValidaTerminoTarea || null
      };

      console.log('Payload DetTareasOT:', payload); // Log para depuración

      if (tarea?.id) {
        await updateDetTareasOT(tarea.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tarea actualizada correctamente'
        });
      } else {
        await createDetTareasOT(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tarea creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la tarea'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-tareas-ot-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información Básica */}
          <TabPanel header="Información Básica">
            <div className="grid">
              {/* OT Mantenimiento */}
              <div className="col-12">
                <label htmlFor="otMantenimientoId" className="block text-900 font-medium mb-2">
                  Orden de Trabajo de Mantenimiento *
                </label>
                <Controller
                  name="otMantenimientoId"
                  control={control}
                  rules={{ required: 'La orden de trabajo es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="otMantenimientoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={ordenesMantenimiento.map(ot => ({ 
                        ...ot, 
                        id: Number(ot.id),
                        descripcionCompleta: `${ot.codigo} - ${ot.descripcion}`
                      }))}
                      optionLabel="descripcionCompleta"
                      optionValue="id"
                      placeholder="Seleccione una orden de trabajo"
                      className={errors.otMantenimientoId ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.otMantenimientoId && (
                  <small className="p-error">{errors.otMantenimientoId.message}</small>
                )}
              </div>

              {/* Descripción */}
              <div className="col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción de la Tarea *
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  rules={{ required: 'La descripción es obligatoria' }}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      placeholder="Descripción detallada de la tarea..."
                      className={errors.descripcion ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.descripcion && (
                  <small className="p-error">{errors.descripcion.message}</small>
                )}
              </div>

              {/* Responsable */}
              <div className="col-12 md:col-6">
                <label htmlFor="responsableId" className="block text-900 font-medium mb-2">
                  Responsable
                </label>
                <Controller
                  name="responsableId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={responsables.map(r => ({ 
                        ...r, 
                        id: Number(r.id),
                        nombreCompleto: `${r.nombres} ${r.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un responsable"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Realizado */}
              <div className="col-12 md:col-6">
                <label htmlFor="realizado" className="block text-900 font-medium mb-2">
                  Estado de la Tarea
                </label>
                <Controller
                  name="realizado"
                  control={control}
                  render={({ field }) => (
                    <div className="flex align-items-center">
                      <Checkbox
                        id="realizado"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                      <label htmlFor="realizado" className="ml-2">
                        Tarea realizada
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Programación */}
          <TabPanel header="Fechas y Programación">
            <div className="grid">
              {/* Fecha Programada */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaProgramada" className="block text-900 font-medium mb-2">
                  Fecha Programada
                </label>
                <Controller
                  name="fechaProgramada"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaProgramada"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha Inicio */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaInicio" className="block text-900 font-medium mb-2">
                  Fecha de Inicio
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaInicio"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha Fin */}
              <div className="col-12 md:col-4">
                <label htmlFor="fechaFin" className="block text-900 font-medium mb-2">
                  Fecha de Fin
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaFin"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/aaaa"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Validador */}
              <div className="col-12 md:col-6">
                <label htmlFor="validaTerminoTareaId" className="block text-900 font-medium mb-2">
                  Validador de Término
                </label>
                <Controller
                  name="validaTerminoTareaId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="validaTerminoTareaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={validadores.map(v => ({ 
                        ...v, 
                        id: Number(v.id),
                        nombreCompleto: `${v.nombres} ${v.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un validador"
                      showClear
                    />
                  )}
                />
              </div>

              {/* Fecha Validación */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaValidaTerminoTarea" className="block text-900 font-medium mb-2">
                  Fecha de Validación
                </label>
                <Controller
                  name="fechaValidaTerminoTarea"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaValidaTerminoTarea"
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

          {/* Pestaña 3: Cotizaciones y Documentos */}
          <TabPanel header="Cotizaciones y Documentos">
            <div className="grid">
              {/* URL Fotos Antes */}
              <div className="col-12">
                <label htmlFor="urlFotosAntesPdf" className="block text-900 font-medium mb-2">
                  URL Fotos Antes (PDF)
                </label>
                <Controller
                  name="urlFotosAntesPdf"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlFotosAntesPdf"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://..."
                    />
                  )}
                />
              </div>

              {/* Cotización Uno */}
              <div className="col-12 md:col-6">
                <label htmlFor="adjuntoCotizacionUno" className="block text-900 font-medium mb-2">
                  Cotización Uno
                </label>
                <Controller
                  name="adjuntoCotizacionUno"
                  control={control}
                  render={({ field }) => (
                    <div className="flex align-items-center">
                      <Checkbox
                        id="adjuntoCotizacionUno"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                      <label htmlFor="adjuntoCotizacionUno" className="ml-2">
                        Adjuntar cotización uno
                      </label>
                    </div>
                  )}
                />
              </div>

              {/* URL Cotización Uno */}
              <div className="col-12 md:col-6">
                <label htmlFor="urlCotizacionUnoPdf" className="block text-900 font-medium mb-2">
                  URL Cotización Uno (PDF)
                </label>
                <Controller
                  name="urlCotizacionUnoPdf"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlCotizacionUnoPdf"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://..."
                    />
                  )}
                />
              </div>

              {/* Cotización Dos */}
              <div className="col-12 md:col-6">
                <label htmlFor="adjuntoCotizacionDos" className="block text-900 font-medium mb-2">
                  Cotización Dos
                </label>
                <Controller
                  name="adjuntoCotizacionDos"
                  control={control}
                  render={({ field }) => (
                    <div className="flex align-items-center">
                      <Checkbox
                        id="adjuntoCotizacionDos"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                      <label htmlFor="adjuntoCotizacionDos" className="ml-2">
                        Adjuntar cotización dos
                      </label>
                    </div>
                  )}
                />
              </div>

              {/* URL Cotización Dos */}
              <div className="col-12 md:col-6">
                <label htmlFor="urlCotizacionDosPdf" className="block text-900 font-medium mb-2">
                  URL Cotización Dos (PDF)
                </label>
                <Controller
                  name="urlCotizacionDosPdf"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlCotizacionDosPdf"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://..."
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
                      placeholder="Observaciones adicionales sobre la tarea..."
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
            label={tarea?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetTareasOTForm;
