// src/components/requerimientoCompra/RequerimientoCompraPDF.js
// Generador de PDF para requerimientos de compra
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF del requerimiento de compra y lo sube al servidor
 * @param {Object} requerimiento - Datos del requerimiento de compra
 * @param {Array} detalles - Detalles del requerimiento
 * @param {Object} empresa - Datos de la empresa
 * @param {Boolean} mostrarProveedor - Mostrar proveedor en el PDF
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFRequerimientoCompra(
  requerimiento,
  detalles,
  empresa,
  mostrarProveedor = false
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFRequerimientoCompra(requerimiento, detalles, empresa, mostrarProveedor);
    
    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    
    // 3. Crear FormData para subir
    const formData = new FormData();
    const nombreArchivo = `requerimiento-${requerimiento.id}.pdf`;
    formData.append("pdf", blob, nombreArchivo);
    formData.append("requerimientoId", requerimiento.id);
    
    // 4. Subir al servidor
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/requerimiento-compra/upload-pdf`,
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
      urlPdf: resultado.urlReqCompraPdf || resultado.urlPdf,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF del requerimiento de compra
 * @param {Object} requerimiento - Datos del requerimiento
 * @param {Array} detalles - Detalles del requerimiento
 * @param {Object} empresa - Datos de la empresa
 * @param {Boolean} mostrarProveedor - Mostrar proveedor en el PDF
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFRequerimientoCompra(requerimiento, detalles, empresa, mostrarProveedor = false) {
  // Función para formatear números con separadores de miles y millones
  const formatearNumero = (numero) => {
    const partes = numero.toFixed(2).split('.');
    const entero = partes[0];
    const decimal = partes[1];
    
    // Agregar separadores
    let resultado = '';
    let contador = 0;
    
    for (let i = entero.length - 1; i >= 0; i--) {
      if (contador === 3) {
        resultado = ',' + resultado;
        contador = 0;
      }
      if (contador === 6) {
        resultado = "'" + resultado;
        contador = 0;
      }
      resultado = entero[i] + resultado;
      contador++;
    }
    
    // Si hay millones, reemplazar la primera coma por apóstrofe
    if (entero.length > 6) {
      const partes = resultado.split(',');
      if (partes.length > 2) {
        resultado = partes[0] + "'" + partes.slice(1).join(',');
      }
    }
    
    return resultado + '.' + decimal;
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
  const lineHeight = 15;

  // Cargar logo si existe
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
            y: yPosition - finalHeight,
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
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight;
  page.drawText(`RUC: ${empresa?.ruc || "-"}`, {
    x: margin + 110,
    y: yPosition,
    size: 10,
    font: fontNormal,
  });

  yPosition -= lineHeight;
  if (empresa?.direccion) {
    page.drawText(`Dirección: ${empresa.direccion}`, {
      x: margin + 110,
      y: yPosition,
      size: 8,
      font: fontNormal,
    });
    yPosition -= 12;
  }

  // Título del documento
  yPosition -= 10;
  const titulo = "REQUERIMIENTO DE COMPRA";
  const tituloWidth = titulo.length * 8;
  const tituloX = (width - tituloWidth) / 2;

  page.drawText(titulo, {
    x: tituloX,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Número de documento
  yPosition -= 14;
  const numeroDoc = requerimiento.numeroDocumento || "-";
  page.drawText(`N° ${numeroDoc}`, {
    x: width / 2 - 50,
    y: yPosition,
    size: 12,
    font: fontBold,
  });

  // Línea separadora (justo debajo del número de documento)
  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Construir datos del requerimiento en dos columnas
  yPosition -= 12;
  
  // Columna izquierda
  const datosIzquierda = [
    ["Fecha Documento:", new Date(requerimiento.fechaDocumento).toLocaleDateString("es-PE")],
    ["Tipo Producto:", requerimiento.tipoProducto?.descripcion || "-"],
    ["Estado Producto:", requerimiento.tipoEstadoProducto?.descripcion || "-"],
    ["Destino Producto:", requerimiento.destinoProducto?.descripcion || "-"],
  ];
  
  // Columna derecha
  const datosDerecha = [
    ["Fecha Requerida:", requerimiento.fechaRequerida ? new Date(requerimiento.fechaRequerida).toLocaleDateString("es-PE") : "-"],
    ["Forma de Pago:", requerimiento.formaPago?.descripcion || "-"],
    ["Moneda:", requerimiento.moneda?.descripcion || requerimiento.moneda?.nombre || "SOLES"],
    ["Tipo de Cambio:", requerimiento.tipoCambio ? `S/ ${Number(requerimiento.tipoCambio).toFixed(3)}` : "-"],
  ];
  
  const yInicial = yPosition;
  const columnaDerechaX = width / 2 + 50;
  
  // Dibujar columna izquierda
  datosIzquierda.forEach(([label, value]) => {
    page.drawText(label, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(String(value), {
      x: margin + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  });
  
  // Dibujar columna derecha
  yPosition = yInicial;
  datosDerecha.forEach(([label, value]) => {
    page.drawText(label, {
      x: columnaDerechaX,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(String(value), {
      x: columnaDerechaX + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  });
  
  // Ajustar yPosition al final de las columnas
  yPosition = yInicial - (Math.max(datosIzquierda.length, datosDerecha.length) * lineHeight);

  // Agregar proveedor solo si mostrarProveedor es true
  if (mostrarProveedor && requerimiento.proveedor) {
    page.drawText("Proveedor:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(requerimiento.proveedor?.razonSocial || "-", {
      x: margin + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  }

  // Responsables (solo Producción y Almacén, Solicitante y Compras van en firmas)
  if (requerimiento.respProduccion) {
    page.drawText("Resp. Producción:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(requerimiento.respProduccion.nombreCompleto || "-", {
      x: margin + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  }
  if (requerimiento.respAlmacen) {
    page.drawText("Resp. Almacén:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(requerimiento.respAlmacen.nombreCompleto || "-", {
      x: margin + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  }

  // Observaciones
  if (requerimiento.observaciones) {
    page.drawText("Observaciones:", {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText(requerimiento.observaciones, {
      x: margin + 120,
      y: yPosition,
      size: 9,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  }

  // TABLA DE DETALLES
  yPosition -= 8;
  
  // Encabezados de tabla con anchos ajustados
  const colWidths = [25, 340, 40, 180, 70, 80];
  const headers = ["#", "Producto", "Cant.", "Unidad/Empaque", "P. Unit. Compra", "Precio Compra"];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableStartX = margin;
  
  // Función para dibujar encabezado de tabla (reutilizable en nuevas páginas)
  const dibujarEncabezadoTabla = (pag, yPos) => {
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
  
  // Dibujar encabezado inicial
  yPosition = dibujarEncabezadoTabla(page, yPosition);

  // Calcular totales
  let valorCompra = 0;

  // Dibujar filas de productos
  let xPos;
  detalles.forEach((detalle, index) => {
    // Verificar si hay espacio para la fila (solo crear nueva página si realmente no cabe)
    if (yPosition < 180) {
      // Nueva página si no hay espacio
      page = pdfDoc.addPage([width, height]);
      pages.push(page);
      yPosition = height - margin - 20;
      // Redibujar encabezado de tabla en la nueva página
      yPosition = dibujarEncabezadoTabla(page, yPosition);
    }

    const rowY = yPosition;
    xPos = tableStartX;
    
    // Nombre completo del producto
    const nombreProducto = detalle.producto?.descripcionArmada || 
                          detalle.producto?.descripcion || 
                          detalle.producto?.nombre || 
                          "PRODUCTO";
    
    const rowData = [
      String(index + 1),
      nombreProducto,
      String(detalle.cantidad || 0),
      detalle.producto?.unidadMedida?.nombre || "-",
      `S/ ${formatearNumero(Number(detalle.costoUnitario || 0))}`,
      `S/ ${formatearNumero(Number(detalle.subtotal || 0))}`,
    ];

    // Dibujar datos con alineación correcta
    rowData.forEach((data, i) => {
      const colX = xPos;
      const colWidth = colWidths[i];
      
      // Alinear números a la derecha, texto a la izquierda
      let textX = colX + 3;
      if (i === 0 || i === 2 || i === 4 || i === 5) {
        // Columnas numéricas: alinear a la derecha
        const textWidth = fontNormal.widthOfTextAtSize(data, 8);
        textX = colX + colWidth - textWidth - 3;
      }
      
      page.drawText(data, {
        x: textX,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });
      xPos += colWidth;
    });

    // Acumular valorCompra
    valorCompra += Number(detalle.subtotal) || 0;

    // Líneas verticales de la fila
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: rowY - 2 },
        end: { x: lineX, y: rowY + 13 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    // Línea horizontal inferior de la fila
    page.drawLine({
      start: { x: tableStartX, y: rowY - 2 },
      end: { x: tableStartX + tableWidth, y: rowY - 2 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 15;
  });

  // Verificar si hay espacio para totales y firmas (necesitan ~150px)
  if (yPosition < 150) {
    page = pdfDoc.addPage([width, height]);
    pages.push(page);
    yPosition = height - margin - 50;
  }
  
  // TOTALES
  yPosition -= 15;
  const totalesX = width - margin - 220;
  const totalesWidth = 220;
  const totalesLineHeight = 20;

  // Calcular IGV y Total
  const igv = requerimiento.esExoneradoAlIGV
    ? 0
    : valorCompra * (Number(requerimiento.porcentajeIGV) / 100 || 0.18);
  const total = valorCompra + igv;

  // Subtotal
  page.drawText("Valor Compra:", {
    x: totalesX,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  const valorText = `S/ ${formatearNumero(valorCompra)}`;
  const valorWidth = fontNormal.widthOfTextAtSize(valorText, 9);
  page.drawText(valorText, {
    x: totalesX + totalesWidth - valorWidth - 10,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= totalesLineHeight;

  // IGV
  page.drawText(`IGV (${requerimiento.porcentajeIGV || 18}%):`, {
    x: totalesX,
    y: yPosition,
    size: 9,
    font: fontBold,
  });
  const igvText = `S/ ${formatearNumero(igv)}`;
  const igvWidth = fontNormal.widthOfTextAtSize(igvText, 9);
  page.drawText(igvText, {
    x: totalesX + totalesWidth - igvWidth - 10,
    y: yPosition,
    size: 9,
    font: fontNormal,
  });

  yPosition -= totalesLineHeight + 5; // Espacio extra antes del total

  // Total con fondo
  page.drawRectangle({
    x: totalesX,
    y: yPosition - 3,
    width: totalesWidth,
    height: 22,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText("Precio Compra Total:", {
    x: totalesX + 10,
    y: yPosition + 5,
    size: 10,
    font: fontBold,
  });
  const totalText = `S/ ${formatearNumero(total)}`;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, 10);
  page.drawText(totalText, {
    x: totalesX + totalesWidth - totalWidth - 10,
    y: yPosition + 5,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.4, 0),
  });

  // SECCIÓN DE FIRMAS
  yPosition -= 30; // Espacio después de totales
  const firmaYInicial = yPosition; // Guardar posición inicial para ambas firmas
  
  // Calcular posiciones para dos columnas
  const firmaIzqX = margin + 20;
  const firmaDerX = width - margin - 180;
  const firmaWidth = 150;
  
  // FIRMA IZQUIERDA - Solicitante
  if (requerimiento.solicitante) {
    let yFirma = firmaYInicial;
    
    // Línea para firma
    page.drawLine({
      start: { x: firmaIzqX, y: yFirma },
      end: { x: firmaIzqX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Nombre del solicitante
    yFirma -= 12;
    const nombreSolicitante = requerimiento.solicitante.nombreCompleto || "-";
    page.drawText(nombreSolicitante, {
      x: firmaIzqX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });
    
    // Documento de identidad
    yFirma -= 10;
    const docSolicitante = requerimiento.solicitante.numeroDocumento 
      ? `DNI: ${requerimiento.solicitante.numeroDocumento}`
      : "-";
    page.drawText(docSolicitante, {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });
    
    // Etiqueta "Solicitante"
    yFirma -= 10;
    page.drawText("Solicitante", {
      x: firmaIzqX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  
  // FIRMA DERECHA - Responsable de Compras
  if (requerimiento.respCompras) {
    let yFirma = firmaYInicial; // Usar la misma altura inicial
    // Línea para firma
    page.drawLine({
      start: { x: firmaDerX, y: yFirma },
      end: { x: firmaDerX + firmaWidth, y: yFirma },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Nombre del responsable
    yFirma -= 12;
    const nombreResp = requerimiento.respCompras.nombreCompleto || "-";
    page.drawText(nombreResp, {
      x: firmaDerX,
      y: yFirma,
      size: 8,
      font: fontBold,
    });
    
    // Documento de identidad
    yFirma -= 10;
    const docResp = requerimiento.respCompras.numeroDocumento 
      ? `DNI: ${requerimiento.respCompras.numeroDocumento}`
      : "-";
    page.drawText(docResp, {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
    });
    
    // Etiqueta "Responsable de Compras"
    yFirma -= 10;
    page.drawText("Responsable de Compras", {
      x: firmaDerX,
      y: yFirma,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

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

  // Generar bytes del PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}