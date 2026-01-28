// src/components/movimientoAlmacen/MovimientoAlmacenPDF.js
// Generador de PDF para movimientos de almacén - Versión modularizada y refactorizada
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFMA } from "./dibujaEncabezadoPDFMA";
import { dibujaFirmasPDFMA } from "./dibujaFirmasPDFMA";

/**
 * Genera un PDF del movimiento de almacén y lo sube al servidor
 * @param {Object} movimiento - Datos del movimiento de almacén
 * @param {Array} detalles - Detalles del movimiento
 * @param {Object} empresa - Datos de la empresa
 * @param {Boolean} incluirCostos - Si debe incluir costos en el PDF
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFMovimientoAlmacen(
  movimiento,
  detalles,
  empresa,
  incluirCostos = false
) {
  try {
    console.log('📤 Generando PDF con:', { movimientoId: movimiento.id, incluirCostos });
    
    // 1. Generar el PDF
    const pdfBytes = await generarPDFMovimientoAlmacen(
      movimiento,
      detalles,
      empresa,
      incluirCostos
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData para subir
    const formData = new FormData();
    const sufijo = incluirCostos ? "-costos" : "";
    const nombreArchivo = `movimiento-almacen${sufijo}-${movimiento.id}.pdf`;
    formData.append("pdf", blob, nombreArchivo);
    formData.append("movimientoId", String(movimiento.id));
    formData.append("incluirCostos", String(incluirCostos));

    console.log('📤 Enviando al backend:', {
      movimientoId: String(movimiento.id),
      incluirCostos: String(incluirCostos),
      nombreArchivo
    });

    // 4. Subir al servidor
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/movimiento-almacen/upload-pdf`,
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
      console.error('❌ Error del backend:', errorData);
      throw new Error(errorData.error || errorData.mensaje || "Error al subir el PDF");
    }

    const resultado = await response.json();
    console.log('✅ PDF subido exitosamente:', resultado);

    return {
      success: true,
      urlPdf: incluirCostos
        ? resultado.urlMovAlmacenConCostosPdf || resultado.urlPdf
        : resultado.urlMovAlmacenPdf || resultado.urlPdf,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF del movimiento de almacén
 * @param {Object} movimiento - Datos del movimiento
 * @param {Array} detalles - Detalles del movimiento
 * @param {Object} empresa - Datos de la empresa
 * @param {Boolean} incluirCostos - Si debe incluir costos en el PDF
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFMovimientoAlmacen(
  movimiento,
  detalles,
  empresa,
  incluirCostos = false
) {
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

  // Preparar datos del movimiento
  const datosMovimiento = [
    ["Fecha Documento:", formatearFecha(movimiento.fechaDocumento)],
    [
      "Concepto:",
      movimiento.conceptoMovAlmacen?.descripcionArmada || "-",
    ],
    ["Mercadería:", movimiento.esCustodia ? "CUSTODIA" : "PROPIA"],
  ];

  // Almacenes
  if (movimiento.conceptoMovAlmacen?.almacenOrigen) {
    const nombreOrigen =
      movimiento.conceptoMovAlmacen.almacenOrigen.nombre || "-";
    datosMovimiento.push(["Almacén Origen:", nombreOrigen]);
  }
  if (movimiento.conceptoMovAlmacen?.almacenDestino) {
    const nombreDestino =
      movimiento.conceptoMovAlmacen.almacenDestino.nombre || "-";
    datosMovimiento.push(["Almacén Destino:", nombreDestino]);
  }

  // Entidad Comercial
  if (movimiento.entidadComercial) {
    datosMovimiento.push([
      "Entidad Comercial:",
      movimiento.entidadComercial.razonSocial,
    ]);
  }

  // Direcciones
  if (movimiento.dirOrigen) {
    datosMovimiento.push([
      "Dirección Origen:",
      movimiento.dirOrigen.direccionArmada ||
        movimiento.dirOrigen.direccion ||
        "-",
    ]);
  }
  if (movimiento.dirDestino) {
    datosMovimiento.push([
      "Dirección Destino:",
      movimiento.dirDestino.direccionArmada ||
        movimiento.dirDestino.direccion ||
        "-",
    ]);
  }

  // Guía SUNAT
  if (movimiento.numGuiaSunat) {
    datosMovimiento.push(["N° Guía SUNAT:", movimiento.numGuiaSunat]);
    if (movimiento.fechaGuiaSunat) {
      datosMovimiento.push([
        "Fecha Guía SUNAT:",
        formatearFecha(movimiento.fechaGuiaSunat),
      ]);
    }
  }

  // Transporte
  if (movimiento.transportista) {
    datosMovimiento.push([
      "Transportista:",
      movimiento.transportista.razonSocial || "-",
    ]);
  }
  if (movimiento.vehiculo) {
    datosMovimiento.push([
      "Vehículo:",
      `${movimiento.vehiculo.placa || ""} - ${
        movimiento.vehiculo.marca || ""
      } ${movimiento.vehiculo.modelo || ""}`.trim(),
    ]);
  }

  // Agencia de Envío
  if (movimiento.agenciaEnvio) {
    datosMovimiento.push([
      "Agencia Envío:",
      movimiento.agenciaEnvio.razonSocial || "-",
    ]);
    if (movimiento.dirAgenciaEnvio) {
      datosMovimiento.push([
        "Dir. Agencia:",
        movimiento.dirAgenciaEnvio.direccionArmada ||
          movimiento.dirAgenciaEnvio.direccion ||
          "-",
      ]);
    }
  }

  // Observaciones
  if (movimiento.observaciones) {
    datosMovimiento.push(["Observaciones:", movimiento.observaciones]);
  }

  // Dibujar encabezado inicial (incluye datos del movimiento)
  yPosition = await dibujaEncabezadoPDFMA({
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
    incluirDatos: true,
  });

  // TABLA DE DETALLES
  yPosition -= 8;

  // Encabezados de tabla - Con o sin costos según parámetro
  const colWidths = incluirCostos
    ? [25, 140, 45, 65, 60, 55, 70, 60, 60, 60, 60, 60] // Con Costo Unit. y Costo Total
    : [25, 165, 45, 75, 50, 70, 85, 70, 70, 65, 70]; // Sin Costos

  const headers = incluirCostos
    ? [
        "#",
        "Producto",
        "Cant.",
        "U.M.",
        "Lote",
        "Contenedor",
        "Costo Unit.",
        "Costo Total",
        "Est.Merc",
        "Est.Cal",
        "F.Prod",
        "F.Venc",
      ]
    : [
        "#",
        "Producto",
        "Cant.",
        "U.M.",
        "Peso",
        "Lote",
        "Contenedor",
        "Est.Merc",
        "Est.Cal",
        "F.Prod",
        "F.Venc",
      ];

  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableStartX = margin;
  const tituloTabla = incluirCostos
    ? "DETALLES DEL MOVIMIENTO (CON COSTOS)"
    : "DETALLES DEL MOVIMIENTO";

  // Función para dibujar encabezado de tabla (reutilizable en nuevas páginas)
  const dibujarEncabezadoTabla = (pag, yPos) => {
    // Título
    pag.drawText(tituloTabla, {
      x: margin,
      y: yPos,
      size: 11,
      font: fontBold,
    });

    yPos -= 20;

    // Fondo de encabezados
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 5,
      width: tableWidth,
      height: 18,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Dibujar encabezados
    let xPos = margin;
    headers.forEach((header, i) => {
      pag.drawText(header, {
        x: xPos + 2,
        y: yPos,
        size: 7,
        font: fontBold,
      });
      xPos += colWidths[i];
    });

    return yPos - 18;
  };

  // Dibujar encabezado inicial
  yPosition = dibujarEncabezadoTabla(page, yPosition);

  // Dibujar filas de detalles
  let xPos;
  for (let index = 0; index < detalles.length; index++) {
    const detalle = detalles[index];

    // Verificar si hay espacio para la fila
    if (yPosition < 180) {
      // Nueva página si no hay espacio
      page = pdfDoc.addPage([841.89, 595.28]);
      pages.push(page);
      // Dibujar encabezado completo del documento en la nueva página (CON datos del movimiento)
      yPosition = await dibujaEncabezadoPDFMA({
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
        incluirDatos: true,
      });
      // Redibujar encabezado de tabla en la nueva página
      yPosition = dibujarEncabezadoTabla(page, yPosition);
    }

    xPos = margin;
    const cantidad = Number(detalle.cantidad) || 0;
    const peso = Number(detalle.peso) || 0;
    const costoUnitario = Number(detalle.costoUnitario) || 0;
    const costoTotal = cantidad * costoUnitario;

    // Extraer descripción del producto
    const productoDesc =
      detalle.producto?.descripcionArmada ||
      detalle.producto?.descripcion ||
      detalle.producto?.nombre ||
      "PRODUCTO SIN DESCRIPCIÓN";

    // Extraer unidad de medida
    const unidadMedida =
      detalle.producto?.unidadMedida?.abreviatura ||
      detalle.producto?.unidadMedida?.simbolo ||
      detalle.unidadMedida?.abreviatura ||
      "-";

    // Construir rowData según si incluye costos o no
    const rowData = incluirCostos
      ? [
          `${index + 1}`,
          productoDesc.substring(0, 26),
          formatearNumero(cantidad),
          unidadMedida.substring(0, 11),
          detalle.lote?.substring(0, 10) || "-",
          detalle.nroContenedor?.substring(0, 12) ||
            detalle.numContenedor?.substring(0, 12) ||
            "-",
          formatearNumero(costoUnitario),
          formatearNumero(costoTotal),
          detalle.estadoMercaderia?.descripcion?.substring(0, 10) || "-",
          detalle.estadoCalidad?.descripcion?.substring(0, 10) || "-",
          formatearFecha(detalle.fechaProduccion),
          formatearFecha(detalle.fechaVencimiento),
        ]
      : [
          `${index + 1}`,
          productoDesc.substring(0, 30),
          formatearNumero(cantidad),
          unidadMedida.substring(0, 13),
          formatearNumero(peso),
          detalle.lote?.substring(0, 12) || "-",
          detalle.nroContenedor?.substring(0, 15) ||
            detalle.numContenedor?.substring(0, 15) ||
            "-",
          detalle.estadoMercaderia?.descripcion?.substring(0, 12) || "-",
          detalle.estadoCalidad?.descripcion?.substring(0, 12) || "-",
          formatearFecha(detalle.fechaProduccion),
          formatearFecha(detalle.fechaVencimiento),
        ];

    // Alternar color de fondo
    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: yPosition - 2,
        width: tableWidth,
        height: 12,
        color: rgb(0.97, 0.97, 0.97),
      });
    }

    rowData.forEach((data, i) => {
      const texto = String(data);
      const textoWidth = fontNormal.widthOfTextAtSize(texto, 6);

      // Alinear a la derecha: Cantidad, Peso, Costo Unitario y Costo Total
      let xTexto = xPos + 2;
      if (i === 2) {
        // Cantidad - siempre alineada a la derecha
        xTexto = xPos + colWidths[i] - textoWidth - 2;
      } else if (!incluirCostos && i === 4) {
        // Peso - solo cuando no incluye costos
        xTexto = xPos + colWidths[i] - textoWidth - 2;
      } else if (incluirCostos && (i === 6 || i === 7)) {
        // Costo Unitario y Costo Total - solo cuando incluye costos
        xTexto = xPos + colWidths[i] - textoWidth - 2;
      }

      page.drawText(texto, {
        x: xTexto,
        y: yPosition,
        size: 6,
        font: fontNormal,
      });
      xPos += colWidths[i];
    });

    // Dibujar líneas verticales para separar columnas
    let xLine = margin;
    colWidths.forEach((width) => {
      page.drawLine({
        start: { x: xLine, y: yPosition + 10 },
        end: { x: xLine, y: yPosition - 2 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      xLine += width;
    });
    // Línea vertical final
    page.drawLine({
      start: { x: xLine, y: yPosition + 10 },
      end: { x: xLine, y: yPosition - 2 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 12;
  }

  // Agregar fila de TOTAL si incluye costos
  if (incluirCostos) {
    yPosition -= 5; // Espacio antes del total

    // Calcular el total general
    const totalGeneral = detalles.reduce((sum, detalle) => {
      const cantidad = Number(detalle.cantidad) || 0;
      const costoUnitario = Number(detalle.costoUnitario) || 0;
      return sum + cantidad * costoUnitario;
    }, 0);

    // Fondo para la fila de total
    page.drawRectangle({
      x: margin,
      y: yPosition - 2,
      width: tableWidth,
      height: 14,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Texto "TOTAL" en negrita
    page.drawText("TOTAL:", {
      x:
        margin +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4] +
        colWidths[5] +
        5,
      y: yPosition,
      size: 8,
      font: fontBold,
    });

    // Monto total alineado a la derecha en la columna de Costo Total
    const totalTexto = formatearNumero(totalGeneral);
    const totalWidth = fontBold.widthOfTextAtSize(totalTexto, 8);
    const totalX =
      margin +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] +
      colWidths[4] +
      colWidths[5] +
      colWidths[6];

    page.drawText(totalTexto, {
      x: totalX + colWidths[7] - totalWidth - 2,
      y: yPosition,
      size: 8,
      font: fontBold,
    });

    yPosition -= 14;
  }

  // Dibujar firmas en la última página
  dibujaFirmasPDFMA({
    page,
    movimiento,
    width,
    margin,
    fontBold,
    fontNormal,
  });

  // Agregar numeración de páginas a todas las páginas
  const totalPages = pages.length;
  pages.forEach((p, index) => {
    const pageNumber = index + 1;
    const pageText = `Página ${pageNumber} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);

    // Dibujar número de página en la esquina superior derecha
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
      `Generado: ${new Date().toLocaleString("es-PE")} | Usuario: ${
        movimiento.personalRespAlmacen?.nombreCompleto || "-"
      }`,
      {
        x: margin,
        y: 38,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  });

  // Generar y retornar bytes del PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}