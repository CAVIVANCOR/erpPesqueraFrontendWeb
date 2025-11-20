import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFLiquidacionCompras } from "./LiquidacionComprasPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionLiquidacionCompras = ({
  entregaARendirId,
  datosEntrega = {},
  movimientos = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  useEffect(() => {
    if (datosEntrega?.urlLiquidacionPdf) {
      setPdfUrl(datosEntrega.urlLiquidacionPdf);
    }
  }, [datosEntrega?.urlLiquidacionPdf]);

  const handleGenerarPDF = async () => {
    if (!datosEntrega?.id) {
      toast.current.show({ severity: "warn", summary: "Advertencia", detail: "Debe guardar la entrega antes de generar el PDF", life: 3000 });
      return;
    }
    if (movimientos.length === 0) {
      toast.current.show({ severity: "warn", summary: "Advertencia", detail: "Debe agregar al menos un movimiento", life: 3000 });
      return;
    }

    setGenerando(true);
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/entregas-rendir-compras/${datosEntrega.id}`, { headers });
      if (!response.ok) throw new Error("No se pudo cargar la entrega completa");
      const entregaCompleta = await response.json();

      const empresaResponse = await fetch(`${import.meta.env.VITE_API_URL}/empresas/1`, { headers });
      const empresa = empresaResponse.ok ? await empresaResponse.json() : { razonSocial: "EMPRESA", ruc: "N/A", direccion: "N/A" };

      const resultado = await generarYSubirPDFLiquidacionCompras(entregaCompleta, movimientos, empresa);

      if (resultado.success) {
        setPdfUrl(resultado.urlPdf);
        setPdfKey((prev) => prev + 1);
        toast.current.show({ severity: "success", summary: "Éxito", detail: "PDF generado correctamente", life: 3000 });
        if (onPdfGenerated) onPdfGenerated(resultado.urlPdf);
      } else {
        throw new Error(resultado.error || "Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 5000 });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Card title="Liquidación PDF - Compras" className="mb-4" style={{ fontSize: "12px" }}>
      <div className="mb-3">
        <Message severity="info" text="Genere el PDF de liquidación para visualizar y descargar el documento oficial" />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <Button label="Generar PDF" icon="pi pi-file-pdf" onClick={handleGenerarPDF} loading={generando} severity="success" disabled={!datosEntrega?.id || movimientos.length === 0} />
        {pdfUrl && (
          <>
            <Button label="Abrir en Nueva Pestaña" icon="pi pi-external-link" onClick={() => abrirPdfEnNuevaPestana(pdfUrl)} severity="info" />
            <Button label="Descargar" icon="pi pi-download" onClick={() => descargarPdf(pdfUrl, `liquidacion_compras_${entregaARendirId}.pdf`)} severity="help" />
          </>
        )}
      </div>
      {pdfUrl ? (
        <PDFViewer key={pdfKey} pdfUrl={pdfUrl} height="600px" />
      ) : (
        <div className="text-center p-4">
          <Message severity="warn" text="No hay PDF generado. Haga clic en 'Generar PDF' para crear el documento." />
        </div>
      )}
    </Card>
  );
};

export default VerImpresionLiquidacionCompras;
