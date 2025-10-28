// src/components/ordenCompra/DetalleDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import {
  crearDetalleOrdenCompra,
  actualizarDetalleOrdenCompra,
} from "../../api/detalleOrdenCompra";

export default function DetalleDialog({
  visible,
  onHide,
  detalle,
  ordenCompraId,
  productos,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    precioUnitario: 0,
    subtotal: 0,
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detalle) {
      setFormData({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
        observaciones: detalle.observaciones || "",
      });
    } else {
      setFormData({
        productoId: null,
        cantidad: 0,
        precioUnitario: 0,
        subtotal: 0,
        observaciones: "",
      });
    }
  }, [detalle, visible]);

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    if (field === "cantidad" || field === "precioUnitario") {
      const cantidad = field === "cantidad" ? value : newFormData.cantidad;
      const precio = field === "precioUnitario" ? value : newFormData.precioUnitario;
      newFormData.subtotal = cantidad * precio;
    }

    setFormData(newFormData);
  };

  const handleSave = async () => {
    if (!formData.productoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto",
      });
      return;
    }

    if (formData.cantidad <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "La cantidad debe ser mayor a 0",
      });
      return;
    }

    if (formData.precioUnitario <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "El precio unitario debe ser mayor a 0",
      });
      return;
    }

    setSaving(true);
    try {
      if (detalle) {
        await actualizarDetalleOrdenCompra(detalle.id, formData);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleOrdenCompra({
          ...formData,
          ordenCompraId,
        });
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Detalle creado correctamente",
        });
      }
      onSaveSuccess();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo guardar el detalle",
      });
    }
    setSaving(false);
  };

  return (
    <Dialog
      header={detalle ? "Editar Detalle" : "Nuevo Detalle"}
      visible={visible}
      style={{ width: "600px" }}
      onHide={onHide}
      modal
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="productoId">Producto*</label>
          <Dropdown
            id="productoId"
            value={formData.productoId}
            options={productos.map((p) => ({
              label: p.descripcionArmada,
              value: Number(p.id),
            }))}
            onChange={(e) => handleChange("productoId", e.value)}
            placeholder="Seleccionar producto"
            filter
          />
        </div>

        <div className="field">
          <label htmlFor="cantidad">Cantidad*</label>
          <InputNumber
            id="cantidad"
            value={formData.cantidad}
            onValueChange={(e) => handleChange("cantidad", e.value)}
            min={0}
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>

        <div className="field">
          <label htmlFor="precioUnitario">Precio Unitario*</label>
          <InputNumber
            id="precioUnitario"
            value={formData.precioUnitario}
            onValueChange={(e) => handleChange("precioUnitario", e.value)}
            mode="currency"
            currency="PEN"
            locale="es-PE"
            min={0}
          />
        </div>

        <div className="field">
          <label htmlFor="subtotal">Subtotal</label>
          <InputNumber
            id="subtotal"
            value={formData.subtotal}
            mode="currency"
            currency="PEN"
            locale="es-PE"
            disabled
          />
        </div>

        <div className="field">
          <label htmlFor="observaciones">Observaciones</label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onHide}
            disabled={saving}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            className="p-button-primary"
            onClick={handleSave}
            loading={saving}
          />
        </div>
      </div>
    </Dialog>
  );
}