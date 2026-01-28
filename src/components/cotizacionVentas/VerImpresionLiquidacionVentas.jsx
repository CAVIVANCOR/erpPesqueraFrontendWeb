import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFLiquidacionVentas } from "./LiquidacionVentasPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionLiquidacionVentas = ({
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
      throw new Error("Debe guardar la entrega antes de generar el PDF");
    }
    if (movimientos.length === 0) {
      throw new Error("Debe agregar al menos un movimiento");
    }

    const token = useAuthStore.getState().token;
    const headers = { Authorization: `Bearer ${token}` };

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-rendir-ventas/${datosEntrega.id}`,
      { headers }
    );
    if (!response.ok) throw new Error("No se pudo cargar la entrega completa");
    const entregaCompleta = await response.json();

    const empresaResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/empresas/1`,
      { headers }
    );
    const empresa = empresaResponse.ok
      ? await empresaResponse.json()
      : { razonSocial: "EMPRESA", ruc: "N/A", direccion: "N/A" };

    const resultado = await generarYSubirPDFLiquidacionVentas(
      entregaCompleta,
      movimientos,
      empresa
    );

    return resultado;
  };

  return (
    <Card title="Liquidación PDF - Ventas" className="mb-4" style={{ fontSize: "12px" }}>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosEntrega}
        moduleName="entregas-rendir-ventas"
        entityId={entregaARendirId}
        fileName={`liquidacion-ventas-${entregaARendirId}.pdf`}
        buttonLabel="Generar PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!datosEntrega?.id || movimientos.length === 0}
        warningMessage={
          !datosEntrega?.id
            ? "Debe guardar la entrega antes de generar el PDF"
            : movimientos.length === 0
            ? "Debe agregar al menos un movimiento"
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

export default VerImpresionLiquidacionVentas;