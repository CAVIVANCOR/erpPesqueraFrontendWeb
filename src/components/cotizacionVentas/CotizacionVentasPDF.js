// src/components/cotizacionVentas/CotizacionVentasPDF.js
// Generador de PDF para cotizaciones de ventas - Versión modularizada y refactorizada
// Patrón profesional siguiendo RequerimientoCompra
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFCV } from "./dibujaEncabezadoPDFCV";
import { dibujaTotalesYFirmaPDFCV } from "./dibujaTotalesYFirmaPDFCV";
import { getTranslation } from "./translations";

/**
 * Genera un PDF de la cotización de ventas y lo sube al servidor
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Array} detalles - Detalles de productos
 * @param {Object} empresa - Datos de la empresa
 * @param {string} idioma - Idioma del PDF (por defecto "en")
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFCotizacionVentas(
  cotizacion,
  detalles,
  empresa,
  idioma = "en",
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFCotizacionVentas(
      cotizacion,
      detalles,
      empresa,
      idioma,
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData - El backend generará el nombre automáticamente
    const timestamp = Date.now();
    const formData = new FormData();
    formData.append("files", blob, `cotizacion-${cotizacion.id}-${timestamp}.pdf`);

    // 4. Crear FormData (igual que Caso 1)
    formData.append("moduleName", "cotizacion-ventas");
    formData.append("entityId", cotizacion.id);

    // 5. Subir al servidor usando endpoint estandarizado
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

/**
 * Genera el PDF de la cotización de ventas
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Array} detalles - Detalles de productos
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFCotizacionVentas(
  cotizacion,
  detalles,
  empresa,
  idioma = "en",
) {
  // Función helper para obtener traducciones
  const t = (key) => getTranslation(idioma, key);
  // Funciones de formateo
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Crear nuevo documento PDF en orientación horizontal
  const pdfDoc = await PDFDocument.create();
  const pages = []; // Array para trackear todas las páginas
  let page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
  pages.push(page);
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 13;

  // Preparar datos del encabezado para las columnas
  const datosIzquierda = [
    [t("documentDate"), formatearFecha(cotizacion.fechaDocumento)],
    [t("expirationDate"), formatearFecha(cotizacion.fechaVencimiento)],
    [t("customer"), cotizacion.cliente?.razonSocial || "-"],
    [t("productType"), cotizacion.tipoProducto?.nombre || "-"],
    [t("productState"), cotizacion.tipoEstadoProducto?.nombre || "-"],
    [t("productDestination"), cotizacion.destinoProducto?.nombre || "-"],
    [t("paymentMethod"), cotizacion.formaPago?.nombre || "-"],
    [
      t("incoterm"),
      cotizacion.incoterms
        ? `${cotizacion.incoterms.codigo} - ${cotizacion.incoterms.nombre}`
        : "-",
    ],
  ];

  const datosDerecha = [
    [
      t("currency"),
      cotizacion.moneda?.descripcion || cotizacion.moneda?.nombre || "USD",
    ],
    [
      t("exchangeRate"),
      cotizacion.tipoCambio
        ? `S/ ${Number(cotizacion.tipoCambio).toFixed(2)}`
        : "-",
    ],
    [t("departureDate"), formatearFecha(cotizacion.fechaZarpeEstimada)],
    [t("loadingPort"), cotizacion.puertoCarga?.nombre || "-"],
    [t("arrivalDate"), formatearFecha(cotizacion.fechaArriboEstimada)],
    [t("unloadingPort"), cotizacion.puertoDescarga?.nombre || "-"],
    [t("destinationCountry"), cotizacion.paisDestino?.nombre || "-"],
    [t("transitDays"), cotizacion.diasTransito || "-"],
  ];

  // DIBUJAR ENCABEZADO COMPLETO usando función modular
  yPosition = await dibujaEncabezadoPDFCV({
    pag: page,
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
    idioma,
  });

  // TABLA DE DETALLES
  yPosition -= 8;

  // Encabezados de tabla usando todo el ancho disponible (768px)
  const colWidths = [25, 220, 50, 110, 60, 60, 48, 50, 35, 50, 60];
  const headers = [
    t("item"),
    t("product"),
    t("quantity"),
    t("unit"),
    t("netWeight"),
    t("productionLot"),
    t("productionDate"),
    t("expiryDate"),
    t("temperature"),
    t("unitPrice"),
    t("totalPrice"),
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableStartX = margin;

  // Función para dibujar encabezado de tabla (reutilizable en nuevas páginas)
  const dibujarEncabezadoTabla = async (
    pag,
    yPos,
    incluirEncabezadoCompleto = false,
  ) => {
    // Si es una página nueva (no la primera), dibujar encabezado completo del documento
    if (incluirEncabezadoCompleto) {
      yPos = await dibujaEncabezadoPDFCV({
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
        idioma,
      });
      yPos -= 8; // Espacio antes de la tabla
    }

    // Título
    pag.drawText(t("productDetails"), {
      x: margin,
      y: yPos,
      size: 11,
      font: fontBold,
    });

    yPos -= 20;

    // Fondo de encabezados
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Línea superior de la tabla
    pag.drawLine({
      start: { x: tableStartX, y: yPos + 16 },
      end: { x: tableStartX + tableWidth, y: yPos + 16 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Dibujar encabezados con alineación
    let xPos = margin;
    headers.forEach((header, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      // Alinear números a la derecha, texto a la izquierda
      let textX = colX + 3;
      if (i === 0 || i === 2 || i === 4 || i === 9 || i === 10) {
        const textWidth = fontBold.widthOfTextAtSize(header, 9);
        textX = colX + colWidth - textWidth - 3;
      }

      pag.drawText(header, {
        x: textX,
        y: yPos,
        size: 9,
        font: fontBold,
      });
      xPos += colWidth;
    });

    // Líneas verticales de encabezado
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 2 },
        end: { x: lineX, y: yPos + 16 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 18;
  };

  // Dibujar encabezado inicial (sin encabezado completo porque ya se dibujó arriba)
  yPosition = await dibujarEncabezadoTabla(page, yPosition, false);

  // Calcular subtotal
  let subtotalTotal = 0;

  // Dibujar filas de productos (usar for loop para permitir await)
  let xPos;
  for (let index = 0; index < detalles.length; index++) {
    const detalle = detalles[index];

    // Verificar si hay espacio para la fila (umbral de 120px para dejar espacio a totales)
    if (yPosition < 120) {
      // Nueva página si no hay espacio
      page = pdfDoc.addPage([width, height]);
      pages.push(page);
      yPosition = height - 50; // Posición inicial
      // Redibujar encabezado completo + tabla en la nueva página
      yPosition = await dibujarEncabezadoTabla(page, yPosition, true);
    }

    const rowY = yPosition;
    xPos = tableStartX;

    // Nombre completo del producto - usar descripcionArmada que incluye toda la info
    const nombreProducto =
      detalle.producto?.descripcionArmada ||
      detalle.producto?.descripcionBase ||
      detalle.producto?.descripcion ||
      detalle.producto?.nombre ||
      "PRODUCTO";

    // Calcular altura necesaria para la fila
    const rowHeight = 18;

    const precioUnitario = Number(detalle.precioUnitarioFinal) || 0;
    const cantidad = Number(detalle.cantidad) || 0;
    const pesoNeto = Number(detalle.pesoNeto) || 0;
    const subtotal = cantidad * precioUnitario;

    const rowData = [
      String(detalle.item || index + 1),
      nombreProducto.length > 50
        ? nombreProducto.substring(0, 47) + "..."
        : nombreProducto,
      String(Math.round(cantidad)),
      detalle.producto?.unidadMedida?.nombre || "-",
      String(pesoNeto.toFixed(2)),
      detalle.loteProduccion || "-",
      formatearFecha(detalle.fechaProduccion),
      formatearFecha(detalle.fechaVencimiento),
      detalle.temperaturaAlmacenamiento || "-",
      formatearNumero(precioUnitario),
      formatearNumero(subtotal),
    ];

    // Dibujar datos con alineación correcta
    rowData.forEach((data, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      // Alinear números a la derecha, texto a la izquierda
      let textX = colX + 3;
      let textY = yPosition;

      // Columnas numéricas y fechas: alinear a la derecha
      // i=0: #, i=2: Cant., i=4: Peso Neto, i=6: F.Prod., i=7: F.Venc., i=9: V.V.Unit., i=10: V.V.Total
      if (
        i === 0 ||
        i === 2 ||
        i === 4 ||
        i === 6 ||
        i === 7 ||
        i === 9 ||
        i === 10
      ) {
        const textWidth = fontNormal.widthOfTextAtSize(data, 7);
        textX = colX + colWidth - textWidth - 3;
      }

      page.drawText(data, {
        x: textX,
        y: textY,
        size: 7,
        font: fontNormal,
      });
      xPos += colWidth;
    });

    // Acumular subtotal
    subtotalTotal += subtotal;

    // Líneas verticales de la fila
    let lineX = tableStartX;
    const lineStartY = rowY + 13;
    const lineEndY = rowY - rowHeight + 15;

    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: lineStartY },
        end: { x: lineX, y: lineEndY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    // Línea horizontal inferior de la fila
    page.drawLine({
      start: { x: tableStartX, y: lineEndY },
      end: { x: tableStartX + tableWidth, y: lineEndY },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= rowHeight;
  }

  // NO verificar espacio para totales - siempre dibujar en la misma página
  // Los totales y firmas están en posición fija (Y=180 y Y=90) y no dependen de yPosition

  // DIBUJAR TOTALES Y FIRMAS usando función modular
  dibujaTotalesYFirmaPDFCV({
    page,
    cotizacion,
    subtotal: subtotalTotal,
    formatearNumero,
    width,
    margin,
    fontBold,
    fontNormal,
    idioma,
  });

  // AGREGAR NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA
  const totalPages = pages.length;
  pages.forEach((p, index) => {
    const pageNumber = index + 1;
    const pageText = `${t("page")} ${pageNumber} ${t("of")} ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);

    // Número de página en esquina superior derecha
    p.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 30,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Pie de página en todas las páginas
    p.drawLine({
      start: { x: margin, y: 50 },
      end: { x: width - margin, y: 50 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    p.drawText(
      `${t("generated")} ${new Date().toLocaleString("es-PE")} | ${t("system")}`,
      {
        x: margin,
        y: 38,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      },
    );
  });

  // Generar bytes del PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
