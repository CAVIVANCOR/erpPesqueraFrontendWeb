/**
 * PdfDetMovEntregaRendirMovAlmacenCard.jsx
 *
 * Card para gestión de PDF de comprobante de movimiento de entrega a rendir en movimientos de almacén.
 * Permite subir, visualizar y descargar el PDF del comprobante.
 * Patrón replicado EXACTAMENTE de PdfDetMovEntregaRendirContratoCard.jsx
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";

const PdfDetMovEntregaRendirMovAlmacenCard = ({
  control,
  errors,
  urlComprobanteMovimiento,
  toast,
  setValue,
  movimiento,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Convertir movimientoId a number
  const movimientoIdNumber = movimiento?.id ? Number(movimiento.id) : null;

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = () => {
    if (urlComprobanteMovimiento) {
      abrirPdfEnNuevaPestana(
        urlComprobanteMovimiento,
        toast,
        "No hay comprobante de movimiento disponible"
      );
    }
  };

  // Función para descargar PDF usando función genérica
  const handleDescargarPDF = () => {
    descargarPdf(
      urlComprobanteMovimiento,
      toast?.current,
      `comprobante-mov-almacen-${movimientoIdNumber || 'documento'}.pdf`
    );
  };

  // Función para abrir captura con validación
  const handleAbrirCaptura = () => {
    if (!movimientoIdNumber) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el movimiento antes de subir el PDF",
        life: 3000,
      });
      return;
    }
    setMostrarCaptura(true);
  };

  // Función para manejar PDF subido
  const handlePdfSubido = (urlDocumento) => {
    setValue("urlComprobanteMovimiento", urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "PDF Subido",
      detail: "El PDF del comprobante se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card
      title="Comprobante PDF del Movimiento"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* URL del PDF */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlComprobanteMovimiento">
              Comprobante PDF
            </label>
            <InputText
              id="urlComprobanteMovimiento"
              value={urlComprobanteMovimiento || ""}
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
                onClick={handleAbrirCaptura}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlComprobanteMovimiento && (
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <Button
                  type="button"
                  label="Ver"
                  icon="pi pi-eye"
                  className="p-button-success"
                  size="small"
                  onClick={handleVerPDF}
                />
                <Button
                  type="button"
                  label="Descargar"
                  icon="pi pi-download"
                  className="p-button-help"
                  size="small"
                  onClick={handleDescargarPDF}
                />
              </div>
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {urlComprobanteMovimiento && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlComprobanteMovimiento} />
          </div>
        )}

        {/* Modal de captura de documento */}
        {mostrarCaptura && movimientoIdNumber && (
          <DocumentoCapture
            visible={mostrarCaptura}
            onHide={() => setMostrarCaptura(false)}
            onDocumentoSubido={handlePdfSubido}
            endpoint={`${
              import.meta.env.VITE_API_URL
            }/det-movs-entrega-rendir-mov-almacen-pdf/upload-pdf-comprobante`}
            titulo="Capturar/Subir PDF del Comprobante"
            toast={toast}
            extraData={{ movimientoId: movimientoIdNumber }}
          />
        )}
      </div>
    </Card>
  );
};

export default PdfDetMovEntregaRendirMovAlmacenCard;