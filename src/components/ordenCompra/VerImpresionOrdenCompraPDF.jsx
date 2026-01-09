/**
 * VerImpresionOrdenCompraPDF.jsx
 *
 * Card para generar y visualizar el PDF de la orden de compra.
 * Permite generar, visualizar y descargar PDFs de órdenes de compra.
 * Sigue el patrón profesional ERP Megui usando PDFViewer genérico y pdfUtils.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFOrdenCompra } from "./OrdenCompraPDF";

/**
 * Componente VerImpresionOrdenCompraPDF
 * @param {Object} props - Props del componente
 * @param {number} props.ordenCompraId - ID de la orden de compra
 * @param {Object} props.datosOrdenCompra - Datos completos de la orden
 * @param {Object} props.toast - Referencia al Toast para mensajes
 */
const VerImpresionOrdenCompraPDF = ({
  ordenCompraId,
  datosOrdenCompra = {},
  toast,
  onPdfGenerated, // Callback para notificar al padre cuando se genera el PDF
  personalOptions = [], // Lista de personal para construir los objetos
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  // Cargar URL del PDF si existe en datosOrdenCompra
  useEffect(() => {
    if (datosOrdenCompra?.urlOrdenCompraPdf) {
      setPdfUrl(datosOrdenCompra.urlOrdenCompraPdf);
    }
  }, [datosOrdenCompra?.urlOrdenCompraPdf]);

  /**
   * Maneja la generación del PDF
   */
  const handleGenerarPDF = async () => {
    if (!datosOrdenCompra?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la orden de compra antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      console.log('🔍 [VerImpresionOrdenCompraPDF] datosOrdenCompra recibidos:', datosOrdenCompra);
      console.log('🔍 [VerImpresionOrdenCompraPDF] personalOptions:', personalOptions);
      
      // Obtener empresa de la orden
      const empresa = datosOrdenCompra.empresa;

      // Obtener detalles de la orden
      const detalles = datosOrdenCompra.detalles || [];
      
      // Construir objetos solicitante y aprobadoPor desde personalOptions
      const ordenConPersonal = { ...datosOrdenCompra };
      
      console.log('🔍 [VerImpresionOrdenCompraPDF] solicitanteId:', datosOrdenCompra.solicitanteId);
      console.log('🔍 [VerImpresionOrdenCompraPDF] solicitante existente:', datosOrdenCompra.solicitante);
      
      if (datosOrdenCompra.solicitanteId && !datosOrdenCompra.solicitante) {
        const solicitante = personalOptions.find(
          (p) => Number(p.id || p.value) === Number(datosOrdenCompra.solicitanteId)
        );
        console.log('🔍 [VerImpresionOrdenCompraPDF] solicitante encontrado:', solicitante);
        if (solicitante) {
          ordenConPersonal.solicitante = {
            nombreCompleto: solicitante.nombreCompleto || solicitante.label,
            numeroDocumento: solicitante.numeroDocumento,
            cargo: solicitante.cargo,
          };
        }
      }
      
      console.log('🔍 [VerImpresionOrdenCompraPDF] aprobadoPorId:', datosOrdenCompra.aprobadoPorId);
      console.log('🔍 [VerImpresionOrdenCompraPDF] aprobadoPor existente:', datosOrdenCompra.aprobadoPor);
      
      if (datosOrdenCompra.aprobadoPorId && !datosOrdenCompra.aprobadoPor) {
        const aprobadoPor = personalOptions.find(
          (p) => Number(p.id || p.value) === Number(datosOrdenCompra.aprobadoPorId)
        );
        console.log('🔍 [VerImpresionOrdenCompraPDF] aprobadoPor encontrado:', aprobadoPor);
        if (aprobadoPor) {
          ordenConPersonal.aprobadoPor = {
            nombreCompleto: aprobadoPor.nombreCompleto || aprobadoPor.label,
            numeroDocumento: aprobadoPor.numeroDocumento,
            cargo: aprobadoPor.cargo,
          };
        }
      }
      
      console.log('🔍 [VerImpresionOrdenCompraPDF] ordenConPersonal.solicitante:', ordenConPersonal.solicitante);
      console.log('🔍 [VerImpresionOrdenCompraPDF] ordenConPersonal.aprobadoPor:', ordenConPersonal.aprobadoPor);
      console.log('🔍 [VerImpresionOrdenCompraPDF] ordenConPersonal.centroCosto:', ordenConPersonal.centroCosto);
      console.log('🔍 [VerImpresionOrdenCompraPDF] ordenConPersonal.proveedor:', ordenConPersonal.proveedor);

      // Generar y subir el PDF
      const resultado = await generarYSubirPDFOrdenCompra(
        ordenConPersonal,
        detalles,
        empresa
      );

      if (resultado.success) {
        const urlPdf = resultado.urlPdf;
        setPdfUrl(urlPdf);
        
        // Actualizar el datosOrdenCompra con la nueva URL
        if (datosOrdenCompra && urlPdf) {
          datosOrdenCompra.urlOrdenCompraPdf = urlPdf;
        }
        
        // Notificar al componente padre
        if (onPdfGenerated && typeof onPdfGenerated === 'function') {
          onPdfGenerated(urlPdf);
        }
        
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "PDF generado y guardado correctamente",
          life: 3000,
        });
      } else {
        throw new Error(resultado.error || "Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al generar el PDF",
        life: 3000,
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
      abrirPdfEnNuevaPestana(pdfUrl, toast, "No hay PDF disponible");
    }
  };

  /**
   * Descarga el PDF
   */
  const handleDescargarPDF = () => {
    if (pdfUrl) {
      const nombreArchivo = `orden-compra-${
        datosOrdenCompra.numeroDocumento || ordenCompraId
      }.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo, "ordenes-compra");
    }
  };

  return (
    <Card>
      <div className="p-fluid">
        {/* Botones y URL */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="urlPdf">
              URL del PDF (se genera automáticamente)
            </label>
            <div className="p-inputgroup">
              <input
                id="urlPdf"
                type="text"
                className="p-inputtext p-component"
                value={pdfUrl || ""}
                readOnly
                placeholder="No hay PDF generado"
                style={{
                  backgroundColor: "#f8f9fa",
                  cursor: "not-allowed",
                }}
              />
              <Button
                icon="pi pi-file-pdf"
                label="Generar PDF"
                className="p-button-success"
                onClick={handleGenerarPDF}
                disabled={!ordenCompraId || generando}
                loading={generando}
              />
            </div>
          </div>

          {/* Botón Ver PDF */}
          <div style={{ flex: 0.5 }}>
            {pdfUrl && (
              <Button
                type="button"
                label="Ver PDF"
                icon="pi pi-eye"
                className="p-button-info"
                size="small"
                onClick={handleVerPDF}
                tooltip="Abrir PDF en nueva pestaña"
                tooltipOptions={{ position: "top" }}
              />
            )}
          </div>

          {/* Botón Descargar PDF */}
          <div style={{ flex: 0.5 }}>
            {pdfUrl && (
              <Button
                type="button"
                label="Descargar"
                icon="pi pi-download"
                className="p-button-secondary"
                size="small"
                onClick={handleDescargarPDF}
                tooltip="Descargar PDF"
                tooltipOptions={{ position: "top" }}
              />
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {pdfUrl && (
          <div style={{ marginTop: "1rem" }}>
            <PDFViewer urlDocumento={pdfUrl} altura="800px" key={pdfKey} />
          </div>
        )}

        {/* Mensaje cuando no hay PDF */}
        {!pdfUrl && (
          <div style={{ marginTop: "1rem" }}>
            <Message
              severity="warn"
              text='No hay PDF generado. Use el botón "Generar PDF" para generar el documento de la orden de compra.'
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionOrdenCompraPDF;