/**
 * InformeFaenaPescaConsumoForm.jsx
 *
 * Componente para mostrar y editar el informe de faena de pesca consumo.
 * Permite capturar imágenes (armar PDF) o cargar PDFs para urlInformeFaena.
 * A diferencia de FaenaPesca, solo maneja UN campo de informe.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useRef } from "react";
import { Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const InformeFaenaPescaConsumoForm = ({
  control,
  watch,
  errors,
  loading = false,
  faenaData = null,
  setValue,
}) => {
  const toast = useRef(null);
  
  // Estado para captura de documento
  const [mostrarCapturaInforme, setMostrarCapturaInforme] = useState(false);

  // Observar cambios en la URL del PDF
  const urlInformeFaena = watch("urlInformeFaena");

  // Handler para documento subido
  const handleInformeSubido = (urlDocumento) => {
    setValue("urlInformeFaena", urlDocumento);
    setMostrarCapturaInforme(false);
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Informe de Faena subido correctamente",
      life: 3000,
    });
  };

  // Handler para ver PDF
  const handleVerInformePDF = () => {
    if (urlInformeFaena) {
      abrirPdfEnNuevaPestana(urlInformeFaena);
    }
  };

  return (
    <div className="card">
      <Toast ref={toast} />

      <div className="p-3">
        <h3 className="text-900 font-bold mb-3">Informe de Faena de Pesca Consumo</h3>
        
        {/* Campo URL Informe Faena */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: "1rem",
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            <label
              htmlFor="urlInformeFaena"
              className="block text-900 font-medium mb-2"
            >
              URL Informe de Faena
            </label>
            <Controller
              name="urlInformeFaena"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlInformeFaena"
                  {...field}
                  value={field.value || ""}
                  placeholder="URL del informe de faena"
                  className={classNames({
                    "p-invalid": errors.urlInformeFaena,
                  })}
                  style={{ fontWeight: "bold" }}
                  readOnly
                  disabled={loading}
                />
              )}
            />
            {errors.urlInformeFaena && (
              <Message
                severity="error"
                text={errors.urlInformeFaena.message}
              />
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <div className="flex gap-2">
              <Button
                type="button"
                label="Capturar/Subir"
                icon="pi pi-camera"
                className="p-button-info"
                onClick={() => setMostrarCapturaInforme(true)}
                size="small"
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            {urlInformeFaena && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-secondary"
                onClick={handleVerInformePDF}
                size="small"
              />
            )}
          </div>
        </div>

        {/* Visor de PDF para Informe */}
        {urlInformeFaena && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={urlInformeFaena} />
          </div>
        )}

        {/* Información adicional */}
        {!urlInformeFaena && (
          <Message
            severity="info"
            text="Capture o suba el informe de faena de pesca consumo en formato PDF o imagen"
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>

      {/* Modal de captura para Informe Faena */}
      {mostrarCapturaInforme && (
        <DocumentoCapture
          visible={mostrarCapturaInforme}
          onHide={() => setMostrarCapturaInforme(false)}
          onDocumentoSubido={handleInformeSubido}
          endpoint="/api/pesca/faenas-pesca-consumo/upload-informe-faena"
          titulo="Capturar Informe de Faena"
          toast={toast}
          extraData={{ faenaPescaConsumoId: faenaData?.id }}
        />
      )}
    </div>
  );
};

export default InformeFaenaPescaConsumoForm;