// src/components/pagoCuentaPorCobrar/dibujaTotalesYFirmaPDFVoucher.js
import { rgb } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

/**
 * Dibuja los totales y firmas del voucher consolidado
 */
export function dibujaTotalesYFirmaPDFVoucher({
  pag,
  resumen,
  yPos,
  width,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
  simboloMoneda = "S/.",
}) {
  // ═══════════════════════════════════════════════════════════
  // RESUMEN DE MONTOS
  // ═══════════════════════════════════════════════════════════
  yPos -= lineHeight;

  pag.drawText("RESUMEN DE MONTOS", {
    x: margin,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= lineHeight * 1.5;

  // Cuadro de totales
  const boxX = width - margin - 200;
  const boxWidth = 200;
  const boxHeight = 120;
  const boxY = yPos - boxHeight;

  // Fondo del cuadro
  pag.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Borde del cuadro
  pag.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let yPosTotales = yPos - 15;

  const totales = [
    ["Monto Bruto:", resumen.montoBruto],
    ["(-) ITF:", resumen.itf],
    ["(-) Comisión:", resumen.comision],
    ["Neto en Caja:", resumen.montoNetoCaja],
    ["Detracción:", resumen.detraccion || 0],
  ];

  totales.forEach(([label, valor], index) => {
    const esUltimo = index === totales.length - 1;
    const esNeto = label === "Neto en Caja:";

    if (esNeto) {
      // Línea separadora antes del neto
      pag.drawLine({
        start: { x: boxX + 10, y: yPosTotales + 5 },
        end: { x: boxX + boxWidth - 10, y: yPosTotales + 5 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      yPosTotales -= 10;
    }

    pag.drawText(label, {
      x: boxX + 10,
      y: yPosTotales,
      size: esNeto ? 10 : 9,
      font: esNeto ? fontBold : fontNormal,
      color: rgb(0, 0, 0),
    });

    const valorTexto = `${simboloMoneda} ${formatearNumero(valor)}`;
    const valorWidth = (esNeto ? fontBold : fontNormal).widthOfTextAtSize(
      valorTexto,
      esNeto ? 10 : 9
    );

    pag.drawText(valorTexto, {
      x: boxX + boxWidth - valorWidth - 10,
      y: yPosTotales,
      size: esNeto ? 10 : 9,
      font: esNeto ? fontBold : fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosTotales -= lineHeight;
  });

  yPos = boxY - lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // FIRMAS
  // ═══════════════════════════════════════════════════════════
  yPos -= lineHeight * 3;

  const firmaWidth = 150;
  const firmaSpacing = (width - 2 * margin - 3 * firmaWidth) / 2;

  const firmas = [
    { x: margin, label: "ELABORADO POR" },
    { x: margin + firmaWidth + firmaSpacing, label: "REVISADO POR" },
    { x: margin + 2 * (firmaWidth + firmaSpacing), label: "APROBADO POR" },
  ];

  firmas.forEach(({ x, label }) => {
    // Línea de firma
    pag.drawLine({
      start: { x: x, y: yPos },
      end: { x: x + firmaWidth, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Etiqueta
    const labelWidth = fontNormal.widthOfTextAtSize(label, 8);
    pag.drawText(label, {
      x: x + (firmaWidth - labelWidth) / 2,
      y: yPos - 15,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
  });

  yPos -= lineHeight * 3;

  // ═══════════════════════════════════════════════════════════
  // PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════
  const fechaGeneracion = new Date().toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const piePagina = `Generado el ${fechaGeneracion} | Sistema ERP Pesquera`;
  const pieWidth = fontNormal.widthOfTextAtSize(piePagina, 7);

  pag.drawText(piePagina, {
    x: (width - pieWidth) / 2,
    y: 30,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  return yPos;
}
