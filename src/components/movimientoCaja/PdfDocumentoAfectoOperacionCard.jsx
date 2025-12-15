// src/components/movimientoCaja/PdfDocumentoAfectoOperacionCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const PdfDocumentoAfectoOperacionCard = ({
  urlDocumentoMovCaja,
  setUrlDocumentoMovCaja,
  toast,
  movimientoId,
  readOnly = false,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlDocumentoMovCaja) {
      abrirPdfEnNuevaPestana(
        urlDocumentoMovCaja,
        toast,
        "No hay documento afecto disponible"
      );
    }
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    setUrlDocumentoMovCaja(urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento afecto se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="Documento Afecto (Factura, Boleta, etc.)"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* URL del documento */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlDocumentoMovCaja">
              Documento Afecto PDF
            </label>
            <InputText
              id="urlDocumentoMovCaja"
              value={urlDocumentoMovCaja || ""}
              placeholder="URL del documento PDF"
              style={{ fontWeight: "bold" }}
              readOnly
            />
          </div>

          {/* Botones de acción */}
          <div style={{ flex: 0.5 }}>
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                label="Capturar/Subir"
                icon="pi pi-camera"
                className="p-button-info"
                size="small"
                onClick={() => setMostrarCaptura(true)}
                disabled={readOnly}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlDocumentoMovCaja && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-success"
                size="small"
                onClick={handleVerPDF}
              />
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {urlDocumentoMovCaja && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlDocumentoMovCaja} />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint={`${import.meta.env.VITE_API_URL}/movimientos-caja/upload-documento`}
          titulo="Capturar Documento Afecto"
          toast={toast}
          extraData={{ movimientoCajaId: movimientoId }}
        />
      </div>
    </Card>
  );
};

export default PdfDocumentoAfectoOperacionCard;