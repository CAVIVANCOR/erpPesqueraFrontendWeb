// src/components/accesoInstalacion/cards/DocumentosAdjuntosCard.jsx
// Card moderno para documentos adjuntos del visitante
// Usa Card de PrimeReact para diseño profesional y responsive

import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import PDFViewer from "../PDFViewer";
import DocumentoVisitanteCapture from "../DocumentoVisitanteCapture";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

/**
 * Card para documentos adjuntos del visitante
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de react-hook-form
 * @param {Function} props.watch - Función watch de react-hook-form
 * @param {Function} props.getFormErrorMessage - Función para obtener mensajes de error
 * @param {Function} props.setValue - Función setValue de react-hook-form
 * @param {Object} props.toast - Referencia al componente Toast
 * @param {boolean} props.accesoSellado - Si el acceso está sellado (deshabilita todos los campos)
 */
const DocumentosAdjuntosCard = ({
  control,
  watch,
  getFormErrorMessage,
  setValue,
  toast,
  accesoSellado = false,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const urlDocumento = watch("urlDocumentoVisitante");
  const numeroDocumento = watch("numeroDocumento");
  const nombres = watch("nombrePersona");

  // Manejar cuando se sube un documento exitosamente
  const handleDocumentoSubido = (urlDocumento) => {
    setValue("urlDocumentoVisitante", urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento del visitante se ha subido correctamente",
      life: 3000,
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
          {/* Botón para capturar/subir documento */}
          <div className="field col-12">
            <div className="flex justify-content-between align-items-center mb-3">
              <Button
                type="button"
                label="Capturar/Subir Documento"
                icon="pi pi-camera"
                className="p-button-outlined"
                onClick={() => setMostrarCaptura(true)}
                disabled={accesoSellado}
                tooltip="Capturar fotos o subir archivos para generar el documento PDF"
                tooltipOptions={{ position: "left" }}
              />
            </div>
          </div>

          {/* Campo URL Documento */}
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

          {/* Visor de PDF - EXTRAÍDO DEL CARD PARA EVITAR INTERFERENCIAS */}
          {urlDocumento && (
            <div className="field col-12">
              {/* PDFViewer renderizado independientemente, como en el código original */}
              <PDFViewer urlDocumento={urlDocumento} />

              {/* Botones de acción para el PDF */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Button
                    type="button"
                    label="Abrir"
                    icon="pi pi-external-link"
                    className="p-button-outlined p-button-sm"
                    style={{ minWidth: "80px" }}
                    onClick={async () => {
                      try {
                        // Construir URL completa usando la misma lógica que el PDFViewer
                        let urlCompleta;
                        if (
                          urlDocumento.startsWith(
                            "/uploads/documentos-visitantes/"
                          )
                        ) {
                          const rutaArchivo = urlDocumento.replace(
                            "/uploads/documentos-visitantes/",
                            ""
                          );
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }/documentos-visitantes/archivo/${rutaArchivo}`;
                        } else if (urlDocumento.startsWith("/api/")) {
                          const rutaSinApi = urlDocumento.substring(4);
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }${rutaSinApi}`;
                        } else if (urlDocumento.startsWith("/")) {
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }${urlDocumento}`;
                        } else {
                          urlCompleta = urlDocumento;
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
                          // Abrir en nueva ventana usando el blob URL
                          const newWindow = window.open(blobUrl, "_blank");
                          // Limpiar el blob URL después de un tiempo para liberar memoria
                          setTimeout(() => {
                            window.URL.revokeObjectURL(blobUrl);
                          }, 10000);

                          if (!newWindow) {
                            toast.current?.show({
                              severity: "warn",
                              summary: "Aviso",
                              detail:
                                "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
                            });
                          }
                        } else {
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: `No se pudo abrir el documento (${response.status})`,
                          });
                        }
                      } catch (error) {
                        toast.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: `Error al abrir el documento: ${error.message}`,
                        });
                      }
                    }}
                    tooltip="Abrir documento en nueva pestaña"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Button
                    type="button"
                    label="Descargar"
                    icon="pi pi-download"
                    className="p-button-outlined p-button-sm"
                    style={{ minWidth: "80px" }}
                    onClick={async () => {
                      try {
                        // Construir URL completa usando la misma lógica que el PDFViewer
                        let urlCompleta;
                        if (
                          urlDocumento.startsWith("/uploads/documentos-visitantes/")
                        ) {
                          const rutaArchivo = urlDocumento.replace(
                            "/uploads/documentos-visitantes/",
                            ""
                          );
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }/documentos-visitantes/archivo/${rutaArchivo}`;
                        } else if (urlDocumento.startsWith("/api/")) {
                          const rutaSinApi = urlDocumento.substring(4);
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }${rutaSinApi}`;
                        } else if (urlDocumento.startsWith("/")) {
                          urlCompleta = `${
                            import.meta.env.VITE_API_URL
                          }${urlDocumento}`;
                        } else {
                          urlCompleta = urlDocumento;
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
                          link.download = `documento-visitante-${
                            watch("numeroDocumento") || "sin-documento"
                          }.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } else {
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: "No se pudo descargar el documento",
                          });
                        }
                      } catch (error) {
                        toast.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: `Error al descargar el documento: ${error.message}`,
                        });
                      }
                    }}
                    tooltip="Descargar documento PDF"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay documento */}
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
                  Use el botón "Capturar/Subir Documento" para agregar fotos o
                  archivos del visitante
                </small>
              </div>
            </div>
          )}
        </div>
      </Card>
      {/* Modal de captura de documento */}
      <DocumentoVisitanteCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        onDocumentoSubido={handleDocumentoSubido}
        numeroDocumento={numeroDocumento}
        nombrePersona={nombres}
        disabled={accesoSellado}
      />
    </>
  );
};

export default DocumentosAdjuntosCard;
