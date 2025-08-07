// src/components/modoDespachoRecepcion/ModoDespachoRecepcionForm.jsx
// Formulario profesional para ModoDespachoRecepcion con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { createModoDespachoRecepcion, updateModoDespachoRecepcion } from '../../api/modoDespachoRecepcion';

/**
 * Componente ModoDespachoRecepcionForm
 * Formulario para gestión de modos de despacho/recepción en cotizaciones
 * Incluye validaciones según patrón ERP Megui
 */
const ModoDespachoRecepcionForm = ({ modo, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true
    }
  });

  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    if (modo) {
      // Cargar datos del modo para edición
      reset({
        nombre: modo.nombre || '',
        descripcion: modo.descripcion || '',
        activo: Boolean(modo.activo)
      });
    }
  }, [modo, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo)
      };
      if (modo?.id) {
        await updateModoDespachoRecepcion(modo.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Modo de despacho/recepción actualizado correctamente'
        });
      } else {
        await createModoDespachoRecepcion(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Modo de despacho/recepción creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar modo de despacho/recepción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el modo de despacho/recepción'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modo-despacho-recepcion-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="nombre" className="block text-900 font-medium mb-2">
              Nombre *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{ 
                required: 'El nombre es obligatorio',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 100, message: 'Máximo 100 caracteres' }
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  {...field}
                  placeholder="Ingrese el nombre del modo de despacho/recepción"
                  className={`w-full ${errors.nombre ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.nombre && (
              <small className="p-error">{errors.nombre.message}</small>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ 
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              }}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  placeholder="Descripción del modo de despacho/recepción (opcional)"
                  className={`w-full ${errors.descripcion ? 'p-invalid' : ''}`}
                  rows={3}
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
            )}
          </div>

          <div className="col-12">
            <div className="field-checkbox">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="activo" className="ml-2 text-900 font-medium">
                Activo
              </label>
            </div>
          </div>
        </div>

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
            label={modo?.id ? 'Actualizar' : 'Crear'}
            icon={modo?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default ModoDespachoRecepcionForm;
