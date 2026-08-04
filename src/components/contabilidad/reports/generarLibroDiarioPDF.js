// src/components/contabilidad/reports/generarLibroDiarioPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generarLibroDiarioPDF(data) {
  const { empresa, periodo, lineas, totales } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 10;
  const pageWidth = 595.28;   // A4 Portrait
  const pageHeight = 841.89;  // A4 Portrait
  const celeste = rgb(0.68, 0.85, 0.9);

  const LINEAS_POR_PAGINA = 46;
  const totalPaginas = Math.ceil(lineas.length / LINEAS_POR_PAGINA);
  const esSaldoInicial = lineas.some(l => l.esSaldoInicial === true);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;
  let paginaActual = 1;
  let lineaIndex = 0;

  // Posiciones X de columnas
  const xNumReg = margin;
  const xFecha = margin + 60;
  const xDesc = margin + 105;
  const xCL = margin + 260;
  const xCorr = margin + 280;
  const xDoc = margin + 320;
  const xCod = margin + 380;
  const xDenom = margin + 420;
  const xAnexo = margin + 490;
  const xDebe = margin + 520;
  const xHaber = margin + 555;

  // Función para dividir texto
  const dividirTexto = (texto, maxAncho, font, fontSize) => {
    if (!texto) return [""];
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';

    palabras.forEach(palabra => {
      const test = lineaActual + (lineaActual ? ' ' : '') + palabra;
      const ancho = font.widthOfTextAtSize(test, fontSize);

      if (ancho <= maxAncho) {
        lineaActual = test;
      } else {
        if (lineaActual) lineas.push(lineaActual);
        lineaActual = palabra;
      }
    });

    if (lineaActual) lineas.push(lineaActual);
    return lineas;
  };

  // Función para generar encabezado
  const generarEncabezado = (pagina) => {
    let y = pageHeight - margin;

    // TÍTULO
    if (esSaldoInicial) {
      page.drawText("Formato 5.1 Libro Diario", {
        x: margin,
        y: y,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      const textoSub = "SUB DIARIO 00 ASIENTO DE INICIO (APERTURA)";
      const anchoSub = fontBold.widthOfTextAtSize(textoSub, 9);
      page.drawText(textoSub, {
        x: pageWidth - margin - anchoSub,
        y: y,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    } else {
      const titulo = "Formato 5.1 Libro Diario";
      const anchoTitulo = fontBold.widthOfTextAtSize(titulo, 11);
      page.drawText(titulo, {
        x: (pageWidth - anchoTitulo) / 2,
        y: y,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }
    y -= 14;

    // PERIODO Y PÁGINA
    page.drawText(`Periodo: ${periodo.nombrePeriodo || ""}`, {
      x: margin,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    const textoPag = `PAG ${pagina}/${totalPaginas}`;
    const anchoPag = fontNormal.widthOfTextAtSize(textoPag, 8);
    page.drawText(textoPag, {
      x: pageWidth - margin - anchoPag,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    y -= 12;

    // RUC Y CÓDIGO
    page.drawText(`RUC: ${empresa.ruc || ""}`, {
      x: margin,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    const textoCod = "CTLIBR51";
    const anchoCod = fontNormal.widthOfTextAtSize(textoCod, 8);
    page.drawText(textoCod, {
      x: pageWidth - margin - anchoCod,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    y -= 12;

    // RAZÓN SOCIAL
    page.drawText(`Razón Social: ${empresa.razonSocial || ""}`, {
      x: margin,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    y -= 12;

    // EXPRESADO EN
    page.drawText(`Expresado en ${lineas[0]?.moneda?.nombreLargo || "SOLES"}`, {
      x: margin,
      y: y,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    y -= 14;

    // CABECERA TABLA
    const altoCabecera = 18;
    page.drawRectangle({
      x: margin,
      y: y - altoCabecera,
      width: pageWidth - 2 * margin,
      height: altoCabecera,
      color: celeste,
    });

    const headers = [
      { text: "NUMERO\nREGISTRO", x: xNumReg + 2 },
      { text: "FECHA\nOPER", x: xFecha + 2 },
      { text: "DESCRIPCION OPERACION", x: xDesc + 2 },
      { text: "CL", x: xCL + 2 },
      { text: "CORR", x: xCorr + 2 },
      { text: "N° DOC", x: xDoc + 2 },
      { text: "COD", x: xCod + 2 },
      { text: "DENOMINACION", x: xDenom + 2 },
      { text: "ANEXO", x: xAnexo + 2 },
      { text: "DEBE", x: xDebe + 2 },
      { text: "HABER", x: xHaber + 2 },
    ];

    headers.forEach(h => {
      const lineasTexto = h.text.split('\n');
      let yHeader = y - 6;
      lineasTexto.forEach(linea => {
        page.drawText(linea, {
          x: h.x,
          y: yHeader,
          size: 7,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        yHeader -= 8;
      });
    });

    y -= altoCabecera + 2;
    return y;
  };

  // Generar correlativo de asiento
  const asientosMap = new Map();
  let correlativoAsiento = 1;
  lineas.forEach(linea => {
    if (!asientosMap.has(linea.asientoContableId)) {
      asientosMap.set(linea.asientoContableId, correlativoAsiento++);
    }
  });

  // Generar primera página
  yPos = generarEncabezado(paginaActual);

  // Procesar líneas
  while (lineaIndex < lineas.length) {
    const linea = lineas[lineaIndex];
    const yInicial = yPos;
  
    // NUMERO REGISTRO
    const esSI = linea.esSaldoInicial;
    const parte1 = esSI ? "00" : (linea.codigoSunatTipoLibro || "05");
    const correlativo = asientosMap.get(linea.asientoContableId);
    const parte2 = esSI ? "010001" : String(correlativo).padStart(6, '0');
    page.drawText(`${parte1} ${parte2}`, {
      x: xNumReg,
      y: yInicial,
      size: 7,
      font: fontNormal,
    });

    // FECHA
    const fecha = linea.fechaAsiento ? new Date(linea.fechaAsiento) : null;
    const fechaStr = fecha ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${String(fecha.getFullYear()).slice(-2)}` : "";
    page.drawText(fechaStr, {
      x: xFecha,
      y: yInicial,
      size: 7,
      font: fontNormal,
    });

    // DESCRIPCION (multilínea)
    const descripcion = `${linea.glosaAsiento || ""} ${linea.glosa || ""}`.trim();
    const lineasDesc = dividirTexto(descripcion, 150, fontNormal, 7);
    let yDesc = yInicial;
    lineasDesc.forEach(lineaTexto => {
      page.drawText(lineaTexto, {
        x: xDesc,
        y: yDesc,
        size: 7,
        font: fontNormal,
      });
      yDesc -= 8;
    });

    // CL
    page.drawText(linea.codigoSunatTipoLibro || "05", {
      x: xCL,
      y: yInicial,
      size: 7,
      font: fontNormal,
    });

    // CORRELATIVO
    const corrLinea = esSI ? String(correlativo).padStart(4, '0') : String(linea.numeroLinea).padStart(4, '0');
    page.drawText(corrLinea, {
      x: xCorr,
      y: yInicial,
      size: 7,
      font: fontNormal,
    });

    // N° DOCUMENT (multilínea)
    let numDoc = "";
    if (linea.numeroDocumentoOrigen) {
      const codigo = linea.codigoTipoDocumentoOrigen || "";
      const numero = linea.numeroDocumentoOrigen || "";
      let fechaDoc = "";
      if (linea.fechaDocumentoOrigen) {
        const d = new Date(linea.fechaDocumentoOrigen);
        fechaDoc = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      }
      numDoc = `${codigo} ${numero} ${fechaDoc}`.trim();
    }
    const lineasDoc = dividirTexto(numDoc, 55, fontNormal, 7);
    let yDoc = yInicial;
    lineasDoc.forEach(lineaTexto => {
      page.drawText(lineaTexto, {
        x: xDoc,
        y: yDoc,
        size: 7,
        font: fontNormal,
      });
      yDoc -= 8;
    });

    // CODIGO
    page.drawText(linea.codigoCuenta || "", {
      x: xCod,
      y: yInicial,
      size: 7,
      font: fontNormal,
    });

    // DENOMINACION (multilínea)
    const lineasDenom = dividirTexto(linea.nombreCuenta || "", 65, fontNormal, 7);
    let yDenom = yInicial;
    lineasDenom.forEach(lineaTexto => {
      page.drawText(lineaTexto, {
        x: xDenom,
        y: yDenom,
        size: 7,
        font: fontNormal,
      });
      yDenom -= 8;
    });

    // ANEXO (multilínea)
    let anexo = "";
    if (linea.rucEntidad) {
      anexo = `${linea.codigoTipoDocEntidad || ""} ${linea.numeroDocEntidad || ""}`.trim();
    } else if (linea.nombreActivo) {
      anexo = linea.nombreActivo;
    }
    const lineasAnexo = dividirTexto(anexo, 25, fontNormal, 7);
    let yAnexo = yInicial;
    lineasAnexo.forEach(lineaTexto => {
      page.drawText(lineaTexto, {
        x: xAnexo,
        y: yAnexo,
        size: 7,
        font: fontNormal,
      });
      yAnexo -= 8;
    });

    // DEBE
    if (linea.debe > 0) {
      const debeStr = linea.debe.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(debeStr, {
        x: xDebe,
        y: yInicial,
        size: 7,
        font: fontNormal,
      });
    }

    // HABER
    if (linea.haber > 0) {
      const haberStr = linea.haber.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(haberStr, {
        x: xHaber,
        y: yInicial,
        size: 7,
        font: fontNormal,
      });
    }

    // Calcular altura de fila
    const alturaFila = Math.max(
      lineasDesc.length * 8,
      lineasDoc.length * 8,
      lineasDenom.length * 8,
      lineasAnexo.length * 8,
      10
    );

    yPos -= alturaFila + 1;
    lineaIndex++;

    // Verificar salto de página
    const lineasEnPagina = (lineaIndex % LINEAS_POR_PAGINA);
    if (lineasEnPagina === 0 && lineaIndex < lineas.length) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    } else if (yPos < margin + 30 && lineaIndex < lineas.length) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      paginaActual++;
      yPos = generarEncabezado(paginaActual);
    }
  }

  // TOTALES
  yPos -= 10;
  page.drawRectangle({
    x: margin,
    y: yPos - 14,
    width: pageWidth - 2 * margin,
    height: 14,
    color: celeste,
  });

  page.drawText("TOTALES", {
    x: xAnexo,
    y: yPos - 10,
    size: 8,
    font: fontBold,
  });

  const debeTotal = totales.totalDebe.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  page.drawText(debeTotal, {
    x: xDebe,
    y: yPos - 10,
    size: 8,
    font: fontBold,
  });

  const haberTotal = totales.totalHaber.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  page.drawText(haberTotal, {
    x: xHaber,
    y: yPos - 10,
    size: 8,
    font: fontBold,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}