/**
 * Formulario para gestión de Productos Finales de Cotización de Compras
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Campos para costos detallados (materia prima, proceso, unitario)
 * - Combos relacionales con cotizaciones y productos
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas
 * - Campos decimales con precisión
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

/**
 * Componente de formulario para productos finales de cotización de compras
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const DetProductoFinalCotizacionComprasForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  cotizaciones = [],
  productosFinales = []
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
      productoFinalId: null,
      cantidad: 0,
      peso: 0,
      costoUnitMateriaPrima: 0,
      costoUnitProceso: 0,
      costoUnitario: 0
    }
  });

  // Observar cambios en costos para calcular costo unitario total
  const costoMateriaPrima = watch('costoUnitMateriaPrima');
  const costoProceso = watch('costoUnitProceso');

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        cotizacionComprasId: Number(editingItem.cotizacionComprasId),
        productoFinalId: Number(editingItem.productoFinalId),
        cantidad: Number(editingItem.cantidad),
        peso: Number(editingItem.peso),
        costoUnitMateriaPrima: Number(editingItem.costoUnitMateriaPrima),
        costoUnitProceso: Number(editingItem.costoUnitProceso),
        costoUnitario: Number(editingItem.costoUnitario)
      });
    } else {
      reset({
        cotizacionComprasId: null,
        productoFinalId: null,
        cantidad: 0,
        peso: 0,
        costoUnitMateriaPrima: 0,
        costoUnitProceso: 0,
        costoUnitario: 0
      });
    }
  }, [editingItem, reset]);

  /**
   * Efecto para calcular automáticamente el costo unitario total
   */
  useEffect(() => {
    const costoTotal = (Number(costoMateriaPrima) || 0) + (Number(costoProceso) || 0);
    setValue('costoUnitario', costoTotal);
  }, [costoMateriaPrima, costoProceso, setValue]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      cotizacionComprasId: Number(data.cotizacionComprasId),
      productoFinalId: Number(data.productoFinalId),
      cantidad: Number(data.cantidad),
      peso: Number(data.peso),
      costoUnitMateriaPrima: Number(data.costoUnitMateriaPrima),
      costoUnitProceso: Number(data.costoUnitProceso),
      costoUnitario: Number(data.costoUnitario)
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
   * Preparar opciones de productos finales para el dropdown
   */
  const productosFinalesOptions = productosFinales.map(producto => ({
    label: `${producto.nombre} - ${producto.codigo || 'Sin código'}`,
    value: Number(producto.id)
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
      header={editingItem ? "Editar Producto Final" : "Nuevo Producto Final"}
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

          {/* Producto Final */}
          <div className="col-12">
            <label htmlFor="productoFinalId" className="font-semibold">
              Producto Final *
            </label>
            <Controller
              name="productoFinalId"
              control={control}
              rules={{ required: 'El producto final es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="productoFinalId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={productosFinalesOptions}
                  placeholder="Seleccione un producto final"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.productoFinalId })}
                />
              )}
            />
            {errors.productoFinalId && (
              <Message severity="error" text={errors.productoFinalId.message} />
            )}
          </div>

          {/* Cantidad y Peso */}
          <div className="col-6">
            <label htmlFor="cantidad" className="font-semibold">
              Cantidad *
            </label>
            <Controller
              name="cantidad"
              control={control}
              rules={{ 
                required: 'La cantidad es obligatoria',
                min: { value: 0.01, message: 'La cantidad debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="cantidad"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="0.00"
                  className={classNames({ 'p-invalid': errors.cantidad })}
                />
              )}
            />
            {errors.cantidad && (
              <Message severity="error" text={errors.cantidad.message} />
            )}
          </div>

          <div className="col-6">
            <label htmlFor="peso" className="font-semibold">
              Peso (kg) *
            </label>
            <Controller
              name="peso"
              control={control}
              rules={{ 
                required: 'El peso es obligatorio',
                min: { value: 0.01, message: 'El peso debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="peso"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" kg"
                  placeholder="0.00"
                  className={classNames({ 'p-invalid': errors.peso })}
                />
              )}
            />
            {errors.peso && (
              <Message severity="error" text={errors.peso.message} />
            )}
          </div>

          {/* Costos */}
          <div className="col-6">
            <label htmlFor="costoUnitMateriaPrima" className="font-semibold">
              Costo Unit. Materia Prima *
            </label>
            <Controller
              name="costoUnitMateriaPrima"
              control={control}
              rules={{ 
                required: 'El costo de materia prima es obligatorio',
                min: { value: 0, message: 'El costo debe ser mayor o igual a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="costoUnitMateriaPrima"
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
                  className={classNames({ 'p-invalid': errors.costoUnitMateriaPrima })}
                />
              )}
            />
            {errors.costoUnitMateriaPrima && (
              <Message severity="error" text={errors.costoUnitMateriaPrima.message} />
            )}
          </div>

          <div className="col-6">
            <label htmlFor="costoUnitProceso" className="font-semibold">
              Costo Unit. Proceso *
            </label>
            <Controller
              name="costoUnitProceso"
              control={control}
              rules={{ 
                required: 'El costo de proceso es obligatorio',
                min: { value: 0, message: 'El costo debe ser mayor o igual a 0' }
              }}
              render={({ field }) => (
                <InputNumber
                  id="costoUnitProceso"
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
                  className={classNames({ 'p-invalid': errors.costoUnitProceso })}
                />
              )}
            />
            {errors.costoUnitProceso && (
              <Message severity="error" text={errors.costoUnitProceso.message} />
            )}
          </div>

          {/* Costo Unitario Total (calculado automáticamente) */}
          <div className="col-12">
            <label htmlFor="costoUnitario" className="font-semibold">
              Costo Unitario Total (Calculado)
            </label>
            <Controller
              name="costoUnitario"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="costoUnitario"
                  {...field}
                  value={field.value}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  placeholder="S/ 0.00"
                  className="p-inputtext-disabled"
                />
              )}
            />
            <small className="text-muted">
              Este campo se calcula automáticamente sumando los costos de materia prima y proceso
            </small>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default DetProductoFinalCotizacionComprasForm;
