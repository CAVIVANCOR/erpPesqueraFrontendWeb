// src/components/tesoreria/reports/generarLineaCreditoExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte resumen de Líneas de Crédito
 * @param {Object} data - Datos de las líneas de crédito
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarLineaCreditoExcel(data) {
  const { items, fechaGeneracion } = data;

  // Ordenar items por moneda, luego por empresa y número de línea
  const itemsOrdenados = [...items].sort((a, b) => {
    const monedaA = a.moneda?.codigoSunat || "";
    const monedaB = b.moneda?.codigoSunat || "";
    if (monedaA !== monedaB) {
      return monedaA.localeCompare(monedaB);
    }
    const empresaA = a.empresa?.razonSocial || "";
    const empresaB = b.empresa?.razonSocial || "";
    if (empresaA !== empresaB) {
      return empresaA.localeCompare(empresaB);
    }
    const numA = a.numeroLinea || "";
    const numB = b.numeroLinea || "";
    return numA.localeCompare(numB);
  });

  // ⭐ AGRUPAR POR MONEDA
  const gruposPorMoneda = {};
  itemsOrdenados.forEach((item) => {
    const moneda = item.moneda?.codigoSunat || "SIN MONEDA";
    if (!gruposPorMoneda[moneda]) {
      gruposPorMoneda[moneda] = [];
    }
    gruposPorMoneda[moneda].push(item);
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Líneas de Crédito");

  worksheet.views = [{ showGridLines: false }];

  let currentRow = 1;

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "LISTADO DE LÍNEAS DE CRÉDITO";
  tituloCell.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
  tituloCell.alignment = { horizontal: "center", vertical: "middle" };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  currentRow++;

  // ⭐ FECHA DE GENERACIÓN
  worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
  const fechaCell = worksheet.getCell(`A${currentRow}`);
  fechaCell.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
  fechaCell.font = { size: 10, color: { argb: "FF666666" } };
  fechaCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  currentRow++;

  // ⭐ ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  const headers = [
    "Empresa",
    "Banco",
    "Moneda",
    "Límite",
    "Utilizado",
    "Sobregiro",
    "Disponible",
    "% Utilizado",
    "Vencimiento",
    "Tasa %",
    "Estado",
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
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
    { width: 25 },  // Empresa
    { width: 20 },  // Banco
    { width: 10 },  // Moneda
    { width: 15 },  // Límite
    { width: 15 },  // Utilizado
    { width: 15 },  // Sobregiro
    { width: 15 },  // Disponible
    { width: 12 },  // % Utilizado
    { width: 15 },  // Vencimiento
    { width: 10 },  // Tasa %
    { width: 15 },  // Estado
  ];

  // ⭐ DATOS DE LA TABLA CON SUBTOTALES POR MONEDA
  const monedasKeys = Object.keys(gruposPorMoneda);
  let globalRowIndex = 0;

  monedasKeys.forEach((moneda) => {
    const itemsMoneda = gruposPorMoneda[moneda];

    // Calcular subtotales para esta moneda
    const subtotales = {
      limite: 0,
      utilizado: 0,
      sobregiros: 0,
      disponible: 0,
    };

    // Dibujar items de esta moneda
    itemsMoneda.forEach((item, index) => {
      const dataRow = worksheet.getRow(currentRow);

      const montoAprobado = parseFloat(item.montoAprobado || 0);
      const montoUtilizado = parseFloat(item.montoUtilizado || 0);
      const montoDisponible = parseFloat(item.montoDisponible || 0);
      const totalSobregiros = parseFloat(item.totalSobregiros || 0);
      const porcentajeUtilizado = montoAprobado > 0 ? (montoUtilizado / montoAprobado) * 100 : 0;

      // Acumular subtotales
      subtotales.limite += montoAprobado;
      subtotales.utilizado += montoUtilizado;
      subtotales.sobregiros += totalSobregiros;
      subtotales.disponible += montoDisponible;

      dataRow.values = [
        item.empresa?.razonSocial || "-",
        item.banco?.nombre || "-",
        item.moneda?.codigoSunat || "-",
        montoAprobado,
        montoUtilizado,
        totalSobregiros,
        montoDisponible,
        porcentajeUtilizado / 100,
        item.fechaVencimiento ? new Date(item.fechaVencimiento) : "-",
        parseFloat(item.tasaInteres || 0),
        item.estado?.descripcion || "-",
      ];

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };

        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colNumber === 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { bold: true };
        } else if ([4, 5, 6, 7].includes(colNumber)) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "#,##0.00";
        } else if (colNumber === 8) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "0.00%";
          if (porcentajeUtilizado > 90) {
            cell.font = { bold: true, color: { argb: "FFB20000" } };
          } else if (porcentajeUtilizado > 75) {
            cell.font = { bold: true, color: { argb: "FFCC6600" } };
          }
        } else if (colNumber === 9) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (typeof cell.value === "object" && cell.value instanceof Date) {
            cell.numFmt = "dd/mm/yyyy";
          }
        } else if (colNumber === 10) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "0.00";
        } else if (colNumber === 11) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }

        // Sobregiro en rojo si es mayor a 0
        if (colNumber === 6 && totalSobregiros > 0) {
          cell.font = { bold: true, color: { argb: "FFB20000" } };
        }

        if (globalRowIndex % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }
      });

      currentRow++;
      globalRowIndex++;
    });

    // ⭐ FILA DE SUBTOTAL
    const subtotalRow = worksheet.getRow(currentRow);
    subtotalRow.values = [
      `Subtotal ${moneda}`,
      "",
      "",
      subtotales.limite,
      subtotales.utilizado,
      subtotales.sobregiros,
      subtotales.disponible,
      "",
      "",
      "",
      "",
    ];

    subtotalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EDF7" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      cell.font = { bold: true };

      if (colNumber === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if ([4, 5, 6, 7].includes(colNumber)) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0.00";
      }

      // Sobregiro en rojo si es mayor a 0
      if (colNumber === 6 && subtotales.sobregiros > 0) {
        cell.font = { bold: true, color: { argb: "FFB20000" } };
      }
    });

    currentRow++;
  });

  currentRow++;

  // ⭐ HOJA DE RESUMEN
  const worksheetResumen = workbook.addWorksheet("Resumen");
  worksheetResumen.views = [{ showGridLines: false }];

  let resumenRow = 1;

  worksheetResumen.mergeCells(`A${resumenRow}:B${resumenRow}`);
  const resumenTituloCell = worksheetResumen.getCell(`A${resumenRow}`);
  resumenTituloCell.value = "RESUMEN DE LÍNEAS DE CRÉDITO";
  resumenTituloCell.font = { bold: true, size: 12 };
  resumenTituloCell.alignment = { horizontal: "center", vertical: "middle" };
  resumenTituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  resumenRow++;
  resumenRow++;

  const totalLineas = items.length;
  const lineasActivas = items.filter((l) => l.estado?.nombre?.toUpperCase().includes("VIGENTE")).length;
  const lineasVencidas = items.filter((l) => {
    if (!l.fechaVencimiento) return false;
    return new Date(l.fechaVencimiento) < new Date();
  }).length;

  const resumenData = [
    { Campo: "Total de Líneas de Crédito", Valor: totalLineas },
    { Campo: "Líneas Vigentes", Valor: lineasActivas },
    { Campo: "Líneas Vencidas", Valor: lineasVencidas },
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

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}