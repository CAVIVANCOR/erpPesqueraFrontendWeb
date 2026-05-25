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
    // Validar que haya calas
    if (!calas || calas.length === 0) {
      throw new Error("No hay calas registradas para generar el PDF");
    }
    
    // 1. Generar el PDF (UNA SOLA PÁGINA por FaenaPescaConsumo)
    const pdfBytes = await generarPDFInformeFaena(
      faena,
      calas,
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
 * GENERA UNA SOLA PÁGINA por FaenaPescaConsumo
 * 
 * @param {Object} faena - Datos de la faena
 * @param {Array} calas - Array de CalaFaenaConsumo (con especiesPescadas)
 * @param {Object} embarcacion - Datos de la embarcación
 * @param {Object} novedad - Datos de la novedad (incluye numeroResolucion)
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFInformeFaena(faena, calas, embarcacion, novedad) {
  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // GENERAR UNA SOLA PÁGINA POR FAENA
  await generarPaginaFaena(
    pdfDoc,
    fontBold,
    fontNormal,
    faena,
    calas,
    embarcacion,
    novedad
  );

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Formatea una fecha en componentes separados para el PDF
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {Object} - {dia, mes, anio, hora, minutos}
 */
function formatearFechaHora(fecha) {
  if (!fecha) {
    return { dia: "", mes: "", anio: "", hora: "", minutos: "" };
  }
  
  const fechaObj = new Date(fecha);
  return {
    dia: fechaObj.getDate().toString().padStart(2, '0'),
    mes: (fechaObj.getMonth() + 1).toString().padStart(2, '0'),
    anio: fechaObj.getFullYear().toString(),
    hora: fechaObj.getHours().toString().padStart(2, '0'),
    minutos: fechaObj.getMinutes().toString().padStart(2, '0')
  };
}

/**
 * Genera la página del PDF para una FaenaPescaConsumo completa
 */
async function generarPaginaFaena(
  pdfDoc,
  fontBold,
  fontNormal,
  faena,
  calas,
  embarcacion,
  novedad
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

  // OBTENER TODAS LAS ESPECIES ÚNICAS DE TODAS LAS CALAS
  const especiesUnicas = new Map();
  calas.forEach(cala => {
    cala.especiesPescadas?.forEach(detCala => {
      if (detCala.especie && !especiesUnicas.has(detCala.especieId)) {
        especiesUnicas.set(detCala.especieId, {
          nombre: detCala.especie.nombre,
          nombreCientifico: detCala.especie.nombreCientifico || ""
        });
      }
    });
  });

  // CONSTRUIR TEXTO DE ESPECIES PARA EL SUBTÍTULO
  const arrayEspecies = Array.from(especiesUnicas.values());
  let textoEspecies = "";
  
  if (arrayEspecies.length === 0) {
    textoEspecies = "recursos no especificados";
  } else if (arrayEspecies.length === 1) {
    const esp = arrayEspecies[0];
    textoEspecies = `recurso ${esp.nombre.toUpperCase()} (${esp.nombreCientifico.toUpperCase()})`;
  } else {
    const nombresEspecies = arrayEspecies.map((esp, idx) => {
      const texto = `${esp.nombre.toUpperCase()} (${esp.nombreCientifico.toUpperCase()})`;
      if (idx === arrayEspecies.length - 1) {
        return `y ${texto}`;
      }
      return texto;
    });
    textoEspecies = `recursos ${nombresEspecies.join(", ")}`;
  }

  const numeroResolucion = novedad?.numeroResolucion || "00000-0000-PRODUCE";
  const textoSubtitulo = `Formato de Reporte de Calas y Desembarque de los ${textoEspecies} en concordancia con la Resolución Ministerial N°${numeroResolucion}`;

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

  // Fila 2: Datos de la embarcación
  const nombreEmbarcacion = embarcacion?.activo?.nombre || "";
  const matricula = embarcacion?.matricula || "";
  const capacidadBodega = embarcacion?.capacidadBodegaTon ? String(embarcacion.capacidadBodegaTon) : "";

  page.drawRectangle({
    x: margin,
    y: yPosition - rowHeight,
    width: col1Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText(nombreEmbarcacion, {
    x: margin + 5,
    y: yPosition - 15,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + col1Width,
    y: yPosition - rowHeight,
    width: col2Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText(matricula, {
    x: margin + col1Width + 5,
    y: yPosition - 15,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: margin + col1Width + col2Width,
    y: yPosition - rowHeight,
    width: col3Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText(capacidadBodega, {
    x: margin + col1Width + col2Width + 5,
    y: yPosition - 15,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
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

  // Datos de Puerto de Zarpe
  const puertoZarpe = faena?.puertoSalida?.nombre || "";
  const fechaSalida = formatearFechaHora(faena?.fechaSalida);

  // Recuadro Puerto de zarpe
  page.drawRectangle({
    x: margin,
    y: yPosition - 18,
    width: 100,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText(puertoZarpe, {
    x: margin + 3,
    y: yPosition - 12,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
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
  
  // Líneas divisorias de fecha
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
  
  // Día
  page.drawText(fechaSalida.dia, {
    x: fechaX + 8,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Mes
  page.drawText(fechaSalida.mes, {
    x: fechaX + 38,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Año
  page.drawText(fechaSalida.anio, {
    x: fechaX + 65,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
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
  
  // Hora
  page.drawText(fechaSalida.hora, {
    x: horaX + 10,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Minutos
  page.drawText(fechaSalida.minutos, {
    x: horaX + 45,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  // Checkboxes Tipo de Arte
  const checkX1 = margin + 320;
  page.drawRectangle({
    x: checkX1,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  // Marcar checkbox Cerco con X
  page.drawText("X", {
    x: checkX1 + 2,
    y: yPosition - 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
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

  // Datos de Puerto de Arribo
  const puertoArribo = faena?.puertoDescarga?.nombre || "";
  const fechaDescarga = formatearFechaHora(faena?.fechaDescarga);

  // Recuadro Puerto de Arribo
  page.drawRectangle({
    x: margin,
    y: yPosition - 18,
    width: 100,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText(puertoArribo, {
    x: margin + 3,
    y: yPosition - 12,
    size: 7,
    font: fontNormal,
    color: rgb(0, 0, 0),
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
  
  // Día
  page.drawText(fechaDescarga.dia, {
    x: fechaX + 8,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Mes
  page.drawText(fechaDescarga.mes, {
    x: fechaX + 38,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Año
  page.drawText(fechaDescarga.anio, {
    x: fechaX + 65,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
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
  
  // Hora
  page.drawText(fechaDescarga.hora, {
    x: horaX + 10,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Minutos
  page.drawText(fechaDescarga.minutos, {
    x: horaX + 45,
    y: yPosition - 12,
    size: 8,
    font: fontNormal,
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
  page.drawText("380 BRAZAS", {
    x: margin + 435,
    y: yPosition - 5,
    size: 7,
    font: fontBold,
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
  page.drawText("38 BRAZAS", {
    x: margin + 415,
    y: yPosition,
    size: 7,
    font: fontBold,
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
  page.drawText('1 1/2"', {
    x: margin + 415,
    y: yPosition,
    size: 7,
    font: fontBold,
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

  // AGRUPAR Y SUMAR TONELADAS POR ESPECIE
  const capturasPorEspecie = new Map();
  let totalGeneralToneladas = 0;
  
  calas.forEach(cala => {
    cala.especiesPescadas?.forEach(detCala => {
      const especieId = detCala.especieId;
      const nombreEsp = detCala.especie?.nombre || "Desconocida";
      const tons = parseFloat(detCala.toneladas || 0);
      
      if (!capturasPorEspecie.has(especieId)) {
        capturasPorEspecie.set(especieId, {
          nombre: nombreEsp,
          toneladas: 0
        });
      }
      
      capturasPorEspecie.get(especieId).toneladas += tons;
      totalGeneralToneladas += tons;
    });
  });
  
  // Dibujar título
  page.drawText("Captura estimada total (ton):", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 12;
  
  // Dibujar cada especie
  Array.from(capturasPorEspecie.values()).forEach(captura => {
    const textoCaptura = `• ${captura.nombre}: ${captura.toneladas.toFixed(2)} Ton`;
    page.drawText(textoCaptura, {
      x: margin + 10,
      y: yPosition,
      size: 7,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    yPosition -= 10;
  });
  
  // Dibujar total general
  page.drawText(`TOTAL: ${totalGeneralToneladas.toFixed(2)} Ton`, {
    x: margin + 10,
    y: yPosition,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 5;

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
  // Marcar checkbox Cajas con Hielo con X
  page.drawText("X", {
    x: margin + 122,
    y: yPosition - 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
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
  // Marcar checkbox Sonar con X
  page.drawText("X", {
    x: margin + 402,
    y: yPosition - 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
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

  // Checkboxes Modalidad - Manual
  page.drawRectangle({
    x: margin,
    y: yPosition - 8,
    width: boxSize,
    height: boxSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  page.drawText("Manual", {
    x: margin + 15,
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
  // Marcar checkbox Macaco con X
  page.drawText("X", {
    x: margin + 2,
    y: yPosition - 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
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

  // ITERAR SOBRE TODAS LAS CALAS REALES
  calas.forEach((cala, calaIndex) => {
    const numeroCala = calaIndex + 1;
    const especiesDeLaCala = cala.especiesPescadas || [];
    
    // Calcular altura de la fila según cantidad de especies
    const numEspecies = Math.max(especiesDeLaCala.length, 1);
    const alturaFilaCala = calasRowHeight * 2; // Siempre 2 subfilas (Inicio/Final)
    
    currentX = margin;

    // Número de cala
    page.drawRectangle({
      x: currentX,
      y: yPosition - alturaFilaCala,
      width: calaColWidth,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText(String(numeroCala), {
      x: currentX + 10,
      y: yPosition - alturaFilaCala / 2 - 3,
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
      y: yPosition - alturaFilaCala,
      width: fechaHoraColWidth,
      height: calasRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText("Final", {
      x: currentX + 5,
      y: yPosition - alturaFilaCala + 6,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    currentX += fechaHoraColWidth;

    // Latitud - Dividida en dos subfilas
    page.drawRectangle({
      x: currentX,
      y: yPosition - alturaFilaCala,
      width: posicionColWidth / 2,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    
    const latitudInicio = cala?.latitud ? String(cala.latitud) : "";
    const latitudFin = cala?.latitudFin ? String(cala.latitudFin) : "";
    
    // Latitud Inicio (subfila superior)
    page.drawText(latitudInicio, {
      x: currentX + 3,
      y: yPosition - 12,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    
    // Latitud Fin (subfila inferior)
    page.drawText(latitudFin, {
      x: currentX + 3,
      y: yPosition - alturaFilaCala + 6,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });

    // Longitud - Dividida en dos subfilas
    page.drawRectangle({
      x: currentX + posicionColWidth / 2,
      y: yPosition - alturaFilaCala,
      width: posicionColWidth / 2,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    
    const longitudInicio = cala?.longitud ? String(cala.longitud) : "";
    const longitudFin = cala?.longitudFin ? String(cala.longitudFin) : "";
    
    // Longitud Inicio (subfila superior)
    page.drawText(longitudInicio, {
      x: currentX + posicionColWidth / 2 + 3,
      y: yPosition - 12,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    
    // Longitud Fin (subfila inferior)
    page.drawText(longitudFin, {
      x: currentX + posicionColWidth / 2 + 3,
      y: yPosition - alturaFilaCala + 6,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
    
    currentX += posicionColWidth;

    // Columnas de Especies - Mostrar TODAS las especies de esta cala
    page.drawRectangle({
      x: currentX,
      y: yPosition - alturaFilaCala,
      width: especiesWidth,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    
    // Dibujar cada especie
    especiesDeLaCala.forEach((detCala, especieIdx) => {
      const nombreEspecieCala = detCala?.especie?.nombre || "";
      const yEspecie = yPosition - 12 - (especieIdx * 10);
      page.drawText(nombreEspecieCala, {
        x: currentX + 3,
        y: yEspecie,
        size: 6,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
    });

    // Peso
    page.drawRectangle({
      x: currentX + especiesWidth,
      y: yPosition - alturaFilaCala,
      width: pesoWidth,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    
    especiesDeLaCala.forEach((detCala, especieIdx) => {
      const toneladasCala = detCala?.toneladas ? String(detCala.toneladas) : "";
      const yEspecie = yPosition - 12 - (especieIdx * 10);
      page.drawText(toneladasCala, {
        x: currentX + especiesWidth + 3,
        y: yEspecie,
        size: 6,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
    });

    // Talla Media
    page.drawRectangle({
      x: currentX + especiesWidth + pesoWidth,
      y: yPosition - alturaFilaCala,
      width: tallaWidth,
      height: alturaFilaCala,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    
    especiesDeLaCala.forEach((detCala, especieIdx) => {
      const observacionesCala = detCala?.observaciones || "";
      const yEspecie = yPosition - 12 - (especieIdx * 10);
      page.drawText(observacionesCala, {
        x: currentX + especiesWidth + pesoWidth + 3,
        y: yEspecie,
        size: 6,
        font: fontNormal,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= alturaFilaCala;
  });

  yPosition -= 40;

  // ==================== FIRMA ====================

  page.drawText("Firma del armador o representante", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 12;

  // Datos del responsable (bahía)
  const nombresBahia = faena?.bahia?.nombres || "";
  const apellidosBahia = faena?.bahia?.apellidos || "";
  const nombreCompleto = `${nombresBahia} ${apellidosBahia}`.trim();
  const dniResponsable = faena?.bahia?.numeroDocumento || "";
  
  page.drawText("Nombres y Apellidos:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Dibujar nombre completo del responsable
  if (nombreCompleto) {
    page.drawText(nombreCompleto, {
      x: margin + 120,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
  }
  
  yPosition -= 12;

  page.drawText("DNI:", {
    x: margin,
    y: yPosition,
    size: 8,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  
  // Dibujar DNI del responsable
  if (dniResponsable) {
    page.drawText(dniResponsable, {
      x: margin + 120,
      y: yPosition,
      size: 8,
      font: fontNormal,
      color: rgb(0, 0, 0),
    });
  }
  
  yPosition -= 20;

  // ==================== FIRMA DIGITAL ====================
  
  // Intentar cargar y mostrar la firma digital del responsable
  const urlFirma = faena?.bahia?.urlFirma;
  if (urlFirma) {
    try {
      // Construir URL completa de la firma
      const firmaUrl = urlFirma.startsWith('http') 
        ? urlFirma 
        : `${import.meta.env.VITE_UPLOADS_URL}/personal-firmas/${urlFirma}`;
      
      // Descargar la imagen de la firma
      const firmaResponse = await fetch(firmaUrl);
      if (firmaResponse.ok) {
        const firmaBytes = await firmaResponse.arrayBuffer();
        
        // Detectar tipo de imagen y embeber en el PDF
        let firmaImage;
        if (urlFirma.toLowerCase().endsWith('.png')) {
          firmaImage = await pdfDoc.embedPng(firmaBytes);
        } else {
          firmaImage = await pdfDoc.embedJpg(firmaBytes);
        }
        
        // Calcular dimensiones proporcionales (máximo 150x60)
        const firmaWidth = 150;
        const firmaHeight = (firmaImage.height / firmaImage.width) * firmaWidth;
        const maxHeight = 60;
        const finalHeight = Math.min(firmaHeight, maxHeight);
        const finalWidth = (firmaImage.width / firmaImage.height) * finalHeight;
        
        // Dibujar la firma
        page.drawImage(firmaImage, {
          x: margin + 120,
          y: yPosition - finalHeight,
          width: finalWidth,
          height: finalHeight,
        });
        
        yPosition -= finalHeight + 10;
      }
    } catch (error) {
      console.warn('No se pudo cargar la firma digital:', error);
      // Continuar sin firma si hay error
      yPosition -= 10;
    }
  } else {
    // Si no hay firma, solo agregar espacio
    yPosition -= 10;
  }

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
    y: yPosition,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 8;

  page.drawText(footerText2, {
    x: margin,
    y: yPosition,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 8;

  page.drawText(footerText3, {
    x: margin,
    y: yPosition,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 8;

  page.drawText(footerText4, {
    x: margin,
    y: yPosition,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;

  // Dirección, teléfono y web en la parte inferior
  page.drawText(
    "Calle Uno Oeste N° 060 - Urbanización Corpac - San Isidro - Lima",
    {
      x: margin,
      y: yPosition,
      size: 6,
      font: fontNormal,
      color: rgb(0, 0, 0),
    },
  );
  yPosition -= 8;

  page.drawText("T. (511) 616 2222", {
    x: margin,
    y: yPosition,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  yPosition -= 8;

  page.drawText("www.gob.pe/produce", {
    x: margin,
    y: yPosition,
    size: 6,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
}