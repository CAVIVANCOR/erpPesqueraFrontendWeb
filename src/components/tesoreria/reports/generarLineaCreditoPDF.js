// src/components/tesoreria/reports/generarLineaCreditoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte resumen de Líneas de Crédito
 * @param {Object} data - Datos de las líneas de crédito
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarLineaCreditoPDF(data) {
  const { items, fechaGeneracion, titulo } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 30;
  const lineHeight = 12;

  // Ordenar items por moneda, luego por empresa y número de línea
  const itemsOrdenados = [...items].sort((a, b) => {
    const monedaA = a.moneda?.codigoSunat || "";
    const monedaB = b.moneda?.codigoSunat || "";
    if (monedaA !== monedaB) {
      return monedaA.localeCompare(monedaB);
    }
    const empresaA = a.empresa?.razonSocial || "";
    const empresaB = b.empresa?.razonSocial || "";
    if (empresaA !== empresaB) {
      return empresaA.localeCompare(empresaB);
    }
    const numA = a.numeroLinea || "";
    const numB = b.numeroLinea || "";
    return numA.localeCompare(numB);
  });

  // ⭐ AGRUPAR POR MONEDA
  const gruposPorMoneda = {};
  itemsOrdenados.forEach((item) => {
    const moneda = item.moneda?.codigoSunat || "SIN MONEDA";
    if (!gruposPorMoneda[moneda]) {
      gruposPorMoneda[moneda] = [];
    }
    gruposPorMoneda[moneda].push(item);
  });

  // ⭐ DEFINIR COLUMNAS DE LA TABLA (Portrait: ancho total ~552px)
  const colWidths = [95, 65, 25, 55, 55, 55, 55, 35, 40, 30, 40];
  const headers = [
    "Empresa",
    "Banco",
    "Mon.",
    "Límite",
    "Utilizado",
    "Sobregiro",
    "Disponible",
    "% Util.",
    "Vence",
    "Tasa %",
    "Estado",
  ];

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 25;
    const tituloTexto = titulo || "LISTADO DE LÍNEAS DE CRÉDITO";
    const tituloWidth = fontBold.widthOfTextAtSize(tituloTexto, 14);
    pag.drawText(tituloTexto, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 12;
    const fechaTexto = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
    const fechaWidth = fontNormal.widthOfTextAtSize(fechaTexto, 8);
    pag.drawText(fechaTexto, {
      x: (width - fechaWidth) / 2,
      y: yPos,
      size: 8,
      font: fontNormal,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pageText = `Página ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 20,
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

    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 14,
      width: contentWidth,
      height: 14,
      color: rgb(0.27, 0.45, 0.77),
    });

    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 14,
      width: contentWidth,
      height: 14,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let xPos = tableStartX + 2;
    headers.forEach((header, index) => {
      const headerWidth = fontBold.widthOfTextAtSize(header, 7);
      const xCentered = xPos + (colWidths[index] - headerWidth) / 2;
      pag.drawText(header, {
        x: xCentered,
        y: yPos - 10,
        size: 7,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      xPos += colWidths[index];
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 14 },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 14;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR UNA FILA
  function dibujarFila(pag, yPos, width, item, rowIndex) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;
    const rowHeight = 14;

    const bgColor = rowIndex % 2 === 0 ? rgb(0.96, 0.96, 0.96) : rgb(1, 1, 1);
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: bgColor,
    });

    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    const montoAprobado = parseFloat(item.montoAprobado || 0);
    const montoUtilizado = parseFloat(item.montoUtilizado || 0);
    const montoDisponible = parseFloat(item.montoDisponible || 0);
    const totalSobregiros = parseFloat(item.totalSobregiros || 0);
    const porcentajeUtilizado = montoAprobado > 0 ? (montoUtilizado / montoAprobado) * 100 : 0;

    const formatMonto = (val) => {
      return new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    };

    const formatFecha = (fecha) => {
      if (!fecha) return "-";
      return new Date(fecha).toLocaleDateString("es-PE");
    };

    const truncate = (text, maxLen) => {
      if (!text) return "-";
      return text.length > maxLen ? text.substring(0, maxLen - 2) + ".." : text;
    };

    const rowData = [
      truncate(item.empresa?.razonSocial, 28),
      truncate(item.banco?.nombre, 23),
      item.moneda?.codigoSunat || "-",
      formatMonto(montoAprobado),
      formatMonto(montoUtilizado),
      totalSobregiros > 0 ? formatMonto(totalSobregiros) : "-",
      formatMonto(montoDisponible),
      porcentajeUtilizado.toFixed(1) + "%",
      formatFecha(item.fechaVencimiento),
      (parseFloat(item.tasaInteres || 0)).toFixed(2),
      truncate(item.estado?.descripcion, 10),
    ];

    let xPos = tableStartX + 2;
    rowData.forEach((value, index) => {
      let textColor = rgb(0, 0, 0);
      let textFont = fontNormal;
      let xPosition = xPos + 2;

      // Campos numéricos: Límite(3), Utilizado(4), Sobregiro(5), Disponible(6), % Util.(7), Tasa %(9)
      const isNumericField = [3, 4, 5, 6, 7, 9].includes(index);

      if (index === 7) {
        if (porcentajeUtilizado > 90) {
          textColor = rgb(0.7, 0, 0);
          textFont = fontBold;
        } else if (porcentajeUtilizado > 75) {
          textColor = rgb(0.8, 0.5, 0);
          textFont = fontBold;
        }
      }

      if (index === 5 && totalSobregiros > 0) {
        textColor = rgb(0.7, 0, 0);
        textFont = fontBold;
      }

      // Alinear a la derecha si es campo numérico
      if (isNumericField) {
        const textWidth = textFont.widthOfTextAtSize(String(value), 6.5);
        xPosition = xPos + colWidths[index] - textWidth - 4;
      }

      pag.drawText(String(value), {
        x: xPosition,
        y: yPos - 10,
        size: 6.5,
        font: textFont,
        color: textColor,
      });
      xPos += colWidths[index];
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

  // ⭐ FUNCIÓN PARA DIBUJAR FILA DE SUBTOTAL
  function dibujarSubtotal(pag, yPos, width, moneda, subtotales) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;
    const rowHeight = 16;

    // Fondo del subtotal
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: rgb(0.85, 0.92, 0.95),
    });

    // Bordes del subtotal
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    const formatMonto = (val) => {
      return new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    };

    // Label "Subtotal [MONEDA]"
    const subtotalLabel = `Subtotal ${moneda}`;
    let xPos = tableStartX + 2;
    pag.drawText(subtotalLabel, {
      x: xPos + 5,
      y: yPos - 11,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Posicionar valores en columnas correctas
    xPos = tableStartX + colWidths[0] + colWidths[1] + colWidths[2];

    // Límite (columna 3)
    const limiteTexto = formatMonto(subtotales.limite);
    const limiteWidth = fontBold.widthOfTextAtSize(limiteTexto, 7);
    pag.drawText(limiteTexto, {
      x: xPos + colWidths[3] - limiteWidth - 4,
      y: yPos - 11,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[3];

    // Utilizado (columna 4)
    const utilizadoTexto = formatMonto(subtotales.utilizado);
    const utilizadoWidth = fontBold.widthOfTextAtSize(utilizadoTexto, 7);
    pag.drawText(utilizadoTexto, {
      x: xPos + colWidths[4] - utilizadoWidth - 4,
      y: yPos - 11,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[4];

    // Sobregiro (columna 5)
    const sobregirosTexto = formatMonto(subtotales.sobregiros);
    const sobregirosWidth = fontBold.widthOfTextAtSize(sobregirosTexto, 7);
    pag.drawText(sobregirosTexto, {
      x: xPos + colWidths[5] - sobregirosWidth - 4,
      y: yPos - 11,
      size: 7,
      font: fontBold,
      color: subtotales.sobregiros > 0 ? rgb(0.7, 0, 0) : rgb(0, 0, 0),
    });
    xPos += colWidths[5];

    // Disponible (columna 6)
    const disponibleTexto = formatMonto(subtotales.disponible);
    const disponibleWidth = fontBold.widthOfTextAtSize(disponibleTexto, 7);
    pag.drawText(disponibleTexto, {
      x: xPos + colWidths[6] - disponibleWidth - 4,
      y: yPos - 11,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales separadoras
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.3,
        color: rgb(0.5, 0.5, 0.5),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }

  // ⭐ GENERAR PÁGINAS CON SUBTOTALES POR MONEDA
  const pageWidth = 612;
  const pageHeight = 792;
  let currentPage = null;
  let yPos = 0;
  let pageNum = 0;
  let rowIndex = 0;

  const monedasKeys = Object.keys(gruposPorMoneda);

  monedasKeys.forEach((moneda) => {
    const itemsMoneda = gruposPorMoneda[moneda];
    
    // Calcular subtotales para esta moneda
    const subtotales = {
      limite: 0,
      utilizado: 0,
      sobregiros: 0,
      disponible: 0,
    };

    itemsMoneda.forEach((item) => {
      subtotales.limite += parseFloat(item.montoAprobado || 0);
      subtotales.utilizado += parseFloat(item.montoUtilizado || 0);
      subtotales.sobregiros += parseFloat(item.totalSobregiros || 0);
      subtotales.disponible += parseFloat(item.montoDisponible || 0);
    });

    // Dibujar items de esta moneda
    itemsMoneda.forEach((item, idx) => {
      // Crear nueva página si es necesario
      if (!currentPage || yPos < 100) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNum++;
        const { width, height } = currentPage.getSize();
        yPos = dibujarEncabezadoCompleto(currentPage, width, height, pageNum, "?");
        yPos -= 10;
        yPos = dibujarEncabezadosTabla(currentPage, yPos, width);
      }

      yPos = dibujarFila(currentPage, yPos, pageWidth, item, rowIndex);
      rowIndex++;
    });

    // Dibujar subtotal después del último item de la moneda
    if (currentPage && yPos < 100) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNum++;
      const { width, height } = currentPage.getSize();
      yPos = dibujarEncabezadoCompleto(currentPage, width, height, pageNum, "?");
      yPos -= 10;
      yPos = dibujarEncabezadosTabla(currentPage, yPos, width);
    }
    
    yPos = dibujarSubtotal(currentPage, yPos, pageWidth, moneda, subtotales);
    yPos -= 5;
  });

  // Actualizar número total de páginas
  const totalPages = pdfDoc.getPageCount() - 1;
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const pageText = `Página ${i + 1} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 20,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // ⭐ PÁGINA DE RESUMEN
  const resumenPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const { width: rWidth, height: rHeight } = resumenPage.getSize();
  yPos = rHeight - 40;

  const resumenTitulo = "RESUMEN DE LÍNEAS DE CRÉDITO";
  const resumenWidth = fontBold.widthOfTextAtSize(resumenTitulo, 14);
  resumenPage.drawText(resumenTitulo, {
    x: (rWidth - resumenWidth) / 2,
    y: yPos,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  yPos -= 30;

  const totalLineas = items.length;
  const lineasActivas = items.filter((l) => l.estado?.nombre?.toUpperCase().includes("VIGENTE")).length;
  const lineasVencidas = items.filter((l) => {
    if (!l.fechaVencimiento) return false;
    return new Date(l.fechaVencimiento) < new Date();
  }).length;

  const resumenData = [
    { label: "Total de Líneas de Crédito:", value: totalLineas },
    { label: "Líneas Vigentes:", value: lineasActivas },
    { label: "Líneas Vencidas:", value: lineasVencidas },
  ];

  resumenData.forEach((dato) => {
    resumenPage.drawText(dato.label, {
      x: margin + 50,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    resumenPage.drawText(String(dato.value), {
      x: margin + 300,
      y: yPos,
      size: 11,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}