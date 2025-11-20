// src/components/cotizacionVentas/DocumentoRequeridoDialog.jsx
/**
 * Diálogo para Agregar/Editar Documento Requerido
 * Implementa TODOS los campos del modelo DetDocsReqCotizaVentas
 * 
 * @author ERP Megui
 * @version 1.0.0 - Implementación profesional completa
 */

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

const DocumentoRequeridoDialog = ({
  visible,
  documento,
  onHide,
  onSave,
  onChange,
  monedasOptions = [],
  docRequeridaVentasOptions = [],
  saving = false,
}) => {
  const handleSave = () => {
    // Validaciones
    if (!documento?.docRequeridaVentasId) {
      return;
    }
    onSave();
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        label="Guardar"
        icon="pi pi-save"
        onClick={handleSave}
        loading={saving}
        disabled={!documento?.docRequeridaVentasId}
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
      style={{ width: "800px" }}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      resizable={false}
    >
      {documento && (
        <div className="grid p-fluid">
          {/* Tipo de Documento - OBLIGATORIO */}
          <div className="col-12">
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
          <div className="col-12 md:col-6">
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

          {/* URL del Documento */}
          <div className="col-12 md:col-6">
            <label htmlFor="urlDocumento" className="font-bold">
              URL del Documento
            </label>
            <InputText
              id="urlDocumento"
              value={documento.urlDocumento || ""}
              onChange={(e) => onChange("urlDocumento", e.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </div>

          {/* Fecha de Emisión */}
          <div className="col-12 md:col-6">
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
          <div className="col-12 md:col-6">
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

          {/* Costo del Documento */}
          <div className="col-12 md:col-6">
            <label htmlFor="costoDocumento" className="font-bold">
              Costo del Documento
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

          {/* Moneda */}
          <div className="col-12 md:col-6">
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

          {/* Checkboxes */}
          <div className="col-12">
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="field-checkbox">
                  <Checkbox
                    inputId="esObligatorio"
                    checked={documento.esObligatorio || false}
                    onChange={(e) => onChange("esObligatorio", e.checked)}
                  />
                  <label htmlFor="esObligatorio" className="ml-2 font-bold">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    Es Obligatorio
                  </label>
                </div>
                <small className="text-500">
                  Marca si este documento es obligatorio para la cotización
                </small>
              </div>

              <div className="col-12 md:col-6">
                <div className="field-checkbox">
                  <Checkbox
                    inputId="verificado"
                    checked={documento.verificado || false}
                    onChange={(e) => onChange("verificado", e.checked)}
                  />
                  <label htmlFor="verificado" className="ml-2 font-bold">
                    <i className="pi pi-check-circle mr-2"></i>
                    Verificado
                  </label>
                </div>
                <small className="text-500">
                  Marca si el documento ha sido verificado y aprobado
                </small>
              </div>
            </div>
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
    </Dialog>
  );
};

export default DocumentoRequeridoDialog;
