// src/components/tipoMovimientoActivoFijo/reports/generarTiposMovimientoActivoFijoExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Tipos de Movimiento de Activo Fijo
 * @param {Object} data - Datos de los tipos de movimiento
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarTiposMovimientoActivoFijoExcel(data) {
  const { tiposMovimiento, fechaGeneracion } = data;

  // Ordenar tipos de movimiento por nombre
  const tiposOrdenados = [...tiposMovimiento].sort((a, b) => {
    return (a.nombre || "").localeCompare(b.nombre || "");
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tipos de Movimiento");

  // Desactivar líneas de cuadrícula
  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE TIPOS DE MOVIMIENTO DE ACTIVO FIJO";
  tituloCell.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  currentRow++;

  // ⭐ FECHA DE GENERACIÓN
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const fechaCell = worksheet.getCell(`A${currentRow}`);
  fechaCell.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
  fechaCell.font = { size: 10, color: { argb: "FF666666" } };
  fechaCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  currentRow++; // Línea en blanco

  // ⭐ ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  const headers = ["N°", "Nombre", "Descripción", "Estado"];

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
    { width: 35 }, // Nombre
    { width: 50 }, // Descripción
    { width: 12 }, // Estado
  ];

  // ⭐ DATOS DE LA TABLA
  tiposOrdenados.forEach((tipo, index) => {
    const dataRow = worksheet.getRow(currentRow);

    // Valores de la fila
    dataRow.values = [
      index + 1,
      tipo.nombre || "N/A",
      tipo.descripcion || "-",
      tipo.activo ? "ACTIVO" : "INACTIVO",
    ];

    // Aplicar estilos a cada celda
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Bordes
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };

      // Alineación y estilos específicos por columna
      if (colNumber === 1) {
        // N° - centrado
        cell.alignment = { horizontal: "center", vertical: "top" };
      } else if (colNumber === 2) {
        // Nombre - negrita con wrap text
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
        cell.font = { bold: true };
      } else if (colNumber === 3) {
        // Descripción - con wrap text
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      } else if (colNumber === 4) {
        // Estado - centrado con color
        cell.alignment = { horizontal: "center", vertical: "top" };
        cell.font = { bold: true };
        if (tipo.activo) {
          cell.font = { bold: true, color: { argb: "FF008000" } }; // Verde
        } else {
          cell.font = { bold: true, color: { argb: "FFB20000" } }; // Rojo
        }
      }

      // Fondo alternado (filas pares)
      if (index % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    currentRow++;
  });

  currentRow++; // Línea en blanco

  // ⭐ HOJA DE RESUMEN
  const worksheetResumen = workbook.addWorksheet("Resumen");
  worksheetResumen.views = [{ showGridLines: false }];

  let resumenRow = 1;

  // Título de resumen
  worksheetResumen.mergeCells(`A${resumenRow}:B${resumenRow}`);
  const resumenTituloCell = worksheetResumen.getCell(`A${resumenRow}`);
  resumenTituloCell.value = "RESUMEN DE TIPOS DE MOVIMIENTO";
  resumenTituloCell.font = { bold: true, size: 12 };
  resumenTituloCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  resumenTituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  resumenRow++;
  resumenRow++; // Línea en blanco

  // Datos de resumen
  const resumenData = [
    { Campo: "Total de Tipos", Valor: tiposMovimiento.length },
    {
      Campo: "Tipos Activos",
      Valor: tiposMovimiento.filter((t) => t.activo).length,
    },
    {
      Campo: "Tipos Inactivos",
      Valor: tiposMovimiento.filter((t) => !t.activo).length,
    },
  ];

  resumenData.forEach((dato) => {
    const row = worksheetResumen.getRow(resumenRow);
    row.values = [dato.Campo, dato.Valor];

    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: "left", vertical: "top" };
    row.getCell(2).alignment = { horizontal: "center", vertical: "top" };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    resumenRow++;
  });

  worksheetResumen.columns = [{ width: 25 }, { width: 20 }];

  // ⭐ GENERAR ARCHIVO EXCEL
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}