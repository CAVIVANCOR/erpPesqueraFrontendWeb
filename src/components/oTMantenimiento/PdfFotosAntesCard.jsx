// src/components/oTMantenimiento/PdfFotosAntesCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const PdfFotosAntesCard = ({
  urlFotosAntesPdf,
  setUrlFotosAntesPdf,
  toast,
  otMantenimientoId,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlFotosAntesPdf) {
      abrirPdfEnNuevaPestana(
        urlFotosAntesPdf,
        toast.current,
        "No hay PDF de fotos antes disponible"
      );
    }
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    setUrlFotosAntesPdf(urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El PDF de fotos antes se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="📸 Fotos Antes del Mantenimiento"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* URL del PDF */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlFotosAntesPdf">
              PDF de Fotos Antes
            </label>
            <InputText
              id="urlFotosAntesPdf"
              value={urlFotosAntesPdf || ""}
              placeholder="URL del PDF de fotos antes"
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
                disabled={!otMantenimientoId}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlFotosAntesPdf && (
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
        {urlFotosAntesPdf && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlFotosAntesPdf} />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint={`${
            import.meta.env.VITE_API_URL
          }/ot-mantenimiento/upload-fotos-antes`}
          titulo="Capturar/Subir Fotos Antes del Mantenimiento"
          toast={toast}
          extraData={{ otMantenimientoId: otMantenimientoId }}
        />
      </div>
    </Card>
  );
};

export default PdfFotosAntesCard;