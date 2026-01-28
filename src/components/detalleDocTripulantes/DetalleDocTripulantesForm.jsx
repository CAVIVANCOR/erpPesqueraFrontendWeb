import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import PDFViewerOnly from "../pdf/PDFViewerOnly";
import { Button } from "primereact/button";

const DetalleDocTripulantesForm = ({
  formData,
  errors,
  handleInputChange,
  handleDateChange,
  handleCheckboxChange,
  tiposDocumentoOptions,
  readOnly = false,
  toast,
}) => {
  return (
    <div className="p-fluid formgrid grid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="documentoId">Tipo de Documento *</label>
          <Dropdown
            id="documentoId"
            name="documentoId"
            value={formData.documentoId}
            options={tiposDocumentoOptions}
            onChange={handleInputChange}
            placeholder="Seleccione un tipo"
            className={classNames({ "p-invalid": errors.documentoId })}
            style={{ fontWeight: "Bold" }}
            disabled={readOnly}
          />
          {errors.documentoId && (
            <small className="p-error">{errors.documentoId}</small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroDocumento">Número de Documento</label>
          <InputText
            id="numeroDocumento"
            name="numeroDocumento"
            value={formData.numeroDocumento || ""}
            onChange={handleInputChange}
            className={classNames({ "p-invalid": errors.numeroDocumento })}
            style={{ fontWeight: "Bold" }}
            disabled={readOnly}
          />
          {errors.numeroDocumento && (
            <small className="p-error">{errors.numeroDocumento}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaEmision">Fecha de Emisión</label>
          <Calendar
            id="fechaEmision"
            name="fechaEmision"
            value={
              formData.fechaEmision ? new Date(formData.fechaEmision) : null
            }
            onChange={(e) => handleDateChange("fechaEmision", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            className={classNames({ "p-invalid": errors.fechaEmision })}
            inputStyle={{ fontWeight: "Bold" }}
            disabled={readOnly}
          />
          {errors.fechaEmision && (
            <small className="p-error">{errors.fechaEmision}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento">Fecha de Vencimiento</label>
          <Calendar
            id="fechaVencimiento"
            name="fechaVencimiento"
            value={
              formData.fechaVencimiento
                ? new Date(formData.fechaVencimiento)
                : null
            }
            onChange={(e) => handleDateChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            className={classNames({ "p-invalid": errors.fechaVencimiento })}
            inputStyle={{ fontWeight: "Bold" }}
            disabled={readOnly}
          />
          {errors.fechaVencimiento && (
            <small className="p-error">{errors.fechaVencimiento}</small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 4 }}>
          <label htmlFor="observaciones">Observaciones</label>
          <InputText
            id="observaciones"
            name="observaciones"
            value={formData.observaciones || ""}
            onChange={handleInputChange}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          {(() => {
            const fechaActual = new Date();
            const fechaVencimiento = formData.fechaVencimiento
              ? new Date(formData.fechaVencimiento)
              : null;
            const estaVencido =
              !fechaVencimiento || fechaVencimiento < fechaActual;

            return (
              <Button
                label={!estaVencido ? "VIGENTE" : "VENCIDO"}
                icon={!estaVencido ? "pi pi-check" : "pi pi-times"}
                severity={!estaVencido ? "success" : "danger"}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                }}
                disabled={readOnly}
              />
            );
          })()}
        </div>
      </div>

      {formData.urlDocTripulantePdf && (
        <div className="field col-12">
          <PDFViewerOnly
            pdfUrl={formData.urlDocTripulantePdf}
            moduleName="documentacion-personal"
            title="Documento PDF del Tripulante"
            fileName={`doc-tripulante-${formData.numeroDocumento || "sin-numero"}.pdf`}
            viewButtonLabel="Ver"
            downloadButtonLabel="Descargar"
            emptyMessage="No hay documento PDF cargado"
            emptyDescription="Este tripulante no tiene documento PDF asociado"
            height="600px"
            showUrlField={true}
            toast={toast}
          />
        </div>
      )}
    </div>
  );
};

export default DetalleDocTripulantesForm;
