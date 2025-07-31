/**
 * Formulario profesional para TiposDocIdentidad
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Modelo Prisma: id, codigo, codSunat, nombre, cesado, createdAt, updatedAt
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de IDs y campos según regla ERP Megui
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
import { Checkbox } from 'primereact/checkbox';
import { crearTipoDocIdentidad, actualizarTipoDocIdentidad } from '../../api/tiposDocIdentidad';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  codigo: yup
    .string()
    .required('El código es obligatorio')
    .min(1, 'El código debe tener al menos 1 carácter')
    .max(10, 'El código no puede exceder 10 caracteres')
    .matches(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números'),
  
  codSunat: yup
    .string()
    .required('El código SUNAT es obligatorio')
    .min(1, 'El código SUNAT debe tener al menos 1 carácter')
    .max(5, 'El código SUNAT no puede exceder 5 caracteres'),
  
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  cesado: yup
    .boolean()
});

/**
 * Componente del formulario
 * @param {Object} tipoDoc - Tipo de documento a editar (null para nuevo)
 * @param {Function} onSave - Callback ejecutado al guardar exitosamente
 * @param {Function} onCancel - Callback ejecutado al cancelar
 * @param {Object} toast - Referencia al Toast del componente padre
 */
const TiposDocIdentidadForm = ({ tipoDoc, onSave, onCancel, toast }) => {
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
      codigo: '',
      codSunat: '',
      nombre: '',
      cesado: false
    }
  });

  // Watch para el código para convertir a mayúsculas automáticamente
  const codigoValue = watch('codigo');

  /**
   * Efecto para cargar datos cuando se edita un tipo de documento existente
   */
  useEffect(() => {
    if (tipoDoc) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        codigo: tipoDoc.codigo || '',
        codSunat: tipoDoc.codSunat || '',
        nombre: tipoDoc.nombre || '',
        cesado: Boolean(tipoDoc.cesado)
      });
    } else {
      // Reset para nuevo registro
      reset({
        codigo: '',
        codSunat: '',
        nombre: '',
        cesado: false
      });
    }
  }, [tipoDoc, reset]);

  /**
   * Efecto para convertir código a mayúsculas automáticamente
   */
  useEffect(() => {
    if (codigoValue) {
      const codigoMayusculas = codigoValue.toUpperCase();
      if (codigoMayusculas !== codigoValue) {
        setValue('codigo', codigoMayusculas);
      }
    }
  }, [codigoValue, setValue]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el tipo de documento según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        codigo: data.codigo.trim().toUpperCase(),
        codSunat: data.codSunat.trim(),
        nombre: data.nombre.trim(),
        cesado: Boolean(data.cesado)
      };

      let resultado;
      if (tipoDoc?.id) {
        // Actualizar tipo de documento existente
        resultado = await actualizarTipoDocIdentidad(tipoDoc.id, datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de documento "${datosNormalizados.nombre}" actualizado correctamente`
        });
      } else {
        // Crear nuevo tipo de documento
        resultado = await crearTipoDocIdentidad(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Tipo de documento "${datosNormalizados.nombre}" creado correctamente`
        });
      }

      console.log('Tipo de documento guardado:', resultado);
      
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar tipo de documento:', error);
      
      // Mostrar error específico del servidor o error genérico
      const mensajeError = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el tipo de documento';
      
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
        
        {/* Código del Tipo de Documento */}
        <div className="p-field">
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
                placeholder="Ej: DNI, PAS, CE"
                className={errors.codigo ? 'p-invalid' : ''}
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error">{errors.codigo.message}</small>
          )}
        </div>

        {/* Código SUNAT */}
        <div className="p-field">
          <label htmlFor="codSunat" className="font-bold">
            Código SUNAT *
          </label>
          <Controller
            name="codSunat"
            control={control}
            render={({ field }) => (
              <InputText
                id="codSunat"
                {...field}
                placeholder="Código para SUNAT"
                className={errors.codSunat ? 'p-invalid' : ''}
                maxLength={5}
              />
            )}
          />
          {errors.codSunat && (
            <small className="p-error">{errors.codSunat.message}</small>
          )}
        </div>

        {/* Nombre del Tipo de Documento */}
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
                placeholder="Nombre descriptivo del tipo de documento"
                className={errors.nombre ? 'p-invalid' : ''}
                maxLength={100}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Estado Cesado */}
        <div className="p-field-checkbox">
          <div className="flex align-items-center">
            <Controller
              name="cesado"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="cesado"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                />
              )}
            />
            <label htmlFor="cesado" className="font-bold">
              CESADO
            </label>
          </div>
          <small className="text-600">
            Marque esta opción si el tipo de documento ya no debe usarse
          </small>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
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
              label={tipoDoc?.id ? 'Actualizar' : 'Crear'}
              icon={tipoDoc?.id ? 'pi pi-check' : 'pi pi-plus'}
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

export default TiposDocIdentidadForm;
