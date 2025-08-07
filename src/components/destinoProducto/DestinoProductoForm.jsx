// src/components/destinoProducto/DestinoProductoForm.jsx
// Formulario profesional para DestinoProducto con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearDestinoProducto, actualizarDestinoProducto } from '../../api/destinoProducto';

/**
 * Componente DestinoProductoForm
 * Formulario para gestión de destinos de producto en cotizaciones
 * Incluye validaciones y campos específicos para compras/ventas según patrón ERP Megui
 */
const DestinoProductoForm = ({ destino, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true,
      paraCompras: false,
      paraVentas: false
    }
  });

  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    if (destino) {
      // Cargar datos del destino para edición
      reset({
        nombre: destino.nombre || '',
        descripcion: destino.descripcion || '',
        activo: Boolean(destino.activo),
        paraCompras: Boolean(destino.paraCompras),
        paraVentas: Boolean(destino.paraVentas)
      });
    }
  }, [destino, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo),
        paraCompras: Boolean(data.paraCompras),
        paraVentas: Boolean(data.paraVentas)
      };
      if (destino?.id) {
        await actualizarDestinoProducto(destino.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Destino de producto actualizado correctamente'
        });
      } else {
        await crearDestinoProducto(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Destino de producto creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar destino de producto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el destino de producto'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="destino-producto-form">
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
                  placeholder="Ingrese el nombre del destino de producto"
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
                  placeholder="Descripción del destino de producto (opcional)"
                  className={`w-full ${errors.descripcion ? 'p-invalid' : ''}`}
                  rows={3}
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
            )}
          </div>

          <div className="col-12 md:col-4">
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

          <div className="col-12 md:col-4">
            <div className="field-checkbox">
              <Controller
                name="paraCompras"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="paraCompras"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraCompras" className="ml-2 text-900 font-medium">
                Para Compras
              </label>
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field-checkbox">
              <Controller
                name="paraVentas"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="paraVentas"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraVentas" className="ml-2 text-900 font-medium">
                Para Ventas
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
            label={destino?.id ? 'Actualizar' : 'Crear'}
            icon={destino?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default DestinoProductoForm;
