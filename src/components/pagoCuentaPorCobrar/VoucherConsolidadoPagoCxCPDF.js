// src/components/pagoCuentaPorCobrar/VoucherConsolidadoPagoCxCPDF_V2.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF del voucher consolidado de pago CxC y lo sube al servidor
 * VERSIÓN 2: Siguiendo el patrón del reporte de pesca
 */
export async function generarYSubirVoucherConsolidado(
  pagoCuentaPorCobrar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorCobrar
) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFVoucherConsolidado(
      pagoCuentaPorCobrar,
      movimientos,
      conceptosSunat,
      resumen,
      empresa,
      cuentaPorCobrar
    );

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "pago-cuenta-por-cobrar");
    formData.append("entityId", pagoCuentaPorCobrar.id);

    // 4. Subir al servidor
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
 * Genera el PDF del voucher consolidado
 */
async function generarPDFVoucherConsolidado(
  pagoCuentaPorCobrar,
  movimientos,
  conceptosSunat,
  resumen,
  empresa,
  cuentaPorCobrar
) {
  // ═══════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 15;
  const simboloMoneda = pagoCuentaPorCobrar.monedaPago?.simbolo || "S/.";

  // Cargar logo
  let logoImage = null;
  if (empresa?.logo && empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        if (empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 2. CREAR PRIMERA PÁGINA
  // ═══════════════════════════════════════════════════════════
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  let { width, height } = page.getSize();

  // ═══════════════════════════════════════════════════════════
  // 3. DIBUJAR ENCABEZADO COMPLETO
  // ═══════════════════════════════════════════════════════════
  let yPosition = await dibujarEncabezadoCompleto(
    page,
    logoImage,
    empresa,
    pagoCuentaPorCobrar,
    cuentaPorCobrar,
    width,
    height,
    margin,
    fontBold,
    fontNormal
  );

  // ═══════════════════════════════════════════════════════════
  // 4. PREPARAR DATOS DE MOVIMIENTOS (AGRUPACIÓN Y ORDENAMIENTO)
  // ═══════════════════════════════════════════════════════════
  const movimientosArray = prepararDatosMovimientos(
    movimientos,
    pagoCuentaPorCobrar,
    cuentaPorCobrar
  );

  // ═══════════════════════════════════════════════════════════
  // 5. VERIFICAR ESPACIO PARA TABLA DE MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════
  if (yPosition < 180) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = await dibujarEncabezadoCompleto(
      page,
      logoImage,
      empresa,
      pagoCuentaPorCobrar,
      cuentaPorCobrar,
      width,
      height,
      margin,
      fontBold,
      fontNormal
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 6. TÍTULO DE SECCIÓN: MOVIMIENTOS DE CAJA
  // ═══════════════════════════════════════════════════════════
  const tituloMovimientos = "DETALLE DE MOVIMIENTOS DE CAJA";
  const tituloMovWidth = fontBold.widthOfTextAtSize(tituloMovimientos, 10);
  page.drawText(tituloMovimientos, {
    x: (width - tituloMovWidth) / 2,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 15;

  // ═══════════════════════════════════════════════════════════
  // 7. DIBUJAR TABLA DE MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════
  const colWidths = [25, 150, 40, 120, 100, 80];
  const headers = ["N°", "Tipo Movimiento", "ID", "Cuenta", "N° Oper.", "Monto"];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = (width - tableWidth) / 2;

  // Dibujar headers iniciales
  yPosition = dibujarHeadersTablaMovimientos(
    page,
    yPosition,
    colWidths,
    headers,
    tableWidth,
    tableStartX,
    fontBold
  );

  // Dibujar filas de movimientos
  let totalIngresos = 0;
  let totalSalidas = 0;

  for (let index = 0; index < movimientosArray.length; index++) {
    const mov = movimientosArray[index];
    
    // Verificar espacio en página
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = await dibujarEncabezadoCompleto(
        page,
        logoImage,
        empresa,
        pagoCuentaPorCobrar,
        cuentaPorCobrar,
        width,
        height,
        margin,
        fontBold,
        fontNormal
      );

      // Redibujar título y headers
      const tituloMov = "DETALLE DE MOVIMIENTOS DE CAJA";
      const tituloW = fontBold.widthOfTextAtSize(tituloMov, 10);
      page.drawText(tituloMov, {
        x: (width - tituloW) / 2,
        y: yPosition,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 8;
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      yPosition -= 15;

      yPosition = dibujarHeadersTablaMovimientos(
        page,
        yPosition,
        colWidths,
        headers,
        tableWidth,
        tableStartX,
        fontBold
      );
    }

    // Preparar datos de fila
    const rowData = [
      (index + 1).toString(),
      mov.tipo,
      mov.id ? mov.id.toString() : "-",
      mov.cuenta || "-",
      mov.numeroOperacion || "-",
      formatearNumero(mov.monto || 0),
    ];

    // Calcular totales
    if (mov.esIngreso) {
      totalIngresos += Number(mov.monto || 0);
    } else {
      totalSalidas += Number(mov.monto || 0);
    }

    // Fondo alternado
    const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
    page.drawRectangle({
      x: tableStartX,
      y: yPosition - 2,
      width: tableWidth,
      height: 18,
      color: bgColor,
    });

    // Determinar estilo según tipo de movimiento
    const esAutodetraccion = mov.tipo.includes("Autodet");
    const esImpuesto = mov.tipo === "ITF" || mov.tipo.includes("Comisión");

    const fontToUse = esAutodetraccion ? fontBold : fontNormal;
    const colorToUse = esAutodetraccion
      ? rgb(0.0, 0.5, 0.0) // Verde para autodetracción
      : esImpuesto
        ? rgb(0.6, 0, 0) // Rojo para impuestos
        : rgb(0, 0, 0); // Negro normal

    // Dibujar celdas
    let xPos = tableStartX;
    for (let i = 0; i < rowData.length; i++) {
      let displayValue = rowData[i];
      const maxWidth = colWidths[i] - 4;

      // Recortar texto si es necesario
      while (
        fontToUse.widthOfTextAtSize(displayValue, 6.5) > maxWidth &&
        displayValue.length > 3
      ) {
        displayValue = displayValue.substring(0, displayValue.length - 1);
      }
      if (displayValue !== rowData[i] && displayValue.length > 3) {
        displayValue = displayValue.substring(0, displayValue.length - 3) + "...";
      }

      // Alineación
      let textX;
      if (i === 0 || i === 2 || i === 5) {
        // N°, ID, Monto: alineados a la derecha
        const textWidth = fontToUse.widthOfTextAtSize(displayValue, 6.5);
        textX = xPos + colWidths[i] - textWidth - 2;
      } else {
        // Resto: alineados a la izquierda
        textX = xPos + 2;
      }

      page.drawText(displayValue, {
        x: textX,
        y: yPosition + 3,
        size: 6.5,
        font: fontToUse,
        color: colorToUse,
      });
      xPos += colWidths[i];
    }

    // Líneas verticales
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPosition + 16 },
        end: { x: lineX, y: yPosition - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    // Línea horizontal inferior
    page.drawLine({
      start: { x: tableStartX, y: yPosition - 2 },
      end: { x: tableStartX + tableWidth, y: yPosition - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPosition -= 18;
  }

  // ═══════════════════════════════════════════════════════════
  // 8. FILA DE TOTALES
  // ═══════════════════════════════════════════════════════════
  yPosition -= 5;

  // Fondo celeste
  page.drawRectangle({
    x: tableStartX,
    y: yPosition - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.72, 0.87, 0.97),
  });

  // Texto "TOTALES" centrado en columna "Cuenta" (índice 3)
  const xInicioColCuenta = colWidths.slice(0, 3).reduce((a, b) => a + b, 0);
  const totalesLabel = "TOTALES";
  const totalesLabelWidth = fontBold.widthOfTextAtSize(totalesLabel, 8);
  page.drawText(totalesLabel, {
    x: tableStartX + xInicioColCuenta + (colWidths[3] - totalesLabelWidth) / 2,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total monto alineado a la derecha en columna "Monto" (índice 5)
  const totalMontoText = formatearNumero(totalIngresos);
  const totalMontoWidth = fontBold.widthOfTextAtSize(totalMontoText, 8);
  const xInicioMonto = colWidths.slice(0, 5).reduce((a, b) => a + b, 0);
  page.drawText(totalMontoText, {
    x: tableStartX + xInicioMonto + colWidths[5] - totalMontoWidth - 2,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Líneas verticales del total
  let lineXTot = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineXTot, y: yPosition - 3 },
      end: { x: lineXTot, y: yPosition + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineXTot += colWidths[i];
  }

  yPosition -= 25;

  // ═══════════════════════════════════════════════════════════
  // 9. CONCEPTOS SUNAT (si existen)
  // ═══════════════════════════════════════════════════════════
  if (conceptosSunat?.detraccion || conceptosSunat?.retencion || conceptosSunat?.percepcion) {
    if (yPosition < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = await dibujarEncabezadoCompleto(
        page,
        logoImage,
        empresa,
        pagoCuentaPorCobrar,
        cuentaPorCobrar,
        width,
        height,
        margin,
        fontBold,
        fontNormal
      );
    }

    const tituloSunat = "CONCEPTOS SUNAT APLICADOS";
    const tituloSunatWidth = fontBold.widthOfTextAtSize(tituloSunat, 10);
    page.drawText(tituloSunat, {
      x: (width - tituloSunatWidth) / 2,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 8;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 15;

    if (conceptosSunat.detraccion) {
      const det = conceptosSunat.detraccion;

      page.drawText("• DETRACCIÓN", {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;

      const detallesDetraccion = [
        `  - ID Detracción: ${det.id}`,
        `  - Base Imponible: ${simboloMoneda} ${formatearNumero(det.importeTotal || 0)}`,
        `  - Tasa: ${det.tasaDetraccion || 0}%`,
        `  - Monto Detracción: ${simboloMoneda} ${formatearNumero(det.importeRequerido || 0)}`,
        `  - N° Constancia: ${det.numeroDocumento || "-"}`,
        `  - Estado: ${det.estadoPago?.nombre || "PENDIENTE"}`,
      ];

      detallesDetraccion.forEach((detalle) => {
        page.drawText(detalle, {
          x: margin + 10,
          y: yPosition,
          size: 8,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });

      yPosition -= 5;
    }

    if (conceptosSunat.retencion) {
      const ret = conceptosSunat.retencion;
      page.drawText(`• RETENCIÓN: ${simboloMoneda} ${formatearNumero(ret.importeRetenido || 0)}`, {
        x: margin + 10,
        y: yPosition,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    if (conceptosSunat.percepcion) {
      const per = conceptosSunat.percepcion;
      page.drawText(`• PERCEPCIÓN: ${simboloMoneda} ${formatearNumero(per.importePercibido || 0)}`, {
        x: margin + 10,
        y: yPosition,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    yPosition -= 10;
  }

  // ═══════════════════════════════════════════════════════════
  // 10. RESUMEN FINANCIERO
  // ═══════════════════════════════════════════════════════════
  if (yPosition < 200) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = await dibujarEncabezadoCompleto(
      page,
      logoImage,
      empresa,
      pagoCuentaPorCobrar,
      cuentaPorCobrar,
      width,
      height,
      margin,
      fontBold,
      fontNormal
    );
  }

  const tituloResumen = "RESUMEN DE LA OPERACIÓN";
  const tituloResumenWidth = fontBold.widthOfTextAtSize(tituloResumen, 10);
  page.drawText(tituloResumen, {
    x: (width - tituloResumenWidth) / 2,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 8;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 20;

  // Cuadro de resumen
  const resumenItems = [
    { label: "Monto Total Factura:", valor: resumen.montoBruto, negrita: false },
    { label: "(-) Detracción:", valor: resumen.detraccion || 0, negrita: false },
    { label: "Monto Neto a Pagar:", valor: resumen.montoBruto - (resumen.detraccion || 0), negrita: true, separador: true },
    { label: "", valor: 0, separador: true, vacio: true },
    { label: "MOVIMIENTOS BANCARIOS:", valor: 0, titulo: true },
    { label: "(+) Ingreso a Cuenta Empresa:", valor: resumen.montoBruto, negrita: false },
    { label: "(-) ITF:", valor: resumen.itf || 0, negrita: false },
    { label: "(-) Comisión Bancaria:", valor: resumen.comision || 0, negrita: false },
    { label: "(-) Autodetracción a BN:", valor: resumen.detraccion || 0, negrita: false },
    { label: "NETO EN CUENTA EMPRESA:", valor: resumen.montoNetoCaja, negrita: true, separador: true },
    { label: "", valor: 0, separador: true, vacio: true },
    { label: "(+) Ingreso a Cuenta BN Detracción:", valor: resumen.detraccion || 0, negrita: false },
    { label: "TOTAL DEPOSITADO EN BN:", valor: resumen.detraccion || 0, negrita: true, separador: true },
  ];

  resumenItems.forEach((item) => {
    if (item.vacio) {
      yPosition -= 5;
      return;
    }

    if (item.separador && !item.titulo) {
      page.drawLine({
        start: { x: margin + 20, y: yPosition + 5 },
        end: { x: width - margin - 20, y: yPosition + 5 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 3;
    }

    if (item.titulo) {
      page.drawText(item.label, {
        x: margin + 20,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      return;
    }

    const font = item.negrita ? fontBold : fontNormal;
    const size = item.negrita ? 9 : 8;

    page.drawText(item.label, {
      x: margin + 20,
      y: yPosition,
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    });

    const valorTexto = `${simboloMoneda} ${formatearNumero(item.valor)}`;
    const valorWidth = font.widthOfTextAtSize(valorTexto, size);
    page.drawText(valorTexto, {
      x: width - margin - 20 - valorWidth,
      y: yPosition,
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
  });

  yPosition -= 20;

  // ═══════════════════════════════════════════════════════════
  // 11. FIRMAS
  // ═══════════════════════════════════════════════════════════
  if (yPosition < 120) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 100;
  }

  const firmaWidth = 150;
  const firmaSpacing = (width - 2 * margin - 2 * firmaWidth) / 1;

  const firmas = [
    { x: margin, label: "ELABORADO POR" },
    { x: margin + firmaWidth + firmaSpacing, label: "APROBADO POR" },
  ];

  firmas.forEach(({ x, label }) => {
    // Línea de firma
    page.drawLine({
      start: { x: x, y: yPosition },
      end: { x: x + firmaWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Etiqueta
    const labelWidth = fontNormal.widthOfTextAtSize(label, 8);
    page.drawText(label, {
      x: x + (firmaWidth - labelWidth) / 2,
      y: yPosition - 15,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
  });

  // Pie de página
  const fechaGeneracion = new Date().toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const piePagina = `Documento generado automáticamente - ${fechaGeneracion}`;
  const pieWidth = fontNormal.widthOfTextAtSize(piePagina, 7);

  page.drawText(piePagina, {
    x: (width - pieWidth) / 2,
    y: 30,
    size: 7,
    font: fontNormal,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ═══════════════════════════════════════════════════════════
  // 12. SERIALIZAR Y RETORNAR
  // ═══════════════════════════════════════════════════════════
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Dibuja el encabezado completo del voucher (logo + empresa + título + datos)
 */
async function dibujarEncabezadoCompleto(
  page,
  logoImage,
  empresa,
  pagoCuentaPorCobrar,
  cuentaPorCobrar,
  width,
  height,
  margin,
  fontBold,
  fontNormal
) {
  let yPos = height - 40;

  // Logo
  if (logoImage) {
    const logoDims = logoImage.size();
    const maxLogoWidth = 80;
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

  // Datos de empresa
  const empresaNombre = empresa?.razonSocial || "EMPRESA";
  page.drawText(empresaNombre, {
    x: margin + 90,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 13;

  const rucTexto = `RUC: ${empresa?.ruc || "-"}`;
  page.drawText(rucTexto, {
    x: margin + 90,
    y: yPos,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPos -= 13;

  if (empresa?.direccion) {
    const direccionTexto = `Direccion: ${empresa.direccion}`;
    page.drawText(direccionTexto, {
      x: margin + 90,
      y: yPos,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
  }

  yPos -= 10;

  // Título del documento
  const titulo = "VOUCHER CONSOLIDADO DE PAGO - CUENTA POR COBRAR";
  const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
  page.drawText(titulo, {
    x: (width - tituloWidth) / 2,
    y: yPos,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 18;

  const numeroVoucher = `N° VOUCHER: ${pagoCuentaPorCobrar.id || "-"}`;
  const numeroWidth = fontBold.widthOfTextAtSize(numeroVoucher, 10);
  page.drawText(numeroVoucher, {
    x: (width - numeroWidth) / 2,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPos -= 25;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 15;

  // Datos del documento y pago (2 columnas)
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const col1X = margin;
  const col2X = width / 2 + 20;
  let yPosCol1 = yPos;
  let yPosCol2 = yPos;

  // Columna 1: Datos del documento
  page.drawText("DATOS DEL DOCUMENTO", {
    x: col1X,
    y: yPosCol1,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosCol1 -= 12;

  const datosCol1 = [
    ["Cliente:", cuentaPorCobrar?.cliente?.razonSocial || "-"],
    ["RUC:", cuentaPorCobrar?.cliente?.numeroDocumento || "-"],
    ["Documento:", cuentaPorCobrar?.numeroPreFactura || "-"],
    ["Fecha Emisión:", formatearFecha(cuentaPorCobrar?.fechaEmision)],
  ];

  datosCol1.forEach(([label, value]) => {
    page.drawText(label, {
      x: col1X,
      y: yPosCol1,
      size: 7.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: col1X + 75,
      y: yPosCol1,
      size: 7.5,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol1 -= 12;
  });

  // Columna 2: Datos del pago
  page.drawText("DATOS DEL PAGO", {
    x: col2X,
    y: yPosCol2,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosCol2 -= 12;

  const datosCol2 = [
    ["Fecha Pago:", formatearFecha(pagoCuentaPorCobrar.fechaPago)],
    ["Medio de Pago:", pagoCuentaPorCobrar.medioPago?.nombre || "-"],
    ["N° Operación:", pagoCuentaPorCobrar.numeroOperacion || "-"],
    ["Tipo de Cambio:", `S/ ${Number(pagoCuentaPorCobrar.tipoCambio || 1).toFixed(4)}`],
  ];

  datosCol2.forEach(([label, value]) => {
    page.drawText(label, {
      x: col2X,
      y: yPosCol2,
      size: 7.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: col2X + 85,
      y: yPosCol2,
      size: 7.5,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosCol2 -= 12;
  });

  yPos = Math.min(yPosCol1, yPosCol2) - 10;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: width - margin, y: yPos },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= 15;

  return yPos;
}

/**
 * Función helper para dibujar headers de tabla de movimientos
 */
function dibujarHeadersTablaMovimientos(
  page,
  yPos,
  colWidths,
  headers,
  tableWidth,
  tableStartX,
  fontBold
) {
  // Fondo celeste (igual que reporte de pesca)
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.72, 0.87, 0.97),
  });

  // Headers centrados
  let xPos = tableStartX;
  headers.forEach((header, i) => {
    const headerWidth = fontBold.widthOfTextAtSize(header, 7);
    const textX = xPos + (colWidths[i] - headerWidth) / 2;
    page.drawText(header, {
      x: textX,
      y: yPos,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales
  let lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }

  return yPos - 20;
}

/**
 * Prepara los datos de movimientos para la tabla
 */
function prepararDatosMovimientos(movimientos, pagoCuentaPorCobrar, cuentaPorCobrar) {
  const movimientosArray = [];

  // 1. Pago principal (ingreso)
  if (movimientos.ingreso) {
    movimientosArray.push({
      tipo: "Pago CxC",
      id: movimientos.ingreso.id,
      monto: movimientos.ingreso.monto,
      cuenta: movimientos.ingreso.cuentaCorriente?.nombre || "-",
      numeroOperacion: pagoCuentaPorCobrar.numeroOperacion || "-",
      esIngreso: true,
      orden: 1,
    });
  }

  // 2. ITF (salida)
  if (movimientos.itf) {
    movimientosArray.push({
      tipo: "ITF",
      id: movimientos.itf.id,
      monto: movimientos.itf.monto,
      cuenta: movimientos.itf.cuentaCorriente?.nombre || "-",
      numeroOperacion: "-",
      esIngreso: false,
      orden: 2,
    });
  }

  // 3. Comisión bancaria (salida)
  if (movimientos.comision) {
    movimientosArray.push({
      tipo: "Comisión Bancaria",
      id: movimientos.comision.id,
      monto: movimientos.comision.monto,
      cuenta: movimientos.comision.cuentaCorriente?.nombre || "-",
      numeroOperacion: "-",
      esIngreso: false,
      orden: 3,
    });
  }

  // 4. Autodetracción salida
  if (movimientos.autodetraccionSalida) {
    movimientosArray.push({
      tipo: "Autodet. Salida",
      id: movimientos.autodetraccionSalida.id,
      monto: movimientos.autodetraccionSalida.monto,
      cuenta: movimientos.autodetraccionSalida.cuentaCorriente?.nombre || "-",
      numeroOperacion: movimientos.autodetraccionSalida.numeroOperacionPagoBancoImpuesto || "-",
      esIngreso: false,
      orden: 4,
    });
  }

  // 5. Autodetracción ingreso
  if (movimientos.autodetraccionIngreso) {
    movimientosArray.push({
      tipo: "Autodet. Ingreso BN",
      id: movimientos.autodetraccionIngreso.id,
      monto: movimientos.autodetraccionIngreso.monto,
      cuenta: movimientos.autodetraccionIngreso.cuentaCorriente?.nombre || "BN DETRACCIÓN",
      numeroOperacion: movimientos.autodetraccionIngreso.numeroOperacionPagoBancoImpuesto || "-",
      esIngreso: true,
      orden: 5,
    });
  }

  // 6. Detracción ingreso (si el cliente pagó la detracción)
  if (movimientos.detraccionIngreso) {
    movimientosArray.push({
      tipo: "Detracción Ingreso BN",
      id: movimientos.detraccionIngreso.id,
      monto: movimientos.detraccionIngreso.monto,
      cuenta: movimientos.detraccionIngreso.cuentaCorriente?.nombre || "BN DETRACCIÓN",
      numeroOperacion: movimientos.detraccionIngreso.numeroOperacionPagoBancoImpuesto || "-",
      esIngreso: true,
      orden: 6,
    });
  }

  // Ordenar por prioridad
  movimientosArray.sort((a, b) => a.orden - b.orden);

  return movimientosArray;
}
