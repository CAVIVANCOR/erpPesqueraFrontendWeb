// src/components/movimientoAlmacen/dibujaFirmasPDFMA.js
// Función para dibujar las firmas del Movimiento de Almacén
import { rgb } from "pdf-lib";

/**
 * Dibuja las firmas en la página
 * @param {Object} params - Parámetros
 * @param {Page} params.page - Página donde dibujar
 * @param {Object} params.movimiento - Datos del movimiento
 * @param {number} params.width - Ancho de página
 * @param {number} params.margin - Margen
 * @param {Font} params.fontBold - Fuente negrita
 * @param {Font} params.fontNormal - Fuente normal
 * @returns {void}
 */
export function dibujaFirmasPDFMA({
  page,
  movimiento,
  width,
  margin,
  fontBold,
  fontNormal,
}) {
  // SECCIÓN DE FIRMAS - Posición fija
  const firmaYPosition = 90;

  // Calcular posiciones para dos columnas
  const firmaIzqX = margin + 20;
  const firmaDerX = width - margin - 180;
  const firmaWidth = 150;

  // FIRMA IZQUIERDA - Personal Responsable
  if (movimiento.personalRespAlmacen) {
    let yPosFirmaIzq = firmaYPosition;

    // Línea para firma
    page.drawLine({
      start: { x: firmaIzqX, y: yPosFirmaIzq },
      end: { x: firmaIzqX + firmaWidth, y: yPosFirmaIzq },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Nombre del responsable
    yPosFirmaIzq -= 12;
    const nombreResp = movimiento.personalRespAlmacen.nombreCompleto || "-";
    page.drawText(nombreResp, {
      x: firmaIzqX,
      y: yPosFirmaIzq,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yPosFirmaIzq -= 10;
    const docResp = movimiento.personalRespAlmacen.numeroDocumento
      ? `DNI: ${movimiento.personalRespAlmacen.numeroDocumento}`
      : "-";
    page.drawText(docResp, {
      x: firmaIzqX,
      y: yPosFirmaIzq,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Responsable de Almacén"
    yPosFirmaIzq -= 10;
    page.drawText("Responsable de Almacén", {
      x: firmaIzqX,
      y: yPosFirmaIzq,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // FIRMA DERECHA - Entidad Comercial
  let yPosFirmaDer = firmaYPosition;
  if (movimiento.entidadComercial) {
    // Línea para firma
    page.drawLine({
      start: { x: firmaDerX, y: yPosFirmaDer },
      end: { x: firmaDerX + firmaWidth, y: yPosFirmaDer },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Razón social
    yPosFirmaDer -= 12;
    const razonSocial = movimiento.entidadComercial.razonSocial || "-";
    page.drawText(razonSocial.substring(0, 25), {
      x: firmaDerX,
      y: yPosFirmaDer,
      size: 8,
      font: fontBold,
    });

    // Documento de identidad
    yPosFirmaDer -= 10;
    const docEntidad = movimiento.entidadComercial.numeroDocumento
      ? movimiento.entidadComercial.tipoDocumentoId === "2"
        ? `RUC: ${movimiento.entidadComercial.numeroDocumento}`
        : `DNI: ${movimiento.entidadComercial.numeroDocumento}`
      : "-";
    page.drawText(docEntidad, {
      x: firmaDerX,
      y: yPosFirmaDer,
      size: 7,
      font: fontNormal,
    });

    // Etiqueta "Entidad Comercial"
    yPosFirmaDer -= 10;
    page.drawText("Entidad Comercial", {
      x: firmaDerX,
      y: yPosFirmaDer,
      size: 7,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}