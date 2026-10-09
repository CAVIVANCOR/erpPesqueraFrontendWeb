import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const PAGE_SIZE = [841.89, 595.28];
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const BOTTOM = 44;
const COLORS = {
  primary: rgb(0.08, 0.27, 0.45),
  primaryLight: rgb(0.88, 0.93, 0.97),
  band: rgb(0.13, 0.4, 0.72),
  day: rgb(0.93, 0.95, 0.97),
  gray: rgb(0.35, 0.38, 0.42),
  lightGray: rgb(0.96, 0.96, 0.97),
  border: rgb(0.72, 0.75, 0.78),
  ingreso: rgb(0.05, 0.4, 0.2),
  egreso: rgb(0.65, 0.1, 0.1),
  warn: rgb(0.7, 0.35, 0),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

// Detalle - anchos: Fecha, N° Op., Medio, Cuenta/Partida, A favor de, Concepto, Mon, Ingresos, Egresos, Saldo
const ANCHOS_FIJOS = [40, 58, 42, 118, 130, 0, 22, 62, 62, 64];
ANCHOS_FIJOS[5] = CONTENT_WIDTH - ANCHOS_FIJOS.reduce((a, b) => a + b, 0);
const COL_X = ANCHOS_FIJOS.reduce((acc, w, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + ANCHOS_FIJOS[i - 1]], []);
const COL = { fecha: 0, nroOp: 1, medio: 2, partida: 3, entidad: 4, concepto: 5, mon: 6, ingreso: 7, egreso: 8, saldo: 9 };

// Saldos por cuentas bancarias - anchos: Cuenta, Banco, Cta. contable, Mov., Saldo anterior, Ingresos, Egresos, Saldo final
const SALDOS_ANCHOS = [100, 165, 150, 34, 84, 84, 84, 0];
SALDOS_ANCHOS[7] = CONTENT_WIDTH - SALDOS_ANCHOS.reduce((a, b) => a + b, 0);
const SALDOS_X = SALDOS_ANCHOS.reduce((acc, w, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + SALDOS_ANCHOS[i - 1]], []);

// Solo caracteres que Helvetica (WinAnsi) puede dibujar
const textoSeguro = (value) =>
  String(value ?? "")
    .replace(/[\u2000-\u206F]/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatearNumero = (value) =>
  Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const montoOVacio = (value) => (Number(value) ? formatearNumero(value) : "");

const claveFecha = (value) => {
  const f = new Date(value);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};
const fechaCorta = (value) => {
  const f = new Date(value);
  return `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`;
};
const fechaLarga = (value) =>
  new Date(value)
    .toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();

const NOMBRE_MONEDA = { PEN: "SOLES", USD: "DOLARES AMERICANOS", EUR: "EUROS" };
const nombreMoneda = (moneda) => NOMBRE_MONEDA[moneda?.codigoSunat] || moneda?.codigoSunat || moneda?.simbolo || "";
const esMonedaNacional = (moneda) => Number(moneda?.id) === 1 || moneda?.codigoSunat === "PEN";

const ORIGENES = {
  CXC: "Cobro CxC",
  CXP: "Pago CxP",
  TRANSFERENCIA: "Transferencia",
  REVERSION: "Reversion",
  OTROS: "Otras operaciones",
};
const origenDe = (m) => {
  if (m.esReversion) return "REVERSION";
  if (m.esTransferencia || m.tipoMovimiento?.esTransferencia) return "TRANSFERENCIA";
  if (m.cuentaPorCobrarId) return "CXC";
  if (m.cuentaPorPagarId) return "CXP";
  return "OTROS";
};

const esAnulado = (m) => /ANUL/i.test(m.estadoMovimientoCaja?.descripcion || "");

const nombreCuenta = (cuenta) =>
  cuenta ? `${cuenta.numeroCuenta || cuenta.id} - ${cuenta.banco?.nombre || "BANCO"}` : "SIN CUENTA BANCARIA / CAJA";

/**
 * Convierte un movimiento en las líneas que afecta: una por cuenta tocada.
 * La naturaleza (ingreso/egreso) se toma del tipo de movimiento; si no está definida, se infiere de la cuenta.
 */
const lineasDe = (m) => {
  const monto = Number(m.monto) || 0;
  const origen = m.cuentaCorrienteOrigen;
  const destino = m.cuentaCorrienteDestino;
  const esTransferencia = m.esTransferencia || m.tipoMovimiento?.esTransferencia;
  if (origen && destino && esTransferencia) {
    return [
      { cuenta: origen, ingreso: 0, egreso: monto },
      { cuenta: destino, ingreso: monto, egreso: 0 },
    ];
  }
  const cuenta = origen || destino || null;
  let esIngreso = m.tipoMovimiento?.esIngreso;
  if (typeof esIngreso !== "boolean") esIngreso = Boolean(destino && !origen);
  return [{ cuenta, ingreso: esIngreso ? monto : 0, egreso: esIngreso ? 0 : monto }];
};

const acumular = (mapa, moneda, ingreso, egreso) => {
  const clave = String(moneda?.id ?? "0");
  const actual = mapa.get(clave) || { moneda, ingreso: 0, egreso: 0, cantidad: 0 };
  actual.ingreso += ingreso;
  actual.egreso += egreso;
  actual.cantidad += 1;
  mapa.set(clave, actual);
};

/**
 * Genera uno de los dos reportes (PDF independientes), según `parte`:
 *  - "movimientos": "Movimiento de Fondos". Un bloque por empresa (cada empresa inicia en página nueva):
 *    movimientos agrupados por cuenta, con subtotales por día, resumen del período y controles.
 *  - "saldos": "Saldos por Cuentas Bancarias" de todas las cuentas que se movieron, por empresa.
 *
 * @param {string} params.parte - "movimientos" (por defecto) | "saldos"
 * @param {Object} params
 * @param {Array} params.movimientos - movimientos de caja (de todas las empresas) con sus relaciones
 * @param {Object} params.enriquecimiento - { movimientos, cuentas, saldos } del backend (opcional)
 * @param {Array} params.empresas - catálogo de empresas (razonSocial, ruc, logo, id) para encabezados y logos
 * @param {Array<Date>} params.rango - [desde, hasta]
 * @param {Object} params.opciones - { incluirAnulados, incluirResumen }
 * @param {string} params.usuarioNombre - usuario que emite el reporte
 */
export async function generarPDFMovimientoFondos({
  movimientos = [],
  enriquecimiento = null,
  empresas = [],
  rango,
  opciones = {},
  usuarioNombre = "",
  parte = "movimientos",
}) {
  const { incluirAnulados = false, incluirResumen = true } = opciones;
  const desde = new Date(rango[0]);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(rango[1] || rango[0]);
  hasta.setHours(23, 59, 59, 999);

  // ── Selección de movimientos ──
  let anuladosOmitidos = 0;
  const considerados = movimientos.filter((m) => {
    if (!m.fechaOperacionMovCaja) return false;
    const fecha = new Date(m.fechaOperacionMovCaja);
    if (fecha < desde || fecha > hasta) return false;
    if (!incluirAnulados && esAnulado(m)) {
      anuladosOmitidos += 1;
      return false;
    }
    return true;
  });
  const totalMovimientos = considerados.length;
  if (totalMovimientos === 0) throw new Error("No hay movimientos en el rango de fechas elegido");

  const infoMovimientos = enriquecimiento?.movimientos || {};
  const cuentasContables = enriquecimiento?.cuentas || {};
  const saldoPor = new Map();
  (enriquecimiento?.saldos || []).forEach((s) => saldoPor.set(`${s.cuentaCorrienteId}|${s.movimientoCajaId}`, s));

  // ── Agrupación: empresa > cuenta > día > filas ──
  const grupos = new Map();
  considerados.forEach((m) => {
    const claveEmp = String(m.empresaId ?? m.empresa?.id ?? 0);
    if (!grupos.has(claveEmp)) {
      const info = empresas.find((e) => String(e.id) === claveEmp) || m.empresa || { id: claveEmp, razonSocial: "SIN EMPRESA" };
      grupos.set(claveEmp, {
        info,
        logo: null,
        cuentas: new Map(),
        monedas: new Map(),
        resumenTipo: new Map(),
        resumenDia: new Map(),
        control: { total: 0, sinAsiento: 0, montoSinAsiento: 0, gerencial: 0, sinSustento: 0, reversiones: 0 },
        saldosCuentas: [],
      });
    }
    const grupoEmp = grupos.get(claveEmp);
    const control = grupoEmp.control;

    if (m.moneda) grupoEmp.monedas.set(String(m.moneda.id), m.moneda);
    control.total += 1;
    if (enriquecimiento && !infoMovimientos[Number(m.id)]?.asiento) {
      control.sinAsiento += 1;
      control.montoSinAsiento += Number(m.monto) || 0;
    }
    if (m.esGerencial) control.gerencial += 1;
    if (m.operacionSinFactura) control.sinSustento += 1;
    if (m.esReversion) control.reversiones += 1;

    lineasDe(m).forEach((linea) => {
      const claveCuenta = linea.cuenta ? String(linea.cuenta.id) : "SIN_CUENTA";
      if (!grupoEmp.cuentas.has(claveCuenta)) {
        grupoEmp.cuentas.set(claveCuenta, { cuenta: linea.cuenta, dias: new Map(), totales: new Map() });
      }
      const grupoCuenta = grupoEmp.cuentas.get(claveCuenta);
      const claveDia = claveFecha(m.fechaOperacionMovCaja);
      if (!grupoCuenta.dias.has(claveDia)) grupoCuenta.dias.set(claveDia, { fecha: m.fechaOperacionMovCaja, filas: [] });
      grupoCuenta.dias.get(claveDia).filas.push({ m, ...linea });
      acumular(grupoCuenta.totales, m.moneda, linea.ingreso, linea.egreso);

      const tipo = m.tipoMovimiento?.nombre || "SIN TIPO";
      const claveTipo = `${tipo}|${m.moneda?.id}`;
      const actualTipo = grupoEmp.resumenTipo.get(claveTipo) || { tipo, moneda: m.moneda, ingreso: 0, egreso: 0, cantidad: 0 };
      actualTipo.ingreso += linea.ingreso;
      actualTipo.egreso += linea.egreso;
      actualTipo.cantidad += 1;
      grupoEmp.resumenTipo.set(claveTipo, actualTipo);

      const claveResDia = `${claveDia}|${m.moneda?.id}`;
      const actualDia = grupoEmp.resumenDia.get(claveResDia) || { clave: claveDia, fecha: m.fechaOperacionMovCaja, moneda: m.moneda, ingreso: 0, egreso: 0, cantidad: 0 };
      actualDia.ingreso += linea.ingreso;
      actualDia.egreso += linea.egreso;
      actualDia.cantidad += 1;
      grupoEmp.resumenDia.set(claveResDia, actualDia);
    });
  });

  const gruposOrdenados = [...grupos.values()].sort((a, b) =>
    String(a.info.razonSocial).localeCompare(String(b.info.razonSocial))
  );

  // ── Documento ──
  const pdfDoc = await PDFDocument.create();
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  for (const grupoEmp of gruposOrdenados) {
    const emp = grupoEmp.info;
    if (!emp?.logo || !emp?.id) continue;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/empresas-logo/${emp.id}/logo`);
      if (response.ok) {
        const bytes = await response.arrayBuffer();
        grupoEmp.logo = String(emp.logo).toLowerCase().includes(".png")
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);
      }
    } catch (error) {
      console.error("Error al cargar logo para el reporte de fondos:", error);
    }
  }

  const tituloRango =
    claveFecha(desde) === claveFecha(hasta)
      ? `CORRESPONDIENTE AL ${fechaCorta(desde)}`
      : `DEL ${fechaCorta(desde)} AL ${fechaCorta(hasta)}`;

  const pages = [];
  const pies = [];
  let page;
  let y;
  // Qué se dibuja en el encabezado de cada página nueva
  let encabezado = { empresa: null, logo: null, etiquetaMoneda: "", titulo: "MOVIMIENTO DE FONDOS", pie: "" };
  // Contexto para repetir bandas y cabecera de columnas al saltar de página
  let contexto = null; // { empresa, cuentaTitulo, columnas: 'detalle' | 'saldos' | null }

  const ancho = (texto, size, font = fontNormal) => font.widthOfTextAtSize(texto, size);

  const cortarTexto = (texto, font, size, maxWidth, maxLineas = 99) => {
    const palabras = textoSeguro(texto).split(" ").filter(Boolean);
    const lineas = [];
    let linea = "";
    palabras.forEach((palabra) => {
      const candidata = linea ? `${linea} ${palabra}` : palabra;
      if (ancho(candidata, size, font) <= maxWidth) {
        linea = candidata;
        return;
      }
      if (linea) lineas.push(linea);
      // Palabra más larga que la columna: se parte por caracteres
      while (ancho(palabra, size, font) > maxWidth && palabra.length > 1) {
        let corte = palabra.length - 1;
        while (corte > 1 && ancho(palabra.slice(0, corte), size, font) > maxWidth) corte -= 1;
        lineas.push(palabra.slice(0, corte));
        palabra = palabra.slice(corte);
      }
      linea = palabra;
    });
    if (linea) lineas.push(linea);
    if (lineas.length > maxLineas) {
      const recorte = lineas.slice(0, maxLineas);
      let ultima = recorte[maxLineas - 1];
      while (ultima.length > 1 && ancho(`${ultima}...`, size, font) > maxWidth) ultima = ultima.slice(0, -1);
      recorte[maxLineas - 1] = `${ultima}...`;
      return recorte;
    }
    return lineas;
  };

  const textoDerecha = (texto, xDerecha, yTexto, size = 7, font = fontNormal, color = COLORS.black) => {
    if (!texto) return;
    page.drawText(texto, { x: xDerecha - ancho(texto, size, font), y: yTexto, size, font, color });
  };

  const dibujarEncabezadoPagina = () => {
    const top = PAGE_SIZE[1] - MARGIN;
    const { empresa: emp, logo, etiquetaMoneda, titulo } = encabezado;
    if (logo) {
      const escala = Math.min(70 / logo.width, 36 / logo.height);
      page.drawImage(logo, { x: MARGIN, y: top - logo.height * escala, width: logo.width * escala, height: logo.height * escala });
    }
    const empresaX = MARGIN + (logo ? 78 : 0);
    page.drawText(textoSeguro(emp?.razonSocial || "CONSOLIDADO DE EMPRESAS"), {
      x: empresaX, y: top - 8, size: 9, font: fontBold, color: COLORS.primary, maxWidth: 260,
    });
    if (emp) page.drawText(`RUC: ${textoSeguro(emp.ruc || "-")}`, { x: empresaX, y: top - 20, size: 7.5, font: fontNormal });

    const centro = PAGE_SIZE[0] / 2;
    page.drawText(titulo, { x: centro - ancho(titulo, 15, fontBold) / 2, y: top - 10, size: 15, font: fontBold, color: COLORS.primary });
    page.drawText(tituloRango, { x: centro - ancho(tituloRango, 9, fontBold) / 2, y: top - 24, size: 9, font: fontBold });

    const emitido = `Emitido: ${fechaCorta(new Date())} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    textoDerecha(emitido, PAGE_SIZE[0] - MARGIN, top - 6, 7.5, fontNormal, COLORS.gray);
    if (usuarioNombre) textoDerecha(`Usuario: ${textoSeguro(usuarioNombre)}`, PAGE_SIZE[0] - MARGIN, top - 16, 7.5, fontNormal, COLORS.gray);
    textoDerecha(etiquetaMoneda, PAGE_SIZE[0] - MARGIN, top - 30, 11, fontBold, COLORS.primary);

    page.drawLine({ start: { x: MARGIN, y: top - 40 }, end: { x: PAGE_SIZE[0] - MARGIN, y: top - 40 }, thickness: 1.2, color: COLORS.primary });
    y = top - 48;
  };

  const dibujarCabeceraColumnas = () => {
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 15, color: COLORS.primaryLight, borderColor: COLORS.border, borderWidth: 0.5 });
    const etiquetas = ["Fecha", "N° Operacion", "Medio", "Cuenta / Partida", "A favor de / Depositante", "Concepto / Referencia", "Mon", "Ingresos", "Egresos", "Saldo"];
    etiquetas.forEach((etiqueta, i) => {
      if (i >= COL.ingreso) textoDerecha(etiqueta, COL_X[i] + ANCHOS_FIJOS[i] - 3, y - 9.5, 7, fontBold, COLORS.primary);
      else page.drawText(etiqueta, { x: COL_X[i] + 3, y: y - 9.5, size: 7, font: fontBold, color: COLORS.primary });
    });
    y -= 17;
  };

  const dibujarCabeceraSaldos = () => {
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 15, color: COLORS.primaryLight, borderColor: COLORS.border, borderWidth: 0.5 });
    const etiquetas = ["Numero de Cuenta", "Banco / Entidad Financiera", "Cuenta Contable", "Mov.", "Saldo Anterior", "Ingresos", "Egresos", "Saldo Final"];
    etiquetas.forEach((etiqueta, i) => {
      if (i >= 3) textoDerecha(etiqueta, SALDOS_X[i] + SALDOS_ANCHOS[i] - 3, y - 9.5, 7, fontBold, COLORS.primary);
      else page.drawText(etiqueta, { x: SALDOS_X[i] + 3, y: y - 9.5, size: 7, font: fontBold, color: COLORS.primary });
    });
    y -= 17;
  };

  const dibujarBandaEmpresa = (titulo) => {
    page.drawRectangle({ x: MARGIN, y: y - 15, width: CONTENT_WIDTH, height: 17, color: COLORS.band });
    page.drawText(textoSeguro(titulo), { x: MARGIN + 6, y: y - 10, size: 9, font: fontBold, color: COLORS.white });
    y -= 22;
  };

  const dibujarBandaCuenta = (titulo, continuacion = false) => {
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 16, color: COLORS.primary });
    page.drawText(textoSeguro(`${titulo}${continuacion ? "  (continuacion)" : ""}`), {
      x: MARGIN + 6, y: y - 9.5, size: 8.5, font: fontBold, color: COLORS.white,
    });
    y -= 19;
  };

  const nuevaPagina = () => {
    page = pdfDoc.addPage(PAGE_SIZE);
    pages.push(page);
    pies.push(encabezado.pie);
    dibujarEncabezadoPagina();
    if (contexto) {
      if (contexto.empresa) dibujarBandaEmpresa(contexto.empresa);
      if (contexto.cuentaTitulo) dibujarBandaCuenta(contexto.cuentaTitulo, true);
      if (contexto.columnas === "detalle") dibujarCabeceraColumnas();
      if (contexto.columnas === "saldos") dibujarCabeceraSaldos();
    }
  };

  const asegurarEspacio = (alto) => {
    if (y - alto < BOTTOM) nuevaPagina();
  };

  const subtituloSeccion = (titulo) => {
    asegurarEspacio(34);
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_WIDTH, height: 16, color: COLORS.primary });
    page.drawText(textoSeguro(titulo).toUpperCase(), { x: MARGIN + 6, y: y - 9.5, size: 8.5, font: fontBold, color: COLORS.white });
    y -= 20;
  };

  // ── Fila de movimiento ──
  const dibujarFila = (fila) => {
    const { m, cuenta, ingreso, egreso } = fila;
    const info = infoMovimientos[Number(m.id)];
    const saldoFila = cuenta ? saldoPor.get(`${cuenta.id}|${m.id}`) : null;

    const nroOp =
      m.numeroOperacionPagoBanco ||
      m.numeroOperacionPagoBancoImpuesto ||
      m.referenciaExtId ||
      `#${m.refOperacionEspecializadaMovCaja || m.id}`;
    const medio = m.medioPago?.codigo || m.medioPago?.nombre || "";

    const contrapartidas = (info?.contrapartidas || []).slice(0, 2).map((c) => `${c.codigoCuenta} ${c.nombreCuenta}`);
    const partidaPrincipal = contrapartidas.length ? contrapartidas.join(" / ") : m.tipoMovimiento?.nombre || "-";

    const entidadNombre =
      m.entidadComercial?.razonSocial ||
      (m.cuentaCorrienteOrigen && m.cuentaCorrienteDestino
        ? `${nombreCuenta(m.cuentaCorrienteOrigen)} > ${nombreCuenta(m.cuentaCorrienteDestino)}`
        : "-");

    const lineasMedio = cortarTexto(medio, fontNormal, 6.5, ANCHOS_FIJOS[COL.medio] - 5, 2);
    const lineasNroOp = cortarTexto(nroOp, fontNormal, 6.5, ANCHOS_FIJOS[COL.nroOp] - 5, 2);
    const lineasPartida = cortarTexto(partidaPrincipal, fontBold, 6.5, ANCHOS_FIJOS[COL.partida] - 5, 3);
    const lineasEntidad = cortarTexto(entidadNombre, fontNormal, 6.5, ANCHOS_FIJOS[COL.entidad] - 5, 2);
    if (m.entidadComercial?.numeroDocumento) lineasEntidad.push(`Doc. ${m.entidadComercial.numeroDocumento}`);
    const lineasConcepto = cortarTexto(m.descripcion || "-", fontNormal, 6.5, ANCHOS_FIJOS[COL.concepto] - 5, 3);

    // Línea de detalle contable (en gris, bajo la fila)
    const segmentos = [];
    if (info?.contrapartidas?.length) segmentos.push(`Tipo: ${m.tipoMovimiento?.nombre || "-"}`);
    segmentos.push(`Origen: ${ORIGENES[origenDe(m)]}`);
    segmentos.push(m.esGerencial ? "Libro: GERENCIAL" : "Libro: FISCAL");
    if (m.operacionSinFactura) segmentos.push("SIN SUSTENTO");
    if (m.centroCosto) segmentos.push(`CC: ${m.centroCosto.Nombre || m.centroCosto.Codigo || m.centroCosto.id}`);
    if (m.moneda && Number(m.tipoCambio) > 0 && Number(m.tipoCambio) !== 1) segmentos.push(`T/C ${Number(m.tipoCambio).toFixed(3)}`);
    if (m.refOperacionEspecializadaMovCaja) segmentos.push(`Op. #${m.refOperacionEspecializadaMovCaja}`);
    if (m.numeroOperacionPagoBancoImpuesto && m.numeroOperacionPagoBanco) segmentos.push(`Const. SUNAT ${m.numeroOperacionPagoBancoImpuesto}`);
    if (m.ctaCteEntidad?.numeroCuenta) segmentos.push(`Cta. destino: ${m.ctaCteEntidad.banco?.nombre || ""} ${m.ctaCteEntidad.numeroCuenta}`.trim());
    if (m.esReversion) segmentos.push("REVERSION");
    if (esAnulado(m)) segmentos.push("ANULADO");
    else if (m.estadoMovimientoCaja?.descripcion) segmentos.push(`Estado: ${m.estadoMovimientoCaja.descripcion}`);
    if (enriquecimiento) segmentos.push(info?.asiento ? `Asiento ${info.asiento.numeroAsiento}` : "SIN ASIENTO");

    const anchoDetalle = CONTENT_WIDTH - (COL_X[COL.partida] - MARGIN) - 6;
    const lineasDetalle = cortarTexto(segmentos.join("  |  "), fontItalic, 5.8, anchoDetalle, 2);

    const lineasMax = Math.max(lineasMedio.length, lineasNroOp.length, lineasPartida.length, lineasEntidad.length, lineasConcepto.length, 1);
    const alto = lineasMax * 7.6 + lineasDetalle.length * 6.6 + 5;
    asegurarEspacio(alto + 2);

    const base = y - 7;
    const dibujarLineas = (lineas, colIndex, font = fontNormal, color = COLORS.black) =>
      lineas.forEach((linea, i) => page.drawText(linea, { x: COL_X[colIndex] + 3, y: base - i * 7.6, size: 6.5, font, color }));

    page.drawText(fechaCorta(m.fechaOperacionMovCaja), { x: COL_X[COL.fecha] + 3, y: base, size: 6.5, font: fontNormal });
    dibujarLineas(lineasNroOp, COL.nroOp);
    dibujarLineas(lineasMedio, COL.medio);
    dibujarLineas(lineasPartida, COL.partida, fontBold, COLORS.primary);
    dibujarLineas(lineasEntidad, COL.entidad);
    dibujarLineas(lineasConcepto, COL.concepto);
    page.drawText(textoSeguro(m.moneda?.simbolo || ""), { x: COL_X[COL.mon] + 3, y: base, size: 6.5, font: fontNormal });
    textoDerecha(montoOVacio(ingreso), COL_X[COL.ingreso] + ANCHOS_FIJOS[COL.ingreso] - 3, base, 7, fontNormal, COLORS.ingreso);
    textoDerecha(montoOVacio(egreso), COL_X[COL.egreso] + ANCHOS_FIJOS[COL.egreso] - 3, base, 7, fontNormal, COLORS.egreso);
    if (saldoFila) {
      textoDerecha(formatearNumero(saldoFila.saldoActual), COL_X[COL.saldo] + ANCHOS_FIJOS[COL.saldo] - 3, base, 7, fontNormal, COLORS.gray);
    }

    lineasDetalle.forEach((linea, i) => {
      const alerta = /SIN ASIENTO|ANULADO|REVERSION|SIN SUSTENTO/.test(linea);
      page.drawText(linea, {
        x: COL_X[COL.partida] + 3,
        y: base - lineasMax * 7.6 - i * 6.6 + 1,
        size: 5.8,
        font: fontItalic,
        color: alerta ? COLORS.warn : COLORS.gray,
      });
    });

    y -= alto;
    page.drawLine({ start: { x: MARGIN, y: y + 1 }, end: { x: MARGIN + CONTENT_WIDTH, y: y + 1 }, thickness: 0.25, color: COLORS.border });
  };

  const dibujarSubtotalDia = (dia, filas, cuenta) => {
    const totales = new Map();
    filas.forEach((f) => acumular(totales, f.m.moneda, f.ingreso, f.egreso));
    const ultimaConSaldo = [...filas].reverse().find((f) => cuenta && saldoPor.get(`${cuenta.id}|${f.m.id}`));
    const saldoCierre = ultimaConSaldo ? saldoPor.get(`${cuenta.id}|${ultimaConSaldo.m.id}`).saldoActual : null;

    [...totales.values()].forEach((t, i) => {
      asegurarEspacio(14);
      page.drawRectangle({ x: MARGIN, y: y - 11, width: CONTENT_WIDTH, height: 12, color: COLORS.lightGray });
      const etiqueta = `Subtotal del dia ${fechaCorta(dia.fecha)}${totales.size > 1 ? ` (${t.moneda?.simbolo || ""})` : ""}  -  ${t.cantidad} movimiento(s)`;
      textoDerecha(etiqueta, COL_X[COL.mon] + ANCHOS_FIJOS[COL.mon] + 20, y - 8, 7, fontBold, COLORS.primary);
      textoDerecha(montoOVacio(t.ingreso), COL_X[COL.ingreso] + ANCHOS_FIJOS[COL.ingreso] - 3, y - 8, 7, fontBold, COLORS.ingreso);
      textoDerecha(montoOVacio(t.egreso), COL_X[COL.egreso] + ANCHOS_FIJOS[COL.egreso] - 3, y - 8, 7, fontBold, COLORS.egreso);
      if (i === 0 && saldoCierre !== null) {
        textoDerecha(formatearNumero(saldoCierre), COL_X[COL.saldo] + ANCHOS_FIJOS[COL.saldo] - 3, y - 8, 7, fontBold, COLORS.primary);
      }
      y -= 13;
    });
    y -= 3;
  };

  const dibujarTotalesCuenta = (grupoCuenta, saldoInicial, saldoFinal) => {
    const lista = [...grupoCuenta.totales.values()];
    asegurarEspacio(lista.length * 12 + 26);
    lista.forEach((t) => {
      page.drawRectangle({ x: MARGIN, y: y - 11, width: CONTENT_WIDTH, height: 12, color: COLORS.primaryLight });
      const etiqueta = `Total movimientos de la cuenta${lista.length > 1 ? ` (${t.moneda?.simbolo || ""})` : ""}  -  ${t.cantidad} registro(s) :`;
      textoDerecha(etiqueta, COL_X[COL.mon] + ANCHOS_FIJOS[COL.mon] + 20, y - 8, 7, fontBold, COLORS.primary);
      textoDerecha(formatearNumero(t.ingreso), COL_X[COL.ingreso] + ANCHOS_FIJOS[COL.ingreso] - 3, y - 8, 7.5, fontBold, COLORS.ingreso);
      textoDerecha(formatearNumero(t.egreso), COL_X[COL.egreso] + ANCHOS_FIJOS[COL.egreso] - 3, y - 8, 7.5, fontBold, COLORS.egreso);
      y -= 13;
    });
    if (saldoInicial !== null && saldoFinal !== null) {
      page.drawRectangle({ x: MARGIN, y: y - 11, width: CONTENT_WIDTH, height: 12, color: COLORS.primaryLight });
      textoDerecha(`Saldo inicial : ${formatearNumero(saldoInicial)}      Saldo final de la cuenta :`, COL_X[COL.saldo] - 4, y - 8, 7, fontBold, COLORS.primary);
      textoDerecha(formatearNumero(saldoFinal), COL_X[COL.saldo] + ANCHOS_FIJOS[COL.saldo] - 3, y - 8, 7.5, fontBold, COLORS.primary);
      y -= 13;
    }
    y -= 8;
  };

  // ── Tabla de resumen genérica ──
  const dibujarTablaResumen = ({ titulo, headers, widths, rows, aligns, totalRow }) => {
    subtituloSeccion(titulo);
    const anchoTabla = widths.reduce((a, b) => a + b, 0);
    asegurarEspacio(30);
    page.drawRectangle({ x: MARGIN, y: y - 12, width: anchoTabla, height: 13, color: COLORS.primaryLight });
    let xCab = MARGIN;
    headers.forEach((h, i) => {
      if (aligns[i] === "right") textoDerecha(h, xCab + widths[i] - 3, y - 8.5, 6.8, fontBold, COLORS.primary);
      else page.drawText(h, { x: xCab + 3, y: y - 8.5, size: 6.8, font: fontBold, color: COLORS.primary });
      xCab += widths[i];
    });
    y -= 15;
    const pintar = (fila, negrita = false) => {
      asegurarEspacio(12);
      const font = negrita ? fontBold : fontNormal;
      let x = MARGIN;
      fila.forEach((celda, i) => {
        const texto = cortarTexto(String(celda ?? ""), font, 6.8, widths[i] - 6, 1)[0] || "";
        if (aligns[i] === "right") textoDerecha(texto, x + widths[i] - 3, y - 8, 6.8, font);
        else page.drawText(texto, { x: x + 3, y: y - 8, size: 6.8, font });
        x += widths[i];
      });
      y -= 11;
      page.drawLine({ start: { x: MARGIN, y: y + 1 }, end: { x: MARGIN + anchoTabla, y: y + 1 }, thickness: 0.2, color: COLORS.border });
    };
    rows.forEach((fila) => pintar(fila));
    if (totalRow) pintar(totalRow, true);
    y -= 8;
  };

  const sumar = (lista) =>
    lista.reduce(
      (acc, r) => ({ ingreso: acc.ingreso + r.ingreso, egreso: acc.egreso + r.egreso, cantidad: acc.cantidad + r.cantidad }),
      { ingreso: 0, egreso: 0, cantidad: 0 }
    );

  // Resumen del período de una empresa (por día, por tipo de operación y controles)
  const dibujarResumenEmpresa = (grupoEmp) => {
    const monedasLista = [...grupoEmp.monedas.values()];
    contexto = { empresa: null, cuentaTitulo: null, columnas: null };
    asegurarEspacio(60);
    page.drawText("RESUMEN DEL PERIODO", { x: MARGIN, y: y - 4, size: 11, font: fontBold, color: COLORS.primary });
    y -= 16;

    monedasLista.forEach((moneda) => {
      const dias = [...grupoEmp.resumenDia.values()]
        .filter((d) => String(d.moneda?.id) === String(moneda.id))
        .sort((a, b) => a.clave.localeCompare(b.clave));
      const t = sumar(dias);
      dibujarTablaResumen({
        titulo: `Resumen por dia - ${nombreMoneda(moneda)}`,
        headers: ["Fecha", "Dia", "Registros", "Ingresos", "Egresos", "Neto del dia"],
        widths: [80, 170, 60, 110, 110, 110],
        aligns: ["left", "left", "right", "right", "right", "right"],
        rows: dias.map((d) => [fechaCorta(d.fecha), fechaLarga(d.fecha).split(",")[0], d.cantidad, formatearNumero(d.ingreso), formatearNumero(d.egreso), formatearNumero(d.ingreso - d.egreso)]),
        totalRow: ["TOTAL", "", t.cantidad, formatearNumero(t.ingreso), formatearNumero(t.egreso), formatearNumero(t.ingreso - t.egreso)],
      });
    });

    monedasLista.forEach((moneda) => {
      const tipos = [...grupoEmp.resumenTipo.values()]
        .filter((d) => String(d.moneda?.id) === String(moneda.id))
        .sort((a, b) => b.ingreso + b.egreso - (a.ingreso + a.egreso));
      const t = sumar(tipos);
      dibujarTablaResumen({
        titulo: `Resumen por tipo de operacion - ${nombreMoneda(moneda)}`,
        headers: ["Tipo de movimiento", "Registros", "Ingresos", "Egresos"],
        widths: [380, 70, 120, 120],
        aligns: ["left", "right", "right", "right"],
        rows: tipos.map((d) => [d.tipo, d.cantidad, formatearNumero(d.ingreso), formatearNumero(d.egreso)]),
        totalRow: ["TOTAL", t.cantidad, formatearNumero(t.ingreso), formatearNumero(t.egreso)],
      });
    });

    const control = grupoEmp.control;
    const controles = [["Movimientos de la empresa incluidos en el reporte", control.total]];
    if (anuladosOmitidos > 0) controles.push(["Movimientos anulados omitidos (de todas las empresas)", anuladosOmitidos]);
    if (enriquecimiento) {
      controles.push([
        "Movimientos sin asiento contable asociado",
        `${control.sinAsiento}${control.sinAsiento ? ` (monto ${formatearNumero(control.montoSinAsiento)})` : ""}`,
      ]);
    } else {
      controles.push(["Asientos y saldos", "No disponibles (el reporte se genero sin consultar la contabilidad)"]);
    }
    controles.push(["Movimientos del libro GERENCIAL", control.gerencial]);
    controles.push(["Movimientos sin documento de sustento", control.sinSustento]);
    controles.push(["Reversiones", control.reversiones]);
    dibujarTablaResumen({
      titulo: "Controles y observaciones",
      headers: ["Concepto", "Resultado"],
      widths: [380, 340],
      aligns: ["left", "left"],
      rows: controles,
    });

    asegurarEspacio(60);
    y -= 30;
    const anchoFirma = (CONTENT_WIDTH - 60) / 3;
    ["Elaborado por", "Revisado por (Contabilidad)", "V°B° Gerencia / Tesoreria"].forEach((cargo, i) => {
      const x = MARGIN + i * (anchoFirma + 30);
      page.drawLine({ start: { x, y }, end: { x: x + anchoFirma, y }, thickness: 0.8, color: COLORS.black });
      page.drawText(textoSeguro(cargo), { x: x + (anchoFirma - ancho(textoSeguro(cargo), 7.5, fontBold)) / 2, y: y - 12, size: 7.5, font: fontBold, color: COLORS.primary });
    });
  };

  const tituloEmpresaDe = (grupoEmp) =>
    `${textoSeguro(grupoEmp.info.razonSocial || "EMPRESA")}${grupoEmp.info.ruc ? ` - ${grupoEmp.info.ruc}` : ""}`;

  // Datos del reporte de saldos: por cada cuenta que se movió, saldo anterior, ingresos, egresos y saldo final
  gruposOrdenados.forEach((grupoEmp) => {
    grupoEmp.cuentas.forEach((grupoCuenta) => {
      const cuenta = grupoCuenta.cuenta;
      if (!cuenta) return;
      const registrosSaldo = [];
      grupoCuenta.dias.forEach((dia) =>
        dia.filas.forEach((fila) => {
          const s = saldoPor.get(`${cuenta.id}|${fila.m.id}`);
          if (s) registrosSaldo.push(s);
        })
      );
      registrosSaldo.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || Number(a.id) - Number(b.id));
      const sumaMov = sumar([...grupoCuenta.totales.values()]);
      grupoEmp.saldosCuentas.push({
        cuenta,
        contable: cuentasContables[Number(cuenta.id)] || null,
        cantidad: sumaMov.cantidad,
        saldoInicial: registrosSaldo.length ? registrosSaldo[0].saldoAnterior : null,
        saldoFinal: registrosSaldo.length ? registrosSaldo[registrosSaldo.length - 1].saldoActual : null,
        // Con saldos registrados se usan los importes en la moneda de la cuenta; si no, los del movimiento
        ingreso: registrosSaldo.length ? registrosSaldo.reduce((s, r) => s + Number(r.ingresos || 0), 0) : sumaMov.ingreso,
        egreso: registrosSaldo.length ? registrosSaldo.reduce((s, r) => s + Number(r.egresos || 0), 0) : sumaMov.egreso,
      });
    });
  });

  // ════════════════════════════════════════════════════════════
  // REPORTE 1: MOVIMIENTO DE FONDOS - un bloque por empresa (página nueva por empresa)
  // ════════════════════════════════════════════════════════════
  if (parte === "movimientos") gruposOrdenados.forEach((grupoEmp) => {
    const monedasLista = [...grupoEmp.monedas.values()];
    const tituloEmpresa = tituloEmpresaDe(grupoEmp);
    encabezado = {
      empresa: grupoEmp.info,
      logo: grupoEmp.logo,
      etiquetaMoneda: monedasLista.length === 1 ? nombreMoneda(monedasLista[0]) : monedasLista.length > 1 ? "MULTIMONEDA" : "",
      titulo: "MOVIMIENTO DE FONDOS",
      pie: `${textoSeguro(grupoEmp.info.razonSocial || "")} | Movimiento de Fondos ${tituloRango.toLowerCase()}`,
    };
    contexto = null;
    nuevaPagina(); // cada empresa inicia en una página nueva
    dibujarBandaEmpresa(tituloEmpresa);

    [...grupoEmp.cuentas.values()]
      .sort((a, b) => {
        if (!a.cuenta) return 1;
        if (!b.cuenta) return -1;
        return nombreCuenta(a.cuenta).localeCompare(nombreCuenta(b.cuenta));
      })
      .forEach((grupoCuenta) => {
        const cuenta = grupoCuenta.cuenta;
        const contable = cuenta ? cuentasContables[Number(cuenta.id)] : null;
        const tituloCuenta = `${nombreCuenta(cuenta)}${cuenta?.moneda?.simbolo ? `  (${cuenta.moneda.simbolo})` : ""}${
          contable ? `  -  Cta. contable ${contable.codigoCuenta} ${contable.nombreCuenta}` : ""
        }`;

        asegurarEspacio(60);
        contexto = { empresa: tituloEmpresa, cuentaTitulo: tituloCuenta, columnas: "detalle" };
        dibujarBandaCuenta(tituloCuenta);
        dibujarCabeceraColumnas();

        const dias = [...grupoCuenta.dias.entries()].sort(([a], [b]) => a.localeCompare(b));
        const registrosSaldo = [];

        dias.forEach(([, dia]) => {
          dia.filas.sort((a, b) => Number(a.m.id) - Number(b.m.id));
          asegurarEspacio(34);
          page.drawRectangle({ x: MARGIN, y: y - 11, width: CONTENT_WIDTH, height: 12, color: COLORS.day });
          page.drawText(fechaLarga(dia.fecha), { x: MARGIN + 4, y: y - 8, size: 7.5, font: fontBold, color: COLORS.primary });
          y -= 14;
          dia.filas.forEach((fila) => {
            if (cuenta) {
              const s = saldoPor.get(`${cuenta.id}|${fila.m.id}`);
              if (s) registrosSaldo.push(s);
            }
            dibujarFila(fila);
          });
          dibujarSubtotalDia(dia, dia.filas, cuenta);
        });

        registrosSaldo.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || Number(a.id) - Number(b.id));
        const saldoInicial = registrosSaldo.length ? registrosSaldo[0].saldoAnterior : null;
        const saldoFinal = registrosSaldo.length ? registrosSaldo[registrosSaldo.length - 1].saldoActual : null;
        dibujarTotalesCuenta(grupoCuenta, saldoInicial, saldoFinal);
      });

    if (incluirResumen) dibujarResumenEmpresa(grupoEmp);
    contexto = null;
  });

  // ════════════════════════════════════════════════════════════
  // REPORTE 2: SALDOS POR CUENTAS BANCARIAS - todas las cuentas que se movieron, por empresa
  // ════════════════════════════════════════════════════════════
  const dibujarSaldosPorCuentas = () => {
    const conCuentas = gruposOrdenados.filter((g) => g.saldosCuentas.length > 0);
    if (conCuentas.length === 0) throw new Error("No hay cuentas bancarias o cajas con movimientos en el rango de fechas elegido");

    encabezado = {
      empresa: null,
      logo: null,
      etiquetaMoneda: "",
      titulo: "SALDOS POR CUENTAS BANCARIAS",
      pie: "Saldos por Cuentas Bancarias",
    };
    contexto = null;
    nuevaPagina();

    const filaSaldos = (celdas, { negrita = false, colorMonto = COLORS.black } = {}) => {
      asegurarEspacio(12);
      const font = negrita ? fontBold : fontNormal;
      celdas.forEach((celda, i) => {
        const texto = cortarTexto(String(celda ?? ""), font, 7, SALDOS_ANCHOS[i] - 6, 1)[0] || "";
        if (i >= 3) textoDerecha(texto, SALDOS_X[i] + SALDOS_ANCHOS[i] - 3, y - 8, 7, font, i === 7 && !negrita ? COLORS.primary : colorMonto);
        else page.drawText(texto, { x: SALDOS_X[i] + 3, y: y - 8, size: 7, font });
      });
      y -= 11.5;
    };

    conCuentas.forEach((grupoEmp) => {
      const tituloEmpresa = tituloEmpresaDe(grupoEmp);
      asegurarEspacio(80);
      contexto = { empresa: tituloEmpresa, cuentaTitulo: null, columnas: "saldos" };
      dibujarBandaEmpresa(tituloEmpresa);
      dibujarCabeceraSaldos();

      [true, false].forEach((nacional) => {
        const cuentas = grupoEmp.saldosCuentas
          .filter((c) => esMonedaNacional(c.cuenta.moneda) === nacional)
          .sort((a, b) => {
            const efectivoA = /EFECTIVO/i.test(a.cuenta.banco?.nombre || "") ? 1 : 0;
            const efectivoB = /EFECTIVO/i.test(b.cuenta.banco?.nombre || "") ? 1 : 0;
            return (
              efectivoA - efectivoB ||
              String(a.cuenta.banco?.nombre || "").localeCompare(String(b.cuenta.banco?.nombre || "")) ||
              String(a.cuenta.numeroCuenta || "").localeCompare(String(b.cuenta.numeroCuenta || ""))
            );
          });
        if (cuentas.length === 0) return;

        asegurarEspacio(40);
        page.drawText(nacional ? "MONEDA NACIONAL" : "MONEDA EXTRANJERA", { x: MARGIN + 4, y: y - 8, size: 7.5, font: fontBold, color: COLORS.primary });
        y -= 13;

        // Subtotales por moneda (en moneda extranjera puede haber más de una)
        const subtotales = new Map();
        cuentas.forEach((c) => {
          filaSaldos([
            c.cuenta.numeroCuenta || c.cuenta.id,
            c.cuenta.banco?.nombre || "-",
            c.contable ? `${c.contable.codigoCuenta} ${c.contable.nombreCuenta}` : "-",
            c.cantidad,
            c.saldoInicial === null ? "-" : formatearNumero(c.saldoInicial),
            formatearNumero(c.ingreso),
            formatearNumero(c.egreso),
            c.saldoFinal === null ? "-" : formatearNumero(c.saldoFinal),
          ]);
          const clave = String(c.cuenta.moneda?.id ?? "0");
          const actual = subtotales.get(clave) || { moneda: c.cuenta.moneda, inicial: 0, ingreso: 0, egreso: 0, final: 0, cantidad: 0, sinSaldo: false };
          actual.inicial += c.saldoInicial ?? 0;
          actual.final += c.saldoFinal ?? 0;
          actual.ingreso += c.ingreso;
          actual.egreso += c.egreso;
          actual.cantidad += c.cantidad;
          if (c.saldoInicial === null) actual.sinSaldo = true;
          subtotales.set(clave, actual);
        });

        subtotales.forEach((t) => {
          asegurarEspacio(16);
          page.drawLine({ start: { x: SALDOS_X[3], y: y + 1 }, end: { x: MARGIN + CONTENT_WIDTH, y: y + 1 }, thickness: 0.6, color: COLORS.primary });
          textoDerecha(`Sub-Total ${t.moneda?.simbolo || ""} :`, SALDOS_X[4] - 6, y - 8, 7.5, fontBold, COLORS.primary);
          filaSaldos(
            ["", "", "", t.cantidad, t.sinSaldo ? "-" : formatearNumero(t.inicial), formatearNumero(t.ingreso), formatearNumero(t.egreso), t.sinSaldo ? "-" : formatearNumero(t.final)],
            { negrita: true }
          );
          y -= 4;
        });
      });
      y -= 6;
    });

    asegurarEspacio(40);
    contexto = null;
    page.drawText("Saldo Anterior: saldo de la cuenta antes del primer movimiento del rango. Saldo Final: saldo tras el ultimo movimiento del rango.", {
      x: MARGIN, y: y - 4, size: 6.5, font: fontItalic, color: COLORS.gray,
    });
    page.drawText("Los importes se expresan en la moneda de cada cuenta; las cuentas sin saldos registrados muestran '-'.", {
      x: MARGIN, y: y - 13, size: 6.5, font: fontItalic, color: COLORS.gray,
    });
  };
  if (parte === "saldos") dibujarSaldosPorCuentas();

  // ── Pie de página ──
  pages.forEach((pagina, index) => {
    pagina.drawLine({ start: { x: MARGIN, y: 30 }, end: { x: PAGE_SIZE[0] - MARGIN, y: 30 }, thickness: 0.4, color: COLORS.border });
    pagina.drawText(textoSeguro(pies[index] || ""), { x: MARGIN, y: 18, size: 6.5, font: fontNormal, color: COLORS.gray });
    const paginado = `Pagina ${index + 1} de ${pages.length}`;
    pagina.drawText(paginado, { x: PAGE_SIZE[0] - MARGIN - ancho(paginado, 6.5), y: 18, size: 6.5, font: fontNormal, color: COLORS.gray });
  });

  pdfDoc.setTitle(`${parte === "saldos" ? "Saldos por Cuentas Bancarias" : "Movimiento de Fondos"} ${tituloRango}`);
  pdfDoc.setAuthor("ERP");
  pdfDoc.setSubject(parte === "saldos" ? "Saldos por cuentas bancarias" : "Reporte diario de movimientos de fondos");

  return { bytes: await pdfDoc.save(), totalMovimientos, totalEmpresas: gruposOrdenados.length };
}
