// src/components/preFactura/AplicarNotaCreditoPanel.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../utils/utils";

/**
 * Aplicación (canje) de una Nota de Crédito a su documento afecto.
 * - Aplicar: baja el saldo del documento afecto y recalcula su detracción/retención/percepción.
 * - Revertir: deshace la aplicación (solo si el documento afecto no tiene otros pagos).
 * Solo una NC por documento y solo si el documento afecto no tiene ningún pago.
 */
export default function AplicarNotaCreditoPanel({
  documentoId, // ID de la PreFactura u OrdenCompra que es Nota de Crédito
  getEstado, // (id) => Promise<estado>
  aplicar, // (id) => Promise
  revertir, // (id) => Promise
  dcmtoAfectoNCNDId,
  puedeEditar = true,
  toast,
}) {
  const preFacturaId = documentoId;
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null); // "aplicar" | "revertir" | null

  const mostrar = useCallback(
    (severity, summary, detail) =>
      toast?.current?.show({ severity, summary, detail, life: severity === "error" ? 8000 : 5000 }),
    [toast],
  );

  const cargarEstado = useCallback(async () => {
    if (!preFacturaId) {
      setEstado(null);
      return;
    }
    setCargando(true);
    try {
      setEstado(await getEstado(preFacturaId));
    } catch (error) {
      setEstado(null);
    } finally {
      setCargando(false);
    }
  }, [preFacturaId, getEstado]);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado, dcmtoAfectoNCNDId]);

  const ejecutar = async (accion) => {
    setProcesando(true);
    try {
      if (accion === "aplicar") {
        await aplicar(preFacturaId);
        mostrar("success", "Nota de crédito aplicada", "El saldo del documento afecto fue actualizado.");
      } else {
        await revertir(preFacturaId);
        mostrar("success", "Aplicación revertida", "El documento afecto volvió a su saldo original.");
      }
      setConfirmacion(null);
      await cargarEstado();
    } catch (error) {
      // Se cierra la confirmación antes del aviso: un diálogo modal abierto tapa el toast
      setConfirmacion(null);
      mostrar(
        "error",
        accion === "aplicar" ? "No se pudo aplicar la nota de crédito" : "No se pudo revertir la aplicación",
        error.response?.data?.message || error.message,
      );
    } finally {
      setProcesando(false);
    }
  };

  // Antes de pedir confirmación se consulta el estado actual y, si hay un motivo que lo impide,
  // se avisa con un toast rojo (el botón siempre responde, nunca queda "muerto")
  const solicitarAplicar = async () => {
    setProcesando(true);
    try {
      const actual = await getEstado(preFacturaId);
      setEstado(actual);
      const sinGuardar = dcmtoAfectoNCNDId && !actual.documentoAfecto;
      const motivo =
        (sinGuardar
          ? "Guarde la nota de crédito antes de aplicarla: el documento afecto elegido aún no está guardado."
          : null) ||
        actual.motivoBloqueo ||
        (actual.documentoAfecto && !actual.documentoAfecto.tieneCuenta
          ? "El documento afecto aún no tiene su cuenta por cobrar/pagar (debe estar emitido o facturado)."
          : null);
      if (motivo) {
        mostrar("error", "No se puede aplicar la nota de crédito", motivo);
        return;
      }
      setConfirmacion("aplicar");
    } catch (error) {
      mostrar(
        "error",
        "No se pudo verificar la nota de crédito",
        error.response?.data?.message || error.message,
      );
    } finally {
      setProcesando(false);
    }
  };

  if (!preFacturaId) {
    return (
      <small className="p-text-secondary block mt-2">
        Guarde y emita la nota de crédito para poder aplicarla al documento afecto.
      </small>
    );
  }
  if (!estado || !estado.esNotaCredito) return null;

  const doc = estado.documentoAfecto;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.75rem",
        border: "1px solid var(--surface-border)",
        borderRadius: "6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      {estado.aplicada ? (
        <>
          <Tag severity="success" icon="pi pi-check" value="NC APLICADA" />
          <span>
            Aplicada el {formatearFecha(estado.pagoCanje?.fecha)} por{" "}
            <b>{formatearNumero(estado.pagoCanje?.monto)}</b>
            {doc ? ` al documento ${doc.numero} (saldo ${formatearNumero(doc.saldoPendiente)})` : ""}
          </span>
          <Button
            type="button"
            label="Revertir aplicación"
            icon="pi pi-undo"
            severity="warning"
            outlined
            size="small"
            disabled={!puedeEditar || procesando}
            onClick={() => setConfirmacion("revertir")}
          />
        </>
      ) : (
        <>
          <Tag severity="warning" value="NC SIN APLICAR" />
          <span>
            {doc
              ? `Documento afecto ${doc.numero} · Total ${formatearNumero(doc.total)} · Saldo ${
                  doc.saldoPendiente === null ? "-" : formatearNumero(doc.saldoPendiente)
                } · NC ${formatearNumero(estado.totalNC)}`
              : "Elija el documento afecto con el buscador para poder aplicar la nota de crédito."}
          </span>
          <Button
            type="button"
            label="Aplicar NC como pago (canje)"
            icon="pi pi-link"
            size="small"
            disabled={!puedeEditar || procesando || cargando}
            loading={procesando}
            onClick={solicitarAplicar}
          />
        </>
      )}

      <Dialog
        header={confirmacion === "aplicar" ? "Aplicar nota de crédito" : "Revertir aplicación"}
        visible={Boolean(confirmacion)}
        style={{ width: "32rem" }}
        modal
        onHide={() => !procesando && setConfirmacion(null)}
        footer={
          <div>
            <Button
              type="button"
              label="Cancelar"
              severity="secondary"
              outlined
              disabled={procesando}
              onClick={() => setConfirmacion(null)}
            />
            <Button
              type="button"
              label={confirmacion === "aplicar" ? "Aplicar" : "Revertir"}
              icon="pi pi-check"
              loading={procesando}
              onClick={() => ejecutar(confirmacion)}
            />
          </div>
        }
      >
        {confirmacion === "aplicar" ? (
          <p>
            Se registrará la nota de crédito como un pago (medio CANJE-NC) en el documento afecto
            <b> {doc?.numero}</b>, bajando su saldo en <b>{formatearNumero(estado.totalNC)}</b>. Su detracción,
            retención o percepción se recalculará sobre el nuevo saldo. Solo se puede aplicar una nota de crédito
            por documento y únicamente si el documento no tiene ningún pago.
          </p>
        ) : (
          <p>
            Se eliminará el canje y el documento afecto volverá a su saldo original; su detracción, retención o
            percepción se recalculará con el total original. Solo es posible si el documento no tiene otros pagos.
          </p>
        )}
      </Dialog>
    </div>
  );
}
