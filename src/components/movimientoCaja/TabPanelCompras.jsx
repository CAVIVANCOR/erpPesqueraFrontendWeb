// src/components/movimientoCaja/TabPanelCompras.jsx
/**
 * TabPanel para Movimientos de Caja - Módulo Compras
 * Muestra y valida los detalles de entregas a rendir de Compras
 * 
 * @author ERP Megui
 */

import React from "react";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import DetEntregaRendirCompras from "../requerimientoCompra/DetEntregaRendirCompras";

export default function TabPanelCompras({
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
      <DetEntregaRendirCompras
        entregaARendir={entregaARendir}
        movimientos={movimientos}
        personal={personal}
        centrosCosto={centrosCosto}
        tiposMovimiento={tiposMovimiento}
        entidadesComerciales={entidadesComerciales}
        monedas={monedas}
        tiposDocumento={tiposDocumento}
        productos={productos}
        requerimientoCompraAprobado={true}
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
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "#1e3a8a",
              }}
            >
              S/ {totalAsignaciones.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#fee2e2",
              borderRadius: "6px",
              border: "1px solid #fca5a5",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#991b1b" }}>
              Total Gastos
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "#7f1d1d",
              }}
            >
              S/ {totalGastos.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: saldo >= 0 ? "#d1fae5" : "#fee2e2",
              borderRadius: "6px",
              border: `1px solid ${saldo >= 0 ? "#6ee7b7" : "#fca5a5"}`,
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: saldo >= 0 ? "#065f46" : "#991b1b",
              }}
            >
              Saldo
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: saldo >= 0 ? "#064e3b" : "#7f1d1d",
              }}
            >
              S/ {saldo.toFixed(2)}
            </div>
          </div>
        </div>

        <Button
          label="Aplicar Validación"
          icon="pi pi-check-circle"
          className="p-button-success"
          onClick={onAplicarValidacion}
          disabled={!selectedMovimiento}
          style={{
            fontSize: "1rem",
            padding: "0.75rem 1.5rem",
            fontWeight: "bold",
          }}
        />
      </div>
    </>
  );
}