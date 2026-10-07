/**
 * GeneracionDocumentosLoteDialog.jsx
 *
 * Reprocesa en lote la generación de documentos financieros (OC, CxP, Pago y Asientos)
 * de los gastos marcados en la lista de Rendición de Gastos.
 *
 * Usa la misma función del backend que el botón del formulario (una gasto por llamada),
 * por lo que no duplica ninguna regla de generación. La decisión sobre qué hacer cuando la
 * Orden de Compra ya existe se toma UNA sola vez antes de empezar:
 *  - Gastos FISCALES: siempre acción B (actualizar referencias y completar lo que falte).
 *  - Gastos GERENCIALES: el usuario elige A, B o C.
 * Si un gasto falla, el proceso continúa con el siguiente y el error queda en su línea.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import { generarDocumentosFinancieros } from "../../api/detMovsEntregaRendir";
import {
  puedeGenerarDocumentos,
  esGastoGerencial,
} from "../../utils/generacionDocumentosFinancieros";

const FASE = { CONFIGURAR: "configurar", PROCESANDO: "procesando", FINALIZADO: "finalizado" };

const OPCIONES_GERENCIAL = [
  { valor: "A", titulo: "A. Solo actualizar referencias", detalle: "Origen, activo y URL del comprobante. No se genera nada más." },
  { valor: "B", titulo: "B. Actualizar y completar lo que falte", detalle: "Se crean la CxP, el pago y los asientos que no existan." },
  { valor: "C", titulo: "C. Borrar y volver a generar todo", detalle: "Elimina OC, CxP, pago y asientos del gasto y los genera de nuevo (consume un correlativo nuevo). No se regenera si la CxP tiene pagos registrados." },
];

const ICONO_ESTADO = {
  pendiente: { icono: "pi pi-clock", color: "#757575" },
  procesando: { icono: "pi pi-spin pi-spinner", color: "#1976D2" },
  ok: { icono: "pi pi-check-circle", color: "#2E7D32" },
  error: { icono: "pi pi-times-circle", color: "#D32F2F" },
  omitido: { icono: "pi pi-minus-circle", color: "#F57C00" },
};

const etiquetaGasto = (gasto) =>
  `MOV-${gasto.id}` +
  (gasto.entidadComercial?.razonSocial ? ` · ${gasto.entidadComercial.razonSocial}` : "") +
  (gasto.monto != null ? ` · ${gasto.moneda?.simbolo || ""} ${Number(gasto.monto).toFixed(2)}` : "");

export default function GeneracionDocumentosLoteDialog({ visible, onHide, gastos = [], onFinalizado }) {
  const [fase, setFase] = useState(FASE.CONFIGURAR);
  const [accionGerencial, setAccionGerencial] = useState("B");
  const [items, setItems] = useState([]);
  const detenerRef = useRef(false);

  const { elegibles, omitidos, gerenciales, fiscales } = useMemo(() => {
    const lista = Array.isArray(gastos) ? gastos : [];
    const elegiblesLista = lista.filter(puedeGenerarDocumentos);
    return {
      elegibles: elegiblesLista,
      omitidos: lista.filter((g) => !puedeGenerarDocumentos(g)),
      gerenciales: elegiblesLista.filter(esGastoGerencial),
      fiscales: elegiblesLista.filter((g) => !esGastoGerencial(g)),
    };
  }, [gastos]);

  useEffect(() => {
    if (visible) {
      setFase(FASE.CONFIGURAR);
      setAccionGerencial("B");
      setItems([]);
      detenerRef.current = false;
    }
  }, [visible]);

  const actualizarItem = (id, cambios) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...cambios } : item)));

  const procesar = async () => {
    detenerRef.current = false;
    setFase(FASE.PROCESANDO);

    setItems([
      ...omitidos.map((g) => ({
        id: g.id,
        etiqueta: etiquetaGasto(g),
        estado: "omitido",
        mensaje: "Omitido: no es un gasto de una entrega a rendir",
      })),
      ...elegibles.map((g) => ({ id: g.id, etiqueta: etiquetaGasto(g), estado: "pendiente", mensaje: "Pendiente" })),
    ]);

    for (const gasto of elegibles) {
      if (detenerRef.current) {
        actualizarItem(gasto.id, { mensaje: "No procesado (proceso detenido)" });
        continue;
      }

      actualizarItem(gasto.id, { estado: "procesando", mensaje: "Procesando..." });
      // Fiscal: siempre B. Gerencial: lo que eligió el usuario. Sin OC existente la acción no aplica.
      const accion = esGastoGerencial(gasto) ? accionGerencial : "B";

      try {
        const resultado = await generarDocumentosFinancieros(gasto.id, accion);
        actualizarItem(gasto.id, {
          estado: "ok",
          mensaje: resultado?.ordenCompraExistente
            ? resultado.message
            : "Documentos generados correctamente",
        });
      } catch (error) {
        actualizarItem(gasto.id, {
          estado: "error",
          mensaje: error.response?.data?.message || error.message || "Error al generar documentos",
        });
      }
    }

    setFase(FASE.FINALIZADO);
  };

  const cerrar = () => {
    if (fase === FASE.FINALIZADO && onFinalizado) onFinalizado();
    onHide();
  };

  const totalAProcesar = items.filter((i) => i.estado !== "omitido").length;
  const terminados = items.filter((i) => ["ok", "error"].includes(i.estado)).length;
  const correctos = items.filter((i) => i.estado === "ok").length;
  const conError = items.filter((i) => i.estado === "error").length;

  return (
    <Dialog
      visible={visible}
      style={{ width: "720px" }}
      header="🔄 Generar Documentos Financieros en Lote"
      modal
      closable={fase !== FASE.PROCESANDO}
      onHide={cerrar}
    >
      {fase === FASE.CONFIGURAR && (
        <div className="p-fluid">
          <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#F5F5F5", borderRadius: "4px", fontSize: "0.9rem" }}>
            <div><strong>{gastos.length}</strong> gasto(s) seleccionado(s)</div>
            <div>✔ {elegibles.length} elegible(s): {fiscales.length} fiscal(es) y {gerenciales.length} gerencial(es)</div>
            {omitidos.length > 0 && (
              <div style={{ color: "#F57C00" }}>
                ⚠ {omitidos.length} se omitirán (no son gastos de una entrega a rendir)
              </div>
            )}
          </div>

          {elegibles.length === 0 ? (
            <Message severity="warn" className="w-full" text="Ninguno de los gastos seleccionados puede generar documentos." />
          ) : (
            <>
              <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                Si la Orden de Compra de un gasto ya existe...
              </div>

              {fiscales.length > 0 && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "4px" }}>
                  <div style={{ fontWeight: "bold" }}>Gastos FISCALES ({fiscales.length})</div>
                  <div style={{ fontSize: "0.85rem", color: "#757575" }}>
                    Se actualizan sus referencias y se completa lo que falte (acción B). No se elimina nada.
                  </div>
                </div>
              )}

              {gerenciales.length > 0 && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #E0E0E0", borderRadius: "4px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Gastos GERENCIALES ({gerenciales.length})
                  </div>
                  {OPCIONES_GERENCIAL.map((opcion) => (
                    <div key={opcion.valor} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <RadioButton
                        inputId={`loteAccion${opcion.valor}`}
                        value={opcion.valor}
                        checked={accionGerencial === opcion.valor}
                        onChange={(e) => setAccionGerencial(e.value)}
                      />
                      <label htmlFor={`loteAccion${opcion.valor}`} style={{ cursor: "pointer" }}>
                        <div style={{ fontWeight: "bold", color: opcion.valor === "C" ? "#D32F2F" : undefined }}>
                          {opcion.titulo}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#757575" }}>{opcion.detalle}</div>
                      </label>
                    </div>
                  ))}
                  {accionGerencial === "C" && (
                    <Message
                      severity="warn"
                      className="w-full justify-content-start"
                      text="Se eliminarán documentos contables ya generados. Esta acción no se puede deshacer."
                    />
                  )}
                </div>
              )}

              <div style={{ fontSize: "0.85rem", color: "#757575" }}>
                Si la Orden de Compra no existe, se genera todo normalmente. Si un gasto falla, el proceso continúa con el siguiente.
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-secondary" onClick={onHide} />
            <Button
              label="Procesar"
              icon="pi pi-check"
              className={accionGerencial === "C" && gerenciales.length > 0 ? "p-button-danger" : "p-button-success"}
              onClick={procesar}
              disabled={elegibles.length === 0}
            />
          </div>
        </div>
      )}

      {fase !== FASE.CONFIGURAR && (
        <div className="p-fluid">
          <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
            {fase === FASE.PROCESANDO ? "Procesando..." : "Proceso finalizado"} {terminados} de {totalAProcesar}
            {" · "}✔ {correctos} correcto(s) · ✘ {conError} con error
          </div>
          <ProgressBar
            value={totalAProcesar > 0 ? Math.round((terminados / totalAProcesar) * 100) : 0}
            style={{ height: "10px", marginBottom: "1rem" }}
          />

          <div style={{ maxHeight: "50vh", overflowY: "auto", border: "1px solid #E0E0E0", borderRadius: "4px" }}>
            {items.map((item) => {
              const estado = ICONO_ESTADO[item.estado];
              return (
                <div
                  key={item.id}
                  style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0.75rem", borderBottom: "1px solid #F0F0F0", fontSize: "0.9rem" }}
                >
                  <i className={estado.icono} style={{ color: estado.color, marginTop: "0.2rem" }} />
                  <div>
                    <div style={{ fontWeight: "bold" }}>{item.etiqueta}</div>
                    <div style={{ color: item.estado === "error" ? "#D32F2F" : "#757575", fontSize: "0.85rem" }}>
                      {item.mensaje}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
            {fase === FASE.PROCESANDO ? (
              <Button
                label="Detener"
                icon="pi pi-stop"
                className="p-button-danger"
                onClick={() => {
                  detenerRef.current = true;
                }}
              />
            ) : (
              <Button label="Cerrar" icon="pi pi-check" className="p-button-success" onClick={cerrar} />
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
