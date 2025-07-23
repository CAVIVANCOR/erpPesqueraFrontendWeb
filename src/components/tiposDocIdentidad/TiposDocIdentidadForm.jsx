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

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
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
 * Componente TiposDocIdentidadForm
 * Formulario para crear y editar tipos de documentos de identidad
 */
const TiposDocIdentidadForm = ({ tipoDoc, onSave, onCancel }) => {
  const toast = useRef(null);
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
          detail: 'Tipo de documento actualizado correctamente'
        });
      } else {
        // Crear nuevo tipo de documento
        resultado = await crearTipoDocIdentidad(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de documento creado correctamente'
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
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        
        {/* Código del Tipo de Documento */}
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
        <div className="field col-12 md:col-6">
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
        <div className="field col-12">
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
        <div className="field col-12">
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
              Tipo de documento cesado (inactivo)
            </label>
          </div>
          <small className="text-600">
            Marque esta opción si el tipo de documento ya no debe usarse
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
              label={tipoDoc?.id ? 'Actualizar' : 'Crear'}
              icon={tipoDoc?.id ? 'pi pi-check' : 'pi pi-plus'}
              className="p-button-primary"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TiposDocIdentidadForm;
