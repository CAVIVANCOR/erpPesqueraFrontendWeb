// src/components/temporadaPesca/reports/generarReportePescaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDFHeaderHelper } from "./pdfHeaderHelper.js";

export async function generarReportePescaPDF(data) {
  const { temporada, cuotas, descargas } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const headerHelper = new PDFHeaderHelper(pdfDoc, fontBold, fontNormal);
  await headerHelper.cargarLogo(temporada.empresa);

  const margin = 40;
  let paginas = [];

  // Calcular totales
  let totalLimiteTon = 0;
  cuotas.forEach(cuota => {
    totalLimiteTon += Number(cuota.limiteToneladas || 0);
  });

  const avanceTotal = descargas ? descargas.reduce((sum, d) => sum + Number(d.toneladas || 0), 0) : 0;

  // Primera página
  let page = pdfDoc.addPage([595.28, 841.89]);
  paginas.push(page);
  let { width, height } = page.getSize();

  // Encabezado completo en primera página
  let yPosition = headerHelper.dibujarEncabezadoCompleto(page, temporada, cuotas, totalLimiteTon, avanceTotal);

  // Función helper para dibujar headers de tabla de descarga
  const dibujarHeadersDescarga = (pg, yPos, descargaColWidths, descargaHeaders, descargaTableWidth, descargaTableStartX) => {
    pg.drawRectangle({
      x: descargaTableStartX,
      y: yPos - 3,
      width: descargaTableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

    let xPos = descargaTableStartX;
    descargaHeaders.forEach((header, i) => {
      const headerWidth = fontBold.widthOfTextAtSize(header, 7);
      const textX = xPos + (descargaColWidths[i] - headerWidth) / 2;
      pg.drawText(header, {
        x: textX,
        y: yPos,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += descargaColWidths[i];
    });

    let lineX = descargaTableStartX;
    for (let i = 0; i <= descargaColWidths.length; i++) {
      pg.drawLine({
        start: { x: lineX, y: yPos - 3 },
        end: { x: lineX, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < descargaColWidths.length) lineX += descargaColWidths[i];
    }

    return yPos - 20;
  };

  // DETALLE DE DESCARGA
  if (yPosition < 180) {
    page = pdfDoc.addPage([595.28, 841.89]);
    paginas.push(page);
    yPosition = headerHelper.dibujarEncabezadoCompleto(page, temporada, cuotas, totalLimiteTon, avanceTotal);
  }

  const detalleTexto = "DETALLE DE DESCARGA EN TN";
  const detalleWidth = fontBold.widthOfTextAtSize(detalleTexto, 10);
  page.drawText(detalleTexto, {
    x: (width - detalleWidth) / 2,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  if (descargas && descargas.length > 0) {
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;

    const descargaColWidths = [15, 50, 90, 45, 55, 100, 40, 45, 60, 55];
    const descargaHeaders = ["N°", "Especie", "Cliente", "Puerto", "Plataforma", "Observaciones", "Reporte", "Petroleo Gal.", "Toneladas", "% Juveniles"];
    const descargaTableWidth = descargaColWidths.reduce((a, b) => a + b, 0);
    const descargaTableStartX = cuotaTableStartX;

    if (yPosition < 180) {
      page = pdfDoc.addPage([595.28, 841.89]);
      paginas.push(page);
      yPosition = headerHelper.dibujarEncabezadoCompleto(page, temporada, cuotas, totalLimiteTon, avanceTotal);
    }

    // Dibujar headers iniciales
    yPosition = dibujarHeadersDescarga(page, yPosition, descargaColWidths, descargaHeaders, descargaTableWidth, descargaTableStartX);

    descargas.forEach((descarga, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        paginas.push(page);
        // En nueva página: encabezado completo + título sección + headers tabla descarga
        yPosition = headerHelper.dibujarEncabezadoCompleto(page, temporada, cuotas, totalLimiteTon, avanceTotal);

        // Redibujar título y headers de tabla descarga
        const detTxt = "DETALLE DE DESCARGA EN TN";
        const detW = fontBold.widthOfTextAtSize(detTxt, 10);
        page.drawText(detTxt, {
          x: (width - detW) / 2,
          y: yPosition,
          size: 10,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        yPosition -= 8;
        page.drawLine({
          start: { x: margin, y: yPosition },
          end: { x: width - margin, y: yPosition },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });
        yPosition -= 15;
        yPosition = dibujarHeadersDescarga(page, yPosition, descargaColWidths, descargaHeaders, descargaTableWidth, descargaTableStartX);
      }

      const especieNombre = descarga.especie?.nombre || "-";
      const clienteNombre = descarga.cliente?.razonSocial || descarga.cliente?.nombre || "-";
      const puertoNombre = descarga.puertoDescarga?.nombre || "-";
      const plataforma = descarga.numPlataformaDescarga || "-";
      const observaciones = descarga.observaciones || "-";
      const reporte = descarga.numReporteRecepcion || "-";
      const combustible = descarga.combustibleAbastecidoGalones
        ? Number(descarga.combustibleAbastecidoGalones).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "-";
      const toneladasFormateadas = Number(descarga.toneladas || 0).toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      const porcentajeJuveniles = descarga.porcentajeJuveniles
        ? Number(descarga.porcentajeJuveniles).toFixed(2) + "%"
        : "-";

      const rowData = [
        (index + 1).toString(),
        especieNombre,
        clienteNombre,
        puertoNombre,
        plataforma,
        observaciones,
        reporte,
        combustible,
        toneladasFormateadas,
        porcentajeJuveniles
      ];

      const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
      page.drawRectangle({
        x: descargaTableStartX,
        y: yPosition - 2,
        width: descargaTableWidth,
        height: 18,
        color: bgColor,
      });

      let xPos = descargaTableStartX;
      rowData.forEach((value, i) => {
        let displayValue = value;
        const maxWidth = descargaColWidths[i] - 4;

        while (fontNormal.widthOfTextAtSize(displayValue, 6.5) > maxWidth && displayValue.length > 3) {
          displayValue = displayValue.substring(0, displayValue.length - 1);
        }
        if (displayValue !== value && displayValue.length > 3) {
          displayValue = displayValue.substring(0, displayValue.length - 3) + "...";
        }

        let textX;
        if (i === 0 || i === 6 || i === 7 || i === 8 || i === 9) {
          const textWidth = fontNormal.widthOfTextAtSize(displayValue, 6.5);
          textX = xPos + descargaColWidths[i] - textWidth - 2;
        } else {
          textX = xPos + 2;
        }

        page.drawText(displayValue, {
          x: textX,
          y: yPosition + 3,
          size: 6.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xPos += descargaColWidths[i];
      });

      let lineX = descargaTableStartX;
      for (let i = 0; i <= descargaColWidths.length; i++) {
        page.drawLine({
          start: { x: lineX, y: yPosition + 16 },
          end: { x: lineX, y: yPosition - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < descargaColWidths.length) lineX += descargaColWidths[i];
      }

      page.drawLine({
        start: { x: descargaTableStartX, y: yPosition - 2 },
        end: { x: descargaTableStartX + descargaTableWidth, y: yPosition - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= 18;
    });

        const totalToneladas = descargas.reduce((sum, d) => sum + Number(d.toneladas || 0), 0);
    const totalGalones = descargas.reduce((sum, d) => sum + Number(d.combustibleAbastecidoGalones || 0), 0);
    yPosition -= 5;

    // Fila TOTALES con fondo celeste
    page.drawRectangle({
      x: descargaTableStartX,
      y: yPosition - 3,
      width: descargaTableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

    // "TOTALES" centrado bajo columna Observaciones (índice 5)
    const xInicioObs = descargaColWidths.slice(0, 5).reduce((a, b) => a + b, 0);
    const totalesLabel = "TOTALES";
    const totalesLabelWidth = fontBold.widthOfTextAtSize(totalesLabel, 8);
    page.drawText(totalesLabel, {
      x: descargaTableStartX + xInicioObs + (descargaColWidths[5] - totalesLabelWidth) / 2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Total galones alineado a la derecha bajo columna "Petroleo Gal." (índice 7)
    const totalGalonesText = totalGalones.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalGalonesWidth = fontBold.widthOfTextAtSize(totalGalonesText, 8);
    const xInicioGalones = descargaColWidths.slice(0, 7).reduce((a, b) => a + b, 0);
    page.drawText(totalGalonesText, {
      x: descargaTableStartX + xInicioGalones + descargaColWidths[7] - totalGalonesWidth - 2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Total toneladas alineado a la derecha bajo columna "Toneladas" (índice 8)
    const totalToneladasText = totalToneladas.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " Ton.";
    const totalToneladasWidth = fontBold.widthOfTextAtSize(totalToneladasText, 8);
    const xInicioTon = descargaColWidths.slice(0, 8).reduce((a, b) => a + b, 0);
    page.drawText(totalToneladasText, {
      x: descargaTableStartX + xInicioTon + descargaColWidths[8] - totalToneladasWidth - 2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales de la fila TOTALES
    let lineXTot = descargaTableStartX;
    for (let i = 0; i <= descargaColWidths.length; i++) {
      page.drawLine({
        start: { x: lineXTot, y: yPosition - 3 },
        end: { x: lineXTot, y: yPosition + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < descargaColWidths.length) lineXTot += descargaColWidths[i];
    }
    
  } else {
    page.drawText("No hay descargas registradas para esta temporada", {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Numeración de páginas
  const totalPaginas = paginas.length;
  paginas.forEach((pag, index) => {
    const paginaTexto = `Página ${index + 1} de ${totalPaginas}`;
    const paginaWidth = fontNormal.widthOfTextAtSize(paginaTexto, 9);

    pag.drawRectangle({
      x: pag.getSize().width - margin - 100,
      y: pag.getSize().height - 35,
      width: 100,
      height: 15,
      color: rgb(1, 1, 1),
    });

    pag.drawText(paginaTexto, {
      x: pag.getSize().width - margin - paginaWidth,
      y: pag.getSize().height - 30,
      size: 9,
      font: fontNormal,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}