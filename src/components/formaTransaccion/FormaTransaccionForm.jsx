// src/components/formaTransaccion/FormaTransaccionForm.jsx
// Formulario profesional para FormaTransaccion con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { createFormaTransaccion, updateFormaTransaccion } from '../../api/formaTransaccion';

/**
 * Componente FormaTransaccionForm
 * Formulario para gestión de formas de transacción en cotizaciones
 * Incluye validaciones según patrón ERP Megui
 */
const FormaTransaccionForm = ({ forma, onSave, onCancel }) => {
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
    if (forma) {
      // Cargar datos de la forma para edición
      reset({
        nombre: forma.nombre || '',
        descripcion: forma.descripcion || '',
        activo: Boolean(forma.activo)
      });
    }
  }, [forma, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo)
      };

      console.log('Payload FormaTransaccion:', payload);

      if (forma?.id) {
        await updateFormaTransaccion(forma.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Forma de transacción actualizada correctamente'
        });
      } else {
        await createFormaTransaccion(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Forma de transacción creada correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar forma de transacción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar la forma de transacción'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forma-transaccion-form">
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
                  placeholder="Ingrese el nombre de la forma de transacción"
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
                  placeholder="Descripción de la forma de transacción (opcional)"
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
            label={forma?.id ? 'Actualizar' : 'Crear'}
            icon={forma?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default FormaTransaccionForm;
