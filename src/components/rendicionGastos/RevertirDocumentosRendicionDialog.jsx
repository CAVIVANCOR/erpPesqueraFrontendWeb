import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  planRevertirDocumentos,
  revertirDocumentos,
  listarDocumentosHuerfanos,
  revertirDocumentosHuerfanos,
} from "../../api/detMovsEntregaRendir";
import { mensajeDeError } from "../../utils/mensajeError";

const formatoMonto = (valor) => Number(valor || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoFecha = (valor) => (valor ? new Date(valor).toLocaleDateString("es-PE") : "");

/**
 * Reversión de los documentos generados desde Rendición de Gastos (Orden de Compra, Cuenta por Pagar, pago automático
 * y asientos), sin volver a generarlos. Dos modos:
 *  - "movimientos": los movimientos seleccionados (se muestra el plan de cada uno antes de revertir).
 *  - "huerfanos": órdenes de compra cuyo movimiento de rendición ya no existe.
 *
 * El servidor valida todo otra vez (solo superusuario; todo o nada por Orden de Compra).
 *
 * @param {Array} movimientosSeleccionados - Movimientos de rendición seleccionados (modo "movimientos")
 * @param {Function} onRevertido - async () => void; se llama al terminar para recargar los datos
 */
export default function RevertirDocumentosRendicionDialog({
  visible,
  onHide,
  modo = "movimientos",
  movimientosSeleccionados = [],
  onRevertido,
  toast,
}) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [totales, setTotales] = useState(null);

  const mostrar = (severity, summary, detail, life = 8000) => toast?.current?.show({ severity, summary, detail, life });

  // Clave estable de la selección: evita recargar el plan en cada render del padre
  const idsSeleccionados = movimientosSeleccionados.map((m) => m.id).join(",");

  useEffect(() => {
    if (!visible) return;
    let activo = true;
    setFilas([]);
    setError(null);
    setTotales(null);
    setCargando(true);

    const cargar = async () => {
      try {
        if (modo === "huerfanos") {
          const datos = await listarDocumentosHuerfanos();
          if (!activo) return;
          setFilas(datos.ordenes || []);
          setTotales({ saldo: datos.saldoPendienteTotal, bloqueadas: datos.conBloqueos });
          return;
        }
        // Un movimiento sin documentos generados se informa por separado: no es un error de la operación
        const resultados = await Promise.all(
          movimientosSeleccionados.map(async (mov) => {
            try {
              const plan = await planRevertirDocumentos(mov.id);
              return plan.ordenes.map((o) => ({ ...o, movimientoId: mov.id }));
            } catch (e) {
              return [{ ordenCompraId: `mov-${mov.id}`, movimientoId: mov.id, sinDocumentos: true, bloqueos: [mensajeDeError(e, "No se pudo analizar el movimiento")] }];
            }
          }),
        );
        if (activo) setFilas(resultados.flat());
      } catch (e) {
        if (activo) setError(mensajeDeError(e, "No se pudieron analizar los documentos a revertir"));
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [visible, modo, idsSeleccionados]);

  const revertibles = filas.filter((f) => !f.sinDocumentos && f.bloqueos.length === 0);
  const sinBloqueo = revertibles.length;

  const ejecutar = async () => {
    setProcesando(true);
    try {
      if (modo === "huerfanos") {
        const resultado = await revertirDocumentosHuerfanos(revertibles.map((f) => f.ordenCompraId));
        mostrar(resultado.rechazadas?.length ? "warn" : "success", "Documentos huérfanos", resultado.message, 8000);
        if (resultado.rechazadas?.length) {
          mostrar("warn", "No se eliminaron", resultado.rechazadas.map((r) => `OC ${r.ordenCompraId}: ${r.motivo}`).join(" | "), 15000);
        }
      } else {
        const movimientosConDocumentos = [...new Set(revertibles.map((f) => f.movimientoId))];
        let total = 0;
        for (const id of movimientosConDocumentos) {
          const resultado = await revertirDocumentos(id);
          total += resultado.revertidas?.length || 0;
        }
        mostrar("success", "Documentos revertidos", `Se revirtieron ${total} documento(s) de ${movimientosConDocumentos.length} movimiento(s). Ya puede generarlos de nuevo.`, 6000);
      }
      await onRevertido?.();
      onHide();
    } catch (e) {
      mostrar("error", "No se revirtieron los documentos", mensajeDeError(e, "No se pudieron revertir los documentos"), 12000);
    } finally {
      setProcesando(false);
    }
  };

  const titulo = modo === "huerfanos" ? "Documentos huérfanos de Rendición de Gastos" : "Revertir documentos de Rendición de Gastos";

  return (
    <Dialog header={titulo} visible={visible} style={{ width: "980px", maxWidth: "98vw" }} onHide={onHide} modal>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ background: "#fff3cd", color: "#664d03", padding: "0.75rem", borderRadius: 6, fontSize: "0.9rem" }}>
          {modo === "huerfanos"
            ? "Son órdenes de compra generadas desde Rendición de Gastos cuyo movimiento de rendición ya no existe. Se eliminarán con su cuenta por pagar, su pago automático y sus asientos."
            : "Se eliminarán la orden de compra, la cuenta por pagar, el pago automático en efectivo y los asientos generados para los movimientos seleccionados. No se vuelven a generar: use después «Generar documentos»."}
          {" "}Esta operación no se puede deshacer.
        </div>

        {error && <div style={{ background: "#f8d7da", color: "#842029", padding: "0.75rem", borderRadius: 6 }}>{error}</div>}

        {modo === "huerfanos" && totales && (
          <div style={{ fontSize: "0.95rem" }}>
            <strong>{filas.length}</strong> orden(es) huérfana(s) · saldo pendiente de pago que desaparece del sistema:{" "}
            <strong>S/ {formatoMonto(totales.saldo)}</strong>
            {totales.bloqueadas > 0 && <span style={{ color: "#842029" }}> · {totales.bloqueadas} con bloqueo</span>}
          </div>
        )}

        <DataTable value={filas} loading={cargando} size="small" scrollable scrollHeight="360px" emptyMessage="No hay documentos para revertir." dataKey="ordenCompraId">
          <Column field="movimientoId" header="Movimiento" style={{ width: "6rem" }} />
          <Column field="numeroDocumento" header="Orden de compra" style={{ width: "9rem" }} />
          <Column header="Fecha" body={(f) => formatoFecha(f.fechaDocumento)} style={{ width: "6rem" }} />
          <Column header="Total" body={(f) => (f.total === undefined ? "" : formatoMonto(f.total))} style={{ width: "6rem", textAlign: "right" }} />
          <Column header="Saldo CxP" body={(f) => (f.saldoPendiente === undefined ? "" : formatoMonto(f.saldoPendiente))} style={{ width: "6rem", textAlign: "right" }} />
          <Column field="pagos" header="Pagos" style={{ width: "4rem" }} />
          <Column field="asientos" header="Asientos" style={{ width: "5rem" }} />
          <Column
            header="Movimientos que apuntan"
            body={(f) => (f.movimientosApuntando?.length ? `${f.movimientosApuntando.length} (se restauran)` : "")}
            style={{ width: "9rem" }}
          />
          <Column
            header="Estado"
            body={(f) =>
              f.bloqueos?.length ? (
                <span style={{ color: "#842029" }} title={f.bloqueos.join("\n")}>
                  Bloqueada: {f.bloqueos[0]}
                </span>
              ) : (
                <span style={{ color: "#0f5132" }}>Se puede revertir</span>
              )
            }
          />
        </DataTable>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={procesando} />
          <Button
            label={`Revertir ${sinBloqueo} documento(s)`}
            icon="pi pi-undo"
            className="p-button-danger"
            onClick={ejecutar}
            disabled={sinBloqueo === 0 || procesando || cargando}
            loading={procesando}
          />
        </div>
      </div>
    </Dialog>
  );
}
