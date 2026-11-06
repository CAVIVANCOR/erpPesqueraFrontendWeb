// src/components/planilla/reports/generarBoletaPlanillaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const formatearMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatearFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-";

/**
 * Genera la boleta de pago en PDF de un trabajador de una planilla.
 * Es lo único que recibe el trabajador: ingresos, descuentos, aportes del empleador y neto a pagar.
 * Los conceptos ocultos en boleta y las provisiones no se imprimen.
 *
 * @param {Object} data
 * @param {Object} data.planilla - Detalle de la planilla (empresa, descripción, fechas)
 * @param {Object} data.trabajador - Boleta del trabajador con su personal y conceptos
 * @returns {Promise<Blob>} PDF generado
 */
export async function generarBoletaPlanillaPDF(data) {
  const { planilla, trabajador } = data;
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pagina = pdfDoc.addPage([595, 842]);
  const { width, height } = pagina.getSize();
  const margen = 40;
  const anchoUtil = width - margen * 2;
  let y = height - 40;

  const texto = (valor, x, yPos, { size = 9, bold = false, color = rgb(0, 0, 0) } = {}) =>
    pagina.drawText(String(valor ?? ""), { x, y: yPos, size, font: bold ? fontBold : fontNormal, color });
  const textoDerecha = (valor, xDerecha, yPos, opciones = {}) => {
    const size = opciones.size || 9;
    const font = opciones.bold ? fontBold : fontNormal;
    texto(valor, xDerecha - font.widthOfTextAtSize(String(valor), size), yPos, opciones);
  };
  const linea = (yPos, grosor = 0.5) =>
    pagina.drawLine({ start: { x: margen, y: yPos }, end: { x: width - margen, y: yPos }, thickness: grosor, color: rgb(0.3, 0.3, 0.3) });

  // Encabezado
  const titulo = "BOLETA DE PAGO";
  texto(planilla.empresa?.razonSocial || "", margen, y, { size: 12, bold: true });
  texto(`RUC: ${planilla.empresa?.ruc || "-"}`, margen, y - 14);
  texto(titulo, (width - fontBold.widthOfTextAtSize(titulo, 14)) / 2, y - 40, { size: 14, bold: true });
  const periodo = `${planilla.descripcion}  |  Periodo: ${formatearFecha(planilla.fechaInicio)} al ${formatearFecha(planilla.fechaFin)}`;
  texto(periodo, (width - fontNormal.widthOfTextAtSize(periodo, 9)) / 2, y - 56);
  y -= 76;
  linea(y);

  // Datos del trabajador
  const personal = trabajador.personal || {};
  const categoria = trabajador.esPescador ? "PESCADOR" : trabajador.esObrero ? "OBRERO" : "EMPLEADO";
  y -= 16;
  texto("Trabajador:", margen, y, { bold: true });
  texto(`${personal.apellidos || ""} ${personal.nombres || ""}`, margen + 70, y);
  texto("Documento:", margen + 330, y, { bold: true });
  texto(personal.numeroDocumento || "-", margen + 395, y);
  y -= 14;
  texto("Cargo:", margen, y, { bold: true });
  texto(personal.cargo?.descripcion || "-", margen + 70, y);
  texto("Categoría:", margen + 330, y, { bold: true });
  texto(categoria, margen + 395, y);
  y -= 14;
  texto("Ingreso:", margen, y, { bold: true });
  texto(formatearFecha(personal.fechaIngreso), margen + 70, y);
  texto("Días trabajados:", margen + 330, y, { bold: true });
  texto(String(Number(trabajador.diasTrabajados)), margen + 420, y);
  y -= 14;
  texto("Pensión:", margen, y, { bold: true });
  texto(`${personal.entidadPension?.descripcion || "-"}${personal.cuspp ? `  (CUSPP ${personal.cuspp})` : ""}`, margen + 70, y);
  texto("Remuneración:", margen + 330, y, { bold: true });
  texto(`S/ ${formatearMonto(trabajador.remuneracionBasica)}`, margen + 420, y);
  y -= 10;
  linea(y);

  // Secciones: ingresos, descuentos y aportes del empleador (sin conceptos ocultos ni provisiones)
  const visibles = (trabajador.conceptos || []).filter((c) => c.conceptoPlanilla?.visibleEnBoleta !== false && c.naturaleza !== "PROVISION");
  const seccion = (nombre, naturaleza, total) => {
    const filas = visibles.filter((c) => c.naturaleza === naturaleza);
    if (filas.length === 0) return;
    y -= 20;
    texto(nombre, margen, y, { size: 10, bold: true });
    y -= 4;
    linea(y, 0.3);
    for (const fila of filas) {
      y -= 14;
      texto(fila.descripcion, margen + 6, y);
      textoDerecha(formatearMonto(fila.monto), margen + anchoUtil, y);
    }
    y -= 16;
    texto(`Total ${nombre.toLowerCase()}`, margen + 6, y, { bold: true });
    textoDerecha(formatearMonto(total), margen + anchoUtil, y, { bold: true });
  };
  seccion("INGRESOS", "INGRESO", trabajador.totalIngresos);
  seccion("DESCUENTOS", "DESCUENTO", trabajador.totalDescuentos);
  seccion("APORTES DEL EMPLEADOR", "APORTE", trabajador.totalAportesEmpleador);

  // Neto a pagar
  y -= 26;
  pagina.drawRectangle({ x: margen, y: y - 8, width: anchoUtil, height: 26, color: rgb(0.9, 0.93, 0.98), borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 0.5 });
  texto("NETO A PAGAR (S/)", margen + 8, y, { size: 12, bold: true });
  textoDerecha(formatearMonto(trabajador.totalNeto), margen + anchoUtil - 8, y, { size: 12, bold: true });

  // Firmas
  y -= 90;
  pagina.drawLine({ start: { x: margen + 20, y }, end: { x: margen + 220, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  pagina.drawLine({ start: { x: width - margen - 220, y }, end: { x: width - margen - 20, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  texto("EMPLEADOR", margen + 95, y - 12, { size: 8, bold: true });
  texto("TRABAJADOR", width - margen - 140, y - 12, { size: 8, bold: true });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
