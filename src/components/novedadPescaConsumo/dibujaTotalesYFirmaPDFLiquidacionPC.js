/**
 * dibujaTotalesYFirmaPDFLiquidacionPC.js
 * 
 * Dibuja los totales y sección de firmas del PDF de liquidación de Pesca Consumo
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

export function dibujaTotalesYFirmaPDFLiquidacionPC(
  page,
  entregaARendir,
  movimientos,
  fontBold,
  fontRegular,
  startY,
  pageWidth
) {
  let yPosition = startY - 10;
  const margin = 10;
  const gridColor = rgb(0.7, 0.7, 0.7);

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

  // Definir columnas alineadas con la tabla (9 columnas)
  const colWidths = [75, 75, 105, 115, 115, 115, 60, 65, 65];
  let xPos = margin;
  const cols = [];
  colWidths.forEach((width) => {
    cols.push({ x: xPos, width: width });
    xPos += width;
  });
  
  const ingresoCol = cols[7];
  const egresoCol = cols[8];

  const boxHeight = 18;
  const boxStartX = ingresoCol.x;
  const boxWidth = ingresoCol.width + egresoCol.width;

  // Dibujar recuadro de totales
  page.drawRectangle({
    x: boxStartX,
    y: yPosition - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Líneas de grilla del recuadro
  // Línea superior
  page.drawLine({
    start: { x: boxStartX, y: yPosition },
    end: { x: boxStartX + boxWidth, y: yPosition },
    thickness: 0.5,
    color: gridColor,
  });

  // Línea inferior
  page.drawLine({
    start: { x: boxStartX, y: yPosition - boxHeight },
    end: { x: boxStartX + boxWidth, y: yPosition - boxHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Línea vertical izquierda
  page.drawLine({
    start: { x: boxStartX, y: yPosition },
    end: { x: boxStartX, y: yPosition - boxHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Línea vertical entre Ingreso y Egreso
  page.drawLine({
    start: { x: egresoCol.x, y: yPosition },
    end: { x: egresoCol.x, y: yPosition - boxHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Línea vertical derecha
  page.drawLine({
    start: { x: boxStartX + boxWidth, y: yPosition },
    end: { x: boxStartX + boxWidth, y: yPosition - boxHeight },
    thickness: 0.5,
    color: gridColor,
  });

  // Texto "SALDO:" alineado a la derecha en su celda
  const saldoTexto = "SALDO:";
  const saldoWidth = fontBold.widthOfTextAtSize(saldoTexto, 8);
  page.drawText(saldoTexto, {
    x: ingresoCol.x - saldoWidth - 5,
    y: yPosition - 13,
    size: 8,
    font: fontBold,
  });

  // Total Ingresos (alineado a la derecha)
  const ingresoTexto = formatearNumero(totalIngresos);
  const ingresoWidth = fontRegular.widthOfTextAtSize(ingresoTexto, 7);
  page.drawText(ingresoTexto, {
    x: ingresoCol.x + ingresoCol.width - ingresoWidth - 2,
    y: yPosition - 13,
    size: 7,
    font: fontRegular,
    color: rgb(0, 0.5, 0),
  });

  // Total Egresos (alineado a la derecha)
  const egresoTexto = formatearNumero(totalEgresos);
  const egresoWidth = fontRegular.widthOfTextAtSize(egresoTexto, 7);
  page.drawText(egresoTexto, {
    x: egresoCol.x + egresoCol.width - egresoWidth - 2,
    y: yPosition - 13,
    size: 7,
    font: fontRegular,
    color: rgb(0.7, 0, 0),
  });

  yPosition -= 30;

  const firmaWidth = 200;
  const firmaSpacing = (pageWidth - 2 * margin - 2 * firmaWidth) / 3;

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

  const fechaGeneracion = new Date().toLocaleString("es-PE");
  page.drawText(`Generado el: ${fechaGeneracion}`, {
    x: margin,
    y: 30,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Sistema ERP Megui - Pesca Consumo", {
    x: pageWidth - margin - 180,
    y: 30,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return yPosition;
}
