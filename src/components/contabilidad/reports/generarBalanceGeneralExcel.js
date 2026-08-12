import ExcelJS from "exceljs";
import { ANEXOS_DISPONIBLES, getAnexoConfig, getCuentasParaAnexo, procesarDatosAnexo } from "../../../pages/contabilidad/anexosConfig";
import { formatearNumero } from "../../../utils/utils";

export const generarBalanceGeneralExcel = async (data) => {
  const { empresa, periodo, moneda, cuentas, totales, arbolActivo, arbolPasivoPatrimonio } = data;

  const workbook = new ExcelJS.Workbook();
  
  // ========================================
  // HOJA 1: BALANCE GENERAL PRINCIPAL
  // ========================================
  const worksheet = workbook.addWorksheet("Balance General");

  worksheet.views = [{ showGridLines: true }];
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 }
  };

  // Configurar anchos de columnas (2 paneles lado a lado)
  worksheet.getColumn(1).width = 35; // Denominación Activo
  worksheet.getColumn(2).width = 15; // Anexo Activo
  worksheet.getColumn(3).width = 18; // Monto Activo
  worksheet.getColumn(4).width = 3;  // Separador
  worksheet.getColumn(5).width = 35; // Denominación Pasivo
  worksheet.getColumn(6).width = 15; // Anexo Pasivo
  worksheet.getColumn(7).width = 18; // Monto Pasivo

  const borderThin = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } }
  };

  const fillHeader = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB3E5FC" } // Azul pastel claro
  };

  const fillTotal = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" }
  };

  let currentRow = 1;

  // Encabezado del reporte
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const tituloRow = worksheet.getRow(currentRow);
  tituloRow.getCell(1).value = empresa?.razonSocial || 'EMPRESA';
  tituloRow.getCell(1).font = { bold: true, size: 14 };
  tituloRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const rucRow = worksheet.getRow(currentRow);
  rucRow.getCell(1).value = `RUC ${empresa?.ruc || ''}`;
  rucRow.getCell(1).font = { size: 11 };
  rucRow.getCell(1).alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const tituloBalanceRow = worksheet.getRow(currentRow);
  tituloBalanceRow.getCell(1).value = 'BALANCE GENERAL';
  tituloBalanceRow.getCell(1).font = { bold: true, size: 12 };
  tituloBalanceRow.getCell(1).alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const periodoRow = worksheet.getRow(currentRow);
  periodoRow.getCell(1).value = `Al ${periodo?.nombrePeriodo || ''}`;
  periodoRow.getCell(1).font = { size: 10 };
  periodoRow.getCell(1).alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const monedaRow = worksheet.getRow(currentRow);
  monedaRow.getCell(1).value = `(Expresado en ${moneda?.nombreLargo || 'Soles'})`;
  monedaRow.getCell(1).font = { size: 9, italic: true };
  monedaRow.getCell(1).alignment = { horizontal: 'center' };
  currentRow++;

  currentRow++; // Espacio

  // Headers de columnas
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = [
    'ACTIVO', 'Anexo', 'Monto', '',
    'PASIVO Y PATRIMONIO', 'Anexo', 'Monto'
  ];
  headerRow.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = fillHeader;
  headerRow.height = 25;
  [1, 2, 3, 5, 6, 7].forEach(col => {
    headerRow.getCell(col).border = borderThin;
  });
  currentRow++;

  // Función auxiliar para escribir árbol
  const escribirArbol = (nodos, colDenominacion, colAnexo, colMonto, startRow) => {
    let row = startRow;
    
    const escribirNodo = (nodo, nivel = 0) => {
      const rowObj = worksheet.getRow(row);
      
      // Denominación con indentación
      const indent = '  '.repeat(nivel);
      rowObj.getCell(colDenominacion).value = indent + (nodo.data.denominacion || '');
      
      // Anexo
      if (nodo.data.anexo) {
        rowObj.getCell(colAnexo).value = `Anexo ${nodo.data.anexo}`;
      } else {
        rowObj.getCell(colAnexo).value = '';
      }
      
      // Monto
      if (nodo.data.monto && Math.abs(nodo.data.monto) >= 0.01) {
        rowObj.getCell(colMonto).value = nodo.data.monto;
        rowObj.getCell(colMonto).numFmt = '#,##0.00';
      } else {
        rowObj.getCell(colMonto).value = '';
      }
      
      // Estilos según nivel
      if (nodo.data.nivel === 'clasificacion') {
        rowObj.getCell(colDenominacion).font = { bold: true, size: 10, color: { argb: 'FF1565C0' } };
        rowObj.getCell(colMonto).font = { bold: true, size: 10 };
      } else if (nodo.data.nivel === 'rubro') {
        rowObj.getCell(colDenominacion).font = { size: 9 };
        rowObj.getCell(colAnexo).font = { size: 8, color: { argb: 'FF616161' } };
        rowObj.getCell(colMonto).font = { size: 9 };
      }
      
      rowObj.getCell(colDenominacion).alignment = { horizontal: 'left', vertical: 'top' };
      rowObj.getCell(colAnexo).alignment = { horizontal: 'center', vertical: 'top' };
      rowObj.getCell(colMonto).alignment = { horizontal: 'right', vertical: 'top' };
      
      [colDenominacion, colAnexo, colMonto].forEach(col => {
        rowObj.getCell(col).border = borderThin;
      });
      
      row++;
      
      // Escribir hijos
      if (nodo.children && nodo.children.length > 0) {
        nodo.children.forEach(child => {
          escribirNodo(child, nivel + 1);
        });
      }
    };
    
    nodos.forEach(nodo => escribirNodo(nodo, 0));
    return row;
  };

  // Escribir árboles en paralelo
  const maxRows = Math.max(
    arbolActivo?.length || 0,
    arbolPasivoPatrimonio?.length || 0
  ) * 10; // Estimación de filas necesarias

  const startDataRow = currentRow;
  
  // Escribir Activo (columnas 1, 2, 3)
  const activoEndRow = escribirArbol(arbolActivo || [], 1, 2, 3, startDataRow);
  
  // Escribir Pasivo y Patrimonio (columnas 5, 6, 7)
  const pasivoEndRow = escribirArbol(arbolPasivoPatrimonio || [], 5, 6, 7, startDataRow);
  
  currentRow = Math.max(activoEndRow, pasivoEndRow);
  
  currentRow++; // Espacio antes de totales
  
  // Totales
  const totalActivoRow = worksheet.getRow(currentRow);
  totalActivoRow.getCell(1).value = 'TOTAL ACTIVO';
  totalActivoRow.getCell(1).font = { bold: true, size: 11 };
  totalActivoRow.getCell(1).alignment = { horizontal: 'left' };
  totalActivoRow.getCell(3).value = arbolActivo?.reduce((sum, n) => sum + (n.data.monto || 0), 0) || 0;
  totalActivoRow.getCell(3).numFmt = '#,##0.00';
  totalActivoRow.getCell(3).font = { bold: true, size: 11 };
  totalActivoRow.getCell(3).alignment = { horizontal: 'right' };
  totalActivoRow.getCell(3).fill = fillTotal;
  totalActivoRow.getCell(3).border = borderThin;
  
  totalActivoRow.getCell(5).value = 'TOTAL PASIVO + PATRIMONIO';
  totalActivoRow.getCell(5).font = { bold: true, size: 11 };
  totalActivoRow.getCell(5).alignment = { horizontal: 'left' };
  totalActivoRow.getCell(7).value = arbolPasivoPatrimonio?.reduce((sum, n) => sum + (n.data.monto || 0), 0) || 0;
  totalActivoRow.getCell(7).numFmt = '#,##0.00';
  totalActivoRow.getCell(7).font = { bold: true, size: 11 };
  totalActivoRow.getCell(7).alignment = { horizontal: 'right' };
  totalActivoRow.getCell(7).fill = fillTotal;
  totalActivoRow.getCell(7).border = borderThin;

  // ========================================
  // HOJAS DE ANEXOS
  // ========================================

  ANEXOS_DISPONIBLES.forEach(numeroAnexo => {
    const config = getAnexoConfig(numeroAnexo);
    if (!config) return;

    const cuentasAnexo = getCuentasParaAnexo(numeroAnexo, cuentas);
    if (cuentasAnexo.length === 0) return;

    const datosAnexo = procesarDatosAnexo(numeroAnexo, cuentasAnexo);
    if (datosAnexo.length === 0) return;

    // Crear hoja para el anexo
    const wsAnexo = workbook.addWorksheet(`Anexo ${numeroAnexo}`);
    wsAnexo.views = [{ showGridLines: true }];

    let rowAnexo = 1;

    // Encabezado del anexo
    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    wsAnexo.getRow(rowAnexo).getCell(1).value = empresa?.razonSocial || 'EMPRESA';
    wsAnexo.getRow(rowAnexo).getCell(1).font = { bold: true, size: 12 };
    wsAnexo.getRow(rowAnexo).getCell(1).alignment = { horizontal: 'center' };
    rowAnexo++;

    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    wsAnexo.getRow(rowAnexo).getCell(1).value = `RUC ${empresa?.ruc || ''}`;
    wsAnexo.getRow(rowAnexo).getCell(1).font = { size: 10 };
    wsAnexo.getRow(rowAnexo).getCell(1).alignment = { horizontal: 'center' };
    rowAnexo++;

    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    wsAnexo.getRow(rowAnexo).getCell(1).value = 'BALANCE GENERAL';
    wsAnexo.getRow(rowAnexo).getCell(1).font = { bold: true, size: 11 };
    wsAnexo.getRow(rowAnexo).getCell(1).alignment = { horizontal: 'center' };
    rowAnexo++;

    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    wsAnexo.getRow(rowAnexo).getCell(1).value = `Al ${periodo?.nombrePeriodo || ''}`;
    wsAnexo.getRow(rowAnexo).getCell(1).font = { size: 9 };
    wsAnexo.getRow(rowAnexo).getCell(1).alignment = { horizontal: 'center' };
    rowAnexo++;

    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    wsAnexo.getRow(rowAnexo).getCell(1).value = `(Expresado en Soles)`;
    wsAnexo.getRow(rowAnexo).getCell(1).font = { size: 8, italic: true };
    wsAnexo.getRow(rowAnexo).getCell(1).alignment = { horizontal: 'center' };
    rowAnexo++;

    rowAnexo++; // Espacio

    // Título del anexo
    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    const tituloAnexoRow = wsAnexo.getRow(rowAnexo);
    tituloAnexoRow.getCell(1).value = `ANEXO ${config.numero}`;
    tituloAnexoRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    tituloAnexoRow.getCell(1).alignment = { horizontal: 'center' };
    tituloAnexoRow.getCell(1).fill = fillHeader;
    tituloAnexoRow.height = 20;
    rowAnexo++;

    wsAnexo.mergeCells(`A${rowAnexo}:${String.fromCharCode(64 + config.columnas.length)}${rowAnexo}`);
    const subtituloAnexoRow = wsAnexo.getRow(rowAnexo);
    subtituloAnexoRow.getCell(1).value = config.titulo;
    subtituloAnexoRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF000000' } };
    subtituloAnexoRow.getCell(1).alignment = { horizontal: 'center' };
    subtituloAnexoRow.getCell(1).fill = fillHeader;
    rowAnexo++;

    rowAnexo++; // Espacio

    // Encabezado adicional (para anexos especiales como Capital)
    if (config.encabezadoAdicional) {
      const info = config.encabezadoAdicional(cuentasAnexo);
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'DETALLE DE LA PARTICIPACIÓN ACCIONARIA:';
      wsAnexo.getRow(rowAnexo).getCell(1).font = { bold: true, size: 9 };
      rowAnexo++;
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = `Capital Social al ${periodo?.nombrePeriodo || ''}:`;
      wsAnexo.getRow(rowAnexo).getCell(2).value = info.capitalSocial;
      wsAnexo.getRow(rowAnexo).getCell(2).numFmt = '#,##0.00';
      rowAnexo++;
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'Valor nominal por acción:';
      wsAnexo.getRow(rowAnexo).getCell(2).value = info.valorNominal;
      wsAnexo.getRow(rowAnexo).getCell(2).numFmt = '#,##0.00';
      rowAnexo++;
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'Número de acciones suscritas:';
      wsAnexo.getRow(rowAnexo).getCell(2).value = info.numeroAccionesSuscritas;
      wsAnexo.getRow(rowAnexo).getCell(2).numFmt = '#,##0.00';
      rowAnexo++;
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'Número de acciones pagadas:';
      wsAnexo.getRow(rowAnexo).getCell(2).value = info.numeroAccionesPagadas;
      wsAnexo.getRow(rowAnexo).getCell(2).numFmt = '#,##0.00';
      rowAnexo++;
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'Número de accionistas:';
      wsAnexo.getRow(rowAnexo).getCell(2).value = info.numeroAccionistas;
      rowAnexo++;
      
      rowAnexo++; // Espacio
      
      wsAnexo.getRow(rowAnexo).getCell(1).value = 'ESTRUCTURA DE PARTICIPACIÓN ACCIONARIA:';
      wsAnexo.getRow(rowAnexo).getCell(1).font = { bold: true, size: 9 };
      rowAnexo++;
      rowAnexo++; // Espacio
    }

    // Headers de columnas
    const headerAnexoRow = wsAnexo.getRow(rowAnexo);
    config.columnas.forEach((col, index) => {
      const cell = headerAnexoRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true, size: 9, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 'FFE1F5FE' } }; // Azul pastel muy claro
      cell.border = borderThin;
      
      // Configurar ancho de columna basado en el porcentaje de width
      const widthPercent = parseInt(col.width) || 20;
      let excelWidth = 15; // Ancho por defecto
      
      if (widthPercent >= 50) {
        excelWidth = 50; // Columnas grandes (denominación, descripción)
      } else if (widthPercent >= 30) {
        excelWidth = 30; // Columnas medianas
      } else if (widthPercent >= 20) {
        excelWidth = 20; // Columnas normales
      } else {
        excelWidth = 15; // Columnas pequeñas
      }
      
      wsAnexo.getColumn(index + 1).width = excelWidth;
    });
    rowAnexo++;

    // Datos del anexo
    let totalAnexo = 0;
    datosAnexo.forEach(fila => {
      const dataRow = wsAnexo.getRow(rowAnexo);
      
      config.columnas.forEach((col, index) => {
        const cell = dataRow.getCell(index + 1);
        const valor = fila[col.field];
        
        if (col.tipo === 'monto' || col.tipo === 'cantidad') {
          if (valor !== null && valor !== undefined && valor !== '') {
            cell.value = Number(valor);
            cell.numFmt = '#,##0.00';
            
            // Sumar al total si es el campo principal
            if (col.field === 'saldo' || col.field === 'importe' || col.field === 'total' || col.field === 'costoTotal') {
              totalAnexo += Number(valor) || 0;
            }
          } else {
            cell.value = '';
          }
        } else if (col.tipo === 'porcentaje') {
          if (valor !== null && valor !== undefined && valor !== '') {
            cell.value = Number(valor) / 100;
            cell.numFmt = '0.00%';
          } else {
            cell.value = '';
          }
        } else {
          cell.value = valor || '';
        }
        
        cell.alignment = { horizontal: col.align, vertical: 'top' };
        cell.font = { size: 8, bold: fila.esGrupo ? true : false };
        cell.border = borderThin;
      });
      
      rowAnexo++;
    });

    rowAnexo++; // Espacio

    // Total del anexo
    const totalAnexoRow = wsAnexo.getRow(rowAnexo);
    totalAnexoRow.getCell(1).value = 'SALDO FINAL TOTAL';
    totalAnexoRow.getCell(1).font = { bold: true, size: 10 };
    totalAnexoRow.getCell(1).alignment = { horizontal: 'left' };
    totalAnexoRow.getCell(config.columnas.length).value = totalAnexo;
    totalAnexoRow.getCell(config.columnas.length).numFmt = '#,##0.00';
    totalAnexoRow.getCell(config.columnas.length).font = { bold: true, size: 10 };
    totalAnexoRow.getCell(config.columnas.length).alignment = { horizontal: 'right' };
    totalAnexoRow.getCell(config.columnas.length).fill = fillTotal;
    totalAnexoRow.getCell(config.columnas.length).border = borderThin;

    // Auto-ajustar columnas al contenido
    wsAnexo.columns.forEach((column, index) => {
      if (column && column.values) {
        let maxLength = 10;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        // Ajustar ancho con un mínimo de 15 y máximo de 60
        column.width = Math.min(Math.max(maxLength + 2, 15), 60);
      }
    });
  });

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
