// src/components/tipoActivo/reports/generarTiposActivoExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Tipos de Activo con cuentas contables
 * @param {Object} data - Datos de los tipos de activo
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarTiposActivoExcel(data) {
  const { tiposActivo, fechaGeneracion } = data;

  // Ordenar tipos de activo por código
  const tiposOrdenados = [...tiposActivo].sort((a, b) => {
    return (a.codigo || "").localeCompare(b.codigo || "");
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tipos de Activo");

  // Desactivar líneas de cuadrícula
  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE TIPOS DE ACTIVO";
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
    "N°",
    "Código",
    "Nombre",
    "Cuenta Activo (33x)",
    "Cuenta Depreciación (68x)",
    "Cuenta Dep. Acumulada (39x)",
    "Estado",
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
    { width: 15 }, // Código
    { width: 30 }, // Nombre
    { width: 40 }, // Cuenta Activo
    { width: 40 }, // Cuenta Depreciación
    { width: 40 }, // Cuenta Dep. Acumulada
    { width: 12 }, // Estado
  ];

  // ⭐ DATOS DE LA TABLA
  tiposOrdenados.forEach((tipo, index) => {
    const dataRow = worksheet.getRow(currentRow);

    // Valores de la fila
    dataRow.values = [
      index + 1,
      tipo.codigo || "N/A",
      tipo.nombre || "N/A",
      tipo.cuentaActivo
        ? `${tipo.cuentaActivo.codigoCuenta} - ${tipo.cuentaActivo.nombreCuenta}`
        : "-",
      tipo.cuentaDepreciacion
        ? `${tipo.cuentaDepreciacion.codigoCuenta} - ${tipo.cuentaDepreciacion.nombreCuenta}`
        : "-",
      tipo.cuentaDepreciacionAcumulada
        ? `${tipo.cuentaDepreciacionAcumulada.codigoCuenta} - ${tipo.cuentaDepreciacionAcumulada.nombreCuenta}`
        : "-",
      tipo.cesado ? "CESADO" : "ACTIVO",
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
        // Código - negrita
        cell.alignment = { horizontal: "left", vertical: "top" };
        cell.font = { bold: true };
      } else if (colNumber === 7) {
        // Estado - centrado con color
        cell.alignment = { horizontal: "center", vertical: "top" };
        cell.font = { bold: true };
        if (tipo.cesado) {
          cell.font = { bold: true, color: { argb: "FFB20000" } }; // Rojo
        } else {
          cell.font = { bold: true, color: { argb: "FF008000" } }; // Verde
        }
      } else {
        // Otros - izquierda con wrap
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
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
  resumenTituloCell.value = "RESUMEN DE TIPOS DE ACTIVO";
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
    { Campo: "Total de Tipos", Valor: tiposActivo.length },
    {
      Campo: "Tipos Activos",
      Valor: tiposActivo.filter((t) => !t.cesado).length,
    },
    {
      Campo: "Tipos Cesados",
      Valor: tiposActivo.filter((t) => t.cesado).length,
    },
    {
      Campo: "Con Cuenta Activo",
      Valor: tiposActivo.filter((t) => t.cuentaActivoId).length,
    },
    {
      Campo: "Con Cuenta Depreciación",
      Valor: tiposActivo.filter((t) => t.cuentaDepreciacionId).length,
    },
    {
      Campo: "Con Cuenta Dep. Acumulada",
      Valor: tiposActivo.filter((t) => t.cuentaDepreciacionAcumuladaId)
        .length,
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

  worksheetResumen.columns = [{ width: 30 }, { width: 20 }];

  // ⭐ GENERAR ARCHIVO EXCEL
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}