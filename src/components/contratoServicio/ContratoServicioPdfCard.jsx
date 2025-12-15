// src/components/contratoServicio/ContratoServicioPdfCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";

const ContratoServicioPdfCard = ({
  urlContratoPdf,
  setUrlContratoPdf,
  toast,
  contratoId,
  readOnly = false,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Convertir contratoId a number
  const contratoIdNumber = contratoId ? Number(contratoId) : null;

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlContratoPdf) {
      abrirPdfEnNuevaPestana(
        urlContratoPdf,
        toast,
        "No hay PDF del contrato disponible"
      );
    }
  };

  // Función para descargar PDF usando función genérica
  const handleDescargarPDF = () => {
    descargarPdf(
      urlContratoPdf,
      toast?.current,
      `contrato-${contratoIdNumber || 'documento'}.pdf`
    );
  };

  // Función para abrir captura con validación
  const handleAbrirCaptura = () => {
    if (readOnly) return;
    if (!contratoIdNumber) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el contrato antes de subir el PDF",
        life: 3000,
      });
      return;
    }
    setMostrarCaptura(true);
  };

  // Función para manejar PDF subido
  const handlePdfSubido = (urlDocumento) => {
    setUrlContratoPdf(urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El PDF del contrato se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="Documento PDF del Contrato"
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
            <label htmlFor="urlContratoPdf">
              Contrato PDF
            </label>
            <InputText
              id="urlContratoPdf"
              value={urlContratoPdf || ""}
              placeholder="URL del contrato PDF"
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
                onClick={handleAbrirCaptura}
                disabled={readOnly}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlContratoPdf && (
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <Button
                  type="button"
                  label="Ver"
                  icon="pi pi-eye"
                  className="p-button-success"
                  size="small"
                  onClick={handleVerPDF}
                />
                <Button
                  type="button"
                  label="Descargar"
                  icon="pi pi-download"
                  className="p-button-help"
                  size="small"
                  onClick={handleDescargarPDF}
                />
              </div>
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {urlContratoPdf && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlContratoPdf} />
          </div>
        )}

        {/* Modal de captura de documento */}
        {mostrarCaptura && contratoIdNumber && (
          <DocumentoCapture
            visible={mostrarCaptura}
            onHide={() => setMostrarCaptura(false)}
            onDocumentoSubido={handlePdfSubido}
            endpoint={`${
              import.meta.env.VITE_API_URL
            }/contrato-servicio-pdf/upload-pdf`}
            titulo="Capturar/Subir PDF del Contrato"
            toast={toast}
            extraData={{ contratoServicioId: contratoIdNumber }}
          />
        )}
      </div>
    </Card>
  );
};

export default ContratoServicioPdfCard;