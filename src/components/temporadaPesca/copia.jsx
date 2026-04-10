/**
 * LiquidacionEntregaARendirPDF.js
 * Generador de PDF para liquidación de entregas a rendir
 * Sigue el estándar corporativo de MEGUI Investment
 * Orientación: Vertical (Portrait) - OPTIMIZADO
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero, formatearFecha } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { obtenerLabelEnlace } from "../../api/detMovsEntregaRendir";

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

  // Obtener label de enlace para la asignación principal
  let labelEnlacePrincipal = null;
  if (liquidacion.enlaceAOtroDetalleGastoId) {
    try {
      labelEnlacePrincipal = await obtenerLabelEnlace(
        liquidacion.enlaceAOtroDetalleGastoId,
      );
    } catch (error) {
      console.error("Error al obtener label de enlace principal:", error);
    }
  }

  // Obtener labels de enlace para gastos asociados
  const gastosAsociados = liquidacion.gastosAsociados || [];
  for (const gasto of gastosAsociados) {
    if (gasto.enlaceAOtroDetalleGastoId) {
      try {
        gasto.labelEnlace = await obtenerLabelEnlace(
          gasto.enlaceAOtroDetalleGastoId,
        );
      } catch (error) {
        console.error(
          `Error al obtener label de enlace para gasto ${gasto.id}:`,
          error,
        );
        gasto.labelEnlace = null;
      }
    }
  }

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

  const margin = 10;
  const lineHeight = 10;
  let yPosition = height - 30;

  const simboloMoneda = liquidacion.moneda?.simbolo || "S/";
  const tipoCambioBase = tipoCambioSunat;
  const monedaBaseId = liquidacion.monedaId;

  // Responsable
  const responsableNombre = liquidacion.responsable
    ? `${liquidacion.responsable.nombres || ""} ${liquidacion.responsable.apellidos || ""}`.trim()
    : "-";

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
      ["Moneda:", liquidacion.moneda?.nombre || ""],
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

    // Definir columnas OPTIMIZADAS
    const colX = [
      margin, // Id
      margin + 25, // Fecha
      margin + 75, // Categoría/Tipo/Desc
      margin + 340, // Moneda
      margin + 365, // T/C
      margin + 400, // Asignación
      margin + 455, // Gasto
      margin + 510, // Saldo
    ];

    const headers = [
      "Id",
      "Fecha",
      "Categoría / Tipo Movimiento / Descripción",
      "Mon",
      "T/C",
      "Asignación",
      "Gasto",
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
      size: 7,
      font: fontBold,
    });
    pag.drawText(headers[3], {
      x: colX[3] + 2,
      y: yPos + 2,
      size: 6,
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
      size: 7,
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

  // Definir columnas OPTIMIZADAS
  const colX = [
    margin, // Id
    margin + 25, // Fecha
    margin + 75, // Categoría/Tipo/Desc
    margin + 340, // Moneda
    margin + 365, // T/C
    margin + 400, // Asignación
    margin + 455, // Gasto
    margin + 510, // Saldo
  ];

  // Anchos de columnas para alineación
  const anchoColMon = colX[4] - colX[3];
  const anchoColTC = colX[5] - colX[4];
  const anchoColAsig = colX[6] - colX[5];
  const anchoColGasto = colX[7] - colX[6];
  const anchoColSaldo = width - margin - colX[7];

  // PRIMERA FILA: Asignación origen
  let saldoAcumulado = Number(liquidacion.monto || 0);

   // CALCULAR ALTURA DINÁMICA DE LA FILA
  let numLineasAsignacion = 2; // Categoría+Tipo en 1 línea, Descripción en otra
  if (liquidacion.embarcacion || labelEnlacePrincipal) numLineasAsignacion++;
  const alturaFilaAsignacion = Math.max(20, numLineasAsignacion * 8 + 6);

  // Fondo verde para asignación
  page.drawRectangle({
    x: colX[5],
    y: yPosition - alturaFilaAsignacion + 6,
    width: anchoColAsig,
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

  const categoria = liquidacion.tipoMovimiento?.categoria?.nombre || "";
  const tipoMov = liquidacion.tipoMovimiento?.nombre || "";
  const desc = liquidacion.descripcion || "";

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

    // Categoría/Tipo/Descripción/Embarcación/Enlace
  let yLineaDesc = yTopCelda;

  // Categoría y Tipo de Movimiento en UNA LÍNEA
  if (categoria || tipoMov) {
    let xPosTexto = colX[2];

    if (categoria) {
      page.drawText(categoria, {
        x: xPosTexto,
        y: yLineaDesc,
        size: 7,
        font: fontBold,
      });
      const anchoCategoria = fontBold.widthOfTextAtSize(categoria, 7);
      xPosTexto += anchoCategoria;
    }

    if (tipoMov) {
      const separador = categoria ? " - " : "";
      const textoTipo = `${separador}${tipoMov}`;
      page.drawText(textoTipo, {
        x: xPosTexto,
        y: yLineaDesc,
        size: 8,
        font: fontNormal,
      });
    }

    yLineaDesc -= 8;
  }

  if (desc) {
    page.drawText(desc, {
      x: colX[2],
      y: yLineaDesc,
      size: 7,
      font: fontOblique,
    });
    yLineaDesc -= 8;
  }

  // Embarcación y Enlace en UNA LÍNEA - DOS COLORES
  if (liquidacion.embarcacion || labelEnlacePrincipal) {
    let xPosicion = colX[2];

    if (liquidacion.embarcacion) {
      const textoEmbarcacion = `Embarcacion: ${liquidacion.embarcacion.activo?.nombre || liquidacion.embarcacion.matricula || "N/A"}`;
      page.drawText(textoEmbarcacion, {
        x: xPosicion,
        y: yLineaDesc,
        size: 6,
        font: fontOblique,
        color: rgb(0.2, 0.2, 0.6), // Azul oscuro
      });
      const anchoTextoEmb = fontOblique.widthOfTextAtSize(textoEmbarcacion, 6);
      xPosicion += anchoTextoEmb;
    }

    if (labelEnlacePrincipal) {
      const separador = liquidacion.embarcacion ? " - " : "";
      const textoEnlace = `${separador}Enlace: ${labelEnlacePrincipal}`;
      page.drawText(textoEnlace, {
        x: xPosicion,
        y: yLineaDesc,
        size: 6,
        font: fontOblique,
        color: rgb(0.6, 0.3, 0.1), // Marrón/Naranja
      });
    }
  }

  // Moneda, T/C, Asignación, Gasto, Saldo
  page.drawText(simboloMoneda, {
    x: alinearDerecha(simboloMoneda, colX[3], anchoColMon, fontNormal, 7),
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  const tcTexto = formatearNumero(tipoCambioBase, 3);
  page.drawText(tcTexto, {
    x: alinearDerecha(tcTexto, colX[4], anchoColTC, fontNormal, 7),
    y: yTopCelda,
    size: 7,
    font: fontNormal,
  });

  const asigTexto = formatearNumero(liquidacion.monto, 2);
  page.drawText(asigTexto, {
    x: alinearDerecha(asigTexto, colX[5], anchoColAsig, fontBold, 7),
    y: yTopCelda,
    size: 7,
    font: fontBold,
  });

  page.drawText("-", {
    x: alinearDerecha("-", colX[6], anchoColGasto, fontNormal, 7),
    y: yTopCelda,
    size: 7,
    font: fontNormal,
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

  // FILAS DE GASTOS
  let totalGastos = 0;

  for (const gasto of gastosAsociados) {
    // CALCULAR ALTURA DINÁMICA DE LA FILA
    let numLineasGasto = 2; // Categoría+Tipo en 1 línea, Descripción en otra
    if (gasto.embarcacion || gasto.labelEnlace) numLineasGasto++;
    const alturaFilaGasto = Math.max(20, numLineasGasto * 8 + 6);

    // Verificar si hay espacio para la fila
    if (yPosition < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      pages.push(page);
      yPosition = height - 30;
      yPosition = await dibujarEncabezadoCompleto(page, yPosition);
    }

    const montoConvertido = convertirAMonedaBase(
      gasto.monto,
      gasto.monedaId,
      gasto.tipoCambio || tipoCambioBase,
    );

    saldoAcumulado -= montoConvertido;
    totalGastos += montoConvertido;

    // Fondo rojo para gasto
    page.drawRectangle({
      x: colX[6],
      y: yPosition - alturaFilaGasto + 6,
      width: anchoColGasto,
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

    const catGasto = gasto.tipoMovimiento?.categoria?.nombre || "";
    const tipoGasto = gasto.tipoMovimiento?.nombre || "";
    const descGasto = gasto.descripcion || "";

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

        // Categoría/Tipo/Descripción/Embarcación/Enlace
    let yLineaDescGasto = yTopCeldaGasto;

    // Categoría y Tipo de Movimiento en UNA LÍNEA
    if (catGasto || tipoGasto) {
      let xPosTexto = colX[2];

      if (catGasto) {
        page.drawText(catGasto, {
          x: xPosTexto,
          y: yLineaDescGasto,
          size: 7,
          font: fontBold,
        });
        const anchoCategoria = fontBold.widthOfTextAtSize(catGasto, 7);
        xPosTexto += anchoCategoria;
      }

      if (tipoGasto) {
        const separador = catGasto ? " - " : "";
        const textoTipo = `${separador}${tipoGasto}`;
        page.drawText(textoTipo, {
          x: xPosTexto,
          y: yLineaDescGasto,
          size: 8,
          font: fontNormal,
        });
      }

      yLineaDescGasto -= 8;
    }

    if (descGasto) {
      page.drawText(descGasto, {
        x: colX[2],
        y: yLineaDescGasto,
        size: 7,
        font: fontOblique,
      });
      yLineaDescGasto -= 8;
    }

    // Embarcación y Enlace en UNA LÍNEA - DOS COLORES
    if (gasto.embarcacion || gasto.labelEnlace) {
      let xPosicion = colX[2];

      if (gasto.embarcacion) {
        const textoEmbarcacion = `Embarcacion: ${gasto.embarcacion.activo?.nombre || gasto.embarcacion.matricula || "N/A"}`;
        page.drawText(textoEmbarcacion, {
          x: xPosicion,
          y: yLineaDescGasto,
          size: 6,
          font: fontOblique,
          color: rgb(0.2, 0.2, 0.6), // Azul oscuro
        });
        const anchoTextoEmb = fontOblique.widthOfTextAtSize(textoEmbarcacion, 6);
        xPosicion += anchoTextoEmb;
      }

      if (gasto.labelEnlace) {
        const separador = gasto.embarcacion ? " - " : "";
        const textoEnlace = `${separador}Enlace: ${gasto.labelEnlace}`;
        page.drawText(textoEnlace, {
          x: xPosicion,
          y: yLineaDescGasto,
          size: 6,
          font: fontOblique,
          color: rgb(0.6, 0.3, 0.1), // Marrón/Naranja
        });
      }
    }

    // Moneda, T/C, Asignación, Gasto, Saldo
    const monGasto = gasto.moneda?.simbolo || "S/";
    page.drawText(monGasto, {
      x: alinearDerecha(monGasto, colX[3], anchoColMon, fontNormal, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    const tcGastoTexto = formatearNumero(gasto.tipoCambio || tipoCambioBase, 3);
    page.drawText(tcGastoTexto, {
      x: alinearDerecha(tcGastoTexto, colX[4], anchoColTC, fontNormal, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    page.drawText("-", {
      x: alinearDerecha("-", colX[5], anchoColAsig, fontNormal, 7),
      y: yTopCeldaGasto,
      size: 7,
      font: fontNormal,
    });

    const gastoTexto = formatearNumero(montoConvertido, 2);
    page.drawText(gastoTexto, {
      x: alinearDerecha(gastoTexto, colX[6], anchoColGasto, fontBold, 7),
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

  // FILA DE TOTALES
  page.drawRectangle({
    x: margin,
    y: yPosition - 2,
    width: width - 2 * margin,
    height: 12,
    color: rgb(0.75, 0.75, 0.75),
  });

  page.drawText("TOTALES:", {
    x: colX[2] + 2,
    y: yPosition + 1,
    size: 8,
    font: fontBold,
  });

  const totalAsigTexto = formatearNumero(liquidacion.monto, 2);
  page.drawText(totalAsigTexto, {
    x: alinearDerecha(totalAsigTexto, colX[5], anchoColAsig, fontBold, 8),
    y: yPosition + 1,
    size: 8,
    font: fontBold,
  });

  const totalGastoTexto = formatearNumero(totalGastos, 2);
  page.drawText(totalGastoTexto, {
    x: alinearDerecha(totalGastoTexto, colX[6], anchoColGasto, fontBold, 8),
    y: yPosition + 1,
    size: 8,
    font: fontBold,
  });

  // ========== NUEVA PÁGINA: DETALLE DE GASTOS PLANIFICADOS ==========
  const gastosPlanificados = liquidacion.gastosPlanificados || [];

  if (gastosPlanificados.length > 0) {
    // Crear nueva página
    page = pdfDoc.addPage([595.28, 841.89]);
    pages.push(page);
    yPosition = height - 30;

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
      ["Moneda:", liquidacion.moneda?.nombre || ""],
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

    // Texto explicativo
    page.drawText("Comparacion: Gastos Planificados vs Gastos Ejecutados", {
      x: margin,
      y: yPosition,
      size: 7,
      font: fontOblique,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= lineHeight + 3;

    // Definir columnas para gastos planificados
    const colXPlan = [
      margin, // #
      margin + 25, // Producto/Gasto
      margin + 280, // Moneda
      margin + 310, // Monto Planificado
      margin + 390, // Monto Ejecutado
      margin + 470, // Diferencia
    ];

    const headersPlan = [
      "#",
      "Producto / Gasto Planificado",
      "Mon",
      "Monto Planificado",
      "Monto Ejecutado",
      "Diferencia",
    ];

    // Anchos de columnas para alineación
    const anchoColMonPlan = colXPlan[3] - colXPlan[2];
    const anchoColMontoPlan = colXPlan[4] - colXPlan[3];
    const anchoColMontoEjec = colXPlan[5] - colXPlan[4];
    const anchoColDif = width - margin - colXPlan[5];

    // Fondo de encabezado
    page.drawRectangle({
      x: margin,
      y: yPosition - 2,
      width: width - 2 * margin,
      height: 14,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Encabezados
    page.drawText(headersPlan[0], {
      x: colXPlan[0] + 2,
      y: yPosition + 2,
      size: 7,
      font: fontBold,
    });
    page.drawText(headersPlan[1], {
      x: colXPlan[1] + 2,
      y: yPosition + 2,
      size: 7,
      font: fontBold,
    });
    page.drawText(headersPlan[2], {
      x: alinearDerecha(
        headersPlan[2],
        colXPlan[2],
        anchoColMonPlan,
        fontBold,
        7,
      ),
      y: yPosition + 2,
      size: 7,
      font: fontBold,
    });
    page.drawText(headersPlan[3], {
      x: alinearDerecha(
        headersPlan[3],
        colXPlan[3],
        anchoColMontoPlan,
        fontBold,
        7,
      ),
      y: yPosition + 2,
      size: 7,
      font: fontBold,
    });
    page.drawText(headersPlan[4], {
      x: alinearDerecha(
        headersPlan[4],
        colXPlan[4],
        anchoColMontoEjec,
        fontBold,
        7,
      ),
      y: yPosition + 2,
      size: 7,
      font: fontBold,
    });
    page.drawText(headersPlan[5], {
      x: alinearDerecha(headersPlan[5], colXPlan[5], anchoColDif, fontBold, 7),
      y: yPosition + 2,
      size: 7,
      font: fontBold,
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

    let totalPlanificado = 0;
    let totalEjecutado = 0;

    // Filas de gastos planificados
    gastosPlanificados.forEach((gp, index) => {
      // Calcular altura dinámica de la fila
      let numLineasGP = 0;
      if (gp.producto?.descripcionArmada) numLineasGP++;
      if (gp.descripcion) numLineasGP++;
      const alturaFilaGP = Math.max(13, numLineasGP * 8 + 5);

      // Verificar si hay espacio para la fila
      if (yPosition < 120) {
        page = pdfDoc.addPage([595.28, 841.89]);
        pages.push(page);
        yPosition = height - 30;
      }

      const montoPlanificado = convertirAMonedaBase(
        gp.montoPlanificado,
        gp.monedaId,
        tipoCambioBase,
      );

      // Calcular monto ejecutado
      let montoEjecutado = 0;
      gastosAsociados.forEach((ga) => {
        if (ga.productoId && Number(ga.productoId) === Number(gp.productoId)) {
          montoEjecutado += convertirAMonedaBase(
            ga.monto,
            ga.monedaId,
            ga.tipoCambio || tipoCambioBase,
          );
        }
      });

      const diferencia = montoPlanificado - montoEjecutado;
      totalPlanificado += montoPlanificado;
      totalEjecutado += montoEjecutado;

      const yTopFila = yPosition + 2;

      // #
      page.drawText(String(index + 1), {
        x: colXPlan[0] + 3,
        y: yTopFila,
        size: 7,
        font: fontNormal,
      });

      // Producto/Gasto - DOS LÍNEAS
      let yLineaProducto = yTopFila;

      // Primera línea: producto.descripcionArmada (BOLD)
      if (gp.producto?.descripcionArmada) {
        page.drawText(gp.producto.descripcionArmada, {
          x: colXPlan[1] + 2,
          y: yLineaProducto,
          size: 7,
          font: fontBold,
        });
        yLineaProducto -= 8;
      }

      // Segunda línea: descripcion (ITALIC)
      if (gp.descripcion) {
        page.drawText(gp.descripcion, {
          x: colXPlan[1] + 2,
          y: yLineaProducto,
          size: 7,
          font: fontOblique,
        });
      }

      // Moneda
      const monGP = gp.moneda?.simbolo || "S/";
      page.drawText(monGP, {
        x: alinearDerecha(monGP, colXPlan[2], anchoColMonPlan, fontNormal, 7),
        y: yTopFila,
        size: 7,
        font: fontNormal,
      });

      // Monto Planificado
      const montoPlanTexto = formatearNumero(montoPlanificado, 2);
      page.drawText(montoPlanTexto, {
        x: alinearDerecha(
          montoPlanTexto,
          colXPlan[3],
          anchoColMontoPlan,
          fontNormal,
          7,
        ),
        y: yTopFila,
        size: 7,
        font: fontNormal,
      });

      // Monto Ejecutado
      const montoEjecTexto = formatearNumero(montoEjecutado, 2);
      page.drawText(montoEjecTexto, {
        x: alinearDerecha(
          montoEjecTexto,
          colXPlan[4],
          anchoColMontoEjec,
          fontNormal,
          7,
        ),
        y: yTopFila,
        size: 7,
        font: fontNormal,
      });

      // Diferencia
      const difColor = diferencia >= 0 ? rgb(0, 0.4, 0) : rgb(0.8, 0, 0);
      const difTexto = formatearNumero(diferencia, 2);
      const difX = alinearDerecha(
        difTexto,
        colXPlan[5],
        anchoColDif,
        fontBold,
        7,
      );
      page.drawText(difTexto, {
        x: difX,
        y: yTopFila,
        size: 7,
        font: fontBold,
        color: difColor,
      });

      yPosition -= alturaFilaGP;
    });

    // Línea final de tabla
    yPosition -= 2;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 8;

    // FILA DE TOTALES
    page.drawRectangle({
      x: margin,
      y: yPosition - 2,
      width: width - 2 * margin,
      height: 12,
      color: rgb(0.75, 0.75, 0.75),
    });

    page.drawText("TOTALES:", {
      x: colXPlan[1] + 2,
      y: yPosition + 1,
      size: 8,
      font: fontBold,
    });

    const totalPlanTexto = formatearNumero(totalPlanificado, 2);
    page.drawText(totalPlanTexto, {
      x: alinearDerecha(
        totalPlanTexto,
        colXPlan[3],
        anchoColMontoPlan,
        fontBold,
        8,
      ),
      y: yPosition + 1,
      size: 8,
      font: fontBold,
    });

    const totalEjecTexto = formatearNumero(totalEjecutado, 2);
    page.drawText(totalEjecTexto, {
      x: alinearDerecha(
        totalEjecTexto,
        colXPlan[4],
        anchoColMontoEjec,
        fontBold,
        8,
      ),
      y: yPosition + 1,
      size: 8,
      font: fontBold,
    });

    const totalDif = totalPlanificado - totalEjecutado;
    const totalDifColor = totalDif >= 0 ? rgb(0, 0.4, 0) : rgb(0.8, 0, 0);
    const totalDifTexto = formatearNumero(totalDif, 2);
    const totalDifX = alinearDerecha(
      totalDifTexto,
      colXPlan[5],
      anchoColDif,
      fontBold,
      8,
    );
    page.drawText(totalDifTexto, {
      x: totalDifX,
      y: yPosition + 1,
      size: 8,
      font: fontBold,
      color: totalDifColor,
    });
  }

  // ========== FIRMAS ==========
  const firmaYPosition = 80;
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
        },
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
    const nombreUsuario =
      `${usuarioLogueado.personal.nombres || ""} ${usuarioLogueado.personal.apellidos || ""}`.trim();
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
        },
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

  // ========== NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA ==========
  const totalPages = pages.length;
  pages.forEach((p, index) => {
    const pageNumber = index + 1;
    const pageText = `Pagina ${pageNumber} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 7);

    p.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 20,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    p.drawText(`Generado: ${formatearFecha(new Date())} | Sistema ERP Megui`, {
      x: margin,
      y: 20,
      size: 6,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}