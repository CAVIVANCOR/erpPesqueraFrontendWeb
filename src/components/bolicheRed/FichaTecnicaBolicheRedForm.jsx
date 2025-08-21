/**
 * FichaTecnicaBolicheRedForm.jsx
 *
 * Componente Card para gestionar la ficha técnica de un boliche red.
 * Permite cargar, visualizar, descargar y abrir PDFs de boliche red.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import PDFViewer from "./PDFViewer";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente FichaTecnicaBolicheRedForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto (incluye id del boliche red)
 */
export default function FichaTecnicaBolicheRedForm({
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
  const urlBolicheRedPdf = watch("urlBolicheRedPdf");
  /**
   * Maneja la subida de archivo PDF de boliche red
   * Sigue el patrón de FichaTecnicaProductoForm.jsx para upload directo
   */
  const handlePDFUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;

    // Validación: solo PDFs
    if (file.type !== "application/pdf") {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos PDF",
        life: 4000,
      });
      return;
    }

    // Validación: máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo supera el tamaño máximo de 10MB",
        life: 4000,
      });
      return;
    }

    // Validación: debe existir ID del boliche red
    if (!defaultValues.id) {
      toastPDF.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Guarda primero el boliche red para poder subir la ficha técnica",
        life: 4000,
      });
      return;
    }

    setSubiendoPDF(true);

    try {
      const formData = new FormData();
      formData.append("fichaTecnica", file);
      formData.append("bolicheRedId", defaultValues.id);

      // Obtener token JWT desde Zustand siguiendo patrón ERP Megui
      const token = useAuthStore.getState().token;

      const response = await fetch("/api/ficha-tecnica-boliches/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la ficha técnica");
      }

      const resultado = await response.json();

      // Actualizar campo urlBolicheRedPdf
      setValue("urlBolicheRedPdf", resultado.urlBolicheRedPdf, {
        shouldValidate: true,
      });

      // Forzar refresco del PDFViewer
      setPdfRefreshKey((prevKey) => prevKey + 1);

      toastPDF.current?.show({
        severity: "success",
        summary: "Ficha Técnica Subida",
        detail: "La ficha técnica se subió correctamente",
        life: 3000,
      });
    } catch (error) {
      toastPDF.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo subir la ficha técnica",
        life: 4000,
      });
    } finally {
      setSubiendoPDF(false);
    }
  };

  return (
    <>
      <Toast ref={toastPDF} />
      <Card title="Ficha Técnica">
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
              <label htmlFor="fichaTecnica" className="font-bold">
                Solo archivos PDF. Máximo 10MB.
              </label>
              <FileUpload
                name="fichaTecnica"
                accept="application/pdf"
                maxFileSize={10 * 1024 * 1024}
                chooseLabel="Subir Ficha Técnica PDF"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                customUpload
                uploadHandler={handlePDFUpload}
                disabled={!defaultValues.id || subiendoPDF}
                auto
                mode="basic"
                className="p-button-outlined"
              />
              {!defaultValues.id && (
                <small className="p-error p-d-block">
                  Guarda primero el boliche red para habilitar la subida de ficha
                  técnica.
                </small>
              )}
            </div>
            {/* Campo URL Ficha Técnica */}
            <div style={{ flex: 3 }}>
              <label htmlFor="urlBolicheRedPdf" className="font-bold">
                URL Ficha Técnica
              </label>
              <Controller
                name="urlBolicheRedPdf"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    id="urlBolicheRedPdf"
                    {...field}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    style={{ fontWeight: "bold", marginBottom: "1rem" }}
                    placeholder="URL de la ficha técnica (se genera automáticamente al subir PDF)"
                    readOnly
                  />
                )}
              />
              {errors.urlBolicheRedPdf && (
                <small className="p-error">
                  {errors.urlBolicheRedPdf.message}
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
                    // Construir URL completa usando la misma lógica que DocumentosAdjuntosCard.jsx
                    let urlCompleta;
                    if (
                      urlBolicheRedPdf.startsWith("/uploads/fichas-tecnicas-boliches/")
                    ) {
                      const rutaArchivo = urlBolicheRedPdf.replace(
                        "/uploads/fichas-tecnicas-boliches/",
                        ""
                      );
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }/ficha-tecnica-boliches/archivo/${rutaArchivo}`;
                    } else if (urlBolicheRedPdf.startsWith("/api/")) {
                      const rutaSinApi = urlBolicheRedPdf.substring(4);
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${rutaSinApi}`;
                    } else if (urlBolicheRedPdf.startsWith("/")) {
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${urlBolicheRedPdf}`;
                    } else {
                      urlCompleta = urlBolicheRedPdf;
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
                tooltip="Abrir ficha técnica en nueva pestaña"
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
                    // Construir URL completa usando la misma lógica
                    let urlCompleta;
                    if (
                      urlBolicheRedPdf.startsWith("/uploads/fichas-tecnicas-boliches/")
                    ) {
                      const rutaArchivo = urlBolicheRedPdf.replace(
                        "/uploads/fichas-tecnicas-boliches/",
                        ""
                      );
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }/ficha-tecnica-boliches/archivo/${rutaArchivo}`;
                    } else if (urlBolicheRedPdf.startsWith("/api/")) {
                      const rutaSinApi = urlBolicheRedPdf.substring(4);
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${rutaSinApi}`;
                    } else if (urlBolicheRedPdf.startsWith("/")) {
                      urlCompleta = `${
                        import.meta.env.VITE_API_URL
                      }${urlBolicheRedPdf}`;
                    } else {
                      urlCompleta = urlBolicheRedPdf;
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
                      link.download = `ficha-tecnica-boliche-red-${
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
                        detail: "No se pudo descargar la ficha técnica",
                      });
                    }
                  } catch (error) {
                    toastPDF.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: `Error al descargar la ficha técnica: ${error.message}`,
                    });
                  }
                }}
                tooltip="Descargar ficha técnica PDF"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
          {/* Visor de PDF - Siguiendo patrón de DocumentosAdjuntosCard.jsx */}
          {urlBolicheRedPdf && (
            <div className="field col-12">
              <PDFViewer urlDocumento={urlBolicheRedPdf} key={pdfRefreshKey} />

              {/* Botones de acción para el PDF - Copiados de DocumentosAdjuntosCard.jsx */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              ></div>
            </div>
          )}

          {/* Mensaje cuando no hay ficha técnica */}
          {!urlBolicheRedPdf && (
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
                  No hay ficha técnica cargada
                </p>
                <small className="text-500">
                  Use el botón "Subir Ficha Técnica PDF" para agregar el
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
