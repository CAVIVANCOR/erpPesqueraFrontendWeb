// src/components/detAccionesPreviasFaenaConsumo/DetAccionesPreviasFaenaConsumoForm.jsx
// Formulario profesional para DetAccionesPreviasFaenaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetAccionesPreviasFaenaConsumo, updateDetAccionesPreviasFaenaConsumo } from '../../api/detAccionesPreviasFaenaConsumo';

/**
 * Formulario para gestión de DetAccionesPreviasFaenaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetAccionesPreviasFaenaConsumoForm = ({ accion, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [accionesPrevias, setAccionesPrevias] = useState([]);
  const [personal, setPersonal] = useState([]);
  const toast = useRef(null);

  // Observar campos para lógica condicional
  const cumplida = watch('cumplida');
  const verificado = watch('verificado');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (accion) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        faenaPescaConsumoId: accion.faenaPescaConsumoId ? Number(accion.faenaPescaConsumoId) : null,
        accionPreviaId: accion.accionPreviaId ? Number(accion.accionPreviaId) : null,
        responsableId: accion.responsableId ? Number(accion.responsableId) : null,
        verificadorId: accion.verificadorId ? Number(accion.verificadorId) : null,
        fechaVerificacion: accion.fechaVerificacion ? new Date(accion.fechaVerificacion) : null,
        cumplida: accion.cumplida || false,
        fechaCumplida: accion.fechaCumplida ? new Date(accion.fechaCumplida) : null,
        urlConfirmaAccionPdf: accion.urlConfirmaAccionPdf || '',
        observaciones: accion.observaciones || '',
        verificado: accion.verificado || false
      });
    } else {
      // Reset para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        accionPreviaId: null,
        responsableId: null,
        verificadorId: null,
        fechaVerificacion: null,
        cumplida: false,
        fechaCumplida: null,
        urlConfirmaAccionPdf: '',
        observaciones: '',
        verificado: false
      });
    }
  }, [accion, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setFaenas([
        { id: 1, descripcion: 'Faena Anchoveta - Paracas 001', fechaSalida: '2024-01-15' },
        { id: 2, descripcion: 'Faena Jurel - Chimbote 002', fechaSalida: '2024-01-16' },
        { id: 3, descripcion: 'Faena Caballa - Callao 003', fechaSalida: '2024-01-17' }
      ]);
      
      setAccionesPrevias([
        { id: 1, nombre: 'Revisión de Motores', descripcion: 'Verificar estado de motores principales' },
        { id: 2, nombre: 'Inspección de Redes', descripcion: 'Revisar integridad de redes de pesca' },
        { id: 3, nombre: 'Abastecimiento Combustible', descripcion: 'Cargar combustible necesario' },
        { id: 4, nombre: 'Verificación Documentos', descripcion: 'Revisar documentación de embarcación' },
        { id: 5, nombre: 'Inspección Seguridad', descripcion: 'Verificar equipos de seguridad' },
        { id: 6, nombre: 'Provisiones Tripulación', descripcion: 'Cargar alimentos y agua' }
      ]);

      setPersonal([
        { id: 1, nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Supervisor' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez Silva', cargo: 'Jefe de Operaciones' },
        { id: 3, nombres: 'Miguel', apellidos: 'Torres López', cargo: 'Inspector' },
        { id: 4, nombres: 'José', apellidos: 'Vargas Ruiz', cargo: 'Supervisor' },
        { id: 5, nombres: 'Ana', apellidos: 'García Pérez', cargo: 'Verificador' }
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
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        accionPreviaId: Number(data.accionPreviaId),
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        verificadorId: data.verificadorId ? Number(data.verificadorId) : null,
        fechaVerificacion: data.fechaVerificacion ? data.fechaVerificacion.toISOString() : null,
        cumplida: Boolean(data.cumplida),
        fechaCumplida: data.fechaCumplida ? data.fechaCumplida.toISOString() : null,
        urlConfirmaAccionPdf: data.urlConfirmaAccionPdf?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        verificado: Boolean(data.verificado)
      };
      if (accion?.id) {
        await updateDetAccionesPreviasFaenaConsumo(accion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Acción previa actualizada correctamente'
        });
      } else {
        await createDetAccionesPreviasFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Acción previa creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la acción previa'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-acciones-previas-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Faena */}
              <div className="col-12">
                <label htmlFor="faenaPescaConsumoId" className="block text-900 font-medium mb-2">
                  Faena de Pesca *
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
                      options={faenas.map(f => ({ 
                        ...f, 
                        id: Number(f.id),
                        nombreCompleto: `${f.id} - ${f.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
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

              {/* Acción Previa */}
              <div className="col-12">
                <label htmlFor="accionPreviaId" className="block text-900 font-medium mb-2">
                  Acción Previa *
                </label>
                <Controller
                  name="accionPreviaId"
                  control={control}
                  rules={{ required: 'La acción previa es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="accionPreviaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={accionesPrevias.map(ap => ({ 
                        ...ap, 
                        id: Number(ap.id),
                        nombreCompleto: `${ap.nombre} - ${ap.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una acción previa"
                      className={errors.accionPreviaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.accionPreviaId && (
                  <small className="p-error">{errors.accionPreviaId.message}</small>
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
                      options={personal.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombres} ${p.apellidos} (${p.cargo})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un responsable"
                      showClear
                      filter
                    />
                  )}
                />
              </div>

              {/* Verificador */}
              <div className="col-12 md:col-6">
                <label htmlFor="verificadorId" className="block text-900 font-medium mb-2">
                  Verificador
                </label>
                <Controller
                  name="verificadorId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="verificadorId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal.filter(p => p.cargo === 'Verificador' || p.cargo === 'Inspector').map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombres} ${p.apellidos} (${p.cargo})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un verificador"
                      showClear
                      filter
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Estado y Fechas */}
          <TabPanel header="Estado y Fechas">
            <div className="grid">
              {/* Estado Cumplida */}
              <div className="col-12 md:col-6">
                <div className="field-checkbox">
                  <Controller
                    name="cumplida"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="cumplida"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                    )}
                  />
                  <label htmlFor="cumplida" className="ml-2">
                    Acción Cumplida
                  </label>
                </div>
              </div>

              {/* Estado Verificado */}
              <div className="col-12 md:col-6">
                <div className="field-checkbox">
                  <Controller
                    name="verificado"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="verificado"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                    )}
                  />
                  <label htmlFor="verificado" className="ml-2">
                    Verificado
                  </label>
                </div>
              </div>

              {/* Fecha Cumplida - Solo si está marcada como cumplida */}
              {cumplida && (
                <div className="col-12 md:col-6">
                  <label htmlFor="fechaCumplida" className="block text-900 font-medium mb-2">
                    Fecha y Hora de Cumplimiento
                  </label>
                  <Controller
                    name="fechaCumplida"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="fechaCumplida"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        placeholder="Seleccione fecha y hora"
                        dateFormat="dd/mm/yy"
                        showTime
                        hourFormat="24"
                        showIcon
                      />
                    )}
                  />
                </div>
              )}

              {/* Fecha Verificación - Solo si está verificado */}
              {verificado && (
                <div className="col-12 md:col-6">
                  <label htmlFor="fechaVerificacion" className="block text-900 font-medium mb-2">
                    Fecha y Hora de Verificación
                  </label>
                  <Controller
                    name="fechaVerificacion"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="fechaVerificacion"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        placeholder="Seleccione fecha y hora"
                        dateFormat="dd/mm/yy"
                        showTime
                        hourFormat="24"
                        showIcon
                      />
                    )}
                  />
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Documentación y Observaciones */}
          <TabPanel header="Documentación y Observaciones">
            <div className="grid">
              {/* URL Documento PDF */}
              <div className="col-12">
                <label htmlFor="urlConfirmaAccionPdf" className="block text-900 font-medium mb-2">
                  URL del Documento de Confirmación (PDF)
                </label>
                <Controller
                  name="urlConfirmaAccionPdf"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlConfirmaAccionPdf"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://ejemplo.com/confirmacion-accion.pdf"
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
                      rows={5}
                      placeholder="Observaciones sobre la acción previa..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 4: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen de la Acción Previa</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Faena:</strong> {
                        faenas.find(f => f.id === watch('faenaPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Acción:</strong> {
                        accionesPrevias.find(ap => ap.id === watch('accionPreviaId'))?.nombre || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Responsable:</strong> {
                        personal.find(p => p.id === watch('responsableId'))?.nombres || 'Sin asignar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Verificador:</strong> {
                        personal.find(p => p.id === watch('verificadorId'))?.nombres || 'Sin asignar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Estado:</strong> {
                        cumplida ? 'Cumplida' : 'Pendiente'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Verificación:</strong> {
                        verificado ? 'Verificado' : 'Sin verificar'
                      }
                    </div>
                  </div>
                </div>
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
            label={accion?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetAccionesPreviasFaenaConsumoForm;
