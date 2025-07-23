/**
 * Formulario para gestión de Liquidaciones de Proceso de Compras de Producción
 * 
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con cotizaciones, empresas y personal
 * - Gestión de responsables y verificadores
 * - Control de fechas de liquidación y verificación
 * - Gestión de saldos finales y documentos PDF
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
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

/**
 * Componente de formulario para liquidaciones de proceso de compras de producción
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const LiquidacionProcesoComprasProdForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  cotizaciones = [],
  empresas = [],
  personal = []
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
      empresaId: null,
      fechaLiquidacion: new Date(),
      responsableId: null,
      verificadorId: null,
      fechaVerificacion: null,
      urlPdfLiquidacion: '',
      saldoFinal: 0,
      observaciones: ''
    }
  });

  // Observar cambios en la cotización para actualizar empresa automáticamente
  const cotizacionComprasId = watch('cotizacionComprasId');

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        cotizacionComprasId: Number(editingItem.cotizacionComprasId),
        empresaId: Number(editingItem.empresaId),
        fechaLiquidacion: new Date(editingItem.fechaLiquidacion),
        responsableId: Number(editingItem.responsableId),
        verificadorId: editingItem.verificadorId ? Number(editingItem.verificadorId) : null,
        fechaVerificacion: editingItem.fechaVerificacion ? new Date(editingItem.fechaVerificacion) : null,
        urlPdfLiquidacion: editingItem.urlPdfLiquidacion || '',
        saldoFinal: Number(editingItem.saldoFinal),
        observaciones: editingItem.observaciones || ''
      });
    } else {
      reset({
        cotizacionComprasId: null,
        empresaId: null,
        fechaLiquidacion: new Date(),
        responsableId: null,
        verificadorId: null,
        fechaVerificacion: null,
        urlPdfLiquidacion: '',
        saldoFinal: 0,
        observaciones: ''
      });
    }
  }, [editingItem, reset]);

  /**
   * Efecto para actualizar empresa automáticamente al seleccionar cotización
   */
  useEffect(() => {
    if (cotizacionComprasId) {
      const cotizacion = cotizaciones.find(c => Number(c.id) === Number(cotizacionComprasId));
      if (cotizacion && cotizacion.empresaId) {
        setValue('empresaId', Number(cotizacion.empresaId));
      }
    }
  }, [cotizacionComprasId, cotizaciones, setValue]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      cotizacionComprasId: Number(data.cotizacionComprasId),
      empresaId: Number(data.empresaId),
      fechaLiquidacion: data.fechaLiquidacion.toISOString(),
      responsableId: Number(data.responsableId),
      verificadorId: data.verificadorId ? Number(data.verificadorId) : null,
      fechaVerificacion: data.fechaVerificacion ? data.fechaVerificacion.toISOString() : null,
      urlPdfLiquidacion: data.urlPdfLiquidacion || null,
      saldoFinal: Number(data.saldoFinal),
      observaciones: data.observaciones || null
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
   * Solo cotizaciones que no tengan liquidación (relación única)
   */
  const cotizacionesOptions = cotizaciones
    .filter(cotizacion => {
      // Si estamos editando, incluir la cotización actual
      if (editingItem && Number(cotizacion.id) === Number(editingItem.cotizacionComprasId)) {
        return true;
      }
      // Para nuevas liquidaciones, solo mostrar cotizaciones sin liquidación
      return !cotizacion.liquidacionProceso;
    })
    .map(cotizacion => ({
      label: `${cotizacion.numeroReferencia || 'Sin referencia'} - ${cotizacion.empresa?.nombre || 'Sin empresa'}`,
      value: Number(cotizacion.id)
    }));

  /**
   * Preparar opciones de empresas para el dropdown
   */
  const empresasOptions = empresas.map(empresa => ({
    label: `${empresa.nombre} - ${empresa.ruc || 'Sin RUC'}`,
    value: Number(empresa.id)
  }));

  /**
   * Preparar opciones de personal para el dropdown
   */
  const personalOptions = personal.map(persona => ({
    label: `${persona.nombres} ${persona.apellidos} - ${persona.numeroDocumento || 'Sin documento'}`,
    value: Number(persona.id)
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
      style={{ width: '900px' }}
      header={editingItem ? "Editar Liquidación" : "Nueva Liquidación"}
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
            {!editingItem && (
              <small className="text-muted">
                Solo se muestran cotizaciones sin liquidación previa
              </small>
            )}
          </div>

          {/* Empresa */}
          <div className="col-6">
            <label htmlFor="empresaId" className="font-semibold">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: 'La empresa es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={empresasOptions}
                  placeholder="Seleccione una empresa"
                  filter
                  showClear
                  disabled={!!cotizacionComprasId}
                  className={classNames({ 'p-invalid': errors.empresaId })}
                />
              )}
            />
            {errors.empresaId && (
              <Message severity="error" text={errors.empresaId.message} />
            )}
            {cotizacionComprasId && (
              <small className="text-muted">
                Empresa asignada automáticamente según la cotización
              </small>
            )}
          </div>

          {/* Fecha de Liquidación */}
          <div className="col-6">
            <label htmlFor="fechaLiquidacion" className="font-semibold">
              Fecha de Liquidación *
            </label>
            <Controller
              name="fechaLiquidacion"
              control={control}
              rules={{ 
                required: 'La fecha de liquidación es obligatoria',
                validate: (value) => {
                  if (value > new Date()) {
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

          {/* Verificador */}
          <div className="col-6">
            <label htmlFor="verificadorId" className="font-semibold">
              Verificador
            </label>
            <Controller
              name="verificadorId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="verificadorId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={personalOptions}
                  placeholder="Seleccione un verificador (opcional)"
                  filter
                  showClear
                  className={classNames({ 'p-invalid': errors.verificadorId })}
                />
              )}
            />
            <small className="text-muted">
              Opcional - Persona que verificará la liquidación
            </small>
          </div>

          {/* Fecha de Verificación */}
          <div className="col-6">
            <label htmlFor="fechaVerificacion" className="font-semibold">
              Fecha de Verificación
            </label>
            <Controller
              name="fechaVerificacion"
              control={control}
              rules={{ 
                validate: (value) => {
                  if (value && value > new Date()) {
                    return 'La fecha de verificación no puede ser futura';
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaVerificacion"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha y hora (opcional)"
                  maxDate={new Date()}
                  className={classNames({ 'p-invalid': errors.fechaVerificacion })}
                />
              )}
            />
            {errors.fechaVerificacion && (
              <Message severity="error" text={errors.fechaVerificacion.message} />
            )}
          </div>

          {/* Saldo Final */}
          <div className="col-6">
            <label htmlFor="saldoFinal" className="font-semibold">
              Saldo Final *
            </label>
            <Controller
              name="saldoFinal"
              control={control}
              rules={{ 
                required: 'El saldo final es obligatorio'
              }}
              render={({ field }) => (
                <InputNumber
                  id="saldoFinal"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="S/ 0.00"
                  className={classNames({ 'p-invalid': errors.saldoFinal })}
                />
              )}
            />
            {errors.saldoFinal && (
              <Message severity="error" text={errors.saldoFinal.message} />
            )}
            <small className="text-muted">
              Puede ser positivo (ganancia) o negativo (pérdida)
            </small>
          </div>

          {/* URL PDF Liquidación */}
          <div className="col-12">
            <label htmlFor="urlPdfLiquidacion" className="font-semibold">
              URL PDF Liquidación
            </label>
            <Controller
              name="urlPdfLiquidacion"
              control={control}
              rules={{ 
                pattern: {
                  value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                  message: 'Debe ser una URL válida'
                }
              }}
              render={({ field }) => (
                <InputText
                  id="urlPdfLiquidacion"
                  {...field}
                  placeholder="https://ejemplo.com/liquidacion.pdf (opcional)"
                  className={classNames({ 'p-invalid': errors.urlPdfLiquidacion })}
                />
              )}
            />
            {errors.urlPdfLiquidacion && (
              <Message severity="error" text={errors.urlPdfLiquidacion.message} />
            )}
            <small className="text-muted">
              URL del documento PDF de la liquidación (opcional)
            </small>
          </div>

          {/* Observaciones */}
          <div className="col-12">
            <label htmlFor="observaciones" className="font-semibold">
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              rules={{ 
                maxLength: { value: 1000, message: 'Las observaciones no pueden exceder 1000 caracteres' }
              }}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  placeholder="Observaciones adicionales sobre la liquidación (opcional)"
                  rows={3}
                  maxLength={1000}
                  className={classNames({ 'p-invalid': errors.observaciones })}
                />
              )}
            />
            {errors.observaciones && (
              <Message severity="error" text={errors.observaciones.message} />
            )}
            <small className="text-muted">
              Observaciones opcionales sobre la liquidación (máximo 1000 caracteres)
            </small>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default LiquidacionProcesoComprasProdForm;
