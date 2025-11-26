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
  const margin = 10;

  // Calcular totales
  let totalIngresos = 0;
  let totalEgresos = 0;

  movimientos.forEach((mov) => {
    const monto = parseFloat(mov.monto) || 0;
    if (mov.tipoMovimiento?.esIngreso === true) {
      totalIngresos += monto;
    } else {
      totalEgresos += monto;
    }
  });

  const saldo = totalIngresos - totalEgresos;

  // Definir posiciones de columnas (igual que en la tabla)
  const colWidths = [75, 75, 105, 115, 115, 115, 60, 65, 65];
  const cols = [];
  let xPos = margin;
  colWidths.forEach((width) => {
    cols.push({ x: xPos, width: width });
    xPos += width;
  });
  const [fechaHora, fechaOper, tipo, ccOrigen, ccDestino, entidad, referencia, ingreso, egreso] = cols;
  const gridColor = rgb(0.7, 0.7, 0.7);

  // Línea de totales con recuadro (solo desde columna Entidad)
  yPosition -= 10;
  const rowHeight = 18;
  const totalesStartX = entidad.x;
  const totalesWidth = referencia.x + referencia.width + ingreso.width + egreso.width - entidad.x;

  // Fondo del recuadro de totales
  page.drawRectangle({
    x: totalesStartX,
    y: yPosition - rowHeight,
    width: totalesWidth,
    height: rowHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Líneas horizontales
  page.drawLine({
    start: { x: totalesStartX, y: yPosition },
    end: { x: totalesStartX + totalesWidth, y: yPosition },
    thickness: 0.5,
    color: gridColor,
  });
  page.drawLine({
    start: { x: totalesStartX, y: yPosition - rowHeight },
    end: { x: totalesStartX + totalesWidth, y: yPosition - rowHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Líneas verticales (solo columnas de totales)
  [entidad, referencia, ingreso, egreso].forEach((col) => {
    page.drawLine({
      start: { x: col.x, y: yPosition },
      end: { x: col.x, y: yPosition - rowHeight },
      thickness: 0.5,
      color: gridColor,
    });
  });
  page.drawLine({
    start: { x: egreso.x + egreso.width, y: yPosition },
    end: { x: egreso.x + egreso.width, y: yPosition - rowHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Título "SALDO:" (alineado a la derecha en columna Entidad)
  const saldoTitulo = "SALDO:";
  const saldoTituloWidth = fontBold.widthOfTextAtSize(saldoTitulo, 9);
  page.drawText(saldoTitulo, {
    x: entidad.x + entidad.width - saldoTituloWidth - 2,
    y: yPosition - 12,
    size: 9,
    font: fontBold,
  });

  // Valor del Saldo (en columna Referencia, alineado a la derecha)
  const saldoTexto = formatearNumero(saldo);
  const saldoWidth = fontBold.widthOfTextAtSize(saldoTexto, 9);
  page.drawText(saldoTexto, {
    x: referencia.x + referencia.width - saldoWidth - 2,
    y: yPosition - 12,
    size: 9,
    font: fontBold,
    color: saldo >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
  });

  // Total Ingresos (en columna Ingreso, alineado a la derecha)
  const totalIngresosTexto = formatearNumero(totalIngresos);
  const ingresoWidth = fontBold.widthOfTextAtSize(totalIngresosTexto, 9);
  page.drawText(totalIngresosTexto, {
    x: ingreso.x + ingreso.width - ingresoWidth - 2,
    y: yPosition - 12,
    size: 9,
    font: fontBold,
    color: rgb(0, 0.5, 0),
  });

  // Total Egresos (en columna Egreso, alineado a la derecha)
  const totalEgresosTexto = formatearNumero(totalEgresos);
  const egresoWidth = fontBold.widthOfTextAtSize(totalEgresosTexto, 9);
  page.drawText(totalEgresosTexto, {
    x: egreso.x + egreso.width - egresoWidth - 2,
    y: yPosition - 12,
    size: 9,
    font: fontBold,
    color: rgb(0.7, 0, 0),
  });

  yPosition -= 28;

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

  // Centrar nombre
  const responsableWidth = fontRegular.widthOfTextAtSize(responsable, 9);
  page.drawText(responsable, {
    x: firma1X + (firmaWidth - responsableWidth) / 2,
    y: yPosition - 15,
    size: 9,
    font: fontRegular,
  });

  // Centrar cargo
  const cargo1 = "Responsable de Entrega";
  const cargo1Width = fontBold.widthOfTextAtSize(cargo1, 8);
  page.drawText(cargo1, {
    x: firma1X + (firmaWidth - cargo1Width) / 2,
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

    // Centrar nombre
    const liquidadorWidth = fontRegular.widthOfTextAtSize(liquidador, 9);
    page.drawText(liquidador, {
      x: firma2X + (firmaWidth - liquidadorWidth) / 2,
      y: yPosition - 15,
      size: 9,
      font: fontRegular,
    });

    // Centrar cargo
    const cargo2 = "Liquidador";
    const cargo2Width = fontBold.widthOfTextAtSize(cargo2, 8);
    page.drawText(cargo2, {
      x: firma2X + (firmaWidth - cargo2Width) / 2,
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
