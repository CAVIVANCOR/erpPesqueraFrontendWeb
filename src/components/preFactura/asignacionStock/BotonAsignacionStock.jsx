// src/components/preFactura/asignacionStock/BotonAsignacionStock.jsx
// Botón de la columna "Stock" de cada línea. Estados:
//   Asignar Stock -> Asignando x/y -> Stock Asignado -> (todas completas) Generar Kardex -> Kardex Generado (bloqueado)
import React from "react";
import { Button } from "primereact/button";

const formatearNumero = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

export default function BotonAsignacionStock({ a, detalle }) {
  if (a.kardexGenerado) {
    return <Button type="button" label="Kardex Generado" icon="pi pi-lock" severity="secondary" size="small" disabled />;
  }

  if (!a.puedeDespachar) {
    return (
      <span data-pr-tooltip={a.motivoNoDespachar}>
        <Button
          type="button"
          label="Asignar Stock"
          icon="pi pi-box"
          severity="secondary"
          outlined
          size="small"
          disabled
          tooltip={a.motivoNoDespachar || undefined}
          tooltipOptions={{ position: "top", showOnDisabled: true }}
        />
      </span>
    );
  }

  // Todas las líneas completas: cualquier botón genera; el lápiz permite corregir una asignación
  if (a.todasCompletas) {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        <Button
          type="button"
          label="Generar Kardex"
          icon="pi pi-database"
          severity="info"
          size="small"
          onClick={a.pedirConfirmacion}
          loading={a.generando}
        />
        <Button
          type="button"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          size="small"
          tooltip="Modificar la asignación de esta línea"
          tooltipOptions={{ position: "top" }}
          onClick={() => a.abrirLinea(detalle)}
        />
      </div>
    );
  }

  const { estado, asignado, requerido } = a.estadoLinea(detalle);
  const unidad = detalle.producto?.unidadMedida?.simbolo || "";

  if (estado === "COMPLETA") {
    return <Button type="button" label="Stock Asignado" icon="pi pi-check" severity="success" size="small" onClick={() => a.abrirLinea(detalle)} />;
  }
  if (estado === "PARCIAL") {
    return (
      <Button
        type="button"
        label={`Asignando ${formatearNumero(asignado)}/${formatearNumero(requerido)} ${unidad}`}
        icon="pi pi-spin pi-spinner"
        severity="warning"
        size="small"
        onClick={() => a.abrirLinea(detalle)}
      />
    );
  }
  return <Button type="button" label="Asignar Stock" icon="pi pi-box" severity="danger" outlined size="small" onClick={() => a.abrirLinea(detalle)} />;
}
