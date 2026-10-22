// src/components/tesoreria/reports/generarPrestamosEntidadExcel.js
import ExcelJS from "exceljs";
import { agruparPorSentidoYMoneda, resumenPorEmpresa, formatoFecha, situacionVencimiento, etiquetaSentido, partesDelPrestamo } from "./prestamosEntidadReporteUtils";

const BORDE = {
  top: { style: "thin", color: { argb: "FFCCCCCC" } },
  left: { style: "thin", color: { argb: "FFCCCCCC" } },
  bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
  right: { style: "thin", color: { argb: "FFCCCCCC" } },
};
const FORMATO_MONTO = "#,##0.00";
const RELLENO = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

function titulo(hoja, fila, texto, columnas) {
  hoja.mergeCells(fila, 1, fila, columnas);
  const celda = hoja.getCell(fila, 1);
  celda.value = texto;
  celda.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
  celda.alignment = { horizontal: "center", vertical: "middle" };
  celda.fill = RELLENO("FFE8E8E8");
}

function banda(hoja, fila, texto, columnas) {
  hoja.mergeCells(fila, 1, fila, columnas);
  const celda = hoja.getCell(fila, 1);
  celda.value = texto;
  celda.font = { bold: true, size: 12 };
  celda.fill = RELLENO("FFDDEBF7");
}

function encabezados(hoja, fila, textos) {
  const row = hoja.getRow(fila);
  textos.forEach((texto, i) => {
    const celda = row.getCell(i + 1);
    celda.value = texto;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    celda.fill = RELLENO("FF4472C4");
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celda.border = BORDE;
  });
}

/**
 * Excel de préstamos con accionistas y terceros con saldo pendiente.
 * @param {Object} data - { items, fechaGeneracion, titulo }  (items: préstamos pendientes)
 * @returns {Promise<Blob>}
 */
export async function generarPrestamosEntidadExcel(data) {
  const { items, fechaGeneracion } = data;
  const workbook = new ExcelJS.Workbook();

  // ═════════ HOJA 1: DETALLE ═════════
  const hoja = workbook.addWorksheet("Saldos Pendientes");
  hoja.views = [{ showGridLines: false }];
  const cabecera = ["N° Préstamo", "Prestamista", "Deudor", "Mon.", "F. Desembolso", "Vencimiento", "Plazo", "Desembolsado", "Devuelto", "Saldo Pendiente"];
  hoja.columns = [{ width: 14 }, { width: 40 }, { width: 40 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 18 }];

  let fila = 1;
  titulo(hoja, fila++, data.titulo || "PRÉSTAMOS CON ACCIONISTAS Y TERCEROS - SALDOS PENDIENTES", cabecera.length);
  hoja.mergeCells(fila, 1, fila, cabecera.length);
  const fechaCelda = hoja.getCell(fila++, 1);
  fechaCelda.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
  fechaCelda.font = { size: 10, color: { argb: "FF666666" } };
  fechaCelda.alignment = { horizontal: "center" };
  fila++;

  for (const grupo of agruparPorSentidoYMoneda(items)) {
    banda(hoja, fila++, `${etiquetaSentido(grupo.sentido).toUpperCase()} - MONEDA: ${grupo.codigo}`, cabecera.length);
    encabezados(hoja, fila++, cabecera);

    grupo.items.forEach((p, i) => {
      const venc = situacionVencimiento(p);
      const partes = partesDelPrestamo(p);
      const row = hoja.getRow(fila++);
      row.values = [
        p.numeroPrestamo,
        partes.prestamista,
        partes.deudor,
        grupo.codigo,
        formatoFecha(p.fechaDesembolso),
        formatoFecha(p.fechaVencimiento),
        venc.texto,
        Number(p.montoDesembolsado || 0),
        Number(p.capitalPagado || 0) + Number(p.montoPagadoAnterior || 0),
        Number(p.saldoCapital || 0),
      ];
      row.eachCell({ includeEmpty: true }, (celda, col) => {
        celda.border = BORDE;
        celda.alignment = { vertical: "middle", horizontal: col >= 8 ? "right" : col >= 4 && col <= 6 ? "center" : "left" };
        if (col >= 8) celda.numFmt = FORMATO_MONTO;
        if (col === 10) celda.font = { bold: true };
        if (col === 7 && venc.vencido) celda.font = { bold: true, color: { argb: "FFB20000" } };
        if (i % 2 === 0) celda.fill = RELLENO("FFF5F5F5");
      });
    });

    const total = hoja.getRow(fila++);
    total.values = ["", "", "", "", "", "", `TOTAL ${grupo.codigo} (${grupo.totales.cantidad})`, grupo.totales.desembolsado, grupo.totales.devuelto, grupo.totales.saldo];
    total.eachCell({ includeEmpty: true }, (celda, col) => {
      celda.font = { bold: true };
      celda.border = BORDE;
      celda.fill = RELLENO("FFE8E8E8");
      if (col >= 7) celda.alignment = { horizontal: "right" };
      if (col >= 8) celda.numFmt = FORMATO_MONTO;
    });
    fila += 1;
  }

  // ═════════ HOJA 2: RESUMEN POR EMPRESA ═════════
  const resumen = workbook.addWorksheet("Resumen por Empresa");
  resumen.views = [{ showGridLines: false }];
  resumen.columns = [{ width: 40 }, { width: 22 }, { width: 22 }, { width: 20 }];
  let filaR = 1;
  titulo(resumen, filaR++, "SALDOS POR EMPRESA (COMO PRESTAMISTA Y COMO DEUDOR)", 4);
  filaR++;

  for (const bloque of resumenPorEmpresa(items)) {
    banda(resumen, filaR++, `MONEDA: ${bloque.codigo}`, 4);
    encabezados(resumen, filaR++, ["Empresa", "Como Prestamista", "Como Deudor", "Neto"]);
    bloque.filas.forEach((f, i) => {
      const row = resumen.getRow(filaR++);
      row.values = [f.empresa, f.comoPrestamista, f.comoDeudor, f.neto];
      row.eachCell((celda, col) => {
        celda.border = BORDE;
        if (col > 1) {
          celda.numFmt = FORMATO_MONTO;
          celda.alignment = { horizontal: "right" };
        }
        if (col === 4) celda.font = { bold: true, color: { argb: f.neto < 0 ? "FFB20000" : "FF008000" } };
        if (i % 2 === 0) celda.fill = RELLENO("FFF5F5F5");
      });
    });
    const total = resumen.getRow(filaR++);
    total.values = [`TOTAL ${bloque.codigo}`, bloque.totales.comoPrestamista, bloque.totales.comoDeudor, bloque.totales.comoPrestamista - bloque.totales.comoDeudor];
    total.eachCell((celda, col) => {
      celda.font = { bold: true };
      celda.border = BORDE;
      celda.fill = RELLENO("FFE8E8E8");
      if (col > 1) {
        celda.numFmt = FORMATO_MONTO;
        celda.alignment = { horizontal: "right" };
      }
    });
    filaR += 1;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
