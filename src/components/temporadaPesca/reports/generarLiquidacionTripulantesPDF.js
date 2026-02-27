// src/components/temporadaPesca/reports/generarLiquidacionTripulantesPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";

export async function generarLiquidacionTripulantesPDF(data) {
  const { temporada, cuotas, descargas, descuentos } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const celeste = rgb(0.68, 0.85, 0.9);
  const azulClaro = rgb(0.72, 0.87, 0.97);
  const rojoClaro = rgb(0.98, 0.78, 0.78);
  const verdeClaro = rgb(0.75, 0.93, 0.78);

  // Cargar logo
  let logoImage = null;
  if (temporada.empresa?.logo && temporada.empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${temporada.empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        if (temporada.empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
  }

  // ─── HELPER: dibujar encabezado completo ──────────────────────────────────
  const dibujarEncabezado = (page) => {
    const { width, height } = page.getSize();
    let yPos = height - 40;

    // Logo
    if (logoImage) {
      const logoDims = logoImage.size();
      const maxLogoWidth = 80;
      const finalWidth = maxLogoWidth;
      const finalHeight = maxLogoWidth / (logoDims.width / logoDims.height);
      page.drawImage(logoImage, { x: margin, y: yPos - finalHeight, width: finalWidth, height: finalHeight });
    }

    // Empresa
    page.drawText(temporada.empresa?.razonSocial || "EMPRESA", {
      x: margin + 90, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 13;
    page.drawText(`RUC: ${temporada.empresa?.ruc || "-"}`, {
      x: margin + 90, y: yPos, size: 9, font: fontNormal, color: rgb(0, 0, 0),
    });
    yPos -= 13;
    if (temporada.empresa?.direccion) {
      page.drawText(`Direccion: ${temporada.empresa.direccion}`, {
        x: margin + 90, y: yPos, size: 8, font: fontNormal, color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }
    yPos -= 10;

    // Título del reporte
    const titulo = "LIQUIDACION DE PESCA TRIPULANTES PESCA INDUSTRIAL";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 18;

    const nombreTemporada = temporada.nombre || "TEMPORADA";
    const nombreWidth = fontBold.widthOfTextAtSize(nombreTemporada, 14);
    page.drawText(nombreTemporada, {
      x: (width - nombreWidth) / 2, y: yPos, size: 14, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 25;

    // ── Tabla cuotas ──
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaHeaders = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Precio/Ton", "PMCE (%)", "Limite Ton."];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;
    const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);

    // Header cuotas
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 20, color: celeste });
    let xPos = cuotaTableStartX;
    cuotaHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      page.drawText(h, { x: xPos + (cuotaColWidths[i] - hw) / 2, y: yPos, size: 7, font: fontBold, color: rgb(0, 0, 0) });
      xPos += cuotaColWidths[i];
    });
    let lineX = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page.drawLine({ start: { x: lineX, y: yPos - 3 }, end: { x: lineX, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
      if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
    }
    yPos -= 20;

    // Filas cuotas
    let totalCalculado = 0;
    cuotas.forEach((cuota, index) => {
      const porcentaje = Number(cuota.porcentajeCuota || 0);
      const limiteTon = (porcentaje / 100) * limiteMaximo;
      totalCalculado += limiteTon;
      const rowData = [
        (index + 1).toString(),
        cuota.zona || "-",
        cuota.cuotaPropia ? "PROPIA" : "ALQUILADA",
        cuota.nombre || "-",
        cuota.esAlquiler ? "ALQUILER" : "PESCA",
        cuota.precioPorTonDolares ? Number(cuota.precioPorTonDolares).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : "-",
        porcentaje > 0 ? porcentaje.toFixed(6) : "-",
        limiteTon.toLocaleString('es-PE', { minimumFractionDigits: 3 }) + " Ton.",
      ];
      const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
      page.drawRectangle({ x: cuotaTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 18, color: bgColor });
      xPos = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let dv = value;
        const maxW = cuotaColWidths[i] - 4;
        while (fontNormal.widthOfTextAtSize(dv, 6.5) > maxW && dv.length > 3) dv = dv.substring(0, dv.length - 1);
        if (dv !== value && dv.length > 3) dv = dv.substring(0, dv.length - 3) + "...";
        let textX;
        if (i === 0 || i === 5 || i === 6 || i === 7) {
          textX = xPos + cuotaColWidths[i] - fontNormal.widthOfTextAtSize(dv, 6.5) - 2;
        } else {
          textX = xPos + 2;
        }
        page.drawText(dv, { x: textX, y: yPos + 3, size: 6.5, font: fontNormal, color: rgb(0, 0, 0) });
        xPos += cuotaColWidths[i];
      });
      lineX = cuotaTableStartX;
      for (let i = 0; i <= cuotaColWidths.length; i++) {
        page.drawLine({ start: { x: lineX, y: yPos + 16 }, end: { x: lineX, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
        if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
      }
      page.drawLine({ start: { x: cuotaTableStartX, y: yPos - 2 }, end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      yPos -= 18;
    });

    // Fila TOTAL cuotas
    yPos -= 5;
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 20, color: celeste });
    const totalLabel = "TOTAL";
    const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
    const xInicioColPMCE = cuotaColWidths.slice(0, 6).reduce((a, b) => a + b, 0);
    page.drawText(totalLabel, { x: cuotaTableStartX + xInicioColPMCE + (cuotaColWidths[6] - totalLabelWidth) / 2, y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    const totalCuotaText = `${totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Ton.`;
    const totalCuotaWidth = fontBold.widthOfTextAtSize(totalCuotaText, 8);
    page.drawText(totalCuotaText, { x: cuotaTableStartX + cuotaTableWidth - totalCuotaWidth - 2, y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    lineX = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page.drawLine({ start: { x: lineX, y: yPos - 3 }, end: { x: lineX, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
      if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
    }
    yPos -= 20;

    // SALDO CUOTA título
    const tituloSeccion = `SALDO CUOTA ${temporada.nombre || ""}`;
    const tituloSeccionWidth = fontBold.widthOfTextAtSize(tituloSeccion, 10);
    page.drawText(tituloSeccion, { x: (width - tituloSeccionWidth) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    yPos -= 8;
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    yPos -= 15;

    // Cuadro resumen
    const avanceTotal = (descargas ?? []).reduce((sum, d) => sum + Number(d.toneladas || 0), 0);
    const saldoTotal = totalCalculado - avanceTotal;
    const porcentajeAvanzado = totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;
    const resumenColWidths = [cuotaTableWidth / 4, cuotaTableWidth / 4, cuotaTableWidth / 4, cuotaTableWidth / 4];
    const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado"];
    const resumenData = [
      `${totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${avanceTotal.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${saldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 3 })} Ton.`,
      `${porcentajeAvanzado.toFixed(2)}%`,
    ];
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 20, color: celeste });
    let xPosRes = cuotaTableStartX;
    resumenHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 8);
      page.drawText(h, { x: xPosRes + (resumenColWidths[i] - hw) / 2, y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0) });
      xPosRes += resumenColWidths[i];
    });
    let lineXRes = cuotaTableStartX;
    for (let i = 0; i <= resumenColWidths.length; i++) {
      page.drawLine({ start: { x: lineXRes, y: yPos - 3 }, end: { x: lineXRes, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
      if (i < resumenColWidths.length) lineXRes += resumenColWidths[i];
    }
    yPos -= 20;
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 18, color: rgb(1, 1, 1) });
    xPosRes = cuotaTableStartX;
    resumenData.forEach((value, i) => {
      const tw = fontNormal.widthOfTextAtSize(value, 8);
      page.drawText(value, { x: xPosRes + (resumenColWidths[i] - tw) / 2, y: yPos + 3, size: 8, font: fontNormal, color: rgb(0, 0, 0) });
      xPosRes += resumenColWidths[i];
    });
    lineXRes = cuotaTableStartX;
    for (let i = 0; i <= resumenColWidths.length; i++) {
      page.drawLine({ start: { x: lineXRes, y: yPos + 16 }, end: { x: lineXRes, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      if (i < resumenColWidths.length) lineXRes += resumenColWidths[i];
    }
    page.drawLine({ start: { x: cuotaTableStartX, y: yPos - 2 }, end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
    yPos -= 25;

    return { yPos, cuotaTableStartX, cuotaTableWidth };
  };

  // ─── PÁGINA 1 ──────────────────────────────────────────────────────────────
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let paginas = [page];
  let { width } = page.getSize();
  let { yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page);

  // ─── SECCIÓN INGRESOS ──────────────────────────────────────────────────────
  const precioPorTon = Number(temporada.precioPorTonDolares || 0);
  const descargasLista = descargas ?? [];

  const ingresosColWidths = [25, 70, 175, 80, 80, 125];
  const ingresosHeaders = ["N°", "Fecha Descarga", "Especie", "Toneladas", "Precio/Ton US$", "Total US$"];
  const ingresosTableWidth = ingresosColWidths.reduce((a, b) => a + b, 0);
  const ingresosTableStartX = cuotaTableStartX;

  const dibujarHeadersIngresos = (pg, y) => {
    pg.drawRectangle({ x: ingresosTableStartX, y: y - 3, width: ingresosTableWidth, height: 20, color: azulClaro });
    let xp = ingresosTableStartX;
    ingresosHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      pg.drawText(h, { x: xp + (ingresosColWidths[i] - hw) / 2, y, size: 7, font: fontBold, color: rgb(0, 0, 0) });
      xp += ingresosColWidths[i];
    });
    let lx = ingresosTableStartX;
    for (let i = 0; i <= ingresosColWidths.length; i++) {
      pg.drawLine({ start: { x: lx, y: y - 3 }, end: { x: lx, y: y + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
      if (i < ingresosColWidths.length) lx += ingresosColWidths[i];
    }
    return y - 20;
  };

  if (yPos < 180) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page));
    width = page.getSize().width;
  }

  // Título INGRESOS
  const tituloIngresos = "INGRESOS - DETALLE DE DESCARGAS";
  const tituloIngresosWidth = fontBold.widthOfTextAtSize(tituloIngresos, 10);
  page.drawText(tituloIngresos, { x: (width - tituloIngresosWidth) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  yPos -= 8;
  page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  yPos -= 15;

  yPos = dibujarHeadersIngresos(page, yPos);

  let totalToneladasIngresos = 0;
  let totalPagarIngresos = 0;

  descargasLista.forEach((descarga, index) => {
    if (yPos < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      paginas.push(page);
      ({ yPos } = dibujarEncabezado(page));
      width = page.getSize().width;
      const titI = "INGRESOS - DETALLE DE DESCARGAS (continuacion)";
      const titIW = fontBold.widthOfTextAtSize(titI, 10);
      page.drawText(titI, { x: (width - titIW) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
      yPos -= 23;
      yPos = dibujarHeadersIngresos(page, yPos);
    }

    const fecha = descarga.fechaHoraFinDescarga
      ? new Date(descarga.fechaHoraFinDescarga).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : "-";
    const especie = descarga.especie?.nombre || "-";
    const toneladas = Number(descarga.toneladas || 0);
    const totalPagar = toneladas * precioPorTon;
    totalToneladasIngresos += toneladas;
    totalPagarIngresos += totalPagar;

    const rowData = [
      (index + 1).toString(),
      fecha,
      especie,
      toneladas.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      precioPorTon.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalPagar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];

    const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
    page.drawRectangle({ x: ingresosTableStartX, y: yPos - 2, width: ingresosTableWidth, height: 18, color: bgColor });

    let xp = ingresosTableStartX;
    rowData.forEach((value, i) => {
      let dv = value;
      const maxW = ingresosColWidths[i] - 4;
      while (fontNormal.widthOfTextAtSize(dv, 6.5) > maxW && dv.length > 3) dv = dv.substring(0, dv.length - 1);
      if (dv !== value && dv.length > 3) dv = dv.substring(0, dv.length - 3) + "...";
      let textX;
      if (i === 0 || i === 3 || i === 4 || i === 5) {
        textX = xp + ingresosColWidths[i] - fontNormal.widthOfTextAtSize(dv, 6.5) - 2;
      } else {
        textX = xp + 2;
      }
      page.drawText(dv, { x: textX, y: yPos + 3, size: 6.5, font: fontNormal, color: rgb(0, 0, 0) });
      xp += ingresosColWidths[i];
    });

    let lx = ingresosTableStartX;
    for (let i = 0; i <= ingresosColWidths.length; i++) {
      page.drawLine({ start: { x: lx, y: yPos + 16 }, end: { x: lx, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      if (i < ingresosColWidths.length) lx += ingresosColWidths[i];
    }
    page.drawLine({ start: { x: ingresosTableStartX, y: yPos - 2 }, end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
    yPos -= 18;
  });

  // Fila TOTALES ingresos
  yPos -= 5;
  page.drawRectangle({ x: ingresosTableStartX, y: yPos - 3, width: ingresosTableWidth, height: 20, color: azulClaro });
  const totalesLabel = "TOTALES";
  const totalesLabelWidth = fontBold.widthOfTextAtSize(totalesLabel, 8);
  const xInicioEspecie = ingresosColWidths.slice(0, 2).reduce((a, b) => a + b, 0);
  page.drawText(totalesLabel, {
    x: ingresosTableStartX + xInicioEspecie + (ingresosColWidths[2] - totalesLabelWidth) / 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  const totalTonText = totalToneladasIngresos.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const totalTonWidth = fontBold.widthOfTextAtSize(totalTonText, 8);
  const xInicioTon = ingresosColWidths.slice(0, 3).reduce((a, b) => a + b, 0);
  page.drawText(totalTonText, {
    x: ingresosTableStartX + xInicioTon + ingresosColWidths[3] - totalTonWidth - 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  const totalPagarText = totalPagarIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalPagarWidth = fontBold.widthOfTextAtSize(totalPagarText, 8);
  const xInicioTotal = ingresosColWidths.slice(0, 5).reduce((a, b) => a + b, 0);
  page.drawText(totalPagarText, {
    x: ingresosTableStartX + xInicioTotal + ingresosColWidths[5] - totalPagarWidth - 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  let lxTot = ingresosTableStartX;
  for (let i = 0; i <= ingresosColWidths.length; i++) {
    page.drawLine({ start: { x: lxTot, y: yPos - 3 }, end: { x: lxTot, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
    if (i < ingresosColWidths.length) lxTot += ingresosColWidths[i];
  }
  yPos -= 25;

  // ─── SECCIÓN DESCUENTOS ────────────────────────────────────────────────────
  const descuentosLista = descuentos ?? [];

  // Pre-cargar tipos de cambio SUNAT para todas las fechas únicas de descuentos
  // Usa fechaOperacionMovCaja si existe, sino fechaMovimiento
  const tcCache = {};
  const fechasUnicas = [...new Set(
    descuentosLista
      .filter((d) => d.fechaOperacionMovCaja || d.fechaMovimiento)
      .map((d) => {
        const fechaRaw = d.fechaOperacionMovCaja || d.fechaMovimiento;
        return new Date(fechaRaw).toISOString().split("T")[0];
      })
  )];

  // Busca el TC retrocediendo días hasta encontrar uno disponible (máx 7 días atrás)
  const obtenerTCConReintento = async (fechaISO) => {
    const fecha = new Date(fechaISO + "T00:00:00");
    for (let i = 0; i <= 7; i++) {
      const f = new Date(fecha);
      f.setDate(f.getDate() - i);
      const fISO = f.toISOString().split("T")[0];
      try {
        const resp = await consultarTipoCambioSunat({ date: fISO });
        if (resp?.sell_price) {
          return parseFloat(resp.sell_price);
        }
      } catch (e) {
        // continuar con el día anterior
      }
    }
    return null;
  };

  await Promise.all(
    fechasUnicas.map(async (fechaISO) => {
      const tc = await obtenerTCConReintento(fechaISO);
      if (tc) {
        tcCache[fechaISO] = tc;
      }
    })
  );

  const descColWidths = [25, 70, 220, 80, 35, 125];
  const descHeaders = ["N°", "Fecha Operacion", "Descripcion", "Monto Soles", "T/C", "Monto Dolares"];
  const descTableWidth = descColWidths.reduce((a, b) => a + b, 0);
  const descTableStartX = cuotaTableStartX;

  const dibujarHeadersDescuentos = (pg, y) => {
    pg.drawRectangle({ x: descTableStartX, y: y - 3, width: descTableWidth, height: 20, color: rojoClaro });
    let xp = descTableStartX;
    descHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      pg.drawText(h, { x: xp + (descColWidths[i] - hw) / 2, y, size: 7, font: fontBold, color: rgb(0, 0, 0) });
      xp += descColWidths[i];
    });
    let lx = descTableStartX;
    for (let i = 0; i <= descColWidths.length; i++) {
      pg.drawLine({ start: { x: lx, y: y - 3 }, end: { x: lx, y: y + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
      if (i < descColWidths.length) lx += descColWidths[i];
    }
    return y - 20;
  };

  if (yPos < 120) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos } = dibujarEncabezado(page));
    width = page.getSize().width;
  }

  // Título DESCUENTOS
  const tituloDescuentos = "DESCUENTOS";
  const tituloDescuentosWidth = fontBold.widthOfTextAtSize(tituloDescuentos, 10);
  page.drawText(tituloDescuentos, { x: (width - tituloDescuentosWidth) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  yPos -= 8;
  page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  yPos -= 15;

  yPos = dibujarHeadersDescuentos(page, yPos);

  let totalDescuentosSoles = 0;
  let totalDescuentosDolares = 0;

  descuentosLista.forEach((desc, index) => {
    if (yPos < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      paginas.push(page);
      ({ yPos } = dibujarEncabezado(page));
      width = page.getSize().width;
      const titD = "DESCUENTOS (continuacion)";
      const titDW = fontBold.widthOfTextAtSize(titD, 10);
      page.drawText(titD, { x: (width - titDW) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
      yPos -= 23;
      yPos = dibujarHeadersDescuentos(page, yPos);
    }

    const esSoles = Number(desc.monedaId) === 1;
    const monto = Number(desc.monto || 0);
    // Siempre usar el TC de SUNAT (sell_price) para la fecha de operación
    const fechaRaw = desc.fechaOperacionMovCaja || desc.fechaMovimiento;
    const fechaISO = fechaRaw ? new Date(fechaRaw).toISOString().split("T")[0] : null;
    const tc = (fechaISO && tcCache[fechaISO]) ? tcCache[fechaISO] : 1;
    const montoSoles = esSoles ? monto : monto * tc;
    const montoDolares = esSoles ? (tc > 0 ? monto / tc : monto) : monto;
    totalDescuentosSoles += montoSoles;
    totalDescuentosDolares += montoDolares;

    const fecha = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : "-";
    const descripcion = desc.producto?.descripcionArmada || desc.descripcion || "-";
    const tcText = tc > 0 ? tc.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

    const rowData = [
      (index + 1).toString(),
      fecha,
      descripcion,
      montoSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tcText,
      montoDolares.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];

    const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
    page.drawRectangle({ x: descTableStartX, y: yPos - 2, width: descTableWidth, height: 18, color: bgColor });

    let xp = descTableStartX;
    rowData.forEach((value, i) => {
      let dv = value;
      const maxW = descColWidths[i] - 4;
      while (fontNormal.widthOfTextAtSize(dv, 6.5) > maxW && dv.length > 3) dv = dv.substring(0, dv.length - 1);
      if (dv !== value && dv.length > 3) dv = dv.substring(0, dv.length - 3) + "...";
      let textX;
      if (i === 0 || i === 3 || i === 4 || i === 5) {
        textX = xp + descColWidths[i] - fontNormal.widthOfTextAtSize(dv, 6.5) - 2;
      } else {
        textX = xp + 2;
      }
      page.drawText(dv, { x: textX, y: yPos + 3, size: 6.5, font: fontNormal, color: rgb(0, 0, 0) });
      xp += descColWidths[i];
    });

    let lx = descTableStartX;
    for (let i = 0; i <= descColWidths.length; i++) {
      page.drawLine({ start: { x: lx, y: yPos + 16 }, end: { x: lx, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      if (i < descColWidths.length) lx += descColWidths[i];
    }
    page.drawLine({ start: { x: descTableStartX, y: yPos - 2 }, end: { x: descTableStartX + descTableWidth, y: yPos - 2 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
    yPos -= 18;
  });

  // Fila TOTALES descuentos
  yPos -= 5;
  page.drawRectangle({ x: descTableStartX, y: yPos - 3, width: descTableWidth, height: 20, color: rojoClaro });
  const totDescLabel = "TOTALES";
  const totDescLabelWidth = fontBold.widthOfTextAtSize(totDescLabel, 8);
  const xInicioDescripcion = descColWidths.slice(0, 2).reduce((a, b) => a + b, 0);
  page.drawText(totDescLabel, {
    x: descTableStartX + xInicioDescripcion + (descColWidths[2] - totDescLabelWidth) / 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  const totSolesText = totalDescuentosSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totSolesWidth = fontBold.widthOfTextAtSize(totSolesText, 8);
  const xInicioSoles = descColWidths.slice(0, 3).reduce((a, b) => a + b, 0);
  page.drawText(totSolesText, {
    x: descTableStartX + xInicioSoles + descColWidths[3] - totSolesWidth - 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  const totDolaresText = totalDescuentosDolares.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totDolaresWidth = fontBold.widthOfTextAtSize(totDolaresText, 8);
  const xInicioDolares = descColWidths.slice(0, 5).reduce((a, b) => a + b, 0);
  page.drawText(totDolaresText, {
    x: descTableStartX + xInicioDolares + descColWidths[5] - totDolaresWidth - 2,
    y: yPos, size: 8, font: fontBold, color: rgb(0, 0, 0),
  });
  let lxTotDesc = descTableStartX;
  for (let i = 0; i <= descColWidths.length; i++) {
    page.drawLine({ start: { x: lxTotDesc, y: yPos - 3 }, end: { x: lxTotDesc, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
    if (i < descColWidths.length) lxTotDesc += descColWidths[i];
  }
  yPos -= 30;

  // ─── RESUMEN CALCULO LIQUIDACIÓN ───────────────────────────────────────────
  if (yPos < 80) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos } = dibujarEncabezado(page));
    width = page.getSize().width;
  }

  const porcentajeBase = Number(temporada.porcentajeBaseLiqPesca || 0);
  const montoLiquidacion = totalPagarIngresos * (porcentajeBase / 100);
  const saldoUS = montoLiquidacion - totalDescuentosDolares;

  yPos -= 10;

  // Título resumen
  const tituloResumen = "RESUMEN CALCULO LIQUIDACION";
  const tituloResumenWidth = fontBold.widthOfTextAtSize(tituloResumen, 10);
  page.drawText(tituloResumen, { x: cuotaTableStartX + (cuotaTableWidth - tituloResumenWidth) / 2, y: yPos, size: 10, font: fontBold, color: rgb(0, 0, 0) });
  yPos -= 18;

  // Columnas del resumen (5 columnas iguales = 555 total)
  const resColWidths = [111, 111, 111, 111, 111];
  const resHeaders = ["Pesca Total US$", "% Base", "Monto Liquidacion", "Descuentos US$", "Saldo US$"];
  const resData = [
    totalPagarIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    porcentajeBase.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    montoLiquidacion.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    totalDescuentosDolares.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    saldoUS.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ];
  const resTableWidth = resColWidths.reduce((a, b) => a + b, 0);
  const resTableStartX = cuotaTableStartX;

  // Header resumen
  page.drawRectangle({ x: resTableStartX, y: yPos - 3, width: resTableWidth, height: 20, color: verdeClaro });
  let xpRes = resTableStartX;
  resHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 7);
    page.drawText(h, { x: xpRes + (resColWidths[i] - hw) / 2, y: yPos, size: 7, font: fontBold, color: rgb(0, 0, 0) });
    xpRes += resColWidths[i];
  });
  let lxRes = resTableStartX;
  for (let i = 0; i <= resColWidths.length; i++) {
    page.drawLine({ start: { x: lxRes, y: yPos - 3 }, end: { x: lxRes, y: yPos + 17 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
    if (i < resColWidths.length) lxRes += resColWidths[i];
  }
  yPos -= 20;

  // Fila de datos resumen
  page.drawRectangle({ x: resTableStartX, y: yPos - 2, width: resTableWidth, height: 20, color: rgb(1, 1, 1) });
  xpRes = resTableStartX;
  resData.forEach((value, i) => {
    const tw = fontBold.widthOfTextAtSize(value, 8);
    page.drawText(value, { x: xpRes + resColWidths[i] - tw - 3, y: yPos + 3, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    xpRes += resColWidths[i];
  });
  lxRes = resTableStartX;
  for (let i = 0; i <= resColWidths.length; i++) {
    page.drawLine({ start: { x: lxRes, y: yPos + 18 }, end: { x: lxRes, y: yPos - 2 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
    if (i < resColWidths.length) lxRes += resColWidths[i];
  }
  page.drawLine({ start: { x: resTableStartX, y: yPos - 2 }, end: { x: resTableStartX + resTableWidth, y: yPos - 2 }, thickness: 0.5, color: rgb(0.5, 0.7, 0.8) });
  yPos -= 30;

  // Numeración de páginas
  const totalPaginas = paginas.length;
  paginas.forEach((pag, index) => {
    const paginaTexto = `Pagina ${index + 1} de ${totalPaginas}`;
    const paginaWidth = fontNormal.widthOfTextAtSize(paginaTexto, 9);
    pag.drawRectangle({ x: pag.getSize().width - margin - 100, y: pag.getSize().height - 35, width: 100, height: 15, color: rgb(1, 1, 1) });
    pag.drawText(paginaTexto, { x: pag.getSize().width - margin - paginaWidth, y: pag.getSize().height - 30, size: 9, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}