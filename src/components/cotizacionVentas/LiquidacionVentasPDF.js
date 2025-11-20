/**
 * LiquidacionVentasPDF.js
 * Generador de PDF para liquidación de entregas a rendir de Ventas
 * @author ERP Megui
 * @version 1.0.0
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFLiquidacionVentas } from "./dibujaEncabezadoPDFLiquidacionVentas";
import { dibujaTotalesYFirmaPDFLiquidacionVentas } from "./dibujaTotalesYFirmaPDFLiquidacionVentas";

export async function generarYSubirPDFLiquidacionVentas(
  entregaARendir,
  movimientos,
  empresa
) {
  try {
    const pdfBytes = await generarPDFLiquidacionVentas(entregaARendir, movimientos, empresa);

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    const nombreArchivo = `liquidacion_ventas_${entregaARendir.id}_${Date.now()}.pdf`;
    formData.append("file", blob, nombreArchivo);

    const token = useAuthStore.getState().token;
    const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!uploadResponse.ok) throw new Error("Error al subir el PDF al servidor");

    const uploadData = await uploadResponse.json();
    const urlPdf = uploadData.url;

    const updateResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-rendir-ventas/${entregaARendir.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urlLiquidacionPdf: urlPdf }),
      }
    );

    if (!updateResponse.ok) throw new Error("Error al actualizar la entrega");

    return { success: true, urlPdf: urlPdf };
  } catch (error) {
    console.error("Error en generarYSubirPDFLiquidacionVentas:", error);
    return { success: false, error: error.message };
  }
}

async function generarPDFLiquidacionVentas(entregaARendir, movimientos, empresa) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 50;
  yPosition = dibujaEncabezadoPDFLiquidacionVentas(
    page, entregaARendir, empresa, fontBold, fontRegular, yPosition, width
  );

  yPosition -= 20;
  yPosition = dibujarTablaMovimientos(page, movimientos, fontBold, fontRegular, yPosition, width);

  yPosition = dibujaTotalesYFirmaPDFLiquidacionVentas(
    page, entregaARendir, movimientos, fontBold, fontRegular, yPosition, width
  );

  return await pdfDoc.save();
}

function dibujarTablaMovimientos(page, movimientos, fontBold, fontRegular, startY, pageWidth) {
  let yPosition = startY;
  const margin = 40;
  const tableWidth = pageWidth - 2 * margin;

  page.drawRectangle({
    x: margin, y: yPosition - 20, width: tableWidth, height: 20, color: rgb(0.9, 0.9, 0.9),
  });

  const headers = [
    { text: "Fecha", x: margin + 5 },
    { text: "Tipo", x: margin + 80 },
    { text: "Descripción", x: margin + 165 },
    { text: "Ingreso", x: margin + 350 },
    { text: "Egreso", x: margin + 425 },
  ];

  headers.forEach((h) => {
    page.drawText(h.text, { x: h.x, y: yPosition - 15, size: 9, font: fontBold });
  });

  yPosition -= 25;

  movimientos.forEach((mov, i) => {
    if (i % 2 === 0) {
      page.drawRectangle({
        x: margin, y: yPosition - 15, width: tableWidth, height: 15, color: rgb(0.98, 0.98, 0.98),
      });
    }

    const fecha = mov.fechaMovimiento ? new Date(mov.fechaMovimiento).toLocaleDateString("es-PE") : "N/A";
    page.drawText(fecha, { x: margin + 5, y: yPosition - 10, size: 8, font: fontRegular });

    const tipo = (mov.tipoMovimiento?.nombre || "N/A").substring(0, 15);
    page.drawText(tipo, { x: margin + 80, y: yPosition - 10, size: 8, font: fontRegular });

    const desc = (mov.descripcion || "N/A").substring(0, 35);
    page.drawText(desc, { x: margin + 165, y: yPosition - 10, size: 8, font: fontRegular });

    const esIngreso = mov.tipoMovimiento?.ingresoEgreso === "I";
    const monto = formatearNumero(mov.monto || 0);

    if (esIngreso) {
      page.drawText(monto, { x: margin + 350, y: yPosition - 10, size: 8, font: fontRegular, color: rgb(0, 0.5, 0) });
    } else {
      page.drawText(monto, { x: margin + 425, y: yPosition - 10, size: 8, font: fontRegular, color: rgb(0.7, 0, 0) });
    }

    yPosition -= 15;
    if (yPosition < 100) return yPosition;
  });

  return yPosition;
}

export default generarYSubirPDFLiquidacionVentas;
