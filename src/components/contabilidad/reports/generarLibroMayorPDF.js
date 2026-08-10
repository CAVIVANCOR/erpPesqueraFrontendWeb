// src/components/contabilidad/reports/generarLibroMayorPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils.js";

export async function generarLibroMayorPDF(data) {
  const { empresa, periodo, cuentas, totales, moneda } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 10;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const usableWidth = pageWidth - 2 * margin;

  const Y_MINIMO = 60;

  const esSaldoInicial = cuentas.some(cuenta =>
    cuenta.movimientos.some(mov =>
      mov.esSaldoInicial === true ||
      mov.glosa?.includes("Saldo inicial") ||
      mov.glosaAsiento?.includes("Saldo inicial")
    )
  );

  let totalMovimientos = 0;
  cuentas.forEach(cuenta => {
    totalMovimientos += cuenta.movimientos.length + 2;
  });
  const totalPaginas = Math.ceil(totalMovimientos / 35);

  let currentPage = null;
  let yPos = 0;
  let paginaActual = 1;

  const colWidths = {
    fecha: 45,
    numAsiento: 55,
    glosa: 280,
    debe: 65,
    haber: 65,
    saldo: 65
  };

  let xFecha = margin;
  let xNumAsiento = xFecha + colWidths.fecha;
  let xGlosa = xNumAsiento + colWidths.numAsiento;
  let xDebe = xGlosa + colWidths.glosa;
  let xHaber = xDebe + colWidths.debe;
  let xSaldo = xHaber + colWidths.haber;

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

    if (esSaldoInicial) {
      currentPage.drawText("Formato 6.1 Libro Mayor", {
        x: margin,
        y: y,
        size: 10,
        font: fontBold,
      });
      currentPage.drawText("LIBRO MAYOR - SALDOS INICIALES", {
        x: pageWidth - margin - fontBold.widthOfTextAtSize("LIBRO MAYOR - SALDOS INICIALES", 8),
        y: y,
        size: 8,
        font: fontBold,
      });
    } else {
      const titulo = "Formato 6.1 Libro Mayor";
      const tituloWidth = fontBold.widthOfTextAtSize(titulo, 10);
      currentPage.drawText(titulo, {
        x: (pageWidth - tituloWidth) / 2,
        y: y,
        size: 10,
        font: fontBold,
      });
    }
    y -= 14;

    currentPage.drawText(`Periodo: ${periodo.nombrePeriodo || ""}`, {
      x: margin,
      y: y,
      size: 7,
      font: fontNormal,
    });
    const textoPag = `PAG ${pagina}/${totalPaginas}`;
    currentPage.drawText(textoPag, {
      x: pageWidth - margin - fontNormal.widthOfTextAtSize(textoPag, 7),
      y: y,
      size: 7,
      font: fontNormal,
    });
    y -= 12;

    currentPage.drawText(`RUC: ${empresa.ruc || ""}`, {
      x: margin,
      y: y,
      size: 7,
      font: fontNormal,
    });
    const textoCodigo = "CTLIBR61";
    currentPage.drawText(textoCodigo, {
      x: pageWidth - margin - fontNormal.widthOfTextAtSize(textoCodigo, 7),
      y: y,
      size: 7,
      font: fontNormal,
    });
    y -= 12;

    currentPage.drawText(`Razón Social: ${empresa.razonSocial || ""}`, {
      x: margin,
      y: y,
      size: 7,
      font: fontNormal,
    });
    y -= 12;

    currentPage.drawText(`Expresado en ${moneda?.nombreLargo || "SOLES"}`, {
      x: margin,
      y: y,
      size: 7,
      font: fontNormal,
    });
    y -= 14;

    return y;
  };

  const dibujarEncabezadoTabla = () => {
    const altoCabecera = 18;
    const headers = [
      { text: "FECHA\nOPERACION", x: xFecha, width: colWidths.fecha },
      { text: "Nº\nASIENTO", x: xNumAsiento, width: colWidths.numAsiento },
      { text: "GLOSA", x: xGlosa, width: colWidths.glosa },
      { text: "DEBE", x: xDebe, width: colWidths.debe },
      { text: "HABER", x: xHaber, width: colWidths.haber },
      { text: "SALDO", x: xSaldo, width: colWidths.saldo },
    ];

    headers.forEach(header => {
      currentPage.drawRectangle({
        x: header.x,
        y: yPos - altoCabecera,
        width: header.width,
        height: altoCabecera,
        color: rgb(0.68, 0.85, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });

      const lineasHeader = header.text.split('\n');
      let yHeader = yPos - 5;
      lineasHeader.forEach(lineaTexto => {
        const textWidth = fontBold.widthOfTextAtSize(lineaTexto, 6);
        currentPage.drawText(lineaTexto, {
          x: header.x + (header.width - textWidth) / 2,
          y: yHeader,
          size: 6,
          font: fontBold,
        });
        yHeader -= 7;
      });
    });

    yPos -= altoCabecera + 2;
  };

  yPos = generarEncabezado(paginaActual);

  cuentas.forEach((cuenta) => {
    if (yPos < Y_MINIMO + 40) {
      currentPage.drawLine({
        start: { x: margin, y: yPos + 1 },
        end: { x: pageWidth - margin, y: yPos + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    }

    const yInicial = yPos;

    currentPage.drawLine({
      start: { x: margin, y: yInicial + 1 },
      end: { x: pageWidth - margin, y: yInicial + 1 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });

    currentPage.drawText(`${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`, {
      x: xFecha + 2,
      y: yInicial - 5,
      size: 6,
      font: fontBold,
    });

    [xFecha, xNumAsiento, xGlosa, xDebe, xHaber, xSaldo, pageWidth - margin].forEach(xPos => {
      currentPage.drawLine({
        start: { x: xPos, y: yInicial + 1 },
        end: { x: xPos, y: yInicial - 8 + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    yPos -= 8;

    dibujarEncabezadoTabla();

    let saldoAcumulado = 0;
    let totalDebe = 0;
    let totalHaber = 0;

    cuenta.movimientos.forEach((mov, index) => {
      if (yPos < Y_MINIMO) {
        currentPage.drawLine({
          start: { x: margin, y: yPos + 1 },
          end: { x: pageWidth - margin, y: yPos + 1 },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        paginaActual++;
        yPos = generarEncabezado(paginaActual);
        dibujarEncabezadoTabla();
      }

      const yInicial = yPos;

      currentPage.drawLine({
        start: { x: margin, y: yInicial + 1 },
        end: { x: pageWidth - margin, y: yInicial + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });

      const debe = Number(mov.debe) || 0;
      const haber = Number(mov.haber) || 0;
      saldoAcumulado += (debe - haber);
      totalDebe += debe;
      totalHaber += haber;

            const fechaAsiento = mov.fechaAsiento || mov.asientoContable?.fechaAsiento || mov.fecha;
      const fecha = fechaAsiento ? new Date(fechaAsiento) : null;

      let fechaStr = "";
      if (fecha) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = String(fecha.getFullYear()).slice(-2);
        fechaStr = `${dia}/${mes}/${anio}`;
      }
      if (fechaStr) {
        currentPage.drawText(fechaStr, {
          x: xFecha + 2,
          y: yInicial - 5,
          size: 6,
          font: fontNormal,
        });
      } else {
        console.log('❌ Fecha NO dibujada - fechaStr vacío');
      }
      const numAsiento = mov.numeroAsiento || mov.asientoContable?.numeroAsiento || mov.asientoContable?.correlativo || "";
      if (numAsiento) {
        currentPage.drawText(String(numAsiento), {
          x: xNumAsiento + 2,
          y: yInicial - 5,
          size: 6,
          font: fontNormal,
        });
      } else {
        console.log('❌ Número asiento NO dibujado - numAsiento vacío');
      }

      const esMovSaldoInicial = mov.esSaldoInicial === true ||
        mov.glosa?.includes("Saldo inicial") ||
        mov.glosaAsiento?.includes("Saldo inicial");
      const glosa = esMovSaldoInicial
        ? "Saldo inicial S/N"
        : (mov.glosa || mov.glosaAsiento || "").trim();

      const lineasGlosa = dividirTexto(glosa, colWidths.glosa - 4, fontNormal, 6);
      let yGlosa = yInicial - 5;
      lineasGlosa.forEach(lineaTexto => {
        currentPage.drawText(lineaTexto, {
          x: xGlosa + 2,
          y: yGlosa,
          size: 6,
          font: fontNormal,
        });
        yGlosa -= 8;
      });

      const debeStr = debe ? formatearNumero(debe, 2) : "";
      if (debeStr) {
        const debeWidth = fontNormal.widthOfTextAtSize(debeStr, 5);
        currentPage.drawText(debeStr, {
          x: xDebe + colWidths.debe - debeWidth - 2,
          y: yInicial - 5,
          size: 5,
          font: fontNormal,
        });
      }

      const haberStr = haber ? formatearNumero(haber, 2) : "";
      if (haberStr) {
        const haberWidth = fontNormal.widthOfTextAtSize(haberStr, 5);
        currentPage.drawText(haberStr, {
          x: xHaber + colWidths.haber - haberWidth - 2,
          y: yInicial - 5,
          size: 5,
          font: fontNormal,
        });
      }

      const saldoStr = formatearNumero(saldoAcumulado, 2);
      const saldoWidth = fontNormal.widthOfTextAtSize(saldoStr, 5);
      currentPage.drawText(saldoStr, {
        x: xSaldo + colWidths.saldo - saldoWidth - 2,
        y: yInicial - 5,
        size: 5,
        font: fontNormal,
      });

      const maxLineas = Math.max(lineasGlosa.length, 1);
      const altoBase = 8;
      const lineasAdicionales = maxLineas - 1;
      const altoFila = altoBase + (lineasAdicionales * 8);

      [xFecha, xNumAsiento, xGlosa, xDebe, xHaber, xSaldo, pageWidth - margin].forEach(xPos => {
        currentPage.drawLine({
          start: { x: xPos, y: yInicial + 1 },
          end: { x: xPos, y: yInicial - altoFila + 1 },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
      });

      yPos -= altoFila;
    });

    if (yPos < Y_MINIMO) {
      currentPage.drawLine({
        start: { x: margin, y: yPos + 1 },
        end: { x: pageWidth - margin, y: yPos + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    }

    const yTotales = yPos;
    const altoTotales = 12;

    currentPage.drawRectangle({
      x: margin,
      y: yTotales - altoTotales,
      width: usableWidth,
      height: altoTotales,
      color: rgb(0.68, 0.85, 0.9),
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    currentPage.drawText("TOTALES CUENTA:", {
      x: xGlosa + 2,
      y: yTotales - 8,
      size: 6,
      font: fontBold,
    });

    const totalDebeStr = formatearNumero(totalDebe, 2);
    const totalDebeWidth = fontBold.widthOfTextAtSize(totalDebeStr, 6);
    currentPage.drawText(totalDebeStr, {
      x: xDebe + colWidths.debe - totalDebeWidth - 2,
      y: yTotales - 7,
      size: 6,
      font: fontBold,
    });

    const totalHaberStr = formatearNumero(totalHaber, 2);
    const totalHaberWidth = fontBold.widthOfTextAtSize(totalHaberStr, 6);
    currentPage.drawText(totalHaberStr, {
      x: xHaber + colWidths.haber - totalHaberWidth - 2,
      y: yTotales - 7,
      size: 6,
      font: fontBold,
    });

    const saldoFinalStr = formatearNumero(saldoAcumulado, 2);
    const saldoFinalWidth = fontBold.widthOfTextAtSize(saldoFinalStr, 6);
    currentPage.drawText(saldoFinalStr, {
      x: xSaldo + colWidths.saldo - saldoFinalWidth - 2,
      y: yTotales - 7,
      size: 6,
      font: fontBold,
    });

    yPos -= altoTotales;
  });

  currentPage.drawLine({
    start: { x: margin, y: yPos + 1 },
    end: { x: pageWidth - margin, y: yPos + 1 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPos -= 10;
  const altoTotalesGen = 12;

  currentPage.drawRectangle({
    x: margin,
    y: yPos - altoTotalesGen,
    width: usableWidth,
    height: altoTotalesGen,
    color: rgb(0.68, 0.85, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  currentPage.drawText("TOTALES GENERALES", {
    x: xGlosa + 2,
    y: yPos - 8,
    size: 6,
    font: fontBold,
  });

  const totalDebeGenStr = formatearNumero(totales.totalDebe || 0, 2);
  const totalDebeGenWidth = fontBold.widthOfTextAtSize(totalDebeGenStr, 6);
  currentPage.drawText(totalDebeGenStr, {
    x: xDebe + colWidths.debe - totalDebeGenWidth - 2,
    y: yPos - 7,
    size: 6,
    font: fontBold,
  });

  const totalHaberGenStr = formatearNumero(totales.totalHaber || 0, 2);
  const totalHaberGenWidth = fontBold.widthOfTextAtSize(totalHaberGenStr, 6);
  currentPage.drawText(totalHaberGenStr, {
    x: xHaber + colWidths.haber - totalHaberGenWidth - 2,
    y: yPos - 7,
    size: 6,
    font: fontBold,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}