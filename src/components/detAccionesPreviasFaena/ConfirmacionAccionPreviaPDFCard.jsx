// src/components/detAccionesPreviasFaena/ConfirmacionAccionPreviaPDFCard.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Controller } from "react-hook-form";
import { classNames } from "primereact/utils";

import PDFMultiCapture from "../pdf/PDFMultiCapture";
import PDFViewerV2 from "../pdf/PDFViewerV2";
import PDFActionButtons from "../pdf/PDFActionButtons";

export default function ConfirmacionAccionPreviaPDFCard({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
  toast,
}) {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

  const pdfUrl = watch("urlConfirmaAccionPdf");
  const entityId = getValues()?.id || defaultValues?.id;

  const handlePdfComplete = (url) => {
    setValue("urlConfirmaAccionPdf", url, { shouldValidate: true });
    
    // Auto-verificación: marcar como verificado al subir PDF
    setValue("verificado", true, { shouldValidate: true });
    
    setPdfRefreshKey((k) => k + 1);
    setMostrarCaptura(false);

    toast?.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El documento se consolidó y subió correctamente. Acción marcada como verificada.",
      life: 3000,
    });
  };

  const handlePdfError = (error) => {
    toast?.current?.show({
      severity: "error",
      summary: "Error",
      detail: error?.message || "No se pudo subir el documento",
      life: 4000,
    });
  };

  // Auto-verificación: si se elimina el PDF, desmarcar verificado
  useEffect(() => {
    if (!pdfUrl && watch("verificado")) {
      setValue("verificado", false, { shouldValidate: true });
    }
  }, [pdfUrl, setValue, watch]);

  return (
    <>
      <Card
        title="Confirmación de Acción Previa (PDF)"
        subTitle="Documento de confirmación de la acción previa realizada"
        className="mb-4"
      >
        <div className="p-fluid formgrid grid">
          <div className="field col-12">
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-end",
                marginBottom: "1rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="urlConfirmaAccionPdf" className="font-bold">
                  URL del Documento PDF
                </label>
                <Controller
                  name="urlConfirmaAccionPdf"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id="urlConfirmaAccionPdf"
                      {...field}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                      style={{ fontWeight: "bold" }}
                      placeholder="URL del documento de confirmación (se genera automáticamente al subir archivos)"
                      readOnly
                    />
                  )}
                />
                {errors.urlConfirmaAccionPdf && (
                  <small className="p-error">
                    {errors.urlConfirmaAccionPdf.message}
                  </small>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <Button
                  type="button"
                  label="Capturar/Subir"
                  icon="pi pi-upload"
                  onClick={() => setMostrarCaptura(true)}
                  disabled={readOnly || !entityId}
                  className="p-button-primary"
                  tooltip="Subir múltiples archivos (PDF/Imágenes). Se consolidarán automáticamente."
                  tooltipOptions={{ position: "top" }}
                />
              </div>

              <div style={{ flex: 2 }}>
                {pdfUrl && (
                  <PDFActionButtons
                    pdfUrl={pdfUrl}
                    moduleName="confirmaciones-acciones-previas"
                    fileName={`confirmacion-accion-previa-${entityId || "sin-id"}.pdf`}
                    viewButtonLabel="Ver"
                    downloadButtonLabel="Descargar"
                    toast={toast}
                  />
                )}
              </div>
            </div>

            {!entityId && (
              <Message
                severity="warn"
                text="Guarda primero el registro para habilitar la subida de documentos."
              />
            )}
          </div>

          {pdfUrl && (
            <div className="field col-12">
              <PDFViewerV2
                pdfUrl={pdfUrl}
                moduleName="confirmaciones-acciones-previas"
                height="600px"
                key={pdfRefreshKey}
              />
            </div>
          )}

          {!pdfUrl && (
            <div className="field col-12">
              <div
                className="text-center p-4"
                style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}
              >
                <i
                  className="pi pi-file-pdf text-gray-400"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-600 mt-3 mb-2">
                  No hay documento de confirmación cargado
                </p>
                <small className="text-500">
                  Use el botón "Capturar/Subir" para agregar el documento de
                  confirmación. Al subir el PDF, la acción se marcará
                  automáticamente como verificada.
                </small>
              </div>
            </div>
          )}
        </div>
      </Card>

      <PDFMultiCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        moduleName="confirmaciones-acciones-previas"
        entityId={entityId}
        dialogTitle="Subir Confirmación de Acción Previa"
        onComplete={handlePdfComplete}
        onError={handlePdfError}
      />
    </>
  );
}