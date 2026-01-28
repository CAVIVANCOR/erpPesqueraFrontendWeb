/**
 * PDFViewerOnly.jsx - Componente para SOLO VISUALIZAR PDFs (Caso 3)
 *
 * Componente genérico para visualizar PDFs sin opción de captura/subida.
 * Ideal para casos donde el PDF viene de otra fuente y solo se necesita mostrar.
 *
 * Casos de uso:
 * - Visualizar documentos de DocumentacionPersonal en otros módulos
 * - Mostrar PDFs de solo lectura
 * - Referencias cruzadas a documentos existentes
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import PDFViewerV2 from "./PDFViewerV2";
import PDFActionButtons from "./PDFActionButtons";

/**
 * Componente PDFViewerOnly - Solo visualización de PDFs
 *
 * @param {string} pdfUrl - URL del PDF a mostrar
 * @param {string} moduleName - Nombre del módulo (opcional, para construcción de URL)
 * @param {string} title - Título del Card (default: "Documento PDF")
 * @param {string} fileName - Nombre para descarga (default: "documento.pdf")
 * @param {string} viewButtonLabel - Label botón "Ver" (default: "Ver")
 * @param {string} downloadButtonLabel - Label botón "Descargar" (default: "Descargar")
 * @param {string} emptyMessage - Mensaje cuando no hay PDF
 * @param {string} emptyDescription - Descripción cuando no hay PDF
 * @param {string} height - Altura del visor (default: "600px")
 * @param {boolean} showUrlField - Mostrar campo URL (default: true)
 * @param {Object} toast - Ref de Toast para mensajes (opcional)
 */
export default function PDFViewerOnly({
  pdfUrl,
  moduleName,
  title = "Documento PDF",
  fileName = "documento.pdf",
  viewButtonLabel = "Ver",
  downloadButtonLabel = "Descargar",
  emptyMessage = "No hay documento cargado",
  emptyDescription = "No hay PDF disponible para visualizar",
  height = "600px",
  showUrlField = true,
  toast,
}) {
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    setPdfError(null);
  }, [pdfUrl]);

  const handlePdfError = (error) => {
    console.error("❌ [PDFViewerOnly] Error capturado:", error);

    let mensajeAmigable = "";
    let severityToast = "error";
    let summaryToast = "Error al cargar PDF";
    let detailToast = "";

    if (error.includes("404") || error.includes("Not Found")) {
      mensajeAmigable = `📄 El documento PDF no se encuentra en el servidor

🔍 Posibles causas:
- La URL del documento es antigua y el archivo fue movido
- El archivo fue eliminado del servidor
- La ruta de almacenamiento cambió

✅ Solución sugerida:
Vuelva a cargar o subir el documento desde el módulo de Documentación correspondiente (Documentación de Embarcación o Documentación Personal).

🔗 URL que falló:
${pdfUrl}`;

      summaryToast = "Documento No Encontrado (404)";
      detailToast =
        "El archivo PDF no existe en el servidor. Por favor, vuelva a cargar el documento desde el módulo de Documentación correspondiente.";
    } else if (error.includes("401") || error.includes("Unauthorized")) {
      mensajeAmigable = `🔒 No tiene autorización para acceder a este documento

Por favor, verifique sus permisos o inicie sesión nuevamente.`;

      summaryToast = "Sin Autorización (401)";
      detailToast =
        "No tiene permisos para acceder a este documento. Verifique sus credenciales.";
    } else if (error.includes("403") || error.includes("Forbidden")) {
      mensajeAmigable = `⛔ Acceso prohibido a este documento

No tiene los permisos necesarios para visualizarlo. Contacte al administrador del sistema.`;

      summaryToast = "Acceso Prohibido (403)";
      detailToast =
        "No tiene los permisos necesarios para visualizar este documento.";
    } else if (
      error.includes("500") ||
      error.includes("Internal Server Error")
    ) {
      mensajeAmigable = `⚠️ Error interno del servidor

Ocurrió un error al intentar cargar el documento. Por favor, contacte al administrador del sistema.`;

      summaryToast = "Error del Servidor (500)";
      detailToast =
        "Error interno del servidor. Contacte al administrador del sistema.";
    } else {
      mensajeAmigable = `❌ Error al cargar el documento

Detalles técnicos: ${error}

Por favor, verifique que el documento existe y que tiene los permisos necesarios para acceder a él.`;

      summaryToast = "Error al Cargar PDF";
      detailToast = `No se pudo cargar el documento: ${error}`;
    }

    setPdfError(mensajeAmigable);

    if (toast && toast.current) {
      toast.current.show({
        severity: severityToast,
        summary: summaryToast,
        detail: detailToast,
        life: 8000,
        sticky: false,
      });
    }
  };

  return (
    <Card>
      <div className="p-fluid">
        {/* Campo URL (opcional, para diagnóstico) */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            marginBottom: "0.5rem",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {showUrlField && pdfUrl && (
            <div style={{ flex: 4 }}>
              <label className="font-bold">URL del Documento PDF</label>
              <InputText value={pdfUrl} disabled />
            </div>
          )}

          {/* Botones de acción (Ver y Descargar) */}
          {pdfUrl && !pdfError && (
            <div style={{ flex: 1 }}>
              <PDFActionButtons
                pdfUrl={pdfUrl}
                moduleName={moduleName}
                fileName={fileName}
                viewButtonLabel={viewButtonLabel}
                downloadButtonLabel={downloadButtonLabel}
                toast={toast}
              />
            </div>
          )}
          <div style={{ flex: 1 }}></div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Mensaje de error amigable */}
          {pdfError && (
            <div style={{ flex: 1 }}>
              <Message
                severity="error"
                text={pdfError}
                style={{ whiteSpace: "pre-line" }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Visor de PDF */}
          {pdfUrl && !pdfError && (
            <div style={{ flex: 1 }}>
              <PDFViewerV2
                pdfUrl={pdfUrl}
                moduleName={moduleName}
                height={height}
                onError={handlePdfError}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Mensaje cuando no hay PDF */}
          {!pdfUrl && !pdfError && (
            <div style={{ flex: 1 }}>
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
      </div>
    </Card>
  );
}
