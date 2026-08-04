// src/components/contabilidad/reports/generarLibroDiarioExcel.js
import ExcelJS from "exceljs";

export async function generarLibroDiarioExcel(data) {
  const { empresa, periodo, lineas, totales } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Libro Diario");

  worksheet.views = [{ showGridLines: false }];
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.4,
      bottom: 0.4,
      header: 0.3,
      footer: 0.3
    }
  };

  // Anchos de columna
  worksheet.getColumn(1).width = 12;  // NUMERO REGISTRO
  worksheet.getColumn(2).width = 10;  // FECHA
  worksheet.getColumn(3).width = 35;  // DESCRIPCION
  worksheet.getColumn(4).width = 5;   // CL
  worksheet.getColumn(5).width = 10;  // CORRELATIVO
  worksheet.getColumn(6).width = 20;  // N° DOCUMENT
  worksheet.getColumn(7).width = 10;  // CODIGO
  worksheet.getColumn(8).width = 30;  // DENOMINACION
  worksheet.getColumn(9).width = 20;  // ANEXO
  worksheet.getColumn(10).width = 12; // DEBE
  worksheet.getColumn(11).width = 12; // HABER

  const TOTAL_COLS = 11;
  const lastCol = "K";
  const LINEAS_POR_PAGINA = 46;
  const totalPaginas = Math.ceil(lineas.length / LINEAS_POR_PAGINA);
  const esSaldoInicial = lineas.some(l => l.esSaldoInicial === true);

  let currentRow = 1;
  let paginaActual = 1;
  let lineaIndex = 0;

  const borderThin = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  const fillCeleste = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFADD8E6" },
  };

  // Función para generar encabezado
  const generarEncabezado = (pagina) => {
    let row = currentRow;

    // FILA 1: Título
    if (esSaldoInicial) {
      worksheet.mergeCells(`A${row}:F${row}`);
      const cellTitulo = worksheet.getCell(`A${row}`);
      cellTitulo.value = "Formato 5.1 Libro Diario";
      cellTitulo.font = { bold: true, size: 12 };
      cellTitulo.alignment = { horizontal: "left", vertical: "middle" };

      worksheet.mergeCells(`G${row}:${lastCol}${row}`);
      const cellSub = worksheet.getCell(`G${row}`);
      cellSub.value = "SUB DIARIO 00 ASIENTO DE INICIO (APERTURA)";
      cellSub.font = { bold: true, size: 10 };
      cellSub.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      worksheet.mergeCells(`A${row}:${lastCol}${row}`);
      const cellTitulo = worksheet.getCell(`A${row}`);
      cellTitulo.value = "Formato 5.1 Libro Diario";
      cellTitulo.font = { bold: true, size: 12 };
      cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
    }
    worksheet.getRow(row).height = 18;
    row++;

    // FILA 2: Periodo y Página
    worksheet.mergeCells(`A${row}:F${row}`);
    const cellPeriodo = worksheet.getCell(`A${row}`);
    cellPeriodo.value = `Periodo: ${periodo.nombrePeriodo || ""}`;
    cellPeriodo.font = { size: 9 };
    cellPeriodo.alignment = { horizontal: "left", vertical: "middle" };

    worksheet.mergeCells(`G${row}:${lastCol}${row}`);
    const cellPag = worksheet.getCell(`G${row}`);
    cellPag.value = `PAG ${pagina}/${totalPaginas}`;
    cellPag.font = { size: 9 };
    cellPag.alignment = { horizontal: "right", vertical: "middle" };
    worksheet.getRow(row).height = 14;
    row++;

    // FILA 3: RUC y Código
    worksheet.mergeCells(`A${row}:F${row}`);
    const cellRuc = worksheet.getCell(`A${row}`);
    cellRuc.value = `RUC: ${empresa.ruc || ""}`;
    cellRuc.font = { size: 9 };
    cellRuc.alignment = { horizontal: "left", vertical: "middle" };

    worksheet.mergeCells(`G${row}:${lastCol}${row}`);
    const cellCodigo = worksheet.getCell(`G${row}`);
    cellCodigo.value = "CTLIBR51";
    cellCodigo.font = { size: 9 };
    cellCodigo.alignment = { horizontal: "right", vertical: "middle" };
    worksheet.getRow(row).height = 14;
    row++;

    // FILA 4: Razón Social
    worksheet.mergeCells(`A${row}:${lastCol}${row}`);
    const cellRazon = worksheet.getCell(`A${row}`);
    cellRazon.value = `Razón Social: ${empresa.razonSocial || ""}`;
    cellRazon.font = { size: 9 };
    cellRazon.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(row).height = 14;
    row++;

    // FILA 5: Expresado en
    worksheet.mergeCells(`A${row}:${lastCol}${row}`);
    const cellMoneda = worksheet.getCell(`A${row}`);
    cellMoneda.value = `Expresado en ${lineas[0]?.moneda?.nombreLargo || "SOLES"}`;
    cellMoneda.font = { size: 9 };
    cellMoneda.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(row).height = 14;
    row++;

    // FILA 6: Cabecera de tabla
    const headers = [
      "NUMERO\nREGISTRO",
      "FECHA\nOPERACION",
      "DESCRIPCION\nOPERACION",
      "CL",
      "CORRELATIVO",
      "N°\nDOCUMENT",
      "CODIGO",
      "DENOMINACION",
      "ANEXO",
      "DEBE",
      "HABER"
    ];

    headers.forEach((header, i) => {
      const cell = worksheet.getCell(row, i + 1);
      cell.value = header;
      cell.font = { bold: true, size: 8 };
      cell.fill = fillCeleste;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = borderThin;
    });
    worksheet.getRow(row).height = 24;
    row++;

    currentRow = row;
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
  generarEncabezado(paginaActual);

  // Procesar líneas
  while (lineaIndex < lineas.length) {
    const linea = lineas[lineaIndex];
    const row = currentRow;
    // NUMERO REGISTRO
    const esSI = linea.esSaldoInicial;
    const parte1 = esSI ? "00" : (linea.asientoContable?.tipoLibroContableSunat?.codigoSunat || "05");
    const correlativo = asientosMap.get(linea.asientoContableId);
    const parte2 = esSI ? "010001" : String(correlativo).padStart(6, '0');
    worksheet.getCell(row, 1).value = `${parte1} ${parte2}`;
    worksheet.getCell(row, 1).alignment = { vertical: 'top', horizontal: 'left' };
    worksheet.getCell(row, 1).border = borderThin;
    worksheet.getCell(row, 1).font = { size: 8 };

    // FECHA OPERACION
    const fecha = linea.fechaAsiento ? new Date(linea.fechaAsiento) : null;
    const fechaStr = fecha ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${String(fecha.getFullYear()).slice(-2)}` : "";
    worksheet.getCell(row, 2).value = fechaStr;
    worksheet.getCell(row, 2).alignment = { vertical: 'top', horizontal: 'center' };
    worksheet.getCell(row, 2).border = borderThin;
    worksheet.getCell(row, 2).font = { size: 8 };

    // DESCRIPCION OPERACION
    const descripcion = `${linea.glosaAsiento || ""} ${linea.glosa || ""}`.trim();
    worksheet.getCell(row, 3).value = descripcion;
    worksheet.getCell(row, 3).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    worksheet.getCell(row, 3).border = borderThin;
    worksheet.getCell(row, 3).font = { size: 8 };

    // CL
    worksheet.getCell(row, 4).value = linea.asientoContable?.tipoLibroContableSunat?.codigoSunat || "05";
    worksheet.getCell(row, 4).alignment = { vertical: 'top', horizontal: 'center' };
    worksheet.getCell(row, 4).border = borderThin;
    worksheet.getCell(row, 4).font = { size: 8 };

    // CORRELATIVO
    const corrLinea = esSI ? String(correlativo).padStart(4, '0') : String(linea.numeroLinea).padStart(4, '0');
    worksheet.getCell(row, 5).value = corrLinea;
    worksheet.getCell(row, 5).alignment = { vertical: 'top', horizontal: 'center' };
    worksheet.getCell(row, 5).border = borderThin;
    worksheet.getCell(row, 5).font = { size: 8 };

    // N° DOCUMENT
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
    worksheet.getCell(row, 6).value = numDoc;
    worksheet.getCell(row, 6).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    worksheet.getCell(row, 6).border = borderThin;
    worksheet.getCell(row, 6).font = { size: 8 };

    // CODIGO
    worksheet.getCell(row, 7).value = linea.planCuenta?.codigoCuenta || "";
    worksheet.getCell(row, 7).alignment = { vertical: 'top', horizontal: 'left' };
    worksheet.getCell(row, 7).border = borderThin;
    worksheet.getCell(row, 7).font = { size: 8 };

    // DENOMINACION
    worksheet.getCell(row, 8).value = linea.planCuenta?.nombreCuenta || "";
    worksheet.getCell(row, 8).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    worksheet.getCell(row, 8).border = borderThin;
    worksheet.getCell(row, 8).font = { size: 8 };

    // ANEXO
    let anexo = "";
    if (linea.entidadComercial) {
      const tipoDoc = linea.entidadComercial.tipoDocumento?.codigo || "";
      const numDoc = linea.entidadComercial.numeroDocumento || "";
      anexo = `${tipoDoc} ${numDoc}`.trim();
    } else if (linea.activo) {
      anexo = linea.activo.nombre || "";
    }
    worksheet.getCell(row, 9).value = anexo;
    worksheet.getCell(row, 9).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    worksheet.getCell(row, 9).border = borderThin;
    worksheet.getCell(row, 9).font = { size: 8 };

    // DEBE
    worksheet.getCell(row, 10).value = linea.debe || "";
    worksheet.getCell(row, 10).alignment = { vertical: 'top', horizontal: 'right' };
    worksheet.getCell(row, 10).border = borderThin;
    worksheet.getCell(row, 10).font = { size: 8 };
    worksheet.getCell(row, 10).numFmt = '#,##0.00';

    // HABER
    worksheet.getCell(row, 11).value = linea.haber || "";
    worksheet.getCell(row, 11).alignment = { vertical: 'top', horizontal: 'right' };
    worksheet.getCell(row, 11).border = borderThin;
    worksheet.getCell(row, 11).font = { size: 8 };
    worksheet.getCell(row, 11).numFmt = '#,##0.00';

    worksheet.getRow(row).height = 12;
    currentRow++;
    lineaIndex++;

    // Verificar salto de página
    const lineasEnPagina = (lineaIndex % LINEAS_POR_PAGINA);
    if (lineasEnPagina === 0 && lineaIndex < lineas.length) {
      paginaActual++;
      generarEncabezado(paginaActual);
    }
  }

  // TOTALES
  currentRow++;
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const cellTotales = worksheet.getCell(`A${currentRow}`);
  cellTotales.value = "TOTALES";
  cellTotales.font = { bold: true, size: 9 };
  cellTotales.alignment = { horizontal: "right", vertical: "middle" };
  cellTotales.border = borderThin;
  cellTotales.fill = fillCeleste;

  worksheet.getCell(currentRow, 10).value = totales.totalDebe;
  worksheet.getCell(currentRow, 10).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell(currentRow, 10).border = borderThin;
  worksheet.getCell(currentRow, 10).font = { bold: true, size: 9 };
  worksheet.getCell(currentRow, 10).numFmt = '#,##0.00';
  worksheet.getCell(currentRow, 10).fill = fillCeleste;

  worksheet.getCell(currentRow, 11).value = totales.totalHaber;
  worksheet.getCell(currentRow, 11).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell(currentRow, 11).border = borderThin;
  worksheet.getCell(currentRow, 11).font = { bold: true, size: 9 };
  worksheet.getCell(currentRow, 11).numFmt = '#,##0.00';
  worksheet.getCell(currentRow, 11).fill = fillCeleste;

  worksheet.getRow(currentRow).height = 16;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}