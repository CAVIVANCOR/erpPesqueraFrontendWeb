import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import { RadioButton } from "primereact/radiobutton";
import { generarDocumentosFinancieros, getDetMovsEntregaRendirPorId } from "../../api/detMovsEntregaRendir";
/**
 * Componente genérico para generar documentos financieros desde DetMovsEntregaRendir
 * Genera: OrdenCompra → CuentaPorPagar → Pago → 2 Asientos Contables
 * 
 * @param {boolean} visible - Controla visibilidad del diálogo
 * @param {Function} onHide - Callback al cerrar el diálogo
 * @param {Object} detMovEntregaRendir - Objeto completo del gasto con relaciones
 * @param {Function} onGeneracionExitosa - Callback que recibe el resultado
 * @param {Object} toast - Referencia al componente Toast
 */
export default function GeneradorDocumentosFinancierosDialog({
  visible,
  onHide,
  detMovEntregaRendir: detMovProp,
  onGeneracionExitosa,
  toast,
}) {
  const [loading, setLoading] = useState(false);
  const [generandoDocumentos, setGenerandoDocumentos] = useState(false);
  const [detMovCompleto, setDetMovCompleto] = useState(null);
  const [errorGeneracion, setErrorGeneracion] = useState(null);
  const [decisionOC, setDecisionOC] = useState(null);
  const [accionOC, setAccionOC] = useState("A");

  useEffect(() => {
    if (!visible || !detMovProp?.id) return;
    setDetMovCompleto(null);
    setErrorGeneracion(null);
    getDetMovsEntregaRendirPorId(detMovProp.id)
      .then(setDetMovCompleto)
      .catch(() => setDetMovCompleto(null));
  }, [visible, detMovProp?.id]);

  const detMovEntregaRendir = detMovCompleto || detMovProp;

  const validarDatos = () => {
    if (!detMovEntregaRendir) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se proporcionó el movimiento de entrega a rendir",
        life: 3000,
      });
      return false;
    }

    // Operaciones sin factura se marcan como gerenciales - permitido


    if (!detMovEntregaRendir.entidadComercialId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe especificar un proveedor",
        life: 3000,
      });
      return false;
    }

    // Solo validar comprobante si NO es operación sin factura
    if (!detMovEntregaRendir.operacionSinFactura) {
      if (!detMovEntregaRendir.tipoDocumentoId) {
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe especificar el tipo de comprobante",
          life: 3000,
        });
        return false;
      }

      if (!detMovEntregaRendir.numeroSerieComprobante || !detMovEntregaRendir.numeroCorrelativoComprobante) {
        toast?.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe ingresar serie y correlativo del comprobante",
          life: 3000,
        });
        return false;
      }
    }

    if (!detMovEntregaRendir.monto || detMovEntregaRendir.monto <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El monto debe ser mayor a cero",
        life: 3000,
      });
      return false;
    }

    if (!detMovEntregaRendir.productoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe especificar un producto/servicio",
        life: 3000,
      });
      return false;
    }

    if (!detMovEntregaRendir.centroCostoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe especificar un centro de costo",
        life: 3000,
      });
      return false;
    }

    return true;
  };

  const handleGenerar = async (accionOcExistente = null) => {
    if (!validarDatos()) return;

    try {
      setLoading(true);
      setGenerandoDocumentos(true);

      setErrorGeneracion(null);
      const resultado = await generarDocumentosFinancieros(detMovEntregaRendir.id, accionOcExistente);

      // La OC ya existe: el usuario decide qué hacer (A / B / C) en un diálogo de confirmación
      if (resultado?.requiereDecision) {
        setDecisionOC(resultado);
        setAccionOC("A");
        return;
      }

      setDecisionOC(null);
      toast?.current?.show({
        severity: resultado?.ordenCompraExistente ? "info" : "success",
        summary: resultado?.ordenCompraExistente ? "Orden de Compra existente" : "✅ Documentos Generados",
        detail: resultado?.ordenCompraExistente
          ? resultado.message
          : "Orden de Compra, Cuenta por Pagar, Pago y Asientos Contables creados exitosamente",
        life: 4000,
      });

      if (onGeneracionExitosa) {
        onGeneracionExitosa(resultado);
      }

      onHide();
    } catch (error) {
      console.error("Error al generar documentos:", error);
      const mensajeError = error.response?.data?.message || error.message || "Error al generar documentos financieros";
      // Se muestra también dentro del diálogo para que el usuario siempre vea qué debe corregir
      setErrorGeneracion(mensajeError);
      setDecisionOC(null);
      toast?.current?.show({
        severity: "error",
        summary: "❌ Error al Generar Documentos",
        detail: mensajeError,
        life: 10000,
      });
    } finally {
      setLoading(false);
      setGenerandoDocumentos(false);
    }
  };

  const esGerencial = detMovEntregaRendir?.operacionSinFactura === true;
  const esReciboHonorarios = Number(detMovEntregaRendir?.tipoDocumentoId) === 12;
  const montoTotal = Number(detMovEntregaRendir?.monto || 0);
  const sinIGV = esGerencial || esReciboHonorarios;
  const subtotal = sinIGV ? montoTotal : montoTotal / 1.18;
  const igv = montoTotal - subtotal;
  const numeroComprobante = esGerencial
    ? "SIN COMPROBANTE (GERENCIAL)"
    : `${detMovEntregaRendir?.tipoDocumento?.descripcion || ""} ${detMovEntregaRendir?.numeroSerieComprobante || ""}-${detMovEntregaRendir?.numeroCorrelativoComprobante || ""}`.trim();
  const cantidadAsientos = esGerencial ? 1 : 3;

  const esGastoAsignacion = detMovEntregaRendir?.asignacionOrigenId != null;
  const tipoGasto = esGastoAsignacion ? "GASTO DE ASIGNACIÓN" : "GASTO ELEVADO";

  return (
    <Dialog
      visible={visible}
      style={{ width: "700px" }}
      header="🔄 Generar Documentos Financieros"
      modal
      onHide={onHide}
    >
      <div className="p-fluid">
        {/* INFORMACIÓN DEL GASTO */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#F5F5F5", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#424242" }}>📋 Información del Gasto</h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
            <div>
              <strong>Tipo de Gasto:</strong>
              <div style={{ color: esGastoAsignacion ? "#D32F2F" : "#1976D2", fontWeight: "bold" }}>
                {esGastoAsignacion ? "🔴" : "🔵"} {tipoGasto}
              </div>
            </div>

            {esGastoAsignacion && detMovEntregaRendir?.asignacionOrigen && (
              <div>
                <strong>Asignación:</strong>
                <div>MOV-{detMovEntregaRendir.asignacionOrigenId} - {detMovEntregaRendir.moneda?.simbolo} {Number(detMovEntregaRendir.asignacionOrigen.monto).toFixed(2)}</div>
              </div>
            )}

            <div>
              <strong>Responsable:</strong>
              <div>{detMovEntregaRendir?.responsable ? `${detMovEntregaRendir.responsable.nombres} ${detMovEntregaRendir.responsable.apellidos}`.trim() : "-"}</div>
            </div>

            <div>
              <strong>Proveedor:</strong>
              <div>{detMovEntregaRendir?.entidadComercial?.razonSocial || "-"}</div>
            </div>

            <div>
              <strong>Comprobante:</strong>
              <div>{numeroComprobante}</div>
            </div>

            <div>
              <strong>Fecha:</strong>
              <div>{detMovEntregaRendir?.fechaMovimiento ? new Date(detMovEntregaRendir.fechaMovimiento).toLocaleDateString("es-PE") : "-"}</div>
            </div>

            <div>
              <strong>Producto:</strong>
              <div>{detMovEntregaRendir?.producto?.descripcionArmada || "-"}</div>
            </div>

            <div>
              <strong>Centro Costo:</strong>
              <div>{detMovEntregaRendir?.centroCosto ? `${detMovEntregaRendir.centroCosto.Codigo} - ${detMovEntregaRendir.centroCosto.Nombre}` : "-"}</div>
            </div>

            <div>
              <strong>Unidad de Negocio:</strong>
              {detMovEntregaRendir?.unidadNegocioOrigen?.nombre ? (
                <div>{detMovEntregaRendir.unidadNegocioOrigen.nombre}</div>
              ) : (
                <div style={{ color: "#D32F2F", fontSize: "0.85rem" }}>
                  {detMovEntregaRendir?.unidadNegocioOrigen?.motivo || "Cargando..."}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#FFFFFF", borderRadius: "4px", border: "1px solid #E0E0E0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "right" }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Subtotal:</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{detMovEntregaRendir?.moneda?.simbolo} {subtotal.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>{sinIGV ? "IGV:" : "IGV (18%):"}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{detMovEntregaRendir?.moneda?.simbolo} {igv.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>TOTAL:</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#1976D2" }}>{detMovEntregaRendir?.moneda?.simbolo} {montoTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTOS QUE SE GENERARÁN */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#E3F2FD", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#1976D2" }}>✅ Documentos que se Generarán Automáticamente</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0.5rem", backgroundColor: "#FFFFFF", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5rem", marginRight: "0.75rem" }}>1️⃣</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>📄 Orden de Compra</div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Numeración interna: Orden de Compra, serie 002 (auto-generado)</div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Tipo: {esGerencial ? "GERENCIAL (sin comprobante)" : "FISCAL"}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", padding: "0.5rem", backgroundColor: "#FFFFFF", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5rem", marginRight: "0.75rem" }}>2️⃣</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>💰 Cuenta por Pagar</div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Comprobante: {numeroComprobante}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", padding: "0.5rem", backgroundColor: "#FFFFFF", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5rem", marginRight: "0.75rem" }}>3️⃣</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>💵 Pago Automático</div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Medio: EFECTIVO</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", padding: "0.5rem", backgroundColor: "#FFFFFF", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5rem", marginRight: "0.75rem" }}>4️⃣</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>📊 {esGerencial ? "Asiento Contable Gerencial (Pago + Destino)" : "Asientos Contables (Compra, Destino y Pago)"}</div>
                <div style={{ fontSize: "0.85rem", color: "#757575" }}>Cantidad: {cantidadAsientos} (numeración auto-generada)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ADVERTENCIAS */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#FFF3E0", borderRadius: "4px", border: "1px solid #FFB74D" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <i className="pi pi-exclamation-triangle" style={{ fontSize: "1.5rem", color: "#F57C00", marginRight: "0.75rem" }}></i>
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#E65100" }}>⚠️ Advertencias Importantes</div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
                <li>Esta operación NO se puede deshacer</li>
                <li>Se generarán {3 + cantidadAsientos} documentos automáticamente</li>
                <li>Si la Orden de Compra ya existe, se le pedirá elegir cómo continuar</li>
                <li>La cuenta por pagar quedará PAGADA y CANCELADA</li>
                <li>El proceso es una transacción completa (todo o nada)</li>
              </ul>
            </div>
          </div>
        </div>

        {errorGeneracion && (
          <Message
            severity="error"
            className="w-full mb-3 justify-content-start"
            content={
              <div>
                <strong>No se pudieron generar los documentos:</strong>
                <div>{errorGeneracion}</div>
              </div>
            }
          />
        )}

              {/* INDICADOR DE PROGRESO */}
        {generandoDocumentos && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.5rem',
              color: '#3b82f6',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <i className="pi pi-spin pi-spinner"></i>
              <span>Generando documentos financieros, por favor espere...</span>
            </div>
            <ProgressBar 
              mode="indeterminate" 
              style={{ height: '6px' }}
            />
          </div>
        )}

        {/* BOTONES */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            className="p-button-secondary"
            disabled={generandoDocumentos}
          />
          <Button
            label={generandoDocumentos ? "Generando..." : "✅ Confirmar y Generar Documentos"}
            icon={generandoDocumentos ? "pi pi-spin pi-spinner" : "pi pi-check"}
            onClick={() => handleGenerar()}
            className="p-button-success"
            disabled={generandoDocumentos}
          />
        </div>
      </div>

      {/* DECISIÓN CUANDO LA ORDEN DE COMPRA YA EXISTE */}
      <Dialog
        visible={!!decisionOC}
        style={{ width: "560px" }}
        header="⚠ Ya existe una Orden de Compra para este gasto"
        modal
        onHide={() => setDecisionOC(null)}
      >
        {decisionOC && (
          <div className="p-fluid">
            <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#F5F5F5", borderRadius: "4px", fontSize: "0.9rem" }}>
              <div>
                <strong>OC {decisionOC.ordenCompra.numeroDocumento}</strong>
                {decisionOC.ordenCompra.proveedor ? ` · ${decisionOC.ordenCompra.proveedor}` : ""}
                {` · ${detMovEntregaRendir?.moneda?.simbolo || ""} ${Number(decisionOC.ordenCompra.total || 0).toFixed(2)}`}
                {decisionOC.ordenCompra.fechaDocumento
                  ? ` · ${new Date(decisionOC.ordenCompra.fechaDocumento).toLocaleDateString("es-PE", { timeZone: "UTC" })}`
                  : ""}
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                Tiene: CxP {decisionOC.tiene.cuentaPorPagar ? "✔" : "✘"} · Pago {decisionOC.tiene.pago ? "✔" : "✘"} · Asientos {decisionOC.tiene.asientos ? "✔" : "✘"}
              </div>
            </div>

            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>¿Qué desea hacer?</div>
            {[
              { valor: "A", titulo: "A. Solo actualizar referencias", detalle: "Origen, activo y URL del comprobante. No se genera nada más." },
              { valor: "B", titulo: "B. Actualizar y completar lo que falte", detalle: "Se crean la CxP, el pago y los asientos que no existan." },
              { valor: "C", titulo: "C. Borrar y volver a generar todo", detalle: "Elimina OC, CxP, pagos y asientos de este gasto y los genera de nuevo (consume un correlativo nuevo)." },
            ]
              .filter((opcion) => decisionOC.opciones.includes(opcion.valor))
              .map((opcion) => (
                <div key={opcion.valor} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <RadioButton
                    inputId={`accionOC${opcion.valor}`}
                    value={opcion.valor}
                    checked={accionOC === opcion.valor}
                    onChange={(e) => setAccionOC(e.value)}
                  />
                  <label htmlFor={`accionOC${opcion.valor}`} style={{ cursor: "pointer" }}>
                    <div style={{ fontWeight: "bold", color: opcion.valor === "C" ? "#D32F2F" : undefined }}>{opcion.titulo}</div>
                    <div style={{ fontSize: "0.85rem", color: "#757575" }}>{opcion.detalle}</div>
                  </label>
                </div>
              ))}

            {accionOC === "C" && (
              <Message
                severity="warn"
                className="w-full mb-3 justify-content-start"
                text="Se eliminarán documentos contables ya generados. Esta acción no se puede deshacer."
              />
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={() => setDecisionOC(null)}
                disabled={generandoDocumentos}
              />
              <Button
                label={generandoDocumentos ? "Procesando..." : "Confirmar"}
                icon={generandoDocumentos ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className={accionOC === "C" ? "p-button-danger" : "p-button-success"}
                onClick={() => handleGenerar(accionOC)}
                disabled={generandoDocumentos}
              />
            </div>
          </div>
        )}
      </Dialog>
    </Dialog>
  );
}