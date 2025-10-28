// src/components/movimientoAlmacen/dibujaEncabezadoPDFMA.js
// Función para dibujar el encabezado del Movimiento de Almacén
import { rgb } from "pdf-lib";

/**
 * Dibuja el encabezado completo del documento en una página
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {PDFDocument} params.pdfDoc - Documento PDF
 * @param {Object} params.movimiento - Datos del movimiento
 * @param {Object} params.empresa - Datos de la empresa
 * @param {Array} params.datosMovimiento - Array de datos del movimiento [label, value]
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {number} params.lineHeight - Altura de línea
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @param {boolean} params.incluirDatos - Si debe incluir datos del movimiento
 * @returns {Promise<number>} - Posición Y final
 */
export async function dibujaEncabezadoPDFMA({
  page,
  pdfDoc,
  movimiento,
  empresa,
  datosMovimiento,
  width,
  height,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
  incluirDatos = true,
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

          page.drawImage(logoImage, {
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
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin + 110,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= lineHeight;
  page.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin + 110,
    y: yPos,
    size: 10,
    font: fontNormal,
  });

  yPos -= lineHeight;
  if (empresa?.direccion) {
    page.drawText(`Dirección: ${empresa.direccion}`, {
      x: margin + 110,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  // Título del documento
  yPos -= 15;
  const titulo = (
    movimiento.tipoDocumento?.descripcion || "DOCUMENTO DE ALMACÉN"
  ).toUpperCase();
  const tituloWidth = titulo.length * 8;
  const tituloX = (width - tituloWidth) / 2;

  page.drawText(titulo, {
    x: tituloX,
    y: yPos,
    size: 16,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Número de documento
  yPos -= lineHeight + 5;
  const numeroDoc =
    movimiento.numeroDocumento ||
    (movimiento.numSerieDoc && movimiento.numCorreDoc
      ? `${movimiento.numSerieDoc}-${movimiento.numCorreDoc}`
      : "-");
  page.drawText(`N° ${numeroDoc}`, {
    x: width / 2 - 50,
    y: yPos,
    size: 12,
    font: fontBold,
  });

  // Línea separadora
  yPos -= 10;
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPos -= 15;

  // Dibujar DATOS DEL MOVIMIENTO si incluirDatos es true
  if (incluirDatos) {
    datosMovimiento.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPos,
        size: 9,
        font: fontBold,
      });
      page.drawText(value, {
        x: margin + 130,
        y: yPos,
        size: 9,
        font: fontNormal,
      });
      yPos -= lineHeight;
    });
  }

  return yPos;
}