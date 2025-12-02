/**
 * VerImpresionCotizacionVentasPDF.jsx
 *
 * Card para generar y visualizar el PDF de la cotización de ventas.
 * Permite generar, visualizar y descargar PDFs de cotizaciones.
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
import { generarYSubirPDFCotizacionVentas } from "./CotizacionVentasPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Componente VerImpresionCotizacionVentasPDF
 * @param {Object} props - Props del componente
 * @param {number} props.cotizacionId - ID de la cotización
 * @param {Object} props.datosCotizacion - Datos completos de la cotización
 * @param {Array} props.detalles - Detalles de productos
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 */
const VerImpresionCotizacionVentasPDF = ({
  cotizacionId,
  datosCotizacion = {},
  detalles = [],
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [idioma, setIdioma] = useState("en"); // "en" o "es", por defecto inglés

  // Sin opciones - el nuevo sistema genera todo automáticamente

  // Cargar URL del PDF si existe en datosCotizacion
  useEffect(() => {
    if (datosCotizacion?.urlCotizacionPdf) {
      setPdfUrl(datosCotizacion.urlCotizacionPdf);
    }
  }, [datosCotizacion?.urlCotizacionPdf]);

  /**
   * Genera el PDF de la cotización
   */
  const handleGenerarPDF = async () => {
    if (!datosCotizacion?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cotización antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    if (detalles.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe agregar al menos un producto para generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };

      // IMPORTANTE: Cargar la cotización completa desde el backend con todas las relaciones
      let cotizacionCompleta;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/cotizaciones-ventas/${datosCotizacion.id}`,
          { headers }
        );
        if (response.ok) {
          cotizacionCompleta = await response.json();
        } else {
          throw new Error("No se pudo cargar la cotización completa");
        }
      } catch (error) {
        console.error("Error cargando cotización completa:", error);
        throw new Error("No se pudo cargar la cotización completa desde el servidor");
      }

      // Obtener empresa de la cotización o buscarla por empresaId
      let empresa = cotizacionCompleta.empresa;

      // Si no está cargada, intentar obtenerla del API
      if (!empresa && datosCotizacion.empresaId) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/empresas/${datosCotizacion.empresaId}`,
            { headers }
          );
          if (response.ok) {
            empresa = await response.json();
          }
        } catch (error) {
          console.error("Error cargando empresa:", error);
        }
      }

      if (!empresa) {
        throw new Error("No se pudo cargar la información de la empresa");
      }

      // Cargar solo los datos que no están en el schema como relaciones
      const promesas = [];

      if (cotizacionCompleta.puertoCargaId && !cotizacionCompleta.puertoCarga) {
        promesas.push(
          fetch(`${import.meta.env.VITE_API_URL}/pesca/puertos-pesca/${cotizacionCompleta.puertoCargaId}`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) cotizacionCompleta.puertoCarga = data; })
            .catch(e => console.error("Error cargando puerto carga:", e))
        );
      }

      if (cotizacionCompleta.puertoDescargaId && !cotizacionCompleta.puertoDescarga) {
        promesas.push(
          fetch(`${import.meta.env.VITE_API_URL}/pesca/puertos-pesca/${cotizacionCompleta.puertoDescargaId}`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) cotizacionCompleta.puertoDescarga = data; })
            .catch(e => console.error("Error cargando puerto descarga:", e))
        );
      }

      if (cotizacionCompleta.paisDestinoId && !cotizacionCompleta.paisDestino) {
        promesas.push(
          fetch(`${import.meta.env.VITE_API_URL}/paises/${cotizacionCompleta.paisDestinoId}`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) cotizacionCompleta.paisDestino = data; })
            .catch(e => console.error("Error cargando país destino:", e))
        );
      }

      // Cargar personal para firmas (respVentas y autorizaVenta)
      if (cotizacionCompleta.respVentasId && !cotizacionCompleta.respVentas) {
        promesas.push(
          fetch(`${import.meta.env.VITE_API_URL}/personal/${cotizacionCompleta.respVentasId}`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) cotizacionCompleta.respVentas = data; })
            .catch(e => console.error("Error cargando resp ventas:", e))
        );
      }

      if (cotizacionCompleta.autorizaVentaId && !cotizacionCompleta.autorizaVenta) {
        promesas.push(
          fetch(`${import.meta.env.VITE_API_URL}/personal/${cotizacionCompleta.autorizaVentaId}`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) cotizacionCompleta.autorizaVenta = data; })
            .catch(e => console.error("Error cargando autoriza venta:", e))
        );
      }

      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promesas);

      // Usar detallesProductos de la cotización completa del backend (tiene todos los datos)
      const detallesCompletos = cotizacionCompleta.detallesProductos || detalles;

      // Generar y subir el PDF con la cotización completa del backend
      const resultado = await generarYSubirPDFCotizacionVentas(
        cotizacionCompleta,
        detallesCompletos,
        empresa,
        idioma
      );

      if (resultado.success) {
        const urlPdf = resultado.urlPdf;
        setPdfUrl(urlPdf);

        // Actualizar datosCotizacion con la nueva URL
        if (datosCotizacion && urlPdf) {
          datosCotizacion.urlCotizacionPdf = urlPdf;
        }

        // Notificar al componente padre
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
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
      const nombreArchivo = `cotizacion-ventas-${
        datosCotizacion.numeroDocumento || cotizacionId
      }.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo, "cotizaciones-ventas");
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
          {/* Botón de idioma */}
          <div style={{ flex: 0.5 }}>
            <label htmlFor="idiomaBtn" style={{ display: "block", marginBottom: "0.5rem" }}>
              Idioma
            </label>
            <Button
              type="button"
              id="idiomaBtn"
              icon={idioma === "en" ? "pi pi-flag" : "pi pi-flag-fill"}
              label={idioma === "en" ? "English" : "Español"}
              className={idioma === "en" ? "p-button-info" : "p-button-warning"}
              onClick={() => setIdioma(idioma === "en" ? "es" : "en")}
              tooltip={idioma === "en" ? "Cambiar a Español" : "Switch to English"}
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
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
                disabled={!cotizacionId || generando || detalles.length === 0}
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
              text='No hay PDF generado. Use el botón "Generar PDF" para generar el documento de la cotización de ventas.'
              style={{ width: "100%" }}
            />
          </div>
        )}

        {/* Mensaje cuando no hay detalles */}
        {detalles.length === 0 && (
          <div style={{ marginTop: "1rem" }}>
            <Message
              severity="info"
              text="Debe agregar al menos un producto en el detalle para poder generar el PDF."
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionCotizacionVentasPDF;