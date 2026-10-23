// src/utils/avisoSinFondos.js
// Revisa, con el saldo REAL de la cuenta (consultado al servidor), si la cuenta de origen alcanza para la operación.
// La empresa se deduce de la cuenta elegida, nunca del filtro de la pantalla.
import { obtenerSaldoCuenta } from "../api/tesoreria/transferencias";

const formatear = (n) =>
  Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * @returns {Promise<{saldoActual:number, monedaId:number}|null>} datos de la cuenta, o null si no se pudo consultar
 */
export async function consultarSaldoCuenta(cuentaCorrienteId) {
  if (!cuentaCorrienteId) return null;
  try {
    return await obtenerSaldoCuenta(cuentaCorrienteId);
  } catch (error) {
    // Si no se puede consultar el saldo, no se bloquea la operación
    console.error("No se pudo consultar el saldo de la cuenta:", error);
    return null;
  }
}

/**
 * Devuelve el mensaje de aviso si la cuenta no tiene fondos suficientes, o null si alcanza.
 * @param {number} cuentaCorrienteId cuenta de origen elegida
 * @param {number} totalRequerido total a egresar en la moneda de la cuenta
 * @param {string} simbolo símbolo de la moneda de la cuenta
 */
export async function obtenerAvisoSinFondos({ cuentaCorrienteId, totalRequerido, simbolo = "" }) {
  const datos = await consultarSaldoCuenta(cuentaCorrienteId);
  if (!datos) return null;
  // Tarjeta de crédito: se compara contra la línea disponible (línea menos deuda), no contra el saldo de caja
  if (datos.esTarjetaCredito) {
    const disponible = Number(datos.disponible);
    if (disponible >= Number(totalRequerido)) return null;
    return `La tarjeta de crédito no tiene línea disponible suficiente.\nLínea: ${simbolo} ${formatear(datos.limiteCredito)}. Deuda actual: ${simbolo} ${formatear(-Number(datos.saldoActual))}. Disponible: ${simbolo} ${formatear(disponible)}. Requerido: ${simbolo} ${formatear(totalRequerido)}.`;
  }
  const saldo = Number(datos.saldoActual);
  if (saldo >= Number(totalRequerido)) return null;
  return `La cuenta de origen no tiene fondos suficientes.\nSaldo disponible: ${simbolo} ${formatear(saldo)}. Requerido: ${simbolo} ${formatear(totalRequerido)}.`;
}
