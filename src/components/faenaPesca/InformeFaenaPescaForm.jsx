/**
 * InformeFaenaPescaForm.jsx
 *
 * Componente para mostrar y editar el informe de faena de pesca.
 * Permite capturar imágenes (armar PDF) o cargar PDFs para urlReporteFaenaCalas y urlDeclaracionDesembarqueArmador.
 * Usa TabView para organizar los dos PDFs.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useRef } from "react";
import { Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

const InformeFaenaPescaForm = ({
  control,
  watch,
  errors,
  loading = false,
  faenaData = null,
  setValue,
}) => {
  const toast = useRef(null);
  
  // Estados para captura de documentos
  const [mostrarCapturaReporte, setMostrarCapturaReporte] = useState(false);
  const [mostrarCapturaDeclaracion, setMostrarCapturaDeclaracion] = useState(false);

  // Observar cambios en las URLs de los PDFs
  const urlInformeFaena = watch("urlInformeFaena");
  const urlReporteFaenaCalas = watch("urlReporteFaenaCalas");
  const urlDeclaracionDesembarqueArmador = watch("urlDeclaracionDesembarqueArmador");

  // Handlers para documentos subidos
  const handleReporteSubido = (urlDocumento) => {
    setValue("urlReporteFaenaCalas", urlDocumento);
    setMostrarCapturaReporte(false);
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Reporte de Faena Calas subido correctamente",
      life: 3000,
    });
  };

  const handleDeclaracionSubida = (urlDocumento) => {
    setValue("urlDeclaracionDesembarqueArmador", urlDocumento);
    setMostrarCapturaDeclaracion(false);
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Declaración de Desembarque subida correctamente",
      life: 3000,
    });
  };

  // Handlers para ver PDFs
  const handleVerReportePDF = () => {
    if (urlReporteFaenaCalas) {
      abrirPdfEnNuevaPestana(urlReporteFaenaCalas);
    }
  };

  const handleVerDeclaracionPDF = () => {
    if (urlDeclaracionDesembarqueArmador) {
      abrirPdfEnNuevaPestana(urlDeclaracionDesembarqueArmador);
    }
  };

  return (
    <div className="card">
      <Toast ref={toast} />

      {/* TabView para los dos PDFs */}
      <TabView>
        <TabPanel header="Reporte Faena Calas" leftIcon="pi pi-file-pdf mr-2">
          <div className="p-3">
            {/* Campo URL Reporte Faena Calas */}
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
                  htmlFor="urlReporteFaenaCalas"
                  className="block text-900 font-medium mb-2"
                >
                  URL Reporte Faena Calas
                </label>
                <Controller
                  name="urlReporteFaenaCalas"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlReporteFaenaCalas"
                      {...field}
                      value={field.value || ""}
                      placeholder="URL del reporte de faena calas"
                      className={classNames({
                        "p-invalid": errors.urlReporteFaenaCalas,
                      })}
                      style={{ fontWeight: "bold" }}
                      readOnly
                      disabled={loading}
                    />
                  )}
                />
                {errors.urlReporteFaenaCalas && (
                  <Message
                    severity="error"
                    text={errors.urlReporteFaenaCalas.message}
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
                    onClick={() => setMostrarCapturaReporte(true)}
                    size="small"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                {urlReporteFaenaCalas && (
                  <Button
                    type="button"
                    label="Ver PDF"
                    icon="pi pi-eye"
                    className="p-button-secondary"
                    onClick={handleVerReportePDF}
                    size="small"
                  />
                )}
              </div>
            </div>

            {/* Visor de PDF para Reporte */}
            {urlReporteFaenaCalas && (
              <div style={{ marginTop: "1rem" }}>
                <PDFViewer urlDocumento={urlReporteFaenaCalas} />
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel header="Declaración Desembarque" leftIcon="pi pi-file-word mr-2">
          <div className="p-3">
            {/* Campo URL Declaración Desembarque */}
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
                  htmlFor="urlDeclaracionDesembarqueArmador"
                  className="block text-900 font-medium mb-2"
                >
                  URL Declaración Desembarque Armador
                </label>
                <Controller
                  name="urlDeclaracionDesembarqueArmador"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlDeclaracionDesembarqueArmador"
                      {...field}
                      value={field.value || ""}
                      placeholder="URL de la declaración de desembarque del armador"
                      className={classNames({
                        "p-invalid": errors.urlDeclaracionDesembarqueArmador,
                      })}
                      style={{ fontWeight: "bold" }}
                      readOnly
                      disabled={loading}
                    />
                  )}
                />
                {errors.urlDeclaracionDesembarqueArmador && (
                  <Message
                    severity="error"
                    text={errors.urlDeclaracionDesembarqueArmador.message}
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
                    onClick={() => setMostrarCapturaDeclaracion(true)}
                    size="small"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                {urlDeclaracionDesembarqueArmador && (
                  <Button
                    type="button"
                    label="Ver PDF"
                    icon="pi pi-eye"
                    className="p-button-secondary"
                    onClick={handleVerDeclaracionPDF}
                    size="small"
                  />
                )}
              </div>
            </div>

            {/* Visor de PDF para Declaración */}
            {urlDeclaracionDesembarqueArmador && (
              <div style={{ marginTop: "1rem" }}>
                <PDFViewer urlDocumento={urlDeclaracionDesembarqueArmador} />
              </div>
            )}
          </div>
        </TabPanel>
      </TabView>

      {/* Modal de captura para Reporte Faena Calas */}
      {mostrarCapturaReporte && (
        <DocumentoCapture
          visible={mostrarCapturaReporte}
          onHide={() => setMostrarCapturaReporte(false)}
          onDocumentoSubido={handleReporteSubido}
          endpoint="/api/pesca/faenas-pesca/upload-reporte-calas"
          titulo="Capturar Reporte de Faena Calas"
          toast={toast}
          extraData={{ faenaPescaId: faenaData?.id }}
        />
      )}

      {/* Modal de captura para Declaración Desembarque */}
      {mostrarCapturaDeclaracion && (
        <DocumentoCapture
          visible={mostrarCapturaDeclaracion}
          onHide={() => setMostrarCapturaDeclaracion(false)}
          onDocumentoSubido={handleDeclaracionSubida}
          endpoint="/api/pesca/faenas-pesca/upload-declaracion-desembarque"
          titulo="Capturar Declaración de Desembarque del Armador"
          toast={toast}
          extraData={{ faenaPescaId: faenaData?.id }}
        />
      )}
    </div>
  );
};

export default InformeFaenaPescaForm;
