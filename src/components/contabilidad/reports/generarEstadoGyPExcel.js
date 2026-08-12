import ExcelJS from "exceljs";

export const generarEstadoGyPExcel = async (data) => {
  const { empresa, periodo, moneda, cuentas, totales } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Estado de Ganancias y Pérdidas");

  worksheet.views = [{ showGridLines: false }];
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 }
  };

  worksheet.getColumn(1).width = 12;
  worksheet.getColumn(2).width = 50;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 15;

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

  const tituloRow = worksheet.getRow(currentRow);
  tituloRow.values = ['', '', 'ESTADO DE GANANCIAS Y PÉRDIDAS'];
  tituloRow.font = { bold: true, size: 12 };
  tituloRow.getCell(3).alignment = { horizontal: 'center' };
  currentRow++;

  const periodoRow = worksheet.getRow(currentRow);
  periodoRow.values = [`Periodo: ${periodo.nombrePeriodo || ""}`];
  periodoRow.font = { size: 9 };
  currentRow++;

  const rucRow = worksheet.getRow(currentRow);
  rucRow.values = [`RUC: ${empresa.ruc || ""}`];
  rucRow.font = { size: 9 };
  currentRow++;

  const razonRow = worksheet.getRow(currentRow);
  razonRow.values = [`Razón Social: ${empresa.razonSocial || ""}`];
  razonRow.font = { size: 9 };
  currentRow++;

  const monedaRow = worksheet.getRow(currentRow);
  monedaRow.values = [`Expresado en ${moneda?.nombreLargo || "SOLES"}`];
  monedaRow.font = { size: 9 };
  currentRow++;

  currentRow++;

  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = ['CÓDIGO', 'DENOMINACIÓN', 'TIPO', 'MONTO'];
  headerRow.font = { bold: true, size: 9 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = fillCeleste;
  headerRow.border = borderThin;
  currentRow++;

  cuentas.forEach((cuenta) => {
    const row = worksheet.getRow(currentRow);
    
    const monto = cuenta.tipoCuenta === 'INGRESO' ? (cuenta.haber || 0) : (cuenta.debe || 0);

    row.values = [
      cuenta.codigoCuenta || "",
      cuenta.nombreCuenta || "",
      cuenta.tipoCuenta || "",
      monto
    ];
    
    row.font = { size: 8 };
    row.alignment = { vertical: 'top' };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'top' };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'top' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell(4).alignment = { horizontal: 'right', vertical: 'top' };
    row.getCell(4).numFmt = '#,##0.00';
    row.border = borderThin;
    currentRow++;
  });

  const totalRow = worksheet.getRow(currentRow);
  totalRow.values = [
    '', 'TOTALES:',
    '',
    ''
  ];
  totalRow.font = { bold: true, size: 10 };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  totalRow.border = borderThin;
  currentRow++;

  const ingresosRow = worksheet.getRow(currentRow);
  ingresosRow.values = ['', 'Total Ingresos:', '', totales.totalIngresos];
  ingresosRow.font = { bold: true, size: 9 };
  ingresosRow.getCell(4).numFmt = '#,##0.00';
  ingresosRow.getCell(4).alignment = { horizontal: 'right' };
  currentRow++;

  const gastosRow = worksheet.getRow(currentRow);
  gastosRow.values = ['', 'Total Gastos:', '', totales.totalGastos];
  gastosRow.font = { bold: true, size: 9 };
  gastosRow.getCell(4).numFmt = '#,##0.00';
  gastosRow.getCell(4).alignment = { horizontal: 'right' };
  currentRow++;

  const utilidadRow = worksheet.getRow(currentRow);
  const utilidadLabel = totales.utilidad >= 0 ? 'Utilidad del Ejercicio:' : 'Pérdida del Ejercicio:';
  utilidadRow.values = ['', utilidadLabel, '', Math.abs(totales.utilidad)];
  utilidadRow.font = { bold: true, size: 9 };
  utilidadRow.getCell(4).numFmt = '#,##0.00';
  utilidadRow.getCell(4).alignment = { horizontal: 'right' };
  utilidadRow.fill = { 
    type: "pattern", 
    pattern: "solid", 
    fgColor: { argb: totales.utilidad >= 0 ? "FF90EE90" : "FFFFC0CB" } 
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};