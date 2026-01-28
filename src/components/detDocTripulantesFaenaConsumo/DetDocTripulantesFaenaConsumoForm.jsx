import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import PDFViewerV2 from "../pdf/PDFViewerV2";
import PDFActionButtons from "../pdf/PDFActionButtons";
import { Toast } from "primereact/toast";

const DetDocTripulantesFaenaConsumoForm = ({
  formData,
  errors,
  handleInputChange,
  handleDateChange,
  tiposDocumentoOptions,
  readOnly = false,
  toast,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (formData?.urlDocPdf) {
      setPdfUrl(formData.urlDocPdf);
    }
  }, [formData?.urlDocPdf]);

  return (
    <div className="p-fluid formgrid grid">
      <div className="field col-12 md:col-6">
        <label htmlFor="tipoDocumentoId">Tipo de Documento *</label>
        <Dropdown
          id="tipoDocumentoId"
          name="tipoDocumentoId"
          value={formData.tipoDocumentoId}
          options={tiposDocumentoOptions}
          onChange={handleInputChange}
          placeholder="Seleccione un tipo"
          className={classNames({ "p-invalid": errors.tipoDocumentoId })}
          disabled={readOnly}
        />
        {errors.tipoDocumentoId && <small className="p-error">{errors.tipoDocumentoId}</small>}
      </div>

      <div className="field col-12 md:col-6">
        <label htmlFor="numeroDocumento">Número de Documento</label>
        <InputText
          id="numeroDocumento"
          name="numeroDocumento"
          value={formData.numeroDocumento || ""}
          onChange={handleInputChange}
          className={classNames({ "p-invalid": errors.numeroDocumento })}
          disabled={readOnly}
        />
        {errors.numeroDocumento && <small className="p-error">{errors.numeroDocumento}</small>}
      </div>

      <div className="field col-12 md:col-6">
        <label htmlFor="fechaEmision">Fecha de Emisión</label>
        <Calendar
          id="fechaEmision"
          name="fechaEmision"
          value={formData.fechaEmision ? new Date(formData.fechaEmision) : null}
          onChange={(e) => handleDateChange("fechaEmision", e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          className={classNames({ "p-invalid": errors.fechaEmision })}
          disabled={readOnly}
        />
        {errors.fechaEmision && <small className="p-error">{errors.fechaEmision}</small>}
      </div>

      <div className="field col-12 md:col-6">
        <label htmlFor="fechaVencimiento">Fecha de Vencimiento</label>
        <Calendar
          id="fechaVencimiento"
          name="fechaVencimiento"
          value={formData.fechaVencimiento ? new Date(formData.fechaVencimiento) : null}
          onChange={(e) => handleDateChange("fechaVencimiento", e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          className={classNames({ "p-invalid": errors.fechaVencimiento })}
          disabled={readOnly}
        />
        {errors.fechaVencimiento && <small className="p-error">{errors.fechaVencimiento}</small>}
      </div>

      <div className="field col-12">
        <label htmlFor="observaciones">Observaciones</label>
        <InputText
          id="observaciones"
          name="observaciones"
          value={formData.observaciones || ""}
          onChange={handleInputChange}
          disabled={readOnly}
        />
      </div>

      {pdfUrl && (
        <div className="field col-12">
          <label>Documento PDF</label>
          <div className="mb-2">
            <PDFActionButtons
              pdfUrl={pdfUrl}
              moduleName="detalle-doc-tripulantes-consumo"
              fileName={`doc-tripulantes-consumo-${formData.id || 'nuevo'}.pdf`}
              viewButtonLabel="Ver"
              downloadButtonLabel="Descargar"
              toast={toast}
            />
          </div>
          <PDFViewerV2
            pdfUrl={pdfUrl}
            moduleName="detalle-doc-tripulantes-consumo"
            height="600px"
          />
        </div>
      )}
    </div>
  );
};

export default DetDocTripulantesFaenaConsumoForm;