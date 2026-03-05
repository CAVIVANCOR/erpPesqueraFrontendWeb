// src/components/temporadaPesca/reports/generarComisionesPMMExcel.js
import ExcelJS from "exceljs";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";

export async function generarComisionesPMMExcel(data) {
  const { temporada, cuotas, descargas, patron, motorista, panguero } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Comisiones PMM");

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
  const lastCol = "J";
  let currentRow = 1;

  const noBorder = {
    top: { style: "none" },
    left: { style: "none" },
    bottom: { style: "none" },
    right: { style: "none" },
  };
  const borderCeleste = {
    top: { style: "thin", color: { argb: "FF8EC8DA" } },
    left: { style: "thin", color: { argb: "FF8EC8DA" } },
    bottom: { style: "thin", color: { argb: "FF8EC8DA" } },
    right: { style: "thin", color: { argb: "FF8EC8DA" } },
  };
  const borderThin = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };
  const fillCeleste = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFADD8E6" },
  };
  const fillAzul = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB8DCFA" },
  };
  const fillRojo = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFAC8C8" },
  };
  const fillVerde = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFBFEDCA" },
  };
  const fillAmarillo = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF2B3" },
  };
  const fillMorado = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE6CCF2" },
  };
  const fillNone = { type: "pattern", pattern: "none" };

  const borderAzul = {
    top: { style: "thin", color: { argb: "FF72A0C1" } },
    left: { style: "thin", color: { argb: "FF72A0C1" } },
    bottom: { style: "thin", color: { argb: "FF72A0C1" } },
    right: { style: "thin", color: { argb: "FF72A0C1" } },
  };
  const borderRojo = {
    top: { style: "thin", color: { argb: "FFC87878" } },
    left: { style: "thin", color: { argb: "FFC87878" } },
    bottom: { style: "thin", color: { argb: "FFC87878" } },
    right: { style: "thin", color: { argb: "FFC87878" } },
  };
  const borderVerde = {
    top: { style: "thin", color: { argb: "FF78B87A" } },
    left: { style: "thin", color: { argb: "FF78B87A" } },
    bottom: { style: "thin", color: { argb: "FF78B87A" } },
    right: { style: "thin", color: { argb: "FF78B87A" } },
  };
  const borderAmarillo = {
    top: { style: "thin", color: { argb: "FFD4B800" } },
    left: { style: "thin", color: { argb: "FFD4B800" } },
    bottom: { style: "thin", color: { argb: "FFD4B800" } },
    right: { style: "thin", color: { argb: "FFD4B800" } },
  };
  const borderMorado = {
    top: { style: "thin", color: { argb: "FFA366C7" } },
    left: { style: "thin", color: { argb: "FFA366C7" } },
    bottom: { style: "thin", color: { argb: "FFA366C7" } },
    right: { style: "thin", color: { argb: "FFA366C7" } },
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
  empresaCell.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const rucCell = worksheet.getCell(`A${currentRow}`);
  rucCell.value = `RUC: ${temporada.empresa?.ruc || "-"}`;
  rucCell.font = { size: 10 };
  rucCell.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(currentRow).height = 16;
  currentRow++;

  if (temporada.empresa?.direccion) {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const dirCell = worksheet.getCell(`A${currentRow}`);
    dirCell.value = `Dirección: ${temporada.empresa.direccion}`;
    dirCell.font = { size: 10 };
    dirCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  }

  currentRow++;

  // ─── TÍTULO ───────────────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "REPORTE DE COMISIONES PESCA INDUSTRIAL";
  tituloCell.font = { bold: true, size: 12 };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  tituloCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const subtituloCell = worksheet.getCell(`A${currentRow}`);
  subtituloCell.value = "PATRON - MOTORISTA - PANGUERO";
  subtituloCell.font = { bold: true, size: 11 };
  subtituloCell.alignment = { horizontal: "center", vertical: "middle" };
  subtituloCell.border = noBorder;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const nombreCell = worksheet.getCell(`A${currentRow}`);
  nombreCell.value = temporada.nombre || "TEMPORADA";
  nombreCell.font = { bold: true, size: 16 };
  nombreCell.alignment = { horizontal: "center", vertical: "middle" };
  nombreCell.border = noBorder;
  worksheet.getRow(currentRow).height = 26;
  currentRow++;

  currentRow++;

  // ─── TABLA CUOTAS ─────────────────────────────────────────────────
  const cuotaHeadersData = [
    "N°",
    "Zona",
    "Tipo Cuota",
    "Nombre",
    "Estado Op.",
    "Precio/Ton",
    "PMCE (%)",
  ];
  cuotaHeadersData.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderCeleste;
  });
  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const limiteTonHeader = worksheet.getCell(currentRow, 8);
  limiteTonHeader.value = "Limite Ton.";
  limiteTonHeader.font = { bold: true, size: 8 };
  limiteTonHeader.fill = fillCeleste;
  limiteTonHeader.alignment = { horizontal: "center", vertical: "middle" };
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
      porcentaje,
    ];
    const bgColor = index % 2 === 0 ? "FFF0F6F8" : "FFFFFFFF";
    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      cell.border = borderThin;
      cell.font = { size: 8 };
      if (
        colIndex === 0 ||
        colIndex === 1 ||
        colIndex === 2 ||
        colIndex === 4
      ) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colIndex === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (colIndex === 5) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0.00";
      } else if (colIndex === 6) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "0.000000";
      }
    });
    worksheet.mergeCells(currentRow, 8, currentRow, 10);
    const limiteTonCell = worksheet.getCell(currentRow, 8);
    limiteTonCell.value = limiteTon;
    limiteTonCell.numFmt = "#,##0.000";
    limiteTonCell.font = { size: 8 };
    limiteTonCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bgColor },
    };
    limiteTonCell.alignment = { horizontal: "right", vertical: "middle" };
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
    if (i === 7) cell.alignment = { horizontal: "center", vertical: "middle" };
  }
  worksheet.mergeCells(currentRow, 8, currentRow, 10);
  const totalCuotaCell = worksheet.getCell(currentRow, 8);
  totalCuotaCell.value = totalCalculado;
  totalCuotaCell.numFmt = "#,##0.000";
  totalCuotaCell.font = { bold: true, size: 8 };
  totalCuotaCell.fill = fillCeleste;
  totalCuotaCell.alignment = { horizontal: "right", vertical: "middle" };
  totalCuotaCell.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // ─── CUADRO RESUMEN ───────────────────────────────────────────────
  const avanceTotal = (descargas ?? []).reduce(
    (sum, d) => sum + Number(d.toneladas || 0),
    0,
  );
  const saldoTotal = totalCalculado - avanceTotal;
  const porcentajeAvanzado =
    totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;

  const porcentajeBaseLiq = Number(temporada.porcentajeBaseLiqPesca || 0);
  const precioPorTonTemporada = Number(temporada.precioPorTonDolares || 0);
  const montoBaseCalculo = (avanceTotal * precioPorTonTemporada) * (porcentajeBaseLiq / 100);

  const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado", "Base Calculo (%)", "Monto Base Calculo US$"];
  resumenHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.fill = fillCeleste;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderCeleste;
  });
  for (let i = 6; i <= TOTAL_COLS; i++) {
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
    { val: porcentajeAvanzado / 100, fmt: "0.00%" },
    { val: porcentajeBaseLiq / 100, fmt: "0.00%" },
    { val: montoBaseCalculo, fmt: "#,##0.00" },
  ];
  resumenData.forEach(({ val, fmt }, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = val;
    cell.numFmt = fmt;
    cell.font = { size: 9 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderThin;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
  });
  for (let i = 6; i <= TOTAL_COLS; i++) {
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

  // ─── HELPER: Generar sección de rol ──────────────────────────────
  const generarSeccionRol = async (
    rolNombre,
    rolData,
    colorHeader,
    colorBorder,
  ) => {
    const personal = rolData.personal;
    const descuentos = rolData.descuentos || [];

    // Título de la sección
    limpiarFila(currentRow);
    worksheet.getRow(currentRow).height = 22;
    worksheet.mergeCells(currentRow, 1, currentRow, 6);
    const tituloRolCell = worksheet.getCell(currentRow, 1);
    const nombreCompleto = `${personal.nombres || ""} ${personal.apellidos || ""}`.trim();
    tituloRolCell.value = `COMISION ${rolNombre.toUpperCase()} (${nombreCompleto})`;
    tituloRolCell.font = { bold: true, size: 13 };
    tituloRolCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow++;

    limpiarFila(currentRow);
    worksheet.getRow(currentRow).height = 6;
    currentRow++;


    // INGRESOS
    limpiarFila(currentRow);
    const ingresosCell = worksheet.getCell(currentRow, 1);
    ingresosCell.value = `INGRESOS ${rolNombre}`;
    ingresosCell.font = { bold: true, size: 10 };
    ingresosCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    limpiarFila(currentRow);
    worksheet.getRow(currentRow).height = 4;
    currentRow++;

    // Calcular ingresos según el rol
    const precioPorTon = Number(temporada.precioPorTonDolares || 0);
    const totalToneladas = (descargas ?? []).reduce(
      (sum, d) => sum + Number(d.toneladas || 0),
      0,
    );
    const totalPesca = totalToneladas * precioPorTon;
    const porcentajeBase = Number(temporada.porcentajeBaseLiqPesca || 0);
    const baseLiquidacion = totalPesca * (porcentajeBase / 100);

    let montoComision = 0;
    let montoComisionMotorista = 0;
    let detalleCalculo = "";

    // Calcular comisión Motorista primero (necesario para Panguero)
    const cantPersonal = Number(temporada.cantPersonalCalcComisionMotorista || 0);
    const cantDivisoria = Number(temporada.cantDivisoriaCalcComisionMotorista || 0);
    if (cantDivisoria > 0) {
      montoComisionMotorista = baseLiquidacion / cantPersonal / cantDivisoria;
    }

    if (rolNombre === "PATRON") {
      const porcentajePatron = Number(temporada.porcentajeComisionPatron || 0);
      montoComision = baseLiquidacion * (porcentajePatron / 100);
      detalleCalculo = `Base Liquidación: ${baseLiquidacion.toLocaleString("es-PE", { minimumFractionDigits: 2 })} x ${porcentajePatron.toFixed(2)}%`;
    } else if (rolNombre === "MOTORISTA") {
      montoComision = montoComisionMotorista;
      detalleCalculo = `(Base Liq. / ${cantPersonal}) / ${cantDivisoria}`;
    } else if (rolNombre === "PANGUERO") {
      if (cantDivisoria > 0) {
        montoComision = montoComisionMotorista / cantDivisoria;
      }
      detalleCalculo = `(Comision Motorista / ${cantDivisoria})`;
    }

    // Tabla de ingresos - PATRON y MOTORISTA tienen tablas extendidas
    if (rolNombre === "PATRON") {
      // Obtener TC de la fecha fin de temporada
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const porcentajePatron = Number(temporada.porcentajeComisionPatron || 0);
      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingHeadersPatron = [
        "Fecha",
        "Concepto",
        "Monto S/",
        "T/C",
        "% Comisión",
        "Monto US$",
      ];
      ingHeadersPatron.forEach((header, i) => {
        const cell = worksheet.getCell(currentRow, i + 1);
        cell.value = header;
        cell.font = { bold: true, size: 8 };
        cell.fill = colorHeader;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = colorBorder;
      });
      for (let i = ingHeadersPatron.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // Fila de datos Patrón
      const rowDataPatron = [
        fechaFin,
        "COMISION",
        montoSoles,
        tcFechaFin,
        porcentajePatron / 100,
        montoComision,
      ];
      rowDataPatron.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.font = { size: 8 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
        cell.border = borderThin;
        if (colIndex === 0 || colIndex === 1) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colIndex === 2 || colIndex === 5) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0.00";
        } else if (colIndex === 3) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "0.00";
        } else if (colIndex === 4) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "0.00%";
        }
      });
      for (let i = rowDataPatron.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 16;
      currentRow++;
    } else if (rolNombre === "MOTORISTA") {
      // Obtener TC de la fecha fin de temporada
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const cantPersonal = Number(temporada.cantPersonalCalcComisionMotorista || 0);
      const cantDivisoria = Number(temporada.cantDivisoriaCalcComisionMotorista || 0);
      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingHeadersMotorista = [
        "Fecha",
        "Concepto",
        "Monto S/",
        "T/C",
        "Cant Personal/Divisoria",
        "Cant Divisoria",
        "Monto US$",
      ];
      ingHeadersMotorista.forEach((header, i) => {
        const cell = worksheet.getCell(currentRow, i + 1);
        cell.value = header;
        cell.font = { bold: true, size: 8 };
        cell.fill = colorHeader;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = colorBorder;
      });
      for (let i = ingHeadersMotorista.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // Fila de datos Motorista
      const rowDataMotorista = [
        fechaFin,
        "COMISION",
        montoSoles,
        tcFechaFin,
        cantPersonal,
        cantDivisoria,
        montoComision,
      ];
      rowDataMotorista.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.font = { size: 8 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
        cell.border = borderThin;
        if (colIndex === 0 || colIndex === 1) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colIndex === 2 || colIndex === 6) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0.00";
        } else if (colIndex === 3) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "0.00";
        } else if (colIndex === 4 || colIndex === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
      for (let i = rowDataMotorista.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 16;
      currentRow++;
    } else {
      // Tabla extendida para PANGUERO
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingHeadersPanguero = [
        "Fecha",
        "Concepto",
        "Monto S/",
        "T/C",
        "Cant Divisoria",
        "Monto US$",
      ];
      ingHeadersPanguero.forEach((header, i) => {
        const cell = worksheet.getCell(currentRow, i + 1);
        cell.value = header;
        cell.font = { bold: true, size: 8 };
        cell.fill = colorHeader;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = colorBorder;
      });
      for (let i = ingHeadersPanguero.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // Fila de datos Panguero
      const rowDataPanguero = [
        fechaFin,
        "COMISION",
        montoSoles,
        tcFechaFin,
        cantDivisoria,
        montoComision,
      ];
      rowDataPanguero.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.font = { size: 8 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
        cell.border = borderThin;
        if (colIndex === 0 || colIndex === 1) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colIndex === 2 || colIndex === 5) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0.00";
        } else if (colIndex === 3) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "0.00";
        } else if (colIndex === 4) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
      for (let i = rowDataPanguero.length + 1; i <= TOTAL_COLS; i++) {
        const cell = worksheet.getCell(currentRow, i);
        cell.fill = fillNone;
        cell.border = noBorder;
        cell.value = null;
      }
      worksheet.getRow(currentRow).height = 16;
      currentRow++;
    }

    // EGRESOS
    limpiarFila(currentRow);
    const egresosCell = worksheet.getCell(currentRow, 1);
    egresosCell.value = "EGRESOS (ADELANTOS)";
    egresosCell.font = { bold: true, size: 10 };
    egresosCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    limpiarFila(currentRow);
    worksheet.getRow(currentRow).height = 4;
    currentRow++;

    // Pre-cargar tipos de cambio
    const tcCache = {};
    const fechasUnicas = [
      ...new Set(
        descuentos
          .filter((d) => d.fechaOperacionMovCaja || d.fechaMovimiento)
          .map((d) => {
            const fechaRaw = d.fechaOperacionMovCaja || d.fechaMovimiento;
            return new Date(fechaRaw).toISOString().split("T")[0];
          }),
      ),
    ];

    const obtenerTCConReintento = async (fechaISO) => {
      const fecha = new Date(fechaISO + "T00:00:00");
      for (let i = 0; i <= 7; i++) {
        const f = new Date(fecha);
        f.setDate(f.getDate() - i);
        const fISO = f.toISOString().split("T")[0];
        try {
          const resp = await consultarTipoCambioSunat({ date: fISO });
          if (resp?.sell_price) return parseFloat(resp.sell_price);
        } catch (e) {
          // continuar
        }
      }
      return null;
    };

    await Promise.all(
      fechasUnicas.map(async (fechaISO) => {
        const tc = await obtenerTCConReintento(fechaISO);
        if (tc) tcCache[fechaISO] = tc;
      }),
    );

    // Tabla de egresos
    const egrHeaders = [
      "N°",
      "Fecha",
      "Descripción",
      "Monto S/",
      "T/C",
      "Monto US$",
    ];
    egrHeaders.forEach((header, i) => {
      const cell = worksheet.getCell(currentRow, i + 1);
      cell.value = header;
      cell.font = { bold: true, size: 8 };
      cell.fill = fillBlanco;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderThin;
    });
    for (let i = egrHeaders.length + 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillNone;
      cell.border = noBorder;
      cell.value = null;
    }
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    let totalEgresosSoles = 0;
    let totalEgresosDolares = 0;

    descuentos.forEach((desc, index) => {
      const esSoles = Number(desc.monedaId) === 1;
      const monto = Number(desc.monto || 0);
      const fechaRaw = desc.fechaOperacionMovCaja || desc.fechaMovimiento;
      const fechaISO = fechaRaw
        ? new Date(fechaRaw).toISOString().split("T")[0]
        : null;
      const tc = fechaISO && tcCache[fechaISO] ? tcCache[fechaISO] : 1;
      const montoSoles = esSoles ? monto : monto * tc;
      const montoDolares = esSoles ? (tc > 0 ? monto / tc : monto) : monto;
      totalEgresosSoles += montoSoles;
      totalEgresosDolares += montoDolares;

      const fecha = fechaRaw
        ? new Date(fechaRaw).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";
      const descripcion =
        desc.producto?.descripcionArmada || desc.descripcion || "-";

      const rowData = [
        index + 1,
        fecha,
        descripcion,
        montoSoles,
        tc,
        montoDolares,
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
        cell.border = borderThin;
        cell.font = { size: 8 };
        if (colIndex === 0) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colIndex === 1 || colIndex === 2) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colIndex === 3 || colIndex === 5) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0.00";
        } else if (colIndex === 4) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "0.00";
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

    // Fila TOTALES egresos
    for (let i = 1; i <= 6; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillBlanco;
      cell.font = { bold: true, size: 8 };
      cell.border = borderThin;
      cell.value = "";
      if (i === 3) {
        cell.value = "TOTALES";
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (i === 4) {
        cell.value = totalEgresosSoles;
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (i === 6) {
        cell.value = totalEgresosDolares;
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
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
    worksheet.getRow(currentRow).height = 8;
    currentRow++;

    // RESUMEN
    const saldoFinal = montoComision - totalEgresosDolares;
    const resHeaders = ["Comisión US$", "Egresos US$", "Saldo US$"];
    resHeaders.forEach((header, i) => {
      const cell = worksheet.getCell(currentRow, i + 1);
      cell.value = header;
      cell.font = { bold: true, size: 8 };
      cell.fill = fillVerde;
      cell.alignment = { horizontal: "center", vertical: "middle" };
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

    const resData = [
      { val: montoComision, fmt: "#,##0.00" },
      { val: totalEgresosDolares, fmt: "#,##0.00" },
      { val: saldoFinal, fmt: "#,##0.00" },
    ];
    resData.forEach(({ val, fmt }, i) => {
      const cell = worksheet.getCell(currentRow, i + 1);
      cell.value = val;
      cell.numFmt = fmt;
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = borderVerde;
    });
    for (let i = resData.length + 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillNone;
      cell.border = noBorder;
      cell.value = null;
    }
    worksheet.getRow(currentRow).height = 24;
    currentRow++;

    limpiarFila(currentRow);
    worksheet.getRow(currentRow).height = 12;
    currentRow++;
  };

  // ─── SECCIÓN PATRÓN ───────────────────────────────────────────────
  await generarSeccionRol("PATRON", patron, fillAzul, borderAzul);

  // ─── SECCIÓN MOTORISTA ────────────────────────────────────────────
  await generarSeccionRol("MOTORISTA", motorista, fillAmarillo, borderAmarillo);

  // ─── SECCIÓN PANGUERO ─────────────────────────────────────────────
  await generarSeccionRol("PANGUERO", panguero, fillMorado, borderMorado);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
