// src/components/cotizacionVentas/DocumentoRequeridoDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";

import PDFMultiCapture from "../pdf/PDFMultiCapture";
import PDFViewerV2 from "../pdf/PDFViewerV2";
import PDFActionButtons from "../pdf/PDFActionButtons";

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
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

  const pdfUrl = documento?.urlDocumento || "";

  const handleSave = () => {
    if (!documento?.docRequeridaVentasId) {
      return;
    }
    onSave();
  };

  const handlePdfComplete = (url) => {
    onChange("urlDocumento", url);
    setPdfRefreshKey((k) => k + 1);
    setMostrarCaptura(false);
    toast?.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento se consolidó y subió correctamente",
      life: 3000,
    });
  };

  const handlePdfError = (error) => {
    toast?.current?.show({
      severity: "error",
      summary: "Error",
      detail: error?.message || "No se pudo subir el documento",
      life: 4000,
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
    <>
      <Dialog
        header={
          documento?.id ? "Editar Documento Requerido" : "Agregar Documento Requerido"
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

              <div style={{ flex: 1 }}>
                <label htmlFor="fechaEmision" className="font-bold">
                  Fecha de Emisión
                </label>
                <Calendar
                  id="fechaEmision"
                  value={documento.fechaEmision ? new Date(documento.fechaEmision) : null}
                  onChange={(e) => onChange("fechaEmision", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  placeholder="Seleccionar fecha"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="fechaVencimiento" className="font-bold">
                  Fecha de Vencimiento
                </label>
                <Calendar
                  id="fechaVencimiento"
                  value={
                    documento.fechaVencimiento ? new Date(documento.fechaVencimiento) : null
                  }
                  onChange={(e) => onChange("fechaVencimiento", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  placeholder="Seleccionar fecha"
                  minDate={documento.fechaEmision ? new Date(documento.fechaEmision) : null}
                />
              </div>

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

            <div className="col-12" style={{ marginTop: "1rem" }}>
              <label htmlFor="urlDocumento" className="font-bold">
                Documento Adjunto (PDF)
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-end",
                  marginBottom: "1rem",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <InputText
                    id="urlDocumento"
                    value={pdfUrl || ""}
                    placeholder="URL del documento adjunto"
                    style={{ fontWeight: "bold" }}
                    readOnly
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Button
                    type="button"
                    label="Capturar/Subir"
                    icon="pi pi-upload"
                    className="p-button-info"
                    size="small"
                    onClick={() => setMostrarCaptura(true)}
                    disabled={saving || !documento?.id}
                  />
                </div>

                <div style={{ flex: 2 }}>
                  {pdfUrl && (
                    <PDFActionButtons
                      pdfUrl={pdfUrl}
                      moduleName="documento-requerido"
                      fileName={`documento-requerido-${documento?.id || "sin-id"}.pdf`}
                      viewButtonLabel="Ver"
                      downloadButtonLabel="Descargar"
                      toast={toast}
                    />
                  )}
                </div>
              </div>

              {pdfUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <PDFViewerV2
                    pdfUrl={pdfUrl}
                    moduleName="documento-requerido"
                    height="600px"
                    key={pdfRefreshKey}
                  />
                </div>
              )}

              {!pdfUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <Message
                    severity="warn"
                    text="No hay documento adjunto. Use el botón 'Capturar/Subir' para agregar uno."
                  />
                </div>
              )}
            </div>

            <div className="col-12" style={{ marginTop: "1rem" }}>
              <label htmlFor="observacionesVerificacion" className="font-bold">
                Observaciones / Comentarios
              </label>
              <InputTextarea
                id="observacionesVerificacion"
                value={documento.observacionesVerificacion || ""}
                onChange={(e) => onChange("observacionesVerificacion", e.target.value)}
                rows={4}
                placeholder="Ingrese observaciones o comentarios sobre este documento..."
                autoResize
              />
            </div>
          </div>
        )}
      </Dialog>

      <PDFMultiCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        moduleName="documento-requerido"
        entityId={documento?.id}
        dialogTitle="Subir Documento Requerido"
        onComplete={handlePdfComplete}
        onError={handlePdfError}
      />
    </>
  );
};

export default DocumentoRequeridoDialog;