// src/components/movimientoCaja/utils/VoucherIndividualMovimientoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ANCHOS DE COLUMNAS (en puntos)
// ════════════════════════════════════════════════════════════
/**
 * Anchos de columnas para tablas del voucher individual
 * Los valores están en puntos (1 punto ≈ 0.35mm)
 * 
 * CÓMO MODIFICAR:
 * 1. Busca la tabla que quieres ajustar
 * 2. Modifica los valores del array
 * 3. Asegúrate que la suma coincida con el ancho total
 */
const COLUMN_WIDTHS = {
  // Tabla de información del movimiento (si se agrega en el futuro)
  // [Label, Valor]
  info: [200, 300], // Total: 500 puntos
};

/**
 * Genera un PDF del voucher individual de un movimiento de caja
 * Patrón basado en VoucherConsolidadoPagoCxCPDF.js
 */
export async function generarYSubirVoucherIndividual(
  movimiento,
  pagoCuentaPorCobrar,
  empresa,
  cuentaPorCobrar,
  usuario = null
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherIndividual(
      movimiento,
      pagoCuentaPorCobrar,
      empresa,
      cuentaPorCobrar,
      usuario
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("file", blob, `MOVIMIENTO-CAJA-VOUCHER-INDIVIDUAL-${movimiento.id}.pdf`);
    formData.append("moduleName", "movimiento-caja-voucher-individual");  // ✅ Módulo correcto para voucher individual
    formData.append("entityId", movimiento.id);

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
    console.error("Error al generar y subir voucher individual:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF del voucher individual
 */
async function generarPDFVoucherIndividual(
  movimiento,
  pagoCuentaPorCobrar,
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
  const simboloMoneda = movimiento.moneda?.simbolo || "";

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
      console.warn("No se pudo cargar el logo:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 2. CREAR PÁGINA
  // ═══════════════════════════════════════════════════════════
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let yPosition = height - margin;

  // ═══════════════════════════════════════════════════════════
  // 3. HEADER CON LOGO Y EMPRESA
  // ═══════════════════════════════════════════════════════════
  if (logoImage) {
    const logoHeight = 50;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    page.drawImage(logoImage, {
      x: margin,
      y: yPosition - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  }

  // Información de la empresa (derecha)
  const empresaInfo = [
    empresa?.razonSocial || "EMPRESA",
    empresa?.ruc ? `RUC: ${empresa.ruc}` : "",
    empresa?.direccion || "",
  ].filter(Boolean);

  let empresaY = yPosition - 10;
  empresaInfo.forEach((line) => {
    const textWidth = fontNormal.widthOfTextAtSize(line, 9);
    page.drawText(line, {
      x: width - margin - textWidth,
      y: empresaY,
      size: 9,
      font: fontNormal,
      color: rgb(0.3, 0.3, 0.3),
    });
    empresaY -= 12;
  });

  yPosition -= 80;

  // ═══════════════════════════════════════════════════════════
  // 4. TÍTULO
  // ═══════════════════════════════════════════════════════════
  const titulo = "VOUCHER DE MOVIMIENTO DE CAJA";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 16);
  page.drawText(titulo, {
    x: (width - tituloWidth) / 2,
    y: yPosition,
    size: 16,
    font: fontBold,
    color: rgb(0, 0.3, 0.6),
  });

  yPosition -= 30;

  // ═══════════════════════════════════════════════════════════
  // 5. INFORMACIÓN DEL MOVIMIENTO
  // ═══════════════════════════════════════════════════════════
  const infoMovimiento = [
    { label: "ID Movimiento:", value: movimiento.id || "-" },
    { label: "Tipo:", value: movimiento.tipoMovimiento?.nombre || "-" },
    { label: "Fecha:", value: movimiento.fechaOperacionMovCaja ? new Date(movimiento.fechaOperacionMovCaja).toLocaleDateString() : "-" },
    { label: "N° Operación:", value: movimiento.numeroOperacionPagoBanco || pagoCuentaPorCobrar?.numeroOperacion || "-" },
    { label: "Monto:", value: `${simboloMoneda} ${formatearNumero(movimiento.monto || 0)}` },
  ];

  const labelWidth = 130; // Ancho fijo para labels
  infoMovimiento.forEach(({ label, value }) => {
    page.drawText(label, {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(String(value), {
      x: margin + labelWidth,
      y: yPosition,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 6. INFORMACIÓN DE LA CUENTA
  // ═══════════════════════════════════════════════════════════
  const esTransferencia = movimiento.cuentaCorrienteOrigen && movimiento.cuentaCorrienteDestino;
  
  if (esTransferencia) {
    // TRANSFERENCIA (Autodetracción): Mostrar ORIGEN y DESTINO
    page.drawText("INFORMACIÓN DE TRANSFERENCIA", {
      x: margin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.3, 0.6),
    });
    yPosition -= 20;

    // Cuenta Origen
    page.drawText("CUENTA ORIGEN:", {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0.8, 0, 0),
    });
    yPosition -= lineHeight;

    const cuentaOrigen = movimiento.cuentaCorrienteOrigen;
    const infoCuentaOrigen = [
      { label: "Banco:", value: cuentaOrigen.banco?.nombreCorto || cuentaOrigen.banco?.nombre || "-" },
      { label: "Moneda:", value: cuentaOrigen.moneda?.codigoSunat || "-" },
      { label: "Descripción:", value: cuentaOrigen.descripcion || "-" },
      { label: "N° Cuenta:", value: cuentaOrigen.numeroCuenta || "-" },
    ];

    infoCuentaOrigen.forEach(({ label, value }) => {
      page.drawText(label, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      page.drawText(String(value), {
        x: margin + labelWidth,
        y: yPosition,
        size: 9,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    });

    yPosition -= 5;

    // Cuenta Destino
    page.drawText("CUENTA DESTINO:", {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0.6, 0),
    });
    yPosition -= lineHeight;

    const cuentaDestino = movimiento.cuentaCorrienteDestino;
    const infoCuentaDestino = [
      { label: "Banco:", value: cuentaDestino.banco?.nombreCorto || cuentaDestino.banco?.nombre || "-" },
      { label: "Moneda:", value: cuentaDestino.moneda?.codigoSunat || "-" },
      { label: "Descripción:", value: cuentaDestino.descripcion || "-" },
      { label: "N° Cuenta:", value: cuentaDestino.numeroCuenta || "-" },
    ];

    infoCuentaDestino.forEach(({ label, value }) => {
      page.drawText(label, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      page.drawText(String(value), {
        x: margin + labelWidth,
        y: yPosition,
        size: 9,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    });
  } else {
    // MOVIMIENTO SIMPLE: Mostrar solo una cuenta
    page.drawText("INFORMACIÓN DE CUENTA", {
      x: margin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.3, 0.6),
    });
    yPosition -= 20;

    const cuenta = movimiento.cuentaCorrienteDestino || movimiento.cuentaCorrienteOrigen;
    if (cuenta) {
      const infoCuenta = [
        { label: "Banco:", value: cuenta.banco?.nombreCorto || cuenta.banco?.nombre || "-" },
        { label: "Moneda:", value: cuenta.moneda?.codigoSunat || "-" },
        { label: "Descripción:", value: cuenta.descripcion || "-" },
        { label: "N° Cuenta:", value: cuenta.numeroCuenta || "-" },
      ];

      infoCuenta.forEach(({ label, value }) => {
        page.drawText(label, {
          x: margin,
          y: yPosition,
          size: 10,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        page.drawText(String(value), {
          x: margin + labelWidth,
          y: yPosition,
          size: 10,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
    } else {
      page.drawText("Sin cuenta asociada", {
        x: margin,
        y: yPosition,
        size: 10,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= lineHeight;
    }
  }

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 7. INFORMACIÓN DEL PAGO ORIGEN
  // ═══════════════════════════════════════════════════════════
  page.drawText("PAGO ORIGEN", {
    x: margin,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0, 0.3, 0.6),
  });
  yPosition -= 20;

  // ✅ Detectar si es CxC o CxP
  const esCuentaPorCobrar = !!cuentaPorCobrar;
  const esCuentaPorPagar = !!cuentaPorCobrar; // Se pasa como tercer parámetro en CxP
  
  let entidadComercial, numeroDocumento, tipoEntidad, documentoOrigen;
  
  if (esCuentaPorCobrar && cuentaPorCobrar?.cliente) {
    // Es Cuenta por Cobrar
    tipoEntidad = "Cliente:";
    entidadComercial = cuentaPorCobrar?.cliente?.razonSocial || "-";
    numeroDocumento = cuentaPorCobrar?.cliente?.numeroDocumento || "-";
    documentoOrigen = cuentaPorCobrar?.numeroPreFactura || 
                      cuentaPorCobrar?.ordenCompra?.numeroDocumentoFinal || "-";
  } else if (cuentaPorCobrar?.proveedor) {
    // Es Cuenta por Pagar (se pasa como cuentaPorCobrar pero tiene proveedor)
    tipoEntidad = "Proveedor:";
    entidadComercial = cuentaPorCobrar?.proveedor?.razonSocial || "-";
    numeroDocumento = cuentaPorCobrar?.proveedor?.numeroDocumento || "-";
    documentoOrigen = cuentaPorCobrar?.ordenCompra?.numeroDocumentoFinal || 
                      cuentaPorCobrar?.numeroPreFactura || "-";
  } else {
    // Transferencias internas u otros movimientos sin CxC/CxP - NO hay entidad comercial
    tipoEntidad = null;
    entidadComercial = null;
    numeroDocumento = null;
    documentoOrigen = null;
  }

  const infoPago = [
    tipoEntidad && entidadComercial ? { label: tipoEntidad, value: entidadComercial } : null,
    numeroDocumento ? { label: "RUC:", value: numeroDocumento } : null,
    documentoOrigen ? { label: "Documento:", value: documentoOrigen } : null,
    pagoCuentaPorCobrar?.id ? { label: "ID Pago Origen:", value: pagoCuentaPorCobrar.id } : null,
  ].filter(Boolean); // Eliminar elementos null

  infoPago.forEach(({ label, value }) => {
    page.drawText(label, {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(String(value), {
      x: margin + labelWidth,
      y: yPosition,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  yPosition -= 20;

  // ═══════════════════════════════════════════════════════════
  // 8. DESCRIPCIÓN
  // ═══════════════════════════════════════════════════════════
  if (movimiento.descripcion) {
    page.drawText("DESCRIPCIÓN:", {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    // Dividir descripción en líneas si es muy larga
    const maxWidth = width - 2 * margin;
    const descripcionLineas = dividirTexto(movimiento.descripcion, fontNormal, 9, maxWidth);
    
    descripcionLineas.forEach((linea) => {
      page.drawText(linea, {
        x: margin,
        y: yPosition,
        size: 9,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= 12;
    });

    yPosition -= 10;
  }

  // ═══════════════════════════════════════════════════════════
  // 9. FIRMAS EN FOOTER (FORMATO TABLA)
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

  // ═══════════════════════════════════════════════════════════
  // 10. FOOTER (debajo de la tabla de firmas)
  // ═══════════════════════════════════════════════════════════
  const fechaGeneracion = new Date().toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const footer = `Documento generado automáticamente - ${fechaGeneracion}`;
  const footerWidth = fontNormal.widthOfTextAtSize(footer, 7);
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: footerY - 15,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ═══════════════════════════════════════════════════════════
  // 11. RETORNAR PDF
  // ═══════════════════════════════════════════════════════════
  return await pdfDoc.save();
}

/**
 * Helper para dividir texto largo en líneas
 */
function dividirTexto(texto, font, fontSize, maxWidth) {
  const palabras = texto.split(' ');
  const lineas = [];
  let lineaActual = '';

  palabras.forEach((palabra) => {
    const testLinea = lineaActual ? `${lineaActual} ${palabra}` : palabra;
    const testWidth = font.widthOfTextAtSize(testLinea, fontSize);

    if (testWidth <= maxWidth) {
      lineaActual = testLinea;
    } else {
      if (lineaActual) lineas.push(lineaActual);
      lineaActual = palabra;
    }
  });

  if (lineaActual) lineas.push(lineaActual);
  return lineas;
}
