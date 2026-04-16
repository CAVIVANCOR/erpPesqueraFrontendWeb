/**
 * LiquidacionDocumentosAdjuntos.js
 * Módulo para agregar documentos adjuntos al PDF de liquidación
 * Cada documento se agrega en UNA SOLA PÁGINA con encabezado y documento
 * SIGUE EL PATRÓN ESTÁNDAR DE CARGA DE PDFs DE MEGUI
 */

import { rgb, PDFDocument } from "pdf-lib";
import { formatearFecha } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getModuleConfig } from "../../utils/pdf/pdfConfigV2";

export async function agregarDocumentosAdjuntos(
  pdfDoc,
  gastosConDocumentos,
  empresa,
  liquidacion,
  fonts
) {
  const { fontBold, fontNormal, fontOblique } = fonts;

  for (const gasto of gastosConDocumentos) {
    // Solo procesar si tiene documentos
    if (
      !gasto.urlComprobanteMovimiento &&
      !gasto.urlComprobanteOperacionMovCaja
    ) {
      continue;
    }

    // 1. Si tiene urlComprobanteMovimiento
    if (gasto.urlComprobanteMovimiento) {
      await agregarPaginaDocumento(
        pdfDoc,
        gasto,
        gasto.urlComprobanteMovimiento,
        "COMPROBANTE DE MOVIMIENTO",
        "det-movs-entrega-rendir-pesca-industrial-comprobante",
        empresa,
        liquidacion,
        fonts
      );
    }

    // 2. Si tiene urlComprobanteOperacionMovCaja
    if (gasto.urlComprobanteOperacionMovCaja) {
      await agregarPaginaDocumento(
        pdfDoc,
        gasto,
        gasto.urlComprobanteOperacionMovCaja,
        "COMPROBANTE DE OPERACIÓN DE CAJA",
        "det-movs-entrega-rendir-pesca-industrial-operacion",
        empresa,
        liquidacion,
        fonts
      );
    }
  }

  return pdfDoc;
}

async function agregarPaginaDocumento(
  pdfDoc,
  gasto,
  urlDocumento,
  tipoDocumento,
  moduleName,
  empresa,
  liquidacion,
  fonts
) {
  const { fontBold, fontNormal, fontOblique } = fonts;

  // Crear nueva página para el encabezado Y el documento
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  let yPosition = height - 30;
  const margin = 10;

  // ENCABEZADO DESCRIPTIVO
  const tituloWidth = fontBold.widthOfTextAtSize(tipoDocumento, 11);
  page.drawText(tipoDocumento, {
    x: (width - tituloWidth) / 2,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0.8),
  });

  yPosition -= 15;

  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
  });

  yPosition -= 12;

  // ID y Fecha del gasto
  page.drawText(
    `GASTO #${gasto.id} - ${formatearFecha(gasto.fechaMovimiento)}`,
    {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontBold,
    }
  );

  yPosition -= 10;

  // Categoría - Tipo
  const categoria = gasto.tipoMovimiento?.categoria?.nombre || "";
  const tipoMov = gasto.tipoMovimiento?.nombre || "";
  if (categoria || tipoMov) {
    page.drawText(`${categoria} - ${tipoMov}`, {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontBold,
    });
    yPosition -= 10;
  }

  // Descripción
  if (gasto.descripcion) {
    page.drawText(gasto.descripcion, {
      x: margin,
      y: yPosition,
      size: 7,
      font: fontOblique,
    });
    yPosition -= 10;
  }

  // Embarcación y Enlace
  if (gasto.embarcacion || gasto.labelEnlace) {
    let xPosicion = margin;

    if (gasto.embarcacion) {
      const textoEmb = `Embarcacion: ${
        gasto.embarcacion.activo?.nombre ||
        gasto.embarcacion.matricula ||
        "N/A"
      }`;
      page.drawText(textoEmb, {
        x: xPosicion,
        y: yPosition,
        size: 7,
        font: fontOblique,
        color: rgb(0.2, 0.2, 0.6),
      });
      const anchoTextoEmb = fontOblique.widthOfTextAtSize(textoEmb, 7);
      xPosicion += anchoTextoEmb;
    }

    if (gasto.labelEnlace) {
      const separador = gasto.embarcacion ? " - " : "";
      const textoEnlace = `${separador}Enlace: ${gasto.labelEnlace}`;
      page.drawText(textoEnlace, {
        x: xPosicion,
        y: yPosition,
        size: 7,
        font: fontOblique,
        color: rgb(0.6, 0.3, 0.1),
      });
    }

    yPosition -= 10;
  }

  // Moneda, Monto y N° Documento
  let xPosMoneda = margin;
  
  if (gasto.moneda) {
    const textoMoneda = `Moneda: ${gasto.moneda.simbolo || gasto.moneda.nombre || "N/A"}`;
    page.drawText(textoMoneda, {
      x: xPosMoneda,
      y: yPosition,
      size: 7,
      font: fontBold,
      color: rgb(0, 0.4, 0),
    });
    const anchoMoneda = fontBold.widthOfTextAtSize(textoMoneda, 7);
    xPosMoneda += anchoMoneda + 15;
  }

  // Monto
  if (gasto.monto !== null && gasto.monto !== undefined) {
    const simboloMoneda = gasto.moneda?.simbolo || "S/.";
    const montoFormateado = Number(gasto.monto).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const textoMonto = `Monto: ${simboloMoneda} ${montoFormateado}`;
    page.drawText(textoMonto, {
      x: xPosMoneda,
      y: yPosition,
      size: 7,
      font: fontBold,
      color: rgb(0.6, 0, 0.6),
    });
    const anchoMonto = fontBold.widthOfTextAtSize(textoMonto, 7);
    xPosMoneda += anchoMonto + 15;
  }

  // N° Documento
  if (gasto.tipoDocumento) {
    let numeroDocumento = gasto.tipoDocumento.codigo || "";
    if (gasto.numeroSerieComprobante || gasto.numeroCorrelativoComprobante) {
      numeroDocumento += "/";
      if (gasto.numeroSerieComprobante) {
        numeroDocumento += gasto.numeroSerieComprobante;
      }
      if (gasto.numeroCorrelativoComprobante) {
        numeroDocumento += "-" + gasto.numeroCorrelativoComprobante;
      }
    }
    
    if (numeroDocumento) {
      const textoDoc = `N° Dcmto: ${numeroDocumento}`;
      page.drawText(textoDoc, {
        x: xPosMoneda,
        y: yPosition,
        size: 7,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.6),
      });
    }
  }

  yPosition -= 10;

  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
  });

  yPosition -= 20;

  // CARGAR Y DIBUJAR DOCUMENTO EN LA MISMA PÁGINA
  try {
    const token = useAuthStore.getState().token;
    
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    // CONSTRUIR URL COMPLETA SIGUIENDO PATRÓN PDFViewerV2.jsx
    let urlCompleta;
    const config = getModuleConfig(moduleName);

    const normalizedPdfUrl = urlDocumento.startsWith("/")
      ? urlDocumento.substring(1)
      : urlDocumento;
    const normalizedUploadPath = config.uploadPath.startsWith("/")
      ? config.uploadPath.substring(1)
      : config.uploadPath;

    if (normalizedPdfUrl.startsWith(normalizedUploadPath)) {
      const fileName = normalizedPdfUrl.replace(
        normalizedUploadPath + "/",
        "",
      );
      urlCompleta = `${import.meta.env.VITE_API_URL}${config.apiEndpoint}/${fileName}`;
    } else {
      if (urlDocumento.startsWith("/api/")) {
        const rutaSinApi = urlDocumento.substring(4);
        urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
      } else if (urlDocumento.startsWith("/")) {
        urlCompleta = `${import.meta.env.VITE_API_URL}${urlDocumento}`;
      } else {
        urlCompleta = urlDocumento;
      }
    }
    
    
    const response = await fetch(`${urlCompleta}?t=${Date.now()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const documentBytes = await response.arrayBuffer();
    
    
    // Calcular espacio disponible para el documento
    const maxWidth = width - 2 * margin;
    const maxHeight = yPosition - 50; // Dejar espacio para pie de página

    // Intentar cargar como PDF y convertir primera página a imagen
    if (contentType.includes('application/pdf') || contentType.includes('pdf')) {
      try {
        const externalPdf = await PDFDocument.load(documentBytes);
        const [firstPage] = await pdfDoc.embedPdf(externalPdf, [0]);
        
        const { width: pdfWidth, height: pdfHeight } = firstPage;
        
        const scale = Math.min(
          maxWidth / pdfWidth,
          maxHeight / pdfHeight,
          1
        );

        const finalWidth = pdfWidth * scale;
        const finalHeight = pdfHeight * scale;
        const xImage = (width - finalWidth) / 2;

        page.drawPage(firstPage, {
          x: xImage,
          y: yPosition - finalHeight,
          width: finalWidth,
          height: finalHeight,
        });

      } catch (pdfError) {
        console.error("Error al cargar PDF:", pdfError);
        throw new Error(`No se pudo cargar el PDF: ${pdfError.message}`);
      }
    } 
    // Intentar como imagen
    else if (contentType.includes('image/')) {
      let image;

      try {
        if (contentType.includes('png')) {
          image = await pdfDoc.embedPng(documentBytes);
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          image = await pdfDoc.embedJpg(documentBytes);
        } else {
          throw new Error(`Formato de imagen no soportado: ${contentType}`);
        }

        const imageDims = image.scale(1);

        const scale = Math.min(
          maxWidth / imageDims.width,
          maxHeight / imageDims.height,
          1
        );

        const finalWidth = imageDims.width * scale;
        const finalHeight = imageDims.height * scale;
        const xImage = (width - finalWidth) / 2;

        page.drawImage(image, {
          x: xImage,
          y: yPosition - finalHeight,
          width: finalWidth,
          height: finalHeight,
        });

      } catch (imgError) {
        console.error("Error al cargar imagen:", imgError);
        throw new Error(`No se pudo cargar la imagen: ${imgError.message}`);
      }
    } 
    // Tipo no soportado
    else {
      throw new Error(`Tipo de contenido no soportado: ${contentType}`);
    }
  } catch (error) {
    console.error(`❌ Error al cargar documento:`, error);
    page.drawText("Error al cargar el documento", {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0.8, 0, 0),
    });
    page.drawText(`${error.message}`, {
      x: margin,
      y: yPosition - 10,
      size: 6,
      font: fontNormal,
      color: rgb(0.6, 0, 0),
    });
    page.drawText(`URL Original: ${urlDocumento.substring(0, 60)}`, {
      x: margin,
      y: yPosition - 20,
      size: 6,
      font: fontNormal,
      color: rgb(0.6, 0, 0),
    });
  }

  // Pie de página
  page.drawText(`Liquidación N° ${liquidacion.id}`, {
    x: margin,
    y: 20,
    size: 6,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });
}