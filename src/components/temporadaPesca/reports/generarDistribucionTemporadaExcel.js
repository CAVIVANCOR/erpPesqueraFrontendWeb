// src/components/temporadaPesca/reports/generarDistribucionTemporadaExcel.js
import ExcelJS from 'exceljs';

/**
 * Genera Excel del reporte de Distribución de Embarcaciones Temporada Pesca
 * @param {Object} data - Datos de la temporada y cuotas
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarDistribucionTemporadaExcel(data) {
  const { temporada, cuotas } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Distribución Temporada');
  
  // Desactivar líneas de cuadrícula (gridlines)
  worksheet.views = [
    { showGridLines: false }
  ];

  
  const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);

  let currentRow = 1;

  // HEADER - Datos de la empresa
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const empresaCell = worksheet.getCell(`A${currentRow}`);
  empresaCell.value = temporada.empresa?.razonSocial || "EMPRESA";
  empresaCell.font = { bold: true, size: 12 };
  empresaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const rucCell = worksheet.getCell(`A${currentRow}`);
  rucCell.value = `RUC: ${temporada.empresa?.ruc || "-"}`;
  rucCell.font = { size: 10 };
  rucCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  if (temporada.empresa?.direccion) {
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const dirCell = worksheet.getCell(`A${currentRow}`);
    dirCell.value = `Dirección: ${temporada.empresa.direccion}`;
    dirCell.font = { size: 10 };
    dirCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;
  }

  currentRow++; // Línea en blanco

  // TÍTULOS
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const titulo1Cell = worksheet.getCell(`A${currentRow}`);
  titulo1Cell.value = "DISTRIBUCION EMBARCACIONES TEMPORADA PESCA INDUSTRIAL";
  titulo1Cell.font = { bold: true, size: 11 };
  titulo1Cell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const nombreCell = worksheet.getCell(`A${currentRow}`);
  nombreCell.value = temporada.nombre || "NOMBRE TEMPORADA";
  nombreCell.font = { bold: true, size: 14 };
  nombreCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const limiteCell = worksheet.getCell(`A${currentRow}`);
  limiteCell.value = `Maxima Captura Temporada: ${limiteMaximo.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Ton.`;
  limiteCell.font = { bold: true, size: 10 };
  limiteCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  currentRow++; // Línea en blanco

  // ENCABEZADOS DE TABLA
  const headerRow = worksheet.getRow(currentRow);
  const headers = ["N°", "Zona", "Tipo Cuota", "Estado Op.", "Embarcacion", "Precio/Ton USD", "PMCE (%)", "Limite Ton."];
  
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FF000000' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFADD8E6' } // Azul claro
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  currentRow++;

  // Anchos de columnas
  worksheet.columns = [
    { width: 6 },   // N°
    { width: 10 },  // Zona
    { width: 14 },  // Tipo Cuota
    { width: 13 },  // Estado Op.
    { width: 35 },  // Embarcación
    { width: 18 },  // Precio/Ton USD
    { width: 14 },  // PMCE (%)
    { width: 20 }   // Limite Ton.
  ];

  // Agrupar cuotas SOLO por Zona
  const grupos = {};
  cuotas.forEach((cuota) => {
    const zona = cuota.zona || "SIN ZONA";
    if (!grupos[zona]) {
      grupos[zona] = [];
    }
    grupos[zona].push(cuota);
  });

  // Ordenar grupos: NORTE primero, luego SUR
  const zonasOrdenadas = Object.keys(grupos).sort((a, b) => {
    if (a === "NORTE") return -1;
    if (b === "NORTE") return 1;
    return a.localeCompare(b);
  });

  let totalGeneral = 0;
  let numeroFila = 1;

  // Dibujar cada zona
  for (const zona of zonasOrdenadas) {
    let subtotalZona = 0;

    // Ordenar cuotas dentro de la zona: PROPIA primero, luego por Estado Op. y ID
    const cuotasOrdenadas = grupos[zona].sort((a, b) => {
      if (a.cuotaPropia !== b.cuotaPropia) return b.cuotaPropia ? 1 : -1;
      if (a.esAlquiler !== b.esAlquiler) return a.esAlquiler ? 1 : -1;
      return Number(a.id) - Number(b.id);
    });

    for (const cuota of cuotasOrdenadas) {
      const porcentaje = Number(cuota.porcentajeCuota || 0);
      const precio = Number(cuota.precioPorTonDolares || 0);
      const limite = limiteMaximo * (porcentaje / 100);
      subtotalZona += limite;
      totalGeneral += limite;

      const tipoCuota = cuota.cuotaPropia ? "PROPIA" : "ALQUILADA";

      const dataRow = worksheet.getRow(currentRow);
      dataRow.values = [
        numeroFila,
        cuota.zona || "-",
        tipoCuota,
        cuota.esAlquiler ? "ALQUILER" : "PESCA",
        cuota.nombre || "-",
        Number(precio.toFixed(2)),
        Number(porcentaje.toFixed(6)),
        limite.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " Ton."
      ];

      // Aplicar bordes y alineación
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        
        // Centrar columnas específicas
        if (colNumber === 1 || colNumber === 6 || colNumber === 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 8) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        // Fondo alternado
        if (numeroFila % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          };
        }
      });

      numeroFila++;
      currentRow++;
    }

    // SUBTOTAL de la zona
    const subtotalRow = worksheet.getRow(currentRow);
    subtotalRow.values = [
      "", "", "", "", "", `Subtotal ${zona}`, "", 
      subtotalZona.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " Ton."
    ];

    subtotalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EDF7' } // Azul claro para subtotales
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      if (colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 8) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    currentRow++;
  }

  // TOTAL GENERAL
  const totalRow = worksheet.getRow(currentRow);
  totalRow.values = [
    "", "", "", "", "", "Total", "", 
    totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " Ton."
  ];

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFADD8E6' } // Azul claro para total
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    
    if (colNumber === 6) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (colNumber === 8) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}