// src/components/temporadaPesca/reports/pdfHeaderHelper.js
import { rgb } from "pdf-lib";

export class PDFHeaderHelper {
  constructor(pdfDoc, fontBold, fontNormal) {
    this.pdfDoc = pdfDoc;
    this.fontBold = fontBold;
    this.fontNormal = fontNormal;
    this.logoImage = null;
    this.margin = 40;
  }

  async cargarLogo(empresa) {
    if (!empresa?.logo || !empresa?.id) return;

    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();

        if (empresa.logo.toLowerCase().includes(".png")) {
          this.logoImage = await this.pdfDoc.embedPng(logoBytes);
        } else {
          this.logoImage = await this.pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  dibujarEncabezadoCompleto(page, temporada, cuotas, totalLimiteTon, avanceTotal) {
    const { width, height } = page.getSize();
    let yPos = height - 40;

    if (this.logoImage) {
      const logoDims = this.logoImage.size();
      const maxLogoWidth = 80;
      const aspectRatio = logoDims.width / logoDims.height;
      const finalWidth = maxLogoWidth;
      const finalHeight = maxLogoWidth / aspectRatio;

      page.drawImage(this.logoImage, {
        x: this.margin,
        y: yPos - finalHeight,
        width: finalWidth,
        height: finalHeight,
      });
    }

    const empresaNombre = temporada.empresa?.razonSocial || "EMPRESA";
    page.drawText(empresaNombre, {
      x: this.margin + 90,
      y: yPos,
      size: 10,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 13;

    const rucTexto = `RUC: ${temporada.empresa?.ruc || "-"}`;
    page.drawText(rucTexto, {
      x: this.margin + 90,
      y: yPos,
      size: 9,
      font: this.fontNormal,
      color: rgb(0, 0, 0),
    });

    yPos -= 13;

    if (temporada.empresa?.direccion) {
      const direccionTexto = `Direccion: ${temporada.empresa.direccion}`;
      page.drawText(direccionTexto, {
        x: this.margin + 90,
        y: yPos,
        size: 8,
        font: this.fontNormal,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }

    yPos -= 10;

    const titulo = "REPORTE DE PESCA INDUSTRIAL";
    const tituloWidth = this.fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 11,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 18;

    const nombreTemporada = temporada.nombre || "TEMPORADA";
    const nombreWidth = this.fontBold.widthOfTextAtSize(nombreTemporada, 14);
    page.drawText(nombreTemporada, {
      x: (width - nombreWidth) / 2,
      y: yPos,
      size: 14,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 25;

    // Headers tabla cuotas
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaHeaders = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Precio/Ton", "PMCE (%)", "Limite Ton."];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;

    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

    let xPos = cuotaTableStartX;
    cuotaHeaders.forEach((header, i) => {
      const headerWidth = this.fontBold.widthOfTextAtSize(header, 7);
      const textX = xPos + (cuotaColWidths[i] - headerWidth) / 2;
      page.drawText(header, {
        x: textX,
        y: yPos,
        size: 7,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += cuotaColWidths[i];
    });

    let lineX = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos - 3 },
        end: { x: lineX, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
    }

    yPos -= 20;

    // Calcular limite máximo y total real sumando cuotas
    const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);
    let totalCalculado = 0;

    cuotas.forEach((cuota, index) => {
      const porcentaje = Number(cuota.porcentajeCuota || 0);
      const limiteTon = (porcentaje / 100) * limiteMaximo;
      totalCalculado += limiteTon;

      const zona = cuota.zona || "-";
      const tipoCuota = cuota.cuotaPropia ? "PROPIA" : "ALQUILADA";
      const nombre = cuota.nombre || "-";
      const estado = cuota.esAlquiler ? "ALQUILER" : "PESCA";
      const precioTon = cuota.precioPorTonDolares
        ? Number(cuota.precioPorTonDolares).toLocaleString('es-PE', { minimumFractionDigits: 2 })
        : "-";
      const pmce = porcentaje > 0 ? porcentaje.toFixed(6) : "-";
      const limiteFormateado = limiteTon.toLocaleString('es-PE', { minimumFractionDigits: 3 }) + " Ton.";

      const rowData = [
        (index + 1).toString(),
        zona,
        tipoCuota,
        nombre,
        estado,
        precioTon,
        pmce,
        limiteFormateado
      ];

      const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 18,
        color: bgColor,
      });

      xPos = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let displayValue = value;
        const maxWidth = cuotaColWidths[i] - 4;

        while (this.fontNormal.widthOfTextAtSize(displayValue, 6.5) > maxWidth && displayValue.length > 3) {
          displayValue = displayValue.substring(0, displayValue.length - 1);
        }
        if (displayValue !== value && displayValue.length > 3) {
          displayValue = displayValue.substring(0, displayValue.length - 3) + "...";
        }

        let textX;
        if (i === 0 || i === 5 || i === 6 || i === 7) {
          const textWidth = this.fontNormal.widthOfTextAtSize(displayValue, 6.5);
          textX = xPos + cuotaColWidths[i] - textWidth - 2;
        } else {
          textX = xPos + 2;
        }

        page.drawText(displayValue, {
          x: textX,
          y: yPos + 3,
          size: 6.5,
          font: this.fontNormal,
          color: rgb(0, 0, 0),
        });
        xPos += cuotaColWidths[i];
      });

      lineX = cuotaTableStartX;
      for (let i = 0; i <= cuotaColWidths.length; i++) {
        page.drawLine({
          start: { x: lineX, y: yPos + 16 },
          end: { x: lineX, y: yPos - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
      }

      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPos -= 18;
    });

       // TOTAL como fila con fondo azul, texto TOTAL centrado y valor alineado a Limite Ton.
    yPos -= 5;
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

        const totalLabel = "TOTAL";
    const totalLabelWidth = this.fontBold.widthOfTextAtSize(totalLabel, 8);
    // Centrar "TOTAL" debajo de la columna PMCE (%) = índice 6
    const xInicioColPMCE = cuotaColWidths.slice(0, 6).reduce((a, b) => a + b, 0);
    page.drawText(totalLabel, {
      x: cuotaTableStartX + xInicioColPMCE + (cuotaColWidths[6] - totalLabelWidth) / 2,
      y: yPos,
      size: 8,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Valor total alineado a la derecha en la columna "Limite Ton."
    const totalCuotaText = `${totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Ton.`;
    const totalCuotaWidth = this.fontBold.widthOfTextAtSize(totalCuotaText, 8);
    page.drawText(totalCuotaText, {
      x: cuotaTableStartX + cuotaTableWidth - totalCuotaWidth - 2,
      y: yPos,
      size: 8,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Línea divisora vertical entre columnas y borde inferior del TOTAL
    let lineXTotal = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page.drawLine({
        start: { x: lineXTotal, y: yPos - 3 },
        end: { x: lineXTotal, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < cuotaColWidths.length) lineXTotal += cuotaColWidths[i];
    }

    yPos -= 20;

    // Título SALDO CUOTA encima del cuadro resumen
    const tituloSeccion = `SALDO CUOTA ${temporada.nombre || ""}`;
    const tituloSeccionWidth = this.fontBold.widthOfTextAtSize(tituloSeccion, 10);
    page.drawText(tituloSeccion, {
      x: (width - tituloSeccionWidth) / 2,
      y: yPos,
      size: 10,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    yPos -= 8;

    page.drawLine({
      start: { x: this.margin, y: yPos },
      end: { x: width - this.margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPos -= 15;


    // Cuadro resumen - mismo ancho y posición que tabla de cuotas
    const saldoTotal = totalCalculado - avanceTotal;
    const porcentajeAvanzado = totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;

    const resumenColWidths = [
      cuotaTableWidth / 4,
      cuotaTableWidth / 4,
      cuotaTableWidth / 4,
      cuotaTableWidth / 4
    ];
    const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado"];
    const resumenData = [
      `${totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${avanceTotal.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${saldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${porcentajeAvanzado.toFixed(2)}%`
    ];

    const resumenTableWidth = cuotaTableWidth;
    const resumenTableStartX = cuotaTableStartX;

    page.drawRectangle({
      x: resumenTableStartX,
      y: yPos - 3,
      width: resumenTableWidth,
      height: 20,
      color: rgb(0.68, 0.85, 0.9),
    });

    let xPosRes = resumenTableStartX;
    resumenHeaders.forEach((header, i) => {
      const headerWidth = this.fontBold.widthOfTextAtSize(header, 8);
      const textX = xPosRes + (resumenColWidths[i] - headerWidth) / 2;
      page.drawText(header, {
        x: textX,
        y: yPos,
        size: 8,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      xPosRes += resumenColWidths[i];
    });

    let lineXRes = resumenTableStartX;
    for (let i = 0; i <= resumenColWidths.length; i++) {
      page.drawLine({
        start: { x: lineXRes, y: yPos - 3 },
        end: { x: lineXRes, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < resumenColWidths.length) lineXRes += resumenColWidths[i];
    }

    yPos -= 20;

    page.drawRectangle({
      x: resumenTableStartX,
      y: yPos - 2,
      width: resumenTableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    xPosRes = resumenTableStartX;
    resumenData.forEach((value, i) => {
      const textWidth = this.fontNormal.widthOfTextAtSize(value, 8);
      const textX = xPosRes + (resumenColWidths[i] - textWidth) / 2;
      page.drawText(value, {
        x: textX,
        y: yPos + 3,
        size: 8,
        font: this.fontNormal,
        color: rgb(0, 0, 0),
      });
      xPosRes += resumenColWidths[i];
    });

    lineXRes = resumenTableStartX;
    for (let i = 0; i <= resumenColWidths.length; i++) {
      page.drawLine({
        start: { x: lineXRes, y: yPos + 16 },
        end: { x: lineXRes, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < resumenColWidths.length) lineXRes += resumenColWidths[i];
    }

    page.drawLine({
      start: { x: resumenTableStartX, y: yPos - 2 },
      end: { x: resumenTableStartX + resumenTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPos -= 25;

    return yPos;
  }
}