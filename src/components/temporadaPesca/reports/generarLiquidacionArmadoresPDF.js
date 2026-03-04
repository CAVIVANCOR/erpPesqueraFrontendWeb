// src/components/temporadaPesca/reports/generarLiquidacionArmadoresPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { formatearNumero } from "../../../utils/utils";

export async function generarLiquidacionArmadoresPDF(data) {
  const { temporada, cuotas, descargas, adelantos } = data;

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
    const tituloPrincipal = "LIQUIDACION DE PESCA INDUSTRIAL ARMADORES";
    const tituloPrincipalWidth = fontBold.widthOfTextAtSize(tituloPrincipal, 11);
    page.drawText(tituloPrincipal, {
      x: (width - tituloPrincipalWidth) / 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // Subtítulo principal: Entidad Empresarial Alquilada
    const subtituloPrincipal = temporada.entidadEmpresarialAlquilada?.razonSocial || "";
    if (subtituloPrincipal) {
      const subtituloPrincipalWidth = fontBold.widthOfTextAtSize(subtituloPrincipal, 12);
      page.drawText(subtituloPrincipal, {
        x: (width - subtituloPrincipalWidth) / 2, y: yPos, size: 12, font: fontBold, color: rgb(0, 0, 0),
      });
      yPos -= 25;
    }

    // Título del reporte
    const titulo = `LIQUIDACION N° ${temporada.id} ${temporada.nombre || ""}`;
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // ── Tabla cuotas ──
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaHeaders = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Precio/Ton", "PMCE (%)", "Limite Ton."];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;

    // Header cuotas
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 3, width: cuotaTableWidth, height: 20, color: celeste });
    let xPos = cuotaTableStartX;
    cuotaHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 9);
      page.drawText(h, { x: xPos + (cuotaColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
      xPos += cuotaColWidths[i];
    });
    
    // Líneas verticales header
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

    // Filas cuotas
    let totalLimiteTon = 0;
    cuotas.forEach((cuota, idx) => {
      const limiteTon = Number(cuota.porcentajeCuota || 0) * Number(temporada.limiteMaximoCapturaTn || 0) / 100;
      totalLimiteTon += limiteTon;
      
      const rowData = [
        String(idx + 1),
        cuota.zona || "-",
        "ALQUILADA",
        cuota.nombre || "-",
        cuota.esAlquiler ? "ALQUILER" : "PESCA",
        `$ ${formatearNumero(Number(temporada.precioPorTonAlquilerDolares || 0))}`,
        `${formatearNumero(Number(cuota.porcentajeCuota || 0), 4)}%`,
        `${formatearNumero(limiteTon, 3)} Ton.`,
      ];

      // FONDO BLANCO para datos
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 18,
        color: blanco,
      });

      xPos = cuotaTableStartX;
      rowData.forEach((val, i) => {
        const align = i === 5 || i === 6 || i === 7 ? "right" : i === 0 || i === 1 ? "center" : "left";
        const textX = align === "right"
          ? xPos + cuotaColWidths[i] - fontNormal.widthOfTextAtSize(val, 7) - 2
          : align === "center" 
          ? xPos + (cuotaColWidths[i] - fontNormal.widthOfTextAtSize(val, 7)) / 2
          : xPos + 2;
        page.drawText(val, { x: textX, y: yPos + 3, size: 7, font: fontNormal, color: rgb(0, 0, 0) });
        xPos += cuotaColWidths[i];
      });

      // Líneas verticales
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
      // Línea horizontal inferior
      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 18;
    });

    // Total
    page.drawRectangle({ x: cuotaTableStartX, y: yPos - 2, width: cuotaTableWidth, height: 20, color: celeste });
    const totalText = "TOTAL";
    const totalTextWidth = fontBold.widthOfTextAtSize(totalText, 9);
    page.drawText(totalText, {
      x: cuotaTableStartX + cuotaColWidths[0] + cuotaColWidths[1] + cuotaColWidths[2] + cuotaColWidths[3] + cuotaColWidths[4] + cuotaColWidths[5] + (cuotaColWidths[6] - totalTextWidth) / 2,
      y: yPos + 4,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    const totalTonText = `${formatearNumero(totalLimiteTon, 3)} Ton.`;
    const totalTonWidth = fontBold.widthOfTextAtSize(totalTonText, 9);
    page.drawText(totalTonText, {
      x: cuotaTableStartX + cuotaColWidths[0] + cuotaColWidths[1] + cuotaColWidths[2] + cuotaColWidths[3] + cuotaColWidths[4] + cuotaColWidths[5] + cuotaColWidths[6] + cuotaColWidths[7] - totalTonWidth - 2,
      y: yPos + 4,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Líneas del total
    lineX = cuotaTableStartX;
    for (let i = 0; i <= cuotaColWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos - 2 },
        end: { x: lineX, y: yPos + 18 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < cuotaColWidths.length) lineX += cuotaColWidths[i];
    }
    page.drawLine({
      start: { x: cuotaTableStartX, y: yPos - 2 },
      end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });

    yPos -= 25;
    return { yPos, totalLimiteTon, cuotaTableWidth };
  };

  // ─── PÁGINA 1: Encabezado + Detalle ──────────────────────────────────────
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  const { yPos: yPosAfterHeader, totalLimiteTon, cuotaTableWidth } = dibujarEncabezado(page1);
  let yPos = yPosAfterHeader;

  // Encontrar especie con mayor tonelaje (o usar la primera si no hay descargas)
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

  // ── INGRESOS PESCA ──
  const tituloIngresos = "INGRESOS PESCA";
  const tituloIngresosWidth = fontBold.widthOfTextAtSize(tituloIngresos, 9);
  page1.drawText(tituloIngresos, {
    x: (pageWidth - tituloIngresosWidth) / 2,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Tabla INGRESOS - MISMO ANCHO QUE CUOTAS
  const ingresosColWidths = [100, 120, 100, 100, 135];
  const ingresosHeaders = ["FECHA", "ESPECIE", "TM", "PRECIO", "TOTAL"];
  const ingresosTableWidth = cuotaTableWidth;
  const ingresosTableStartX = (pageWidth - ingresosTableWidth) / 2;

  // Header - AZUL MUY CLARO
  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 3, width: ingresosTableWidth, height: 18, color: azulMuyClaro });
  let xPos = ingresosTableStartX;
  ingresosHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (ingresosColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += ingresosColWidths[i];
  });
  
  // Líneas header
  let lineX = ingresosTableStartX;
  for (let i = 0; i < ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 15 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += ingresosColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 3 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos + 15 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  yPos -= 18;

  // Fila de datos
  const fechaFin = temporada.fechaFin ? new Date(temporada.fechaFin).toLocaleDateString("es-PE") : "-";
  const precioTon = Number(temporada.precioPorTonAlquilerDolares || 0);
  const totalPesca = totalLimiteTon * precioTon;

  const ingresosData = [
    fechaFin,
    especieMayorTonelaje,
    formatearNumero(totalLimiteTon, 3),
    `$ ${formatearNumero(precioTon)}`,
    `$ ${formatearNumero(totalPesca)}`,
  ];

  // FONDO BLANCO para datos
  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 2, width: ingresosTableWidth, height: 18, color: blanco });
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

  // Líneas fila datos
  lineX = ingresosTableStartX;
  for (let i = 0; i < ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 16 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    lineX += ingresosColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: ingresosTableStartX + ingresosTableWidth, y: yPos + 16 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 },
    thickness: 0.3,
    color: rgb(0.8, 0.8, 0.8),
  });
  page1.drawLine({
    start: { x: ingresosTableStartX, y: yPos - 2 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 },
    thickness: 0.3,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPos -= 18;

  // Total PESCA - AZUL MUY CLARO
  page1.drawRectangle({ x: ingresosTableStartX, y: yPos - 2, width: ingresosTableWidth, height: 20, color: azulMuyClaro });
  const totalPescaText = "TOTAL";
  page1.drawText(totalPescaText, {
    x: ingresosTableStartX + ingresosColWidths[0]+ 55,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const totalTMText = formatearNumero(totalLimiteTon, 3);
  const totalTMWidth = fontBold.widthOfTextAtSize(totalTMText, 9);
  page1.drawText(totalTMText, {
    x: ingresosTableStartX + ingresosColWidths[0] + ingresosColWidths[1] + ingresosColWidths[2] - totalTMWidth - 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const totalPescaValor = `$ ${formatearNumero(totalPesca)}`;
  const totalPescaWidth = fontBold.widthOfTextAtSize(totalPescaValor, 9);
  page1.drawText(totalPescaValor, {
    x: ingresosTableStartX + ingresosTableWidth - totalPescaWidth - 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Líneas total pesca
  lineX = ingresosTableStartX;
  for (let i = 0; i < ingresosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 2 },
      end: { x: lineX, y: yPos + 18 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += ingresosColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: ingresosTableStartX + ingresosTableWidth, y: yPos - 2 },
    end: { x: ingresosTableStartX + ingresosTableWidth, y: yPos + 18 },
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

  // ── EGRESOS ADELANTOS ──
  const tituloAdelantos = "EGRESOS ADELANTOS";
  const tituloAdelantosWidth = fontBold.widthOfTextAtSize(tituloAdelantos, 9);
  page1.drawText(tituloAdelantos, {
    x: (pageWidth - tituloAdelantosWidth) / 2,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Tabla ADELANTOS - MISMO ANCHO QUE CUOTAS
  const adelantosColWidths = [35, 80, 170, 95, 60, 115];
  const adelantosHeaders = ["N°", "Fecha Op.", "Descripción", "Monto Soles", "T/C", "Monto Dólares"];
  const adelantosTableWidth = cuotaTableWidth;
  const adelantosTableStartX = (pageWidth - adelantosTableWidth) / 2;

  // Header - ROJO MUY CLARO
  page1.drawRectangle({ x: adelantosTableStartX, y: yPos - 3, width: adelantosTableWidth, height: 18, color: rojoMuyClaro });
  xPos = adelantosTableStartX;
  adelantosHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (adelantosColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += adelantosColWidths[i];
  });
  
  // Líneas header adelantos
  lineX = adelantosTableStartX;
  for (let i = 0; i < adelantosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 15 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += adelantosColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 3 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos + 15 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  yPos -= 18;

  let totalSoles = 0;
  let totalDolares = 0;

  adelantos.forEach((adelanto, idx) => {
    const monedaId = Number(adelanto.monedaId);
    const monto = Number(adelanto.monto || 0);
    const tc = Number(adelanto.tipoCambio || tipoCambio);
    
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

    const fechaOp = adelanto.fechaOperacionMovCaja ? new Date(adelanto.fechaOperacionMovCaja).toLocaleDateString("es-PE") : "-";
    const descripcion = adelanto.producto?.descripcionArmada || "-";

    const adelantoData = [
      String(idx + 1),
      fechaOp,
      descripcion.length > 35 ? descripcion.substring(0, 32) + "..." : descripcion,
      formatearNumero(montoSoles),
      formatearNumero(tc, 3),
      formatearNumero(montoDolares),
    ];

    // FONDO BLANCO para datos
    page1.drawRectangle({
      x: adelantosTableStartX,
      y: yPos - 2,
      width: adelantosTableWidth,
      height: 16,
      color: blanco,
    });

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
      page1.drawText(val, { x: textX, y: yPos + 3, size: 7, font: fontNormal, color: rgb(0, 0, 0) });
      xPos += adelantosColWidths[i];
    });

    // Líneas fila adelantos
    lineX = adelantosTableStartX;
    for (let i = 0; i < adelantosColWidths.length; i++) {
      page1.drawLine({
        start: { x: lineX, y: yPos + 14 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      lineX += adelantosColWidths[i];
    }
    // Última línea vertical derecha
    page1.drawLine({
      start: { x: adelantosTableStartX + adelantosTableWidth, y: yPos + 14 },
      end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    page1.drawLine({
      start: { x: adelantosTableStartX, y: yPos - 2 },
      end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 16;

    if (yPos < 100) {
      const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - 40;
    }
  });

  // Total ADELANTOS - ROJO MUY CLARO
  page1.drawRectangle({ x: adelantosTableStartX, y: yPos - 2, width: adelantosTableWidth, height: 20, color: rojoMuyClaro });
  const totalAdelantosText = "TOTAL";
  page1.drawText(totalAdelantosText, {
    x: adelantosTableStartX + adelantosColWidths[0] + adelantosColWidths[1] + adelantosColWidths[2] -40,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const totalSolesText = formatearNumero(totalSoles);
  const totalSolesWidth = fontBold.widthOfTextAtSize(totalSolesText, 9);
  page1.drawText(totalSolesText, {
    x: adelantosTableStartX + adelantosColWidths[0] + adelantosColWidths[1] + adelantosColWidths[2] + adelantosColWidths[3] - totalSolesWidth - 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const totalDolaresText = formatearNumero(totalDolares);
  const totalDolaresWidth = fontBold.widthOfTextAtSize(totalDolaresText, 9);
  page1.drawText(totalDolaresText, {
    x: adelantosTableStartX + adelantosTableWidth - totalDolaresWidth - 2,
    y: yPos + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Líneas total adelantos
  lineX = adelantosTableStartX;
  for (let i = 0; i < adelantosColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 2 },
      end: { x: lineX, y: yPos + 18 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += adelantosColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: adelantosTableStartX + adelantosTableWidth, y: yPos - 2 },
    end: { x: adelantosTableStartX + adelantosTableWidth, y: yPos + 18 },
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

  // ── RESUMEN (TABLA CON 3 COLUMNAS Y FONDO VERDE MUY CLARO) ──
  const tituloResumen = "RESUMEN";
  const tituloResumenWidth = fontBold.widthOfTextAtSize(tituloResumen, 9);
  page1.drawText(tituloResumen, {
    x: (pageWidth - tituloResumenWidth) / 2,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  // Tabla RESUMEN - MISMO ANCHO QUE CUOTAS
  const resumenColWidths = [178, 178, 179];
  const resumenHeaders = ["Liquidación Total US$", "Total Adelantos", "Total a Pagar US$"];
  const resumenTableWidth = cuotaTableWidth;
  const resumenTableStartX = (pageWidth - resumenTableWidth) / 2;

  // Header - VERDE MUY CLARO
  page1.drawRectangle({ x: resumenTableStartX, y: yPos - 3, width: resumenTableWidth, height: 20, color: verdeMuyClaro });
  xPos = resumenTableStartX;
  resumenHeaders.forEach((h, i) => {
    const hw = fontBold.widthOfTextAtSize(h, 9);
    page1.drawText(h, { x: xPos + (resumenColWidths[i] - hw) / 2, y: yPos, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += resumenColWidths[i];
  });

  // Líneas verticales header
  lineX = resumenTableStartX;
  for (let i = 0; i < resumenColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += resumenColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: resumenTableStartX + resumenTableWidth, y: yPos - 3 },
    end: { x: resumenTableStartX + resumenTableWidth, y: yPos + 17 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  yPos -= 20;

  // Fila de datos - TODO CENTRADO EN RESUMEN
  const totalAPagar = totalPesca - totalDolares;
  const resumenData = [
    `$ ${formatearNumero(totalPesca)}`,
    `$ ${formatearNumero(totalDolares)}`,
    `$ ${formatearNumero(totalAPagar)}`,
  ];

  // FONDO BLANCO para datos
  page1.drawRectangle({ x: resumenTableStartX, y: yPos - 2, width: resumenTableWidth, height: 20, color: blanco });
  xPos = resumenTableStartX;
  resumenData.forEach((val, i) => {
    const textX = xPos + (resumenColWidths[i] - fontNormal.widthOfTextAtSize(val, 9)) / 2;
    page1.drawText(val, { x: textX, y: yPos + 4, size: 9, font: fontBold, color: rgb(0, 0, 0) });
    xPos += resumenColWidths[i];
  });

  // Líneas verticales datos
  lineX = resumenTableStartX;
  for (let i = 0; i < resumenColWidths.length; i++) {
    page1.drawLine({
      start: { x: lineX, y: yPos + 18 },
      end: { x: lineX, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    lineX += resumenColWidths[i];
  }
  // Última línea vertical derecha
  page1.drawLine({
    start: { x: resumenTableStartX + resumenTableWidth, y: yPos + 18 },
    end: { x: resumenTableStartX + resumenTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });
  page1.drawLine({
    start: { x: resumenTableStartX, y: yPos - 2 },
    end: { x: resumenTableStartX + resumenTableWidth, y: yPos - 2 },
    thickness: 0.5,
    color: rgb(0.5, 0.7, 0.8),
  });

  yPos -= 40;

  // Firmas
  const firmaY = 80;
  const firmaWidth = 150;
  const firma1X = 100;
  const firma2X = pageWidth - 100 - firmaWidth;

  page1.drawLine({
    start: { x: firma1X, y: firmaY },
    end: { x: firma1X + firmaWidth, y: firmaY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  const voBo = "Vº Bº";
  const voBoWidth = fontNormal.widthOfTextAtSize(voBo, 8);
  page1.drawText(voBo, {
    x: firma1X + (firmaWidth - voBoWidth) / 2,
    y: firmaY - 15,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page1.drawLine({
    start: { x: firma2X, y: firmaY },
    end: { x: firma2X + firmaWidth, y: firmaY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  const recibi = "RECIBÍ CONFORME";
  const recibiWidth = fontNormal.widthOfTextAtSize(recibi, 8);
  page1.drawText(recibi, {
    x: firma2X + (firmaWidth - recibiWidth) / 2,
    y: firmaY - 15,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Razón Social debajo de RECIBÍ CONFORME
  const razonSocialFirma = temporada.entidadEmpresarialAlquilada?.razonSocial || "";
  if (razonSocialFirma) {
    const razonSocialWidth = fontBold.widthOfTextAtSize(razonSocialFirma, 8);
    page1.drawText(razonSocialFirma, {
      x: firma2X + (firmaWidth - razonSocialWidth) / 2,
      y: firmaY - 28,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}