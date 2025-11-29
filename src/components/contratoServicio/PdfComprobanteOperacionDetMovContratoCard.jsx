/**
 * PdfComprobanteOperacionDetMovContratoCard.jsx
 *
 * Card para gestión de PDF de comprobante de operación de movimiento de caja en contratos de servicios.
 * Permite subir, visualizar y descargar el PDF del comprobante de la operación MovCaja.
 * Patrón replicado EXACTAMENTE de ContratoServicioPdfCard.jsx
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

const PdfComprobanteOperacionDetMovContratoCard = ({
  control,
  errors,
  urlComprobanteOperacionMovCaja,
  toast,
  setValue,
  movimiento,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Convertir movimientoId a number
  const movimientoIdNumber = movimiento?.id ? Number(movimiento.id) : null;

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

  // Función para descargar PDF usando función genérica
  const handleDescargarPDF = () => {
    descargarPdf(
      urlComprobanteOperacionMovCaja,
      toast?.current,
      `comprobante-operacion-contrato-${movimientoIdNumber || 'documento'}.pdf`
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

  // Función para manejar comprobante subido
  const handleComprobanteSubido = (urlDocumento) => {
    setValue("urlComprobanteOperacionMovCaja", urlDocumento);
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
                onClick={handleAbrirCaptura}
              />
            </div>
          </div>
          <div style={{ flex: 0.5 }}>
            {urlComprobanteOperacionMovCaja && (
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
        {urlComprobanteOperacionMovCaja && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlComprobanteOperacionMovCaja} />
          </div>
        )}

        {/* Modal de captura de documento */}
        {mostrarCaptura && movimientoIdNumber && (
          <DocumentoCapture
            visible={mostrarCaptura}
            onHide={() => setMostrarCaptura(false)}
            onDocumentoSubido={handleComprobanteSubido}
            endpoint={`${
              import.meta.env.VITE_API_URL
            }/det-movs-entrega-rendir-contrato-pdf/upload-pdf-operacion`}
            titulo="Capturar/Subir Comprobante de Operación"
            toast={toast}
            extraData={{ movimientoId: movimientoIdNumber }}
          />
        )}
      </div>
    </Card>
  );
};

export default PdfComprobanteOperacionDetMovContratoCard;