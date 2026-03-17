/**
 * BotonesReportes.jsx
 * Componente para renderizar los botones de generación de reportes
 */

import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

export const BotonesReportes = ({
  onGenerarReporte,
  readOnly,
  temporadaId,
}) => {
  const reportes = [
    {
      id: "distribucion",
      label: "Reporte Distribución",
      icon: "pi pi-chart-pie",
      severity: "info",
      tooltip: "Generar reporte de distribución de la temporada",
    },
    {
      id: "pesca",
      label: "Reporte Pesca",
      icon: "pi pi-chart-bar",
      severity: "success",
      tooltip: "Generar reporte de pesca de la temporada",
    },
    {
      id: "liquidacionTripulantes",
      label: "Liquidación Tripulantes",
      icon: "pi pi-users",
      severity: "warning",
      tooltip: "Generar reporte de liquidación de tripulantes",
    },
    {
      id: "liquidacionArmadores",
      label: "Liquidación Armadores",
      icon: "pi pi-briefcase",
      severity: "help",
      tooltip: "Generar reporte de liquidación de armadores",
    },
    {
      id: "liquidacionComisionista",
      label: "Liquidación Comisionista",
      icon: "pi pi-percentage",
      severity: "danger",
      tooltip: "Generar reporte de liquidación de comisionista",
    },
    {
      id: "comisionesPMM",
      label: "Comisiones PMM",
      icon: "pi pi-star",
      severity: "secondary",
      tooltip: "Generar reporte de comisiones Patrón, Motorista y Marineros",
    },
    {
      id: "consolidadoPesca",
      label: "Consolidado Pesca",
      icon: "pi pi-file-excel",
      severity: "contrast",
      tooltip: "Generar reporte consolidado de pesca industrial",
    },
  ];
  return (
    <Card title="Reportes">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginTop: "0.25rem",
        }}
      >
        {reportes.map((reporte) => (
          <Button
            key={reporte.id}
            label={reporte.label}
            icon={reporte.icon}
            severity={reporte.severity}
            outlined
            onClick={() => onGenerarReporte(reporte.id)}
            disabled={readOnly || !temporadaId}
            tooltip={reporte.tooltip}
            tooltipOptions={{ position: "top" }}
            type="button"
            style={{
              height: "60px",
              fontSize: "0.85rem",
              padding: "0.5rem",
            }}
          />
        ))}
      </div>

      {!temporadaId && (
        <div className="mt-3 p-3 surface-100 border-round">
          <i className="pi pi-info-circle mr-2"></i>
          <span className="text-600">
            Debe guardar la temporada antes de generar reportes
          </span>
        </div>
      )}
    </Card>
  );
};
