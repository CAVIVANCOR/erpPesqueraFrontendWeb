/**
 * PdfComprobanteOperacionDetMovNovedadCard.jsx
 *
 * Card para manejo de PDF de comprobante de operación de movimiento de caja.
 * Este PDF se copia desde MovimientoCaja cuando se valida el movimiento.
 * También permite captura/subida manual.
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

const PdfComprobanteOperacionDetMovNovedadCard = ({
  control,
  errors,
  urlComprobanteOperacionMovCaja,
  toast,
  setValue,
  movimiento,
}) => {
  // Estados para captura de comprobante
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  // Función para ver PDF
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
    <Card>
      <div className="p-fluid">
        {/* Mensaje informativo */}
        <div style={{ marginBottom: "1rem" }}>
          <Message
            severity="info"
            text="Este comprobante se copia automáticamente desde el Movimiento de Caja cuando se valida la operación, pero también puede ser capturado/subido manualmente."
          />
        </div>

        {/* URL del comprobante de operación */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlComprobanteOperacionMovCaja">
              Comprobante de Operación (MovimientoCaja)
            </label>
            <Controller
              name="urlComprobanteOperacionMovCaja"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlComprobanteOperacionMovCaja"
                  {...field}
                  placeholder="URL del comprobante de operación"
                  className={classNames({
                    "p-invalid": errors.urlComprobanteOperacionMovCaja,
                  })}
                  style={{ fontWeight: "bold" }}
                  readOnly
                />
              )}
            />
            {errors.urlComprobanteOperacionMovCaja && (
              <Message
                severity="error"
                text={errors.urlComprobanteOperacionMovCaja.message}
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

        {/* Mensaje si no hay comprobante */}
        {!urlComprobanteOperacionMovCaja && (
          <div style={{ marginTop: "1rem" }}>
            <Message
              severity="warn"
              text="No hay comprobante de operación disponible. Este campo se llenará automáticamente cuando se valide el movimiento de caja asociado."
            />
          </div>
        )}

        {/* Modal de captura de documento */}
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleComprobanteSubido}
          endpoint="/api/pesca/movs-entregarendir-pesca-consumo/upload-comprobante-operacion"
          titulo="Capturar Comprobante de Operación"
          toast={toast}
          extraData={{ detMovsEntRendirPescaConsumoId: movimiento?.id }}
        />
      </div>
    </Card>
  );
};

export default PdfComprobanteOperacionDetMovNovedadCard;