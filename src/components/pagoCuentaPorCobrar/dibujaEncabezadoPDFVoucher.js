// src/components/pagoCuentaPorCobrar/dibujaEncabezadoPDFVoucher.js
import { rgb } from "pdf-lib";

/**
 * Dibuja el encabezado completo del voucher consolidado
 */
export async function dibujaEncabezadoPDFVoucher({
  pag,
  pdfDoc,
  empresa,
  pagoCuentaPorCobrar,
  cuentaPorCobrar,
  width,
  height,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
}) {
  let yPos = height - 50;

  // ═══════════════════════════════════════════════════════════
  // LOGO DE LA EMPRESA
  // ═══════════════════════════════════════════════════════════
  if (empresa?.logo && empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        let logoImage;

        if (empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }

        if (logoImage) {
          const logoDims = logoImage.size();
          const maxLogoWidth = 80;
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
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DATOS DE LA EMPRESA
  // ═══════════════════════════════════════════════════════════
  pag.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin + 90,
    y: yPos,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= lineHeight;

  pag.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin + 90,
    y: yPos,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPos -= lineHeight;

  if (empresa?.direccion) {
    pag.drawText(empresa.direccion.substring(0, 60), {
      x: margin + 90,
      y: yPos,
      size: 8,
      font: fontNormal,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= lineHeight;
  }

  yPos -= lineHeight;

  // ═══════════════════════════════════════════════════════════
  // TÍTULO DEL DOCUMENTO
  // ═══════════════════════════════════════════════════════════
  const titulo = "VOUCHER CONSOLIDADO DE PAGO";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
  pag.drawText(titulo, {
    x: (width - tituloWidth) / 2,
    y: yPos,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= lineHeight;

  const operacion = `Operación N° ${pagoCuentaPorCobrar.correlativo || "-"}`;
  const operacionWidth = fontBold.widthOfTextAtSize(operacion, 11);
  pag.drawText(operacion, {
    x: (width - operacionWidth) / 2,
    y: yPos,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.8),
  });
  yPos -= lineHeight * 2;

  // ═══════════════════════════════════════════════════════════
  // LÍNEA SEPARADORA
  // ═══════════════════════════════════════════════════════════
  pag.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPos -= lineHeight * 1.5;

  // ═══════════════════════════════════════════════════════════
  // INFORMACIÓN DEL PAGO - 2 COLUMNAS
  // ═══════════════════════════════════════════════════════════
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const col1X = margin;
  const col2X = width / 2 + 20;
  let yPosCol1 = yPos;
  let yPosCol2 = yPos;

  // COLUMNA 1
  const datosCol1 = [
    ["Fecha de Pago:", formatearFecha(pagoCuentaPorCobrar.fechaPago)],
    ["Cliente:", cuentaPorCobrar?.cliente?.razonSocial || "-"],
    ["RUC Cliente:", cuentaPorCobrar?.cliente?.numeroDocumento || "-"],
    ["Documento:", cuentaPorCobrar?.numeroPreFactura || "-"],
  ];

  datosCol1.forEach(([label, value]) => {
    pag.drawText(label, {
      x: col1X,
      y: yPosCol1,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    pag.drawText(value, {
      x: col1X + 90,
      y: yPosCol1,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol1 -= lineHeight;
  });

  // COLUMNA 2
  const datosCol2 = [
    ["Moneda:", pagoCuentaPorCobrar.monedaPago?.simbolo || "-"],
    ["Tipo de Cambio:", `S/ ${Number(pagoCuentaPorCobrar.tipoCambio || 1).toFixed(4)}`],
    ["Medio de Pago:", pagoCuentaPorCobrar.medioPago?.nombre || "-"],
    ["N° Operación:", pagoCuentaPorCobrar.numeroOperacion || "-"],
  ];

  datosCol2.forEach(([label, value]) => {
    pag.drawText(label, {
      x: col2X,
      y: yPosCol2,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    pag.drawText(value, {
      x: col2X + 90,
      y: yPosCol2,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol2 -= lineHeight;
  });

  yPos = Math.min(yPosCol1, yPosCol2) - lineHeight;

  // ═══════════════════════════════════════════════════════════
  // LÍNEA SEPARADORA
  // ═══════════════════════════════════════════════════════════
  pag.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPos -= lineHeight * 1.5;

  return yPos;
}
