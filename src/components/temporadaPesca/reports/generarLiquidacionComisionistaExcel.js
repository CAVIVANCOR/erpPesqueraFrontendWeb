// src/components/temporadaPesca/reports/generarLiquidacionComisionistaExcel.js
import ExcelJS from 'exceljs';
import { consultarTipoCambioSunat } from '../../../api/consultaExterna';
import { formatearNumero } from '../../../utils/utils';

export async function generarLiquidacionComisionistaExcel(data) {
  const { temporada, cuotas, descargas, movimientos } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Liquidacion Comisionista');

  worksheet.views = [{ showGridLines: false }];

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 25;
  worksheet.getColumn(5).width = 16;
  worksheet.getColumn(6).width = 14;
  worksheet.getColumn(7).width = 12;
  worksheet.getColumn(8).width = 12;
  worksheet.getColumn(9).width = 12;
  worksheet.getColumn(10).width = 14;

  const TOTAL_COLS = 10;
  const lastCol = 'J';
  let currentRow = 1;

  const noBorder = {
    top: { style: 'none' }, left: { style: 'none' },
    bottom: { style: 'none' }, right: { style: 'none' }
  };
  const borderCeleste = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } }
  };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
  const fillCeleste = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } };
  const fillAzulMuyClaro = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAFF' } };
  const fillRojoMuyClaro = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD9D9' } };
  const fillVerdeMuyClaro = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9FFD9' } };
  const fillAmarillo = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  const fillNone = { type: 'pattern', pattern: 'none' };

  // Obtener tipo de cambio
  let tipoCambio = 3.8;
  try {
    const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin) : new Date();
    const tcData = await consultarTipoCambioSunat(fechaFin);
    if (tcData?.venta) {
      tipoCambio = Number(tcData.venta);
    }
  } catch (e) {
    console.warn("No se pudo obtener tipo de cambio, usando 3.8:", e);
  }

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

  // ─── TÍTULO PRINCIPAL ─────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloPrincipalCell = worksheet.getCell(`A${currentRow}`);
  tituloPrincipalCell.value = "LIQUIDACION ALQUILER COMISIONISTA";
  tituloPrincipalCell.font = { bold: true, size: 12 };
  tituloPrincipalCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloPrincipalCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // ─── SUBTÍTULO PRINCIPAL: Entidad Comercial Comisionista Alquiler ───────────
  const subtituloPrincipal = temporada.entidadComercialComisionistaAlq?.razonSocial || "";
  if (subtituloPrincipal) {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const subtituloPrincipalCell = worksheet.getCell(`A${currentRow}`);
    subtituloPrincipalCell.value = subtituloPrincipal;
    subtituloPrincipalCell.font = { bold: true, size: 14 };
    subtituloPrincipalCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtituloPrincipalCell.border = noBorder;
    worksheet.getRow(currentRow).height = 22;
    currentRow++;
  }

  // ─── TÍTULO ───────────────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = `LIQUIDACION N° ${temporada.id} ${temporada.nombre || ""}`;
  tituloCell.font = { bold: true, size: 12 };
  tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  currentRow++;

  // ─── TABLA CUOTAS ─────────────────────────────────────────────────
  const cuotaHeadersData = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Comisión/Ton", "PMCE (%)"];
  cuotaHeadersData.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 9 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const limiteTonHeader = worksheet.getCell(currentRow, 8);
  limiteTonHeader.value = "Limite Ton.";
  limiteTonHeader.font = { bold: true, size: 9 };
  limiteTonHeader.fill = fillCeleste;
  limiteTonHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  limiteTonHeader.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  let totalLimiteTon = 0;

  cuotas.forEach((cuota, idx) => {
    const limiteTon = Number(cuota.porcentajeCuota || 0) * Number(temporada.limiteMaximoCapturaTn || 0) / 100;
    totalLimiteTon += limiteTon;

    const rowData = [
      idx + 1,
      cuota.zona || "-",
      "ALQUILADA",
      cuota.nombre || "-",
      cuota.esAlquiler ? "ALQUILER" : "PESCA",
      Number(temporada.precioPorTonComisionAlquilerDolares || 0),
      Number(cuota.porcentajeCuota || 0),
    ];

    rowData.forEach((val, i) => {
      const cell = worksheet.getCell(currentRow, i + 1);
      cell.value = val;
      cell.font = { size: 7 };
      cell.fill = fillNone;
      cell.alignment = { 
        horizontal: i === 5 || i === 6 ? 'right' : i === 0 || i === 1 ? 'center' : 'left', 
        vertical: 'middle' 
      };
      cell.border = borderThin;
      if (i === 5) {
        cell.numFmt = '"$"#,##0.00';
      } else if (i === 6) {
        cell.numFmt = '0.0000"%"';
      }
    });

    worksheet.mergeCells(currentRow, 8, currentRow, 10);
    const limiteTonCell = worksheet.getCell(currentRow, 8);
    limiteTonCell.value = limiteTon;
    limiteTonCell.font = { size: 7 };
    limiteTonCell.fill = fillNone;
    limiteTonCell.alignment = { horizontal: 'right', vertical: 'middle' };
    limiteTonCell.border = borderThin;
    limiteTonCell.numFmt = '#,##0.000" Ton."';
    worksheet.getRow(currentRow).height = 18;
    currentRow++;
  });

  // Total
  worksheet.mergeCells(currentRow, 1, currentRow, 7);
  const totalLabelCell = worksheet.getCell(currentRow, 1);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.font = { bold: true, size: 9 };
  totalLabelCell.fill = fillCeleste;
  totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  totalLabelCell.border = borderCeleste;

  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const totalTonCell = worksheet.getCell(currentRow, 8);
  totalTonCell.value = totalLimiteTon;
  totalTonCell.font = { bold: true, size: 9 };
  totalTonCell.fill = fillCeleste;
  totalTonCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalTonCell.border = borderCeleste;
  totalTonCell.numFmt = '#,##0.000" Ton."';
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  currentRow += 2;

  // ─── INGRESOS PESCA ───────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloIngresosCell = worksheet.getCell(`A${currentRow}`);
  tituloIngresosCell.value = "INGRESOS PESCA";
  tituloIngresosCell.font = { bold: true, size: 11 };
  tituloIngresosCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloIngresosCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Encontrar especie con mayor tonelaje
  let especieMayorTonelaje = "ANCHOVETA";
  if (descargas && descargas.length > 0) {
    const especieTotales = {};
    descargas.forEach((d) => {
      const especie = d.especie?.nombre || "Sin especie";
      const toneladas = Number(d.pesoTotalDescargaTn || 0);
      especieTotales[especie] = (especieTotales[especie] || 0) + toneladas;
    });
    let mayorTonelaje = 0;
    Object.entries(especieTotales).forEach(([especie, total]) => {
      if (total > mayorTonelaje) {
        mayorTonelaje = total;
        especieMayorTonelaje = especie;
      }
    });
  }

  // Headers INGRESOS
  const ingresosHeaders = ["FECHA", "ESPECIE", "TM", "PRECIO", "TOTAL"];
  ingresosHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 9 };
    cell.fill = fillAzulMuyClaro;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Datos INGRESOS
  const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin).toLocaleDateString("es-PE") : "-";
  const precioTon = Number(temporada.precioPorTonComisionAlquilerDolares || 0);
  const totalPesca = totalLimiteTon * precioTon;

  const ingresosData = [fechaFin, especieMayorTonelaje, totalLimiteTon, precioTon, totalPesca];
  ingresosData.forEach((val, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = val;
    cell.font = { size: 7 };
    cell.fill = fillNone;
    cell.alignment = { horizontal: i === 2 || i === 3 || i === 4 ? 'right' : 'center', vertical: 'middle' };
    cell.border = borderThin;
    if (i === 2) {
      cell.numFmt = '#,##0.000';
    } else if (i === 3 || i === 4) {
      cell.numFmt = '"$"#,##0.00';
    }
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Total PESCA
  worksheet.mergeCells(currentRow, 1, currentRow, 2);
  const totalPescaLabelCell = worksheet.getCell(currentRow, 1);
  totalPescaLabelCell.value = "TOTAL";
  totalPescaLabelCell.font = { bold: true, size: 9 };
  totalPescaLabelCell.fill = fillAzulMuyClaro;
  totalPescaLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  totalPescaLabelCell.border = borderCeleste;

  const totalTMCell = worksheet.getCell(currentRow, 3);
  totalTMCell.value = totalLimiteTon;
  totalTMCell.font = { bold: true, size: 9 };
  totalTMCell.fill = fillAzulMuyClaro;
  totalTMCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalTMCell.border = borderCeleste;
  totalTMCell.numFmt = '#,##0.000';

  const totalPescaCell = worksheet.getCell(currentRow, 5);
  totalPescaCell.value = totalPesca;
  totalPescaCell.font = { bold: true, size: 9 };
  totalPescaCell.fill = fillAzulMuyClaro;
  totalPescaCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalPescaCell.border = borderCeleste;
  totalPescaCell.numFmt = '"$"#,##0.00';
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  currentRow += 2;

  // ─── EGRESOS ADELANTOS ────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloAdelantosCell = worksheet.getCell(`A${currentRow}`);
  tituloAdelantosCell.value = "EGRESOS ADELANTOS";
  tituloAdelantosCell.font = { bold: true, size: 11 };
  tituloAdelantosCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloAdelantosCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Headers ADELANTOS
  const adelantosHeaders = ["N°", "Fecha Op.", "Descripción", "Monto Soles", "T/C", "Monto Dólares"];
  adelantosHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 9 };
    cell.fill = fillRojoMuyClaro;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  let totalSoles = 0;
  let totalDolares = 0;

  movimientos.forEach((mov, idx) => {
    const monedaId = Number(mov.monedaId);
    const monto = Number(mov.monto || 0);
    const tc = Number(mov.tipoCambio || tipoCambio);
    
    let montoSoles = 0;
    let montoDolares = 0;
    
    if (monedaId === 1) {
      montoSoles = monto;
      montoDolares = monto / tc;
    } else {
      montoDolares = monto;
      montoSoles = monto * tc;
    }
    
    totalSoles += montoSoles;
    totalDolares += montoDolares;

    const fechaOp = mov.fechaOperacionMovCaja ? new Date(mov.fechaOperacionMovCaja).toLocaleDateString("es-PE") : "-";
    const descripcion = mov.producto?.descripcionArmada || "-";

    const adelantoData = [idx + 1, fechaOp, descripcion, montoSoles, tc, montoDolares];
    adelantoData.forEach((val, i) => {
      const cell = worksheet.getCell(currentRow, i + 1);
      cell.value = val;
      cell.font = { size: 7 };
      cell.fill = fillNone;
      cell.alignment = { 
        horizontal: i === 3 || i === 4 || i === 5 ? 'right' : i === 0 || i === 1 ? 'center' : 'left', 
        vertical: 'middle' 
      };
      cell.border = borderThin;
      if (i === 3 || i === 5) {
        cell.numFmt = '#,##0.00';
      } else if (i === 4) {
        cell.numFmt = '0.000';
      }
    });
    worksheet.getRow(currentRow).height = 17;
    currentRow++;
  });

  // Total ADELANTOS
  worksheet.mergeCells(currentRow, 1, currentRow, 3);
  const totalAdelantosLabelCell = worksheet.getCell(currentRow, 1);
  totalAdelantosLabelCell.value = "TOTAL";
  totalAdelantosLabelCell.font = { bold: true, size: 9 };
  totalAdelantosLabelCell.fill = fillRojoMuyClaro;
  totalAdelantosLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  totalAdelantosLabelCell.border = borderCeleste;

  const totalSolesCell = worksheet.getCell(currentRow, 4);
  totalSolesCell.value = totalSoles;
  totalSolesCell.font = { bold: true, size: 9 };
  totalSolesCell.fill = fillRojoMuyClaro;
  totalSolesCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalSolesCell.border = borderCeleste;
  totalSolesCell.numFmt = '#,##0.00';

  const totalDolaresCell = worksheet.getCell(currentRow, 6);
  totalDolaresCell.value = totalDolares;
  totalDolaresCell.font = { bold: true, size: 9 };
  totalDolaresCell.fill = fillRojoMuyClaro;
  totalDolaresCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalDolaresCell.border = borderCeleste;
  totalDolaresCell.numFmt = '#,##0.00';
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  currentRow += 2;

  // ─── RESUMEN ──────────────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloResumenCell = worksheet.getCell(`A${currentRow}`);
  tituloResumenCell.value = "RESUMEN";
  tituloResumenCell.font = { bold: true, size: 11 };
  tituloResumenCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloResumenCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Headers RESUMEN (3 columnas)
  const resumenHeaders = ["Liquidación Total US$", "Total Adelantos", "Total a Pagar US$"];
  resumenHeaders.forEach((header, i) => {
    const startCol = i * 2 + 1;
    worksheet.mergeCells(currentRow, startCol, currentRow, startCol + 1);
    const cell = worksheet.getCell(currentRow, startCol);
    cell.value = header;
    cell.font = { bold: true, size: 9 };
    cell.fill = fillVerdeMuyClaro;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Datos RESUMEN
  const totalAPagar = totalPesca - totalDolares;
  const resumenData = [totalPesca, totalDolares, totalAPagar];
  resumenData.forEach((val, i) => {
    const startCol = i * 2 + 1;
    worksheet.mergeCells(currentRow, startCol, currentRow, startCol + 1);
    const cell = worksheet.getCell(currentRow, startCol);
    cell.value = val;
    cell.font = { bold: true, size: 9 };
    cell.fill = fillNone;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
    cell.numFmt = '"$"#,##0.00';
  });
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  currentRow += 2;

  // ─── FIRMAS ───────────────────────────────────────────────────────
  worksheet.mergeCells(currentRow, 1, currentRow, 3);
  const voBoCell = worksheet.getCell(currentRow, 1);
  voBoCell.value = "Vº Bº";
  voBoCell.font = { size: 10 };
  voBoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  voBoCell.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };

  worksheet.mergeCells(currentRow, 5, currentRow, 7);
  const recibiCell = worksheet.getCell(currentRow, 5);
  recibiCell.value = "RECIBÍ CONFORME";
  recibiCell.font = { size: 10 };
  recibiCell.alignment = { horizontal: 'center', vertical: 'middle' };
  recibiCell.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  // Razón Social debajo de RECIBÍ CONFORME
  const razonSocialFirma = temporada.entidadComercialComisionistaAlq?.razonSocial || "";
  if (razonSocialFirma) {
    worksheet.mergeCells(currentRow, 5, currentRow, 7);
    const razonSocialCell = worksheet.getCell(currentRow, 5);
    razonSocialCell.value = razonSocialFirma;
    razonSocialCell.font = { bold: true, size: 10 };
    razonSocialCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}