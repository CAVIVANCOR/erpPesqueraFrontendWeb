// src/components/pagoCuentaPorPagar/VoucherConsolidadoPagoCxCPDF_V2.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ANCHOS DE COLUMNAS (en puntos)
// ════════════════════════════════════════════════════════════
/**
 * Anchos de columnas para las tablas del voucher consolidado
 * Los valores están en puntos (1 punto ≈ 0.35mm)
 * 
 * CÓMO MODIFICAR:
 * 1. Busca la tabla que quieres ajustar
 * 2. Modifica los valores del array
 * 3. Asegúrate que la suma coincida con el ancho total
 */
const COLUMN_WIDTHS = {
  // Tabla de Movimientos de Caja (SIN columna N°)
  // Ancho disponible: 595.28 - (20 × 2) = 555 puntos
  // [Id Mov. Caja, Tipo Movimiento, Cuenta, N° Oper., Monto]
  // ✅ AJUSTE: Cuenta +28.35pts (+1cm), N°Op -28.35pts (-1cm)
  movimientos: [50, 130, 228.35, 71.65, 75], // Total: 555 puntos
  
  // Tabla de Conceptos SUNAT - Detracción (CON columna N° Operación)
  // [Id Detracción, Base Imponible, Tasa, Monto Detracc., N° Constancia, N° Operación]
  detraccion: [40, 120, 60, 120, 100, 115], // Total: 555 puntos
  
  // Tabla de Conceptos SUNAT - Retención (CON columna N° Operación)
  // [Id Retención, Base Imponible, Tasa, Monto Retención, N° Constancia, N° Operación]
  retencion: [40, 120, 60, 120, 100, 115], // Total: 555 puntos
  
  // Tabla de Conceptos SUNAT - Percepción (CON columna N° Operación)
  // [Id Percepción, Base Imponible, Tasa, Monto Percepción, N° Constancia, N° Operación]
  percepcion: [40, 120, 60, 120, 100, 115], // Total: 555 puntos
};

/**
 * Genera un PDF del voucher consolidado de pago CxC y lo sube al servidor
 * VERSIÓN 2: Siguiendo el patrón del reporte de pesca
 */
export async function generarYSubirVoucherConsolidado(
  pagoCuentaPorPagar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorPagar,
  usuario = null  // ✅ NUEVO: Usuario que elabora el voucher
) {
  try {
    
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherConsolidado(
      pagoCuentaPorPagar,
      movimientos,
      conceptosSunat,
      resumen,
      empresa,
      cuentaPorPagar,
      usuario  // ✅ Pasar usuario
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("file", blob, `PAGO-CXP-VOUCHER-CONSOLIDADO-${pagoCuentaPorPagar.id}.pdf`);
    formData.append("moduleName", "pago-cxp-voucher-consolidado");
    formData.append("entityId", pagoCuentaPorPagar.id);

    // 4. Subir al servidor (usando /upload para PDFs generados)
    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al subir el PDF");
    }

    const resultado = await response.json();
    return {
      success: true,
      urlPdf: resultado.url,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Divide un texto en múltiples líneas según el ancho máximo
 * @param {string} text - Texto a dividir
 * @param {number} maxWidth - Ancho máximo en puntos
 * @param {object} font - Fuente PDF-lib
 * @param {number} fontSize - Tamaño de fuente
 * @returns {string[]} - Array de líneas
 */
function wrapText(text, maxWidth, font, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Genera el PDF del voucher consolidado
 */
async function generarPDFVoucherConsolidado(
  pagoCuentaPorPagar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorPagar,
  usuario = null  // ✅ Usuario que elabora el voucher
) {
  // ═══════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 20; // ✅ CORRECCIÓN 1: Reducido de 40 a 20 para usar todo el ancho
  const lineHeight = 15;
  const simboloMoneda = pagoCuentaPorPagar.monedaPago?.simbolo || "";

  // Cargar logo
  let logoImage = null;
  if (empresa?.logo && empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        if (empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 2. CREAR PRIMERA PÁGINA
  // ═══════════════════════════════════════════════════════════
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  let { width, height } = page.getSize();

  // ═══════════════════════════════════════════════════════════
  // 3. DIBUJAR ENCABEZADO COMPLETO
  // ═══════════════════════════════════════════════════════════
  let yPosition = await dibujarEncabezadoCompleto(
    page,
    logoImage,
    empresa,
    pagoCuentaPorPagar,
    cuentaPorPagar,
    width,
    height,
    margin,
    fontBold,
    fontNormal
  );

  // ═══════════════════════════════════════════════════════════
  // 4. PREPARAR DATOS DE MOVIMIENTOS (AGRUPACIÓN Y ORDENAMIENTO)
  // ═══════════════════════════════════════════════════════════
  const movimientosArray = prepararDatosMovimientos(
    movimientos,
    pagoCuentaPorPagar,
    cuentaPorPagar
  );

  // ═══════════════════════════════════════════════════════════
  // 5. VERIFICAR ESPACIO PARA TABLA DE MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════
  if (yPosition < 180) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = await dibujarEncabezadoCompleto(
      page,
      logoImage,
      empresa,
      pagoCuentaPorPagar,
      cuentaPorPagar,
      width,
      height,
      margin,
      fontBold,
      fontNormal
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 6. TÍTULO DE SECCIÓN: MOVIMIENTOS DE CAJA
  // ═══════════════════════════════════════════════════════════
  const tituloMovimientos = "DETALLE DE MOVIMIENTOS DE CAJA";
  const tituloMovWidth = fontBold.widthOfTextAtSize(tituloMovimientos, 10);
  page.drawText(tituloMovimientos, {
    x: (width - tituloMovWidth) / 2,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  // ═══════════════════════════════════════════════════════════
  // 7. DIBUJAR TABLA DE MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════
  // ✅ Usar anchos configurables (modificar en COLUMN_WIDTHS al inicio del archivo)
  const colWidths = COLUMN_WIDTHS.movimientos;
  const headers = ["Id Mov. Caja", "Tipo Movimiento", "Cuenta", "N° Oper.", "Monto"];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = (width - tableWidth) / 2;

  // Dibujar headers iniciales
  yPosition = dibujarHeadersTablaMovimientos(
    page,
    yPosition,
    colWidths,
    headers,
    tableWidth,
    tableStartX,
    fontBold
  );

  // Dibujar filas de movimientos
  let totalEgresos = 0;
  let totalSalidas = 0;

  for (let index = 0; index < movimientosArray.length; index++) {
    const mov = movimientosArray[index];
    
    // Verificar espacio en página
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = await dibujarEncabezadoCompleto(
        page,
        logoImage,
        empresa,
        pagoCuentaPorPagar,
        cuentaPorPagar,
        width,
        height,
        margin,
        fontBold,
        fontNormal
      );

      // Redibujar título y headers
      const tituloMov = "DETALLE DE MOVIMIENTOS DE CAJA";
      const tituloW = fontBold.widthOfTextAtSize(tituloMov, 10);
      page.drawText(tituloMov, {
        x: (width - tituloW) / 2,
        y: yPosition,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 8;
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      yPosition -= 15;

      yPosition = dibujarHeadersTablaMovimientos(
        page,
        yPosition,
        colWidths,
        headers,
        tableWidth,
        tableStartX,
        fontBold
      );
    }

    // Preparar datos de fila (SIN columna N°)
    const rowData = [
      mov.id ? mov.id.toString() : "-",
      mov.tipo,
      mov.cuenta || "-",
      mov.numeroOperacion || "-",
      formatearNumero(mov.monto || 0),
    ];

    // Calcular totales
    if (mov.esEgreso) {
      totalEgresos += Number(mov.monto || 0);
    } else {
      totalSalidas += Number(mov.monto || 0);
    }

    // Determinar estilo según tipo de movimiento
    const tipoLower = mov.tipo.toLowerCase();
    const esAutodetraccion = tipoLower.includes("autodet");
    const esImpuesto = tipoLower.includes("itf") || tipoLower.includes("comisión") || tipoLower.includes("comision");

    const fontToUse = esAutodetraccion ? fontBold : fontNormal;
    const colorToUse = esAutodetraccion
      ? rgb(0.0, 0.5, 0.0) // Verde para autodetracción
      : esImpuesto
        ? rgb(0.6, 0, 0) // Rojo para impuestos
        : rgb(0, 0, 0); // Negro normal

    // ✅ NUEVO: Dividir texto en múltiples líneas para columnas 1 (Tipo) y 2 (Cuenta)
    const cellLines = rowData.map((value, i) => {
      if (i === 1 || i === 2) {
        // Columnas "Tipo Movimiento" y "Cuenta" con word wrap
        return wrapText(value, colWidths[i] - 4, fontToUse, 6.5);
      } else {
        // Otras columnas: una sola línea (truncar si es necesario)
        let displayValue = value;
        const maxWidth = colWidths[i] - 4;
        while (
          fontToUse.widthOfTextAtSize(displayValue, 6.5) > maxWidth &&
          displayValue.length > 3
        ) {
          displayValue = displayValue.substring(0, displayValue.length - 1);
        }
        if (displayValue !== value && displayValue.length > 3) {
          displayValue = displayValue.substring(0, displayValue.length - 3) + "...";
        }
        return [displayValue];
      }
    });

    // ✅ Calcular altura de fila según la celda con más líneas
    const maxLines = Math.max(...cellLines.map(lines => lines.length));
    const lineHeightCell = 8;
    const rowHeight = maxLines * lineHeightCell + 4;

    // ✅ PASO 1: Dibujar fondo de la fila (PRIMERO, para que quede detrás del texto)
    const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
    const rowBottomY = yPosition - rowHeight + 2;
    page.drawRectangle({
      x: tableStartX,
      y: rowBottomY,
      width: tableWidth,
      height: rowHeight,
      color: bgColor,
    });

    // ✅ PASO 2: Dibujar texto de las celdas (SEGUNDO, para que quede encima del fondo)
    let xPos = tableStartX;
    for (let i = 0; i < cellLines.length; i++) {
      const lines = cellLines[i];
      
      // Dibujar cada línea de la celda
      lines.forEach((line, lineIndex) => {
        let textX;
        
        // ✅ Alineación horizontal según tipo de columna
        if (i === 3 || i === 4) {
          // N° Operación y Monto: alineados a la derecha
          const textWidth = fontToUse.widthOfTextAtSize(line, 6.5);
          textX = xPos + colWidths[i] - textWidth - 2;
        } else {
          // Id, Tipo, Cuenta: alineados a la izquierda
          textX = xPos + 2;
        }

        // ✅ Alineación vertical superior (top)
        const textY = yPosition - 2 - (lineIndex * lineHeightCell) - 6;

        page.drawText(line, {
          x: textX,
          y: textY,
          size: 6.5,
          font: fontToUse,
          color: colorToUse,
        });
      });

      xPos += colWidths[i];
    }

    // ✅ PASO 3: Dibujar bordes de la fila (TERCERO, para que queden encima de todo)
    // Líneas verticales
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPosition },
        end: { x: lineX, y: rowBottomY },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    // Línea horizontal inferior
    page.drawLine({
      start: { x: tableStartX, y: rowBottomY },
      end: { x: tableStartX + tableWidth, y: rowBottomY },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    // ✅ PASO 4: Actualizar yPosition para la siguiente fila
    yPosition = rowBottomY; // Mover yPosition al fondo de esta fila
  }

  // ═══════════════════════════════════════════════════════════
  // 8. FILA DE TOTALES
  // ═══════════════════════════════════════════════════════════
  // ✅ yPosition ya está en el fondo de la última fila, no restar nada
  const totalRowHeight = 20;
  const totalRowBottomY = yPosition - totalRowHeight;

  // ✅ PASO 1: Dibujar fondo celeste del total
  page.drawRectangle({
    x: tableStartX,
    y: totalRowBottomY,
    width: tableWidth,
    height: totalRowHeight,
    color: rgb(0.72, 0.87, 0.97),
  });

  // ✅ PASO 2: Dibujar texto del total (centrado verticalmente en el rectángulo)
  const totalTextY = totalRowBottomY + (totalRowHeight / 2) - 3;
  
  // Texto "TOTALES" centrado en columna "Cuenta" (índice 2)
  const xInicioColCuenta = colWidths.slice(0, 2).reduce((a, b) => a + b, 0);
  const totalesLabel = "TOTALES";
  const totalesLabelWidth = fontBold.widthOfTextAtSize(totalesLabel, 8);
  page.drawText(totalesLabel, {
    x: tableStartX + xInicioColCuenta + (colWidths[2] - totalesLabelWidth) / 2,
    y: totalTextY,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total monto alineado a la derecha en columna "Monto" (índice 4)
  const totalMontoText = formatearNumero(totalEgresos);
  const totalMontoWidth = fontBold.widthOfTextAtSize(totalMontoText, 8);
  const xInicioMonto = colWidths.slice(0, 4).reduce((a, b) => a + b, 0);
  page.drawText(totalMontoText, {
    x: tableStartX + xInicioMonto + colWidths[4] - totalMontoWidth - 2,
    y: totalTextY,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ✅ PASO 3: Dibujar bordes del total
  let lineXTot = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineXTot, y: yPosition },
      end: { x: lineXTot, y: totalRowBottomY },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineXTot += colWidths[i];
  }

  // ✅ PASO 4: Actualizar yPosition para el siguiente elemento
  yPosition = totalRowBottomY - 10; // Dejar 10 puntos de espacio después del total

  // ═══════════════════════════════════════════════════════════
  // 9. CONCEPTOS SUNAT (si existen) - ✅ CORRECCIÓN 4: Formato horizontal con tabla
  // ═══════════════════════════════════════════════════════════
  if (conceptosSunat?.detraccion || conceptosSunat?.retencion || conceptosSunat?.percepcion) {
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = await dibujarEncabezadoCompleto(
        page,
        logoImage,
        empresa,
        pagoCuentaPorPagar,
        cuentaPorPagar,
        width,
        height,
        margin,
        fontBold,
        fontNormal
      );
    }

    const tituloSunat = "CONCEPTOS SUNAT APLICADOS";
    const tituloSunatWidth = fontBold.widthOfTextAtSize(tituloSunat, 10);
    page.drawText(tituloSunat, {
      x: (width - tituloSunatWidth) / 2,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;

    // ✅ TABLA HORIZONTAL CON GRIDLINES - DINÁMICA
    const tableStartX = margin;
    const tableWidth = width - 2 * margin;
    const rowHeight = 18;

    // Determinar tipo de concepto y headers dinámicos
    let tipoConcepto = "";
    let headersSunat = [];
    let dataRow = [];
    let colWidthsSunat = [];

    if (conceptosSunat.detraccion) {
      const det = conceptosSunat.detraccion;
      tipoConcepto = "DETRACCIÓN";
      headersSunat = ["Id Detracción", "Base Imponible", "Tasa", "Monto Detracc.", "N° Constancia", "N° Operación"];
      // ✅ Usar anchos configurables (modificar en COLUMN_WIDTHS al inicio del archivo)
      colWidthsSunat = COLUMN_WIDTHS.detraccion;
      dataRow = [
        det.id.toString(),
        `${simboloMoneda} ${formatearNumero(det.importeTotal || 0)}`,
        `${det.tasaDetraccion || 0}%`,
        `${simboloMoneda} ${formatearNumero(det.importeRequerido || 0)}`,
        pagoCuentaPorPagar.numeroConstanciaDetraccion || "-",
        pagoCuentaPorPagar.numeroOperacion || "-",
      ];
    } else if (conceptosSunat.retencion) {
      const ret = conceptosSunat.retencion;
      tipoConcepto = "RETENCIÓN";
      headersSunat = ["Id Retención", "Base Imponible", "Tasa", "Monto Retención", "N° Constancia", "N° Operación"];
      // ✅ Usar anchos configurables (modificar en COLUMN_WIDTHS al inicio del archivo)
      colWidthsSunat = COLUMN_WIDTHS.retencion;
      dataRow = [
        ret.id.toString(),
        `${simboloMoneda} ${formatearNumero(ret.importeTotal || 0)}`,
        `${ret.tasaRetencion || 0}%`,
        `${simboloMoneda} ${formatearNumero(ret.importeRetenido || 0)}`,
        pagoCuentaPorPagar.numeroComprobanteRetencion || "-",
        pagoCuentaPorPagar.numeroOperacion || "-",
      ];
    } else if (conceptosSunat.percepcion) {
      const per = conceptosSunat.percepcion;
      tipoConcepto = "PERCEPCIÓN";
      headersSunat = ["Id Percepción", "Base Imponible", "Tasa", "Monto Percepción", "N° Constancia", "N° Operación"];
      // ✅ Usar anchos configurables (modificar en COLUMN_WIDTHS al inicio del archivo)
      colWidthsSunat = COLUMN_WIDTHS.percepcion;
      dataRow = [
        per.id.toString(),
        `${simboloMoneda} ${formatearNumero(per.importeTotal || 0)}`,
        `${per.tasaPercepcion || 0}%`,
        `${simboloMoneda} ${formatearNumero(per.importePercibido || 0)}`,
        pagoCuentaPorPagar.numeroComprobantePercepcion || "-",
        pagoCuentaPorPagar.numeroOperacion || "-",
      ];
    }

    // Dibujar tabla
    if (headersSunat.length > 0) {
      // Header background
      page.drawRectangle({
        x: tableStartX,
        y: yPosition - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.72, 0.87, 0.97),
      });

      // Línea horizontal superior
      page.drawLine({
        start: { x: tableStartX, y: yPosition },
        end: { x: tableStartX + tableWidth, y: yPosition },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Headers
      let xPos = tableStartX;
      headersSunat.forEach((header, i) => {
        // Centrar texto en la columna
        const headerWidth = fontBold.widthOfTextAtSize(header, 7.5);
        const textX = xPos + (colWidthsSunat[i] - headerWidth) / 2;
        page.drawText(header, {
          x: textX,
          y: yPosition - 13,
          size: 7.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        // Línea vertical
        page.drawLine({
          start: { x: xPos, y: yPosition },
          end: { x: xPos, y: yPosition - rowHeight },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
        xPos += colWidthsSunat[i];
      });
      
      // Última línea vertical
      page.drawLine({
        start: { x: xPos, y: yPosition },
        end: { x: xPos, y: yPosition - rowHeight },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      yPosition -= rowHeight;

      // Línea horizontal entre header y data
      page.drawLine({
        start: { x: tableStartX, y: yPosition },
        end: { x: tableStartX + tableWidth, y: yPosition },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Data row
      xPos = tableStartX;
      dataRow.forEach((data, i) => {
        // ✅ Alineación según tipo de columna
        let textX;
        if (i === 1 || i === 2 || i === 3) {
          // Base Imponible, Tasa, Monto: alineados a la derecha
          const textWidth = fontNormal.widthOfTextAtSize(data, 7);
          textX = xPos + colWidthsSunat[i] - textWidth - 3;
        } else {
          // Id, N° Constancia, N° Operación: alineados a la izquierda
          textX = xPos + 3;
        }

        page.drawText(data, {
          x: textX,
          y: yPosition - 13,
          size: 7,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        // Línea vertical
        page.drawLine({
          start: { x: xPos, y: yPosition },
          end: { x: xPos, y: yPosition - rowHeight },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
        xPos += colWidthsSunat[i];
      });

      // Última línea vertical
      page.drawLine({
        start: { x: xPos, y: yPosition },
        end: { x: xPos, y: yPosition - rowHeight },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      yPosition -= rowHeight;

      // Línea horizontal inferior
      page.drawLine({
        start: { x: tableStartX, y: yPosition },
        end: { x: tableStartX + tableWidth, y: yPosition },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    yPosition -= 10;
  }

  // ═══════════════════════════════════════════════════════════
  // 10. RESUMEN FINANCIERO
  // ═══════════════════════════════════════════════════════════
  if (yPosition < 200) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = await dibujarEncabezadoCompleto(
      page,
      logoImage,
      empresa,
      pagoCuentaPorPagar,
      cuentaPorPagar,
      width,
      height,
      margin,
      fontBold,
      fontNormal
    );
  }

  // ✅ SECCIÓN ELIMINADA: "RESUMEN DE LA OPERACIÓN" (redundante con tabla de movimientos)
  // El detalle completo ya está en la tabla "DETALLE DE MOVIMIENTOS DE CAJA"

  // ═══════════════════════════════════════════════════════════
  // 11. FIRMAS EN FOOTER (FORMATO TABLA)
  // ═══════════════════════════════════════════════════════════
  // ✅ Posicionar firmas en el footer (parte inferior de la página)
  const footerY = 120; // Posición fija en el footer
  const firmaTableWidth = width - 2 * margin; // Ancho total disponible
  const colWidthsFirma = [
    firmaTableWidth * 0.25, // Elaborado por (25%)
    firmaTableWidth * 0.25, // V°B° Admin (25%)
    firmaTableWidth * 0.25, // V°B° Contador (25%)
    firmaTableWidth * 0.25, // Recibí conforme (25%)
  ];
  const firmaTableStartX = margin;

  // Obtener nombre completo del usuario
  const nombreUsuario = usuario 
    ? `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario'
    : 'Usuario';

  // Dibujar borde superior de la tabla
  page.drawLine({
    start: { x: firmaTableStartX, y: footerY + 40 },
    end: { x: firmaTableStartX + firmaTableWidth, y: footerY + 40 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Dibujar borde inferior de la tabla
  page.drawLine({
    start: { x: firmaTableStartX, y: footerY },
    end: { x: firmaTableStartX + firmaTableWidth, y: footerY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Dibujar bordes verticales y contenido
  let xPos = firmaTableStartX;
  const firmaLabels = [
    { label: "Elaborado por", linea: nombreUsuario },
    { label: "V°B° Admin", linea: "___________" },
    { label: "V°B° Contador", linea: "___________" },
    { label: "Recibí conforme", linea: "DNI: _________" },
  ];

  firmaLabels.forEach((firma, index) => {
    // Borde izquierdo de la celda
    page.drawLine({
      start: { x: xPos, y: footerY },
      end: { x: xPos, y: footerY + 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Etiqueta (centrada, parte superior)
    const labelWidth = fontBold.widthOfTextAtSize(firma.label, 8);
    page.drawText(firma.label, {
      x: xPos + (colWidthsFirma[index] - labelWidth) / 2,
      y: footerY + 25,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Línea de firma o nombre (centrada, parte inferior)
    const lineaWidth = fontNormal.widthOfTextAtSize(firma.linea, 7);
    page.drawText(firma.linea, {
      x: xPos + (colWidthsFirma[index] - lineaWidth) / 2,
      y: footerY + 8,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    xPos += colWidthsFirma[index];
  });

  // Borde derecho final
  page.drawLine({
    start: { x: xPos, y: footerY },
    end: { x: xPos, y: footerY + 40 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Pie de página (debajo de la tabla de firmas)
  const fechaGeneracion = new Date().toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const piePagina = `Documento generado automáticamente - ${fechaGeneracion}`;
  const pieWidth = fontNormal.widthOfTextAtSize(piePagina, 7);

  page.drawText(piePagina, {
    x: (width - pieWidth) / 2,
    y: footerY - 15,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ═══════════════════════════════════════════════════════════
  // 12. SERIALIZAR Y RETORNAR
  // ═══════════════════════════════════════════════════════════
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Dibuja el encabezado completo del voucher (logo + empresa + título + datos)
 */
async function dibujarEncabezadoCompleto(
  page,
  logoImage,
  empresa,
  pagoCuentaPorPagar,
  cuentaPorPagar,
  width,
  height,
  margin,
  fontBold,
  fontNormal
) {
  let yPos = height - 40;

  // Logo
  if (logoImage) {
    const logoDims = logoImage.size();
    const maxLogoWidth = 80;
    const aspectRatio = logoDims.width / logoDims.height;
    const finalWidth = maxLogoWidth;
    const finalHeight = maxLogoWidth / aspectRatio;

    page.drawImage(logoImage, {
      x: margin,
      y: yPos - finalHeight,
      width: finalWidth,
      height: finalHeight,
    });
  }

  // Datos de empresa
  const empresaNombre = empresa?.razonSocial || "EMPRESA";
  page.drawText(empresaNombre, {
    x: margin + 90,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 13;

  const rucTexto = `RUC: ${empresa?.ruc || "-"}`;
  page.drawText(rucTexto, {
    x: margin + 90,
    y: yPos,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPos -= 13;

  if (empresa?.direccion) {
    const direccionTexto = `Direccion: ${empresa.direccion}`;
    page.drawText(direccionTexto, {
      x: margin + 90,
      y: yPos,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
  }

  yPos -= 10;

  // Título del documento
  const titulo = "VOUCHER CONSOLIDADO DE PAGO - CUENTA POR PAGAR";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
  page.drawText(titulo, {
    x: (width - tituloWidth) / 2,
    y: yPos,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 18;

  const numeroVoucher = `N° VOUCHER: ${pagoCuentaPorPagar.id || "-"}`;
  const numeroWidth = fontBold.widthOfTextAtSize(numeroVoucher, 10);
  page.drawText(numeroVoucher, {
    x: (width - numeroWidth) / 2,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 25;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 15;

  // Datos del documento y pago (2 columnas)
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const col1X = margin;
  const col2X = width / 2 + 76; // ✅ CORRECCIÓN 2: Aumentado de +20 a +76 (2cm más a la derecha)
  let yPosCol1 = yPos;
  let yPosCol2 = yPos;

  // Columna 1: Datos del documento
  page.drawText("DATOS DEL DOCUMENTO", {
    x: col1X,
    y: yPosCol1,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosCol1 -= 12;

  const datosCol1 = [
    ["Proveedor:", cuentaPorPagar?.proveedor?.razonSocial || "-"],
    ["RUC:", cuentaPorPagar?.proveedor?.numeroDocumento || "-"],
    ["Documento:", cuentaPorPagar?.ordenCompra?.numeroDocumentoFinal || "-"],
    ["Fecha Emisión:", formatearFecha(cuentaPorPagar?.fechaEmision)],
  ];

  datosCol1.forEach(([label, value]) => {
    page.drawText(label, {
      x: col1X,
      y: yPosCol1,
      size: 7.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: col1X + 75,
      y: yPosCol1,
      size: 7.5,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol1 -= 12;
  });

  // Columna 2: Datos del pago
  page.drawText("DATOS DEL PAGO", {
    x: col2X,
    y: yPosCol2,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosCol2 -= 12;

  const datosCol2 = [
    ["Fecha Pago:", formatearFecha(pagoCuentaPorPagar.fechaPago)],
    ["Medio de Pago:", pagoCuentaPorPagar.medioPago?.nombre || "-"],
    ["N° Operación:", pagoCuentaPorPagar.numeroOperacion || "-"],
    ["Tipo de Cambio:", `S/ ${Number(pagoCuentaPorPagar.tipoCambio || 1).toFixed(4)}`],
  ];

  datosCol2.forEach(([label, value]) => {
    page.drawText(label, {
      x: col2X,
      y: yPosCol2,
      size: 7.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: col2X + 85,
      y: yPosCol2,
      size: 7.5,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol2 -= 12;
  });

  yPos = Math.min(yPosCol1, yPosCol2) - 10;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 15;

  return yPos;
}

/**
 * Función helper para dibujar headers de tabla de movimientos
 */
function dibujarHeadersTablaMovimientos(
  page,
  yPos,
  colWidths,
  headers,
  tableWidth,
  tableStartX,
  fontBold
) {
  // Fondo celeste (igual que reporte de pesca)
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.72, 0.87, 0.97),
  });

  // Headers centrados
  let xPos = tableStartX;
  headers.forEach((header, i) => {
    const headerWidth = fontBold.widthOfTextAtSize(header, 7);
    const textX = xPos + (colWidths[i] - headerWidth) / 2;
    page.drawText(header, {
      x: textX,
      y: yPos,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales
  let lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }

  return yPos - 23; // ✅ Aumentado de 20 a 23 para dar espacio a las filas
}

/**
 * Prepara los datos de movimientos para la tabla
 */
function prepararDatosMovimientos(movimientos, pagoCuentaPorPagar, cuentaPorPagar) {
  const movimientosArray = [];

  // Helper para formatear cuenta completa
  const formatearCuentaCompleta = (cuentaCorriente) => {
    if (!cuentaCorriente) return "-";
    
    const partes = [];
    if (cuentaCorriente.banco?.nombreCorto || cuentaCorriente.banco?.nombre) {
      partes.push(cuentaCorriente.banco.nombreCorto || cuentaCorriente.banco.nombre);
    }
    if (cuentaCorriente.moneda?.codigoSunat) {
      partes.push(cuentaCorriente.moneda.codigoSunat);
    }
    if (cuentaCorriente.descripcion) {
      partes.push(cuentaCorriente.descripcion);
    }
    if (cuentaCorriente.numeroCuenta) {
      partes.push(cuentaCorriente.numeroCuenta);
    }
    
    return partes.length > 0 ? partes.join(" - ") : "-";
  };

  // 1. Pago principal (egreso)
  if (movimientos.egreso) {
    movimientosArray.push({
      tipo: movimientos.egreso.tipoMovimiento?.nombre || "",
      id: movimientos.egreso.id,
      monto: movimientos.egreso.monto,
      cuenta: formatearCuentaCompleta(movimientos.egreso.cuentaCorrienteDestino),
      numeroOperacion: pagoCuentaPorPagar.numeroOperacion || "-",
      esEgreso: true,
      orden: 1,
    });
  }

  // 2. ITF (salida) - USA ORIGEN
  if (movimientos.itf) {
    const cuentaITF = movimientos.itf.cuentaCorrienteOrigen || movimientos.egreso?.cuentaCorrienteDestino;
    movimientosArray.push({
      tipo: movimientos.itf.tipoMovimiento?.nombre || "",
      id: movimientos.itf.id,
      monto: movimientos.itf.monto,
      cuenta: formatearCuentaCompleta(cuentaITF, 'ITF'),
      numeroOperacion: pagoCuentaPorPagar.numeroOperacion || "-",
      esEgreso: false,
      orden: 2,
    });
  }

  // 3. Comisión bancaria (salida) - USA ORIGEN
  if (movimientos.comision) {
    const cuentaComision = movimientos.comision.cuentaCorrienteOrigen || movimientos.egreso?.cuentaCorrienteDestino;
    movimientosArray.push({
      tipo: movimientos.comision.tipoMovimiento?.nombre || "",
      id: movimientos.comision.id,
      monto: movimientos.comision.monto,
      cuenta: formatearCuentaCompleta(cuentaComision, 'COMISION'),
      numeroOperacion: pagoCuentaPorPagar.numeroOperacion || "-",
      esEgreso: false,
      orden: 3,
    });
  }

  // 4. Autodetracción (NUEVO: 1 solo movimiento transferencia) - USA ORIGEN Y DESTINO
  if (movimientos.autodetraccion) {
    const cuentaOrigen = movimientos.autodetraccion.cuentaCorrienteOrigen;
    const cuentaDestino = movimientos.autodetraccion.cuentaCorrienteDestino;
    
    // Mostrar como transferencia: Origen -> Destino
    const cuentaTexto = `${formatearCuentaCompleta(cuentaOrigen, 'AUTODET-ORIGEN')} -> ${formatearCuentaCompleta(cuentaDestino, 'AUTODET-DESTINO')}`;
    
    movimientosArray.push({
      tipo: movimientos.autodetraccion.tipoMovimiento?.nombre || "Autodetracción",
      id: movimientos.autodetraccion.id,
      monto: movimientos.autodetraccion.monto,
      cuenta: cuentaTexto,
      numeroOperacion: movimientos.autodetraccion.numeroOperacionPagoBancoImpuesto || "-",
      esEgreso: false, // Es una transferencia
      orden: 4,
    });
  }

  // 6. Detracción egreso (si el proveedor pagó la detracción) - USA ORIGEN
  if (movimientos.detraccionEgreso) {
    const cuentaDetraccionBN = movimientos.detraccionEgreso.cuentaCorrienteOrigen;
    movimientosArray.push({
      tipo: movimientos.detraccionEgreso.tipoMovimiento?.nombre || "",
      id: movimientos.detraccionEgreso.id,
      monto: movimientos.detraccionEgreso.monto,
      cuenta: formatearCuentaCompleta(cuentaDetraccionBN, 'DETRACCION-EGRESO'),
      numeroOperacion: movimientos.detraccionEgreso.numeroOperacionPagoBancoImpuesto || "-",
      esEgreso: true,
      orden: 6,
    });
  }

  // 7. ITF Detracción (salida) - USA ORIGEN
  if (movimientos.itfDetraccion) {
    const cuentaITFDetraccion = movimientos.itfDetraccion.cuentaCorrienteOrigen || movimientos.detraccionEgreso?.cuentaCorrienteOrigen;
    movimientosArray.push({
      tipo: movimientos.itfDetraccion.tipoMovimiento?.nombre || "",
      id: movimientos.itfDetraccion.id,
      monto: movimientos.itfDetraccion.monto,
      cuenta: formatearCuentaCompleta(cuentaITFDetraccion, 'ITF-DETRACCION'),
      numeroOperacion: movimientos.detraccionEgreso?.numeroOperacionPagoBancoImpuesto || "-",
      esEgreso: false,
      orden: 7,
    });
  }

  // 8. Comisión Detracción (salida) - USA ORIGEN
  if (movimientos.comisionDetraccion) {
    const cuentaComisionDetraccion = movimientos.comisionDetraccion.cuentaCorrienteOrigen || movimientos.detraccionEgreso?.cuentaCorrienteOrigen;
    movimientosArray.push({
      tipo: movimientos.comisionDetraccion.tipoMovimiento?.nombre || "",
      id: movimientos.comisionDetraccion.id,
      monto: movimientos.comisionDetraccion.monto,
      cuenta: formatearCuentaCompleta(cuentaComisionDetraccion, 'COMISION-DETRACCION'),
      numeroOperacion: movimientos.detraccionEgreso?.numeroOperacionPagoBancoImpuesto || "-",
      esEgreso: false,
      orden: 8,
    });
  }

  // Ordenar por prioridad
  movimientosArray.sort((a, b) => a.orden - b.orden);

  return movimientosArray;
}
