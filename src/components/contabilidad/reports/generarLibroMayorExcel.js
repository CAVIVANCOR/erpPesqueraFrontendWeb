// src/components/contabilidad/reports/generarLibroMayorExcel.js
import ExcelJS from "exceljs";

export const generarLibroMayorExcel = async (data) => {
  const { empresa, periodo, cuentas, totales, moneda } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Libro Mayor");

  worksheet.views = [{ showGridLines: false }];
  worksheet.pageSetup = {
    paperSize: 9,
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

  worksheet.getColumn(1).width = 12;
  worksheet.getColumn(2).width = 12;
  worksheet.getColumn(3).width = 50;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 15;

  const borderThin = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } }
  };

  const esSaldoInicial = cuentas.some(cuenta =>
    cuenta.movimientos.some(mov =>
      mov.esSaldoInicial === true ||
      mov.glosa?.includes("Saldo inicial") ||
      mov.glosaAsiento?.includes("Saldo inicial")
    )
  );

  let currentRow = 1;

  if (esSaldoInicial) {
    const tituloRow = worksheet.getRow(currentRow);
    tituloRow.values = ['Formato 6.1 Libro Mayor', '', '', '', '', 'LIBRO MAYOR - SALDOS INICIALES'];
    tituloRow.font = { bold: true, size: 10 };
    tituloRow.getCell(1).alignment = { horizontal: 'left' };
    tituloRow.getCell(6).alignment = { horizontal: 'right' };
    tituloRow.getCell(6).font = { bold: true, size: 8 };
  } else {
    const tituloRow = worksheet.getRow(currentRow);
    tituloRow.values = ['', '', 'Formato 6.1 Libro Mayor'];
    tituloRow.font = { bold: true, size: 10 };
    tituloRow.getCell(3).alignment = { horizontal: 'center' };
  }
  currentRow++;

  const periodoRow = worksheet.getRow(currentRow);
  periodoRow.values = [`Periodo: ${periodo.nombrePeriodo || ""}`, '', '', '', '', 'PAG 1/1'];
  periodoRow.font = { size: 8 };
  periodoRow.getCell(6).alignment = { horizontal: 'right' };
  currentRow++;

  const rucRow = worksheet.getRow(currentRow);
  rucRow.values = [`RUC: ${empresa.ruc || ""}`, '', '', '', '', 'CTLIBR61'];
  rucRow.font = { size: 8 };
  rucRow.getCell(6).alignment = { horizontal: 'right' };
  currentRow++;

  const razonRow = worksheet.getRow(currentRow);
  razonRow.values = [`Razón Social: ${empresa.razonSocial || ""}`];
  razonRow.font = { size: 8 };
  currentRow++;

  const monedaRow = worksheet.getRow(currentRow);
  monedaRow.values = [`Expresado en ${moneda?.nombreLargo || "SOLES"}`];
  monedaRow.font = { size: 8 };
  currentRow++;

  currentRow++;

  cuentas.forEach((cuenta) => {
    const tituloCuentaRow = worksheet.getRow(currentRow);
    tituloCuentaRow.values = [`${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`];
    tituloCuentaRow.font = { bold: true, size: 9 };
    worksheet.mergeCells(currentRow, 1, currentRow, 6);
    tituloCuentaRow.border = borderThin;
    currentRow++;

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = [
      'FECHA\nOPERACION',
      'Nº\nASIENTO',
      'GLOSA',
      'DEBE',
      'HABER',
      'SALDO'
    ];
    headerRow.font = { bold: true, size: 8 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFADD8E6' }
    };
    headerRow.border = borderThin;
    headerRow.height = 25;
    currentRow++;

    let saldoAcumulado = 0;
    let totalDebe = 0;
    let totalHaber = 0;

    cuenta.movimientos.forEach((mov) => {
      const debe = Number(mov.debe) || 0;
      const haber = Number(mov.haber) || 0;
      saldoAcumulado += (debe - haber);
      totalDebe += debe;
      totalHaber += haber;

      const fechaAsiento = mov.fechaAsiento || mov.asientoContable?.fechaAsiento || mov.fecha;
      let fechaStr = "";
      if (fechaAsiento) {
        const fecha = new Date(fechaAsiento);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = String(fecha.getFullYear()).slice(-2);
        fechaStr = `${dia}/${mes}/${anio}`;
      }

      const numAsiento = mov.numeroAsiento || mov.asientoContable?.numeroAsiento || mov.asientoContable?.correlativo || "";

      const esMovSaldoInicial = mov.esSaldoInicial === true ||
        mov.glosa?.includes("Saldo inicial") ||
        mov.glosaAsiento?.includes("Saldo inicial");
      const glosa = esMovSaldoInicial
        ? "Saldo inicial S/N"
        : (mov.glosa || mov.glosaAsiento || "").trim();

      const movRow = worksheet.getRow(currentRow);
      movRow.values = [
        fechaStr,
        String(numAsiento),
        glosa,
        debe || '',
        haber || '',
        saldoAcumulado
      ];
      movRow.font = { size: 8 };
      movRow.alignment = { vertical: 'top', wrapText: true };
      movRow.getCell(1).alignment = { horizontal: 'left', vertical: 'top' };
      movRow.getCell(2).alignment = { horizontal: 'left', vertical: 'top' };
      movRow.getCell(3).alignment = { horizontal: 'left', vertical: 'top' };
      movRow.getCell(4).alignment = { horizontal: 'right', vertical: 'top' };
      movRow.getCell(5).alignment = { horizontal: 'right', vertical: 'top' };
      movRow.getCell(6).alignment = { horizontal: 'right', vertical: 'top' };
      movRow.getCell(4).numFmt = '#,##0.00';
      movRow.getCell(5).numFmt = '#,##0.00';
      movRow.getCell(6).numFmt = '#,##0.00';
      movRow.border = borderThin;
      currentRow++;
    });

    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = [
      '', '', 'TOTALES CUENTA:',
      totalDebe,
      totalHaber,
      saldoAcumulado
    ];
    totalRow.font = { bold: true, size: 9 };
    totalRow.alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(3).alignment = { horizontal: 'left' };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFADD8E6' }
    };
    totalRow.getCell(4).numFmt = '#,##0.00';
    totalRow.getCell(5).numFmt = '#,##0.00';
    totalRow.getCell(6).numFmt = '#,##0.00';
    totalRow.border = borderThin;
    currentRow++;

    currentRow++;
  });

  const totalGeneralRow = worksheet.getRow(currentRow);
  totalGeneralRow.values = [
    '', '', 'TOTALES GENERALES:',
    totales.totalDebe,
    totales.totalHaber,
    ''
  ];
  totalGeneralRow.font = { bold: true, size: 10 };
  totalGeneralRow.alignment = { horizontal: 'right', vertical: 'middle' };
  totalGeneralRow.getCell(3).alignment = { horizontal: 'left' };
  totalGeneralRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFADD8E6' }
  };
  totalGeneralRow.getCell(4).numFmt = '#,##0.00';
  totalGeneralRow.getCell(5).numFmt = '#,##0.00';
  totalGeneralRow.border = borderThin;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};