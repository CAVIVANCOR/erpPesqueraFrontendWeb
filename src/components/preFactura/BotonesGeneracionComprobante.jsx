// src/components/preFactura/BotonesGeneracionComprobante.jsx
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { confirmDialog } from "primereact/confirmdialog";
import { enviarComprobanteASunat } from "../../api/facturacionElectronica/comprobanteElectronico";
import { mensajeDeError } from "../../utils/mensajeError";

/**
 * Pestaña "Comprobante Electrónico" de la PreFactura: lista los comprobantes generados (FLUJO B, Factpro) con su estado y
 * permite enviar a SUNAT el que aún no fue emitido.
 *
 * Los botones de acción (Generar Comprobante Electrónico, Obtener de Factpro, Descargar XML/CDR y Descargar PDF SUNAT)
 * están en una sola fila dentro de la tarjeta del PDF: ver PdfComprobanteVentaCard.jsx.
 * La bifurcación histórico (FLUJO A) / Factpro (FLUJO B) está explicada en comprobanteElectronico.controller.js del backend.
 *
 * @param {Array} props.comprobantes - Comprobantes de la venta (los carga PreFacturaForm)
 * @param {Function} props.onRecargar - Recarga comprobantes y venta tras enviar a SUNAT
 */
const BotonesGeneracionComprobante = ({ comprobantes = [], toast, onRecargar }) => {
  const [enviandoId, setEnviandoId] = useState(null);

  // Emite el comprobante en Factpro; al volver, el servidor ya copió el PDF al ERP si SUNAT lo aceptó
  const handleEnviarASunat = (comprobante) => {
    confirmDialog({
      message: `¿Está seguro de enviar el comprobante ${comprobante.numeroCompleto} a SUNAT?`,
      header: "Confirmar Envío a SUNAT",
      icon: "pi pi-send",
      acceptLabel: "Enviar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setEnviandoId(comprobante.id);
          const resultado = await enviarComprobanteASunat(comprobante.id);
          toast?.current?.show({
            severity: resultado.respuestaProveedor?.aceptadoPorSunat ? "success" : "warn",
            summary: resultado.respuestaProveedor?.aceptadoPorSunat ? "Éxito" : "Advertencia",
            detail: resultado.mensaje || "Comprobante enviado a SUNAT",
            life: 5000,
          });
          if (resultado.advertencia) {
            toast?.current?.show({ severity: "warn", summary: "PDF no guardado", detail: resultado.advertencia, life: 10000 });
          }
          if (onRecargar) await onRecargar();
        } catch (error) {
          console.error("Error al enviar a SUNAT:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: mensajeDeError(error, "No se pudo enviar el comprobante a SUNAT"),
            life: 8000,
          });
        } finally {
          setEnviandoId(null);
        }
      },
    });
  };

  if (comprobantes.length === 0) {
    return (
      <small className="text-gray-600">
        Esta venta no tiene comprobante electrónico en el ERP. Si es un documento histórico (emitido en el portal de SUNAT), solo
        conserva su PDF; si es nuevo, use "Generar Comprobante Electrónico" (botones sobre el PDF).
      </small>
    );
  }

  return (
    <div className="botones-generacion-comprobante">
      <h4 className="text-sm font-semibold mb-2">Comprobantes Generados:</h4>
      {comprobantes.map((comp) => (
        <div key={comp.id} className="mb-3">
          <div className="flex flex-wrap align-items-center gap-2 mb-2">
            <Badge
              value={`${comp.tipoComprobante?.descripcion || "Comprobante"}: ${comp.numeroCompleto || comp.id}`}
              severity={comp.aceptadoPorSunat ? "success" : "warning"}
              size="large"
            />
            {!comp.enlacePDF && (
              <Button
                type="button"
                label="Enviar a SUNAT"
                icon="pi pi-send"
                className="p-button-success p-button-sm"
                onClick={() => handleEnviarASunat(comp)}
                loading={enviandoId === comp.id}
                tooltip="Envía el comprobante a SUNAT a través de Factpro y trae su PDF"
                tooltipOptions={{ position: "top" }}
              />
            )}
          </div>
          {!comp.enlacePDF && (
            <small className="text-gray-600">
              El comprobante está generado pero aún no se envió a SUNAT: no hay PDF de Factpro. Use "Enviar a SUNAT".
            </small>
          )}
        </div>
      ))}
    </div>
  );
};

export default BotonesGeneracionComprobante;