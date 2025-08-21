/**
 * CertificadoEmbarcacionForm.jsx
 *
 * Componente Card genérico para gestionar certificados PDF de embarcación.
 * Permite cargar, visualizar, descargar y abrir PDFs de certificados.
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
import PDFViewer from "./PDFViewer";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente CertificadoEmbarcacionForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto (incluye id de la embarcación)
 * @param {string} props.fieldName - Nombre del campo en el formulario (ej: "urlCertificadoMatricula")
 * @param {string} props.title - Título del certificado (ej: "Certificado de Matrícula")
 * @param {string} props.icon - Icono para el título (ej: "pi pi-id-card")
 * @param {string} props.certificateType - Tipo de certificado para el endpoint (ej: "certificado-matricula")
 * @param {string} props.description - Descripción del certificado
 */
export default function CertificadoEmbarcacionForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues,
  fieldName,
  title,
  icon = "pi pi-file-pdf",
  certificateType,
  description,
}) {
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const toastPDF = useRef(null);
  const urlCertificado = watch(fieldName);

  /**
   * Maneja la subida de archivo PDF de certificado
   * Sigue el patrón de FichaTecnicaBolicheRedForm.jsx para upload directo
   */
  const handlePDFUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;

    const embarcacionId = defaultValues?.id;
    if (!embarcacionId) {
      toastPDF.current.show({
        severity: "error",
        summary: "Error",
        detail: "Debe guardar la embarcación antes de subir certificados",
        life: 3000,
      });
      return;
    }

    try {
      setSubiendoPDF(true);
      const formData = new FormData();
      formData.append("certificado", file);
      const response = await fetch(
        `/api/certificados-embarcacion/subir/${embarcacionId}/${certificateType}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setValue(fieldName, data.urlCertificado);
      setPdfRefreshKey((prev) => prev + 1);

      toastPDF.current.show({
        severity: "success",
        summary: "Éxito",
        detail: `${title} subido correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al subir certificado:", error);
      toastPDF.current.show({
        severity: "error",
        summary: "Error",
        detail: `Error al subir ${title.toLowerCase()}: ${error.message}`,
        life: 3000,
      });
    } finally {
      setSubiendoPDF(false);
    }
  };

  /**
   * Header del card con título e icono
   */
  const cardHeader = (
    <div className="flex align-items-center border-bottom-1 surface-border">
      <h3 className="m-0 text-lg font-semibold">{title}</h3>
    </div>
  );

  return (
    <>
      <Toast ref={toastPDF} />
      <Card header={cardHeader} className="mb-4">
        <div className="p-fluid">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="font-semibold">Subir Certificado PDF</label>
              <FileUpload
                name="certificado"
                accept=".pdf"
                maxFileSize={5000000}
                customUpload
                uploadHandler={handlePDFUpload}
                auto
                chooseLabel="Seleccionar PDF"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                emptyTemplate={
                  <p className="text-center">
                    Arrastra y suelta el archivo PDF aquí o haz clic para
                    seleccionar.
                  </p>
                }
                progressBarTemplate={<></>}
                disabled={subiendoPDF}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor={fieldName} className="font-semibold">
                URL del Certificado
              </label>
              <Controller
                name={fieldName}
                control={control}
                render={({ field }) => (
                  <InputText
                    id={fieldName}
                    {...field}
                    value={field.value || ""}
                    placeholder={`URL del ${title.toLowerCase()}`}
                    className={classNames({
                      "p-invalid": errors[fieldName],
                    })}
                    disabled
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
                  icon="pi pi-download"
                  label="Descargar"
                  className="p-button-outlined p-button-sm"
                  disabled={!urlCertificado}
                  onClick={async () => {
                    try {
                      // Construir URL completa usando la misma lógica que FichaTecnicaBolicheRedForm
                      let urlCompleta;
                      if (
                        urlCertificado.startsWith(
                          "/uploads/certificados-embarcacion/"
                        )
                      ) {
                        const rutaArchivo = urlCertificado.replace(
                          "/uploads/certificados-embarcacion/",
                          ""
                        );
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }/certificados-embarcacion/archivo/${rutaArchivo}`;
                      } else if (urlCertificado.startsWith("/api/")) {
                        const rutaSinApi = urlCertificado.substring(4);
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }${rutaSinApi}`;
                      } else if (urlCertificado.startsWith("/")) {
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }${urlCertificado}`;
                      } else {
                        urlCompleta = urlCertificado;
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
                        link.download = `${title.replace(/\s+/g, "_")}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } else {
                        toastPDF.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: "No se pudo descargar el certificado",
                        });
                      }
                    } catch (error) {
                      console.error("Error al descargar:", error);
                      toastPDF.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: `Error al descargar el ${title.toLowerCase()}: ${
                          error.message
                        }`,
                      });
                    }
                  }}
                  tooltip={`Descargar ${title.toLowerCase()}`}
                  tooltipOptions={{ position: "top" }}
                />

                <Button
                  type="button"
                  icon="pi pi-external-link"
                  className="p-button-outlined p-button-sm"
                  label="Abrir en Nueva Pestaña"
                  disabled={!urlCertificado}
                  onClick={async () => {
                    try {
                      // Construir URL completa usando la misma lógica que FichaTecnicaBolicheRedForm
                      let urlCompleta;
                      if (
                        urlCertificado.startsWith(
                          "/uploads/certificados-embarcacion/"
                        )
                      ) {
                        const rutaArchivo = urlCertificado.replace(
                          "/uploads/certificados-embarcacion/",
                          ""
                        );
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }/certificados-embarcacion/archivo/${rutaArchivo}`;
                      } else if (urlCertificado.startsWith("/api/")) {
                        const rutaSinApi = urlCertificado.substring(4);
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }${rutaSinApi}`;
                      } else if (urlCertificado.startsWith("/")) {
                        urlCompleta = `${
                          import.meta.env.VITE_API_URL
                        }${urlCertificado}`;
                      } else {
                        urlCompleta = urlCertificado;
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
                  tooltip={`Abrir ${title.toLowerCase()} en nueva pestaña`}
                  tooltipOptions={{ position: "top" }}
                />
            </div>
          </div>

          {urlCertificado && (
            <div className="field">
              <PDFViewer
                key={pdfRefreshKey}
                urlDocumento={urlCertificado}
                title={title}
                height="400px"
              />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
