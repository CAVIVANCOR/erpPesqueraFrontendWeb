// src/components/tesoreria/reports/prestamosEntidadReporteUtils.js
// Cálculos compartidos por la pantalla y los reportes (PDF / Excel) de préstamos con accionistas y terceros.

const ESTADO_VIGENTE = 81;
const MS_DIA = 24 * 60 * 60 * 1000;

/** Préstamo con saldo pendiente (vigente y con capital por pagar o cobrar). */
export const esPendiente = (p) => Number(p?.estadoId) === ESTADO_VIGENTE && Number(p?.saldoCapital) > 0;

export const formatoMonto = (valor) =>
  new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor || 0));

export const formatoFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-");

export const etiquetaSentido = (sentido) => (sentido === "RECIBIDO" ? "Recibido (por pagar)" : "Otorgado (por cobrar)");

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
  pagado: sumar(lista, "capitalPagado") + sumar(lista, "montoPagadoAnterior"),
  saldo: sumar(lista, "saldoCapital"),
});

/** Agrupa por sentido y moneda: [{ sentido, codigo, simbolo, items, totales }], recibidos primero. */
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

/** Total por sentido y moneda (para la pantalla): [{ sentido, codigo, simbolo, total }]. */
export const saldosPorSentido = (items) =>
  agruparPorSentidoYMoneda(items).map((g) => ({ sentido: g.sentido, codigo: g.codigo, simbolo: g.simbolo, total: g.totales.saldo }));

/**
 * Resumen por empresa y moneda: lo que cada empresa debe (préstamos recibidos) y le deben (otorgados)
 * a accionistas y terceros. Neto = por cobrar - por pagar.
 */
export function resumenPorEmpresa(items) {
  const monedas = new Map();
  for (const p of items) {
    const codigo = p.moneda?.codigoSunat || "SIN MONEDA";
    if (!monedas.has(codigo)) monedas.set(codigo, { codigo, simbolo: p.moneda?.simbolo || "", empresas: new Map() });
    const bloque = monedas.get(codigo);
    const id = String(p.empresa?.id);
    if (!bloque.empresas.has(id)) bloque.empresas.set(id, { empresa: p.empresa?.razonSocial || `#${id}`, porCobrar: 0, porPagar: 0 });
    const fila = bloque.empresas.get(id);
    if (p.sentido === "RECIBIDO") fila.porPagar += Number(p.saldoCapital || 0);
    else fila.porCobrar += Number(p.saldoCapital || 0);
  }
  return [...monedas.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((m) => {
      const filas = [...m.empresas.values()].map((f) => ({ ...f, neto: f.porCobrar - f.porPagar })).sort((a, b) => a.empresa.localeCompare(b.empresa));
      return {
        codigo: m.codigo,
        simbolo: m.simbolo,
        filas,
        totales: { porCobrar: filas.reduce((s, f) => s + f.porCobrar, 0), porPagar: filas.reduce((s, f) => s + f.porPagar, 0) },
      };
    });
}
