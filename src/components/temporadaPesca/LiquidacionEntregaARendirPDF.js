/**
 * LiquidacionEntregaARendirPDF.js
 * Generador de PDF para liquidación de entregas a rendir
 * Sigue el estándar corporativo de MEGUI Investment
 * Orientación: Horizontal (Landscape)
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero, formatearFecha } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

export async function generarYSubirPDFLiquidacionEntregaARendir(
  liquidacion,
  empresa
) {
  try {
    const pdfBytes = await generarPDFLiquidacion(liquidacion, empresa);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append(
      "moduleName",
      "liquidacion-entrega-rendir-pesca-industrial"
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
    const fechaISO = fechaMov.toISOString().split('T')[0];
    const tcData = await consultarTipoCambioSunat({ date: fechaISO });
    if (tcData?.sell_price) {
      tipoCambioSunat = parseFloat(tcData.sell_price);
    }
  } catch (error) {
    console.error("Error al obtener tipo de cambio:", error);
  }

  // Obtener usuario logueado para firma de liquidación
  const usuarioLogueado = useAuthStore.getState().usuario;

  const pdfDoc = await PDFDocument.create();
  const pages = [];
  let page = pdfDoc.addPage([841.89, 595.28]); // A4 Horizontal (Landscape)
  pages.push(page);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const margin = 50;
  const lineHeight = 15;
  let yPosition = height - 50;

  const simboloMoneda = liquidacion.moneda?.simbolo || "S/";
  const tipoCambioBase = tipoCambioSunat;
  const monedaBaseId = liquidacion.monedaId;

  // Responsable
  const responsableNombre = liquidacion.responsable
    ? `${liquidacion.responsable.nombres || ''} ${liquidacion.responsable.apellidos || ''}`.trim()
    : '-';

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
            const maxLogoWidth = 100;
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
        x: margin + 110,
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    yPos -= lineHeight;
    if (empresa?.ruc) {
      pag.drawText(`RUC: ${empresa.ruc}`, {
        x: margin + 110,
        y: yPos,
        size: 10,
        font: fontNormal,
      });
    }

    yPos -= lineHeight;
    if (empresa?.direccion) {
      const direccionTexto = empresa.direccion.substring(0, 80);
      pag.drawText(`Dirección: ${direccionTexto}`, {
        x: margin + 110,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
      yPos -= 12;
    }

    // TÍTULO DEL DOCUMENTO
    yPos -= 10;
    const titulo = `LIQUIDACIÓN DE ENTREGA A RENDIR N° ${liquidacion.id || "-"}`;
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
    const tituloX = (width - tituloWidth) / 2;

    pag.drawText(titulo, {
      x: tituloX,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Línea separadora
    yPos -= 18;
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // DATOS DE LA ASIGNACIÓN (DOS COLUMNAS)
    yPos -= 12;
    const yInicial = yPos;
    const columnaDerechaX = width / 2 + 50;

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
        size: 9,
        font: fontBold,
      });
      pag.drawText(String(value), {
        x: margin + 120,
        y: yPos,
        size: 9,
        font: fontNormal,
      });
      yPos -= lineHeight;
    });

    // Columna derecha
    yPos = yInicial;
    const datosDerecha = [
      ["Moneda:", liquidacion.moneda?.nombre || ""],
      ["Tipo de Cambio:", `${simboloMoneda} ${formatearNumero(tipoCambioBase, 4)}`],
    ];

    datosDerecha.forEach(([label, value]) => {
      pag.drawText(label, {
        x: columnaDerechaX,
        y: yPos,
        size: 9,
        font: fontBold,
      });
      pag.drawText(String(value), {
        x: columnaDerechaX + 120,
        y: yPos,
        size: 9,
        font: fontNormal,
      });
      yPos -= lineHeight;
    });

    yPos = yInicial - Math.max(datosIzquierda.length, datosDerecha.length) * lineHeight;
    yPos -= lineHeight + 5;

    // TÍTULO DETALLE DE GASTOS
    pag.drawText("DETALLE DE GASTOS", {
      x: margin,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= lineHeight + 5;

    // Definir columnas
    const colX = [
      margin,           // Id
      margin + 25,      // Fecha
      margin + 75,      // Categoría/Tipo/Desc
      margin + 384,     // Moneda
      margin + 419,     // T/C
      margin + 464,     // Asignación
      margin + 554,     // Gasto
      margin + 644,     // Saldo
    ];

    const headers = ["Id", "Fecha", "Categoría / Tipo Movimiento / Descripción", "Mon", "T/C", "Asignación", "Gasto", "Saldo"];

    // Fondo de encabezado
    pag.drawRectangle({
      x: margin,
      y: yPos - 2,
      width: width - 2 * margin,
      height: 16,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Encabezados
    pag.drawText(headers[0], { x: colX[0] + 2, y: yPos + 2, size: 7, font: fontBold });
    pag.drawText(headers[1], { x: colX[1] + 2, y: yPos + 2, size: 7, font: fontBold });
    pag.drawText(headers[2], { x: colX[2] + 2, y: yPos + 2, size: 7, font: fontBold });
    pag.drawText(headers[3], { x: colX[3] + 2, y: yPos + 2, size: 6, font: fontBold });
    pag.drawText(headers[4], { x: colX[4] + 2, y: yPos + 2, size: 6, font: fontBold });
    pag.drawText(headers[5], { x: colX[5] + 2, y: yPos + 2, size: 7, font: fontBold });
    pag.drawText(headers[6], { x: colX[6] + 2, y: yPos + 2, size: 7, font: fontBold });
    pag.drawText(headers[7], { x: colX[7] + 2, y: yPos + 2, size: 7, font: fontBold });

    yPos -= 2;

    // Línea debajo del encabezado
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPos -= 10;

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
    return x + ancho - textoWidth - 5;
  };

  // Definir columnas
  const colX = [
    margin,           // Id
    margin + 25,      // Fecha
    margin + 75,      // Categoría/Tipo/Desc
    margin + 384,     // Moneda
    margin + 419,     // T/C
    margin + 464,     // Asignación
    margin + 554,     // Gasto
    margin + 644,     // Saldo
  ];

  // Anchos de columnas para alineación
  const anchoColMon = colX[4] - colX[3];
  const anchoColTC = colX[5] - colX[4];
  const anchoColAsig = colX[6] - colX[5];
  const anchoColGasto = colX[7] - colX[6];
  const anchoColSaldo = 90;

  // PRIMERA FILA: Asignación origen
  let saldoAcumulado = Number(liquidacion.monto || 0);
  const gastosAsociados = liquidacion.gastosAsociados || [];

  // Fondo verde para asignación
  page.drawRectangle({
    x: colX[5],
    y: yPosition - 20,
    width: 85,
    height: 28,
    color: rgb(0.85, 0.95, 0.85),
  });

  // Fondo gris para saldo
  page.drawRectangle({
    x: colX[7],
    y: yPosition - 20,
    width: 90,
    height: 28,
    color: rgb(0.92, 0.92, 0.92),
  });

  const categoria = liquidacion.tipoMovimiento?.categoria?.nombre || "";
  const tipoMov = liquidacion.tipoMovimiento?.nombre || "";
  const desc = liquidacion.descripcion || "";

  // TODAS LAS COLUMNAS ALINEADAS ARRIBA
  const yTopCelda = yPosition + 3;

  // Id
  page.drawText(String(liquidacion.id), { x: colX[0] + 5, y: yTopCelda, size: 7, font: fontNormal });

  // Fecha
  page.drawText(formatearFecha(liquidacion.fechaMovimiento), { x: colX[1] + 2, y: yTopCelda, size: 7, font: fontNormal });

  // Categoría/Tipo/Descripción (3 líneas)
  if (categoria) {
    page.drawText(categoria.substring(0, 55), { x: colX[2], y: yTopCelda, size: 7, font: fontBold });
  }
  if (tipoMov) {
    page.drawText(tipoMov.substring(0, 55), { x: colX[2], y: yTopCelda - 10, size: 9, font: fontNormal });
  }
  if (desc) {
    page.drawText(desc.substring(0, 55), { x: colX[2], y: yTopCelda - 20, size: 7, font: fontOblique });
  }

  // Moneda, T/C, Asignación, Gasto, Saldo (alineados a la derecha Y arriba)
  page.drawText(simboloMoneda, { x: alinearDerecha(simboloMoneda, colX[3], anchoColMon, fontNormal, 7), y: yTopCelda, size: 7, font: fontNormal });
  
  const tcTexto = formatearNumero(tipoCambioBase, 3);
  page.drawText(tcTexto, { x: alinearDerecha(tcTexto, colX[4], anchoColTC, fontNormal, 7), y: yTopCelda, size: 7, font: fontNormal });
  
  const asigTexto = `${simboloMoneda} ${formatearNumero(liquidacion.monto, 2)}`;
  page.drawText(asigTexto, { x: alinearDerecha(asigTexto, colX[5], anchoColAsig, fontBold, 7), y: yTopCelda, size: 7, font: fontBold });
  
  page.drawText("-", { x: alinearDerecha("-", colX[6], anchoColGasto, fontNormal, 7), y: yTopCelda, size: 7, font: fontNormal });
  
  const saldoTexto = `${simboloMoneda} ${formatearNumero(saldoAcumulado, 2)}`;
  page.drawText(saldoTexto, { x: alinearDerecha(saldoTexto, colX[7], anchoColSaldo, fontBold, 7), y: yTopCelda, size: 7, font: fontBold, color: rgb(0, 0.4, 0) });

  yPosition -= 30;

  // FILAS DE GASTOS
  let totalGastos = 0;

  gastosAsociados.forEach((gasto) => {
    // Verificar si hay espacio para la fila (umbral de 150px)
    if (yPosition < 150) {
      page = pdfDoc.addPage([841.89, 595.28]);
      pages.push(page);
      yPosition = height - 50;
      // Dibujar encabezado completo en nueva página
      yPosition = dibujarEncabezadoCompleto(page, yPosition);
    }

    const montoConvertido = convertirAMonedaBase(
      gasto.monto,
      gasto.monedaId,
      gasto.tipoCambio || tipoCambioBase
    );

    saldoAcumulado -= montoConvertido;
    totalGastos += montoConvertido;

    // Fondo rojo para gasto
    page.drawRectangle({
      x: colX[6],
      y: yPosition - 20,
      width: 85,
      height: 28,
      color: rgb(0.98, 0.85, 0.85),
    });

    // Fondo gris para saldo
    page.drawRectangle({
      x: colX[7],
      y: yPosition - 20,
      width: 90,
      height: 28,
      color: rgb(0.92, 0.92, 0.92),
    });

    const catGasto = gasto.tipoMovimiento?.categoria?.nombre || "";
    const tipoGasto = gasto.tipoMovimiento?.nombre || "";
    const descGasto = gasto.descripcion || "";

    // TODAS LAS COLUMNAS ALINEADAS ARRIBA
    const yTopCeldaGasto = yPosition + 3;

    // Id
    page.drawText(String(gasto.id), { x: colX[0] + 5, y: yTopCeldaGasto, size: 7, font: fontNormal });

    // Fecha
    page.drawText(formatearFecha(gasto.fechaMovimiento), { x: colX[1] + 2, y: yTopCeldaGasto, size: 7, font: fontNormal });

    // Categoría/Tipo/Descripción (3 líneas)
    if (catGasto) {
      page.drawText(catGasto.substring(0, 55), { x: colX[2], y: yTopCeldaGasto, size: 7, font: fontBold });
    }
    if (tipoGasto) {
      page.drawText(tipoGasto.substring(0, 55), { x: colX[2], y: yTopCeldaGasto - 10, size: 9, font: fontNormal });
    }
    if (descGasto) {
      page.drawText(descGasto.substring(0, 55), { x: colX[2], y: yTopCeldaGasto - 20, size: 7, font: fontOblique });
    }

    // Moneda, T/C, Asignación, Gasto, Saldo (alineados a la derecha Y arriba)
    const monGasto = gasto.moneda?.simbolo || "S/";
    page.drawText(monGasto, { x: alinearDerecha(monGasto, colX[3], anchoColMon, fontNormal, 7), y: yTopCeldaGasto, size: 7, font: fontNormal });
    
    const tcGastoTexto = formatearNumero(gasto.tipoCambio || tipoCambioBase, 3);
    page.drawText(tcGastoTexto, { x: alinearDerecha(tcGastoTexto, colX[4], anchoColTC, fontNormal, 7), y: yTopCeldaGasto, size: 7, font: fontNormal });
    
    page.drawText("-", { x: alinearDerecha("-", colX[5], anchoColAsig, fontNormal, 7), y: yTopCeldaGasto, size: 7, font: fontNormal });
    
    const gastoTexto = `${simboloMoneda} ${formatearNumero(montoConvertido, 2)}`;
    page.drawText(gastoTexto, { x: alinearDerecha(gastoTexto, colX[6], anchoColGasto, fontBold, 7), y: yTopCeldaGasto, size: 7, font: fontBold });

    const saldoColor = saldoAcumulado >= 0 ? rgb(0, 0.4, 0) : rgb(0.8, 0, 0);
    const saldoGastoTexto = `${simboloMoneda} ${formatearNumero(saldoAcumulado, 2)}`;
    page.drawText(saldoGastoTexto, { x: alinearDerecha(saldoGastoTexto, colX[7], anchoColSaldo, fontBold, 7), y: yTopCeldaGasto, size: 7, font: fontBold, color: saldoColor });

    yPosition -= 30;
  });

  // Línea final de tabla
  yPosition -= 3;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 10;

  // FILA DE TOTALES
  page.drawRectangle({
    x: margin,
    y: yPosition - 2,
    width: width - 2 * margin,
    height: 14,
    color: rgb(0.75, 0.75, 0.75),
  });

  page.drawText("TOTALES:", { x: colX[2] + 2, y: yPosition + 2, size: 9, font: fontBold });
  
  const totalAsigTexto = `${simboloMoneda} ${formatearNumero(liquidacion.monto, 2)}`;
  page.drawText(totalAsigTexto, { x: alinearDerecha(totalAsigTexto, colX[5], anchoColAsig, fontBold, 9), y: yPosition + 2, size: 9, font: fontBold });
  
  const totalGastoTexto = `${simboloMoneda} ${formatearNumero(totalGastos, 2)}`;
  page.drawText(totalGastoTexto, { x: alinearDerecha(totalGastoTexto, colX[6], anchoColGasto, fontBold, 9), y: yPosition + 2, size: 9, font: fontBold });

  // ========== FIRMAS ==========
  const firmaYPosition = 90;
  const firmaIzqX = margin + 20;
  const firmaDerX = width / 2 + 100;
  const firmaWidth = 200;

  // Firma Izquierda - Responsable
  if (liquidacion.responsable) {
    let yFirma = firmaYPosition;

    page.drawLine({
      start: { x: firmaIzqX, y: yFirma },
      end: { x: firmaIzqX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yFirma -= 12;
    page.drawText(responsableNombre, {
      x: firmaIzqX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    yFirma -= 10;
    if (liquidacion.responsable.numeroDocumento) {
      const tipoDocResp = liquidacion.responsable.tipoDocumento?.abreviatura || "Doc";
      page.drawText(`${tipoDocResp}: ${liquidacion.responsable.numeroDocumento}`, {
        x: firmaIzqX,
        y: yFirma,
        size: 7,
        font: fontNormal,
      });
      yFirma -= 10;
    }

    page.drawText("Responsable", {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Firma Derecha - Usuario Logueado (Responsable de Liquidación)
  if (usuarioLogueado?.personal) {
    let yFirma = firmaYPosition;

    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yFirma -= 12;
    const nombreUsuario = `${usuarioLogueado.personal.nombres || ''} ${usuarioLogueado.personal.apellidos || ''}`.trim();
    page.drawText(nombreUsuario, {
      x: firmaDerX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });

    yFirma -= 10;
    if (usuarioLogueado.personal.numeroDocumento) {
      const tipoDocUsuario = usuarioLogueado.personal.tipoDocumento?.abreviatura || "Doc";
      page.drawText(`${tipoDocUsuario}: ${usuarioLogueado.personal.numeroDocumento}`, {
        x: firmaDerX,
        y: yFirma,
        size: 7,
        font: fontNormal,
      });
      yFirma -= 10;
    }

    page.drawText("Responsable de Liquidación", {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // ========== AGREGAR NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA ==========
  const totalPages = pages.length;
  pages.forEach((p, index) => {
    const pageNumber = index + 1;
    const pageText = `Página ${pageNumber} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);

    // Número de página en esquina superior derecha
    p.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 30,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Pie de página
    p.drawText(
      `Generado: ${formatearFecha(new Date())} | Sistema ERP Megui`,
      {
        x: margin,
        y: 30,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}