// src/components/novedadPescaConsumo/NovedadPescaConsumoForm.jsx
// Formulario profesional para NovedadPescaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createNovedadPescaConsumo, updateNovedadPescaConsumo } from '../../api/novedadPescaConsumo';

/**
 * Formulario para gestión de NovedadPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const NovedadPescaConsumoForm = ({ novedad, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [bahias, setBahias] = useState([]);
  const toast = useRef(null);

  // Observar fechas para validación
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (novedad) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        empresaId: novedad.empresaId ? Number(novedad.empresaId) : null,
        BahiaId: novedad.BahiaId ? Number(novedad.BahiaId) : null,
        nombre: novedad.nombre || '',
        fechaInicio: novedad.fechaInicio ? new Date(novedad.fechaInicio) : null,
        fechaFin: novedad.fechaFin ? new Date(novedad.fechaFin) : null
      });
    } else {
      // Reset para nuevo registro
      reset({
        empresaId: null,
        BahiaId: null,
        nombre: '',
        fechaInicio: null,
        fechaFin: null
      });
    }
  }, [novedad, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setEmpresas([
        { id: 1, razonSocial: 'Pesquera del Pacífico S.A.', ruc: '20123456789' },
        { id: 2, razonSocial: 'Industrias Marinas del Sur S.A.C.', ruc: '20987654321' },
        { id: 3, razonSocial: 'Compañía Pesquera Norteña S.A.', ruc: '20456789123' }
      ]);
      
      setBahias([
        { id: 1, nombre: 'Bahía de Paracas', codigo: 'PAR' },
        { id: 2, nombre: 'Bahía de Chimbote', codigo: 'CHI' },
        { id: 3, nombre: 'Bahía de Callao', codigo: 'CAL' },
        { id: 4, nombre: 'Bahía de Paita', codigo: 'PAI' },
        { id: 5, nombre: 'Bahía de Ilo', codigo: 'ILO' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const validarFechas = () => {
    if (fechaInicio && fechaFin && fechaInicio >= fechaFin) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    return true;
  };

  const calcularDuracion = () => {
    if (!fechaInicio || !fechaFin) return '';
    
    const diferencia = fechaFin - fechaInicio;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return `${dias} día${dias !== 1 ? 's' : ''}`;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar fechas
      const validacionFechas = validarFechas();
      if (validacionFechas !== true) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: validacionFechas
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        empresaId: Number(data.empresaId),
        BahiaId: Number(data.BahiaId),
        nombre: data.nombre.trim(),
        fechaInicio: data.fechaInicio.toISOString(),
        fechaFin: data.fechaFin.toISOString()
      };

      console.log('Payload NovedadPescaConsumo:', payload); // Log para depuración

      if (novedad?.id) {
        await updateNovedadPescaConsumo(novedad.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Novedad actualizada correctamente'
        });
      } else {
        await createNovedadPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Novedad creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la novedad'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="novedad-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Nombre */}
              <div className="col-12">
                <label htmlFor="nombre" className="block text-900 font-medium mb-2">
                  Nombre de la Novedad *
                </label>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ 
                    required: 'El nombre es obligatorio',
                    minLength: { value: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                    maxLength: { value: 100, message: 'El nombre no puede exceder 100 caracteres' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="nombre"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: Temporada de Anchoveta 2024-I"
                      className={errors.nombre ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.nombre && (
                  <small className="p-error">{errors.nombre.message}</small>
                )}
              </div>

              {/* Empresa */}
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
                      options={empresas.map(emp => ({ 
                        ...emp, 
                        id: Number(emp.id),
                        nombreCompleto: `${emp.ruc} - ${emp.razonSocial}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una empresa"
                      className={errors.empresaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.empresaId && (
                  <small className="p-error">{errors.empresaId.message}</small>
                )}
              </div>

              {/* Bahía */}
              <div className="col-12 md:col-6">
                <label htmlFor="BahiaId" className="block text-900 font-medium mb-2">
                  Bahía *
                </label>
                <Controller
                  name="BahiaId"
                  control={control}
                  rules={{ required: 'La bahía es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="BahiaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={bahias.map(bahia => ({ 
                        ...bahia, 
                        id: Number(bahia.id),
                        nombreCompleto: `${bahia.codigo} - ${bahia.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una bahía"
                      className={errors.BahiaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.BahiaId && (
                  <small className="p-error">{errors.BahiaId.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Duración */}
          <TabPanel header="Fechas y Duración">
            <div className="grid">
              {/* Fecha Inicio */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaInicio" className="block text-900 font-medium mb-2">
                  Fecha de Inicio *
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  rules={{ required: 'La fecha de inicio es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaInicio"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha de inicio"
                      dateFormat="dd/mm/yy"
                      showIcon
                      className={errors.fechaInicio ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaInicio && (
                  <small className="p-error">{errors.fechaInicio.message}</small>
                )}
              </div>

              {/* Fecha Fin */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaFin" className="block text-900 font-medium mb-2">
                  Fecha de Fin *
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  rules={{ required: 'La fecha de fin es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaFin"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha de fin"
                      dateFormat="dd/mm/yy"
                      showIcon
                      minDate={fechaInicio}
                      className={errors.fechaFin ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaFin && (
                  <small className="p-error">{errors.fechaFin.message}</small>
                )}
              </div>

              {/* Duración Calculada */}
              {fechaInicio && fechaFin && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h5 className="mb-2 text-blue-800">Información de Duración</h5>
                    <div className="grid">
                      <div className="col-6">
                        <strong>Duración Total:</strong> {calcularDuracion()}
                      </div>
                      <div className="col-6">
                        <strong>Estado Actual:</strong> 
                        {(() => {
                          const ahora = new Date();
                          if (ahora < fechaInicio) return ' Programada';
                          if (ahora >= fechaInicio && ahora <= fechaFin) return ' En Curso';
                          return ' Finalizada';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen de la Novedad</h5>
                  <div className="grid">
                    <div className="col-12">
                      <strong>Nombre:</strong> {watch('nombre') || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>Empresa:</strong> {
                        empresas.find(e => e.id === watch('empresaId'))?.razonSocial || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Bahía:</strong> {
                        bahias.find(b => b.id === watch('BahiaId'))?.nombre || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Fecha Inicio:</strong> {
                        fechaInicio ? fechaInicio.toLocaleDateString('es-PE') : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Fecha Fin:</strong> {
                        fechaFin ? fechaFin.toLocaleDateString('es-PE') : 'Sin definir'
                      }
                    </div>
                    {fechaInicio && fechaFin && (
                      <div className="col-12">
                        <div className="text-lg font-bold text-primary">
                          <strong>Duración: {calcularDuracion()}</strong>
                        </div>
                      </div>
                    )}
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
            label={novedad?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default NovedadPescaConsumoForm;
