/**
 * ComprobanteElectronicoPDF.js
 *
 * Representación impresa (PDF) del comprobante electrónico de venta (factura, boleta, nota de crédito o débito) emitido
 * por el ERP con Smart PSE. Usa pdf-lib como el resto de PDFs del ERP (ver PreFacturaPDF.js) y se guarda en la venta con el
 * mismo servicio de PDF (módulo "pre-factura" > urlPreFacturaPdf), que es el PDF que muestra PdfComprobanteVentaCard.
 *
 * Los datos salen del propio comprobante (lo que se firmó y envió a SUNAT), no de la venta: así el PDF dice exactamente
 * lo mismo que el XML. El monto en letras (leyenda 1000) lo entrega el servidor para que coincida con el XML, y el QR es el
 * que se generó al aceptarse el comprobante.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const A4 = [595.28, 841.89];
const MARGEN = 40;
const AZUL = rgb(0.16, 0.5, 0.73);
const GRIS = rgb(0.45, 0.45, 0.45);

const TITULO_TIPO = {
  "01": "FACTURA ELECTRÓNICA",
  "03": "BOLETA DE VENTA ELECTRÓNICA",
  "07": "NOTA DE CRÉDITO ELECTRÓNICA",
  "08": "NOTA DE DÉBITO ELECTRÓNICA",
};

// Las fuentes estándar de PDF solo dibujan Latin-1: cualquier otro carácter (emojis, comillas tipográficas...) haría fallar
// la generación, así que se reemplaza por un espacio. También se quitan los saltos de línea.
const limpiar = (texto) =>
  String(texto ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// pdf-lib no parte el texto solo: se divide en líneas que quepan en el ancho dado (una palabra muy larga se corta)
const ajustarTexto = (texto, font, size, ancho) => {
  const lineas = [];
  let actual = "";
  for (const palabra of limpiar(texto).split(" ").filter(Boolean)) {
    let p = palabra;
    while (font.widthOfTextAtSize(p, size) > ancho) {
      let corte = p.length - 1;
      while (corte > 1 && font.widthOfTextAtSize(p.slice(0, corte), size) > ancho) corte--;
      if (actual) {
        lineas.push(actual);
        actual = "";
      }
      lineas.push(p.slice(0, corte));
      p = p.slice(corte);
    }
    const prueba = actual ? `${actual} ${p}` : p;
    if (font.widthOfTextAtSize(prueba, size) <= ancho) actual = prueba;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
};

const incrustarLogo = async (pdfDoc, empresa) => {
  if (!empresa?.logo || !empresa?.id) return null;
  try {
    const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`);
    if (!respuesta.ok) return null;
    const bytes = await respuesta.arrayBuffer();
    return empresa.logo.toLowerCase().includes(".png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  } catch (error) {
    console.error("No se pudo cargar el logo para el PDF del comprobante:", error);
    return null;
  }
};

// QR con el formato oficial de SUNAT (RS 097-2012, anexo técnico, numeral 5.1.3): RUC|tipo|serie|número|IGV|total|fecha|
// tipo doc. cliente|nº doc. cliente|Valor Resumen (hash). Se arma siempre aquí con los datos del comprobante
const incrustarQr = async (pdfDoc, c) => {
  try {
    const contenido = [
      c.empresa?.ruc,
      c.tipoComprobante?.codigoSunat,
      c.numeroSerie,
      String(c.numeroCorrelativo).padStart(8, "0"),
      Number(c.totalIgv).toFixed(2),
      Number(c.totalComprobante).toFixed(2),
      new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date(c.fechaEmision)),
      String(Number(c.tipoDocumentoCliente?.codSunat) || 0),
      c.numeroDocumentoCliente || "-",
      c.hashCpe || "",
    ].join("|") + "|";
    const url = await QRCode.toDataURL(contenido, { margin: 1 });
    return await pdfDoc.embedPng(url);
  } catch (error) {
    console.error("No se pudo generar el QR del comprobante:", error);
    return null;
  }
};

/**
 * Genera los bytes del PDF del comprobante electrónico.
 * @param {Object} c - Comprobante tal como lo entrega GET /comprobante-electronico (empresa, moneda, detalles, cuotas, montoEnLetras...)
 */
export async function generarPDFComprobanteElectronico(c) {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const [ANCHO, ALTO] = A4;
  const anchoUtil = ANCHO - MARGEN * 2;
  const simbolo = c.moneda?.simbolo || "S/";
  const codigoTipo = String(c.tipoComprobante?.codigoSunat || "");
  const esDemo = String(c.empresa?.facturacionElectronicaEntorno || "").toUpperCase() !== "PRODUCCION";
  const num = (v, d = 2) => formatearNumero(Number(v || 0), d);

  let page = pdfDoc.addPage(A4);
  let y = ALTO - MARGEN;

  const texto = (t, x, yy, { size = 9, bold = false, color = rgb(0, 0, 0), alinear = "izq", ancho = 0 } = {}) => {
    const f = bold ? fontBold : font;
    const limpio = limpiar(t);
    let xx = x;
    if (alinear === "der") xx = x + ancho - f.widthOfTextAtSize(limpio, size);
    if (alinear === "centro") xx = x + (ancho - f.widthOfTextAtSize(limpio, size)) / 2;
    page.drawText(limpio, { x: xx, y: yy, size, font: f, color });
  };

  // Formato de la representación impresa: recuadros en negro, datos del cliente a dos columnas, tabla de ítems que ocupa la
  // hoja hasta el pie (cantidad, unidad, código, descripción, valor y precio de venta unitarios, descuento y total) y, abajo,
  // el monto en letras, el QR y el cuadro de totales.
  const NEGRO = rgb(0, 0, 0);
  const caja = (x, yTope, ancho, alto, grosor = 0.8) =>
    page.drawRectangle({ x, y: yTope - alto, width: ancho, height: alto, borderColor: NEGRO, borderWidth: grosor });

  // ───────────── ENCABEZADO: emisor a la izquierda, cuadro del comprobante a la derecha ─────────────
  const anchoCuadro = 190;
  const xCuadro = ANCHO - MARGEN - anchoCuadro;
  const altoCuadro = 82;

  const logo = await incrustarLogo(pdfDoc, c.empresa);
  let xEmisor = MARGEN;
  if (logo) {
    const dims = logo.size();
    const anchoLogo = 90;
    const altoLogo = Math.min(anchoLogo / (dims.width / dims.height), 70);
    page.drawImage(logo, { x: MARGEN, y: y - altoLogo, width: anchoLogo, height: altoLogo });
    xEmisor = MARGEN + anchoLogo + 10;
  }
  const anchoEmisor = xCuadro - xEmisor - 10;
  let yEmisor = y - 10;
  for (const linea of ajustarTexto(c.empresa?.razonSocial || "EMPRESA", fontBold, 11, anchoEmisor)) {
    texto(linea, xEmisor, yEmisor, { size: 11, bold: true });
    yEmisor -= 13;
  }
  const datosEmisor = [c.empresa?.direccion, c.empresa?.telefono && `Tel: ${c.empresa.telefono}`, c.empresa?.email].filter(Boolean);
  for (const dato of datosEmisor) {
    for (const linea of ajustarTexto(dato, font, 8, anchoEmisor)) {
      texto(linea, xEmisor, yEmisor, { size: 8, color: GRIS });
      yEmisor -= 10;
    }
  }

  caja(xCuadro, y, anchoCuadro, altoCuadro, 1.5);
  texto(`R.U.C. ${c.empresa?.ruc || "-"}`, xCuadro, y - 24, { size: 12, bold: true, alinear: "centro", ancho: anchoCuadro });
  texto(TITULO_TIPO[codigoTipo] || "COMPROBANTE ELECTRÓNICO", xCuadro, y - 46, { size: 10.5, bold: true, alinear: "centro", ancho: anchoCuadro });
  texto(c.numeroCompleto || `${c.numeroSerie}-${String(c.numeroCorrelativo).padStart(8, "0")}`, xCuadro, y - 68, { size: 13, bold: true, alinear: "centro", ancho: anchoCuadro });

  y = Math.min(y - altoCuadro, yEmisor) - 14;

  // ───────────── DATOS DEL CLIENTE Y DEL COMPROBANTE (dos columnas) ─────────────
  const dibujarFilas = (filasBloque, x, anchoEtiqueta, anchoTotal, yInicio) => {
    let yy = yInicio;
    for (const [etiqueta, valor] of filasBloque) {
      const lineas = ajustarTexto(valor || "-", font, 8, anchoTotal - anchoEtiqueta - 6);
      texto(etiqueta, x, yy - 8, { size: 8, bold: true });
      texto(":", x + anchoEtiqueta - 8, yy - 8, { size: 8, bold: true });
      lineas.forEach((l, i) => texto(l, x + anchoEtiqueta, yy - 8 - i * 10, { size: 8 }));
      yy -= Math.max(1, lineas.length) * 10 + 4;
    }
    return yy;
  };
  const anchoColIzq = 320;
  const xColDer = MARGEN + anchoColIzq + 14;
  const filasIzq = [
    ["FECHA DE EMISIÓN", `${formatearFecha(c.fechaEmision)} ${c.horaEmision || ""}`.trim()],
    c.fechaVencimiento ? ["FECHA DE VENCIMIENTO", formatearFecha(c.fechaVencimiento)] : null,
    ["SEÑOR(ES)", c.razonSocialCliente],
    ["DIRECCIÓN", c.direccionCliente],
    c.ordenCompra ? ["ORDEN DE COMPRA", c.ordenCompra] : null,
    c.guiaRemision ? ["GUÍA DE REMISIÓN", c.guiaRemision] : null,
  ].filter(Boolean);
  const filasDer = [
    ["NRO DE DOCUMENTO", c.numeroDocumentoCliente],
    ["TIPO DOCUMENTO", c.tipoDocumentoCliente?.codigo],
    ["MONEDA", c.moneda?.nombreLargo || c.moneda?.codigoSunat],
    ["FORMA DE PAGO", c.formaPago?.nombre],
  ];
  const yIzq = dibujarFilas(filasIzq, MARGEN, 112, anchoColIzq, y);
  const yDer = dibujarFilas(filasDer, xColDer, 92, MARGEN + anchoUtil - xColDer, y);
  y = Math.min(yIzq, yDer) - 8;

  // ───────────── TABLA DE ÍTEMS ─────────────
  const columnas = [
    { titulo: "CANT.", ancho: 38, alinear: "centro" },
    { titulo: "UNID.", ancho: 36, alinear: "centro" },
    { titulo: "CÓD.", ancho: 46, alinear: "centro" },
    { titulo: "DESCRIPCIÓN", ancho: 211, alinear: "izq" },
    { titulo: "VALOR VTA.\nUNITARIO", ancho: 66, alinear: "der" },
    { titulo: "PRECIO VTA.\nUNITARIO", ancho: 66, alinear: "der" },
    { titulo: "TOTAL", ancho: 52, alinear: "der" },
  ];
  const anchoTabla = columnas.reduce((s, col) => s + col.ancho, 0);
  const COL_DESCRIPCION = 3;
  const ALTO_CABECERA = 24;
  // Reserva al pie para el monto en letras, el QR y los totales: la tabla llega hasta ahí en cada hoja
  const ALTO_PIE = 215;
  let yTopeTabla = y;

  const dibujarCabeceraTabla = () => {
    yTopeTabla = y;
    let x = MARGEN;
    for (const col of columnas) {
      col.titulo.split("\n").forEach((t, k) => texto(t, x + 2, y - 10 - k * 8, { size: 7, bold: true, alinear: "centro", ancho: col.ancho - 4 }));
      x += col.ancho;
    }
    y -= ALTO_CABECERA;
  };

  // Marco de la tabla hasta el pie reservado, con la línea bajo los títulos y las divisiones de columnas
  const cerrarMarcoTabla = () => {
    const yFondo = MARGEN + ALTO_PIE;
    caja(MARGEN, yTopeTabla, anchoTabla, yTopeTabla - yFondo);
    page.drawLine({ start: { x: MARGEN, y: yTopeTabla - ALTO_CABECERA }, end: { x: MARGEN + anchoTabla, y: yTopeTabla - ALTO_CABECERA }, thickness: 0.8, color: NEGRO });
    let x = MARGEN;
    for (const col of columnas.slice(0, -1)) {
      x += col.ancho;
      page.drawLine({ start: { x, y: yTopeTabla }, end: { x, y: yFondo }, thickness: 0.6, color: NEGRO });
    }
  };

  const nuevaPagina = () => {
    cerrarMarcoTabla();
    page = pdfDoc.addPage(A4);
    y = ALTO - MARGEN;
  };

  // Las líneas de ANTICIPO (anticipo = true) no son ítems: se muestran en los totales como descuento y en las leyendas
  const lineasAnticipo = (c.detalles || []).filter((d) => d.anticipo);
  const totalAnticipos = lineasAnticipo.reduce((suma, d) => suma + Number(d.total || 0), 0);

  dibujarCabeceraTabla();
  for (const d of (c.detalles || []).filter((linea) => !linea.anticipo)) {
    // La línea puede ir sin descripción armada (mostrarDescripcionArmada = false): entonces solo se imprime la observación, igual que en el XML
    const sinDescripcionArmada = d.mostrarDescripcionArmada === false;
    const anchoDesc = columnas[COL_DESCRIPCION].ancho - 6;
    const lineasDesc = sinDescripcionArmada ? [] : ajustarTexto(d.descripcion, font, 8, anchoDesc);
    const altoDescripcion = sinDescripcionArmada ? 0 : Math.max(1, lineasDesc.length) * 10;
    // Observación de la línea (misma que viaja en el XML): debajo de la descripción, en letra menor. Solo caracteres que admite la fuente.
    const lineasObs = String(d.observaciones || "")
      .replace(/[^\x20-\x7E\u00A0-\u00FF\n\r]/g, "?")
      .split(/\r?\n/)
      .flatMap((parrafo) => ajustarTexto(parrafo.trim(), font, 7, anchoDesc))
      .filter(Boolean);
    const alto = Math.max(altoDescripcion + lineasObs.length * 9, 10) + 6;
    if (y - alto < MARGEN + ALTO_PIE + 4) {
      nuevaPagina();
      dibujarCabeceraTabla();
    }
    const cantidad = Number(d.cantidad || 0);
    // El precio de venta unitario incluye el IGV (total de la línea entre la cantidad); el valor unitario es el que viaja al XML
    const precioVentaUnitario = cantidad > 0 ? Number(d.total || 0) / cantidad : 0;
    const celdas = [
      num(d.cantidad, 2),
      d.nombreUnidad || d.codigoUnidadSUNAT || "",
      d.codigoProducto || "",
      null,
      num(d.valorUnitario, 2),
      num(precioVentaUnitario, 2),
      num(d.total, 2),
    ];
    let x = MARGEN;
    columnas.forEach((col, i) => {
      if (i === COL_DESCRIPCION) {
        lineasDesc.forEach((l, k) => texto(l, x + 3, y - 9 - k * 10, { size: 8 }));
        lineasObs.forEach((l, k) => texto(l, x + 3, y - 9 - altoDescripcion - k * 9 + (sinDescripcionArmada ? 0 : 1), { size: 7, color: rgb(0.35, 0.35, 0.35) }));
      } else {
        texto(celdas[i], x + 2, y - 9, { size: 8, alinear: col.alinear, ancho: col.ancho - 4 });
      }
      x += col.ancho;
    });
    y -= alto;
  }
  cerrarMarcoTabla();

  // ───────────── PIE: MONTO EN LETRAS, LEYENDAS Y QR A LA IZQUIERDA; TOTALES A LA DERECHA ─────────────
  const yPie = MARGEN + ALTO_PIE - 8;
  const anchoTotales = 170;
  const xTotales = MARGEN + anchoUtil - anchoTotales;
  const anchoIzquierda = xTotales - MARGEN - 10;

  const filasTotales = [
    ["OP. GRATUITAS", c.totalGratuito],
    ["OP. EXONERADA", c.totalExonerado],
    ["OP. INAFECTA", c.totalInafecto],
    ["OP. GRAVADA", c.totalGravado],
    ["I.S.C.", c.totalIsc],
    ["I.G.V.", c.totalIgv],
    totalAnticipos > 0 && ["(-) ANTICIPOS", -totalAnticipos],
    [totalAnticipos > 0 ? "IMPORTE A PAGAR" : "IMPORTE TOTAL", c.totalComprobante, true],
  ].filter(Boolean);
  const altoFila = 12;
  caja(xTotales, yPie, anchoTotales, filasTotales.length * altoFila + 6);
  let yFila = yPie - 11;
  for (const [etiqueta, valor, resaltar] of filasTotales) {
    texto(etiqueta, xTotales + 4, yFila, { size: 8, bold: Boolean(resaltar) });
    texto(simbolo, xTotales + 98, yFila, { size: 8, bold: Boolean(resaltar) });
    texto(num(valor), xTotales + 100, yFila, { size: 8, bold: Boolean(resaltar), alinear: "der", ancho: anchoTotales - 104 });
    yFila -= altoFila;
  }

  // Monto en letras en un recuadro
  const lineasSon = ajustarTexto(`SON: ${c.montoEnLetras || ""}`, fontBold, 8, anchoIzquierda - 8);
  const altoSon = lineasSon.length * 10 + 8;
  caja(MARGEN, yPie, anchoIzquierda, altoSon);
  lineasSon.forEach((l, k) => texto(l, MARGEN + 4, yPie - 11 - k * 10, { size: 8, bold: true }));
  let yLey = yPie - altoSon - 6;

  const leyendas = [];
  if (lineasAnticipo.length > 0) {
    leyendas.push(`ANTICIPOS DESCONTADOS: ${lineasAnticipo.map((d) => `${d.codigoProducto} (${simbolo} ${num(d.total)})`).join(", ")}`);
  }
  if (c.sujetoDetraccion && Number(c.montoDetraccion) > 0) {
    leyendas.push(
      `Operación sujeta al Sistema de Pago de Obligaciones Tributarias (SPOT): ${num(c.porcentajeDetraccion)}% - Monto de la detracción S/ ${num(c.montoDetraccion)}${c.empresa?.cuentaDetraccion ? ` - Cuenta Banco de la Nación N° ${c.empresa.cuentaDetraccion}` : ""}`,
    );
  }
  if ((c.cuotas || []).length > 0) {
    leyendas.push(
      `Crédito - Cuotas: ${c.cuotas.map((q) => `N° ${q.numeroCuota}: ${simbolo} ${num(q.montoCuota)} vence ${formatearFecha(q.fechaVencimiento)}`).join("; ")}`,
    );
  }
  for (const leyenda of leyendas) {
    for (const linea of ajustarTexto(leyenda, font, 7.5, anchoIzquierda)) {
      texto(linea, MARGEN, yLey - 7, { size: 7.5 });
      yLey -= 9;
    }
    yLey -= 3;
  }

  const qr = await incrustarQr(pdfDoc, c);
  const lado = 80;
  const yQr = Math.min(yLey - 4, yPie - altoSon - 10);
  if (qr) page.drawImage(qr, { x: MARGEN, y: yQr - lado, width: lado, height: lado });
  const xTxt = MARGEN + lado + 10;
  let yTxt = yQr - 8;
  const pie = [
    `Representación impresa de la ${(TITULO_TIPO[codigoTipo] || "comprobante electrónico").toLowerCase()}.`,
    "Consulte la validez del comprobante en el portal de SUNAT (www.sunat.gob.pe) con el RUC del emisor, tipo, serie y número.",
    c.hashCpe ? `Hash: ${c.hashCpe}` : null,
    c.descripcionEstadoProveedor ? `Estado SUNAT: ${c.descripcionEstadoProveedor}` : null,
  ].filter(Boolean);
  for (const p of pie) {
    for (const linea of ajustarTexto(p, font, 7.5, xTotales - 10 - xTxt)) {
      texto(linea, xTxt, yTxt, { size: 7.5, color: GRIS });
      yTxt -= 9;
    }
  }

  // ───────────── MARCA DE PRUEBA Y NUMERACIÓN DE PÁGINAS ─────────────
  const paginas = pdfDoc.getPages();
  paginas.forEach((p, i) => {
    if (esDemo) {
      p.drawText("DOCUMENTO DE PRUEBA - SIN VALOR TRIBUTARIO", { x: MARGEN, y: 20, size: 8, font: fontBold, color: rgb(0.8, 0.1, 0.1) });
    }
    const t = `Pág. ${i + 1} de ${paginas.length}`;
    p.drawText(t, { x: ANCHO - MARGEN - font.widthOfTextAtSize(t, 8), y: 20, size: 8, font, color: GRIS });
  });

  return pdfDoc.save();
}

/**
 * Genera el PDF del comprobante y lo guarda en la venta (reemplaza el PDF anterior de la venta, igual que el PDF de SUNAT).
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function generarYSubirPDFComprobanteElectronico(comprobante, preFacturaId) {
  try {
    const bytes = await generarPDFComprobanteElectronico(comprobante);
    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: "application/pdf" }), `COMPROBANTE-${comprobante.numeroCompleto}.pdf`);
    formData.append("moduleName", "pre-factura");
    formData.append("entityId", preFacturaId);

    const token = useAuthStore.getState().token;
    const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      throw new Error(cuerpo.error || cuerpo.mensaje || `Error HTTP ${respuesta.status} al guardar el PDF`);
    }
    const resultado = await respuesta.json();
    return { success: true, url: resultado.url };
  } catch (error) {
    console.error("Error al generar el PDF del comprobante:", error);
    return { success: false, error: error.message };
  }
}
