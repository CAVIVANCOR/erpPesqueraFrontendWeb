// src/components/contratoServicio/DetServicioContratoCard.jsx
/**
 * Card de Detalles de Servicios para Contrato de Servicio
 * Patrón profesional ERP Megui
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import DetServicioContratoForm from "./DetServicioContratoForm";
import { formatearNumero } from "../../utils/utils";

export default function DetServicioContratoCard({
  contratoId,
  detalles = [],
  setDetalles,
  productos = [],
  moneda,
  toast,
  isEdit = false,
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setEditingDetalle(null);
    setShowDialog(true);
  };

  const handleEdit = (detalle) => {
    setEditingDetalle(detalle);
    setShowDialog(true);
  };

  const handleDelete = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el servicio "${detalle.producto?.nombre || 'este servicio'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => {
        const nuevosDetalles = detalles.filter((d) => d !== detalle);
        setDetalles(nuevosDetalles);
        toast?.current?.show({
          severity: "success",
          summary: "Eliminado",
          detail: "Servicio eliminado correctamente",
        });
      }
    });
  };

  const handleSave = (detalleData) => {
    if (editingDetalle) {
      // Actualizar detalle existente
      const nuevosDetalles = detalles.map((d) =>
        d === editingDetalle ? detalleData : d
      );
      setDetalles(nuevosDetalles);
      toast?.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Servicio actualizado correctamente",
      });
    } else {
      // Agregar nuevo detalle
      setDetalles([...detalles, detalleData]);
      toast?.current?.show({
        severity: "success",
        summary: "Agregado",
        detail: "Servicio agregado correctamente",
      });
    }
    setShowDialog(false);
    setEditingDetalle(null);
  };

  // Helper para obtener símbolo de moneda
  const getSimboloMoneda = () => {
    return moneda?.codigoSunat === "USD" ? "$" : "S/";
  };

  // Templates de columnas
  const productoTemplate = (rowData) => {
    return rowData.producto?.nombre || "";
  };

  const cantidadTemplate = (rowData) => {
    return formatearNumero(rowData.cantidad || 0, 2);
  };

  const precioTemplate = (rowData) => {
    return `${getSimboloMoneda()} ${formatearNumero(rowData.precioUnitario || 0, 2)}`;
  };

  const totalTemplate = (rowData) => {
    const total = (rowData.cantidad || 0) * (rowData.precioUnitario || 0);
    return `${getSimboloMoneda()} ${formatearNumero(total, 2)}`;
  };

  const kwhTemplate = (rowData) => {
    if (!rowData.aplicaCargoLuz) return "-";
    return formatearNumero(rowData.cantidadKwh || 0, 2);
  };

  const precioKwhTemplate = (rowData) => {
    if (!rowData.aplicaCargoLuz) return "-";
    return `${getSimboloMoneda()} ${formatearNumero(rowData.precioKwh || 0, 4)}`;
  };

  const recargoKwhTemplate = (rowData) => {
    if (!rowData.aplicaCargoLuz) return "-";
    return `${getSimboloMoneda()} ${formatearNumero(rowData.recargoKwh || 0, 4)}`;
  };

  const totalLuzTemplate = (rowData) => {
    if (!rowData.aplicaCargoLuz) return "-";
    const totalLuz = (rowData.cantidadKwh || 0) * ((rowData.precioKwh || 0) + (rowData.recargoKwh || 0));
    return `${getSimboloMoneda()} ${formatearNumero(totalLuz, 2)}`;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Calcular totales
  const calcularTotales = () => {
    let totalServicios = 0;
    let totalLuz = 0;

    detalles.forEach((detalle) => {
      totalServicios += (detalle.cantidad || 0) * (detalle.precioUnitario || 0);
      if (detalle.aplicaCargoLuz) {
        totalLuz += (detalle.cantidadKwh || 0) * ((detalle.precioKwh || 0) + (detalle.recargoKwh || 0));
      }
    });

    return {
      totalServicios,
      totalLuz,
      total: totalServicios + totalLuz,
    };
  };

  const totales = calcularTotales();

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0 }}>
          Servicios del Contrato
          <Badge value={detalles.length} severity="info" style={{ marginLeft: "0.5rem" }} />
        </h3>
        <Button
          label="Agregar Servicio"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleAdd}
        />
      </div>

      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay servicios agregados"
        style={{ fontSize: "12px" }}
        stripedRows
      >
        <Column field="producto.nombre" header="Servicio" body={productoTemplate} />
        <Column field="cantidad" header="Cantidad" body={cantidadTemplate} />
        <Column field="precioUnitario" header="Precio Unit." body={precioTemplate} />
        <Column header="Total" body={totalTemplate} />
        <Column field="cantidadKwh" header="kWh" body={kwhTemplate} />
        <Column field="precioKwh" header="Precio kWh" body={precioKwhTemplate} />
        <Column field="recargoKwh" header="Recargo kWh" body={recargoKwhTemplate} />
        <Column header="Total Luz" body={totalLuzTemplate} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Totales */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div>
          <strong>Total Servicios:</strong>
          <div style={{ fontSize: "1.2rem", color: "#007ad9" }}>
            {getSimboloMoneda()} {formatearNumero(totales.totalServicios, 2)}
          </div>
        </div>
        <div>
          <strong>Total Luz:</strong>
          <div style={{ fontSize: "1.2rem", color: "#007ad9" }}>
            {getSimboloMoneda()} {formatearNumero(totales.totalLuz, 2)}
          </div>
        </div>
        <div>
          <strong>Total General:</strong>
          <div style={{ fontSize: "1.5rem", color: "#28a745", fontWeight: "bold" }}>
            {getSimboloMoneda()} {formatearNumero(totales.total, 2)}
          </div>
        </div>
      </div>

      {/* Dialog del formulario */}
      {showDialog && (
        <DetServicioContratoForm
          visible={showDialog}
          onHide={() => {
            setShowDialog(false);
            setEditingDetalle(null);
          }}
          detalle={editingDetalle}
          onSave={handleSave}
          productos={productos}
          moneda={moneda}
        />
      )}
    </div>
  );
}
