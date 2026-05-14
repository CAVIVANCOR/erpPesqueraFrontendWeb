// src/components/movimientoActivoFijo/reports/generarMovimientosActivoFijoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Movimientos de Activo Fijo
 * Formato horizontal con filas de altura dinámica
 * Incluye todos los campos: empresa, activo, tipo movimiento, fechas, montos, etc.
 * @param {Object} data - Datos de los movimientos
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarMovimientosActivoFijoPDF(data) {
  const { movimientos, fechaGeneracion } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 15;
  const lineHeight = 8;
  const baseRowHeight = 13;

  // Ordenar movimientos por fecha descendente
  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    return new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento);
  });

  // ⭐ DEFINIR COLUMNAS DE LA TABLA (13 COLUMNAS - TOTAL: 812px)
  const colWidths = [25, 80, 60, 80, 70, 35, 65, 65, 65, 65, 70, 60, 72];
  const headers = [
    "N°",
    "Empresa",
    "F.Movimiento",
    "Activo",
    "Tipo Mov.",
    "Mon",
    "Monto",
    "Dep.Mensual",
    "Dep.Acum.",
    "Valor Neto",
    "Período",
    "F.Contable",
    "Centro Costo",
  ];

  // ⭐ FUNCIÓN PARA FORMATEAR MONEDA
  function formatearMoneda(valor, moneda = "PEN") {
    if (!valor) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(valor);
  }

  // ⭐ FUNCIÓN PARA FORMATEAR FECHA
  function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE");
  }

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
    const titulo = "LISTADO DE MOVIMIENTOS DE ACTIVO FIJO";
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

    // Empresa
    const empresaTexto = rowData.empresa?.razonSocial || "-";
    const lineasEmpresa = dividirTextoEnLineas(
      empresaTexto,
      colWidths[1] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasEmpresa.length);

    // Activo
    const activoTexto = rowData.activo?.nombre || "-";
    const lineasActivo = dividirTextoEnLineas(
      activoTexto,
      colWidths[3] - 4,
      fontBold,
      6
    );
    maxLineas = Math.max(maxLineas, lineasActivo.length);

    // Tipo Movimiento
    const tipoMovTexto = rowData.tipoMovimiento?.nombre || "-";
    const lineasTipoMov = dividirTextoEnLineas(
      tipoMovTexto,
      colWidths[4] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasTipoMov.length);

    // Centro de Costo
    const centroCostoTexto = rowData.centroCosto
      ? `${rowData.centroCosto.codigo || ""} ${rowData.centroCosto.Nombre || ""}`
      : "-";
    const lineasCentroCosto = dividirTextoEnLineas(
      centroCostoTexto,
      colWidths[12] - 4,
      fontNormal,
      6
    );
    maxLineas = Math.max(maxLineas, lineasCentroCosto.length);

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

    // Empresa (MULTILINEA)
    const empresaTexto = rowData.empresa?.razonSocial || "-";
    const lineasEmpresa = dividirTextoEnLineas(
      empresaTexto,
      colWidths[1] - 4,
      fontNormal,
      6
    );
    lineasEmpresa.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[1];

    // Fecha Movimiento
    const fechaTexto = formatearFecha(rowData.fechaMovimiento);
    pag.drawText(fechaTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[2];

    // Activo (MULTILINEA)
    const activoTexto = rowData.activo?.nombre || "-";
    const lineasActivo = dividirTextoEnLineas(
      activoTexto,
      colWidths[3] - 4,
      fontBold,
      6
    );
    lineasActivo.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontBold,
      });
    });
    xPos += colWidths[3];

    // Tipo Movimiento (MULTILINEA)
    const tipoMovTexto = rowData.tipoMovimiento?.nombre || "-";
    const lineasTipoMov = dividirTextoEnLineas(
      tipoMovTexto,
      colWidths[4] - 4,
      fontNormal,
      6
    );
    lineasTipoMov.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
    });
    xPos += colWidths[4];

    // Moneda
    const monedaTexto = rowData.moneda?.codigoSunat || "-";
    pag.drawText(monedaTexto, {
      x:
        xPos +
        (colWidths[5] - fontNormal.widthOfTextAtSize(monedaTexto, 6)) / 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[5];

    // Monto
    const montoTexto = rowData.monto
      ? formatearMoneda(rowData.monto, rowData.moneda?.codigoSunat || "PEN")
      : "-";
    pag.drawText(montoTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[6];

    // Depreciación Mensual
    const depMensualTexto = rowData.depreciacionMensual
      ? formatearMoneda(
          rowData.depreciacionMensual,
          rowData.moneda?.codigoSunat || "PEN"
        )
      : "-";
    pag.drawText(depMensualTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[7];

    // Depreciación Acumulada
    const depAcumTexto = rowData.depreciacionAcumulada
      ? formatearMoneda(
          rowData.depreciacionAcumulada,
          rowData.moneda?.codigoSunat || "PEN"
        )
      : "-";
    pag.drawText(depAcumTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[8];

    // Valor Neto
    const valorNetoTexto = rowData.valorNeto
      ? formatearMoneda(
          rowData.valorNeto,
          rowData.moneda?.codigoSunat || "PEN"
        )
      : "-";
    pag.drawText(valorNetoTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[9];

    // Período Contable
    const periodoTexto = rowData.periodoContable?.nombrePeriodo || "-";
    pag.drawText(periodoTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[10];

    // Fecha Contable
    const fechaContableTexto = formatearFecha(rowData.fechaContable);
    pag.drawText(fechaContableTexto, {
      x: xPos + 2,
      y: yPos - 9,
      size: 6,
      font: fontNormal,
    });
    xPos += colWidths[11];

    // Centro de Costo (MULTILINEA)
    const centroCostoTexto = rowData.centroCosto
      ? `${rowData.centroCosto.codigo || ""} ${rowData.centroCosto.Nombre || ""}`
      : "-";
    const lineasCentroCosto = dividirTextoEnLineas(
      centroCostoTexto,
      colWidths[12] - 4,
      fontNormal,
      6
    );
    lineasCentroCosto.forEach((linea, idx) => {
      pag.drawText(linea, {
        x: xPos + 2,
        y: yPos - 9 - idx * lineHeight,
        size: 6,
        font: fontNormal,
      });
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

  // ⭐ GENERAR PÁGINAS (A4 HORIZONTAL)
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

  // Dibujar movimientos
  for (let i = 0; i < movimientosOrdenados.length; i++) {
    const movimiento = movimientosOrdenados[i];

    // Calcular altura necesaria para esta fila
    const alturaFila = calcularAlturaFila(movimiento);

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
      movimiento,
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
  const footerText = `Total de movimientos: ${movimientos.length} | Generado: ${fechaGeneracion.toLocaleString(
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