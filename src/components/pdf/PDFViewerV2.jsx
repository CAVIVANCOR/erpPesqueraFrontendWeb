/**
 * PDFViewerV2.jsx - Visor de PDF V2
 *
 * Componente genérico que usa pdfConfigV2.js para construir URLs dinámicamente.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getModuleConfig } from "../../utils/pdf/pdfConfigV2";

export default function PDFViewerV2({
  pdfUrl,
  moduleName,
  height = "600px",
  showError = true,
  className = "",
  onError,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfUrl) {
      setLoading(false);
      setBlobUrl(null);
      return;
    }

    const cargarPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          setBlobUrl(null);
        }

        let urlCompleta;

        if (!moduleName) {
          if (pdfUrl.startsWith("/api/")) {
            const rutaSinApi = pdfUrl.substring(4);
            urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
          } else if (pdfUrl.startsWith("/")) {
            urlCompleta = `${import.meta.env.VITE_API_URL}${pdfUrl}`;
          } else {
            urlCompleta = pdfUrl;
          }
        } else {
          const config = getModuleConfig(moduleName);

          const normalizedPdfUrl = pdfUrl.startsWith("/")
            ? pdfUrl.substring(1)
            : pdfUrl;
          const normalizedUploadPath = config.uploadPath.startsWith("/")
            ? config.uploadPath.substring(1)
            : config.uploadPath;

          if (normalizedPdfUrl.startsWith(normalizedUploadPath)) {
            const fileName = normalizedPdfUrl.replace(
              normalizedUploadPath + "/",
              "",
            );
            urlCompleta = `${import.meta.env.VITE_API_URL}${config.apiEndpoint}/${fileName}`;
          } else {
            if (pdfUrl.startsWith("/api/")) {
              const rutaSinApi = pdfUrl.substring(4);
              urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
            } else if (pdfUrl.startsWith("/")) {
              urlCompleta = `${import.meta.env.VITE_API_URL}${pdfUrl}`;
            } else {
              urlCompleta = pdfUrl;
            }
          }
        }

        const token = useAuthStore.getState().token;

        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }

        const response = await fetch(`${urlCompleta}?t=${Date.now()}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);
      } catch (error) {
        console.error("❌ [PDFViewerV2] Error cargando PDF:", error);
        const errorMessage = error.message || "Error al cargar el documento";
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarPDF();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfUrl, moduleName]);

  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height }}
      >
        <ProgressSpinner />
        <span className="ml-2">Cargando documento...</span>
      </div>
    );
  }

  if (error && showError && !onError) {
    return (
      <div
        className="text-center p-4"
        style={{ backgroundColor: "#fee", borderRadius: "6px" }}
      >
        <i
          className="pi pi-exclamation-triangle text-red-500"
          style={{ fontSize: "2rem" }}
        ></i>
        <p className="text-red-600 mt-2 mb-0">Error al cargar el documento</p>
        <small className="text-red-500">{error}</small>
      </div>
    );
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <div className={`pdf-viewer-v2 ${className}`}>
      <iframe
        src={blobUrl}
        style={{
          width: "100%",
          height,
          border: "none",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title="Visor de PDF"
      />
    </div>
  );
}
