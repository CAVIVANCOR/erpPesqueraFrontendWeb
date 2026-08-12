import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generarEstadoGyPPDF(data) {
  const { empresa, periodo, moneda, cuentas, totales } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const usableWidth = pageWidth - 2 * margin;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;

  const titulo = "ESTADO DE GANANCIAS Y PERDIDAS";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
  currentPage.drawText(titulo, {
    x: (pageWidth - tituloWidth) / 2,
    y: yPos,
    size: 14,
    font: fontBold,
  });
  yPos -= 20;

  currentPage.drawText(`Periodo: ${periodo.nombrePeriodo || ""}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: fontNormal,
  });
  yPos -= 15;

  currentPage.drawText(`RUC: ${empresa.ruc || ""}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: fontNormal,
  });
  yPos -= 15;

  currentPage.drawText(`Razon Social: ${empresa.razonSocial || ""}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: fontNormal,
  });
  yPos -= 15;

  currentPage.drawText(`Expresado en ${moneda?.nombreLargo || "SOLES"}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: fontNormal,
  });
  yPos -= 25;

  const colWidths = { codigo: 80, nombre: 280, tipo: 80, monto: 80 };
  let xCodigo = margin;
  let xNombre = xCodigo + colWidths.codigo;
  let xTipo = xNombre + colWidths.nombre;
  let xMonto = xTipo + colWidths.tipo;

  currentPage.drawRectangle({
    x: margin,
    y: yPos - 15,
    width: usableWidth,
    height: 15,
    color: rgb(0.68, 0.85, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  currentPage.drawText("CODIGO", { x: xCodigo + 5, y: yPos - 10, size: 9, font: fontBold });
  currentPage.drawText("DENOMINACION", { x: xNombre + 5, y: yPos - 10, size: 9, font: fontBold });
  currentPage.drawText("TIPO", { x: xTipo + 5, y: yPos - 10, size: 9, font: fontBold });
  currentPage.drawText("MONTO", { x: xMonto + 5, y: yPos - 10, size: 9, font: fontBold });

  yPos -= 20;

  cuentas.forEach((cuenta) => {
    if (yPos < 80) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - margin;
    }

    const monto = cuenta.tipoCuenta === 'INGRESO' ? (cuenta.haber || 0) : (cuenta.debe || 0);

    currentPage.drawText(cuenta.codigoCuenta || "", { x: xCodigo + 5, y: yPos, size: 8, font: fontNormal });
    currentPage.drawText(cuenta.nombreCuenta || "", { x: xNombre + 5, y: yPos, size: 8, font: fontNormal });
    currentPage.drawText(cuenta.tipoCuenta || "", { x: xTipo + 5, y: yPos, size: 8, font: fontNormal });
    
    const montoStr = monto.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const montoWidth = fontNormal.widthOfTextAtSize(montoStr, 8);
    currentPage.drawText(montoStr, { x: xMonto + colWidths.monto - montoWidth - 5, y: yPos, size: 8, font: fontNormal });

    yPos -= 15;
  });

  yPos -= 10;

  currentPage.drawRectangle({
    x: margin,
    y: yPos - 15,
    width: usableWidth,
    height: 15,
    color: rgb(1, 1, 0),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  currentPage.drawText("TOTALES", { x: xNombre + 5, y: yPos - 10, size: 10, font: fontBold });
  yPos -= 20;

  currentPage.drawText(`Total Ingresos: ${totales.totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, {
    x: margin,
    y: yPos,
    size: 9,
    font: fontBold,
  });
  yPos -= 15;

  currentPage.drawText(`Total Gastos: ${totales.totalGastos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, {
    x: margin,
    y: yPos,
    size: 9,
    font: fontBold,
  });
  yPos -= 15;

  const utilidadLabel = totales.utilidad >= 0 ? 'Utilidad del Ejercicio' : 'Perdida del Ejercicio';
  currentPage.drawText(`${utilidadLabel}: ${Math.abs(totales.utilidad).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, {
    x: margin,
    y: yPos,
    size: 9,
    font: fontBold,
    color: totales.utilidad >= 0 ? rgb(0, 0.5, 0) : rgb(1, 0, 0)
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}