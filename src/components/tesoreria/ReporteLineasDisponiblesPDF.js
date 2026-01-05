// src/components/tesoreria/ReporteLineasDisponiblesPDF.js
// Generador de PDF para reporte de líneas de crédito disponibles
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";

/**
 * Genera un PDF del reporte de líneas de crédito disponibles
 * @param {Array} lineas - Datos de las líneas de crédito
 * @param {Object} empresa - Datos de la empresa (opcional)
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
export async function generarPDFReporteLineasDisponibles(lineas, empresa = null) {
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const formatearMoneda = (valor, moneda = "PEN") => {
    const simbolo = moneda === "USD" ? "$" : "S/";
    return `${simbolo} ${formatearNumero(Number(valor || 0))}`;
  };

  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  const pages = [];
  let page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
  pages.push(page);
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 13;

  // ENCABEZADO
  page.drawText("REPORTE DE LÍNEAS DE CRÉDITO DISPONIBLES", {
    x: margin,
    y: yPosition,
    size: 16,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  yPosition -= 25;

  if (empresa) {
    page.drawText(`Empresa: ${empresa.razonSocial || empresa.nombre || ""}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontNormal,
    });
    yPosition -= 15;
  }

  page.drawText(`Fecha de generación: ${formatearFecha(new Date())}`, {
    x: margin,
    y: yPosition,
    size: 9,
    font: fontNormal,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 30;

  // TABLA DE LÍNEAS
  const colWidths = [150, 100, 80, 110, 110, 110, 80];
  const headers = [
    "Línea de Crédito",
    "Banco",
    "Moneda",
    "Monto Aprobado",
    "Monto Utilizado",
    "Monto Disponible",
    "% Uso",
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableStartX = margin;

  // Función para dibujar encabezado de tabla
  const dibujarEncabezadoTabla = (pag, yPos) => {
    // Título
    pag.drawText("DETALLE DE LÍNEAS DE CRÉDITO", {
      x: margin,
      y: yPos,
      size: 11,
      font: fontBold,
    });

    yPos -= 20;

    // Fondo de encabezados
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Línea superior
    pag.drawLine({
      start: { x: tableStartX, y: yPos + 16 },
      end: { x: tableStartX + tableWidth, y: yPos + 16 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Dibujar encabezados
    let xPos = margin;
    headers.forEach((header, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      let textX = colX + 3;
      if (i >= 3) {
        const textWidth = fontBold.widthOfTextAtSize(header, 8);
        textX = colX + colWidth - textWidth - 3;
      }

      pag.drawText(header, {
        x: textX,
        y: yPos,
        size: 8,
        font: fontBold,
      });
      xPos += colWidth;
    });

    // Líneas verticales de encabezado
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 2 },
        end: { x: lineX, y: yPos + 16 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 18;
  };

  yPosition = dibujarEncabezadoTabla(page, yPosition);

  // Calcular totales
  let totalAprobado = 0;
  let totalUtilizado = 0;
  let totalDisponible = 0;

  // Dibujar filas de líneas
  for (let index = 0; index < lineas.length; index++) {
    const linea = lineas[index];

    // Verificar si hay espacio para la fila
    if (yPosition < 100) {
      page = pdfDoc.addPage([width, height]);
      pages.push(page);
      yPosition = height - 50;
      yPosition = dibujarEncabezadoTabla(page, yPosition);
    }

    const rowY = yPosition;
    let xPos = tableStartX;

    const montoAprobado = Number(linea.montoAprobado || 0);
    const montoUtilizado = Number(linea.montoUtilizado || 0);
    const montoDisponible = Number(linea.montoDisponible || 0);
    const porcentajeUso = montoAprobado > 0 ? ((montoUtilizado / montoAprobado) * 100).toFixed(1) : "0.0";

    totalAprobado += montoAprobado;
    totalUtilizado += montoUtilizado;
    totalDisponible += montoDisponible;

    const rowData = [
      linea.numeroLinea || "-",
      linea.banco?.nombre || "-",
      linea.moneda?.codigo || linea.moneda?.codigoSunat || "-",
      formatearMoneda(montoAprobado, linea.moneda?.codigo),
      formatearMoneda(montoUtilizado, linea.moneda?.codigo),
      formatearMoneda(montoDisponible, linea.moneda?.codigo),
      `${porcentajeUso}%`,
    ];

    const rowHeight = 16;

    // Dibujar datos
    rowData.forEach((data, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      let textX = colX + 3;
      if (i >= 3) {
        const textWidth = fontNormal.widthOfTextAtSize(data, 8);
        textX = colX + colWidth - textWidth - 3;
      }

      page.drawText(data, {
        x: textX,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
      xPos += colWidth;
    });

    // Líneas verticales de la fila
    let lineX = tableStartX;
    const lineStartY = rowY + 13;
    const lineEndY = rowY - rowHeight + 15;

    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: lineStartY },
        end: { x: lineX, y: lineEndY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    // Línea horizontal inferior
    page.drawLine({
      start: { x: tableStartX, y: lineEndY },
      end: { x: tableStartX + tableWidth, y: lineEndY },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= rowHeight;
  }

  // TOTALES
  yPosition -= 20;

  if (yPosition < 100) {
    page = pdfDoc.addPage([width, height]);
    pages.push(page);
    yPosition = height - 100;
  }

  // Fondo de totales
  page.drawRectangle({
    x: tableStartX,
    y: yPosition - 2,
    width: tableWidth,
    height: 18,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("TOTALES:", {
    x: margin + 3,
    y: yPosition,
    size: 9,
    font: fontBold,
  });

  const porcentajeUsoTotal = totalAprobado > 0 ? ((totalUtilizado / totalAprobado) * 100).toFixed(1) : "0.0";

  const totalesData = [
    "",
    "",
    "",
    formatearMoneda(totalAprobado),
    formatearMoneda(totalUtilizado),
    formatearMoneda(totalDisponible),
    `${porcentajeUsoTotal}%`,
  ];

  let xPos = tableStartX;
  totalesData.forEach((data, i) => {
    if (i >= 3 && data) {
      const colX = xPos;
      const colWidth = colWidths[i];
      const textWidth = fontBold.widthOfTextAtSize(data, 9);
      const textX = colX + colWidth - textWidth - 3;

      page.drawText(data, {
        x: textX,
        y: yPosition,
        size: 9,
        font: fontBold,
      });
    }
    xPos += colWidths[i];
  });

  // NUMERACIÓN DE PÁGINAS
  const totalPages = pages.length;
  pages.forEach((p, index) => {
    const pageNumber = index + 1;
    const pageText = `Página ${pageNumber} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);

    p.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 30,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Pie de página
    p.drawLine({
      start: { x: margin, y: 50 },
      end: { x: width - margin, y: 50 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    p.drawText(
      `Generado: ${new Date().toLocaleString("es-PE")} | Sistema ERP Megui`,
      {
        x: margin,
        y: 38,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Descarga el PDF generado
 * @param {Uint8Array} pdfBytes - Bytes del PDF
 * @param {string} nombreArchivo - Nombre del archivo
 */
export function descargarPDFReporte(pdfBytes, nombreArchivo = "reporte-lineas-credito.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}