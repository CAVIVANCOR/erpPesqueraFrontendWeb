// src/components/accesoInstalacion/cards/DocumentosAdjuntosCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import { Message } from "primereact/message";

import PDFMultiCapture from "../../pdf/PDFMultiCapture";
import PDFViewerV2 from "../../pdf/PDFViewerV2";
import PDFActionButtons from "../../pdf/PDFActionButtons";

const DocumentosAdjuntosCard = ({
  control,
  watch,
  getFormErrorMessage,
  setValue,
  toast,
  accesoSellado = false,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

  const urlDocumento = watch("urlDocumentoVisitante");
  const entityId = watch("id") || watch("accesoInstalacionId") || null;

  const handlePdfComplete = (url) => {
    setValue("urlDocumentoVisitante", url, { shouldValidate: true });
    setPdfRefreshKey((k) => k + 1);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento se consolidó y subió correctamente",
      life: 3000,
    });
  };

  const handlePdfError = (error) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: error?.message || "No se pudo subir el documento",
      life: 4000,
    });
  };

  return (
    <>
      <Card
        title="Documentos Adjuntos"
        subTitle="Documentación del visitante (Guias, Facturas, Files, etc.) y archivos relacionados"
        className="mb-4"
      >
        <div className="formgrid grid">
          <div className="field col-12">
            <div className="flex justify-content-between align-items-center mb-3">
              <Button
                type="button"
                label="Capturar/Subir Documento"
                icon="pi pi-upload"
                className="p-button-outlined"
                onClick={() => setMostrarCaptura(true)}
                disabled={accesoSellado || !entityId}
                tooltip="Subir múltiples archivos (PDF/Imágenes). Se consolidarán en un único PDF."
                tooltipOptions={{ position: "left" }}
              />
            </div>
            {!entityId && (
              <Message
                severity="warn"
                text="Guarda primero el registro para habilitar la subida de documentos."
              />
            )}
          </div>

          <div className="field col-12">
            <Controller
              name="urlDocumentoVisitante"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlDocumentoVisitante"
                  {...field}
                  placeholder="URL del documento del visitante"
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                  readOnly
                  disabled={accesoSellado}
                />
              )}
            />
            {getFormErrorMessage("urlDocumentoVisitante")}
          </div>

          {urlDocumento && (
            <div className="field col-12">
              <div style={{ marginBottom: "0.75rem" }}>
                <PDFActionButtons
                  pdfUrl={urlDocumento}
                  moduleName="acceso-instalacion"
                  fileName={`documento-visitante-${entityId || "sin-id"}.pdf`}
                  viewButtonLabel="Abrir"
                  downloadButtonLabel="Descargar"
                  toast={toast}
                />
              </div>

              <PDFViewerV2
                pdfUrl={urlDocumento}
                moduleName="acceso-instalacion"
                height="600px"
                key={pdfRefreshKey}
              />
            </div>
          )}

          {!urlDocumento && (
            <div className="field col-12">
              <div
                className="text-center p-4"
                style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}
              >
                <i
                  className="pi pi-file-pdf text-gray-400"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-600 mt-3 mb-2">No hay documento cargado</p>
                <small className="text-500">
                  Use el botón "Capturar/Subir Documento" para agregar documentos
                  del visitante.
                </small>
              </div>
            </div>
          )}
        </div>
      </Card>

      <PDFMultiCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        moduleName="acceso-instalacion"
        entityId={entityId}
        dialogTitle="Subir Documentos del Visitante"
        onComplete={handlePdfComplete}
        onError={handlePdfError}
      />
    </>
  );
};

export default DocumentosAdjuntosCard;