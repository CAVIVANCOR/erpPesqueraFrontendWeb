/**
 * Formulario para gestión de Movimientos de Entregas a Rendir de Compras
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con entregas, personal, tipos de movimiento y centros de costo
 * - Gestión de montos con formato de moneda
 * - Control de fechas de movimiento
 * - Filtrado dinámico de entregas no liquidadas
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

/**
 * Componente de formulario para movimientos de entregas a rendir de compras
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const DetMovsEntregaRendirPComprasForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  entregasARendir = [],
  personal = [],
  tiposMovimiento = [],
  centrosCosto = []
}) => {
  // Estados locales
  const [entregasNoLiquidadas, setEntregasNoLiquidadas] = useState([]);

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      entregaARendirPComprasId: null,
      responsableId: null,
      tipoMovimientoId: null,
      centroCostoId: null,
      fechaMovimiento: new Date(),
      monto: 0,
      descripcion: ''
    }
  });

  /**
   * Efecto para filtrar entregas no liquidadas
   */
  useEffect(() => {
    const noLiquidadas = entregasARendir.filter(entrega => !entrega.entregaLiquidada);
    setEntregasNoLiquidadas(noLiquidadas);
  }, [entregasARendir]);

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        entregaARendirPComprasId: Number(editingItem.entregaARendirPComprasId),
        responsableId: Number(editingItem.responsableId),
        tipoMovimientoId: Number(editingItem.tipoMovimientoId),
        centroCostoId: Number(editingItem.centroCostoId),
        fechaMovimiento: new Date(editingItem.fechaMovimiento),
        monto: Number(editingItem.monto),
        descripcion: editingItem.descripcion || ''
      });
    } else {
      reset({
        entregaARendirPComprasId: null,
        responsableId: null,
        tipoMovimientoId: null,
        centroCostoId: null,
        fechaMovimiento: new Date(),
        monto: 0,
        descripcion: ''
      });
    }
  }, [editingItem, reset]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      entregaARendirPComprasId: Number(data.entregaARendirPComprasId),
      responsableId: Number(data.responsableId),
      tipoMovimientoId: Number(data.tipoMovimientoId),
      centroCostoId: Number(data.centroCostoId),
      fechaMovimiento: data.fechaMovimiento.toISOString(),
      monto: Number(data.monto),
      descripcion: data.descripcion || null
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
   * Preparar opciones de entregas a rendir para el dropdown
   * Solo muestra entregas no liquidadas para nuevos movimientos
   */
  const entregasOptions = (editingItem ? entregasARendir : entregasNoLiquidadas).map(entrega => {
    const cotizacion = entrega.cotizacionCompras || {};
    const empresa = cotizacion.empresa || {};
    
    return {
      label: `${cotizacion.numeroReferencia || 'Sin referencia'} - ${empresa.nombre || 'Sin empresa'} ${entrega.entregaLiquidada ? '(Liquidada)' : '(Pendiente)'}`,
      value: Number(entrega.id)
    };
  });

  /**
   * Preparar opciones de personal para el dropdown
   */
  const personalOptions = personal.map(persona => ({
    label: `${persona.nombres} ${persona.apellidos} - ${persona.numeroDocumento || 'Sin documento'}`,
    value: Number(persona.id)
  }));

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
          {/* Entrega a Rendir */}
          <div className="col-12">
            <label htmlFor="entregaARendirPComprasId" className="font-semibold">
              Entrega a Rendir *
            </label>
            <Controller
              name="entregaARendirPComprasId"
              control={control}
              rules={{ required: 'La entrega a rendir es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="entregaARendirPComprasId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={entregasOptions}
                  placeholder="Seleccione una entrega a rendir"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.entregaARendirPComprasId })}
                />
              )}
            />
            {errors.entregaARendirPComprasId && (
              <Message severity="error" text={errors.entregaARendirPComprasId.message} />
            )}
            {!editingItem && (
              <small className="text-muted">
                Solo se muestran entregas no liquidadas para nuevos movimientos
              </small>
            )}
          </div>

          {/* Responsable */}
          <div className="col-6">
            <label htmlFor="responsableId" className="font-semibold">
              Responsable *
            </label>
            <Controller
              name="responsableId"
              control={control}
              rules={{ required: 'El responsable es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="responsableId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={personalOptions}
                  placeholder="Seleccione un responsable"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.responsableId })}
                />
              )}
            />
            {errors.responsableId && (
              <Message severity="error" text={errors.responsableId.message} />
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

          {/* Monto */}
          <div className="col-6">
            <label htmlFor="monto" className="font-semibold">
              Monto *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ 
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
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
                  min={0}
                  placeholder="S/ 0.00"
                  className={classNames({ 'p-invalid': errors.monto })}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
          </div>

          {/* Descripción */}
          <div className="col-12">
            <label htmlFor="descripcion" className="font-semibold">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ 
                maxLength: { value: 500, message: 'La descripción no puede exceder 500 caracteres' }
              }}
              render={({ field }) => (
                <InputText
                  id="descripcion"
                  {...field}
                  placeholder="Descripción del movimiento (opcional)"
                  maxLength={500}
                  className={classNames({ 'p-invalid': errors.descripcion })}
                />
              )}
            />
            {errors.descripcion && (
              <Message severity="error" text={errors.descripcion.message} />
            )}
            <small className="text-muted">
              Descripción opcional del movimiento (máximo 500 caracteres)
            </small>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default DetMovsEntregaRendirPComprasForm;
