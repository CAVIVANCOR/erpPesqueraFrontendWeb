// src/components/preFactura/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { confirmDialog } from "primereact/confirmdialog";
import {
  getDetallesPreFactura,
  crearDetallePreFactura,
  actualizarDetallePreFactura,
  eliminarDetallePreFactura,
} from "../../api/detallePreFactura";

export default function DetallesTab({
  preFacturaId,
  productos,
  empresaId,
  puedeEditar,
  toast,
  onCountChange,
  readOnly = false,
}) {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [detalleActual, setDetalleActual] = useState({
    productoId: null,
    cantidad: 1,
    precioUnitario: 0,
  });

  // Cargar detalles cuando cambie preFacturaId
  useEffect(() => {
    if (preFacturaId) {
      cargarDetalles();
    } else {
      setDetalles([]);
      if (onCountChange) onCountChange(0);
    }
  }, [preFacturaId]);

  const cargarDetalles = async () => {
    if (!preFacturaId) return;

    setLoading(true);
    try {
      const data = await getDetallesPreFactura(preFacturaId);
      setDetalles(data);
      if (onCountChange) onCountChange(data.length);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los detalles",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    if (!preFacturaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la pre-factura antes de agregar detalles",
        life: 3000,
      });
      return;
    }

    setDetalleActual({
      productoId: null,
      cantidad: 1,
      precioUnitario: 0,
    });
    setEditando(false);
    setDialogVisible(true);
  };

  const abrirDialogoEditar = (detalle) => {
    setDetalleActual({
      id: detalle.id,
      productoId: Number(detalle.productoId),
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
    });
    setEditando(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDetalleActual({
      productoId: null,
      cantidad: 1,
      precioUnitario: 0,
    });
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!detalleActual.productoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto",
        life: 3000,
      });
      return;
    }

    if (!detalleActual.cantidad || detalleActual.cantidad <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "La cantidad debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    if (!detalleActual.precioUnitario || detalleActual.precioUnitario <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El precio unitario debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        preFacturaId: Number(preFacturaId),
        productoId: Number(detalleActual.productoId),
        cantidad: Number(detalleActual.cantidad),
        precioUnitario: Number(detalleActual.precioUnitario),
      };

      if (editando) {
        await actualizarDetallePreFactura(detalleActual.id, data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetallePreFactura(data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle agregado correctamente",
          life: 3000,
        });
      }

      cerrarDialogo();
      await cargarDetalles();
    } catch (error) {
      console.error("Error al guardar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudo guardar el detalle",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el producto "${detalle.producto?.nombre || "N/A"}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: () => handleEliminar(detalle.id),
    });
  };

  const handleEliminar = async (detalleId) => {
    setLoading(true);
    try {
      await eliminarDetallePreFactura(detalleId);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Detalle eliminado correctamente",
        life: 3000,
      });
      await cargarDetalles();
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el detalle",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por empresaId
  const productosFiltrados = productos.filter(
    (p) => Number(p.empresaId) === Number(empresaId)
  );

  const productosOptions = productosFiltrados.map((p) => ({
    label: `${p.codigo} - ${p.nombre}`,
    value: Number(p.id),
  }));

  // Templates de columnas
  const productoTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "500" }}>
          {rowData.producto?.nombre || "N/A"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          Código: {rowData.producto?.codigo || "N/A"}
        </div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(rowData.cantidad)}
      </div>
    );
  };

  const precioTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        S/{" "}
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(rowData.precioUnitario)}
      </div>
    );
  };

  const subtotalTemplate = (rowData) => {
    const subtotal = Number(rowData.cantidad) * Number(rowData.precioUnitario);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", color: "#2196F3" }}>
        S/{" "}
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(subtotal)}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  // Footer del diálogo
  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={cerrarDialogo}
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleGuardar}
        disabled={loading}
        loading={loading}
      />
    </div>
  );

  return (
    <div>
      {/* Botón para agregar nuevo detalle */}
      <div style={{ marginBottom: "1rem" }}>
        <Button
          label="Agregar Producto"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
          disabled={!puedeEditar || readOnly || !preFacturaId}
          tooltip={
            !preFacturaId
              ? "Debe guardar la pre-factura primero"
              : readOnly
              ? "Modo solo lectura"
              : ""
          }
        />
      </div>

      {/* Tabla de detalles */}
      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay productos agregados"
        size="small"
        showGridlines
        stripedRows
      >
        <Column
          field="producto.nombre"
          header="Producto"
          body={productoTemplate}
          style={{ minWidth: "250px" }}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          body={cantidadTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="precioUnitario"
          header="Precio Unit."
          body={precioTemplate}
          style={{ width: "130px" }}
        />
        <Column
          header="Subtotal"
          body={subtotalTemplate}
          style={{ width: "130px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      {/* Diálogo para agregar/editar detalle */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "500px" }}
        header={editando ? "Editar Detalle" : "Agregar Detalle"}
        modal
        footer={dialogFooter}
        onHide={cerrarDialogo}
      >
        <div className="p-fluid">
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="productoId">Producto *</label>
            <Dropdown
              id="productoId"
              value={detalleActual.productoId}
              options={productosOptions}
              onChange={(e) =>
                setDetalleActual({ ...detalleActual, productoId: e.value })
              }
              placeholder="Seleccionar producto"
              filter
              disabled={loading || !empresaId}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="cantidad">Cantidad *</label>
            <InputNumber
              id="cantidad"
              value={detalleActual.cantidad}
              onValueChange={(e) =>
                setDetalleActual({ ...detalleActual, cantidad: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={3}
              min={0.001}
              disabled={loading}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="precioUnitario">Precio Unitario *</label>
            <InputNumber
              id="precioUnitario"
              value={detalleActual.precioUnitario}
              onValueChange={(e) =>
                setDetalleActual({ ...detalleActual, precioUnitario: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={6}
              min={0}
              prefix="S/ "
              disabled={loading}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          {/* Mostrar subtotal calculado */}
          {detalleActual.cantidad && detalleActual.precioUnitario && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
              >
                <span>Subtotal:</span>
                <span style={{ color: "#2196F3" }}>
                  S/{" "}
                  {new Intl.NumberFormat("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    Number(detalleActual.cantidad) *
                      Number(detalleActual.precioUnitario)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}