// src/components/tesoreria/DocPrestamoAdicional.jsx
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { getResponsiveFontSize } from "../../utils/utils";

export default function DocPrestamoAdicional({
  prestamoId,
  documentoActual,
  readOnly = false,
  onDocumentoActualizado,
}) {
  const toast = useRef(null);
  const [mostrarCapturaDoc, setMostrarCapturaDoc] = useState(false);
  const [urlDocumento, setUrlDocumento] = useState(documentoActual || "");

  const handleDocumentoSubido = (urlDoc) => {
    setUrlDocumento(urlDoc);
    setMostrarCapturaDoc(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento adicional se ha subido correctamente",
      life: 3000,
    });
    
    // Notificar al componente padre si existe callback
    if (onDocumentoActualizado) {
      onDocumentoActualizado(urlDoc);
    }
  };

  const handleVerDocumento = () => {
    if (urlDocumento) {
      abrirPdfEnNuevaPestana(
        urlDocumento,
        toast,
        "No hay documento adicional disponible"
      );
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "No hay documento adicional disponible",
        life: 3000,
      });
    }
  };

  const handleDescargarDocumento = () => {
    descargarPdf(
      urlDocumento,
      toast?.current,
      `prestamo-adicional-${prestamoId || 'documento'}.pdf`
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Toast ref={toast} />

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10, color: "#495057" }}>
          <i className="pi pi-file-pdf" style={{ marginRight: 8 }}></i>
          Documentación Adicional del Préstamo
        </h3>
        <p style={{ color: "#6c757d", fontSize: "0.95rem", marginBottom: 20 }}>
          Suba documentación adicional relacionada al préstamo (garantías,
          anexos, cronogramas, etc.).
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 2 }}>
          <label
            htmlFor="urlDocAdicionalPDF"
            style={{
              fontWeight: "bold",
              fontSize: getResponsiveFontSize(),
              display: "block",
              marginBottom: 5,
            }}
          >
            URL del Documento Adicional
          </label>
          <InputText
            id="urlDocAdicionalPDF"
            value={urlDocumento || ""}
            placeholder="URL del documento PDF adicional"
            disabled
            readOnly
            style={{
              width: "100%",
              fontWeight: "bold",
              backgroundColor: "#f8f9fa",
            }}
          />
        </div>

        <div style={{ flex: 1, paddingTop: 24 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              type="button"
              label="Capturar/Subir"
              icon="pi pi-camera"
              severity="info"
              onClick={() => setMostrarCapturaDoc(true)}
              disabled={readOnly}
              size="small"
            />
            {urlDocumento && (
              <>
                <Button
                  type="button"
                  label="Ver"
                  icon="pi pi-eye"
                  severity="success"
                  onClick={handleVerDocumento}
                  size="small"
                />
                <Button
                  type="button"
                  label="Descargar"
                  icon="pi pi-download"
                  className="p-button-help"
                  onClick={handleDescargarDocumento}
                  size="small"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialog para captura de documento */}
      {mostrarCapturaDoc && (
        <DocumentoCapture
          visible={mostrarCapturaDoc}
          onHide={() => setMostrarCapturaDoc(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint={`${
            import.meta.env.VITE_API_URL
          }/tesoreria/prestamos-bancarios/upload-adicional`}
          datosAdicionales={{
            prestamoBancarioId: prestamoId,
            tipoDoc: "adicional",
          }}
          titulo="Subir Documentación Adicional del Préstamo"
          prefijo="prestamo-adicional"
          identificador={prestamoId || "nuevo"}
          mensajeInfo="Suba documentación adicional relacionada al préstamo (garantías, anexos, cronogramas, etc.)."
        />
      )}

      {/* Visor de PDF embebido */}
      {urlDocumento && (
        <div style={{ marginTop: 30 }}>
          <h4 style={{ marginBottom: 10, color: "#495057" }}>
            <i className="pi pi-file-pdf" style={{ marginRight: 8 }}></i>
            Vista Previa del Documento Adicional
          </h4>
          <PDFViewer urlDocumento={urlDocumento} altura="600px" />
        </div>
      )}

      {!urlDocumento && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: 5,
            color: "#0c5460",
          }}
        >
          <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
          <strong>Información:</strong> No se ha subido ningún documento
          adicional aún. Use el botón "Capturar/Subir" para agregar
          documentación complementaria del préstamo.
        </div>
      )}
    </div>
  );
}