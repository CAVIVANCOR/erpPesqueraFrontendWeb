// src/components/temporadaPesca/reports/generarReportePescaExcel.js
import ExcelJS from 'exceljs';

export async function generarReportePescaExcel(data) {
  const { temporada, cuotas, descargas } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte Pesca');

  worksheet.views = [{ showGridLines: false }];

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 12;
  worksheet.getColumn(3).width = 14;
  worksheet.getColumn(4).width = 30;
  worksheet.getColumn(5).width = 14;
  worksheet.getColumn(6).width = 22;
  worksheet.getColumn(7).width = 12;
  worksheet.getColumn(8).width = 14;
  worksheet.getColumn(9).width = 14;
  worksheet.getColumn(10).width = 12;

  const TOTAL_COLS = 10;
  const lastCol = 'J';

  let currentRow = 1;

  const noBorder = {
    top: { style: 'none' }, left: { style: 'none' },
    bottom: { style: 'none' }, right: { style: 'none' }
  };

  const borderCeleste = {
    top: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    left: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    bottom: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    right: { style: 'thin', color: { argb: 'FF8EC8DA' } }
  };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };

  const fillCeleste = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } };
  const fillNone = { type: 'pattern', pattern: 'none' };

  const limpiarFila = (row) => {
    for (let i = 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(row, i);
      cell.border = noBorder;
      cell.fill = fillNone;
      cell.value = null;
    }
  };

  // ─── ENCABEZADO EMPRESA ───────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const empresaCell = worksheet.getCell(`A${currentRow}`);
  empresaCell.value = temporada.empresa?.razonSocial || "EMPRESA";
  empresaCell.font = { bold: true, size: 12 };
  empresaCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const rucCell = worksheet.getCell(`A${currentRow}`);
  rucCell.value = `RUC: ${temporada.empresa?.ruc || "-"}`;
  rucCell.font = { size: 10 };
  rucCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 16;
  currentRow++;

  if (temporada.empresa?.direccion) {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const dirCell = worksheet.getCell(`A${currentRow}`);
    dirCell.value = `Dirección: ${temporada.empresa.direccion}`;
    dirCell.font = { size: 10 };
    dirCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  }

  currentRow++;

  // ─── TÍTULO ───────────────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "REPORTE DE PESCA INDUSTRIAL";
  tituloCell.font = { bold: true, size: 12 };
  tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const nombreCell = worksheet.getCell(`A${currentRow}`);
  nombreCell.value = temporada.nombre || "TEMPORADA";
  nombreCell.font = { bold: true, size: 16 };
  nombreCell.alignment = { horizontal: 'center', vertical: 'middle' };
  nombreCell.border = noBorder;
  worksheet.getRow(currentRow).height = 26;
  currentRow++;

  currentRow++;

  // ─── TABLA CUOTAS ─────────────────────────────────────────────────
  const cuotaHeadersData = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Precio/Ton", "PMCE (%)"];
  cuotaHeadersData.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const limiteTonHeader = worksheet.getCell(currentRow, 8);
  limiteTonHeader.value = "Limite Ton.";
  limiteTonHeader.font = { bold: true, size: 8 };
  limiteTonHeader.fill = fillCeleste;
  limiteTonHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  limiteTonHeader.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);
  let totalCalculado = 0;

  cuotas.forEach((cuota, index) => {
    const porcentaje = Number(cuota.porcentajeCuota || 0);
    const limiteTon = (porcentaje / 100) * limiteMaximo;
    totalCalculado += limiteTon;

    const rowData = [
      index + 1,
      cuota.zona || "-",
      cuota.cuotaPropia ? "PROPIA" : "ALQUILADA",
      cuota.nombre || "-",
      cuota.esAlquiler ? "ALQUILER" : "PESCA",
      Number(cuota.precioPorTonDolares || 0),
      porcentaje
    ];

    const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';
    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = borderThin;
      cell.font = { size: 8 };
      if (colIndex === 0 || colIndex === 1 || colIndex === 2 || colIndex === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colIndex === 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colIndex === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      } else if (colIndex === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.000000';
      }
    });
    worksheet.mergeCells(currentRow, 8, currentRow, 10);
    const limiteTonCell = worksheet.getCell(currentRow, 8);
    limiteTonCell.value = limiteTon;
    limiteTonCell.numFmt = '#,##0.000';
    limiteTonCell.font = { size: 8 };
    limiteTonCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    limiteTonCell.alignment = { horizontal: 'right', vertical: 'middle' };
    limiteTonCell.border = borderThin;
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  });

  // Fila TOTAL cuotas celeste
  for (let i = 1; i <= 7; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillCeleste;
    cell.font = { bold: true, size: 8 };
    cell.border = borderCeleste;
    cell.value = i === 7 ? "TOTAL" : "";
    if (i === 7) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const totalCuotaCell = worksheet.getCell(currentRow, 8);
  totalCuotaCell.value = totalCalculado;
  totalCuotaCell.numFmt = '#,##0.000';
  totalCuotaCell.font = { bold: true, size: 8 };
  totalCuotaCell.fill = fillCeleste;
  totalCuotaCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalCuotaCell.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO SALDO CUOTA ───────────────────────────────────────────
  const rowSaldo = worksheet.getRow(currentRow);
  rowSaldo.height = 22;
  for (let i = 1; i <= TOTAL_COLS; i++) { rowSaldo.getCell(i).style = {}; }
  worksheet.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
  const saldoTituloCell = rowSaldo.getCell(1);
  saldoTituloCell.style = {
    font: { bold: true, size: 13 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  saldoTituloCell.value = `SALDO CUOTA ${temporada.nombre || ""}`;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── CUADRO RESUMEN ───────────────────────────────────────────────
  const avanceTotal = (descargas ?? []).reduce((sum, d) => sum + Number(d.toneladas || 0), 0);
  const saldoTotal = totalCalculado - avanceTotal;
  const porcentajeAvanzado = totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;

  // Headers resumen: A-D celeste, E-J limpias
  const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado"];
  resumenHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.fill = fillCeleste;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  for (let i = 5; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Datos resumen: A-D con borde, E-J limpias
  const resumenData = [
    { val: totalCalculado, fmt: '#,##0.000 "Ton."' },
    { val: avanceTotal, fmt: '#,##0.000 "Ton."' },
    { val: saldoTotal, fmt: '#,##0.000 "Ton."' },
    { val: porcentajeAvanzado / 100, fmt: '0.00%' }
  ];
  resumenData.forEach(({ val, fmt }, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = val;
    cell.numFmt = fmt;
    cell.font = { size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  });
  for (let i = 5; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO DETALLE DESCARGA ──────────────────────────────────────
  const rowDetalle = worksheet.getRow(currentRow);
  rowDetalle.height = 22;
  for (let i = 1; i <= TOTAL_COLS; i++) { rowDetalle.getCell(i).style = {}; }
  worksheet.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
  const detalleTituloCell = rowDetalle.getCell(1);
  detalleTituloCell.style = {
    font: { bold: true, size: 13 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  detalleTituloCell.value = "DETALLE DE DESCARGA EN TN";
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── HEADERS TABLA DESCARGA ───────────────────────────────────────
  const descargaHeaders = ["N°", "Especie", "Cliente", "Puerto", "Plataforma", "Observaciones", "Reporte", "Petroleo Gal.", "Toneladas", "% Juveniles"];
  descargaHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // ─── FILAS DESCARGA ───────────────────────────────────────────────
  if (descargas && descargas.length > 0) {
    let totalToneladas = 0;
    let totalGalones = 0;

    descargas.forEach((descarga, index) => {
      const especieNombre = descarga.especie?.nombre || "-";
      const clienteNombre = descarga.cliente?.razonSocial || descarga.cliente?.nombre || "-";
      const puertoNombre = descarga.puertoDescarga?.nombre || "-";
      const plataforma = descarga.numPlataformaDescarga || "-";
      const observaciones = descarga.observaciones || "-";
      const reporte = descarga.numReporteRecepcion || "-";
      const galones = Number(descarga.combustibleAbastecidoGalones || 0);
      const toneladas = Number(descarga.toneladas || 0);
      const porcentajeJuveniles = descarga.porcentajeJuveniles
        ? Number(descarga.porcentajeJuveniles) / 100
        : null;

      totalToneladas += toneladas;
      totalGalones += galones;

      const rowData = [
        index + 1, especieNombre, clienteNombre, puertoNombre,
        plataforma, observaciones, reporte, galones, toneladas, porcentajeJuveniles
      ];

      const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';
      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value !== null ? value : "";
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = borderThin;
        cell.font = { size: 8 };
        if (colIndex === 0 || colIndex === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIndex >= 1 && colIndex <= 5) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIndex === 7) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        } else if (colIndex === 8) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.000';
        } else if (colIndex === 9) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.00%';
        }
      });
      worksheet.getRow(currentRow).height = 16;
      currentRow++;
    });

    // Fila TOTALES celeste
    for (let i = 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillCeleste;
      cell.font = { bold: true, size: 8 };
      cell.border = borderCeleste;
      cell.value = "";
      if (i === 6) {
        cell.value = "TOTALES";
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (i === 8) {
        cell.value = totalGalones;
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (i === 9) {
        cell.value = totalToneladas;
        cell.numFmt = '#,##0.000 "Ton."';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }
    worksheet.getRow(currentRow).height = 18;
  } else {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const noDataCell = worksheet.getCell(`A${currentRow}`);
    noDataCell.value = "No hay descargas registradas para esta temporada";
    noDataCell.font = { italic: true, size: 9 };
    noDataCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}