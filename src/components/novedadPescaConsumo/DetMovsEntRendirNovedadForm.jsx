/**
 * DetMovsEntRendirNovedadForm.jsx
 *
 * Formulario para crear y editar registros de DetMovsEntRendirPescaConsumo.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const DetMovsEntRendirNovedadForm = ({
  movimiento = null,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  onSave,
  onCancel,
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      personalId: null,
      fechaMovimiento: new Date(),
      tipoMovimientoId: null,
      centroCostoId: null,
      monto: 0,
      descripcion: "",
      entidadComercialId: null,
      urlComprobanteMovimiento: "",
      validadoTesoreria: false,
      fechaValidacionTesoreria: null,
      operacionSinFactura: false,
      fechaOperacionMovCaja: null,
      operacionMovCajaId: null,
      moduloOrigenMovCajaId: 3, // Valor para "NOVEDAD PESCA CONSUMO"
    },
  });

  // Observar cambios en validadoTesoreria
  const validadoTesoreria = watch("validadoTesoreria");
  const operacionSinFactura = watch("operacionSinFactura");

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        personalId: movimiento.personalId ? Number(movimiento.personalId) : null,
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        monto: movimiento.monto || 0,
        descripcion: movimiento.descripcion || "",
        entidadComercialId: movimiento.entidadComercialId ? Number(movimiento.entidadComercialId) : null,
        urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento || "",
        validadoTesoreria: movimiento.validadoTesoreria || false,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria ? new Date(movimiento.fechaValidacionTesoreria) : null,
        operacionSinFactura: movimiento.operacionSinFactura || false,
        fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja ? new Date(movimiento.fechaOperacionMovCaja) : null,
        operacionMovCajaId: movimiento.operacionMovCajaId || null,
        moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId || 3,
      });
    }
  }, [movimiento, isEditing, reset]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}` || cc.descripcion || cc.nombre,
    value: Number(cc.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tm) => ({
    label: tm.descripcion,
    value: Number(tm.id),
    esIngreso: tm.esIngreso,
  }));

  const entidadComercialOptions = entidadesComerciales.map((ec) => ({
    label: `${ec.ruc} - ${ec.razonSocial}`,
    value: Number(ec.id),
  }));

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        personalId: data.personalId ? Number(data.personalId) : null,
        tipoMovimientoId: data.tipoMovimientoId ? Number(data.tipoMovimientoId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        entidadComercialId: data.entidadComercialId ? Number(data.entidadComercialId) : null,
        monto: Number(data.monto) || 0,
        fechaMovimiento: data.fechaMovimiento || new Date(),
        fechaValidacionTesoreria: data.validadoTesoreria ? data.fechaValidacionTesoreria || new Date() : null,
        fechaOperacionMovCaja: data.fechaOperacionMovCaja || null,
        operacionMovCajaId: data.operacionMovCajaId || null,
        moduloOrigenMovCajaId: Number(data.moduloOrigenMovCajaId) || 3,
        fechaActualizacion: new Date().toISOString(),
      };

      if (!isEditing) {
        datosNormalizados.fechaCreacion = new Date().toISOString();
      }

      await onSave(datosNormalizados);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Movimiento ${isEditing ? "actualizado" : "creado"} correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al ${isEditing ? "actualizar" : "crear"} el movimiento`,
        life: 3000,
      });
    }
  };

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          {/* Personal Responsable */}
          <div className="col-12 md:col-6">
            <label htmlFor="personalId" className="block text-900 font-medium mb-2">
              Personal Responsable *
            </label>
            <Controller
              name="personalId"
              control={control}
              rules={{ required: "El personal responsable es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="personalId"
                  {...field}
                  value={field.value}
                  options={personalOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione personal"
                  className={classNames({
                    "p-invalid": errors.personalId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.personalId && (
              <Message severity="error" text={errors.personalId.message} />
            )}
          </div>

          {/* Fecha de Movimiento */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
              Fecha de Movimiento *
            </label>
            <Controller
              name="fechaMovimiento"
              control={control}
              rules={{ required: "La fecha de movimiento es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaMovimiento"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showIcon
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha"
                  className={classNames({
                    "p-invalid": errors.fechaMovimiento,
                  })}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <Message severity="error" text={errors.fechaMovimiento.message} />
            )}
          </div>

          {/* Tipo de Movimiento */}
          <div className="col-12 md:col-6">
            <label htmlFor="tipoMovimientoId" className="block text-900 font-medium mb-2">
              Tipo de Movimiento *
            </label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              rules={{ required: "El tipo de movimiento es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  {...field}
                  value={field.value}
                  options={tipoMovimientoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione tipo"
                  className={classNames({
                    "p-invalid": errors.tipoMovimientoId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <Message severity="error" text={errors.tipoMovimientoId.message} />
            )}
          </div>

          {/* Centro de Costo */}
          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: "El centro de costo es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  {...field}
                  value={field.value}
                  options={centroCostoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione centro de costo"
                  className={classNames({
                    "p-invalid": errors.centroCostoId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          {/* Monto */}
          <div className="col-12 md:col-6">
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ 
                required: "El monto es obligatorio",
                min: { value: 0, message: "El monto debe ser mayor o igual a 0" }
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
                  placeholder="0.00"
                  className={classNames({
                    "p-invalid": errors.monto,
                  })}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
          </div>

          {/* Entidad Comercial */}
          <div className="col-12 md:col-6">
            <label htmlFor="entidadComercialId" className="block text-900 font-medium mb-2">
              Entidad Comercial
            </label>
            <Controller
              name="entidadComercialId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="entidadComercialId"
                  {...field}
                  value={field.value}
                  options={entidadComercialOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione entidad comercial"
                  className={classNames({
                    "p-invalid": errors.entidadComercialId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.entidadComercialId && (
              <Message severity="error" text={errors.entidadComercialId.message} />
            )}
          </div>

          {/* Descripción */}
          <div className="col-12">
            <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
              Descripción *
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ required: "La descripción es obligatoria" }}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={3}
                  placeholder="Ingrese descripción del movimiento"
                  className={classNames({
                    "p-invalid": errors.descripcion,
                  })}
                />
              )}
            />
            {errors.descripcion && (
              <Message severity="error" text={errors.descripcion.message} />
            )}
          </div>

          {/* URL Comprobante */}
          <div className="col-12">
            <label htmlFor="urlComprobanteMovimiento" className="block text-900 font-medium mb-2">
              URL Comprobante
            </label>
            <Controller
              name="urlComprobanteMovimiento"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlComprobanteMovimiento"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="URL del comprobante del movimiento"
                  className={classNames({
                    "p-invalid": errors.urlComprobanteMovimiento,
                  })}
                />
              )}
            />
            {errors.urlComprobanteMovimiento && (
              <Message severity="error" text={errors.urlComprobanteMovimiento.message} />
            )}
          </div>

          {/* Validación Tesorería */}
          <div className="col-12 md:col-6">
            <div className="field-checkbox">
              <Controller
                name="validadoTesoreria"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="validadoTesoreria"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="validadoTesoreria" className="ml-2">
                Validado por Tesorería
              </label>
            </div>
          </div>

          {/* Fecha Validación Tesorería - Solo si está validado */}
          {validadoTesoreria && (
            <div className="col-12 md:col-6">
              <label htmlFor="fechaValidacionTesoreria" className="block text-900 font-medium mb-2">
                Fecha Validación Tesorería
              </label>
              <Controller
                name="fechaValidacionTesoreria"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaValidacionTesoreria"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    showIcon
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha"
                    className={classNames({
                      "p-invalid": errors.fechaValidacionTesoreria,
                    })}
                  />
                )}
              />
              {errors.fechaValidacionTesoreria && (
                <Message severity="error" text={errors.fechaValidacionTesoreria.message} />
              )}
            </div>
          )}

          {/* Operación Sin Factura */}
          <div className="col-12 md:col-6">
            <div className="field-checkbox">
              <Controller
                name="operacionSinFactura"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="operacionSinFactura"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="operacionSinFactura" className="ml-2">
                Operación Sin Factura
              </label>
            </div>
          </div>

          {/* Información de solo lectura para edición */}
          {isEditing && movimiento && (
            <>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={movimiento.fechaCreacion ? new Date(movimiento.fechaCreacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={movimiento.fechaActualizacion ? new Date(movimiento.fechaActualizacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancel}
          />
          <Button
            type="submit"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-primary"
          />
        </div>
      </form>

      <Toast ref={toast} />
    </div>
  );
};

export default DetMovsEntRendirNovedadForm;
