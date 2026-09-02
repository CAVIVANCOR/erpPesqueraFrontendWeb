import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearFecha, formatearNumero } from "../../../utils/utils";

export async function generarRegistroVentasPDF(data) {
  const { empresa, periodo, preFacturas } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 8;
  const pageWidth = 841.89;  // A4 Horizontal
  const pageHeight = 595.28;
  const usableWidth = pageWidth - 2 * margin;
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;

  // Colores
  const headerColor = rgb(0.27, 0.45, 0.77); // Azul
  const evenRowColor = rgb(0.95, 0.95, 0.95); // Gris claro
  const gridColor = rgb(0.5, 0.5, 0.5);

  // Calcular total de páginas
  const totalPages = Math.ceil(preFacturas.length / Math.floor((pageHeight - 100) / 9));

  // TÍTULO
  const titulo = "REGISTRO DE VENTAS E INGRESOS - FORMATO 14.1";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 10);
  currentPage.drawRectangle({
    x: 0,
    y: yPos - 14,
    width: pageWidth,
    height: 16,
    color: headerColor,
  });
  currentPage.drawText(titulo, {
    x: (pageWidth - tituloWidth) / 2,
    y: yPos - 10,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  yPos -= 20;

  // PAGINACIÓN en primera página
  const paginacion1 = `Pág. 1 de ${totalPages}`;
  const paginacionWidth1 = fontNormal.widthOfTextAtSize(paginacion1, 7);
  currentPage.drawText(paginacion1, {
    x: pageWidth - margin - paginacionWidth1,
    y: yPos,
    size: 7,
    font: fontNormal,
  });

  // EMPRESA
  currentPage.drawText(`RUC: ${empresa.ruc || ""} - ${empresa.razonSocial || ""}`, {
    x: margin,
    y: yPos,
    size: 7,
    font: fontBold,
  });
  yPos -= 12;

  // PERIODO
  currentPage.drawText(`Periodo: ${periodo.nombrePeriodo || ""}`, {
    x: margin,
    y: yPos,
    size: 6,
    font: fontNormal,
  });
  yPos -= 14;

  // ═══════════════════════════════════════════════════════════════════════════
  // CABECERA PDF - REGISTRO DE VENTAS SUNAT (Formato 14.1)
  // ═══════════════════════════════════════════════════════════════════════════
  // 29 columnas (agregada "Inafecto" para evitar duplicación con Exportación):
  // - Export.: Valor Exportación (código 40 + operación 02XX)
  // - Base Grav.: Base Imponible Gravada (códigos 10-17)
  // - Desc.: Descuento Base Imponible
  // - IGV: Impuesto General a las Ventas (solo gravados)
  // - D.IGV: Descuento IGV
  // - Exon.: Exonerado (códigos 20-21, NUNCA exportación)
  // - Inaf.: Inafecto (códigos 30-36)
  // ═══════════════════════════════════════════════════════════════════════════
  const headers = [
    "Periodo", "Correlativo", "F.Emis", "F.Venc", "F.Cont", "T.Doc",
    "Serie", "Número", "N.Final", "T.Doc\nCli", "Nro Doc\nCliente", "Razón Social",
    "Export.", "Base\nGrav.", "Desc.", "IGV", "D.IGV", "Exon.", "Inaf.",
    "Total", "Mon", "T.C.", "F.D.Mod", "T.D.M", "S.D.M", "N.D.M",
    "Contr", "Det", "Est"
  ];
  
  // Anchos balanceados para 825px (29 columnas - agregada "Inafecto")
  const colWidths = [
    25, 38, 28, 28, 28, 18,  // Periodo, Correlativo, F.Emis, F.Venc, F.Cont, T.Doc
    24, 28, 24, 18, 40, 110,  // Serie, Número, N.Final, T.Doc Cli, Nro Doc Cli, Razón Social
    30, 34, 22, 34, 22, 30, 30,  // Export, Base Grav, Desc, IGV, D.IGV, Exon, Inaf (ajustado)
    36, 18, 24, 28, 18, 24, 28,  // Total, Mon, T.C., F.D.Mod, T.D.M, S.D.M, N.D.M
    28, 18, 20  // Contr, Det, Est
  ];
  
  let xPos = margin;
  const headerHeight = 18;

  // Fondo de cabecera
  currentPage.drawRectangle({
    x: margin,
    y: yPos - headerHeight,
    width: usableWidth,
    height: headerHeight,
    color: headerColor,
  });

  // Headers
  headers.forEach((header, i) => {
    currentPage.drawLine({
      start: { x: xPos, y: yPos },
      end: { x: xPos, y: yPos - headerHeight },
      thickness: 0.5,
      color: rgb(1, 1, 1),
    });

    const lines = header.split('\n');
    const startY = yPos - 7 - ((lines.length - 1) * 2.5);
    lines.forEach((line, lineIndex) => {
      const textWidth = fontBold.widthOfTextAtSize(line, 5.5);
      currentPage.drawText(line, {
        x: xPos + (colWidths[i] - textWidth) / 2,
        y: startY - (lineIndex * 5.5),
        size: 5.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    });
    
    xPos += colWidths[i];
  });

  currentPage.drawLine({
    start: { x: xPos, y: yPos },
    end: { x: xPos, y: yPos - headerHeight },
    thickness: 0.5,
    color: rgb(1, 1, 1),
  });

  currentPage.drawLine({
    start: { x: margin, y: yPos },
    end: { x: xPos, y: yPos },
    thickness: 0.5,
    color: rgb(1, 1, 1),
  });
  currentPage.drawLine({
    start: { x: margin, y: yPos - headerHeight },
    end: { x: xPos, y: yPos - headerHeight },
    thickness: 0.5,
    color: rgb(1, 1, 1),
  });

  yPos -= headerHeight;

  // DATOS
  let rowIndex = 0;
  let correlativo = 1;
  let pageNumber = 1;
  
  // Función para dibujar encabezado de página
  const drawPageHeader = (page, pageNum) => {
    let headerY = pageHeight - margin;
    
    // Paginación en esquina superior derecha
    const paginacion = `Pág. ${pageNum} de ${totalPages}`;
    const paginacionWidth = fontNormal.widthOfTextAtSize(paginacion, 7);
    page.drawText(paginacion, {
      x: pageWidth - margin - paginacionWidth,
      y: headerY,
      size: 7,
      font: fontNormal,
    });
    headerY -= 12;
    
    // Empresa
    page.drawText(`RUC: ${empresa.ruc || ""} - ${empresa.razonSocial || ""}`, {
      x: margin,
      y: headerY,
      size: 7,
      font: fontBold,
    });
    headerY -= 12;
    
    // Periodo
    page.drawText(`Periodo: ${periodo.nombrePeriodo || ""}`, {
      x: margin,
      y: headerY,
      size: 6,
      font: fontNormal,
    });
    headerY -= 14;
    
    // Cabecera de columnas
    const localHeaderHeight = 18;
    page.drawRectangle({
      x: margin,
      y: headerY - localHeaderHeight,
      width: usableWidth,
      height: localHeaderHeight,
      color: headerColor,
    });
    
    let localXPos = margin;
    headers.forEach((header, i) => {
      page.drawLine({
        start: { x: localXPos, y: headerY },
        end: { x: localXPos, y: headerY - localHeaderHeight },
        thickness: 0.5,
        color: rgb(1, 1, 1),
      });
      
      const lines = header.split('\n');
      const startY = headerY - 7 - ((lines.length - 1) * 2.5);
      lines.forEach((line, lineIndex) => {
        const textWidth = fontBold.widthOfTextAtSize(line, 5.5);
        page.drawText(line, {
          x: localXPos + (colWidths[i] - textWidth) / 2,
          y: startY - (lineIndex * 5.5),
          size: 5.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      });
      
      localXPos += colWidths[i];
    });
    
    page.drawLine({
      start: { x: localXPos, y: headerY },
      end: { x: localXPos, y: headerY - localHeaderHeight },
      thickness: 0.5,
      color: rgb(1, 1, 1),
    });
    
    page.drawLine({
      start: { x: margin, y: headerY },
      end: { x: localXPos, y: headerY },
      thickness: 0.5,
      color: rgb(1, 1, 1),
    });
    page.drawLine({
      start: { x: margin, y: headerY - localHeaderHeight },
      end: { x: localXPos, y: headerY - localHeaderHeight },
      thickness: 0.5,
      color: rgb(1, 1, 1),
    });
    
    return headerY - localHeaderHeight;
  };
  
  preFacturas.forEach(pf => {
    const rowHeight = 9;
    
    if (yPos < 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      yPos = drawPageHeader(currentPage, pageNumber);
      rowIndex = 0;
    }

    if (rowIndex % 2 === 0) {
      currentPage.drawRectangle({
        x: margin,
        y: yPos - rowHeight,
        width: usableWidth,
        height: rowHeight,
        color: evenRowColor,
      });
    }

    // Fecha de emisión SUNAT = fechaFacturacion (comprobante emitido), no fechaDocumento (PreFactura interna)
    const fechaDoc = pf.fechaFacturacion ? new Date(pf.fechaFacturacion) : null;
    const fechaCont = pf.fechaContable ? new Date(pf.fechaContable) : null;
    const periodo = fechaCont ? `${fechaCont.getFullYear()}${String(fechaCont.getMonth() + 1).padStart(2, '0')}00` : "";
    const correlativoStr = `M${String(correlativo).padStart(9, '0')}`;
    const fechaEmision = fechaDoc ? formatearFecha(pf.fechaFacturacion) : "";
    const fechaVenc = pf.fechaVencimiento ? formatearFecha(pf.fechaVencimiento) : "";
    const fechaContable = fechaCont ? formatearFecha(pf.fechaContable) : "";
    
    const tipoDocCodigo = pf.tipoDocumentoFinal?.codigoSunat || "";
    const serie = pf.numSerieDocFinal || "";
    const numero = pf.numCorreDocFinal || "";
    const tipoDocCliente = pf.cliente?.tipoDocumento?.codSunat || "";
    const nroDocCliente = pf.cliente?.numeroDocumento || "";
    const razonSocial = (pf.cliente?.razonSocial || "").substring(0, 28);
    
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CLASIFICACIÓN TRIBUTARIA PARA REGISTRO DE VENTAS SUNAT (Formato 14.1)
    // ═══════════════════════════════════════════════════════════════════════════
    // Se utilizan DOS campos para clasificar correctamente las operaciones:
    // 1. tipoOperacionSunat: Define el tipo de operación (PRIORIDAD para Exportación)
    // 2. tipoAfectacionIGV: Define el tratamiento del IGV (catálogo 07 SUNAT)
    //
    // REGLAS DE CLASIFICACIÓN (según normativa SUNAT):
    // - EXPORTACIÓN: Determinada por Tipo Operación 02XX (independiente de afectación)
    // - GRAVADO (10-17): Base Imponible + IGV (solo ventas internas)
    // - EXONERADO (20-21): Solo si NO es exportación (evitar duplicación)
    // - INAFECTO (30-36): Solo ventas internas
    //
    // IMPORTANTE: La columna EXPORTACIÓN se determina ÚNICAMENTE por el
    // Tipo de Operación SUNAT (02XX), no por el Tipo de Afectación IGV.
    // ═══════════════════════════════════════════════════════════════════════════

    const codigoAfectacionIGV = pf.tipoAfectacionIGV?.codigo || "";
    const codigoOperacionSunat = pf.tipoOperacionSunat?.codigo || "";

    // EXPORTACIÓN: Determinada por Tipo de Operación SUNAT (códigos 02XX)
    // Incluye: 0200 (Bienes), 0201-0208 (Servicios)
    const esExportacion = codigoOperacionSunat.startsWith("02");
    const valorExportacion = esExportacion ? formatearNumero(totalPEN, 2) : "0.00";

    // BASE IMPONIBLE GRAVADA: Códigos 10-17 (operaciones gravadas con IGV)
    // Solo aplica para ventas internas (NO exportaciones)
    const esGravado = ["10", "11", "12", "13", "14", "15", "16", "17"].includes(codigoAfectacionIGV);
    const baseGravada = esGravado && !esExportacion ? formatearNumero(subtotalPEN, 2) : "0.00";

    // EXONERADO: Códigos 20 (exonerado oneroso) o 21 (exonerado gratuito)
    // NUNCA debe incluir exportaciones (para evitar duplicación)
    const esExonerado = ["20", "21"].includes(codigoAfectacionIGV) && !esExportacion;
    const exonerado = esExonerado ? formatearNumero(subtotalPEN, 2) : "0.00";

    // INAFECTO: Códigos 30-36 (operaciones inafectas)
    // Solo aplica para ventas internas (NO exportaciones)
    const esInafecto = ["30", "31", "32", "33", "34", "35", "36"].includes(codigoAfectacionIGV);
    const inafecto = esInafecto && !esExportacion ? formatearNumero(subtotalPEN, 2) : "0.00";

    // Otros campos del reporte
    const descuento = formatearNumero(totalDescuentosPEN, 2);
    const igv = esGravado && !esExportacion ? formatearNumero(totalIGVPEN, 2) : "0.00"; // IGV solo para gravados internos
    const total = formatearNumero(totalPEN, 2);
    const moneda = pf.moneda?.codigoSunat || "PEN";
    // TC efectivo: NC/ND usan TC del doc afectado, FAC/BV el propio (calculado en backend)
    const tipoCambio = Number(pf.tipoCambioAplicado || pf.tipoCambio || 1).toFixed(3);
    
    const esNCND = ["07", "08"].includes(tipoDocCodigo);
    const fechaDocMod = esNCND && pf.fechaDcmtoAfectoNCND ? formatearFecha(pf.fechaDcmtoAfectoNCND) : "";
    const tipoDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.tipoDocumentoFinal?.codigoSunat || "" : "";
    const serieDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numSerieDocFinal || "" : "";
    const nroDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numCorreDocFinal || "" : "";
    
    const contratoId = pf.contratoServicioId || "";
    const detraccion = pf.aplicaDetraccion ? "1" : "";
    const estadoId = Number(pf.estadoId);
    const estadoSunat = [95, 96, 97, 98].includes(estadoId) ? "1" : ([47, 99].includes(estadoId) ? "2" : "");

    // ═══════════════════════════════════════════════════════════════════════════
    // ARRAY DE VALORES PARA PDF - REGISTRO DE VENTAS SUNAT (Formato 14.1)
    // ═══════════════════════════════════════════════════════════════════════════
    // Orden de columnas tributarias:
    // - Valor Exportación (40 + 02XX)
    // - Base Imponible Gravada (10-17)
    // - Descuento Base Imponible
    // - IGV (solo gravados)
    // - Descuento IGV
    // - Exonerado (20-21, NO exportación)
    // - Inafecto (30-36)
    // ═══════════════════════════════════════════════════════════════════════════
    const values = [
      periodo, correlativoStr, fechaEmision, fechaVenc, fechaContable, tipoDocCodigo,
      serie, numero, numero,
      tipoDocCliente, nroDocCliente, razonSocial,
      valorExportacion, baseGravada, descuento, igv, "0.00", exonerado, inafecto,
      total, moneda, tipoCambio, fechaDocMod, tipoDocMod, serieDocMod, nroDocMod,
      contratoId, detraccion, estadoSunat
    ];

    xPos = margin;
    values.forEach((value, i) => {
      currentPage.drawLine({
        start: { x: xPos, y: yPos },
        end: { x: xPos, y: yPos - rowHeight },
        thickness: 0.3,
        color: gridColor,
      });

      currentPage.drawText(String(value), {
        x: xPos + 1,
        y: yPos - 6.5,
        size: 5,
        font: fontNormal,
      });
      xPos += colWidths[i];
    });

    currentPage.drawLine({
      start: { x: xPos, y: yPos },
      end: { x: xPos, y: yPos - rowHeight },
      thickness: 0.3,
      color: gridColor,
    });

    currentPage.drawLine({
      start: { x: margin, y: yPos - rowHeight },
      end: { x: xPos, y: yPos - rowHeight },
      thickness: 0.3,
      color: gridColor,
    });

    yPos -= rowHeight;
    rowIndex++;
    correlativo++;
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
