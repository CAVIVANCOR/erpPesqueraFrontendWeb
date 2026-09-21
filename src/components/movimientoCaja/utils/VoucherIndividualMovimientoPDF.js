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
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "movimiento-caja-voucher-individual");  // ✅ Módulo correcto para voucher individual
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
    { label: "N° Operación:", value: movimiento.numeroOperacionPagoBanco || pagoCuentaPorCobrar.numeroOperacion || "-" },
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

  const infoPago = [
    { label: "Cliente:", value: cuentaPorCobrar?.cliente?.razonSocial || "-" },
    { label: "RUC:", value: cuentaPorCobrar?.cliente?.numeroDocumento || "-" },
    { label: "Documento:", value: cuentaPorCobrar?.numeroPreFactura || "-" },
    { label: "ID Pago Origen:", value: pagoCuentaPorCobrar.id || "-" },
  ];

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
  // 9. FIRMAS
  // ═══════════════════════════════════════════════════════════
  yPosition = 150; // Posición fija para firmas

  const nombreUsuario = usuario 
    ? `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario'
    : 'Usuario';

  const firmaWidth = 200;
  const firmaSpacing = 50;

  const firmas = [
    { x: margin, label: "ELABORADO POR", nombre: nombreUsuario },
    { x: margin + firmaWidth + firmaSpacing, label: "APROBADO POR", nombre: "" },
  ];

  firmas.forEach(({ x, label, nombre }) => {
    // Línea de firma
    page.drawLine({
      start: { x, y: yPosition },
      end: { x: x + firmaWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre del usuario (si existe)
    if (nombre) {
      const nombreWidth = fontBold.widthOfTextAtSize(nombre, 8);
      page.drawText(nombre, {
        x: x + (firmaWidth - nombreWidth) / 2,
        y: yPosition + 5,
        size: 8,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    // Etiqueta
    const labelWidth = fontNormal.widthOfTextAtSize(label, 8);
    page.drawText(label, {
      x: x + (firmaWidth - labelWidth) / 2,
      y: yPosition - 15,
      size: 8,
      font: fontNormal,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 10. FOOTER
  // ═══════════════════════════════════════════════════════════
  const footer = `Generado el ${new Date().toLocaleString('es-PE')} | Sistema ERP Pesquera`;
  const footerWidth = fontNormal.widthOfTextAtSize(footer, 7);
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: 30,
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
