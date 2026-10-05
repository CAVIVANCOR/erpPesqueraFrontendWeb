// src/components/movimientoCaja/DeudasTributariasPagoEspecializado/VoucherConsolidadoPagoDeudasTributariasPDF.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatearNumero } from "../../../utils/utils";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

/**
 * Módulo de PDF registrado en pdfModules.config.js / pdfConfigV2.js.
 * Al subir el archivo, el backend guarda su URL en
 * PagoDeudaTributaria.urlVoucherOperacionConsolidado del pago indicado en entityId
 * (el primero de la operación); luego se copia a los demás pagos con
 * sincronizarAdjuntosPagoDeudaTributaria.
 */
const MODULO_PDF = "pago-deuda-tributaria-consolidado";

// Alto reservado al pie de página; el contenido nunca baja de esta altura
const ALTO_PIE = 100;

/**
 * Genera el voucher consolidado del pago múltiple de deudas tributarias y lo sube al servidor.
 *
 * @param {Object} datosPago - { correlativo, fechaPago, numeroOperacion, descripcion,
 *                               tipoCambio, esGerencial, numeroCheque }
 * @param {Object} resultado - `data` devuelto por el backend (distribucion, movimientos,
 *                             asientosContables)
 * @param {Object} empresa - Empresa emisora (para el encabezado y el logo)
 * @param {Object} usuario - Usuario que elabora
 */
export async function generarYSubirVoucherConsolidado(
  datosPago,
  resultado,
  empresa,
  usuario = null,
) {
  try {
    // El archivo se asocia al primer pago de la operación
    const pagoId = resultado.distribucion?.[0]?.pagoId;
    if (!pagoId) throw new Error("La operación no devolvió pagos para asociar el voucher");

    const pdfBytes = await generarPDFVoucherConsolidado(datosPago, resultado, empresa, usuario);

    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", blob, `PAGO-DEUDAS-TRIBUTARIAS-${datosPago.correlativo}.pdf`);
    formData.append("moduleName", MODULO_PDF);
    formData.append("entityId", pagoId);

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
    return { success: true, urlPdf: respuesta.url, pagoId };
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

/**
 * Recorta un texto para que quepa en una celda de tabla (no hace salto de línea)
 */
function recortarTexto(texto, anchoMaximo, fuente, tamano) {
  let t = limpiarTexto(texto);
  while (t.length > 1 && fuente.widthOfTextAtSize(t, tamano) > anchoMaximo) {
    t = t.slice(0, -1);
  }
  return t;
}

async function generarPDFVoucherConsolidado(datosPago, resultado, empresa, usuario) {
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
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
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
  const titulo = "VOUCHER DE PAGO DE DEUDAS TRIBUTARIAS";
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
  // Con muchas deudas (p. ej. planilla de AFP) el voucher ocupa varias páginas
  const asegurarEspacio = (alto) => {
    if (y - alto < ALTO_PIE) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
  };

  const dibujarSeccion = (texto, color) => {
    asegurarEspacio(40);
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
    const lineas = dividirTexto(valor, width - margin - xValor, fontNormal, 9);
    asegurarEspacio(Math.max(lineHeight, lineas.length * 11 + 4));
    page.drawText(etiqueta, {
      x: margin + sangria, y, size: 9, font: fontBold, color: rgb(0, 0, 0),
    });
    lineas.forEach((linea, i) => {
      page.drawText(linea, { x: xValor, y: y - i * 11, size: 9, font: fontNormal, color: rgb(0, 0, 0) });
    });
    y -= Math.max(lineHeight, lineas.length * 11 + 4);
  };

  // ═══════════════════════════════════════════════════════════
  // 4. DATOS DE LA OPERACIÓN
  // ═══════════════════════════════════════════════════════════
  const egreso = resultado.movimientos?.egreso;
  const simbolo = limpiarTexto(egreso?.moneda?.simbolo || "");
  const fecha = datosPago.fechaPago ? new Date(datosPago.fechaPago) : new Date();

  dibujarCampo("Nº Operación:", datosPago.correlativo || "N/A");
  dibujarCampo("Fecha:", fecha.toLocaleDateString("es-PE"));
  dibujarCampo("Nº Operación Bancaria:", datosPago.numeroOperacion || "N/A");
  dibujarCampo("Glosa:", datosPago.descripcion || "Pago de deudas tributarias");
  dibujarCampo("Tipo de Operación:", datosPago.esGerencial ? "GERENCIAL" : "FISCAL");
  dibujarCampo("Entidad Destino:", egreso?.entidadComercial?.razonSocial || "N/A");
  if (egreso?.entidadComercial?.numeroDocumento) {
    dibujarCampo("Documento Entidad:", egreso.entidadComercial.numeroDocumento);
  }
  dibujarCampo("Tipo de Movimiento:", egreso?.tipoMovimiento?.nombre || "N/A");
  y -= 10;

  // ═══════════════════════════════════════════════════════════
  // 5. DEUDAS PAGADAS (reparto proporcional al saldo)
  // ═══════════════════════════════════════════════════════════
  dibujarSeccion("DEUDAS PAGADAS", rgb(0.1, 0.3, 0.7));

  const distribucion = resultado.distribucion || [];
  const colPersonal = margin;
  const colTipo = margin + 190;
  const colMonto = width - margin - 150; // alineado a la derecha
  const colSaldo = width - margin - 70; // alineado a la derecha
  const alinearDerecha = (texto, xDerecha, fuente, tamano) =>
    xDerecha - fuente.widthOfTextAtSize(texto, tamano);

  const dibujarEncabezadoTabla = () => {
    page.drawRectangle({
      x: margin, y: y - 4, width: width - 2 * margin, height: 14, color: rgb(0.92, 0.92, 0.92),
    });
    page.drawText("TIPO DE DEUDA", { x: colPersonal + 2, y, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText("PERIODO / DECLARACION", { x: colTipo, y, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText("PAGADO", {
      x: alinearDerecha("PAGADO", colMonto + 60, fontBold, 8), y, size: 8, font: fontBold, color: rgb(0, 0, 0),
    });
    page.drawText("NUEVO SALDO", {
      x: alinearDerecha("NUEVO SALDO", colSaldo + 60, fontBold, 8), y, size: 8, font: fontBold, color: rgb(0, 0, 0),
    });
    y -= 16;
  };

  dibujarEncabezadoTabla();
  let totalPagado = 0;
  for (const fila of distribucion) {
    if (y - 12 < ALTO_PIE) {
      asegurarEspacio(1000); // fuerza página nueva y repite el encabezado de la tabla
      dibujarEncabezadoTabla();
    }
    const pagado = Number(fila.montoAplicado || 0);
    const saldo = Number(fila.nuevoSaldo || 0);
    totalPagado += pagado;

    page.drawText(recortarTexto(fila.tipoDeuda, 180, fontNormal, 8), {
      x: colPersonal + 2, y, size: 8, font: fontNormal, color: rgb(0, 0, 0),
    });
    const periodoDeclaracion = `${fila.periodo || ""}${fila.numeroDeclaracion ? ` - ${fila.numeroDeclaracion}` : ""}`;
    page.drawText(recortarTexto(periodoDeclaracion, 150, fontNormal, 8), {
      x: colTipo, y, size: 8, font: fontNormal, color: rgb(0, 0, 0),
    });
    const textoPagado = `${simbolo} ${formatearNumero(pagado)}`;
    page.drawText(textoPagado, {
      x: alinearDerecha(textoPagado, colMonto + 60, fontNormal, 8), y, size: 8, font: fontNormal, color: rgb(0, 0, 0),
    });
    const textoSaldo = `${simbolo} ${formatearNumero(saldo)}`;
    page.drawText(textoSaldo, {
      x: alinearDerecha(textoSaldo, colSaldo + 60, fontNormal, 8), y, size: 8, font: fontNormal,
      color: saldo === 0 ? rgb(0, 0.5, 0) : rgb(0.8, 0.4, 0),
    });
    y -= 12;
  }
  y -= 4;
  const textoTotalDeudas = `TOTAL PAGADO A DEUDAS (${distribucion.length}): ${simbolo} ${formatearNumero(totalPagado)}`;
  asegurarEspacio(30);
  page.drawText(textoTotalDeudas, { x: margin, y, size: 9, font: fontBold, color: rgb(0, 0, 0) });
  y -= 25;

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
  if (datosPago.numeroCheque) {
    dibujarCampo("Nº Cheque:", datosPago.numeroCheque, 10);
  }
  dibujarCampo("Monto Pagado:", `${simbolo} ${formatearNumero(monto)}`, 10);
  dibujarCampo("ITF:", `${simbolo} ${formatearNumero(itf)}`, 10);
  dibujarCampo("Comisión:", `${simbolo} ${formatearNumero(comision)}`, 10);
  dibujarCampo("Total Debitado:", `${simbolo} ${formatearNumero(totalDebitado)}`, 10);
  y -= 10;

  // ═══════════════════════════════════════════════════════════
  // 7. TIPO DE CAMBIO (solo si las deudas no son en soles)
  // ═══════════════════════════════════════════════════════════
  const tipoCambio = Number(datosPago.tipoCambio || 1);
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
  asegurarEspacio(40);
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
  // 10. PIE DE PÁGINA (en todas las páginas)
  // ═══════════════════════════════════════════════════════════
  const paginas = pdfDoc.getPages();
  paginas.forEach((pagina, indice) => {
    let yPie = 80;
    pagina.drawLine({
      start: { x: margin, y: yPie }, end: { x: width - margin, y: yPie },
      thickness: 1, color: rgb(0.7, 0.7, 0.7),
    });
    yPie -= 15;

    if (usuario) {
      pagina.drawText(
        limpiarTexto(`Elaborado por: ${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim()),
        { x: margin, y: yPie, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5) },
      );
    }
    pagina.drawText(`Fecha de generación: ${new Date().toLocaleString("es-PE")}`, {
      x: width - margin - 200, y: yPie, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5),
    });
    yPie -= 12;

    const pie = `Sistema ERP Pesquera - Pago de Deudas Tributarias - Página ${indice + 1} de ${paginas.length}`;
    pagina.drawText(pie, {
      x: (width - fontNormal.widthOfTextAtSize(pie, 7)) / 2,
      y: yPie, size: 7, font: fontNormal, color: rgb(0.5, 0.5, 0.5),
    });
  });

  return await pdfDoc.save();
}

export default {
  generarYSubirVoucherConsolidado,
};
