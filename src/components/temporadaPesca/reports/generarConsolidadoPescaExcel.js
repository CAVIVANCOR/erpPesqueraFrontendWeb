// src/components/temporadaPesca/reports/generarConsolidadoPescaExcel.js
import ExcelJS from "exceljs";

export async function generarConsolidadoPescaExcel(data) {
  const {
    temporada,
    descargas,
    comisionesGeneradas,
    baseLiquidacionReal,
    liqComisionPatronReal,
    liqComisionMotoristaReal,
    liqComisionPangueroReal,
    liqComisionAlquilerAdicional,
    fidelizacionPersonal,
    cantPersonalCalcComisionMotorista,
    nombreEmbarcacion,
    ingresosTotalPesca,
    ingresoFidelizacion,
    ingresosPorAlquilerCuotaSur,
  } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Consolidado Pesca");

  // ENCABEZADO
  worksheet.mergeCells("A1:E1");
  worksheet.getCell("A1").value = temporada.empresa?.razonSocial || "";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:E2");
  worksheet.getCell("A2").value = "REPORTE CONSOLIDADO PESCA INDUSTRIAL";
  worksheet.getCell("A2").font = { bold: true, size: 12 };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:E3");
  worksheet.getCell("A3").value = `NOMBRE TEMPORADA: ${temporada.nombre || ""}`;
  worksheet.getCell("A3").font = { bold: true };

  worksheet.mergeCells("A4:E4");
  worksheet.getCell("A4").value = `ZONA: "${temporada.zona || ""}"`;
  worksheet.getCell("A4").font = { bold: true };

  let currentRow = 6;

  // ==================== SECCIÓN INGRESOS ====================
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "INGRESOS";
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`A${currentRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFADD8E6" },
  };
  currentRow += 2;

  // 1. TABLA VENTA
  currentRow = agregarTablaVenta(worksheet, descargas, currentRow);

  // 2. TABLA BONIFICACION
  currentRow = agregarTablaBonificacion(worksheet, comisionesGeneradas, currentRow);

  // 3. TABLA ALQUILER
  currentRow = agregarTablaAlquiler(worksheet, temporada, ingresosPorAlquilerCuotaSur, currentRow);

  // ==================== SECCIÓN EGRESOS ====================
  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "EGRESOS";
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`A${currentRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC0CB" },
  };
  currentRow += 2;

  // TABLA EGRESOS
  currentRow = agregarTablaEgresos(
    worksheet,
    {
      nombreEmbarcacion,
      cantPersonalCalcComisionMotorista,
      baseLiquidacionReal,
      liqComisionPatronReal,
      liqComisionMotoristaReal,
      liqComisionPangueroReal,
      liqComisionAlquilerAdicional,
      fidelizacionPersonal,
      temporada,
    },
    currentRow
  );

  // ==================== TOTALES FINALES ====================
  const totalIngresos = ingresosTotalPesca + ingresoFidelizacion + ingresosPorAlquilerCuotaSur;
  const totalEgresos =
    baseLiquidacionReal +
    liqComisionPatronReal +
    liqComisionMotoristaReal +
    liqComisionPangueroReal +
    (Number(temporada.cuotaAlquiladaTon || 0) * Number(temporada.precioPorTonAlquilerDolares || 0)) +
    liqComisionAlquilerAdicional +
    fidelizacionPersonal;
  const saldoFinal = totalIngresos - totalEgresos;

  currentRow += 2;
  worksheet.getCell(`C${currentRow}`).value = "Total Ingresos US$";
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getCell(`D${currentRow}`).value = totalIngresos;
  worksheet.getCell(`D${currentRow}`).numFmt = "#,##0.00";
  currentRow++;

  worksheet.getCell(`C${currentRow}`).value = "Total Egresos US$";
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getCell(`D${currentRow}`).value = totalEgresos;
  worksheet.getCell(`D${currentRow}`).numFmt = "#,##0.00";
  currentRow++;

  worksheet.getCell(`C${currentRow}`).value = "Saldo Final US$";
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getCell(`D${currentRow}`).value = saldoFinal;
  worksheet.getCell(`D${currentRow}`).numFmt = "#,##0.00";
  worksheet.getCell(`D${currentRow}`).font = { bold: true, color: { argb: "FF008000" } };

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 30 },
    { width: 35 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// ==================== FUNCIONES AUXILIARES ====================

function agregarTablaVenta(worksheet, descargas, startRow) {
  worksheet.getCell(`A${startRow}`).value = "VENTA";
  worksheet.getCell(`A${startRow}`).font = { bold: true };
  startRow += 2;

  // Headers
  const headers = ["CLIENTE", "PRODUCTO", "V.UNIT X TON", "TONELADAS", "V.VENTA TOTAL"];
  headers.forEach((header, i) => {
    const cell = worksheet.getCell(startRow, i + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });
  startRow++;

  // Agrupar descargas
  const ventasAgrupadas = {};
  descargas.forEach((descarga) => {
    const clienteNombre = descarga.cliente?.razonSocial || descarga.cliente?.nombreComercial || "SIN CLIENTE";
    const productoNombre = descarga.especie?.nombre || "SIN PRODUCTO";
    const key = `${clienteNombre}|${productoNombre}`;

    if (!ventasAgrupadas[key]) {
      ventasAgrupadas[key] = {
        cliente: clienteNombre,
        producto: productoNombre,
        toneladas: 0,
        precioPromedio: 0,
        total: 0,
        count: 0,
      };
    }

    const toneladas = Number(descarga.toneladas || 0);
    const precio = Number(descarga.precioVentaPorTonDolares || 0);
    ventasAgrupadas[key].toneladas += toneladas;
    ventasAgrupadas[key].precioPromedio += precio;
    ventasAgrupadas[key].total += toneladas * precio;
    ventasAgrupadas[key].count++;
  });

  let totalVenta = 0;
  Object.values(ventasAgrupadas).forEach((venta) => {
    const precioPromedio = venta.precioPromedio / venta.count;
    worksheet.getCell(`A${startRow}`).value = venta.cliente;
    worksheet.getCell(`B${startRow}`).value = venta.producto;
    worksheet.getCell(`C${startRow}`).value = precioPromedio;
    worksheet.getCell(`C${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`D${startRow}`).value = venta.toneladas;
    worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`E${startRow}`).value = venta.total;
    worksheet.getCell(`E${startRow}`).numFmt = "#,##0.00";
    totalVenta += venta.total;
    startRow++;
  });

  // Total
  worksheet.getCell(`D${startRow}`).value = "TOTAL";
  worksheet.getCell(`D${startRow}`).font = { bold: true };
  worksheet.getCell(`E${startRow}`).value = totalVenta;
  worksheet.getCell(`E${startRow}`).numFmt = "#,##0.00";
  worksheet.getCell(`E${startRow}`).font = { bold: true };
  startRow += 2;

  return startRow;
}

function agregarTablaBonificacion(worksheet, comisiones, startRow) {
  worksheet.getCell(`A${startRow}`).value = "BONIFICACION DE PESCA";
  worksheet.getCell(`A${startRow}`).font = { bold: true };
  startRow += 2;

  // Headers
  const headers = ["CLIENTE", "V.UNIT X TON", "TONELADAS", "V.VENTA TOTAL"];
  headers.forEach((header, i) => {
    const cell = worksheet.getCell(startRow, i + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });
  startRow++;

  // Agrupar comisiones
  const bonificacionesAgrupadas = {};
  comisiones.forEach((comision) => {
    const clienteNombre = comision.descarga?.cliente?.razonSocial || comision.descarga?.cliente?.nombreComercial || "SIN CLIENTE";

    if (!bonificacionesAgrupadas[clienteNombre]) {
      bonificacionesAgrupadas[clienteNombre] = {
        toneladas: 0,
        precioPromedio: 0,
        total: 0,
        count: 0,
      };
    }

    const toneladas = Number(comision.descarga?.toneladas || 0);
    const precio = Number(comision.descarga?.precioPorTonComisionFidelizacion || 0);
    bonificacionesAgrupadas[clienteNombre].toneladas += toneladas;
    bonificacionesAgrupadas[clienteNombre].precioPromedio += precio;
    bonificacionesAgrupadas[clienteNombre].total += toneladas * precio;
    bonificacionesAgrupadas[clienteNombre].count++;
  });

  let totalBonificacion = 0;
  Object.entries(bonificacionesAgrupadas).forEach(([cliente, bonif]) => {
    const precioPromedio = bonif.precioPromedio / bonif.count;
    worksheet.getCell(`A${startRow}`).value = cliente;
    worksheet.getCell(`B${startRow}`).value = precioPromedio;
    worksheet.getCell(`B${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`C${startRow}`).value = bonif.toneladas;
    worksheet.getCell(`C${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`D${startRow}`).value = bonif.total;
    worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
    totalBonificacion += bonif.total;
    startRow++;
  });

  // Total
  worksheet.getCell(`C${startRow}`).value = "TOTAL";
  worksheet.getCell(`C${startRow}`).font = { bold: true };
  worksheet.getCell(`D${startRow}`).value = totalBonificacion;
  worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
  worksheet.getCell(`D${startRow}`).font = { bold: true };
  startRow += 2;

  return startRow;
}

function agregarTablaAlquiler(worksheet, temporada, ingresosPorAlquilerCuotaSur, startRow) {
  const nombreCuota = temporada.zona === "NORTE" ? "CUOTA NORTE" : "CUOTA SUR";
  worksheet.getCell(`A${startRow}`).value = `ALQUILER ${nombreCuota} ${temporada.zona}`;
  worksheet.getCell(`A${startRow}`).font = { bold: true };
  startRow += 2;

  // Headers
  const headers = ["CLIENTE", "V.UNIT X TON", "TONELADAS", "V.VENTA TOTAL"];
  headers.forEach((header, i) => {
    const cell = worksheet.getCell(startRow, i + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });
  startRow++;

  // Datos
  if (ingresosPorAlquilerCuotaSur > 0) {
    const clienteNombre = temporada.entidadEmpresarialAlquilada?.razonSocial || temporada.entidadEmpresarialAlquilada?.nombreComercial || "SIN CLIENTE";
    const precioAlquiler = Number(temporada.precioPorTonAlquilerDolares || 0);
    const toneladas = Number(temporada.cuotaPropiaTon || 0);

    worksheet.getCell(`A${startRow}`).value = clienteNombre;
    worksheet.getCell(`B${startRow}`).value = precioAlquiler;
    worksheet.getCell(`B${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`C${startRow}`).value = toneladas;
    worksheet.getCell(`C${startRow}`).numFmt = "#,##0.00";
    worksheet.getCell(`D${startRow}`).value = ingresosPorAlquilerCuotaSur;
    worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
    startRow++;
  } else {
    worksheet.getCell(`D${startRow}`).value = 0;
    worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
    startRow++;
  }

  // Total
  worksheet.getCell(`C${startRow}`).value = "TOTAL";
  worksheet.getCell(`C${startRow}`).font = { bold: true };
  worksheet.getCell(`D${startRow}`).value = ingresosPorAlquilerCuotaSur;
  worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
  worksheet.getCell(`D${startRow}`).font = { bold: true };
  startRow += 2;

  return startRow;
}

function agregarTablaEgresos(worksheet, datos, startRow) {
  const {
    nombreEmbarcacion,
    cantPersonalCalcComisionMotorista,
    baseLiquidacionReal,
    liqComisionPatronReal,
    liqComisionMotoristaReal,
    liqComisionPangueroReal,
    liqComisionAlquilerAdicional,
    fidelizacionPersonal,
    temporada,
  } = datos;

  // Headers
  const headers = ["EMBARCACIÓN", "CONCEPTO", "DESCRIPCIÓN", "IMPORTE US$"];
  headers.forEach((header, i) => {
    const cell = worksheet.getCell(startRow, i + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });
  startRow++;

  // Filas de egresos
  const egresos = [
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "LIQUIDACION TRIPULANTES",
      descripcion: `${cantPersonalCalcComisionMotorista || 0} TRIPULANTES`,
      importe: baseLiquidacionReal,
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "COMISION PATRON",
      descripcion: "NOMBRE PATRON",
      importe: liqComisionPatronReal,
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "COMISION MOTORISTA",
      descripcion: "NOMBRE MOTORISTA",
      importe: liqComisionMotoristaReal,
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "COMISION PANGUERO",
      descripcion: "NOMBRE PANGUERO",
      importe: liqComisionPangueroReal,
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "ALQUILER CUOTA",
      descripcion: temporada.entidadEmpresarialAlquilada?.razonSocial || "NOMBRE BENEFICIARIO",
      importe: Number(temporada.cuotaAlquiladaTon || 0) * Number(temporada.precioPorTonAlquilerDolares || 0),
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "COMISION ALQUILER CUOTA",
      descripcion: temporada.entidadComercialComisionistaAlquilerObj?.razonSocial || "NOMBRE BENEFICIARIO",
      importe: liqComisionAlquilerAdicional,
    },
    {
      embarcacion: nombreEmbarcacion || "SIN EMBARCACION",
      concepto: "DISTRIBUCION BONIFICACION DE PESCA",
      descripcion: "AL PERSONAL",
      importe: fidelizacionPersonal,
    },
  ];

  let totalEgresos = 0;
  egresos.forEach((egreso) => {
    worksheet.getCell(`A${startRow}`).value = egreso.embarcacion;
    worksheet.getCell(`B${startRow}`).value = egreso.concepto;
    worksheet.getCell(`C${startRow}`).value = egreso.descripcion;
    worksheet.getCell(`D${startRow}`).value = egreso.importe;
    worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
    totalEgresos += egreso.importe;
    startRow++;
  });

  // Total
  worksheet.getCell(`C${startRow}`).value = "TOTAL";
  worksheet.getCell(`C${startRow}`).font = { bold: true };
  worksheet.getCell(`D${startRow}`).value = totalEgresos;
  worksheet.getCell(`D${startRow}`).numFmt = "#,##0.00";
  worksheet.getCell(`D${startRow}`).font = { bold: true };
  startRow += 2;

  return startRow;
}