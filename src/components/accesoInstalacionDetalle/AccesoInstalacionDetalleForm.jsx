/**
 * Formulario profesional para AccesoInstalacionDetalle
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona detalles de accesos a instalaciones con equipos, movimientos y personal.
 * 
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de IDs y campos según regla ERP Megui
 * - Combos relacionales con datos normalizados
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 * - Validación de unicidad de número de equipo por tipo
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
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { crearDetalleAccesoInstalacion, actualizarDetalleAccesoInstalacion, validarNumeroEquipoUnico } from '../../api/accesoInstalacionDetalle';

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  accesoInstalacionId: yup
    .number()
    .required('El acceso a instalación es obligatorio')
    .positive('Debe seleccionar un acceso válido'),
  
  tipoEquipoId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un tipo de equipo válido'),
  
  numeroEquipo: yup
    .string()
    .max(50, 'El número de equipo no puede exceder 50 caracteres'),
  
  tipoMovimientoId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar un tipo de movimiento válido'),
  
  personalId: yup
    .number()
    .nullable()
    .positive('Debe seleccionar personal válido'),
  
  fechaMovimiento: yup
    .date()
    .nullable(),
  
  observaciones: yup
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
});

/**
 * Componente AccesoInstalacionDetalleForm
 * Formulario para crear y editar detalles de accesos a instalaciones
 */
const AccesoInstalacionDetalleForm = ({ detalle, onSave, onCancel }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [accesosInstalacion, setAccesosInstalacion] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [personal, setPersonal] = useState([]);

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
      accesoInstalacionId: null,
      tipoEquipoId: null,
      numeroEquipo: '',
      tipoMovimientoId: null,
      personalId: null,
      fechaMovimiento: null,
      observaciones: ''
    }
  });

  // Watch para validaciones dependientes
  const tipoEquipoIdValue = watch('tipoEquipoId');
  const numeroEquipoValue = watch('numeroEquipo');

  /**
   * Carga los datos iniciales para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      // Aquí cargarías los datos reales desde las APIs correspondientes
      // Por ahora usamos datos de ejemplo
      setAccesosInstalacion([
        { id: 1, codigo: 'ACC-001', descripcion: 'Acceso Principal' },
        { id: 2, codigo: 'ACC-002', descripcion: 'Acceso Secundario' },
        { id: 3, codigo: 'ACC-003', descripcion: 'Acceso Emergencia' }
      ]);

      setTiposEquipo([
        { id: 1, nombre: 'Laptop' },
        { id: 2, nombre: 'Desktop' },
        { id: 3, nombre: 'Tablet' },
        { id: 4, nombre: 'Smartphone' },
        { id: 5, nombre: 'Impresora' }
      ]);

      setTiposMovimiento([
        { id: 1, nombre: 'Ingreso' },
        { id: 2, nombre: 'Salida' },
        { id: 3, nombre: 'Transferencia' },
        { id: 4, nombre: 'Mantenimiento' }
      ]);

      setPersonal([
        { id: 1, nombres: 'Juan', apellidos: 'Pérez García' },
        { id: 2, nombres: 'María', apellidos: 'López Rodríguez' },
        { id: 3, nombres: 'Carlos', apellidos: 'González Martínez' },
        { id: 4, nombres: 'Ana', apellidos: 'Fernández Silva' }
      ]);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  /**
   * Efecto para cargar datos cuando se edita un detalle existente
   */
  useEffect(() => {
    if (detalle) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        accesoInstalacionId: detalle.accesoInstalacionId ? Number(detalle.accesoInstalacionId) : null,
        tipoEquipoId: detalle.tipoEquipoId ? Number(detalle.tipoEquipoId) : null,
        numeroEquipo: detalle.numeroEquipo || '',
        tipoMovimientoId: detalle.tipoMovimientoId ? Number(detalle.tipoMovimientoId) : null,
        personalId: detalle.personalId ? Number(detalle.personalId) : null,
        fechaMovimiento: detalle.fechaMovimiento ? new Date(detalle.fechaMovimiento) : null,
        observaciones: detalle.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        accesoInstalacionId: null,
        tipoEquipoId: null,
        numeroEquipo: '',
        tipoMovimientoId: null,
        personalId: null,
        fechaMovimiento: null,
        observaciones: ''
      });
    }
  }, [detalle, reset]);

  /**
   * Efecto para validar unicidad del número de equipo
   */
  useEffect(() => {
    const validarNumeroEquipo = async () => {
      if (numeroEquipoValue && tipoEquipoIdValue && numeroEquipoValue.length >= 3) {
        try {
          const esUnico = await validarNumeroEquipoUnico(
            numeroEquipoValue, 
            tipoEquipoIdValue, 
            detalle?.id
          );
          
          if (!esUnico) {
            setError('numeroEquipo', {
              type: 'manual',
              message: 'Este número de equipo ya existe para este tipo'
            });
          } else {
            clearErrors('numeroEquipo');
          }
        } catch (error) {
          console.error('Error al validar número de equipo:', error);
        }
      }
    };

    const timeoutId = setTimeout(validarNumeroEquipo, 500);
    return () => clearTimeout(timeoutId);
  }, [numeroEquipoValue, tipoEquipoIdValue, detalle?.id, setError, clearErrors]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el detalle según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        accesoInstalacionId: Number(data.accesoInstalacionId),
        tipoEquipoId: data.tipoEquipoId ? Number(data.tipoEquipoId) : null,
        numeroEquipo: data.numeroEquipo?.trim() || null,
        tipoMovimientoId: data.tipoMovimientoId ? Number(data.tipoMovimientoId) : null,
        personalId: data.personalId ? Number(data.personalId) : null,
        fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento).toISOString() : null,
        observaciones: data.observaciones?.trim() || null
      };

      let resultado;
      if (detalle?.id) {
        // Actualizar detalle existente
        resultado = await actualizarDetalleAccesoInstalacion(detalle.id, datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de acceso actualizado correctamente'
        });
      } else {
        // Crear nuevo detalle
        resultado = await crearDetalleAccesoInstalacion(datosNormalizados);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Detalle de acceso creado correctamente'
        });
      }

      console.log('Detalle de acceso guardado:', resultado);
      
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }

    } catch (error) {
      console.error('Error al guardar detalle de acceso:', error);
      
      // Mostrar error específico del servidor o error genérico
      const mensajeError = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el detalle de acceso';
      
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
        
        {/* Acceso a Instalación */}
        <div className="field col-12 md:col-6">
          <label htmlFor="accesoInstalacionId" className="font-bold">
            Acceso a Instalación *
          </label>
          <Controller
            name="accesoInstalacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="accesoInstalacionId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={accesosInstalacion}
                optionLabel="codigo"
                optionValue="id"
                placeholder="Seleccione un acceso"
                className={errors.accesoInstalacionId ? 'p-invalid' : ''}
                filter
                showClear
              />
            )}
          />
          {errors.accesoInstalacionId && (
            <small className="p-error">{errors.accesoInstalacionId.message}</small>
          )}
        </div>

        {/* Tipo de Equipo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoEquipoId" className="font-bold">
            Tipo de Equipo
          </label>
          <Controller
            name="tipoEquipoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoEquipoId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={tiposEquipo}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione un tipo de equipo"
                className={errors.tipoEquipoId ? 'p-invalid' : ''}
                filter
                showClear
              />
            )}
          />
          {errors.tipoEquipoId && (
            <small className="p-error">{errors.tipoEquipoId.message}</small>
          )}
        </div>

        {/* Número de Equipo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="numeroEquipo" className="font-bold">
            Número de Equipo
          </label>
          <Controller
            name="numeroEquipo"
            control={control}
            render={({ field }) => (
              <InputText
                id="numeroEquipo"
                {...field}
                placeholder="Ingrese el número del equipo"
                className={errors.numeroEquipo ? 'p-invalid' : ''}
                maxLength={50}
              />
            )}
          />
          {errors.numeroEquipo && (
            <small className="p-error">{errors.numeroEquipo.message}</small>
          )}
        </div>

        {/* Tipo de Movimiento */}
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoMovimientoId" className="font-bold">
            Tipo de Movimiento
          </label>
          <Controller
            name="tipoMovimientoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoMovimientoId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={tiposMovimiento}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione un tipo de movimiento"
                className={errors.tipoMovimientoId ? 'p-invalid' : ''}
                filter
                showClear
              />
            )}
          />
          {errors.tipoMovimientoId && (
            <small className="p-error">{errors.tipoMovimientoId.message}</small>
          )}
        </div>

        {/* Personal */}
        <div className="field col-12 md:col-6">
          <label htmlFor="personalId" className="font-bold">
            Personal Responsable
          </label>
          <Controller
            name="personalId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personalId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={personal}
                optionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                optionValue="id"
                placeholder="Seleccione el personal responsable"
                className={errors.personalId ? 'p-invalid' : ''}
                filter
                showClear
              />
            )}
          />
          {errors.personalId && (
            <small className="p-error">{errors.personalId.message}</small>
          )}
        </div>

        {/* Fecha de Movimiento */}
        <div className="field col-12 md:col-6">
          <label htmlFor="fechaMovimiento" className="font-bold">
            Fecha de Movimiento
          </label>
          <Controller
            name="fechaMovimiento"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaMovimiento"
                {...field}
                placeholder="Seleccione fecha de movimiento"
                className={errors.fechaMovimiento ? 'p-invalid' : ''}
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
              />
            )}
          />
          {errors.fechaMovimiento && (
            <small className="p-error">{errors.fechaMovimiento.message}</small>
          )}
        </div>

        {/* Observaciones */}
        <div className="field col-12">
          <label htmlFor="observaciones" className="font-bold">
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                placeholder="Observaciones adicionales sobre el detalle de acceso..."
                className={errors.observaciones ? 'p-invalid' : ''}
                rows={4}
                maxLength={500}
              />
            )}
          />
          {errors.observaciones && (
            <small className="p-error">{errors.observaciones.message}</small>
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
              label={detalle?.id ? 'Actualizar' : 'Crear'}
              icon={detalle?.id ? 'pi pi-check' : 'pi pi-plus'}
              className="p-button-primary"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccesoInstalacionDetalleForm;
