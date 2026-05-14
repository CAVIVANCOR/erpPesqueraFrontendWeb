// src/components/movimientoActivoFijo/reports/generarMovimientosActivoFijoExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Movimientos de Activo Fijo
 * Incluye todos los campos: empresa, activo, tipo movimiento, fechas, montos, etc.
 * @param {Object} data - Datos de los movimientos
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarMovimientosActivoFijoExcel(data) {
  const { movimientos, fechaGeneracion } = data;

  // Ordenar movimientos por fecha descendente
  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    return new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento);
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Movimientos");

  // Desactivar líneas de cuadrícula
  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE MOVIMIENTOS DE ACTIVO FIJO";
  tituloCell.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  currentRow++;

  // ⭐ FECHA DE GENERACIÓN
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const fechaCell = worksheet.getCell(`A${currentRow}`);
  fechaCell.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
  fechaCell.font = { size: 10, color: { argb: "FF666666" } };
  fechaCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  currentRow++; // Línea en blanco

  // ⭐ ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  const headers = [
    "N°",
    "Empresa",
    "Fecha Movimiento",
    "Activo",
    "Tipo Movimiento",
    "Moneda",
    "Monto",
    "Dep. Mensual",
    "Dep. Acumulada",
    "Valor Neto",
    "Período",
    "Fecha Contable",
    "Centro Costo",
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFADD8E6" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });
  currentRow++;

  // ⭐ ANCHOS DE COLUMNAS
  worksheet.columns = [
    { width: 6 }, // N°
    { width: 25 }, // Empresa
    { width: 15 }, // Fecha Movimiento
    { width: 25 }, // Activo
    { width: 20 }, // Tipo Movimiento
    { width: 10 }, // Moneda
    { width: 15 }, // Monto
    { width: 15 }, // Dep. Mensual
    { width: 15 }, // Dep. Acumulada
    { width: 15 }, // Valor Neto
    { width: 15 }, // Período
    { width: 15 }, // Fecha Contable
    { width: 25 }, // Centro Costo
  ];

  // ⭐ FUNCIÓN PARA FORMATEAR MONEDA
  function formatearMoneda(valor, moneda = "PEN") {
    if (!valor) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(valor);
  }

  // ⭐ FUNCIÓN PARA FORMATEAR FECHA
  function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE");
  }

  // ⭐ DATOS DE LA TABLA
  movimientosOrdenados.forEach((mov, index) => {
    const dataRow = worksheet.getRow(currentRow);

    // Valores de la fila
    dataRow.values = [
      index + 1,
      mov.empresa?.razonSocial || "N/A",
      formatearFecha(mov.fechaMovimiento),
      mov.activo?.nombre || "N/A",
      mov.tipoMovimiento?.nombre || "N/A",
      mov.moneda?.codigoSunat || "-",
      mov.monto
        ? formatearMoneda(mov.monto, mov.moneda?.codigoSunat || "PEN")
        : "-",
      mov.depreciacionMensual
        ? formatearMoneda(
            mov.depreciacionMensual,
            mov.moneda?.codigoSunat || "PEN"
          )
        : "-",
      mov.depreciacionAcumulada
        ? formatearMoneda(
            mov.depreciacionAcumulada,
            mov.moneda?.codigoSunat || "PEN"
          )
        : "-",
      mov.valorNeto
        ? formatearMoneda(mov.valorNeto, mov.moneda?.codigoSunat || "PEN")
        : "-",
      mov.periodoContable?.nombrePeriodo || "-",
      formatearFecha(mov.fechaContable),
      mov.centroCosto
        ? `${mov.centroCosto.codigo || ""} ${mov.centroCosto.Nombre || ""}`
        : "-",
    ];

    // Estilos de la fila
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Bordes
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };

      // Alineación
      if (colNumber === 1) {
        // N° centrado
        cell.alignment = { horizontal: "center", vertical: "top" };
      } else if (colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 13) {
        // Empresa, Activo, Tipo Movimiento, Centro Costo - izquierda con wrap
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      } else if (colNumber === 6) {
        // Moneda centrada
        cell.alignment = { horizontal: "center", vertical: "top" };
      } else {
        // Resto izquierda
        cell.alignment = { horizontal: "left", vertical: "top" };
      }

      // Fondo alternado
      if (index % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }

      // Fuente
      cell.font = { size: 10 };
    });

    currentRow++;
  });

  // ⭐ FILA DE RESUMEN
  currentRow++; // Línea en blanco
  const resumenRow = worksheet.getRow(currentRow);
  resumenRow.getCell(1).value = "RESUMEN";
  resumenRow.getCell(1).font = { bold: true, size: 11 };
  resumenRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  currentRow++;

  // Total de movimientos
  const totalRow = worksheet.getRow(currentRow);
  totalRow.getCell(1).value = "Total de Movimientos:";
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(2).value = movimientos.length;
  totalRow.getCell(2).font = { bold: true };
  currentRow++;

  // Calcular totales por moneda
  const totalesPorMoneda = {};
  movimientos.forEach((mov) => {
    const moneda = mov.moneda?.codigoSunat || "PEN";
    if (!totalesPorMoneda[moneda]) {
      totalesPorMoneda[moneda] = {
        monto: 0,
        depreciacionAcumulada: 0,
        valorNeto: 0,
      };
    }
    totalesPorMoneda[moneda].monto += Number(mov.monto) || 0;
    totalesPorMoneda[moneda].depreciacionAcumulada +=
      Number(mov.depreciacionAcumulada) || 0;
    totalesPorMoneda[moneda].valorNeto += Number(mov.valorNeto) || 0;
  });

  // Mostrar totales por moneda
  Object.keys(totalesPorMoneda).forEach((moneda) => {
    const totales = totalesPorMoneda[moneda];
    const monedaRow = worksheet.getRow(currentRow);
    monedaRow.getCell(1).value = `Total en ${moneda}:`;
    monedaRow.getCell(1).font = { bold: true };
    monedaRow.getCell(2).value = formatearMoneda(totales.monto, moneda);
    monedaRow.getCell(3).value = `Dep. Acum: ${formatearMoneda(
      totales.depreciacionAcumulada,
      moneda
    )}`;
    monedaRow.getCell(4).value = `Valor Neto: ${formatearMoneda(
      totales.valorNeto,
      moneda
    )}`;
    currentRow++;
  });

  // ⭐ GENERAR Y RETORNAR BLOB
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}