// src/components/movimientoCaja/PdfComprobanteOperacionCard.jsx
import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const PdfComprobanteOperacionCard = ({
  urlComprobanteOperacionMovCaja,
  setUrlComprobanteOperacionMovCaja,
  toast,
  movimientoId,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlComprobanteOperacionMovCaja) {
      abrirPdfEnNuevaPestana(
        urlComprobanteOperacionMovCaja,
        toast,
        "No hay comprobante de operación disponible"
      );
    }
  };

  // Función para manejar comprobante subido
  const handleComprobanteSubido = (urlDocumento) => {
    setUrlComprobanteOperacionMovCaja(urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Comprobante Subido",
      detail: "El comprobante de operación se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="Comprobante de Operación (Voucher, Recibo, etc.)"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* URL del comprobante */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlComprobanteOperacionMovCaja">
              Comprobante de Operación PDF
            </label>
            <InputText
              id="urlComprobanteOperacionMovCaja"
              value={urlComprobanteOperacionMovCaja || ""}
              placeholder="URL del comprobante PDF"
              style={{ fontWeight: "bold" }}
              readOnly
            />
          </div>

          {/* Botones de acción */}
          <div style={{ flex: 0.5 }}>
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                label="Capturar/Subir"
                icon="pi pi-camera"
                className="p-button-info"
                size="small"
                onClick={() => setMostrarCaptura(true)}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlComprobanteOperacionMovCaja && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-success"
                size="small"
                onClick={handleVerPDF}
              />
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {urlComprobanteOperacionMovCaja && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlComprobanteOperacionMovCaja} />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleComprobanteSubido}
          endpoint={`${
            import.meta.env.VITE_API_URL
          }/movimientos-caja/upload-comprobante`}
          titulo="Capturar Comprobante de Operación"
          toast={toast}
          extraData={{ movimientoCajaId: movimientoId }}
        />
      </div>
    </Card>
  );
};

export default PdfComprobanteOperacionCard;
