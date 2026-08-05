// src/components/contabilidad/reports/generarLibroDiarioPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils.js";

export async function generarLibroDiarioPDF(data) {
  const { empresa, periodo, lineas, totales, moneda } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 10;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const usableWidth = pageWidth - 2 * margin;
  const usableHeight = pageHeight - 2 * margin;

  const Y_MINIMO = 60;
  const totalPaginas = Math.ceil(lineas.length / 40);
  const esSaldoInicial = lineas.some(l => l.esSaldoInicial === true);

  let currentPage = null;
  let yPos = 0;
  let paginaActual = 1;
  let lineaIndex = 0;

  const colWidths = {
    numReg: 35,
    fecha: 32,
    desc: 128,
    cl: 18,
    corr: 25,
    doc: 65,
    cod: 30,
    denom: 96,
    anexo: 60,
    debe: 43,
    haber: 43,
  };

  let xNumReg = margin;
  let xFecha = xNumReg + colWidths.numReg;
  let xDesc = xFecha + colWidths.fecha;
  let xCl = xDesc + colWidths.desc;
  let xCorr = xCl + colWidths.cl;
  let xDoc = xCorr + colWidths.corr;
  let xCod = xDoc + colWidths.doc;
  let xDenom = xCod + colWidths.cod;
  let xAnexo = xDenom + colWidths.denom;
  let xDebe = xAnexo + colWidths.anexo;
  let xHaber = xDebe + colWidths.debe;

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
      currentPage.drawText("Formato 5.1 Libro Diario", {
        x: margin,
        y: y,
        size: 10,
        font: fontBold,
      });
      currentPage.drawText("SUB DIARIO 00 ASIENTO DE INICIO (APERTURA)", {
        x: pageWidth - margin - fontBold.widthOfTextAtSize("SUB DIARIO 00 ASIENTO DE INICIO (APERTURA)", 8),
        y: y,
        size: 8,
        font: fontBold,
      });
    } else {
      const titulo = "Formato 5.1 Libro Diario";
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
      x: pageWidth - margin - fontNormal.widthOfTextAtSize(textoPag, 9),
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
    const textoCodigo = "CTLIBR51";
    currentPage.drawText(textoCodigo, {
      x: pageWidth - margin - fontNormal.widthOfTextAtSize(textoCodigo, 9),
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

    const altoCabecera = 18;
    const headers = [
      { text: "NUMERO\nREGISTRO", x: xNumReg, width: colWidths.numReg },
      { text: "FECHA\nOPERACION", x: xFecha, width: colWidths.fecha },
      { text: "DESCRIPCION\nOPERACION", x: xDesc, width: colWidths.desc },
      { text: "CL", x: xCl, width: colWidths.cl },
      { text: "CORRE", x: xCorr, width: colWidths.corr },
      { text: "N°\nDOCUMENTO", x: xDoc, width: colWidths.doc },
      { text: "CODIGO", x: xCod, width: colWidths.cod },
      { text: "DENOMINACION", x: xDenom, width: colWidths.denom },
      { text: "ANEXO", x: xAnexo, width: colWidths.anexo },
      { text: "DEBE", x: xDebe, width: colWidths.debe },
      { text: "HABER", x: xHaber, width: colWidths.haber },
    ];

    headers.forEach(header => {
      currentPage.drawRectangle({
        x: header.x,
        y: y - altoCabecera,
        width: header.width,
        height: altoCabecera,
        color: rgb(0.68, 0.85, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });

      const lineasHeader = header.text.split('\n');
      let yHeader = y - 5;
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

    y -= altoCabecera + 2;
    return y;
  };

  const asientosMap = new Map();
  let correlativoAsiento = 1;
  lineas.forEach(linea => {
    if (!asientosMap.has(linea.asientoContableId)) {
      asientosMap.set(linea.asientoContableId, correlativoAsiento++);
    }
  });

  yPos = generarEncabezado(paginaActual);

  while (lineaIndex < lineas.length) {
    const linea = lineas[lineaIndex];
    const yInicial = yPos;

    currentPage.drawLine({
      start: { x: margin, y: yInicial + 1 },
      end: { x: pageWidth - margin, y: yInicial + 1 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });

    const esSI = linea.esSaldoInicial;
    const parte1 = esSI ? "00" : (linea.asientoContable?.tipoLibroContableSunat?.codigoSunat || "05");
    const correlativo = asientosMap.get(linea.asientoContableId);
    const parte2 = esSI ? "010001" : String(correlativo).padStart(6, '0');
    const numRegTexto = `${parte1} ${parte2}`;
    currentPage.drawText(numRegTexto, {
      x: xNumReg + 2,
      y: yInicial - 5,
      size: 6,
      font: fontNormal,
    });

    const fecha = linea.fechaAsiento ? new Date(linea.fechaAsiento) : null;
    const fechaStr = fecha ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${String(fecha.getFullYear()).slice(-2)}` : "";
    currentPage.drawText(fechaStr, {
      x: xFecha + 2,
      y: yInicial - 5,
      size: 6,
      font: fontNormal,
    });

    //const descripcion = `${linea.glosaAsiento || ""} ${linea.glosa || ""}`.trim();
    const descripcion = `${linea.glosa || ""}`.trim();
    const lineasDesc = dividirTexto(descripcion, colWidths.desc - 4, fontNormal, 6);
    let yDesc = yInicial - 5;
    lineasDesc.forEach(lineaTexto => {
      currentPage.drawText(lineaTexto, {
        x: xDesc + 2,
        y: yDesc,
        size: 6,
        font: fontNormal,
      });
      yDesc -= 8;
    });

    currentPage.drawText(linea.asientoContable?.tipoLibroContableSunat?.codigoSunat || "05", {
      x: xCl + 2,
      y: yInicial - 5,
      size: 6,
      font: fontNormal,
    });

    const corrLinea = esSI ? String(correlativo).padStart(4, '0') : String(linea.numeroLinea).padStart(4, '0');
    currentPage.drawText(corrLinea, {
      x: xCorr + 2,
      y: yInicial - 5,
      size: 6,
      font: fontNormal,
    });

    let numDoc = "";
    if (linea.numeroDocumentoOrigen) {
      const codigo = linea.tipoDocumentoOrigen?.codigo || "";
      const numero = linea.numeroDocumentoOrigen || "";
      let fechaDoc = "";
      if (linea.fechaDocumentoOrigen) {
        const d = new Date(linea.fechaDocumentoOrigen);
        fechaDoc = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      }
      numDoc = `${codigo} ${numero} ${fechaDoc}`.trim();
    }
    const lineasDoc = dividirTexto(numDoc, colWidths.doc - 4, fontNormal, 6);
    let yDoc = yInicial - 5;
    lineasDoc.forEach(lineaTexto => {
      currentPage.drawText(lineaTexto, {
        x: xDoc + 2,
        y: yDoc,
        size: 6,
        font: fontNormal,
      });
      yDoc -= 8;
    });

    currentPage.drawText(linea.planCuenta?.codigoCuenta || "", {
      x: xCod + 2,
      y: yInicial - 5,
      size: 6,
      font: fontNormal,
    });

    const lineasDenom = dividirTexto(linea.planCuenta?.nombreCuenta || "", colWidths.denom - 4, fontNormal, 6);
    let yDenom = yInicial - 5;
    lineasDenom.forEach(lineaTexto => {
      currentPage.drawText(lineaTexto, {
        x: xDenom + 2,
        y: yDenom,
        size: 6,
        font: fontNormal,
      });
      yDenom -= 8;
    });

    let anexo = "";
    if (linea.entidadComercial) {
      const tipoDoc = linea.entidadComercial.tipoDocumento?.codigo || "";
      const numDoc = linea.entidadComercial.numeroDocumento || "";
      anexo = `${tipoDoc} ${numDoc}`.trim();
    } else if (linea.activo) {
      anexo = linea.activo.nombre || "";
    }
    const lineasAnexo = dividirTexto(anexo, colWidths.anexo - 4, fontNormal, 6);
    let yAnexo = yInicial - 5;
    lineasAnexo.forEach(lineaTexto => {
      currentPage.drawText(lineaTexto, {
        x: xAnexo + 2,
        y: yAnexo,
        size: 6,
        font: fontNormal,
      });
      yAnexo -= 8;
    });

    const debeStr = linea.debe ? formatearNumero(linea.debe, 2) : "";
    if (debeStr) {
      const debeWidth = fontNormal.widthOfTextAtSize(debeStr, 5);
      currentPage.drawText(debeStr, {
        x: xDebe + colWidths.debe - debeWidth - 2,
        y: yInicial - 5,
        size: 5,
        font: fontNormal,
      });
    }

    const haberStr = linea.haber ? formatearNumero(linea.haber, 2) : "";
    if (haberStr) {
      const haberWidth = fontNormal.widthOfTextAtSize(haberStr, 5);
      currentPage.drawText(haberStr, {
        x: xHaber + colWidths.haber - haberWidth - 2,
        y: yInicial - 5,
        size: 5,
        font: fontNormal,
      });
    }

    const maxLineas = Math.max(
      lineasDesc.length,
      lineasDoc.length,
      lineasDenom.length,
      lineasAnexo.length,
      1
    );
    const altoBase = 8;
    const lineasAdicionales = maxLineas - 1;
    const altoFila = altoBase + (lineasAdicionales * 7);

    [xNumReg, xFecha, xDesc, xCl, xCorr, xDoc, xCod, xDenom, xAnexo, xDebe, xHaber, pageWidth - margin].forEach(xPos => {
      currentPage.drawLine({
        start: { x: xPos, y: yInicial + 1 },
        end: { x: xPos, y: yInicial - altoFila + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    yPos -= altoFila;
    lineaIndex++;

    if (yPos < Y_MINIMO && lineaIndex < lineas.length) {
      currentPage.drawLine({
        start: { x: margin, y: yPos + 1 },
        end: { x: pageWidth - margin, y: yPos + 1 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    }
  }

  currentPage.drawLine({
    start: { x: margin, y: yPos + 1 },
    end: { x: pageWidth - margin, y: yPos + 1 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPos -= 10;
  const altoTotales = 12;

  currentPage.drawRectangle({
    x: margin,
    y: yPos - altoTotales,
    width: usableWidth,
    height: altoTotales,
    color: rgb(0.68, 0.85, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  currentPage.drawText("TOTALES", {
    x: xAnexo + colWidths.anexo - fontBold.widthOfTextAtSize("TOTALES", 7) - 2,
    y: yPos - 8,
    size: 6,
    font: fontBold,
  });

  const totalDebeStr = formatearNumero(totales.totalDebe, 2);
  const totalDebeWidth = fontBold.widthOfTextAtSize(totalDebeStr, 6);
  currentPage.drawText(totalDebeStr, {
    x: xDebe + colWidths.debe - totalDebeWidth - 2,
    y: yPos - 7,
    size: 6,
    font: fontBold,
  });

  const totalHaberStr = formatearNumero(totales.totalHaber, 2);
  const totalHaberWidth = fontBold.widthOfTextAtSize(totalHaberStr, 6);
  currentPage.drawText(totalHaberStr, {
    x: xHaber + colWidths.haber - totalHaberWidth - 2,
    y: yPos - 7,
    size: 6,
    font: fontBold,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}