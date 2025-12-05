/**
 * VerImpresionMovimientoConCostosPDF.jsx
 *
 * Card para generar y visualizar el PDF del movimiento de almacén CON COSTOS.
 * Permite generar, visualizar y descargar PDFs de movimientos con información de costos.
 * Sigue el patrón profesional ERP Megui usando PDFViewer genérico y pdfUtils.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { generarYSubirPDFMovimientoAlmacen } from "./MovimientoAlmacenPDF";

/**
 * Componente VerImpresionMovimientoConCostosPDF
 * @param {Object} props - Props del componente
 * @param {number} props.movimientoId - ID del movimiento de almacén
 * @param {Object} props.datosMovimiento - Datos completos del movimiento
 * @param {Object} props.toast - Referencia al Toast para mensajes
 * @param {Function} props.onPdfGenerated - Callback cuando se genera el PDF
 * @param {Array} props.personalOptions - Lista de personal para construir los objetos
 */
const VerImpresionMovimientoConCostosPDF = ({
  movimientoId,
  datosMovimiento = {},
  toast,
  onPdfGenerated,
  personalOptions = [],
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  // Cargar URL del PDF si existe en datosMovimiento
  useEffect(() => {
    if (datosMovimiento?.urlMovAlmacenConCostosPdf) {
      setPdfUrl(datosMovimiento.urlMovAlmacenConCostosPdf);
    }
  }, [datosMovimiento?.urlMovAlmacenConCostosPdf]);

  /**
   * Genera el PDF con costos
   */
  const handleGenerarPDF = async () => {
    if (!datosMovimiento?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el movimiento antes de generar el PDF",
        life: 3000,
      });
      return;
    }

    setGenerando(true);

    try {
      // Recargar el movimiento completo desde el backend para obtener estados actualizados
      const { getMovimientoAlmacenPorId } = await import("../../api/movimientoAlmacen");
      const movimientoCompleto = await getMovimientoAlmacenPorId(datosMovimiento.id);
      
      // Obtener empresa del movimiento
      const empresa = movimientoCompleto.empresa || datosMovimiento.empresa;

      // Obtener detalles del movimiento (ahora con estados incluidos)
      const detalles = movimientoCompleto.detalles || [];

      // Enriquecer datosMovimiento con almacenes completos si existen
      const movimientoEnriquecido = { ...datosMovimiento };
      if (movimientoEnriquecido.conceptoMovAlmacen) {
        // Si el conceptoMovAlmacen tiene almacenOrigenId pero no el objeto completo
        if (movimientoEnriquecido.conceptoMovAlmacen.almacenOrigenId && 
            !movimientoEnriquecido.conceptoMovAlmacen.almacenOrigen) {
          const { getAlmacenes } = await import("../../api/almacen");
          try {
            const almacenes = await getAlmacenes();
            const almacenOrigen = almacenes.find(
              (a) => Number(a.id) === Number(movimientoEnriquecido.conceptoMovAlmacen.almacenOrigenId)
            );
            if (almacenOrigen) {
              movimientoEnriquecido.conceptoMovAlmacen.almacenOrigen = almacenOrigen;
            }
          } catch (err) {
            console.warn("No se pudo cargar almacén origen:", err);
          }
        }
        
        // Si el conceptoMovAlmacen tiene almacenDestinoId pero no el objeto completo
        if (movimientoEnriquecido.conceptoMovAlmacen.almacenDestinoId && 
            !movimientoEnriquecido.conceptoMovAlmacen.almacenDestino) {
          const { getAlmacenes } = await import("../../api/almacen");
          try {
            const almacenes = await getAlmacenes();
            const almacenDestino = almacenes.find(
              (a) => Number(a.id) === Number(movimientoEnriquecido.conceptoMovAlmacen.almacenDestinoId)
            );
            if (almacenDestino) {
              movimientoEnriquecido.conceptoMovAlmacen.almacenDestino = almacenDestino;
            }
          } catch (err) {
            console.warn("No se pudo cargar almacén destino:", err);
          }
        }
      }

      // Construir objeto personalRespAlmacen desde personalOptions (patrón RequerimientoCompra)
      if (movimientoEnriquecido.personalRespAlmacen && !movimientoEnriquecido.personalRespAlmacen.nombreCompleto) {
        const personalId = typeof movimientoEnriquecido.personalRespAlmacen === 'number' 
          ? movimientoEnriquecido.personalRespAlmacen 
          : Number(movimientoEnriquecido.personalRespAlmacen);
        
        const personal = personalOptions.find(
          (p) => Number(p.id || p.value) === personalId
        );
        
        if (personal) {
          movimientoEnriquecido.personalRespAlmacen = {
            nombreCompleto: personal.nombreCompleto || personal.label,
            numeroDocumento: personal.numeroDocumento,
          };
        }
      }

      // Generar y subir el PDF CON COSTOS
      const resultado = await generarYSubirPDFMovimientoAlmacen(
        movimientoEnriquecido,
        detalles,
        empresa,
        true // incluirCostos = true
      );

      if (resultado.success) {
        const urlPdf = resultado.urlPdf;
        setPdfUrl(urlPdf);

        // Actualizar el datosMovimiento con la nueva URL
        if (datosMovimiento && urlPdf) {
          datosMovimiento.urlMovAlmacenConCostosPdf = urlPdf;
        }

        // Notificar al componente padre
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(urlPdf);
        }

        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "PDF con costos generado y guardado correctamente",
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
      const nombreArchivo = `movimiento-almacen-costos-${
        datosMovimiento.numeroDocumento || movimientoId
      }.pdf`;
      descargarPdf(pdfUrl, toast, nombreArchivo, "movimientos-almacen");
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
            <label htmlFor="urlPdfCostos">
              URL del PDF con Costos (se genera automáticamente)
            </label>
            <div className="p-inputgroup">
              <input
                id="urlPdfCostos"
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
                label="PDF con Costos"
                className="p-button-warning"
                onClick={handleGenerarPDF}
                disabled={!movimientoId || generando}
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
              text='No hay PDF generado. Use el botón "PDF con Costos" para generar el documento del movimiento de almacén con información de costos.'
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VerImpresionMovimientoConCostosPDF;