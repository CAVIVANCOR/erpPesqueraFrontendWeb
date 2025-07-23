// src/pages/TripulanteFaenaForm.jsx
// Formulario profesional para TripulanteFaena - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import { createTripulanteFaena, updateTripulanteFaena } from '../../api/tripulanteFaena';
import { getFaenasPesca } from '../../api/faenaPesca';
import { getPersonal } from '../../api/personal';
import { getCargosPersonal } from '../../api/cargosPersonal';

/**
 * Formulario TripulanteFaenaForm
 * 
 * Formulario profesional para gestión de tripulantes en faenas.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos opcionales para nombres/apellidos manuales
 * - Relación con personal existente o datos manuales
 * - Asignación de cargos específicos
 */
export default function TripulanteFaenaForm({ tripulante, onGuardadoExitoso, onCancelar }) {
  // Estados para combos
  const [faenas, setFaenas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      faenaPescaId: null,
      personalId: null,
      cargoId: null,
      nombres: '',
      apellidos: '',
      observaciones: ''
    }
  });

  // Observar personalId para lógica condicional
  const personalId = watch('personalId');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Cargar datos del registro a editar
  useEffect(() => {
    if (tripulante) {
      cargarDatosTripulante();
    }
  }, [tripulante]);

  /**
   * Carga todos los datos necesarios para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      const [faenasData, personalData, cargosData] = await Promise.all([
        faenaPescaService.getAll(),
        personalService.getAll(),
        cargosPersonalService.getAll()
      ]);

      setFaenas(faenasData?.map(item => ({
        label: item.codigo || `Faena ${item.id}`,
        value: Number(item.id)
      })) || []);

      setPersonal(personalData?.map(item => ({
        label: `${item.nombres} ${item.apellidos}`,
        value: Number(item.id)
      })) || []);

      setCargos(cargosData?.map(item => ({
        label: item.nombre,
        value: Number(item.id)
      })) || []);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  /**
   * Carga los datos del tripulante a editar en el formulario
   */
  const cargarDatosTripulante = () => {
    reset({
      faenaPescaId: tripulante.faenaPescaId ? Number(tripulante.faenaPescaId) : null,
      personalId: tripulante.personalId ? Number(tripulante.personalId) : null,
      cargoId: tripulante.cargoId ? Number(tripulante.cargoId) : null,
      nombres: tripulante.nombres || '',
      apellidos: tripulante.apellidos || '',
      observaciones: tripulante.observaciones || ''
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        faenaPescaId: data.faenaPescaId,
        personalId: data.personalId,
        cargoId: data.cargoId,
        nombres: data.nombres || null,
        apellidos: data.apellidos || null,
        observaciones: data.observaciones || null
      };

      if (tripulante?.id) {
        await updateTripulanteFaena(tripulante.id, payload);
      } else {
        await createTripulanteFaena(payload);
      }

      onGuardadoExitoso();
    } catch (error) {
      console.error('Error al guardar tripulante:', error);
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
        {/* Faena de Pesca */}
        <div className="col-12">
          <label htmlFor="faenaPescaId" className="block text-900 font-medium mb-2">
            Faena de Pesca *
          </label>
          <Controller
            name="faenaPescaId"
            control={control}
            rules={{ required: 'La faena de pesca es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="faenaPescaId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={faenas}
                placeholder="Seleccione una faena"
                className={classNames({ 'p-invalid': errors.faenaPescaId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('faenaPescaId')}
        </div>

        {/* Personal (Opcional) */}
        <div className="col-12">
          <label htmlFor="personalId" className="block text-900 font-medium mb-2">
            Personal Registrado
          </label>
          <Controller
            name="personalId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personalId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={personal}
                placeholder="Seleccione personal registrado (opcional)"
                filter
                showClear
              />
            )}
          />
          <small className="text-500">
            Si no selecciona personal registrado, puede ingresar los datos manualmente abajo
          </small>
        </div>

        {/* Cargo */}
        <div className="col-12">
          <label htmlFor="cargoId" className="block text-900 font-medium mb-2">
            Cargo
          </label>
          <Controller
            name="cargoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="cargoId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={cargos}
                placeholder="Seleccione un cargo"
                filter
                showClear
              />
            )}
          />
        </div>

        {/* Nombres (Manual) */}
        <div className="col-12 md:col-6">
          <label htmlFor="nombres" className="block text-900 font-medium mb-2">
            Nombres {!personalId && '*'}
          </label>
          <Controller
            name="nombres"
            control={control}
            rules={!personalId ? { required: 'Los nombres son obligatorios si no selecciona personal' } : {}}
            render={({ field }) => (
              <InputText
                id="nombres"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Nombres del tripulante"
                className={classNames({ 'p-invalid': errors.nombres })}
                disabled={!!personalId}
              />
            )}
          />
          {getFormErrorMessage('nombres')}
          {personalId && (
            <small className="text-500">
              Se usarán los nombres del personal seleccionado
            </small>
          )}
        </div>

        {/* Apellidos (Manual) */}
        <div className="col-12 md:col-6">
          <label htmlFor="apellidos" className="block text-900 font-medium mb-2">
            Apellidos {!personalId && '*'}
          </label>
          <Controller
            name="apellidos"
            control={control}
            rules={!personalId ? { required: 'Los apellidos son obligatorios si no selecciona personal' } : {}}
            render={({ field }) => (
              <InputText
                id="apellidos"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Apellidos del tripulante"
                className={classNames({ 'p-invalid': errors.apellidos })}
                disabled={!!personalId}
              />
            )}
          />
          {getFormErrorMessage('apellidos')}
          {personalId && (
            <small className="text-500">
              Se usarán los apellidos del personal seleccionado
            </small>
          )}
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
                placeholder="Observaciones adicionales sobre el tripulante en esta faena..."
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
          label={tripulante?.id ? 'Actualizar' : 'Guardar'}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
}
