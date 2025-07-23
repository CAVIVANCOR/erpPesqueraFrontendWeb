// src/components/entregaARendirPVentas/EntregaARendirPVentasForm.jsx
// Formulario profesional para EntregaARendirPVentas con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { crearEntregaARendirPVentas, actualizarEntregaARendirPVentas } from '../../api/entregaARendirPVentas';
import { getCotizacionesVentas } from '../../api/cotizacionVentas';
import { getPersonal } from '../../api/personal';
import { getCentrosCosto } from '../../api/centroCosto';

/**
 * Componente EntregaARendirPVentasForm
 * Formulario para gestión de entregas a rendir de ventas
 * Incluye validaciones y relaciones con cotizaciones según patrón ERP Megui
 */
const EntregaARendirPVentasForm = ({ entrega, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      cotizacionVentasId: null,
      respEntregaRendirId: null,
      entregaLiquidada: false,
      fechaLiquidacion: null,
      centroCostoId: null
    }
  });

  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const toast = useRef(null);

  // Observar el campo entregaLiquidada para mostrar/ocultar fecha liquidación
  const entregaLiquidada = watch('entregaLiquidada');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (entrega) {
      // Cargar datos de la entrega para edición
      reset({
        cotizacionVentasId: entrega.cotizacionVentasId ? Number(entrega.cotizacionVentasId) : null,
        respEntregaRendirId: entrega.respEntregaRendirId ? Number(entrega.respEntregaRendirId) : null,
        entregaLiquidada: Boolean(entrega.entregaLiquidada),
        fechaLiquidacion: entrega.fechaLiquidacion ? new Date(entrega.fechaLiquidacion) : null,
        centroCostoId: entrega.centroCostoId ? Number(entrega.centroCostoId) : null
      });
    }
  }, [entrega, reset]);

  const cargarDatos = async () => {
    try {
      const [
        cotizacionesData,
        responsablesData,
        centrosCostoData
      ] = await Promise.all([
        getCotizacionesVentas(),
        getPersonal(),
        getCentrosCosto()
      ]);

      // Normalizar IDs según regla ERP Megui
      setCotizaciones(cotizacionesData.map(c => ({
        ...c,
        id: Number(c.id),
        label: `${c.numeroDocumento} - ${c.cliente?.razonSocial || 'Sin cliente'}`,
        value: Number(c.id)
      })));

      setResponsables(responsablesData.map(r => ({
        ...r,
        id: Number(r.id),
        label: `${r.nombres} ${r.apellidos}`,
        value: Number(r.id)
      })));

      setCentrosCosto(centrosCostoData.map(cc => ({
        ...cc,
        id: Number(cc.id),
        label: cc.nombre,
        value: Number(cc.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validaciones de negocio
      if (data.entregaLiquidada && !data.fechaLiquidacion) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Debe especificar la fecha de liquidación si la entrega está liquidada'
        });
        return;
      }

      // Preparar payload con validaciones
      const payload = {
        cotizacionVentasId: Number(data.cotizacionVentasId),
        respEntregaRendirId: Number(data.respEntregaRendirId),
        entregaLiquidada: Boolean(data.entregaLiquidada),
        fechaLiquidacion: data.fechaLiquidacion ? data.fechaLiquidacion.toISOString() : null,
        centroCostoId: Number(data.centroCostoId)
      };

      console.log('Payload EntregaARendirPVentas:', payload);

      if (entrega?.id) {
        await actualizarEntregaARendirPVentas(entrega.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega a rendir actualizada correctamente'
        });
      } else {
        await crearEntregaARendirPVentas(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega a rendir creada correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar entrega a rendir:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar la entrega a rendir'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entrega-a-rendir-p-ventas-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="cotizacionVentasId" className="block text-900 font-medium mb-2">
              Cotización de Ventas *
            </label>
            <Controller
              name="cotizacionVentasId"
              control={control}
              rules={{ required: 'La cotización de ventas es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="cotizacionVentasId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={cotizaciones}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cotización de ventas"
                  className={`w-full ${errors.cotizacionVentasId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.cotizacionVentasId && (
              <small className="p-error">{errors.cotizacionVentasId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="respEntregaRendirId" className="block text-900 font-medium mb-2">
              Responsable de Entrega *
            </label>
            <Controller
              name="respEntregaRendirId"
              control={control}
              rules={{ required: 'El responsable de entrega es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="respEntregaRendirId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={responsables}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar responsable"
                  className={`w-full ${errors.respEntregaRendirId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.respEntregaRendirId && (
              <small className="p-error">{errors.respEntregaRendirId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: 'El centro de costo es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={centrosCosto}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar centro de costo"
                  className={`w-full ${errors.centroCostoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.centroCostoId && (
              <small className="p-error">{errors.centroCostoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <div className="field-checkbox mt-4">
              <Controller
                name="entregaLiquidada"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="entregaLiquidada"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="entregaLiquidada" className="ml-2 text-900 font-medium">
                Entrega Liquidada
              </label>
            </div>
          </div>

          {entregaLiquidada && (
            <div className="col-12 md:col-6">
              <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
                Fecha de Liquidación *
              </label>
              <Controller
                name="fechaLiquidacion"
                control={control}
                rules={{ 
                  required: entregaLiquidada ? 'La fecha de liquidación es obligatoria' : false 
                }}
                render={({ field }) => (
                  <Calendar
                    id="fechaLiquidacion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar fecha de liquidación"
                    className={`w-full ${errors.fechaLiquidacion ? 'p-invalid' : ''}`}
                    dateFormat="dd/mm/yy"
                    showIcon
                    maxDate={new Date()}
                  />
                )}
              />
              {errors.fechaLiquidacion && (
                <small className="p-error">{errors.fechaLiquidacion.message}</small>
              )}
            </div>
          )}
        </div>

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
            label={entrega?.id ? 'Actualizar' : 'Crear'}
            icon={entrega?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default EntregaARendirPVentasForm;
