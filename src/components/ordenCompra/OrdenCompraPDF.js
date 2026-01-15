// src/components/ordenCompra/OrdenCompraPDF.js
// Generador de PDF para órdenes de compra - Versión modularizada y refactorizada
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFOC } from "./dibujaEncabezadoPDFOC";
import { dibujaTotalesYFirmaPDFOC } from "./dibujaTotalesYFirmaPDFOC";

/**
 * Genera un PDF de la orden de compra y lo sube al servidor
 * @param {Object} ordenCompra - Datos de la orden de compra
 * @param {Array} detalles - Detalles de la orden
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFOrdenCompra(
  ordenCompra,
  detalles,
  empresa
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFOrdenCompra(
      ordenCompra,
      detalles,
      empresa
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData para subir
    const formData = new FormData();
    const nombreArchivo = `orden-compra-${ordenCompra.id}.pdf`;
    formData.append("pdf", blob, nombreArchivo);
    formData.append("ordenCompraId", ordenCompra.id);

    // 4. Subir al servidor
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/orden-compra/upload-pdf`,
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
      urlPdf: resultado.urlOrdenCompraPdf || resultado.urlPdf,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF de la orden de compra
 * @param {Object} ordenCompra - Datos de la orden
 * @param {Array} detalles - Detalles de la orden
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
export async function generarPDFOrdenCompra(
  ordenCompra,
  detalles,
  empresa
) {
  console.log('📄 [OrdenCompraPDF] ordenCompra recibida:', ordenCompra);
  console.log('📄 [OrdenCompraPDF] ordenCompra.solicitante:', ordenCompra.solicitante);
  console.log('📄 [OrdenCompraPDF] ordenCompra.aprobadoPor:', ordenCompra.aprobadoPor);
  console.log('📄 [OrdenCompraPDF] ordenCompra.centroCosto:', ordenCompra.centroCosto);
  console.log('📄 [OrdenCompraPDF] ordenCompra.proveedor:', ordenCompra.proveedor);
  
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
  
  // ========================================
  // PREPARAR DATOS PARA 3 COLUMNAS
  // ========================================
  
  // COLUMNA 1: Datos principales (sin espacios en blanco)
  const datosColumna1 = [
    ["Fecha Documento:", formatearFecha(ordenCompra.fechaDocumento)],
    ["Fecha Entrega:", formatearFecha(ordenCompra.fechaEntrega)],
    ["Centro de Costo:", ordenCompra.centroCosto?.nombre || "-"],
    ["Proveedor:", ordenCompra.proveedor?.razonSocial || "-"],
    [
      ordenCompra.proveedor?.tipoDocumento?.codigo || "DOC:",
      ordenCompra.proveedor?.numeroDocumento || "-"
    ],
  ];

  // COLUMNA 2: Datos financieros
  const datosColumna2 = [
    ["Forma de Pago:", ordenCompra.formaPago?.nombre || "-"],
    ["Moneda:", ordenCompra.moneda?.codigoSunat || "-"],
    [
      "Tipo de Cambio:",
      ordenCompra.tipoCambio
        ? `S/ ${Number(ordenCompra.tipoCambio).toFixed(4)}`
        : "-",
    ],
    [
      "% IGV:",
      ordenCompra.porcentajeIGV
        ? `${Number(ordenCompra.porcentajeIGV).toFixed(2)}%`
        : "0.00%",
    ],
  ];

  // COLUMNA 3: Datos adicionales dinámicos
  const datosColumna3 = [];
  console.log('🔍 [OrdenCompraPDF] ordenCompra.datosAdicionales:', ordenCompra.datosAdicionales);
  
  if (ordenCompra.datosAdicionales && ordenCompra.datosAdicionales.length > 0) {
    ordenCompra.datosAdicionales.forEach((dato) => {
      console.log('🔍 [OrdenCompraPDF] Procesando dato adicional:', {
        nombreDato: dato.nombreDato,
        esDocumento: dato.esDocumento,
        imprimirEnOC: dato.imprimirEnOC,
        urlDocumento: dato.urlDocumento,
        valorDato: dato.valorDato
      });
      
      // Construir label
      let label = dato.nombreDato;
      if (dato.esDocumento) {
        label += " (Adjunto)";
      }
      label += ":";
      
      // Obtener value
      const value = dato.valorDato || "-";
      
      datosColumna3.push([label, value]);
    });
  }

  console.log('📄 [OrdenCompraPDF] datosColumna1:', datosColumna1);
  console.log('📄 [OrdenCompraPDF] datosColumna2:', datosColumna2);
  console.log('📄 [OrdenCompraPDF] datosColumna3:', datosColumna3);
  
  // DIBUJAR ENCABEZADO COMPLETO usando función modular con 3 columnas
  yPosition = await dibujaEncabezadoPDFOC({
    pag: page,
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
  });

  // TABLA DE DETALLES
  yPosition -= 8;

  // Encabezados de tabla con anchos ajustados
  const colWidths = [25, 340, 40, 180, 70, 80];
  const headers = [
    "#",
    "Producto",
    "Cant.",
    "Unidad/Empaque",
    "P. Unitario",
    "Subtotal",
  ];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableStartX = margin;

  // Función para dibujar encabezado de tabla (reutilizable en nuevas páginas)
  const dibujarEncabezadoTabla = async (pag, yPos, incluirEncabezadoCompleto = false) => {
    // Si es una página nueva (no la primera), dibujar encabezado completo del documento
    if (incluirEncabezadoCompleto) {
      yPos = await dibujaEncabezadoPDFOC({
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
      });
      yPos -= 8; // Espacio antes de la tabla
    }

    // Título
    pag.drawText("DETALLE DE PRODUCTOS", {
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
      if (i === 0 || i === 2 || i === 4 || i === 5) {
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

  // Calcular totales
  let subtotalGeneral = 0;

  // Dibujar filas de productos (usar for loop para permitir await)
  let xPos;
  for (let index = 0; index < detalles.length; index++) {
    const detalle = detalles[index];
    
    // Verificar si hay espacio para la fila (umbral de 180px)
    if (yPosition < 180) {
      // Nueva página si no hay espacio
      page = pdfDoc.addPage([width, height]);
      pages.push(page);
      yPosition = height - 50; // Posición inicial
      // Redibujar encabezado completo + tabla en la nueva página
      yPosition = await dibujarEncabezadoTabla(page, yPosition, true);
    }

    const rowY = yPosition;
    xPos = tableStartX;

    // Nombre completo del producto
    const nombreProducto =
      detalle.producto?.descripcionArmada ||
      detalle.producto?.descripcion ||
      detalle.producto?.nombre ||
      "PRODUCTO";

    // Calcular altura necesaria para la fila (producto + observaciones)
    const observaciones = detalle.observaciones || "";
    const maxCharsPerLine = 60; // Caracteres máximos por línea en la columna de producto
    const observacionesLines = observaciones ? Math.ceil(observaciones.length / maxCharsPerLine) : 0;
    const rowHeight = 18 + (observacionesLines * 10); // Altura base + líneas de observaciones + padding

    const subtotalItem = Number(detalle.cantidad || 0) * Number(detalle.precioUnitario || 0);

    const rowData = [
      String(index + 1),
      nombreProducto,
      String(detalle.cantidad || 0),
      detalle.producto?.unidadMedida?.nombre || "-",
      `S/ ${formatearNumero(Number(detalle.precioUnitario || 0))}`,
      `S/ ${formatearNumero(subtotalItem)}`,
    ];

    // Dibujar datos con alineación correcta
    rowData.forEach((data, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];

      // Alinear números a la derecha, texto a la izquierda
      let textX = colX + 3;
      let textY = yPosition;
      
      if (i === 0 || i === 2 || i === 4 || i === 5) {
        // Columnas numéricas: alinear a la derecha
        const textWidth = fontNormal.widthOfTextAtSize(data, 8);
        textX = colX + colWidth - textWidth - 3;
      }

      page.drawText(data, {
        x: textX,
        y: textY,
        size: 8,
        font: fontNormal,
      });
      xPos += colWidth;
    });

    // Dibujar observaciones debajo del producto si existen
    if (observaciones) {
      let yObs = yPosition - 10;
      const obsX = tableStartX + colWidths[0] + 3; // Posición X de la columna Producto
      const obsMaxWidth = colWidths[1] - 6; // Ancho máximo para observaciones
      
      // Dividir observaciones en líneas
      const words = observaciones.split(' ');
      let currentLine = '';
      
      words.forEach((word, idx) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = fontNormal.widthOfTextAtSize(testLine, 7);
        
        if (testWidth > obsMaxWidth && currentLine) {
          // Dibujar línea actual
          page.drawText(currentLine, {
            x: obsX,
            y: yObs,
            size: 7,
            font: fontNormal,
            color: rgb(0.3, 0.3, 0.3),
          });
          currentLine = word;
          yObs -= 10;
        } else {
          currentLine = testLine;
        }
        
        // Última palabra
        if (idx === words.length - 1 && currentLine) {
          page.drawText(currentLine, {
            x: obsX,
            y: yObs,
            size: 7,
            font: fontNormal,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      });
    }

    // Acumular subtotal
    subtotalGeneral += subtotalItem;

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

  // Verificar si hay espacio para totales y firmas (necesitan ~200px)
  // Si no hay espacio, crear nueva página
  if (yPosition < 250) {
    page = pdfDoc.addPage([width, height]);
    pages.push(page);
  }

  // DIBUJAR TOTALES Y FIRMAS usando función modular
  dibujaTotalesYFirmaPDFOC({
    page,
    ordenCompra,
    subtotalGeneral,
    formatearNumero,
    width,
    margin,
    fontBold,
    fontNormal,
  });

  // AGREGAR NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA
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

    // Pie de página en todas las páginas
    p.drawLine({
      start: { x: margin, y: 50 },
      end: { x: width - margin, y: 50 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    p.drawText(
      `Generado: ${new Date().toLocaleString("es-PE")} | Sistema ERP Megui`,
      {
        x: margin,
        y: 38,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  });

  // ========================================
  // AGREGAR DOCUMENTOS ADJUNTOS COMO PÁGINAS ADICIONALES
  // ========================================
  console.log('🔍 [OrdenCompraPDF] Iniciando proceso de adjuntar documentos...');
  console.log('🔍 [OrdenCompraPDF] ordenCompra.datosAdicionales:', ordenCompra.datosAdicionales);
  
  if (ordenCompra.datosAdicionales && ordenCompra.datosAdicionales.length > 0) {
    console.log(`🔍 [OrdenCompraPDF] Total de datos adicionales: ${ordenCompra.datosAdicionales.length}`);
    
    for (const dato of ordenCompra.datosAdicionales) {
      console.log('🔍 [OrdenCompraPDF] Evaluando dato:', {
        nombreDato: dato.nombreDato,
        esDocumento: dato.esDocumento,
        urlDocumento: dato.urlDocumento,
        imprimirEnOC: dato.imprimirEnOC
      });
      
      if (dato.esDocumento && dato.urlDocumento) {
        console.log(`✅ [OrdenCompraPDF] Dato ES documento y TIENE URL: ${dato.nombreDato}`);
        try {
          // Construir URL siguiendo el patrón de pdfUtils.js
          const rutaArchivo = dato.urlDocumento.replace("/uploads/datos-adicionales-orden-compra/", "");
          const docUrl = `${import.meta.env.VITE_API_URL}/det-datos-adicionales-orden-compra/archivo/${rutaArchivo}`;
          console.log(`📎 [OrdenCompraPDF] Cargando documento adjunto: ${docUrl}`);
          
          // Obtener token de autenticación
          const token = useAuthStore.getState().token;
          
          // Descargar el documento con autenticación
          const docResponse = await fetch(docUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (docResponse.ok) {
            const docBytes = await docResponse.arrayBuffer();
            
            // Verificar si es un PDF
            if (dato.urlDocumento.toLowerCase().endsWith('.pdf')) {
              // Cargar el PDF adjunto
              const adjuntoPdf = await PDFDocument.load(docBytes);
              
              // Copiar todas las páginas del PDF adjunto al documento principal
              const copiedPages = await pdfDoc.copyPages(adjuntoPdf, adjuntoPdf.getPageIndices());
              copiedPages.forEach((copiedPage) => {
                pdfDoc.addPage(copiedPage);
                pages.push(copiedPage);
              });
              
              console.log(`✅ [OrdenCompraPDF] PDF adjunto agregado: ${dato.nombreDato} (${copiedPages.length} páginas)`);
            } else {
              // Si es una imagen, agregarla como nueva página
              let adjuntoImage;
              const extension = dato.urlDocumento.toLowerCase();
              
              if (extension.endsWith('.png')) {
                adjuntoImage = await pdfDoc.embedPng(docBytes);
              } else if (extension.endsWith('.jpg') || extension.endsWith('.jpeg')) {
                adjuntoImage = await pdfDoc.embedJpg(docBytes);
              }
              
              if (adjuntoImage) {
                // Crear nueva página para la imagen
                const imagePage = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
                pages.push(imagePage);
                
                const { width: pageWidth, height: pageHeight } = imagePage.getSize();
                const imageDims = adjuntoImage.size();
                
                // Calcular dimensiones para ajustar la imagen a la página
                const maxWidth = pageWidth - (margin * 2);
                const maxHeight = pageHeight - (margin * 2);
                const aspectRatio = imageDims.width / imageDims.height;
                
                let finalWidth = maxWidth;
                let finalHeight = maxWidth / aspectRatio;
                
                if (finalHeight > maxHeight) {
                  finalHeight = maxHeight;
                  finalWidth = maxHeight * aspectRatio;
                }
                
                // Centrar la imagen
                const x = (pageWidth - finalWidth) / 2;
                const y = (pageHeight - finalHeight) / 2;
                
                imagePage.drawImage(adjuntoImage, {
                  x,
                  y,
                  width: finalWidth,
                  height: finalHeight,
                });
                
                // Agregar título de la imagen
                imagePage.drawText(`Adjunto: ${dato.nombreDato}`, {
                  x: margin,
                  y: pageHeight - margin,
                  size: 12,
                  font: fontBold,
                });
                
                console.log(`✅ [OrdenCompraPDF] Imagen adjunta agregada: ${dato.nombreDato}`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ [OrdenCompraPDF] Error al cargar documento adjunto ${dato.nombreDato}:`, error);
          // Continuar con los demás documentos aunque uno falle
        }
      }
    }
  }

  return await pdfDoc.save();
}