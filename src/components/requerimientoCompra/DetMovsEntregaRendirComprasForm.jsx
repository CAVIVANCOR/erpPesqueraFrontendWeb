// src/components/requerimientoCompra/DetMovsEntregaRendirComprasForm.jsx
// Formulario para crear/editar movimientos de entregas a rendir en compras
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Message } from "primereact/message";
import { Card } from "primereact/card";
import PdfComprobanteOperacionDetMovComprasCard from "./PdfComprobanteOperacionDetMovComprasCard";
import PdfDetMovEntregaRendirComprasCard from "./PdfDetMovEntregaRendirComprasCard";

export default function DetMovsEntregaRendirComprasForm({
  movimiento,
  entregaARendirPComprasId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  onGuardadoExitoso,
  onCancelar,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      entregaARendirPComprasId: entregaARendirPComprasId,
      fechaMovimiento: movimiento?.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
      responsableId: movimiento?.responsableId || null,
      tipoMovimientoId: movimiento?.tipoMovimientoId || null,
      monto: movimiento?.monto || 0,
      monedaId: movimiento?.monedaId || null,
      centroCostoId: movimiento?.centroCostoId || null,
      descripcion: movimiento?.descripcion || "",
      entidadComercialId: movimiento?.entidadComercialId || null,
      operacionSinFactura: movimiento?.operacionSinFactura || false,
      tipoDocumentoId: movimiento?.tipoDocumentoId || null,
      numeroDocumento: movimiento?.numeroDocumento || "",
      validadoTesoreria: movimiento?.validadoTesoreria || false,
      fechaValidacionTesoreria: movimiento?.fechaValidacionTesoreria
        ? new Date(movimiento.fechaValidacionTesoreria)
        : null,
    },
  });

  const operacionSinFactura = watch("operacionSinFactura");
  const fileUploadRef = useRef(null);

  useEffect(() => {
    if (movimiento) {
      reset({
        entregaARendirPComprasId: movimiento.entregaARendirPComprasId,
        fechaMovimiento: new Date(movimiento.fechaMovimiento),
        responsableId: movimiento.responsableId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        monto: movimiento.monto,
        monedaId: movimiento.monedaId,
        centroCostoId: movimiento.centroCostoId,
        descripcion: movimiento.descripcion,
        entidadComercialId: movimiento.entidadComercialId,
        operacionSinFactura: movimiento.operacionSinFactura,
        tipoDocumentoId: movimiento.tipoDocumentoId,
        numeroDocumento: movimiento.numeroDocumento,
        validadoTesoreria: movimiento.validadoTesoreria,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria
          ? new Date(movimiento.fechaValidacionTesoreria)
          : null,
      });
    }
  }, [movimiento, reset]);

  const onSubmit = (data) => {
    const dataToSave = {
      ...data,
      entregaARendirPComprasId: Number(entregaARendirPComprasId),
      responsableId: Number(data.responsableId),
      tipoMovimientoId: Number(data.tipoMovimientoId),
      monto: Number(data.monto),
      monedaId: Number(data.monedaId),
      centroCostoId: Number(data.centroCostoId),
      entidadComercialId: data.entidadComercialId ? Number(data.entidadComercialId) : null,
      tipoDocumentoId: data.tipoDocumentoId ? Number(data.tipoDocumentoId) : null,
    };

    onGuardadoExitoso(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid">
        {/* Fila 1 */}
        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="fechaMovimiento">Fecha Movimiento *</label>
            <Controller
              name="fechaMovimiento"
              control={control}
              rules={{ required: "La fecha es requerida" }}
              render={({ field }) => (
                <Calendar
                  id="fechaMovimiento"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className={errors.fechaMovimiento ? "p-invalid" : ""}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <small className="p-error">{errors.fechaMovimiento.message}</small>
            )}
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="responsableId">Responsable *</label>
            <Controller
              name="responsableId"
              control={control}
              rules={{ required: "El responsable es requerido" }}
              render={({ field }) => (
                <Dropdown
                  id="responsableId"
                  value={field.value}
                  options={personal}
                  optionLabel={(option) =>
                    option.nombreCompleto || `${option.nombres} ${option.apellidos}`
                  }
                  optionValue="id"
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un responsable"
                  filter
                  showClear
                  className={errors.responsableId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.responsableId && (
              <small className="p-error">{errors.responsableId.message}</small>
            )}
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="tipoMovimientoId">Tipo Movimiento *</label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              rules={{ required: "El tipo de movimiento es requerido" }}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  value={field.value}
                  options={tiposMovimiento}
                  optionLabel="nombre"
                  optionValue="id"
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un tipo"
                  filter
                  showClear
                  className={errors.tipoMovimientoId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <small className="p-error">{errors.tipoMovimientoId.message}</small>
            )}
          </div>
        </div>

        {/* Fila 2 */}
        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="monto">Monto *</label>
            <Controller
              name="monto"
              control={control}
              rules={{ required: "El monto es requerido", min: { value: 0.01, message: "El monto debe ser mayor a 0" } }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  className={errors.monto ? "p-invalid" : ""}
                />
              )}
            />
            {errors.monto && <small className="p-error">{errors.monto.message}</small>}
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="monedaId">Moneda *</label>
            <Controller
              name="monedaId"
              control={control}
              rules={{ required: "La moneda es requerida" }}
              render={({ field }) => (
                <Dropdown
                  id="monedaId"
                  value={field.value}
                  options={monedas}
                  optionLabel={(option) => `${option.codigoSunat} - ${option.nombre}`}
                  optionValue="id"
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione una moneda"
                  filter
                  showClear
                  className={errors.monedaId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.monedaId && <small className="p-error">{errors.monedaId.message}</small>}
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="field">
            <label htmlFor="centroCostoId">Centro de Costo *</label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: "El centro de costo es requerido" }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  value={field.value}
                  options={centrosCosto}
                  optionLabel={(option) => `${option.Codigo} - ${option.Nombre}`}
                  optionValue="id"
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un centro de costo"
                  filter
                  showClear
                  className={errors.centroCostoId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.centroCostoId && (
              <small className="p-error">{errors.centroCostoId.message}</small>
            )}
          </div>
        </div>

        {/* Fila 3 */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="entidadComercialId">Entidad Comercial</label>
            <Controller
              name="entidadComercialId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="entidadComercialId"
                  value={field.value}
                  options={entidadesComerciales}
                  optionLabel="razonSocial"
                  optionValue="id"
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione una entidad"
                  filter
                  showClear
                />
              )}
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="descripcion">Descripción</label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={3}
                  placeholder="Ingrese una descripción"
                />
              )}
            />
          </div>
        </div>

        {/* Fila 4 - Operación sin factura */}
        <div className="col-12">
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
              Operación sin factura
            </label>
          </div>
        </div>

        {/* Fila 5 - Documento (solo si NO es sin factura) */}
        {!operacionSinFactura && (
          <>
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="tipoDocumentoId">Tipo Documento</label>
                <Controller
                  name="tipoDocumentoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoDocumentoId"
                      value={field.value}
                      options={tiposDocumento}
                      optionLabel="nombre"
                      optionValue="id"
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione un tipo"
                      filter
                      showClear
                    />
                  )}
                />
              </div>
            </div>

            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="numeroDocumento">Número Documento</label>
                <Controller
                  name="numeroDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroDocumento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: F001-00001234"
                    />
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Fila 6 - PDFs (solo si está editando) */}
        {movimiento && (
          <div className="col-12">
            <Card title="Documentos PDF" className="mt-3">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <PdfDetMovEntregaRendirComprasCard movimiento={movimiento} />
                </div>
                <div className="col-12 md:col-6">
                  <PdfComprobanteOperacionDetMovComprasCard movimiento={movimiento} />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onCancelar}
          type="button"
        />
        <Button label="Guardar" icon="pi pi-check" type="submit" />
      </div>
    </form>
  );
}