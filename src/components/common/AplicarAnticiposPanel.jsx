// src/components/common/AplicarAnticiposPanel.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../utils/utils";

/**
 * Anticipos descontados en una factura final (Compras: anticipos entregados al proveedor; Ventas: anticipos recibidos del cliente).
 * - Aplicar: crea una línea NEGATIVA por anticipo (editable para igualar el comprobante) y recalcula totales.
 * - Revertir: borra esas líneas y libera los anticipos.
 * Cada anticipo se aplica completo a UNA sola factura final; una final puede descontar varios.
 * El panel es genérico: recibe las funciones de la API de Compras o de Ventas.
 */
export default function AplicarAnticiposPanel({
  documentoId, // OrdenCompra o PreFactura final
  cargar, // (id) => Promise<{ disponibles: [], aplicados: [] }>
  aplicar, // (id, anticipoIds) => Promise
  revertir, // (id) => Promise
  onCambio, // se llama tras aplicar o revertir (refresca líneas y totales de la pantalla)
  puedeEditar = true,
  etiqueta = "anticipo",
  toast,
}) {
  const [estado, setEstado] = useState({ disponibles: [], aplicados: [] });
  const [procesando, setProcesando] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [confirmarRevertir, setConfirmarRevertir] = useState(false);
  const [seleccion, setSeleccion] = useState([]);

  const mostrar = useCallback(
    (severity, summary, detail) => toast?.current?.show({ severity, summary, detail, life: severity === "error" ? 8000 : 5000 }),
    [toast],
  );

  const refrescar = useCallback(async () => {
    if (!documentoId) return;
    try {
      setEstado(await cargar(documentoId));
    } catch (error) {
      setEstado({ disponibles: [], aplicados: [] });
    }
  }, [documentoId, cargar]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  if (!documentoId) return null;

  const ejecutar = async (accion) => {
    setProcesando(true);
    try {
      if (accion === "aplicar") {
        await aplicar(documentoId, seleccion.map((a) => a.id));
        mostrar("success", "Anticipos aplicados", "Se agregó una línea negativa por cada anticipo. Ajuste su monto si el comprobante del proveedor difiere.");
        setDialogoVisible(false);
        setSeleccion([]);
      } else {
        await revertir(documentoId);
        mostrar("success", "Anticipos revertidos", "Se quitaron las líneas negativas y los anticipos quedaron disponibles.");
        setConfirmarRevertir(false);
      }
      await refrescar();
      if (onCambio) await onCambio();
    } catch (error) {
      setDialogoVisible(false);
      setConfirmarRevertir(false);
      mostrar(
        "error",
        accion === "aplicar" ? `No se pudo aplicar el ${etiqueta}` : `No se pudo revertir el ${etiqueta}`,
        error.response?.data?.mensaje || error.response?.data?.message || error.message,
      );
    } finally {
      setProcesando(false);
    }
  };

  const hayAplicados = estado.aplicados.length > 0;

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
      <Tag severity={hayAplicados ? "success" : "info"} icon="pi pi-wallet" value={`${etiqueta.toUpperCase()}S`} />
      {hayAplicados ? (
        <span>
          Descontados: {estado.aplicados.map((a) => `${a.numero} (${formatearNumero(a.total)})`).join(", ")}
        </span>
      ) : (
        <span>
          {estado.disponibles.length > 0
            ? `${estado.disponibles.length} ${etiqueta}(s) pagado(s) disponible(s) para descontar.`
            : `Sin ${etiqueta}s disponibles (deben estar pagados, ser del mismo ${etiqueta === "anticipo" ? "proveedor o cliente" : "tercero"} y moneda).`}
        </span>
      )}
      {!hayAplicados && (
        <Button
          type="button"
          label="Aplicar anticipos"
          icon="pi pi-link"
          size="small"
          disabled={!puedeEditar || procesando || estado.disponibles.length === 0}
          onClick={() => setDialogoVisible(true)}
        />
      )}
      {hayAplicados && (
        <Button
          type="button"
          label="Revertir anticipos"
          icon="pi pi-undo"
          severity="warning"
          outlined
          size="small"
          disabled={!puedeEditar || procesando}
          onClick={() => setConfirmarRevertir(true)}
        />
      )}

      <Dialog
        header="Aplicar anticipos a esta factura"
        visible={dialogoVisible}
        style={{ width: "46rem" }}
        modal
        onHide={() => !procesando && setDialogoVisible(false)}
        footer={
          <div>
            <Button type="button" label="Cancelar" severity="secondary" outlined disabled={procesando} onClick={() => setDialogoVisible(false)} />
            <Button
              type="button"
              label={`Aplicar ${seleccion.length || ""}`.trim()}
              icon="pi pi-check"
              loading={procesando}
              disabled={seleccion.length === 0}
              onClick={() => ejecutar("aplicar")}
            />
          </div>
        }
      >
        <p style={{ marginTop: 0 }}>
          Seleccione los anticipos que el comprobante descontó. Cada anticipo se aplica completo a esta factura y no podrá usarse
          en otra.
        </p>
        <DataTable value={estado.disponibles} selection={seleccion} onSelectionChange={(e) => setSeleccion(e.value)} dataKey="id" size="small">
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="numero" header="Documento" />
          <Column header="Fecha" body={(r) => formatearFecha(r.fechaDocumento)} />
          <Column header="Base" body={(r) => formatearNumero(r.subtotal)} bodyStyle={{ textAlign: "right" }} />
          <Column header="IGV" body={(r) => formatearNumero(r.totalIGV)} bodyStyle={{ textAlign: "right" }} />
          <Column header="Total" body={(r) => formatearNumero(r.total)} bodyStyle={{ textAlign: "right", fontWeight: "bold" }} />
        </DataTable>
      </Dialog>

      <Dialog
        header="Revertir anticipos"
        visible={confirmarRevertir}
        style={{ width: "30rem" }}
        modal
        onHide={() => !procesando && setConfirmarRevertir(false)}
        footer={
          <div>
            <Button type="button" label="Cancelar" severity="secondary" outlined disabled={procesando} onClick={() => setConfirmarRevertir(false)} />
            <Button type="button" label="Revertir" icon="pi pi-check" loading={procesando} onClick={() => ejecutar("revertir")} />
          </div>
        }
      >
        <p>
          Se borrarán las líneas negativas de los anticipos y estos quedarán disponibles de nuevo. Los totales de la factura se
          recalcularán. La factura no debe tener cuenta por pagar/cobrar ni asientos.
        </p>
      </Dialog>
    </div>
  );
}
