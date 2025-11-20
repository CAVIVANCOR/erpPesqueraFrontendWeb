/**
 * dibujaEncabezadoPDFLiquidacionPI.js
 * 
 * Dibuja el encabezado del PDF de liquidación de Pesca Industrial
 * Incluye logo, datos de empresa, título y datos de la entrega
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";
import { formatearFecha } from "../../utils/utils";

/**
 * Dibuja el encabezado del PDF de liquidación
 * @param {PDFPage} page - Página del PDF
 * @param {PDFDocument} pdfDoc - Documento PDF
 * @param {Object} entregaARendir - Datos de la entrega a rendir
 * @param {Object} empresa - Datos de la empresa
 * @param {PDFFont} fontBold - Fuente en negrita
 * @param {PDFFont} fontRegular - Fuente regular
 * @param {number} startY - Posición Y inicial
 * @param {number} pageWidth - Ancho de la página
 * @returns {Promise<number>} - Nueva posición Y
 */
export async function dibujaEncabezadoPDFLiquidacionPI(
  page,
  pdfDoc,
  entregaARendir,
  empresa,
  fontBold,
  fontRegular,
  startY,
  pageWidth
) {
  let yPosition = startY;
  const margin = 40;

  // Cargar logo si existe
  if (empresa?.logo && empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        let logoImage;

        if (empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }

        if (logoImage) {
          const logoDims = logoImage.size();
          const maxLogoWidth = 100;
          const aspectRatio = logoDims.width / logoDims.height;
          const finalWidth = maxLogoWidth;
          const finalHeight = maxLogoWidth / aspectRatio;

          page.drawImage(logoImage, {
            x: margin,
            y: yPosition - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  // Datos de la empresa (al lado del logo)
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin + 110,
    y: yPosition,
    size: 10,
    font: fontBold,
  });

  yPosition -= 12;
  page.drawText(`RUC: ${empresa?.ruc || "N/A"}`, {
    x: margin + 110,
    y: yPosition,
    size: 10,
    font: fontRegular,
  });

  yPosition -= 12;
  page.drawText(`Dirección: ${empresa?.direccion || "N/A"}`, {
    x: margin + 110,
    y: yPosition,
    size: 8,
    font: fontRegular,
  });

  // Título del documento
  yPosition -= 20;
  page.drawText("LIQUIDACIÓN DE ENTREGA A RENDIR", {
    x: pageWidth / 2 - 120,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  yPosition -= 14;
  page.drawText("PESCA INDUSTRIAL", {
    x: pageWidth / 2 - 60,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Línea separadora
  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: pageWidth - margin, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  // Información de la entrega en 3 filas con 2 columnas
  const leftX = margin;
  const rightX = pageWidth / 2 + 100;
  let infoY = yPosition;

  // Fila 1: Temporada y N° Liquidación
  const temporada = entregaARendir.temporadaPesca?.numeroResolucion || "N/A";
  page.drawText(`Temporada: ${temporada}`, {
    x: leftX,
    y: infoY,
    size: 9,
    font: fontBold,
  });

  page.drawText(`N° Liquidación: ${entregaARendir.id}`, {
    x: rightX,
    y: infoY,
    size: 9,
    font: fontBold,
  });

  infoY -= 15;

  // Fila 2: Responsable y Fecha
  const responsable = entregaARendir.respEntregaRendir
    ? `${entregaARendir.respEntregaRendir.nombres} ${entregaARendir.respEntregaRendir.apellidos}`.trim()
    : "N/A";
  page.drawText(`Responsable: ${responsable}`, {
    x: leftX,
    y: infoY,
    size: 9,
    font: fontRegular,
  });

  const fechaLiquidacion = formatearFecha(entregaARendir.fechaLiquidacion, "N/A");
  page.drawText(`Fecha: ${fechaLiquidacion}`, {
    x: rightX,
    y: infoY,
    size: 9,
    font: fontRegular,
  });

  infoY -= 15;

  // Fila 3: Centro de Costo y Estado
  const centroCosto = entregaARendir.centroCosto
    ? `${entregaARendir.centroCosto.Codigo} - ${entregaARendir.centroCosto.Nombre}`
    : "N/A";
  page.drawText(`Centro de Costo: ${centroCosto}`, {
    x: leftX,
    y: infoY,
    size: 9,
    font: fontRegular,
  });

  const estado = entregaARendir.entregaLiquidada ? "LIQUIDADA" : "PENDIENTE";
  page.drawText(`Estado: ${estado}`, {
    x: rightX,
    y: infoY,
    size: 9,
    font: fontBold,
    color: entregaARendir.entregaLiquidada ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
  });

  yPosition = infoY - 20;

  return yPosition;
}
