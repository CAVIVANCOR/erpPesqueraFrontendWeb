// src/components/temporadaPesca/reports/generarReportePescaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDFHeaderHelper } from "./pdfHeaderHelper.js";

/**
 * Función helper para generar todas las fechas entre dos fechas
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Array<Date>} Array de fechas
 */
function generarRangoFechas(fechaInicio, fechaFin) {
  const fechas = [];
  const fechaActual = new Date(fechaInicio);
  fechaActual.setHours(0, 0, 0, 0);

  const fechaLimite = new Date(fechaFin);
  fechaLimite.setHours(0, 0, 0, 0);

  while (fechaActual <= fechaLimite) {
    fechas.push(new Date(fechaActual));
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return fechas;
}

/**
 * Función helper para comparar si dos fechas son del mismo día
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {boolean}
 */
function esMismoDia(fecha1, fecha2) {
  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);
  return (
    f1.getFullYear() === f2.getFullYear() &&
    f1.getMonth() === f2.getMonth() &&
    f1.getDate() === f2.getDate()
  );
}

export async function generarReportePescaPDF(data) {
  const { temporada, cuotas, descargas, diasSinFaena = [] } = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const headerHelper = new PDFHeaderHelper(pdfDoc, fontBold, fontNormal);
  await headerHelper.cargarLogo(temporada.empresa);

  const margin = 40;
  let paginas = [];

  // Calcular totales
  let totalLimiteTon = 0;
  cuotas.forEach((cuota) => {
    totalLimiteTon += Number(cuota.limiteToneladas || 0);
  });

  const avanceTotal = descargas
    ? descargas.reduce((sum, d) => sum + Number(d.toneladas || 0), 0)
    : 0;

  // Primera página
  let page = pdfDoc.addPage([595.28, 841.89]);
  paginas.push(page);
  let { width, height } = page.getSize();

  // Encabezado completo en primera página
  let yPosition = headerHelper.dibujarEncabezadoCompleto(
    page,
    temporada,
    cuotas,
    totalLimiteTon,
    avanceTotal,
  );

  // Función helper para dibujar headers de tabla de descarga
  const dibujarHeadersDescarga = (
    pg,
    yPos,
    descargaColWidths,
    descargaHeaders,
    descargaTableWidth,
    descargaTableStartX,
  ) => {
    pg.drawRectangle({
      x: descargaTableStartX,
      y: yPos - 3,
      width: descargaTableWidth,
      height: 20,
      color: rgb(0.72, 0.87, 0.97),
    });

    let xPos = descargaTableStartX;
    descargaHeaders.forEach((header, i) => {
      const headerWidth = fontBold.widthOfTextAtSize(header, 7);
      const textX = xPos + (descargaColWidths[i] - headerWidth) / 2;
      pg.drawText(header, {
        x: textX,
        y: yPos,
        size: 7,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      xPos += descargaColWidths[i];
    });

    let lineX = descargaTableStartX;
    for (let i = 0; i <= descargaColWidths.length; i++) {
      pg.drawLine({
        start: { x: lineX, y: yPos - 3 },
        end: { x: lineX, y: yPos + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < descargaColWidths.length) lineX += descargaColWidths[i];
    }

    return yPos - 20;
  };

  // DETALLE DE DESCARGA
  if (yPosition < 180) {
    page = pdfDoc.addPage([595.28, 841.89]);
    paginas.push(page);
    yPosition = headerHelper.dibujarEncabezadoCompleto(
      page,
      temporada,
      cuotas,
      totalLimiteTon,
      avanceTotal,
    );
  }

  const detalleTexto = "DETALLE DE DESCARGA EN TONELADAS";
  const detalleWidth = fontBold.widthOfTextAtSize(detalleTexto, 10);
  page.drawText(detalleTexto, {
    x: (width - detalleWidth) / 2,
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

  // ⭐ NUEVA LÓGICA: Generar array agrupado por faena (carga inicial + descargas + días sin faena)
  let registrosCompletos = [];

  const { faenas } = data;

  // ⭐ PASO 1: Agrupar descargas por faenaPescaId
  const descargasPorFaena = {};
  if (descargas && descargas.length > 0) {
    descargas.forEach((descarga) => {
      const faenaId = descarga.faenaPescaId;
      if (!descargasPorFaena[faenaId]) {
        descargasPorFaena[faenaId] = [];
      }
      descargasPorFaena[faenaId].push(descarga);
    });
  }

  // ⭐ PASO 2: Ordenar faenas por fechaSalida (ascendente - más antigua primero)
  const faenasOrdenadas =
    faenas && faenas.length > 0
      ? [...faenas].sort((a, b) => {
          const fechaA = a.fechaSalida ? new Date(a.fechaSalida) : new Date(0);
          const fechaB = b.fechaSalida ? new Date(b.fechaSalida) : new Date(0);
          return fechaA - fechaB;
        })
      : [];

  // ⭐ PASO 3: Para cada faena, agregar carga inicial (si existe) + sus descargas
  if (faenasOrdenadas.length > 0) {
    faenasOrdenadas.forEach((faena) => {
      // 3.1: Agregar carga inicial si tiene combustible > 0
      if (
        faena.combustibleAbastecidoGalones &&
        Number(faena.combustibleAbastecidoGalones) > 0
      ) {
        registrosCompletos.push({
          tipo: "cargaInicial",
          fecha: faena.fechaSalida
            ? new Date(faena.fechaSalida)
            : new Date(temporada.fechaInicio),
          data: faena,
          faenaId: faena.id, // ⭐ Para referencia
        });
      }

      // 3.2: Agregar descargas de esta faena (ordenadas por fecha)
      const descargasDeFaena = descargasPorFaena[faena.id] || [];
      if (descargasDeFaena.length > 0) {
        // Ordenar descargas por fechaHoraInicioDescarga
        const descargasOrdenadas = [...descargasDeFaena].sort((a, b) => {
          const fechaA = a.fechaHoraInicioDescarga
            ? new Date(a.fechaHoraInicioDescarga)
            : new Date(0);
          const fechaB = b.fechaHoraInicioDescarga
            ? new Date(b.fechaHoraInicioDescarga)
            : new Date(0);
          return fechaA - fechaB;
        });

        descargasOrdenadas.forEach((descarga) => {
          registrosCompletos.push({
            tipo: "descarga",
            fecha: descarga.fechaHoraInicioDescarga
              ? new Date(descarga.fechaHoraInicioDescarga)
              : new Date(),
            data: descarga,
            faenaId: faena.id, // ⭐ Para referencia
          });
        });
      }
    });
  }

  // ⭐ PASO 4: Agregar días sin faena (si existen y tienen rango de fechas)
  if (
    temporada.fechaInicio &&
    temporada.fechaFin &&
    diasSinFaena &&
    diasSinFaena.length > 0
  ) {
    const todasLasFechas = generarRangoFechas(
      new Date(temporada.fechaInicio),
      new Date(temporada.fechaFin),
    );

    todasLasFechas.forEach((fecha) => {
      // Buscar si hay día sin faena en esta fecha
      const diaSinFaena = diasSinFaena.find(
        (dsf) => dsf.fecha && esMismoDia(dsf.fecha, fecha),
      );

      if (diaSinFaena) {
        // Verificar que no haya descarga en esta fecha
        const hayDescargaEnFecha =
          descargas &&
          descargas.some(
            (d) =>
              d.fechaHoraInicioDescarga &&
              esMismoDia(d.fechaHoraInicioDescarga, fecha),
          );

        if (!hayDescargaEnFecha) {
          registrosCompletos.push({
            tipo: "sinFaena",
            fecha: fecha,
            data: diaSinFaena,
          });
        }
      }
    });
  }

  if (registrosCompletos.length > 0) {
    const cuotaColWidths = [25, 55, 65, 150, 60, 70, 65, 65];
    const cuotaTableWidth = cuotaColWidths.reduce((a, b) => a + b, 0);
    const cuotaTableStartX = (width - cuotaTableWidth) / 2;

    const descargaColWidths = [15, 70, 50, 90, 65, 70, 50, 40, 40, 40, 35];
    const descargaHeaders = [
      "N°",
      "Fecha I/D",
      "Especie",
      "Cliente",
      "Puerto",
      "Plataforma",
      "Observaciones",
      "Reporte",
      "Petroleo/Gal",
      "Toneladas",
      "%Juvenil",
    ];
    const descargaTableWidth = descargaColWidths.reduce((a, b) => a + b, 0);
    const descargaTableStartX = cuotaTableStartX;

    if (yPosition < 180) {
      page = pdfDoc.addPage([595.28, 841.89]);
      paginas.push(page);
      yPosition = headerHelper.dibujarEncabezadoCompleto(
        page,
        temporada,
        cuotas,
        totalLimiteTon,
        avanceTotal,
      );
    }

    // Dibujar headers iniciales
    yPosition = dibujarHeadersDescarga(
      page,
      yPosition,
      descargaColWidths,
      descargaHeaders,
      descargaTableWidth,
      descargaTableStartX,
    );

    registrosCompletos.forEach((registro, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        paginas.push(page);
        yPosition = headerHelper.dibujarEncabezadoCompleto(
          page,
          temporada,
          cuotas,
          totalLimiteTon,
          avanceTotal,
        );

        const detTxt = "DETALLE DE DESCARGA EN TN";
        const detW = fontBold.widthOfTextAtSize(detTxt, 10);
        page.drawText(detTxt, {
          x: (width - detW) / 2,
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
        yPosition = dibujarHeadersDescarga(
          page,
          yPosition,
          descargaColWidths,
          descargaHeaders,
          descargaTableWidth,
          descargaTableStartX,
        );
      }

      let rowData;

      if (registro.tipo === "descarga") {
        const descarga = registro.data;
        const fechaInicioDescarga = descarga.fechaHoraInicioDescarga
          ? new Date(descarga.fechaHoraInicioDescarga).toLocaleString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-";
        const especieNombre = descarga.especie?.nombre || "-";
        const clienteNombre =
          descarga.cliente?.razonSocial || descarga.cliente?.nombre || "-";
        const puertoNombre = descarga.puertoDescarga?.nombre || "-";
        const plataforma = descarga.numPlataformaDescarga || "-";
        const observaciones = descarga.observaciones || "-";
        const reporte = descarga.numReporteRecepcion || "-";
        const combustible = descarga.combustibleAbastecidoGalones
          ? Number(descarga.combustibleAbastecidoGalones).toLocaleString(
              "es-PE",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 },
            )
          : "-";
        const toneladasFormateadas = Number(
          descarga.toneladas || 0,
        ).toLocaleString("es-PE", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        });
        const porcentajeJuveniles = descarga.porcentajeJuveniles
          ? Number(descarga.porcentajeJuveniles).toFixed(2) + "%"
          : "-";

        rowData = [
          (index + 1).toString(),
          fechaInicioDescarga,
          especieNombre,
          clienteNombre,
          puertoNombre,
          plataforma,
          observaciones,
          reporte,
          combustible,
          toneladasFormateadas,
          porcentajeJuveniles,
        ];
      } else if (registro.tipo === "cargaInicial") {
        // ⭐ NUEVA FILA: Carga inicial de petróleo
        const faena = registro.data;
        const fechaSalida = faena.fechaSalida
          ? new Date(faena.fechaSalida).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "-";
        const combustibleInicial = Number(
          faena.combustibleAbastecidoGalones,
        ).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        rowData = [
          (index + 1).toString(),
          fechaSalida, // ⭐ Fecha de salida (sin hora)
          "-",
          "-",
          "-",
          "-",
          "Petroleo INI", // ⭐ Observaciones
          "-",
          combustibleInicial, // ⭐ Petroleo/Gal
          "-",
          "-",
        ];
      } else {
        // ⭐ Día sin faena
        const diaSinFaena = registro.data;
        const fechaSinFaena =
          new Date(diaSinFaena.fecha).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }) + " -"; // Agregar " -" para mantener formato consistente
        const motivoDescripcion =
          diaSinFaena.motivoSinFaena?.descripcion || "SIN FAENA";
        const observacionesDia = diaSinFaena.observaciones || "-";

        rowData = [
          (index + 1).toString(),
          fechaSinFaena,
          "-",
          motivoDescripcion, // ⭐ Motivo en columna Cliente
          "-",
          "-",
          observacionesDia, // ⭐ Observaciones en columna Observaciones
          "-",
          "-",
          "-",
          "-",
        ];
      }

      const bgColor = index % 2 === 0 ? rgb(0.95, 0.97, 0.98) : rgb(1, 1, 1);
      page.drawRectangle({
        x: descargaTableStartX,
        y: yPosition - 2,
        width: descargaTableWidth,
        height: 18,
        color: bgColor,
      });

      let xPos = descargaTableStartX;
      rowData.forEach((value, i) => {
        let displayValue = value;
        const maxWidth = descargaColWidths[i] - 4;

        // ⭐ NO recortar texto para columnas Cliente (3) y Observaciones (6) cuando es día sin faena
        const esColumnaClienteOObservaciones = i === 3 || i === 6;
        const esDiaSinFaena = registro.tipo === "sinFaena";

        if (!esColumnaClienteOObservaciones || !esDiaSinFaena) {
          // Solo recortar si NO es día sin faena O NO es columna Cliente/Observaciones
          while (
            fontNormal.widthOfTextAtSize(displayValue, 6.5) > maxWidth &&
            displayValue.length > 3
          ) {
            displayValue = displayValue.substring(0, displayValue.length - 1);
          }
          if (displayValue !== value && displayValue.length > 3) {
            displayValue =
              displayValue.substring(0, displayValue.length - 3) + "...";
          }
        }

        let textX;
        // ⭐ Fecha (columna 1) SIEMPRE alineada a la izquierda
        if (i === 1) {
          textX = xPos + 2; // Alineación izquierda para TODAS las fechas
        } else if (i === 0 || i === 7 || i === 8 || i === 9 || i === 10) {
          const textWidth = fontNormal.widthOfTextAtSize(displayValue, 6.5);
          textX = xPos + descargaColWidths[i] - textWidth - 2;
        } else {
          textX = xPos + 2;
        }

        // ⭐ Usar negrita y color específico según tipo de registro
        const esCargaInicial = registro.tipo === "cargaInicial";
        const fontToUse =
          esDiaSinFaena || esCargaInicial ? fontBold : fontNormal;
        const colorToUse = esDiaSinFaena
          ? rgb(0.6, 0, 0) // Rojo oscuro para días sin faena
          : esCargaInicial
            ? rgb(0.0, 0.5, 0.0) // Verde oscuro para carga inicial
            : rgb(0, 0, 0); // Negro para descargas normales

        page.drawText(displayValue, {
          x: textX,
          y: yPosition + 3,
          size: 6.5,
          font: fontToUse,
          color: colorToUse,
        });
        xPos += descargaColWidths[i];
      });

      let lineX = descargaTableStartX;
      for (let i = 0; i <= descargaColWidths.length; i++) {
        page.drawLine({
          start: { x: lineX, y: yPosition + 16 },
          end: { x: lineX, y: yPosition - 2 },
          thickness: 0.3,
          color: rgb(0.8, 0.8, 0.8),
        });
        if (i < descargaColWidths.length) lineX += descargaColWidths[i];
      }

      page.drawLine({
        start: { x: descargaTableStartX, y: yPosition - 2 },
        end: { x: descargaTableStartX + descargaTableWidth, y: yPosition - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= 18;
    });

    // Calcular totales solo de descargas
    const totalToneladas = descargas
      ? descargas.reduce((sum, d) => sum + Number(d.toneladas || 0), 0)
      : 0;

    // ⭐ Calcular total de galones: descargas + combustible inicial de faena
    let totalGalones = descargas
      ? descargas.reduce(
          (sum, d) => sum + Number(d.combustibleAbastecidoGalones || 0),
          0,
        )
      : 0;

    // ⭐ Sumar combustible inicial de TODAS las faenas que tengan combustible
    if (faenas && faenas.length > 0) {
      const faenasConCombustible = faenas.filter(
        (f) =>
          f.combustibleAbastecidoGalones &&
          Number(f.combustibleAbastecidoGalones) > 0,
      );
      faenasConCombustible.forEach((faena) => {
        totalGalones += Number(faena.combustibleAbastecidoGalones);
      });
    }
    yPosition -= 5;

    // Fila TOTALES con fondo celeste
    page.drawRectangle({
      x: descargaTableStartX,
      y: yPosition - 3,
      width: descargaTableWidth,
      height: 20,
      color: rgb(0.72, 0.87, 0.97),
    });

    // "TOTALES" centrado bajo columna Observaciones (índice 6)
    const xInicioObs = descargaColWidths.slice(0, 6).reduce((a, b) => a + b, 0);
    const totalesLabel = "TOTALES";
    const totalesLabelWidth = fontBold.widthOfTextAtSize(totalesLabel, 8);
    page.drawText(totalesLabel, {
      x:
        descargaTableStartX +
        xInicioObs +
        (descargaColWidths[6] - totalesLabelWidth) / 2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Total galones alineado a la derecha bajo columna "Petroleo Gal." (índice 8)
    const totalGalonesText = totalGalones.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const totalGalonesWidth = fontBold.widthOfTextAtSize(totalGalonesText, 8);
    const xInicioGalones = descargaColWidths
      .slice(0, 8)
      .reduce((a, b) => a + b, 0);
    page.drawText(totalGalonesText, {
      x:
        descargaTableStartX +
        xInicioGalones +
        descargaColWidths[8] -
        totalGalonesWidth -
        2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Total toneladas alineado a la derecha bajo columna "Toneladas" (índice 9)
    const totalToneladasText = totalToneladas.toLocaleString("es-PE", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    const totalToneladasWidth = fontBold.widthOfTextAtSize(
      totalToneladasText,
      8,
    );
    const xInicioTon = descargaColWidths.slice(0, 9).reduce((a, b) => a + b, 0);
    page.drawText(totalToneladasText, {
      x:
        descargaTableStartX +
        xInicioTon +
        descargaColWidths[9] -
        totalToneladasWidth -
        2,
      y: yPosition,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales de la fila TOTALES
    let lineXTot = descargaTableStartX;
    for (let i = 0; i <= descargaColWidths.length; i++) {
      page.drawLine({
        start: { x: lineXTot, y: yPosition - 3 },
        end: { x: lineXTot, y: yPosition + 17 },
        thickness: 0.5,
        color: rgb(0.5, 0.7, 0.8),
      });
      if (i < descargaColWidths.length) lineXTot += descargaColWidths[i];
    }
  } else {
    page.drawText("No hay descargas registradas para esta temporada", {
      x: margin,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Numeración de páginas
  const totalPaginas = paginas.length;
  paginas.forEach((pag, index) => {
    const paginaTexto = `Página ${index + 1} de ${totalPaginas}`;
    const paginaWidth = fontNormal.widthOfTextAtSize(paginaTexto, 9);

    pag.drawRectangle({
      x: pag.getSize().width - margin - 100,
      y: pag.getSize().height - 35,
      width: 100,
      height: 15,
      color: rgb(1, 1, 1),
    });

    pag.drawText(paginaTexto, {
      x: pag.getSize().width - margin - paginaWidth,
      y: pag.getSize().height - 30,
      size: 9,
      font: fontNormal,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
