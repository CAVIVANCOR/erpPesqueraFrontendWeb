// src/components/ordenCompra/dibujaTotalesYFirmaPDFOC.js
// Función para dibujar totales y firmas de la Orden de Compra
import { rgb } from "pdf-lib";

/**
 * Dibuja los totales y firmas en la página
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {Object} params.ordenCompra - Datos de la orden de compra
 * @param {number} params.subtotalGeneral - Subtotal general
 * @param {Function} params.formatearNumero - Función para formatear números
 * @param {number} params.width - Ancho de página
 * @param {number} params.margin - Margen
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {void}
 */
export function dibujaTotalesYFirmaPDFOC({
  page,
  ordenCompra,
  subtotalGeneral,
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
  const igv = ordenCompra.esExoneradoAlIGV
    ? 0
    : subtotalGeneral * (Number(ordenCompra.porcentajeIGV) / 100 || 0.18);
  const total = subtotalGeneral + igv;

  // LÓGICA CONDICIONAL: Si está exonerado, NO mostrar Subtotal ni IGV, solo Total
  if (!ordenCompra.esExoneradoAlIGV) {
    // Subtotal (solo si NO está exonerado)
    page.drawText("Subtotal:", {
      x: totalesX,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    const subtotalText = `S/ ${formatearNumero(subtotalGeneral)}`;
    const subtotalWidth = fontNormal.widthOfTextAtSize(subtotalText, 9);
    page.drawText(subtotalText, {
      x: totalesX + totalesWidth - subtotalWidth - 10,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });

    yPosition -= totalesLineHeight;

    // IGV (solo si NO está exonerado)
    const igvLabel = `IGV (${ordenCompra.porcentajeIGV || 18}%):`;
    
    page.drawText(igvLabel, {
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
  }

  // Total con fondo
  page.drawRectangle({
    x: totalesX,
    y: yPosition - 3,
    width: totalesWidth,
    height: 22,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText("Total:", {
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
  if (ordenCompra.solicitante) {
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
    const nombreSolicitante = ordenCompra.solicitante.nombreCompleto || "-";
    page.drawText(nombreSolicitante, {
      x: firmaIzqX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yFirma -= 10;
    const docSolicitante = ordenCompra.solicitante.numeroDocumento
      ? `DNI: ${ordenCompra.solicitante.numeroDocumento}`
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

  // FIRMA DERECHA - Aprobado Por
  if (ordenCompra.aprobadoPor) {
    let yFirma = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre del aprobador
    yFirma -= 12;
    const nombreAprobador = ordenCompra.aprobadoPor.nombreCompleto || "-";
    page.drawText(nombreAprobador, {
      x: firmaDerX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yFirma -= 10;
    const docAprobador = ordenCompra.aprobadoPor.numeroDocumento
      ? `DNI: ${ordenCompra.aprobadoPor.numeroDocumento}`
      : "-";
    page.drawText(docAprobador, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });

    // Cargo del aprobador
    yFirma -= 10;
    const cargoAprobador = ordenCompra.aprobadoPor.cargo?.descripcion || "Aprobado Por";
    page.drawText(cargoAprobador, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}