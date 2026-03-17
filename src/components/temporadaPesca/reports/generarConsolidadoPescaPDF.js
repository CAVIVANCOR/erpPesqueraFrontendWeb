// src/components/temporadaPesca/reports/generarConsolidadoPescaPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { obtenerPrecioVigente } from "../../../api/precioEntidad";

// Función para formatear toneladas con 4 decimales
const formatearToneladas = (valor) => {
  return Number(valor).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};
export async function generarConsolidadoPescaPDF(data) {
 const {
  temporada,
  descargas,
  faenas,
  detCuotaPescaAlquilada,
  detCuotaPescaPropia,
  baseLiquidacionReal,
  liqComisionPatronReal,
  liqComisionMotoristaReal,
  liqComisionPangueroReal,
  liqComisionAlquilerAdicional,
  fidelizacionPersonal,
  liqTripulantesPescaEstimado,
  liqTripulantesPescaReal,  // ⭐ AGREGAR ESTA LÍNEA
  totalIngresosCalculado,
} = data;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const celeste = rgb(0.68, 0.85, 0.9);
  const rojoClaro = rgb(1, 0.75, 0.8);
  const blanco = rgb(1, 1, 1);

  // Cargar logo
  let logoImage = null;
  if (temporada.empresa?.logo && temporada.empresa?.id) {
    try {
      const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${temporada.empresa.id}/logo`;
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        if (temporada.empresa.logo.toLowerCase().includes(".png")) {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
  }

  // ─── HELPER: dibujar encabezado completo ──────────────────────────────────
  const dibujarEncabezado = (page) => {
    const { width, height } = page.getSize();
    let yPos = height - 40;

    // Logo
    if (logoImage) {
      const logoDims = logoImage.size();
      const maxLogoWidth = 80;
      const finalWidth = maxLogoWidth;
      const finalHeight = maxLogoWidth / (logoDims.width / logoDims.height);
      page.drawImage(logoImage, {
        x: margin,
        y: yPos - finalHeight,
        width: finalWidth,
        height: finalHeight,
      });
    }

    // Empresa
    page.drawText(temporada.empresa?.razonSocial || "EMPRESA", {
      x: margin + 90,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
    page.drawText(`RUC: ${temporada.empresa?.ruc || "-"}`, {
      x: margin + 90,
      y: yPos,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPos -= 13;
    if (temporada.empresa?.direccion) {
      page.drawText(`Direccion: ${temporada.empresa.direccion}`, {
        x: margin + 90,
        y: yPos,
        size: 8,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
      yPos -= 13;
    }
    yPos -= 10;

    // Título del reporte
    const titulo = "REPORTE CONSOLIDADO PESCA INDUSTRIAL";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 11);
    page.drawText(titulo, {
      x: (width - tituloWidth) / 2,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 18;

    const nombreTemporada = temporada.nombre || "TEMPORADA";
    const nombreWidth = fontBold.widthOfTextAtSize(nombreTemporada, 14);
    page.drawText(nombreTemporada, {
      x: (width - nombreWidth) / 2,
      y: yPos,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    const zonaTexto = `ZONA: ${temporada.zona || ""}`;
    const zonaWidth = fontBold.widthOfTextAtSize(zonaTexto, 10);
    page.drawText(zonaTexto, {
      x: (width - zonaWidth) / 2,
      y: yPos,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;

    return yPos;
  };

  // ─── PÁGINA PRINCIPAL ──────────────────────────────────
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = dibujarEncabezado(page);
  const { width } = page.getSize();

  // ==================== SECCIÓN INGRESOS ====================
  // ✅ CORRECCIÓN 1: Centrar subtítulo INGRESOS
  const ingresosText = "INGRESOS";
  const ingresosWidth = fontBold.widthOfTextAtSize(ingresosText, 11);
  page.drawRectangle({
    x: margin,
    y: yPos - 3,
    width: width - 2 * margin,
    height: 20,
    color: celeste,
  });
  page.drawText(ingresosText, {
    x: margin + (width - 2 * margin - ingresosWidth) / 2,
    y: yPos,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  // 1. TABLA VENTA
  yPos = await dibujarTablaVenta(
    page,
    descargas,
    temporada,
    fontBold,
    fontNormal,
    margin,
    width,
    yPos,
  );

  // 2. TABLA BONIFICACION
  yPos = dibujarTablaBonificacion(
    page,
    descargas,
    fontBold,
    fontNormal,
    margin,
    width,
    yPos,
  );

  // 3. TABLA ALQUILER CUOTA
  yPos = dibujarTablaAlquiler(
    page,
    temporada,
    detCuotaPescaPropia,
    fontBold,
    fontNormal,
    margin,
    width,
    yPos,
  );

  // ==================== SECCIÓN EGRESOS ====================
  yPos -= 20;
  // ✅ CORRECCIÓN 1: Centrar subtítulo EGRESOS
  const egresosText = "EGRESOS";
  const egresosWidth = fontBold.widthOfTextAtSize(egresosText, 11);
  page.drawRectangle({
    x: margin,
    y: yPos - 3,
    width: width - 2 * margin,
    height: 20,
    color: rojoClaro,
  });
  page.drawText(egresosText, {
    x: margin + (width - 2 * margin - egresosWidth) / 2,
    y: yPos,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  // TABLA EGRESOS
  yPos = dibujarTablaEgresos(
    page,
    {
      faenas,
      detCuotaPescaAlquilada,
      liqTripulantesPescaEstimado,
      liqTripulantesPescaReal,
      totalIngresosCalculado,
      baseLiquidacionReal,
      liqComisionPatronReal,
      liqComisionMotoristaReal,
      liqComisionPangueroReal,
      liqComisionAlquilerAdicional,
      fidelizacionPersonal,
      temporada,
    },
    fontBold,
    fontNormal,
    margin,
    width,
    yPos,
  );

  // ==================== TOTALES FINALES ====================
  const totalIngresos = await calcularTotalIngresos(
    descargas,
    temporada,
    detCuotaPescaPropia,
  );
  const totalEgresos = calcularTotalEgresos({
  liqTripulantesPescaReal,  // ⭐ AGREGAR ESTA LÍNEA
  totalIngresosCalculado,
  liqComisionPatronReal,
  liqComisionMotoristaReal,
  liqComisionPangueroReal,
  detCuotaPescaAlquilada,
  liqComisionAlquilerAdicional,
  fidelizacionPersonal,
  temporada,  // ⭐ AGREGAR ESTA LÍNEA (ya se usa en línea 1458)
});
  const saldoFinal = totalIngresos - totalEgresos;

  yPos -= 30;
  dibujarTotalesFinales(
    page,
    totalIngresos,
    totalEgresos,
    saldoFinal,
    fontBold,
    fontNormal,
    margin,
    width,
    yPos,
  );

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

// ==================== FUNCIONES AUXILIARES ====================

// ✅ CORRECCIONES 2, 3, 4: Tabla VENTA con precioEntidad
async function dibujarTablaVenta(
  page,
  descargas,
  temporada,
  fontBold,
  fontNormal,
  margin,
  width,
  yPos,
) {
  page.drawText("VENTA", {
    x: margin,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  const headers = [
    "CLIENTE",
    "PRODUCTO",
    "V.UNIT X TON",
    "TONELADAS",
    "V.VENTA TOTAL",
  ];
  const colWidths = [120, 150, 80, 80, 85];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = margin;
  let xPos = tableStartX;

  // Header con fondo celeste
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  headers.forEach((header, i) => {
    const hw = fontBold.widthOfTextAtSize(header, 8);
    page.drawText(header, {
      x: xPos + (colWidths[i] - hw) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales header
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
  yPos -= 20;

  // ✅ CORRECCIÓN DEFINITIVA: Seguir el patrón exacto del código que funciona

  // Paso 1: Iterar cada descarga y obtener su precio individual
  const descargasConPrecio = [];

  for (const descarga of descargas) {
    const { clienteId, especieId, toneladas, fechaHoraInicioDescarga } =
      descarga;
    // Obtener precio vigente PARA CADA DESCARGA
    let precioData = null;
    try {
      precioData = await obtenerPrecioVigente(
        temporada.empresaId,
        temporada.empresa.entidadComercialId,
        especieId,
        clienteId || null,
        fechaHoraInicioDescarga,
      );
    } catch (e) {
      console.error("❌ Error al obtener precio vigente:", e);
    }

    const clienteNombre =
      descarga.cliente?.razonSocial ||
      descarga.cliente?.nombreComercial ||
      "SIN CLIENTE";
    const productoNombre =
      precioData?.producto?.descripcionArmada ||
      descarga.especie?.nombre ||
      "SIN PRODUCTO";
    const precioUnitario = Number(precioData?.precioUnitario || 0);

    const item = {
      clienteId: clienteId,
      clienteNombre: clienteNombre,
      productoNombre: productoNombre,
      toneladas: Number(toneladas || 0),
      precioUnitario: precioUnitario,
      total: Number(toneladas || 0) * precioUnitario,
    };

    descargasConPrecio.push(item);
  }
  // Paso 2: Agrupar por cliente + producto para mostrar en el PDF
  const ventasAgrupadas = {};
  descargasConPrecio.forEach((item) => {
    const key = `${item.clienteId}|${item.clienteNombre}|${item.productoNombre}`;
    if (!ventasAgrupadas[key]) {
      ventasAgrupadas[key] = {
        cliente: item.clienteNombre,
        producto: item.productoNombre,
        toneladas: 0,
        precioUnitario: item.precioUnitario, // Usar el precio de la primera descarga del grupo
        total: 0,
      };
    }
    ventasAgrupadas[key].toneladas += item.toneladas;
    ventasAgrupadas[key].total += item.total;
  });

  let totalVenta = 0;
  let totalToneladas = 0;
  Object.values(ventasAgrupadas).forEach((venta) => {
    // Fondo blanco
    page.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    xPos = tableStartX;

    // Cliente (izquierda)
    page.drawText(venta.cliente.substring(0, 25), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[0];

    // Producto (izquierda)
    page.drawText(venta.producto.substring(0, 30), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[1];

    // Precio (derecha)
    const precioText = formatearNumero(venta.precioUnitario);
    const precioWidth = fontNormal.widthOfTextAtSize(precioText, 7);
    page.drawText(precioText, {
      x: xPos + colWidths[2] - precioWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[2];

    // Toneladas (derecha) - 4 decimales
    const tonText = formatearToneladas(venta.toneladas);
    const tonWidth = fontNormal.widthOfTextAtSize(tonText, 7);
    page.drawText(tonText, {
      x: xPos + colWidths[3] - tonWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[3];

    // Total (derecha)
    const totalText = formatearNumero(venta.total);
    const totalWidth = fontNormal.widthOfTextAtSize(totalText, 7);
    page.drawText(totalText, {
      x: xPos + colWidths[4] - totalWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales
    lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }
    page.drawLine({
      start: { x: tableStartX, y: yPos - 2 },
      end: { x: tableStartX + tableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    totalVenta += venta.total;
    totalToneladas += venta.toneladas;
    yPos -= 18;
  });

  // Fila TOTAL
  yPos -= 5;
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  const totalLabel = "TOTAL";
  const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
  page.drawText(totalLabel, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      (colWidths[2] - totalLabelWidth) / 2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Toneladas
  const totalTonText = formatearToneladas(totalToneladas);
  const totalTonWidth = fontBold.widthOfTextAtSize(totalTonText, 8);
  page.drawText(totalTonText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] -
      totalTonWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Venta
  const totalVentaText = formatearNumero(totalVenta);
  const totalVentaWidth = fontBold.widthOfTextAtSize(totalVentaText, 8);
  page.drawText(totalVentaText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] +
      colWidths[4] -
      totalVentaWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Líneas verticales total
  lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }
  yPos -= 25;

  return yPos;
}

// ✅ CORRECCIÓN 5: Tabla BONIFICACION con descargas
function dibujarTablaBonificacion(
  page,
  descargas,
  fontBold,
  fontNormal,
  margin,
  width,
  yPos,
) {
  page.drawText("BONIFICACION DE PESCA", {
    x: margin,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  const headers = ["CLIENTE", "V.UNIT X TON", "TONELADAS", "V.VENTA TOTAL"];
  const colWidths = [200, 100, 100, 115];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = margin;
  let xPos = tableStartX;

  // Header
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  headers.forEach((header, i) => {
    const hw = fontBold.widthOfTextAtSize(header, 8);
    page.drawText(header, {
      x: xPos + (colWidths[i] - hw) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales header
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
  yPos -= 20;

  // ✅ CORRECCIÓN 5: Agrupar descargas por clienteId
  const bonificacionesAgrupadas = {};
  descargas.forEach((descarga) => {
    const clienteId = descarga.clienteId;
    const clienteNombre = descarga.cliente?.razonSocial || "SIN CLIENTE";

    if (!bonificacionesAgrupadas[clienteId]) {
      bonificacionesAgrupadas[clienteId] = {
        cliente: clienteNombre,
        toneladas: 0,
        precioUnitario: Number(descarga.precioPorTonComisionFidelizacion || 0),
        total: 0,
      };
    }
    const toneladas = Number(descarga.toneladas || 0);
    const precio = Number(descarga.precioPorTonComisionFidelizacion || 0);
    bonificacionesAgrupadas[clienteId].toneladas += toneladas;
    bonificacionesAgrupadas[clienteId].total += toneladas * precio;
  });

  let totalBonificacion = 0;
  let totalToneladas = 0;
  Object.values(bonificacionesAgrupadas).forEach((bonif) => {
    // Fondo blanco
    page.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    xPos = tableStartX;

    // Cliente (izquierda)
    page.drawText(bonif.cliente.substring(0, 40), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[0];

    // Precio (derecha)
    const precioText = formatearNumero(bonif.precioUnitario);
    const precioWidth = fontNormal.widthOfTextAtSize(precioText, 7);
    page.drawText(precioText, {
      x: xPos + colWidths[1] - precioWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[1];

    // Toneladas (derecha) - 4 decimales
    const tonText = formatearToneladas(bonif.toneladas);
    const tonWidth = fontNormal.widthOfTextAtSize(tonText, 7);
    page.drawText(tonText, {
      x: xPos + colWidths[2] - tonWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[2];
    // Total (derecha)
    const totalText = formatearNumero(bonif.total);
    const totalWidth = fontNormal.widthOfTextAtSize(totalText, 7);
    page.drawText(totalText, {
      x: xPos + colWidths[3] - totalWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales
    lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }
    page.drawLine({
      start: { x: tableStartX, y: yPos - 2 },
      end: { x: tableStartX + tableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    totalBonificacion += bonif.total;
    totalToneladas += bonif.toneladas;
    yPos -= 18;
  });

  // Fila TOTAL
  yPos -= 5;
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  const totalLabel = "TOTAL";
  const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
  page.drawText(totalLabel, {
    x: tableStartX + colWidths[0] + (colWidths[1] - totalLabelWidth) / 2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Toneladas
  const totalTonText = formatearToneladas(totalToneladas);
  const totalTonWidth = fontBold.widthOfTextAtSize(totalTonText, 8);
  page.drawText(totalTonText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] -
      totalTonWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Total Bonificación
  const totalBonifText = formatearNumero(totalBonificacion);
  const totalBonifWidth = fontBold.widthOfTextAtSize(totalBonifText, 8);
  page.drawText(totalBonifText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] -
      totalBonifWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }
  yPos -= 25;

  return yPos;
}

// ✅ CORRECCIONES 6 y 7: Tabla ALQUILER CUOTA con DetCuotaPesca
function dibujarTablaAlquiler(
  page,
  temporada,
  detCuotaPescaPropia,
  fontBold,
  fontNormal,
  margin,
  width,
  yPos,
) {
  // ✅ CORRECCIÓN 6: Título dinámico
  const nombreCuota = temporada.zona === "NORTE" ? "CUOTA SUR" : "CUOTA NORTE";
  page.drawText(`ALQUILER ${nombreCuota}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;

  const headers = ["CLIENTE", "V.UNIT X TON", "TONELADAS", "V.VENTA TOTAL"];
  const colWidths = [200, 100, 100, 115];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = margin;
  let xPos = tableStartX;

  // Header
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  headers.forEach((header, i) => {
    const hw = fontBold.widthOfTextAtSize(header, 8);
    page.drawText(header, {
      x: xPos + (colWidths[i] - hw) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales header
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
  yPos -= 20;

  // ✅ CORRECCIÓN 6 y 7: Usar datos de detCuotaPescaPropia
  let ingresosPorAlquilerCuota = 0;

  if (detCuotaPescaPropia) {
    const clienteNombre =
      detCuotaPescaPropia.entidadEmpresarial?.razonSocial || "SIN CLIENTE";
    const precioAlquiler = Number(detCuotaPescaPropia.precioPorTonDolares || 0);
    // ✅ CORRECCIÓN 7: Calcular toneladas
    const toneladas =
      Number(temporada.limiteMaximoCapturaTn || 0) *
      (Number(detCuotaPescaPropia.porcentajeCuota || 0) / 100);
    ingresosPorAlquilerCuota = toneladas * precioAlquiler;

    // Fondo blanco
    page.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    xPos = tableStartX;

    // Cliente (izquierda)
    page.drawText(clienteNombre.substring(0, 40), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[0];

    // Precio (derecha)
    const precioText = formatearNumero(precioAlquiler);
    const precioWidth = fontNormal.widthOfTextAtSize(precioText, 7);
    page.drawText(precioText, {
      x: xPos + colWidths[1] - precioWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[1];

    // Toneladas (derecha)
    const tonText = formatearNumero(toneladas);
    const tonWidth = fontNormal.widthOfTextAtSize(tonText, 7);
    page.drawText(tonText, {
      x: xPos + colWidths[2] - tonWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[2];

    // Total (derecha)
    const totalText = formatearNumero(ingresosPorAlquilerCuota);
    const totalWidth = fontNormal.widthOfTextAtSize(totalText, 7);
    page.drawText(totalText, {
      x: xPos + colWidths[3] - totalWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales
    lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }
    page.drawLine({
      start: { x: tableStartX, y: yPos - 2 },
      end: { x: tableStartX + tableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 18;
  } else {
    // Fondo blanco para fila vacía
    page.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    const ceroText = formatearNumero(0);
    const ceroWidth = fontNormal.widthOfTextAtSize(ceroText, 7);
    page.drawText(ceroText, {
      x:
        tableStartX +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] -
        ceroWidth -
        2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales
    lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }
    page.drawLine({
      start: { x: tableStartX, y: yPos - 2 },
      end: { x: tableStartX + tableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 18;
  }

  // Fila TOTAL
  yPos -= 5;
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  const totalLabel = "TOTAL";
  const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
  page.drawText(totalLabel, {
    x: tableStartX + colWidths[0] + (colWidths[1] - totalLabelWidth) / 2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalAlqText = formatearNumero(ingresosPorAlquilerCuota);
  const totalAlqWidth = fontBold.widthOfTextAtSize(totalAlqText, 8);
  page.drawText(totalAlqText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] -
      totalAlqWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }
  yPos -= 25;

  return yPos;
}

// ✅ CORRECCIONES 8, 9, 10, 11: Tabla EGRESOS completa
function dibujarTablaEgresos(
  page,
  datos,
  fontBold,
  fontNormal,
  margin,
  width,
  yPos,
) {
  const {
  faenas,
  detCuotaPescaAlquilada,
  liqTripulantesPescaEstimado,
  liqTripulantesPescaReal,  // ⭐ AGREGAR ESTA LÍNEA
  totalIngresosCalculado,
  liqComisionPatronReal,
  liqComisionMotoristaReal,
  liqComisionPangueroReal,
  liqComisionAlquilerAdicional,
  fidelizacionPersonal,
  temporada,
} = datos;

  const headers = ["EMBARCACIÓN", "CONCEPTO", "DESCRIPCIÓN", "IMPORTE US$"];
  const colWidths = [100, 120, 180, 115];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableStartX = margin;
  let xPos = tableStartX;

  // Header
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  headers.forEach((header, i) => {
    const hw = fontBold.widthOfTextAtSize(header, 8);
    page.drawText(header, {
      x: xPos + (colWidths[i] - hw) / 2,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[i];
  });

  // Líneas verticales header
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
  yPos -= 20;

  // ✅ CORRECCIÓN 8: Obtener embarcación de primera faena
  const primeraFaena =
    faenas && faenas.length > 0 ? faenas.sort((a, b) => a.id - b.id)[0] : null;
  const nombreEmbarcacion =
    primeraFaena?.embarcacion?.activo?.nombre || "SIN EMBARCACION";
  const nombrePatron = primeraFaena
    ? `${primeraFaena.patron?.nombres || ""} ${primeraFaena.patron?.apellidos || ""}`.trim()
    : "NOMBRE PATRON";
  const nombreMotorista = primeraFaena
    ? `${primeraFaena.motorista?.nombres || ""} ${primeraFaena.motorista?.apellidos || ""}`.trim()
    : "NOMBRE MOTORISTA";
  const nombrePanguero = primeraFaena
    ? `${primeraFaena.panguero?.nombres || ""} ${primeraFaena.panguero?.apellidos || ""}`.trim()
    : "NOMBRE PANGUERO";

  // ✅ CORRECCIÓN 9: Obtener datos de DetCuotaPesca alquilada
  const nombreEmbarcacionAlquiler =
    detCuotaPescaAlquilada?.nombre || "SIN EMBARCACION";
  const beneficiarioAlquiler =
    detCuotaPescaAlquilada?.entidadEmpresarial?.razonSocial ||
    "NOMBRE BENEFICIARIO";
  const comisionistaAlquiler =
    detCuotaPescaAlquilada?.entidadComercialComisionista?.razonSocial ||
    "NOMBRE COMISIONISTA";
  const importeAlquiler = detCuotaPescaAlquilada
    ? Number(temporada.limiteMaximoCapturaTn || 0) *
      (Number(detCuotaPescaAlquilada.porcentajeCuota || 0) / 100) *
      Number(detCuotaPescaAlquilada.precioPorTonDolares || 0)
    : 0;

  const egresos = [
    {
      embarcacion: nombreEmbarcacion,
      concepto: "LIQUIDACION TRIPULANTES",
      descripcion: `${Number(liqTripulantesPescaEstimado || 0)} TRIPULANTES`,
      importe: Number(liqTripulantesPescaReal || 0), // ✅ USAR liqTripulantesPescaReal
    },
    {
      embarcacion: nombreEmbarcacion,
      concepto: "COMISION PATRON",
      // ✅ CORRECCIÓN 11: Usar nombre de FaenaPesca.patron
      descripcion: nombrePatron,
      // ✅ CORRECCIÓN 11: Usar liqComisionPatronReal
      importe: Number(liqComisionPatronReal || 0),
    },
    {
      embarcacion: nombreEmbarcacion,
      concepto: "COMISION MOTORISTA",
      // ✅ CORRECCIÓN 11: Usar nombre de FaenaPesca.motorista
      descripcion: nombreMotorista,
      // ✅ CORRECCIÓN 11: Usar liqComisionMotoristaReal
      importe: Number(liqComisionMotoristaReal || 0),
    },
    {
      embarcacion: nombreEmbarcacion,
      concepto: "COMISION PANGUERO",
      // ✅ CORRECCIÓN 11: Usar nombre de FaenaPesca.panguero
      descripcion: nombrePanguero,
      // ✅ CORRECCIÓN 11: Usar liqComisionPangueroReal
      importe: Number(liqComisionPangueroReal || 0),
    },
    {
      // ✅ CORRECCIÓN 9: Usar DetCuotaPesca.nombre
      embarcacion: nombreEmbarcacionAlquiler,
      concepto: "ALQUILER CUOTA",
      // ✅ CORRECCIÓN 9: Usar DetCuotaPesca.entidadEmpresarial.razonSocial
      descripcion: beneficiarioAlquiler,
      importe: importeAlquiler,
    },
    {
      // ✅ CORRECCIÓN 9: Usar DetCuotaPesca.nombre
      embarcacion: nombreEmbarcacionAlquiler,
      concepto: "COMISION ALQUILER CUOTA",
      // ✅ CORRECCIÓN 9: Usar DetCuotaPesca.entidadComercialComisionista.razonSocial
      descripcion: comisionistaAlquiler,
      importe: Number(liqComisionAlquilerAdicional || 0),
    },
    {
      embarcacion: nombreEmbarcacion,
      concepto: "DISTRIBUCION BONIFICACION DE PESCA",
      descripcion: "AL PERSONAL",
      importe: Number(fidelizacionPersonal || 0),
    },
  ];

  let totalEgresos = 0;
  egresos.forEach((egreso) => {
    // Fondo blanco
    page.drawRectangle({
      x: tableStartX,
      y: yPos - 2,
      width: tableWidth,
      height: 18,
      color: rgb(1, 1, 1),
    });

    xPos = tableStartX;

    // Embarcación (izquierda)
    page.drawText(egreso.embarcacion.substring(0, 20), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[0];

    // Concepto (izquierda)
    page.drawText(egreso.concepto.substring(0, 25), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[1];

    // Descripción (izquierda)
    page.drawText(egreso.descripcion.substring(0, 35), {
      x: xPos + 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    xPos += colWidths[2];

    // Importe (derecha)
    const importeText = formatearNumero(egreso.importe);
    const importeWidth = fontNormal.widthOfTextAtSize(importeText, 7);
    page.drawText(importeText, {
      x: xPos + colWidths[3] - importeWidth - 2,
      y: yPos + 3,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Líneas verticales
    lineX = tableStartX;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: lineX, y: yPos + 16 },
        end: { x: lineX, y: yPos - 2 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
      if (i < colWidths.length) lineX += colWidths[i];
    }
    page.drawLine({
      start: { x: tableStartX, y: yPos - 2 },
      end: { x: tableStartX + tableWidth, y: yPos - 2 },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });

    totalEgresos += egreso.importe;
    yPos -= 18;
  });

  // Fila TOTAL
  yPos -= 5;
  page.drawRectangle({
    x: tableStartX,
    y: yPos - 3,
    width: tableWidth,
    height: 20,
    color: rgb(0.68, 0.85, 0.9),
  });
  const totalLabel = "TOTAL";
  const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 8);
  page.drawText(totalLabel, {
    x: tableStartX + colWidths[0] + (colWidths[1] - totalLabelWidth) / 2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const totalEgrText = formatearNumero(totalEgresos);
  const totalEgrWidth = fontBold.widthOfTextAtSize(totalEgrText, 8);
  page.drawText(totalEgrText, {
    x:
      tableStartX +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] -
      totalEgrWidth -
      2,
    y: yPos,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  lineX = tableStartX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: lineX, y: yPos - 3 },
      end: { x: lineX, y: yPos + 17 },
      thickness: 0.5,
      color: rgb(0.5, 0.7, 0.8),
    });
    if (i < colWidths.length) lineX += colWidths[i];
  }

  return yPos;
}

function dibujarTotalesFinales(
  page,
  totalIngresos,
  totalEgresos,
  saldoFinal,
  fontBold,
  fontNormal,
  margin,
  width,
  yPos,
) {
  const colWidth = 150;
  const xLabel = width - margin - colWidth - 100;
  const xValue = width - margin - colWidth;

  // Total Ingresos
  page.drawText("Total Ingresos US$", {
    x: xLabel,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const ingresosText = formatearNumero(totalIngresos);
  const ingresosWidth = fontNormal.widthOfTextAtSize(ingresosText, 9);
  page.drawText(ingresosText, {
    x: xValue + colWidth - ingresosWidth,
    y: yPos,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPos -= 15;

  // Total Egresos
  page.drawText("Total Egresos US$", {
    x: xLabel,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const egresosText = formatearNumero(totalEgresos);
  const egresosWidth = fontNormal.widthOfTextAtSize(egresosText, 9);
  page.drawText(egresosText, {
    x: xValue + colWidth - egresosWidth,
    y: yPos,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPos -= 15;

  // Saldo Final
  page.drawText("Saldo Final US$", {
    x: xLabel,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const saldoText = formatearNumero(saldoFinal);
  const saldoWidth = fontBold.widthOfTextAtSize(saldoText, 9);
  page.drawText(saldoText, {
    x: xValue + colWidth - saldoWidth,
    y: yPos,
    size: 9,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
  });
}

// Helpers para calcular totales
async function calcularTotalIngresos(
  descargas,
  temporada,
  detCuotaPescaPropia,
) {
  let totalVenta = 0;
  let totalBonificacion = 0;
  let totalAlquiler = 0;

  // Calcular total venta
  for (const descarga of descargas) {
    let precioEntidad = null;
    try {
      precioEntidad = await obtenerPrecioVigente(
        temporada.empresaId,
        temporada.empresa.entidadComercialId,
        descarga.especieId,
        descarga.clienteId || null,
        descarga.fechaHoraInicioDescarga,
      );
    } catch (e) {
      console.warn("No se pudo obtener precio vigente:", e);
    }
    const precioUnitario = Number(precioEntidad?.precioUnitario || 0);
    const toneladas = Number(descarga.toneladas || 0);
    totalVenta += toneladas * precioUnitario;
  }

  // Calcular total bonificación
  descargas.forEach((descarga) => {
    const toneladas = Number(descarga.toneladas || 0);
    const precio = Number(descarga.precioPorTonComisionFidelizacion || 0);
    totalBonificacion += toneladas * precio;
  });

  // Calcular total alquiler
  if (detCuotaPescaPropia) {
    const precioAlquiler = Number(detCuotaPescaPropia.precioPorTonDolares || 0);
    const toneladas =
      Number(temporada.limiteMaximoCapturaTn || 0) *
      (Number(detCuotaPescaPropia.porcentajeCuota || 0) / 100);
    totalAlquiler = toneladas * precioAlquiler;
  }

  return totalVenta + totalBonificacion + totalAlquiler;
}

function calcularTotalEgresos(datos) {
  const {
  liqTripulantesPescaReal,  // ⭐ AGREGAR ESTA LÍNEA
  totalIngresosCalculado,
  liqComisionPatronReal,
  liqComisionMotoristaReal,
  liqComisionPangueroReal,
  detCuotaPescaAlquilada,
  liqComisionAlquilerAdicional,
  fidelizacionPersonal,
  temporada,  // ⭐ AGREGAR ESTA LÍNEA
} = datos;

  const importeAlquiler = detCuotaPescaAlquilada
    ? Number(datos.temporada?.limiteMaximoCapturaTn || 0) *
      (Number(detCuotaPescaAlquilada.porcentajeCuota || 0) / 100) *
      Number(detCuotaPescaAlquilada.precioPorTonDolares || 0)
    : 0;

  return (
  Number(liqTripulantesPescaReal || 0) +  // ✅ USAR liqTripulantesPescaReal
  Number(liqComisionPatronReal || 0) +
  Number(liqComisionMotoristaReal || 0) +
  Number(liqComisionPangueroReal || 0) +
  importeAlquiler +
  Number(liqComisionAlquilerAdicional || 0) +
  Number(fidelizacionPersonal || 0)
);
}
