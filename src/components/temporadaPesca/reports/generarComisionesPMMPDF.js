// src/components/temporadaPesca/reports/generarComisionesPMMPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";

export async function generarComisionesPMMPDF(data) {
  const { temporada, cuotas, descargas, patron, motorista, panguero } = data;

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
  const amarilloClaro = rgb(1, 0.95, 0.7);

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
      page.drawImage(logoImage, {
        x: margin,
        y: yPos - finalHeight,
        width: finalWidth,
        height: finalHeight,
      });
    }

    // Empresa
    page.drawText(temporada.empresa?.razonSocial || "EMPRESA", {
      x: margin + 90,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
    page.drawText(`RUC: ${temporada.empresa?.ruc || "-"}`, {
      x: margin + 90,
      y: yPos,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
    if (temporada.empresa?.direccion) {
      page.drawText(`Direccion: ${temporada.empresa.direccion}`, {
        x: margin + 90,
        y: yPos,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }
    yPos -= 10;

    // Título del reporte
    const titulo = "REPORTE DE COMISIONES PESCA INDUSTRIAL";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    const subtitulo = "PATRON - MOTORISTA - PANGUERO";
    const subtituloWidth = fontBold.widthOfTextAtSize(subtitulo, 10);
    page.drawText(subtitulo, {
      x: (width - subtituloWidth) / 2,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 18;

    const nombreTemporada = temporada.nombre || "TEMPORADA";
    const nombreWidth = fontBold.widthOfTextAtSize(nombreTemporada, 14);
    page.drawText(nombreTemporada, {
      x: (width - nombreWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;

    // ── Tabla cuotas ──
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaHeaders = [
      "N°",
      "Zona",
      "Tipo Cuota",
      "Nombre",
      "Estado Op.",
      "Precio/Ton",
      "PMCE (%)",
      "Limite Ton.",
    ];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;
    const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);

    // Header cuotas
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 20,
      color: celeste,
    });
    let xPos = cuotaTableStartX;
    cuotaHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      page.drawText(h, {
        x: xPos + (cuotaColWidths[i] - hw) / 2,
        y: yPos,
        size: 7,
        font: fontBold,
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
        cuota.precioPorTonDolares
          ? Number(cuota.precioPorTonDolares).toLocaleString("es-PE", {
              minimumFractionDigits: 2,
            })
          : "-",
        porcentaje > 0 ? porcentaje.toFixed(6) : "-",
        limiteTon.toLocaleString("es-PE", { minimumFractionDigits: 3 }) +
          " Ton.",
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
        let dv = value;
        const maxW = cuotaColWidths[i] - 4;
        while (fontNormal.widthOfTextAtSize(dv, 6.5) > maxW && dv.length > 3)
          dv = dv.substring(0, dv.length - 1);
        if (dv !== value && dv.length > 3)
          dv = dv.substring(0, dv.length - 3) + "...";
        let textX;
        if (i === 0 || i === 5 || i === 6 || i === 7) {
          textX =
            xPos +
            cuotaColWidths[i] -
            fontNormal.widthOfTextAtSize(dv, 6.5) -
            2;
        } else {
          textX = xPos + 2;
        }
        page.drawText(dv, {
          x: textX,
          y: yPos + 3,
          size: 6.5,
          font: fontNormal,
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

    // Fila TOTAL cuotas
    yPos -= 5;
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 20,
      color: celeste,
    });
    const totalLabel = "TOTAL";
    const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
    const xInicioColPMCE = cuotaColWidths
      .slice(0, 6)
      .reduce((a, b) => a + b, 0);
    page.drawText(totalLabel, {
      x:
        cuotaTableStartX +
        xInicioColPMCE +
        (cuotaColWidths[6] - totalLabelWidth) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    const totalCuotaText = `${totalCalculado.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Ton.`;
    const totalCuotaWidth = fontBold.widthOfTextAtSize(totalCuotaText, 8);
    page.drawText(totalCuotaText, {
      x: cuotaTableStartX + cuotaTableWidth - totalCuotaWidth - 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    lineX = cuotaTableStartX;
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

    // SALDO CUOTA título
    const tituloSeccion = `SALDO CUOTA ${temporada.nombre || ""}`;
    const tituloSeccionWidth = fontBold.widthOfTextAtSize(tituloSeccion, 10);
    page.drawText(tituloSeccion, {
      x: (width - tituloSeccionWidth) / 2,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 8;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPos -= 15;

    // Cuadro resumen
    const avanceTotal = (descargas ?? []).reduce(
      (sum, d) => sum + Number(d.toneladas || 0),
      0,
    );
    const saldoTotal = totalCalculado - avanceTotal;
    const porcentajeAvanzado =
      totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;
    const porcentajeBaseLiq = Number(temporada.porcentajeBaseLiqPesca || 0);
    const precioPorTonTemporada = Number(temporada.precioPorTonDolares || 0);
    const montoBaseCalculo = (avanceTotal * precioPorTonTemporada) * (porcentajeBaseLiq / 100);
    
    const resumenColWidths = [
      cuotaTableWidth / 6,
      cuotaTableWidth / 6,
      cuotaTableWidth / 6,
      cuotaTableWidth / 6,
      cuotaTableWidth / 6,
      cuotaTableWidth / 6,
    ];
    const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado", "Base Calculo (%)", "Monto Base Calculo US$"];
    const resumenData = [
      `${totalCalculado.toLocaleString("es-PE", { minimumFractionDigits: 3 })} Ton.`,
      `${avanceTotal.toLocaleString("es-PE", { minimumFractionDigits: 3 })} Ton.`,
      `${saldoTotal.toLocaleString("es-PE", { minimumFractionDigits: 3 })} Ton.`,
      `${porcentajeAvanzado.toFixed(2)}%`,
      `${porcentajeBaseLiq.toFixed(2)}%`,
      `${montoBaseCalculo.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ];
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 20,
      color: celeste,
    });
    let xPosRes = cuotaTableStartX;
    resumenHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 8);
      page.drawText(h, {
        x: xPosRes + (resumenColWidths[i] - hw) / 2,
        y: yPos,
        size: 8,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPosRes += resumenColWidths[i];
    });
    let lineXRes = cuotaTableStartX;
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
      x: cuotaTableStartX,
      y: yPos - 2,
      width: cuotaTableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });
    xPosRes = cuotaTableStartX;
    resumenData.forEach((value, i) => {
      const tw = fontNormal.widthOfTextAtSize(value, 8);
      page.drawText(value, {
        x: xPosRes + (resumenColWidths[i] - tw) / 2,
        y: yPos + 3,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      xPosRes += resumenColWidths[i];
    });
    lineXRes = cuotaTableStartX;
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
      start: { x: cuotaTableStartX, y: yPos - 2 },
      end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 25;

    return {
      yPos,
      cuotaTableStartX,
      cuotaTableWidth,
      totalCalculado,
      avanceTotal,
    };
  };

  // ─── HELPER: Dibujar sección de rol (Patrón, Motorista o Panguero) ────────
  const dibujarSeccionRol = async (
    page,
    yPos,
    rolNombre,
    rolData,
    precioPorTon,
    cuotaTableStartX,
    cuotaTableWidth,
    colorHeader,
  ) => {
    const { width } = page.getSize();
    const personal = rolData.personal;
    const descuentos = rolData.descuentos || [];

    // Título de la sección con nombre del personal
    const nombreCompleto =
      `${personal.nombres || ""} ${personal.apellidos || ""}`.trim();
    const tituloRol = `COMISION ${rolNombre.toUpperCase()} (${nombreCompleto})`;
    const tituloRolWidth = fontBold.widthOfTextAtSize(tituloRol, 10);
    page.drawText(tituloRol, {
      x: (width - tituloRolWidth) / 2,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 8;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPos -= 15;

    // INGRESOS (cálculo según rol)
    const tituloIngresos = `INGRESOS ${rolNombre}`;
    const tituloIngresosWidth = fontBold.widthOfTextAtSize(tituloIngresos, 9);
    page.drawText(tituloIngresos, {
      x: cuotaTableStartX,
      y: yPos,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Calcular ingresos según el rol
    const totalToneladas = (descargas ?? []).reduce(
      (sum, d) => sum + Number(d.toneladas || 0),
      0,
    );
    const totalPesca = totalToneladas * precioPorTon;
    const porcentajeBase = Number(temporada.porcentajeBaseLiqPesca || 0);
    const baseLiquidacion = totalPesca * (porcentajeBase / 100);

    let montoComision = 0;
    let montoComisionMotorista = 0;
    let detalleCalculo = "";

    // Calcular comisión Motorista primero (necesario para Panguero)
    const cantPersonal = Number(temporada.cantPersonalCalcComisionMotorista || 0);
    const cantDivisoria = Number(temporada.cantDivisoriaCalcComisionMotorista || 0);
    if (cantDivisoria > 0) {
      montoComisionMotorista = baseLiquidacion / cantPersonal / cantDivisoria;
    }

    if (rolNombre === "PATRON") {
      const porcentajePatron = Number(temporada.porcentajeComisionPatron || 0);
      montoComision = baseLiquidacion * (porcentajePatron / 100);
      detalleCalculo = `Base Liquidacion: ${baseLiquidacion.toLocaleString("es-PE", { minimumFractionDigits: 2 })} x ${porcentajePatron.toFixed(2)}%`;
    } else if (rolNombre === "MOTORISTA") {
      montoComision = montoComisionMotorista;
      detalleCalculo = `(Base Liq. / ${cantPersonal}) / ${cantDivisoria}`;
    } else if (rolNombre === "PANGUERO") {
      if (cantDivisoria > 0) {
        montoComision = montoComisionMotorista / cantDivisoria;
      }
      detalleCalculo = `(Comision Motorista / ${cantDivisoria})`;
    }

    // Tabla de ingresos - PATRON y MOTORISTA tienen tablas extendidas
    let xp, lx;
    if (rolNombre === "PATRON") {
      // Obtener TC de la fecha fin de temporada
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const porcentajePatron = Number(temporada.porcentajeComisionPatron || 0);
      const precioPorTonDolares = Number(temporada.precioPorTonDolares || 0);
      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingColWidths = [70, 90, 100, 55, 90, 150];
      const ingHeaders = ["Fecha", "Concepto", "Monto S/", "T/C", "% Comisi\u00f3n", "Monto US$"];
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 3,
        width: cuotaTableWidth,
        height: 18,
        color: colorHeader,
      });
      xp = cuotaTableStartX;
      ingHeaders.forEach((h, i) => {
        const hw = fontBold.widthOfTextAtSize(h, 6.5);
        page.drawText(h, {
          x: xp + (ingColWidths[i] - hw) / 2,
          y: yPos,
          size: 6.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });
      lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos - 3 },
          end: { x: lx, y: yPos + 15 },
          thickness: 0.5,
          color: rgb(0.5, 0.7, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      yPos -= 18;

      // Fila de datos Patr\u00f3n
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 16,
        color: rgb(1, 1, 1),
      });

      const rowData = [
        fechaFin,
        "COMISION",
        montoSoles.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        tcFechaFin.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        `${porcentajePatron.toFixed(2)}%`,
        montoComision.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];

      xp = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let textX;
        if (i === 2 || i === 3 || i === 4 || i === 5) {
          const tw = fontNormal.widthOfTextAtSize(value, 6.5);
          textX = xp + ingColWidths[i] - tw - 2;
        } else {
          textX = xp + 2;
        }
        page.drawText(value, {
          x: textX,
          y: yPos + 2,
          size: 6.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });

      lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos + 14 },
          end: { x: lx, y: yPos - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 16;
    } else if (rolNombre === "MOTORISTA") {
      // Obtener TC de la fecha fin de temporada
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const cantPersonal = Number(temporada.cantPersonalCalcComisionMotorista || 0);
      const cantDivisoria = Number(temporada.cantDivisoriaCalcComisionMotorista || 0);
      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingColWidths = [65, 80, 90, 50, 100, 70, 100];
      const ingHeaders = ["Fecha", "Concepto", "Monto S/", "T/C", "Personal/Divisoria", "Divisoria", "Monto US$"];
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 3,
        width: cuotaTableWidth,
        height: 18,
        color: colorHeader,
      });
      let xp = cuotaTableStartX;
      ingHeaders.forEach((h, i) => {
        const hw = fontBold.widthOfTextAtSize(h, 6.5);
        page.drawText(h, {
          x: xp + (ingColWidths[i] - hw) / 2,
          y: yPos,
          size: 6.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });
      let lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos - 3 },
          end: { x: lx, y: yPos + 15 },
          thickness: 0.5,
          color: rgb(0.5, 0.7, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      yPos -= 18;

      // Fila de datos
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 16,
        color: rgb(1, 1, 1),
      });

      const rowData = [
        fechaFin,
        "COMISION",
        montoSoles.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        tcFechaFin.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        cantPersonal.toString(),
        cantDivisoria.toString(),
        montoComision.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];

      xp = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let textX;
        if (i === 2 || i === 3 || i === 6) {
          const tw = fontNormal.widthOfTextAtSize(value, 6.5);
          textX = xp + ingColWidths[i] - tw - 2;
        } else if (i === 4 || i === 5) {
          const tw = fontNormal.widthOfTextAtSize(value, 6.5);
          textX = xp + (ingColWidths[i] - tw) / 2;
        } else {
          textX = xp + 2;
        }
        page.drawText(value, {
          x: textX,
          y: yPos + 2,
          size: 6.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });

      lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos + 14 },
          end: { x: lx, y: yPos - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 16;
    } else {
      // Tabla extendida para PANGUERO
      let tcFechaFin = 1;
      if (temporada.fechaFin) {
        const fechaFinISO = new Date(temporada.fechaFin).toISOString().split("T")[0];
        const obtenerTCConReintento = async (fechaISO) => {
          const fecha = new Date(fechaISO + "T00:00:00");
          for (let i = 0; i <= 7; i++) {
            const f = new Date(fecha);
            f.setDate(f.getDate() - i);
            const fISO = f.toISOString().split("T")[0];
            try {
              const resp = await consultarTipoCambioSunat({ date: fISO });
              if (resp?.sell_price) return parseFloat(resp.sell_price);
            } catch (e) {
              // continuar
            }
          }
          return 1;
        };
        tcFechaFin = await obtenerTCConReintento(fechaFinISO);
      }

      const montoSoles = montoComision * tcFechaFin;
      const fechaFin = temporada.fechaFin
        ? new Date(temporada.fechaFin).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";

      const ingColWidths = [80, 100, 110, 60, 105, 100];
      const ingHeaders = ["Fecha", "Concepto", "Monto S/", "T/C", "Cant Divisoria", "Monto US$"];
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 3,
        width: cuotaTableWidth,
        height: 18,
        color: colorHeader,
      });
      xp = cuotaTableStartX;
      ingHeaders.forEach((h, i) => {
        const hw = fontBold.widthOfTextAtSize(h, 6.5);
        page.drawText(h, {
          x: xp + (ingColWidths[i] - hw) / 2,
          y: yPos,
          size: 6.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });
      lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos - 3 },
          end: { x: lx, y: yPos + 15 },
          thickness: 0.5,
          color: rgb(0.5, 0.7, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      yPos -= 18;

      // Fila de datos Panguero
      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 16,
        color: rgb(1, 1, 1),
      });

      const rowData = [
        fechaFin,
        "COMISION",
        montoSoles.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        tcFechaFin.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        cantDivisoria.toString(),
        montoComision.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];

      xp = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let textX;
        if (i === 2 || i === 3 || i === 5) {
          const tw = fontNormal.widthOfTextAtSize(value, 6.5);
          textX = xp + ingColWidths[i] - tw - 2;
        } else if (i === 4) {
          const tw = fontNormal.widthOfTextAtSize(value, 6.5);
          textX = xp + (ingColWidths[i] - tw) / 2;
        } else {
          textX = xp + 2;
        }
        page.drawText(value, {
          x: textX,
          y: yPos + 2,
          size: 6.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xp += ingColWidths[i];
      });

      lx = cuotaTableStartX;
      for (let i = 0; i <= ingColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos + 14 },
          end: { x: lx, y: yPos - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < ingColWidths.length) lx += ingColWidths[i];
      }
      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 16;
    }


    // EGRESOS (descuentos)
    yPos -= 10;
    const tituloEgresos = "EGRESOS (ADELANTOS)";
    const tituloEgresosWidth = fontBold.widthOfTextAtSize(tituloEgresos, 9);
    page.drawText(tituloEgresos, {
      x: cuotaTableStartX,
      y: yPos,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Pre-cargar tipos de cambio
    const tcCache = {};
    const fechasUnicas = [
      ...new Set(
        descuentos
          .filter((d) => d.fechaOperacionMovCaja || d.fechaMovimiento)
          .map((d) => {
            const fechaRaw = d.fechaOperacionMovCaja || d.fechaMovimiento;
            return new Date(fechaRaw).toISOString().split("T")[0];
          }),
      ),
    ];

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
          // continuar
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
      }),
    );

    // Tabla de egresos
    const egrColWidths = [25, 70, 220, 80, 35, 125];
    const egrHeaders = [
      "N°",
      "Fecha",
      "Descripcion",
      "Monto S/",
      "T/C",
      "Monto US$",
    ];
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 18,
      color: rojoClaro,
    });
    xp = cuotaTableStartX;
    egrHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      page.drawText(h, {
        x: xp + (egrColWidths[i] - hw) / 2,
        y: yPos,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xp += egrColWidths[i];
    });
    lx = cuotaTableStartX;
    for (let i = 0; i <= egrColWidths.length; i++) {
      page.drawLine({
        start: { x: lx, y: yPos - 3 },
        end: { x: lx, y: yPos + 15 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < egrColWidths.length) lx += egrColWidths[i];
    }
    yPos -= 18;

    let totalEgresosSoles = 0;
    let totalEgresosDolares = 0;

    descuentos.forEach((desc, index) => {
      const esSoles = Number(desc.monedaId) === 1;
      const monto = Number(desc.monto || 0);
      const fechaRaw = desc.fechaOperacionMovCaja || desc.fechaMovimiento;
      const fechaISO = fechaRaw
        ? new Date(fechaRaw).toISOString().split("T")[0]
        : null;
      const tc = fechaISO && tcCache[fechaISO] ? tcCache[fechaISO] : 1;
      const montoSoles = esSoles ? monto : monto * tc;
      const montoDolares = esSoles ? (tc > 0 ? monto / tc : monto) : monto;
      totalEgresosSoles += montoSoles;
      totalEgresosDolares += montoDolares;

      const fecha = fechaRaw
        ? new Date(fechaRaw).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-";
      const descripcion =
        desc.producto?.descripcionArmada || desc.descripcion || "-";
      const tcText =
        tc > 0
          ? tc.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "-";

      const rowData = [
        (index + 1).toString(),
        fecha,
        descripcion,
        montoSoles.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        tcText,
        montoDolares.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ];

      page.drawRectangle({
        x: cuotaTableStartX,
        y: yPos - 2,
        width: cuotaTableWidth,
        height: 16,
        color: rgb(1, 1, 1),
      });

      xp = cuotaTableStartX;
      rowData.forEach((value, i) => {
        let dv = value;
        const maxW = egrColWidths[i] - 4;
        while (fontNormal.widthOfTextAtSize(dv, 6.5) > maxW && dv.length > 3)
          dv = dv.substring(0, dv.length - 1);
        if (dv !== value && dv.length > 3)
          dv = dv.substring(0, dv.length - 3) + "...";
        let textX;
        if (i === 0 || i === 3 || i === 4 || i === 5) {
          textX =
            xp + egrColWidths[i] - fontNormal.widthOfTextAtSize(dv, 6.5) - 2;
        } else {
          textX = xp + 2;
        }
        page.drawText(dv, {
          x: textX,
          y: yPos + 2,
          size: 6.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        xp += egrColWidths[i];
      });

      lx = cuotaTableStartX;
      for (let i = 0; i <= egrColWidths.length; i++) {
        page.drawLine({
          start: { x: lx, y: yPos + 14 },
          end: { x: lx, y: yPos - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < egrColWidths.length) lx += egrColWidths[i];
      }
      page.drawLine({
        start: { x: cuotaTableStartX, y: yPos - 2 },
        end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPos -= 16;
    });

    // Fila TOTALES egresos
    yPos -= 5;
    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 18,
      color: rojoClaro,
    });
    const totLabel = "TOTALES";
    const totLabelWidth = fontBold.widthOfTextAtSize(totLabel, 8);
    const xInicioDesc = egrColWidths.slice(0, 2).reduce((a, b) => a + b, 0);
    page.drawText(totLabel, {
      x: cuotaTableStartX + xInicioDesc + (egrColWidths[2] - totLabelWidth) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    const totSolesText = totalEgresosSoles.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const totSolesWidth = fontBold.widthOfTextAtSize(totSolesText, 8);
    const xInicioSoles = egrColWidths.slice(0, 3).reduce((a, b) => a + b, 0);
    page.drawText(totSolesText, {
      x: cuotaTableStartX + xInicioSoles + egrColWidths[3] - totSolesWidth - 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    const totDolaresText = totalEgresosDolares.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const totDolaresWidth = fontBold.widthOfTextAtSize(totDolaresText, 8);
    const xInicioDolares = egrColWidths.slice(0, 5).reduce((a, b) => a + b, 0);
    page.drawText(totDolaresText, {
      x:
        cuotaTableStartX +
        xInicioDolares +
        egrColWidths[5] -
        totDolaresWidth -
        2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    lx = cuotaTableStartX;
    for (let i = 0; i <= egrColWidths.length; i++) {
      page.drawLine({
        start: { x: lx, y: yPos - 3 },
        end: { x: lx, y: yPos + 15 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < egrColWidths.length) lx += egrColWidths[i];
    }
    yPos -= 25;

    // RESUMEN
    const saldoFinal = montoComision - totalEgresosDolares;
    const resColWidths = [
      cuotaTableWidth / 3,
      cuotaTableWidth / 3,
      cuotaTableWidth / 3,
    ];
    const resHeaders = ["Comision US$", "Egresos US$", "Saldo US$"];
    const resData = [
      montoComision.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalEgresosDolares.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      saldoFinal.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ];

    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 3,
      width: cuotaTableWidth,
      height: 18,
      color: verdeClaro,
    });
    xp = cuotaTableStartX;
    resHeaders.forEach((h, i) => {
      const hw = fontBold.widthOfTextAtSize(h, 7);
      page.drawText(h, {
        x: xp + (resColWidths[i] - hw) / 2,
        y: yPos,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xp += resColWidths[i];
    });
    lx = cuotaTableStartX;
    for (let i = 0; i <= resColWidths.length; i++) {
      page.drawLine({
        start: { x: lx, y: yPos - 3 },
        end: { x: lx, y: yPos + 15 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < resColWidths.length) lx += resColWidths[i];
    }
    yPos -= 18;

    page.drawRectangle({
      x: cuotaTableStartX,
      y: yPos - 2,
      width: cuotaTableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });
    xp = cuotaTableStartX;
    resData.forEach((value, i) => {
      const tw = fontBold.widthOfTextAtSize(value, 8);
      page.drawText(value, {
        x: xp + resColWidths[i] - tw - 3,
        y: yPos + 2,
        size: 8,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xp += resColWidths[i];
    });
    lx = cuotaTableStartX;
    for (let i = 0; i <= resColWidths.length; i++) {
      page.drawLine({
        start: { x: lx, y: yPos + 16 },
        end: { x: lx, y: yPos - 2 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < resColWidths.length) lx += resColWidths[i];
    }
    page.drawLine({
      start: { x: cuotaTableStartX, y: yPos - 2 },
      end: { x: cuotaTableStartX + cuotaTableWidth, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    yPos -= 30;

    return yPos;
  };

  // ─── PÁGINA 1 ──────────────────────────────────────────────────────────────
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let paginas = [page];
  let { yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page);

  const precioPorTon = Number(temporada.precioPorTonDolares || 0);

  // ─── SECCIÓN PATRÓN ────────────────────────────────────────────────────────
  if (yPos < 300) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page));
  }

  yPos = await dibujarSeccionRol(
    page,
    yPos,
    "PATRON",
    patron,
    precioPorTon,
    cuotaTableStartX,
    cuotaTableWidth,
    azulClaro,
  );

  // ─── SECCIÓN MOTORISTA ─────────────────────────────────────────────────────
  if (yPos < 300) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page));
  }

  yPos = await dibujarSeccionRol(
    page,
    yPos,
    "MOTORISTA",
    motorista,
    precioPorTon,
    cuotaTableStartX,
    cuotaTableWidth,
    amarilloClaro,
  );

  // ─── SECCIÓN PANGUERO ──────────────────────────────────────────────────────
  if (yPos < 300) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    paginas.push(page);
    ({ yPos, cuotaTableStartX, cuotaTableWidth } = dibujarEncabezado(page));
  }

  yPos = await dibujarSeccionRol(
    page,
    yPos,
    "PANGUERO",
    panguero,
    precioPorTon,
    cuotaTableStartX,
    cuotaTableWidth,
    rgb(0.9, 0.8, 0.95),
  );

  // Numeración de páginas
  const totalPaginas = paginas.length;
  paginas.forEach((pag, index) => {
    const paginaTexto = `Pagina ${index + 1} de ${totalPaginas}`;
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
  return new Blob([pdfBytes], { type: "application/pdf" });
}
