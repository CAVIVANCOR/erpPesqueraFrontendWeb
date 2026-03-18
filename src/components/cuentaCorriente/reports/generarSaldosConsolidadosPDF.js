// src/components/cuentaCorriente/reports/generarSaldosConsolidadosPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Saldos Consolidados
 * NOTA: Este es un placeholder.
 * @param {Object} data - Datos de saldos
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarSaldosConsolidadosPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('REPORTE EN DESARROLLO', {
    x: 50,
    y: height - 100,
    size: 20,
    font: font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}