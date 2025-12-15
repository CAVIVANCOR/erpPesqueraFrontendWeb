/**
 * Formulario profesional para Marca
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
import { crearMarca, actualizarMarca } from '../../api/marca';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres')
});

/**
 * Componente del formulario
 * @param {Object} marca - Marca a editar (null para nueva)
 * @param {Function} onSave - Callback ejecutado al guardar exitosamente
 * @param {Function} onCancel - Callback ejecutado al cancelar
 * @param {Object} toast - Referencia al Toast del componente padre
 */
const MarcaForm = ({ marca, onSave, onCancel, toast, readOnly = false }) => {
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
   * Efecto para cargar datos cuando se edita una marca existente
   */
  useEffect(() => {
    if (marca) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        nombre: marca.nombre || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        nombre: ''
      });
    }
  }, [marca, reset]);

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
   * Crea o actualiza la marca según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase()
      };

      let resultado;
      if (marca?.id) {
        // Actualizar marca existente
        resultado = await actualizarMarca(Number(marca.id), datosNormalizados);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Marca "${resultado.nombre}" actualizada correctamente`
        });
      } else {
        // Crear nueva marca
        resultado = await crearMarca(datosNormalizados);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Marca "${resultado.nombre}" creada correctamente`
        });
      }

      // Ejecutar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar marca:', error);
      
      // Determinar mensaje de error específico
      let mensajeError = 'Error al guardar la marca';
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
        
        {/* Nombre de la Marca */}
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
                disabled={readOnly}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
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
            label={marca?.id ? 'Actualizar' : 'Crear'}
            icon={marca?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-success"
            raised
            size='small'
            loading={loading}
            disabled={readOnly}
          />
        </div>
      </form>
    </div>
  );
};

export default MarcaForm;
