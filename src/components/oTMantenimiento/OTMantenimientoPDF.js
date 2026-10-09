import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const PAGE_SIZE = [595.28, 841.89];
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const COLORS = {
  primary: rgb(0.08, 0.27, 0.45),
  primaryLight: rgb(0.88, 0.93, 0.97),
  secondary: rgb(0.2, 0.45, 0.33),
  gray: rgb(0.35, 0.38, 0.42),
  lightGray: rgb(0.94, 0.95, 0.96),
  border: rgb(0.72, 0.75, 0.78),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

const textoSeguro = (value) =>
  String(value ?? "-")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u2000-\u206F]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "-";

const formatearFecha = (value) => {
  if (!value) return "-";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "-";
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatearNumero = (value) =>
  Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const nombrePersona = (persona) =>
  textoSeguro(
    persona?.nombreCompleto ||
      [persona?.nombres, persona?.apellidos].filter(Boolean).join(" ") ||
      "-"
  );

const valorRuta = (objeto, ruta) =>
  ruta.split(".").reduce((valor, clave) => valor?.[clave], objeto);

const acumularMoneda = (mapa, moneda, campo, valor) => {
  const clave = String(moneda?.id || moneda?.codigoSunat || "SIN_MONEDA");
  const actual = mapa.get(clave) || {
    moneda,
    pactado: 0,
    facturado: 0,
    pagado: 0,
    saldo: 0,
    total: 0,
  };
  actual[campo] += Number(valor || 0);
  mapa.set(clave, actual);
};

export async function generarYSubirPDFOTMantenimiento(
  ot,
  empresa,
  contratistas = []
) {
  try {
    const pdfBytes = await generarPDFOTMantenimiento(ot, empresa, contratistas);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", blob, `ot-mantenimiento-${ot.numeroCompleto || ot.id}.pdf`);
    formData.append("moduleName", "ot-mantenimiento-documento");
    formData.append("entityId", ot.id);

    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Error al subir el PDF");
    }

    const resultado = await response.json();
    return { success: true, urlPdf: resultado.url };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

export async function generarPDFOTMantenimiento(ot, empresa, contratistas = []) {
  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  let logoImage = null;

  if (empresa?.logo && empresa?.id) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`);
      if (response.ok) {
        const bytes = await response.arrayBuffer();
        logoImage = empresa.logo.toLowerCase().includes(".png")
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);
      }
    } catch (error) {
      console.error("Error al cargar logo para PDF de OT:", error);
    }
  }

  let page;
  let y;
  const pages = [];

  const cortarTexto = (text, font, size, maxWidth) => {
    const palabras = textoSeguro(text).split(" ");
    const lineas = [];
    let linea = "";
    palabras.forEach((palabra) => {
      const candidata = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(candidata, size) <= maxWidth) {
        linea = candidata;
      } else {
        if (linea) lineas.push(linea);
        linea = palabra;
      }
    });
    if (linea) lineas.push(linea);
    return lineas.length ? lineas : ["-"];
  };

  const dibujarEncabezado = async () => {
    const top = PAGE_SIZE[1] - MARGIN;
    if (logoImage) {
      const escala = Math.min(82 / logoImage.width, 48 / logoImage.height);
      page.drawImage(logoImage, {
        x: MARGIN,
        y: top - logoImage.height * escala,
        width: logoImage.width * escala,
        height: logoImage.height * escala,
      });
    }

    const empresaX = MARGIN + 92;
    page.drawText(textoSeguro(empresa?.razonSocial || "EMPRESA"), {
      x: empresaX,
      y: top - 3,
      size: 11,
      font: fontBold,
      color: COLORS.primary,
      maxWidth: 285,
    });
    page.drawText(`RUC: ${textoSeguro(empresa?.ruc)}`, {
      x: empresaX,
      y: top - 18,
      size: 8,
      font: fontNormal,
    });
    const direccion = textoSeguro(empresa?.direccion || empresa?.direccionFiscal || "-");
    cortarTexto(direccion, fontNormal, 7.5, 285).slice(0, 2).forEach((linea, index) => {
      page.drawText(linea, { x: empresaX, y: top - 31 - index * 10, size: 7.5, font: fontNormal });
    });

    page.drawRectangle({
      x: PAGE_SIZE[0] - MARGIN - 128,
      y: top - 49,
      width: 128,
      height: 50,
      borderColor: COLORS.primary,
      borderWidth: 1,
      color: COLORS.primaryLight,
    });
    page.drawText("ORDEN DE TRABAJO", {
      x: PAGE_SIZE[0] - MARGIN - 118,
      y: top - 16,
      size: 10,
      font: fontBold,
      color: COLORS.primary,
    });
    page.drawText(`N° ${textoSeguro(ot.numeroCompleto || ot.id)}`, {
      x: PAGE_SIZE[0] - MARGIN - 118,
      y: top - 34,
      size: 11,
      font: fontBold,
    });
    page.drawLine({
      start: { x: MARGIN, y: top - 58 },
      end: { x: PAGE_SIZE[0] - MARGIN, y: top - 58 },
      thickness: 1.2,
      color: COLORS.primary,
    });
    y = top - 72;
  };

  const nuevaPagina = async () => {
    page = pdfDoc.addPage(PAGE_SIZE);
    pages.push(page);
    await dibujarEncabezado();
  };

  const asegurarEspacio = async (alto) => {
    if (y - alto < 48) await nuevaPagina();
  };

  const dibujarTituloSeccion = async (titulo, colorFondo = COLORS.primary) => {
    await asegurarEspacio(28);
    page.drawRectangle({
      x: MARGIN,
      y: y - 15,
      width: CONTENT_WIDTH,
      height: 18,
      color: colorFondo,
    });
    page.drawText(textoSeguro(titulo).toUpperCase(), {
      x: MARGIN + 7,
      y: y - 10,
      size: 8.5,
      font: fontBold,
      color: COLORS.white,
    });
    y -= 25;
  };

  const dibujarCampos = async (campos, columnas = 2) => {
    const ancho = CONTENT_WIDTH / columnas;
    const filas = Math.ceil(campos.length / columnas);
    await asegurarEspacio(filas * 28 + 4);
    for (let index = 0; index < campos.length; index += columnas) {
      const fila = campos.slice(index, index + columnas);
      const altoFila = Math.max(
        ...fila.map(([, valor]) => cortarTexto(valor, fontNormal, 8, ancho - 78).length),
        1
      ) * 10 + 9;
      await asegurarEspacio(altoFila + 4);
      fila.forEach(([label, valor], columna) => {
        const x = MARGIN + columna * ancho;
        page.drawRectangle({
          x,
          y: y - altoFila + 3,
          width: ancho,
          height: altoFila,
          borderColor: COLORS.border,
          borderWidth: 0.5,
        });
        page.drawText(textoSeguro(label), { x: x + 5, y: y - 8, size: 7.5, font: fontBold, color: COLORS.gray });
        cortarTexto(valor, fontNormal, 8, ancho - 78).forEach((linea, lineaIndex) => {
          page.drawText(linea, { x: x + 72, y: y - 8 - lineaIndex * 10, size: 8, font: fontNormal });
        });
      });
      y -= altoFila;
    }
    y -= 6;
  };

  const dibujarTextoLargo = async (titulo, contenido) => {
    if (!contenido) return;
    const lineas = cortarTexto(contenido, fontNormal, 8, CONTENT_WIDTH - 12);
    const alto = 24 + lineas.length * 10;
    await asegurarEspacio(alto);
    page.drawRectangle({
      x: MARGIN,
      y: y - alto + 5,
      width: CONTENT_WIDTH,
      height: alto,
      color: COLORS.lightGray,
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });
    page.drawText(textoSeguro(titulo), { x: MARGIN + 6, y: y - 10, size: 8, font: fontBold, color: COLORS.primary });
    lineas.forEach((linea, index) => {
      page.drawText(linea, { x: MARGIN + 6, y: y - 23 - index * 10, size: 8, font: fontNormal });
    });
    y -= alto + 5;
  };

  const dibujarTabla = async ({ titulo, titleColor, headers, widths, rows, aligns = [], emptyText = "Sin registros", footerText, footerTexts = [] }) => {
    if (titulo) await dibujarTituloSeccion(titulo, titleColor);
    const dibujarCabecera = () => {
      let x = MARGIN;
      page.drawRectangle({ x: MARGIN, y: y - 16, width: CONTENT_WIDTH, height: 18, color: COLORS.primaryLight });
      headers.forEach((header, index) => {
        page.drawText(textoSeguro(header), { x: x + 3, y: y - 10, size: 7, font: fontBold, color: COLORS.primary });
        x += widths[index];
      });
      y -= 20;
    };

    await asegurarEspacio(45);
    dibujarCabecera();
    if (!rows.length) {
      page.drawText(emptyText, { x: MARGIN + 5, y: y - 10, size: 8, font: fontItalic, color: COLORS.gray });
      y -= 20;
      return;
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex].map((value) => textoSeguro(value));
      const lineas = row.map((value, index) => cortarTexto(value, fontNormal, 7.2, widths[index] - 6));
      const alto = Math.max(...lineas.map((item) => item.length)) * 9 + 7;
      if (y - alto < 48) {
        await nuevaPagina();
        dibujarCabecera();
      }
      if (rowIndex % 2 === 1) {
        page.drawRectangle({ x: MARGIN, y: y - alto + 3, width: CONTENT_WIDTH, height: alto, color: rgb(0.975, 0.98, 0.985) });
      }
      let x = MARGIN;
      lineas.forEach((celda, columnIndex) => {
        celda.forEach((linea, lineIndex) => {
          const textWidth = fontNormal.widthOfTextAtSize(linea, 7.2);
          const align = aligns[columnIndex] || "left";
          const textX = align === "right" ? x + widths[columnIndex] - textWidth - 3 : align === "center" ? x + (widths[columnIndex] - textWidth) / 2 : x + 3;
          page.drawText(linea, { x: textX, y: y - 8 - lineIndex * 9, size: 7.2, font: fontNormal });
        });
        page.drawLine({ start: { x, y: y + 3 }, end: { x, y: y - alto + 3 }, thickness: 0.25, color: COLORS.border });
        x += widths[columnIndex];
      });
      page.drawLine({ start: { x: MARGIN + CONTENT_WIDTH, y: y + 3 }, end: { x: MARGIN + CONTENT_WIDTH, y: y - alto + 3 }, thickness: 0.25, color: COLORS.border });
      page.drawLine({ start: { x: MARGIN, y: y - alto + 3 }, end: { x: MARGIN + CONTENT_WIDTH, y: y - alto + 3 }, thickness: 0.25, color: COLORS.border });
      y -= alto;
    }
    const textosFooter = footerText ? [footerText, ...footerTexts] : footerTexts;
    for (const footer of textosFooter) {
      await asegurarEspacio(24);
      page.drawRectangle({
        x: MARGIN,
        y: y - 16,
        width: CONTENT_WIDTH,
        height: 19,
        color: COLORS.primary,
      });
      const textoFooter = textoSeguro(footer);
      const anchoFooter = fontBold.widthOfTextAtSize(textoFooter, 8);
      page.drawText(textoFooter, {
        x: MARGIN + CONTENT_WIDTH - anchoFooter - 6,
        y: y - 10,
        size: 8,
        font: fontBold,
        color: COLORS.white,
      });
      y -= 21;
    }
    y -= 7;
  };

  const dibujarResumenMonedas = async (titulo, mapa, campos) => {
    await dibujarTituloSeccion(titulo);
    const rows = [...mapa.values()].map((item) => [
      item.moneda?.codigoSunat || item.moneda?.nombreLargo || "Sin moneda",
      ...campos.map((campo) => `${item.moneda?.simbolo || ""} ${formatearNumero(item[campo.clave])}`),
    ]);
    const widths = [115, ...campos.map(() => (CONTENT_WIDTH - 115) / campos.length)];
    await dibujarTabla({
      headers: ["Moneda", ...campos.map((campo) => campo.label)],
      widths,
      rows,
      aligns: ["left", ...campos.map(() => "right")],
      emptyText: "Sin importes registrados",
    });
  };

  await nuevaPagina();
  await dibujarTituloSeccion("Información general de la orden de trabajo");
  await dibujarCampos([
    ["N° OT", ot.numeroCompleto || ot.id],
    ["Fecha", formatearFecha(ot.fechaDocumento)],
    ["Tipo", ot.tipoMantenimiento?.nombre || ot.tipoMantenimiento?.descripcion],
    ["Estado", ot.estado?.descripcion || ot.estado?.nombre],
    ["Prioridad", ot.prioridadAlta ? "ALTA" : "NORMAL"],
    ["Avance", `${formatearNumero(ot.porcentajeAvance)} %`],
    ["Sede", ot.sede?.nombre || ot.sede?.descripcion],
    ["Activo", ot.activo?.nombre || ot.activo?.descripcion],
    ["Motivo", ot.motivoOrigino?.nombre || ot.motivoOrigino?.descripcion],
    ["Moneda base", `${ot.moneda?.codigoSunat || "-"} ${ot.moneda?.simbolo || ""}`],
    ["Programada", formatearFecha(ot.fechaProgramada)],
    ["Inicio / Fin", `${formatearFecha(ot.fechaInicio)} / ${formatearFecha(ot.fechaFin)}`],
    ["Solicitante", nombrePersona(ot.solicitante)],
    ["Responsable", nombrePersona(ot.responsable)],
  ]);
  await dibujarTextoLargo("Descripción del problema", ot.descripcionProblema);
  await dibujarTextoLargo("Solución aplicada", ot.solucionAplicada);
  await dibujarTextoLargo("Observaciones", ot.observaciones);

  const totalesPresupuestos = new Map();
  const totalesDocumentos = new Map();

  for (let index = 0; index < contratistas.length; index += 1) {
    const presupuesto = contratistas[index];
    const moneda = presupuesto.moneda || ot.moneda;
    acumularMoneda(totalesPresupuestos, moneda, "pactado", presupuesto.montoPactado);
    acumularMoneda(totalesPresupuestos, moneda, "facturado", presupuesto.montoFacturado);
    acumularMoneda(totalesPresupuestos, moneda, "pagado", presupuesto.montoPagado);
    acumularMoneda(totalesPresupuestos, moneda, "saldo", presupuesto.saldo);

    await asegurarEspacio(145);
    await dibujarTituloSeccion(`Contratista ${index + 1}: ${presupuesto.contratista?.razonSocial || "Sin contratista"}`);
    await dibujarCampos([
      ["RUC / Documento", presupuesto.contratista?.numeroDocumento],
      ["Nombre comercial", presupuesto.contratista?.nombreComercial],
      ["Descripción", presupuesto.servicioDescripcion],
      ["Activo", presupuesto.activo?.nombre || presupuesto.activo?.descripcion],
      ["Estado", presupuesto.estado?.descripcion],
      ["Moneda", `${moneda?.codigoSunat || "-"} ${moneda?.simbolo || ""}`],
      ["Pactado", `${moneda?.simbolo || ""} ${formatearNumero(presupuesto.montoPactado)}`],
      ["Facturado", `${moneda?.simbolo || ""} ${formatearNumero(presupuesto.montoFacturado)}`],
      ["Pagado", `${moneda?.simbolo || ""} ${formatearNumero(presupuesto.montoPagado)}`],
      ["Saldo", `${moneda?.simbolo || ""} ${formatearNumero(presupuesto.saldo)}`],
    ]);

    const items = presupuesto.repuestos || [];
    const subtotalItems = items.reduce((total, item) => total + Number(item.total || 0), 0);
    await dibujarTabla({
      titulo: "Detalle de servicios y repuestos",
      headers: ["#", "Tipo / Producto", "Descripción", "Und.", "Cant.", "P. Unit.", "Total"],
      widths: [24, 142, 150, 45, 48, 58, 64],
      rows: items.map((item, itemIndex) => [
        item.numeroLinea || itemIndex + 1,
        item.producto?.descripcionArmada || item.producto?.descripcionBase || "Servicio",
        item.descripcion || "-",
        item.producto?.unidadMedida?.simbolo || "-",
        formatearNumero(item.cantidad),
        formatearNumero(item.precioUnitario),
        `${moneda?.simbolo || ""} ${formatearNumero(item.total)}`,
      ]),
      aligns: ["center", "left", "left", "center", "right", "right", "right"],
      emptyText: "No se registraron servicios ni repuestos",
      footerText: `Subtotal servicios y repuestos: ${moneda?.simbolo || ""} ${formatearNumero(subtotalItems)}`,
    });

    const documentos = presupuesto.documentosCompra || [];
    const subtotalesDocumentos = new Map();
    documentos.forEach((documento) => {
      acumularMoneda(totalesDocumentos, documento.moneda, "total", documento.total);
      acumularMoneda(totalesDocumentos, documento.moneda, "pagado", documento.cuentaPorPagar?.montoPagado);
      acumularMoneda(totalesDocumentos, documento.moneda, "saldo", documento.cuentaPorPagar?.saldoPendiente);
      acumularMoneda(subtotalesDocumentos, documento.moneda, "total", documento.total);
      acumularMoneda(subtotalesDocumentos, documento.moneda, "pagado", documento.cuentaPorPagar?.montoPagado);
      acumularMoneda(subtotalesDocumentos, documento.moneda, "saldo", documento.cuentaPorPagar?.saldoPendiente);
    });
    await dibujarTabla({
      titulo: "Documentos de compra generados",
      titleColor: COLORS.secondary,
      headers: ["N° OC", "Tipo", "Comprobante", "Fecha", "Empresa", "Mon.", "Total", "Pagado", "Saldo"],
      widths: [60, 52, 68, 48, 95, 35, 58, 58, 57],
      rows: documentos.map((documento) => [
        documento.numeroDocumento,
        documento.esGerencial ? "Gerencial" : documento.tipoDocumentoFinal?.descripcion || "Fiscal",
        documento.numeroDocumentoFinal || "-",
        formatearFecha(documento.fechaDocumento),
        documento.empresa?.razonSocial || "-",
        documento.moneda?.simbolo || "-",
        formatearNumero(documento.total),
        formatearNumero(documento.cuentaPorPagar?.montoPagado),
        formatearNumero(documento.cuentaPorPagar?.saldoPendiente),
      ]),
      aligns: ["left", "center", "left", "center", "left", "center", "right", "right", "right"],
      emptyText: "No se generaron documentos de compra",
      footerTexts: [...subtotalesDocumentos.values()].map((subtotal) => {
        const simbolo = subtotal.moneda?.simbolo || "";
        return `Subtotal ${simbolo}: Total ${simbolo} ${formatearNumero(subtotal.total)} | Pagado ${simbolo} ${formatearNumero(subtotal.pagado)} | Saldo ${simbolo} ${formatearNumero(subtotal.saldo)}`;
      }),
    });
  }

  await dibujarResumenMonedas("Totales de presupuestos por moneda", totalesPresupuestos, [
    { clave: "pactado", label: "Pactado" },
    { clave: "facturado", label: "Facturado" },
    { clave: "pagado", label: "Pagado" },
    { clave: "saldo", label: "Saldo" },
  ]);
  await dibujarResumenMonedas("Totales de documentos de compra por moneda", totalesDocumentos, [
    { clave: "total", label: "Total" },
    { clave: "pagado", label: "Pagado" },
    { clave: "saldo", label: "Saldo" },
  ]);

  await dibujarTituloSeccion("Total general de la OT en moneda base");
  await dibujarCampos([
    ["Moneda", `${ot.moneda?.codigoSunat || "-"} ${ot.moneda?.simbolo || ""}`],
    ["Monto pactado", `${ot.moneda?.simbolo || ""} ${formatearNumero(ot.totalMontoPactado)}`],
    ["Monto pagado", `${ot.moneda?.simbolo || ""} ${formatearNumero(ot.totalMontoPagado)}`],
    ["Saldo", `${ot.moneda?.simbolo || ""} ${formatearNumero(ot.totalSaldo)}`],
  ]);

  await asegurarEspacio(115);
  y -= 35;
  const firmas = [
    [nombrePersona(ot.solicitante), "SOLICITANTE"],
    [nombrePersona(ot.responsable), "RESPONSABLE DE MANTENIMIENTO"],
    ["", "CONFORMIDAD / AUTORIZACIÓN"],
  ];
  const anchoFirma = (CONTENT_WIDTH - 30) / 3;
  firmas.forEach(([nombre, cargo], index) => {
    const x = MARGIN + index * (anchoFirma + 15);
    page.drawLine({ start: { x, y }, end: { x: x + anchoFirma, y }, thickness: 0.8, color: COLORS.black });
    const nombreTexto = textoSeguro(nombre);
    const nombreWidth = fontNormal.widthOfTextAtSize(nombreTexto, 7.5);
    page.drawText(nombreTexto, { x: x + Math.max(0, (anchoFirma - nombreWidth) / 2), y: y - 13, size: 7.5, font: fontNormal, maxWidth: anchoFirma });
    const cargoWidth = fontBold.widthOfTextAtSize(cargo, 7);
    page.drawText(cargo, { x: x + Math.max(0, (anchoFirma - cargoWidth) / 2), y: y - 25, size: 7, font: fontBold, color: COLORS.primary });
  });

  pages.forEach((pagina, index) => {
    pagina.drawLine({
      start: { x: MARGIN, y: 32 },
      end: { x: PAGE_SIZE[0] - MARGIN, y: 32 },
      thickness: 0.4,
      color: COLORS.border,
    });
    pagina.drawText(`OT ${textoSeguro(ot.numeroCompleto || ot.id)} | Generado: ${formatearFecha(new Date())}`, {
      x: MARGIN,
      y: 19,
      size: 6.5,
      font: fontNormal,
      color: COLORS.gray,
    });
    const paginado = `Página ${index + 1} de ${pages.length}`;
    pagina.drawText(paginado, {
      x: PAGE_SIZE[0] - MARGIN - fontNormal.widthOfTextAtSize(paginado, 6.5),
      y: 19,
      size: 6.5,
      font: fontNormal,
      color: COLORS.gray,
    });
  });

  pdfDoc.setTitle(`Orden de Trabajo ${ot.numeroCompleto || ot.id}`);
  pdfDoc.setAuthor(empresa?.razonSocial || "ERP");
  pdfDoc.setSubject("Orden de Trabajo de Mantenimiento");
  return pdfDoc.save();
}
