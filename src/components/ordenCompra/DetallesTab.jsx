// src/components/ordenCompra/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
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
}) {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);

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

  const totalGeneral = detalles.reduce(
    (sum, det) => sum + (Number(det.subtotal) || 0),
    0
  );

  return (
    <div>
      <div className="mb-3 flex justify-content-between align-items-center">
        <Button
          label="Agregar Detalle"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleAdd}
          disabled={!puedeEditar}
        />
        <div className="text-xl font-bold">
          Total: S/ {totalGeneral.toFixed(2)}
        </div>
      </div>

      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
      >
        <Column field="producto.nombre" header="Producto" />
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
        onSaveSuccess={handleSaveSuccess}
        toast={toast}
      />
    </div>
  );
}