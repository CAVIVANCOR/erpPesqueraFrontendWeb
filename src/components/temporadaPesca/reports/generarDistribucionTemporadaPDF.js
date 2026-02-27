// src/components/temporadaPesca/reports/generarDistribucionTemporadaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Distribución de Embarcaciones Temporada Pesca
 * @param {Object} data - Datos de la temporada y cuotas
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarDistribucionTemporadaPDF(data) {
  const { temporada, cuotas } = data;

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 40;
  const margin = 40;
  const contentWidth = width - margin * 2;
  const lineHeight = 13;

  if (temporada.empresa?.logo && temporada.empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${temporada.empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        let logoImage;

        if (temporada.empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }

        if (logoImage) {
          const logoDims = logoImage.size();
          const maxLogoWidth = 80;
          const aspectRatio = logoDims.width / logoDims.height;
          const finalWidth = maxLogoWidth;
          const finalHeight = maxLogoWidth / aspectRatio;

          page.drawImage(logoImage, {
            x: margin,
            y: yPosition - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  page.drawText(temporada.empresa?.razonSocial || "EMPRESA", {
    x: margin + 90,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight;
  page.drawText(`RUC: ${temporada.empresa?.ruc || "-"}`, {
    x: margin + 90,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= lineHeight;
  if (temporada.empresa?.direccion) {
    page.drawText(`Direccion: ${temporada.empresa.direccion}`, {
      x: margin + 90,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  }

  yPosition -= 10;
  const titulo1 = "DISTRIBUCION CUOTAS EMBARCACIONES TEMPORADA PESCA INDUSTRIAL";
  const titulo1Width = fontBold.widthOfTextAtSize(titulo1, 11);
  page.drawText(titulo1, {
    x: (width - titulo1Width) / 2,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  yPosition -= 18;

  const nombreTemporada = temporada.nombre || "NOMBRE TEMPORADA";
  const nombreWidth = fontBold.widthOfTextAtSize(nombreTemporada, 14);
  page.drawText(nombreTemporada, {
    x: (width - nombreWidth) / 2,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);
  const limiteTexto = `Maxima Captura Temporada:        ${limiteMaximo.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Ton.`;
  const limiteWidth = fontBold.widthOfTextAtSize(limiteTexto, 10);
  page.drawText(limiteTexto, {
    x: (width - limiteWidth) / 2,
    y: yPosition,
    size: 10,
    font: fontBold,
  });

  yPosition -= 8;

  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  const colWidths = [25, 45, 65, 55, 127, 70, 55, 73];

  const headers = [
    "N°",
    "Zona",
    "Tipo Cuota",
    "Estado Op.",
    "Embarcacion",
    "Precio/Ton USD",
    "PMCE (%)",
    "Limite Ton.",
  ];

  const tableStartX = margin;
  const tableWidth = contentWidth;

  // Función para dibujar encabezados
  function dibujarEncabezados(pag, yPos) {
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 3,
      width: tableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

    let xPos = tableStartX;
    headers.forEach((header, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      let textX = colX + 3;
      if (i === 0 || i >= 5) {
        const textWidth = fontBold.widthOfTextAtSize(header, 8);
        textX = colX + (colWidth - textWidth) / 2;
      }

      pag.drawText(header, {
        x: textX,
        y: yPos,
        size: 8,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += colWidth;
    });

    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 3 },
        end: { x: lineX, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 20;
  }

  yPosition = dibujarEncabezados(page, yPosition);

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
  const rowHeight = 14;
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
      // Verificar si necesitamos nueva página
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = page.getSize().height - 40;
        yPosition = dibujarEncabezados(page, yPosition);
      }

      let xPos = tableStartX;

      const porcentaje = Number(cuota.porcentajeCuota || 0);
      const precio = Number(cuota.precioPorTonDolares || 0);
      const limite = limiteMaximo * (porcentaje / 100);
      subtotalZona += limite;
      totalGeneral += limite;

      const tipoCuota = cuota.cuotaPropia ? "PROPIA" : "ALQUILADA";

      const rowData = [
        String(numeroFila),
        cuota.zona || "-",
        tipoCuota,
        cuota.esAlquiler ? "ALQUILER" : "PESCA",
        cuota.nombre || "-",
        precio.toFixed(2),
        porcentaje.toFixed(6),
        limite.toLocaleString("es-PE", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }) + " Ton.",
      ];

      if (numeroFila % 2 === 0) {
        page.drawRectangle({
          x: tableStartX,
          y: yPosition - 2,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.97, 0.97, 0.97),
        });
      }

      rowData.forEach((data, i) => {
        const colX = xPos;
        const colWidth = colWidths[i];

        let displayText = data;
        const maxWidth = colWidth - 6;
        let textWidth = fontNormal.widthOfTextAtSize(displayText, 7);

        if (textWidth > maxWidth && i === 4) {
          while (textWidth > maxWidth && displayText.length > 3) {
            displayText = displayText.slice(0, -1);
            textWidth = fontNormal.widthOfTextAtSize(displayText + "...", 7);
          }
          displayText = displayText + "...";
        }

        let textX = colX + 3;
        if (i === 0 || i === 5 || i === 6) {
          const finalWidth = fontNormal.widthOfTextAtSize(displayText, 7);
          textX = colX + (colWidth - finalWidth) / 2;
        } else if (i === 7) {
          const finalWidth = fontNormal.widthOfTextAtSize(displayText, 7);
          textX = colX + colWidth - finalWidth - 3;
        }

        page.drawText(displayText, {
          x: textX,
          y: yPosition + 2,
          size: 7,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xPos += colWidth;
      });

      let lineX = tableStartX;
      for (let i = 0; i <= colWidths.length; i++) {
        page.drawLine({
          start: { x: lineX, y: yPosition + rowHeight - 2 },
          end: { x: lineX, y: yPosition - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < colWidths.length) lineX += colWidths[i];
      }

      page.drawLine({
        start: { x: tableStartX, y: yPosition - 2 },
        end: { x: tableStartX + tableWidth, y: yPosition - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= rowHeight;
      numeroFila++;
    }

    // SUBTOTAL de la zona
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = page.getSize().height - 40;
      yPosition = dibujarEncabezados(page, yPosition);
    }

    page.drawRectangle({
      x: tableStartX,
      y: yPosition - 3,
      width: tableWidth,
      height: 16,
      color: rgb(0.85, 0.92, 0.95),
    });

    const subtotalLabel = `Subtotal ${zona}`;
    const subtotalLabelColX = tableStartX + colWidths.slice(0, 5).reduce((sum, w) => sum + w, 0);
    const subtotalLabelColWidth = colWidths[5];
    const subtotalLabelWidth = fontBold.widthOfTextAtSize(subtotalLabel, 8);
    const subtotalLabelX = subtotalLabelColX + (subtotalLabelColWidth - subtotalLabelWidth) / 2;

    page.drawText(subtotalLabel, {
      x: subtotalLabelX,
      y: yPosition + 1,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const subtotalTexto = subtotalZona.toLocaleString("es-PE", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " Ton.";
    const subtotalWidth = fontBold.widthOfTextAtSize(subtotalTexto, 8);
    const subtotalColX = tableStartX + colWidths.slice(0, 7).reduce((sum, w) => sum + w, 0);
    const subtotalColWidth = colWidths[7];
    const subtotalX = subtotalColX + subtotalColWidth - subtotalWidth - 3;

    page.drawText(subtotalTexto, {
      x: subtotalX,
      y: yPosition + 1,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: tableStartX, y: yPosition - 3 },
      end: { x: tableStartX + tableWidth, y: yPosition - 3 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    yPosition -= 16;
  }

  // TOTAL GENERAL
  if (yPosition < 100) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = page.getSize().height - 40;
  }

  page.drawRectangle({
    x: tableStartX,
    y: yPosition - 3,
    width: tableWidth,
    height: 18,
    color: rgb(0.68, 0.85, 0.9),
  });

  const totalLabelColX = tableStartX + colWidths.slice(0, 6).reduce((sum, w) => sum + w, 0);
  const totalLabelColWidth = colWidths[6];
  const totalLabelWidth = fontBold.widthOfTextAtSize("Total", 9);
  const totalLabelX = totalLabelColX + (totalLabelColWidth - totalLabelWidth) / 2;

  page.drawText("Total", {
    x: totalLabelX,
    y: yPosition + 2,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalTexto = totalGeneral.toLocaleString("es-PE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }) + " Ton.";
  const totalWidth = fontBold.widthOfTextAtSize(totalTexto, 9);
  const totalColX = tableStartX + colWidths.slice(0, 7).reduce((sum, w) => sum + w, 0);
  const totalColWidth = colWidths[7];
  const totalX = totalColX + totalColWidth - totalWidth - 3;

  page.drawText(totalTexto, {
    x: totalX,
    y: yPosition + 2,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: tableStartX, y: yPosition - 3 },
    end: { x: tableStartX + tableWidth, y: yPosition - 3 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  const footerY = 30;
  page.drawLine({
    start: { x: margin, y: footerY + 10 },
    end: { x: width - margin, y: footerY + 10 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  const footerText = `Generado: ${new Date().toLocaleString("es-PE")} | Sistema ERP Megui`;
  const footerWidth = fontNormal.widthOfTextAtSize(footerText, 7);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: footerY,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}