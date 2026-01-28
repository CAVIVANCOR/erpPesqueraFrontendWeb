/**
 * PreFacturaPDF.js
 *
 * Generación de PDF para Pre-Facturas usando pdf-lib.
 * Orquesta la creación del documento completo llamando a funciones específicas.
 * Sigue el patrón profesional ERP Megui.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujarEncabezadoPDFPreFactura } from "./dibujaEncabezadoPDFPF";
import { dibujarTotalYFirmaPDFPreFactura } from "./dibujaTotalYFirmaPDFPF";

/**
 * Genera el PDF completo de la pre-factura
 * @param {Object} datosPreFactura - Datos de la pre-factura
 * @param {Array} detalles - Detalles de productos
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Uint8Array>} Bytes del PDF generado
 */
async function generarPDFPreFactura(datosPreFactura, detalles, empresa) {
  // Función de formateo de fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const lineHeight = 13;

  // 1. Dibujar encabezado
  let yPosition = await dibujarEncabezadoPDFPreFactura({
    page,
    pdfDoc,
    empresa,
    datosPreFactura,
    width,
    height,
    margin,
    lineHeight,
    fontBold,
    fontNormal,
    formatearFecha,
  });

  // 2. Título de tabla de detalles
  yPosition -= 10;
  page.drawText("DETALLE DE PRODUCTOS", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
  });

  yPosition -= 20;

  // 3. Tabla de detalles
  const colWidths = [30, 70, 220, 50, 70, 90];
  const headers = [
    "#",
    "Código",
    "Descripción",
    "Cant.",
    "P. Unit.",
    "Subtotal",
  ];
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Encabezado de tabla
  page.drawRectangle({
    x: margin,
    y: yPosition - 2,
    width: tableWidth,
    height: 18,
    color: rgb(0.85, 0.85, 0.85),
  });

  page.drawLine({
    start: { x: margin, y: yPosition + 16 },
    end: { x: margin + tableWidth, y: yPosition + 16 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  let xPos = margin;
  headers.forEach((header, i) => {
    const colX = xPos;
    const colWidth = colWidths[i];
    let textX = colX + 3;

    if (i === 0 || i === 3 || i === 4 || i === 5) {
      const textWidth = fontBold.widthOfTextAtSize(header, 9);
      textX = colX + colWidth - textWidth - 3;
    }

    page.drawText(header, {
      x: textX,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    xPos += colWidth;
  });

  let lineX = margin;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPosition - 2 },
      end: { x: lineX, y: yPosition + 16 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }

  yPosition -= 18;

  // Dibujar filas de detalles
  let subtotalTotal = 0;
  detalles.forEach((detalle, index) => {
    const rowY = yPosition;
    xPos = margin;

    const rowData = [
      String(index + 1),
      detalle.producto?.codigo || "-",
      detalle.producto?.descripcion || detalle.producto?.nombre || "PRODUCTO",
      String(detalle.cantidad || 0),
      `S/ ${formatearNumero(Number(detalle.precioUnitario || 0))}`,
      `S/ ${formatearNumero(Number(detalle.subtotal || 0))}`,
    ];

    rowData.forEach((data, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];
      let textX = colX + 3;

      if (i === 0 || i === 3 || i === 4 || i === 5) {
        const textWidth = fontNormal.widthOfTextAtSize(data, 8);
        textX = colX + colWidth - textWidth - 3;
      }

      page.drawText(data, {
        x: textX,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
      xPos += colWidth;
    });

    subtotalTotal += Number(detalle.subtotal) || 0;

    lineX = margin;
    const lineStartY = rowY + 13;
    const lineEndY = rowY - 5;

    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: lineStartY },
        end: { x: lineX, y: lineEndY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    page.drawLine({
      start: { x: margin, y: lineEndY },
      end: { x: margin + tableWidth, y: lineEndY },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 18;
  });

  // 4. Calcular totales
  const porcentajeIGV = Number(datosPreFactura.porcentajeIgv) || 0;
  const igv = datosPreFactura.exoneradoIgv
    ? 0
    : subtotalTotal * (porcentajeIGV / 100);
  const total = subtotalTotal + igv;

  const totales = {
    subtotal: subtotalTotal,
    igv,
    total,
    porcentajeIGV,
    exonerado: datosPreFactura.exoneradoIgv,
    simboloMoneda: datosPreFactura.moneda?.simbolo || "S/",
  };

  // 5. Dibujar totales y firma
  dibujarTotalYFirmaPDFPreFactura({
    page,
    totales,
    datosPreFactura,
    yPosition,
    width,
    height,
    margin,
    fontBold,
    fontNormal,
    formatearFecha,
  });

  // Generar bytes del PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Genera el PDF y lo sube al servidor
 * @param {number} preFacturaId - ID de la pre-factura
 * @param {Object} datosPreFactura - Datos de la pre-factura
 * @param {Array} detalles - Detalles de productos
 * @param {Object} usuario - Usuario que genera el PDF
 * @returns {Promise<Object>} Resultado con URL del PDF
 */
export async function generarYSubirPDFPreFactura(
  preFacturaId,
  datosPreFactura,
  detalles,
  usuario,
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFPreFactura(
      datosPreFactura,
      detalles,
      datosPreFactura.empresa,
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData - El backend generará el nombre automáticamente
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf"); // Nombre temporal, el backend lo reemplazará
    formData.append("moduleName", "pre-factura");
    formData.append("entityId", preFacturaId);
    // 4. Subir al servidor usando endpoint estandarizado
    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/merge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al subir el PDF");
    }

    const resultado = await response.json();

    console.log("🔍 [PreFacturaPDF] Respuesta del backend:", resultado);
    console.log("🔍 [PreFacturaPDF] URL retornada:", resultado.url);

    return {
      success: true,
      url: resultado.url,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}
