import React from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

/**
 * Aviso de que un registro NO se puede eliminar porque tiene historial: muestra en qué tablas se usa y cuántos
 * registros hay en cada una.
 *
 * @param {string} entidad - Qué se quería eliminar, p. ej. "el tipo de movimiento" o "la categoría"
 * @param {string} nombre - Nombre del registro
 * @param {Array} tablas - [{ tabla, registros, detalle? }] (solo las tablas con registros)
 */
export default function UsoRegistroDialog({ visible, onHide, entidad, nombre, tablas = [] }) {
  const total = tablas.reduce((suma, t) => suma + Number(t.registros || 0), 0);

  return (
    <Dialog
      header="No se puede eliminar: tiene historial"
      visible={visible}
      style={{ width: "640px" }}
      onHide={onHide}
      modal
      footer={<Button label="Entendido" icon="pi pi-check" onClick={onHide} autoFocus />}
    >
      <p style={{ marginTop: 0 }}>
        Se intentó eliminar {entidad} <strong>{nombre}</strong>, pero se usa en <strong>{tablas.length}</strong> tabla(s)
        con <strong>{total}</strong> registro(s) en total:
      </p>
      <DataTable value={tablas} size="small" showGridlines stripedRows dataKey="tabla">
        <Column field="tabla" header="Tabla" />
        <Column field="detalle" header="Uso" body={(fila) => fila.detalle || "Registros que usan este dato"} />
        <Column field="registros" header="Registros" style={{ width: 110, textAlign: "right" }} bodyStyle={{ textAlign: "right" }} />
      </DataTable>
      <small style={{ display: "block", marginTop: "0.75rem", color: "#6c757d" }}>
        Para depurarlo, primero cambie esos registros a otro tipo de movimiento (botón "Cambiar Tipo" en Rendición de
        gastos y en Movimientos de Caja). Si no se desea usar más, desactívelo en lugar de eliminarlo.
      </small>
    </Dialog>
  );
}
