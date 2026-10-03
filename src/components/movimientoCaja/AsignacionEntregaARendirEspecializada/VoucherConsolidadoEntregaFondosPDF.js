// src/components/movimientoCaja/AsignacionEntregaARendirEspecializada/VoucherConsolidadoEntregaFondosPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

/**
 * Módulo de PDF registrado en pdfModules.config.js / pdfConfigV2.js.
 * Es el MISMO que usa PdfComprobanteOperacionDetMovCard (Rendición de Gastos), de modo que
 * el voucher generado aquí se vea en ese componente. Al subir el archivo, el backend guarda su
 * URL en DetMovsEntregaRendir.urlComprobanteOperacionMovCaja usando entityId = id de la asignación.
 */
const MODULO_PDF = "det-movs-entrega-rendir-operacion";

/**
 * Genera el voucher consolidado de la Entrega de Fondos (Entrega a Rendir) y lo sube al servidor.
 *
 * @param {Object} datosEntrega - { correlativo, fechaEntrega, numeroOperacion, descripcion,
 *                                  tipoCambio, esGerencial, numeroCheque }
 * @param {Object} asignacion - Asignación atendida (la que muestra Tesorería Pendientes)
 * @param {Object} resultado - Respuesta del backend (movimientos, asientosContables)
 * @param {Object} empresa - Empresa emisora (para el encabezado y el logo)
 * @param {Object} usuario - Usuario que elabora
 */
export async function generarYSubirVoucherConsolidado(
  datosEntrega,
  asignacion,
  resultado,
  empresa,
  usuario = null,
) {
  try {
    const pdfBytes = await generarPDFVoucherConsolidado(
      datosEntrega,
      asignacion,
      resultado,
      empresa,
      usuario,
    );

    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", blob, `ENTREGA-FONDOS-${datosEntrega.correlativo}.pdf`);
    formData.append("moduleName", MODULO_PDF);
    formData.append("entityId", asignacion.origenId);

    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || "Error al subir el PDF");
    }

    const respuesta = await response.json();
    return { success: true, urlPdf: respuesta.url };
  } catch (error) {
    console.error("Error al generar y subir el voucher consolidado:", error);
    return { success: false, error: error.message };
  }
}

/**
 * pdf-lib con fuentes estándar solo admite caracteres Latin-1 (WinAnsi): un emoji o un
 * símbolo fuera de ese rango haría fallar TODO el PDF. Se reemplaza por "?".
 */
function limpiarTexto(texto) {
  return String(texto ?? "").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

/**
 * Divide un texto en líneas que caben en el ancho indicado
 */
function dividirTexto(texto, anchoMaximo, fuente, tamano) {
  const palabras = limpiarTexto(texto).split(" ");
  const lineas = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (fuente.widthOfTextAtSize(prueba, tamano) > anchoMaximo && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);

  return lineas.length > 0 ? lineas : [""];
}

async function generarPDFVoucherConsolidado(datosEntrega, asignacion, resultado, empresa, usuario) {
  // ═══════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 20;
  const lineHeight = 15;

  let logoImage = null;
  if (empresa?.logo && empresa?.id) {
    try {
      const logoResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`,
      );
      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        logoImage = empresa.logo.toLowerCase().includes(".png")
          ? await pdfDoc.embedPng(logoBytes)
          : await pdfDoc.embedJpg(logoBytes);
      }
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 2. PÁGINA Y ENCABEZADO
  // ═══════════════════════════════════════════════════════════
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();
  let y = height - margin;

  if (logoImage) {
    page.drawImage(logoImage, { x: margin, y: y - 60, width: 80, height: 60 });
  }

  const empresaX = width - margin - 250;
  page.drawText(limpiarTexto(empresa?.razonSocial || "EMPRESA"), {
    x: empresaX, y, size: 10, font: fontBold, color: rgb(0, 0, 0),
  });
  y -= 12;
  page.drawText(`RUC: ${limpiarTexto(empresa?.ruc || "")}`, {
    x: empresaX, y, size: 9, font: fontNormal, color: rgb(0, 0, 0),
  });
  y -= 12;
  if (empresa?.direccion) {
    page.drawText(limpiarTexto(empresa.direccion).substring(0, 50), {
      x: empresaX, y, size: 8, font: fontNormal, color: rgb(0, 0, 0),
    });
  }
  y -= 30;

  // ═══════════════════════════════════════════════════════════
  // 3. TÍTULO
  // ═══════════════════════════════════════════════════════════
  const titulo = "VOUCHER DE ENTREGA A RENDIR";
  page.drawText(titulo, {
    x: (width - fontBold.widthOfTextAtSize(titulo, 14)) / 2,
    y, size: 14, font: fontBold, color: rgb(0, 0, 0),
  });
  y -= 10;
  page.drawLine({
    start: { x: margin, y }, end: { x: width - margin, y },
    thickness: 2, color: rgb(0, 0, 0),
  });
  y -= 20;

  // ── Helpers de dibujo ──
  const dibujarSeccion = (texto, color) => {
    page.drawText(texto, { x: margin, y, size: 11, font: fontBold, color });
    y -= 5;
    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 1, color: rgb(0.7, 0.7, 0.7),
    });
    y -= 15;
  };

  // Dibuja "etiqueta: valor" y avanza; el valor largo se divide en varias líneas
  const dibujarCampo = (etiqueta, valor, sangria = 0) => {
    const xValor = margin + sangria + 150;
    page.drawText(etiqueta, {
      x: margin + sangria, y, size: 9, font: fontBold, color: rgb(0, 0, 0),
    });
    const lineas = dividirTexto(valor, width - margin - xValor, fontNormal, 9);
    lineas.forEach((linea, i) => {
      page.drawText(linea, { x: xValor, y: y - i * 11, size: 9, font: fontNormal, color: rgb(0, 0, 0) });
    });
    y -= Math.max(lineHeight, lineas.length * 11 + 4);
  };

  // ═══════════════════════════════════════════════════════════
  // 4. DATOS DE LA OPERACIÓN
  // ═══════════════════════════════════════════════════════════
  const fecha = datosEntrega.fechaEntrega ? new Date(datosEntrega.fechaEntrega) : new Date();
  dibujarCampo("Nº Operación:", datosEntrega.correlativo || "N/A");
  dibujarCampo("Fecha:", fecha.toLocaleDateString("es-PE"));
  dibujarCampo("Nº Operación Bancaria:", datosEntrega.numeroOperacion || "N/A");
  dibujarCampo("Glosa:", datosEntrega.descripcion || "Entrega a rendir");
  dibujarCampo("Tipo de Operación:", datosEntrega.esGerencial ? "GERENCIAL" : "FISCAL");
  y -= 10;

  // ═══════════════════════════════════════════════════════════
  // 5. ASIGNACIÓN ATENDIDA
  // ═══════════════════════════════════════════════════════════
  dibujarSeccion("ASIGNACION A RENDIR", rgb(0.1, 0.3, 0.7));
  const egreso = resultado.movimientos?.egreso;
  const simbolo = limpiarTexto(egreso?.moneda?.simbolo || asignacion?.moneda?.simbolo || "");

  dibujarCampo("Nº Asignación:", `ER-${asignacion.origenId}`, 10);
  dibujarCampo("Responsable:", asignacion.entidadComercial?.razonSocial || "N/A", 10);
  dibujarCampo("Tipo de Movimiento:", asignacion.tipoMovimiento?.nombre || "N/A", 10);
  dibujarCampo("Descripción:", asignacion.descripcion || "N/A", 10);
  dibujarCampo(
    "Monto Asignado:",
    `${simbolo} ${formatearNumero(Number(asignacion.montoTotal || asignacion.monto || 0))}`,
    10,
  );
  y -= 10;

  // ═══════════════════════════════════════════════════════════
  // 6. CUENTA DE ORIGEN (DE DONDE SALE EL DINERO)
  // ═══════════════════════════════════════════════════════════
  dibujarSeccion("CUENTA DE ORIGEN (EGRESO)", rgb(0.8, 0, 0));

  const cuenta = egreso?.cuentaCorrienteDestino; // convención del egreso: la cuenta va en cuentaCorrienteDestino
  const monto = Number(egreso?.monto || 0);
  const itf = Number(resultado.movimientos?.itfOrigen?.monto || 0);
  const comision = Number(resultado.movimientos?.comisionOrigen?.monto || 0);
  const totalDebitado = monto + itf + comision;

  dibujarCampo("Banco:", cuenta?.banco?.nombre || "N/A", 10);
  dibujarCampo("Nº Cuenta:", cuenta?.numeroCuenta || "N/A", 10);
  dibujarCampo("Medio de Pago:", egreso?.medioPago?.nombre || "N/A", 10);
  if (datosEntrega.numeroCheque) {
    dibujarCampo("Nº Cheque:", datosEntrega.numeroCheque, 10);
  }
  dibujarCampo("Monto Entregado:", `${simbolo} ${formatearNumero(monto)}`, 10);
  dibujarCampo("ITF:", `${simbolo} ${formatearNumero(itf)}`, 10);
  dibujarCampo("Comisión:", `${simbolo} ${formatearNumero(comision)}`, 10);
  dibujarCampo("Total Debitado:", `${simbolo} ${formatearNumero(totalDebitado)}`, 10);
  y -= 10;

  // ═══════════════════════════════════════════════════════════
  // 7. TIPO DE CAMBIO (solo si la asignación no es en soles)
  // ═══════════════════════════════════════════════════════════
  const tipoCambio = Number(datosEntrega.tipoCambio || 1);
  if (tipoCambio !== 1) {
    dibujarSeccion("TIPO DE CAMBIO (VENTA)", rgb(0, 0.5, 0.8));
    dibujarCampo("Tipo de Cambio:", tipoCambio.toString(), 10);
    dibujarCampo(
      "Equivalente en soles:",
      `S/ ${formatearNumero(totalDebitado * tipoCambio)}`,
      10,
    );
    y -= 10;
  }

  // ═══════════════════════════════════════════════════════════
  // 8. ASIENTOS CONTABLES GENERADOS
  // ═══════════════════════════════════════════════════════════
  const asientos = resultado.asientosContables || [];
  if (asientos.length > 0) {
    dibujarSeccion("ASIENTOS CONTABLES GENERADOS", rgb(0, 0.6, 0));
    for (const asiento of asientos) {
      dibujarCampo(
        `${asiento.numeroAsiento}:`,
        `${asiento.glosa} | Debe ${simbolo} ${formatearNumero(Number(asiento.totalDebe || 0))} - Haber ${simbolo} ${formatearNumero(Number(asiento.totalHaber || 0))}`,
        10,
      );
    }
    y -= 10;
  }

  // ═══════════════════════════════════════════════════════════
  // 9. TOTAL DE LA OPERACIÓN
  // ═══════════════════════════════════════════════════════════
  page.drawRectangle({
    x: margin, y: y - 20, width: width - 2 * margin, height: 25, color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("TOTAL DEBITADO DE LA CUENTA:", {
    x: margin + 10, y: y - 12, size: 10, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(`${simbolo} ${formatearNumero(totalDebitado)}`, {
    x: width - margin - 150, y: y - 12, size: 10, font: fontBold, color: rgb(0.8, 0, 0),
  });

  // ═══════════════════════════════════════════════════════════
  // 10. PIE DE PÁGINA
  // ═══════════════════════════════════════════════════════════
  let yPie = 80;
  page.drawLine({
    start: { x: margin, y: yPie }, end: { x: width - margin, y: yPie },
    thickness: 1, color: rgb(0.7, 0.7, 0.7),
  });
  yPie -= 15;

  if (usuario) {
    page.drawText(
      limpiarTexto(`Elaborado por: ${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim()),
      { x: margin, y: yPie, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5) },
    );
  }
  page.drawText(`Fecha de generación: ${new Date().toLocaleString("es-PE")}`, {
    x: width - margin - 200, y: yPie, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5),
  });
  yPie -= 12;

  const pie = "Sistema ERP Pesquera - Entrega a Rendir";
  page.drawText(pie, {
    x: (width - fontNormal.widthOfTextAtSize(pie, 7)) / 2,
    y: yPie, size: 7, font: fontNormal, color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export default {
  generarYSubirVoucherConsolidado,
};
