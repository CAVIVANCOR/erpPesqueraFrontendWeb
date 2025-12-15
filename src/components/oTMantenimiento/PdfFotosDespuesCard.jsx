// src/components/oTMantenimiento/PdfFotosDespuesCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const PdfFotosDespuesCard = ({
  urlFotosDespuesPdf,
  setUrlFotosDespuesPdf,
  toast,
  otMantenimientoId,
  readOnly = false,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlFotosDespuesPdf) {
      abrirPdfEnNuevaPestana(
        urlFotosDespuesPdf,
        toast.current,
        "No hay PDF de fotos después disponible"
      );
    }
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    setUrlFotosDespuesPdf(urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El PDF de fotos después se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="📸 Fotos Después del Mantenimiento"
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
            <label htmlFor="urlFotosDespuesPdf">
              PDF de Fotos Después
            </label>
            <InputText
              id="urlFotosDespuesPdf"
              value={urlFotosDespuesPdf || ""}
              placeholder="URL del PDF de fotos después"
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
                disabled={readOnly || !otMantenimientoId}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlFotosDespuesPdf && (
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
        {urlFotosDespuesPdf && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlFotosDespuesPdf} />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint={`${
            import.meta.env.VITE_API_URL
          }/ot-mantenimiento/upload-fotos-despues`}
          titulo="Capturar/Subir Fotos Después del Mantenimiento"
          toast={toast}
          extraData={{ otMantenimientoId: otMantenimientoId }}
        />
      </div>
    </Card>
  );
};

export default PdfFotosDespuesCard;