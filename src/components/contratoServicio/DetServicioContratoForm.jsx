// src/components/contratoServicio/DetServicioContratoForm.jsx
/**
 * Formulario de Detalle de Servicio para Contrato
 * Patrón profesional ERP Megui
 */

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import {
  ProductoSelectorDialog,
  ProductoSelectedDisplay,
} from "../common/productoSelectorConStock";

const DetServicioContratoForm = ({
  visible,
  onHide,
  detalle = null,
  onSave,
  productos = [],
  moneda,
  empresaId = null,
  empresaEntidadComercialId = null,
  clienteId = null,
  fechaDocumento = null,
}) => {
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [formData, setFormData] = useState({
    productoId: detalle?.productoServicioId || null,
    producto: detalle?.productoServicio || null,
    cantidad: detalle?.cantidad || 1,
    valorVentaUnitario: detalle?.valorVentaUnitario || 0,
    incluyeLuz: detalle?.incluyeLuz || false,
  });

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

  const handleProductoSeleccionado = (productoData) => {
    // productoData viene de ProductoSelectorDialog con precio automático
    setFormData((prev) => ({
      ...prev,
      productoId: Number(productoData.productoId),
      valorVentaUnitario: Number(productoData.precioUnitario || 0),
    }));
    setShowProductoSelector(false);
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
    if (!formData.valorVentaUnitario || formData.valorVentaUnitario <= 0) {
      alert("El valor de venta unitario debe ser mayor a 0");
      return;
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
        <ProductoSelectedDisplay
          producto={
            formData.productoId
              ? productos.find((p) => Number(p.id) === Number(formData.productoId))
              : null
          }
          onChangeClick={() => setShowProductoSelector(true)}
          disabled={false}
          label="Servicio *"
        />

        {/* Cantidad y Valor Venta Unitario */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
              maxFractionDigits={4}
              min={0}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Valor Venta Unitario <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              value={formData.valorVentaUnitario}
              onValueChange={(e) => handleChange("valorVentaUnitario", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              min={0}
              prefix={`${getSimboloMoneda()} `}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Checkbox Incluye Luz */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Checkbox
            inputId="incluyeLuz"
            checked={formData.incluyeLuz}
            onChange={(e) => handleChange("incluyeLuz", e.checked)}
          />
          <label htmlFor="incluyeLuz" style={{ fontWeight: "bold", cursor: "pointer" }}>
            Incluye Servicio de Luz
          </label>
        </div>
      </div>

      {/* Selector de Productos Avanzado */}
      <ProductoSelectorDialog
        visible={showProductoSelector}
        onHide={() => setShowProductoSelector(false)}
        modo="egreso"
        esCustodia={false}
        empresaId={empresaId}
        propietarioStockId={empresaEntidadComercialId}
        almacenId={null}
        productoIdSeleccionado={formData.productoId}
        clienteId={clienteId}
        empresaEntidadComercialId={empresaEntidadComercialId}
        monedaId={moneda?.id}
        fechaDocumento={fechaDocumento}
        buscarPrecioVenta={true}
        onSelect={handleProductoSeleccionado}
      />
    </Dialog>
  );
};

export default DetServicioContratoForm;
