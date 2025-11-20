import { rgb } from "pdf-lib";

export function dibujaEncabezadoPDFLiquidacionCompras(page, entregaARendir, empresa, fontBold, fontRegular, startY, pageWidth) {
  let yPosition = startY;
  const margin = 40;

  page.drawText("LIQUIDACIÓN DE ENTREGA A RENDIR", {
    x: pageWidth / 2 - 150, y: yPosition, size: 16, font: fontBold, color: rgb(0, 0, 0.5),
  });
  yPosition -= 10;
  page.drawText("COMPRAS", {
    x: pageWidth / 2 - 35, y: yPosition, size: 12, font: fontBold, color: rgb(0, 0, 0.5),
  });
  yPosition -= 30;

  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: pageWidth - margin, y: yPosition },
    thickness: 2, color: rgb(0, 0, 0.5),
  });
  yPosition -= 20;

  page.drawText(empresa?.razonSocial || "EMPRESA", { x: margin, y: yPosition, size: 10, font: fontBold });
  yPosition -= 15;
  page.drawText(`RUC: ${empresa?.ruc || "N/A"}`, { x: margin, y: yPosition, size: 9, font: fontRegular });
  yPosition -= 12;
  page.drawText(`Dirección: ${empresa?.direccion || "N/A"}`, { x: margin, y: yPosition, size: 9, font: fontRegular });

  const rightX = pageWidth - margin - 150;
  let rightY = startY - 50;
  page.drawText(`N° Liquidación: ${entregaARendir.id}`, { x: rightX, y: rightY, size: 9, font: fontBold });
  rightY -= 15;
  const fechaLiq = entregaARendir.fechaLiquidacion
    ? new Date(entregaARendir.fechaLiquidacion).toLocaleDateString("es-PE")
    : "N/A";
  page.drawText(`Fecha: ${fechaLiq}`, { x: rightX, y: rightY, size: 9, font: fontRegular });
  rightY -= 15;
  const estado = entregaARendir.entregaLiquidada ? "LIQUIDADA" : "PENDIENTE";
  page.drawText(`Estado: ${estado}`, {
    x: rightX, y: rightY, size: 9, font: fontBold,
    color: entregaARendir.entregaLiquidada ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
  });

  yPosition -= 30;
  page.drawRectangle({
    x: margin, y: yPosition - 50, width: pageWidth - 2 * margin, height: 50,
    color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1,
  });
  yPosition -= 15;

  const requerimiento = entregaARendir.requerimientoCompra
    ? `REQ-${entregaARendir.requerimientoCompra.id}`
    : "N/A";
  page.drawText(`Requerimiento: ${requerimiento}`, { x: margin + 10, y: yPosition, size: 9, font: fontBold });
  yPosition -= 15;

  const responsable = entregaARendir.respEntregaRendir
    ? `${entregaARendir.respEntregaRendir.nombres} ${entregaARendir.respEntregaRendir.apellidos}`.trim()
    : "N/A";
  page.drawText(`Responsable: ${responsable}`, { x: margin + 10, y: yPosition, size: 9, font: fontRegular });
  yPosition -= 15;

  const centroCosto = entregaARendir.centroCosto
    ? `${entregaARendir.centroCosto.Codigo} - ${entregaARendir.centroCosto.Nombre}`
    : "N/A";
  page.drawText(`Centro de Costo: ${centroCosto}`, { x: margin + 10, y: yPosition, size: 9, font: fontRegular });
  yPosition -= 20;

  return yPosition;
}
