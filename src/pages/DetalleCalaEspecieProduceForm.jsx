// src/pages/DetalleCalaEspecieProduceForm.jsx
// Formulario profesional para DetalleCalaEspecieProduce - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { createDetalleCalaEspecieProduce, updateDetalleCalaEspecieProduce } from '../api/detalleCalaEspecieProduce';
import { getAllCalaProduce } from '../api/calaProduce';
import { getEspecies } from '../api/especie';
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Formulario DetalleCalaEspecieProduceForm
 * 
 * Formulario profesional para gestión de detalles de especies en calas de producción.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos decimales para toneladas y porcentajes
 * - Validaciones de rangos para porcentajes (0-100%)
 * - Manejo de observaciones opcionales
 */
export default function DetalleCalaEspecieProduceForm({ detalle, onGuardadoExitoso, onCancelar }) {
  // Estados para combos
  const [calas, setCalas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      calaProduceId: null,
      especieId: null,
      toneladas: null,
      porcentajeJuveniles: null,
      observaciones: ''
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Cargar datos del registro a editar
  useEffect(() => {
    if (detalle) {
      cargarDatosDetalle();
    }
  }, [detalle]);

  /**
   * Carga todos los datos necesarios para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      const [calasData, especiesData] = await Promise.all([
        getAllCalaProduce(),
        getEspecies()
      ]);

      setCalas(calasData?.map(item => ({
        label: `Cala ${item.id} - ${new Date(item.fechaHoraInicio).toLocaleDateString()}`,
        value: Number(item.id)
      })) || []);

      setEspecies(especiesData?.map(item => ({
        label: item.nombre,
        value: Number(item.id)
      })) || []);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  /**
   * Carga los datos del detalle a editar en el formulario
   */
  const cargarDatosDetalle = () => {
    reset({
      calaProduceId: detalle.calaProduceId ? Number(detalle.calaProduceId) : null,
      especieId: detalle.especieId ? Number(detalle.especieId) : null,
      toneladas: detalle.toneladas ? Number(detalle.toneladas) : null,
      porcentajeJuveniles: detalle.porcentajeJuveniles ? Number(detalle.porcentajeJuveniles) : null,
      observaciones: detalle.observaciones || ''
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        calaProduceId: data.calaProduceId,
        especieId: data.especieId,
        toneladas: data.toneladas,
        porcentajeJuveniles: data.porcentajeJuveniles,
        observaciones: data.observaciones || null
      };

      if (detalle?.id) {
        await updateDetalleCalaEspecieProduce(detalle.id, payload);
      } else {
        await createDetalleCalaEspecieProduce(payload);
      }

      onGuardadoExitoso();
    } catch (error) {
      console.error('Error al guardar detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el mensaje de error para un campo
   */
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Cala de Producción */}
        <div className="col-12">
          <label htmlFor="calaProduceId" className="block text-900 font-medium mb-2">
            Cala de Producción *
          </label>
          <Controller
            name="calaProduceId"
            control={control}
            rules={{ required: 'La cala de producción es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="calaProduceId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={calas}
                placeholder="Seleccione una cala de producción"
                className={classNames({ 'p-invalid': errors.calaProduceId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('calaProduceId')}
        </div>

        {/* Especie */}
        <div className="col-12">
          <label htmlFor="especieId" className="block text-900 font-medium mb-2">
            Especie *
          </label>
          <Controller
            name="especieId"
            control={control}
            rules={{ required: 'La especie es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="especieId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={especies}
                placeholder="Seleccione una especie"
                className={classNames({ 'p-invalid': errors.especieId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('especieId')}
        </div>

        {/* Toneladas */}
        <div className="col-12 md:col-6">
          <label htmlFor="toneladas" className="block text-900 font-medium mb-2">
            Toneladas Capturadas
          </label>
          <Controller
            name="toneladas"
            control={control}
            rules={{
              min: { value: 0, message: 'Las toneladas no pueden ser negativas' }
            }}
            render={({ field }) => (
              <InputNumber
                id="toneladas"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="Ej: 15.75"
                className={classNames({ 'p-invalid': errors.toneladas })}
              />
            )}
          />
          {getFormErrorMessage('toneladas')}
        </div>

        {/* Porcentaje de Juveniles */}
        <div className="col-12 md:col-6">
          <label htmlFor="porcentajeJuveniles" className="block text-900 font-medium mb-2">
            Porcentaje de Juveniles (%)
          </label>
          <Controller
            name="porcentajeJuveniles"
            control={control}
            rules={{
              min: { value: 0, message: 'El porcentaje no puede ser menor a 0%' },
              max: { value: 100, message: 'El porcentaje no puede ser mayor a 100%' }
            }}
            render={({ field }) => (
              <InputNumber
                id="porcentajeJuveniles"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                suffix="%"
                placeholder="Ej: 25.50"
                className={classNames({ 'p-invalid': errors.porcentajeJuveniles })}
              />
            )}
          />
          {getFormErrorMessage('porcentajeJuveniles')}
        </div>

        {/* Observaciones */}
        <div className="col-12">
          <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                value={field.value || ''}
                onChange={field.onChange}
                rows={3}
                placeholder="Observaciones adicionales sobre la captura de esta especie..."
              />
            )}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          type="submit"
          label={detalle?.id ? 'Actualizar' : 'Guardar'}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
}
