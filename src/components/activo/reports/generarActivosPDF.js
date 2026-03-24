// src/components/activo/reports/generarActivosPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Activos ordenado por Empresa y Tipo
 * @param {Object} data - Datos de los activos
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarActivosPDF(data) {
  const { activos, empresas, tiposActivo, fechaGeneracion } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 12;

  // ⭐ OBTENER EMPRESA FILTRADA (SOLO si hay filtro de empresa)
  let empresaFiltrada = null;
  let logoImage = null;
  
  // Detectar si todos los activos son de la misma empresa
  const empresasUnicas = [...new Set(activos.map(a => Number(a.empresaId)))];
  if (empresasUnicas.length === 1) {
    empresaFiltrada = empresas.find(e => Number(e.id) === empresasUnicas[0]);
    
    // Cargar logo si existe empresa filtrada
    if (empresaFiltrada?.logo && empresaFiltrada?.id) {
      try {
        const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresaFiltrada.id}/logo`;
        const logoResponse = await fetch(logoUrl);

        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          if (empresaFiltrada.logo.toLowerCase().includes(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
        }
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }
  }

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

  // ⭐ DEFINIR COLUMNAS DE LA TABLA
  const colWidths = [30, 150, 120, 180, 150, 80];
  const headers = ["N°", "Empresa", "Tipo", "Nombre", "Descripción", "Estado"];

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 40;

    // Logo y datos de empresa (SOLO si hay filtro de empresa)
    if (empresaFiltrada) {
      if (logoImage) {
        const logoDims = logoImage.size();
        const maxLogoWidth = 70;
        const aspectRatio = logoDims.width / logoDims.height;
        const finalWidth = maxLogoWidth;
        const finalHeight = maxLogoWidth / aspectRatio;

        pag.drawImage(logoImage, {
          x: margin,
          y: yPos - finalHeight,
          width: finalWidth,
          height: finalHeight,
        });
      }

      pag.drawText(empresaFiltrada.razonSocial || "EMPRESA", {
        x: margin + 80,
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPos -= lineHeight;
      pag.drawText(`RUC: ${empresaFiltrada.ruc || "-"}`, {
        x: margin + 80,
        y: yPos,
        size: 9,
        font: fontNormal,
      });

      yPos -= lineHeight;
      if (empresaFiltrada.direccion) {
        const direccionTexto = empresaFiltrada.direccion.length > 60 
          ? empresaFiltrada.direccion.substring(0, 60) + "..."
          : empresaFiltrada.direccion;
        pag.drawText(`Direccion: ${direccionTexto}`, {
          x: margin + 80,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }

    // Título del reporte
    const titulo = "LISTADO DE ACTIVOS";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
    pag.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

       yPos -= 25;

    // Numeración de página
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    return yPos;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADOS DE TABLA
  function dibujarEncabezadosTabla(pag, yPos, width) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      color: rgb(0.68, 0.85, 0.9),
    });

    // Bordes del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Textos del header
    let xPos = tableStartX + 2;
    headers.forEach((header, index) => {
      pag.drawText(header, {
        x: xPos + 2,
        y: yPos - 11,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += colWidths[index];
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 15 },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 15;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR FILA DE DATOS
  function dibujarFila(pag, yPos, rowData, rowNumber, isEven, width) {
    const rowHeight = 14;
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo alternado
    if (isEven) {
      pag.drawRectangle({
        x: tableStartX,
        y: yPos - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    // Bordes de la fila
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    // Datos de la fila
    let xPos = tableStartX + 2;

    // N°
    pag.drawText(String(rowNumber), {
      x: xPos + (colWidths[0] - fontNormal.widthOfTextAtSize(String(rowNumber), 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[0];

    // Empresa
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.empresaId));
    const empresaTexto = (empresa?.razonSocial || "-").substring(0, 25);
    pag.drawText(empresaTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[1];

    // Tipo
    const tipoTexto = (rowData.tipo?.nombre || "-").substring(0, 20);
    pag.drawText(tipoTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[2];

    // Nombre
    const nombreTexto = (rowData.nombre || "-").substring(0, 30);
    pag.drawText(nombreTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
    });
    xPos += colWidths[3];

    // Descripción
    const descripcionTexto = (rowData.descripcion || "-").substring(0, 25);
    pag.drawText(descripcionTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[4];

    // Estado
    const estadoTexto = rowData.cesado ? "CESADO" : "ACTIVO";
    const estadoColor = rowData.cesado ? rgb(0.7, 0, 0) : rgb(0, 0.5, 0);
    pag.drawText(estadoTexto, {
      x: xPos + (colWidths[5] - fontBold.widthOfTextAtSize(estadoTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: estadoColor,
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }

  // ⭐ GENERAR PÁGINAS
  let pages = [];
  let currentPage = pdfDoc.addPage([842, 595]); // A4 horizontal
  let { width, height } = currentPage.getSize();
  let yPosition = dibujarEncabezadoCompleto(currentPage, width, height, 1, 1);
  yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
  pages.push(currentPage);

  let rowNumber = 1;

  // Dibujar activos
  for (let i = 0; i < activosOrdenados.length; i++) {
    const activo = activosOrdenados[i];

    // Verificar si necesitamos nueva página
    if (yPosition < 80) {
      currentPage = pdfDoc.addPage([842, 595]);
      ({ width, height } = currentPage.getSize());
      yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
      yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
      pages.push(currentPage);
    }

    yPosition = dibujarFila(currentPage, yPosition, activo, rowNumber, i % 2 === 0, width);
    rowNumber++;
  }

  // ⭐ ACTUALIZAR NUMERACIÓN DE PÁGINAS
  const totalPages = pages.length;
  pages.forEach((pag, index) => {
    const pageNum = index + 1;
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ PIE DE PÁGINA EN TODAS LAS PÁGINAS
  const footerText = `Total de activos: ${activos.length} | Generado: ${fechaGeneracion.toLocaleString('es-PE')} | Sistema ERP Megui`;
  pages.forEach((pag) => {
    pag.drawLine({
      start: { x: margin, y: 25 },
      end: { x: width - margin, y: 25 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    const footerWidth = fontNormal.widthOfTextAtSize(footerText, 7);
    pag.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 15,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ GENERAR Y RETORNAR BLOB
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}