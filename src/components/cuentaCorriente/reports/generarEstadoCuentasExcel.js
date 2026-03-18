// src/components/cuentaCorriente/reports/generarEstadoCuentasExcel.js
import ExcelJS from "exceljs";

/**
 * Genera Excel del reporte de Estado de Cuentas Corrientes
 * @param {Object} data - Datos de las cuentas corrientes
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarEstadoCuentasExcel(data) {
  const { cuentas, empresas, bancos, filtros, fechaGeneracion } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Estado de Cuentas");

  // ⭐ OBTENER EMPRESA FILTRADA (SOLO si hay filtro de empresa)
  let empresaFiltrada = null;
  if (filtros.empresaFiltro) {
    empresaFiltrada = empresas.find(e => Number(e.id) === Number(filtros.empresaFiltro));
  }

  let currentRow = 1;

  // ⭐ ENCABEZADO - DATOS DE EMPRESA (solo si hay filtro)
  if (empresaFiltrada) {
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = empresaFiltrada.razonSocial || "EMPRESA";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `RUC: ${empresaFiltrada.ruc || "-"}`;
    worksheet.getCell(`A${currentRow}`).font = { size: 10 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;

    if (empresaFiltrada.direccion) {
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `Dirección: ${empresaFiltrada.direccion}`;
      worksheet.getCell(`A${currentRow}`).font = { size: 9 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
      currentRow++;
    }

    currentRow++;
  }

  // ⭐ TÍTULO DEL REPORTE
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "ESTADO DE CUENTAS CORRIENTES";
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  // ⭐ FECHA Y HORA DE GENERACIÓN
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const fechaTexto = `Fecha de Generación: ${fechaGeneracion.toLocaleDateString('es-PE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })}, ${fechaGeneracion.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  worksheet.getCell(`A${currentRow}`).value = fechaTexto;
  worksheet.getCell(`A${currentRow}`).font = { size: 10, color: { argb: "FF666666" } };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  currentRow++;

  // ⭐ FILTROS APLICADOS
  if (filtros.empresaFiltro || filtros.bancoFiltro || filtros.estadoFiltro !== undefined) {
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = "Filtros aplicados:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;

    if (filtros.empresaFiltro) {
      const empresa = empresas.find(e => Number(e.id) === Number(filtros.empresaFiltro));
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `  • Empresa: ${empresa?.razonSocial || "-"}`;
      worksheet.getCell(`A${currentRow}`).font = { size: 9 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
      currentRow++;
    }

    if (filtros.bancoFiltro) {
      const banco = bancos.find(b => Number(b.id) === Number(filtros.bancoFiltro));
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `  • Banco: ${banco?.nombre || "-"}`;
      worksheet.getCell(`A${currentRow}`).font = { size: 9 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
      currentRow++;
    }

    if (filtros.estadoFiltro !== undefined && filtros.estadoFiltro !== null) {
      const estadoTexto = filtros.estadoFiltro ? "Activas" : "Inactivas";
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `  • Estado: ${estadoTexto}`;
      worksheet.getCell(`A${currentRow}`).font = { size: 9 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "left", vertical: "middle" };
      currentRow++;
    }

    currentRow++;
  }

  // ⭐ ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = [
    "N°",
    "Empresa",
    "Banco",
    "Nro. Cuenta",
    "Mon.",
    "Saldo Act. S/.",
    "Saldo Act. US$",
    "Saldo Mínimo",
    "Estado"
  ];

  // Estilo de encabezados
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 20;

  // Bordes de encabezados
  for (let col = 1; col <= 9; col++) {
    headerRow.getCell(col).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  }

  currentRow++;

  // ⭐ AGRUPAR CUENTAS POR EMPRESA Y BANCO
  const gruposPorEmpresa = {};
  cuentas.forEach(cuenta => {
    const empresaKey = cuenta.empresa?.razonSocial || "SIN EMPRESA";
    const bancoKey = cuenta.banco?.nombre || "SIN BANCO";

    if (!gruposPorEmpresa[empresaKey]) {
      gruposPorEmpresa[empresaKey] = {};
    }
    if (!gruposPorEmpresa[empresaKey][bancoKey]) {
      gruposPorEmpresa[empresaKey][bancoKey] = [];
    }
    gruposPorEmpresa[empresaKey][bancoKey].push(cuenta);
  });

  let rowNumber = 1;
  let totalGeneralSaldoActualSoles = 0;
  let totalGeneralSaldoActualDolares = 0;
  let totalGeneralSaldoMinimo = 0;

  // ⭐ ITERAR POR EMPRESAS
  for (const [empresaNombre, bancos] of Object.entries(gruposPorEmpresa)) {
    let totalEmpresaSaldoActualSoles = 0;
    let totalEmpresaSaldoActualDolares = 0;
    let totalEmpresaSaldoMinimo = 0;

    // Iterar por bancos dentro de la empresa
    for (const [bancoNombre, cuentasBanco] of Object.entries(bancos)) {
      let totalBancoSaldoActualSoles = 0;
      let totalBancoSaldoActualDolares = 0;
      let totalBancoSaldoMinimo = 0;

      // Dibujar cuentas del banco
      for (const cuenta of cuentasBanco) {
        const dataRow = worksheet.getRow(currentRow);

        // ⭐ SEPARAR SALDOS POR MONEDA
        const esSoles = cuenta.moneda?.simbolo === "S/.";
        const esDolares = cuenta.moneda?.simbolo === "US$" || cuenta.moneda?.simbolo === "USD" || cuenta.moneda?.simbolo === "$";
        
        const saldoActualSoles = esSoles ? Number(cuenta.saldoActual || 0) : 0;
        const saldoActualDolares = esDolares ? Number(cuenta.saldoActual || 0) : 0;

        dataRow.values = [
          rowNumber,
          cuenta.empresa?.razonSocial || "-",
          cuenta.banco?.nombre || "-",
          cuenta.numeroCuenta || "-",
          cuenta.moneda?.simbolo || "-",
          saldoActualSoles,
          saldoActualDolares,
          Number(cuenta.saldoMinimo || 0),
          cuenta.activa ? "ACTIVA" : "INACTIVA"
        ];

        // Estilo de fila de datos
        dataRow.font = { size: 9 };
        dataRow.alignment = { vertical: "middle" };
        
        // Alineación por columna
        dataRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        dataRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
        dataRow.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
        dataRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
        dataRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
        dataRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
        dataRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
        dataRow.getCell(9).alignment = { horizontal: "center", vertical: "middle" };

        // Formato numérico
        dataRow.getCell(6).numFmt = '#,##0.00';
        dataRow.getCell(7).numFmt = '#,##0.00';
        dataRow.getCell(8).numFmt = '#,##0.00';

        // Color de estado
        if (cuenta.activa) {
          dataRow.getCell(9).font = { bold: true, color: { argb: "FF008000" }, size: 9 };
        } else {
          dataRow.getCell(9).font = { bold: true, color: { argb: "FFFF0000" }, size: 9 };
        }

        // Bordes
        for (let col = 1; col <= 9; col++) {
          dataRow.getCell(col).border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } }
          };
        }

        // Fondo alternado
        if (rowNumber % 2 === 0) {
          dataRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" }
          };
        }

        currentRow++;
        rowNumber++;

        // Acumular saldos
        totalBancoSaldoActualSoles += saldoActualSoles;
        totalBancoSaldoActualDolares += saldoActualDolares;
        totalBancoSaldoMinimo += Number(cuenta.saldoMinimo || 0);
      }

      // ⭐ SUBTOTAL POR BANCO
      const subtotalBancoRow = worksheet.getRow(currentRow);
      subtotalBancoRow.values = [
        "",
        "",
        `Subtotal ${bancoNombre}`,
        "",
        "",
        totalBancoSaldoActualSoles,
        totalBancoSaldoActualDolares,
        totalBancoSaldoMinimo,
        ""
      ];

      // Estilo subtotal banco
      subtotalBancoRow.font = { bold: true, size: 9 };
      subtotalBancoRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7F3F8" }
      };
      subtotalBancoRow.alignment = { vertical: "middle" };
      subtotalBancoRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      subtotalBancoRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      subtotalBancoRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      subtotalBancoRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };

      // Formato numérico
      subtotalBancoRow.getCell(6).numFmt = '#,##0.00';
      subtotalBancoRow.getCell(7).numFmt = '#,##0.00';
      subtotalBancoRow.getCell(8).numFmt = '#,##0.00';

      // Bordes
      for (let col = 1; col <= 9; col++) {
        subtotalBancoRow.getCell(col).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      }

      currentRow++;

      totalEmpresaSaldoActualSoles += totalBancoSaldoActualSoles;
      totalEmpresaSaldoActualDolares += totalBancoSaldoActualDolares;
      totalEmpresaSaldoMinimo += totalBancoSaldoMinimo;
    }

    // ⭐ TOTAL POR EMPRESA
    const totalEmpresaRow = worksheet.getRow(currentRow);
    totalEmpresaRow.values = [
      "",
      `Total ${empresaNombre}`,
      "",
      "",
      "",
      totalEmpresaSaldoActualSoles,
      totalEmpresaSaldoActualDolares,
      totalEmpresaSaldoMinimo,
      ""
    ];

    // Estilo total empresa
    totalEmpresaRow.font = { bold: true, size: 10 };
    totalEmpresaRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9EDF7" }
    };
    totalEmpresaRow.alignment = { vertical: "middle" };
    totalEmpresaRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    totalEmpresaRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    totalEmpresaRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
    totalEmpresaRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };

    // Formato numérico
    totalEmpresaRow.getCell(6).numFmt = '#,##0.00';
    totalEmpresaRow.getCell(7).numFmt = '#,##0.00';
    totalEmpresaRow.getCell(8).numFmt = '#,##0.00';

    // Bordes
    for (let col = 1; col <= 9; col++) {
      totalEmpresaRow.getCell(col).border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" }
      };
    }

    currentRow++;

    totalGeneralSaldoActualSoles += totalEmpresaSaldoActualSoles;
    totalGeneralSaldoActualDolares += totalEmpresaSaldoActualDolares;
    totalGeneralSaldoMinimo += totalEmpresaSaldoMinimo;
  }

  // ⭐ TOTAL GENERAL
  const totalGeneralRow = worksheet.getRow(currentRow);
  totalGeneralRow.values = [
    "",
    "",
    "TOTAL GENERAL",
    "",
    "",
    totalGeneralSaldoActualSoles,
    totalGeneralSaldoActualDolares,
    totalGeneralSaldoMinimo,
    ""
  ];

  // Estilo total general
  totalGeneralRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  totalGeneralRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  totalGeneralRow.alignment = { vertical: "middle" };
  totalGeneralRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
  totalGeneralRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
  totalGeneralRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
  totalGeneralRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };

  // Formato numérico
  totalGeneralRow.getCell(6).numFmt = '#,##0.00';
  totalGeneralRow.getCell(7).numFmt = '#,##0.00';
  totalGeneralRow.getCell(8).numFmt = '#,##0.00';

  // Bordes
  for (let col = 1; col <= 9; col++) {
    totalGeneralRow.getCell(col).border = {
      top: { style: "double" },
      left: { style: "thin" },
      bottom: { style: "double" },
      right: { style: "thin" }
    };
  }

  currentRow += 2;

  // ⭐ PIE DE PÁGINA
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const footerText = `Total de cuentas: ${cuentas.length} | Generado: ${fechaGeneracion.toLocaleString('es-PE')} | Sistema ERP Megui`;
  worksheet.getCell(`A${currentRow}`).value = footerText;
  worksheet.getCell(`A${currentRow}`).font = { size: 8, color: { argb: "FF666666" } };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };

  // ⭐ AJUSTAR ANCHOS DE COLUMNAS
  worksheet.columns = [
    { key: "col1", width: 6 },   // N°
    { key: "col2", width: 30 },  // Empresa
    { key: "col3", width: 20 },  // Banco
    { key: "col4", width: 20 },  // Nro. Cuenta
    { key: "col5", width: 8 },   // Mon.
    { key: "col6", width: 16 },  // Saldo Act. S/.
    { key: "col7", width: 16 },  // Saldo Act. US$
    { key: "col8", width: 15 },  // Saldo Mínimo
    { key: "col9", width: 12 }   // Estado
  ];

  // ⭐ GENERAR Y RETORNAR BLOB
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}