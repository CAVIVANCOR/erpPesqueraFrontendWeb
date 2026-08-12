import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ANEXOS_DISPONIBLES, getAnexoConfig, getCuentasParaAnexo, procesarDatosAnexo } from "../../../pages/contabilidad/anexosConfig";

export async function generarBalanceGeneralPDF(data) {
  const { empresa, periodo, moneda, cuentas, totales, arbolActivo, arbolPasivoPatrimonio } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 30;
  const pageWidth = 841.89; // A4 Landscape
  const pageHeight = 595.28;
  const usableWidth = pageWidth - 2 * margin;

  // ========================================
  // PÁGINA 1: BALANCE GENERAL PRINCIPAL
  // ========================================
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Función para dibujar texto centrado
  const drawCentered = (text, y, size, font) => {
    const width = font.widthOfTextAtSize(text, size);
    currentPage.drawText(text, {
      x: (pageWidth - width) / 2,
      y: y,
      size: size,
      font: font,
    });
  };

  // Encabezado
  drawCentered(empresa?.razonSocial || 'EMPRESA', yPosition, 12, fontBold);
  yPosition -= 16;
  
  drawCentered(`RUC ${empresa?.ruc || ''}`, yPosition, 10, fontNormal);
  yPosition -= 16;
  
  drawCentered('BALANCE GENERAL', yPosition, 11, fontBold);
  yPosition -= 16;
  
  drawCentered(`Al ${periodo?.nombrePeriodo || ''}`, yPosition, 9, fontNormal);
  yPosition -= 14;
  
  drawCentered(`(Expresado en ${moneda?.nombreLargo || 'Soles'})`, yPosition, 8, fontNormal);
  yPosition -= 30;

  // Configuración de columnas
  const colWidth = (usableWidth - 20) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 20;

  // HEADERS PRINCIPALES
  currentPage.drawRectangle({
    x: leftX,
    y: yPosition,
    width: colWidth,
    height: -18,
    color: rgb(0.09, 0.46, 0.76),
  });

  currentPage.drawText("ACTIVO", {
    x: leftX + 5,
    y: yPosition - 13,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  currentPage.drawRectangle({
    x: rightX,
    y: yPosition,
    width: colWidth,
    height: -18,
    color: rgb(0.09, 0.46, 0.76),
  });

  currentPage.drawText("PASIVO Y PATRIMONIO", {
    x: rightX + 5,
    y: yPosition - 13,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  yPosition -= 22;

  // SUB-HEADERS
  const colDenom = 0.50;
  const colAnexo = 0.25;
  const colMonto = 0.25;

  currentPage.drawRectangle({
    x: leftX,
    y: yPosition,
    width: colWidth,
    height: -14,
    color: rgb(0.89, 0.95, 0.99),
  });

  currentPage.drawText("Denominación", {
    x: leftX + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  currentPage.drawText("Anexo", {
    x: leftX + colWidth * colDenom + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  currentPage.drawText("Monto", {
    x: leftX + colWidth * (colDenom + colAnexo) + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  currentPage.drawRectangle({
    x: rightX,
    y: yPosition,
    width: colWidth,
    height: -14,
    color: rgb(0.89, 0.95, 0.99),
  });

  currentPage.drawText("Denominación", {
    x: rightX + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  currentPage.drawText("Anexo", {
    x: rightX + colWidth * colDenom + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  currentPage.drawText("Monto", {
    x: rightX + colWidth * (colDenom + colAnexo) + 3,
    y: yPosition - 10,
    size: 7,
    font: fontBold
  });

  yPosition -= 25;

  // Función para escribir árbol
  const writeTree = (nodes, baseX, startY) => {
    let currentY = startY;
    
    const writeNode = (node, level = 0) => {
      if (currentY < 60) return currentY;
      
      const indent = level * 8;
      let fontSize = 7;
      let font = fontNormal;
      let spacing = 11;
      
      if (node.data.nivel === 'clasificacion') {
        fontSize = 8;
        font = fontBold;
        spacing = 13;
      }
      
      // Denominación
      const denom = node.data.denominacion || '';
      const maxLen = Math.floor((colWidth * colDenom - indent - 10) / (fontSize * 0.5));
      const denomText = denom.length > maxLen ? denom.substring(0, maxLen - 3) + '...' : denom;
      
      currentPage.drawText(denomText, {
        x: baseX + indent + 3,
        y: currentY,
        size: fontSize,
        font: font,
        color: node.data.nivel === 'clasificacion' ? rgb(0.09, 0.40, 0.75) : rgb(0, 0, 0)
      });
      
      // Anexo
      if (node.data.anexo) {
        currentPage.drawText(`Anexo ${node.data.anexo}`, {
          x: baseX + colWidth * colDenom + 3,
          y: currentY,
          size: 6,
          font: fontNormal,
          color: rgb(0.38, 0.38, 0.38)
        });
      }
      
      // Monto
      if (node.data.monto && Math.abs(node.data.monto) >= 0.01) {
        const montoText = node.data.monto.toLocaleString("es-PE", { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
        const montoW = font.widthOfTextAtSize(montoText, fontSize);
        
        currentPage.drawText(montoText, {
          x: baseX + colWidth - montoW - 3,
          y: currentY,
          size: fontSize,
          font: font
        });
      }
      
      currentY -= spacing;
      
      // Hijos
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          currentY = writeNode(child, level + 1);
          if (currentY < 60) break;
        }
      }
      
      return currentY;
    };
    
    for (const node of nodes) {
      currentY = writeNode(node, 0);
      if (currentY < 60) break;
    }
    
    return currentY;
  };

  // Escribir datos
  const leftY = writeTree(arbolActivo || [], leftX, yPosition);
  const rightY = writeTree(arbolPasivoPatrimonio || [], rightX, yPosition);
  
  yPosition = Math.min(leftY, rightY) - 10;

  // TOTALES
  if (yPosition < 80) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
  }

  const totalActivo = arbolActivo?.reduce((sum, n) => sum + (n.data.monto || 0), 0) || 0;
  const totalPasivo = arbolPasivoPatrimonio?.reduce((sum, n) => sum + (n.data.monto || 0), 0) || 0;

  currentPage.drawRectangle({
    x: leftX,
    y: yPosition,
    width: colWidth,
    height: -18,
    color: rgb(1, 1, 0),
  });

  currentPage.drawText("TOTAL ACTIVO", {
    x: leftX + 5,
    y: yPosition - 13,
    size: 9,
    font: fontBold
  });

  const totalActivoText = totalActivo.toLocaleString("es-PE", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  const totalActivoW = fontBold.widthOfTextAtSize(totalActivoText, 9);
  currentPage.drawText(totalActivoText, {
    x: leftX + colWidth - totalActivoW - 5,
    y: yPosition - 13,
    size: 9,
    font: fontBold
  });

  currentPage.drawRectangle({
    x: rightX,
    y: yPosition,
    width: colWidth,
    height: -18,
    color: rgb(1, 1, 0),
  });

  currentPage.drawText("TOTAL PASIVO + PATRIMONIO", {
    x: rightX + 5,
    y: yPosition - 13,
    size: 9,
    font: fontBold
  });

  const totalPasivoText = totalPasivo.toLocaleString("es-PE", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  const totalPasivoW = fontBold.widthOfTextAtSize(totalPasivoText, 9);
  currentPage.drawText(totalPasivoText, {
    x: rightX + colWidth - totalPasivoW - 5,
    y: yPosition - 13,
    size: 9,
    font: fontBold
  });

  // ========================================
  // ANEXOS
  // ========================================

  for (const numeroAnexo of ANEXOS_DISPONIBLES) {
    const config = getAnexoConfig(numeroAnexo);
    if (!config) continue;

    const cuentasAnexo = getCuentasParaAnexo(numeroAnexo, cuentas);
    if (cuentasAnexo.length === 0) continue;

    const datosAnexo = procesarDatosAnexo(numeroAnexo, cuentasAnexo);
    if (datosAnexo.length === 0) continue;

    // Nueva página
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;

    // Encabezado
    drawCentered(empresa?.razonSocial || 'EMPRESA', yPosition, 11, fontBold);
    yPosition -= 15;
    
    drawCentered(`RUC ${empresa?.ruc || ''}`, yPosition, 9, fontNormal);
    yPosition -= 15;
    
    drawCentered('BALANCE GENERAL', yPosition, 10, fontBold);
    yPosition -= 14;
    
    drawCentered(`Al ${periodo?.nombrePeriodo || ''}`, yPosition, 8, fontNormal);
    yPosition -= 12;
    
    drawCentered('(Expresado en Soles)', yPosition, 7, fontNormal);
    yPosition -= 25;

    // Título
    currentPage.drawRectangle({
      x: margin,
      y: yPosition,
      width: usableWidth,
      height: -18,
      color: rgb(0.09, 0.46, 0.76),
    });

    const titulo = `ANEXO ${config.numero}`;
    const tituloW = fontBold.widthOfTextAtSize(titulo, 10);
    currentPage.drawText(titulo, {
      x: (pageWidth - tituloW) / 2,
      y: yPosition - 13,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1)
    });
    
    yPosition -= 25;

    const subtituloW = fontBold.widthOfTextAtSize(config.titulo, 9);
    currentPage.drawText(config.titulo, {
      x: (pageWidth - subtituloW) / 2,
      y: yPosition,
      size: 9,
      font: fontBold
    });
    yPosition -= 25;

    // Headers
    const numCols = config.columnas.length;
    const colW = usableWidth / numCols;

    currentPage.drawRectangle({
      x: margin,
      y: yPosition,
      width: usableWidth,
      height: -14,
      color: rgb(0.89, 0.95, 0.99),
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // Líneas verticales en headers
    for (let i = 1; i < numCols; i++) {
      currentPage.drawLine({
        start: { x: margin + (i * colW), y: yPosition },
        end: { x: margin + (i * colW), y: yPosition - 14 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
    }

    config.columnas.forEach((col, idx) => {
      currentPage.drawText(col.header, {
        x: margin + (idx * colW) + 5,
        y: yPosition - 10,
        size: 7,
        font: fontBold
      });
    });

    yPosition -= 35;

    // Datos
    let totalAnexo = 0;
    const rowHeight = 11;
    
    for (const row of datosAnexo) {
      if (yPosition < 60) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      // Dibujar rectángulo de fila (gridline horizontal)
      currentPage.drawRectangle({
        x: margin,
        y: yPosition + 2,
        width: usableWidth,
        height: -rowHeight,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      });

      // Dibujar líneas verticales para separar columnas
      for (let i = 1; i < numCols; i++) {
        currentPage.drawLine({
          start: { x: margin + (i * colW), y: yPosition + 2 },
          end: { x: margin + (i * colW), y: yPosition + 2 - rowHeight },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }

      config.columnas.forEach((col, idx) => {
        const val = row[col.field];
        const font = row.esGrupo ? fontBold : fontNormal;
        const size = 7;

        if (col.tipo === 'monto' || col.tipo === 'cantidad') {
          if (val !== null && val !== undefined && val !== '') {
            const text = Number(val).toLocaleString("es-PE", { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            });
            const w = font.widthOfTextAtSize(text, size);
            
            currentPage.drawText(text, {
              x: margin + ((idx + 1) * colW) - w - 5,
              y: yPosition - 6,
              size: size,
              font: font
            });

            if (col.field === 'saldo' || col.field === 'importe' || col.field === 'total' || col.field === 'costoTotal') {
              totalAnexo += Number(val) || 0;
            }
          }
        } else if (col.tipo === 'porcentaje') {
          if (val !== null && val !== undefined && val !== '') {
            const text = `${Number(val).toFixed(2)}%`;
            const w = font.widthOfTextAtSize(text, size);
            
            currentPage.drawText(text, {
              x: margin + ((idx + 1) * colW) - w - 5,
              y: yPosition - 6,
              size: size,
              font: font
            });
          }
        } else {
          const text = String(val || '');
          const maxChars = Math.floor((colW - 10) / (size * 0.5));
          const truncated = text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text;
          
          currentPage.drawText(truncated, {
            x: margin + (idx * colW) + 5,
            y: yPosition - 6,
            size: size,
            font: font
          });
        }
      });

      yPosition -= rowHeight;
    }

    yPosition -= 8;

    // Total
    currentPage.drawRectangle({
      x: margin,
      y: yPosition,
      width: usableWidth,
      height: -16,
      color: rgb(1, 1, 0),
    });

    currentPage.drawText("SALDO FINAL TOTAL", {
      x: margin + 5,
      y: yPosition - 11,
      size: 8,
      font: fontBold
    });

    const totalText = totalAnexo.toLocaleString("es-PE", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const totalW = fontBold.widthOfTextAtSize(totalText, 8);
    currentPage.drawText(totalText, {
      x: margin + usableWidth - totalW - 5,
      y: yPosition - 11,
      size: 8,
      font: fontBold
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
