// src/components/ordenCompra/dibujaEncabezadoPDFOC.js
// Función para dibujar encabezado completo de la Orden de Compra - VERSIÓN OPTIMIZADA
import { rgb } from "pdf-lib";

/**
 * Dibuja el encabezado completo del documento en una página con 3 columnas
 * @param {Object} params - Parámetros
 * @param {Page} params.pag - Página donde dibujar
 * @param {PDFDocument} params.pdfDoc - Documento PDF
 * @param {Object} params.empresa - Datos de la empresa
 * @param {Object} params.ordenCompra - Datos de la orden de compra
 * @param {Array} params.datosColumna1 - Datos primera columna
 * @param {Array} params.datosColumna2 - Datos segunda columna
 * @param {Array} params.datosColumna3 - Datos tercera columna (datos adicionales)
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {number} params.lineHeight - Altura de línea
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {Promise<number>} - Nueva posición Y
 */
export async function dibujaEncabezadoPDFOC({
  pag,
  pdfDoc,
  empresa,
  ordenCompra,
  datosColumna1,
  datosColumna2,
  datosColumna3,
  width,
  height,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
}) {
  let yPos = height - 50;

  // Cargar logo si existe
  if (empresa?.logo && empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${
        empresa.id
      }/logo`;
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
          const logoDims = logoImage.size();
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

  // ENCABEZADO - Datos de la empresa
  pag.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin + 110,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= lineHeight;
  pag.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin + 110,
    y: yPos,
    size: 10,
    font: fontNormal,
  });

  yPos -= lineHeight;
  if (empresa?.direccion) {
    pag.drawText(`Dirección: ${empresa.direccion}`, {
      x: margin + 110,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
    yPos -= 12;
  }

  // Título del documento
  yPos -= 10;
  const titulo = "ORDEN DE COMPRA";
  const tituloWidth = titulo.length * 8;
  const tituloX = (width - tituloWidth) / 2;

  pag.drawText(titulo, {
    x: tituloX,
    y: yPos,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Número de documento
  yPos -= 14;
  const numeroDoc = ordenCompra.numeroDocumento || "-";
  pag.drawText(`N° ${numeroDoc}`, {
    x: width / 2 - 50,
    y: yPos,
    size: 12,
    font: fontBold,
  });

  // Línea separadora
  yPos -= 8;
  pag.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // ========================================
  // DATOS EN 3 COLUMNAS OPTIMIZADAS
  // ========================================
  yPos -= 12;
  const yInicial = yPos;
  const gapEntreColumnas = 5;
  // Calcular anchos de columnas optimizados
  const anchoDisponible = width - (margin * 2);
  
  // Columna 1: más ancha (30%)
  // Columna 2: estrecha (20%) - movida 1.5cm a la derecha
  // Columna 3: el doble de ancho (50%)
  const anchoColumna1 = (anchoDisponible * 0.30)+80;  // 30% (aumentado)
  const anchoColumna2 = anchoDisponible * 0.20;  // 20% (reducido)
  const anchoColumna3 = anchoDisponible * 0.50;  // 50% (el doble)
  
  const columna1X = margin;
  const columna2X = gapEntreColumnas + anchoColumna1 + 42; // +42 puntos = ~1.5cm a la derecha
  const columna3X = gapEntreColumnas + anchoColumna1 + anchoColumna2 + 42;
  
  // Anchos de labels ajustados por columna
  const anchoLabelCol1 = 60;  // Más compacto para labels acortados
  const anchoLabelCol2 = 55;  // Más compacto para labels acortados
  const anchoLabelCol3 = 140; // El doble para datos adicionales

  // ========================================
  // COLUMNA 1: Datos principales
  // ========================================
  let yCol1 = yInicial;
  datosColumna1.forEach(([label, value]) => {
    pag.drawText(label, {
      x: columna1X,
      y: yCol1,
      size: 9,
      font: fontBold,
    });
    
    // Verificar si es la dirección de entrega (texto largo)
    const esDireccionEntrega = label === "Entregar en:";
    
    if (esDireccionEntrega) {
      // Dividir dirección en múltiples líneas
      const maxValueWidth = anchoColumna1 - anchoLabelCol1 - 5;
      const words = String(value).split(' ');
      let currentLine = '';
      let yDireccion = yCol1;
      
      words.forEach((word, idx) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = fontNormal.widthOfTextAtSize(testLine, 9);
        
        if (testWidth > maxValueWidth && currentLine) {
          // Dibujar línea actual
          pag.drawText(currentLine, {
            x: columna1X + anchoLabelCol1,
            y: yDireccion,
            size: 9,
            font: fontNormal,
          });
          currentLine = word;
          yDireccion -= lineHeight;
        } else {
          currentLine = testLine;
        }
        
        // Última palabra
        if (idx === words.length - 1 && currentLine) {
          pag.drawText(currentLine, {
            x: columna1X + anchoLabelCol1,
            y: yDireccion,
            size: 9,
            font: fontNormal,
          });
        }
      });
      
      // Ajustar yCol1 para la siguiente línea
      yCol1 = yDireccion - lineHeight;
    } else {
      // Limitar ancho del value para otros campos
      const maxValueWidth = anchoColumna1 - anchoLabelCol1 - 5;
      let valueTexto = String(value);
      let valueWidth = fontNormal.widthOfTextAtSize(valueTexto, 9);
      
      while (valueWidth > maxValueWidth && valueTexto.length > 3) {
        valueTexto = valueTexto.substring(0, valueTexto.length - 4) + "...";
        valueWidth = fontNormal.widthOfTextAtSize(valueTexto, 9);
      }
      
      pag.drawText(valueTexto, {
        x: columna1X + anchoLabelCol1,
        y: yCol1,
        size: 9,
        font: fontNormal,
      });
      yCol1 -= lineHeight;
    }
  });

  // ========================================
  // COLUMNA 2: Datos financieros (MOVIDA 1.5CM A LA DERECHA)
  // ========================================
  let yCol2 = yInicial;
  datosColumna2.forEach(([label, value]) => {
    pag.drawText(label, {
      x: columna2X,
      y: yCol2,
      size: 9,
      font: fontBold,
    });
    pag.drawText(String(value), {
      x: columna2X + anchoLabelCol2,
      y: yCol2,
      size: 9,
      font: fontNormal,
    });
    yCol2 -= lineHeight;
  });

  // ========================================
  // COLUMNA 3: Datos adicionales dinámicos (DOBLE DE ANCHO)
  // ========================================
  let yCol3 = yInicial;
  if (datosColumna3 && datosColumna3.length > 0) {
    datosColumna3.forEach(([label, value]) => {
      // Limitar ancho del label (ahora tiene el doble de espacio)
      const maxLabelWidth = anchoLabelCol3 - 5;
      let labelTexto = label;
      let labelWidth = fontBold.widthOfTextAtSize(labelTexto, 9);
      
      // Truncar label si es muy largo
      while (labelWidth > maxLabelWidth && labelTexto.length > 3) {
        labelTexto = labelTexto.substring(0, labelTexto.length - 4) + "...";
        labelWidth = fontBold.widthOfTextAtSize(labelTexto, 9);
      }
      
      pag.drawText(labelTexto, {
        x: columna3X,
        y: yCol3,
        size: 9,
        font: fontBold,
      });
      
      // Limitar ancho del value (ahora tiene el doble de espacio)
      const maxValueWidth = anchoColumna3 - anchoLabelCol3 - 10;
      let valueTexto = String(value);
      let valueWidth = fontNormal.widthOfTextAtSize(valueTexto, 9);
      
      // Truncar value si es muy largo
      while (valueWidth > maxValueWidth && valueTexto.length > 3) {
        valueTexto = valueTexto.substring(0, valueTexto.length - 4) + "...";
        valueWidth = fontNormal.widthOfTextAtSize(valueTexto, 9);
      }
      
      pag.drawText(valueTexto, {
        x: columna3X + anchoLabelCol3,
        y: yCol3,
        size: 9,
        font: fontNormal,
      });
      yCol3 -= lineHeight;
    });
  }

  // Ajustar yPos al final de la columna más larga
  yPos = Math.min(yCol1, yCol2, yCol3);

  return yPos;
}