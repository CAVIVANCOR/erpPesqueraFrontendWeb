// src/components/movimientoCaja/PrestamosPagoEspecializado/AsientoPrevioPrestamoDialog.jsx
// Un préstamo aprobado que ya tiene un asiento del flujo anterior no puede desembolsarse: el desembolso actual crea su
// propio asiento junto con el movimiento de caja y la contabilidad quedaría duplicada. El usuario revisa el asiento y decide si lo elimina.
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import { eliminarAsientoPrevioPrestamo } from "../../../api/tesoreria/operacionPrestamo";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero, formatearFecha } from "../../../utils/utils";

export default function AsientoPrevioPrestamoDialog({ visible, onHide, fila, toast, onEliminado }) {
  const [eliminando, setEliminando] = useState(null);
  if (!fila) return null;

  const simbolo = fila.moneda?.simbolo || "";
  const numeroPrestamo = fila.prestamo?.numeroPrestamo || fila.documentoNumero;
  const asientos = fila.asientosPrevios || [];

  const eliminar = (asiento) => {
    confirmDialog({
      header: "Eliminar asiento previo",
      icon: "pi pi-exclamation-triangle",
      message: `Se eliminará el asiento ${asiento.numeroAsiento} del préstamo ${numeroPrestamo}. Después podrá registrar el desembolso con caja y asiento actuales. Esta acción no se puede deshacer. ¿Desea continuar?`,
      acceptLabel: "Sí, eliminar asiento",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setEliminando(asiento.id);
        try {
          await eliminarAsientoPrevioPrestamo(Number(fila.origenId), Number(asiento.id));
          toast?.current?.show({
            severity: "success",
            summary: "Asiento eliminado",
            detail: `El asiento ${asiento.numeroAsiento} fue eliminado. El préstamo ${numeroPrestamo} ya puede desembolsarse.`,
            life: 8000,
          });
          onEliminado?.();
        } catch (err) {
          toast?.current?.show({
            severity: "error",
            summary: "No se pudo eliminar el asiento",
            detail: mensajeDeError(err, "Error al eliminar el asiento previo del préstamo"),
            life: 10000,
          });
        }
        setEliminando(null);
      },
    });
  };

  return (
    <Dialog header={`Asiento previo del préstamo ${numeroPrestamo}`} visible={visible} onHide={onHide} style={{ width: "92vw", maxWidth: 1100 }} modal maximizable>
      <Message
        severity="warn"
        className="mb-3"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text="Este préstamo ya tiene un asiento contable generado con el flujo anterior. Primero debe eliminar ese asiento; si no, al registrar el desembolso la contabilidad quedaría duplicada. Revise el asiento y decida."
      />
      {asientos.map((a) => (
        <Panel
          key={a.id}
          className="mb-3"
          header={
            <span>
              {a.numeroAsiento} · {formatearFecha(a.fechaAsiento)} · {simbolo} {formatearNumero(a.totalDebe)}{" "}
              <Tag value={a.estado || "SIN ESTADO"} severity="warning" style={{ fontSize: "0.7rem" }} />
            </span>
          }
        >
          <div className="mb-2">{a.glosa}</div>
          <AsientoContableViewer asientoContableId={a.id} showHeader={false} />
          <div className="flex justify-content-end mt-3">
            <Button label="Eliminar este asiento" icon="pi pi-trash" severity="danger" loading={eliminando === a.id} onClick={() => eliminar(a)} />
          </div>
        </Panel>
      ))}
    </Dialog>
  );
}
