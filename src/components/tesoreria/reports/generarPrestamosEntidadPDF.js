// src/components/tesoreria/reports/generarPrestamosEntidadPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  agruparPorSentidoYMoneda,
  resumenPorEmpresa,
  formatoMonto,
  formatoFecha,
  situacionVencimiento,
  etiquetaSentido,
} from "./prestamosEntidadReporteUtils";

/**
 * PDF de préstamos con accionistas y terceros con saldo pendiente (A4 horizontal).
 * @param {Object} data - { items, fechaGeneracion, titulo }  (items: préstamos pendientes)
 * @returns {Promise<Blob>}
 */
export async function generarPrestamosEntidadPDF(data) {
  const { items, fechaGeneracion, titulo } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGINA = [842, 595];
  const margin = 30;
  const altoFila = 14;
  const limiteInferior = 45;

  const colWidths = [58, 130, 46, 130, 52, 52, 78, 64, 64, 64];
  const headers = ["N° Préstamo", "Empresa", "Tipo", "Contraparte", "F. Desemb.", "Vence", "Plazo", "Desembolsado", "Pagado/Cobr.", "Saldo"];
  const alineacion = ["l", "l", "l", "l", "c", "c", "l", "r", "r", "r"];

  const paginas = [];
  let pagina;
  let y;

  const truncar = (texto, max) => {
    if (!texto) return "-";
    return texto.length > max ? `${texto.substring(0, max - 2)}..` : texto;
  };

  function escribir(texto, x, yPos, ancho, tipo, { bold = false, size = 7, color = rgb(0.1, 0.1, 0.1) } = {}) {
    const fuente = bold ? fontBold : fontNormal;
    const w = fuente.widthOfTextAtSize(texto, size);
    const xTexto = tipo === "r" ? x + ancho - w - 3 : tipo === "c" ? x + (ancho - w) / 2 : x + 3;
    pagina.drawText(texto, { x: xTexto, y: yPos, size, font: fuente, color });
  }

  function nuevaPagina() {
    pagina = pdfDoc.addPage(PAGINA);
    paginas.push(pagina);
    const { width, height } = pagina.getSize();
    const tituloTexto = titulo || "PRÉSTAMOS CON ACCIONISTAS Y TERCEROS - SALDOS PENDIENTES";
    pagina.drawText(tituloTexto, { x: (width - fontBold.widthOfTextAtSize(tituloTexto, 14)) / 2, y: height - 25, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    const fechaTexto = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
    pagina.drawText(fechaTexto, { x: (width - fontNormal.widthOfTextAtSize(fechaTexto, 8)) / 2, y: height - 38, size: 8, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
    y = height - 52;
  }

  function banda(texto, continuacion = false) {
    const ancho = PAGINA[0] - margin * 2;
    pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, color: rgb(0.87, 0.92, 0.97) });
    escribir(`${texto}${continuacion ? " (continuación)" : ""}`, margin, y - 10, ancho, "l", { bold: true, size: 9 });
    y -= altoFila;
  }

  function encabezadoTabla() {
    const ancho = colWidths.reduce((a, b) => a + b, 0);
    pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, color: rgb(0.27, 0.45, 0.77) });
    let x = margin;
    headers.forEach((h, i) => {
      escribir(h, x, y - 10, colWidths[i], "c", { bold: true, size: 7, color: rgb(1, 1, 1) });
      x += colWidths[i];
    });
    y -= altoFila;
  }

  function fila(celdas, { fondo, bold = false, colorTexto } = {}) {
    const ancho = colWidths.reduce((a, b) => a + b, 0);
    if (fondo) pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, color: fondo });
    pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
    let x = margin;
    celdas.forEach((texto, i) => {
      const color = typeof colorTexto === "function" ? colorTexto(i) : colorTexto;
      escribir(String(texto ?? ""), x, y - 10, colWidths[i], alineacion[i], { bold, color });
      x += colWidths[i];
    });
    y -= altoFila;
  }

  // ═════════ DETALLE POR SENTIDO Y MONEDA ═════════
  nuevaPagina();
  const grupos = agruparPorSentidoYMoneda(items);
  if (grupos.length === 0) escribir("No hay préstamos con saldo pendiente.", margin, y - 14, 400, "l", { size: 10 });

  for (const grupo of grupos) {
    if (y < limiteInferior + altoFila * 4) nuevaPagina();
    const textoBanda = `${etiquetaSentido(grupo.sentido).toUpperCase()} - MONEDA: ${grupo.codigo}`;
    banda(textoBanda);
    encabezadoTabla();

    grupo.items.forEach((p, i) => {
      if (y < limiteInferior + altoFila * 2) {
        nuevaPagina();
        banda(textoBanda, true);
        encabezadoTabla();
      }
      const venc = situacionVencimiento(p);
      fila(
        [
          p.numeroPrestamo,
          truncar(p.empresa?.razonSocial, 26),
          p.esAccionista ? "Accion." : "Tercero",
          truncar(p.entidadComercial?.razonSocial, 26),
          formatoFecha(p.fechaDesembolso),
          formatoFecha(p.fechaVencimiento),
          venc.texto,
          formatoMonto(p.montoDesembolsado),
          formatoMonto(Number(p.capitalPagado || 0) + Number(p.montoPagadoAnterior || 0)),
          formatoMonto(p.saldoCapital),
        ],
        { fondo: i % 2 === 0 ? rgb(0.96, 0.96, 0.96) : rgb(1, 1, 1), colorTexto: (col) => (col === 6 && venc.vencido ? rgb(0.7, 0, 0) : undefined) },
      );
    });

    if (y < limiteInferior + altoFila) nuevaPagina();
    fila(["", "", "", "", "", "", `TOTAL ${grupo.codigo} (${grupo.totales.cantidad})`, formatoMonto(grupo.totales.desembolsado), formatoMonto(grupo.totales.pagado), formatoMonto(grupo.totales.saldo)], {
      fondo: rgb(0.9, 0.9, 0.9),
      bold: true,
    });
    y -= altoFila / 2;
  }

  // ═════════ RESUMEN POR EMPRESA ═════════
  const resumen = resumenPorEmpresa(items);
  if (resumen.length > 0) {
    nuevaPagina();
    pagina.drawText("SALDOS POR EMPRESA (POR COBRAR Y POR PAGAR A ACCIONISTAS Y TERCEROS)", { x: margin, y: y - 4, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;

    const anchos = [330, 140, 140, 140];
    const alin = ["l", "r", "r", "r"];
    const ancho = anchos.reduce((a, b) => a + b, 0);
    const filaResumen = (celdas, opciones = {}) => {
      if (y < limiteInferior + altoFila) nuevaPagina();
      if (opciones.fondo) pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, color: opciones.fondo });
      pagina.drawRectangle({ x: margin, y: y - altoFila, width: ancho, height: altoFila, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
      let x = margin;
      celdas.forEach((texto, i) => {
        escribir(String(texto), x, y - 10, anchos[i], alin[i], { bold: opciones.bold, size: 8, color: opciones.color?.(i) });
        x += anchos[i];
      });
      y -= altoFila;
    };

    for (const bloque of resumen) {
      if (y < limiteInferior + altoFila * 5) nuevaPagina();
      banda(`MONEDA: ${bloque.codigo}`);
      filaResumen(["Empresa", "Por cobrar (otorgó)", "Por pagar (recibió)", "Neto"], { fondo: rgb(0.27, 0.45, 0.77), bold: true, color: () => rgb(1, 1, 1) });
      bloque.filas.forEach((f, i) => {
        filaResumen([truncar(f.empresa, 60), formatoMonto(f.porCobrar), formatoMonto(f.porPagar), formatoMonto(f.neto)], {
          fondo: i % 2 === 0 ? rgb(0.96, 0.96, 0.96) : undefined,
          color: (col) => (col === 3 ? (f.neto < 0 ? rgb(0.7, 0, 0) : rgb(0, 0.5, 0)) : undefined),
        });
      });
      filaResumen([`TOTAL ${bloque.codigo}`, formatoMonto(bloque.totales.porCobrar), formatoMonto(bloque.totales.porPagar), formatoMonto(bloque.totales.porCobrar - bloque.totales.porPagar)], { fondo: rgb(0.9, 0.9, 0.9), bold: true });
      y -= altoFila / 2;
    }
  }

  // ═════════ NUMERACIÓN Y PIE ═════════
  const total = paginas.length;
  const pie = `Préstamos con saldo pendiente: ${items.length} | Generado: ${fechaGeneracion.toLocaleString("es-PE")} | Sistema ERP Megui`;
  paginas.forEach((pag, index) => {
    const { width, height } = pag.getSize();
    const texto = `Página ${index + 1} de ${total}`;
    pag.drawText(texto, { x: width - margin - fontNormal.widthOfTextAtSize(texto, 8), y: height - 25, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });
    pag.drawLine({ start: { x: margin, y: 25 }, end: { x: width - margin, y: 25 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    pag.drawText(pie, { x: (width - fontNormal.widthOfTextAtSize(pie, 7)) / 2, y: 15, size: 7, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
