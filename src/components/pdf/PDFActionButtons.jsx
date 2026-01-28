import React from "react";
import { Button } from "primereact/button";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getModuleConfig } from "../../utils/pdf/pdfConfigV2";

export default function PDFActionButtons({
  pdfUrl,
  moduleName,
  fileName = "documento.pdf",
  showViewButton = true,
  showDownloadButton = true,
  viewButtonLabel = "Abrir",
  downloadButtonLabel = "Descargar",
  className = "",
  toast,
}) {
  const buildFullUrl = (url) => {
    if (!url || !moduleName) return null;

    const config = getModuleConfig(moduleName);
    const normalizedPdfUrl = url.startsWith("/") ? url.substring(1) : url;
    const normalizedUploadPath = config.uploadPath.startsWith("/")
      ? config.uploadPath.substring(1)
      : config.uploadPath;

    if (normalizedPdfUrl.startsWith(normalizedUploadPath)) {
      const fileName = normalizedPdfUrl.replace(normalizedUploadPath + "/", "");
      return `${import.meta.env.VITE_API_URL}${config.apiEndpoint}/${fileName}`;
    }

    if (url.startsWith("/api/")) {
      const rutaSinApi = url.substring(4);
      return `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
    } else if (url.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL}${url}`;
    }

    return url;
  };

  const handleViewInNewTab = async () => {
    if (!pdfUrl) {
      toast?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay PDF disponible",
        life: 3000,
      });
      return;
    }

    try {
      const urlCompleta = buildFullUrl(pdfUrl);
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
          toast?.show({
            severity: "warn",
            summary: "Aviso",
            detail:
              "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
            life: 4000,
          });
        }
      } else {
        toast?.show({
          severity: "error",
          summary: "Error",
          detail: `No se pudo abrir el documento (${response.status})`,
          life: 3000,
        });
      }
    } catch (error) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al abrir el documento: ${error.message}`,
        life: 3000,
      });
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) {
      toast?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay PDF disponible",
        life: 3000,
      });
      return;
    }

    try {
      const urlCompleta = buildFullUrl(pdfUrl);
      const token = useAuthStore.getState().token;

      const response = await fetch(urlCompleta, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);
      } else {
        toast?.show({
          severity: "error",
          summary: "Error",
          detail: `No se pudo descargar el documento (${response.status})`,
          life: 3000,
        });
      }
    } catch (error) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al descargar el documento: ${error.message}`,
        life: 3000,
      });
    }
  };

  if (!pdfUrl) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 1 }}>
        {showViewButton && (
          <Button
            type="button"
            label={viewButtonLabel}
            icon="pi pi-external-link"
            onClick={handleViewInNewTab}
            className="p-button-outlined"
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        {showDownloadButton && (
          <Button
            type="button"
            label={downloadButtonLabel}
            icon="pi pi-download"
            onClick={handleDownload}
            className="p-button-outlined"
          />
        )}
      </div>
    </div>
  );
}