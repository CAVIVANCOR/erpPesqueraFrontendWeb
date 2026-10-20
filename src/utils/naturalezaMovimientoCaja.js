// src/utils/naturalezaMovimientoCaja.js

/**
 * Naturaleza real de un movimiento de caja: true = ingreso, false = egreso, undefined = no se puede determinar.
 *
 * La define el origen del movimiento y no solo el tipo elegido al registrarlo: un cobro de CxC siempre ingresa
 * dinero y un pago de CxP siempre lo egresa, aunque el tipo de movimiento (p. ej. "ADELANTO") esté marcado al
 * revés en el catálogo. Las reversiones son el movimiento contrario, por eso conservan la naturaleza de su tipo.
 * Es la misma naturaleza que registra el saldo de la cuenta corriente.
 */
export const esIngresoMovimiento = (movimiento) => {
  if (!movimiento?.esReversion) {
    if (movimiento?.cuentaPorCobrarId) return true;
    if (movimiento?.cuentaPorPagarId) return false;
  }
  const esIngreso = movimiento?.tipoMovimiento?.esIngreso;
  return typeof esIngreso === "boolean" ? esIngreso : undefined;
};
