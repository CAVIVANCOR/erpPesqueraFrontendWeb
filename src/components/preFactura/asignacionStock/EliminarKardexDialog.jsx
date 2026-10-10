// src/components/preFactura/asignacionStock/EliminarKardexDialog.jsx
// Confirmación para eliminar el kardex de la venta (todos los movimientos de salida generados).
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function EliminarKardexDialog({ a }) {
  return (
    <Dialog
      header="Eliminar Kardex de la venta"
      visible={a.confirmandoEliminar}
      onHide={a.cerrarEliminacion}
      style={{ width: "34rem" }}
      modal
      closable={!a.eliminando}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={a.cerrarEliminacion}
            disabled={a.eliminando}
          />
          <Button
            label="Eliminar Kardex"
            icon="pi pi-trash"
            severity="danger"
            onClick={a.eliminarKardex}
            loading={a.eliminando}
          />
        </div>
      }
    >
      <p style={{ marginTop: 0 }}>
        Se eliminarán <b>todos los movimientos de almacén</b> generados para esta venta (uno por almacén), con su
        kardex.
      </p>
      <ul style={{ marginBottom: 0 }}>
        <li>El stock vuelve a los saldos de cada almacén.</li>
        <li>Se recalculan los saldos y el costo promedio de los movimientos posteriores.</li>
        <li>Las líneas quedan sin asignar, listas para asignar el stock y volver a generar.</li>
      </ul>
    </Dialog>
  );
}
