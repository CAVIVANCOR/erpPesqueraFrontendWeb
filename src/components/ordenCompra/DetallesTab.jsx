// src/components/ordenCompra/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import DetalleDialog from "./DetalleDialog";
import {
  getDetallesOrdenCompra,
  eliminarDetalleOrdenCompra,
} from "../../api/detalleOrdenCompra";

export default function DetallesTab({
  ordenCompraId,
  productos,
  puedeEditar,
  toast,
  onCountChange,
  subtotal = 0,
  totalIGV = 0,
  total = 0,
  porcentajeIGV = 0,
  monedas = [],
  monedaId = null,
  readOnly = false,
}) {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);

  // Construir datosGenerales con la moneda seleccionada
  const monedaSeleccionada = monedas.find(m => Number(m.id) === Number(monedaId));
  const datosGenerales = {
    moneda: monedaSeleccionada
  };

  useEffect(() => {
    if (ordenCompraId) {
      cargarDetalles();
    }
  }, [ordenCompraId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(detalles.length);
    }
  }, [detalles, onCountChange]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      const data = await getDetallesOrdenCompra(ordenCompraId);
      setDetalles(data);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingDetalle(null);
    setShowDialog(true);
  };

  const handleEdit = (detalle) => {
    setEditingDetalle(detalle);
    setShowDialog(true);
  };

  const handleDelete = async (detalle) => {
    if (!window.confirm("¿Está seguro de eliminar este detalle?")) return;

    try {
      await eliminarDetalleOrdenCompra(detalle.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Detalle eliminado correctamente",
      });
      cargarDetalles();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo eliminar el detalle",
      });
    }
  };

  const handleSaveSuccess = () => {
    setShowDialog(false);
    cargarDetalles();
  };

  const precioTemplate = (rowData) => {
    return rowData.precioUnitario
      ? `S/ ${Number(rowData.precioUnitario).toFixed(2)}`
      : "";
  };

  const subtotalTemplate = (rowData) => {
    return rowData.subtotal ? `S/ ${Number(rowData.subtotal).toFixed(2)}` : "";
  };

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        disabled={!puedeEditar}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        disabled={!puedeEditar}
      />
    </div>
  );

  // Helper para obtener código de moneda (ISO)
  const getCodigoMoneda = () => {
    if (!monedaId) return "PEN";
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.codigoSunat || "PEN";
  };

  return (
    <div>
      {/* FILA: TOTALES Y BOTÓN */}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: 5,
          padding: "5px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "2px solid #dee2e6",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ opacity: 0 }}>.</label>
          <Button
            label="Agregar Detalle"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleAdd}
            disabled={!puedeEditar}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Valor Compra</label>
          <InputNumber
            value={subtotal || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: "#fff",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>IGV ({porcentajeIGV || 0}%)</label>
          <InputNumber
            value={totalIGV || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: "#fff",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#2196F3" }}>Precio Compra Total</label>
          <InputNumber
            value={total || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.2rem",
              backgroundColor: "#e3f2fd",
              color: "#1976D2",
              textAlign: "right",
            }}
          />
        </div>
      </div>

      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
      >
        <Column field="producto.descripcionArmada" header="Producto" />
        <Column field="cantidad" header="Cantidad" style={{ width: "100px" }} />
        <Column
          field="producto.unidadMedida.nombre"
          header="Unidad"
          style={{ width: "100px" }}
        />
        <Column
          field="precioUnitario"
          header="Precio Unit."
          body={precioTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="subtotal"
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

      <DetalleDialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        detalle={editingDetalle}
        ordenCompraId={ordenCompraId}
        productos={productos}
        datosGenerales={datosGenerales}
        onSaveSuccess={handleSaveSuccess}
        toast={toast}
      />
    </div>
  );
}