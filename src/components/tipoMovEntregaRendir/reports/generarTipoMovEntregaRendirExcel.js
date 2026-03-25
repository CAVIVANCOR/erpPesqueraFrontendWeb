// src/components/tipoMovEntregaRendir/reports/generarTipoMovEntregaRendirExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Tipos de Movimiento Caja con formateo
 * @param {Object} data - Datos de los tipos de movimiento
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarTipoMovEntregaRendirExcel(data) {
  const { items, categorias, fechaGeneracion } = data;

  // Ordenar items por tipo, categoría y nombre
  const itemsOrdenados = [...items].sort((a, b) => {
    // 1. Ordenar por Tipo (INGRESO primero, EGRESO después)
    if (a.esIngreso !== b.esIngreso) {
      return a.esIngreso ? -1 : 1;
    }

    // 2. Ordenar por Categoría (alfabético)
    const catA = a.categoria?.nombre || "";
    const catB = b.categoria?.nombre || "";
    if (catA !== catB) {
      return catA.localeCompare(catB);
    }

    // 3. Ordenar por Nombre (alfabético)
    const nombreA = a.nombre || "";
    const nombreB = b.nombre || "";
    return nombreA.localeCompare(nombreB);
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tipos Movimiento Caja");

  // Desactivar líneas de cuadrícula
  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE TIPOS DE MOVIMIENTO CAJA";
  tituloCell.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  currentRow++;

  // ⭐ FECHA DE GENERACIÓN
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const fechaCell = worksheet.getCell(`A${currentRow}`);
  fechaCell.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
  fechaCell.font = { size: 10, color: { argb: "FF666666" } };
  fechaCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  currentRow++; // Línea en blanco

  // ⭐ ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  const headers = [
    "ID",
    "Tipo",
    "Categoría",
    "Nombre",
    "Transferencia",
    "Estado",
  ];

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
    { width: 12 }, // Tipo
    { width: 30 }, // Categoría
    { width: 40 }, // Nombre
    { width: 15 }, // Transferencia
    { width: 12 }, // Estado
  ];

  // ⭐ DATOS DE LA TABLA
  itemsOrdenados.forEach((item, index) => {
    const dataRow = worksheet.getRow(currentRow);

    // Valores de la fila
    dataRow.values = [
      item.id,
      item.esIngreso ? "INGRESO" : "EGRESO",
      item.categoria?.nombre || "N/A",
      item.nombre || "N/A",
      item.esTransferencia ? "SÍ" : "NO",
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

      // Alineación
      if (colNumber === 1) {
        // ID - centrado
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 2) {
        // Tipo - centrado con color
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
        if (item.esIngreso) {
          cell.font = { bold: true, color: { argb: "FF008000" } }; // Verde
        } else {
          cell.font = { bold: true, color: { argb: "FFB20000" } }; // Rojo
        }
      } else if (colNumber === 4) {
        // Nombre - negrita
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.font = { bold: true };
      } else if (colNumber === 5) {
        // Transferencia - centrado con color
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (item.esTransferencia) {
          cell.font = { bold: true, color: { argb: "FF0066CC" } }; // Azul
        } else {
          cell.font = { color: { argb: "FF808080" } }; // Gris
        }
      } else if (colNumber === 6) {
        // Estado - centrado con color
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
        if (item.activo) {
          cell.font = { bold: true, color: { argb: "FF008000" } }; // Verde
        } else {
          cell.font = { bold: true, color: { argb: "FFB20000" } }; // Rojo
        }
      } else {
        // Otros - izquierda
        cell.alignment = { horizontal: "left", vertical: "middle" };
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
  resumenTituloCell.value = "RESUMEN DE TIPOS DE MOVIMIENTO";
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
    { Campo: "Total de Tipos", Valor: items.length },
    {
      Campo: "Tipos Ingreso",
      Valor: items.filter((i) => i.esIngreso).length,
    },
    { Campo: "Tipos Egreso", Valor: items.filter((i) => !i.esIngreso).length },
    {
      Campo: "Tipos Transferencia",
      Valor: items.filter((i) => i.esTransferencia).length,
    },
    { Campo: "Tipos Activos", Valor: items.filter((i) => i.activo).length },
    {
      Campo: "Tipos Inactivos",
      Valor: items.filter((i) => !i.activo).length,
    },
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

  worksheetResumen.columns = [{ width: 25 }, { width: 20 }];

  // ⭐ GENERAR ARCHIVO EXCEL
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}