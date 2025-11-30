/**
 * PdfDetMovEntregaRendirCard.jsx
 *
 * Card para manejo de PDF de comprobantes de DetMovsEntregaRendir.
 * Incluye captura/subida, visualización y gestión de documentos PDF.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Controller } from "react-hook-form";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const PdfDetMovEntregaRendirCard = ({
  control,
  errors,
  urlComprobanteMovimiento,
  toast,
  setValue,
  movimiento, // Agregar esta prop
}) => {
  // Estados para captura de comprobante
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF
  const handleVerPDF = () => {
    if (urlComprobanteMovimiento) {
      abrirPdfEnNuevaPestana(
        urlComprobanteMovimiento,
        toast,
        "No hay comprobante PDF disponible"
      );
    }
  };

  // Función para manejar comprobante subido
  const handleComprobanteSubido = (urlDocumento) => {
    setValue("urlComprobanteMovimiento", urlDocumento);
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Comprobante Subido",
      detail: "El comprobante PDF se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <Card>
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
              <label htmlFor="urlComprobanteMovimiento">
                Comprobante PDF
              </label>
              <Controller
                name="urlComprobanteMovimiento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlComprobanteMovimiento"
                    {...field}
                    placeholder="URL del comprobante PDF"
                    className={classNames({
                      "p-invalid": errors.urlComprobanteMovimiento,
                    })}
                    style={{ fontWeight: "bold" }}
                    readOnly
                  />
                )}
              />
              {errors.urlComprobanteMovimiento && (
                <Message
                  severity="error"
                  text={errors.urlComprobanteMovimiento.message}
                />
              )}
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
              {urlComprobanteMovimiento && (
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
        {urlComprobanteMovimiento && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlComprobanteMovimiento} />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleComprobanteSubido}
          endpoint="/api/det-movs-entrega-rendir/upload"
          titulo="Capturar Comprobante de Movimiento"
          toast={toast}
          extraData={{ detMovsEntregaRendirId: movimiento?.id }}
        />
      </div>
    </Card>
  );
};

export default PdfDetMovEntregaRendirCard;
