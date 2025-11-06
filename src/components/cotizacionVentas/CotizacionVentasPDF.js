// src/components/cotizacionVentas/CotizacionVentasPDF.js
// Generador de PDF para cotizaciones de ventas usando pdf-lib
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFCV } from "./dibujaEncabezadoPDFCV";
import { dibujaTotalesYFirmaPDFCV } from "./dibujaTotalesYFirmaPDFCV";

/**
 * Genera un PDF de la cotización de ventas y lo sube al servidor
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Array} detalles - Detalles de productos
 * @param {Array} costos - Costos de exportación
 * @param {Object} empresa - Datos de la empresa
 * @param {Object} opciones - Opciones de generación
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFCotizacionVentas(
  cotizacion,
  detalles,
  costos,
  empresa,
  opciones = {}
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFCotizacionVentas(
      cotizacion,
      detalles,
      costos,
      empresa,
      opciones
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData para subir
    const formData = new FormData();
    const nombreArchivo = `cotizacion-ventas-${cotizacion.id}.pdf`;
    formData.append("pdf", blob, nombreArchivo);
    formData.append("cotizacionId", cotizacion.id);

    // 4. Subir al servidor
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/cotizacion-ventas/upload-pdf`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al subir el PDF");
    }

    const resultado = await response.json();

    return {
      success: true,
      urlPdf: resultado.urlCotizacionVentaPdf || resultado.urlPdf,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF de la cotización de ventas
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Array} detalles - Detalles de productos
 * @param {Array} costos - Costos de exportación
 * @param {Object} empresa - Datos de la empresa
 * @param {Object} opciones - Opciones de generación
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFCotizacionVentas(
  cotizacion,
  detalles,
  costos,
  empresa,
  opciones = {}
) {
  const {
    incluirDetalles = true,
    incluirCostos = false,
    incluirObservaciones = true,
    incluirTerminos = true,
    notasAdicionales = "",
  } = opciones;

  // Funciones de formateo
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Dibujar encabezado
  yPosition = await dibujaEncabezadoPDFCV(
    page,
    cotizacion,
    empresa,
    yPosition,
    width,
    height,
    font,
    fontBold
  );

  yPosition -= 20;

  // Información del cliente
  page.drawText("DATOS DEL CLIENTE", {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;

  page.drawText(`Cliente: ${cotizacion.cliente?.razonSocial || "N/A"}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
  });
  yPosition -= 12;

  page.drawText(`RUC: ${cotizacion.cliente?.ruc || "N/A"}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
  });
  yPosition -= 12;

  page.drawText(`País Destino: ${cotizacion.paisDestino?.nombre || "N/A"}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
  });
  yPosition -= 20;

  // Información comercial
  page.drawText("INFORMACIÓN COMERCIAL", {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
  });
  yPosition -= 15;

  page.drawText(`Incoterm: ${cotizacion.incoterm?.codigo || "N/A"}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
  });
  page.drawText(
    `Forma de Pago: ${cotizacion.formaPago?.nombre || "N/A"}`,
    {
      x: 300,
      y: yPosition,
      size: 9,
      font: font,
    }
  );
  yPosition -= 12;

  page.drawText(`Moneda: ${cotizacion.moneda?.codigo || "N/A"}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
  });
  page.drawText(`Validez: ${cotizacion.diasValidez || 0} días`, {
    x: 300,
    y: yPosition,
    size: 9,
    font: font,
  });
  yPosition -= 25;

  // Detalle de productos
  if (incluirDetalles && detalles.length > 0) {
    // Verificar espacio
    if (yPosition < 200) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText("DETALLE DE PRODUCTOS", {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
    });
    yPosition -= 20;

    // Encabezados de tabla
    const tableHeaders = [
      { text: "Item", x: 50, width: 40 },
      { text: "Producto", x: 95, width: 200 },
      { text: "Cantidad", x: 300, width: 60 },
      { text: "Precio Unit.", x: 365, width: 80 },
      { text: "Subtotal", x: 450, width: 80 },
    ];

    // Dibujar encabezados
    page.drawRectangle({
      x: 45,
      y: yPosition - 5,
      width: width - 90,
      height: 20,
      color: rgb(0.16, 0.5, 0.73),
    });

    tableHeaders.forEach((header) => {
      page.drawText(header.text, {
        x: header.x,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    });
    yPosition -= 20;

    // Dibujar filas
    detalles.forEach((detalle, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }

      const rowColor = index % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
      page.drawRectangle({
        x: 45,
        y: yPosition - 5,
        width: width - 90,
        height: 15,
        color: rowColor,
      });

      page.drawText(String(detalle.item || index + 1), {
        x: 50,
        y: yPosition,
        size: 8,
        font: font,
      });

      const productoNombre = detalle.producto?.nombre || "N/A";
      const productoTruncado =
        productoNombre.length > 30
          ? productoNombre.substring(0, 27) + "..."
          : productoNombre;
      page.drawText(productoTruncado, {
        x: 95,
        y: yPosition,
        size: 8,
        font: font,
      });

      page.drawText(detalle.cantidad.toFixed(3), {
        x: 310,
        y: yPosition,
        size: 8,
        font: font,
      });

      page.drawText(`$ ${detalle.precioUnitarioFinal.toFixed(2)}`, {
        x: 375,
        y: yPosition,
        size: 8,
        font: font,
      });

      const subtotal = detalle.cantidad * detalle.precioUnitarioFinal;
      page.drawText(`$ ${subtotal.toFixed(2)}`, {
        x: 460,
        y: yPosition,
        size: 8,
        font: font,
      });

      yPosition -= 15;
    });

    yPosition -= 10;
  }

  // Costos de exportación (opcional)
  if (incluirCostos && costos.length > 0) {
    if (yPosition < 200) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText("COSTOS DE EXPORTACIÓN", {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
    });
    yPosition -= 20;

    // Encabezados
    page.drawRectangle({
      x: 45,
      y: yPosition - 5,
      width: width - 90,
      height: 20,
      color: rgb(0.9, 0.49, 0.13),
    });

    page.drawText("Concepto", {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Monto Estimado", {
      x: 300,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Responsable", {
      x: 420,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    yPosition -= 20;

    // Filas
    costos.forEach((costo, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }

      const rowColor = index % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
      page.drawRectangle({
        x: 45,
        y: yPosition - 5,
        width: width - 90,
        height: 15,
        color: rowColor,
      });

      page.drawText(costo.concepto || "N/A", {
        x: 50,
        y: yPosition,
        size: 8,
        font: font,
      });

      page.drawText(
        `${costo.moneda?.codigo || ""} ${costo.montoEstimado.toFixed(2)}`,
        {
          x: 310,
          y: yPosition,
          size: 8,
          font: font,
        }
      );

      page.drawText(costo.responsableSegunIncoterm || "N/A", {
        x: 430,
        y: yPosition,
        size: 8,
        font: font,
      });

      yPosition -= 15;
    });

    yPosition -= 10;
  }

  // Totales
  if (yPosition < 150) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 50;
  }

  const subtotal = detalles.reduce(
    (sum, d) => sum + d.cantidad * d.precioUnitarioFinal,
    0
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  yPosition = await dibujaTotalesYFirmaPDFCV(
    page,
    { subtotal, igv, total, moneda: cotizacion.moneda?.codigo || "USD" },
    yPosition,
    width,
    height,
    font,
    fontBold
  );

  // Observaciones
  if (incluirObservaciones && cotizacion.observaciones) {
    yPosition -= 20;
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText("OBSERVACIONES:", {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    yPosition -= 15;

    const observacionesLineas = splitTextToLines(
      cotizacion.observaciones,
      width - 100,
      8,
      font
    );
    observacionesLineas.forEach((linea) => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      page.drawText(linea, {
        x: 50,
        y: yPosition,
        size: 8,
        font: font,
      });
      yPosition -= 12;
    });
  }

  // Notas adicionales
  if (notasAdicionales.trim()) {
    yPosition -= 20;
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText("NOTAS ADICIONALES:", {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    yPosition -= 15;

    const notasLineas = splitTextToLines(
      notasAdicionales,
      width - 100,
      8,
      font
    );
    notasLineas.forEach((linea) => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      page.drawText(linea, {
        x: 50,
        y: yPosition,
        size: 8,
        font: font,
      });
      yPosition -= 12;
    });
  }

  // Términos y condiciones
  if (incluirTerminos) {
    yPosition -= 20;
    if (yPosition < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText("TÉRMINOS Y CONDICIONES:", {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    yPosition -= 15;

    const terminos = [
      "1. Los precios están expresados en la moneda indicada y son válidos por el período especificado.",
      "2. Los términos de entrega se rigen según el Incoterm indicado.",
      "3. La forma de pago es según lo acordado en la presente cotización.",
      "4. Esta cotización no constituye un compromiso de venta hasta su aceptación formal.",
    ];

    terminos.forEach((termino) => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      const terminoLineas = splitTextToLines(termino, width - 100, 7, font);
      terminoLineas.forEach((linea) => {
        page.drawText(linea, {
          x: 50,
          y: yPosition,
          size: 7,
          font: font,
        });
        yPosition -= 10;
      });
    });
  }

  // Generar bytes del PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Divide texto en líneas según ancho máximo
 */
function splitTextToLines(text, maxWidth, fontSize, font) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}