// src/components/contratoServicio/DetServicioContratoForm.jsx
/**
 * Formulario de Detalle de Servicio para Contrato
 * Patrón profesional ERP Megui
 */

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";

const DetServicioContratoForm = ({
  visible,
  onHide,
  detalle = null,
  onSave,
  productos = [],
  moneda,
}) => {
  const [formData, setFormData] = useState({
    productoId: detalle?.productoId || null,
    producto: detalle?.producto || null,
    cantidad: detalle?.cantidad || 1,
    precioUnitario: detalle?.precioUnitario || 0,
    valorTotal: detalle?.valorTotal || 0,
    aplicaCargoLuz: detalle?.aplicaCargoLuz || false,
    cantidadKwh: detalle?.cantidadKwh || 0,
    precioKwh: detalle?.precioKwh || 0,
    recargoKwh: detalle?.recargoKwh || 0,
    valorTotalLuz: detalle?.valorTotalLuz || 0,
    observaciones: detalle?.observaciones || "",
  });

  // Calcular valor total automáticamente
  useEffect(() => {
    const total = (formData.cantidad || 0) * (formData.precioUnitario || 0);
    setFormData((prev) => ({ ...prev, valorTotal: total }));
  }, [formData.cantidad, formData.precioUnitario]);

  // Calcular valor total luz automáticamente
  useEffect(() => {
    if (formData.aplicaCargoLuz) {
      const totalLuz = (formData.cantidadKwh || 0) * ((formData.precioKwh || 0) + (formData.recargoKwh || 0));
      setFormData((prev) => ({ ...prev, valorTotalLuz: totalLuz }));
    } else {
      setFormData((prev) => ({ ...prev, valorTotalLuz: 0 }));
    }
  }, [formData.aplicaCargoLuz, formData.cantidadKwh, formData.precioKwh, formData.recargoKwh]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductoChange = (productoId) => {
    const producto = productos.find((p) => Number(p.id) === Number(productoId));
    setFormData((prev) => ({
      ...prev,
      productoId: Number(productoId),
      producto: producto,
    }));
  };

  const handleSubmit = () => {
    // Validaciones
    if (!formData.productoId) {
      alert("Debe seleccionar un servicio");
      return;
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (!formData.precioUnitario || formData.precioUnitario <= 0) {
      alert("El precio unitario debe ser mayor a 0");
      return;
    }

    if (formData.aplicaCargoLuz) {
      if (!formData.cantidadKwh || formData.cantidadKwh <= 0) {
        alert("La cantidad de kWh debe ser mayor a 0");
        return;
      }
      if (!formData.precioKwh || formData.precioKwh <= 0) {
        alert("El precio de kWh debe ser mayor a 0");
        return;
      }
    }

    onSave(formData);
  };

  const getSimboloMoneda = () => {
    return moneda?.codigoSunat === "USD" ? "$" : "S/";
  };

  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={onHide}
        type="button"
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleSubmit}
        type="button"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={detalle ? "Editar Servicio" : "Agregar Servicio"}
      footer={footer}
      style={{ width: "800px" }}
      modal
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Servicio */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Servicio <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            value={formData.productoId}
            options={productos}
            onChange={(e) => handleProductoChange(e.value)}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar servicio"
            filter
            showClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Cantidad y Precio */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Cantidad <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              value={formData.cantidad}
              onValueChange={(e) => handleChange("cantidad", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Precio Unitario <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              value={formData.precioUnitario}
              onValueChange={(e) => handleChange("precioUnitario", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              prefix={`${getSimboloMoneda()} `}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Valor Total
            </label>
            <InputNumber
              value={formData.valorTotal}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              prefix={`${getSimboloMoneda()} `}
              style={{ width: "100%" }}
              readOnly
              disabled
            />
          </div>
        </div>

        {/* Checkbox Aplica Cargo Luz */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Checkbox
            inputId="aplicaCargoLuz"
            checked={formData.aplicaCargoLuz}
            onChange={(e) => handleChange("aplicaCargoLuz", e.checked)}
          />
          <label htmlFor="aplicaCargoLuz" style={{ fontWeight: "bold", cursor: "pointer" }}>
            Aplica Cargo por Servicio de Luz
          </label>
        </div>

        {/* Campos de Luz (solo si aplica) */}
        {formData.aplicaCargoLuz && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffc107",
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>
              <i className="pi pi-bolt" style={{ marginRight: "0.5rem" }}></i>
              Datos de Consumo Eléctrico
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Cantidad kWh <span style={{ color: "red" }}>*</span>
                </label>
                <InputNumber
                  value={formData.cantidadKwh}
                  onValueChange={(e) => handleChange("cantidadKwh", e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" kWh"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Precio kWh <span style={{ color: "red" }}>*</span>
                </label>
                <InputNumber
                  value={formData.precioKwh}
                  onValueChange={(e) => handleChange("precioKwh", e.value)}
                  mode="decimal"
                  minFractionDigits={4}
                  maxFractionDigits={4}
                  min={0}
                  prefix={`${getSimboloMoneda()} `}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Recargo kWh
                </label>
                <InputNumber
                  value={formData.recargoKwh}
                  onValueChange={(e) => handleChange("recargoKwh", e.value)}
                  mode="decimal"
                  minFractionDigits={4}
                  maxFractionDigits={4}
                  min={0}
                  prefix={`${getSimboloMoneda()} `}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Total Luz
                </label>
                <InputNumber
                  value={formData.valorTotalLuz}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  prefix={`${getSimboloMoneda()} `}
                  style={{ width: "100%" }}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={3}
            style={{
              width: "100%",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default DetServicioContratoForm;
