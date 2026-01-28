import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFLiquidacionPI } from "./LiquidacionPescaIndustrialPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionLiquidacionPI = ({
  entregaARendirId,
  datosEntrega = {},
  movimientos = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosEntrega?.urlLiquidacionPdf) {
      setPdfUrl(datosEntrega.urlLiquidacionPdf);
    }
  }, [datosEntrega?.urlLiquidacionPdf]);

  const generarPdfWrapper = async () => {
    if (!datosEntrega?.id) {
      throw new Error("Debe guardar la entrega a rendir antes de generar el PDF");
    }
    if (movimientos.length === 0) {
      throw new Error("Debe agregar al menos un movimiento para generar el PDF");
    }

    const token = useAuthStore.getState().token;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-a-rendir/${datosEntrega.id}`,
      { headers }
    );
    if (!response.ok) throw new Error("No se pudo cargar la entrega completa");
    const entregaCompleta = await response.json();

    const empresaResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/empresas/1`,
      { headers }
    );
    if (!empresaResponse.ok) throw new Error("No se pudo cargar los datos de la empresa");
    const empresa = await empresaResponse.json();

    const resultado = await generarYSubirPDFLiquidacionPI(
      entregaCompleta,
      movimientos,
      empresa
    );

    return resultado;
  };

  return (
    <Card
      title="Liquidación PDF - Pesca Industrial"
      className="mb-4"
      style={{ fontSize: "12px" }}
    >
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosEntrega}
        moduleName="entregas-a-rendir"
        entityId={entregaARendirId}
        fileName={`liquidacion-pesca-industrial-${entregaARendirId}.pdf`}
        buttonLabel="Generar PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!datosEntrega?.id || movimientos.length === 0}
        warningMessage={
          !datosEntrega?.id
            ? "Debe guardar la entrega a rendir antes de generar el PDF"
            : movimientos.length === 0
            ? "Debe agregar al menos un movimiento para generar el PDF"
            : null
        }
        infoMessage="Genere el PDF de liquidación para visualizar y descargar el documento oficial"
        toast={toast}
        viewerHeight="600px"
        onGenerateComplete={(url) => {
          setPdfUrl(url);
          if (onPdfGenerated) onPdfGenerated(url);
        }}
        initialPdfUrl={datosEntrega?.urlLiquidacionPdf}
      />
    </Card>
  );
};

export default VerImpresionLiquidacionPI;