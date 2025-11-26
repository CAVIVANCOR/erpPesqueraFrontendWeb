/**
 * dibujaEncabezadoPDFPF.js
 *
 * Dibuja el encabezado del PDF de Pre-Factura.
 * Incluye logo, datos de empresa, cliente y documento.
 * Sigue el patrón profesional ERP Megui usando pdf-lib.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import { rgb } from "pdf-lib";

/**
 * Dibuja el encabezado completo del PDF de pre-factura
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {PDFDocument} params.pdfDoc - Documento PDF
 * @param {Object} params.empresa - Datos de la empresa
 * @param {Object} params.datosPreFactura - Datos de la pre-factura
 * @param {number} params.width - Ancho de página
 * @param {number} params.height - Alto de página
 * @param {number} params.margin - Margen
 * @param {number} params.lineHeight - Altura de línea
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @param {Function} params.formatearFecha - Función para formatear fechas
 * @returns {Promise<number>} - Nueva posición Y
 */
export async function dibujarEncabezadoPDFPreFactura({
  page,
  pdfDoc,
  empresa,
  datosPreFactura,
  width,
  height,
  margin,
  lineHeight,
  fontBold,
  fontNormal,
  formatearFecha,
}) {
  let yPos = height - 50;

  // 1. Cargar logo si existe
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

  // 2. Datos de la empresa
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
    page.drawText(empresa.direccion, {
      x: margin + 110,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  if (empresa?.telefono) {
    page.drawText(`Tel: ${empresa.telefono}`, {
      x: margin + 110,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  // 3. Cuadro de documento (lado derecho)
  const boxWidth = 150;
  const boxHeight = 80;
  const boxX = width - margin - boxWidth;
  const boxY = height - 50 - boxHeight;

  // Fondo del cuadro
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0.16, 0.5, 0.73),
    borderWidth: 2,
  });

  // Título
  page.drawText("PRE-FACTURA", {
    x: boxX + boxWidth / 2 - 40,
    y: boxY + boxHeight - 20,
    size: 12,
    font: fontBold,
    color: rgb(0.16, 0.5, 0.73),
  });

  // Número de documento
  page.drawText(datosPreFactura.numeroDocumento || "N/A", {
    x: boxX + boxWidth / 2 - 30,
    y: boxY + boxHeight - 35,
    size: 10,
    font: fontBold,
  });

  // Código
  page.drawText(`Código: ${datosPreFactura.codigo || "N/A"}`, {
    x: boxX + 5,
    y: boxY + boxHeight - 50,
    size: 8,
    font: fontNormal,
  });

  // Fecha documento
  page.drawText(`Fecha: ${formatearFecha(datosPreFactura.fechaDocumento)}`, {
    x: boxX + 5,
    y: boxY + boxHeight - 62,
    size: 8,
    font: fontNormal,
  });

  // Fecha vencimiento
  page.drawText(`Vence: ${formatearFecha(datosPreFactura.fechaVencimiento) || "N/A"}`, {
    x: boxX + 5,
    y: boxY + boxHeight - 74,
    size: 8,
    font: fontNormal,
  });

  yPos = boxY - 20;

  // 4. Línea separadora
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 15;

  // 5. Datos del cliente
  page.drawText("DATOS DEL CLIENTE", {
    x: margin,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0.16, 0.5, 0.73),
  });

  yPos -= lineHeight;
  page.drawText(`Cliente: ${datosPreFactura.cliente?.razonSocial || "N/A"}`, {
    x: margin,
    y: yPos,
    size: 9,
    font: fontBold,
  });

  yPos -= lineHeight;
  const tipoDoc = datosPreFactura.cliente?.tipoDocumentoIdentidad || "RUC";
  const numDoc = datosPreFactura.cliente?.ruc || datosPreFactura.cliente?.dni || "N/A";
  page.drawText(`${tipoDoc}: ${numDoc}`, {
    x: margin,
    y: yPos,
    size: 9,
    font: fontNormal,
  });

  yPos -= lineHeight;
  if (datosPreFactura.cliente?.direccion) {
    page.drawText(`Dirección: ${datosPreFactura.cliente.direccion}`, {
      x: margin,
      y: yPos,
      size: 9,
      font: fontNormal,
    });
    yPos -= lineHeight;
  }

  // 6. Información adicional (dos columnas)
  const col1X = margin;
  const col2X = margin + 250;

  if (datosPreFactura.formaPago) {
    page.drawText(`Forma de Pago: ${datosPreFactura.formaPago.descripcion || datosPreFactura.formaPago.nombre}`, {
      x: col1X,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
  }

  if (datosPreFactura.moneda) {
    page.drawText(`Moneda: ${datosPreFactura.moneda.nombre} (${datosPreFactura.moneda.simbolo})`, {
      x: col2X,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
  }

  yPos -= lineHeight;

  if (datosPreFactura.tipoCambio && datosPreFactura.moneda?.codigoSunat !== "PEN") {
    page.drawText(`Tipo de Cambio: S/ ${Number(datosPreFactura.tipoCambio).toFixed(4)}`, {
      x: col1X,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
  }

  if (datosPreFactura.ordenCompraCliente) {
    page.drawText(`O/C Cliente: ${datosPreFactura.ordenCompraCliente}`, {
      x: col2X,
      y: yPos,
      size: 8,
      font: fontNormal,
    });
  }

  yPos -= lineHeight;

  // 7. Información de exportación (si aplica)
  if (datosPreFactura.esExportacion) {
    page.drawText("EXPORTACIÓN", {
      x: col1X,
      y: yPos,
      size: 9,
      font: fontBold,
      color: rgb(0.86, 0.21, 0.27),
    });

    yPos -= lineHeight;

    if (datosPreFactura.incoterm) {
      page.drawText(`Incoterm: ${datosPreFactura.incoterm.codigo} - ${datosPreFactura.incoterm.nombre}`, {
        x: col1X,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
    }

    if (datosPreFactura.paisDestino) {
      page.drawText(`País Destino: ${datosPreFactura.paisDestino.nombre}`, {
        x: col2X,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
    }

    yPos -= lineHeight;

    if (datosPreFactura.puertoCarga) {
      page.drawText(`Puerto Carga: ${datosPreFactura.puertoCarga.nombre}`, {
        x: col1X,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
    }

    if (datosPreFactura.puertoDescarga) {
      page.drawText(`Puerto Descarga: ${datosPreFactura.puertoDescarga.nombre}`, {
        x: col2X,
        y: yPos,
        size: 8,
        font: fontNormal,
      });
    }

    yPos -= lineHeight;
  }

  // 8. Línea separadora final
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 10;

  return yPos;
}