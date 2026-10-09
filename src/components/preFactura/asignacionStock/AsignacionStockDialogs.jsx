// src/components/preFactura/asignacionStock/AsignacionStockDialogs.jsx
// Diálogos de la asignación de stock: selección por línea y confirmación de generación.
import React from "react";
import AsignarStockLineaDialog from "./AsignarStockLineaDialog";
import ConfirmarGeneracionDialog from "./ConfirmarGeneracionDialog";

export default function AsignacionStockDialogs({ a }) {
  return (
    <>
      <AsignarStockLineaDialog a={a} />
      <ConfirmarGeneracionDialog a={a} />
    </>
  );
}
