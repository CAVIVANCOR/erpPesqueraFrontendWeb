// src/components/cotizacionVentas/dibujaTotalesYFirmaPDFCV.js
// Función para dibujar totales y firmas de la Cotización de Ventas
// Patrón profesional siguiendo RequerimientoCompra
import { rgb } from "pdf-lib";
import { getTranslation } from "./translations";

/**
 * Dibuja los totales y firmas en la página
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {Object} params.cotizacion - Datos de la cotización
 * @param {number} params.subtotal - Subtotal calculado
 * @param {Function} params.formatearNumero - Función para formatear números
 * @param {number} params.width - Ancho de página
 * @param {number} params.margin - Margen
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {void}
 */
export function dibujaTotalesYFirmaPDFCV({
  page,
  cotizacion,
  subtotal,
  formatearNumero,
  width,
  margin,
  fontBold,
  fontNormal,
  idioma = "en",
}) {
  // Función helper para obtener traducciones
  const t = (key) => getTranslation(idioma, key);

  // TOTALES - Posición fija para consistencia
  let yPosition = 180; // Posición fija para totales
  const totalesX = width - margin - 220;
  const totalesWidth = 220;
  const totalesLineHeight = 20;

  // Calcular IGV y Total
  const porcentajeIGV = Number(cotizacion.porcentajeIGV) || 0;
  const igv = cotizacion.esExoneradoAlIGV || porcentajeIGV === 0
    ? 0
    : subtotal * (porcentajeIGV / 100);
  const total = subtotal + igv;

  // Código de moneda SUNAT
  const codigoMoneda = cotizacion.moneda?.codigoSunat || "USD";

  // Si porcentajeIGV = 0, solo mostrar "Precio Venta Total"
  if (porcentajeIGV === 0) {
    page.drawText(t("totalSalesPrice"), {
      x: totalesX,
      y: yPosition,
      size: 11,
      font: fontBold,
    });
    const totalText = `${codigoMoneda} ${formatearNumero(total)}`;
    const totalWidth = fontBold.widthOfTextAtSize(totalText, 11);
    page.drawText(totalText, {
      x: totalesX + totalesWidth - totalWidth - 10,
      y: yPosition,
      size: 11,
      font: fontBold,
      color: rgb(0, 0.4, 0),
    });
  } else {
    // Mostrar Subtotal, IGV y Total
    // Subtotal
    page.drawText(t("subtotal"), {
      x: totalesX,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    const subtotalText = `${codigoMoneda} ${formatearNumero(subtotal)}`;
    const subtotalWidth = fontNormal.widthOfTextAtSize(subtotalText, 9);
    page.drawText(subtotalText, {
      x: totalesX + totalesWidth - subtotalWidth - 10,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });

    yPosition -= totalesLineHeight;

    // IGV
    page.drawText(`${t("igv")} (${porcentajeIGV}%):`, {
      x: totalesX,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    const igvText = `${codigoMoneda} ${formatearNumero(igv)}`;
    const igvWidth = fontNormal.widthOfTextAtSize(igvText, 9);
    page.drawText(igvText, {
      x: totalesX + totalesWidth - igvWidth - 10,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });

    yPosition -= totalesLineHeight + 5;

    // Línea separadora
    page.drawLine({
      start: { x: totalesX, y: yPosition },
      end: { x: totalesX + totalesWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Total
    yPosition -= totalesLineHeight;
    page.drawText(t("total"), {
      x: totalesX,
      y: yPosition,
      size: 10,
      font: fontBold,
    });
    const totalText = `${codigoMoneda} ${formatearNumero(total)}`;
    const totalWidth = fontBold.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, {
      x: totalesX + totalesWidth - totalWidth - 10,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0.4, 0),
    });
  }

  // SECCIÓN DE FIRMAS - Posición fija Y=90
  const firmaYPosition = 90;
  const firmaIzqX = margin + 20;
  const firmaDerX = width - margin - 180;
  const firmaWidth = 150;

  // FIRMA IZQUIERDA - Responsable de Ventas
  if (cotizacion.respVentas) {
    let yFirma = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaIzqX, y: yFirma },
      end: { x: firmaIzqX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre completo del responsable
    yFirma -= 12;
    const nombreResp = `${cotizacion.respVentas.nombres || ""} ${cotizacion.respVentas.apellidos || ""}`.trim() || "-";
    page.drawText(nombreResp, {
      x: firmaIzqX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad con tipo de documento
    yFirma -= 10;
    const tipoDoc = cotizacion.respVentas.tipoDocIdentidad?.codigo || "DOC";
    const numDoc = cotizacion.respVentas.numeroDocumento || "-";
    const docResp = `${tipoDoc}: ${numDoc}`;
    page.drawText(docResp, {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Responsable de Ventas"
    yFirma -= 10;
    page.drawText(t("salesResponsible"), {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // FIRMA DERECHA - Autoriza Venta
  if (cotizacion.autorizaVenta) {
    let yFirma = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre completo del autorizador
    yFirma -= 12;
    const nombreAutoriza = `${cotizacion.autorizaVenta.nombres || ""} ${cotizacion.autorizaVenta.apellidos || ""}`.trim() || "-";
    page.drawText(nombreAutoriza, {
      x: firmaDerX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad con tipo de documento
    yFirma -= 10;
    const tipoDocAut = cotizacion.autorizaVenta.tipoDocIdentidad?.codigo || "DOC";
    const numDocAut = cotizacion.autorizaVenta.numeroDocumento || "-";
    const docAutoriza = `${tipoDocAut}: ${numDocAut}`;
    page.drawText(docAutoriza, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Autoriza Venta"
    yFirma -= 10;
    page.drawText(t("authorizedBy"), {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}