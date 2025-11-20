// src/components/cotizacionVentas/dibujaEncabezadoPDFCV.js
// Función para dibujar encabezado completo de la Cotización de Ventas
// Patrón profesional siguiendo RequerimientoCompra
import { rgb } from "pdf-lib";
import { getTranslation } from "./translations";

/**
 * Dibuja el encabezado completo del documento en una página
 * @param {Object} params - Parámetros
 * @param {Page} params.pag - Página donde dibujar
 * @param {PDFDocument} params.pdfDoc - Documento PDF
 * @param {Object} params.empresa - Datos de la empresa
 * @param {Object} params.cotizacion - Datos de la cotización
 * @param {Array} params.datosIzquierda - Datos columna izquierda
 * @param {Array} params.datosDerecha - Datos columna derecha
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {number} params.lineHeight - Altura de línea
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @param {string} params.idioma - Idioma (opcional, por defecto "en")
 * @returns {Promise<number>} - Nueva posición Y
 */
export async function dibujaEncabezadoPDFCV({
  pag,
  pdfDoc,
  empresa,
  cotizacion,
  datosIzquierda,
  datosDerecha,
  width,
  height,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
  idioma = "en",
}) {
  // Función helper para obtener traducciones
  const t = (key) => getTranslation(idioma, key);
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
    pag.drawText(`${t("address")} ${empresa.direccion}`, {
      x: margin + 110,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
    yPos -= 12;
  }

  // Título del documento
  yPos -= 10;
  const titulo = cotizacion.esExportacion
    ? t("exportQuotation")
    : t("salesQuotation");
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
  const numeroDoc = cotizacion.numeroDocumento || "-";
  pag.drawText(`${t("documentNumber")} ${numeroDoc}`, {
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

  // Datos de la cotización en dos columnas
  yPos -= 12;
  const yInicial = yPos;
  const columnaDerechaX = width / 2 + 50;

  // Dibujar columna izquierda
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

  // Dibujar columna derecha
  yPos = yInicial;
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

  // Ajustar yPos al final de las columnas
  yPos =
    yInicial -
    Math.max(datosIzquierda.length, datosDerecha.length) * lineHeight;

  // Línea separadora antes de información adicional
  yPos -= 5;
  pag.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  yPos -= 10;

  // INFORMACIÓN ADICIONAL EN DOS COLUMNAS
  const yInicialAdicional = yPos;
  const columnaDerechaXAdicional = width / 2 + 50;

  // Columna izquierda - Información adicional
  const datosAdicionalesIzq = [];
  
  if (cotizacion.tipoContenedor || cotizacion.cantidadContenedores || cotizacion.pesoMaximoContenedor) {
    const contenedorInfo = [];
    if (cotizacion.tipoContenedor?.descripcion) contenedorInfo.push(cotizacion.tipoContenedor.descripcion);
    if (cotizacion.cantidadContenedores) contenedorInfo.push(`${cotizacion.cantidadContenedores} und.`);
    if (cotizacion.pesoMaximoContenedor) contenedorInfo.push(`${cotizacion.pesoMaximoContenedor} kg`);
    datosAdicionalesIzq.push([t("containers"), contenedorInfo.join(" - ")]);
  }
  
  if (cotizacion.agenteAduanas?.razonSocial) {
    datosAdicionalesIzq.push([t("customsAgent"), cotizacion.agenteAduanas.razonSocial]);
  }
  
  if (cotizacion.operadorLogistico?.razonSocial) {
    datosAdicionalesIzq.push([t("logisticsOperator"), cotizacion.operadorLogistico.razonSocial]);
  }

  // Columna derecha - Información adicional
  const datosAdicionalesDer = [];
  
  if (cotizacion.naviera?.razonSocial) {
    datosAdicionalesDer.push([t("shippingLine"), cotizacion.naviera.razonSocial]);
  }
  
  if (cotizacion.respVentas?.nombreCompleto) {
    datosAdicionalesDer.push([t("salesRep"), cotizacion.respVentas.nombreCompleto]);
  }

  // Dibujar columna izquierda adicional
  datosAdicionalesIzq.forEach(([label, value]) => {
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

  // Dibujar columna derecha adicional
  yPos = yInicialAdicional;
  datosAdicionalesDer.forEach(([label, value]) => {
    pag.drawText(label, {
      x: columnaDerechaXAdicional,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    pag.drawText(String(value), {
      x: columnaDerechaXAdicional + 120,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  });

  // Ajustar yPos al final de las columnas adicionales
  yPos = yInicialAdicional - Math.max(datosAdicionalesIzq.length, datosAdicionalesDer.length) * lineHeight;

  // Observaciones
  if (cotizacion.observaciones) {
    pag.drawText(t("observations"), {
      x: margin,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    
    // Dividir observaciones en líneas si es muy largo
    const obsMaxWidth = width - margin * 2 - 120;
    const obsText = cotizacion.observaciones;
    const words = obsText.split(' ');
    let currentLine = '';
    
    words.forEach((word, idx) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = fontNormal.widthOfTextAtSize(testLine, 9);
      
      if (testWidth > obsMaxWidth && currentLine) {
        pag.drawText(currentLine, {
          x: margin + 120,
          y: yPos,
          size: 9,
          font: fontNormal,
        });
        currentLine = word;
        yPos -= 10;
      } else {
        currentLine = testLine;
      }
      
      if (idx === words.length - 1 && currentLine) {
        pag.drawText(currentLine, {
          x: margin + 120,
          y: yPos,
          size: 9,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }
    });
  }

  return yPos;
}