// src/components/tesoreria/reports/prestamosEntidadReporteUtils.js
// Cálculos compartidos por la pantalla y los reportes (PDF / Excel) de préstamos con accionistas y terceros.
// Solo hay dos términos: Prestamista (presta el dinero) y Deudor (recibe el préstamo y debe devolverlo).
// Valores internos: OTORGADO = la empresa es el Prestamista; RECIBIDO = la empresa es el Deudor.

const ESTADO_VIGENTE = 81;
const MS_DIA = 24 * 60 * 60 * 1000;

/** Préstamo con saldo por devolver (vigente y con capital pendiente). */
export const esPendiente = (p) => Number(p?.estadoId) === ESTADO_VIGENTE && Number(p?.saldoCapital) > 0;

export const formatoMonto = (valor) =>
  new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor || 0));

export const formatoFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-");

/** Rol de la empresa en el préstamo. */
export const rolEmpresa = (sentido) => (sentido === "OTORGADO" ? "Prestamista" : "Deudor");

export const etiquetaSentido = (sentido) => `Empresa como ${rolEmpresa(sentido)}`;

/** Quién es el Prestamista y quién el Deudor del préstamo (la otra parte lleva su tipo: accionista o tercero). */
export function partesDelPrestamo(p) {
  const otraParte = `${p.esAccionista ? "Accionista" : "Tercero"}: ${p.entidadComercial?.razonSocial || "-"}`;
  const empresa = p.empresa?.razonSocial || "-";
  return p.sentido === "OTORGADO" ? { prestamista: empresa, deudor: otraParte } : { prestamista: otraParte, deudor: empresa };
}

/** Situación del plazo: días vencido o por vencer (si tiene fecha de vencimiento). */
export function situacionVencimiento(prestamo, hoy = new Date()) {
  if (!prestamo?.fechaVencimiento) return { texto: "Sin vencimiento", dias: null, vencido: false };
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const vence = new Date(prestamo.fechaVencimiento);
  const dias = Math.floor((inicioHoy - new Date(vence.getFullYear(), vence.getMonth(), vence.getDate())) / MS_DIA);
  if (dias > 0) return { texto: `Vencido hace ${dias} d`, dias, vencido: true };
  if (dias === 0) return { texto: "Vence hoy", dias, vencido: false };
  return { texto: `Vence en ${-dias} d`, dias, vencido: false };
}

const sumar = (lista, campo) => lista.reduce((suma, p) => suma + Number(p[campo] || 0), 0);

/** Totales de una lista de préstamos (en la moneda de cada préstamo). */
export const totalesDe = (lista) => ({
  cantidad: lista.length,
  desembolsado: sumar(lista, "montoDesembolsado"),
  devuelto: sumar(lista, "capitalPagado") + sumar(lista, "montoPagadoAnterior"),
  saldo: sumar(lista, "saldoCapital"),
});

/** Agrupa por rol de la empresa y moneda: [{ sentido, codigo, simbolo, items, totales }], Deudor primero. */
export function agruparPorSentidoYMoneda(items) {
  const grupos = new Map();
  for (const p of items) {
    const codigo = p.moneda?.codigoSunat || "SIN MONEDA";
    const clave = `${p.sentido}|${codigo}`;
    if (!grupos.has(clave)) grupos.set(clave, { sentido: p.sentido, codigo, simbolo: p.moneda?.simbolo || "", items: [] });
    grupos.get(clave).items.push(p);
  }
  return [...grupos.values()]
    .sort((a, b) => (a.sentido === b.sentido ? a.codigo.localeCompare(b.codigo) : a.sentido === "RECIBIDO" ? -1 : 1))
    .map((g) => ({
      ...g,
      items: [...g.items].sort(
        (a, b) =>
          (a.empresa?.razonSocial || "").localeCompare(b.empresa?.razonSocial || "") ||
          (a.entidadComercial?.razonSocial || "").localeCompare(b.entidadComercial?.razonSocial || "") ||
          new Date(a.fechaDesembolso) - new Date(b.fechaDesembolso),
      ),
      totales: totalesDe(g.items),
    }));
}

/** Total por rol de la empresa y moneda (para la pantalla): [{ sentido, codigo, simbolo, total }]. */
export const saldosPorSentido = (items) =>
  agruparPorSentidoYMoneda(items).map((g) => ({ sentido: g.sentido, codigo: g.codigo, simbolo: g.simbolo, total: g.totales.saldo }));

/**
 * Resumen por empresa y moneda: lo que cada empresa debe como Deudor y lo que le deben como Prestamista.
 * Neto = como Prestamista - como Deudor.
 */
export function resumenPorEmpresa(items) {
  const monedas = new Map();
  for (const p of items) {
    const codigo = p.moneda?.codigoSunat || "SIN MONEDA";
    if (!monedas.has(codigo)) monedas.set(codigo, { codigo, simbolo: p.moneda?.simbolo || "", empresas: new Map() });
    const bloque = monedas.get(codigo);
    const id = String(p.empresa?.id);
    if (!bloque.empresas.has(id)) bloque.empresas.set(id, { empresa: p.empresa?.razonSocial || `#${id}`, comoPrestamista: 0, comoDeudor: 0 });
    const fila = bloque.empresas.get(id);
    if (p.sentido === "RECIBIDO") fila.comoDeudor += Number(p.saldoCapital || 0);
    else fila.comoPrestamista += Number(p.saldoCapital || 0);
  }
  return [...monedas.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((m) => {
      const filas = [...m.empresas.values()].map((f) => ({ ...f, neto: f.comoPrestamista - f.comoDeudor })).sort((a, b) => a.empresa.localeCompare(b.empresa));
      return {
        codigo: m.codigo,
        simbolo: m.simbolo,
        filas,
        totales: { comoPrestamista: filas.reduce((s, f) => s + f.comoPrestamista, 0), comoDeudor: filas.reduce((s, f) => s + f.comoDeudor, 0) },
      };
    });
}
