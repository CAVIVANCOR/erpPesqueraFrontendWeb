// src/components/temporadaPesca/reports/generarLiquidacionComisionistaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { formatearNumero } from "../../../utils/utils";

export async function generarLiquidacionComisionistaPDF(data) {
  const { temporada, cuotas, descargas, movimientos } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const celeste = rgb(0.68, 0.85, 0.9);
  const azulClaro = rgb(0.72, 0.87, 0.97);
  const amarillo = rgb(1, 1, 0);
  const blanco = rgb(1, 1, 1);
  const verdeClaro = rgb(0.56, 0.93, 0.56);
  const azulMuyClaro = rgb(0.85, 0.92, 1);
  const rojoMuyClaro = rgb(1, 0.85, 0.85);
  const verdeMuyClaro = rgb(0.85, 1, 0.85);

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

  // Obtener tipo de cambio
  let tipoCambio = 3.8;
  try {
    const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin) : new Date();
    const tcData = await consultarTipoCambioSunat(fechaFin);
    if (tcData?.venta) {
      tipoCambio = Number(tcData.venta);
    }
  } catch (e) {
    console.warn("No se pudo obtener tipo de cambio, usando 3.8:", e);
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

    // Título principal del reporte
    const tituloPrincipal = "LIQUIDACION ALQUILER COMISIONISTA";
    const tituloPrincipalWidth = fontBold.widthOfTextAtSize(tituloPrincipal, 11);
    page.drawText(tituloPrincipal, {
      x: (width - tituloPrincipalWidth) / 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // Subtítulo principal: Entidad Comercial Comisionista Alquiler
    const subtituloPrincipal = temporada.entidadComercialComisionistaAlq?.razonSocial || "";
    if (subtituloPrincipal) {
      const subtituloPrincipalWidth = fontBold.widthOfTextAtSize(subtituloPrincipal, 12);
      page.drawText(subtituloPrincipal, {
        x: (width - subtituloPrincipalWidth) / 2, y: yPos, size: 12, font: fontBold, color: rgb(0, 0, 0),
      });
      yPos -= 20;
    }

    // Título liquidación
    const titulo = `LIQUIDACION N° ${temporada.id} ${temporada.nombre || ""}`;
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 25;

    return yPos;
  };

  // ─── PÁGINA 1 ─────────────────────────────────────────────────────────────
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = dibujarEncabezado(page1);

  // ─── TABLA CUOTAS ─────────────────────────────────────────────────────────
  const cuotaHeaders = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Comisión/Ton", "PMCE (%)", "Limite Ton."];
  const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
  const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
  const cuotaTableStartX = (pageWidth - cuotaTableWidth) / 2;

  // Header cuotas - CELESTE
  page1.drawRectangle({ x: cuotaTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 20, color: celeste });
  let xPos = cuotaTableStartX;
  cuotaHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (cuotaColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += cuotaColWidths[i];
  });

  // Líneas header cuotas
  let lineX = cuotaTableStartX;
  for (let i = 0; i <= cuotaColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
  }
  page1.drawLine({
    start: { x: cuotaTableStartX, y: yPos + 17 },
    end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos + 17 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: cuotaTableStartX, y: yPos - 3 },
    end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 3 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 20;

  // Datos cuotas
  let totalLimiteTon = 0;
  cuotas.forEach((cuota, idx) => {
    const limiteTon = Number(cuota.porcentajeCuota || 0) * Number(temporada.limiteMaximoCapturaTn || 0) / 100;
    totalLimiteTon += limiteTon;

    const cuotaData = [
      String(idx + 1),
      cuota.zona || "-",
      "ALQUILADA",
      cuota.nombre || "-",
      cuota.esAlquiler ? "ALQUILER" : "PESCA",
      `$ ${formatearNumero(Number(temporada.precioPorTonComisionAlquilerDolares || 0))}`,
      formatearNumero(Number(cuota.porcentajeCuota || 0), 4) + "%",
      `${formatearNumero(limiteTon, 3)} Ton.`,
    ];

    // FONDO BLANCO para datos
    page1.drawRectangle({ x: cuotaTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 18, color: blanco });
    xPos = cuotaTableStartX;
    cuotaData.forEach((val, i) => {
      const align = i === 5 || i === 6 || i === 7 ? "right" : i === 0 || i === 1 ? "center" : "left";
      let textX;
      if (align === "right") {
        const textWidth = fontNormal.widthOfTextAtSize(val, 7);
        textX = xPos + cuotaColWidths[i] - textWidth - 2;
      } else if (align === "center") {
        const textWidth = fontNormal.widthOfTextAtSize(val, 7);
        textX = xPos + (cuotaColWidths[i] - textWidth) / 2;
      } else {
        textX = xPos + 2;
      }
      page1.drawText(val, { x: textX, y: yPos + 3, size: 7, font: fontNormal, color: rgb(0, 0, 0) });
      xPos += cuotaColWidths[i];
    });

    // Líneas fila cuotas
    lineX = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page1.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
    }
    page1.drawLine({
      start: { x: cuotaTableStartX, y: yPos - 2 },
      end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPos -= 18;
  });

  // Total cuotas
  page1.drawRectangle({ x: cuotaTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 20, color: celeste });
  const totalText = "TOTAL";
  const totalTextWidth = fontBold.widthOfTextAtSize(totalText, 9);
  page1.drawText(totalText, {
    x: cuotaTableStartX + cuotaColWidths[0] + cuotaColWidths[1] + cuotaColWidths[2] + cuotaColWidths[3] + cuotaColWidths[4] + cuotaColWidths[5] + (cuotaColWidths[6] - totalTextWidth) / 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const totalTonText = `${formatearNumero(totalLimiteTon, 3)} Ton.`;
  const totalTonWidth = fontBold.widthOfTextAtSize(totalTonText, 9);
  page1.drawText(totalTonText, {
    x: cuotaTableStartX + cuotaColWidths[0] + cuotaColWidths[1] + cuotaColWidths[2] + cuotaColWidths[3] + cuotaColWidths[4] + cuotaColWidths[5] + cuotaColWidths[6] + cuotaColWidths[7] - totalTonWidth - 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  lineX = cuotaTableStartX;
  for (let i = 0; i <= cuotaColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 18 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
  }
  page1.drawLine({
    start: { x: cuotaTableStartX, y: yPos + 18 },
    end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos + 18 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: cuotaTableStartX, y: yPos - 2 },
    end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 30;

  // ─── INGRESOS PESCA ───────────────────────────────────────────────────────
  const tituloIngresos = "INGRESOS PESCA";
  const tituloIngresosWidth = fontBold.widthOfTextAtSize(tituloIngresos, 10);
  page1.drawText(tituloIngresos, {
    x: (pageWidth - tituloIngresosWidth) / 2,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Encontrar especie con mayor tonelaje
  let especieMayorTonelaje = "ANCHOVETA";
  if (descargas && descargas.length > 0) {
    const especieTotales = {};
    descargas.forEach((d) => {
      const especie = d.especie?.nombre || "Sin especie";
      const toneladas = Number(d.pesoTotalDescargaTn || 0);
      especieTotales[especie] = (especieTotales[especie] || 0) + toneladas;
    });
    let mayorTonelaje = 0;
    Object.entries(especieTotales).forEach(([especie, total]) => {
      if (total > mayorTonelaje) {
        mayorTonelaje = total;
        especieMayorTonelaje = especie;
      }
    });
  }

  // Tabla INGRESOS PESCA - usar mismo ancho que tabla de cuotas
  const ingresosHeaders = ["FECHA", "ESPECIE", "TM", "PRECIO", "TOTAL"];
  const ingresosColWidths = [111, 111, 111, 111, 111];
  const ingresosTableWidth = cuotaTableWidth;
  const ingresosTableStartX = (pageWidth - ingresosTableWidth) / 2;

  // Header INGRESOS - AZUL MUY CLARO
  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 3, width: ingresosTableWidth, height: 18, color: azulMuyClaro });
  xPos = ingresosTableStartX;
  ingresosHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (ingresosColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += ingresosColWidths[i];
  });

  lineX = ingresosTableStartX;
  for (let i = 0; i <= ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 15 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < ingresosColWidths.length) lineX += ingresosColWidths[i];
  }
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos + 15 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos + 15 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos - 3 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 3 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 18;

  // Datos INGRESOS
  const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin).toLocaleDateString("es-PE") : "-";
  const precioTon = Number(temporada.precioPorTonComisionAlquilerDolares || 0);
  const totalPesca = totalLimiteTon * precioTon;

  const ingresosData = [
    fechaFin,
    especieMayorTonelaje,
    formatearNumero(totalLimiteTon, 3),
    `$ ${formatearNumero(precioTon)}`,
    `$ ${formatearNumero(totalPesca)}`,
  ];

  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 2, width: ingresosTableWidth, height: 16, color: blanco });
  xPos = ingresosTableStartX;
  ingresosData.forEach((val, i) => {
    const align = i === 2 || i === 3 || i === 4 ? "right" : "center";
    let textX;
    if (align === "right") {
      const textWidth = fontNormal.widthOfTextAtSize(val, 7);
      textX = xPos + ingresosColWidths[i] - textWidth - 2;
    } else {
      const textWidth = fontNormal.widthOfTextAtSize(val, 7);
      textX = xPos + (ingresosColWidths[i] - textWidth) / 2;
    }
    page1.drawText(val, { x: textX, y: yPos + 3, size: 7, font: fontNormal, color: rgb(0, 0, 0) });
    xPos += ingresosColWidths[i];
  });

  lineX = ingresosTableStartX;
  for (let i = 0; i <= ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 14 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < ingresosColWidths.length) lineX += ingresosColWidths[i];
  }
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos - 2 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 },
    thickness: 0.3,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 16;

  // Total INGRESOS
  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 2, width: ingresosTableWidth, height: 18, color: azulMuyClaro });
  const totalIngresosLabel = "TOTAL";
  const totalIngresosLabelWidth = fontBold.widthOfTextAtSize(totalIngresosLabel, 9);
  page1.drawText(totalIngresosLabel, {
    x: ingresosTableStartX + (ingresosColWidths[0] + ingresosColWidths[1] - totalIngresosLabelWidth) / 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalTMText = formatearNumero(totalLimiteTon, 3);
  const totalTMWidth = fontBold.widthOfTextAtSize(totalTMText, 9);
  page1.drawText(totalTMText, {
    x: ingresosTableStartX + ingresosColWidths[0] + ingresosColWidths[1] + ingresosColWidths[2] - totalTMWidth - 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalPescaText = `$ ${formatearNumero(totalPesca)}`;
  const totalPescaWidth = fontBold.widthOfTextAtSize(totalPescaText, 9);
  page1.drawText(totalPescaText, {
    x: ingresosTableStartX + ingresosColWidths[0] + ingresosColWidths[1] + ingresosColWidths[2] + ingresosColWidths[3] + ingresosColWidths[4] - totalPescaWidth - 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  lineX = ingresosTableStartX;
  for (let i = 0; i <= ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 16 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < ingresosColWidths.length) lineX += ingresosColWidths[i];
  }
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos + 16 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos + 16 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos - 2 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 30;

  // ─── EGRESOS ADELANTOS ────────────────────────────────────────────────────
  const tituloAdelantos = "EGRESOS ADELANTOS";
  const tituloAdelantosWidth = fontBold.widthOfTextAtSize(tituloAdelantos, 10);
  page1.drawText(tituloAdelantos, {
    x: (pageWidth - tituloAdelantosWidth) / 2,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Tabla EGRESOS ADELANTOS - usar mismo ancho que tabla de cuotas
  const adelantosHeaders = ["N°", "Fecha Op.", "Descripción", "Monto Soles", "T/C", "Monto Dólares"];
  const adelantosColWidths = [40, 80, 185, 90, 70, 90];
  const adelantosTableWidth = cuotaTableWidth;
  const adelantosTableStartX = (pageWidth - adelantosTableWidth) / 2;

  // Header ADELANTOS - ROJO MUY CLARO
  page1.drawRectangle({ x: adelantosTableStartX, y: yPos - 3, width: adelantosTableWidth, height: 18, color: rojoMuyClaro });
  xPos = adelantosTableStartX;
  adelantosHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (adelantosColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += adelantosColWidths[i];
  });

  lineX = adelantosTableStartX;
  for (let i = 0; i <= adelantosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 15 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < adelantosColWidths.length) lineX += adelantosColWidths[i];
  }
  page1.drawLine({
    start: { x: adelantosTableStartX, y: yPos + 15 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos + 15 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: adelantosTableStartX, y: yPos - 3 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 3 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 18;

  // Datos ADELANTOS
  let totalSoles = 0;
  let totalDolares = 0;

  movimientos.forEach((mov, idx) => {
    const monedaId = Number(mov.monedaId);
    const monto = Number(mov.monto || 0);
    const tc = Number(mov.tipoCambio || tipoCambio);

    let montoSoles = 0;
    let montoDolares = 0;

    if (monedaId === 1) {
      montoSoles = monto;
      montoDolares = monto / tc;
    } else {
      montoDolares = monto;
      montoSoles = monto * tc;
    }

    totalSoles += montoSoles;
    totalDolares += montoDolares;

    const fechaOp = mov.fechaOperacionMovCaja ? new Date(mov.fechaOperacionMovCaja).toLocaleDateString("es-PE") : "-";
    const descripcion = mov.producto?.descripcionArmada || "-";

    const adelantoData = [
      String(idx + 1),
      fechaOp,
      descripcion,
      formatearNumero(montoSoles),
      formatearNumero(tc, 3),
      formatearNumero(montoDolares),
    ];

    page1.drawRectangle({ x: adelantosTableStartX, y: yPos - 2, width: adelantosTableWidth, height: 15, color: blanco });
    xPos = adelantosTableStartX;
    adelantoData.forEach((val, i) => {
      const align = i === 3 || i === 4 || i === 5 ? "right" : i === 0 || i === 1 ? "center" : "left";
      let textX;
      if (align === "right") {
        const textWidth = fontNormal.widthOfTextAtSize(val, 7);
        textX = xPos + adelantosColWidths[i] - textWidth - 2;
      } else if (align === "center") {
        const textWidth = fontNormal.widthOfTextAtSize(val, 7);
        textX = xPos + (adelantosColWidths[i] - textWidth) / 2;
      } else {
        textX = xPos + 2;
      }
      page1.drawText(val, { x: textX, y: yPos + 2, size: 7, font: fontNormal, color: rgb(0, 0, 0) });
      xPos += adelantosColWidths[i];
    });

    lineX = adelantosTableStartX;
    for (let i = 0; i <= adelantosColWidths.length; i++) {
      page1.drawLine({
        start: { x: lineX, y: yPos + 13 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < adelantosColWidths.length) lineX += adelantosColWidths[i];
    }
    page1.drawLine({
      start: { x: adelantosTableStartX, y: yPos - 2 },
      end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.5, 0.7, 0.8),
    });

    yPos -= 15;
  });

  // Total ADELANTOS
  page1.drawRectangle({ x: adelantosTableStartX, y: yPos - 2, width: adelantosTableWidth, height: 18, color: rojoMuyClaro });
  const totalAdelantosLabel = "TOTAL";
  const totalAdelantosLabelWidth = fontBold.widthOfTextAtSize(totalAdelantosLabel, 9);
  page1.drawText(totalAdelantosLabel, {
    x: adelantosTableStartX + (adelantosColWidths[0] + adelantosColWidths[1] + adelantosColWidths[2] - totalAdelantosLabelWidth) / 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalSolesText = formatearNumero(totalSoles);
  const totalSolesWidth = fontBold.widthOfTextAtSize(totalSolesText, 9);
  page1.drawText(totalSolesText, {
    x: adelantosTableStartX + adelantosColWidths[0] + adelantosColWidths[1] + adelantosColWidths[2] + adelantosColWidths[3] - totalSolesWidth - 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalDolaresText = formatearNumero(totalDolares);
  const totalDolaresWidth = fontBold.widthOfTextAtSize(totalDolaresText, 9);
  page1.drawText(totalDolaresText, {
    x: adelantosTableStartX + adelantosColWidths[0] + adelantosColWidths[1] + adelantosColWidths[2] + adelantosColWidths[3] + adelantosColWidths[4] + adelantosColWidths[5] - totalDolaresWidth - 2,
    y: yPos + 3,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  lineX = adelantosTableStartX;
  for (let i = 0; i <= adelantosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 16 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < adelantosColWidths.length) lineX += adelantosColWidths[i];
  }
  page1.drawLine({
    start: { x: adelantosTableStartX, y: yPos + 16 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos + 16 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: adelantosTableStartX, y: yPos - 2 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 30;

  // ─── RESUMEN ──────────────────────────────────────────────────────────────
  const tituloResumen = "RESUMEN";
  const tituloResumenWidth = fontBold.widthOfTextAtSize(tituloResumen, 10);
  page1.drawText(tituloResumen, {
    x: (pageWidth - tituloResumenWidth) / 2,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Tabla RESUMEN - 3 columnas
  const resumenColWidth = cuotaTableWidth / 3;
  const resumenTableStartX = (pageWidth - cuotaTableWidth) / 2;

  // Headers RESUMEN - VERDE MUY CLARO
  const resumenHeaders = ["Liquidación Total US$", "Total Adelantos", "Total a Pagar US$"];
  page1.drawRectangle({ x: resumenTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 18, color: verdeMuyClaro });
  resumenHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    const colX = resumenTableStartX + i * resumenColWidth;
    page1.drawText(h, {
      x: colX + (resumenColWidth - hw) / 2,
      y: yPos,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  });

  // Líneas header resumen
  for (let i = 0; i <= 3; i++) {
    page1.drawLine({
      start: { x: resumenTableStartX + i * resumenColWidth, y: yPos - 3 },
      end: { x: resumenTableStartX + i * resumenColWidth, y: yPos + 15 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
  }
  page1.drawLine({
    start: { x: resumenTableStartX, y: yPos + 15 },
    end: { x: resumenTableStartX + cuotaTableWidth, y: yPos + 15 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: resumenTableStartX, y: yPos - 3 },
    end: { x: resumenTableStartX + cuotaTableWidth, y: yPos - 3 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 18;

  // Datos RESUMEN
  const totalAPagar = totalPesca - totalDolares;
  const resumenData = [
    `$ ${formatearNumero(totalPesca)}`,
    `$ ${formatearNumero(totalDolares)}`,
    `$ ${formatearNumero(totalAPagar)}`,
  ];

  page1.drawRectangle({ x: resumenTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 18, color: blanco });
  resumenData.forEach((val, i) => {
    const colX = resumenTableStartX + i * resumenColWidth;
    const valWidth = fontBold.widthOfTextAtSize(val, 9);
    page1.drawText(val, {
      x: colX + (resumenColWidth - valWidth) / 2,
      y: yPos + 3,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  });

  // Líneas datos resumen
  for (let i = 0; i <= 3; i++) {
    page1.drawLine({
      start: { x: resumenTableStartX + i * resumenColWidth, y: yPos + 16 },
      end: { x: resumenTableStartX + i * resumenColWidth, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
  }
  page1.drawLine({
    start: { x: resumenTableStartX, y: yPos - 2 },
    end: { x: resumenTableStartX + cuotaTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 40;

  // ── FIRMAS ──
  const firmaY = yPos;
  const firmaWidth = 150;
  const firmaSpacing = 100;

  // Vº Bº
  const voBo = "Vº Bº";
  const voBoWidth = fontNormal.widthOfTextAtSize(voBo, 9);
  const voBoX = (pageWidth - firmaSpacing - firmaWidth * 2) / 2 + firmaWidth / 2;
  page1.drawLine({
    start: { x: voBoX - firmaWidth / 2, y: firmaY },
    end: { x: voBoX + firmaWidth / 2, y: firmaY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  page1.drawText(voBo, {
    x: voBoX - voBoWidth / 2,
    y: firmaY - 15,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // RECIBÍ CONFORME
  const recibi = "RECIBÍ CONFORME";
  const recibiWidth = fontNormal.widthOfTextAtSize(recibi, 9);
  const recibiX = voBoX + firmaWidth / 2 + firmaSpacing + firmaWidth / 2;
  page1.drawLine({
    start: { x: recibiX - firmaWidth / 2, y: firmaY },
    end: { x: recibiX + firmaWidth / 2, y: firmaY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  page1.drawText(recibi, {
    x: recibiX - recibiWidth / 2,
    y: firmaY - 15,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Razón Social debajo de RECIBÍ CONFORME
  const razonSocialFirma = temporada.entidadComercialComisionistaAlq?.razonSocial || "";
  if (razonSocialFirma) {
    const razonSocialWidth = fontBold.widthOfTextAtSize(razonSocialFirma, 9);
    page1.drawText(razonSocialFirma, {
      x: recibiX - razonSocialWidth / 2,
      y: firmaY - 30,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}