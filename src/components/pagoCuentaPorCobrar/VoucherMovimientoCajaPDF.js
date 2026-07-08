// src/components/pagoCuentaPorCobrar\VoucherMovimientoCajaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF del voucher individual de movimiento de caja y lo sube al servidor
 */
export async function generarYSubirVoucherMovimiento(
  movimientoCaja,
  empresa,
  cuentaPorCobrar
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherMovimiento(
      movimientoCaja,
      empresa,
      cuentaPorCobrar
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "movimiento-caja");
    formData.append("entityId", movimientoCaja.id);

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
 * Genera el PDF del voucher de movimiento de caja
 */
async function generarPDFVoucherMovimiento(
  movimientoCaja,
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
  const page = pdfDoc.addPage([419.53, 595.28]); // Media carta vertical
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 40;
  const margin = 30;
  const lineHeight = 14;

  // ═══════════════════════════════════════════════════════════
  // ENCABEZADO
  // ═══════════════════════════════════════════════════════════
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;

  page.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin,
    y: yPosition,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 1.5;

  // Título
  page.drawText("VOUCHER DE MOVIMIENTO", {
    x: width / 2 - 70,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;

  page.drawText(`N° ${movimientoCaja.id || "-"}`, {
    x: width / 2 - 20,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 1.5;

  // ═══════════════════════════════════════════════════════════
  // DATOS DEL MOVIMIENTO
  // ═══════════════════════════════════════════════════════════
  const datos = [
    ["Fecha:", formatearFecha(movimientoCaja.fechaOperacionMovCaja)],
    ["Tipo:", movimientoCaja.tipoMovimiento?.descripcion || "-"],
    ["Cliente:", cuentaPorCobrar?.cliente?.razonSocial || "-"],
    ["Documento:", cuentaPorCobrar?.numeroPreFactura || "-"],
    ["Moneda:", movimientoCaja.moneda?.descripcion || "-"],
    ["Monto:", `S/ ${formatearNumero(movimientoCaja.monto)}`],
    ["Medio Pago:", movimientoCaja.medioPago?.descripcion || "-"],
  ];

  datos.forEach(([label, value]) => {
    page.drawText(label, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: margin + 80,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  yPosition -= lineHeight;

  // Descripción
  if (movimientoCaja.descripcion) {
    page.drawText("Descripción:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    const descripcionLineas = movimientoCaja.descripcion.match(/.{1,50}/g) || [];
    descripcionLineas.forEach((linea) => {
      page.drawText(linea, {
        x: margin,
        y: yPosition,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 0.8;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════
  page.drawText(`Generado: ${formatearFecha(new Date())}`, {
    x: margin,
    y: 30,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}