/**
 * ResolucionPDFTemporadaForm.jsx
 *
 * Componente Card para gestionar el archivo PDF de resolución de temporada de pesca.
 * Permite cargar, visualizar, descargar y abrir PDFs de resolución ministerial.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import PDFViewerTemporada from "./PDFViewerTemporada";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente ResolucionPDFTemporadaForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 */
export default function ResolucionPDFTemporadaForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
}) {
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const toastPDF = useRef(null);
  const urlResolucionPdf = watch("urlResolucionPdf");

  /**
   * Maneja la subida de archivo PDF de resolución
   */
  const handlePDFUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos PDF",
        life: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo supera el tamaño máximo de 5MB",
        life: 4000,
      });
      return;
    }

    setSubiendoPDF(true);

    try {

      
      // Usar getValues() para obtener el ID actual del formulario
      const currentValues = getValues();
      const temporadaId = currentValues.id || defaultValues.id;
      const formData = new FormData();
      formData.append("resolucionPdf", file);
      formData.append("temporadaId", temporadaId);
      const token = useAuthStore.getState().token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/temporada-pesca-resolucion/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la resolución");
      }

      const resultado = await response.json();

      setValue("urlResolucionPdf", resultado.urlResolucionPdf, {
        shouldValidate: true,
      });

      setPdfRefreshKey((prevKey) => prevKey + 1);

      toastPDF.current?.show({
        severity: "success",
        summary: "Resolución Subida",
        detail: "La resolución se subió correctamente",
        life: 3000,
      });
    } catch (error) {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo subir la resolución",
        life: 4000,
      });
    } finally {
      setSubiendoPDF(false);
    }
  };

  return (
    <>
      <Toast ref={toastPDF} />
      <Card title="Resolución Ministerial (PDF)">
        <div className="p-fluid formgrid grid">
          {/* Botón para subir PDF */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="resolucionPdf" className="font-bold">
                Solo archivos PDF. Máximo 5MB.
              </label>
              <FileUpload
                name="resolucionPdf"
                accept="application/pdf"
                maxFileSize={5 * 1024 * 1024}
                chooseLabel="Subir Resolución PDF"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                customUpload
                uploadHandler={handlePDFUpload}
                disabled={subiendoPDF}
                auto
                mode="basic"
                className="p-button-outlined"
              />
            </div>
            {/* Campo URL Resolución PDF */}
            <div style={{ flex: 3 }}>
              <label htmlFor="urlResolucionPdf" className="font-bold">
                URL Resolución PDF
              </label>
              <Controller
                name="urlResolucionPdf"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    id="urlResolucionPdf"
                    {...field}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    style={{ fontWeight: "bold", marginBottom: "1rem" }}
                    placeholder="URL de la resolución PDF (se genera automáticamente al subir PDF)"
                    readOnly
                  />
                )}
              />
              {errors.urlResolucionPdf && (
                <small className="p-error">
                  {errors.urlResolucionPdf.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Abrir"
                icon="pi pi-external-link"
                className="p-button-outlined p-button-sm"
                style={{ minWidth: "80px" }}
                onClick={async () => {
                  try {
                    let urlCompleta;
                    if (
                      urlResolucionPdf.startsWith("/uploads/resoluciones-temporada/")
                    ) {
                      const rutaArchivo = urlResolucionPdf.replace(
                        "/uploads/resoluciones-temporada/",
                        ""
                      );
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }/temporada-pesca-resolucion/archivo/${rutaArchivo}`;
                    } else if (urlResolucionPdf.startsWith("/api/")) {
                      const rutaSinApi = urlResolucionPdf.substring(4);
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${rutaSinApi}`;
                    } else if (urlResolucionPdf.startsWith("/")) {
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${urlResolucionPdf}`;
                    } else {
                      urlCompleta = urlResolucionPdf;
                    }

                    const token = useAuthStore.getState().token;
                    const response = await fetch(urlCompleta, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });

                    if (response.ok) {
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const newWindow = window.open(blobUrl, "_blank");
                      setTimeout(() => {
                        window.URL.revokeObjectURL(blobUrl);
                      }, 10000);

                      if (!newWindow) {
                        toastPDF.current?.show({
                          severity: "warn",
                          summary: "Aviso",
                          detail:
                            "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
                        });
                      }
                    } else {
                      toastPDF.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: `No se pudo abrir el documento (${response.status})`,
                      });
                    }
                  } catch (error) {
                    toastPDF.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: `Error al abrir el documento: ${error.message}`,
                    });
                  }
                }}
                tooltip="Abrir resolución en nueva pestaña"
                tooltipOptions={{ position: "top" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Descargar"
                icon="pi pi-download"
                className="p-button-outlined p-button-sm"
                style={{ minWidth: "80px" }}
                onClick={async () => {
                  try {
                    let urlCompleta;
                    if (
                      urlResolucionPdf.startsWith("/uploads/resoluciones-temporada/")
                    ) {
                      const rutaArchivo = urlResolucionPdf.replace(
                        "/uploads/resoluciones-temporada/",
                        ""
                      );
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }/temporada-pesca-resolucion/archivo/${rutaArchivo}`;
                    } else if (urlResolucionPdf.startsWith("/api/")) {
                      const rutaSinApi = urlResolucionPdf.substring(4);
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${rutaSinApi}`;
                    } else if (urlResolucionPdf.startsWith("/")) {
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${urlResolucionPdf}`;
                    } else {
                      urlCompleta = urlResolucionPdf;
                    }

                    const token = useAuthStore.getState().token;
                    const response = await fetch(urlCompleta, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });

                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `resolucion-temporada-${
                        defaultValues.id || "sin-id"
                      }.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } else {
                      toastPDF.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "No se pudo descargar la resolución",
                      });
                    }
                  } catch (error) {
                    toastPDF.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: `Error al descargar la resolución: ${error.message}`,
                    });
                  }
                }}
                tooltip="Descargar resolución PDF"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
          {/* Visor de PDF */}
          {urlResolucionPdf && (
            <div className="field col-12">
              <PDFViewerTemporada urlDocumento={urlResolucionPdf} key={pdfRefreshKey} />
            </div>
          )}

          {/* Mensaje cuando no hay resolución */}
          {!urlResolucionPdf && (
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
                  No hay resolución cargada
                </p>
                <small className="text-500">
                  Use el botón "Subir Resolución PDF" para agregar el
                  documento
                </small>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
