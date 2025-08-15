/**
 * Formulario profesional para TipoAlmacenamiento
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Modelo Prisma: id, nombre (VarChar 80), productos[]
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de campos según regla ERP Megui (MAYÚSCULAS)
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
import { crearTipoAlmacenamiento, actualizarTipoAlmacenamiento } from '../../api/tipoAlmacenamiento';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 5 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres')
});

/**
 * Componente del formulario
 * @param {Object} tipoAlmacenamiento - Tipo de almacenamiento a editar (null para nuevo)
 * @param {Function} onSave - Callback ejecutado al guardar exitosamente
 * @param {Function} onCancel - Callback ejecutado al cancelar
 * @param {Object} toast - Referencia al Toast del componente padre
 */
const TipoAlmacenamientoForm = ({ tipoAlmacenamiento, onSave, onCancel, toast }) => {
  const [loading, setLoading] = useState(false);

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: ''
    }
  });

  // Watch para el nombre para convertir a mayúsculas automáticamente
  const nombreValue = watch('nombre');

  /**
   * Efecto para cargar datos cuando se edita un tipo de almacenamiento existente
   */
  useEffect(() => {
    if (tipoAlmacenamiento) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        nombre: tipoAlmacenamiento.nombre || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        nombre: ''
      });
    }
  }, [tipoAlmacenamiento, reset]);

  /**
   * Efecto para convertir nombre a mayúsculas automáticamente
   */
  useEffect(() => {
    if (nombreValue) {
      const nombreMayusculas = nombreValue.toUpperCase();
      if (nombreMayusculas !== nombreValue) {
        setValue('nombre', nombreMayusculas);
      }
    }
  }, [nombreValue, setValue]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el tipo de almacenamiento según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase()
      };

      let resultado;
      if (tipoAlmacenamiento?.id) {
        // Actualizar tipo de almacenamiento existente
        resultado = await actualizarTipoAlmacenamiento(Number(tipoAlmacenamiento.id), datosNormalizados);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de almacenamiento "${resultado.nombre}" actualizado correctamente`
        });
      } else {
        // Crear nuevo tipo de almacenamiento
        resultado = await crearTipoAlmacenamiento(datosNormalizados);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de almacenamiento "${resultado.nombre}" creado correctamente`
        });
      }

      // Ejecutar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar tipo de almacenamiento:', error);
      
      // Determinar mensaje de error específico
      let mensajeError = 'Error al guardar el tipo de almacenamiento';
      if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: mensajeError
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="formgrid grid">
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        
        {/* Nombre del Tipo de Almacenamiento */}
        <div className="p-field">
          <label htmlFor="nombre" className="font-bold">
            Nombre *
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                className={errors.nombre ? 'p-invalid' : ''}
                maxLength={80}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={handleCancel}
            raised
            size='small'
            disabled={loading}
          />
          <Button
            type="submit"
            label={tipoAlmacenamiento?.id ? 'Actualizar' : 'Crear'}
            icon={tipoAlmacenamiento?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-success"
            raised
            size='small'
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default TipoAlmacenamientoForm;
