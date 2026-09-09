import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearFecha, formatearNumero } from "../../../utils/utils";

export async function generarRegistroComprasPDF(data) {
  const { empresa, periodo, ordenesCompra } = data;

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
  const totalPages = Math.ceil(ordenesCompra.length / Math.floor((pageHeight - 100) / 9));

  // TÍTULO
  const titulo = "REGISTRO DE COMPRAS - FORMATO 8.1";
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

  // CABECERA (25 columnas optimizadas para ancho completo)
  const headers = [
    "Periodo", "Correlativo", "F.Emis", "F.Venc", "F.Cont", "T.Doc",
    "Serie", "Número", "T.Doc\nProv", "Nro Doc\nProveedor", "Razón Social",
    "Base\nGrav.", "IGV", "Base\nNo Grav.", "Otros\nTrib.", "Total",
    "Mon", "T.C.", "F.D.Mod", "T.D.M", "S.D.M", "N.D.M",
    "M.Ret", "Contr", "Est"
  ];
  
  // Anchos optimizados para usar todo el ancho (825.89px)
  const colWidths = [
    28, 42, 30, 30, 30, 20,  // Periodo, Correlativo, F.Emis, F.Venc, F.Cont, T.Doc
    26, 30, 20, 45, 120,  // Serie, Número, T.Doc Prov, Nro Doc Prov, Razón Social
    36, 36, 36, 36, 40,  // Base Grav, IGV, Base No Grav, Otros Trib, Total
    20, 26, 30, 20, 26, 30,  // Mon, T.C., F.D.Mod, T.D.M, S.D.M, N.D.M
    20, 30, 22  // M.Ret, Contr, Est
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
  
  ordenesCompra.forEach(oc => {
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

    // Fecha de emisión SUNAT = fechaFacturacion (comprobante del proveedor), no fechaDocumento (OC interna)
    const fechaDoc = oc.fechaFacturacion ? new Date(oc.fechaFacturacion) : null;
    const fechaCont = oc.fechaContable ? new Date(oc.fechaContable) : null;
    const periodo = fechaCont ? `${fechaCont.getFullYear()}${String(fechaCont.getMonth() + 1).padStart(2, '0')}00` : "";
    const correlativoStr = `M${String(correlativo).padStart(9, '0')}`;
    const fechaEmision = fechaDoc ? formatearFecha(oc.fechaFacturacion) : "";
    const fechaVenc = oc.fechaVencimiento ? formatearFecha(oc.fechaVencimiento) : "";
    const fechaContable = fechaCont ? formatearFecha(oc.fechaContable) : "";
    
    const tipoDocCodigo = oc.tipoDocumentoFinal?.codigoSunat || "";
    const serie = oc.numSerieDocFinal || "";
    const numero = oc.numCorreDocFinal || "";
    const tipoDocProveedor = oc.proveedor?.tipoDocumento?.codSunat || "";
    const nroDocProveedor = oc.proveedor?.numeroDocumento || "";
    const razonSocial = (oc.proveedor?.razonSocial || "").substring(0, 28);
    
    // ============================================================
    // CALCULAR MONTOS POR CATEGORÍA DE AFECTACIÓN IGV PARA SUNAT
    // ============================================================
    let subtotalGravadoPEN = 0;
    let subtotalExoneradoPEN = 0;
    let subtotalInafectoPEN = 0;
    
    // Recorrer detalles para clasificar por tipo de afectación
    if (oc.detalles && Array.isArray(oc.detalles)) {
      const tcAplicable = Number(oc.tipoCambioAplicado || oc.tipoCambio || 1);
      
      oc.detalles.forEach(detalle => {
        const subtotalDetalle = Number(detalle.subtotal || 0) * tcAplicable;
        const categoria = detalle.tipoAfectacionIGV?.categoria;
        
        if (categoria === 'INAFECTO') {
          subtotalInafectoPEN += subtotalDetalle;
        } else if (categoria === 'EXONERADO' || oc.esExoneradoAlIGV) {
          subtotalExoneradoPEN += subtotalDetalle;
        } else {
          // GRAVADO o sin categoría específica (default gravado)
          subtotalGravadoPEN += subtotalDetalle;
        }
      });
    } else {
      // Fallback: Si no hay detalles, usar el subtotal general
      const subtotalPEN = Number(oc.subtotalPEN || oc.subtotal || 0);
      if (oc.esExoneradoAlIGV) {
        subtotalExoneradoPEN = subtotalPEN;
      } else {
        subtotalGravadoPEN = subtotalPEN;
      }
    }
    
    let totalIGVPEN = Number(oc.totalIGVPEN || oc.totalIGV || 0);
    
    // Total para SUNAT = Base Gravada + IGV (los inafectos NO se suman al total)
    let totalPEN = subtotalGravadoPEN + totalIGVPEN;
    
    // Si es Nota de Crédito (07), los montos deben ser negativos
    if (tipoDocCodigo === "07") {
      subtotalGravadoPEN = Math.abs(subtotalGravadoPEN) * -1;
      subtotalExoneradoPEN = Math.abs(subtotalExoneradoPEN) * -1;
      subtotalInafectoPEN = Math.abs(subtotalInafectoPEN) * -1;
      totalIGVPEN = Math.abs(totalIGVPEN) * -1;
      totalPEN = Math.abs(totalPEN) * -1;
    }
    
    const baseGravada = formatearNumero(subtotalGravadoPEN, 2);
    const igv = formatearNumero(totalIGVPEN, 2);
    const baseNoGravada = formatearNumero(subtotalExoneradoPEN, 2);
    const otrosTributos = formatearNumero(oc.montoImpuestoRenta || 0, 2);
    const total = formatearNumero(totalPEN, 2);
    const moneda = oc.moneda?.codigoSunat || "PEN";
    // TC efectivo: NC/ND usan TC del doc afectado, FAC/BV el propio (calculado en backend)
    const tipoCambio = Number(oc.tipoCambioAplicado || oc.tipoCambio || 1).toFixed(3);
    
    const esNCND = ["07", "08"].includes(tipoDocCodigo);
    const fechaDocMod = esNCND && oc.fechaDcmtoAfectoNCND ? formatearFecha(oc.fechaDcmtoAfectoNCND) : "";
    const tipoDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.tipoDocumentoFinal?.codigoSunat || "" : "";
    const serieDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.numSerieDocFinal || "" : "";
    const nroDocMod = esNCND && oc.dcmtoAfectoNCND ? oc.dcmtoAfectoNCND.numCorreDocFinal || "" : "";
    
    const marcaRetencion = oc.aplicaImpuestoRenta ? "1" : "";
    const contratoId = "";
    const estadoId = Number(oc.estadoId);
    const estadoSunat = [39, 40, 41].includes(estadoId) ? "1" : ([42].includes(estadoId) ? "2" : "");

    const values = [
      periodo, correlativoStr, fechaEmision, fechaVenc, fechaContable, tipoDocCodigo,
      serie, numero,
      tipoDocProveedor, nroDocProveedor, razonSocial,
      baseGravada, igv, baseNoGravada, otrosTributos, total,
      moneda, tipoCambio, fechaDocMod, tipoDocMod, serieDocMod, nroDocMod,
      marcaRetencion, contratoId, estadoSunat
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
