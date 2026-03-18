// src/components/cuentaCorriente/reports/generarMovimientosCuentaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Movimientos por Cuenta Corriente
 * @param {Object} data - Datos de los movimientos de la cuenta
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarMovimientosCuentaPDF(data) {
  const { movimientos = [], cuenta, empresas, filtros = {}, fechaGeneracion = new Date() } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 12;

  // ⭐ OBTENER EMPRESA DE LA CUENTA
  let empresaCuenta = null;
  let logoImage = null;
  
  if (cuenta?.empresa) {
    empresaCuenta = cuenta.empresa;
    
    // Cargar logo si existe
    if (empresaCuenta?.logo && empresaCuenta?.id) {
      try {
        const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresaCuenta.id}/logo`;
        const logoResponse = await fetch(logoUrl);

        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          if (empresaCuenta.logo.toLowerCase().includes(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
        }
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }
  }

  // ⭐ DEFINIR COLUMNAS DE LA TABLA
  const colWidths = [30, 80, 250, 90, 90, 90, 90];
  const headers = [
    "N°",
    "Fecha",
    "Descripción",
    "Tipo",
    "Ingreso",
    "Egreso",
    "Saldo"
  ];

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 40;

    // Logo y datos de empresa
    if (empresaCuenta) {
      if (logoImage) {
        const logoDims = logoImage.size();
        const maxLogoWidth = 70;
        const aspectRatio = logoDims.width / logoDims.height;
        const finalWidth = maxLogoWidth;
        const finalHeight = maxLogoWidth / aspectRatio;

        pag.drawImage(logoImage, {
          x: margin,
          y: yPos - finalHeight,
          width: finalWidth,
          height: finalHeight,
        });
      }

      pag.drawText(empresaCuenta.razonSocial || "EMPRESA", {
        x: margin + 80,
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPos -= lineHeight;
      pag.drawText(`RUC: ${empresaCuenta.ruc || "-"}`, {
        x: margin + 80,
        y: yPos,
        size: 9,
        font: fontNormal,
      });

      yPos -= lineHeight;
      if (empresaCuenta.direccion) {
        const direccionTexto = empresaCuenta.direccion.length > 60 
          ? empresaCuenta.direccion.substring(0, 60) + "..."
          : empresaCuenta.direccion;
        pag.drawText(`Direccion: ${direccionTexto}`, {
          x: margin + 80,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }

    // Título del reporte
    const titulo = "MOVIMIENTOS POR CUENTA CORRIENTE";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
    pag.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 18;

    // Información de la cuenta
    const cuentaInfo = `Cuenta: ${cuenta?.numeroCuenta || "-"} | Banco: ${cuenta?.banco?.nombre || "-"} | Moneda: ${cuenta?.moneda?.simbolo || "-"}`;
    const cuentaInfoWidth = fontBold.widthOfTextAtSize(cuentaInfo, 10);
    pag.drawText(cuentaInfo, {
      x: (width - cuentaInfoWidth) / 2,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPos -= 15;

    // Fecha y hora de generación
    const fechaTexto = `Fecha de Generacion: ${fechaGeneracion.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}, ${fechaGeneracion.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    const fechaWidth = fontNormal.widthOfTextAtSize(fechaTexto, 9);
    pag.drawText(fechaTexto, {
      x: (width - fechaWidth) / 2,
      y: yPos,
      size: 9,
      font: fontNormal,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPos -= 15;

    // Filtros aplicados (período)
    if (filtros.fechaInicio || filtros.fechaFin) {
      pag.drawText("Periodo:", {
        x: margin,
        y: yPos,
        size: 9,
        font: fontBold,
      });
      yPos -= lineHeight;

      const fechaInicioTexto = filtros.fechaInicio 
        ? new Date(filtros.fechaInicio).toLocaleDateString('es-PE')
        : "Inicio";
      const fechaFinTexto = filtros.fechaFin 
        ? new Date(filtros.fechaFin).toLocaleDateString('es-PE')
        : "Actualidad";
      
      pag.drawText(`  Desde: ${fechaInicioTexto} hasta: ${fechaFinTexto}`, {
        x: margin,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
      yPos -= lineHeight;

      yPos -= 5;
    }

    // Línea separadora
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
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

    // Líneas verticales separadoras
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
  function dibujarFila(pag, yPos, rowData, rowNumber, isEven, width) {
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

    let xPos = tableStartX + 2;

    // N°
    pag.drawText(String(rowNumber), {
      x: xPos + (colWidths[0] - fontNormal.widthOfTextAtSize(String(rowNumber), 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[0];

    // Fecha
    const fechaTexto = rowData.fecha 
      ? new Date(rowData.fecha).toLocaleDateString('es-PE')
      : "-";
    pag.drawText(fechaTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[1];

    // Descripción
    const descripcionTexto = (rowData.descripcion || "-").substring(0, 50);
    pag.drawText(descripcionTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[2];

    // Tipo
    const tipoTexto = rowData.tipo || "-";
    pag.drawText(tipoTexto, {
      x: xPos + (colWidths[3] - fontNormal.widthOfTextAtSize(tipoTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: rowData.tipo === "INGRESO" ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0),
    });
    xPos += colWidths[3];

    // Ingreso
    const ingresoMonto = rowData.tipo === "INGRESO" ? Number(rowData.monto || 0) : 0;
    const ingresoTexto = ingresoMonto.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const ingresoWidth = fontNormal.widthOfTextAtSize(ingresoTexto, 7);
    pag.drawText(ingresoTexto, {
      x: xPos + colWidths[4] - ingresoWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
      color: ingresoMonto > 0 ? rgb(0, 0.5, 0) : rgb(0, 0, 0),
    });
    xPos += colWidths[4];

    // Egreso
    const egresoMonto = rowData.tipo === "EGRESO" ? Number(rowData.monto || 0) : 0;
    const egresoTexto = egresoMonto.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const egresoWidth = fontNormal.widthOfTextAtSize(egresoTexto, 7);
    pag.drawText(egresoTexto, {
      x: xPos + colWidths[5] - egresoWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
      color: egresoMonto > 0 ? rgb(0.7, 0, 0) : rgb(0, 0, 0),
    });
    xPos += colWidths[5];

    // Saldo
    const saldoTexto = Number(rowData.saldo || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoWidth = fontBold.widthOfTextAtSize(saldoTexto, 7);
    pag.drawText(saldoTexto, {
      x: xPos + colWidths[6] - saldoWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
    });

    // Líneas verticales separadoras
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
  let currentPage = pdfDoc.addPage([842, 595]); // A4 horizontal
  let { width, height } = currentPage.getSize();
  let yPosition = dibujarEncabezadoCompleto(currentPage, width, height, 1, 1);
  yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
  pages.push(currentPage);

  let rowNumber = 1;
  let totalIngresos = 0;
  let totalEgresos = 0;
  let saldoActual = Number(cuenta?.saldoInicial || 0);

  // Dibujar movimientos
  for (let i = 0; i < movimientos.length; i++) {
    const movimiento = movimientos[i];

    // Calcular saldo acumulado
    if (movimiento.tipo === "INGRESO") {
      saldoActual += Number(movimiento.monto || 0);
      totalIngresos += Number(movimiento.monto || 0);
    } else {
      saldoActual -= Number(movimiento.monto || 0);
      totalEgresos += Number(movimiento.monto || 0);
    }

    movimiento.saldo = saldoActual;

    // Verificar si necesitamos nueva página
    if (yPosition < 80) {
      currentPage = pdfDoc.addPage([842, 595]);
      ({ width, height } = currentPage.getSize());
      yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
      yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
      pages.push(currentPage);
    }

    yPosition = dibujarFila(currentPage, yPosition, movimiento, rowNumber, i % 2 === 0, width);
    rowNumber++;
  }

  // ⭐ TOTALES
  if (yPosition < 80) {
    currentPage = pdfDoc.addPage([842, 595]);
    ({ width, height } = currentPage.getSize());
    yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
    yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
    pages.push(currentPage);
  }

  yPosition -= 5;
  const rowHeight = 16;
  const tableStartX = margin;
  const contentWidth = width - margin * 2;

  currentPage.drawRectangle({
    x: tableStartX,
    y: yPosition - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: rgb(0.75, 0.85, 0.9),
  });

  currentPage.drawRectangle({
    x: tableStartX,
    y: yPosition - rowHeight,
    width: contentWidth,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  // Label Totales
  let xPos = tableStartX + colWidths[0] + colWidths[1] + 2;
  currentPage.drawText("TOTALES", {
    x: xPos + 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Ingresos
  xPos = tableStartX + colWidths.slice(0, 4).reduce((sum, w) => sum + w, 0);
  const totalIngresosTexto = totalIngresos.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const totalIngresosWidth = fontBold.widthOfTextAtSize(totalIngresosTexto, 9);
  currentPage.drawText(totalIngresosTexto, {
    x: xPos + colWidths[4] - totalIngresosWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0.5, 0),
  });

  // Total Egresos
  xPos += colWidths[4];
  const totalEgresosTexto = totalEgresos.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const totalEgresosWidth = fontBold.widthOfTextAtSize(totalEgresosTexto, 9);
  currentPage.drawText(totalEgresosTexto, {
    x: xPos + colWidths[5] - totalEgresosWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0.7, 0, 0),
  });

  // Saldo Final
  xPos += colWidths[5];
  const saldoFinalTexto = saldoActual.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const saldoFinalWidth = fontBold.widthOfTextAtSize(saldoFinalTexto, 9);
  currentPage.drawText(saldoFinalTexto, {
    x: xPos + colWidths[6] - saldoFinalWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Líneas verticales separadoras
  let lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    currentPage.drawLine({
      start: { x: lineX, y: yPosition - rowHeight },
      end: { x: lineX, y: yPosition },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
    if (i < colWidths.length) lineX += colWidths[i];
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

  // ⭐ PIE DE PÁGINA
  const footerText = `Total de movimientos: ${movimientos.length} | Generado: ${fechaGeneracion.toLocaleString('es-PE')} | Sistema ERP Megui`;
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