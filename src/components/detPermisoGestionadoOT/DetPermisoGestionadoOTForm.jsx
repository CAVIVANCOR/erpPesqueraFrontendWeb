// src/components/detPermisoGestionadoOT/DetPermisoGestionadoOTForm.jsx
// Formulario profesional para DetPermisoGestionadoOT. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { createDetPermisoGestionadoOT, updateDetPermisoGestionadoOT } from '../../api/detPermisoGestionadoOT';

/**
 * Formulario para gestión de DetPermisoGestionadoOT
 * Maneja creación y edición con validaciones y combos normalizados
 */
const DetPermisoGestionadoOTForm = ({ permiso, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [ordenesMantenimiento, setOrdenesMantenimiento] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (permiso) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        otMantenimientoId: permiso.otMantenimientoId ? Number(permiso.otMantenimientoId) : null,
        permisoId: permiso.permisoId ? Number(permiso.permisoId) : null,
        gestionado: permiso.gestionado || false,
        fechaGestion: permiso.fechaGestion ? new Date(permiso.fechaGestion) : null,
        observaciones: permiso.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        otMantenimientoId: null,
        permisoId: null,
        gestionado: false,
        fechaGestion: null,
        observaciones: ''
      });
    }
  }, [permiso, reset, ordenesMantenimiento, permisos]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // const [otMantenimientoData, permisosData] = await Promise.all([
      //   getAllOTMantenimiento(),
      //   getAllPermisos()
      // ]);
      
      // Datos de ejemplo mientras se implementan las APIs
      setOrdenesMantenimiento([
        { id: 1, codigo: 'OT-001', descripcion: 'Mantenimiento Preventivo Motor' },
        { id: 2, codigo: 'OT-002', descripcion: 'Reparación Sistema Hidráulico' },
        { id: 3, codigo: 'OT-003', descripcion: 'Cambio de Filtros' }
      ]);
      
      setPermisos([
        { id: 1, nombre: 'Permiso de Trabajo en Altura' },
        { id: 2, nombre: 'Permiso de Trabajo en Caliente' },
        { id: 3, nombre: 'Permiso de Entrada a Espacios Confinados' },
        { id: 4, nombre: 'Permiso de Trabajo Eléctrico' }
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
        permisoId: Number(data.permisoId),
        gestionado: Boolean(data.gestionado),
        fechaGestion: data.fechaGestion || null,
        observaciones: data.observaciones || null
      };

      console.log('Payload DetPermisoGestionadoOT:', payload); // Log para depuración

      if (permiso?.id) {
        await updateDetPermisoGestionadoOT(permiso.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permiso gestionado actualizado correctamente'
        });
      } else {
        await createDetPermisoGestionadoOT(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permiso gestionado creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el permiso gestionado'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-permiso-gestionado-ot-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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

          {/* Permiso */}
          <div className="col-12">
            <label htmlFor="permisoId" className="block text-900 font-medium mb-2">
              Permiso *
            </label>
            <Controller
              name="permisoId"
              control={control}
              rules={{ required: 'El permiso es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="permisoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={permisos.map(p => ({ ...p, id: Number(p.id) }))}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione un permiso"
                  className={errors.permisoId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.permisoId && (
              <small className="p-error">{errors.permisoId.message}</small>
            )}
          </div>

          {/* Gestionado */}
          <div className="col-12 md:col-6">
            <label htmlFor="gestionado" className="block text-900 font-medium mb-2">
              Estado de Gestión
            </label>
            <Controller
              name="gestionado"
              control={control}
              render={({ field }) => (
                <div className="flex align-items-center">
                  <Checkbox
                    id="gestionado"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                  <label htmlFor="gestionado" className="ml-2">
                    Permiso gestionado
                  </label>
                </div>
              )}
            />
          </div>

          {/* Fecha de Gestión */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaGestion" className="block text-900 font-medium mb-2">
              Fecha de Gestión
            </label>
            <Controller
              name="fechaGestion"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaGestion"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  showClear
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
                  placeholder="Observaciones sobre la gestión del permiso..."
                />
              )}
            />
          </div>
        </div>

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
            label={permiso?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetPermisoGestionadoOTForm;
