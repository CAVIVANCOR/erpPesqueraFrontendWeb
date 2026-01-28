/**
 * PDFDocumentManager.jsx - Componente GENÉRICO para gestión de documentos PDF
 *
 * Componente reutilizable que maneja todo el ciclo de vida de un documento PDF:
 * - Botón de captura/upload
 * - Visualización del PDF
 * - Botones de ver y descargar
 * - Integración con React Hook Form
 * - Configuración automática desde pdfConfigV2.js
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import PDFMultiCapture from "./PDFMultiCapture";
import PDFViewerV2 from "./PDFViewerV2";
import PDFActionButtons from "./PDFActionButtons";
import { getModuleConfig } from "../../utils/pdf/pdfConfigV2";

/**
 * Componente PDFDocumentManager
 *
 * @param {string} moduleName - Nombre del módulo (ej: "temporada-pesca"). Busca config en pdfConfigV2.js
 * @param {string} fieldName - Nombre del campo en el formulario (ej: "urlResolucionPdf")
 * @param {number|string} entityId - ID de la entidad (OBLIGATORIO para generar nombre estándar)
 * @param {string} title - Título del Card
 * @param {string} dialogTitle - Título del diálogo de captura
 * @param {string} uploadButtonLabel - Label del botón de upload
 * @param {string} viewButtonLabel - Label del botón ver (default: "Ver")
 * @param {string} downloadButtonLabel - Label del botón descargar (default: "Descargar")
 * @param {string} emptyMessage - Mensaje cuando no hay PDF
 * @param {string} emptyDescription - Descripción cuando no hay PDF
 * @param {Object} control - React Hook Form control
 * @param {Object} errors - Errores de validación
 * @param {Function} setValue - Función para setear valores
 * @param {Function} watch - Función para observar cambios
 * @param {Function} getValues - Función para obtener valores
 * @param {Object} defaultValues - Valores por defecto
 * @param {boolean} readOnly - Modo solo lectura
 */
export default function PDFDocumentManager({
  moduleName,
  fieldName,
  entityId,
  title = "Documento PDF",
  dialogTitle = "Subir Documento PDF",
  uploadButtonLabel = "Subir PDF",
  viewButtonLabel = "Ver",
  downloadButtonLabel = "Descargar",
  emptyMessage = "No hay documento cargado",
  emptyDescription = "Use el botón para agregar documentos PDF",
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const toastPDF = useRef(null);
  const pdfUrl = watch(fieldName);

  const config = getModuleConfig(moduleName);

  const handlePdfComplete = (url) => {
    setValue(fieldName, url, { shouldValidate: true });
    setPdfRefreshKey((prevKey) => prevKey + 1);
    setMostrarCaptura(false);

    toastPDF.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El documento se consolidó y subió correctamente",
      life: 3000,
    });
  };

  const handlePdfError = (error) => {
    toastPDF.current?.show({
      severity: "error",
      summary: "Error",
      detail: error.message || "No se pudo subir el documento",
      life: 4000,
    });
  };

  return (
    <>
      <Toast ref={toastPDF} />

      <Card title={title}>
        <div className="p-fluid formgrid grid">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 5,
              marginBottom: "1rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor={fieldName} className="font-bold">
                URL del Documento PDF
              </label>
              <Controller
                name={fieldName}
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    id={fieldName}
                    {...field}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    style={{ fontWeight: "bold" }}
                    placeholder="URL del PDF (se genera automáticamente al subir archivos)"
                    readOnly
                  />
                )}
              />
              {errors[fieldName] && (
                <small className="p-error">{errors[fieldName].message}</small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label={uploadButtonLabel}
                icon="pi pi-upload"
                onClick={() => setMostrarCaptura(true)}
                disabled={readOnly || !entityId}
                className="p-button-primary"
              />
            </div>
            <div style={{ flex: 1 }}>
              {pdfUrl && (
                <PDFActionButtons
                  pdfUrl={pdfUrl}
                  moduleName={moduleName}
                  fileName={`${moduleName}-${entityId || "sin-id"}.pdf`}
                  viewButtonLabel={viewButtonLabel}
                  downloadButtonLabel={downloadButtonLabel}
                  toast={toastPDF}
                />
              )}
            </div>
          </div>

          {pdfUrl && (
            <div className="field col-12">
              <PDFViewerV2
                pdfUrl={pdfUrl}
                moduleName={moduleName}
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
                <p className="text-600 mt-3 mb-2">{emptyMessage}</p>
                <small className="text-500">{emptyDescription}</small>
              </div>
            </div>
          )}
        </div>
      </Card>

      <PDFMultiCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        moduleName={moduleName}
        entityId={entityId}
        dialogTitle={dialogTitle}
        maxFiles={config.maxFiles}
        onComplete={handlePdfComplete}
        onError={handlePdfError}
      />
    </>
  );
}