/**
 * VerImpresionPreFacturaPDF.jsx
 *
 * Card para generar y visualizar el PDF de la pre-factura.
 * Permite generar, visualizar y descargar PDFs de pre-facturas.
 * Sigue el patrón profesional ERP Megui usando PDFViewer genérico y pdfUtils.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFPreFactura } from "./PreFacturaPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente VerImpresionPreFacturaPDF
 * @param {Object} props - Props del componente
 * @param {number} props.preFacturaId - ID de la pre-factura
 * @param {Object} props.datosPreFactura - Datos completos de la pre-factura
 * @param {Array} props.detalles - Detalles de productos
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 */
const VerImpresionPreFacturaPDF = ({
  preFacturaId,
  datosPreFactura = {},
  detalles = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    if (datosPreFactura?.urlPreFacturaPdf) {
      setPdfUrl(datosPreFactura.urlPreFacturaPdf);
    }
  }, [datosPreFactura]);

  const handleGenerarPDF = async () => {
    if (!preFacturaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la pre-factura antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);
    setError(null);

    try {
      const resultado = await generarYSubirPDFPreFactura(
        preFacturaId,
        datosPreFactura,
        detalles,
        usuario
      );

      if (resultado.success) {
        setPdfUrl(resultado.url);
        toast?.current?.show({
          severity: "success",
          summary: "PDF Generado",
          detail: "El PDF de la pre-factura se generó correctamente",
          life: 3000,
        });

        if (onPdfGenerated) {
          onPdfGenerated(resultado.url);
        }
      } else {
        throw new Error(resultado.error || "Error al generar PDF");
      }
    } catch (err) {
      console.error("Error al generar PDF:", err);
      setError(err.message || "Error al generar el PDF");
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Error al generar el PDF",
        life: 5000,
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleVerPDF = () => {
    if (pdfUrl) {
      abrirPdfEnNuevaPestana(pdfUrl);
    } else {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay PDF generado para visualizar",
        life: 3000,
      });
    }
  };

  const handleDescargarPDF = () => {
    if (pdfUrl) {
      const nombreArchivo = `PreFactura_${datosPreFactura.numeroDocumento || preFacturaId}.pdf`;
      descargarPdf(pdfUrl, nombreArchivo);
    } else {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay PDF generado para descargar",
        life: 3000,
      });
    }
  };

  const cardHeader = (
    <div className="flex justify-content-between align-items-center">
      <h3 className="m-0">Vista Previa PDF Pre-Factura</h3>
      <div className="flex gap-2">
        <Button
          label="Generar PDF"
          icon="pi pi-file-pdf"
          className="p-button-danger"
          onClick={handleGenerarPDF}
          loading={generando}
          disabled={!preFacturaId || generando}
          tooltip="Generar nuevo PDF"
          tooltipOptions={{ position: "bottom" }}
        />
        <Button
          label="Ver PDF"
          icon="pi pi-eye"
          className="p-button-info"
          onClick={handleVerPDF}
          disabled={!pdfUrl || generando}
          tooltip="Abrir PDF en nueva pestaña"
          tooltipOptions={{ position: "bottom" }}
        />
        <Button
          label="Descargar"
          icon="pi pi-download"
          className="p-button-success"
          onClick={handleDescargarPDF}
          disabled={!pdfUrl || generando}
          tooltip="Descargar PDF"
          tooltipOptions={{ position: "bottom" }}
        />
      </div>
    </div>
  );

  return (
    <Card header={cardHeader} className="mt-3">
      {error && (
        <Message
          severity="error"
          text={error}
          className="mb-3"
          style={{ width: "100%" }}
        />
      )}

      {!preFacturaId && (
        <Message
          severity="info"
          text="Guarde la pre-factura para poder generar el PDF"
          className="mb-3"
          style={{ width: "100%" }}
        />
      )}

      {generando && (
        <div className="flex flex-column align-items-center justify-content-center p-5">
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "3rem", color: "#007ad9" }}
          ></i>
          <p className="mt-3" style={{ color: "#666" }}>
            Generando PDF de la pre-factura...
          </p>
        </div>
      )}

      {!generando && pdfUrl && (
        <PDFViewer
          pdfUrl={pdfUrl}
          height="600px"
          titulo={`Pre-Factura ${datosPreFactura.numeroDocumento || preFacturaId}`}
        />
      )}

      {!generando && !pdfUrl && preFacturaId && (
        <div className="flex flex-column align-items-center justify-content-center p-5">
          <i
            className="pi pi-file-pdf"
            style={{ fontSize: "5rem", color: "#e74c3c" }}
          ></i>
          <h3 className="mt-3">No hay PDF generado</h3>
          <p style={{ color: "#666" }}>
            Haga clic en "Generar PDF" para crear el documento
          </p>
        </div>
      )}

      {datosPreFactura?.numeroDocumento && (
        <div className="mt-3 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
          <div className="grid">
            <div className="col-12 md:col-4">
              <strong>Número Documento:</strong>
              <div>{datosPreFactura.numeroDocumento}</div>
            </div>
            <div className="col-12 md:col-4">
              <strong>Código:</strong>
              <div>{datosPreFactura.codigo}</div>
            </div>
            <div className="col-12 md:col-4">
              <strong>Fecha:</strong>
              <div>
                {datosPreFactura.fechaDocumento
                  ? new Date(datosPreFactura.fechaDocumento).toLocaleDateString("es-PE")
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VerImpresionPreFacturaPDF;