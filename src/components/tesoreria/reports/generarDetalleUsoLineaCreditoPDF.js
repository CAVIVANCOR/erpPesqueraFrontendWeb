// src/components/tesoreria/reports/generarDetalleUsoLineaCreditoPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearFecha, formatearNumero } from "../../../utils/utils.js";

/**
 * Genera PDF del reporte detallado de uso de Líneas de Crédito
 * Muestra estructura expandida: Líneas → Sublíneas → Préstamos
 * Replica la vista del formulario LineaCreditoForm.jsx
 * @param {Object} data - Datos de las líneas de crédito con sublíneas y préstamos
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
export async function generarDetalleUsoLineaCreditoPDF(data) {
  const { items, fechaGeneracion, titulo } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 30;
  const pageWidth = 612;
  const pageHeight = 792;
  const contentWidth = pageWidth - margin * 2;

  // Ordenar items por empresa y número de línea
  const itemsOrdenados = [...items].sort((a, b) => {
    const empresaA = a.empresa?.razonSocial || "";
    const empresaB = b.empresa?.razonSocial || "";
    if (empresaA !== empresaB) {
      return empresaA.localeCompare(empresaB);
    }
    const numA = a.numeroLinea || "";
    const numB = b.numeroLinea || "";
    return numA.localeCompare(numB);
  });

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - 30;
  let pageNum = 1;
  const totalPages = itemsOrdenados.length; // Una página por línea de crédito

  // ⭐ FUNCIÓN PARA CREAR NUEVA PÁGINA
  function nuevaPagina() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPos = pageHeight - 30;
    pageNum++;
    dibujarEncabezadoPagina();
  }

  // ⭐ FUNCIÓN PARA DIBUJAR ENCABEZADO DE PÁGINA
  function dibujarEncabezadoPagina() {
    const tituloTexto = titulo || "DETALLE DE USO DE LÍNEAS DE CRÉDITO";
    const tituloWidth = fontBold.widthOfTextAtSize(tituloTexto, 14);
    currentPage.drawText(tituloTexto, {
      x: (pageWidth - tituloWidth) / 2,
      y: pageHeight - 30,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const fechaTexto = `Generado: ${fechaGeneracion.toLocaleString("es-PE")}`;
    const fechaWidth = fontNormal.widthOfTextAtSize(fechaTexto, 8);
    currentPage.drawText(fechaTexto, {
      x: (pageWidth - fechaWidth) / 2,
      y: pageHeight - 45,
      size: 8,
      font: fontNormal,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pageText = `Página ${pageNum} de ${totalPages}`;
    const pageTextWidth = fontNormal.widthOfTextAtSize(pageText, 8);
    currentPage.drawText(pageText, {
      x: pageWidth - margin - pageTextWidth,
      y: pageHeight - 20,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });

    yPos = pageHeight - 60;
  }

  // ⭐ FUNCIÓN PARA VERIFICAR ESPACIO Y CREAR NUEVA PÁGINA SI ES NECESARIO
  function verificarEspacio(espacioNecesario) {
    if (yPos - espacioNecesario < margin + 20) {
      nuevaPagina();
      return true;
    }
    return false;
  }

  // ⭐ FUNCIÓN PARA TRUNCAR TEXTO
  const truncate = (text, maxLen) => {
    if (!text) return "-";
    return text.length > maxLen ? text.substring(0, maxLen - 2) + ".." : text;
  };

  // Dibujar encabezado inicial
  dibujarEncabezadoPagina();

  // ⭐ ITERAR POR CADA LÍNEA DE CRÉDITO
  itemsOrdenados.forEach((linea, lineaIndex) => {
    verificarEspacio(100);

    // ========================================
    // SECCIÓN 1: HEADER DE LA LÍNEA
    // ========================================
    currentPage.drawRectangle({
      x: margin,
      y: yPos - 18,
      width: contentWidth,
      height: 18,
      color: rgb(0.27, 0.45, 0.77),
    });

    currentPage.drawRectangle({
      x: margin,
      y: yPos - 18,
      width: contentWidth,
      height: 18,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const lineaTitulo = `LÍNEA DE CRÉDITO: ${linea.numeroLinea || "N/A"}`;
    currentPage.drawText(lineaTitulo, {
      x: margin + 5,
      y: yPos - 13,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    yPos -= 28;

    // ========================================
    // SECCIÓN 2: INFORMACIÓN DE LA LÍNEA (2 COLUMNAS)
    // ========================================
    const col1X = margin + 5;
    const col2X = margin + 300;
    const lineSpacing = 11;

    const infoLinea = [
      {
        label: "Empresa:",
        value: truncate(linea.empresa?.razonSocial, 38),
        col: 1,
      },
      { label: "Banco:", value: truncate(linea.banco?.nombre, 38), col: 1 },
      { label: "Moneda:", value: linea.moneda?.codigoSunat || "-", col: 1 },
      {
        label: "Monto Aprobado:",
        value: formatearNumero(linea.montoAprobado || 0, 2),
        col: 2,
      },
      {
        label: "Monto Utilizado:",
        value: formatearNumero(linea.montoUtilizado || 0, 2),
        col: 2,
      },
      {
        label: "Monto Disponible:",
        value: formatearNumero(linea.montoDisponible || 0, 2),
        col: 2,
      },
      {
        label: "Tasa Interés:",
        value: `${parseFloat(linea.tasaInteres || 0).toFixed(2)}%`,
        col: 1,
      },
      {
        label: "Fecha Vencimiento:",
        value: formatearFecha(linea.fechaVencimiento, "-"),
        col: 2,
      },
      { label: "Estado:", value: linea.estado?.descripcion || "-", col: 1 },
    ];

    let yPosCol1 = yPos;
    let yPosCol2 = yPos;

    infoLinea.forEach((info) => {
      if (info.col === 1) {
        currentPage.drawText(info.label, {
          x: col1X,
          y: yPosCol1,
          size: 7.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(info.value, {
          x: col1X + 95,
          y: yPosCol1,
          size: 7.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        yPosCol1 -= lineSpacing;
      } else {
        currentPage.drawText(info.label, {
          x: col2X,
          y: yPosCol2,
          size: 7.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(info.value, {
          x: col2X + 110,
          y: yPosCol2,
          size: 7.5,
          font: fontNormal,
          color: rgb(0, 0, 0),
        });
        yPosCol2 -= lineSpacing;
      }
    });

    yPos = Math.min(yPosCol1, yPosCol2) - 12;

    // ========================================
    // SECCIÓN 3: SUBLÍNEAS DE CRÉDITO (TABLA)
    // ========================================
    const sublineas = linea.sublineas || [];

    if (sublineas.length > 0) {
      verificarEspacio(50);

      // Título de sublíneas
      currentPage.drawRectangle({
        x: margin,
        y: yPos - 14,
        width: contentWidth,
        height: 14,
        color: rgb(0.4, 0.6, 0.85),
      });

      currentPage.drawText("SUBLÍNEAS DE CRÉDITO", {
        x: margin + 5,
        y: yPos - 10,
        size: 8.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      yPos -= 18;

      // Headers de tabla de sublíneas (definir fuera del forEach)
      const subColWidths = [180, 70, 70, 70, 65, 35, 60];
      const subHeaders = [
        "Tipo Préstamo",
        "Asignado",
        "Utilizado",
        "Disponible",
        "Sobregiro",
        "% Util.",
        "Activo",
      ];

      // Datos de sublíneas
      sublineas.forEach((sublinea, subIndex) => {
        verificarEspacio(30);

        // ⭐ DIBUJAR CABECERA ANTES DE CADA SUBLÍNEA
        currentPage.drawRectangle({
          x: margin,
          y: yPos - 11,
          width: contentWidth,
          height: 11,
          color: rgb(0.68, 0.85, 0.9),
        });

        let xPos = margin + 2;
        subHeaders.forEach((header, index) => {
          const headerWidth = fontBold.widthOfTextAtSize(header, 6.5);
          const colWidth = subColWidths[index];
          const headerX = xPos + (colWidth - headerWidth) / 2;

          currentPage.drawText(header, {
            x: headerX,
            y: yPos - 8,
            size: 6.5,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
          xPos += colWidth;
        });

        // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER
        let lineX = margin;
        for (let i = 0; i <= subColWidths.length; i++) {
          currentPage.drawLine({
            start: { x: lineX, y: yPos - 11 },
            end: { x: lineX, y: yPos },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
          if (i < subColWidths.length) lineX += subColWidths[i];
        }

        yPos -= 11;

                // FILA DE DATOS DE LA SUBLÍNEA
        const montoAsignado = parseFloat(sublinea.montoAsignado || 0);
        const montoUtilizado = parseFloat(sublinea.montoUtilizado || 0);
        const montoDisponible = parseFloat(sublinea.montoDisponible || 0);
        const totalSobregiros = parseFloat(sublinea.totalSobregiros || 0);
        const montoTotal = montoAsignado + totalSobregiros;
        const porcentaje =
          montoTotal > 0
            ? ((montoUtilizado / montoTotal) * 100).toFixed(1)
            : "0.0";

        const bgColor = rgb(0.9, 0.98, 0.9); // Verde claro para todas las sublíneas
        currentPage.drawRectangle({
          x: margin,
          y: yPos - 11,
          width: contentWidth,
          height: 11,
          color: bgColor,
        });

        const subRowData = [
          {
            text: truncate(sublinea.tipoPrestamo?.descripcion || "-", 35),
            align: "left",
          },
          { text: formatearNumero(montoAsignado, 2), align: "right" },
          { text: formatearNumero(montoUtilizado, 2), align: "right" },
          { text: formatearNumero(montoDisponible, 2), align: "right" },
                   {
            text:
              totalSobregiros > 0 ? formatearNumero(totalSobregiros, 2) : "-",
            align: "right",
            color: totalSobregiros > 0 ? rgb(0.7, 0, 0) : rgb(0, 0, 0),
          },
          {
            text: porcentaje + "%",
            align: "right",
            color: parseFloat(porcentaje) > 90 ? rgb(0.7, 0, 0) : rgb(0, 0, 0),
          },
          { text: sublinea.activo ? "ACTIVO" : "INACTIVO", align: "center" },
        ];

        xPos = margin + 2;
        subRowData.forEach((item, index) => {
          const colWidth = subColWidths[index];
          const textColor = item.color || rgb(0, 0, 0);
          const textFont =
            item.color && item.color !== rgb(0, 0, 0) ? fontBold : fontNormal;

          let textX = xPos + 2;
          if (item.align === "right") {
            const textWidth = textFont.widthOfTextAtSize(item.text, 6);
            textX = xPos + colWidth - textWidth - 2;
          } else if (item.align === "center") {
            const textWidth = textFont.widthOfTextAtSize(item.text, 6);
            textX = xPos + (colWidth - textWidth) / 2;
          }

          currentPage.drawText(item.text, {
            x: textX,
            y: yPos - 8,
            size: 6,
            font: textFont,
            color: textColor,
          });
          xPos += colWidth;
        });

        // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA DE SUBLÍNEAS
        lineX = margin;
        for (let i = 0; i <= subColWidths.length; i++) {
          currentPage.drawLine({
            start: { x: lineX, y: yPos - 11 },
            end: { x: lineX, y: yPos },
            thickness: 0.3,
            color: rgb(0.8, 0.8, 0.8),
          });
          if (i < subColWidths.length) lineX += subColWidths[i];
        }

        yPos -= 11;

        // ========================================
        // SECCIÓN 4: PRÉSTAMOS DE LA SUBLÍNEA (EXPANDIDO)
        // ========================================
        const prestamos = sublinea.prestamos || [];

        if (prestamos.length > 0) {
          verificarEspacio(35);

          // Título de préstamos
          currentPage.drawRectangle({
            x: margin + 10,
            y: yPos - 11,
            width: contentWidth - 20,
            height: 11,
            color: rgb(0.5, 0.7, 0.9),
          });

          const prestamosTitulo = `Préstamos de Sublínea: ${truncate(sublinea.tipoPrestamo?.descripcion, 48)}`;
          currentPage.drawText(prestamosTitulo, {
            x: margin + 15,
            y: yPos - 8,
            size: 7,
            font: fontBold,
            color: rgb(1, 1, 1),
          });

          yPos -= 14;

          // Headers de tabla de préstamos
          const prestColWidths = [85, 70, 85, 80, 70, 122];
          const prestHeaders = [
            "Nº Préstamo",
            "Fecha Desemb.",
            "Monto Desemb.",
            "Saldo Capital",
            "Estado",
            "Observaciones",
          ];

          currentPage.drawRectangle({
            x: margin + 10,
            y: yPos - 9,
            width: contentWidth - 20,
            height: 9,
            color: rgb(0.75, 0.85, 0.95),
          });

          xPos = margin + 12;
          prestHeaders.forEach((header, index) => {
            const headerWidth = fontBold.widthOfTextAtSize(header, 5.5);
            const colWidth = prestColWidths[index];
            const headerX = xPos + (colWidth - headerWidth) / 2;

            currentPage.drawText(header, {
              x: headerX,
              y: yPos - 6.5,
              size: 5.5,
              font: fontBold,
              color: rgb(0, 0, 0),
            });
            xPos += colWidth;
          });

          // ⭐ LÍNEAS VERTICALES SEPARADORAS EN HEADER DE PRÉSTAMOS
          lineX = margin + 10;
          for (let i = 0; i <= prestColWidths.length; i++) {
            currentPage.drawLine({
              start: { x: lineX, y: yPos - 9 },
              end: { x: lineX, y: yPos },
              thickness: 0.5,
              color: rgb(0, 0, 0),
            });
            if (i < prestColWidths.length) lineX += prestColWidths[i];
          }

          yPos -= 9;

          // Datos de préstamos
          prestamos.forEach((prestamo, prestIndex) => {
            verificarEspacio(10);

            const prestBgColor =
              prestIndex % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1);
            currentPage.drawRectangle({
              x: margin + 10,
              y: yPos - 9,
              width: contentWidth - 20,
              height: 9,
              color: prestBgColor,
            });

            const prestRowData = [
              { text: truncate(prestamo.numeroPrestamo, 13), align: "left" },
              {
                text: formatearFecha(prestamo.fechaDesembolso, "-"),
                align: "center",
              },
              {
                text: formatearNumero(prestamo.montoDesembolsado || 0, 2),
                align: "right",
              },
              {
                text: formatearNumero(prestamo.saldoCapital || 0, 2),
                align: "right",
              },
              { text: truncate(prestamo.estado?.descripcion, 11), align: "center" },
              { text: truncate(prestamo.observaciones, 49), align: "left" },
            ];

            xPos = margin + 12;
            prestRowData.forEach((item, index) => {
              const colWidth = prestColWidths[index];

              let textX = xPos + 2;
              if (item.align === "right") {
                const textWidth = fontNormal.widthOfTextAtSize(item.text, 5.5);
                textX = xPos + colWidth - textWidth - 2;
              } else if (item.align === "center") {
                const textWidth = fontNormal.widthOfTextAtSize(item.text, 5.5);
                textX = xPos + (colWidth - textWidth) / 2;
              }

              currentPage.drawText(item.text, {
                x: textX,
                y: yPos - 6.5,
                size: 5.5,
                font: fontNormal,
                color: rgb(0, 0, 0),
              });
              xPos += colWidth;
            });

            // ⭐ LÍNEAS VERTICALES SEPARADORAS EN FILA DE PRÉSTAMOS
            lineX = margin + 10;
            for (let i = 0; i <= prestColWidths.length; i++) {
              currentPage.drawLine({
                start: { x: lineX, y: yPos - 9 },
                end: { x: lineX, y: yPos },
                thickness: 0.3,
                color: rgb(0.8, 0.8, 0.8),
              });
              if (i < prestColWidths.length) lineX += prestColWidths[i];
            }

            yPos -= 9;
          });

          // ========================================
          // TOTALES DE PRÉSTAMOS DE ESTA SUBLÍNEA
          // ========================================
          verificarEspacio(12);

          // Calcular totales de préstamos de esta sublínea
          let totalMontoDesembolsado = 0;
          let totalSaldoCapital = 0;
          prestamos.forEach((prestamo) => {
            totalMontoDesembolsado += parseFloat(prestamo.montoDesembolsado || 0);
            totalSaldoCapital += parseFloat(prestamo.saldoCapital || 0);
          });

          // Dibujar fila de totales
          currentPage.drawRectangle({
            x: margin + 10,
            y: yPos - 10,
            width: contentWidth - 20,
            height: 10,
            color: rgb(0.85, 0.92, 0.95),
          });

          // Texto "TOTALES:"
          currentPage.drawText("TOTALES:", {
            x: margin + 15,
            y: yPos - 7,
            size: 6,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          // Total Monto Desembolsado (columna 2, índice 2)
          const totalMontoText = formatearNumero(totalMontoDesembolsado, 2);
          const totalMontoWidth = fontBold.widthOfTextAtSize(totalMontoText, 6);
          let xPosTotal = margin + 12;
          for (let i = 0; i < 2; i++) {
            xPosTotal += prestColWidths[i];
          }
          currentPage.drawText(totalMontoText, {
            x: xPosTotal + prestColWidths[2] - totalMontoWidth - 2,
            y: yPos - 7,
            size: 6,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          // Total Saldo Capital (columna 3, índice 3)
          const totalSaldoText = formatearNumero(totalSaldoCapital, 2);
          const totalSaldoWidth = fontBold.widthOfTextAtSize(totalSaldoText, 6);
          xPosTotal += prestColWidths[2];
          currentPage.drawText(totalSaldoText, {
            x: xPosTotal + prestColWidths[3] - totalSaldoWidth - 2,
            y: yPos - 7,
            size: 6,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          yPos -= 10;

          yPos -= 5;
        }
      });

      // ========================================
      // SECCIÓN 5: TOTALES GENERALES DE PRÉSTAMOS
      // ========================================
      verificarEspacio(15);

      // Calcular totales sumando TODOS los préstamos de TODAS las sublíneas
      let totalGeneralMontoDesembolsado = 0;
      let totalGeneralSaldoCapital = 0;

      sublineas.forEach((sublinea) => {
        const prestamos = sublinea.prestamos || [];
        prestamos.forEach((prestamo) => {
          totalGeneralMontoDesembolsado += parseFloat(prestamo.montoDesembolsado || 0);
          totalGeneralSaldoCapital += parseFloat(prestamo.saldoCapital || 0);
        });
      });

      currentPage.drawRectangle({
        x: margin,
        y: yPos - 12,
        width: contentWidth,
        height: 12,
        color: rgb(0.85, 0.92, 0.95),
      });

      currentPage.drawText("TOTALES:", {
        x: margin + 5,
        y: yPos - 8,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      // Total General Monto Desembolsado (columna Asignado, índice 1)
      const totalGenMontoText = formatearNumero(totalGeneralMontoDesembolsado, 2);
      const totalGenMontoWidth = fontBold.widthOfTextAtSize(totalGenMontoText, 7);
      let xPosGen = margin + 2;
      for (let i = 0; i < 1; i++) {
        xPosGen += subColWidths[i];
      }
      currentPage.drawText(totalGenMontoText, {
        x: xPosGen + subColWidths[1] - totalGenMontoWidth - 2,
        y: yPos - 8,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      // Total General Saldo Capital (columna Utilizado, índice 2)
      const totalGenSaldoText = formatearNumero(totalGeneralSaldoCapital, 2);
      const totalGenSaldoWidth = fontBold.widthOfTextAtSize(totalGenSaldoText, 7);
      xPosGen = margin + 12 + subColWidths[0] + subColWidths[1]; // Recalcular posición desde el inicio
      currentPage.drawText(totalGenSaldoText, {
        x: xPosGen + subColWidths[2] - totalGenSaldoWidth - 2,
        y: yPos - 8,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 15;
    } else {
      // Sin sublíneas
      verificarEspacio(20);
      currentPage.drawText(
        "No hay sublíneas registradas para esta línea de crédito.",
        {
          x: margin + 5,
          y: yPos,
          size: 8,
          font: fontNormal,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
      yPos -= 15;
    }

    // Salto de página después de cada línea de crédito
    if (lineaIndex < itemsOrdenados.length - 1) {
      nuevaPagina();
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}