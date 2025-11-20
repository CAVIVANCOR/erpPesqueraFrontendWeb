import { rgb } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

export function dibujaTotalesYFirmaPDFLiquidacionVentas(page, entregaARendir, movimientos, fontBold, fontRegular, startY, pageWidth) {
  let yPosition = startY - 30;
  const margin = 40;

  let totalIngresos = 0, totalEgresos = 0;
  movimientos.forEach((mov) => {
    const monto = parseFloat(mov.monto) || 0;
    if (mov.tipoMovimiento?.ingresoEgreso === "I") totalIngresos += monto;
    else totalEgresos += monto;
  });
  const saldo = totalIngresos - totalEgresos;

  const totalesX = pageWidth - margin - 200;
  const totalesWidth = 200;

  page.drawRectangle({
    x: totalesX, y: yPosition - 70, width: totalesWidth, height: 70,
    color: rgb(0.95, 0.95, 1), borderColor: rgb(0, 0, 0.5), borderWidth: 1,
  });

  page.drawText("Total Ingresos:", { x: totalesX + 10, y: yPosition - 20, size: 10, font: fontBold });
  page.drawText(formatearNumero(totalIngresos), {
    x: totalesX + 120, y: yPosition - 20, size: 10, font: fontRegular, color: rgb(0, 0.5, 0),
  });

  page.drawText("Total Egresos:", { x: totalesX + 10, y: yPosition - 40, size: 10, font: fontBold });
  page.drawText(formatearNumero(totalEgresos), {
    x: totalesX + 120, y: yPosition - 40, size: 10, font: fontRegular, color: rgb(0.7, 0, 0),
  });

  page.drawLine({
    start: { x: totalesX + 10, y: yPosition - 48 },
    end: { x: totalesX + totalesWidth - 10, y: yPosition - 48 },
    thickness: 1, color: rgb(0, 0, 0),
  });

  page.drawText("SALDO:", { x: totalesX + 10, y: yPosition - 65, size: 11, font: fontBold });
  page.drawText(formatearNumero(saldo), {
    x: totalesX + 120, y: yPosition - 65, size: 11, font: fontBold,
    color: saldo >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
  });

  yPosition -= 100;

  const firmaWidth = 200;
  const firmaSpacing = (pageWidth - 2 * margin - 2 * firmaWidth) / 3;
  const firma1X = margin + firmaSpacing;

  page.drawLine({
    start: { x: firma1X, y: yPosition },
    end: { x: firma1X + firmaWidth, y: yPosition },
    thickness: 1, color: rgb(0, 0, 0),
  });

  const responsable = entregaARendir.respEntregaRendir
    ? `${entregaARendir.respEntregaRendir.nombres} ${entregaARendir.respEntregaRendir.apellidos}`.trim()
    : "N/A";
  page.drawText(responsable, {
    x: firma1X + (firmaWidth - responsable.length * 4) / 2,
    y: yPosition - 15, size: 9, font: fontRegular,
  });
  page.drawText("Responsable de Entrega", { x: firma1X + 30, y: yPosition - 30, size: 8, font: fontBold });

  if (entregaARendir.respLiquidacion) {
    const firma2X = firma1X + firmaWidth + firmaSpacing;
    page.drawLine({
      start: { x: firma2X, y: yPosition },
      end: { x: firma2X + firmaWidth, y: yPosition },
      thickness: 1, color: rgb(0, 0, 0),
    });

    const liquidador = `${entregaARendir.respLiquidacion.nombres} ${entregaARendir.respLiquidacion.apellidos}`.trim();
    page.drawText(liquidador, {
      x: firma2X + (firmaWidth - liquidador.length * 4) / 2,
      y: yPosition - 15, size: 9, font: fontRegular,
    });
    page.drawText("Liquidador", { x: firma2X + 70, y: yPosition - 30, size: 8, font: fontBold });
  }

  const fechaGen = new Date().toLocaleString("es-PE");
  page.drawText(`Generado el: ${fechaGen}`, { x: margin, y: 30, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Sistema ERP Megui - Ventas", {
    x: pageWidth - margin - 180, y: 30, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
  });

  return yPosition;
}
