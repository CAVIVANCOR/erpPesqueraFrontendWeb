// src/components/activo/reports/generarActivosExcel.js
import * as XLSX from "xlsx";

/**
 * Genera Excel del reporte de Activos ordenado por Empresa y Tipo
 * @param {Object} data - Datos de los activos
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarActivosExcel(data) {
  const { activos, empresas, tiposActivo, fechaGeneracion } = data;

  // Ordenar activos por empresa y tipo
  const activosOrdenados = [...activos].sort((a, b) => {
    const empresaA = empresas.find(e => Number(e.id) === Number(a.empresaId))?.razonSocial || "";
    const empresaB = empresas.find(e => Number(e.id) === Number(b.empresaId))?.razonSocial || "";
    
    if (empresaA !== empresaB) {
      return empresaA.localeCompare(empresaB);
    }
    
    const tipoA = a.tipo?.nombre || "";
    const tipoB = b.tipo?.nombre || "";
    return tipoA.localeCompare(tipoB);
  });

  // Preparar datos para Excel
  const excelData = activosOrdenados.map((activo, index) => {
    const empresa = empresas.find(e => Number(e.id) === Number(activo.empresaId));
    
    return {
      "N°": index + 1,
      "ID": activo.id,
      "Empresa": empresa?.razonSocial || "N/A",
      "Tipo de Activo": activo.tipo?.nombre || "N/A",
      "Nombre": activo.nombre || "N/A",
      "Descripción": activo.descripcion || "-",
      "Estado": activo.cesado ? "CESADO" : "ACTIVO",
      "Fecha Creación": activo.createdAt ? new Date(activo.createdAt).toLocaleDateString("es-PE") : "-",
      "Fecha Actualización": activo.updatedAt ? new Date(activo.updatedAt).toLocaleDateString("es-PE") : "-",
    };
  });

  // Crear hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Configurar anchos de columna
  worksheet["!cols"] = [
    { wch: 5 },   // N°
    { wch: 8 },   // ID
    { wch: 35 },  // Empresa
    { wch: 25 },  // Tipo de Activo
    { wch: 30 },  // Nombre
    { wch: 40 },  // Descripción
    { wch: 12 },  // Estado
    { wch: 18 },  // Fecha Creación
    { wch: 18 },  // Fecha Actualización
  ];

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activos");

  // Agregar hoja de resumen
  const resumenData = [
    { Campo: "Total de Activos", Valor: activos.length },
    { Campo: "Activos Activos", Valor: activos.filter(a => !a.cesado).length },
    { Campo: "Activos Cesados", Valor: activos.filter(a => a.cesado).length },
  ];

  const worksheetResumen = XLSX.utils.json_to_sheet(resumenData);
  worksheetResumen["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, worksheetResumen, "Resumen");

  // Generar archivo Excel
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}