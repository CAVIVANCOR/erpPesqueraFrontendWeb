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

  page.drawRectangle({ x: xCuadro, y: y - altoCuadro, width: anchoCuadro, height: altoCuadro, borderColor: AZUL, borderWidth: 1.5 });
  texto(`R.U.C. ${c.empresa?.ruc || "-"}`, xCuadro, y - 22, { size: 12, bold: true, alinear: "centro", ancho: anchoCuadro });
  texto(TITULO_TIPO[codigoTipo] || "COMPROBANTE ELECTRÓNICO", xCuadro, y - 44, { size: 10, bold: true, color: AZUL, alinear: "centro", ancho: anchoCuadro });
  texto(c.numeroCompleto || `${c.numeroSerie}-${String(c.numeroCorrelativo).padStart(8, "0")}`, xCuadro, y - 66, { size: 13, bold: true, alinear: "centro", ancho: anchoCuadro });

  y = Math.min(y - altoCuadro, yEmisor) - 16;

  // ───────────── DATOS DEL CLIENTE Y DEL COMPROBANTE ─────────────
  const filas = [
    ["Señor(es):", c.razonSocialCliente],
    [`${c.tipoDocumentoCliente?.codigo || "Documento"}:`, c.numeroDocumentoCliente],
    ["Dirección:", c.direccionCliente],
    ["Fecha de emisión:", `${formatearFecha(c.fechaEmision)} ${c.horaEmision || ""}`.trim()],
    c.fechaVencimiento ? ["Fecha de vencimiento:", formatearFecha(c.fechaVencimiento)] : null,
    ["Moneda:", `${c.moneda?.nombreLargo || c.moneda?.codigoSunat || ""} (${c.moneda?.codigoSunat || ""})`],
    ["Condición de pago:", c.formaPago?.nombre],
    c.ordenCompra ? ["Orden de compra:", c.ordenCompra] : null,
    c.guiaRemision ? ["Guía de remisión:", c.guiaRemision] : null,
  ].filter(Boolean);

  const yInicioCliente = y;
  y -= 4;
  for (const [etiqueta, valor] of filas) {
    const lineas = ajustarTexto(valor || "-", font, 9, anchoUtil - 110);
    texto(etiqueta, MARGEN + 4, y - 9, { size: 9, bold: true });
    lineas.forEach((l, i) => texto(l, MARGEN + 110, y - 9 - i * 11, { size: 9 }));
    y -= Math.max(1, lineas.length) * 11 + 2;
  }
  page.drawRectangle({ x: MARGEN, y: y - 2, width: anchoUtil, height: yInicioCliente - y + 2, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.8 });
  y -= 16;

  // ───────────── TABLA DE ÍTEMS ─────────────
  const columnas = [
    { titulo: "Cant.", ancho: 50, alinear: "der" },
    { titulo: "Unidad", ancho: 42, alinear: "izq" },
    { titulo: "Código", ancho: 62, alinear: "izq" },
    { titulo: "Descripción", ancho: 211, alinear: "izq" },
    { titulo: "V. Unitario", ancho: 72, alinear: "der" },
    { titulo: "Valor de venta", ancho: 78, alinear: "der" },
  ];
  const anchoTabla = columnas.reduce((s, col) => s + col.ancho, 0);

  const dibujarCabeceraTabla = () => {
    page.drawRectangle({ x: MARGEN, y: y - 14, width: anchoTabla, height: 16, color: AZUL });
    let x = MARGEN;
    for (const col of columnas) {
      texto(col.titulo, x + 3, y - 10, { size: 8, bold: true, color: rgb(1, 1, 1), alinear: col.alinear, ancho: col.ancho - 6 });
      x += col.ancho;
    }
    y -= 16;
  };

  // Reserva al pie para totales, QR y leyendas: si no cabe, esa parte pasa a una hoja nueva
  const ALTO_PIE = 215;
  const nuevaPagina = () => {
    page = pdfDoc.addPage(A4);
    y = ALTO - MARGEN;
  };

  dibujarCabeceraTabla();
  for (const d of c.detalles || []) {
    const lineasDesc = ajustarTexto(d.descripcion, font, 8, columnas[3].ancho - 6);
    const alto = Math.max(1, lineasDesc.length) * 10 + 5;
    if (y - alto < MARGEN + 40) {
      nuevaPagina();
      dibujarCabeceraTabla();
    }
    const celdas = [
      num(d.cantidad, 2),
      d.codigoUnidadSUNAT || d.nombreUnidad || "",
      d.codigoProducto || "",
      null,
      num(d.valorUnitario, 4),
      num(d.subtotal, 2),
    ];
    let x = MARGEN;
    columnas.forEach((col, i) => {
      if (i === 3) lineasDesc.forEach((l, k) => texto(l, x + 3, y - 9 - k * 10, { size: 8 }));
      else texto(celdas[i], x + 3, y - 9, { size: 8, alinear: col.alinear, ancho: col.ancho - 6 });
      x += col.ancho;
    });
    y -= alto;
    page.drawLine({ start: { x: MARGEN, y: y + 1 }, end: { x: MARGEN + anchoTabla, y: y + 1 }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) });
  }

  // ───────────── TOTALES, LEYENDAS Y QR ─────────────
  if (y - ALTO_PIE < MARGEN) nuevaPagina();
  y -= 14;

  const xTotales = MARGEN + anchoUtil - 200;
  const totales = [
    Number(c.totalGravado) > 0 && ["Op. Gravada", c.totalGravado],
    Number(c.totalExonerado) > 0 && ["Op. Exonerada", c.totalExonerado],
    Number(c.totalInafecto) > 0 && ["Op. Inafecta", c.totalInafecto],
    Number(c.totalDescuentos) > 0 && ["Descuentos", c.totalDescuentos],
    ["IGV", c.totalIgv],
  ].filter(Boolean);
  const yTotales = y;
  for (const [etiqueta, valor] of totales) {
    texto(etiqueta, xTotales, y, { size: 9, bold: true });
    texto(`${simbolo} ${num(valor)}`, xTotales, y, { size: 9, alinear: "der", ancho: 200 });
    y -= 13;
  }
  page.drawRectangle({ x: xTotales - 4, y: y - 5, width: 204, height: 17, color: rgb(0.92, 0.95, 0.98), borderColor: AZUL, borderWidth: 0.8 });
  texto("IMPORTE TOTAL", xTotales, y, { size: 10, bold: true, color: AZUL });
  texto(`${simbolo} ${num(c.totalComprobante)}`, xTotales, y, { size: 10, bold: true, alinear: "der", ancho: 196 });
  const yFinTotales = y - 8;

  // Leyendas a la izquierda de los totales
  let yLey = yTotales;
  const anchoLey = xTotales - MARGEN - 12;
  const leyendas = [`SON: ${c.montoEnLetras || ""}`];
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
  for (const [i, leyenda] of leyendas.entries()) {
    for (const linea of ajustarTexto(leyenda, i === 0 ? fontBold : font, i === 0 ? 8.5 : 8, anchoLey)) {
      texto(linea, MARGEN, yLey, { size: i === 0 ? 8.5 : 8, bold: i === 0 });
      yLey -= 10;
    }
    yLey -= 4;
  }

  y = Math.min(yFinTotales, yLey) - 12;

  const qr = await incrustarQr(pdfDoc, c);
  const lado = 85;
  if (qr) page.drawImage(qr, { x: MARGEN, y: y - lado, width: lado, height: lado });
  const xTxt = MARGEN + lado + 12;
  let yTxt = y - 10;
  const pie = [
    `Representación impresa de la ${(TITULO_TIPO[codigoTipo] || "comprobante electrónico").toLowerCase()}.`,
    "Consulte la validez del comprobante en el portal de SUNAT (www.sunat.gob.pe) con el RUC del emisor, tipo, serie y número.",
    c.hashCpe ? `Hash: ${c.hashCpe}` : null,
    c.descripcionEstadoProveedor ? `Estado SUNAT: ${c.descripcionEstadoProveedor}` : null,
  ].filter(Boolean);
  for (const p of pie) {
    for (const linea of ajustarTexto(p, font, 8, ANCHO - MARGEN - xTxt)) {
      texto(linea, xTxt, yTxt, { size: 8, color: GRIS });
      yTxt -= 10;
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
