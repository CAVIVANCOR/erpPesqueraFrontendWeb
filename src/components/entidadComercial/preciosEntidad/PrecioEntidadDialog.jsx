/**
 * PrecioEntidadDialog.jsx
 *
 * Componente de diálogo para crear/editar precios especiales.
 * Usa react-hook-form y Yup para validación.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { ToggleButton } from "primereact/togglebutton";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { classNames } from "primereact/utils";
import { esquemaValidacionPrecio } from "./precioEntidadValidation";

export default function PrecioEntidadDialog({
  visible,
  precio,
  productosOptions,
  monedasOptions,
  onHide,
  onSubmit,
  loading,
  readOnly,
}) {
  const esEdicion = precio && precio.id;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(esquemaValidacionPrecio),
    defaultValues: {
      productoId: precio?.productoId ? Number(precio.productoId) : null,
      monedaId: precio?.monedaId ? Number(precio.monedaId) : null,
      precioUnitario: precio?.precioUnitario
        ? Number(precio.precioUnitario)
        : 0,
      vigenteDesde: precio?.vigenteDesde
        ? new Date(precio.vigenteDesde)
        : new Date(),
      vigenteHasta: precio?.vigenteHasta ? new Date(precio.vigenteHasta) : null,
      observaciones: precio?.observaciones || "",
      activo: precio?.activo !== undefined ? precio.activo : true,
    },
  });

  // Reset form cuando cambia el precio
  React.useEffect(() => {
    reset({
      productoId: precio?.productoId ? Number(precio.productoId) : null,
      monedaId: precio?.monedaId ? Number(precio.monedaId) : null,
      precioUnitario: precio?.precioUnitario
        ? Number(precio.precioUnitario)
        : 0,
      vigenteDesde: precio?.vigenteDesde
        ? new Date(precio.vigenteDesde)
        : new Date(),
      vigenteHasta: precio?.vigenteHasta ? new Date(precio.vigenteHasta) : null,
      observaciones: precio?.observaciones || "",
      activo: precio?.activo !== undefined ? precio.activo : true,
    });
  }, [precio, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  const getFieldClass = (fieldName) => {
    return classNames({ "p-invalid": errors[fieldName] });
  };

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name]?.message}</small>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        disabled={loading}
        type="button"
        className="p-button-danger"
        severity="danger"
        raised
        outlined
      />
      <Button
        label={esEdicion ? "Actualizar" : "Guardar"}
        icon="pi pi-check"
        onClick={handleSubmit(handleFormSubmit)}
        loading={loading}
        disabled={readOnly}
        type="button"
        className="p-button-success"
        severity="success"
        raised
        outlined
      />
    </div>
  );

  return (
    <Dialog
      header={esEdicion ? "Editar Precio Especial" : "Nuevo Precio Especial"}
      visible={visible}
      onHide={onHide}
      style={{ width: "900px" }}
      modal
      footer={dialogFooter}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
        <div className="formgrid grid">
          {/* Fila 1: Producto y Moneda */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginBottom: 10,
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <Controller
                name="productoId"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="field">
                    <label htmlFor="productoId">Producto *</label>
                    <Dropdown
                      id="productoId"
                      value={field.value}
                      options={productosOptions}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar producto"
                      filter
                      filterBy="label"
                      className={getFieldClass("productoId")}
                      disabled={readOnly || loading}
                      style={{ fontWeight: "bold" }}
                    />
                    {getFormErrorMessage("productoId")}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Fila 2: Precio y Activo */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <Controller
                name="monedaId"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="field">
                    <label htmlFor="monedaId">Moneda *</label>
                    <Dropdown
                      id="monedaId"
                      value={field.value}
                      options={monedasOptions}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar moneda"
                      className={getFieldClass("monedaId")}
                      disabled={readOnly || loading}
                      style={{ fontWeight: "bold" }}
                    />
                    {getFormErrorMessage("monedaId")}
                  </div>
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Controller
                name="precioUnitario"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="field">
                    <label htmlFor="precioUnitario">Valor Unitario *</label>
                    <InputNumber
                      id="precioUnitario"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      className={getFieldClass("precioUnitario")}
                      disabled={readOnly || loading}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                    {getFormErrorMessage("precioUnitario")}
                  </div>
                )}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="field">
                    <ToggleButton
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      onLabel="Activo"
                      offLabel="Inactivo"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      className="w-full"
                      disabled={readOnly || loading}
                      style={{ fontWeight: "bold" }}
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Fila 3: Fechas de vigencia */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <Controller
                name="vigenteDesde"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="field">
                    <label htmlFor="vigenteDesde">Vigente Desde *</label>
                    <Calendar
                      id="vigenteDesde"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      dateFormat="dd/mm/yy"
                      className={getFieldClass("vigenteDesde")}
                      disabled={readOnly || loading}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                    {getFormErrorMessage("vigenteDesde")}
                  </div>
                )}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Controller
                name="vigenteHasta"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="field">
                    <label htmlFor="vigenteHasta">Vigente Hasta</label>
                    <Calendar
                      id="vigenteHasta"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      dateFormat="dd/mm/yy"
                      showButtonBar
                      className={getFieldClass("vigenteHasta")}
                      disabled={readOnly || loading}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                    {getFormErrorMessage("vigenteHasta")}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Fila 4: Observaciones */}
          <div style={{ marginBottom: 10 }}>
            <Controller
              name="observaciones"
              control={control}
              render={({ field, fieldState }) => (
                <div className="field">
                  <label htmlFor="observaciones">Observaciones</label>
                  <InputTextarea
                    id="observaciones"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={3}
                    className={getFieldClass("observaciones")}
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  {getFormErrorMessage("observaciones")}
                </div>
              )}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
