/**
 * InformeFaenaPDF.js
 * Generador de PDF para Informe de Faena de Pesca Consumo
 * Formato oficial PRODUCE ANEXO N°02 - Resolución Ministerial
 *
 * @author ERP Megui
 * @version 2.0.0 - Múltiples páginas por especie
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF del Informe de Faena y lo sube al servidor
 * @param {Object} faena - Datos de la faena
 * @param {Array} calas - Calas de la faena (debe incluir especiesPescadas)
 * @param {Object} embarcacion - Datos de la embarcación
 * @param {Object} novedad - Datos de la novedad
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFInformeFaena(
  faena,
  calas,
  embarcacion,
  novedad,
) {
    try {
    // Extraer detCalas de la primera cala (según schema: 1 FaenaPescaConsumo → 1 CalaFaenaConsumo)
    const cala = calas && calas.length > 0 ? calas[0] : null;
    const detCalas = cala?.especiesPescadas || [];
    if (detCalas.length === 0) {
      throw new Error("No hay especies capturadas para generar el PDF");
    }
    // 1. Generar el PDF con múltiples páginas
    const pdfBytes = await generarPDFInformeFaena(
      faena,
      cala,
      detCalas,
      embarcacion,
      novedad,
    );
    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    // 3. Crear FormData - El backend generará el nombre automáticamente
    const formData = new FormData();
    formData.append("files", blob, "temp.pdf");
    formData.append("moduleName", "faena-pesca-consumo");
    formData.append("entityId", faena.id);

    // 4. Subir al servidor usando endpoint estandarizado
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
 * Genera el PDF del Informe de Faena con formato oficial PRODUCE
 * GENERA UNA PÁGINA POR CADA DetCalaPescaConsumo (especie capturada)
 * 
 * @param {Object} faena - Datos de la faena
 * @param {Object} cala - Cala de la faena
 * @param {Array} detCalas - DetCalaPescaConsumo[] - Especies capturadas
 * @param {Object} embarcacion - Datos de la embarcación
 * @param {Object} novedad - Datos de la novedad (incluye numeroResolucion)
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFInformeFaena(faena, cala, detCalas, embarcacion, novedad) {
  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const totalPaginas = detCalas.length;

  // GENERAR UNA PÁGINA POR CADA ESPECIE
  for (let i = 0; i < detCalas.length; i++) {
    const detCala = detCalas[i];
    const paginaActual = i + 1;

    await generarPaginaPorEspecie(
      pdfDoc,
      fontBold,
      fontNormal,
      faena,
      cala,
      detCala,
      embarcacion,
      novedad,
      paginaActual,
      totalPaginas
    );
  }

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Genera una página del PDF para una especie específica
 */
async function generarPaginaPorEspecie(
  pdfDoc,
  fontBold,
  fontNormal,
  faena,
  cala,
  detCala,
  embarcacion,
  novedad,
  paginaActual,
  totalPaginas
) {
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - 40;

  // ==================== ENCABEZADO ====================

  // TÍTULO PRINCIPAL
  page.drawText("ANEXO N°02", {
    x: width / 2 - 45,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  // SUBTÍTULO DINÁMICO CON ESPECIE - Texto justificado
  const nombreEspecie = detCala.especie?.nombre || "Especie no especificada";
  const nombreCientifico = detCala.especie?.nombreCientifico || "";
  const numeroResolucion = novedad?.numeroResolucion || "00000-0000-PRODUCE";

  // Armar el texto completo del subtítulo
  const textoSubtitulo = `Formato de Reporte de Calas y Desembarque del recurso ${nombreEspecie.toUpperCase()} (${nombreCientifico.toUpperCase()}) en concordancia con la Resolución Ministerial N°${numeroResolucion}`;

  // Dividir el texto en líneas que quepan en el ancho disponible
  const maxWidth = width - 2 * margin - 20;
  const palabras = textoSubtitulo.split(' ');
  const lineas = [];
  let lineaActual = '';

  palabras.forEach((palabra) => {
    const lineaTest = lineaActual ? `${lineaActual} ${palabra}` : palabra;
    const anchoLinea = fontNormal.widthOfTextAtSize(lineaTest, 9);
    
    if (anchoLinea <= maxWidth) {
      lineaActual = lineaTest;
    } else {
      if (lineaActual) lineas.push(lineaActual);
      lineaActual = palabra;
    }
  });
  if (lineaActual) lineas.push(lineaActual);

  // Dibujar cada línea justificada
  lineas.forEach((linea) => {
    page.drawText(linea, {
      x: margin + 10,
      y: yPosition,
      size: 9,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= 12;
  });

  yPosition -= 13; // Espacio adicional después del subtítulo

  // ==================== TABLA 1: DATOS DE EMBARCACIÓN ====================

  const tableWidth = width - 2 * margin;
  const rowHeight = 25;

  const col1Width = 245;
  const col2Width = 155;
  const col3Width = tableWidth - col1Width - col2Width;

  // Fila 1: Encabezados
  page.drawRectangle({
    x: margin,
    y: yPosition - rowHeight,
    width: col1Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText("Nombre de la embarcación", {
    x: margin + 5,
    y: yPosition - 15,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + col1Width,
    y: yPosition - rowHeight,
    width: col2Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText("Matrícula:", {
    x: margin + col1Width + 5,
    y: yPosition - 15,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + col1Width + col2Width,
    y: yPosition - rowHeight,
    width: col3Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText("Cap. Bod. (m³)", {
    x: margin + col1Width + col2Width + 5,
    y: yPosition - 15,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= rowHeight;

  // Fila 2: Datos vacíos
  page.drawRectangle({
    x: margin,
    y: yPosition - rowHeight,
    width: col1Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawRectangle({
    x: margin + col1Width,
    y: yPosition - rowHeight,
    width: col2Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawRectangle({
    x: margin + col1Width + col2Width,
    y: yPosition - rowHeight,
    width: col3Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  yPosition -= rowHeight + 10;

  // ==================== SECCIÓN PUERTO DE ZARPE ====================

  const boxSize = 10;

  page.drawText("Puerto de zarpe:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("Fecha", {
    x: margin + 120,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("Hora", {
    x: margin + 230,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("Tipo de Arte:", {
    x: margin + 320,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Recuadro Puerto de zarpe
  page.drawRectangle({
    x: margin,
    y: yPosition - 18,
    width: 100,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Recuadro Fecha con divisiones
  const fechaX = margin + 120;
  const fechaWidth = 90;
  page.drawRectangle({
    x: fechaX,
    y: yPosition - 18,
    width: fechaWidth,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  page.drawLine({
    start: { x: fechaX + 30, y: yPosition - 18 },
    end: { x: fechaX + 30, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: fechaX + 60, y: yPosition - 18 },
    end: { x: fechaX + 60, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  

  // Recuadro Hora con divisiones
  const horaX = margin + 230;
  const horaWidth = 70;
  page.drawRectangle({
    x: horaX,
    y: yPosition - 18,
    width: horaWidth,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  page.drawLine({
    start: { x: horaX + 35, y: yPosition - 18 },
    end: { x: horaX + 35, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  

  // Checkboxes Tipo de Arte
  const checkX1 = margin + 400;
  page.drawRectangle({
    x: checkX1,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Cerco", {
    x: checkX1 + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  const checkX2 = checkX1 + 55;
  page.drawRectangle({
    x: checkX2,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Cortina", {
    x: checkX2 + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  const checkX3 = checkX2 + 60;
  page.drawRectangle({
    x: checkX3,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Otros", {
    x: checkX3 + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  // ==================== SECCIÓN PUERTO DE ARRIBO ====================

  page.drawText("Puerto de Arribo:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("Otras artes:", {
    x: margin + 320,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: margin + 385, y: yPosition - 3 },
    end: { x: width - margin, y: yPosition - 3 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Recuadro Puerto de Arribo
  page.drawRectangle({
    x: margin,
    y: yPosition - 18,
    width: 100,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Recuadro Fecha Puerto de Arribo
  page.drawRectangle({
    x: fechaX,
    y: yPosition - 18,
    width: fechaWidth,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  page.drawLine({
    start: { x: fechaX + 30, y: yPosition - 18 },
    end: { x: fechaX + 30, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: fechaX + 60, y: yPosition - 18 },
    end: { x: fechaX + 60, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  

  // Recuadro Hora Puerto de Arribo
  page.drawRectangle({
    x: horaX,
    y: yPosition - 18,
    width: horaWidth,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  page.drawLine({
    start: { x: horaX + 35, y: yPosition - 18 },
    end: { x: horaX + 35, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Largo de la red
  page.drawText("Largo de la red (Brazas):", {
    x: margin + 320,
    y: yPosition - 5,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: margin + 430, y: yPosition - 8 },
    end: { x: width - margin, y: yPosition - 8 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Alto de la red
  page.drawText("Alto de la (Brazas):", {
    x: margin + 320,
    y: yPosition,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: margin + 410, y: yPosition - 3 },
    end: { x: width - margin, y: yPosition - 3 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPosition -= 10;

  // Tamaño de la malla
  page.drawText("Tamaño de la malla", {
    x: margin + 320,
    y: yPosition,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: margin + 410, y: yPosition - 3 },
    end: { x: width - margin, y: yPosition - 3 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPosition -= 10;

  // N° Anzuelos
  page.drawText("N° Anzuelos", {
    x: margin + 320,
    y: yPosition,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: margin + 380, y: yPosition - 3 },
    end: { x: width - margin, y: yPosition - 3 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  // ==================== CAPTURA ESTIMADA Y ELECCIÓN DE ZONA ====================

  page.drawText("Captura estimada total (ton):", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: margin + 145, y: yPosition - 3 },
    end: { x: margin + 260, y: yPosition - 3 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  page.drawText("ELECCIÓN DE LA ZONA DE PESCA", {
    x: margin + 320,
    y: yPosition + 5,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Sistema de Refrigeración
  page.drawText("Sistema de Refrigeración:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Encabezados de columnas
  page.drawText("VISUAL", {
    x: margin + 320,
    y: yPosition,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("EQUIPOS", {
    x: margin + 400,
    y: yPosition,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("DECISIÓN", {
    x: margin + 480,
    y: yPosition,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Checkboxes Sistema Refrigeración
  page.drawRectangle({
    x: margin,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("No tiene", {
    x: margin + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + 120,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Cajas con Hielo", {
    x: margin + 135,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes VISUAL - Saltadera
  page.drawRectangle({
    x: margin + 320,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Saltadera", {
    x: margin + 335,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes EQUIPOS - Ecosonda
  page.drawRectangle({
    x: margin + 400,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Ecosonda", {
    x: margin + 415,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes DECISIÓN - Esp. Patrón
  page.drawRectangle({
    x: margin + 480,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Esp. Patrón", {
    x: margin + 495,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Modalidad de Trabajo
  page.drawText("Modalidad de Trabajo:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Checkboxes VISUAL - Radar
  page.drawRectangle({
    x: margin + 320,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Radar", {
    x: margin + 335,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes EQUIPOS - Sonar
  page.drawRectangle({
    x: margin + 400,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Sonar", {
    x: margin + 415,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes DECISIÓN - Lanchada
  page.drawRectangle({
    x: margin + 480,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Lanchada", {
    x: margin + 495,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Checkboxes Modalidad - Mixto
  page.drawRectangle({
    x: margin,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Mixto", {
    x: margin + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + 120,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Manual", {
    x: margin + 135,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes VISUAL - Aves
  page.drawRectangle({
    x: margin + 320,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Aves", {
    x: margin + 335,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Checkboxes Modalidad - Macaco
  page.drawRectangle({
    x: margin,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Macaco", {
    x: margin + 15,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes VISUAL - Mamíferos
  page.drawRectangle({
    x: margin + 320,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Mamíferos", {
    x: margin + 335,
    y: yPosition - 3,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  // ==================== TABLA DE CALAS ====================

  const calasRowHeight = 18;
  const calasTableWidth = width - 2 * margin;

  const calaColWidth = 28;
  const fechaHoraColWidth = 75;
  const posicionColWidth = 130;
  const especiesColWidth =
    calasTableWidth - calaColWidth - fechaHoraColWidth - posicionColWidth;

  let currentX = margin;

  // Encabezado principal de tabla
  page.drawRectangle({
    x: margin,
    y: yPosition - calasRowHeight,
    width: calasTableWidth,
    height: calasRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Cala
  page.drawText("Cala", {
    x: currentX + 5,
    y: yPosition - 12,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentX += calaColWidth;

  // Fecha y hora
  page.drawText("Fecha y hora", {
    x: currentX + 10,
    y: yPosition - 12,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentX += fechaHoraColWidth;

  // Posición geográfica
  page.drawText("Posición geográfica o Lugar de", {
    x: currentX + 2,
    y: yPosition - 8,
    size: 6.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("referencia", {
    x: currentX + 30,
    y: yPosition - 15,
    size: 6.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentX += posicionColWidth;

  // Especies Capturadas
  page.drawText("Especies Capturadas por cala", {
    x: currentX + 25,
    y: yPosition - 12,
    size: 6.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= calasRowHeight;

  // Sub-encabezados
  currentX = margin + calaColWidth + fechaHoraColWidth;

  // Latitud (S)
  page.drawRectangle({
    x: currentX,
    y: yPosition - 15,
    width: posicionColWidth / 2,
    height: 15,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Latitud (S)", {
    x: currentX + 12,
    y: yPosition - 10,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Longitud (W)
  page.drawRectangle({
    x: currentX + posicionColWidth / 2,
    y: yPosition - 15,
    width: posicionColWidth / 2,
    height: 15,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Longitud (W)", {
    x: currentX + posicionColWidth / 2 + 8,
    y: yPosition - 10,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentX += posicionColWidth;

  // Especies
  const especiesWidth = especiesColWidth * 0.4;
  page.drawRectangle({
    x: currentX,
    y: yPosition - 15,
    width: especiesWidth,
    height: 15,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Especies", {
    x: currentX + 20,
    y: yPosition - 10,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Peso (ton)
  const pesoWidth = especiesColWidth * 0.32;
  page.drawRectangle({
    x: currentX + especiesWidth,
    y: yPosition - 15,
    width: pesoWidth,
    height: 15,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Peso (ton)", {
    x: currentX + especiesWidth + 8,
    y: yPosition - 10,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Talla Media (cm)
  const tallaWidth = especiesColWidth - especiesWidth - pesoWidth;
  page.drawRectangle({
    x: currentX + especiesWidth + pesoWidth,
    y: yPosition - 15,
    width: tallaWidth,
    height: 15,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Talla Media (cm)", {
    x: currentX + especiesWidth + pesoWidth + 5,
    y: yPosition - 10,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  // Filas de datos (8 calas)
  for (let i = 1; i <= 8; i++) {
    currentX = margin;

    // Número de cala
    page.drawRectangle({
      x: currentX,
      y: yPosition - calasRowHeight * 2,
      width: calaColWidth,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText(String(i), {
      x: currentX + 10,
      y: yPosition - 20,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    currentX += calaColWidth;

    // Fecha y hora - Inicio
    page.drawRectangle({
      x: currentX,
      y: yPosition - calasRowHeight,
      width: fechaHoraColWidth,
      height: calasRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText("Inicio", {
      x: currentX + 5,
      y: yPosition - 12,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Fecha y hora - Final
    page.drawRectangle({
      x: currentX,
      y: yPosition - calasRowHeight * 2,
      width: fechaHoraColWidth,
      height: calasRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText("Final", {
      x: currentX + 5,
      y: yPosition - 30,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    currentX += fechaHoraColWidth;

    // Latitud
    page.drawRectangle({
      x: currentX,
      y: yPosition - calasRowHeight * 2,
      width: posicionColWidth / 2,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // Longitud
    page.drawRectangle({
      x: currentX + posicionColWidth / 2,
      y: yPosition - calasRowHeight * 2,
      width: posicionColWidth / 2,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    currentX += posicionColWidth;

    // Especies
    page.drawRectangle({
      x: currentX,
      y: yPosition - calasRowHeight * 2,
      width: especiesWidth,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // Peso
    page.drawRectangle({
      x: currentX + especiesWidth,
      y: yPosition - calasRowHeight * 2,
      width: pesoWidth,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // Talla Media
    page.drawRectangle({
      x: currentX + especiesWidth + pesoWidth,
      y: yPosition - calasRowHeight * 2,
      width: tallaWidth,
      height: calasRowHeight * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    yPosition -= calasRowHeight * 2;
  }

  yPosition -= 20;

  // ==================== FIRMA ====================

  page.drawText("Firma del armador o representante", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 12;

  page.drawText("Nombres y Apellidos:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 12;

  page.drawText("DNI:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // ==================== NÚMERO DE PÁGINA ====================
  
  const numeroPagina = `${paginaActual} de ${totalPaginas} Pag.`;
  const anchoPagina = fontNormal.widthOfTextAtSize(numeroPagina, 8);
  page.drawText(numeroPagina, {
    x: width - margin - anchoPagina,
    y: 100,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // ==================== PIE DE PÁGINA ====================

  const footerText1 =
    "Esta es una copia autenticada imprimible de un documento electrónico archivado por el MINISTERIO DE LA PRODUCCIÓN, aplicando lo";
  const footerText2 =
    "dispuesto por el Art. 25 del D.S. 070-2013- PCM y la Tercera Disposición Complementaria Final del D.S. 026-2016-PCM. Su autenticidad e";
  const footerText3 =
    'integridad pueden ser contrastadas a través de la siguiente dirección web: "https://edocumentostramite.produce.gob.pe/verificar/" e ingresar clave:';
  const footerText4 = "MN02LUDU";

  page.drawText(footerText1, {
    x: margin,
    y: 80,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawText(footerText2, {
    x: margin,
    y: 72,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawText(footerText3, {
    x: margin,
    y: 64,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawText(footerText4, {
    x: margin,
    y: 56,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(
    "Calle Uno Oeste N° 060 - Urbanización Corpac - San Isidro - Lima",
    {
      x: margin,
      y: 40,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    },
  );

  page.drawText("T. (511) 616 2222", {
    x: margin,
    y: 32,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawText("www.gob.pe/produce", {
    x: margin,
    y: 24,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
}