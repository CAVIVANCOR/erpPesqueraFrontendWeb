// src/components/pagoCuentaPorCobrar/VoucherConsolidadoPagoCxCPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF del voucher consolidado de pago CxC y lo sube al servidor
 */
export async function generarYSubirVoucherConsolidado(
  pagoCuentaPorCobrar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorCobrar
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherConsolidado(
      pagoCuentaPorCobrar,
      movimientos,
      conceptosSunat,
      resumen,
      empresa,
      cuentaPorCobrar
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "pago-cuenta-por-cobrar");
    formData.append("entityId", pagoCuentaPorCobrar.id);

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
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF del voucher consolidado
 */
async function generarPDFVoucherConsolidado(
  pagoCuentaPorCobrar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorCobrar
) {
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Crear documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 15;

  // ═══════════════════════════════════════════════════════════
  // ENCABEZADO
  // ═══════════════════════════════════════════════════════════
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;

  page.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 2;

  // Título
  page.drawText("VOUCHER CONSOLIDADO DE PAGO", {
    x: width / 2 - 100,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;

  page.drawText(`Operación N° ${pagoCuentaPorCobrar.correlativo || "-"}`, {
    x: width / 2 - 80,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // DATOS DEL PAGO
  // ═══════════════════════════════════════════════════════════
  const datos = [
    ["Fecha de Pago:", formatearFecha(pagoCuentaPorCobrar.fechaPago)],
    ["Cliente:", cuentaPorCobrar?.cliente?.razonSocial || "-"],
    ["RUC Cliente:", cuentaPorCobrar?.cliente?.numeroDocumento || "-"],
    ["Documento:", cuentaPorCobrar?.numeroPreFactura || "-"],
    ["Moneda Pago:", pagoCuentaPorCobrar.monedaPago?.descripcion || "-"],
    ["Tipo de Cambio:", `S/ ${Number(pagoCuentaPorCobrar.tipoCambio || 1).toFixed(3)}`],
    ["Medio de Pago:", pagoCuentaPorCobrar.medioPago?.descripcion || "-"],
  ];

  datos.forEach(([label, value]) => {
    page.drawText(label, {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: margin + 150,
      y: yPosition,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  yPosition -= lineHeight;

  // ═══════════════════════════════════════════════════════════
  // RESUMEN DE MONTOS
  // ═══════════════════════════════════════════════════════════
  page.drawText("RESUMEN DE MONTOS", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 1.5;

  const montosPago = [
    ["Monto Pagado:", `S/ ${formatearNumero(resumen.montoBruto)}`],
    ["ITF:", `S/ ${formatearNumero(resumen.montoITF)}`],
    ["Comisión Bancaria:", `S/ ${formatearNumero(resumen.montoComision)}`],
    ["Detracción:", `S/ ${formatearNumero(resumen.montoDetraccion)}`],
    ["Retención:", `S/ ${formatearNumero(resumen.montoRetencion)}`],
    ["Percepción:", `S/ ${formatearNumero(resumen.montoPercepcion)}`],
  ];

  montosPago.forEach(([label, value]) => {
    page.drawText(label, {
      x: margin + 20,
      y: yPosition,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: margin + 200,
      y: yPosition,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  yPosition -= lineHeight;

  // Total aplicado a la deuda
  page.drawText("MONTO APLICADO A LA DEUDA:", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(`S/ ${formatearNumero(resumen.deudaCancelada)}`, {
    x: margin + 200,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.5, 0),
  });
  yPosition -= lineHeight;

  page.drawText("SALDO PENDIENTE:", {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(`S/ ${formatearNumero(resumen.saldoPendiente)}`, {
    x: margin + 200,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0.7, 0, 0),
  });

  yPosition -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════
  page.drawText(`Generado: ${formatearFecha(new Date())}`, {
    x: margin,
    y: 50,
    size: 8,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}