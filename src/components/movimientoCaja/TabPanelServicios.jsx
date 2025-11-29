// src/components/movimientoCaja/TabPanelServicios.jsx
/**
 * TabPanel para Movimientos de Caja - Módulo Servicios (Contratos de Servicios)
 * Muestra y valida los detalles de entregas a rendir de Contratos de Servicios
 * 
 * @author ERP Megui
 */

import React from "react";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import DetEntregaRendirContrato from "../ContratoServicio/DetEntregaRendirContrato";

export default function TabPanelServicios({
  entregaARendir,
  movimientos,
  personal,
  centrosCosto,
  tiposMovimiento,
  entidadesComerciales,
  monedas,
  tiposDocumento,
  productos,
  loading,
  selectedMovimiento,
  onSelectionChange,
  onDataChange,
  onAplicarValidacion,
  toast,
}) {
  // Calcular totales
  const totalAsignaciones = movimientos
    .filter((m) => {
      const tipoMov = tiposMovimiento.find(
        (tm) => Number(tm.id) === Number(m.tipoMovimientoId)
      );
      return tipoMov?.esIngreso === true;
    })
    .reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const totalGastos = movimientos
    .filter((m) => {
      const tipoMov = tiposMovimiento.find(
        (tm) => Number(tm.id) === Number(m.tipoMovimientoId)
      );
      return tipoMov?.esIngreso === false;
    })
    .reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const saldo = totalAsignaciones - totalGastos;

  return (
    <>
      <DetEntregaRendirContrato
        entregaARendir={entregaARendir}
        movimientos={movimientos}
        personal={personal}
        centrosCosto={centrosCosto}
        tiposMovimiento={tiposMovimiento}
        entidadesComerciales={entidadesComerciales}
        monedas={monedas}
        tiposDocumento={tiposDocumento}
        productos={productos}
        contratoServicioAprobado={true}
        loading={loading}
        selectedMovimientos={selectedMovimiento}
        onSelectionChange={onSelectionChange}
        onDataChange={onDataChange}
      />

      {/* Botón Aplicar con Resumen */}
      <div
        className="flex justify-content-between align-items-center mt-3 mx-4 p-3"
        style={{
          backgroundColor: "#f0f9ff",
          borderRadius: "8px",
          border: "2px solid #3b82f6",
          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.1)",
        }}
      >
        <div>
          <strong style={{ fontSize: "1.1rem", color: "#1e40af" }}>
            Registro seleccionado:
          </strong>{" "}
          <Badge
            value={selectedMovimiento ? "1" : "0"}
            severity={selectedMovimiento ? "success" : "warning"}
            style={{ fontSize: "1rem" }}
          />
        </div>

        <div className="flex gap-3">
          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dbeafe",
              borderRadius: "6px",
              border: "1px solid #93c5fd",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>
              Total Asignaciones
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#059669",
              }}
            >
              S/ {totalAsignaciones.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dbeafe",
              borderRadius: "6px",
              border: "1px solid #93c5fd",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>
              Total Gastos
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#dc2626",
              }}
            >
              S/ {totalGastos.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dbeafe",
              borderRadius: "6px",
              border: "1px solid #93c5fd",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>Saldo</div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: saldo >= 0 ? "#059669" : "#dc2626",
              }}
            >
              S/ {saldo.toFixed(2)}
            </div>
          </div>

          <Button
            label="Aplicar"
            icon="pi pi-check"
            className="p-button-success"
            onClick={onAplicarValidacion}
            disabled={!selectedMovimiento}
            style={{
              fontWeight: "bold",
              fontSize: "1rem",
              padding: "0.75rem 2rem",
            }}
          />
        </div>
      </div>
    </>
  );
}
