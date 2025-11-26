/**
 * dibujaTotalYFirmaPDFPF.js
 *
 * Dibuja totales, observaciones y firmas en el PDF de Pre-Factura.
 * Sigue el patrón profesional ERP Megui usando pdf-lib.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

/**
 * Dibuja los totales, observaciones y firmas en el PDF
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {Object} params.totales - Totales calculados
 * @param {Object} params.datosPreFactura - Datos de la pre-factura
 * @param {number} params.yPosition - Posición Y actual
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @param {Function} params.formatearFecha - Función para formatear fechas
 * @returns {void}
 */
export function dibujarTotalYFirmaPDFPreFactura({
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
}) {
  // 1. Cuadro de totales (lado derecho)
  const totalesX = width - margin - 180;
  const totalesY = yPosition - 80;
  const totalesWidth = 180;
  const totalesHeight = 70;

  // Fondo del cuadro
  page.drawRectangle({
    x: totalesX,
    y: totalesY,
    width: totalesWidth,
    height: totalesHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let yTotales = totalesY + totalesHeight - 15;

  // Subtotal
  page.drawText("Subtotal:", {
    x: totalesX + 10,
    y: yTotales,
    size: 9,
    font: fontBold,
  });
  page.drawText(`${totales.simboloMoneda} ${formatearNumero(totales.subtotal)}`, {
    x: totalesX + totalesWidth - 80,
    y: yTotales,
    size: 9,
    font: fontNormal,
  });

  yTotales -= 15;

  // IGV
  const igvLabel = totales.exonerado ? "IGV (Exonerado):" : `IGV (${totales.porcentajeIGV}%):`;
  page.drawText(igvLabel, {
    x: totalesX + 10,
    y: yTotales,
    size: 9,
    font: fontBold,
  });
  page.drawText(`${totales.simboloMoneda} ${formatearNumero(totales.igv)}`, {
    x: totalesX + totalesWidth - 80,
    y: yTotales,
    size: 9,
    font: fontNormal,
  });

  yTotales -= 20;

  // Línea separadora
  page.drawLine({
    start: { x: totalesX + 10, y: yTotales },
    end: { x: totalesX + totalesWidth - 10, y: yTotales },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yTotales -= 15;

  // Total
  page.drawText("TOTAL:", {
    x: totalesX + 10,
    y: yTotales,
    size: 11,
    font: fontBold,
  });
  page.drawText(`${totales.simboloMoneda} ${formatearNumero(totales.total)}`, {
    x: totalesX + totalesWidth - 80,
    y: yTotales,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.4, 0),
  });

  // 2. Observaciones (lado izquierdo)
  if (datosPreFactura.observaciones) {
    const obsY = totalesY + totalesHeight - 15;
    page.drawText("Observaciones:", {
      x: margin,
      y: obsY,
      size: 9,
      font: fontBold,
    });

    const obsTexto = datosPreFactura.observaciones.substring(0, 200);
    page.drawText(obsTexto, {
      x: margin,
      y: obsY - 12,
      size: 8,
      font: fontNormal,
      maxWidth: 250,
    });
  }

  // 3. Información adicional de exportación (si aplica)
  if (datosPreFactura.esExportacion && datosPreFactura.factorExportacion) {
    const factorY = totalesY - 20;
    page.drawText(`Factor de Exportación: ${datosPreFactura.factorExportacion}`, {
      x: margin,
      y: factorY,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // 4. Información de transferencia ERP Contable
  if (datosPreFactura.transferidoErpContable) {
    const transferY = totalesY - 35;
    page.drawText("✓ Transferido a ERP Contable", {
      x: margin,
      y: transferY,
      size: 8,
      font: fontBold,
      color: rgb(0, 0.5, 0),
    });
    
    if (datosPreFactura.fechaTransferenciaErpContable) {
      page.drawText(`Fecha: ${formatearFecha(datosPreFactura.fechaTransferenciaErpContable)}`, {
        x: margin,
        y: transferY - 10,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  // 5. Espacios para firmas
  const firmaY = 120;
  const firmaWidth = 120;
  const firmaSpacing = (width - 2 * margin - 3 * firmaWidth) / 2;

  // Firma 1: Elaborado por
  const firma1X = margin;
  page.drawLine({
    start: { x: firma1X, y: firmaY },
    end: { x: firma1X + firmaWidth, y: firmaY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("Elaborado por", {
    x: firma1X + firmaWidth / 2 - 30,
    y: firmaY - 12,
    size: 8,
    font: fontNormal,
  });

  // Firma 2: Revisado por
  const firma2X = firma1X + firmaWidth + firmaSpacing;
  page.drawLine({
    start: { x: firma2X, y: firmaY },
    end: { x: firma2X + firmaWidth, y: firmaY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("Revisado por", {
    x: firma2X + firmaWidth / 2 - 30,
    y: firmaY - 12,
    size: 8,
    font: fontNormal,
  });

  // Firma 3: Aprobado por
  const firma3X = firma2X + firmaWidth + firmaSpacing;
  page.drawLine({
    start: { x: firma3X, y: firmaY },
    end: { x: firma3X + firmaWidth, y: firmaY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("Aprobado por", {
    x: firma3X + firmaWidth / 2 - 30,
    y: firmaY - 12,
    size: 8,
    font: fontNormal,
  });

  // 6. Pie de página
  const footerY = 60;
  page.drawText(
    `Documento generado el ${formatearFecha(new Date())}`,
    {
      x: width / 2 - 80,
      y: footerY,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  page.drawText(
    "Este documento es una pre-factura y no tiene validez tributaria",
    {
      x: width / 2 - 120,
      y: footerY - 10,
      size: 6,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    }
  );
}