// src/components/requerimientoCompra/dibujaEncabezadoPDFRC.js
// Función para dibujar encabezado completo del Requerimiento de Compra
import { rgb } from "pdf-lib";

/**
 * Dibuja el encabezado completo del documento en una página
 * @param {Object} params - Parámetros
 * @param {Page} params.pag - Página donde dibujar
 * @param {PDFDocument} params.pdfDoc - Documento PDF
 * @param {Object} params.empresa - Datos de la empresa
 * @param {Object} params.requerimiento - Datos del requerimiento
 * @param {Array} params.datosIzquierda - Datos columna izquierda
 * @param {Array} params.datosDerecha - Datos columna derecha
 * @param {boolean} params.mostrarProveedor - Mostrar proveedor
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {number} params.lineHeight - Altura de línea
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {Promise<number>} - Nueva posición Y
 */
export async function dibujaEncabezadoPDFRC({
  pag,
  pdfDoc,
  empresa,
  requerimiento,
  datosIzquierda,
  datosDerecha,
  mostrarProveedor,
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
  const titulo = "REQUERIMIENTO DE COMPRA";
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
  const numeroDoc = requerimiento.numeroDocumento || "-";
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

  // Datos del requerimiento en dos columnas
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

  // Agregar proveedor solo si mostrarProveedor es true
  if (mostrarProveedor && requerimiento.proveedor) {
    pag.drawText("Proveedor:", {
      x: margin,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    pag.drawText(requerimiento.proveedor?.razonSocial || "-", {
      x: margin + 120,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  // Responsables (solo Producción y Almacén)
  if (requerimiento.respProduccion) {
    pag.drawText("Resp. Producción:", {
      x: margin,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    pag.drawText(requerimiento.respProduccion.nombreCompleto || "-", {
      x: margin + 120,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }
  
  if (requerimiento.respAlmacen) {
    pag.drawText("Resp. Almacén:", {
      x: margin,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    pag.drawText(requerimiento.respAlmacen.nombreCompleto || "-", {
      x: margin + 120,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  // Observaciones
  if (requerimiento.observaciones) {
    pag.drawText("Observaciones:", {
      x: margin,
      y: yPos,
      size: 9,
      font: fontBold,
    });
    pag.drawText(requerimiento.observaciones, {
      x: margin + 120,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  return yPos;
}
