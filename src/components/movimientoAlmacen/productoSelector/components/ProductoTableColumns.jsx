// src/components/movimientoAlmacen/productoSelector/components/ProductoTableColumns.jsx
import React from "react";
import { Button } from "primereact/button";
import { getProductoFromRow, formatNumber, formatDate } from "../utils/productoSelectorHelpers";

/**
 * Templates de columnas para la tabla de productos
 */

export const productoTemplate = (rowData, esIngreso) => {
  const prod = getProductoFromRow(rowData, esIngreso);
  return prod?.descripcionArmada || "-";
};

export const unidadMedidaTemplate = (rowData, esIngreso) => {
  const prod = getProductoFromRow(rowData, esIngreso);
  return prod?.unidadMedida?.nombre || "-";
};

export const saldoTemplate = (rowData, esIngreso) => {
  if (esIngreso) return null;
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontWeight: "bold", color: "#1976d2" }}>
        {formatNumber(rowData.saldoCantidad)}
      </div>
      {rowData.saldoPeso && (
        <div style={{ fontSize: "0.85em", color: "#666" }}>
          {formatNumber(rowData.saldoPeso)} kg
        </div>
      )}
    </div>
  );
};

export const loteTemplate = (rowData, esIngreso) => {
  if (esIngreso) return null;
  return rowData.lote || "-";
};

export const fechasTemplate = (rowData, esIngreso) => {
  if (esIngreso) return null;
  return (
    <div style={{ fontSize: "0.85em" }}>
      {rowData.fechaProduccion && (
        <div>
          <strong>Prod:</strong> {formatDate(rowData.fechaProduccion)}
        </div>
      )}
      {rowData.fechaVencimiento && (
        <div>
          <strong>Venc:</strong> {formatDate(rowData.fechaVencimiento)}
        </div>
      )}
      {rowData.fechaIngreso && (
        <div>
          <strong>Ing:</strong> {formatDate(rowData.fechaIngreso)}
        </div>
      )}
    </div>
  );
};

export const stockTemplate = (rowData, esIngreso) => {
  // Mostrar stock en TODOS los modos según estándares ERP:
  // - INGRESO: Stock actual como referencia
  // - EGRESO/TRANSFERENCIA: Stock disponible como restricción
  const stockValue = esIngreso 
    ? (rowData.stockDisponible || 0) 
    : (rowData.saldoCantidad || 0);
  const pesoValue = esIngreso 
    ? (rowData.pesoDisponible || 0) 
    : (rowData.saldoPeso || 0);

  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontWeight: "bold", color: "#1976d2" }}>
        {formatNumber(stockValue)}
      </div>
      {pesoValue > 0 && (
        <div style={{ fontSize: "0.85em", color: "#666" }}>
          {formatNumber(pesoValue)} kg
        </div>
      )}
    </div>
  );
};

export const accionesTemplate = (rowData, handleSelect) => {
  return (
    <Button
      icon="pi pi-check"
      label="Seleccionar"
      className="p-button-sm p-button-success"
      onClick={() => handleSelect(rowData)}
    />
  );
};