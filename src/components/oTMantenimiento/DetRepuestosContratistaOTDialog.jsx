/**
 * DetRepuestosContratistaOTDialog.jsx
 *
 * Diálogo para crear o editar un ítem del presupuesto de contratista
 * (equivalente a DetalleDialog en OrdenCompra).
 *
 * Props:
 *  visible         {boolean}
 *  onHide          {function}
 *  presupuesto     {Object}  DetContratistasOT padre
 *  empresaId       {number|string} Empresa de la OT
 *  monedas         {Array}
 *  detalle         {Object|null}   Ítem en edición; null para alta
 *  numeroLineaSugerido {number}    Número de línea para un ítem nuevo (1 por defecto)
 *  onSaveSuccess   {function()}    Callback tras guardar exitoso
 */

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DetRepuestosContratistaOTForm from "./DetRepuestosContratistaOTForm";
import {
  createDetRepuestoContratistaOT,
  updateDetRepuestoContratistaOT,
} from "../../api/detRepuestosContratistaOT";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const formularioInicial = (presupuestoId, monedaId, numeroLinea = 1) => ({
  detContratistaOTId: Number(presupuestoId),
  numeroLinea: Number(numeroLinea),
  productoId: null,
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
  total: 0,
  monedaId: Number(monedaId),
});

export default function DetRepuestosContratistaOTDialog({
  visible,
  onHide,
  presupuesto,
  empresaId,
  monedas = [],
  detalle = null,
  numeroLineaSugerido = 1,
  onSaveSuccess,
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(
    formularioInicial(presupuesto?.id, presupuesto?.monedaId),
  );

  useEffect(() => {
    if (!visible || !presupuesto) return;

    if (detalle) {
      setFormData({
        id: detalle.id,
        detContratistaOTId: Number(detalle.detContratistaOTId),
        numeroLinea: detalle.numeroLinea,
        productoId: Number(detalle.productoId),
        descripcion: detalle.descripcion || "",
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(detalle.precioUnitario),
        total: Number(detalle.total),
        monedaId: Number(detalle.monedaId),
      });
    } else {
      setFormData(formularioInicial(presupuesto.id, presupuesto.monedaId, numeroLineaSugerido));
    }
  }, [visible, presupuesto, detalle, numeroLineaSugerido]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const actualizado = { ...prev, [field]: value };
      if (field === "cantidad" || field === "precioUnitario") {
        actualizado.total =
          Number(actualizado.cantidad || 0) *
          Number(actualizado.precioUnitario || 0);
      }
      return actualizado;
    });
  };

  const validar = () => {
    if (!formData.productoId) return "Debe seleccionar un producto/servicio";
    if (!formData.descripcion?.trim()) return "Debe ingresar una descripción";
    if (
      Number(formData.cantidad) <= 0 ||
      Number(formData.precioUnitario) < 0
    )
      return "La cantidad debe ser mayor a cero y el precio mayor o igual a cero";
    return null;
  };

  const handleSave = async () => {
    const mensaje = validar();
    if (mensaje) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: mensaje,
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        total: Number(formData.cantidad) * Number(formData.precioUnitario),
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      if (detalle) {
        await updateDetRepuestoContratistaOT(detalle.id, payload);
      } else {
        await createDetRepuestoContratistaOT(payload);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: detalle
          ? "Ítem actualizado correctamente"
          : "Ítem creado correctamente",
        life: 2000,
      });

      if (onSaveSuccess) onSaveSuccess();
      onHide();
    } catch (error) {
      console.error("Error al guardar ítem:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.mensaje || "Error al guardar el ítem",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        label={detalle ? "Actualizar" : "Guardar"}
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleSave}
        loading={saving}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        detalle
          ? "Editar Ítem del Presupuesto"
          : "Nuevo Ítem del Presupuesto"
      }
      style={{ width: "95vw", maxWidth: "900px" }}
      modal
      className="p-fluid"
      footer={footer}
    >
      <Toast ref={toast} />
      <DetRepuestosContratistaOTForm
        formData={formData}
        onChange={handleChange}
        empresaId={empresaId}
        monedas={monedas}
      />
    </Dialog>
  );
}
