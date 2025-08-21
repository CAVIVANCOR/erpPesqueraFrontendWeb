// src/components/tipoVehiculo/TipoVehiculoForm.jsx
/**
 * Formulario profesional para TipoVehiculo
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Modelo: id, nombre, descripcion, activo, createdAt, updatedAt
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de campos según regla ERP Megui
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .trim()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  
  descripcion: yup
    .string()
    .trim()
    .nullable()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
    
  activo: yup.boolean()
});

/**
 * Componente del formulario
 * @param {Object} tipoVehiculo - Tipo de vehículo a editar (null para nuevo)
 * @param {Function} onSave - Callback ejecutado al guardar exitosamente
 * @param {Function} onCancel - Callback ejecutado al cancelar
 * @param {Object} toast - Referencia al Toast del componente padre
 */
const TipoVehiculoForm = ({ tipoVehiculo, onSave, onCancel, toast }) => {
  const [loading, setLoading] = useState(false);

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true
    }
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (tipoVehiculo) {
      reset({
        nombre: tipoVehiculo.nombre || '',
        descripcion: tipoVehiculo.descripcion || '',
        activo: tipoVehiculo.activo !== undefined ? tipoVehiculo.activo : true
      });
    }
  }, [tipoVehiculo, reset]);

  /**
   * Maneja el envío del formulario
   * Solo normaliza los datos y los pasa al callback onSave
   */
  const onSubmit = async (data) => {
    if (loading) return; // Evitar doble envío
    
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo)
      };

      // Llamar al callback de guardado (la página padre maneja toda la lógica)
      if (onSave) {
        await onSave(datosNormalizados);
      }

    } catch (error) {
      console.error('Error al guardar tipo de vehículo:', error);
      
      // Mostrar error específico del servidor o error genérico
      const mensajeError = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el tipo de vehículo';
      
      if (toast && toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: mensajeError,
          life: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener clases de validación de PrimeReact
  const getFormErrorMessage = (name) => {
    return errors[name] && (
      <small className="p-error">
        {errors[name].message}
      </small>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid">
        {/* Campo Nombre */}
        <div className="p-col-12 p-md-8">
          <div className="p-field">
            <label htmlFor="nombre" className="font-bold">
              Nombre <span className="p-error">*</span>
            </label>
            <Controller
              name="nombre"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputText
                    id={field.name}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={classNames({ 'p-invalid': fieldState.error })}
                    disabled={loading}
                    placeholder="Ej: Camión, Camioneta, Moto"
                    autoFocus
                  />
                  {getFormErrorMessage(field.name)}
                </>
              )}
            />
          </div>
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-md-4">
          <div className="p-field" style={{ paddingTop: '1.7rem' }}>
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <div className="flex align-items-center">
                  <Checkbox
                    inputId={field.name}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                    disabled={loading}
                  />
                  <label htmlFor={field.name} className="ml-2 font-medium">
                    Activo
                  </label>
                </div>
              )}
            />
          </div>
        </div>

        {/* Campo Descripción */}
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcion" className="font-bold">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputTextarea
                    id={field.name}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={classNames({ 'p-invalid': fieldState.error })}
                    disabled={loading}
                    rows={3}
                    placeholder="Descripción detallada del tipo de vehículo"
                  />
                  {getFormErrorMessage(field.name)}
                </>
              )}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-grid p-mt-4">
        <div className="p-col-12 flex justify-content-end">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={tipoVehiculo?.id ? 'Actualizar' : 'Guardar'}
            icon="pi pi-check"
            className="p-button-success ml-2"
            loading={loading}
          />
        </div>
      </div>
    </form>
  );
};

export default TipoVehiculoForm;
