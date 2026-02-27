// src/components/temporadaPesca/reports/generarLiquidacionTripulantesExcel.js
import ExcelJS from 'exceljs';
import { consultarTipoCambioSunat } from '../../../api/consultaExterna';

export async function generarLiquidacionTripulantesExcel(data) {
  const { temporada, cuotas, descargas, descuentos } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Liquidacion Tripulantes');

  worksheet.views = [{ showGridLines: false }];

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 16;
  worksheet.getColumn(5).width = 16;
  worksheet.getColumn(6).width = 18;
  worksheet.getColumn(7).width = 12;
  worksheet.getColumn(8).width = 12;
  worksheet.getColumn(9).width = 12;
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
  const fillAzul = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8DCFA' } };
  const fillRojo = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAC8C8' } };
  const fillVerde = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFEDCA' } };
  const fillNone = { type: 'pattern', pattern: 'none' };

  const borderAzul = {
    top: { style: 'thin', color: { argb: 'FF72A0C1' } },
    left: { style: 'thin', color: { argb: 'FF72A0C1' } },
    bottom: { style: 'thin', color: { argb: 'FF72A0C1' } },
    right: { style: 'thin', color: { argb: 'FF72A0C1' } }
  };
  const borderRojo = {
    top: { style: 'thin', color: { argb: 'FFC87878' } },
    left: { style: 'thin', color: { argb: 'FFC87878' } },
    bottom: { style: 'thin', color: { argb: 'FFC87878' } },
    right: { style: 'thin', color: { argb: 'FFC87878' } }
  };
  const borderVerde = {
    top: { style: 'thin', color: { argb: 'FF78B87A' } },
    left: { style: 'thin', color: { argb: 'FF78B87A' } },
    bottom: { style: 'thin', color: { argb: 'FF78B87A' } },
    right: { style: 'thin', color: { argb: 'FF78B87A' } }
  };

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
  tituloCell.value = "LIQUIDACION DE PESCA TRIPULANTES PESCA INDUSTRIAL";
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

  // Fila TOTAL cuotas
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

  // ─── CUADRO RESUMEN ───────────────────────────────────────────────
  const avanceTotal = (descargas ?? []).reduce((sum, d) => sum + Number(d.toneladas || 0), 0);
  const saldoTotal = totalCalculado - avanceTotal;
  const porcentajeAvanzado = totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;

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

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO INGRESOS ──────────────────────────────────────────────
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 22;
  worksheet.mergeCells(currentRow, 1, currentRow, 6);
  const ingresosTituloCell = worksheet.getCell(currentRow, 1);
  ingresosTituloCell.value = "INGRESOS - DETALLE DE DESCARGAS";
  ingresosTituloCell.font = { bold: true, size: 13 };
  ingresosTituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── HEADERS TABLA INGRESOS ───────────────────────────────────────
  const ingresosHeaders = ["N°", "Fecha Descarga", "Especie", "Toneladas", "Precio/Ton US$", "Total a Pagar US$"];
  ingresosHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillAzul;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderAzul;
  });
  for (let i = ingresosHeaders.length + 1; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // ─── FILAS INGRESOS ───────────────────────────────────────────────
  const precioPorTon = Number(temporada.precioPorTonDolares || 0);
  const descargasLista = descargas ?? [];
  let totalToneladasIngresos = 0;
  let totalPagarIngresos = 0;

  descargasLista.forEach((descarga, index) => {
    const fecha = descarga.fechaHoraFinDescarga
      ? new Date(descarga.fechaHoraFinDescarga).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : "-";
    const especie = descarga.especie?.nombre || "-";
    const toneladas = Number(descarga.toneladas || 0);
    const totalPagar = toneladas * precioPorTon;
    totalToneladasIngresos += toneladas;
    totalPagarIngresos += totalPagar;

    const rowData = [index + 1, fecha, especie, toneladas, precioPorTon, totalPagar];
    const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';

    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = borderThin;
      cell.font = { size: 8 };
      if (colIndex === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colIndex === 1 || colIndex === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colIndex === 3) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.000';
      } else if (colIndex === 4 || colIndex === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      }
    });
    for (let i = rowData.length + 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillNone;
      cell.border = noBorder;
      cell.value = null;
    }
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  });

  // Fila TOTALES ingresos
  for (let i = 1; i <= 6; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillAzul;
    cell.font = { bold: true, size: 8 };
    cell.border = borderAzul;
    cell.value = "";
    if (i === 3) {
      cell.value = "TOTALES";
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (i === 4) {
      cell.value = totalToneladasIngresos;
      cell.numFmt = '#,##0.000';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (i === 6) {
      cell.value = totalPagarIngresos;
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  }
  for (let i = 7; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO DESCUENTOS ────────────────────────────────────────────
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 22;
  worksheet.mergeCells(currentRow, 1, currentRow, 6);
  const descuentosTituloCell = worksheet.getCell(currentRow, 1);
  descuentosTituloCell.value = "DESCUENTOS";
  descuentosTituloCell.font = { bold: true, size: 13 };
  descuentosTituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── TC SUNAT PARA DESCUENTOS ─────────────────────────────────────
  const tcCache = {};
  const fechasUnicas = [...new Set(
    (descuentos ?? [])
      .filter((d) => d.fechaOperacionMovCaja || d.fechaMovimiento)
      .map((d) => {
        const fechaRaw = d.fechaOperacionMovCaja || d.fechaMovimiento;
        return new Date(fechaRaw).toISOString().split('T')[0];
      })
  )];
  const obtenerTCConReintento = async (fechaISO) => {
    const fecha = new Date(fechaISO + 'T00:00:00');
    for (let i = 0; i <= 7; i++) {
      const f = new Date(fecha);
      f.setDate(f.getDate() - i);
      const fISO = f.toISOString().split('T')[0];
      try {
        const resp = await consultarTipoCambioSunat({ date: fISO });
        if (resp?.sell_price) return parseFloat(resp.sell_price);
      } catch (e) {
        // continuar con el día anterior
      }
    }
    return null;
  };
  await Promise.all(
    fechasUnicas.map(async (fechaISO) => {
      const tc = await obtenerTCConReintento(fechaISO);
      if (tc) tcCache[fechaISO] = tc;
    })
  );

  // ─── HEADERS TABLA DESCUENTOS ─────────────────────────────────────
  const descuentosHeaders = ["N°", "Fecha Operacion", "Descripcion", "Monto Soles", "T/C", "Monto Dolares"];
  descuentosHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillRojo;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderRojo;
  });
  for (let i = descuentosHeaders.length + 1; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // ─── FILAS DESCUENTOS ─────────────────────────────────────────────
  const descuentosLista = descuentos ?? [];
  let totalDescuentosSoles = 0;
  let totalDescuentosDolares = 0;

  descuentosLista.forEach((desc, index) => {
    const esSoles = Number(desc.monedaId) === 1;
    const monto = Number(desc.monto || 0);
    const fechaRaw = desc.fechaOperacionMovCaja || desc.fechaMovimiento;
    const fechaISO = fechaRaw ? new Date(fechaRaw).toISOString().split('T')[0] : null;
    const tc = (fechaISO && tcCache[fechaISO]) ? tcCache[fechaISO] : 1;
    const montoSoles = esSoles ? monto : monto * tc;
    const montoDolares = esSoles ? (tc > 0 ? monto / tc : monto) : monto;
    totalDescuentosSoles += montoSoles;
    totalDescuentosDolares += montoDolares;

    const fecha = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : "-";
    const descripcion = desc.producto?.descripcionArmada || desc.descripcion || "-";

    const rowData = [index + 1, fecha, descripcion, montoSoles, tc, montoDolares];
    const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';

    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = borderThin;
      cell.font = { size: 8 };
      if (colIndex === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colIndex === 1 || colIndex === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colIndex === 3 || colIndex === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      } else if (colIndex === 4) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.00';
      }
    });
    for (let i = rowData.length + 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillNone;
      cell.border = noBorder;
      cell.value = null;
    }
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  });

  // Fila TOTALES descuentos
  for (let i = 1; i <= 6; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillRojo;
    cell.font = { bold: true, size: 8 };
    cell.border = borderRojo;
    cell.value = "";
    if (i === 3) {
      cell.value = "TOTALES";
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (i === 4) {
      cell.value = totalDescuentosSoles;
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (i === 6) {
      cell.value = totalDescuentosDolares;
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  }
  for (let i = 7; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── RESUMEN CALCULO LIQUIDACIÓN ─────────────────────────────────
  const porcentajeBase = Number(temporada.porcentajeBaseLiqPesca || 0);
  const montoLiquidacion = totalPagarIngresos * (porcentajeBase / 100);
  const saldoUS = montoLiquidacion - totalDescuentosDolares;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 22;
  worksheet.mergeCells(currentRow, 1, currentRow, 5);
  const resumenTituloCell = worksheet.getCell(currentRow, 1);
  resumenTituloCell.value = "RESUMEN CALCULO LIQUIDACION";
  resumenTituloCell.font = { bold: true, size: 13 };
  resumenTituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // Headers resumen
  const resHeaders = ["Pesca Total US$", "% Base", "Monto Liquidacion", "Descuentos US$", "Saldo US$"];
  resHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillVerde;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderVerde;
  });
  for (let i = resHeaders.length + 1; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Fila datos resumen
  const resData = [
    { val: totalPagarIngresos, fmt: '#,##0.00' },
    { val: porcentajeBase / 100, fmt: '0.00%' },
    { val: montoLiquidacion, fmt: '#,##0.00' },
    { val: totalDescuentosDolares, fmt: '#,##0.00' },
    { val: saldoUS, fmt: '#,##0.00' },
  ];
  resData.forEach(({ val, fmt }, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = val;
    cell.numFmt = fmt;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.border = borderVerde;
  });
  for (let i = resData.length + 1; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}