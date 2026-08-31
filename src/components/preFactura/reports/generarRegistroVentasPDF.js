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

  // CABECERA (28 columnas - SUNAT 14.1)
  const headers = [
    "Periodo", "Correlativo", "F.Emis", "F.Venc", "F.Cont", "T.Doc",
    "Serie", "Número", "N.Final", "T.Doc\nCli", "Nro Doc\nCliente", "Razón Social",
    "Export.", "Base\nGrav.", "Desc.", "IGV", "D.IGV", "Exon.",
    "Total", "Mon", "T.C.", "F.D.Mod", "T.D.M", "S.D.M", "N.D.M",
    "Contr", "Det", "Est"
  ];
  
  // Anchos balanceados para 825px (28 columnas)
  const colWidths = [
    25, 38, 28, 28, 28, 18,  // Periodo, Correlativo, F.Emis, F.Venc, F.Cont, T.Doc
    24, 28, 24, 18, 40, 110,  // Serie, Número, N.Final, T.Doc Cli, Nro Doc Cli, Razón Social
    30, 34, 22, 34, 22, 34,  // Export, Base Grav, Desc, IGV, D.IGV, Exon
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

    const fechaDoc = pf.fechaDocumento ? new Date(pf.fechaDocumento) : null;
    const fechaCont = pf.fechaContable ? new Date(pf.fechaContable) : null;
    const periodo = fechaCont ? `${fechaCont.getFullYear()}${String(fechaCont.getMonth() + 1).padStart(2, '0')}00` : "";
    const correlativoStr = `M${String(correlativo).padStart(9, '0')}`;
    const fechaEmision = fechaDoc ? formatearFecha(pf.fechaDocumento) : "";
    const fechaVenc = pf.fechaVencimiento ? formatearFecha(pf.fechaVencimiento) : "";
    const fechaContable = fechaCont ? formatearFecha(pf.fechaContable) : "";
    
    const tipoDocCodigo = pf.tipoDocumentoFinal?.codigo || "";
    const serie = pf.numSerieDocFinal || "";
    const numero = pf.numCorreDocFinal || "";
    const tipoDocCliente = pf.cliente?.tipoDocumento?.codSunat || "";
    const nroDocCliente = pf.cliente?.numeroDocumento || "";
    const razonSocial = (pf.cliente?.razonSocial || "").substring(0, 28);
    
    const esExportacion = pf.tipoOperacionSunat?.codigo === "0200";
    const valorExportacion = esExportacion ? formatearNumero(pf.total, 2) : "0.00";
    const baseGravada = !pf.exoneradoIgv && !esExportacion ? formatearNumero(pf.subtotal, 2) : "0.00";
    const descuento = formatearNumero(pf.totalDescuentos || 0, 2);
    const igv = formatearNumero(pf.totalIGV, 2);
    const exonerado = pf.exoneradoIgv ? formatearNumero(pf.subtotal, 2) : "0.00";
    const total = formatearNumero(pf.total, 2);
    const moneda = pf.moneda?.codigoSunat || "";
    const tipoCambio = Number(pf.tipoCambio || 0).toFixed(3);
    
    const esNCND = ["07", "08", "NC", "ND"].includes(tipoDocCodigo);
    const fechaDocMod = esNCND && pf.fechaDcmtoAfectoNCND ? formatearFecha(pf.fechaDcmtoAfectoNCND) : "";
    const tipoDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.tipoDocumentoFinal?.codigo || "" : "";
    const serieDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numSerieDocFinal || "" : "";
    const nroDocMod = esNCND && pf.dcmtoAfectoNCND ? pf.dcmtoAfectoNCND.numCorreDocFinal || "" : "";
    
    const contratoId = pf.contratoServicioId || "";
    const detraccion = pf.aplicaDetraccion ? "1" : "";
    const estadoId = Number(pf.estadoId);
    const estadoSunat = [95, 96, 97, 98].includes(estadoId) ? "1" : ([47, 99].includes(estadoId) ? "2" : "");

    const values = [
      periodo, correlativoStr, fechaEmision, fechaVenc, fechaContable, tipoDocCodigo,
      serie, numero, numero,
      tipoDocCliente, nroDocCliente, razonSocial,
      valorExportacion, baseGravada, descuento, igv, "0.00", exonerado,
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
