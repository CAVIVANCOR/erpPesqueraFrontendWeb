// src/components/cuentaCorriente/reports/generarEstadoCuentasPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Genera PDF del reporte de Estado de Cuentas Corrientes
 * @param {Object} data - Datos de las cuentas corrientes
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarEstadoCuentasPDF(data) {
  const { cuentas, empresas, bancos, filtros, fechaGeneracion } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const lineHeight = 12;

  // ⭐ OBTENER EMPRESA FILTRADA (SOLO si hay filtro de empresa)
  let empresaFiltrada = null;
  let logoImage = null;
  
  if (filtros.empresaFiltro) {
    empresaFiltrada = empresas.find(e => Number(e.id) === Number(filtros.empresaFiltro));
    
    // Cargar logo si existe empresa filtrada
    if (empresaFiltrada?.logo && empresaFiltrada?.id) {
      try {
        const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresaFiltrada.id}/logo`;
        const logoResponse = await fetch(logoUrl);

        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          if (empresaFiltrada.logo.toLowerCase().includes(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
        }
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }
  }

  // ⭐ DEFINIR COLUMNAS DE LA TABLA (CON DOS COLUMNAS DE SALDO ACTUAL)
  const colWidths = [30, 130, 100, 100, 50, 85, 85, 85, 60];
  const headers = [
    "N°",
    "Empresa",
    "Banco",
    "Nro. Cuenta",
    "Mon.",
    "Saldo Act. S/.",
    "Saldo Act. US$",
    "Saldo Minimo",
    "Estado"
  ];

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO COMPLETO
  function dibujarEncabezadoCompleto(pag, width, height, pageNum, totalPages) {
    let yPos = height - 40;

    // Logo y datos de empresa (SOLO si hay filtro de empresa)
    if (empresaFiltrada) {
      if (logoImage) {
        const logoDims = logoImage.size();
        const maxLogoWidth = 70;
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

      pag.drawText(empresaFiltrada.razonSocial || "EMPRESA", {
        x: margin + 80,
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPos -= lineHeight;
      pag.drawText(`RUC: ${empresaFiltrada.ruc || "-"}`, {
        x: margin + 80,
        y: yPos,
        size: 9,
        font: fontNormal,
      });

      yPos -= lineHeight;
      if (empresaFiltrada.direccion) {
        const direccionTexto = empresaFiltrada.direccion.length > 60 
          ? empresaFiltrada.direccion.substring(0, 60) + "..."
          : empresaFiltrada.direccion;
        pag.drawText(`Direccion: ${direccionTexto}`, {
          x: margin + 80,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }
      yPos -= 10;
    }

    // Título del reporte
    const titulo = "ESTADO DE CUENTAS CORRIENTES";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 14);
    pag.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 18;

    // Fecha y hora de generación
    const fechaTexto = `Fecha de Generacion: ${fechaGeneracion.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}, ${fechaGeneracion.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    const fechaWidth = fontNormal.widthOfTextAtSize(fechaTexto, 9);
    pag.drawText(fechaTexto, {
      x: (width - fechaWidth) / 2,
      y: yPos,
      size: 9,
      font: fontNormal,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPos -= 15;

    // Filtros aplicados
    if (filtros.empresaFiltro || filtros.bancoFiltro || filtros.estadoFiltro !== undefined) {
      pag.drawText("Filtros aplicados:", {
        x: margin,
        y: yPos,
        size: 9,
        font: fontBold,
      });
      yPos -= lineHeight;

      if (filtros.empresaFiltro) {
        const empresa = empresas.find(e => Number(e.id) === Number(filtros.empresaFiltro));
        pag.drawText(`  • Empresa: ${empresa?.razonSocial || "-"}`, {
          x: margin,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }

      if (filtros.bancoFiltro) {
        const banco = bancos.find(b => Number(b.id) === Number(filtros.bancoFiltro));
        pag.drawText(`  • Banco: ${banco?.nombre || "-"}`, {
          x: margin,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }

      if (filtros.estadoFiltro !== undefined && filtros.estadoFiltro !== null) {
        const estadoTexto = filtros.estadoFiltro ? "Activas" : "Inactivas";
        pag.drawText(`  • Estado: ${estadoTexto}`, {
          x: margin,
          y: yPos,
          size: 8,
          font: fontNormal,
        });
        yPos -= lineHeight;
      }

      yPos -= 5;
    }

    // Línea separadora
    pag.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPos -= 15;

    // Numeración de página
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    return yPos;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADOS DE TABLA
  function dibujarEncabezadosTabla(pag, yPos, width) {
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      color: rgb(0.68, 0.85, 0.9),
    });

    // Bordes del header
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - 15,
      width: contentWidth,
      height: 15,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Textos del header
    let xPos = tableStartX + 2;
    headers.forEach((header, index) => {
      pag.drawText(header, {
        x: xPos + 2,
        y: yPos - 11,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += colWidths[index];
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - 15 },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - 15;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR FILA DE DATOS
  function dibujarFila(pag, yPos, rowData, rowNumber, isEven, width) {
    const rowHeight = 14;
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo alternado
    if (isEven) {
      pag.drawRectangle({
        x: tableStartX,
        y: yPos - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    // Bordes de la fila
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    // Datos de la fila
    let xPos = tableStartX + 2;

    // N°
    pag.drawText(String(rowNumber), {
      x: xPos + (colWidths[0] - fontNormal.widthOfTextAtSize(String(rowNumber), 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[0];

    // Empresa
    const empresaTexto = (rowData.empresa?.razonSocial || "-").substring(0, 22);
    pag.drawText(empresaTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[1];

    // Banco
    const bancoTexto = (rowData.banco?.nombre || "-").substring(0, 16);
    pag.drawText(bancoTexto, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[2];

    // Número de Cuenta
    const nroCuenta = (rowData.numeroCuenta || "-").substring(0, 18);
    pag.drawText(nroCuenta, {
      x: xPos + 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[3];

    // Moneda
    const moneda = rowData.moneda?.simbolo || "-";
    pag.drawText(moneda, {
      x: xPos + (colWidths[4] - fontNormal.widthOfTextAtSize(moneda, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
    });
    xPos += colWidths[4];

    // ⭐ SALDO ACTUAL S/. (solo si la moneda es S/.)
    const esSoles = rowData.moneda?.simbolo === "S/.";
    const saldoActualSoles = esSoles ? Number(rowData.saldoActual || 0) : 0;
    const saldoSolesTexto = saldoActualSoles.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoSolesWidth = fontNormal.widthOfTextAtSize(saldoSolesTexto, 7);
    pag.drawText(saldoSolesTexto, {
      x: xPos + colWidths[5] - saldoSolesWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[5];

    // ⭐ SALDO ACTUAL US$ (solo si la moneda es US$)
    const esDolares = rowData.moneda?.simbolo === "US$" || rowData.moneda?.simbolo === "USD" || rowData.moneda?.simbolo === "$";
    const saldoActualDolares = esDolares ? Number(rowData.saldoActual || 0) : 0;
    const saldoDolaresTexto = saldoActualDolares.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoDolaresWidth = fontNormal.widthOfTextAtSize(saldoDolaresTexto, 7);
    pag.drawText(saldoDolaresTexto, {
      x: xPos + colWidths[6] - saldoDolaresWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[6];

    // Saldo Mínimo
    const saldoMinimo = Number(rowData.saldoMinimo || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoMinimoWidth = fontNormal.widthOfTextAtSize(saldoMinimo, 7);
    pag.drawText(saldoMinimo, {
      x: xPos + colWidths[7] - saldoMinimoWidth - 2,
      y: yPos - 10,
      size: 7,
      font: fontNormal,
    });
    xPos += colWidths[7];

    // Estado
    const estadoTexto = rowData.activa ? "ACTIVA" : "INACTIVA";
    const estadoColor = rowData.activa ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
    pag.drawText(estadoTexto, {
      x: xPos + (colWidths[8] - fontBold.widthOfTextAtSize(estadoTexto, 7)) / 2,
      y: yPos - 10,
      size: 7,
      font: fontBold,
      color: estadoColor,
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }

  // ⭐ FUNCIÓN PARA DIBUJAR SUBTOTAL
  function dibujarSubtotal(pag, yPos, texto, saldoActualSoles, saldoActualDolares, saldoMinimo, width, nivel = 1) {
    const rowHeight = 14;
    const tableStartX = margin;
    const contentWidth = width - margin * 2;

    // Fondo según nivel
    const bgColor = nivel === 1 ? rgb(0.85, 0.92, 0.95) : rgb(0.92, 0.96, 0.98);
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: bgColor,
    });

    // Bordes
    pag.drawRectangle({
      x: tableStartX,
      y: yPos - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 0.8,
    });

    // ⭐ TEXTO DEL SUBTOTAL (posición según nivel)
    let xPosLabel;
    if (nivel === 1) {
      // Total por Empresa → columna Empresa
      xPosLabel = tableStartX + colWidths[0] + 2;
    } else {
      // Subtotal por Banco → columna Banco
      xPosLabel = tableStartX + colWidths[0] + colWidths[1] + 2;
    }
    
    pag.drawText(texto, {
      x: xPosLabel + 2,
      y: yPos - 10,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // ⭐ SALDO ACTUAL S/. (columna 6)
    let xPos = tableStartX + colWidths.slice(0, 5).reduce((sum, w) => sum + w, 0);
    const saldoSolesTexto = saldoActualSoles.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoSolesWidth = fontBold.widthOfTextAtSize(saldoSolesTexto, 8);
    pag.drawText(saldoSolesTexto, {
      x: xPos + colWidths[5] - saldoSolesWidth - 2,
      y: yPos - 10,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // ⭐ SALDO ACTUAL US$ (columna 7)
    xPos += colWidths[5];
    const saldoDolaresTexto = saldoActualDolares.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoDolaresWidth = fontBold.widthOfTextAtSize(saldoDolaresTexto, 8);
    pag.drawText(saldoDolaresTexto, {
      x: xPos + colWidths[6] - saldoDolaresWidth - 2,
      y: yPos - 10,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Saldo Mínimo (columna 8)
    xPos += colWidths[6];
    const saldoMinimoTexto = saldoMinimo.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const saldoMinimoWidth = fontBold.widthOfTextAtSize(saldoMinimoTexto, 8);
    pag.drawText(saldoMinimoTexto, {
      x: xPos + colWidths[7] - saldoMinimoWidth - 2,
      y: yPos - 10,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // ⭐ LÍNEAS VERTICALES SEPARADORAS EN SUBTOTAL
    let lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      pag.drawLine({
        start: { x: lineX, y: yPos - rowHeight },
        end: { x: lineX, y: yPos },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }

    return yPos - rowHeight;
  }

  // ⭐ AGRUPAR CUENTAS POR EMPRESA Y BANCO
  const gruposPorEmpresa = {};
  cuentas.forEach(cuenta => {
    const empresaKey = cuenta.empresa?.razonSocial || "SIN EMPRESA";
    const bancoKey = cuenta.banco?.nombre || "SIN BANCO";

    if (!gruposPorEmpresa[empresaKey]) {
      gruposPorEmpresa[empresaKey] = {};
    }
    if (!gruposPorEmpresa[empresaKey][bancoKey]) {
      gruposPorEmpresa[empresaKey][bancoKey] = [];
    }
    gruposPorEmpresa[empresaKey][bancoKey].push(cuenta);
  });

  // ⭐ GENERAR PÁGINAS
  let pages = [];
  let currentPage = pdfDoc.addPage([842, 595]); // A4 horizontal
  let { width, height } = currentPage.getSize();
  let yPosition = dibujarEncabezadoCompleto(currentPage, width, height, 1, 1);
  yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
  pages.push(currentPage);

  let rowNumber = 1;
  let totalGeneralSaldoActualSoles = 0;
  let totalGeneralSaldoActualDolares = 0;
  let totalGeneralSaldoMinimo = 0;

  // Iterar por empresas
  for (const [empresaNombre, bancos] of Object.entries(gruposPorEmpresa)) {
    let totalEmpresaSaldoActualSoles = 0;
    let totalEmpresaSaldoActualDolares = 0;
    let totalEmpresaSaldoMinimo = 0;

    // Iterar por bancos dentro de la empresa
    for (const [bancoNombre, cuentasBanco] of Object.entries(bancos)) {
      let totalBancoSaldoActualSoles = 0;
      let totalBancoSaldoActualDolares = 0;
      let totalBancoSaldoMinimo = 0;

      // Dibujar cuentas del banco
      for (let i = 0; i < cuentasBanco.length; i++) {
        const cuenta = cuentasBanco[i];

        // Verificar si necesitamos nueva página
        if (yPosition < 80) {
          currentPage = pdfDoc.addPage([842, 595]);
          ({ width, height } = currentPage.getSize());
          yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
          yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
          pages.push(currentPage);
        }

        yPosition = dibujarFila(currentPage, yPosition, cuenta, rowNumber, i % 2 === 0, width);
        rowNumber++;

        // ⭐ ACUMULAR SALDOS SEGÚN MONEDA
        const esSoles = cuenta.moneda?.simbolo === "S/.";
        const esDolares = cuenta.moneda?.simbolo === "US$" || cuenta.moneda?.simbolo === "USD" || cuenta.moneda?.simbolo === "$";
        
        if (esSoles) {
          totalBancoSaldoActualSoles += Number(cuenta.saldoActual || 0);
        } else if (esDolares) {
          totalBancoSaldoActualDolares += Number(cuenta.saldoActual || 0);
        }
        
        totalBancoSaldoMinimo += Number(cuenta.saldoMinimo || 0);
      }

      // Subtotal por Banco
      if (yPosition < 80) {
        currentPage = pdfDoc.addPage([842, 595]);
        ({ width, height } = currentPage.getSize());
        yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
        yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
        pages.push(currentPage);
      }

      yPosition = dibujarSubtotal(
        currentPage,
        yPosition,
        `Subtotal ${bancoNombre}`,
        totalBancoSaldoActualSoles,
        totalBancoSaldoActualDolares,
        totalBancoSaldoMinimo,
        width,
        2
      );

      totalEmpresaSaldoActualSoles += totalBancoSaldoActualSoles;
      totalEmpresaSaldoActualDolares += totalBancoSaldoActualDolares;
      totalEmpresaSaldoMinimo += totalBancoSaldoMinimo;
    }

    // Subtotal por Empresa
    if (yPosition < 80) {
      currentPage = pdfDoc.addPage([842, 595]);
      ({ width, height } = currentPage.getSize());
      yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
      yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
      pages.push(currentPage);
    }

    yPosition = dibujarSubtotal(
      currentPage,
      yPosition,
      `Total ${empresaNombre}`,
      totalEmpresaSaldoActualSoles,
      totalEmpresaSaldoActualDolares,
      totalEmpresaSaldoMinimo,
      width,
      1
    );

    totalGeneralSaldoActualSoles += totalEmpresaSaldoActualSoles;
    totalGeneralSaldoActualDolares += totalEmpresaSaldoActualDolares;
    totalGeneralSaldoMinimo += totalEmpresaSaldoMinimo;
  }

  // ⭐ TOTAL GENERAL
  if (yPosition < 80) {
    currentPage = pdfDoc.addPage([842, 595]);
    ({ width, height } = currentPage.getSize());
    yPosition = dibujarEncabezadoCompleto(currentPage, width, height, pages.length + 1, 1);
    yPosition = dibujarEncabezadosTabla(currentPage, yPosition, width);
    pages.push(currentPage);
  }

  yPosition -= 5;
  const rowHeight = 16;
  const tableStartX = margin;
  const contentWidth = width - margin * 2;

  currentPage.drawRectangle({
    x: tableStartX,
    y: yPosition - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: rgb(0.75, 0.85, 0.9),
  });

  currentPage.drawRectangle({
    x: tableStartX,
    y: yPosition - rowHeight,
    width: contentWidth,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  // Label Total General en columna Banco
  let xPos = tableStartX + colWidths[0] + colWidths[1] + 2;
  currentPage.drawText("TOTAL GENERAL", {
    x: xPos + 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Saldo Actual S/.
  xPos = tableStartX + colWidths.slice(0, 5).reduce((sum, w) => sum + w, 0);
  const totalGeneralSolesTexto = totalGeneralSaldoActualSoles.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const totalGeneralSolesWidth = fontBold.widthOfTextAtSize(totalGeneralSolesTexto, 9);
  currentPage.drawText(totalGeneralSolesTexto, {
    x: xPos + colWidths[5] - totalGeneralSolesWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Saldo Actual US$
  xPos += colWidths[5];
  const totalGeneralDolaresTexto = totalGeneralSaldoActualDolares.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const totalGeneralDolaresWidth = fontBold.widthOfTextAtSize(totalGeneralDolaresTexto, 9);
  currentPage.drawText(totalGeneralDolaresTexto, {
    x: xPos + colWidths[6] - totalGeneralDolaresWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Saldo Mínimo
  xPos += colWidths[6];
  const totalGeneralMinimoTexto = totalGeneralSaldoMinimo.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const totalGeneralMinimoWidth = fontBold.widthOfTextAtSize(totalGeneralMinimoTexto, 9);
  currentPage.drawText(totalGeneralMinimoTexto, {
    x: xPos + colWidths[7] - totalGeneralMinimoWidth - 2,
    y: yPosition - 11,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ⭐ LÍNEAS VERTICALES SEPARADORAS EN TOTAL GENERAL
  let lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    currentPage.drawLine({
      start: { x: lineX, y: yPosition - rowHeight },
      end: { x: lineX, y: yPosition },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }

  // ⭐ ACTUALIZAR NUMERACIÓN DE PÁGINAS
  const totalPages = pages.length;
  pages.forEach((pag, index) => {
    const pageNum = index + 1;
    const pageText = `Pagina ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    pag.drawText(pageText, {
      x: width - margin - pageTextWidth,
      y: height - 25,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ PIE DE PÁGINA EN TODAS LAS PÁGINAS
  const footerText = `Total de cuentas: ${cuentas.length} | Generado: ${fechaGeneracion.toLocaleString('es-PE')} | Sistema ERP Megui`;
  pages.forEach((pag) => {
    pag.drawLine({
      start: { x: margin, y: 25 },
      end: { x: width - margin, y: 25 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    const footerWidth = fontNormal.widthOfTextAtSize(footerText, 7);
    pag.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 15,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // ⭐ GENERAR Y RETORNAR BLOB
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}