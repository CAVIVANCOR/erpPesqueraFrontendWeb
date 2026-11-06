// src/components/planilla/reports/generarAfpnetExcel.js
import ExcelJS from "exceljs";

// Columnas del modelo oficial "Declarar aportes" de AFPnet (17), en su orden y sin las filas de instrucciones del modelo
const COLUMNAS = [
  { campo: "secuencia", ancho: 10 },
  { campo: "cuspp", ancho: 16, texto: true },
  { campo: "tipoDocumento", ancho: 8 },
  { campo: "numeroDocumento", ancho: 14, texto: true }, // Texto: conserva los ceros a la izquierda
  { campo: "apellidoPaterno", ancho: 20 },
  { campo: "apellidoMaterno", ancho: 20 },
  { campo: "nombres", ancho: 26 },
  { campo: "relacionLaboral", ancho: 8 },
  { campo: "inicioRelacionLaboral", ancho: 8 },
  { campo: "ceseRelacionLaboral", ancho: 8 },
  { campo: "excepcionAportar", ancho: 8 },
  { campo: "remuneracionAsegurable", ancho: 14, decimal: true },
  { campo: "aporteVoluntarioConFinPrevisional", ancho: 10, decimal: true },
  { campo: "aporteVoluntarioSinFinPrevisional", ancho: 10, decimal: true },
  { campo: "aporteVoluntarioEmpleador", ancho: 10, decimal: true },
  { campo: "tipoTrabajo", ancho: 8 },
  { campo: "afp", ancho: 8 },
];

/**
 * Genera el Excel de AFPnet "Declarar aportes".
 * @param {Array} filas - Filas devueltas por GET /planillas/afpnet
 * @returns {Promise<Blob>} Excel generado
 */
export async function generarAfpnetExcel(filas) {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Declarar aportes");
  hoja.columns = COLUMNAS.map((columna) => ({ key: columna.campo, width: columna.ancho }));

  filas.forEach((fila) => hoja.addRow(fila));
  COLUMNAS.forEach((columna, indice) => {
    if (columna.texto) hoja.getColumn(indice + 1).numFmt = "@";
    if (columna.decimal) hoja.getColumn(indice + 1).numFmt = "0.00";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
