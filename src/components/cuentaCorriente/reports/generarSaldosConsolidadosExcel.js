// src/components/cuentaCorriente/reports/generarSaldosConsolidadosExcel.js
import ExcelJS from 'exceljs';

/**
 * Genera Excel del reporte de Saldos Consolidados
 * NOTA: Este es un placeholder.
 * @param {Object} data - Datos de saldos
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarSaldosConsolidadosExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Saldos Consolidados');

  worksheet.addRow(['REPORTE EN DESARROLLO']);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}