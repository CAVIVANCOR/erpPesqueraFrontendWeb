import ExcelJS from "exceljs";
import { formatearFecha } from "../../../utils/utils";

export async function generarRegistroVentasExcel(data) {
  const { empresa, periodo, preFacturas } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Registro de Ventas");

  worksheet.views = [{ showGridLines: true }];
  
  // Anchos de columna según formato SUNAT 14.1
  worksheet.getColumn(1).width = 12;  // Periodo
  worksheet.getColumn(2).width = 12;  // Correlativo
  worksheet.getColumn(3).width = 12;  // Fecha Emisión
  worksheet.getColumn(4).width = 12;  // Fecha Venc.
  worksheet.getColumn(5).width = 8;   // Tipo Doc
  worksheet.getColumn(6).width = 10;  // Serie
  worksheet.getColumn(7).width = 12;  // Número
  worksheet.getColumn(8).width = 12;  // Número Final
  worksheet.getColumn(9).width = 8;   // Tipo Doc Cliente
  worksheet.getColumn(10).width = 15; // Nro Doc Cliente
  worksheet.getColumn(11).width = 40; // Razón Social
  worksheet.getColumn(12).width = 12; // Exportación
  worksheet.getColumn(13).width = 12; // Base Gravada
  worksheet.getColumn(14).width = 12; // Descuento BI
  worksheet.getColumn(15).width = 12; // IGV
  worksheet.getColumn(16).width = 12; // Descuento IGV
  worksheet.getColumn(17).width = 12; // Exonerado
  worksheet.getColumn(18).width = 12; // Inafecto
  worksheet.getColumn(19).width = 12; // ISC
  worksheet.getColumn(20).width = 12; // Base Arroz
  worksheet.getColumn(21).width = 12; // Imp Arroz
  worksheet.getColumn(22).width = 12; // ICBPER
  worksheet.getColumn(23).width = 12; // Otros Tributos
  worksheet.getColumn(24).width = 12; // Total
  worksheet.getColumn(25).width = 8;  // Moneda
  worksheet.getColumn(26).width = 10; // T.C.
  worksheet.getColumn(27).width = 12; // Fecha Doc Modificado
  worksheet.getColumn(28).width = 8;  // Tipo Doc Modificado
  worksheet.getColumn(29).width = 10; // Serie Doc Modificado
  worksheet.getColumn(30).width = 12; // Nro Doc Modificado
  worksheet.getColumn(31).width = 15; // ID Contrato
  worksheet.getColumn(32).width = 8;  // Error Tipo 1
  worksheet.getColumn(33).width = 10; // Ind. Detracción
  worksheet.getColumn(34).width = 10; // Estado

  const borderThin = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const fillHeader = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };

  let currentRow = 1;

  // ENCABEZADO
  worksheet.mergeCells(`A${currentRow}:AH${currentRow}`);
  const cellTitulo = worksheet.getCell(`A${currentRow}`);
  cellTitulo.value = "REGISTRO DE VENTAS E INGRESOS - FORMATO 14.1";
  cellTitulo.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  cellTitulo.fill = fillHeader;
  cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:AH${currentRow}`);
  const cellEmpresa = worksheet.getCell(`A${currentRow}`);
  cellEmpresa.value = `RUC: ${empresa.ruc || ""} - ${empresa.razonSocial || ""}`;
  cellEmpresa.font = { bold: true, size: 11 };
  cellEmpresa.alignment = { horizontal: "center" };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:AH${currentRow}`);
  const cellPeriodo = worksheet.getCell(`A${currentRow}`);
  cellPeriodo.value = `Periodo: ${periodo.nombrePeriodo || ""}`;
  cellPeriodo.font = { size: 10 };
  cellPeriodo.alignment = { horizontal: "center" };
  currentRow++;

  currentRow++;

  // CABECERA DE COLUMNAS (SUNAT 14.1)
  const headers = [
    "Periodo", "Correlativo", "Correlativo", "Fecha Emisión", "Fecha Venc.", "Fecha Contable",
    "Tipo Doc", "Serie", "Año DUA", "Número", "Número Final", 
    "Tipo Doc Cliente", "Nro Doc Cliente", "Razón Social",
    "Exportación", "Base Gravada", "Descuento", "IGV", "Desc. IGV", "Exonerado", "Inafecto",
    "ISC", "Base Arroz", "Imp. Arroz", "ICBPER", "Otros Trib.", "Total", "Moneda", "T.C.",
    "Fecha Doc Mod.", "Tipo Doc Mod.", "Serie Doc Mod.", "Nro Doc Mod.", "ID Contrato",
    "Error Tipo 1", "Ind. Detrac.", "Estado", "Campo Libre"
  ];

  headers.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
    cell.fill = fillHeader;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = borderThin;
  });
  worksheet.getRow(currentRow).height = 30;
  currentRow++;

  // DATOS
  let correlativo = 1;
  preFacturas.forEach(pf => {
    const fechaDoc = pf.fechaDocumento ? new Date(pf.fechaDocumento) : null;
    const fechaCont = pf.fechaContable ? new Date(pf.fechaContable) : null;
    const periodo = fechaCont ? `${fechaCont.getFullYear()}${String(fechaCont.getMonth() + 1).padStart(2, '0')}00` : "";
    const fechaEmision = fechaDoc ? formatearFecha(pf.fechaDocumento) : "";
    const fechaVenc = pf.fechaVencimiento ? formatearFecha(pf.fechaVencimiento) : "";
    const fechaContable = fechaCont ? formatearFecha(pf.fechaContable) : "";
    
    const tipoDocCodigo = pf.tipoDocumentoFinal?.codigoSunat || "";
    
    // Usar campos *PEN calculados por el backend (ya vienen convertidos)
    let subtotalPEN = Number(pf.subtotalPEN || pf.subtotal || 0);
    let totalDescuentosPEN = Number(pf.totalDescuentosPEN || pf.totalDescuentos || 0);
    let totalIGVPEN = Number(pf.totalIGVPEN || pf.totalIGV || 0);
    let totalPEN = Number(pf.totalPEN || pf.total || 0);
    
    // Si es Nota de Crédito (07), los montos deben ser negativos
    if (tipoDocCodigo === "07") {
      subtotalPEN = Math.abs(subtotalPEN) * -1;
      totalDescuentosPEN = Math.abs(totalDescuentosPEN) * -1;
      totalIGVPEN = Math.abs(totalIGVPEN) * -1;
      totalPEN = Math.abs(totalPEN) * -1;
    }
    
    const esExportacion = pf.tipoOperacionSunat?.codigo === "0200";
    const valorExportacion = esExportacion ? totalPEN : 0;
    const baseGravada = !pf.exoneradoIgv && !esExportacion ? subtotalPEN : 0;
    const exonerado = pf.exoneradoIgv ? subtotalPEN : 0;
    
    // Estado SUNAT: 
    // 1 = Comprobante válido (EMITIDA=96, FACTURADA=95, CE GENERADO=97, VALIDADO SUNAT=98)
    // 2 = Comprobante anulado (ANULADA=47, NO VALIDADO SUNAT=99)
    let estadoSunat = "";
    const estadoId = Number(pf.estadoId);
    if ([95, 96, 97, 98].includes(estadoId)) {
      estadoSunat = "1"; // Válido
    } else if ([47, 99].includes(estadoId)) {
      estadoSunat = "2"; // Anulado
    }
    
    // Documento modificado (para NC/ND)
    const esNCND = ["07", "08"].includes(tipoDocCodigo);
    
    const fechaDocMod = esNCND && pf.fechaDcmtoAfectoNCND ? formatearFecha(pf.fechaDcmtoAfectoNCND) : "";
    const tipoDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.tipoDocumentoFinal?.codigoSunat || "" : "";
    const serieDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numSerieDocFinal || "" : "";
    const nroDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numCorreDocFinal || "" : "";

    worksheet.getCell(currentRow, 1).value = periodo;
    worksheet.getCell(currentRow, 2).value = `M${String(correlativo).padStart(9, '0')}`;
    worksheet.getCell(currentRow, 3).value = `M${String(correlativo).padStart(9, '0')}`;
    worksheet.getCell(currentRow, 4).value = fechaEmision;
    worksheet.getCell(currentRow, 5).value = fechaVenc;
    worksheet.getCell(currentRow, 6).value = fechaContable;
    worksheet.getCell(currentRow, 7).value = tipoDocCodigo;
    worksheet.getCell(currentRow, 8).value = pf.numSerieDocFinal || "";
    worksheet.getCell(currentRow, 9).value = ""; // Año DUA
    worksheet.getCell(currentRow, 10).value = pf.numCorreDocFinal || "";
    worksheet.getCell(currentRow, 11).value = pf.numCorreDocFinal || ""; // Número final (mismo)
    worksheet.getCell(currentRow, 12).value = pf.cliente?.tipoDocumento?.codSunat || "";
    worksheet.getCell(currentRow, 13).value = pf.cliente?.numeroDocumento || "";
    worksheet.getCell(currentRow, 14).value = pf.cliente?.razonSocial || "";
    worksheet.getCell(currentRow, 15).value = valorExportacion;
    worksheet.getCell(currentRow, 15).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 16).value = baseGravada;
    worksheet.getCell(currentRow, 16).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 17).value = totalDescuentosPEN;
    worksheet.getCell(currentRow, 17).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 18).value = totalIGVPEN;
    worksheet.getCell(currentRow, 18).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 19).value = 0; // Descuento IGV
    worksheet.getCell(currentRow, 19).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 20).value = exonerado;
    worksheet.getCell(currentRow, 20).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 21).value = 0; // Inafecto
    worksheet.getCell(currentRow, 21).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 22).value = 0; // ISC
    worksheet.getCell(currentRow, 22).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 23).value = 0; // Base Arroz
    worksheet.getCell(currentRow, 23).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 24).value = 0; // Imp Arroz
    worksheet.getCell(currentRow, 24).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 25).value = 0; // ICBPER
    worksheet.getCell(currentRow, 25).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 26).value = 0; // Otros tributos
    worksheet.getCell(currentRow, 26).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 27).value = totalPEN;
    worksheet.getCell(currentRow, 27).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 28).value = pf.moneda?.codigoSunat || "PEN";
    worksheet.getCell(currentRow, 29).value = Number(pf.tipoCambio || 1);
    worksheet.getCell(currentRow, 29).numFmt = '0.000';
    worksheet.getCell(currentRow, 30).value = fechaDocMod;
    worksheet.getCell(currentRow, 31).value = tipoDocMod;
    worksheet.getCell(currentRow, 32).value = serieDocMod;
    worksheet.getCell(currentRow, 33).value = nroDocMod;
    worksheet.getCell(currentRow, 34).value = pf.contratoServicioId || "";
    worksheet.getCell(currentRow, 35).value = ""; // Error tipo 1
    worksheet.getCell(currentRow, 36).value = pf.aplicaDetraccion ? "1" : ""; // SUNAT: 1=Sí, vacío=No
    worksheet.getCell(currentRow, 37).value = estadoSunat;
    worksheet.getCell(currentRow, 38).value = ""; // Campo Libre

    for (let col = 1; col <= 38; col++) {
      worksheet.getCell(currentRow, col).border = borderThin;
      worksheet.getCell(currentRow, col).font = { size: 9 };
    }

    currentRow++;
    correlativo++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}