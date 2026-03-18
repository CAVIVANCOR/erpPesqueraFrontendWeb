// src/components/cuentaCorriente/reports/generarMovimientosCuentaExcel.js
import ExcelJS from 'exceljs';

/**
 * Genera Excel del reporte de Movimientos por Cuenta
 * NOTA: Este es un placeholder.
 * @param {Object} data - Datos de movimientos
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarMovimientosCuentaExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Movimientos');

  worksheet.addRow(['REPORTE EN DESARROLLO']);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}