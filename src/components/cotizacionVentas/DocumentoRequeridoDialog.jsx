// src/components/cotizacionVentas/DocumentoRequeridoDialog.jsx
/**
 * Diálogo para Agregar/Editar Documento Requerido
 * Implementa TODOS los campos del modelo DetDocsReqCotizaVentas
 * 
 * @author ERP Megui
 * @version 1.0.0 - Implementación profesional completa
 */

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";

const DocumentoRequeridoDialog = ({
  visible,
  documento,
  onHide,
  onSave,
  onChange,
  monedasOptions = [],
  docRequeridaVentasOptions = [],
  saving = false,
  toast,
}) => {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  
  const handleSave = () => {
    // Validaciones
    if (!documento?.docRequeridaVentasId) {
      return;
    }
    onSave();
  };

  // Función para ver PDF en nueva pestaña
  const handleVerPDF = (urlDocumento) => {
    if (urlDocumento) {
      abrirPdfEnNuevaPestana(
        urlDocumento,
        toast,
        "No hay documento disponible"
      );
    }
  };

  // Función para descargar PDF
  const handleDescargarPDF = (urlDocumento) => {
    if (urlDocumento) {
      const nombreArchivo = `documento-requerido-${documento.docRequeridaVentasId || "sin-id"}-${Date.now()}.pdf`;
      descargarPdf(
        urlDocumento,
        toast,
        nombreArchivo,
        "documentos-requeridos-ventas"
      );
    }
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    onChange("urlDocumento", urlDocumento);
    setMostrarCaptura(false);
    toast?.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento se ha subido correctamente",
      life: 3000,
    });
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        type="button"
        label="Guardar"
        icon="pi pi-check"
        className="p-button-primary"
        onClick={handleSave}
        disabled={saving || !documento?.docRequeridaVentasId}
        loading={saving}
      />
    </div>
  );

  return (
    <Dialog
      header={
        documento?.id
          ? "Editar Documento Requerido"
          : "Agregar Documento Requerido"
      }
      visible={visible}
      style={{ width: "1300px" }}
      onHide={onHide}
      footer={footer}
      modal
      maximizable
      maximized={true}
    >
      {documento && (
        <div className="p-fluid">

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            
          {/* Tipo de Documento - OBLIGATORIO */}
            <div style={{ flex: 2 }}>
            <label htmlFor="docRequeridaVentasId" className="font-bold">
              Tipo de Documento <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="docRequeridaVentasId"
              value={documento.docRequeridaVentasId}
              options={docRequeridaVentasOptions}
              onChange={(e) => onChange("docRequeridaVentasId", e.value)}
              placeholder="Seleccionar tipo de documento"
              filter
              filterBy="label"
              showClear
              className={!documento.docRequeridaVentasId ? "p-invalid" : ""}
            />
            {!documento.docRequeridaVentasId && (
              <small className="p-error">Este campo es obligatorio</small>
            )}
          </div>

          {/* Número de Documento */}
            <div style={{ flex: 1 }}>
            <label htmlFor="numeroDocumento" className="font-bold">
              Número de Documento
            </label>
            <InputText
              id="numeroDocumento"
              value={documento.numeroDocumento || ""}
              onChange={(e) => onChange("numeroDocumento", e.target.value)}
              placeholder="Ej: FAC-2024-001"
              maxLength={100}
            />
          </div>
            {/* Fecha de Emisión */}
            <div style={{ flex: 1 }}>
            <label htmlFor="fechaEmision" className="font-bold">
              Fecha de Emisión
            </label>
            <Calendar
              id="fechaEmision"
              value={
                documento.fechaEmision
                  ? new Date(documento.fechaEmision)
                  : null
              }
              onChange={(e) => onChange("fechaEmision", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              showButtonBar
              placeholder="Seleccionar fecha"
            />
          </div>

          {/* Fecha de Vencimiento */}
            <div style={{ flex: 1 }}>
            <label htmlFor="fechaVencimiento" className="font-bold">
              Fecha de Vencimiento
            </label>
            <Calendar
              id="fechaVencimiento"
              value={
                documento.fechaVencimiento
                  ? new Date(documento.fechaVencimiento)
                  : null
              }
              onChange={(e) => onChange("fechaVencimiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              showButtonBar
              placeholder="Seleccionar fecha"
              minDate={
                documento.fechaEmision
                  ? new Date(documento.fechaEmision)
                  : null
              }
            />
          </div>

          {/* Moneda */}
            <div style={{ flex: 0.5 }}>
            <label htmlFor="monedaId" className="font-bold">
              Moneda
            </label>
            <Dropdown
              id="monedaId"
              value={documento.monedaId}
              options={monedasOptions}
              onChange={(e) => onChange("monedaId", e.value)}
              placeholder="Seleccionar moneda"
              showClear
            />
          </div>
          {/* Costo del Documento */}
            <div style={{ flex: 0.5 }}>
            <label htmlFor="costoDocumento" className="font-bold">
              Costo
            </label>
            <InputNumber
              id="costoDocumento"
              value={documento.costoDocumento || 0}
              onValueChange={(e) => onChange("costoDocumento", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              placeholder="0.00"
            />
          </div>

          </div>




          {/* URL del Documento con Visor de PDF */}
          <div className="col-12">
            <label htmlFor="urlDocumento" className="font-bold">
              Documento Adjunto (PDF)
            </label>
            {/* URL del documento con botones */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-end",
                marginBottom: "1rem",
              }}
            >
                          {/* ES OBLIGATORIO */}
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: "0.9rem" }}
                htmlFor="esObligatorio"
              >
                Es Obligatorio
              </label>
              <Button
                label={documento.esObligatorio ? "SÍ ES OBLIGATORIO" : "NO ES OBLIGATORIO"}
                icon={documento.esObligatorio ? "pi pi-exclamation-circle" : "pi pi-times"}
                severity={documento.esObligatorio ? "danger" : "secondary"}
                onClick={() =>
                  onChange("esObligatorio", !documento.esObligatorio)
                }
                outlined
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  justifyContent: "center",
                }}
              />
            </div>

            {/* VERIFICADO */}
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: "0.9rem" }}
                htmlFor="verificado"
              >
                Verificado
              </label>
              <Button
                label={documento.verificado ? "SÍ VERIFICADO" : "NO VERIFICADO"}
                icon={documento.verificado ? "pi pi-check-circle" : "pi pi-times"}
                severity={documento.verificado ? "success" : "warning"}
                onClick={() =>
                  onChange("verificado", !documento.verificado)
                }
                outlined
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  justifyContent: "center",
                }}
              />
            </div>
              <div style={{ flex: 2 }}>
                <InputText
                  id="urlDocumento"
                  value={documento.urlDocumento || ""}
                  placeholder="URL del documento adjunto"
                  style={{ fontWeight: "bold" }}
                  readOnly
                />
              </div>

              {/* Botones de acción */}
              <div style={{ flex: 0.3 }}>
                <Button
                  type="button"
                  label="Capturar/Subir"
                  icon="pi pi-camera"
                  className="p-button-info"
                  size="small"
                  onClick={() => setMostrarCaptura(true)}
                />
              </div>
              <div style={{ flex: 0.3 }}>
                {documento.urlDocumento && (
                  <Button
                    type="button"
                    label="Ver PDF"
                    icon="pi pi-eye"
                    className="p-button-success"
                    size="small"
                    onClick={() => handleVerPDF(documento.urlDocumento)}
                  />
                )}
              </div>
              <div style={{ flex: 0.3 }}>
                {documento.urlDocumento && (
                  <Button
                    type="button"
                    label="Descargar"
                    icon="pi pi-download"
                    className="p-button-help"
                    size="small"
                    onClick={() => handleDescargarPDF(documento.urlDocumento)}
                  />
                )}
              </div>
            </div>

            {/* Visor de PDF */}
            {documento.urlDocumento && (
              <div style={{ marginTop: "1rem" }}>
                <PDFViewer urlDocumento={documento.urlDocumento} />
              </div>
            )}

            {/* Mensaje si no hay documento */}
            {!documento.urlDocumento && (
              <div style={{ marginTop: "1rem" }}>
                <Message
                  severity="warn"
                  text="No hay documento adjunto. Use el botón 'Capturar/Subir' para agregar uno."
                />
              </div>
            )}
          </div>

        

          {/* Observaciones de Verificación */}
          <div className="col-12">
            <label htmlFor="observacionesVerificacion" className="font-bold">
              Observaciones / Comentarios
            </label>
            <InputTextarea
              id="observacionesVerificacion"
              value={documento.observacionesVerificacion || ""}
              onChange={(e) =>
                onChange("observacionesVerificacion", e.target.value)
              }
              rows={4}
              placeholder="Ingrese observaciones o comentarios sobre este documento..."
              autoResize
            />
          </div>

          {/* Información de Verificación (solo si está verificado) */}
          {documento.verificado && documento.fechaVerificacion && (
            <div className="col-12">
              <div
                className="p-3"
                style={{
                  backgroundColor: "#e8f5e9",
                  borderLeft: "4px solid #4caf50",
                  borderRadius: "4px",
                }}
              >
                <div className="flex align-items-center gap-2">
                  <i
                    className="pi pi-check-circle"
                    style={{ color: "#4caf50", fontSize: "1.2rem" }}
                  ></i>
                  <div>
                    <strong>Documento Verificado</strong>
                    <br />
                    <small className="text-600">
                      Fecha de verificación:{" "}
                      {new Date(documento.fechaVerificacion).toLocaleDateString(
                        "es-PE"
                      )}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de captura de documento */}
      <DocumentoCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        onDocumentoSubido={handleDocumentoSubido}
        endpoint="/api/det-docs-req-cotiza-ventas/upload-documento"
        titulo="Capturar Documento Requerido"
        toast={toast}
        extraData={{ detDocsReqCotizaVentasId: documento?.id }}
      />
    </Dialog>
  );
};

export default DocumentoRequeridoDialog;
