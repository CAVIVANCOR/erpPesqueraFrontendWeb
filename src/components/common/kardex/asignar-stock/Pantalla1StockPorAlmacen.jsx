// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\Pantalla1StockPorAlmacen.jsx

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { ProgressBar } from "primereact/progressbar";
import { contarAlmacenesUnicos } from "./asignarStockUtils";

/**
 * ============================================================================
 * PANTALLA 1: Stock por Almacén
 * ============================================================================
 * 
 * Muestra resumen de stock agrupado por almacén con progreso de asignación.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function Pantalla1StockPorAlmacen({
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  cantidadAsignada,
  porcentajeAsignado,
  asignaciones,
  stockPorAlmacen,
  loading,
  onSeleccionarAlmacen
}) {
  // ============================================================================
  // TEMPLATES DE COLUMNAS
  // ============================================================================

  const almacenTemplate = (rowData) => (
    <div style={{ fontWeight: "bold" }}>
      {rowData.almacenNombre}
    </div>
  );

  const cantidadTemplate = (rowData) => (
    <div style={{ textAlign: "right", fontWeight: "bold" }}>
      {new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      }).format(rowData.cantidadTotal || 0)}
      <div style={{ fontSize: "0.85em", color: "#666" }}>{unidadMedida}</div>
    </div>
  );

  const pesoTemplate = (rowData) => (
    <div style={{ textAlign: "right" }}>
      {new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(rowData.pesoTotal || 0)}
      <div style={{ fontSize: "0.85em", color: "#666" }}>kg</div>
    </div>
  );

  const lotesTemplate = (rowData) => (
    <Tag value={`${rowData.numLotes} lote(s)`} severity="info" />
  );

  const accionTemplate = (rowData) => (
    <Button
      label="Seleccionar"
      icon="pi pi-arrow-right"
      className="p-button-sm p-button-info"
      onClick={() => onSeleccionarAlmacen(rowData)}
    />
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Divider align="left">
        <div className="inline-flex align-items-center">
          <i className="pi pi-box mr-2"></i>
          <b>Stock por Almacén</b>
        </div>
      </Divider>

      {/* Información del producto */}
      <div style={{
        backgroundColor: "#f8f9fa",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem"
      }}>
        <div style={{ fontSize: "1.1em", fontWeight: "bold", marginBottom: "0.5rem" }}>
          📦 {productoNombre}
        </div>
        <div style={{ fontSize: "0.95em", color: "#666" }}>
          Cantidad requerida: <strong>{cantidadRequerida} {unidadMedida}</strong>
        </div>
      </div>

      {/* Progreso */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5rem"
        }}>
          <span>Progreso de asignación:</span>
          <span style={{ fontWeight: "bold" }}>
            {cantidadAsignada} / {cantidadRequerida} {unidadMedida} ({porcentajeAsignado.toFixed(1)}%)
          </span>
        </div>
        <ProgressBar
          value={porcentajeAsignado}
          showValue={false}
          color={porcentajeAsignado >= 100 ? "#4CAF50" : "#2196F3"}
        />
      </div>

      {/* Asignaciones actuales */}
      {asignaciones.length > 0 && (
        <Message
          severity="success"
          text={`✅ ${asignaciones.length} lote(s) asignado(s) de ${contarAlmacenesUnicos(asignaciones)} almacén(es)`}
          style={{ marginBottom: "1rem", width: "100%" }}
        />
      )}

      {/* Tabla de almacenes */}
      <DataTable
        value={stockPorAlmacen}
        loading={loading}
        emptyMessage="No hay stock disponible"
        size="small"
        stripedRows
      >
        <Column header="Almacén" body={almacenTemplate} style={{ width: "30%" }} />
        <Column header="Cantidad" body={cantidadTemplate} style={{ width: "20%", textAlign: "right" }} />
        <Column header="Peso" body={pesoTemplate} style={{ width: "20%", textAlign: "right" }} />
        <Column header="Lotes" body={lotesTemplate} style={{ width: "15%", textAlign: "center" }} />
        <Column header="Acción" body={accionTemplate} style={{ width: "15%", textAlign: "center" }} />
      </DataTable>
    </>
  );
}