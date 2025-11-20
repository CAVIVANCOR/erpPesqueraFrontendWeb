/**
 * dibujaTotalesYFirmaPDFLiquidacionPI.js
 * 
 * Dibuja los totales y sección de firmas del PDF de liquidación de Pesca Industrial
 * Incluye totales de ingresos, egresos, saldo y firmas de responsables
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

/**
 * Dibuja los totales y firmas en el PDF de liquidación
 * @param {PDFPage} page - Página del PDF
 * @param {Object} entregaARendir - Datos de la entrega a rendir
 * @param {Array} movimientos - Movimientos de la entrega
 * @param {PDFFont} fontBold - Fuente en negrita
 * @param {PDFFont} fontRegular - Fuente regular
 * @param {number} startY - Posición Y inicial
 * @param {number} pageWidth - Ancho de la página
 * @returns {number} - Nueva posición Y
 */
export function dibujaTotalesYFirmaPDFLiquidacionPI(
  page,
  entregaARendir,
  movimientos,
  fontBold,
  fontRegular,
  startY,
  pageWidth
) {
  let yPosition = startY - 30;
  const margin = 40;

  // Calcular totales
  let totalIngresos = 0;
  let totalEgresos = 0;

  movimientos.forEach((mov) => {
    const monto = parseFloat(mov.monto) || 0;
    if (mov.tipoMovimiento?.ingresoEgreso === "I") {
      totalIngresos += monto;
    } else {
      totalEgresos += monto;
    }
  });

  const saldo = totalIngresos - totalEgresos;

  // Cuadro de totales
  const totalesX = pageWidth - margin - 200;
  const totalesWidth = 200;

  // Fondo del cuadro de totales
  page.drawRectangle({
    x: totalesX,
    y: yPosition - 70,
    width: totalesWidth,
    height: 70,
    color: rgb(0.95, 0.95, 1),
    borderColor: rgb(0, 0, 0.5),
    borderWidth: 1,
  });

  // Total Ingresos
  page.drawText("Total Ingresos:", {
    x: totalesX + 10,
    y: yPosition - 20,
    size: 10,
    font: fontBold,
  });

  page.drawText(formatearNumero(totalIngresos), {
    x: totalesX + 120,
    y: yPosition - 20,
    size: 10,
    font: fontRegular,
    color: rgb(0, 0.5, 0),
  });

  // Total Egresos
  page.drawText("Total Egresos:", {
    x: totalesX + 10,
    y: yPosition - 40,
    size: 10,
    font: fontBold,
  });

  page.drawText(formatearNumero(totalEgresos), {
    x: totalesX + 120,
    y: yPosition - 40,
    size: 10,
    font: fontRegular,
    color: rgb(0.7, 0, 0),
  });

  // Línea separadora
  page.drawLine({
    start: { x: totalesX + 10, y: yPosition - 48 },
    end: { x: totalesX + totalesWidth - 10, y: yPosition - 48 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Saldo
  page.drawText("SALDO:", {
    x: totalesX + 10,
    y: yPosition - 65,
    size: 11,
    font: fontBold,
  });

  page.drawText(formatearNumero(saldo), {
    x: totalesX + 120,
    y: yPosition - 65,
    size: 11,
    font: fontBold,
    color: saldo >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
  });

  yPosition -= 100;

  // Sección de firmas
  const firmaWidth = 200;
  const firmaSpacing = (pageWidth - 2 * margin - 2 * firmaWidth) / 3;

  // Firma del responsable de la entrega
  const firma1X = margin + firmaSpacing;
  page.drawLine({
    start: { x: firma1X, y: yPosition },
    end: { x: firma1X + firmaWidth, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  const responsable = entregaARendir.respEntregaRendir
    ? `${entregaARendir.respEntregaRendir.nombres} ${entregaARendir.respEntregaRendir.apellidos}`.trim()
    : "N/A";

  page.drawText(responsable, {
    x: firma1X + (firmaWidth - responsable.length * 4) / 2,
    y: yPosition - 15,
    size: 9,
    font: fontRegular,
  });

  page.drawText("Responsable de Entrega", {
    x: firma1X + 30,
    y: yPosition - 30,
    size: 8,
    font: fontBold,
  });

  // Firma del liquidador (si existe)
  if (entregaARendir.respLiquidacion) {
    const firma2X = firma1X + firmaWidth + firmaSpacing;
    page.drawLine({
      start: { x: firma2X, y: yPosition },
      end: { x: firma2X + firmaWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    const liquidador = `${entregaARendir.respLiquidacion.nombres} ${entregaARendir.respLiquidacion.apellidos}`.trim();

    page.drawText(liquidador, {
      x: firma2X + (firmaWidth - liquidador.length * 4) / 2,
      y: yPosition - 15,
      size: 9,
      font: fontRegular,
    });

    page.drawText("Liquidador", {
      x: firma2X + 70,
      y: yPosition - 30,
      size: 8,
      font: fontBold,
    });
  }

  yPosition -= 50;

  // Pie de página
  const fechaGeneracion = new Date().toLocaleString("es-PE");
  page.drawText(`Generado el: ${fechaGeneracion}`, {
    x: margin,
    y: 30,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Sistema ERP Megui - Pesca Industrial", {
    x: pageWidth - margin - 180,
    y: 30,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return yPosition;
}
