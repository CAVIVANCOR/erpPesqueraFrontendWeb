/**
 * VerImpresionLiquidacionPI.jsx
 *
 * Card para generar y visualizar el PDF de liquidación de Pesca Industrial.
 * Permite generar, visualizar y descargar PDFs de liquidación.
 * Sigue el patrón profesional ERP Megui usando PDFViewer genérico y pdfUtils.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFLiquidacionPI } from "./LiquidacionPescaIndustrialPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente VerImpresionLiquidacionPI
 * @param {Object} props - Props del componente
 * @param {number} props.entregaARendirId - ID de la entrega a rendir
 * @param {Object} props.datosEntrega - Datos completos de la entrega
 * @param {Array} props.movimientos - Movimientos de la entrega
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 */
const VerImpresionLiquidacionPI = ({
  entregaARendirId,
  datosEntrega = {},
  movimientos = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  // Cargar URL del PDF si existe en datosEntrega
  useEffect(() => {
    if (datosEntrega?.urlLiquidacionPdf) {
      setPdfUrl(datosEntrega.urlLiquidacionPdf);
    }
  }, [datosEntrega?.urlLiquidacionPdf]);

  /**
   * Genera el PDF de liquidación
   */
  const handleGenerarPDF = async () => {
    console.log("=== DEBUG GENERAR PDF LIQUIDACIÓN ===");
    console.log("entregaARendirId:", entregaARendirId);
    console.log("datosEntrega:", datosEntrega);
    console.log("movimientos:", movimientos);

    if (!datosEntrega?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la entrega a rendir antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    if (movimientos.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe agregar al menos un movimiento para generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar la entrega completa desde el backend con todas las relaciones
      let entregaCompleta;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/entregas-a-rendir/${datosEntrega.id}`,
          { headers }
        );
        if (response.ok) {
          entregaCompleta = await response.json();
        } else {
          throw new Error("No se pudo cargar la entrega completa");
        }
      } catch (error) {
        console.error("Error cargando entrega completa:", error);
        throw new Error("No se pudo cargar la entrega completa desde el servidor");
      }

      // Cargar empresa
      let empresa;
      try {
        const empresaResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/empresas/1`,
          { headers }
        );
        if (empresaResponse.ok) {
          empresa = await empresaResponse.json();
        } else {
          throw new Error("No se pudo cargar los datos de la empresa");
        }
      } catch (error) {
        console.error("Error cargando empresa:", error);
        empresa = {
          razonSocial: "EMPRESA",
          ruc: "N/A",
          direccion: "N/A",
        };
      }

      // Generar y subir el PDF
      const resultado = await generarYSubirPDFLiquidacionPI(
        entregaCompleta,
        movimientos,
        empresa
      );

      if (resultado.success) {
        setPdfUrl(resultado.urlPdf);
        setPdfKey((prev) => prev + 1);

        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "PDF de liquidación generado correctamente",
          life: 3000,
        });

        // Notificar al componente padre
        if (onPdfGenerated) {
          onPdfGenerated(resultado.urlPdf);
        }
      } else {
        throw new Error(resultado.error || "Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al generar el PDF de liquidación",
        life: 5000,
      });
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Abre el PDF en una nueva pestaña
   */
  const handleAbrirPDF = () => {
    if (pdfUrl) {
      abrirPdfEnNuevaPestana(pdfUrl, toast);
    }
  };

  /**
   * Descarga el PDF
   */
  const handleDescargarPDF = () => {
    if (pdfUrl) {
      const nombreArchivo = `liquidacion_pesca_industrial_${entregaARendirId}.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo);
    }
  };

  return (
    <Card
      title="Liquidación PDF - Pesca Industrial"
      className="mb-4"
      style={{ fontSize: "12px" }}
    >
      <div className="mb-3">
        <Message
          severity="info"
          text="Genere el PDF de liquidación para visualizar y descargar el documento oficial"
        />
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <Button
          label="Generar PDF"
          icon="pi pi-file-pdf"
          onClick={handleGenerarPDF}
          loading={generando}
          severity="success"
        />

        {pdfUrl && (
          <>
            <Button
              label="Abrir en Nueva Pestaña"
              icon="pi pi-external-link"
              onClick={handleAbrirPDF}
              severity="info"
            />
            <Button
              label="Descargar"
              icon="pi pi-download"
              onClick={handleDescargarPDF}
              severity="help"
            />
          </>
        )}
      </div>

      {/* Visor de PDF */}
      {pdfUrl ? (
        <PDFViewer key={pdfKey} urlDocumento={pdfUrl} altura="600px" />
      ) : (
        <div className="text-center p-4">
          <Message
            severity="warn"
            text="No hay PDF generado. Haga clic en 'Generar PDF' para crear el documento."
          />
        </div>
      )}
    </Card>
  );
};

export default VerImpresionLiquidacionPI;
