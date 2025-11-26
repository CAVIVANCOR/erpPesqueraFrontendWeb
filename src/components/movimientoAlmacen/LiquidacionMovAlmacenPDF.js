/**
 * LiquidacionMovAlmacenPDF.js
 * Generador de PDF para liquidación de entregas a rendir de Movimiento de Almacén
 * @author ERP Megui
 * @version 1.0.0
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero, formatearFechaHora } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFLiquidacionMovAlmacen } from "./dibujaEncabezadoPDFLiquidacionMovAlmacen";
import { dibujaTotalesYFirmaPDFLiquidacionMovAlmacen } from "./dibujaTotalesYFirmaPDFLiquidacionMovAlmacen";

export async function generarYSubirPDFLiquidacionMovAlmacen(
  entregaARendir,
  movimientos,
  empresa
) {
  try {
    // 1. Cargar los MovimientoCaja relacionados
    const token = useAuthStore.getState().token;
    const movimientosConCaja = await Promise.all(
      movimientos.map(async (mov) => {
        if (mov.operacionMovCajaId) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/movimientos-caja/${mov.operacionMovCajaId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const movCaja = await response.json();
              return { ...mov, movimientoCaja: movCaja };
            }
          } catch (error) {
            console.error(`Error cargando MovimientoCaja ${mov.operacionMovCajaId}:`, error);
          }
        }
        return mov;
      })
    );

    // 2. Generar el PDF
    const pdfBytes = await generarPDFLiquidacionMovAlmacen(
      entregaARendir,
      movimientosConCaja,
      empresa
    );

    // 3. Crear FormData para subir el archivo
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    const nombreArchivo = `liquidacion_mov_almacen_${entregaARendir.id}_${Date.now()}.pdf`;
    formData.append("file", blob, nombreArchivo);

    // 4. Subir el archivo al servidor
    const uploadResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-rendir-mov-almacen/upload-pdf`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Error al subir el PDF al servidor");
    }

    const uploadData = await uploadResponse.json();
    const urlPdf = uploadData.url;

    // 5. Actualizar la entrega a rendir con la URL del PDF
    const updateResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-rendir-mov-almacen/${entregaARendir.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movimientoAlmacenId: entregaARendir.movimientoAlmacenId,
          respEntregaRendirId: entregaARendir.respEntregaRendirId,
          centroCostoId: entregaARendir.centroCostoId,
          entregaLiquidada: entregaARendir.entregaLiquidada,
          fechaLiquidacion: entregaARendir.fechaLiquidacion,
          respLiquidacionId: entregaARendir.respLiquidacionId,
          urlLiquidacionPdf: urlPdf,
          fechaCreacion: entregaARendir.fechaCreacion,
          fechaActualizacion: new Date(),
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error("Error al actualizar la entrega a rendir");
    }

    return { success: true, urlPdf: urlPdf };
  } catch (error) {
    console.error("Error en generarYSubirPDFLiquidacionMovAlmacen:", error);
    return { success: false, error: error.message };
  }
}

async function generarPDFLiquidacionMovAlmacen(entregaARendir, movimientos, empresa) {
  // Crear documento PDF con orientación horizontal (A4 landscape)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Dibujar encabezado
  let yPosition = height - 50;
  yPosition = dibujaEncabezadoPDFLiquidacionMovAlmacen(
    page,
    pdfDoc,
    entregaARendir,
    empresa,
    fontBold,
    fontRegular,
    yPosition,
    width
  );

  // Dibujar tabla de movimientos (reducir espacio)
  yPosition -= 10;
  yPosition = dibujarTablaMovimientos(
    page, movimientos, fontBold, fontRegular, yPosition, width
  );

  yPosition = dibujaTotalesYFirmaPDFLiquidacionMovAlmacen(
    page, entregaARendir, movimientos, fontBold, fontRegular, yPosition, width
  );

  return await pdfDoc.save();
}

/**
 * Divide texto en máximo 2 líneas usando todo el ancho disponible
 */
function dividirTextoEnLineas(texto, font, fontSize, maxWidth, maxLineas = 2) {
  if (!texto) return [""];
  
  const palabras = texto.split(" ");
  const lineas = [];
  let lineaActual = "";
  
  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];
    const separador = lineaActual ? " " : "";
    const pruebaLinea = lineaActual + separador + palabra;
    const anchoLinea = font.widthOfTextAtSize(pruebaLinea, fontSize);
    
    if (anchoLinea <= maxWidth) {
      lineaActual = pruebaLinea;
    } else {
      if (lineaActual) {
        if (lineas.length < maxLineas) {
          lineas.push(lineaActual);
          lineaActual = palabra;
        } else {
          break;
        }
      } else {
        if (lineas.length < maxLineas) {
          lineas.push(palabra);
          lineaActual = "";
        } else {
          break;
        }
      }
    }
  }
  
  if (lineaActual && lineas.length < maxLineas) {
    lineas.push(lineaActual);
  }
  
  return lineas.length > 0 ? lineas : [""];
}

function dibujarTablaMovimientos(page, movimientos, fontBold, fontRegular, startY, pageWidth) {
  let yPosition = startY;
  const margin = 10;
  const tableWidth = pageWidth - 2 * margin;
  const gridColor = rgb(0.7, 0.7, 0.7);

  // Ordenar movimientos cronológicamente
  const movimientosOrdenados = [...movimientos].sort((a, b) => 
    new Date(a.fechaMovimiento) - new Date(b.fechaMovimiento)
  );

  // Definir columnas perfectamente alineadas (9 columnas)
  const colWidths = [75, 75, 105, 115, 115, 115, 60, 65, 65];
  const cols = [];
  let xPos = margin;
  
  colWidths.forEach((width) => {
    cols.push({ x: xPos, width: width });
    xPos += width;
  });
  
  const [fechaHora, fechaOper, tipo, ccOrigen, ccDestino, entidad, referencia, ingreso, egreso] = cols;

  // Encabezado de tabla
  page.drawRectangle({
    x: margin,
    y: yPosition - 18,
    width: tableWidth,
    height: 18,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Dibujar encabezados y líneas verticales
  const headerTexts = ["Fecha/Hora", "F.Operación", "Tipo Movimiento", "C.C. Origen", "C.C. Destino", "Entidad Com.", "Referencia", "Ingreso", "Egreso"];
  
  cols.forEach((col, i) => {
    page.drawLine({
      start: { x: col.x, y: yPosition },
      end: { x: col.x, y: yPosition - 18 },
      thickness: 0.5,
      color: gridColor,
    });
    
    let xText = col.x + 2;
    if (i >= 7) { // Ingreso y Egreso alineados a la derecha
      const textWidth = fontBold.widthOfTextAtSize(headerTexts[i], 7);
      xText = col.x + col.width - textWidth - 2;
    }
    
    page.drawText(headerTexts[i], {
      x: xText,
      y: yPosition - 13,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  });
  
  page.drawLine({
    start: { x: margin + tableWidth, y: yPosition },
    end: { x: margin + tableWidth, y: yPosition - 18 },
    thickness: 0.5,
    color: gridColor,
  });
  
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + tableWidth, y: yPosition },
    thickness: 0.5,
    color: gridColor,
  });
  
  page.drawLine({
    start: { x: margin, y: yPosition - 18 },
    end: { x: margin + tableWidth, y: yPosition - 18 },
    thickness: 0.5,
    color: gridColor,
  });

  yPosition -= 18;

  // Filas de datos
  movimientosOrdenados.forEach((mov, index) => {
    const movCaja = mov.movimientoCaja;
    const fontSize = 6;
    const lineHeight = 7;
    
    const fechaHoraTexto = formatearFechaHora(mov.fechaMovimiento, "N/A");
    const fechaOperTexto = mov.fechaOperacionMovCaja ? formatearFechaHora(mov.fechaOperacionMovCaja, "") : "";
    const tipoTexto = mov.tipoMovimiento?.nombre || "N/A";
    
    let ccOrigenTexto = "S/C";
    if (movCaja && movCaja.cuentaCorrienteOrigen) {
      const empresa = movCaja.empresaOrigen?.razonSocial || "";
      const banco = movCaja.cuentaCorrienteOrigen?.banco?.nombre || "";
      const moneda = movCaja.cuentaCorrienteOrigen?.moneda?.codigoSunat || "";
      const cuenta = movCaja.cuentaCorrienteOrigen?.numeroCuenta || "";
      ccOrigenTexto = [empresa, banco, moneda, cuenta].filter(Boolean).join(" - ");
    }
    
    let ccDestinoTexto = "S/C";
    if (movCaja && movCaja.cuentaCorrienteDestino) {
      const empresa = movCaja.empresaDestino?.razonSocial || "";
      const banco = movCaja.cuentaCorrienteDestino?.banco?.nombre || "";
      const moneda = movCaja.cuentaCorrienteDestino?.moneda?.codigoSunat || "";
      const cuenta = movCaja.cuentaCorrienteDestino?.numeroCuenta || "";
      ccDestinoTexto = [empresa, banco, moneda, cuenta].filter(Boolean).join(" - ");
    }
    
    let entidadTexto = "S/C";
    if (movCaja && movCaja.entidadComercial) {
      const razonSocial = movCaja.entidadComercial?.razonSocial || "";
      const banco = movCaja.ctaCteEntidad?.banco?.nombre || "";
      const moneda = movCaja.ctaCteEntidad?.moneda?.codigoSunat || "";
      const cuenta = movCaja.ctaCteEntidad?.numeroCuenta || "";
      entidadTexto = [razonSocial, banco, moneda, cuenta].filter(Boolean).join(" - ");
    }
    
    let referenciaTexto = "";
    if (movCaja) {
      const codigo = movCaja.tipoReferencia?.codigo || "";
      const refId = movCaja.referenciaExtId || "";
      referenciaTexto = `${codigo} ${refId}`.trim();
    }
    
    const lineasFechaHora = dividirTextoEnLineas(fechaHoraTexto, fontRegular, fontSize, fechaHora.width - 3);
    const lineasFechaOper = dividirTextoEnLineas(fechaOperTexto, fontRegular, fontSize, fechaOper.width - 3);
    const lineasTipo = dividirTextoEnLineas(tipoTexto, fontRegular, fontSize, tipo.width - 3);
    const lineasCCOrigen = dividirTextoEnLineas(ccOrigenTexto, fontRegular, fontSize, ccOrigen.width - 3);
    const lineasCCDestino = dividirTextoEnLineas(ccDestinoTexto, fontRegular, fontSize, ccDestino.width - 3);
    const lineasEntidad = dividirTextoEnLineas(entidadTexto, fontRegular, fontSize, entidad.width - 3);
    const lineasReferencia = dividirTextoEnLineas(referenciaTexto, fontRegular, fontSize, referencia.width - 3);
    
    const maxLineas = Math.max(
      lineasFechaHora.length,
      lineasFechaOper.length,
      lineasTipo.length,
      lineasCCOrigen.length,
      lineasCCDestino.length,
      lineasEntidad.length,
      lineasReferencia.length,
      1
    );
    const rowHeight = Math.min(maxLineas, 2) * lineHeight + 3;
    
    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: yPosition - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      });
    }
    
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: margin + tableWidth, y: yPosition },
      thickness: 0.5,
      color: gridColor,
    });
    
    cols.forEach((col) => {
      page.drawLine({
        start: { x: col.x, y: yPosition },
        end: { x: col.x, y: yPosition - rowHeight },
        thickness: 0.5,
        color: gridColor,
      });
    });
    page.drawLine({
      start: { x: margin + tableWidth, y: yPosition },
      end: { x: margin + tableWidth, y: yPosition - rowHeight },
      thickness: 0.5,
      color: gridColor,
    });
    
    let yOffset = yPosition - 6;
    const lineasArray = [lineasFechaHora, lineasFechaOper, lineasTipo, lineasCCOrigen, lineasCCDestino, lineasEntidad, lineasReferencia];
    
    lineasArray.forEach((lineas, colIndex) => {
      lineas.forEach((linea, i) => {
        page.drawText(linea, {
          x: cols[colIndex].x + 2,
          y: yOffset - (i * lineHeight),
          size: fontSize,
          font: fontRegular,
        });
      });
    });

    const esIngreso = mov.tipoMovimiento?.esIngreso === true;
    const monto = formatearNumero(mov.monto || 0);
    const montoWidth = fontRegular.widthOfTextAtSize(monto, 7);

    if (esIngreso) {
      page.drawText(monto, {
        x: ingreso.x + ingreso.width - montoWidth - 2,
        y: yOffset,
        size: 7,
        font: fontRegular,
        color: rgb(0, 0.5, 0),
      });
    } else {
      page.drawText(monto, {
        x: egreso.x + egreso.width - montoWidth - 2,
        y: yOffset,
        size: 7,
        font: fontRegular,
        color: rgb(0.7, 0, 0),
      });
    }

    yPosition -= rowHeight;
    if (yPosition < 100) return yPosition;
  });
  
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + tableWidth, y: yPosition },
    thickness: 0.5,
    color: gridColor,
  });

  return yPosition;
}

export default generarYSubirPDFLiquidacionMovAlmacen;
