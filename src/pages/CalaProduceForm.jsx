// src/pages/CalaProduceForm.jsx
// Formulario profesional para CalaProduce - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { classNames } from 'primereact/utils';

import { createCalaProduce, updateCalaProduce } from '../api/calaProduce';
import { getBahias } from '../api/bahia';
import { getPersonal } from '../api/personal';
import { getEmbarcaciones } from '../api/embarcacion';
import { getFaenasPesca } from '../api/faenaPesca';
import { getTemporadasPesca } from '../api/temporadaPesca';
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Formulario CalaProduceForm
 * 
 * Formulario profesional para gestión de calas de producción.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos dependientes normalizados (IDs numéricos)
 * - Upload de archivos PDF para informes
 * - Manejo de coordenadas geográficas
 * - Fechas y horas precisas
 * - Campos decimales para mediciones
 */
export default function CalaProduceForm({ cala, onGuardadoExitoso, onCancelar }) {
  // Estados para combos
  const [bahias, setBahias] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [patrones, setPatrones] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      bahiaId: null,
      motoristaId: null,
      patronId: null,
      embarcacionId: null,
      faenaPescaId: null,
      temporadaPescaId: null,
      fechaHoraInicio: null,
      fechaHoraFin: null,
      latitud: null,
      longitud: null,
      profundidadM: null,
      toneladasCapturadas: null,
      observaciones: '',
      urlInformeCalaProduce: ''
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Cargar datos del registro a editar
  useEffect(() => {
    if (cala) {
      cargarDatosCala();
    }
  }, [cala]);

  /**
   * Carga todos los datos necesarios para los combos
   */
  const cargarDatosIniciales = async () => {
    try {
      const [
        bahiasData,
        motoristasData,
        patronesData,
        embarcacionesData,
        faenasData,
        temporadasData
      ] = await Promise.all([
        getBahias(),
        getPersonal(),
        getPersonal(),
        getEmbarcaciones(),
        getFaenasPesca(),
        getTemporadasPesca()
      ]);

      setBahias(bahiasData?.map(item => ({
        label: item.nombre,
        value: Number(item.id)
      })) || []);

      setMotoristas(motoristasData?.map(item => ({
        label: `${item.nombres} ${item.apellidos}`,
        value: Number(item.id)
      })) || []);

      setPatrones(patronesData?.map(item => ({
        label: `${item.nombres} ${item.apellidos}`,
        value: Number(item.id)
      })) || []);

      setEmbarcaciones(embarcacionesData?.map(item => ({
        label: item.nombre || `Embarcación ${item.id}`,
        value: Number(item.id)
      })) || []);

      setFaenas(faenasData?.map(item => ({
        label: item.codigo || `Faena ${item.id}`,
        value: Number(item.id)
      })) || []);

      setTemporadas(temporadasData?.map(item => ({
        label: `${item.nombre} (${item.anio})`,
        value: Number(item.id)
      })) || []);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  /**
   * Carga los datos de la cala a editar en el formulario
   */
  const cargarDatosCala = () => {
    reset({
      bahiaId: cala.bahiaId ? Number(cala.bahiaId) : null,
      motoristaId: cala.motoristaId ? Number(cala.motoristaId) : null,
      patronId: cala.patronId ? Number(cala.patronId) : null,
      embarcacionId: cala.embarcacionId ? Number(cala.embarcacionId) : null,
      faenaPescaId: cala.faenaPescaId ? Number(cala.faenaPescaId) : null,
      temporadaPescaId: cala.temporadaPescaId ? Number(cala.temporadaPescaId) : null,
      fechaHoraInicio: cala.fechaHoraInicio ? new Date(cala.fechaHoraInicio) : null,
      fechaHoraFin: cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null,
      latitud: cala.latitud ? Number(cala.latitud) : null,
      longitud: cala.longitud ? Number(cala.longitud) : null,
      profundidadM: cala.profundidadM ? Number(cala.profundidadM) : null,
      toneladasCapturadas: cala.toneladasCapturadas ? Number(cala.toneladasCapturadas) : null,
      observaciones: cala.observaciones || '',
      urlInformeCalaProduce: cala.urlInformeCalaProduce || ''
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        bahiaId: data.bahiaId,
        motoristaId: data.motoristaId,
        patronId: data.patronId,
        embarcacionId: data.embarcacionId,
        faenaPescaId: data.faenaPescaId,
        temporadaPescaId: data.temporadaPescaId,
        fechaHoraInicio: data.fechaHoraInicio?.toISOString(),
        fechaHoraFin: data.fechaHoraFin?.toISOString(),
        latitud: data.latitud,
        longitud: data.longitud,
        profundidadM: data.profundidadM,
        toneladasCapturadas: data.toneladasCapturadas,
        observaciones: data.observaciones || null,
        urlInformeCalaProduce: data.urlInformeCalaProduce || null
      };

      if (cala?.id) {
        await updateCalaProduce(cala.id, payload);
      } else {
        await createCalaProduce(payload);
      }

      onGuardadoExitoso();
    } catch (error) {
      console.error('Error al guardar cala:', error);
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
        {/* Bahía */}
        <div className="col-12 md:col-6">
          <label htmlFor="bahiaId" className="block text-900 font-medium mb-2">
            Bahía *
          </label>
          <Controller
            name="bahiaId"
            control={control}
            rules={{ required: 'La bahía es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="bahiaId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={bahias}
                placeholder="Seleccione una bahía"
                className={classNames({ 'p-invalid': errors.bahiaId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('bahiaId')}
        </div>

        {/* Motorista */}
        <div className="col-12 md:col-6">
          <label htmlFor="motoristaId" className="block text-900 font-medium mb-2">
            Motorista *
          </label>
          <Controller
            name="motoristaId"
            control={control}
            rules={{ required: 'El motorista es obligatorio' }}
            render={({ field }) => (
              <Dropdown
                id="motoristaId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={motoristas}
                placeholder="Seleccione un motorista"
                className={classNames({ 'p-invalid': errors.motoristaId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('motoristaId')}
        </div>

        {/* Patrón */}
        <div className="col-12 md:col-6">
          <label htmlFor="patronId" className="block text-900 font-medium mb-2">
            Patrón *
          </label>
          <Controller
            name="patronId"
            control={control}
            rules={{ required: 'El patrón es obligatorio' }}
            render={({ field }) => (
              <Dropdown
                id="patronId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={patrones}
                placeholder="Seleccione un patrón"
                className={classNames({ 'p-invalid': errors.patronId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('patronId')}
        </div>

        {/* Embarcación */}
        <div className="col-12 md:col-6">
          <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
            Embarcación *
          </label>
          <Controller
            name="embarcacionId"
            control={control}
            rules={{ required: 'La embarcación es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="embarcacionId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={embarcaciones}
                placeholder="Seleccione una embarcación"
                className={classNames({ 'p-invalid': errors.embarcacionId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('embarcacionId')}
        </div>

        {/* Faena de Pesca */}
        <div className="col-12 md:col-6">
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

        {/* Temporada de Pesca */}
        <div className="col-12 md:col-6">
          <label htmlFor="temporadaPescaId" className="block text-900 font-medium mb-2">
            Temporada de Pesca *
          </label>
          <Controller
            name="temporadaPescaId"
            control={control}
            rules={{ required: 'La temporada de pesca es obligatoria' }}
            render={({ field }) => (
              <Dropdown
                id="temporadaPescaId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={temporadas}
                placeholder="Seleccione una temporada"
                className={classNames({ 'p-invalid': errors.temporadaPescaId })}
                filter
                showClear
              />
            )}
          />
          {getFormErrorMessage('temporadaPescaId')}
        </div>

        {/* Fecha y Hora Inicio */}
        <div className="col-12 md:col-6">
          <label htmlFor="fechaHoraInicio" className="block text-900 font-medium mb-2">
            Fecha y Hora Inicio *
          </label>
          <Controller
            name="fechaHoraInicio"
            control={control}
            rules={{ required: 'La fecha y hora de inicio es obligatoria' }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraInicio"
                value={field.value}
                onChange={field.onChange}
                showTime
                hourFormat="24"
                placeholder="dd/mm/aaaa hh:mm"
                className={classNames({ 'p-invalid': errors.fechaHoraInicio })}
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
          {getFormErrorMessage('fechaHoraInicio')}
        </div>

        {/* Fecha y Hora Fin */}
        <div className="col-12 md:col-6">
          <label htmlFor="fechaHoraFin" className="block text-900 font-medium mb-2">
            Fecha y Hora Fin *
          </label>
          <Controller
            name="fechaHoraFin"
            control={control}
            rules={{ required: 'La fecha y hora de fin es obligatoria' }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraFin"
                value={field.value}
                onChange={field.onChange}
                showTime
                hourFormat="24"
                placeholder="dd/mm/aaaa hh:mm"
                className={classNames({ 'p-invalid': errors.fechaHoraFin })}
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
          {getFormErrorMessage('fechaHoraFin')}
        </div>

        {/* Latitud */}
        <div className="col-12 md:col-4">
          <label htmlFor="latitud" className="block text-900 font-medium mb-2">
            Latitud
          </label>
          <Controller
            name="latitud"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="latitud"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={6}
                maxFractionDigits={6}
                placeholder="Ej: -12.123456"
              />
            )}
          />
        </div>

        {/* Longitud */}
        <div className="col-12 md:col-4">
          <label htmlFor="longitud" className="block text-900 font-medium mb-2">
            Longitud
          </label>
          <Controller
            name="longitud"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="longitud"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={6}
                maxFractionDigits={6}
                placeholder="Ej: -77.123456"
              />
            )}
          />
        </div>

        {/* Profundidad */}
        <div className="col-12 md:col-4">
          <label htmlFor="profundidadM" className="block text-900 font-medium mb-2">
            Profundidad (m)
          </label>
          <Controller
            name="profundidadM"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="profundidadM"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="Ej: 150.50"
              />
            )}
          />
        </div>

        {/* Toneladas Capturadas */}
        <div className="col-12 md:col-6">
          <label htmlFor="toneladasCapturadas" className="block text-900 font-medium mb-2">
            Toneladas Capturadas
          </label>
          <Controller
            name="toneladasCapturadas"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="toneladasCapturadas"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="Ej: 25.75"
              />
            )}
          />
        </div>

        {/* URL Informe */}
        <div className="col-12 md:col-6">
          <label htmlFor="urlInformeCalaProduce" className="block text-900 font-medium mb-2">
            URL Informe PDF
          </label>
          <Controller
            name="urlInformeCalaProduce"
            control={control}
            render={({ field }) => (
              <InputText
                id="urlInformeCalaProduce"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="https://ejemplo.com/informe.pdf"
              />
            )}
          />
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
                placeholder="Observaciones adicionales sobre la cala..."
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
          label={cala?.id ? 'Actualizar' : 'Guardar'}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
}
