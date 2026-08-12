import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils.js";

export async function generarBalanceComprobacionPDF(data) {
  const { empresa, periodo, moneda, cuentas, totales } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 10;
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const usableWidth = pageWidth - 2 * margin;

  const Y_MINIMO = 60;
  const totalPaginas = Math.ceil(cuentas.length / 30);

  let currentPage = null;
  let yPos = 0;
  let paginaActual = 1;
  let lineaIndex = 0;

  const colWidths = {
    codigo: 50,
    nombre: 140,
    siDebe: 55,
    siHaber: 55,
    mvDebe: 55,
    mvHaber: 55,
    sfDebe: 55,
    sfHaber: 55,
    activo: 55,
    pasivoPat: 55,
    perdida: 55,
    ganancia: 55
  };

  let xCodigo = margin;
  let xNombre = xCodigo + colWidths.codigo;
  let xSIDebe = xNombre + colWidths.nombre;
  let xSIHaber = xSIDebe + colWidths.siDebe;
  let xMvDebe = xSIHaber + colWidths.siHaber;
  let xMvHaber = xMvDebe + colWidths.mvDebe;
  let xSFDebe = xMvHaber + colWidths.mvHaber;
  let xSFHaber = xSFDebe + colWidths.sfDebe;
  let xActivo = xSFHaber + colWidths.sfHaber;
  let xPasivoPat = xActivo + colWidths.activo;
  let xPerdida = xPasivoPat + colWidths.pasivoPat;
  let xGanancia = xPerdida + colWidths.perdida;

  const dividirTexto = (texto, maxWidth, font, fontSize) => {
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';

    for (const palabra of palabras) {
      const test = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width > maxWidth && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = test;
      }
    }
    if (lineaActual) lineas.push(lineaActual);
    return lineas;
  };

  const generarEncabezado = (pagina) => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const titulo = "BALANCE DE COMPROBACIÓN";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 12);
    currentPage.drawText(titulo, {
      x: (pageWidth - tituloWidth) / 2,
      y: y,
      size: 12,
      font: fontBold,
    });
    y -= 14;

    const razonSocial = empresa.razonSocial || "";
    const razonWidth = fontBold.widthOfTextAtSize(razonSocial, 10);
    currentPage.drawText(razonSocial, {
      x: (pageWidth - razonWidth) / 2,
      y: y,
      size: 10,
      font: fontBold,
    });
    y -= 12;

    const rucText = `RUC: ${empresa.ruc || ""}`;
    const rucWidth = fontNormal.widthOfTextAtSize(rucText, 9);
    currentPage.drawText(rucText, {
      x: (pageWidth - rucWidth) / 2,
      y: y,
      size: 9,
      font: fontNormal,
    });
    y -= 12;

    currentPage.drawText(`Período: ${periodo.nombrePeriodo || ""}`, {
      x: margin,
      y: y,
      size: 8,
      font: fontNormal,
    });
    const textoPag = `PAG ${pagina}/${totalPaginas}`;
    currentPage.drawText(textoPag, {
      x: pageWidth - margin - fontNormal.widthOfTextAtSize(textoPag, 8),
      y: y,
      size: 8,
      font: fontNormal,
    });
    y -= 12;

    const monedaText = `Expresado en ${moneda?.nombreLargo || "SOLES"}`;
    const monedaWidth = fontNormal.widthOfTextAtSize(monedaText, 8);
    currentPage.drawText(monedaText, {
      x: (pageWidth - monedaWidth) / 2,
      y: y,
      size: 8,
      font: fontNormal,
    });
    y -= 14;

    const altoCabecera = 20;
    const headers = [
      { text: "CÓDIGO", x: xCodigo, width: colWidths.codigo },
      { text: "DENOMINACIÓN", x: xNombre, width: colWidths.nombre },
      { text: "SI DEBE", x: xSIDebe, width: colWidths.siDebe },
      { text: "SI HABER", x: xSIHaber, width: colWidths.siHaber },
      { text: "MOV DEBE", x: xMvDebe, width: colWidths.mvDebe },
      { text: "MOV HABER", x: xMvHaber, width: colWidths.mvHaber },
      { text: "SF DEBE", x: xSFDebe, width: colWidths.sfDebe },
      { text: "SF HABER", x: xSFHaber, width: colWidths.sfHaber },
      { text: "ACTIVO", x: xActivo, width: colWidths.activo },
      { text: "PASIVO-PAT", x: xPasivoPat, width: colWidths.pasivoPat },
      { text: "PÉRDIDA", x: xPerdida, width: colWidths.perdida },
      { text: "GANANCIA", x: xGanancia, width: colWidths.ganancia }
    ];

    headers.forEach(header => {
      currentPage.drawRectangle({
        x: header.x,
        y: y - altoCabecera,
        width: header.width,
        height: altoCabecera,
        color: rgb(0.68, 0.85, 0.90),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });

      const textWidth = fontBold.widthOfTextAtSize(header.text, 7);
      currentPage.drawText(header.text, {
        x: header.x + (header.width - textWidth) / 2,
        y: y - 12,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
    });

    y -= altoCabecera + 2;
    return y;
  };

  yPos = generarEncabezado(paginaActual);

  let totalActivo = 0;
  let totalPasivoPat = 0;
  let totalPerdida = 0;
  let totalGanancia = 0;

  while (lineaIndex < cuentas.length) {
    const cuenta = cuentas[lineaIndex];
    const yInicial = yPos;

    currentPage.drawLine({
      start: { x: margin, y: yInicial + 1 },
      end: { x: pageWidth - margin, y: yInicial + 1 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    currentPage.drawText(cuenta.codigoCuenta || "", {
      x: xCodigo + 2,
      y: yInicial - 6,
      size: 6.5,
      font: fontNormal,
    });

    const lineasNombre = dividirTexto(cuenta.nombreCuenta || "", colWidths.nombre - 4, fontNormal, 6.5);
    let yNombre = yInicial - 6;
    lineasNombre.slice(0, 1).forEach(lineaTexto => {
      currentPage.drawText(lineaTexto, {
        x: xNombre + 2,
        y: yNombre,
        size: 6.5,
        font: fontNormal,
      });
    });

    const saldoFinalNeto = (cuenta.saldoFinalDebe || 0) - (cuenta.saldoFinalHaber || 0);

    let activo = 0;
    let pasivoPat = 0;

    if (cuenta.tipoCuenta === 'ACTIVO' && saldoFinalNeto > 0) {
      activo = saldoFinalNeto;
      totalActivo += activo;
    }

    if ((cuenta.tipoCuenta === 'PASIVO' || cuenta.tipoCuenta === 'PATRIMONIO') && saldoFinalNeto < 0) {
      pasivoPat = Math.abs(saldoFinalNeto);
      totalPasivoPat += pasivoPat;
    }

    const perdida = cuenta.tipoCuenta === 'GASTO' ? (cuenta.debe || 0) : 0;
    const ganancia = cuenta.tipoCuenta === 'INGRESO' ? (cuenta.haber || 0) : 0;

    totalPerdida += perdida;
    totalGanancia += ganancia;

    const valores = [
      { val: cuenta.saldoInicialDebe, x: xSIDebe, width: colWidths.siDebe },
      { val: cuenta.saldoInicialHaber, x: xSIHaber, width: colWidths.siHaber },
      { val: cuenta.debe, x: xMvDebe, width: colWidths.mvDebe },
      { val: cuenta.haber, x: xMvHaber, width: colWidths.mvHaber },
      { val: cuenta.saldoFinalDebe, x: xSFDebe, width: colWidths.sfDebe },
      { val: cuenta.saldoFinalHaber, x: xSFHaber, width: colWidths.sfHaber },
      { val: activo, x: xActivo, width: colWidths.activo },
      { val: pasivoPat, x: xPasivoPat, width: colWidths.pasivoPat },
      { val: perdida, x: xPerdida, width: colWidths.perdida },
      { val: ganancia, x: xGanancia, width: colWidths.ganancia }
    ];

    valores.forEach(item => {
      if (item.val && Math.abs(item.val) > 0.01) {
        const str = formatearNumero(item.val, 2);
        const w = fontNormal.widthOfTextAtSize(str, 6);
        currentPage.drawText(str, {
          x: item.x + item.width - w - 2,
          y: yInicial - 6,
          size: 6,
          font: fontNormal,
        });
      }
    });

    const altoFila = 9;

    [xCodigo, xNombre, xSIDebe, xSIHaber, xMvDebe, xMvHaber, xSFDebe, xSFHaber, xActivo, xPasivoPat, xPerdida, xGanancia, pageWidth - margin].forEach(xPos => {
      currentPage.drawLine({
        start: { x: xPos, y: yInicial + 1 },
        end: { x: xPos, y: yInicial - altoFila + 1 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    });

    yPos -= altoFila;
    lineaIndex++;

    if (yPos < Y_MINIMO && lineaIndex < cuentas.length) {
      currentPage.drawLine({
        start: { x: margin, y: yPos + 1 },
        end: { x: pageWidth - margin, y: yPos + 1 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    }
  }

  currentPage.drawLine({
    start: { x: margin, y: yPos + 1 },
    end: { x: pageWidth - margin, y: yPos + 1 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPos -= 10;
  const altoTotales = 14;

  currentPage.drawRectangle({
    x: margin,
    y: yPos - altoTotales,
    width: usableWidth,
    height: altoTotales,
    color: rgb(1, 1, 0),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  currentPage.drawText("TOTALES", {
    x: xNombre + 2,
    y: yPos - 9,
    size: 7,
    font: fontBold,
  });

  const totalSIDebe = cuentas.reduce((sum, c) => sum + (c.saldoInicialDebe || 0), 0);
  const totalSIHaber = cuentas.reduce((sum, c) => sum + (c.saldoInicialHaber || 0), 0);
  const totalDebe = totales.totalDebe || 0;
  const totalHaber = totales.totalHaber || 0;
  const totalSFDebe = cuentas.reduce((sum, c) => sum + (c.saldoFinalDebe || 0), 0);
  const totalSFHaber = cuentas.reduce((sum, c) => sum + (c.saldoFinalHaber || 0), 0);

  const totalesData = [
    { str: formatearNumero(totalSIDebe, 2), x: xSIDebe, width: colWidths.siDebe },
    { str: formatearNumero(totalSIHaber, 2), x: xSIHaber, width: colWidths.siHaber },
    { str: formatearNumero(totalDebe, 2), x: xMvDebe, width: colWidths.mvDebe },
    { str: formatearNumero(totalHaber, 2), x: xMvHaber, width: colWidths.mvHaber },
    { str: formatearNumero(totalSFDebe, 2), x: xSFDebe, width: colWidths.sfDebe },
    { str: formatearNumero(totalSFHaber, 2), x: xSFHaber, width: colWidths.sfHaber },
    { str: formatearNumero(totalActivo, 2), x: xActivo, width: colWidths.activo },
    { str: formatearNumero(totalPasivoPat, 2), x: xPasivoPat, width: colWidths.pasivoPat },
    { str: formatearNumero(totalPerdida, 2), x: xPerdida, width: colWidths.perdida },
    { str: formatearNumero(totalGanancia, 2), x: xGanancia, width: colWidths.ganancia }
  ];

  totalesData.forEach(t => {
    const w = fontBold.widthOfTextAtSize(t.str, 7);
    currentPage.drawText(t.str, {
      x: t.x + t.width - w - 2,
      y: yPos - 8,
      size: 7,
      font: fontBold,
    });
  });

  yPos -= altoTotales + 5;

  const diferenciaBalanceGeneral = totalActivo - totalPasivoPat;
  const diferenciaGyP = totalGanancia - totalPerdida;

  currentPage.drawText(`Diferencia Balance General: ${formatearNumero(diferenciaBalanceGeneral, 2)}`, {
    x: margin,
    y: yPos,
    size: 7,
    font: fontBold,
  });

  yPos -= 10;

  currentPage.drawText(`Diferencia Ganancias y Pérdidas: ${formatearNumero(diferenciaGyP, 2)}`, {
    x: margin,
    y: yPos,
    size: 7,
    font: fontBold,
  });

  if (Math.abs(diferenciaBalanceGeneral - diferenciaGyP) > 0.01) {
    yPos -= 10;
    currentPage.drawText(`DESCUADRE: ${formatearNumero(Math.abs(diferenciaBalanceGeneral - diferenciaGyP), 2)}`, {
      x: margin,
      y: yPos,
      size: 7,
      font: fontBold,
      color: rgb(1, 0, 0)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}