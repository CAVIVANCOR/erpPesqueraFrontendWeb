import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * PDF "Estado de Cuenta de Proveedores de Mantenimiento" (A4 horizontal), mismo estilo que MovimientoFondosPDF.
 * Un bloque por empresa (cada una inicia en página nueva) > proveedor > presupuesto de la OT, con:
 *  - lo presupuestado,
 *  - cada documento de compra (factura por factura) con su total, lo pagado y su saldo,
 *  - los pagos de cada documento (medio, N° de operación, cuenta y movimiento de caja),
 *  - lo que falta por facturar de cada presupuesto,
 *  - subtotal por presupuesto y subtotales por proveedor separados por moneda (soles y dólares).
 */

const PAGE_SIZE = [841.89, 595.28];
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const BOTTOM = 44;
const COLORS = {
  primary: rgb(0.08, 0.27, 0.45),
  primaryLight: rgb(0.88, 0.93, 0.97),
  band: rgb(0.13, 0.4, 0.72),
  gray: rgb(0.35, 0.38, 0.42),
  lightGray: rgb(0.94, 0.95, 0.96),
  border: rgb(0.72, 0.75, 0.78),
  pago: rgb(0.05, 0.4, 0.2),
  factura: rgb(0.65, 0.1, 0.1),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

// Columnas: Fecha, Concepto, OT, Detalle, Mon, Presupuestado, Facturado, Por facturar, Pagado, Saldo
// La columna OT debe alojar completo "OT 002-0000000001 / L1" en una sola línea
const ANCHOS = [44, 100, 96, 0, 24, 68, 68, 68, 68, 70];
ANCHOS[3] = CONTENT_WIDTH - ANCHOS.reduce((a, b) => a + b, 0);
const COL_X = ANCHOS.reduce((acc, w, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + ANCHOS[i - 1]], []);
const COL = { fecha: 0, activo: 1, ot: 2, detalle: 3, mon: 4, presupuestado: 5, facturado: 6, porFacturar: 7, pagado: 8, saldo: 9 };

// Solo caracteres que Helvetica (WinAnsi) puede dibujar
const textoSeguro = (value) =>
  String(value ?? "")
    .replace(/[\u2000-\u206F]/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatearNumero = (value) =>
  Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fechaCorta = (value) => {
  const f = new Date(value);
  return `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`;
};

const NOMBRE_MONEDA = { PEN: "SOLES", USD: "DOLARES AMERICANOS", EUR: "EUROS" };
const nombreMoneda = (moneda) => NOMBRE_MONEDA[moneda?.codigoSunat] || moneda?.nombreLargo || moneda?.codigoSunat || "";

// Color de fondo configurado de la moneda (Moneda.colorFondo, "#RRGGBB"); si no tiene, gris claro
const colorDeMoneda = (moneda) => {
  const hex = String(moneda?.colorFondo || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return COLORS.lightGray;
  return rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
};

/**
 * @param {Object} params
 * @param {Object} params.datos - respuesta del backend: { empresas: [{ empresa, proveedores: [{ proveedor, presupuestos, totales }] }] }
 * @param {string} params.usuarioNombre - usuario que emite el reporte
 * @returns {Promise<{bytes: Uint8Array, totalProveedores: number, totalEmpresas: number}>}
 */
export async function generarPDFEstadoCuentaProveedoresMantenimiento({ datos, usuarioNombre = "" }) {
  const empresas = datos?.empresas || [];
  if (empresas.length === 0) {
    throw new Error("No hay presupuestos de proveedores de Mantenimiento con montos o documentos de compra para reportar.");
  }

  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = [];
  let page;
  let y;
  // Qué se repite en cada página nueva: encabezado de la empresa, banda del proveedor y cabecera de columnas
  let encabezado = { empresa: null, logo: null };
  let contexto = null; // { proveedorTitulo }

  const ancho = (texto, size, font = fontNormal) => font.widthOfTextAtSize(texto, size);

  const cortarTexto = (texto, font, size, maxWidth, maxLineas = 99) => {
    const palabras = textoSeguro(texto).split(" ").filter(Boolean);
    const lineas = [];
    let linea = "";
    palabras.forEach((palabra) => {
      const candidata = linea ? `${linea} ${palabra}` : palabra;
      if (ancho(candidata, size, font) <= maxWidth) {
        linea = candidata;
        return;
      }
      if (linea) lineas.push(linea);
      // Palabra más larga que la columna: se parte por caracteres
      while (ancho(palabra, size, font) > maxWidth && palabra.length > 1) {
        let corte = palabra.length - 1;
        while (corte > 1 && ancho(palabra.slice(0, corte), size, font) > maxWidth) corte -= 1;
        lineas.push(palabra.slice(0, corte));
        palabra = palabra.slice(corte);
      }
      linea = palabra;
    });
    if (linea) lineas.push(linea);
    if (lineas.length > maxLineas) {
      const recorte = lineas.slice(0, maxLineas);
      let ultima = recorte[maxLineas - 1];
      while (ultima.length > 1 && ancho(`${ultima}...`, size, font) > maxWidth) ultima = ultima.slice(0, -1);
      recorte[maxLineas - 1] = `${ultima}...`;
      return recorte;
    }
    return lineas;
  };

  const textoDerecha = (texto, xDerecha, yTexto, size = 7, font = fontNormal, color = COLORS.black) => {
    if (!texto) return;
    page.drawText(texto, { x: xDerecha - ancho(texto, size, font), y: yTexto, size, font, color });
  };

  const dibujarEncabezadoPagina = () => {
    const top = PAGE_SIZE[1] - MARGIN;
    const { empresa: emp, logo } = encabezado;
    if (logo) {
      const escala = Math.min(70 / logo.width, 36 / logo.height);
      page.drawImage(logo, { x: MARGIN, y: top - logo.height * escala, width: logo.width * escala, height: logo.height * escala });
    }
    const empresaX = MARGIN + (logo ? 78 : 0);
    page.drawText(textoSeguro(emp?.razonSocial || ""), { x: empresaX, y: top - 8, size: 9, font: fontBold, color: COLORS.primary, maxWidth: 260 });
    page.drawText(`RUC: ${textoSeguro(emp?.ruc || "-")}`, { x: empresaX, y: top - 20, size: 7.5, font: fontNormal });

    const centro = PAGE_SIZE[0] / 2;
    const titulo = "ESTADO DE CUENTA DE PROVEEDORES DE MANTENIMIENTO";
    page.drawText(titulo, { x: centro - ancho(titulo, 13, fontBold) / 2, y: top - 10, size: 13, font: fontBold, color: COLORS.primary });
    const subtitulo = `AL ${fechaCorta(new Date())}`;
    page.drawText(subtitulo, { x: centro - ancho(subtitulo, 9, fontBold) / 2, y: top - 24, size: 9, font: fontBold });

    const emitido = `Emitido: ${fechaCorta(new Date())} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    textoDerecha(emitido, PAGE_SIZE[0] - MARGIN, top - 6, 7.5, fontNormal, COLORS.gray);
    if (usuarioNombre) textoDerecha(`Usuario: ${textoSeguro(usuarioNombre)}`, PAGE_SIZE[0] - MARGIN, top - 16, 7.5, fontNormal, COLORS.gray);

    page.drawLine({ start: { x: MARGIN, y: top - 40 }, end: { x: PAGE_SIZE[0] - MARGIN, y: top - 40 }, thickness: 1.2, color: COLORS.primary });
    y = top - 48;
  };

  const dibujarCabeceraColumnas = () => {
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 15, color: COLORS.primaryLight, borderColor: COLORS.border, borderWidth: 0.5 });
    const etiquetas = ["Fecha", "Activo", "OT", "Concepto / Documento / Medio de pago / Cuenta", "Mon", "Presupuestado", "Facturado", "Por Facturar", "Pagado", "Saldo"];
    etiquetas.forEach((etiqueta, i) => {
      if (i >= COL.presupuestado) textoDerecha(etiqueta, COL_X[i] + ANCHOS[i] - 3, y - 9.5, 7, fontBold, COLORS.primary);
      else page.drawText(etiqueta, { x: COL_X[i] + 3, y: y - 9.5, size: 7, font: fontBold, color: COLORS.primary });
    });
    y -= 17;
  };

  const dibujarBandaProveedor = (titulo, continuacion = false) => {
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 16, color: COLORS.band });
    page.drawText(textoSeguro(`${titulo}${continuacion ? "  (continuacion)" : ""}`), { x: MARGIN + 6, y: y - 9.5, size: 8.5, font: fontBold, color: COLORS.white });
    y -= 19;
  };

  const nuevaPagina = () => {
    page = pdfDoc.addPage(PAGE_SIZE);
    pages.push(page);
    dibujarEncabezadoPagina();
    if (contexto?.proveedorTitulo) {
      dibujarBandaProveedor(contexto.proveedorTitulo, true);
      dibujarCabeceraColumnas();
    }
  };

  const asegurarEspacio = (alto) => {
    if (y - alto < BOTTOM) nuevaPagina();
  };

  /**
   * Una fila del estado de cuenta. `sangria` desplaza el concepto (pagos bajo su documento).
   */
  const dibujarFila = ({ fecha, activo, concepto, ot, detalle, mon, presupuestado, facturado, porFacturar, pagado, saldo, color = COLORS.black, fondo = null, negrita = false, sangria = 0 }) => {
    const font = negrita ? fontBold : fontNormal;
    // Concepto y detalle comparten la columna ancha; ninguna columna de texto se recorta: la fila crece con las líneas necesarias
    const textoDetalle = [concepto, detalle].filter(Boolean).join(" - ");
    const lineasActivo = cortarTexto(activo || "", font, 7, ANCHOS[COL.activo] - 6);
    const lineasDetalle = cortarTexto(textoDetalle, font, 7, ANCHOS[COL.detalle] - 6 - sangria);
    const lineasOt = cortarTexto(ot || "", font, 7, ANCHOS[COL.ot] - 6);
    const filas = Math.max(1, lineasActivo.length, lineasDetalle.length, lineasOt.length);
    const alto = filas * 8.5 + 4;
    asegurarEspacio(alto);
    if (fondo) page.drawRectangle({ x: MARGIN, y: y - alto + 2, width: CONTENT_WIDTH, height: alto, color: fondo });
    const base = y - 7;
    if (fecha) page.drawText(fecha, { x: COL_X[COL.fecha] + 3, y: base, size: 7, font, color });
    lineasActivo.forEach((linea, i) => page.drawText(linea, { x: COL_X[COL.activo] + 3, y: base - i * 8.5, size: 7, font, color }));
    lineasOt.forEach((linea, i) => page.drawText(linea, { x: COL_X[COL.ot] + 3, y: base - i * 8.5, size: 7, font, color }));
    lineasDetalle.forEach((linea, i) => page.drawText(linea, { x: COL_X[COL.detalle] + 3 + sangria, y: base - i * 8.5, size: 7, font, color }));
    if (mon) page.drawText(mon, { x: COL_X[COL.mon] + 3, y: base, size: 7, font, color });
    textoDerecha(presupuestado, COL_X[COL.presupuestado] + ANCHOS[COL.presupuestado] - 3, base, 7, font, color);
    textoDerecha(facturado, COL_X[COL.facturado] + ANCHOS[COL.facturado] - 3, base, 7, font, color);
    textoDerecha(porFacturar, COL_X[COL.porFacturar] + ANCHOS[COL.porFacturar] - 3, base, 7, font, color);
    textoDerecha(pagado, COL_X[COL.pagado] + ANCHOS[COL.pagado] - 3, base, 7, font, color);
    textoDerecha(saldo, COL_X[COL.saldo] + ANCHOS[COL.saldo] - 3, base, 7, fontBold, COLORS.black);
    page.drawLine({ start: { x: MARGIN, y: y - alto + 2 }, end: { x: MARGIN + CONTENT_WIDTH, y: y - alto + 2 }, thickness: 0.25, color: COLORS.border });
    y -= alto;
  };

  const detallePago = (pago) => {
    const partes = [pago.medio, pago.numeroOperacion ? `Op. ${pago.numeroOperacion}` : null, pago.cuenta, pago.movimientoCajaId ? `Mov. caja ${pago.movimientoCajaId}` : "Sin movimiento de caja"].filter(Boolean);
    // Si lo pagado desde caja difiere de lo aplicado a la deuda (detracción/retención), se informa el efectivo
    const difiere = pago.desdeCaja && Math.abs(Number(pago.pagado) - Number(pago.montoPagadoCaja)) > 0.005;
    if (difiere) partes.push(`Efectivo ${pago.monedaPago || ""} ${formatearNumero(pago.montoPagadoCaja)}`.trim());
    return partes.join(" | ");
  };

  let totalProveedores = 0;
  for (const { empresa, proveedores } of empresas) {
    encabezado = { empresa, logo: null };
    if (empresa?.logo && empresa?.id) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`);
        if (response.ok) {
          const bytes = await response.arrayBuffer();
          encabezado.logo = String(empresa.logo).toLowerCase().includes(".png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        }
      } catch (error) {
        console.error("Error al cargar logo para el estado de cuenta de proveedores:", error);
      }
    }

    contexto = null;
    nuevaPagina();

    for (const { proveedor, presupuestos, totales } of proveedores) {
      totalProveedores += 1;
      const titulo = `${proveedor?.razonSocial || "PROVEEDOR"}  -  RUC/DOC: ${proveedor?.numeroDocumento || "-"}`;
      // La banda, la cabecera de columnas y al menos dos filas deben caber juntas
      asegurarEspacio(19 + 17 + 30);
      contexto = { proveedorTitulo: titulo };
      dibujarBandaProveedor(titulo);
      dibujarCabeceraColumnas();

      for (const presupuesto of presupuestos) {
        const mon = presupuesto.moneda?.codigoSunat || "";
        dibujarFila({
          fecha: fechaCorta(presupuesto.fecha),
          activo: presupuesto.activo,
          concepto: "PRESUPUESTO",
          ot: `OT ${presupuesto.ot} / L${presupuesto.numeroLinea}`,
          detalle: presupuesto.descripcion,
          mon,
          presupuestado: formatearNumero(presupuesto.presupuestado),
          negrita: true,
          fondo: COLORS.lightGray,
        });

        if (presupuesto.documentos.length === 0) {
          dibujarFila({ detalle: "Sin documentos de compra generados", color: COLORS.gray });
        }
        for (const documento of presupuesto.documentos) {
          dibujarFila({
            fecha: fechaCorta(documento.fecha),
            concepto: documento.documento,
            // Solo se indica quién emitió el comprobante cuando no es el contratista del presupuesto
            detalle: documento.proveedorDocumento && documento.proveedorDocumento !== proveedor?.razonSocial ? documento.proveedorDocumento : "",
            mon: documento.moneda?.codigoSunat || "",
            facturado: formatearNumero(documento.total),
            pagado: formatearNumero(documento.pagado),
            saldo: formatearNumero(documento.saldo),
            color: COLORS.factura,
            negrita: true,
          });
          for (const pago of documento.pagos) {
            dibujarFila({
              fecha: fechaCorta(pago.fecha),
              concepto: "Pago",
              detalle: detallePago(pago),
              mon: documento.moneda?.codigoSunat || "",
              pagado: formatearNumero(pago.pagado),
              color: COLORS.pago,
              sangria: 10,
            });
          }
        }

        dibujarFila({
          concepto: "SUBTOTAL PRESUPUESTO",
          mon,
          presupuestado: formatearNumero(presupuesto.presupuestado),
          facturado: formatearNumero(presupuesto.facturado),
          porFacturar: formatearNumero(presupuesto.porFacturar),
          pagado: formatearNumero(presupuesto.pagado),
          saldo: formatearNumero(presupuesto.saldo),
          negrita: true,
          fondo: COLORS.primaryLight,
        });
        y -= 4;
      }

      // Subtotales del proveedor: una fila por moneda (soles y dólares nunca se mezclan)
      for (const total of totales) {
        dibujarFila({
          concepto: `SUBTOTAL PROVEEDOR ${nombreMoneda(total.moneda)}`,
          detalle: `${total.presupuestos} presupuesto(s)`,
          mon: total.moneda?.codigoSunat || "",
          presupuestado: formatearNumero(total.presupuestado),
          facturado: formatearNumero(total.facturado),
          porFacturar: formatearNumero(total.porFacturar),
          pagado: formatearNumero(total.pagado),
          saldo: formatearNumero(total.saldo),
          negrita: true,
          fondo: colorDeMoneda(total.moneda),
        });
      }
      y -= 12;
      contexto = null;
    }
  }

  // Pie de página con numeración y nota aclaratoria
  const nota = "Pagado = monto aplicado a la deuda (incluye detraccion/retencion pagada a SUNAT). Por facturar = presupuestado - facturado. Saldo del presupuesto = presupuestado - pagado. Subtotales por proveedor y moneda.";
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: 34 }, end: { x: PAGE_SIZE[0] - MARGIN, y: 34 }, thickness: 0.5, color: COLORS.border });
    p.drawText(nota, { x: MARGIN, y: 22, size: 6.5, font: fontNormal, color: COLORS.gray });
    const numeroPagina = `Pagina ${i + 1} de ${pages.length}`;
    p.drawText(numeroPagina, { x: PAGE_SIZE[0] - MARGIN - ancho(numeroPagina, 7.5), y: 22, size: 7.5, font: fontNormal, color: COLORS.gray });
  });

  const bytes = await pdfDoc.save();
  return { bytes, totalProveedores, totalEmpresas: empresas.length };
}
