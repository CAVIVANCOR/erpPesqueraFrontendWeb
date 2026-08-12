// src/components/contabilidad/reports/generarBalanceComprobacionExcel.js
import ExcelJS from "exceljs";

export const generarBalanceComprobacionExcel = async (data) => {
  const { empresa, periodo, moneda, cuentas, totales } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Balance de Comprobación");

  worksheet.views = [{ showGridLines: false }];
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
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
  worksheet.getColumn(1).width = 12;  // CUENTA Y SUBCUENTA
  worksheet.getColumn(2).width = 40;  // DENOMINACIÓN
  worksheet.getColumn(3).width = 12;  // SI DEUDOR
  worksheet.getColumn(4).width = 12;  // SI ACREEDOR
  worksheet.getColumn(5).width = 12;  // MOV DEBE
  worksheet.getColumn(6).width = 12;  // MOV HABER
  worksheet.getColumn(7).width = 12;  // SF DEUDOR
  worksheet.getColumn(8).width = 12;  // SF ACREEDOR
  worksheet.getColumn(9).width = 12;  // ACTIVO
  worksheet.getColumn(10).width = 12; // PASIVO Y PATRIMONIO
  worksheet.getColumn(11).width = 12; // PÉRDIDA
  worksheet.getColumn(12).width = 12; // GANANCIA

  const borderThin = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } }
  };

  const fillCeleste = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFADD8E6" }
  };

  let currentRow = 1;

  // ==================== CABECERA ====================

  // FILA 1: Título oficial SUNAT
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
  const cellTitulo = worksheet.getCell(`A${currentRow}`);
  cellTitulo.value = "Formato 3.17 Libro de Inventarios y Balances - Balance de Comprobación";
  cellTitulo.font = { bold: true, size: 12 };
  cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // FILA 2: Periodo
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
  const cellPeriodo = worksheet.getCell(`A${currentRow}`);
  cellPeriodo.value = `Periodo: ${periodo.nombrePeriodo || ""}`;
  cellPeriodo.font = { size: 10 };
  cellPeriodo.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(currentRow).height = 14;
  currentRow++;

  // FILA 3: RUC
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
  const cellRuc = worksheet.getCell(`A${currentRow}`);
  cellRuc.value = `Ruc: ${empresa.ruc || ""}`;
  cellRuc.font = { size: 10 };
  cellRuc.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(currentRow).height = 14;
  currentRow++;

  // FILA 4: Razón Social
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
  const cellRazon = worksheet.getCell(`A${currentRow}`);
  cellRazon.value = `Apellidos y Nombres, Denominación o Razón Social: ${empresa.razonSocial || ""}`;
  cellRazon.font = { size: 10 };
  cellRazon.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(currentRow).height = 14;
  currentRow++;

  // Línea en blanco
  currentRow++;

  // ==================== ENCABEZADOS NIVEL 1 ====================
  const headerRow1 = worksheet.getRow(currentRow);

  // CUENTA Y SUBCUENTA CONTABLE (A)
  headerRow1.getCell(1).value = "CUENTA Y\nSUBCUENTA\nCONTABLE";
  headerRow1.getCell(1).font = { bold: true, size: 8 };
  headerRow1.getCell(1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(1).fill = fillCeleste;
  headerRow1.getCell(1).border = borderThin;

  // DENOMINACIÓN (B)
  headerRow1.getCell(2).value = "DENOMINACIÓN";
  headerRow1.getCell(2).font = { bold: true, size: 8 };
  headerRow1.getCell(2).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(2).fill = fillCeleste;
  headerRow1.getCell(2).border = borderThin;

  // SALDO INICIAL (C-D)
  worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
  headerRow1.getCell(3).value = "SALDO INICIAL";
  headerRow1.getCell(3).font = { bold: true, size: 8 };
  headerRow1.getCell(3).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(3).fill = fillCeleste;
  headerRow1.getCell(3).border = borderThin;
  headerRow1.getCell(4).border = borderThin;

  // MOVIMIENTOS (E-F)
  worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
  headerRow1.getCell(5).value = "MOVIMIENTOS";
  headerRow1.getCell(5).font = { bold: true, size: 8 };
  headerRow1.getCell(5).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(5).fill = fillCeleste;
  headerRow1.getCell(5).border = borderThin;
  headerRow1.getCell(6).border = borderThin;

  // SALDO FINAL (G-H)
  worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
  headerRow1.getCell(7).value = "SALDO FINAL";
  headerRow1.getCell(7).font = { bold: true, size: 8 };
  headerRow1.getCell(7).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(7).fill = fillCeleste;
  headerRow1.getCell(7).border = borderThin;
  headerRow1.getCell(8).border = borderThin;

  // BALANCE GENERAL (I-J)
  worksheet.mergeCells(`I${currentRow}:J${currentRow}`);
  headerRow1.getCell(9).value = "BALANCE GENERAL";
  headerRow1.getCell(9).font = { bold: true, size: 8 };
  headerRow1.getCell(9).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(9).fill = fillCeleste;
  headerRow1.getCell(9).border = borderThin;
  headerRow1.getCell(10).border = borderThin;

  // SALDO FINAL DEL ESTADO DE GANANCIAS Y PÉRDIDAS (K-L)
  worksheet.mergeCells(`K${currentRow}:L${currentRow}`);
  headerRow1.getCell(11).value = "SALDO FINAL DEL\nESTADO DE GANANCIAS\nY PÉRDIDAS";
  headerRow1.getCell(11).font = { bold: true, size: 8 };
  headerRow1.getCell(11).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow1.getCell(11).fill = fillCeleste;
  headerRow1.getCell(11).border = borderThin;
  headerRow1.getCell(12).border = borderThin;

  worksheet.getRow(currentRow).height = 30;
  currentRow++;

  // ==================== ENCABEZADOS NIVEL 2 ====================
  const headerRow2 = worksheet.getRow(currentRow);

  // Columnas 1-2 vacías (heredan del nivel 1)
  headerRow2.getCell(1).value = "";
  headerRow2.getCell(1).fill = fillCeleste;
  headerRow2.getCell(1).border = borderThin;

  headerRow2.getCell(2).value = "";
  headerRow2.getCell(2).fill = fillCeleste;
  headerRow2.getCell(2).border = borderThin;

  // SALDO INICIAL
  headerRow2.getCell(3).value = "DEUDOR";
  headerRow2.getCell(3).font = { bold: true, size: 8 };
  headerRow2.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(3).fill = fillCeleste;
  headerRow2.getCell(3).border = borderThin;

  headerRow2.getCell(4).value = "ACREEDOR";
  headerRow2.getCell(4).font = { bold: true, size: 8 };
  headerRow2.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(4).fill = fillCeleste;
  headerRow2.getCell(4).border = borderThin;

  // MOVIMIENTOS
  headerRow2.getCell(5).value = "DEBE";
  headerRow2.getCell(5).font = { bold: true, size: 8 };
  headerRow2.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(5).fill = fillCeleste;
  headerRow2.getCell(5).border = borderThin;

  headerRow2.getCell(6).value = "HABER";
  headerRow2.getCell(6).font = { bold: true, size: 8 };
  headerRow2.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(6).fill = fillCeleste;
  headerRow2.getCell(6).border = borderThin;

  // SALDO FINAL
  headerRow2.getCell(7).value = "DEUDOR";
  headerRow2.getCell(7).font = { bold: true, size: 8 };
  headerRow2.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(7).fill = fillCeleste;
  headerRow2.getCell(7).border = borderThin;

  headerRow2.getCell(8).value = "ACREEDOR";
  headerRow2.getCell(8).font = { bold: true, size: 8 };
  headerRow2.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(8).fill = fillCeleste;
  headerRow2.getCell(8).border = borderThin;

  // BALANCE GENERAL
  headerRow2.getCell(9).value = "ACTIVO";
  headerRow2.getCell(9).font = { bold: true, size: 8 };
  headerRow2.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(9).fill = fillCeleste;
  headerRow2.getCell(9).border = borderThin;

  headerRow2.getCell(10).value = "PASIVO Y\nPATRIMONIO";
  headerRow2.getCell(10).font = { bold: true, size: 8 };
  headerRow2.getCell(10).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow2.getCell(10).fill = fillCeleste;
  headerRow2.getCell(10).border = borderThin;

  // ESTADO DE GANANCIAS Y PÉRDIDAS
  headerRow2.getCell(11).value = "PÉRDIDA";
  headerRow2.getCell(11).font = { bold: true, size: 8 };
  headerRow2.getCell(11).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(11).fill = fillCeleste;
  headerRow2.getCell(11).border = borderThin;

  headerRow2.getCell(12).value = "GANANCIA";
  headerRow2.getCell(12).font = { bold: true, size: 8 };
  headerRow2.getCell(12).alignment = { horizontal: "center", vertical: "middle" };
  headerRow2.getCell(12).fill = fillCeleste;
  headerRow2.getCell(12).border = borderThin;

  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // ==================== DATOS DE CUENTAS ====================
  let totalActivo = 0;
  let totalPasivoPat = 0;
  let totalPerdida = 0;
  let totalGanancia = 0;

  cuentas.forEach((cuenta) => {
    const row = worksheet.getRow(currentRow);

    // Calcular valores para Balance General y Estado de G&P
    const saldoFinalNeto = (cuenta.saldoFinalDebe || 0) - (cuenta.saldoFinalHaber || 0);

    let activo = 0;
    let pasivoPat = 0;

    if (cuenta.tipoCuenta === 'ACTIVO' && saldoFinalNeto > 0) {
      activo = saldoFinalNeto;
      totalActivo += activo;
    }

    if ((cuenta.tipoCuenta === 'PASIVO' || cuenta.tipoCuenta === 'PATRIMONIO') && saldoFinalNeto < 0) {
      pasivoPat = Math.abs(saldoFinalNeto);
      totalPasivoPat += pasivoPat;
    }

    const perdida = cuenta.tipoCuenta === 'GASTO' ? (cuenta.debe || 0) : 0;
    const ganancia = cuenta.tipoCuenta === 'INGRESO' ? (cuenta.haber || 0) : 0;

    totalPerdida += perdida;
    totalGanancia += ganancia;

    // Columna 1: Código
    row.getCell(1).value = cuenta.codigoCuenta || "";
    row.getCell(1).font = { size: 8 };
    row.getCell(1).alignment = { horizontal: "left", vertical: "top" };
    row.getCell(1).border = borderThin;

    // Columna 2: Denominación
    row.getCell(2).value = cuenta.nombreCuenta || "";
    row.getCell(2).font = { size: 8 };
    row.getCell(2).alignment = { horizontal: "left", vertical: "top", wrapText: true };
    row.getCell(2).border = borderThin;

    // Columna 3: SI Deudor
    row.getCell(3).value = (cuenta.saldoInicialDebe && cuenta.saldoInicialDebe !== 0) ? cuenta.saldoInicialDebe : null;
    row.getCell(3).font = { size: 8 };
    row.getCell(3).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(3).numFmt = '#,##0.00';
    row.getCell(3).border = borderThin;

    // Columna 4: SI Acreedor
    row.getCell(4).value = (cuenta.saldoInicialHaber && cuenta.saldoInicialHaber !== 0) ? cuenta.saldoInicialHaber : null;
    row.getCell(4).font = { size: 8 };
    row.getCell(4).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(4).border = borderThin;

    // Columna 5: Mov Debe
    row.getCell(5).value = (cuenta.debe && cuenta.debe !== 0) ? cuenta.debe : null;
    row.getCell(5).font = { size: 8 };
    row.getCell(5).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(5).border = borderThin;

    // Columna 6: Mov Haber
    row.getCell(6).value = (cuenta.haber && cuenta.haber !== 0) ? cuenta.haber : null;
    row.getCell(6).font = { size: 8 };
    row.getCell(6).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(6).numFmt = '#,##0.00';
    row.getCell(6).border = borderThin;

    // Columna 7: SF Deudor
    row.getCell(7).value = (cuenta.saldoFinalDebe && cuenta.saldoFinalDebe !== 0) ? cuenta.saldoFinalDebe : null;
    row.getCell(7).font = { size: 8 };
    row.getCell(7).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(7).border = borderThin;

    // Columna 8: SF Acreedor
    row.getCell(8).value = (cuenta.saldoFinalHaber && cuenta.saldoFinalHaber !== 0) ? cuenta.saldoFinalHaber : null;
    row.getCell(8).font = { size: 8 };
    row.getCell(8).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(8).border = borderThin;

    // Columna 9: Activo
    row.getCell(9).value = (activo && Math.abs(activo) > 0.01) ? activo : null;
    row.getCell(9).font = { size: 8 };
    row.getCell(9).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(9).numFmt = '#,##0.00';
    row.getCell(9).border = borderThin;

    // Columna 10: Pasivo y Patrimonio
    row.getCell(10).value = (pasivoPat && Math.abs(pasivoPat) > 0.01) ? pasivoPat : null;
    row.getCell(10).font = { size: 8 };
    row.getCell(10).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(10).numFmt = '#,##0.00';
    row.getCell(10).border = borderThin;

    // Columna 11: Pérdida
    row.getCell(11).value = (perdida && Math.abs(perdida) > 0.01) ? perdida : null;
    row.getCell(11).font = { size: 8 };
    row.getCell(11).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(11).numFmt = '#,##0.00';
    row.getCell(11).border = borderThin;

    // Columna 12: Ganancia
    row.getCell(12).value = (ganancia && Math.abs(ganancia) > 0.01) ? ganancia : null;
    row.getCell(12).font = { size: 8 };
    row.getCell(12).alignment = { horizontal: "right", vertical: "top" };
    row.getCell(12).numFmt = '#,##0.00';
    row.getCell(12).border = borderThin;

    currentRow++;
  });

  // ==================== RESULTADO DEL EJERCICIO ====================
  const resultadoEjercicio = totalGanancia - totalPerdida;
  const rowResultado = worksheet.getRow(currentRow);

  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  rowResultado.getCell(1).value = "RESULTADO DEL EJERCICIO O PERIODO";
  rowResultado.getCell(1).font = { bold: true, size: 9 };
  rowResultado.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  rowResultado.getCell(1).border = borderThin;
  rowResultado.getCell(2).border = borderThin;

  // Columnas 3-10 vacías
  for (let col = 3; col <= 10; col++) {
    rowResultado.getCell(col).value = null;
    rowResultado.getCell(col).border = borderThin;
  }

  // Si hay ganancia (positivo), va en columna 12
  // Si hay pérdida (negativo), va en columna 11
  if (resultadoEjercicio > 0) {
    rowResultado.getCell(11).value = null;
    rowResultado.getCell(11).border = borderThin;
    rowResultado.getCell(12).value = resultadoEjercicio;
    rowResultado.getCell(12).font = { bold: true, size: 9 };
    rowResultado.getCell(12).alignment = { horizontal: "right", vertical: "middle" };
    rowResultado.getCell(12).numFmt = '#,##0.00';
    rowResultado.getCell(12).border = borderThin;
    totalGanancia += resultadoEjercicio;
  } else if (resultadoEjercicio < 0) {
    rowResultado.getCell(11).value = Math.abs(resultadoEjercicio);
    rowResultado.getCell(11).font = { bold: true, size: 9 };
    rowResultado.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
    rowResultado.getCell(11).numFmt = '#,##0.00';
    rowResultado.getCell(11).border = borderThin;
    rowResultado.getCell(12).value = null;
    rowResultado.getCell(12).border = borderThin;
    totalPerdida += Math.abs(resultadoEjercicio);
  } else {
    rowResultado.getCell(11).value = null;
    rowResultado.getCell(11).border = borderThin;
    rowResultado.getCell(12).value = null;
    rowResultado.getCell(12).border = borderThin;
  }

  currentRow++;

  // ==================== SUPERÁVIT (AJUSTE DE CUADRE) ====================
  const diferenciaBG = totalActivo - totalPasivoPat;
  const rowSuperavit = worksheet.getRow(currentRow);

  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  rowSuperavit.getCell(1).value = "RESULTADO DEL EJERCICIO O PERIODO SUPERAVIT";
  rowSuperavit.getCell(1).font = { bold: true, size: 9 };
  rowSuperavit.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  rowSuperavit.getCell(1).border = borderThin;
  rowSuperavit.getCell(2).border = borderThin;

  // Columnas 3-9 vacías
  for (let col = 3; col <= 9; col++) {
    rowSuperavit.getCell(col).value = null;
    rowSuperavit.getCell(col).border = borderThin;
  }

  // El ajuste va en columna 10 (Pasivo y Patrimonio)
  if (Math.abs(diferenciaBG) > 0.01) {
    rowSuperavit.getCell(10).value = diferenciaBG;
    rowSuperavit.getCell(10).font = { bold: true, size: 9 };
    rowSuperavit.getCell(10).alignment = { horizontal: "right", vertical: "middle" };
    rowSuperavit.getCell(10).numFmt = '#,##0.00';
    rowSuperavit.getCell(10).border = borderThin;
    totalPasivoPat += diferenciaBG;
  } else {
    rowSuperavit.getCell(10).value = null;
    rowSuperavit.getCell(10).border = borderThin;
  }

  // Columnas 11-12 vacías
  rowSuperavit.getCell(11).value = null;
  rowSuperavit.getCell(11).border = borderThin;
  rowSuperavit.getCell(12).value = null;
  rowSuperavit.getCell(12).border = borderThin;

  currentRow++;

  // ==================== TOTALES ====================
  const totalSIDebe = cuentas.reduce((sum, c) => sum + (c.saldoInicialDebe || 0), 0);
  const totalSIHaber = cuentas.reduce((sum, c) => sum + (c.saldoInicialHaber || 0), 0);
  const totalSFDebe = cuentas.reduce((sum, c) => sum + (c.saldoFinalDebe || 0), 0);
  const totalSFHaber = cuentas.reduce((sum, c) => sum + (c.saldoFinalHaber || 0), 0);

  const rowTotales = worksheet.getRow(currentRow);

  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  rowTotales.getCell(1).value = "TOTALES";
  rowTotales.getCell(1).font = { bold: true, size: 10 };
  rowTotales.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  rowTotales.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  rowTotales.getCell(1).border = borderThin;
  rowTotales.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  rowTotales.getCell(2).border = borderThin;

  // Totales numéricos
  const totalesData = [
    { col: 3, value: totalSIDebe },
    { col: 4, value: totalSIHaber },
    { col: 5, value: totales.totalDebe || 0 },
    { col: 6, value: totales.totalHaber || 0 },
    { col: 7, value: totalSFDebe },
    { col: 8, value: totalSFHaber },
    { col: 9, value: totalActivo },
    { col: 10, value: totalPasivoPat },
    { col: 11, value: totalPerdida },
    { col: 12, value: totalGanancia }
  ];

  totalesData.forEach(t => {
    rowTotales.getCell(t.col).value = t.value;
    rowTotales.getCell(t.col).font = { bold: true, size: 9 };
    rowTotales.getCell(t.col).alignment = { horizontal: "right", vertical: "middle" };
    rowTotales.getCell(t.col).numFmt = '#,##0.00';
    rowTotales.getCell(t.col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    rowTotales.getCell(t.col).border = borderThin;
  });

  worksheet.getRow(currentRow).height = 16;

  // ==================== GENERAR BLOB ====================
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};