// src/components/tesoreria/reports/generarDetalleUsoLineaCreditoExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte detallado de uso de Líneas de Crédito
 * Incluye jerarquía: Líneas → Sublíneas → Préstamos
 * @param {Object} data - Datos de las líneas de crédito con sublíneas y préstamos
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarDetalleUsoLineaCreditoExcel(data) {
  const { items, fechaGeneracion } = data;

  const itemsOrdenados = [...items].sort((a, b) => {
    const empresaA = a.empresa?.razonSocial || "";
    const empresaB = b.empresa?.razonSocial || "";
    if (empresaA !== empresaB) {
      return empresaA.localeCompare(empresaB);
    }
    const numA = a.numeroLinea || "";
    const numB = b.numeroLinea || "";
    return numA.localeCompare(numB);
  });

  const workbook = new ExcelJS.Workbook();

  // ⭐ FUNCIÓN PARA FORMATEAR MONTOS
  const formatMonto = (val) => parseFloat(val || 0);

  // ⭐ FUNCIÓN PARA FORMATEAR FECHAS
  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha);
  };

  // ========================================
  // CREAR UNA HOJA POR CADA LÍNEA DE CRÉDITO
  // ========================================
  itemsOrdenados.forEach((linea, lineaIndex) => {
    const sheetName = `Línea ${linea.numeroLinea || lineaIndex + 1}`.substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.views = [{ showGridLines: false }];

    let currentRow = 1;

    // ⭐ TÍTULO DE LA HOJA
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const tituloCell = worksheet.getCell(`A${currentRow}`);
    tituloCell.value = `DETALLE DE USO - LÍNEA DE CRÉDITO: ${linea.numeroLinea || "N/A"}`;
    tituloCell.font = { bold: true, size: 14, color: { argb: "FF1A1A1A" } };
    tituloCell.alignment = { horizontal: "center", vertical: "middle" };
    tituloCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    currentRow++;

    // ⭐ FECHA DE GENERACIÓN
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const fechaCell = worksheet.getCell(`A${currentRow}`);
    fechaCell.value = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
    fechaCell.font = { size: 10, color: { argb: "FF666666" } };
    fechaCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow++;

    currentRow++;

    // ========================================
    // SECCIÓN 1: INFORMACIÓN DE LA LÍNEA
    // ========================================
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const infoHeaderCell = worksheet.getCell(`A${currentRow}`);
    infoHeaderCell.value = "INFORMACIÓN DE LA LÍNEA";
    infoHeaderCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    infoHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
    infoHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    currentRow++;

    const infoLinea = [
      { label: "Empresa", value: linea.empresa?.razonSocial || "-" },
      { label: "Banco", value: linea.banco?.nombre || "-" },
      { label: "Número de Línea", value: linea.numeroLinea || "-" },
      { label: "Moneda", value: linea.moneda?.codigo || "-" },
      { label: "Monto Aprobado", value: formatMonto(linea.montoAprobado) },
      { label: "Monto Utilizado", value: formatMonto(linea.montoUtilizado) },
      { label: "Monto Disponible", value: formatMonto(linea.montoDisponible) },
      { label: "Tasa de Interés (%)", value: formatMonto(linea.tasaInteres) },
      { label: "Fecha Aprobación", value: formatFecha(linea.fechaAprobacion) },
      { label: "Fecha Vencimiento", value: formatFecha(linea.fechaVencimiento) },
      { label: "Estado", value: linea.estado?.nombre || "-" },
    ];

    infoLinea.forEach((info) => {
      const row = worksheet.getRow(currentRow);
      row.values = [info.label, info.value];

      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

      if (typeof info.value === "number") {
        row.getCell(2).numFmt = "#,##0.00";
      } else if (info.value instanceof Date) {
        row.getCell(2).numFmt = "dd/mm/yyyy";
      }

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });

      currentRow++;
    });

    currentRow++;

    // ========================================
    // SECCIÓN 2: SUBLÍNEAS DE CRÉDITO
    // ========================================
    const sublineas = linea.sublineas || [];

    if (sublineas.length > 0) {
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const subHeaderCell = worksheet.getCell(`A${currentRow}`);
      subHeaderCell.value = "SUBLÍNEAS DE CRÉDITO";
      subHeaderCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      subHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
      subHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      currentRow++;

      // Headers de sublíneas
      const subHeaderRow = worksheet.getRow(currentRow);
      const subHeaders = ["Tipo Préstamo", "Asignado", "Utilizado", "Disponible", "Sobregiro", "% Utilizado", "Estado"];

      subHeaders.forEach((header, index) => {
        const cell = subHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF92D050" },
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

      // Datos de sublíneas
      sublineas.forEach((sublinea, subIndex) => {
        const montoAsignado = formatMonto(sublinea.montoAsignado);
        const montoUtilizado = formatMonto(sublinea.montoUtilizado);
        const montoDisponible = formatMonto(sublinea.montoDisponible);
        const totalSobregiros = formatMonto(sublinea.totalSobregiros);
        const montoTotal = montoAsignado + totalSobregiros;
        const porcentaje = montoTotal > 0 ? (montoUtilizado / montoTotal) : 0;

        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          sublinea.tipoPrestamo?.descripcion || sublinea.descripcion || "-",
          montoAsignado,
          montoUtilizado,
          montoDisponible,
          totalSobregiros > 0 ? totalSobregiros : "-",
          porcentaje,
          sublinea.activo ? "ACTIVO" : "INACTIVO",
        ];

        dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFCCCCCC" } },
            left: { style: "thin", color: { argb: "FFCCCCCC" } },
            bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
            right: { style: "thin", color: { argb: "FFCCCCCC" } },
          };

          if (colNumber === 1) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.font = { bold: true };
          } else if ([2, 3, 4].includes(colNumber)) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
            cell.numFmt = "#,##0.00";
          } else if (colNumber === 5) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
            if (totalSobregiros > 0) {
              cell.numFmt = "#,##0.00";
              cell.font = { bold: true, color: { argb: "FFB20000" } };
            } else {
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }
          } else if (colNumber === 6) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.numFmt = "0.00%";
            if (porcentaje > 0.9) {
              cell.font = { bold: true, color: { argb: "FFB20000" } };
            } else if (porcentaje > 0.75) {
              cell.font = { bold: true, color: { argb: "FFCC6600" } };
            }
          } else if (colNumber === 7) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }

          if (subIndex % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F5F5" },
            };
          }
        });

        currentRow++;

        // ========================================
        // SECCIÓN 3: PRÉSTAMOS DE LA SUBLÍNEA
        // ========================================
        const prestamos = sublinea.prestamos || [];

        if (prestamos.length > 0) {
          currentRow++;

          worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
          const prestHeaderCell = worksheet.getCell(`A${currentRow}`);
          prestHeaderCell.value = `Préstamos de Sublínea: ${sublinea.tipoPrestamo?.descripcion || "N/A"}`;
          prestHeaderCell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
          prestHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
          prestHeaderCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF5B9BD5" },
          };
          currentRow++;

          // Headers de préstamos
          const prestHeaderRow = worksheet.getRow(currentRow);
          const prestHeaders = ["Nº Préstamo", "Fecha Desemb.", "Monto Desemb.", "Saldo Capital", "Estado", "Observaciones"];

          prestHeaders.forEach((header, index) => {
            const cell = prestHeaderRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF9BC2E6" },
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

          // Datos de préstamos
          prestamos.forEach((prestamo, prestIndex) => {
            const prestRow = worksheet.getRow(currentRow);
            prestRow.values = [
              prestamo.numeroPrestamo || "-",
              formatFecha(prestamo.fechaDesembolso),
              formatMonto(prestamo.montoDesembolsado),
              formatMonto(prestamo.saldoCapital),
              prestamo.estado?.nombre || "-",
              prestamo.observaciones || "-",
            ];

            prestRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              cell.border = {
                top: { style: "thin", color: { argb: "FFCCCCCC" } },
                left: { style: "thin", color: { argb: "FFCCCCCC" } },
                bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
                right: { style: "thin", color: { argb: "FFCCCCCC" } },
              };

              if (colNumber === 1) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.font = { bold: true };
              } else if (colNumber === 2) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
                if (cell.value instanceof Date) {
                  cell.numFmt = "dd/mm/yyyy";
                }
              } else if ([3, 4].includes(colNumber)) {
                cell.alignment = { horizontal: "right", vertical: "middle" };
                cell.numFmt = "#,##0.00";
              } else if (colNumber === 5) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
              } else if (colNumber === 6) {
                cell.alignment = { horizontal: "left", vertical: "middle" };
              }

              if (prestIndex % 2 === 0) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFF9F9F9" },
                };
              }
            });

            currentRow++;
          });

          currentRow++;
        }
      });
    } else {
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const noDataCell = worksheet.getCell(`A${currentRow}`);
      noDataCell.value = "No hay sublíneas registradas para esta línea de crédito.";
      noDataCell.font = { italic: true, color: { argb: "FF999999" } };
      noDataCell.alignment = { horizontal: "center", vertical: "middle" };
      currentRow++;
    }

    // Ajustar anchos de columna
    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 30 },
    ];
  });

  // ⭐ HOJA DE RESUMEN GENERAL
  const resumenSheet = workbook.addWorksheet("Resumen General");
  resumenSheet.views = [{ showGridLines: false }];

  let resRow = 1;

  resumenSheet.mergeCells(`A${resRow}:B${resRow}`);
  const resTituloCell = resumenSheet.getCell(`A${resRow}`);
  resTituloCell.value = "RESUMEN GENERAL DE LÍNEAS DE CRÉDITO";
  resTituloCell.font = { bold: true, size: 14 };
  resTituloCell.alignment = { horizontal: "center", vertical: "middle" };
  resTituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  resRow++;
  resRow++;

  const totalLineas = items.length;
  const totalSublineas = items.reduce((sum, l) => sum + (l.sublineas?.length || 0), 0);
  const totalPrestamos = items.reduce((sum, l) => {
    return sum + (l.sublineas?.reduce((s, sub) => s + (sub.prestamos?.length || 0), 0) || 0);
  }, 0);

  const resumenData = [
    { Campo: "Total de Líneas de Crédito", Valor: totalLineas },
    { Campo: "Total de Sublíneas", Valor: totalSublineas },
    { Campo: "Total de Préstamos", Valor: totalPrestamos },
  ];

  resumenData.forEach((dato) => {
    const row = resumenSheet.getRow(resRow);
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

    resRow++;
  });

  resumenSheet.columns = [{ width: 35 }, { width: 20 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}