// src/components/tripulanteFaenaConsumo/TripulanteFaenaConsumoForm.jsx
// Formulario profesional para TripulanteFaenaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createTripulanteFaenaConsumo, updateTripulanteFaenaConsumo } from '../../api/tripulanteFaenaConsumo';

/**
 * Formulario para gestión de TripulanteFaenaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const TripulanteFaenaConsumoForm = ({ tripulante, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [cargos, setCargos] = useState([]);
  const toast = useRef(null);

  // Observar si se selecciona personal registrado
  const personalId = watch('personalId');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (tripulante) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        faenaPescaConsumoId: tripulante.faenaPescaConsumoId ? Number(tripulante.faenaPescaConsumoId) : null,
        personalId: tripulante.personalId ? Number(tripulante.personalId) : null,
        cargoId: tripulante.cargoId ? Number(tripulante.cargoId) : null,
        nombres: tripulante.nombres || '',
        apellidos: tripulante.apellidos || '',
        observaciones: tripulante.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        personalId: null,
        cargoId: null,
        nombres: '',
        apellidos: '',
        observaciones: ''
      });
    }
  }, [tripulante, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setFaenas([
        { id: 1, descripcion: 'Faena Anchoveta - Paracas 001', fechaSalida: '2024-01-15' },
        { id: 2, descripcion: 'Faena Jurel - Chimbote 002', fechaSalida: '2024-01-16' },
        { id: 3, descripcion: 'Faena Caballa - Callao 003', fechaSalida: '2024-01-17' }
      ]);
      
      setPersonal([
        { id: 1, nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Marinero' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez Silva', cargo: 'Motorista' },
        { id: 3, nombres: 'Miguel', apellidos: 'Torres López', cargo: 'Cocinero' },
        { id: 4, nombres: 'José', apellidos: 'Vargas Ruiz', cargo: 'Patrón' },
        { id: 5, nombres: 'Pedro', apellidos: 'García Pérez', cargo: 'Marinero' },
        { id: 6, nombres: 'Juan', apellidos: 'López Martín', cargo: 'Pescador' }
      ]);

      setCargos([
        { id: 1, nombre: 'Patrón', descripcion: 'Capitán de la embarcación' },
        { id: 2, nombre: 'Motorista', descripcion: 'Encargado de motores' },
        { id: 3, nombre: 'Marinero', descripcion: 'Tripulante general' },
        { id: 4, nombre: 'Pescador', descripcion: 'Especialista en pesca' },
        { id: 5, nombre: 'Cocinero', descripcion: 'Encargado de alimentación' },
        { id: 6, nombre: 'Ayudante', descripcion: 'Asistente general' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  // Auto-completar nombres cuando se selecciona personal registrado
  useEffect(() => {
    if (personalId) {
      const personalSeleccionado = personal.find(p => p.id === personalId);
      if (personalSeleccionado) {
        reset(prev => ({
          ...prev,
          nombres: personalSeleccionado.nombres,
          apellidos: personalSeleccionado.apellidos
        }));
      }
    }
  }, [personalId, personal, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        personalId: data.personalId ? Number(data.personalId) : null,
        cargoId: data.cargoId ? Number(data.cargoId) : null,
        nombres: data.nombres?.trim() || null,
        apellidos: data.apellidos?.trim() || null,
        observaciones: data.observaciones?.trim() || null
      };

      if (tripulante?.id) {
        await updateTripulanteFaenaConsumo(tripulante.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tripulante actualizado correctamente'
        });
      } else {
        await createTripulanteFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tripulante creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el tripulante'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tripulante-faena-consumo-form">
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

              {/* Personal Registrado (Opcional) */}
              <div className="col-12">
                <label htmlFor="personalId" className="block text-900 font-medium mb-2">
                  Personal Registrado (Opcional)
                </label>
                <Controller
                  name="personalId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="personalId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombres} ${p.apellidos} (${p.cargo})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione personal registrado o deje vacío para tripulante externo"
                      showClear
                      filter
                    />
                  )}
                />
                <small className="text-500">
                  Si selecciona personal registrado, los nombres se completarán automáticamente
                </small>
              </div>

              {/* Cargo */}
              <div className="col-12">
                <label htmlFor="cargoId" className="block text-900 font-medium mb-2">
                  Cargo
                </label>
                <Controller
                  name="cargoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="cargoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={cargos.map(c => ({ 
                        ...c, 
                        id: Number(c.id),
                        nombreCompleto: `${c.nombre} - ${c.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un cargo"
                      showClear
                      filter
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Datos Personales */}
          <TabPanel header="Datos Personales">
            <div className="grid">
              {/* Nombres */}
              <div className="col-12 md:col-6">
                <label htmlFor="nombres" className="block text-900 font-medium mb-2">
                  Nombres
                </label>
                <Controller
                  name="nombres"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="nombres"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Nombres del tripulante"
                      disabled={!!personalId} // Deshabilitado si se seleccionó personal registrado
                    />
                  )}
                />
                {personalId && (
                  <small className="text-500">
                    Completado automáticamente desde personal registrado
                  </small>
                )}
              </div>

              {/* Apellidos */}
              <div className="col-12 md:col-6">
                <label htmlFor="apellidos" className="block text-900 font-medium mb-2">
                  Apellidos
                </label>
                <Controller
                  name="apellidos"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="apellidos"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Apellidos del tripulante"
                      disabled={!!personalId} // Deshabilitado si se seleccionó personal registrado
                    />
                  )}
                />
                {personalId && (
                  <small className="text-500">
                    Completado automáticamente desde personal registrado
                  </small>
                )}
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
                      placeholder="Observaciones sobre el tripulante..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen del Tripulante</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Faena:</strong> {
                        faenas.find(f => f.id === watch('faenaPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Tipo:</strong> {
                        personalId ? 'Personal Registrado' : 'Tripulante Externo'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Nombres:</strong> {watch('nombres') || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>Apellidos:</strong> {watch('apellidos') || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>Cargo:</strong> {
                        cargos.find(c => c.id === watch('cargoId'))?.nombre || 'Sin asignar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Personal Registrado:</strong> {
                        personalId ? personal.find(p => p.id === personalId)?.nombres || 'Sí' : 'No'
                      }
                    </div>
                  </div>
                  
                  {personalId && (
                    <div className="mt-3 p-3 bg-blue-50 border-round">
                      <div className="flex align-items-center">
                        <i className="pi pi-info-circle text-blue-600 mr-2"></i>
                        <span className="text-blue-800">
                          Este tripulante está vinculado al personal registrado en el sistema
                        </span>
                      </div>
                    </div>
                  )}
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
            label={tripulante?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default TripulanteFaenaConsumoForm;
