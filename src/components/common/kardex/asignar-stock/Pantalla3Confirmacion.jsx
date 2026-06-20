// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\Pantalla3Confirmacion.jsx

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { formatearFecha } from "../../../../utils/utils";
import { calcularTotales } from "./asignarStockUtils";

/**
 * ============================================================================
 * PANTALLA 3: Confirmación
 * ============================================================================
 * 
 * Muestra resumen final de asignaciones para confirmación.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function Pantalla3Confirmacion({
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  cantidadAsignada,
  porcentajeAsignado,
  asignaciones,
  onEliminarAsignacion
}) {
  // ============================================================================
  // TEMPLATES DE COLUMNAS
  // ============================================================================

  const almacenTemplate = (rowData) => (
    <div style={{ fontWeight: "bold" }}>
      {rowData.almacen?.nombre || `Almacén ${rowData.almacenId}`}
    </div>
  );

  const fechaIngresoTemplate = (rowData) => (
    <div style={{ fontSize: "0.9em" }}>
      {formatearFecha(rowData.fechaIngreso, "-")}
    </div>
  );

  const cantidadAsignadaTemplate = (rowData) => (
    <div style={{ textAlign: "right", fontWeight: "bold", color: "#2196F3" }}>
      {new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      }).format(rowData.cantidadAsignada || 0)}
    </div>
  );

  const pesoAsignadoTemplate = (rowData) => (
    <div style={{ textAlign: "right" }}>
      {new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(rowData.pesoAsignado || 0)} kg
    </div>
  );

  const accionTemplate = (rowData, options) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-sm"
      onClick={() => onEliminarAsignacion(options.rowIndex)}
      tooltip="Eliminar"
    />
  );

  // ============================================================================
  // CÁLCULOS
  // ============================================================================

  const { totalCantidad, totalPeso, totalLotes } = calcularTotales(asignaciones);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Divider align="left">
        <div className="inline-flex align-items-center">
          <i className="pi pi-check-circle mr-2"></i>
          <b>Confirmación de Asignación</b>
        </div>
      </Divider>

      {/* Resumen */}
      <div style={{
        backgroundColor: porcentajeAsignado >= 100 ? "#e8f5e9" : "#fff3e0",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem",
        border: `2px solid ${porcentajeAsignado >= 100 ? "#4CAF50" : "#FF9800"}`
      }}>
        <div style={{ fontSize: "1.1em", fontWeight: "bold", marginBottom: "0.5rem" }}>
          {productoNombre}
        </div>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.95em" }}>
          <div>
            <strong>Requerido:</strong> {cantidadRequerida} {unidadMedida}
          </div>
          <div>
            <strong>Asignado:</strong> {cantidadAsignada} {unidadMedida}
          </div>
          <div>
            <strong>Estado:</strong>{" "}
            {porcentajeAsignado >= 100 ? (
              <Tag value="✅ Completo" severity="success" />
            ) : (
              <Tag value="⚠️ Incompleto" severity="warning" />
            )}
          </div>
        </div>
      </div>

      {/* Tabla de asignaciones */}
      <DataTable
        value={asignaciones}
        emptyMessage="No hay asignaciones"
        size="small"
        stripedRows
        scrollable
        scrollHeight="350px"
      >
        <Column 
          header="#" 
          body={(data, options) => options.rowIndex + 1} 
          style={{ width: "50px" }} 
        />
        <Column header="Almacén" body={almacenTemplate} style={{ width: "150px" }} />
        <Column header="Lote" field="lote" style={{ width: "120px" }} />
        <Column header="F. Ingreso" body={fechaIngresoTemplate} style={{ width: "100px" }} />
        <Column 
          header="Ubicación" 
          body={(r) => r.ubicacionFisica?.codigo || "-"} 
          style={{ width: "80px" }} 
        />
        <Column 
          header="Cantidad" 
          body={cantidadAsignadaTemplate} 
          style={{ width: "100px", textAlign: "right" }} 
        />
        <Column 
          header="Peso" 
          body={pesoAsignadoTemplate} 
          style={{ width: "100px", textAlign: "right" }} 
        />
        <Column 
          header="" 
          body={accionTemplate} 
          style={{ width: "60px", textAlign: "center" }} 
        />
      </DataTable>

      {/* Totales */}
      <div style={{
        marginTop: "1rem",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <div>
          <strong>Total:</strong> {totalLotes} lote(s)
        </div>
        <div>
          <strong>Cantidad Total:</strong> {totalCantidad} {unidadMedida} ({totalPeso.toFixed(2)} kg)
        </div>
      </div>
    </>
  );
}