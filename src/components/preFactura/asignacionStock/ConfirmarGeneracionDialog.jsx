// src/components/preFactura/asignacionStock/ConfirmarGeneracionDialog.jsx
// Resumen previo a generar: un movimiento de salida por almacén. La salida descuenta los saldos de inmediato.
import React from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

const formatearNumero = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

export default function ConfirmarGeneracionDialog({ a }) {
  const conceptoTemplate = (grupo) => {
    const lista = a.conceptosPorAlmacen.get(Number(grupo.almacenId)) || [];
    const actual = a.conceptoDe(grupo.almacenId);
    if (lista.length <= 1) return actual?.descripcion || <span style={{ color: "#d32f2f" }}>Sin concepto</span>;
    return (
      <Dropdown
        value={actual ? Number(actual.id) : null}
        options={lista.map((c) => ({ label: c.descripcion, value: Number(c.id) }))}
        onChange={(e) => a.elegirConcepto(grupo.almacenId, e.value)}
        style={{ width: "100%" }}
      />
    );
  };

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={a.cerrarConfirmacion} disabled={a.generando} />
      <Button
        type="button"
        label="Generar Kardex"
        icon="pi pi-database"
        severity="info"
        onClick={a.generar}
        loading={a.generando}
        disabled={a.generando || a.resumenPorAlmacen.length === 0}
      />
    </div>
  );

  return (
    <Dialog
      header="Generar movimientos de salida y kardex"
      visible={a.mostrarConfirmacion}
      onHide={a.cerrarConfirmacion}
      footer={footer}
      style={{ width: "800px", maxWidth: "96vw" }}
      modal
      closable={!a.generando}
    >
      <Message
        severity="warn"
        style={{ width: "100%", marginBottom: 12 }}
        text={`Se crearán ${a.resumenPorAlmacen.length} movimiento(s) de salida (uno por almacén), se generará el kardex y se descontarán los saldos de inmediato. Para deshacerlo deberá reactivar el documento.`}
      />
      <DataTable value={a.resumenPorAlmacen} dataKey="almacenId" size="small" showGridlines stripedRows>
        <Column header="Almacén de salida" field="almacenNombre" />
        <Column header="Concepto de movimiento" body={conceptoTemplate} style={{ minWidth: "240px" }} />
        <Column header="Líneas" field="lineas" style={{ width: "80px", textAlign: "right" }} bodyStyle={{ textAlign: "right" }} />
        <Column
          header="Cantidad total"
          body={(g) => formatearNumero(g.cantidad)}
          style={{ width: "130px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
        />
      </DataTable>
    </Dialog>
  );
}
