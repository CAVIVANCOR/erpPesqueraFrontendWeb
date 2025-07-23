// src/components/accesoInstalacion/AccesoInstalacionForm.jsx
// Formulario profesional para AccesoInstalacion. Cumple estándar ERP Megui.
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { getPersonal } from '../../api/personal';

// Esquema de validación con Yup
const schema = yup.object().shape({
  personalId: yup.number().required('La persona es obligatoria').typeError('Debe seleccionar una persona'),
  tipoAccesoId: yup.number().nullable().typeError('Debe seleccionar un tipo de acceso'),
  fechaAcceso: yup.date().required('La fecha de acceso es obligatoria').typeError('Fecha inválida'),
  horaAcceso: yup.string().required('La hora de acceso es obligatoria'),
  motivoAccesoId: yup.number().nullable().typeError('Debe seleccionar un motivo'),
  observaciones: yup.string().max(500, 'Máximo 500 caracteres'),
  activo: yup.boolean().required()
});

/**
 * Formulario profesional para gestión de Accesos a Instalaciones.
 * Implementa validaciones con react-hook-form + Yup.
 * Cumple estándar ERP Megui: combos normalizados, validaciones, documentación.
 */
export default function AccesoInstalacionForm({ item, onSave, onCancel }) {
  const [personal, setPersonal] = useState([]);
  const [tiposAcceso, setTiposAcceso] = useState([]);
  const [motivosAcceso, setMotivosAcceso] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      personalId: null,
      tipoAccesoId: null,
      fechaAcceso: new Date(),
      horaAcceso: '',
      motivoAccesoId: null,
      observaciones: '',
      activo: true
    }
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (item) {
      // Cargar datos del item para edición
      setValue('personalId', item.personalId ? Number(item.personalId) : null);
      setValue('tipoAccesoId', item.tipoAccesoId ? Number(item.tipoAccesoId) : null);
      setValue('fechaAcceso', item.fechaAcceso ? new Date(item.fechaAcceso) : new Date());
      setValue('horaAcceso', item.horaAcceso || '');
      setValue('motivoAccesoId', item.motivoAccesoId ? Number(item.motivoAccesoId) : null);
      setValue('observaciones', item.observaciones || '');
      setValue('activo', item.activo !== undefined ? item.activo : true);
    } else {
      // Resetear formulario para nuevo registro
      reset({
        personalId: null,
        tipoAccesoId: null,
        fechaAcceso: new Date(),
        horaAcceso: '',
        motivoAccesoId: null,
        observaciones: '',
        activo: true
      });
    }
  }, [item, setValue, reset]);

  const cargarDatos = async () => {
    try {
      const personalData = await getPersonal();
      
      // Normalizar IDs a numéricos según regla ERP Megui
      setPersonal(personalData.map(p => ({ 
        ...p, 
        id: Number(p.id),
        nombreCompleto: `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`.trim()
      })));

      // Mock data para tipos de acceso y motivos (reemplazar con APIs reales)
      setTiposAcceso([
        { id: 1, descripcion: 'Ingreso' },
        { id: 2, descripcion: 'Salida' },
        { id: 3, descripcion: 'Visita' }
      ]);

      setMotivosAcceso([
        { id: 1, descripcion: 'Trabajo' },
        { id: 2, descripcion: 'Reunión' },
        { id: 3, descripcion: 'Mantenimiento' },
        { id: 4, descripcion: 'Visita técnica' }
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Normalizar datos antes de enviar
      const payload = {
        ...data,
        personalId: data.personalId ? Number(data.personalId) : null,
        tipoAccesoId: data.tipoAccesoId ? Number(data.tipoAccesoId) : null,
        motivoAccesoId: data.motivoAccesoId ? Number(data.motivoAccesoId) : null,
        fechaAcceso: data.fechaAcceso ? data.fechaAcceso.toISOString().split('T')[0] : null
      };
      
      await onSave(payload);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="formgrid grid">
        {/* Persona */}
        <div className="field col-12 md:col-6">
          <label htmlFor="personalId" className={classNames({ 'p-error': errors.personalId })}>
            Persona *
          </label>
          <Controller
            name="personalId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={personal}
                optionLabel="nombreCompleto"
                optionValue="id"
                placeholder="Seleccione una persona"
                filter
                showClear
                className={classNames({ 'p-invalid': errors.personalId })}
              />
            )}
          />
          {getFormErrorMessage('personalId')}
        </div>

        {/* Tipo de Acceso */}
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoAccesoId">Tipo de Acceso</label>
          <Controller
            name="tipoAccesoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={tiposAcceso}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione tipo de acceso"
                showClear
                className={classNames({ 'p-invalid': errors.tipoAccesoId })}
              />
            )}
          />
          {getFormErrorMessage('tipoAccesoId')}
        </div>

        {/* Fecha de Acceso */}
        <div className="field col-12 md:col-6">
          <label htmlFor="fechaAcceso" className={classNames({ 'p-error': errors.fechaAcceso })}>
            Fecha de Acceso *
          </label>
          <Controller
            name="fechaAcceso"
            control={control}
            render={({ field }) => (
              <Calendar
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                placeholder="Seleccione fecha"
                showIcon
                className={classNames({ 'p-invalid': errors.fechaAcceso })}
              />
            )}
          />
          {getFormErrorMessage('fechaAcceso')}
        </div>

        {/* Hora de Acceso */}
        <div className="field col-12 md:col-6">
          <label htmlFor="horaAcceso" className={classNames({ 'p-error': errors.horaAcceso })}>
            Hora de Acceso *
          </label>
          <Controller
            name="horaAcceso"
            control={control}
            render={({ field }) => (
              <InputText
                id={field.name}
                {...field}
                type="time"
                placeholder="HH:MM"
                className={classNames({ 'p-invalid': errors.horaAcceso })}
              />
            )}
          />
          {getFormErrorMessage('horaAcceso')}
        </div>

        {/* Motivo de Acceso */}
        <div className="field col-12 md:col-6">
          <label htmlFor="motivoAccesoId">Motivo de Acceso</label>
          <Controller
            name="motivoAccesoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={motivosAcceso}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione motivo"
                showClear
                className={classNames({ 'p-invalid': errors.motivoAccesoId })}
              />
            )}
          />
          {getFormErrorMessage('motivoAccesoId')}
        </div>

        {/* Estado Activo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="activo">Estado</label>
          <div className="flex align-items-center mt-2">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId={field.name}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                />
              )}
            />
            <label htmlFor="activo" className="ml-2">Activo</label>
          </div>
        </div>

        {/* Observaciones */}
        <div className="field col-12">
          <label htmlFor="observaciones">Observaciones</label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id={field.name}
                {...field}
                rows={3}
                placeholder="Ingrese observaciones adicionales"
                className={classNames({ 'p-invalid': errors.observaciones })}
                maxLength={500}
              />
            )}
          />
          {getFormErrorMessage('observaciones')}
        </div>
      </div>

      {/* Botones */}
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
          label={item ? "Actualizar" : "Crear"}
          icon={item ? "pi pi-check" : "pi pi-plus"}
          className="p-button-primary"
          loading={loading}
        />
      </div>
    </form>
  );
}
