// src/components/movimientoAlmacen/MovimientoAlmacenPDF.js
// Generador de PDF para movimientos de almacén - Formato completo
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera un PDF del movimiento de almacén
 * @param {Object} movimiento - Datos del movimiento de almacén
 * @param {Array} detalles - Detalles del movimiento
 * @param {Object} empresa - Datos de la empresa
 * @param {boolean} incluirCostos - Si debe incluir costos en el PDF
 */
export async function generarPDFMovimientoAlmacen(
  movimiento,
  detalles,
  empresa,
  incluirCostos = false
) {
  try {
    // Crear nuevo documento PDF en orientación horizontal
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
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
          
          if (empresa.logo.toLowerCase().includes('.png')) {
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
      size: 14,
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
        size: 9,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    }

    // Título del documento
    yPosition -= 20;
    const titulo = (movimiento.tipoDocumento?.descripcion || "DOCUMENTO DE ALMACÉN").toUpperCase();
    const tituloWidth = titulo.length * 8;
    const tituloX = (width - tituloWidth) / 2;
    
    page.drawText(titulo, {
      x: tituloX,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Número de documento
    yPosition -= lineHeight + 5;
    const numeroDoc = movimiento.numeroDocumento || 
                      (movimiento.numSerieDoc && movimiento.numCorreDoc 
                        ? `${movimiento.numSerieDoc}-${movimiento.numCorreDoc}` 
                        : "-");
    page.drawText(`N° ${numeroDoc}`, {
      x: width / 2 - 50,
      y: yPosition,
      size: 12,
      font: fontBold,
    });

    // Línea separadora
    yPosition -= 10;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // DATOS DEL MOVIMIENTO
    yPosition -= 25;
    page.drawText("DATOS DEL MOVIMIENTO", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });

    yPosition -= lineHeight + 5;
    const datosMovimiento = [
      ["Fecha Documento:", new Date(movimiento.fechaDocumento).toLocaleDateString("es-PE")],
      ["Tipo Documento:", movimiento.tipoDocumento?.descripcion || "-"],
      ["Estado:", movimiento.estadoDocAlmacen?.descripcion || "PENDIENTE"],
      ["Concepto:", movimiento.conceptoMovAlmacen?.descripcionArmada || "-"],
      ["Mercadería:", movimiento.esCustodia ? "CUSTODIA" : "PROPIA"],
    ];

    // Almacenes
    if (movimiento.conceptoMovAlmacen?.almacenOrigen) {
      const nombreOrigen = movimiento.conceptoMovAlmacen.almacenOrigen.nombre || "-";
      datosMovimiento.push(["Almacén Origen:", nombreOrigen]);
    }
    if (movimiento.conceptoMovAlmacen?.almacenDestino) {
      const nombreDestino = movimiento.conceptoMovAlmacen.almacenDestino.nombre || "-";
      datosMovimiento.push(["Almacén Destino:", nombreDestino]);
    }

    // Entidad Comercial
    if (movimiento.entidadComercial) {
      datosMovimiento.push(["Entidad Comercial:", movimiento.entidadComercial.razonSocial]);
    }

    // Direcciones
    if (movimiento.dirOrigen) {
      datosMovimiento.push(["Dirección Origen:", movimiento.dirOrigen.direccionArmada || movimiento.dirOrigen.direccion || "-"]);
    }
    if (movimiento.dirDestino) {
      datosMovimiento.push(["Dirección Destino:", movimiento.dirDestino.direccionArmada || movimiento.dirDestino.direccion || "-"]);
    }

    // Guía SUNAT
    if (movimiento.numGuiaSunat) {
      datosMovimiento.push(["N° Guía SUNAT:", movimiento.numGuiaSunat]);
      if (movimiento.fechaGuiaSunat) {
        datosMovimiento.push(["Fecha Guía SUNAT:", new Date(movimiento.fechaGuiaSunat).toLocaleDateString("es-PE")]);
      }
    }

    // Transporte
    if (movimiento.transportista) {
      datosMovimiento.push(["Transportista:", movimiento.transportista.razonSocial || "-"]);
    }
    if (movimiento.vehiculo) {
      datosMovimiento.push(["Vehículo:", `${movimiento.vehiculo.placa || ""} - ${movimiento.vehiculo.marca || ""} ${movimiento.vehiculo.modelo || ""}`.trim()]);
    }

    // Agencia de Envío
    if (movimiento.agenciaEnvio) {
      datosMovimiento.push(["Agencia Envío:", movimiento.agenciaEnvio.razonSocial || "-"]);
      if (movimiento.dirAgenciaEnvio) {
        datosMovimiento.push(["Dir. Agencia:", movimiento.dirAgenciaEnvio.direccionArmada || movimiento.dirAgenciaEnvio.direccion || "-"]);
      }
    }

    // Personal Responsable
    if (movimiento.personalRespAlmacen) {
      datosMovimiento.push(["Personal Responsable:", movimiento.personalRespAlmacen.nombreCompleto || "-"]);
    }

    // Observaciones
    if (movimiento.observaciones) {
      datosMovimiento.push(["Observaciones:", movimiento.observaciones]);
    }

    // Dibujar datos del movimiento
    datosMovimiento.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPosition,
        size: 9,
        font: fontBold,
      });
      page.drawText(value, {
        x: margin + 130,
        y: yPosition,
        size: 9,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    });

    // TABLA DE DETALLES
    yPosition -= 10;
    page.drawText("DETALLES DEL MOVIMIENTO", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });

    yPosition -= 20;

    // Encabezados de tabla - Ajustados para orientación horizontal
    const colWidths = [25, 165, 45, 75, 50, 70, 85, 70, 70, 65, 70];
    let xPos = margin;
    const headers = ["#", "Producto", "Cant.", "U.M.", "Peso", "Lote", "Contenedor", "Est.Merc", "Est.Cal", "F.Prod", "F.Venc"];
    
    // Calcular ancho total de la tabla
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

    // Dibujar encabezados con fondo gris que cubra todas las columnas
    page.drawRectangle({
      x: margin,
      y: yPosition - 5,
      width: tableWidth,
      height: 18,
      color: rgb(0.85, 0.85, 0.85),
    });

    headers.forEach((header, i) => {
      page.drawText(header, {
        x: xPos + 2,
        y: yPosition,
        size: 7,
        font: fontBold,
      });
      xPos += colWidths[i];
    });

    yPosition -= 18;

    // Dibujar filas de detalles
    detalles.forEach((detalle, index) => {
      if (yPosition < 100) {
        // Nueva página en horizontal
        page = pdfDoc.addPage([841.89, 595.28]);
        yPosition = height - 50;
        
        // Redibujar encabezados con fondo gris completo
        page.drawRectangle({
          x: margin,
          y: yPosition - 5,
          width: tableWidth,
          height: 18,
          color: rgb(0.85, 0.85, 0.85),
        });
        
        xPos = margin;
        headers.forEach((header, i) => {
          page.drawText(header, {
            x: xPos + 2,
            y: yPosition,
            size: 7,
            font: fontBold,
          });
          xPos += colWidths[i];
        });
        
        yPosition -= 18;
      }

      xPos = margin;
      const cantidad = Number(detalle.cantidad) || 0;
      const peso = Number(detalle.peso) || 0;
      
      // Extraer descripción del producto (probar diferentes propiedades)
      const productoDesc = detalle.producto?.descripcionArmada || 
                          detalle.producto?.descripcion || 
                          detalle.producto?.nombre || 
                          "PRODUCTO SIN DESCRIPCIÓN";
      
      // Extraer unidad de medida
      const unidadMedida = detalle.producto?.unidadMedida?.abreviatura || 
                          detalle.producto?.unidadMedida?.simbolo || 
                          detalle.unidadMedida?.abreviatura || "-";
      
      const rowData = [
        `${index + 1}`,
        productoDesc.substring(0, 30), // Ajustado para nueva columna
        cantidad.toFixed(2),
        unidadMedida.substring(0, 13), // Limitar U.M. a 13 caracteres
        peso.toFixed(2),
        detalle.lote?.substring(0, 12) || "-",
        detalle.nroContenedor?.substring(0, 15) || detalle.numContenedor?.substring(0, 15) || "-",
        detalle.estadoMercaderia?.descripcion?.substring(0, 12) || "-",
        detalle.estadoCalidad?.descripcion?.substring(0, 12) || "-",
        detalle.fechaProduccion ? new Date(detalle.fechaProduccion).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
        detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
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
        page.drawText(String(data), {
          x: xPos + 2,
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
    });

    // SECCIÓN DE FIRMAS
    yPosition = 150;
    
    // Debug: Verificar datos para firmas
    console.log('PDF - Personal Responsable:', movimiento.personalRespAlmacen);
    console.log('PDF - Entidad Comercial:', movimiento.entidadComercial);
    
    // Calcular posiciones para dos columnas
    const firmaIzqX = margin + 20;
    const firmaDerX = width - margin - 180;
    const firmaWidth = 150;
    
    // FIRMA IZQUIERDA - Personal Responsable
    if (movimiento.personalRespAlmacen) {
      // Línea para firma
      page.drawLine({
        start: { x: firmaIzqX, y: yPosition },
        end: { x: firmaIzqX + firmaWidth, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Nombre del responsable
      yPosition -= 12;
      const nombreResp = movimiento.personalRespAlmacen.nombreCompleto || "-";
      page.drawText(nombreResp, {
        x: firmaIzqX,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      
      // Documento de identidad
      yPosition -= 10;
      const docResp = movimiento.personalRespAlmacen.numeroDocumento 
        ? `DNI: ${movimiento.personalRespAlmacen.numeroDocumento}`
        : "-";
      page.drawText(docResp, {
        x: firmaIzqX,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });
      
      // Etiqueta "Responsable de Almacén"
      yPosition -= 10;
      page.drawText("Responsable de Almacén", {
        x: firmaIzqX,
        y: yPosition,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // FIRMA DERECHA - Entidad Comercial
    yPosition = 150;
    if (movimiento.entidadComercial) {
      // Línea para firma
      page.drawLine({
        start: { x: firmaDerX, y: yPosition },
        end: { x: firmaDerX + firmaWidth, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Razón social
      yPosition -= 12;
      const razonSocial = movimiento.entidadComercial.razonSocial || "-";
      page.drawText(razonSocial.substring(0, 25), {
        x: firmaDerX,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      
      // Documento de identidad
      yPosition -= 10;
      const docEntidad = movimiento.entidadComercial.numeroDocumento 
        ? (movimiento.entidadComercial.tipoDocumentoId === "2" 
          ? `RUC: ${movimiento.entidadComercial.numeroDocumento}`
          : `DNI: ${movimiento.entidadComercial.numeroDocumento}`)
        : "-";
      page.drawText(docEntidad, {
        x: firmaDerX,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });
      
      // Etiqueta "Entidad Comercial"
      yPosition -= 10;
      page.drawText("Entidad Comercial", {
        x: firmaDerX,
        y: yPosition,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Pie de página
    yPosition = 50;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 12;
    page.drawText(
      `Generado: ${new Date().toLocaleString("es-PE")} | Usuario: ${movimiento.personalRespAlmacen?.nombreCompleto || "-"}`,
      {
        x: margin,
        y: yPosition,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Generar y abrir PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return { success: true };
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera un PDF del movimiento de almacén CON COSTOS
 * @param {Object} movimiento - Datos del movimiento de almacén
 * @param {Array} detalles - Detalles del movimiento
 * @param {Object} empresa - Datos de la empresa
 */
export async function generarPDFMovimientoAlmacenConCostos(
  movimiento,
  detalles,
  empresa
) {
  try {
    // Crear nuevo documento PDF en orientación horizontal
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
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
          
          if (empresa.logo.toLowerCase().includes('.png')) {
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
      size: 14,
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
        size: 9,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    }

    // Título del documento
    yPosition -= 20;
    const titulo = (movimiento.tipoDocumento?.descripcion || "DOCUMENTO DE ALMACÉN").toUpperCase();
    const tituloWidth = titulo.length * 8;
    const tituloX = (width - tituloWidth) / 2;
    
    page.drawText(titulo, {
      x: tituloX,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Número de documento
    yPosition -= lineHeight + 5;
    const numeroDoc = movimiento.numeroDocumento || 
                      (movimiento.numSerieDoc && movimiento.numCorreDoc 
                        ? `${movimiento.numSerieDoc}-${movimiento.numCorreDoc}` 
                        : "-");
    page.drawText(`N° ${numeroDoc}`, {
      x: width / 2 - 50,
      y: yPosition,
      size: 12,
      font: fontBold,
    });

    // Línea separadora
    yPosition -= 10;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // DATOS DEL MOVIMIENTO
    yPosition -= 25;
    page.drawText("DATOS DEL MOVIMIENTO", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });

    yPosition -= lineHeight + 5;
    const datosMovimiento = [
      ["Fecha Documento:", new Date(movimiento.fechaDocumento).toLocaleDateString("es-PE")],
      ["Tipo Documento:", movimiento.tipoDocumento?.descripcion || "-"],
      ["Estado:", movimiento.estadoDocAlmacen?.descripcion || "PENDIENTE"],
      ["Concepto:", movimiento.conceptoMovAlmacen?.descripcionArmada || "-"],
      ["Mercadería:", movimiento.esCustodia ? "CUSTODIA" : "PROPIA"],
    ];

    // Almacenes
    if (movimiento.conceptoMovAlmacen?.almacenOrigen) {
      const nombreOrigen = movimiento.conceptoMovAlmacen.almacenOrigen.nombre || "-";
      datosMovimiento.push(["Almacén Origen:", nombreOrigen]);
    }
    if (movimiento.conceptoMovAlmacen?.almacenDestino) {
      const nombreDestino = movimiento.conceptoMovAlmacen.almacenDestino.nombre || "-";
      datosMovimiento.push(["Almacén Destino:", nombreDestino]);
    }

    // Entidad Comercial
    if (movimiento.entidadComercial) {
      datosMovimiento.push(["Entidad Comercial:", movimiento.entidadComercial.razonSocial]);
    }

    // Direcciones
    if (movimiento.dirOrigen) {
      datosMovimiento.push(["Dirección Origen:", movimiento.dirOrigen.direccionArmada || movimiento.dirOrigen.direccion || "-"]);
    }
    if (movimiento.dirDestino) {
      datosMovimiento.push(["Dirección Destino:", movimiento.dirDestino.direccionArmada || movimiento.dirDestino.direccion || "-"]);
    }

    // Guía SUNAT
    if (movimiento.numGuiaSunat) {
      datosMovimiento.push(["N° Guía SUNAT:", movimiento.numGuiaSunat]);
      if (movimiento.fechaGuiaSunat) {
        datosMovimiento.push(["Fecha Guía SUNAT:", new Date(movimiento.fechaGuiaSunat).toLocaleDateString("es-PE")]);
      }
    }

    // Transporte
    if (movimiento.transportista) {
      datosMovimiento.push(["Transportista:", movimiento.transportista.razonSocial || "-"]);
    }
    if (movimiento.vehiculo) {
      datosMovimiento.push(["Vehículo:", `${movimiento.vehiculo.placa || ""} - ${movimiento.vehiculo.marca || ""} ${movimiento.vehiculo.modelo || ""}`.trim()]);
    }

    // Agencia de Envío
    if (movimiento.agenciaEnvio) {
      datosMovimiento.push(["Agencia Envío:", movimiento.agenciaEnvio.razonSocial || "-"]);
      if (movimiento.dirAgenciaEnvio) {
        datosMovimiento.push(["Dir. Agencia:", movimiento.dirAgenciaEnvio.direccionArmada || movimiento.dirAgenciaEnvio.direccion || "-"]);
      }
    }

    // Personal Responsable
    if (movimiento.personalRespAlmacen) {
      datosMovimiento.push(["Personal Responsable:", movimiento.personalRespAlmacen.nombreCompleto || "-"]);
    }

    // Observaciones
    if (movimiento.observaciones) {
      datosMovimiento.push(["Observaciones:", movimiento.observaciones]);
    }

    // Dibujar datos del movimiento
    datosMovimiento.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPosition,
        size: 9,
        font: fontBold,
      });
      page.drawText(value, {
        x: margin + 130,
        y: yPosition,
        size: 9,
        font: fontNormal,
      });
      yPosition -= lineHeight;
    });

    // TABLA DE DETALLES CON COSTOS
    yPosition -= 10;
    page.drawText("DETALLES DEL MOVIMIENTO (CON COSTOS)", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });

    yPosition -= 20;

    // Determinar si es nota de ingreso para mostrar costos
    const esNotaIngreso = movimiento.tipoDocumento?.descripcion?.toUpperCase().includes("INGRESO");

    // Encabezados de tabla - CON columnas de Costo Unit. y Costo Total si es ingreso
    const colWidths = esNotaIngreso 
      ? [25, 140, 45, 65, 60, 55, 70, 60, 60, 60, 60, 60, 60] // Con Costo Unit. y Costo Total
      : [25, 165, 45, 75, 50, 70, 85, 70, 70, 65, 70]; // Sin Costos
    
    let xPos = margin;
    const headers = esNotaIngreso
      ? ["#", "Producto", "Cant.", "U.M.", "Lote", "Contenedor", "Costo Unit.", "Costo Total", "Est.Merc", "Est.Cal", "F.Prod", "F.Venc"]
      : ["#", "Producto", "Cant.", "U.M.", "Peso", "Lote", "Contenedor", "Est.Merc", "Est.Cal", "F.Prod", "F.Venc"];
    
    // Calcular ancho total de la tabla
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

    // Dibujar encabezados con fondo gris que cubra todas las columnas
    page.drawRectangle({
      x: margin,
      y: yPosition - 5,
      width: tableWidth,
      height: 18,
      color: rgb(0.85, 0.85, 0.85),
    });

    headers.forEach((header, i) => {
      page.drawText(header, {
        x: xPos + 2,
        y: yPosition,
        size: 7,
        font: fontBold,
      });
      xPos += colWidths[i];
    });

    yPosition -= 18;

    // Dibujar filas de detalles
    detalles.forEach((detalle, index) => {
      if (yPosition < 100) {
        // Nueva página en horizontal
        page = pdfDoc.addPage([841.89, 595.28]);
        yPosition = height - 50;
        
        // Redibujar encabezados con fondo gris completo
        page.drawRectangle({
          x: margin,
          y: yPosition - 5,
          width: tableWidth,
          height: 18,
          color: rgb(0.85, 0.85, 0.85),
        });
        
        xPos = margin;
        headers.forEach((header, i) => {
          page.drawText(header, {
            x: xPos + 2,
            y: yPosition,
            size: 7,
            font: fontBold,
          });
          xPos += colWidths[i];
        });
        
        yPosition -= 18;
      }

      xPos = margin;
      const cantidad = Number(detalle.cantidad) || 0;
      const peso = Number(detalle.peso) || 0;
      const costoUnitario = Number(detalle.costoUnitario) || 0;
      const costoTotal = cantidad * costoUnitario; // Calcular costo total
      
      // Extraer descripción del producto
      const productoDesc = detalle.producto?.descripcionArmada || 
                          detalle.producto?.descripcion || 
                          detalle.producto?.nombre || 
                          "PRODUCTO SIN DESCRIPCIÓN";
      
      // Extraer unidad de medida
      const unidadMedida = detalle.producto?.unidadMedida?.abreviatura || 
                          detalle.producto?.unidadMedida?.simbolo || 
                          detalle.unidadMedida?.abreviatura || "-";
      
      // Construir rowData según si es nota de ingreso o no
      const rowData = esNotaIngreso
        ? [
            `${index + 1}`,
            productoDesc.substring(0, 26),
            cantidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Cantidad con formato
            unidadMedida.substring(0, 11),
            detalle.lote?.substring(0, 10) || "-",
            detalle.nroContenedor?.substring(0, 12) || detalle.numContenedor?.substring(0, 12) || "-",
            costoUnitario.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Costo Unitario con formato
            costoTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Costo Total con formato
            detalle.estadoMercaderia?.descripcion?.substring(0, 10) || "-",
            detalle.estadoCalidad?.descripcion?.substring(0, 10) || "-",
            detalle.fechaProduccion ? new Date(detalle.fechaProduccion).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
            detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
          ]
        : [
            `${index + 1}`,
            productoDesc.substring(0, 30),
            cantidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Cantidad con formato
            unidadMedida.substring(0, 13),
            peso.toFixed(2),
            detalle.lote?.substring(0, 12) || "-",
            detalle.nroContenedor?.substring(0, 15) || detalle.numContenedor?.substring(0, 15) || "-",
            detalle.estadoMercaderia?.descripcion?.substring(0, 12) || "-",
            detalle.estadoCalidad?.descripcion?.substring(0, 12) || "-",
            detalle.fechaProduccion ? new Date(detalle.fechaProduccion).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
            detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-",
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
        page.drawText(String(data), {
          x: xPos + 2,
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
    });

    // SECCIÓN DE FIRMAS
    yPosition = 150;
    
    // Calcular posiciones para dos columnas
    const firmaIzqX = margin + 20;
    const firmaDerX = width - margin - 180;
    const firmaWidth = 150;
    
    // FIRMA IZQUIERDA - Personal Responsable
    if (movimiento.personalRespAlmacen) {
      // Línea para firma
      page.drawLine({
        start: { x: firmaIzqX, y: yPosition },
        end: { x: firmaIzqX + firmaWidth, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Nombre del responsable
      yPosition -= 12;
      const nombreResp = movimiento.personalRespAlmacen.nombreCompleto || "-";
      page.drawText(nombreResp, {
        x: firmaIzqX,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      
      // Documento de identidad
      yPosition -= 10;
      const docResp = movimiento.personalRespAlmacen.numeroDocumento 
        ? `DNI: ${movimiento.personalRespAlmacen.numeroDocumento}`
        : "-";
      page.drawText(docResp, {
        x: firmaIzqX,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });
      
      // Etiqueta "Responsable de Almacén"
      yPosition -= 10;
      page.drawText("Responsable de Almacén", {
        x: firmaIzqX,
        y: yPosition,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // FIRMA DERECHA - Entidad Comercial
    yPosition = 150;
    if (movimiento.entidadComercial) {
      // Línea para firma
      page.drawLine({
        start: { x: firmaDerX, y: yPosition },
        end: { x: firmaDerX + firmaWidth, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Razón social
      yPosition -= 12;
      const razonSocial = movimiento.entidadComercial.razonSocial || "-";
      page.drawText(razonSocial.substring(0, 25), {
        x: firmaDerX,
        y: yPosition,
        size: 8,
        font: fontBold,
      });
      
      // Documento de identidad
      yPosition -= 10;
      const docEntidad = movimiento.entidadComercial.numeroDocumento 
        ? (movimiento.entidadComercial.tipoDocumentoId === "2" 
          ? `RUC: ${movimiento.entidadComercial.numeroDocumento}`
          : `DNI: ${movimiento.entidadComercial.numeroDocumento}`)
        : "-";
      page.drawText(docEntidad, {
        x: firmaDerX,
        y: yPosition,
        size: 7,
        font: fontNormal,
      });
      
      // Etiqueta "Entidad Comercial"
      yPosition -= 10;
      page.drawText("Entidad Comercial", {
        x: firmaDerX,
        y: yPosition,
        size: 7,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Pie de página
    yPosition = 50;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 12;
    page.drawText(
      `Generado: ${new Date().toLocaleString("es-PE")} | Usuario: ${movimiento.personalRespAlmacen?.nombreCompleto || "-"}`,
      {
        x: margin,
        y: yPosition,
        size: 6,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Generar y abrir PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return { success: true };
  } catch (error) {
    console.error("Error al generar PDF con costos:", error);
    return { success: false, error: error.message };
  }
}