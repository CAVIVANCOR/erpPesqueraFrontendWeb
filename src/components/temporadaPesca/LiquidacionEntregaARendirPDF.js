/**
 * LiquidacionEntregaARendirPDF.js
 * Generador de PDF para liquidación de entregas a rendir
 * Sigue el estándar corporativo de MEGUI Investment
 * Orientación: Vertical (Portrait) - OPTIMIZADO
 * @version 2.0.0 - Márgenes mínimos, texto consolidado, sin campo Enlace
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero, formatearFecha } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { agregarDocumentosAdjuntos } from "./LiquidacionDocumentosAdjuntos";

export async function generarYSubirPDFLiquidacionEntregaARendir(
  liquidacion,
  empresa,
) {
  try {
    const pdfBytes = await generarPDFLiquidacion(liquidacion, empresa);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append(
      "moduleName",
      "liquidacion-entrega-rendir-pesca-industrial",
    );
    formData.append("entityId", liquidacion.id);

    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/merge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al subir el PDF");
    }

    const resultado = await response.json();
    return {
      success: true,
      urlPdf: resultado.url,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

async function generarPDFLiquidacion(liquidacion, empresa) {
  // Obtener tipo de cambio de SUNAT usando fechaMovimiento
  let tipoCambioSunat = 1.0;
  try {
    const fechaMov = new Date(liquidacion.fechaMovimiento);
    const fechaISO = fechaMov.toISOString().split("T")[0];
    const tcData = await consultarTipoCambioSunat({ date: fechaISO });
    if (tcData?.sell_price) {
      tipoCambioSunat = parseFloat(tcData.sell_price);
    }
  } catch (error) {
    console.error("Error al obtener tipo de cambio:", error);
  }

  // ⭐ ORDENAR GASTOS POR FECHA DE MOVIMIENTO
  const gastosAsociados = (liquidacion.gastosAsociados || []).sort((a, b) => {
    const fechaA = new Date(a.fechaMovimiento);
    const fechaB = new Date(b.fechaMovimiento);
    return fechaA - fechaB;
  });

  // Obtener usuario logueado para firma de liquidación
  const usuarioLogueado = useAuthStore.getState().usuario;

  const pdfDoc = await PDFDocument.create();
  const pages = [];
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Vertical (Portrait)
  pages.push(page);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const margin = 5; // ⭐ MARGEN MÍNIMO PARA MÁXIMO APROVECHAMIENTO
  const lineHeight = 10;
  let yPosition = height - 25;

  const simboloMoneda = liquidacion.moneda?.simbolo || "S/";
  const tipoCambioBase = tipoCambioSunat;
  const monedaBaseId = liquidacion.monedaId;

  // Responsable
  const responsableNombre = liquidacion.responsable
    ? `${liquidacion.responsable.nombres || ""} ${liquidacion.responsable.apellidos || ""}`.trim()
    : "-";

  // ⭐ FUNCIÓN PARA DIVIDIR TEXTO EN LÍNEAS SIN CORTAR PALABRAS
  const dividirTextoEnLineas = (texto, anchoMaximo, font, size) => {
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';

    for (const palabra of palabras) {
      const pruebaLinea = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const anchoLinea = font.widthOfTextAtSize(pruebaLinea, size);

      if (anchoLinea <= anchoMaximo) {
        lineaActual = pruebaLinea;
      } else {
        if (lineaActual) lineas.push(lineaActual);
        lineaActual = palabra;
      }
    }

    if (lineaActual) lineas.push(lineaActual);
    return lineas;
  };

  // ========== FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO ==========
  const dibujarEncabezadoCompleto = async (pag, yPos) => {
    // LOGO Y ENCABEZADO CORPORATIVO
    if (empresa?.logo && empresa?.id) {
      try {
        const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
        const logoResponse = await fetch(logoUrl);

        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          let logoImage;

          if (empresa.logo.toLowerCase().includes(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }

          if (logoImage) {
            const logoDims = logoImage.scale(1);
            const maxLogoWidth = 80;
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
        }
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }

    // Datos de la empresa
    if (empresa?.razonSocial) {
      pag.drawText(empresa.razonSocial, {
        x: margin + 90,
        y: yPos,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    yPos -= lineHeight;
    if (empresa?.ruc) {
      pag.drawText(`RUC: ${empresa.ruc}`, {
        x: margin + 90,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
    }

    yPos -= lineHeight;
    if (empresa?.direccion) {
      const direccionTexto = empresa.direccion.substring(0, 60);
      pag.drawText(`Dirección: ${direccionTexto}`, {
        x: margin + 90,
        y: yPos,
        size: 7,
        font: fontNormal,
      });
      yPos -= 10;
    }

    // TÍTULO DEL DOCUMENTO
    yPos -= 8;
    const titulo = `LIQUIDACIÓN DE ENTREGA A RENDIR N° ${liquidacion.id || "-"}`;
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 12);
    const tituloX = (width - tituloWidth) / 2;

    pag.drawText(titulo, {
      x: tituloX,
      y: yPos,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Línea separadora
    yPos -= 15;
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // DATOS DE LA ASIGNACIÓN (DOS COLUMNAS)
    yPos -= 10;
    const yInicial = yPos;
    const columnaDerechaX = width / 2 + 20;

    // Columna izquierda
    const datosIzquierda = [
      ["Fecha Documento:", formatearFecha(liquidacion.fechaMovimiento)],
      ["Responsable:", responsableNombre],
      ["Tipo de Movimiento:", liquidacion.tipoMovimiento?.nombre || "-"],
    ];

    datosIzquierda.forEach(([label, value]) => {
      pag.drawText(label, {
        x: margin,
        y: yPos,
        size: 8,
        font: fontBold,
      });
      pag.drawText(String(value), {
        x: margin + 100,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
      yPos -= lineHeight;
    });

    // Columna derecha
    yPos = yInicial;
    const datosDerecha = [
      [
        "Moneda:",
        liquidacion.moneda?.simbolo || liquidacion.moneda?.nombre || "S/.",
      ],
      [
        "Tipo de Cambio:",
        `${simboloMoneda} ${formatearNumero(tipoCambioBase, 4)}`,
      ],
    ];

    datosDerecha.forEach(([label, value]) => {
      pag.drawText(label, {
        x: columnaDerechaX,
        y: yPos,
        size: 8,
        font: fontBold,
      });
      pag.drawText(String(value), {
        x: columnaDerechaX + 100,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
      yPos -= lineHeight;
    });

    yPos =
      yInicial -
      Math.max(datosIzquierda.length, datosDerecha.length) * lineHeight;
    yPos -= lineHeight + 3;

    // TÍTULO DETALLE DE GASTOS
    pag.drawText("DETALLE DE GASTOS", {
      x: margin,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= lineHeight + 3;

    // Definir columnas OPTIMIZADAS - MÁRGENES MÍNIMOS
    const colX = [
      margin, // Id
      margin + 25, // Fecha
      margin + 75, // N° Dcmto
      margin + 125, // Categoría/Tipo/Desc
      margin + 410, // Moneda
      margin + 435, // T/C
      margin + 475, // Monto
      margin + 540, // Saldo
    ];

    const headers = [
      "Id",
      "Fecha",
      "N° Dcmto",
      "Categoría / Tipo Movimiento / Descripción",
      "Mon",
      "T/C",
      "Monto",
      "Saldo",
    ];

    // Fondo de encabezado
    pag.drawRectangle({
      x: margin,
      y: yPos - 2,
      width: width - 2 * margin,
      height: 14,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Encabezados
    pag.drawText(headers[0], {
      x: colX[0] + 2,
      y: yPos + 2,
      size: 7,
      font: fontBold,
    });
    pag.drawText(headers[1], {
      x: colX[1] + 2,
      y: yPos + 2,
      size: 7,
      font: fontBold,
    });
    pag.drawText(headers[2], {
      x: colX[2] + 2,
      y: yPos + 2,
      size: 6,
      font: fontBold,
    });
    pag.drawText(headers[3], {
      x: colX[3] + 2,
      y: yPos + 2,
      size: 7,
      font: fontBold,
    });
    pag.drawText(headers[4], {
      x: colX[4] + 2,
      y: yPos + 2,
      size: 6,
      font: fontBold,
    });
    pag.drawText(headers[5], {
      x: colX[5] + 2,
      y: yPos + 2,
      size: 6,
      font: fontBold,
    });
    pag.drawText(headers[6], {
      x: colX[6] + 2,
      y: yPos + 2,
      size: 7,
      font: fontBold,
    });
    pag.drawText(headers[7], {
      x: colX[7] + 2,
      y: yPos + 2,
      size: 7,
      font: fontBold,
    });

    yPos -= 2;

    // Línea debajo del encabezado
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPos -= 8;

    return yPos;
  };

  // Dibujar encabezado inicial
  yPosition = await dibujarEncabezadoCompleto(page, yPosition);

  // Función para convertir monto a moneda base
  const convertirAMonedaBase = (monto, monedaId, tipoCambio) => {
    if (monedaId === monedaBaseId) {
      return Number(monto);
    }
    return Number(monto) * Number(tipoCambio || 1);
  };

  // Función para alinear texto a la derecha
  const alinearDerecha = (texto, x, ancho, font, size) => {
    const textoWidth = font.widthOfTextAtSize(texto, size);
    return x + ancho - textoWidth - 3;
  };

  // Definir columnas OPTIMIZADAS - MÁRGENES MÍNIMOS
  const colX = [
    margin, // Id
    margin + 25, // Fecha
    margin + 75, // N° Dcmto
    margin + 125, // Categoría/Tipo/Desc
    margin + 410, // Moneda
    margin + 435, // T/C
    margin + 475, // Monto
    margin + 540, // Saldo
  ];

  // Anchos de columnas para alineación
  const anchoColMon = colX[4] - colX[3];
  const anchoColTC = colX[5] - colX[4];
  const anchoColMonto = colX[7] - colX[6];
  const anchoColSaldo = width - margin - colX[7];
  const anchoDisponibleTexto = colX[4] - colX[3] - 10;

  // ⭐ DECLARAR VARIABLES PRIMERO
  const saldoInicial = Number(liquidacion.saldoInicialAsignacion || 0);
  const montoAsignacion = Number(liquidacion.monto || 0);
  let saldoAcumulado = saldoInicial + montoAsignacion;

  // ========== LÍNEA SALDO INICIAL ==========
  const alturaFilaSaldoInicial = 12;

  // Fondo verde claro para monto
  page.drawRectangle({
    x: colX[6],
    y: yPosition - alturaFilaSaldoInicial + 6,
    width: anchoColMonto,
    height: alturaFilaSaldoInicial,
    color: rgb(0.85, 0.95, 0.85),
  });

  // Fondo gris para saldo
  page.drawRectangle({
    x: colX[7],
    y: yPosition - alturaFilaSaldoInicial + 6,
    width: anchoColSaldo,
    height: alturaFilaSaldoInicial,
    color: rgb(0.92, 0.92, 0.92),
  });

  // Texto "SALDO INICIAL"
  page.drawText("SALDO INICIAL", {
    x: colX[3],
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0.5, 0),
  });

  // Monto del saldo inicial
  const saldoInicialTexto = formatearNumero(saldoInicial, 2);
  page.drawText(saldoInicialTexto, {
    x: alinearDerecha(saldoInicialTexto, colX[6], anchoColMonto, fontNormal, 8),
    y: yPosition,
    size: 8,
    font: fontNormal,
  });

  // Saldo acumulado (mismo valor)
  page.drawText(saldoInicialTexto, {
    x: alinearDerecha(saldoInicialTexto, colX[7], anchoColSaldo, fontNormal, 8),
    y: yPosition,
    size: 8,
    font: fontNormal,
  });

  yPosition -= alturaFilaSaldoInicial + 5;

  // ========== PRIMERA FILA: ASIGNACIÓN ORIGEN ==========

  // ⭐ CONSTRUIR TEXTO COMPLETO: CATEGORÍA - TIPO - DESCRIPCIÓN
  const categoria = liquidacion.tipoMovimiento?.categoria?.nombre || "";
  const tipoMov = liquidacion.tipoMovimiento?.nombre || "";
  const desc = liquidacion.descripcion || "";

  let textoCompleto = "";
  if (categoria) textoCompleto += categoria;
  if (tipoMov) textoCompleto += (textoCompleto ? " - " : "") + tipoMov;
  if (desc) textoCompleto += (textoCompleto ? " - " : "") + desc;

  // Dividir texto en líneas si es necesario
  const lineasTextoAsignacion = dividirTextoEnLineas(
    textoCompleto,
    anchoDisponibleTexto,
    fontNormal,
    7
  );

  // CALCULAR ALTURA DINÁMICA DE LA FILA
  let numLineasAsignacion = lineasTextoAsignacion.length;
  if (liquidacion.embarcacion) numLineasAsignacion++; // ⭐ SOLO SI HAY EMBARCACIÓN
  const alturaFilaAsignacion = Math.max(14, numLineasAsignacion * 8 + 6);

  // Fondo verde para monto (asignación)
  page.drawRectangle({
    x: colX[6],
    y: yPosition - alturaFilaAsignacion + 6,
    width: anchoColMonto,
    height: alturaFilaAsignacion,
    color: rgb(0.85, 0.95, 0.85),
  });

  // Fondo gris para saldo
  page.drawRectangle({
    x: colX[7],
    y: yPosition - alturaFilaAsignacion + 6,
    width: anchoColSaldo,
    height: alturaFilaAsignacion,
    color: rgb(0.92, 0.92, 0.92),
  });

  const yTopCelda = yPosition - 2;

  // Id
  page.drawText(String(liquidacion.id), {
    x: colX[0] + 3,
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  // Fecha
  page.drawText(formatearFecha(liquidacion.fechaMovimiento), {
    x: colX[1] + 2,
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  // N° Dcmto (asignación no tiene documento)
  page.drawText("-", {
    x: colX[2] + 2,
    y: yTopCelda,
    size: 6,
    font: fontNormal,
  });

  // ⭐ IMPRIMIR TEXTO COMPLETO EN MÚLTIPLES LÍNEAS
  let yLineaDesc = yTopCelda;
  lineasTextoAsignacion.forEach((linea) => {
    page.drawText(linea, {
      x: colX[3],
      y: yLineaDesc,
      size: 7,
      font: fontNormal,
    });
    yLineaDesc -= 8;
  });

  // ⭐ EMBARCACIÓN - SOLO SI EXISTE
  if (liquidacion.embarcacion) {
    const textoEmbarcacion = `Embarcación: ${
      liquidacion.embarcacion.activo?.nombre ||
      liquidacion.embarcacion.matricula ||
      "N/A"
    }`;
    page.drawText(textoEmbarcacion, {
      x: colX[3],
      y: yLineaDesc,
      size: 6,
      font: fontOblique,
      color: rgb(0.2, 0.2, 0.6),
    });
  }

  // Moneda, T/C, Monto, Saldo
  page.drawText(simboloMoneda, {
    x: alinearDerecha(simboloMoneda, colX[4], anchoColMon, fontNormal, 7),
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  const tcTexto = formatearNumero(tipoCambioBase, 3);
  page.drawText(tcTexto, {
    x: alinearDerecha(tcTexto, colX[5], anchoColTC, fontNormal, 7),
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  const montoTexto = formatearNumero(liquidacion.monto, 2);
  page.drawText(montoTexto, {
    x: alinearDerecha(montoTexto, colX[6], anchoColMonto, fontBold, 7),
    y: yTopCelda,
    size: 7,
    font: fontBold,
  });

  const saldoTexto = formatearNumero(saldoAcumulado, 2);
  page.drawText(saldoTexto, {
    x: alinearDerecha(saldoTexto, colX[7], anchoColSaldo, fontBold, 7),
    y: yTopCelda,
    size: 7,
    font: fontBold,
    color: rgb(0, 0.4, 0),
  });

  yPosition -= alturaFilaAsignacion + 2;

  // ========== FILAS DE GASTOS ==========
  let totalGastos = 0;

  for (const gasto of gastosAsociados) {
    // ⭐ CONSTRUIR TEXTO COMPLETO: CATEGORÍA - TIPO - DESCRIPCIÓN
    const catGasto = gasto.tipoMovimiento?.categoria?.nombre || "";
    const tipoGasto = gasto.tipoMovimiento?.nombre || "";
    const descGasto = gasto.descripcion || "";

    let textoCompletoGasto = "";
    if (catGasto) textoCompletoGasto += catGasto;
    if (tipoGasto)
      textoCompletoGasto += (textoCompletoGasto ? " - " : "") + tipoGasto;
    if (descGasto)
      textoCompletoGasto += (textoCompletoGasto ? " - " : "") + descGasto;

    // Dividir texto en líneas si es necesario
    const lineasTextoGasto = dividirTextoEnLineas(
      textoCompletoGasto,
      anchoDisponibleTexto,
      fontNormal,
      7
    );

    // CALCULAR ALTURA DINÁMICA DE LA FILA
    let numLineasGasto = lineasTextoGasto.length;
    if (gasto.embarcacion) numLineasGasto++; // ⭐ SOLO SI HAY EMBARCACIÓN
    const alturaFilaGasto = Math.max(14, numLineasGasto * 8 + 6);

    // Verificar si hay espacio para la fila
    if (yPosition < 180) {
      page = pdfDoc.addPage([595.28, 841.89]);
      pages.push(page);
      yPosition = height - 25;
      yPosition = await dibujarEncabezadoCompleto(page, yPosition);
    }

    const montoConvertido = convertirAMonedaBase(
      gasto.monto,
      gasto.monedaId,
      gasto.tipoCambio || tipoCambioBase
    );

    saldoAcumulado -= montoConvertido;
    totalGastos += montoConvertido;

    // Fondo rojo para monto (gasto)
    page.drawRectangle({
      x: colX[6],
      y: yPosition - alturaFilaGasto + 6,
      width: anchoColMonto,
      height: alturaFilaGasto,
      color: rgb(0.98, 0.85, 0.85),
    });

    // Fondo gris para saldo
    page.drawRectangle({
      x: colX[7],
      y: yPosition - alturaFilaGasto + 6,
      width: anchoColSaldo,
      height: alturaFilaGasto,
      color: rgb(0.92, 0.92, 0.92),
    });

    const yTopCeldaGasto = yPosition - 2;

    // Id
    page.drawText(String(gasto.id), {
      x: colX[0] + 3,
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    // Fecha
    page.drawText(formatearFecha(gasto.fechaMovimiento), {
      x: colX[1] + 2,
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    // N° Dcmto
    let numeroDocumento = "";
    if (gasto.numeroSerieComprobante || gasto.numeroCorrelativoComprobante) {
      if (gasto.numeroSerieComprobante) {
        numeroDocumento += gasto.numeroSerieComprobante;
      }
      if (gasto.numeroCorrelativoComprobante) {
        numeroDocumento += "-" + gasto.numeroCorrelativoComprobante;
      }
    }

    page.drawText(numeroDocumento || "-", {
      x: colX[2] + 2,
      y: yTopCeldaGasto,
      size: 6,
      font: fontNormal,
    });

    // ⭐ IMPRIMIR TEXTO COMPLETO EN MÚLTIPLES LÍNEAS
    let yLineaDescGasto = yTopCeldaGasto;
    lineasTextoGasto.forEach((linea) => {
      page.drawText(linea, {
        x: colX[3],
        y: yLineaDescGasto,
        size: 7,
        font: fontNormal,
      });
      yLineaDescGasto -= 8;
    });

    // ⭐ EMBARCACIÓN - SOLO SI EXISTE
    if (gasto.embarcacion) {
      const textoEmbarcacion = `Embarcación: ${
        gasto.embarcacion.activo?.nombre ||
        gasto.embarcacion.matricula ||
        "N/A"
      }`;
      page.drawText(textoEmbarcacion, {
        x: colX[3],
        y: yLineaDescGasto,
        size: 6,
        font: fontOblique,
        color: rgb(0.2, 0.2, 0.6),
      });
    }

    // Moneda, T/C, Monto, Saldo
    const monGasto = gasto.moneda?.simbolo || "S/";
    page.drawText(monGasto, {
      x: alinearDerecha(monGasto, colX[4], anchoColMon, fontNormal, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    const tcGastoTexto = formatearNumero(
      gasto.tipoCambio || tipoCambioBase,
      3
    );
    page.drawText(tcGastoTexto, {
      x: alinearDerecha(tcGastoTexto, colX[5], anchoColTC, fontNormal, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    const gastoTexto = formatearNumero(montoConvertido, 2);
    page.drawText(gastoTexto, {
      x: alinearDerecha(gastoTexto, colX[6], anchoColMonto, fontBold, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontBold,
    });

    const saldoColor = saldoAcumulado >= 0 ? rgb(0, 0.4, 0) : rgb(0.8, 0, 0);
    const saldoGastoTexto = formatearNumero(saldoAcumulado, 2);
    page.drawText(saldoGastoTexto, {
      x: alinearDerecha(saldoGastoTexto, colX[7], anchoColSaldo, fontBold, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontBold,
      color: saldoColor,
    });

    yPosition -= alturaFilaGasto + 2;
  }

  // Línea final de tabla
  yPosition -= 2;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 8;

  // ========== LÍNEA SALDO FINAL ==========
  const alturaFilaSaldoFinal = 14;

  // Fondo gris para saldo
  page.drawRectangle({
    x: colX[7],
    y: yPosition - alturaFilaSaldoFinal + 6,
    width: anchoColSaldo,
    height: alturaFilaSaldoFinal,
    color: rgb(0.92, 0.92, 0.92),
  });

  // Texto "SALDO FINAL"
  page.drawText("SALDO FINAL", {
    x: colX[3],
    y: yPosition,
    size: 9,
    font: fontBold,
    color: rgb(0, 0.5, 0),
  });

  // Saldo final (saldo acumulado actual)
  const saldoFinalTexto = formatearNumero(saldoAcumulado, 2);
  page.drawText(saldoFinalTexto, {
    x: alinearDerecha(saldoFinalTexto, colX[7], anchoColSaldo, fontBold, 9),
    y: yPosition,
    size: 9,
    font: fontBold,
  });

  yPosition -= alturaFilaSaldoFinal + 15;

  // ========== FIRMAS EN PÁGINA 1 ==========
  const firmaYPosition = yPosition - 40;
  const firmaIzqX = margin + 15;
  const firmaDerX = width / 2 + 60;
  const firmaWidth = 180;

  // Firma Izquierda - Responsable
  if (liquidacion.responsable) {
    let yFirma = firmaYPosition;

    page.drawLine({
      start: { x: firmaIzqX, y: yFirma },
      end: { x: firmaIzqX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yFirma -= 10;
    page.drawText(responsableNombre, {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontBold,
    });

    yFirma -= 9;
    if (liquidacion.responsable.numeroDocumento) {
      const tipoDocResp =
        liquidacion.responsable.tipoDocumento?.abreviatura || "Doc";
      page.drawText(
        `${tipoDocResp}: ${liquidacion.responsable.numeroDocumento}`,
        {
          x: firmaIzqX,
          y: yFirma,
          size: 6,
          font: fontNormal,
        }
      );
      yFirma -= 9;
    }

    page.drawText("Responsable", {
      x: firmaIzqX,
      y: yFirma,
      size: 6,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Firma Derecha - Usuario Logueado
  if (usuarioLogueado?.personal) {
    let yFirma = firmaYPosition;

    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yFirma -= 10;
    const nombreUsuario = `${usuarioLogueado.personal.nombres || ""} ${usuarioLogueado.personal.apellidos || ""}`.trim();
    page.drawText(nombreUsuario, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontBold,
    });

    yFirma -= 9;
    if (usuarioLogueado.personal.numeroDocumento) {
      const tipoDocUsuario =
        usuarioLogueado.personal.tipoDocumento?.abreviatura || "Doc";
      page.drawText(
        `${tipoDocUsuario}: ${usuarioLogueado.personal.numeroDocumento}`,
        {
          x: firmaDerX,
          y: yFirma,
          size: 6,
          font: fontNormal,
        }
      );
      yFirma -= 9;
    }

    page.drawText("Responsable de Liquidacion", {
      x: firmaDerX,
      y: yFirma,
      size: 6,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // ========== NUEVA PÁGINA: DETALLE DE GASTOS PLANIFICADOS ==========
  const gastosPlanificados = liquidacion.gastosPlanificados || [];

  if (gastosPlanificados.length > 0) {
    // Crear nueva página
    page = pdfDoc.addPage([595.28, 841.89]);
    pages.push(page);
    yPosition = height - 25;

    // DIBUJAR SOLO LOGO Y ENCABEZADO CORPORATIVO
    if (empresa?.logo && empresa?.id) {
      try {
        const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
        const logoResponse = await fetch(logoUrl);

        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          let logoImage;

          if (empresa.logo.toLowerCase().includes(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }

          if (logoImage) {
            const logoDims = logoImage.scale(1);
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

    // Datos de la empresa
    if (empresa?.razonSocial) {
      page.drawText(empresa.razonSocial, {
        x: margin + 90,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    yPosition -= lineHeight;
    if (empresa?.ruc) {
      page.drawText(`RUC: ${empresa.ruc}`, {
        x: margin + 90,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
    }

    yPosition -= lineHeight;
    if (empresa?.direccion) {
      const direccionTexto = empresa.direccion.substring(0, 60);
      page.drawText(`Dirección: ${direccionTexto}`, {
        x: margin + 90,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });
      yPosition -= 10;
    }

    // TÍTULO DEL DOCUMENTO
    yPosition -= 8;
    const titulo = `LIQUIDACIÓN DE ENTREGA A RENDIR N° ${liquidacion.id || "-"}`;
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 12);
    const tituloX = (width - tituloWidth) / 2;

    page.drawText(titulo, {
      x: tituloX,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Línea separadora
    yPosition -= 15;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // DATOS DE LA ASIGNACIÓN (DOS COLUMNAS)
    yPosition -= 10;
    const yInicial = yPosition;
    const columnaDerechaX = width / 2 + 20;

    // Columna izquierda
    const datosIzquierda = [
      ["Fecha Documento:", formatearFecha(liquidacion.fechaMovimiento)],
      ["Responsable:", responsableNombre],
      ["Tipo de Movimiento:", liquidacion.tipoMovimiento?.nombre || "-"],
    ];

    datosIzquierda.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      page.drawText(String(value), {
        x: margin + 100,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    });

    // Columna derecha
    yPosition = yInicial;
    const datosDerecha = [
      [
        "Moneda:",
        liquidacion.moneda?.simbolo || liquidacion.moneda?.nombre || "S/.",
      ],
      [
        "Tipo de Cambio:",
        `${simboloMoneda} ${formatearNumero(tipoCambioBase, 4)}`,
      ],
    ];

    datosDerecha.forEach(([label, value]) => {
      page.drawText(label, {
        x: columnaDerechaX,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      page.drawText(String(value), {
        x: columnaDerechaX + 100,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    });

    yPosition =
      yInicial -
      Math.max(datosIzquierda.length, datosDerecha.length) * lineHeight;
    yPosition -= lineHeight + 3;

    // TÍTULO DETALLE DE GASTOS PLANIFICADOS
    page.drawText("DETALLE DE GASTOS PLANIFICADOS", {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight + 3;

    // Definir columnas para gastos planificados
    const colXPlan = [
      margin, // Id
      margin + 30, // Producto
      margin + 300, // Moneda
      margin + 330, // Monto Planificado
      margin + 400, // Monto Gastado
      margin + 470, // Saldo
    ];

    const headersPlan = [
      "Id",
      "Producto / Descripción",
      "Mon",
      "Planificado",
      "Gastado",
      "Saldo",
    ];

    // Fondo de encabezado
    page.drawRectangle({
      x: margin,
      y: yPosition - 2,
      width: width - 2 * margin,
      height: 14,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Encabezados
    headersPlan.forEach((header, index) => {
      page.drawText(header, {
        x: colXPlan[index] + 2,
        y: yPosition + 2,
        size: 7,
        font: fontBold,
      });
    });

    yPosition -= 2;

    // Línea debajo del encabezado
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 8;

    // Filas de gastos planificados
    for (const gasto of gastosPlanificados) {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        pages.push(page);
        yPosition = height - 25;
      }

      const alturaFilaPlan = 12;

      // Id
      page.drawText(String(gasto.id), {
        x: colXPlan[0] + 3,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });

      // Producto
      const productoDesc =
        gasto.producto?.descripcionArmada || gasto.producto?.nombre || "N/A";
      page.drawText(productoDesc.substring(0, 60), {
        x: colXPlan[1] + 2,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });

      // Moneda
      const monedaGasto = gasto.moneda?.simbolo || "S/";
      page.drawText(monedaGasto, {
        x: colXPlan[2] + 2,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });

      // Monto Planificado
      const montoPlanificado = formatearNumero(gasto.montoPlanificado || 0, 2);
      page.drawText(montoPlanificado, {
        x: alinearDerecha(
          montoPlanificado,
          colXPlan[3],
          colXPlan[4] - colXPlan[3],
          fontNormal,
          7
        ),
        y: yPosition,
        size: 7,
        font: fontNormal,
      });

      // Monto Gastado
      const montoGastado = formatearNumero(gasto.montoGastado || 0, 2);
      page.drawText(montoGastado, {
        x: alinearDerecha(
          montoGastado,
          colXPlan[4],
          colXPlan[5] - colXPlan[4],
          fontNormal,
          7
        ),
        y: yPosition,
        size: 7,
        font: fontNormal,
      });

      // Saldo
      const saldoGasto =
        Number(gasto.montoPlanificado || 0) - Number(gasto.montoGastado || 0);
      const saldoGastoTexto = formatearNumero(saldoGasto, 2);
      const colorSaldo = saldoGasto >= 0 ? rgb(0, 0.4, 0) : rgb(0.8, 0, 0);
      page.drawText(saldoGastoTexto, {
        x: alinearDerecha(
          saldoGastoTexto,
          colXPlan[5],
          width - margin - colXPlan[5],
          fontBold,
          7
        ),
        y: yPosition,
        size: 7,
        font: fontBold,
        color: colorSaldo,
      });

      yPosition -= alturaFilaPlan + 2;
    }

    // Línea final
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

    // Agregar documentos adjuntos si existen
  await agregarDocumentosAdjuntos(
    pdfDoc,
    liquidacion.gastosAsociados || [],
    empresa,
    liquidacion,
    {
      fontBold,
      fontNormal,
      fontOblique,
    }
  );

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}