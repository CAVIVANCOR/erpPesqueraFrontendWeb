// src/components/tesoreria/reports/generarTipoPrestamosExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Tipos de Préstamo con formateo
 * @param {Object} data - Datos de los tipos de préstamo
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarTipoPrestamosExcel(data) {
  const { items, fechaGeneracion } = data;

  // Ordenar items por descripción
  const itemsOrdenados = [...items].sort((a, b) => {
    const descA = a.descripcion || "";
    const descB = b.descripcion || "";
    return descA.localeCompare(descB);
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tipos de Préstamo");

  // Desactivar líneas de cuadrícula
  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE TIPOS DE PRÉSTAMO";
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
  const headers = ["ID", "Descripción", "Características", "Estado"];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" }, // Azul
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
    { width: 8 },  // ID
    { width: 40 }, // Descripción
    { width: 45 }, // Características
    { width: 12 }, // Estado
  ];

  // ⭐ DATOS DE LA TABLA
  itemsOrdenados.forEach((item, index) => {
    const dataRow = worksheet.getRow(currentRow);

    // Construir características
    let caracteristicas = [];
    if (item.requiereGarantia) caracteristicas.push("GARANTÍA");
    if (item.esComercioExterior) caracteristicas.push("COMEX");
    if (item.esLeasing) caracteristicas.push("LEASING");
    if (item.esFactoring) caracteristicas.push("FACTORING");
    if (item.permiteRefinanciar) caracteristicas.push("REFINANCIABLE");

    // Valores de la fila
    dataRow.values = [
      item.id,
      item.descripcion || "N/A",
      caracteristicas.join(", ") || "-",
      item.activo ? "ACTIVO" : "INACTIVO",
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
        // ID - centrado
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 2) {
        // Descripción - negrita
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.font = { bold: true };
      } else if (colNumber === 3) {
        // Características - normal
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (colNumber === 4) {
        // Estado - centrado con color
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
        if (item.activo) {
          cell.font = { bold: true, color: { argb: "FF008000" } }; // Verde (ACTIVO)
        } else {
          cell.font = { bold: true, color: { argb: "FFB20000" } }; // Rojo (INACTIVO)
        }
      }

      // Fondo alternado (filas pares)
      if (index % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" }, // Gris muy claro
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
  resumenTituloCell.value = "RESUMEN DE TIPOS DE PRÉSTAMO";
  resumenTituloCell.font = { bold: true, size: 12 };
  resumenTituloCell.alignment = { horizontal: "center", vertical: "middle" };
  resumenTituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  resumenRow++;
  resumenRow++; // Línea en blanco

  // Datos de resumen
  const resumenData = [
    { Campo: "Total de Tipos de Préstamo", Valor: items.length },
    { Campo: "Tipos Activos", Valor: items.filter((i) => i.activo).length },
    { Campo: "Tipos Inactivos", Valor: items.filter((i) => !i.activo).length },
    { Campo: "Con Garantía", Valor: items.filter((i) => i.requiereGarantia).length },
    { Campo: "Comercio Exterior", Valor: items.filter((i) => i.esComercioExterior).length },
    { Campo: "Leasing", Valor: items.filter((i) => i.esLeasing).length },
    { Campo: "Factoring", Valor: items.filter((i) => i.esFactoring).length },
    { Campo: "Refinanciables", Valor: items.filter((i) => i.permiteRefinanciar).length },
  ];

  resumenData.forEach((dato) => {
    const row = worksheetResumen.getRow(resumenRow);
    row.values = [dato.Campo, dato.Valor];

    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };

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

  worksheetResumen.columns = [{ width: 30 }, { width: 20 }];

  // ⭐ GENERAR ARCHIVO EXCEL
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}