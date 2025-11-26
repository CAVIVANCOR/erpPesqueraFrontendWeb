// src/components/preFactura/DetallePreFacturaCard.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { confirmDialog } from "primereact/confirmdialog";
import {
  getAllDetallePreFactura,
  createDetallePreFactura,
  updateDetallePreFactura,
  deleteDetallePreFactura,
} from "../../api/detallePreFactura";

const DetallePreFacturaCard = ({
  preFacturaId,
  detalles = [],
  setDetalles,
  productos = [],
  disabled = false,
  toast,
  onCountChange,
  monedasOptions = [],
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    precioUnitario: 0,
    descuento: 0,
    observaciones: "",
  });

  useEffect(() => {
    if (preFacturaId) {
      cargarDetalles();
    }
  }, [preFacturaId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(detalles.length);
    }
  }, [detalles, onCountChange]);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getAllDetallePreFactura();
      const detallesFiltrados = data.filter(
        (d) => Number(d.preFacturaId) === Number(preFacturaId)
      );
      setDetalles(detallesFiltrados);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar detalles",
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setEditingDetalle(null);
    setFormData({
      productoId: null,
      cantidad: 0,
      precioUnitario: 0,
      descuento: 0,
      observaciones: "",
    });
    setShowDialog(true);
  };

  const abrirDialogoEdicion = (detalle) => {
    setEditingDetalle(detalle);
    setFormData({
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      descuento: detalle.descuento || 0,
      observaciones: detalle.observaciones || "",
    });
    setShowDialog(true);
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        preFacturaId: Number(preFacturaId),
      };

      if (editingDetalle) {
        await updateDetallePreFactura(editingDetalle.id, payload);
        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await createDetallePreFactura(payload);
        toast?.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Detalle creado correctamente",
        });
      }

      setShowDialog(false);
      cargarDetalles();
    } catch (error) {
      console.error("Error al guardar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar detalle",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: "¿Está seguro de eliminar este detalle?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarDetalle(detalle.id),
    });
  };

  const eliminarDetalle = async (id) => {
    try {
      await deleteDetallePreFactura(id);
      toast?.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Detalle eliminado correctamente",
      });
      cargarDetalles();
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar detalle",
      });
    }
  };

  const productoTemplate = (rowData) => {
    return rowData.producto?.nombre || "N/A";
  };

  const precioTemplate = (rowData) => {
    const simbolo = monedasOptions.find(m => m.value === rowData.monedaId)?.simbolo || "S/";
    return `${simbolo} ${Number(rowData.precioUnitario || 0).toFixed(2)}`;
  };

  const subtotalTemplate = (rowData) => {
    const subtotal = Number(rowData.cantidad || 0) * Number(rowData.precioUnitario || 0);
    const simbolo = monedasOptions.find(m => m.value === rowData.monedaId)?.simbolo || "S/";
    return `${simbolo} ${subtotal.toFixed(2)}`;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => abrirDialogoEdicion(rowData)}
          disabled={disabled}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminacion(rowData)}
          disabled={disabled}
        />
      </div>
    );
  };

  return (
    <div className="detalle-pre-factura-card">
      <div className="flex justify-content-between align-items-center mb-3">
        <h3>Detalles de Pre-Factura</h3>
        <Button
          label="Agregar Detalle"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
          disabled={disabled || !preFacturaId}
          className="p-button-success"
        />
      </div>

      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
        size="small"
        showGridlines
      >
        <Column field="id" header="ID" style={{ width: "80px" }} />
        <Column
          field="productoId"
          header="Producto"
          body={productoTemplate}
          style={{ minWidth: "200px" }}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          style={{ width: "120px" }}
        />
        <Column
          field="precioUnitario"
          header="Precio Unit."
          body={precioTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="descuento"
          header="Descuento"
          body={(row) => `${Number(row.descuento || 0).toFixed(2)}%`}
          style={{ width: "100px" }}
        />
        <Column
          header="Subtotal"
          body={subtotalTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{ width: "600px" }}
        header={editingDetalle ? "Editar Detalle" : "Nuevo Detalle"}
        modal
        onHide={() => setShowDialog(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="productoId">Producto *</label>
            <Dropdown
              id="productoId"
              value={formData.productoId}
              options={productos.map((p) => ({
                label: p.nombre,
                value: Number(p.id),
              }))}
              onChange={(e) =>
                setFormData({ ...formData, productoId: e.value })
              }
              placeholder="Seleccionar producto"
              filter
            />
          </div>

          <div className="field">
            <label htmlFor="cantidad">Cantidad *</label>
            <InputNumber
              id="cantidad"
              value={formData.cantidad}
              onValueChange={(e) =>
                setFormData({ ...formData, cantidad: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>

          <div className="field">
            <label htmlFor="precioUnitario">Precio Unitario *</label>
            <InputNumber
              id="precioUnitario"
              value={formData.precioUnitario}
              onValueChange={(e) =>
                setFormData({ ...formData, precioUnitario: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>

          <div className="field">
            <label htmlFor="descuento">Descuento (%)</label>
            <InputNumber
              id="descuento"
              value={formData.descuento}
              onValueChange={(e) =>
                setFormData({ ...formData, descuento: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
            />
          </div>

          <div className="field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={() => setShowDialog(false)}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            className="p-button-primary"
            onClick={handleGuardar}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default DetallePreFacturaCard;