import ExcelJS from "exceljs";
import { formatearFecha } from "../../../utils/utils";

export async function generarRegistroComprasExcel(data) {
  const { empresa, periodo, ordenesCompra } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Registro de Compras");

  worksheet.views = [{ showGridLines: true }];
  
  // Anchos de columna según formato SUNAT 8.1
  worksheet.getColumn(1).width = 12;  // Periodo
  worksheet.getColumn(2).width = 12;  // Correlativo
  worksheet.getColumn(3).width = 12;  // Fecha Emisión
  worksheet.getColumn(4).width = 12;  // Fecha Venc.
  worksheet.getColumn(5).width = 8;   // Tipo Doc
  worksheet.getColumn(6).width = 10;  // Serie
  worksheet.getColumn(7).width = 12;  // Año DUA
  worksheet.getColumn(8).width = 12;  // Número
  worksheet.getColumn(9).width = 8;   // Número Final
  worksheet.getColumn(10).width = 8;  // Tipo Doc Proveedor
  worksheet.getColumn(11).width = 15; // Nro Doc Proveedor
  worksheet.getColumn(12).width = 40; // Razón Social
  worksheet.getColumn(13).width = 12; // Base Gravada
  worksheet.getColumn(14).width = 12; // IGV
  worksheet.getColumn(15).width = 12; // Base No Gravada
  worksheet.getColumn(16).width = 12; // ISC
  worksheet.getColumn(17).width = 12; // ICBPER
  worksheet.getColumn(18).width = 12; // Otros Tributos
  worksheet.getColumn(19).width = 12; // Total
  worksheet.getColumn(20).width = 8;  // Moneda
  worksheet.getColumn(21).width = 10; // T.C.
  worksheet.getColumn(22).width = 12; // Fecha Emisión Doc Modificado
  worksheet.getColumn(23).width = 8;  // Tipo Doc Modificado
  worksheet.getColumn(24).width = 10; // Serie Doc Modificado
  worksheet.getColumn(25).width = 15; // Cod DUA Modificado
  worksheet.getColumn(26).width = 12; // Nro Doc Modificado
  worksheet.getColumn(27).width = 12; // Fecha Detracción
  worksheet.getColumn(28).width = 12; // Nro Detracción
  worksheet.getColumn(29).width = 12; // Marca Retención
  worksheet.getColumn(30).width = 15; // Clasificación Bienes
  worksheet.getColumn(31).width = 15; // ID Contrato
  worksheet.getColumn(32).width = 8;  // Error Tipo 1
  worksheet.getColumn(33).width = 8;  // Error Tipo 2
  worksheet.getColumn(34).width = 8;  // Error Tipo 3
  worksheet.getColumn(35).width = 8;  // Error Tipo 4
  worksheet.getColumn(36).width = 15; // Ind. Comprobante Pago
  worksheet.getColumn(37).width = 10; // Estado
  worksheet.getColumn(38).width = 15; // Campo Libre 1
  worksheet.getColumn(39).width = 15; // Campo Libre 2
  worksheet.getColumn(40).width = 15; // Campo Libre 3
  worksheet.getColumn(41).width = 15; // Campo Libre 4

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
  worksheet.mergeCells(`A${currentRow}:AO${currentRow}`);
  const cellTitulo = worksheet.getCell(`A${currentRow}`);
  cellTitulo.value = "REGISTRO DE COMPRAS - FORMATO 8.1";
  cellTitulo.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  cellTitulo.fill = fillHeader;
  cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:AO${currentRow}`);
  const cellEmpresa = worksheet.getCell(`A${currentRow}`);
  cellEmpresa.value = `RUC: ${empresa.ruc || ""} - ${empresa.razonSocial || ""}`;
  cellEmpresa.font = { bold: true, size: 11 };
  cellEmpresa.alignment = { horizontal: "center" };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:AO${currentRow}`);
  const cellPeriodo = worksheet.getCell(`A${currentRow}`);
  cellPeriodo.value = `Periodo: ${periodo.nombrePeriodo || ""}`;
  cellPeriodo.font = { size: 10 };
  cellPeriodo.alignment = { horizontal: "center" };
  currentRow++;

  currentRow++;

  // CABECERA DE COLUMNAS (41 campos SUNAT 8.1)
  const headers = [
    "Periodo", "Correlativo", "Correlativo", "Fecha Emisión", "Fecha Venc.", "Fecha Contable",
    "Tipo Doc", "Serie", "Año DUA", "Número", "Número Final", 
    "Tipo Doc Prov", "Nro Doc Prov", "Razón Social",
    "Base Gravada", "IGV", "Base No Grav.", "ISC", "Exonerado", "Inafecto", "ISC", "Base Grav. IVAP", "IVAP", "ICBPER", "Otros Trib.",
    "Total", "Moneda", "T.C.",
    "Fecha Emis. Mod", "Tipo Doc Mod", "Serie Doc Mod", "Cod DUA Mod", "Nro Doc Mod",
    "Fecha Detrac.", "Tipo Operación", "Clasif. Bienes", "ID Contrato", "Error 1", "Error 2", "Error 3", "Error 4", "Ind. CP", "Estado", "Campo Libre"
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
  ordenesCompra.forEach(oc => {
    const fechaDoc = oc.fechaDocumento ? new Date(oc.fechaDocumento) : null;
    const fechaCont = oc.fechaContable ? new Date(oc.fechaContable) : null;
    const periodo = fechaCont ? `${fechaCont.getFullYear()}${String(fechaCont.getMonth() + 1).padStart(2, '0')}00` : "";
    const fechaEmision = fechaDoc ? formatearFecha(oc.fechaDocumento) : "";
    const fechaVenc = oc.fechaVencimiento ? formatearFecha(oc.fechaVencimiento) : "";
    const fechaContable = fechaCont ? formatearFecha(oc.fechaContable) : "";
    
    const baseGravada = !oc.esExoneradoAlIGV ? Number(oc.subtotal || 0) : 0;
    const baseNoGravada = oc.esExoneradoAlIGV ? Number(oc.subtotal || 0) : 0;
    
    // Estado SUNAT: 
    // 1 = Comprobante válido
    // 2 = Comprobante anulado
    let estadoSunat = "";
    const estadoId = Number(oc.estadoId);
    if ([39, 40, 41].includes(estadoId)) {
      estadoSunat = "1"; // Válido (APROBADA=39, RECIBIDA=40, PAGADA=41)
    } else if ([42].includes(estadoId)) {
      estadoSunat = "2"; // Anulado (ANULADA=42)
    }
    
    // Documento modificado (para NC/ND)
    const tipoDocCodigo = oc.tipoDocumentoFinal?.codigo || "";
    const esNCND = ["07", "08", "NC", "ND"].includes(tipoDocCodigo);
    
    const fechaDocMod = esNCND && oc.fechaDcmtoAfectoNCND ? formatearFecha(oc.fechaDcmtoAfectoNCND) : "";
    const tipoDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.tipoDocumentoFinal?.codigo || "" : "";
    const serieDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.numSerieDocFinal || "" : "";
    const nroDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.numCorreDocFinal || "" : "";

    worksheet.getCell(currentRow, 1).value = periodo;
    worksheet.getCell(currentRow, 2).value = `M${String(correlativo).padStart(9, '0')}`;
    worksheet.getCell(currentRow, 3).value = `M${String(correlativo).padStart(9, '0')}`;
    worksheet.getCell(currentRow, 4).value = fechaEmision;
    worksheet.getCell(currentRow, 5).value = fechaVenc;
    worksheet.getCell(currentRow, 6).value = fechaContable;
    worksheet.getCell(currentRow, 7).value = tipoDocCodigo;
    worksheet.getCell(currentRow, 8).value = oc.numSerieDocFinal || "";
    worksheet.getCell(currentRow, 9).value = ""; // Año DUA
    worksheet.getCell(currentRow, 10).value = oc.numCorreDocFinal || "";
    worksheet.getCell(currentRow, 11).value = ""; // Número final consolidado
    worksheet.getCell(currentRow, 12).value = oc.proveedor?.tipoDocumento?.codSunat || "";
    worksheet.getCell(currentRow, 13).value = oc.proveedor?.numeroDocumento || "";
    worksheet.getCell(currentRow, 14).value = oc.proveedor?.razonSocial || "";
    worksheet.getCell(currentRow, 15).value = baseGravada;
    worksheet.getCell(currentRow, 15).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 16).value = Number(oc.totalIGV || 0);
    worksheet.getCell(currentRow, 16).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 17).value = 0; // Base No Gravada
    worksheet.getCell(currentRow, 17).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 18).value = 0; // ISC
    worksheet.getCell(currentRow, 18).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 19).value = baseNoGravada; // Exonerado
    worksheet.getCell(currentRow, 19).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 20).value = 0; // Inafecto
    worksheet.getCell(currentRow, 20).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 21).value = 0; // ISC
    worksheet.getCell(currentRow, 21).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 22).value = 0; // Base Grav IVAP
    worksheet.getCell(currentRow, 22).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 23).value = 0; // IVAP
    worksheet.getCell(currentRow, 23).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 24).value = 0; // ICBPER
    worksheet.getCell(currentRow, 24).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 25).value = 0; // Otros Tributos
    worksheet.getCell(currentRow, 25).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 26).value = Number(oc.total || 0);
    worksheet.getCell(currentRow, 26).numFmt = '#,##0.00';
    worksheet.getCell(currentRow, 27).value = oc.moneda?.codigoSunat || "";
    worksheet.getCell(currentRow, 28).value = Number(oc.tipoCambio || 0);
    worksheet.getCell(currentRow, 28).numFmt = '0.000';
    worksheet.getCell(currentRow, 29).value = fechaDocMod;
    worksheet.getCell(currentRow, 30).value = tipoDocMod;
    worksheet.getCell(currentRow, 31).value = serieDocMod;
    worksheet.getCell(currentRow, 32).value = ""; // Cod DUA Modificado
    worksheet.getCell(currentRow, 33).value = nroDocMod;
    worksheet.getCell(currentRow, 34).value = ""; // Fecha Detracción
    worksheet.getCell(currentRow, 35).value = "01"; // Tipo Operación
    worksheet.getCell(currentRow, 36).value = ""; // Clasificación Bienes
    worksheet.getCell(currentRow, 37).value = ""; // ID Contrato
    worksheet.getCell(currentRow, 38).value = ""; // Error 1
    worksheet.getCell(currentRow, 39).value = ""; // Error 2
    worksheet.getCell(currentRow, 40).value = ""; // Error 3
    worksheet.getCell(currentRow, 41).value = ""; // Error 4
    worksheet.getCell(currentRow, 42).value = ""; // Ind. Comprobante Pago
    worksheet.getCell(currentRow, 43).value = estadoSunat;
    worksheet.getCell(currentRow, 44).value = ""; // Campo Libre

    for (let col = 1; col <= 44; col++) {
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
