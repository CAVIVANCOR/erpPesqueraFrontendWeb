/**
 * VerImpresionRequerimientoCompraPDF.jsx
 *
 * Card para generar y visualizar el PDF del requerimiento de compra.
 * Permite generar, visualizar y descargar PDFs de requerimientos para enviar a proveedores.
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
import { generarYSubirPDFRequerimientoCompra } from "./RequerimientoCompraPDF";

/**
 * Componente VerImpresionRequerimientoCompraPDF
 * @param {Object} props - Props del componente
 * @param {number} props.requerimientoId - ID del requerimiento de compra
 * @param {Object} props.datosRequerimiento - Datos completos del requerimiento
 * @param {Object} props.toast - Referencia al Toast para mensajes
 */
const VerImpresionRequerimientoCompraPDF = ({
  requerimientoId,
  datosRequerimiento = {},
  toast,
  onPdfGenerated, // Callback para notificar al padre cuando se genera el PDF
  personalOptions = [], // Lista de personal para construir los objetos
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [mostrarProveedor, setMostrarProveedor] = useState(false);

  // Cargar URL del PDF si existe en datosRequerimiento
  useEffect(() => {
    if (datosRequerimiento?.urlReqCompraPdf) {
      setPdfUrl(datosRequerimiento.urlReqCompraPdf);
    }
  }, [datosRequerimiento?.urlReqCompraPdf]);

  /**
   * Maneja el documento subido desde DocumentoCapture
   */
  const handleGenerarPDF = async () => {
    if (!datosRequerimiento?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el requerimiento antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      // Obtener empresa del requerimiento
      const empresa = datosRequerimiento.empresa;

      // Obtener detalles del requerimiento
      const detalles = datosRequerimiento.detalles || [];
      
      // Construir objetos solicitante y respCompras desde personalOptions
      const requerimientoConPersonal = { ...datosRequerimiento };
      
      if (datosRequerimiento.solicitanteId && !datosRequerimiento.solicitante) {
        const solicitante = personalOptions.find(
          (p) => Number(p.id || p.value) === Number(datosRequerimiento.solicitanteId)
        );
        if (solicitante) {
          requerimientoConPersonal.solicitante = {
            nombreCompleto: solicitante.nombreCompleto || solicitante.label,
            numeroDocumento: solicitante.numeroDocumento,
          };
        }
      }
      
      if (datosRequerimiento.respComprasId && !datosRequerimiento.respCompras) {
        const respCompras = personalOptions.find(
          (p) => Number(p.id || p.value) === Number(datosRequerimiento.respComprasId)
        );
        if (respCompras) {
          requerimientoConPersonal.respCompras = {
            nombreCompleto: respCompras.nombreCompleto || respCompras.label,
            numeroDocumento: respCompras.numeroDocumento,
          };
        }
      }

      // Generar y subir el PDF
      const resultado = await generarYSubirPDFRequerimientoCompra(
        requerimientoConPersonal,
        detalles,
        empresa,
        mostrarProveedor
      );

      if (resultado.success) {
        const urlPdf = resultado.urlPdf;
        setPdfUrl(urlPdf);
        
        // Actualizar el datosRequerimiento con la nueva URL
        if (datosRequerimiento && urlPdf) {
          datosRequerimiento.urlReqCompraPdf = urlPdf;
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
      const nombreArchivo = `requerimiento-compra-${
        datosRequerimiento.numeroDocumento || requerimientoId
      }.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo, "requerimientos-compra");
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
          <div style={{ flex: 1 }}>
            {/* Botón Toggle Proveedor */}
            <Button
              icon={mostrarProveedor ? "pi pi-eye" : "pi pi-eye-slash"}
              label={mostrarProveedor ? "MOSTRAR PROVEEDOR" : "SIN PROVEEDOR"}
              className={
                mostrarProveedor ? "p-button-primary" : "p-button-secondary"
              }
              onClick={() => setMostrarProveedor(!mostrarProveedor)}
              tooltip={
                mostrarProveedor
                  ? "El PDF incluirá el proveedor"
                  : "El PDF NO incluirá el proveedor"
              }
              tooltipOptions={{ position: "top" }}
            />
          </div>
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
                disabled={!requerimientoId || generando}
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
              text='No hay PDF generado. Use el botón "Generar PDF" para generar el documento del requerimiento de compra.'
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionRequerimientoCompraPDF;
