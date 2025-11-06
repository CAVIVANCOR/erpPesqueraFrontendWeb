/**
 * Helper para dibujar encabezado en PDFs de Cotización de Ventas usando pdf-lib
 * 
 * @param {PDFPage} page - Página del PDF
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Object} empresa - Datos de la empresa
 * @param {number} yPosition - Posición Y inicial
 * @param {number} width - Ancho de la página
 * @param {number} height - Alto de la página
 * @param {PDFFont} font - Fuente normal
 * @param {PDFFont} fontBold - Fuente bold
 * @returns {number} - Nueva posición Y después del encabezado
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";

export async function dibujaEncabezadoPDFCV(
  page,
  cotizacion,
  empresa,
  yPosition,
  width,
  height,
  font,
  fontBold
) {
  try {
    // Rectángulo del encabezado
    page.drawRectangle({
      x: 40,
      y: yPosition - 70,
      width: width - 80,
      height: 70,
      borderColor: rgb(0.16, 0.5, 0.73),
      borderWidth: 1.5,
    });

    // Logo placeholder (rectángulo azul)
    page.drawRectangle({
      x: 45,
      y: yPosition - 65,
      width: 60,
      height: 30,
      color: rgb(0.16, 0.5, 0.73),
    });

    page.drawText("LOGO", {
      x: 60,
      y: yPosition - 50,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Información de la empresa
    const empresaNombre = empresa?.razonSocial?.toUpperCase() || "EMPRESA";
    page.drawText(empresaNombre, {
      x: 115,
      y: yPosition - 25,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`RUC: ${empresa?.ruc || "N/A"}`, {
      x: 115,
      y: yPosition - 38,
      size: 8,
      font: font,
    });

    page.drawText(`Dirección: ${empresa?.direccion || "N/A"}`, {
      x: 115,
      y: yPosition - 48,
      size: 8,
      font: font,
    });

    page.drawText(
      `Teléfono: ${empresa?.telefono || "N/A"} | Email: ${empresa?.email || "N/A"}`,
      {
        x: 115,
        y: yPosition - 58,
        size: 8,
        font: font,
      }
    );

    // Información del documento (lado derecho)
    const rightX = width - 45;

    // Rectángulo azul para título
    page.drawRectangle({
      x: rightX - 120,
      y: yPosition - 30,
      width: 120,
      height: 20,
      color: rgb(0.16, 0.5, 0.73),
    });

    page.drawText("COTIZACIÓN DE VENTAS", {
      x: rightX - 115,
      y: yPosition - 22,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // N° Documento
    page.drawText("N° Documento:", {
      x: rightX - 120,
      y: yPosition - 38,
      size: 9,
      font: fontBold,
    });

    page.drawText(cotizacion.numeroDocumento || "PENDIENTE", {
      x: rightX - 50,
      y: yPosition - 38,
      size: 9,
      font: font,
    });

    // Fecha Emisión
    page.drawText("Fecha Emisión:", {
      x: rightX - 120,
      y: yPosition - 48,
      size: 9,
      font: fontBold,
    });

    const fechaEmision = cotizacion.fechaEmision
      ? new Date(cotizacion.fechaEmision).toLocaleDateString("es-PE")
      : new Date().toLocaleDateString("es-PE");

    page.drawText(fechaEmision, {
      x: rightX - 50,
      y: yPosition - 48,
      size: 9,
      font: font,
    });

    // Fecha Vencimiento
    page.drawText("Fecha Vencimiento:", {
      x: rightX - 120,
      y: yPosition - 58,
      size: 9,
      font: fontBold,
    });

    const fechaVencimiento = cotizacion.fechaVencimiento
      ? new Date(cotizacion.fechaVencimiento).toLocaleDateString("es-PE")
      : "-";

    page.drawText(fechaVencimiento, {
      x: rightX - 50,
      y: yPosition - 58,
      size: 9,
      font: font,
    });

    // Estado
    page.drawText("Estado:", {
      x: rightX - 120,
      y: yPosition - 68,
      size: 9,
      font: fontBold,
    });

    const estadoNombre = cotizacion.estadoCotizacionVenta?.nombre || "PENDIENTE";
    
    // Color según estado
    let estadoColor = rgb(0, 0, 0);
    if (estadoNombre.includes("APROBAD")) {
      estadoColor = rgb(0.3, 0.69, 0.31); // Verde
    } else if (estadoNombre.includes("RECHAZ")) {
      estadoColor = rgb(0.96, 0.26, 0.21); // Rojo
    } else if (estadoNombre.includes("PENDIENTE")) {
      estadoColor = rgb(1, 0.6, 0); // Naranja
    }

    page.drawText(estadoNombre, {
      x: rightX - 50,
      y: yPosition - 68,
      size: 9,
      font: fontBold,
      color: estadoColor,
    });

    // Línea separadora
    const newYPosition = yPosition - 75;
    page.drawLine({
      start: { x: 40, y: newYPosition },
      end: { x: width - 40, y: newYPosition },
      thickness: 0.5,
      color: rgb(0.78, 0.78, 0.78),
    });

    return newYPosition - 5;
  } catch (error) {
    console.error("Error al dibujar encabezado PDF:", error);
    return yPosition - 80; // Retornar posición por defecto en caso de error
  }
}