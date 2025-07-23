/**
 * Formulario para gestión de Entregas a Rendir de Compras
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con cotizaciones, personal y centros de costo
 * - Gestión de estados (pendiente/liquidada)
 * - Control de fechas de liquidación
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

/**
 * Componente de formulario para entregas a rendir de compras
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const EntregaARendirPComprasForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  cotizaciones = [],
  personal = [],
  centrosCosto = []
}) => {
  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      cotizacionComprasId: null,
      respEntregaRendirId: null,
      centroCostoId: null,
      entregaLiquidada: false,
      fechaLiquidacion: null
    }
  });

  // Observar cambios en el estado de liquidación
  const entregaLiquidada = watch('entregaLiquidada');

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        cotizacionComprasId: Number(editingItem.cotizacionComprasId),
        respEntregaRendirId: Number(editingItem.respEntregaRendirId),
        centroCostoId: Number(editingItem.centroCostoId),
        entregaLiquidada: Boolean(editingItem.entregaLiquidada),
        fechaLiquidacion: editingItem.fechaLiquidacion ? new Date(editingItem.fechaLiquidacion) : null
      });
    } else {
      reset({
        cotizacionComprasId: null,
        respEntregaRendirId: null,
        centroCostoId: null,
        entregaLiquidada: false,
        fechaLiquidacion: null
      });
    }
  }, [editingItem, reset]);

  /**
   * Efecto para manejar la fecha de liquidación automáticamente
   */
  useEffect(() => {
    if (entregaLiquidada && !watch('fechaLiquidacion')) {
      // Si se marca como liquidada y no tiene fecha, asignar fecha actual
      setValue('fechaLiquidacion', new Date());
    } else if (!entregaLiquidada) {
      // Si se desmarca como liquidada, limpiar fecha
      setValue('fechaLiquidacion', null);
    }
  }, [entregaLiquidada, setValue, watch]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      cotizacionComprasId: Number(data.cotizacionComprasId),
      respEntregaRendirId: Number(data.respEntregaRendirId),
      centroCostoId: Number(data.centroCostoId),
      entregaLiquidada: Boolean(data.entregaLiquidada),
      fechaLiquidacion: data.fechaLiquidacion ? data.fechaLiquidacion.toISOString() : null
    };

    onSave(formData);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    reset();
    onHide();
  };

  /**
   * Preparar opciones de cotizaciones para el dropdown
   */
  const cotizacionesOptions = cotizaciones.map(cotizacion => ({
    label: `${cotizacion.numeroReferencia || 'Sin referencia'} - ${cotizacion.empresa?.nombre || 'Sin empresa'}`,
    value: Number(cotizacion.id)
  }));

  /**
   * Preparar opciones de personal para el dropdown
   */
  const personalOptions = personal.map(persona => ({
    label: `${persona.nombres} ${persona.apellidos} - ${persona.numeroDocumento || 'Sin documento'}`,
    value: Number(persona.id)
  }));

  /**
   * Preparar opciones de centros de costo para el dropdown
   */
  const centrosCostoOptions = centrosCosto.map(centroCosto => ({
    label: `${centroCosto.nombre} - ${centroCosto.codigo || 'Sin código'}`,
    value: Number(centroCosto.id)
  }));

  /**
   * Footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={handleHide}
      />
      <Button
        label={editingItem ? "Actualizar" : "Crear"}
        icon="pi pi-check"
        onClick={handleSubmit(onSubmit)}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '700px' }}
      header={editingItem ? "Editar Entrega a Rendir" : "Nueva Entrega a Rendir"}
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Cotización de Compras */}
          <div className="col-12">
            <label htmlFor="cotizacionComprasId" className="font-semibold">
              Cotización de Compras *
            </label>
            <Controller
              name="cotizacionComprasId"
              control={control}
              rules={{ required: 'La cotización de compras es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="cotizacionComprasId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={cotizacionesOptions}
                  placeholder="Seleccione una cotización"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.cotizacionComprasId })}
                />
              )}
            />
            {errors.cotizacionComprasId && (
              <Message severity="error" text={errors.cotizacionComprasId.message} />
            )}
          </div>

          {/* Responsable de Entrega */}
          <div className="col-12">
            <label htmlFor="respEntregaRendirId" className="font-semibold">
              Responsable de Entrega *
            </label>
            <Controller
              name="respEntregaRendirId"
              control={control}
              rules={{ required: 'El responsable de entrega es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="respEntregaRendirId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={personalOptions}
                  placeholder="Seleccione un responsable"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.respEntregaRendirId })}
                />
              )}
            />
            {errors.respEntregaRendirId && (
              <Message severity="error" text={errors.respEntregaRendirId.message} />
            )}
          </div>

          {/* Centro de Costo */}
          <div className="col-12">
            <label htmlFor="centroCostoId" className="font-semibold">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: 'El centro de costo es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={centrosCostoOptions}
                  placeholder="Seleccione un centro de costo"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.centroCostoId })}
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          {/* Estado de Liquidación */}
          <div className="col-12">
            <div className="field-checkbox">
              <Controller
                name="entregaLiquidada"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="entregaLiquidada"
                    {...field}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="entregaLiquidada" className="font-semibold ml-2">
                Entrega Liquidada
              </label>
            </div>
            <small className="text-muted">
              Marque esta casilla si la entrega ya ha sido liquidada
            </small>
          </div>

          {/* Fecha de Liquidación */}
          {entregaLiquidada && (
            <div className="col-12">
              <label htmlFor="fechaLiquidacion" className="font-semibold">
                Fecha de Liquidación *
              </label>
              <Controller
                name="fechaLiquidacion"
                control={control}
                rules={{ 
                  required: entregaLiquidada ? 'La fecha de liquidación es obligatoria cuando está liquidada' : false,
                  validate: (value) => {
                    if (entregaLiquidada && value && value > new Date()) {
                      return 'La fecha de liquidación no puede ser futura';
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <Calendar
                    id="fechaLiquidacion"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha y hora"
                    maxDate={new Date()}
                    className={classNames({ 'p-invalid': errors.fechaLiquidacion })}
                  />
                )}
              />
              {errors.fechaLiquidacion && (
                <Message severity="error" text={errors.fechaLiquidacion.message} />
              )}
              <small className="text-muted">
                La fecha se asigna automáticamente al marcar como liquidada
              </small>
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
};

export default EntregaARendirPComprasForm;
