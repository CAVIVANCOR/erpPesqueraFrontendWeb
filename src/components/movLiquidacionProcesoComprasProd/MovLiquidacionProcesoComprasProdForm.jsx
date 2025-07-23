/**
 * Formulario para gestión de Movimientos de Liquidación de Proceso de Compras de Producción
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con liquidaciones, tipos de movimiento y centros de costo
 * - Gestión de montos con formato de moneda
 * - Control de fechas de movimiento y registro
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
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

/**
 * Componente de formulario para movimientos de liquidación de proceso de compras de producción
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const MovLiquidacionProcesoComprasProdForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  liquidaciones = [],
  tiposMovimiento = [],
  centrosCosto = []
}) => {
  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      liquidacionProcesoComprasProdId: null,
      tipoMovimientoId: null,
      monto: 0,
      centroCostoId: null,
      fechaMovimiento: new Date(),
      fechaRegistro: new Date()
    }
  });

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        liquidacionProcesoComprasProdId: Number(editingItem.liquidacionProcesoComprasProdId),
        tipoMovimientoId: Number(editingItem.tipoMovimientoId),
        monto: Number(editingItem.monto),
        centroCostoId: editingItem.centroCostoId ? Number(editingItem.centroCostoId) : null,
        fechaMovimiento: new Date(editingItem.fechaMovimiento),
        fechaRegistro: new Date(editingItem.fechaRegistro)
      });
    } else {
      reset({
        liquidacionProcesoComprasProdId: null,
        tipoMovimientoId: null,
        monto: 0,
        centroCostoId: null,
        fechaMovimiento: new Date(),
        fechaRegistro: new Date()
      });
    }
  }, [editingItem, reset]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      liquidacionProcesoComprasProdId: Number(data.liquidacionProcesoComprasProdId),
      tipoMovimientoId: Number(data.tipoMovimientoId),
      monto: Number(data.monto),
      centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
      fechaMovimiento: data.fechaMovimiento.toISOString(),
      fechaRegistro: data.fechaRegistro.toISOString()
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
   * Preparar opciones de liquidaciones para el dropdown
   */
  const liquidacionesOptions = liquidaciones.map(liquidacion => {
    const cotizacion = liquidacion.cotizacionCompras || {};
    const empresa = liquidacion.empresa || {};
    
    return {
      label: `${cotizacion.numeroReferencia || 'Sin referencia'} - ${empresa.nombre || 'Sin empresa'} ${liquidacion.verificadorId ? '(Verificada)' : '(Pendiente)'}`,
      value: Number(liquidacion.id)
    };
  });

  /**
   * Preparar opciones de tipos de movimiento para el dropdown
   */
  const tiposMovimientoOptions = tiposMovimiento.map(tipo => ({
    label: `${tipo.nombre} - ${tipo.descripcion || 'Sin descripción'}`,
    value: Number(tipo.id)
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
      style={{ width: '800px' }}
      header={editingItem ? "Editar Movimiento" : "Nuevo Movimiento"}
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Liquidación de Proceso */}
          <div className="col-12">
            <label htmlFor="liquidacionProcesoComprasProdId" className="font-semibold">
              Liquidación de Proceso *
            </label>
            <Controller
              name="liquidacionProcesoComprasProdId"
              control={control}
              rules={{ required: 'La liquidación de proceso es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="liquidacionProcesoComprasProdId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={liquidacionesOptions}
                  placeholder="Seleccione una liquidación de proceso"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.liquidacionProcesoComprasProdId })}
                />
              )}
            />
            {errors.liquidacionProcesoComprasProdId && (
              <Message severity="error" text={errors.liquidacionProcesoComprasProdId.message} />
            )}
          </div>

          {/* Tipo de Movimiento */}
          <div className="col-6">
            <label htmlFor="tipoMovimientoId" className="font-semibold">
              Tipo de Movimiento *
            </label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              rules={{ required: 'El tipo de movimiento es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={tiposMovimientoOptions}
                  placeholder="Seleccione un tipo"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.tipoMovimientoId })}
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <Message severity="error" text={errors.tipoMovimientoId.message} />
            )}
          </div>

          {/* Monto */}
          <div className="col-6">
            <label htmlFor="monto" className="font-semibold">
              Monto *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ 
                required: 'El monto es obligatorio'
              }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="S/ 0.00"
                  className={classNames({ 'p-invalid': errors.monto })}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
            <small className="text-muted">
              Puede ser positivo (ingreso) o negativo (egreso)
            </small>
          </div>

          {/* Centro de Costo */}
          <div className="col-12">
            <label htmlFor="centroCostoId" className="font-semibold">
              Centro de Costo
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={centrosCostoOptions}
                  placeholder="Seleccione un centro de costo (opcional)"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.centroCostoId })}
                />
              )}
            />
            <small className="text-muted">
              Centro de costo asociado al movimiento (opcional)
            </small>
          </div>

          {/* Fecha de Movimiento */}
          <div className="col-6">
            <label htmlFor="fechaMovimiento" className="font-semibold">
              Fecha de Movimiento *
            </label>
            <Controller
              name="fechaMovimiento"
              control={control}
              rules={{ 
                required: 'La fecha de movimiento es obligatoria',
                validate: (value) => {
                  if (value > new Date()) {
                    return 'La fecha de movimiento no puede ser futura';
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaMovimiento"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha y hora"
                  maxDate={new Date()}
                  className={classNames({ 'p-invalid': errors.fechaMovimiento })}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <Message severity="error" text={errors.fechaMovimiento.message} />
            )}
          </div>

          {/* Fecha de Registro */}
          <div className="col-6">
            <label htmlFor="fechaRegistro" className="font-semibold">
              Fecha de Registro *
            </label>
            <Controller
              name="fechaRegistro"
              control={control}
              rules={{ 
                required: 'La fecha de registro es obligatoria',
                validate: (value) => {
                  if (value > new Date()) {
                    return 'La fecha de registro no puede ser futura';
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaRegistro"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha y hora"
                  maxDate={new Date()}
                  className={classNames({ 'p-invalid': errors.fechaRegistro })}
                />
              )}
            />
            {errors.fechaRegistro && (
              <Message severity="error" text={errors.fechaRegistro.message} />
            )}
            <small className="text-muted">
              Fecha en que se registra el movimiento en el sistema
            </small>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default MovLiquidacionProcesoComprasProdForm;
