/**
 * Card para Visualización y Combinación de PDFs de Documentación Requerida
 * 
 * Funcionalidades:
 * - Combina múltiples PDFs de documentos requeridos
 * - Vista previa del PDF combinado
 * - Descarga del documento unificado
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { PDFDocument } from "pdf-lib";

const VerImpresionDocumentacionPDF = ({
  cotizacion,
  documentos,
  toast,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documentosConPdf, setDocumentosConPdf] = useState([]);

  useEffect(() => {
    // Filtrar documentos que tienen URL de PDF
    const docsConUrl = documentos.filter((d) => d.urlDocumento);
    setDocumentosConPdf(docsConUrl);
  }, [documentos]);

  useEffect(() => {
    // Limpiar URL al desmontar
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const combinarPDFs = async () => {
    if (!cotizacion || !cotizacion.id) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cotización primero",
        life: 3000,
      });
      return;
    }

    if (documentosConPdf.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay documentos con PDF para combinar",
        life: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Crear documento PDF combinado
      const pdfCombinado = await PDFDocument.create();

      // Cargar y combinar cada PDF
      for (const doc of documentosConPdf) {
        try {
          // Cargar PDF desde URL
          const response = await fetch(doc.urlDocumento);
          const pdfBytes = await response.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);

          // Copiar todas las páginas al PDF combinado
          const copiedPages = await pdfCombinado.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
          );

          copiedPages.forEach((page) => {
            pdfCombinado.addPage(page);
          });
        } catch (error) {
          console.error(`Error al cargar PDF de ${doc.tipoDocumento?.nombre}:`, error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: `Error al cargar PDF: ${doc.tipoDocumento?.nombre}`,
            life: 3000,
          });
        }
      }

      // Generar PDF combinado
      const pdfBytes = await pdfCombinado.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Limpiar URL anterior si existe
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);

      toast.current?.show({
        severity: "success",
        summary: "PDF Combinado",
        detail: `Se combinaron ${documentosConPdf.length} documentos correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al combinar PDFs:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al combinar los PDFs",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = () => {
    if (!pdfUrl) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe combinar los PDFs primero",
        life: 3000,
      });
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Documentacion_${cotizacion?.numeroDocumento || "SN"}.pdf`;
    link.click();
  };

  // Templates para DataTable
  const tipoDocumentoTemplate = (rowData) => {
    return <span>{rowData.tipoDocumento?.nombre || "N/A"}</span>;
  };

  const estadoPdfTemplate = (rowData) => {
    return rowData.urlDocumento ? (
      <i className="pi pi-check-circle" style={{ color: "#4CAF50", fontSize: "1.2rem" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "#F44336", fontSize: "1.2rem" }} />
    );
  };

  const accionesTemplate = (rowData) => {
    if (!rowData.urlDocumento) return null;

    return (
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-info p-button-sm"
        onClick={() => window.open(rowData.urlDocumento, "_blank")}
        tooltip="Ver PDF"
        tooltipOptions={{ position: "bottom" }}
      />
    );
  };

  return (
    <div className="card">
      <h3>Documentación Requerida - PDFs</h3>

      <div className="grid">
        {/* Lista de documentos */}
        <div className="col-12 md:col-4">
          <div className="card" style={{ backgroundColor: "#f8f9fa", padding: "1rem" }}>
            <h4 style={{ marginTop: 0 }}>Documentos</h4>

            <DataTable
              value={documentos}
              emptyMessage="No hay documentos"
              size="small"
              stripedRows
            >
              <Column
                field="tipoDocumento.nombre"
                header="Documento"
                body={tipoDocumentoTemplate}
              />
              <Column
                field="urlDocumento"
                header="PDF"
                body={estadoPdfTemplate}
                style={{ width: "60px", textAlign: "center" }}
              />
              <Column
                header="Ver"
                body={accionesTemplate}
                style={{ width: "60px", textAlign: "center" }}
              />
            </DataTable>

            <div style={{ marginTop: "1rem" }}>
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "5px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ fontSize: "0.9rem", color: "#1976d2" }}>
                  <strong>Total Documentos:</strong> {documentos.length}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#1976d2" }}>
                  <strong>Con PDF:</strong> {documentosConPdf.length}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#1976d2" }}>
                  <strong>Sin PDF:</strong>{" "}
                  {documentos.length - documentosConPdf.length}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexDirection: "column",
              }}
            >
              <Button
                label="Combinar PDFs"
                icon="pi pi-file-pdf"
                className="p-button-primary"
                onClick={combinarPDFs}
                loading={loading}
                disabled={
                  !cotizacion || !cotizacion.id || documentosConPdf.length === 0
                }
              />
              <Button
                label="Descargar PDF"
                icon="pi pi-download"
                className="p-button-success"
                onClick={descargarPDF}
                disabled={!pdfUrl}
              />
            </div>

            {documentosConPdf.length === 0 && documentos.length > 0 && (
              <div
                className="p-message p-message-warn"
                style={{ marginTop: "1rem" }}
              >
                <span>
                  No hay documentos con PDF cargado. Debe subir los PDFs en el
                  detalle de documentos requeridos.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa del PDF */}
        <div className="col-12 md:col-8">
          <div
            className="card"
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1rem",
              minHeight: "600px",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Vista Previa - PDF Combinado</h4>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                style={{
                  width: "100%",
                  height: "550px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                }}
                title="Vista previa PDF Documentación"
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "550px",
                  border: "2px dashed #ddd",
                  borderRadius: "5px",
                  color: "#999",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <i
                    className="pi pi-file-pdf"
                    style={{ fontSize: "4rem", marginBottom: "1rem" }}
                  />
                  <p style={{ fontSize: "1.2rem" }}>
                    Haga clic en "Combinar PDFs" para ver la vista previa
                  </p>
                  {documentosConPdf.length === 0 && documentos.length > 0 && (
                    <p style={{ fontSize: "1rem", color: "#f44336" }}>
                      No hay documentos con PDF para combinar
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerImpresionDocumentacionPDF;