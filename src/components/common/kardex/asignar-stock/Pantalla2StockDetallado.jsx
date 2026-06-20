// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\Pantalla2StockDetallado.jsx

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { formatearFecha } from "../../../../utils/utils";

/**
 * ============================================================================
 * PANTALLA 2: Stock Detallado
 * ============================================================================
 * 
 * Muestra lotes detallados del almacén seleccionado con selección y FIFO.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function Pantalla2StockDetallado({
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  cantidadAsignada,
  almacenSeleccionado,
  stockDetallado,
  lotesSeleccionados,
  loading,
  onToggleLote,
  onCambiarCantidad,
  onAsignarAutomaticoFIFO
}) {
  // ============================================================================
  // TEMPLATES DE COLUMNAS
  // ============================================================================

  const checkboxTemplate = (rowData) => {
    const isChecked = lotesSeleccionados.some(l => l.id === rowData.id);
    return (
      <Checkbox
        checked={isChecked}
        onChange={(e) => onToggleLote(rowData, e.checked)}
      />
    );
  };

  const loteTemplate = (rowData) => (
    <div>
      <div style={{ fontWeight: "bold" }}>{rowData.lote || "SIN LOTE"}</div>
      <div style={{ fontSize: "0.85em", color: "#666" }}>
        {rowData.ubicacionFisica?.codigo || "-"}
      </div>
    </div>
  );

  const fechaIngresoTemplate = (rowData) => (
    <div style={{ fontSize: "0.9em" }}>
      {formatearFecha(rowData.fechaIngreso, "-")}
    </div>
  );

  const fechaVencTemplate = (rowData) => (
    <div style={{ fontSize: "0.9em" }}>
      {formatearFecha(rowData.fechaVencimiento, "-")}
    </div>
  );

  const estadoTemplate = (rowData) => (
    <Tag
      value={rowData.estado?.nombre || "N/A"}
      severity="success"
      style={{ fontSize: "0.85em" }}
    />
  );

  const stockDisponibleTemplate = (rowData) => (
    <div style={{ textAlign: "right", fontWeight: "bold" }}>
      {new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      }).format(rowData.saldoCantidad || 0)}
    </div>
  );

  const cantidadTomarTemplate = (rowData) => {
    const loteSeleccionado = lotesSeleccionados.find(l => l.id === rowData.id);
    
    if (!loteSeleccionado) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <InputNumber
        value={loteSeleccionado.cantidadAsignada}
        onValueChange={(e) => onCambiarCantidad(rowData, e.value)}
        min={0}
        max={Number(rowData.saldoCantidad || 0)}
        showButtons
        buttonLayout="horizontal"
        decrementButtonClassName="p-button-danger"
        incrementButtonClassName="p-button-success"
        style={{ width: "120px" }}
      />
    );
  };

  // ============================================================================
  // CÁLCULOS
  // ============================================================================

  const totalSeleccionado = lotesSeleccionados.reduce(
    (sum, l) => sum + Number(l.cantidadAsignada || 0),
    0
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Divider align="left">
        <div className="inline-flex align-items-center">
          <i className="pi pi-list mr-2"></i>
          <b>Stock Detallado - {almacenSeleccionado?.almacenNombre}</b>
        </div>
      </Divider>

      {/* Información */}
      <div style={{
        backgroundColor: "#e3f2fd",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem"
      }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>Producto:</strong> {productoNombre}
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div>
            <strong>Necesario:</strong> {cantidadRequerida} {unidadMedida}
          </div>
          <div>
            <strong>Ya asignado:</strong> {cantidadAsignada} {unidadMedida}
          </div>
          <div>
            <strong>Falta:</strong> {Math.max(0, cantidadRequerida - cantidadAsignada)} {unidadMedida}
          </div>
        </div>
      </div>

      {/* Botón FIFO */}
      <div style={{ marginBottom: "1rem", textAlign: "right" }}>
        <Button
          label="Asignar Automático (FIFO)"
          icon="pi pi-bolt"
          className="p-button-warning p-button-sm"
          onClick={onAsignarAutomaticoFIFO}
        />
      </div>

      {/* Tabla de lotes */}
      <DataTable
        value={stockDetallado}
        loading={loading}
        emptyMessage="No hay lotes disponibles"
        size="small"
        stripedRows
        scrollable
        scrollHeight="400px"
      >
        <Column
          header="☑"
          body={checkboxTemplate}
          style={{ width: "50px", textAlign: "center" }}
        />
        <Column header="Lote / Ubicación" body={loteTemplate} style={{ width: "150px" }} />
        <Column header="F. Ingreso" body={fechaIngresoTemplate} style={{ width: "100px" }} />
        <Column header="F. Venc." body={fechaVencTemplate} style={{ width: "100px" }} />
        <Column header="Estado" body={estadoTemplate} style={{ width: "120px" }} />
        <Column header="Stock" body={stockDisponibleTemplate} style={{ width: "100px", textAlign: "right" }} />
        <Column header="Tomar" body={cantidadTomarTemplate} style={{ width: "150px", textAlign: "center" }} />
      </DataTable>

      {/* Resumen de selección */}
      {lotesSeleccionados.length > 0 && (
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f1f8e9",
          borderRadius: "8px"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            Total seleccionado: {totalSeleccionado} {unidadMedida}
          </div>
          <div style={{ fontSize: "0.9em", color: "#666" }}>
            {lotesSeleccionados.length} lote(s) seleccionado(s)
          </div>
        </div>
      )}
    </>
  );
}