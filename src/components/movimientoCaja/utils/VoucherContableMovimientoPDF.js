// src/components/movimientoCaja/utils/VoucherContableMovimientoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ANCHOS DE COLUMNAS (en puntos)
// ════════════════════════════════════════════════════════════
/**
 * Anchos de columnas para tabla de asientos contables
 * Total: 515 puntos (ancho disponible)
 */
const COLUMN_WIDTHS = {
  // Tabla de asientos: [Cuenta, Descripción, Debe, Haber]
  asientos: [80, 235, 100, 100], // Total: 515 puntos
};

/**
 * Genera un PDF del voucher contable (comprobante de diario) de un movimiento de caja
 * Patrón basado en VoucherIndividualMovimientoPDF.js
 * 
 * @param {Object} movimiento - Movimiento de caja con asiento contable
 * @param {Object} asientoContable - Asiento contable con detalles
 * @param {Object} empresa - Datos de la empresa
 * @param {Object} cuentaPorCobrar - Cuenta por cobrar relacionada
 * @param {Object} usuario - Usuario que genera el voucher
 * @returns {Promise<Object>} - { success, urlPdf } o { success, error }
 */
export async function generarYSubirVoucherContable(
  movimiento,
  asientoContable,
  empresa,
  cuentaPorCobrar,
  usuario = null
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherContable(
      movimiento,
      asientoContable,
      empresa,
      cuentaPorCobrar,
      usuario
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "movimiento-caja-voucher-contable");  // ✅ Módulo estándar para urlDocumentoMovCaja
    formData.append("entityId", movimiento.id);

    // 4. Subir al servidor
    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/merge`, {
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
    console.error("Error al generar y subir voucher contable:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF del voucher contable (comprobante de diario)
 */
async function generarPDFVoucherContable(
  movimiento,
  asientoContable,
  empresa,
  cuentaPorCobrar,
  usuario = null
) {
  // ═══════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 15;
  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // ═══════════════════════════════════════════════════════════
  // 2. HEADER - INFORMACIÓN DE LA EMPRESA
  // ═══════════════════════════════════════════════════════════
  // Logo (si existe)
  if (empresa?.urlLogo) {
    try {
      const logoResponse = await fetch(empresa.urlLogo);
      const logoBytes = await logoResponse.arrayBuffer();
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 60;
      const logoHeight = 60;
      page.drawImage(logoImage, {
        x: margin,
        y: yPosition - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      console.warn("No se pudo cargar el logo:", error);
    }
  }

  // Información de la empresa (derecha)
  const empresaX = pageWidth - margin - 200;
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: empresaX,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight;
  page.drawText(`RUC: ${empresa?.ruc || ""}`, {
    x: empresaX,
    y: yPosition,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight;
  page.drawText(empresa?.direccion || "", {
    x: empresaX,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // 3. TÍTULO DEL DOCUMENTO
  // ═══════════════════════════════════════════════════════════
  const titulo = "COMPROBANTE DE DIARIO";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
  page.drawText(titulo, {
    x: (pageWidth - tituloWidth) / 2,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight;

  // Número de asiento
  const numeroAsiento = asientoContable?.numeroAsiento || "N/A";
  const numeroWidth = fontBold.widthOfTextAtSize(numeroAsiento, 12);
  page.drawText(numeroAsiento, {
    x: (pageWidth - numeroWidth) / 2,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.8),
  });

  yPosition -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // 4. INFORMACIÓN DEL ASIENTO
  // ═══════════════════════════════════════════════════════════
  const infoStartY = yPosition;
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;

  // Columna 1
  page.drawText("Fecha:", {
    x: col1X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText(
    new Date(asientoContable?.fechaAsiento || movimiento.fechaOperacionMovCaja).toLocaleDateString("es-PE"),
    {
      x: col1X + 80,
      y: yPosition,
      size: 9,
      font: fontNormal,
    }
  );

  yPosition -= lineHeight;

  page.drawText("Tipo Libro:", {
    x: col1X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText(asientoContable?.tipoLibro || "DIARIO", {
    x: col1X + 80,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= lineHeight;

  page.drawText("Origen:", {
    x: col1X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText(asientoContable?.origenAsiento || "AUTOMATICO", {
    x: col1X + 80,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  // Columna 2
  yPosition = infoStartY;

  page.drawText("Moneda:", {
    x: col2X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText("SOLES (S/)", {
    x: col2X + 80,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= lineHeight;

  page.drawText("Tipo Cambio:", {
    x: col2X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText(formatearNumero(asientoContable?.tipoCambio || movimiento.tipoCambio, 3), {
    x: col2X + 80,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= lineHeight;

  page.drawText("Estado:", {
    x: col2X,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  page.drawText("PENDIENTE", {
    x: col2X + 80,
    y: yPosition,
    size: 9,
    font: fontNormal,
    color: rgb(0.8, 0.5, 0),
  });

  yPosition -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // 5. GLOSA
  // ═══════════════════════════════════════════════════════════
  page.drawText("Glosa:", {
    x: margin,
    y: yPosition,
    size: 9,
    font: fontBold,
  });

  yPosition -= lineHeight;

  const glosa = asientoContable?.glosa || movimiento.descripcion || "";
  const glosaLines = wrapText(glosa, 500, fontNormal, 9);
  
  for (const line of glosaLines) {
    page.drawText(line, {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= lineHeight;
  }

  yPosition -= lineHeight;

  // ═══════════════════════════════════════════════════════════
  // 6. TABLA DE ASIENTOS CONTABLES
  // ═══════════════════════════════════════════════════════════
  const tableStartY = yPosition;
  const tableWidth = COLUMN_WIDTHS.asientos.reduce((a, b) => a + b, 0);
  const tableX = margin;

  // Header de la tabla
  const headerHeight = 25;
  const headerY = yPosition;

  // Fondo del header
  page.drawRectangle({
    x: tableX,
    y: headerY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: rgb(0.2, 0.3, 0.5),
  });

  // Textos del header
  const headers = ["Cuenta", "Descripción", "Debe", "Haber"];
  let currentX = tableX;

  headers.forEach((header, index) => {
    const headerText = header;
    const headerWidth = COLUMN_WIDTHS.asientos[index];
    const textWidth = fontBold.widthOfTextAtSize(headerText, 9);
    const textX = currentX + (headerWidth - textWidth) / 2;

    page.drawText(headerText, {
      x: textX,
      y: headerY - 15,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentX += headerWidth;
  });

  yPosition = headerY - headerHeight - 5;

  // Detalles del asiento
  const detalles = asientoContable?.detalles || [];
  let totalDebe = 0;
  let totalHaber = 0;

  for (const detalle of detalles) {
    const debe = Number(detalle.debe || 0);
    const haber = Number(detalle.haber || 0);
    totalDebe += debe;
    totalHaber += haber;

    const codigoCuenta = detalle.planCuenta?.codigoCuenta || "";
    const nombreCuenta = detalle.planCuenta?.nombreCuenta || "";
    const glosaDetalle = detalle.glosa || "";

    // Fila
    const rowHeight = 20;
    
    // Cuenta
    page.drawText(codigoCuenta, {
      x: tableX + 5,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    // Descripción (wrap si es necesario)
    const descLines = wrapText(nombreCuenta, COLUMN_WIDTHS.asientos[1] - 10, fontNormal, 8);
    page.drawText(descLines[0] || "", {
      x: tableX + COLUMN_WIDTHS.asientos[0] + 5,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    // Debe
    const debeText = debe > 0 ? formatearNumero(debe, 2) : "";
    const debeWidth = fontNormal.widthOfTextAtSize(debeText, 8);
    page.drawText(debeText, {
      x: tableX + COLUMN_WIDTHS.asientos[0] + COLUMN_WIDTHS.asientos[1] + COLUMN_WIDTHS.asientos[2] - debeWidth - 5,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    // Haber
    const haberText = haber > 0 ? formatearNumero(haber, 2) : "";
    const haberWidth = fontNormal.widthOfTextAtSize(haberText, 8);
    page.drawText(haberText, {
      x: tableX + tableWidth - haberWidth - 5,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    yPosition -= rowHeight;

    // Línea separadora
    page.drawLine({
      start: { x: tableX, y: yPosition + 5 },
      end: { x: tableX + tableWidth, y: yPosition + 5 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
  }

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 7. TOTALES
  // ═══════════════════════════════════════════════════════════
  // Fondo de totales
  page.drawRectangle({
    x: tableX,
    y: yPosition - 20,
    width: tableWidth,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("TOTALES:", {
    x: tableX + 5,
    y: yPosition - 15,
    size: 9,
    font: fontBold,
  });

  // Total Debe
  const totalDebeText = formatearNumero(totalDebe, 2);
  const totalDebeWidth = fontBold.widthOfTextAtSize(totalDebeText, 9);
  page.drawText(totalDebeText, {
    x: tableX + COLUMN_WIDTHS.asientos[0] + COLUMN_WIDTHS.asientos[1] + COLUMN_WIDTHS.asientos[2] - totalDebeWidth - 5,
    y: yPosition - 15,
    size: 9,
    font: fontBold,
  });

  // Total Haber
  const totalHaberText = formatearNumero(totalHaber, 2);
  const totalHaberWidth = fontBold.widthOfTextAtSize(totalHaberText, 9);
  page.drawText(totalHaberText, {
    x: tableX + tableWidth - totalHaberWidth - 5,
    y: yPosition - 15,
    size: 9,
    font: fontBold,
  });

  yPosition -= 40;

  // ═══════════════════════════════════════════════════════════
  // 8. VALIDACIÓN DE CUADRE
  // ═══════════════════════════════════════════════════════════
  const diferencia = Math.abs(totalDebe - totalHaber);
  const estaCuadrado = diferencia < 0.01;

  const cuadreText = estaCuadrado ? "✓ ASIENTO CUADRADO" : "✗ ASIENTO DESCUADRADO";
  const cuadreColor = estaCuadrado ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);

  page.drawText(cuadreText, {
    x: margin,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: cuadreColor,
  });

  if (!estaCuadrado) {
    yPosition -= lineHeight;
    page.drawText(`Diferencia: S/ ${formatearNumero(diferencia, 2)}`, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0.8, 0, 0),
    });
  }

  yPosition -= lineHeight * 3;

  // ═══════════════════════════════════════════════════════════
  // 9. INFORMACIÓN DEL DOCUMENTO ORIGEN
  // ═══════════════════════════════════════════════════════════
  if (cuentaPorCobrar?.preFactura) {
    page.drawText("Documento Origen:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });

    yPosition -= lineHeight;

    const tipoDoc = cuentaPorCobrar.preFactura.tipoDocumento?.nombre || "FACTURA";
    const numeroDoc = cuentaPorCobrar.preFactura.numeroDocumentoFinal || "";
    const cliente = cuentaPorCobrar.cliente?.razonSocial || "";

    page.drawText(`${tipoDoc}: ${numeroDoc}`, {
      x: margin + 10,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    yPosition -= lineHeight;

    page.drawText(`Cliente: ${cliente}`, {
      x: margin + 10,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });

    yPosition -= lineHeight * 2;
  }

  // ═══════════════════════════════════════════════════════════
  // 10. FOOTER - FIRMAS
  // ═══════════════════════════════════════════════════════════
  const footerY = margin + 60;

  // Línea para firma 1
  page.drawLine({
    start: { x: margin + 50, y: footerY },
    end: { x: margin + 200, y: footerY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText("Elaborado por", {
    x: margin + 90,
    y: footerY - 15,
    size: 8,
    font: fontNormal,
  });

  if (usuario) {
    page.drawText(usuario.nombres || "", {
      x: margin + 80,
      y: footerY - 28,
      size: 7,
      font: fontNormal,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Línea para firma 2
  page.drawLine({
    start: { x: pageWidth - margin - 200, y: footerY },
    end: { x: pageWidth - margin - 50, y: footerY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText("Aprobado por", {
    x: pageWidth - margin - 170,
    y: footerY - 15,
    size: 8,
    font: fontNormal,
  });

  // Fecha de generación
  const fechaGeneracion = new Date().toLocaleString("es-PE");
  page.drawText(`Generado: ${fechaGeneracion}`, {
    x: margin,
    y: margin - 20,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ═══════════════════════════════════════════════════════════
  // 11. SERIALIZAR Y RETORNAR
  // ═══════════════════════════════════════════════════════════
  return await pdfDoc.save();
}

/**
 * Función auxiliar para dividir texto largo en múltiples líneas
 */
function wrapText(text, maxWidth, font, fontSize) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

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

  return lines;
}
