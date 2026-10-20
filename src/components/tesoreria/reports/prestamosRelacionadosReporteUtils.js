// src/components/tesoreria/reports/prestamosRelacionadosReporteUtils.js
// Cálculos compartidos por la pantalla y los reportes (PDF / Excel) de préstamos entre relacionadas.

const ESTADO_VIGENTE = 81;
const MS_DIA = 24 * 60 * 60 * 1000;

/** Préstamo con saldo por devolver (vigente y con capital pendiente). */
export const esPendiente = (p) => Number(p?.estadoId) === ESTADO_VIGENTE && Number(p?.saldoCapital) > 0;

export const formatoMonto = (valor) =>
  new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor || 0));

export const formatoFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-");

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
  devuelto: sumar(lista, "capitalDevuelto") + sumar(lista, "montoPagadoAnterior"),
  saldo: sumar(lista, "saldoCapital"),
});

/** Agrupa por moneda: [{ codigo, simbolo, items, totales }] ordenado por código de moneda. */
export function agruparPorMoneda(items) {
  const grupos = new Map();
  for (const p of items) {
    const codigo = p.moneda?.codigoSunat || "SIN MONEDA";
    if (!grupos.has(codigo)) grupos.set(codigo, { codigo, simbolo: p.moneda?.simbolo || "", items: [] });
    grupos.get(codigo).items.push(p);
  }
  return [...grupos.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((g) => ({
      ...g,
      items: [...g.items].sort(
        (a, b) =>
          (a.empresaPrestamista?.razonSocial || "").localeCompare(b.empresaPrestamista?.razonSocial || "") ||
          (a.empresaPrestataria?.razonSocial || "").localeCompare(b.empresaPrestataria?.razonSocial || "") ||
          new Date(a.fechaDesembolso) - new Date(b.fechaDesembolso),
      ),
      totales: totalesDe(g.items),
    }));
}

/**
 * Resumen por empresa y moneda: lo que cada empresa tiene por cobrar (como prestamista)
 * y por pagar (como prestataria) a sus relacionadas. Neto = por cobrar - por pagar.
 */
export function resumenPorEmpresa(items) {
  return agruparPorMoneda(items).map((grupo) => {
    const empresas = new Map();
    const obtener = (e) => {
      const id = String(e?.id);
      if (!empresas.has(id)) empresas.set(id, { empresa: e?.razonSocial || `#${id}`, porCobrar: 0, porPagar: 0 });
      return empresas.get(id);
    };
    for (const p of grupo.items) {
      obtener(p.empresaPrestamista).porCobrar += Number(p.saldoCapital || 0);
      obtener(p.empresaPrestataria).porPagar += Number(p.saldoCapital || 0);
    }
    const filas = [...empresas.values()]
      .map((f) => ({ ...f, neto: f.porCobrar - f.porPagar }))
      .sort((a, b) => a.empresa.localeCompare(b.empresa));
    return {
      codigo: grupo.codigo,
      simbolo: grupo.simbolo,
      filas,
      totales: {
        porCobrar: filas.reduce((s, f) => s + f.porCobrar, 0),
        porPagar: filas.reduce((s, f) => s + f.porPagar, 0),
      },
    };
  });
}
