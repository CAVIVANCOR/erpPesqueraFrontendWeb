// src/components/tipoMovEntregaRendir/reports/generarTipoMovEntregaRendirPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Tipos de Movimiento Caja
 * @param {Object} data - Datos de los tipos de movimiento
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarTipoMovEntregaRendirPDF(data) {
  const { items, categorias, fechaGeneracion } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 12;

  // Ordenar items por tipo, categoría y nombre
  const itemsOrdenados = [...items].sort((a, b) => {
    // 1. Ordenar por Tipo (INGRESO primero, EGRESO después)
    if (a.esIngreso !== b.esIngreso) {
      return a.esIngreso ? -1 : 1;
    }

    // 2. Ordenar por Categoría (alfabético)
    const catA = a.categoria?.nombre || "";
    const catB = b.categoria?.nombre || "";
    if (catA !== catB) {
      return catA.localeCompare(catB);
    }

    // 3. Ordenar por Nombre (alfabético)
    const nombreA = a.nombre || "";
    const nombreB = b.nombre || "";
    return nombreA.localeCompare(nombreB);
  });

  // ⭐ DEFINIR COLUMNAS DE LA TABLA (Portrait: ancho total ~515px)
  const colWidths = [20, 45, 160, 210, 40, 40];
  const headers = ["ID", "Tipo", "Categoría", "Nombre", "Transf.", "Estado"];

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 30;
    // Título del reporte
    const titulo = "LISTADO DE TIPOS DE MOVIMIENTO CAJA";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
    pag.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 15;
    // Numeración de página
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    return yPos;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADOS DE TABLA
  function dibujarEncabezadosTabla(pag, yPos, width) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      color: rgb(0.68, 0.85, 0.9),
    });

    // Bordes del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Textos del header
    let xPos = tableStartX + 2;
    headers.forEach((header, index) => {
      pag.drawText(header, {
        x: xPos + 2,
        y: yPos - 11,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += colWidths[index];
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 15 },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 15;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR FILA DE DATOS
  function dibujarFila(pag, yPos, rowData, isEven, width) {
    const rowHeight = 14;
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo alternado
    if (isEven) {
      pag.drawRectangle({
        x: tableStartX,
        y: yPos - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    // Bordes de la fila
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    // Datos de la fila
    let xPos = tableStartX + 2;

    // ID
    const idTexto = String(rowData.id);
    pag.drawText(idTexto, {
      x: xPos + (colWidths[0] - fontNormal.widthOfTextAtSize(idTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[0];

    // Tipo
    const tipoTexto = rowData.esIngreso ? "INGRESO" : "EGRESO";
    const tipoColor = rowData.esIngreso ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
    pag.drawText(tipoTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: tipoColor,
    });
    xPos += colWidths[1];

    // Categoría
    const categoriaTexto = (rowData.categoria?.nombre || "-").substring(0, 36);
    pag.drawText(categoriaTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[2];

    // Nombre
    const nombreTexto = (rowData.nombre || "-").substring(0, 55);
    pag.drawText(nombreTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
    });
    xPos += colWidths[3];

    // Transferencia
    const transferenciaTexto = rowData.esTransferencia ? "SÍ" : "NO";
    const transferenciaColor = rowData.esTransferencia
      ? rgb(0, 0.4, 0.8)
      : rgb(0.5, 0.5, 0.5);
    pag.drawText(transferenciaTexto, {
      x:
        xPos +
        (colWidths[4] - fontBold.widthOfTextAtSize(transferenciaTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: transferenciaColor,
    });
    xPos += colWidths[4];

    // Estado
    const estadoTexto = rowData.activo ? "ACTIVO" : "INACTIVO";
    const estadoColor = rowData.activo ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
    pag.drawText(estadoTexto, {
      x: xPos + (colWidths[5] - fontBold.widthOfTextAtSize(estadoTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: estadoColor,
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }
  // ⭐ GENERAR PÁGINAS
  let pages = [];
  let currentPage = pdfDoc.addPage([595, 842]); // A4 vertical (Portrait)
  let { width, height } = currentPage.getSize();
  let yPosition = dibujarEncabezadoCompleto(currentPage, width, height, 1, 1);
  yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
  pages.push(currentPage);

  // Dibujar items
  for (let i = 0; i < itemsOrdenados.length; i++) {
    const item = itemsOrdenados[i];

    // Verificar si necesitamos nueva página
    if (yPosition < 80) {
      currentPage = pdfDoc.addPage([595, 842]);
      ({ width, height } = currentPage.getSize());
      yPosition = dibujarEncabezadoCompleto(
        currentPage,
        width,
        height,
        pages.length + 1,
        1,
      );
      yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
      pages.push(currentPage);
    }

    yPosition = dibujarFila(currentPage, yPosition, item, i % 2 === 0, width);
  }

  // ⭐ ACTUALIZAR NUMERACIÓN DE PÁGINAS
  const totalPages = pages.length;
  pages.forEach((pag, index) => {
    const pageNum = index + 1;
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ PIE DE PÁGINA EN TODAS LAS PÁGINAS
  const footerText = `Total de tipos: ${items.length} | Generado: ${fechaGeneracion.toLocaleString("es-PE")} | Sistema ERP Megui`;
  pages.forEach((pag) => {
    pag.drawLine({
      start: { x: margin, y: 25 },
      end: { x: width - margin, y: 25 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    const footerWidth = fontNormal.widthOfTextAtSize(footerText, 7);
    pag.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 15,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ GENERAR Y RETORNAR BLOB
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
