/**
 * VerImpresionCotizacionVentasPDF.jsx
 *
 * Card para generar y visualizar el PDF de la cotización de ventas.
 * Permite generar, visualizar y descargar PDFs de cotizaciones.
 * Sigue el patrón profesional ERP Megui usando PDFViewer genérico y pdfUtils.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFCotizacionVentas } from "./CotizacionVentasPDF";

/**
 * Componente VerImpresionCotizacionVentasPDF
 * @param {Object} props - Props del componente
 * @param {number} props.cotizacionId - ID de la cotización
 * @param {Object} props.datosCotizacion - Datos completos de la cotización
 * @param {Array} props.detalles - Detalles de productos
 * @param {Array} props.costos - Costos de exportación
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 */
const VerImpresionCotizacionVentasPDF = ({
  cotizacionId,
  datosCotizacion = {},
  detalles = [],
  costos = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  // Opciones de generación
  const [incluirDetalles, setIncluirDetalles] = useState(true);
  const [incluirCostos, setIncluirCostos] = useState(false);
  const [incluirObservaciones, setIncluirObservaciones] = useState(true);
  const [incluirTerminos, setIncluirTerminos] = useState(true);
  const [notasAdicionales, setNotasAdicionales] = useState("");

  // Cargar URL del PDF si existe en datosCotizacion
  useEffect(() => {
    if (datosCotizacion?.urlCotizacionVentaPdf) {
      setPdfUrl(datosCotizacion.urlCotizacionVentaPdf);
    }
  }, [datosCotizacion?.urlCotizacionVentaPdf]);

  /**
   * Genera el PDF de la cotización
   */
  const handleGenerarPDF = async () => {
    if (!datosCotizacion?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cotización antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    if (detalles.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe agregar al menos un producto para generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      // Obtener empresa de la cotización
      const empresa = datosCotizacion.empresa;

      // Opciones de generación
      const opciones = {
        incluirDetalles,
        incluirCostos,
        incluirObservaciones,
        incluirTerminos,
        notasAdicionales: notasAdicionales.trim(),
      };

      // Generar y subir el PDF
      const resultado = await generarYSubirPDFCotizacionVentas(
        datosCotizacion,
        detalles,
        costos,
        empresa,
        opciones
      );

      if (resultado.success) {
        const urlPdf = resultado.urlPdf;
        setPdfUrl(urlPdf);

        // Actualizar datosCotizacion con la nueva URL
        if (datosCotizacion && urlPdf) {
          datosCotizacion.urlCotizacionVentaPdf = urlPdf;
        }

        // Notificar al componente padre
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(urlPdf);
        }

        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "PDF generado y guardado correctamente",
          life: 3000,
        });
      } else {
        throw new Error(resultado.error || "Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al generar el PDF",
        life: 3000,
      });
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Abre el PDF en una nueva pestaña
   */
  const handleVerPDF = () => {
    if (pdfUrl) {
      abrirPdfEnNuevaPestana(pdfUrl, toast, "No hay PDF disponible");
    }
  };

  /**
   * Descarga el PDF
   */
  const handleDescargarPDF = () => {
    if (pdfUrl) {
      const nombreArchivo = `cotizacion-ventas-${
        datosCotizacion.numeroDocumento || cotizacionId
      }.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo, "cotizaciones-ventas");
    }
  };

  return (
    <Card>
      <div className="p-fluid">
        {/* Opciones de generación */}
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "5px",
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>
            Opciones de Generación
          </h4>

          <div className="grid">
            <div className="col-12 md:col-3">
              <div className="field-checkbox">
                <Checkbox
                  inputId="incluirDetalles"
                  checked={incluirDetalles}
                  onChange={(e) => setIncluirDetalles(e.checked)}
                />
                <label
                  htmlFor="incluirDetalles"
                  style={{ marginLeft: "0.5rem" }}
                >
                  Incluir Detalle de Productos
                </label>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="field-checkbox">
                <Checkbox
                  inputId="incluirCostos"
                  checked={incluirCostos}
                  onChange={(e) => setIncluirCostos(e.checked)}
                />
                <label htmlFor="incluirCostos" style={{ marginLeft: "0.5rem" }}>
                  Incluir Costos de Exportación
                </label>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="field-checkbox">
                <Checkbox
                  inputId="incluirObservaciones"
                  checked={incluirObservaciones}
                  onChange={(e) => setIncluirObservaciones(e.checked)}
                />
                <label
                  htmlFor="incluirObservaciones"
                  style={{ marginLeft: "0.5rem" }}
                >
                  Incluir Observaciones
                </label>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="field-checkbox">
                <Checkbox
                  inputId="incluirTerminos"
                  checked={incluirTerminos}
                  onChange={(e) => setIncluirTerminos(e.checked)}
                />
                <label
                  htmlFor="incluirTerminos"
                  style={{ marginLeft: "0.5rem" }}
                >
                  Incluir Términos y Condiciones
                </label>
              </div>
            </div>

            <div className="col-12">
              <label
                htmlFor="notasAdicionales"
                style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}
              >
                Notas Adicionales
              </label>
              <InputTextarea
                id="notasAdicionales"
                value={notasAdicionales}
                onChange={(e) => setNotasAdicionales(e.target.value.toUpperCase())}
                rows={2}
                placeholder="NOTAS ADICIONALES PARA EL PDF..."
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
        </div>

        {/* Botones y URL */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlPdf">
              URL del PDF (se genera automáticamente)
            </label>
            <div className="p-inputgroup">
              <input
                id="urlPdf"
                type="text"
                className="p-inputtext p-component"
                value={pdfUrl || ""}
                readOnly
                placeholder="No hay PDF generado"
                style={{
                  backgroundColor: "#f8f9fa",
                  cursor: "not-allowed",
                }}
              />
              <Button
                icon="pi pi-file-pdf"
                label="Generar PDF"
                className="p-button-success"
                onClick={handleGenerarPDF}
                disabled={!cotizacionId || generando || detalles.length === 0}
                loading={generando}
              />
            </div>
          </div>

          {/* Botón Ver PDF */}
          <div style={{ flex: 0.5 }}>
            {pdfUrl && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-info"
                size="small"
                onClick={handleVerPDF}
                tooltip="Abrir PDF en nueva pestaña"
                tooltipOptions={{ position: "top" }}
              />
            )}
          </div>

          {/* Botón Descargar PDF */}
          <div style={{ flex: 0.5 }}>
            {pdfUrl && (
              <Button
                type="button"
                label="Descargar"
                icon="pi pi-download"
                className="p-button-secondary"
                size="small"
                onClick={handleDescargarPDF}
                tooltip="Descargar PDF"
                tooltipOptions={{ position: "top" }}
              />
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {pdfUrl && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={pdfUrl} altura="800px" key={pdfKey} />
          </div>
        )}

        {/* Mensaje cuando no hay PDF */}
        {!pdfUrl && (
          <div style={{ marginTop: "1rem" }}>
            <Message
              severity="warn"
              text='No hay PDF generado. Use el botón "Generar PDF" para generar el documento de la cotización de ventas.'
              style={{ width: "100%" }}
            />
          </div>
        )}

        {/* Mensaje cuando no hay detalles */}
        {detalles.length === 0 && (
          <div style={{ marginTop: "1rem" }}>
            <Message
              severity="info"
              text="Debe agregar al menos un producto en el detalle para poder generar el PDF."
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionCotizacionVentasPDF;