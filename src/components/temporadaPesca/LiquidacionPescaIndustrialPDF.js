/**
 * LiquidacionPescaIndustrialPDF.js
 * 
 * Generador de PDF para liquidación de entregas a rendir de Pesca Industrial
 * Genera un PDF profesional con el detalle de movimientos y totales
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero, formatearFecha, formatearFechaHoraAMPM } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { dibujaEncabezadoPDFLiquidacionPI } from "./dibujaEncabezadoPDFLiquidacionPI";
import { dibujaTotalesYFirmaPDFLiquidacionPI } from "./dibujaTotalesYFirmaPDFLiquidacionPI";

/**
 * Genera un PDF de liquidación de entrega a rendir y lo sube al servidor
 * @param {Object} entregaARendir - Datos de la entrega a rendir
 * @param {Array} movimientos - Movimientos de la entrega
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFLiquidacionPI(
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
    const pdfBytes = await generarPDFLiquidacionPI(
      entregaARendir,
      movimientosConCaja,
      empresa
    );

    // 2. Crear FormData para subir el archivo
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    const nombreArchivo = `liquidacion_pesca_industrial_${entregaARendir.id}_${Date.now()}.pdf`;
    formData.append("file", blob, nombreArchivo);

    // 3. Subir el archivo al servidor
    const uploadResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-a-rendir/upload-pdf`,
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

    // 4. Actualizar la entrega a rendir con la URL del PDF
    const updateResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/entregas-a-rendir/${entregaARendir.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          temporadaPescaId: entregaARendir.temporadaPescaId,
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
      throw new Error("Error al actualizar la entrega a rendir con la URL del PDF");
    }

    return {
      success: true,
      urlPdf: urlPdf,
    };
  } catch (error) {
    console.error("Error en generarYSubirPDFLiquidacionPI:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Genera el PDF de liquidación de entrega a rendir
 * @param {Object} entregaARendir - Datos de la entrega a rendir
 * @param {Array} movimientos - Movimientos de la entrega
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Uint8Array>} - Bytes del PDF generado
 */
async function generarPDFLiquidacionPI(entregaARendir, movimientos, empresa) {
  // Crear documento PDF con orientación horizontal (A4 landscape)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Dibujar encabezado
  let yPosition = height - 50;
  yPosition = await dibujaEncabezadoPDFLiquidacionPI(
    page,
    pdfDoc,
    entregaARendir,
    empresa,
    fontBold,
    fontRegular,
    yPosition,
    width
  );

  // Dibujar tabla de movimientos
  yPosition -= 20;
  yPosition = dibujarTablaMovimientos(
    page,
    movimientos,
    fontBold,
    fontRegular,
    yPosition,
    width
  );

  // Dibujar totales y firma
  yPosition = dibujaTotalesYFirmaPDFLiquidacionPI(
    page,
    entregaARendir,
    movimientos,
    fontBold,
    fontRegular,
    yPosition,
    width
  );

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Dibuja la tabla de movimientos en el PDF
 */
function dibujarTablaMovimientos(
  page,
  movimientos,
  fontBold,
  fontRegular,
  startY,
  pageWidth
) {
  let yPosition = startY;
  const margin = 10;
  const tableWidth = pageWidth - 2 * margin;

  // Ordenar movimientos cronológicamente
  const movimientosOrdenados = [...movimientos].sort((a, b) => 
    new Date(a.fechaMovimiento) - new Date(b.fechaMovimiento)
  );

  // Encabezado de tabla
  page.drawRectangle({
    x: margin,
    y: yPosition - 20,
    width: tableWidth,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Definir columnas con posiciones para orientación horizontal (ajustadas)
  const cols = {
    fechaHora: { x: margin + 5, width: 80 },       // Fecha y Hora juntas
    fechaOper: { x: margin + 60, width: 80 },      // Fecha Operación MovCaja
    tipo: { x: margin + 115, width: 110 },         // Tipo (+20px = 110)
    ccOrigen: { x: margin + 230, width: 170 },     // C.C. Origen (+80px = 170)
    ccDestino: { x: margin + 405, width: 170 },    // C.C. Destino (+80px = 170)
    entidad: { x: margin + 580, width: 150 },      // Entidad Comercial (+60px = 150)
    referencia: { x: margin + 735, width: 60 },    // Referencia
    ingreso: { x: margin + 800, width: 65 },       // Ingreso
    egreso: { x: margin + 870, width: 65 },        // Egreso
  };

  // Dibujar encabezados
  const headers = [
    { text: "Fecha/Hora", x: cols.fechaHora.x },
    { text: "F.Operación", x: cols.fechaOper.x },
    { text: "Tipo Movimiento", x: cols.tipo.x },
    { text: "C.C. Origen", x: cols.ccOrigen.x },
    { text: "C.C. Destino", x: cols.ccDestino.x },
    { text: "Entidad Com.", x: cols.entidad.x },
    { text: "Referencia", x: cols.referencia.x },
    { text: "Ingreso", x: cols.ingreso.x },
    { text: "Egreso", x: cols.egreso.x },
  ];

  headers.forEach((header) => {
    page.drawText(header.text, {
      x: header.x,
      y: yPosition - 15,
      size: 7,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  });

  yPosition -= 25;

  // Filas de datos
  movimientosOrdenados.forEach((mov, index) => {
    // Alternar color de fondo
    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: yPosition - 15,
        width: tableWidth,
        height: 15,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    const movCaja = mov.movimientoCaja;

    // Fecha/Hora (dd/mm/yyyy HH:MM AM/PM)
    const fechaHoraCompleta = formatearFechaHoraAMPM(mov.fechaMovimiento, "N/A");
    page.drawText(fechaHoraCompleta.substring(0, 17), {
      x: cols.fechaHora.x,
      y: yPosition - 10,
      size: 6,
      font: fontRegular,
    });

    // Fecha Operación MovCaja
    const fechaOper = mov.fechaOperacionMovCaja 
      ? formatearFechaHoraAMPM(mov.fechaOperacionMovCaja, "").substring(0, 17)
      : "";
    page.drawText(fechaOper, {
      x: cols.fechaOper.x,
      y: yPosition - 10,
      size: 6,
      font: fontRegular,
    });

    // Tipo de movimiento
    const tipo = mov.tipoMovimiento?.nombre || "N/A";
    page.drawText(tipo.substring(0, 18), {
      x: cols.tipo.x,
      y: yPosition - 10,
      size: 6,
      font: fontRegular,
    });

    // C.C. Origen (de MovimientoCaja)
    let ccOrigen = "";
    if (movCaja) {
      const empresa = movCaja.empresaOrigen?.razonSocial?.substring(0, 10) || "";
      const banco = movCaja.cuentaCorrienteOrigen?.banco?.nombre?.substring(0, 8) || "";
      const moneda = movCaja.cuentaCorrienteOrigen?.moneda?.codigoSunat || "";
      const cuenta = movCaja.cuentaCorrienteOrigen?.numeroCuenta?.substring(0, 8) || "";
      ccOrigen = `${empresa} ${banco} ${moneda} ${cuenta}`.trim();
    }
    page.drawText(ccOrigen.substring(0, 18), {
      x: cols.ccOrigen.x,
      y: yPosition - 10,
      size: 5,
      font: fontRegular,
    });

    // C.C. Destino (de MovimientoCaja)
    let ccDestino = "";
    if (movCaja && movCaja.cuentaCorrienteDestino) {
      const empresa = movCaja.empresaDestino?.razonSocial?.substring(0, 10) || "";
      const banco = movCaja.cuentaCorrienteDestino?.banco?.nombre?.substring(0, 8) || "";
      const moneda = movCaja.cuentaCorrienteDestino?.moneda?.codigoSunat || "";
      const cuenta = movCaja.cuentaCorrienteDestino?.numeroCuenta?.substring(0, 8) || "";
      ccDestino = `${empresa} ${banco} ${moneda} ${cuenta}`.trim();
    }
    page.drawText(ccDestino.substring(0, 18), {
      x: cols.ccDestino.x,
      y: yPosition - 10,
      size: 5,
      font: fontRegular,
    });

    // Entidad Comercial (de MovimientoCaja)
    let entidadCom = "";
    if (movCaja && movCaja.entidadComercial) {
      const razonSocial = movCaja.entidadComercial?.razonSocial?.substring(0, 10) || "";
      const banco = movCaja.ctaCteEntidad?.banco?.nombre?.substring(0, 8) || "";
      const moneda = movCaja.ctaCteEntidad?.moneda?.codigoSunat || "";
      const cuenta = movCaja.ctaCteEntidad?.numeroCuenta?.substring(0, 8) || "";
      entidadCom = `${razonSocial} ${banco} ${moneda} ${cuenta}`.trim();
    }
    page.drawText(entidadCom.substring(0, 18), {
      x: cols.entidad.x,
      y: yPosition - 10,
      size: 5,
      font: fontRegular,
    });

    // Referencia (de MovimientoCaja)
    let referencia = "";
    if (movCaja) {
      const codigo = movCaja.tipoReferencia?.codigo || "";
      const refId = movCaja.referenciaExtId || "";
      referencia = `${codigo} ${refId}`.trim();
    }
    page.drawText(referencia.substring(0, 12), {
      x: cols.referencia.x,
      y: yPosition - 10,
      size: 6,
      font: fontRegular,
    });

    // Ingreso/Egreso (alineados a la derecha)
    const esIngreso = mov.tipoMovimiento?.esIngreso === true;
    const monto = formatearNumero(mov.monto || 0);
    const montoWidth = fontRegular.widthOfTextAtSize(monto, 7);

    if (esIngreso) {
      page.drawText(monto, {
        x: cols.ingreso.x + cols.ingreso.width - montoWidth - 5,
        y: yPosition - 10,
        size: 7,
        font: fontRegular,
        color: rgb(0, 0.5, 0),
      });
    } else {
      page.drawText(monto, {
        x: cols.egreso.x + cols.egreso.width - montoWidth - 5,
        y: yPosition - 10,
        size: 7,
        font: fontRegular,
        color: rgb(0.7, 0, 0),
      });
    }

    yPosition -= 15;

    // Verificar si necesitamos nueva página
    if (yPosition < 100) {
      return yPosition;
    }
  });

  return yPosition;
}

export default generarYSubirPDFLiquidacionPI;
