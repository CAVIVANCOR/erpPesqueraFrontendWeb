// src/pages/DetalleDocTripulantesForm.jsx
// Formulario profesional para DetalleDocTripulantes - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';

import { crearDetalleDocTripulantes, actualizarDetalleDocTripulantes } from '../../api/detalleDocTripulantes';
import { getFaenasPesca } from '../../api/faenaPesca';
import { getPersonal } from '../../api/personal';
import { getTiposDocumento } from '../../api/tipoDocumento';
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Formulario DetalleDocTripulantesForm
 * 
 * Formulario profesional para gestión de documentos de tripulantes.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Upload de documentos PDF
 * - Estado de verificación
 * - Validaciones de fechas (vencimiento > emisión)
 */
export default function DetalleDocTripulantesForm({ detalle, onGuardadoExitoso, onCancelar }) {
  // Estados para combos
  const [faenas, setFaenas] = useState([]);
  const [tripulantes, setTripulantes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
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
      tripulanteId: null,
      documentoId: null,
      numeroDocumento: '',
      fechaEmision: null,
      fechaVencimiento: null,
      urlDocTripulantePdf: '',
      observaciones: '',
      verificado: false
    }
  });

  // Observar fechas para validaciones
  const fechaEmision = watch('fechaEmision');

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
      const [faenasData, tripulantesData, documentosData] = await Promise.all([
        getFaenasPesca(),
        getPersonal(),
        getTiposDocumento()
      ]);

      setFaenas(faenasData?.map(item => ({
        label: item.codigo || `Faena ${item.id}`,
        value: Number(item.id)
      })) || []);

      setTripulantes(tripulantesData?.map(item => ({
        label: `${item.nombres} ${item.apellidos}`,
        value: Number(item.id)
      })) || []);

      setDocumentos(documentosData?.map(item => ({
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
      faenaPescaId: detalle.faenaPescaId ? Number(detalle.faenaPescaId) : null,
      tripulanteId: detalle.tripulanteId ? Number(detalle.tripulanteId) : null,
      documentoId: detalle.documentoId ? Number(detalle.documentoId) : null,
      numeroDocumento: detalle.numeroDocumento || '',
      fechaEmision: detalle.fechaEmision ? new Date(detalle.fechaEmision) : null,
      fechaVencimiento: detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null,
      urlDocTripulantePdf: detalle.urlDocTripulantePdf || '',
      observaciones: detalle.observaciones || '',
      verificado: detalle.verificado || false
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
        tripulanteId: data.tripulanteId,
        documentoId: data.documentoId,
        numeroDocumento: data.numeroDocumento || null,
        fechaEmision: data.fechaEmision?.toISOString(),
        fechaVencimiento: data.fechaVencimiento?.toISOString(),
        urlDocTripulantePdf: data.urlDocTripulantePdf || null,
        observaciones: data.observaciones || null,
        verificado: data.verificado
      };

      if (detalle?.id) {
        await actualizarDetalleDocTripulantes(detalle.id, payload);
      } else {
        await crearDetalleDocTripulantes(payload);
      }

      onGuardadoExitoso();
    } catch (error) {
      console.error('Error al guardar documento:', error);
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

        {/* Tripulante */}
        <div className="col-12 md:col-6">
          <label htmlFor="tripulanteId" className="block text-900 font-medium mb-2">
            Tripulante
          </label>
          <Controller
            name="tripulanteId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tripulanteId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={tripulantes}
                placeholder="Seleccione un tripulante"
                filter
                showClear
              />
            )}
          />
        </div>

        {/* Tipo de Documento */}
        <div className="col-12 md:col-6">
          <label htmlFor="documentoId" className="block text-900 font-medium mb-2">
            Tipo de Documento
          </label>
          <Controller
            name="documentoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="documentoId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={documentos}
                placeholder="Seleccione tipo de documento"
                filter
                showClear
              />
            )}
          />
        </div>

        {/* Número de Documento */}
        <div className="col-12 md:col-6">
          <label htmlFor="numeroDocumento" className="block text-900 font-medium mb-2">
            Número de Documento
          </label>
          <Controller
            name="numeroDocumento"
            control={control}
            render={({ field }) => (
              <InputText
                id="numeroDocumento"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Ej: DOC-2024-001"
              />
            )}
          />
        </div>

        {/* Fecha de Emisión */}
        <div className="col-12 md:col-6">
          <label htmlFor="fechaEmision" className="block text-900 font-medium mb-2">
            Fecha de Emisión
          </label>
          <Controller
            name="fechaEmision"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaEmision"
                value={field.value}
                onChange={field.onChange}
                placeholder="dd/mm/aaaa"
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
        </div>

        {/* Fecha de Vencimiento */}
        <div className="col-12 md:col-6">
          <label htmlFor="fechaVencimiento" className="block text-900 font-medium mb-2">
            Fecha de Vencimiento
          </label>
          <Controller
            name="fechaVencimiento"
            control={control}
            rules={{
              validate: (value) => {
                if (value && fechaEmision && value <= fechaEmision) {
                  return 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
                }
                return true;
              }
            }}
            render={({ field }) => (
              <Calendar
                id="fechaVencimiento"
                value={field.value}
                onChange={field.onChange}
                placeholder="dd/mm/aaaa"
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ 'p-invalid': errors.fechaVencimiento })}
              />
            )}
          />
          {getFormErrorMessage('fechaVencimiento')}
        </div>

        {/* URL del Documento PDF */}
        <div className="col-12">
          <label htmlFor="urlDocTripulantePdf" className="block text-900 font-medium mb-2">
            URL del Documento PDF
          </label>
          <Controller
            name="urlDocTripulantePdf"
            control={control}
            render={({ field }) => (
              <InputText
                id="urlDocTripulantePdf"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="https://ejemplo.com/documento.pdf"
              />
            )}
          />
        </div>

        {/* Estado Verificado */}
        <div className="col-12">
          <div className="field-checkbox">
            <Controller
              name="verificado"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId="verificado"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                />
              )}
            />
            <label htmlFor="verificado" className="ml-2">
              Documento verificado
            </label>
          </div>
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
                placeholder="Observaciones adicionales sobre el documento..."
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
