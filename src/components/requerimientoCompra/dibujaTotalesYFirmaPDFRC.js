// src/components/requerimientoCompra/dibujaTotalesYFirmaPDFRC.js
// Función para dibujar totales y firmas del Requerimiento de Compra
import { rgb } from "pdf-lib";

/**
 * Dibuja los totales y firmas en la página
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {Object} params.requerimiento - Datos del requerimiento
 * @param {number} params.valorCompra - Valor de compra total
 * @param {Function} params.formatearNumero - Función para formatear números
 * @param {number} params.width - Ancho de página
 * @param {number} params.margin - Margen
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {void}
 */
export function dibujaTotalesYFirmaPDFRC({
  page,
  requerimiento,
  valorCompra,
  formatearNumero,
  width,
  margin,
  fontBold,
  fontNormal,
}) {
  // TOTALES - Posición fija para consistencia
  let yPosition = 180; // Posición fija para totales
  const totalesX = width - margin - 220;
  const totalesWidth = 220;
  const totalesLineHeight = 20;

  // Calcular IGV y Total
  const igv = requerimiento.esExoneradoAlIGV
    ? 0
    : valorCompra * (Number(requerimiento.porcentajeIGV) / 100 || 0.18);
  const total = valorCompra + igv;

  // Valor Compra
  page.drawText("Valor Compra:", {
    x: totalesX,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  const valorText = `S/ ${formatearNumero(valorCompra)}`;
  const valorWidth = fontNormal.widthOfTextAtSize(valorText, 9);
  page.drawText(valorText, {
    x: totalesX + totalesWidth - valorWidth - 10,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= totalesLineHeight;

  // IGV
  page.drawText(`IGV (${requerimiento.porcentajeIGV || 18}%):`, {
    x: totalesX,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  const igvText = `S/ ${formatearNumero(igv)}`;
  const igvWidth = fontNormal.widthOfTextAtSize(igvText, 9);
  page.drawText(igvText, {
    x: totalesX + totalesWidth - igvWidth - 10,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= totalesLineHeight + 5;

  // Total con fondo
  page.drawRectangle({
    x: totalesX,
    y: yPosition - 3,
    width: totalesWidth,
    height: 22,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText("Precio Compra Total:", {
    x: totalesX + 10,
    y: yPosition + 5,
    size: 10,
    font: fontBold,
  });
  const totalText = `S/ ${formatearNumero(total)}`;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, 10);
  page.drawText(totalText, {
    x: totalesX + totalesWidth - totalWidth - 10,
    y: yPosition + 5,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.4, 0),
  });

  // SECCIÓN DE FIRMAS - Posición fija Y=90
  const firmaYPosition = 90;
  const firmaIzqX = margin + 20;
  const firmaDerX = width - margin - 180;
  const firmaWidth = 150;

  // FIRMA IZQUIERDA - Solicitante
  if (requerimiento.solicitante) {
    let yFirma = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaIzqX, y: yFirma },
      end: { x: firmaIzqX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre del solicitante
    yFirma -= 12;
    const nombreSolicitante = requerimiento.solicitante.nombreCompleto || "-";
    page.drawText(nombreSolicitante, {
      x: firmaIzqX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yFirma -= 10;
    const docSolicitante = requerimiento.solicitante.numeroDocumento
      ? `DNI: ${requerimiento.solicitante.numeroDocumento}`
      : "-";
    page.drawText(docSolicitante, {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Solicitante"
    yFirma -= 10;
    page.drawText("Solicitante", {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // FIRMA DERECHA - Responsable de Compras
  if (requerimiento.respCompras) {
    let yFirma = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre del responsable
    yFirma -= 12;
    const nombreResp = requerimiento.respCompras.nombreCompleto || "-";
    page.drawText(nombreResp, {
      x: firmaDerX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yFirma -= 10;
    const docResp = requerimiento.respCompras.numeroDocumento
      ? `DNI: ${requerimiento.respCompras.numeroDocumento}`
      : "-";
    page.drawText(docResp, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Responsable de Compras"
    yFirma -= 10;
    page.drawText("Responsable de Compras", {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}
