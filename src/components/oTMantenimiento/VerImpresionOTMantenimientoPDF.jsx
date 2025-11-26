/**
 * VerImpresionOTMantenimientoPDF.jsx
 *
 * Card para generar y visualizar el PDF de la orden de trabajo de mantenimiento.
 * Permite generar, visualizar y descargar PDFs de OT.
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
import { generarYSubirPDFOTMantenimiento } from "./OTMantenimientoPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente VerImpresionOTMantenimientoPDF
 * @param {Object} props - Props del componente
 * @param {number} props.otMantenimientoId - ID de la OT
 * @param {Object} props.datosOT - Datos completos de la OT
 * @param {Array} props.tareas - Tareas de la OT
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 */
const VerImpresionOTMantenimientoPDF = ({
  otMantenimientoId,
  datosOT = {},
  tareas = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  // Cargar URL del PDF si existe en datosOT
  useEffect(() => {
    if (datosOT?.urlOrdenTrabajoPdf) {
      setPdfUrl(datosOT.urlOrdenTrabajoPdf);
    }
  }, [datosOT?.urlOrdenTrabajoPdf]);

  /**
   * Genera el PDF de la orden de trabajo
   */
  const handleGenerarPDF = async () => {
    if (!datosOT?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la orden de trabajo antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar la OT completa desde el backend con todas las relaciones
      let otCompleta;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ot-mantenimiento/${datosOT.id}`,
          { headers }
        );
        if (response.ok) {
          otCompleta = await response.json();
        } else {
          throw new Error("No se pudo cargar la OT completa");
        }
      } catch (error) {
        console.error("Error cargando OT completa:", error);
        throw new Error("No se pudo cargar la OT completa desde el servidor");
      }

      // Cargar tareas con insumos
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

      // Cargar empresa
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

      // Generar y subir el PDF
      const resultado = await generarYSubirPDFOTMantenimiento(
        otCompleta,
        tareasCompletas,
        empresa
      );

      if (resultado.success) {
        setPdfUrl(resultado.urlPdf);
        setPdfKey((prev) => prev + 1);

        // Notificar al componente padre
        if (onPdfGenerated) {
          onPdfGenerated(resultado.urlPdf);
        }

        toast.current.show({
          severity: "success",
          summary: "PDF Generado",
          detail: "El PDF de la orden de trabajo se generó correctamente",
          life: 3000,
        });
      } else {
        throw new Error(resultado.error || "Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al generar el PDF",
        life: 4000,
      });
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Abre el PDF en una nueva pestaña
   */
  const handleVerPDF = () => {
    if (pdfUrl) {
      abrirPdfEnNuevaPestana(
        pdfUrl,
        toast.current,
        "No hay PDF de orden de trabajo disponible"
      );
    }
  };

  /**
   * Descarga el PDF
   */
  const handleDescargarPDF = () => {
    if (pdfUrl) {
      const nombreArchivo = `OT-${datosOT.codigo || otMantenimientoId}.pdf`;
      descargarPdf(pdfUrl, toast.current, nombreArchivo);
    }
  };

  return (
    <Card
      title="📋 Orden de Trabajo - Impresión PDF"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* Mensaje informativo */}
        {!pdfUrl && (
          <Message
            severity="info"
            text="Genere el PDF de la orden de trabajo con todos los detalles, tareas e insumos"
            className="mb-3"
          />
        )}

        {pdfUrl && (
          <Message
            severity="success"
            text="✓ PDF de orden de trabajo generado"
            className="mb-3"
          />
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Button
            label={pdfUrl ? "Regenerar PDF" : "Generar PDF"}
            icon={generando ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"}
            onClick={handleGenerarPDF}
            disabled={generando || !otMantenimientoId}
            className="p-button-primary"
          />

          {pdfUrl && (
            <>
              <Button
                label="Ver PDF"
                icon="pi pi-eye"
                onClick={handleVerPDF}
                className="p-button-info"
              />
              <Button
                label="Descargar"
                icon="pi pi-download"
                onClick={handleDescargarPDF}
                className="p-button-success"
              />
            </>
          )}
        </div>

        {/* Visor de PDF */}
        {pdfUrl && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer key={pdfKey} urlDocumento={pdfUrl} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionOTMantenimientoPDF;