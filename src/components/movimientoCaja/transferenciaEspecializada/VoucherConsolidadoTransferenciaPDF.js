// src/components/movimientoCaja/transferenciaEspecializada/VoucherConsolidadoTransferenciaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ANCHOS DE COLUMNAS (en puntos)
// ════════════════════════════════════════════════════════════
const COLUMN_WIDTHS = {
  // Tabla de Movimientos (Egreso + Ingreso)
  // [Tipo, Cuenta, Banco, Monto, ITF, Comisión, Total]
  movimientos: [60, 150, 120, 80, 60, 60, 80], // Total: 610 puntos
};

/**
 * Genera un PDF del voucher consolidado de transferencia interna y lo sube al servidor
 */
export async function generarYSubirVoucherConsolidado(
  transferencia,
  movimientoEgreso,
  movimientoIngreso,
  empresa,
  cuentaOrigen,
  cuentaDestino,
  usuario = null
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherConsolidado(
      transferencia,
      movimientoEgreso,
      movimientoIngreso,
      empresa,
      cuentaOrigen,
      cuentaDestino,
      usuario
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("file", blob, `TRANSFERENCIA-INTERNA-${transferencia.correlativo}.pdf`);
    formData.append("moduleName", "transferencia-interna-voucher");
    formData.append("entityId", movimientoEgreso.id);

    // 4. Subir al servidor
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
 * Genera el PDF del voucher consolidado de transferencia
 */
async function generarPDFVoucherConsolidado(
  transferencia,
  movimientoEgreso,
  movimientoIngreso,
  empresa,
  cuentaOrigen,
  cuentaDestino,
  usuario = null
) {
  // ═══════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 20;
  const lineHeight = 15;

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
  // 2. CREAR PÁGINA
  // ═══════════════════════════════════════════════════════════
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();

  let yPosition = height - margin;

  // ═══════════════════════════════════════════════════════════
  // 3. ENCABEZADO CON LOGO Y DATOS DE EMPRESA
  // ═══════════════════════════════════════════════════════════
  if (logoImage) {
    const logoWidth = 80;
    const logoHeight = 60;
    page.drawImage(logoImage, {
      x: margin,
      y: yPosition - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  }

  // Datos de la empresa (derecha)
  const empresaX = width - margin - 250;
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: empresaX,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 12;
  page.drawText(`RUC: ${empresa?.ruc || ""}`, {
    x: empresaX,
    y: yPosition,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 12;
  if (empresa?.direccion) {
    page.drawText(empresa.direccion.substring(0, 50), {
      x: empresaX,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
  }

  yPosition -= 30;

  // ═══════════════════════════════════════════════════════════
  // 4. TÍTULO DEL DOCUMENTO
  // ═══════════════════════════════════════════════════════════
  const titulo = "VOUCHER DE TRANSFERENCIA INTERNA";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
  page.drawText(titulo, {
    x: (width - tituloWidth) / 2,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 10;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 2,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  // ═══════════════════════════════════════════════════════════
  // 5. INFORMACIÓN GENERAL
  // ═══════════════════════════════════════════════════════════
  const infoGeneral = [
    { label: "Nº Operación:", valor: transferencia.correlativo || "N/A" },
    { label: "Fecha:", valor: new Date(transferencia.fechaTransferencia).toLocaleDateString('es-PE') },
    { label: "Nº Operación Bancaria:", valor: transferencia.numeroOperacion || "N/A" },
    { label: "Descripción:", valor: transferencia.descripcion || "Transferencia interna" },
  ];

  for (const info of infoGeneral) {
    page.drawText(info.label, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(info.valor, {
      x: margin + 150,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
  }

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 6. CUENTA ORIGEN
  // ═══════════════════════════════════════════════════════════
  page.drawText("📤 CUENTA DE ORIGEN", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0.8, 0, 0),
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  const datosOrigen = [
    { label: "Banco:", valor: cuentaOrigen?.banco?.nombre || "N/A" },
    { label: "Nº Cuenta:", valor: cuentaOrigen?.numeroCuenta || "N/A" },
    { label: "Moneda:", valor: movimientoEgreso?.moneda?.nombre || "N/A" },
    { label: "Monto Transferido:", valor: `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(movimientoEgreso?.monto || 0)}` },
    { label: "ITF:", valor: `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(movimientoEgreso?.itf || 0)}` },
    { label: "Comisión:", valor: `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(movimientoEgreso?.comision || 0)}` },
    { label: "Total Debitado:", valor: `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(movimientoEgreso?.totalMovimiento || 0)}` },
  ];

  for (const dato of datosOrigen) {
    page.drawText(dato.label, {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(dato.valor, {
      x: margin + 160,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
  }

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 7. TIPO DE CAMBIO (si aplica)
  // ═══════════════════════════════════════════════════════════
  if (transferencia.tipoCambio && transferencia.tipoCambio !== 1) {
    page.drawText("💱 TIPO DE CAMBIO", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
      color: rgb(0, 0.5, 0.8),
    });

    yPosition -= 5;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 15;

    const conversion = `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(movimientoEgreso?.monto || 0)} × ${transferencia.tipoCambio} = ${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(transferencia.montoDestino || 0)}`;
    
    page.drawText("Tipo de Cambio:", {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(transferencia.tipoCambio.toString(), {
      x: margin + 160,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;

    page.drawText("Conversión:", {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(conversion, {
      x: margin + 160,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;
  }

  // ═══════════════════════════════════════════════════════════
  // 8. CUENTA DESTINO
  // ═══════════════════════════════════════════════════════════
  page.drawText("📥 CUENTA DE DESTINO", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.6, 0),
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  const montoDestino = transferencia.montoDestino || movimientoEgreso?.monto || 0;
  const totalAcreditado = montoDestino - (movimientoIngreso?.itf || 0) - (movimientoIngreso?.comision || 0);

  const datosDestino = [
    { label: "Banco:", valor: cuentaDestino?.banco?.nombre || "N/A" },
    { label: "Nº Cuenta:", valor: cuentaDestino?.numeroCuenta || "N/A" },
    { label: "Moneda:", valor: movimientoIngreso?.moneda?.nombre || "N/A" },
    { label: "Monto Recibido:", valor: `${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(montoDestino)}` },
    { label: "ITF:", valor: `${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(movimientoIngreso?.itf || 0)}` },
    { label: "Comisión:", valor: `${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(movimientoIngreso?.comision || 0)}` },
    { label: "Total Acreditado:", valor: `${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(totalAcreditado)}` },
  ];

  for (const dato of datosDestino) {
    page.drawText(dato.label, {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(dato.valor, {
      x: margin + 160,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
  }

  yPosition -= 10;

  // ═══════════════════════════════════════════════════════════
  // 9. COSTO TOTAL
  // ═══════════════════════════════════════════════════════════
  const costoOrigen = (movimientoEgreso?.itf || 0) + (movimientoEgreso?.comision || 0);
  const costoDestino = (movimientoIngreso?.itf || 0) + (movimientoIngreso?.comision || 0);

  page.drawRectangle({
    x: margin,
    y: yPosition - 20,
    width: width - (2 * margin),
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("💰 COSTO TOTAL DE LA OPERACIÓN:", {
    x: margin + 10,
    y: yPosition - 12,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  let costoTexto = `${movimientoEgreso?.moneda?.simbolo} ${formatearNumero(costoOrigen)}`;
  if (transferencia.tipoCambio && transferencia.tipoCambio !== 1) {
    costoTexto += ` + ${movimientoIngreso?.moneda?.simbolo} ${formatearNumero(costoDestino)}`;
  }

  page.drawText(costoTexto, {
    x: width - margin - 150,
    y: yPosition - 12,
    size: 10,
    font: fontBold,
    color: rgb(0.8, 0, 0),
  });

  yPosition -= 40;

  // ═══════════════════════════════════════════════════════════
  // 10. PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════
  yPosition = 80;

  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  if (usuario) {
    page.drawText(`Elaborado por: ${usuario.nombres} ${usuario.apellidos}`, {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  page.drawText(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, {
    x: width - margin - 200,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPosition -= 12;

  page.drawText("Sistema ERP Pesquera - Transferencias Internas", {
    x: (width - fontNormal.widthOfTextAtSize("Sistema ERP Pesquera - Transferencias Internas", 7)) / 2,
    y: yPosition,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ═══════════════════════════════════════════════════════════
  // 11. RETORNAR PDF
  // ═══════════════════════════════════════════════════════════
  return await pdfDoc.save();
}

export default {
  generarYSubirVoucherConsolidado
};
