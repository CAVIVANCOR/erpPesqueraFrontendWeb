/**
 * PdfComprobanteVentaCard.jsx - WRAPPER para Sistema PDF V2 + botones del comprobante electrónico
 *
 * Tarjeta del comprobante de una venta FISCAL, en la pestaña "Comprobante Electrónico". Reúne en UNA fila los botones del
 * comprobante y, debajo, el PDF (PDFDocumentManager, módulo "pre-factura", campo urlPreFacturaPdf; mismo patrón que
 * PdfComprobanteProveedorCard de Compras).
 *
 * BIFURCACIÓN (detalle completo en comprobanteElectronico.controller.js del backend). Se distingue por si la venta tiene o no
 * un comprobante en el ERP:
 *  - FLUJO A (histórico, emitido por el portal de SUNAT con Clave SOL; sin comprobante en el ERP): botón "Descargar PDF SUNAT"
 *    (json.pe) o subida manual del PDF. "Generar Comprobante Electrónico" advierte que duplicaría el documento ante SUNAT.
 *  - FLUJO B (nuevo, emitido por el ERP con Smart PSE; con comprobante en el ERP): descarga de XML firmado y CDR, que el servidor
 *    guarda al emitir. El PDF se sube o se descarga a mano; la tarjeta lo muestra o permite reemplazarlo.
 *
 * PreFacturaForm no usa React Hook Form y PDFDocumentManager sí lo exige, por eso este wrapper tiene su propio useForm.
 * La subida ya actualiza PreFactura.urlPreFacturaPdf en el servidor; onUrlChange solo avisa a la pantalla para que refresque.
 *
 * @param {number|string} props.preFacturaId - ID de la venta (OBLIGATORIO)
 * @param {string} props.urlPdf - URL actual del PDF (puede cambiar desde fuera: descarga SUNAT)
 * @param {Function} props.onUrlChange - Se llama con la URL nueva cuando el usuario sube un PDF
 * @param {Array} props.comprobantes - Comprobantes de la venta (los carga PreFacturaForm)
 * @param {Function} props.onGenerarComprobante - Genera y envía el comprobante a SUNAT por Smart PSE
 * @param {Object} props.sunat - { empresaId, tipoDoc, serie, correlativo, onSuccess } para "Descargar PDF SUNAT"
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import PDFDocumentManager from "../pdf/PDFDocumentManager";
import BotonDescargarPDFSunatVentas from "../common/BotonDescargarPDFSunatVentas";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { mensajeDeError } from "../../utils/mensajeError";

const ETIQUETA_TIPO_DOCUMENTO = { 2: "Factura", 4: "Boleta", 8: "Nota de Crédito", 9: "Nota de Débito" };

const PdfComprobanteVentaCard = ({
  preFacturaId,
  urlPdf,
  onUrlChange,
  comprobantes = [],
  estadoId,
  tipoDocumentoId,
  numeroDocumentoFinal,
  numCorreDocFinal,
  toast,
  onGenerarComprobante,
  sunat,
  readOnly = false,
}) => {
  const {
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { urlPreFacturaPdf: urlPdf || "" } });
  const [generando, setGenerando] = useState(false);

  // La URL puede cambiar desde fuera de la tarjeta (descarga de SUNAT)
  useEffect(() => {
    setValue("urlPreFacturaPdf", urlPdf || "");
  }, [urlPdf, setValue]);

  // Subida manual: se avisa a la pantalla solo si la URL es distinta de la que ya conoce (evita ciclos)
  const urlActual = watch("urlPreFacturaPdf");
  useEffect(() => {
    if (urlActual && urlActual !== urlPdf && onUrlChange) onUrlChange(urlActual);
  }, [urlActual]);

  const yaGenerado = comprobantes.length > 0;
  const puedeGenerar = Number(estadoId) === 96;
  const tipoLabel = ETIQUETA_TIPO_DOCUMENTO[Number(tipoDocumentoId)] || "Comprobante";
  const comprobanteConXml = comprobantes.find((c) => c.rutaLocalXML);
  const comprobanteConCdr = comprobantes.find((c) => c.rutaLocalCDR);
  const sunatCompleto = sunat?.tipoDoc && sunat?.serie && sunat?.correlativo;

  const generar = async () => {
    try {
      setGenerando(true);
      await onGenerarComprobante();
    } finally {
      setGenerando(false);
    }
  };

  const handleGenerarClick = () => {
    // FLUJO A: documento ya numerado (emitido fuera del ERP, por el portal de SUNAT). El usuario decide antes de que el ERP asigne otro número.
    if (String(numCorreDocFinal || "").trim()) {
      confirmDialog({
        message: `Este documento ya tiene el número ${numeroDocumentoFinal || numCorreDocFinal}, emitido fuera del ERP. Si continúa, el ERP generará un NUEVO comprobante con otro correlativo y ese número reemplazará al actual en la venta; el documento original quedaría duplicado ante SUNAT. Si solo necesita el PDF del documento ya emitido, cancele y use "Descargar PDF SUNAT". ¿Desea emitir un comprobante nuevo?`,
        header: "El documento ya tiene numeración",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sí, emitir nuevo",
        rejectLabel: "Cancelar",
        acceptClassName: "p-button-danger",
        accept: generar,
      });
      return;
    }
    generar();
  };

  // XML firmado y CDR se guardan en el servidor al emitir; se descargan con el token del ERP (no son archivos públicos).
  // Mismo mecanismo de descarga de PDFActionButtons; no se reutiliza ese componente porque reserva una celda para su botón "Ver"
  // y rompería la fila única de botones.
  const descargarArchivoComprobante = async (tipo, nombreArchivo) => {
    try {
      const token = useAuthStore.getState().token;
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/pre-facturas/comprobante-archivo/${preFacturaId}/${tipo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) {
        let motivo = `HTTP ${respuesta.status}`;
        try {
          const cuerpo = await respuesta.json();
          motivo = cuerpo.mensaje || cuerpo.message || motivo;
        } catch {
          /* la respuesta no era JSON: se usa el código HTTP */
        }
        throw new Error(motivo);
      }
      const url = window.URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeDeError(error, `No se pudo descargar el ${tipo.toUpperCase()} del servidor`),
        life: 8000,
      });
    }
  };

  // Cada botón va en una celda flex:1 dentro de .p-fluid, igual que la fila de PDFDocumentManager
  const celda = (clave, contenido, flex = 1) => (
    <div key={clave} style={{ flex }}>
      {contenido}
    </div>
  );

  return (
    <>
      <div
        className="p-fluid"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "stretch",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {celda(
          "generar",
          <Button
            type="button"
            label={`Generar Comprobante Electrónico (${tipoLabel})`}
            icon="pi pi-file-check"
            className="p-button-success"
            onClick={handleGenerarClick}
            loading={generando}
            disabled={readOnly || !puedeGenerar || yaGenerado || generando}
            tooltip={
              yaGenerado
                ? "El comprobante electrónico ya fue generado"
                : !puedeGenerar
                  ? "La PreFactura debe estar EMITIDA y no ser gerencial"
                  : `Generar ${tipoLabel} Electrónica`
            }
            tooltipOptions={{ position: "top" }}
          />,
          2,
        )}
        {/* FLUJO B: la venta tiene comprobante emitido por el ERP */}
        {comprobanteConXml &&
          celda(
            "xml",
            <Button
              type="button"
              label="Descargar XML"
              icon="pi pi-download"
              className="p-button-outlined"
              onClick={() => descargarArchivoComprobante("xml", `${comprobanteConXml.numeroCompleto}.${comprobanteConXml.rutaLocalXML.endsWith(".zip") ? "zip" : "xml"}`)}
            />,
          )}
        {comprobanteConCdr &&
          celda(
            "cdr",
            <Button
              type="button"
              label="Descargar CDR"
              icon="pi pi-download"
              className="p-button-outlined"
              onClick={() => descargarArchivoComprobante("cdr", `CDR-${comprobanteConCdr.numeroCompleto}.${comprobanteConCdr.rutaLocalCDR.endsWith(".zip") ? "zip" : "xml"}`)}
            />,
          )}
        {/* FLUJO A: histórico, sin comprobante en el ERP; el PDF se baja de SUNAT (json.pe) */}
        {!yaGenerado &&
          sunatCompleto &&
          celda(
            "sunat",
            <BotonDescargarPDFSunatVentas
              empresaId={sunat.empresaId}
              entityId={preFacturaId}
              tipoDoc={sunat.tipoDoc}
              serie={sunat.serie}
              correlativo={sunat.correlativo}
              toastRef={toast}
              onSuccess={sunat.onSuccess}
              onError={(error) => console.error("Error en descarga de PDF:", error)}
            />,
          )}
      </div>

      <PDFDocumentManager
        moduleName="pre-factura"
        fieldName="urlPreFacturaPdf"
        entityId={preFacturaId}
        title="PDF del Comprobante"
        dialogTitle="Subir PDF del Comprobante"
        uploadButtonLabel="Capturar/Subir PDF"
        viewButtonLabel="Ver"
        downloadButtonLabel="Descargar"
        emptyMessage="No hay PDF del comprobante cargado"
        emptyDescription="Suba el PDF del comprobante emitido por el portal de SUNAT, descárguelo de SUNAT o cárguelo desde su equipo."
        control={control}
        errors={errors}
        setValue={setValue}
        watch={watch}
        getValues={getValues}
        defaultValues={{ urlPreFacturaPdf: urlPdf || "" }}
        readOnly={readOnly}
      />
    </>
  );
};

export default PdfComprobanteVentaCard;