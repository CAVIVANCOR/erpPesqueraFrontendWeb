/**
 * Formulario profesional para TipoMovimientoAcceso
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona tipos de movimientos de acceso con códigos únicos y estados activos.
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de IDs y campos según regla ERP Megui
 * - Validación de unicidad de código y nombre en tiempo real
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 * - Conversión automática de código a mayúsculas
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { crearTipoMovimientoAcceso, actualizarTipoMovimientoAcceso, validarCodigoUnico, validarNombreUnico } from '../../api/tipoMovimientoAcceso';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  codigo: yup
    .string()
    .required('El código es obligatorio')
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(10, 'El código no puede exceder 10 caracteres')
    .matches(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números'),
  
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  descripcion: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  activo: yup
    .boolean()
});

/**
 * Componente TipoMovimientoAccesoForm
 * Formulario para crear y editar tipos de movimientos de acceso
 */
const TipoMovimientoAccesoForm = ({ tipo, onSave, onCancel }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setError,
    clearErrors
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true
    }
  });

  // Watch para validaciones dependientes
  const codigoValue = watch('codigo');
  const nombreValue = watch('nombre');

  /**
   * Efecto para cargar datos cuando se edita un tipo existente
   */
  useEffect(() => {
    if (tipo) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        codigo: tipo.codigo?.trim().toUpperCase() || '',
        nombre: tipo.nombre?.trim() || '',
        descripcion: tipo.descripcion?.trim() || '',
        activo: Boolean(tipo.activo)
      });
    } else {
      // Reset para nuevo registro
      reset({
        codigo: '',
        nombre: '',
        descripcion: '',
        activo: true
      });
    }
  }, [tipo, reset]);

  /**
   * Efecto para validar unicidad del código
   */
  useEffect(() => {
    const validarCodigo = async () => {
      if (codigoValue && codigoValue.length >= 2) {
        try {
          const esUnico = await validarCodigoUnico(codigoValue, tipo?.id);
          
          if (!esUnico) {
            setError('codigo', {
              type: 'manual',
              message: 'Este código ya existe'
            });
          } else {
            clearErrors('codigo');
          }
        } catch (error) {
          console.error('Error al validar código:', error);
        }
      }
    };

    const timeoutId = setTimeout(validarCodigo, 500);
    return () => clearTimeout(timeoutId);
  }, [codigoValue, tipo?.id, setError, clearErrors]);

  /**
   * Efecto para validar unicidad del nombre
   */
  useEffect(() => {
    const validarNombre = async () => {
      if (nombreValue && nombreValue.length >= 3) {
        try {
          const esUnico = await validarNombreUnico(nombreValue, tipo?.id);
          
          if (!esUnico) {
            setError('nombre', {
              type: 'manual',
              message: 'Este nombre ya existe'
            });
          } else {
            clearErrors('nombre');
          }
        } catch (error) {
          console.error('Error al validar nombre:', error);
        }
      }
    };

    const timeoutId = setTimeout(validarNombre, 500);
    return () => clearTimeout(timeoutId);
  }, [nombreValue, tipo?.id, setError, clearErrors]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el tipo según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        codigo: data.codigo?.trim().toUpperCase() || '',
        nombre: data.nombre?.trim() || '',
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo)
      };

      let resultado;
      if (tipo?.id) {
        // Actualizar tipo existente
        resultado = await actualizarTipoMovimientoAcceso(tipo.id, datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de movimiento actualizado correctamente'
        });
      } else {
        // Crear nuevo tipo
        resultado = await crearTipoMovimientoAcceso(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de movimiento creado correctamente'
        });
      }

      console.log('Tipo de movimiento guardado:', resultado);
      
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar tipo de movimiento:', error);
      
      // Mostrar error específico del servidor o error genérico
      const mensajeError = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el tipo de movimiento';
      
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

  /**
   * Maneja el cambio del código convirtiendo a mayúsculas
   */
  const handleCodigoChange = (field, value) => {
    const codigoMayusculas = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    field.onChange(codigoMayusculas);
  };

  return (
    <div className="formgrid grid">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        
        {/* Código */}
        <div className="field col-12 md:col-6">
          <label htmlFor="codigo" className="font-bold">
            Código *
          </label>
          <Controller
            name="codigo"
            control={control}
            render={({ field }) => (
              <InputText
                id="codigo"
                {...field}
                onChange={(e) => handleCodigoChange(field, e.target.value)}
                placeholder="Código del tipo (ej: ING, SAL)"
                className={errors.codigo ? 'p-invalid' : ''}
                maxLength={10}
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error">{errors.codigo.message}</small>
          )}
          <small className="text-600">
            Solo letras mayúsculas y números, máximo 10 caracteres
          </small>
        </div>

        {/* Nombre */}
        <div className="field col-12 md:col-6">
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
                placeholder="Nombre del tipo de movimiento"
                className={errors.nombre ? 'p-invalid' : ''}
                maxLength={100}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Estado Activo */}
        <div className="field col-12">
          <div className="flex align-items-center">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                />
              )}
            />
            <label htmlFor="activo" className="font-bold">
              Tipo de movimiento activo
            </label>
          </div>
          <small className="text-600">
            Los tipos inactivos no aparecerán en las listas de selección
          </small>
        </div>

        {/* Descripción */}
        <div className="field col-12">
          <label htmlFor="descripcion" className="font-bold">
            Descripción
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="descripcion"
                {...field}
                placeholder="Descripción detallada del tipo de movimiento..."
                className={errors.descripcion ? 'p-invalid' : ''}
                rows={4}
                maxLength={500}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error">{errors.descripcion.message}</small>
          )}
          <small className="text-600">
            Máximo 500 caracteres
          </small>
        </div>

        {/* Botones de acción */}
        <div className="field col-12">
          <div className="flex justify-content-end gap-2 pt-4">
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={handleCancel}
              disabled={loading}
            />
            <Button
              type="submit"
              label={tipo?.id ? 'Actualizar' : 'Crear'}
              icon={tipo?.id ? 'pi pi-check' : 'pi pi-plus'}
              className="p-button-primary"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TipoMovimientoAccesoForm;
