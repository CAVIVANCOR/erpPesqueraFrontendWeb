/**
 * Helper para dibujar totales y sección de firmas en PDFs de Cotización de Ventas usando pdf-lib
 * 
 * @param {PDFPage} page - Página del PDF
 * @param {Object} totales - Objeto con subtotal, igv, total, moneda
 * @param {number} yPosition - Posición Y inicial
 * @param {number} width - Ancho de la página
 * @param {number} height - Alto de la página
 * @param {PDFFont} font - Fuente normal
 * @param {PDFFont} fontBold - Fuente bold
 * @returns {number} - Nueva posición Y después de los totales
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";

export async function dibujaTotalesYFirmaPDFCV(
  page,
  totales,
  yPosition,
  width,
  height,
  font,
  fontBold
) {
  try {
    const { subtotal, igv, total, moneda = "USD" } = totales;

    // Cuadro de totales (lado derecho)
    const boxWidth = 150;
    const boxX = width - 50 - boxWidth;
    const boxY = yPosition - 60;

    // Fondo del cuadro
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: 60,
      color: rgb(0.96, 0.96, 0.96),
    });

    // Borde del cuadro
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: 60,
      borderColor: rgb(0.16, 0.5, 0.73),
      borderWidth: 1,
    });

    // Subtotal
    page.drawText("SUBTOTAL:", {
      x: boxX + 10,
      y: boxY + 45,
      size: 9,
      font: fontBold,
    });

    page.drawText(`${moneda} ${subtotal.toFixed(2)}`, {
      x: boxX + boxWidth - 70,
      y: boxY + 45,
      size: 9,
      font: font,
    });

    // IGV (18%)
    page.drawText("IGV (18%):", {
      x: boxX + 10,
      y: boxY + 30,
      size: 9,
      font: fontBold,
    });

    page.drawText(`${moneda} ${igv.toFixed(2)}`, {
      x: boxX + boxWidth - 70,
      y: boxY + 30,
      size: 9,
      font: font,
    });

    // Línea separadora
    page.drawLine({
      start: { x: boxX + 10, y: boxY + 23 },
      end: { x: boxX + boxWidth - 10, y: boxY + 23 },
      thickness: 0.5,
      color: rgb(0.16, 0.5, 0.73),
    });

    // Total (fondo azul)
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: 20,
      color: rgb(0.16, 0.5, 0.73),
    });

    page.drawText("TOTAL:", {
      x: boxX + 10,
      y: boxY + 7,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${moneda} ${total.toFixed(2)}`, {
      x: boxX + boxWidth - 70,
      y: boxY + 7,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Total en letras
    yPosition = boxY - 10;
    const totalEnLetras = numeroALetras(total);
    const textoLetras = `SON: ${totalEnLetras} ${moneda === "USD" ? "DÓLARES AMERICANOS" : "SOLES"}`;

    page.drawText(textoLetras, {
      x: 50,
      y: yPosition,
      size: 8,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Sección de firmas
    yPosition -= 30;

    // Verificar si hay espacio suficiente
    if (yPosition < 100) {
      // No hay espacio, retornar posición actual
      return yPosition;
    }

    page.drawText("FIRMAS Y APROBACIONES", {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
    });

    yPosition -= 15;

    const firmaWidth = (width - 120) / 2;
    const firmaHeight = 50;

    // Firma 1: Elaborado por
    page.drawRectangle({
      x: 50,
      y: yPosition - firmaHeight,
      width: firmaWidth,
      height: firmaHeight,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.5,
    });

    page.drawText("Elaborado por:", {
      x: 55,
      y: yPosition - 15,
      size: 8,
      font: font,
    });

    // Línea para firma
    page.drawLine({
      start: { x: 55, y: yPosition - 35 },
      end: { x: 50 + firmaWidth - 5, y: yPosition - 35 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    page.drawText("Nombre y Firma", {
      x: 55,
      y: yPosition - 42,
      size: 8,
      font: fontBold,
    });

    // Firma 2: Aprobado por
    page.drawRectangle({
      x: 50 + firmaWidth + 20,
      y: yPosition - firmaHeight,
      width: firmaWidth,
      height: firmaHeight,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.5,
    });

    page.drawText("Aprobado por:", {
      x: 55 + firmaWidth + 20,
      y: yPosition - 15,
      size: 8,
      font: font,
    });

    // Línea para firma
    page.drawLine({
      start: { x: 55 + firmaWidth + 20, y: yPosition - 35 },
      end: { x: 50 + firmaWidth + 20 + firmaWidth - 5, y: yPosition - 35 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    page.drawText("Nombre y Firma", {
      x: 55 + firmaWidth + 20,
      y: yPosition - 42,
      size: 8,
      font: fontBold,
    });

    return yPosition - firmaHeight - 10;
  } catch (error) {
    console.error("Error al dibujar totales y firmas:", error);
    return yPosition - 100; // Retornar posición por defecto en caso de error
  }
}

/**
 * Convierte un número a letras (español) - Versión simplificada
 */
function numeroALetras(numero) {
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (numero === 0) return "CERO";

  const entero = Math.floor(numero);
  const decimales = Math.round((numero - entero) * 100);

  let resultado = "";

  // Miles
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000);
    if (miles === 1) {
      resultado += "MIL ";
    } else {
      resultado += convertirCentenas(miles, unidades, decenas, especiales, centenas) + " MIL ";
    }
    entero = entero % 1000;
  }

  // Centenas
  resultado += convertirCentenas(entero, unidades, decenas, especiales, centenas);

  // Decimales
  if (decimales > 0) {
    resultado += ` CON ${decimales}/100`;
  }

  return resultado.trim();
}

function convertirCentenas(numero, unidades, decenas, especiales, centenas) {
  let resultado = "";

  // Centenas
  const c = Math.floor(numero / 100);
  if (c > 0) {
    if (numero === 100) {
      return "CIEN";
    } else {
      resultado += centenas[c] + " ";
    }
  }

  numero = numero % 100;

  // Decenas especiales (10-19)
  if (numero >= 10 && numero <= 19) {
    return resultado + especiales[numero - 10];
  }

  // Decenas
  const d = Math.floor(numero / 10);
  if (d > 0) {
    resultado += decenas[d];
    numero = numero % 10;
    if (numero > 0) {
      resultado += " Y ";
    }
  }

  // Unidades
  if (numero > 0) {
    resultado += unidades[numero];
  }

  return resultado.trim();
}