import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFOTMantenimiento } from "./OTMantenimientoPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionOTMantenimientoPDF = ({
  otMantenimientoId,
  datosOT = {},
  tareas = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosOT?.urlOrdenTrabajoPdf) {
      setPdfUrl(datosOT.urlOrdenTrabajoPdf);
    }
  }, [datosOT?.urlOrdenTrabajoPdf]);

  const generarPdfWrapper = async () => {
    if (!datosOT?.id) {
      throw new Error("Debe guardar la orden de trabajo antes de generar el PDF");
    }

    const token = useAuthStore.getState().token;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/ot-mantenimiento/${datosOT.id}`,
      { headers }
    );
    if (!response.ok) throw new Error("No se pudo cargar la OT completa desde el servidor");
    const otCompleta = await response.json();

    let tareasCompletas = [];
    try {
      const responseTareas = await fetch(
        `${import.meta.env.VITE_API_URL}/tareas-ot/ot/${datosOT.id}`,
        { headers }
      );
      if (responseTareas.ok) {
        tareasCompletas = await responseTareas.json();
      }
    } catch (error) {
      console.error("Error cargando tareas:", error);
    }

    let empresa;
    try {
      const responseEmpresa = await fetch(
        `${import.meta.env.VITE_API_URL}/empresas/${otCompleta.empresaId}`,
        { headers }
      );
      if (responseEmpresa.ok) {
        empresa = await responseEmpresa.json();
      }
    } catch (error) {
      console.error("Error cargando empresa:", error);
    }

    const resultado = await generarYSubirPDFOTMantenimiento(
      otCompleta,
      tareasCompletas,
      empresa
    );

    return resultado;
  };

  return (
    <Card>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosOT}
        moduleName="ot-mantenimiento-documento"
        entityId={otMantenimientoId}
        fileName={`ot-mantenimiento-${datosOT.numeroDocumento || otMantenimientoId}.pdf`}
        buttonLabel="Generar PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!datosOT?.id}
        warningMessage={
          !datosOT?.id
            ? "Debe guardar la orden de trabajo antes de generar el PDF"
            : null
        }
        toast={toast}
        viewerHeight="800px"
        onGenerateComplete={(url) => {
          setPdfUrl(url);
          if (onPdfGenerated) onPdfGenerated(url);
        }}
        initialPdfUrl={datosOT?.urlOrdenTrabajoPdf}
      />
    </Card>
  );
};

export default VerImpresionOTMantenimientoPDF;