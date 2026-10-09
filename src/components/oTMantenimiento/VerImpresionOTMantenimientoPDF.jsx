import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFOTMantenimiento } from "./OTMantenimientoPDF";
import { getOrdenTrabajoPorId } from "../../api/oTMantenimiento";
import { getDocumentosCompraPorPresupuesto } from "../../api/detContratistasOT";

const VerImpresionOTMantenimientoPDF = ({
  otMantenimientoId,
  datosOT = {},
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

    const otCompleta = await getOrdenTrabajoPorId(datosOT.id);

    const contratistasCompletos = await Promise.all(
      (otCompleta.contratistas || []).map(async (contratista) => {
        try {
          return {
            ...contratista,
            documentosCompra: await getDocumentosCompraPorPresupuesto(contratista.id),
          };
        } catch (error) {
          console.error(`Error cargando documentos del presupuesto ${contratista.id}:`, error);
          return { ...contratista, documentosCompra: [] };
        }
      })
    );

    const resultado = await generarYSubirPDFOTMantenimiento(
      otCompleta,
      otCompleta.empresa,
      contratistasCompletos
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