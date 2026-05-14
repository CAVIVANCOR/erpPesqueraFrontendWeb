// src/components/tipoActivo/reports/generarTiposActivoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Tipos de Activo con cuentas contables
 * Con filas de altura dinámica para textos largos
 * @param {Object} data - Datos de los tipos de activo
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarTiposActivoPDF(data) {
  const { tiposActivo, fechaGeneracion } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 15;
  const lineHeight = 8;
  const baseRowHeight = 13;

  // Ordenar tipos de activo por código
  const tiposOrdenados = [...tiposActivo].sort((a, b) => {
    return (a.codigo || "").localeCompare(b.codigo || "");
  });

  // ⭐ DEFINIR COLUMNAS DE LA TABLA (7 COLUMNAS - TOTAL: 812px)
  const colWidths = [25, 70, 120, 185, 185, 185, 42];
  const headers = [
    "N°",
    "Código",
    "Nombre",
    "Cuenta Activo (33x)",
    "Cuenta Dep. (68x)",
    "Cuenta Dep.Acum (39x)",
    "Estado",
  ];

  // ⭐ FUNCIÓN PARA DIVIDIR TEXTO EN LÍNEAS
  function dividirTextoEnLineas(texto, maxWidth, font, fontSize) {
    if (!texto) return ["-"];
    
    const palabras = texto.split(" ");
    const lineas = [];
    let lineaActual = "";

    palabras.forEach((palabra) => {
      const test = lineaActual + (lineaActual ? " " : "") + palabra;
      const width = font.widthOfTextAtSize(test, fontSize);

      if (width > maxWidth && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = test;
      }
    });

    if (lineaActual) lineas.push(lineaActual);
    return lineas.length > 0 ? lineas : ["-"];
  }

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 30;

    // Título del reporte
    const titulo = "LISTADO DE TIPOS DE ACTIVO";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 12);
    pag.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 20;

    // Numeración de página
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 7);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 20,
      size: 7,
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
      y: yPos - 14,
      width: contentWidth,
      height: 14,
      color: rgb(0.68, 0.85, 0.9),
    });

    // Bordes del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 14,
      width: contentWidth,
      height: 14,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Textos del header
    let xPos = tableStartX;
    headers.forEach((header, index) => {
      pag.drawText(header, {
        x: xPos + 2,
        y: yPos - 10,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += colWidths[index];
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
    let lineX = tableStartX;
    for (let i = 0; i < headers.length + 1; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 14 },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      if (i < headers.length) lineX += colWidths[i];
    }

    return yPos - 14;
  }

  // ⭐ FUNCIÓN PARA CALCULAR ALTURA DE FILA
  function calcularAlturaFila(rowData) {
    let maxLineas = 1;

    // Nombre
    const nombreTexto = rowData.nombre || "-";
    const lineasNombre = dividirTextoEnLineas(
      nombreTexto,
      colWidths[2] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasNombre.length);

    // Cuenta Activo
    const cuentaActivoTexto = rowData.cuentaActivo
      ? `${rowData.cuentaActivo.codigoCuenta} - ${rowData.cuentaActivo.nombreCuenta}`
      : "-";
    const lineasCuentaActivo = dividirTextoEnLineas(
      cuentaActivoTexto,
      colWidths[3] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasCuentaActivo.length);

    // Cuenta Depreciación
    const cuentaDepTexto = rowData.cuentaDepreciacion
      ? `${rowData.cuentaDepreciacion.codigoCuenta} - ${rowData.cuentaDepreciacion.nombreCuenta}`
      : "-";
    const lineasCuentaDep = dividirTextoEnLineas(
      cuentaDepTexto,
      colWidths[4] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasCuentaDep.length);

    // Cuenta Depreciación Acumulada
    const cuentaDepAcumTexto = rowData.cuentaDepreciacionAcumulada
      ? `${rowData.cuentaDepreciacionAcumulada.codigoCuenta} - ${rowData.cuentaDepreciacionAcumulada.nombreCuenta}`
      : "-";
    const lineasCuentaDepAcum = dividirTextoEnLineas(
      cuentaDepAcumTexto,
      colWidths[5] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasCuentaDepAcum.length);

    return baseRowHeight + (maxLineas - 1) * lineHeight;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR FILA DE DATOS
  function dibujarFila(pag, yPos, rowData, rowNumber, isEven, width) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Calcular altura dinámica
    const rowHeight = calcularAlturaFila(rowData);

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
    let xPos = tableStartX;

    // N°
    const numTexto = String(rowNumber);
    pag.drawText(numTexto, {
      x:
        xPos +
        (colWidths[0] - fontNormal.widthOfTextAtSize(numTexto, 7)) / 2,
      y: yPos - 9,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[0];

    // Código
    const codigoTexto = rowData.codigo || "-";
    pag.drawText(codigoTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontBold,
    });
    xPos += colWidths[1];

    // Nombre (MULTILINEA)
    const nombreTexto = rowData.nombre || "-";
    const lineasNombre = dividirTextoEnLineas(
      nombreTexto,
      colWidths[2] - 4,
      fontNormal,
      6
    );
    lineasNombre.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[2];

    // Cuenta Activo (33x) (MULTILINEA)
    const cuentaActivoTexto = rowData.cuentaActivo
      ? `${rowData.cuentaActivo.codigoCuenta} - ${rowData.cuentaActivo.nombreCuenta}`
      : "-";
    const lineasCuentaActivo = dividirTextoEnLineas(
      cuentaActivoTexto,
      colWidths[3] - 4,
      fontNormal,
      6
    );
    lineasCuentaActivo.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[3];

    // Cuenta Depreciación (68x) (MULTILINEA)
    const cuentaDepTexto = rowData.cuentaDepreciacion
      ? `${rowData.cuentaDepreciacion.codigoCuenta} - ${rowData.cuentaDepreciacion.nombreCuenta}`
      : "-";
    const lineasCuentaDep = dividirTextoEnLineas(
      cuentaDepTexto,
      colWidths[4] - 4,
      fontNormal,
      6
    );
    lineasCuentaDep.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[4];

    // Cuenta Depreciación Acumulada (39x) (MULTILINEA)
    const cuentaDepAcumTexto = rowData.cuentaDepreciacionAcumulada
      ? `${rowData.cuentaDepreciacionAcumulada.codigoCuenta} - ${rowData.cuentaDepreciacionAcumulada.nombreCuenta}`
      : "-";
    const lineasCuentaDepAcum = dividirTextoEnLineas(
      cuentaDepAcumTexto,
      colWidths[5] - 4,
      fontNormal,
      6
    );
    lineasCuentaDepAcum.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[5];

    // Estado
    const estadoTexto = rowData.cesado ? "CESADO" : "ACTIVO";
    const estadoColor = rowData.cesado ? rgb(0.7, 0, 0) : rgb(0, 0.5, 0);
    pag.drawText(estadoTexto, {
      x:
        xPos +
        (colWidths[6] - fontBold.widthOfTextAtSize(estadoTexto, 6)) / 2,
      y: yPos - 9,
      size: 6,
      font: fontBold,
      color: estadoColor,
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA
    let lineX = tableStartX;
    for (let i = 0; i < headers.length + 1; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < headers.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }

  // ⭐ GENERAR PÁGINAS
  let pages = [];
  let currentPage = pdfDoc.addPage([842, 595]); // A4 horizontal
  let { width, height } = currentPage.getSize();
  let yPosition = dibujarEncabezadoCompleto(
    currentPage,
    width,
    height,
    1,
    1
  );
  yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
  pages.push(currentPage);

  let rowNumber = 1;

  // Dibujar tipos de activo
  for (let i = 0; i < tiposOrdenados.length; i++) {
    const tipo = tiposOrdenados[i];

    // Calcular altura necesaria para esta fila
    const alturaFila = calcularAlturaFila(tipo);

    // Verificar si necesitamos nueva página
    if (yPosition - alturaFila < 50) {
      currentPage = pdfDoc.addPage([842, 595]);
      ({ width, height } = currentPage.getSize());
      yPosition = dibujarEncabezadoCompleto(
        currentPage,
        width,
        height,
        pages.length + 1,
        1
      );
      yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
      pages.push(currentPage);
    }

    yPosition = dibujarFila(
      currentPage,
      yPosition,
      tipo,
      rowNumber,
      i % 2 === 0,
      width
    );
    rowNumber++;
  }

  // ⭐ ACTUALIZAR NUMERACIÓN DE PÁGINAS
  const totalPages = pages.length;
  pages.forEach((pag, index) => {
    const pageNum = index + 1;
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 7);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 20,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ PIE DE PÁGINA EN TODAS LAS PÁGINAS
  const footerText = `Total de tipos: ${tiposActivo.length} | Generado: ${fechaGeneracion.toLocaleString(
    "es-PE"
  )} | Sistema ERP Megui`;
  pages.forEach((pag) => {
    pag.drawLine({
      start: { x: margin, y: 22 },
      end: { x: width - margin, y: 22 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    const footerWidth = fontNormal.widthOfTextAtSize(footerText, 6);
    pag.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 13,
      size: 6,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ GENERAR Y RETORNAR BLOB
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}