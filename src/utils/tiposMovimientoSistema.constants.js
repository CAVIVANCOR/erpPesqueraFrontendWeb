/**
 * ════════════════════════════════════════════════════════════════════════════
 * ROLES DEL SISTEMA PARA TIPOS Y CATEGORÍAS DE MOVIMIENTO DE CAJA
 * ════════════════════════════════════════════════════════════════════════════
 *
 * El código nunca debe identificar un tipo o una categoría por su id (los ids cambian cuando se reorganiza el
 * catálogo). En su lugar identifica un ROL (`codigoSistema`) y la base de datos dice qué fila lo cumple.
 *
 *   - TipoMovEntregaRendir.codigoSistema           → rol de UN tipo concreto (único: un rol, un tipo)
 *   - CategoriaTipoMovEntregaRendir.codigoSistema  → rol de UNA categoría; todos sus tipos comparten el comportamiento
 *
 * Catálogo cerrado de roles válidos. `esIngreso` es el sentido que debe tener el tipo (o la categoría) que cumpla
 * el rol. Debe mantenerse idéntico a `src/utils/tiposMovimientoSistema.constants.js` del backend.
 */

export const ROLES_TIPO_MOV = {
  ITF_COMISION: { etiqueta: "ITF y comisión bancaria", esIngreso: false },
  SUNAT: { etiqueta: "SUNAT (detracción, retención y percepción)", esIngreso: false },
  MUNICIPIOS: { etiqueta: "Municipios (tributos)", esIngreso: false },
  RENTA_ALQUILERES: { etiqueta: "Renta de alquileres (tributos)", esIngreso: false },
  REMUN_SUELDOS: { etiqueta: "Remuneraciones: sueldos", esIngreso: false },
  REMUN_SALARIOS: { etiqueta: "Remuneraciones: salarios", esIngreso: false },
  REMUN_COMISIONES: { etiqueta: "Remuneraciones: comisiones", esIngreso: false },
  REMUN_PRESTAMOS: { etiqueta: "Remuneraciones: préstamos al personal", esIngreso: false },
  REMUN_ADELANTOS: { etiqueta: "Remuneraciones: adelantos", esIngreso: false },
  REMUN_INDEMNIZACIONES_CTS: { etiqueta: "Remuneraciones: indemnizaciones y CTS", esIngreso: false },
  REMUN_VACACIONES: { etiqueta: "Remuneraciones: vacaciones", esIngreso: false },
  REMUN_GRATIFICACIONES: { etiqueta: "Remuneraciones: gratificaciones", esIngreso: false },
  REMUN_LIQUIDACIONES: { etiqueta: "Remuneraciones: liquidaciones", esIngreso: false },
  DEVOLUCION_A_RENDIR: { etiqueta: "Devolución a rendir", esIngreso: true },
  PRESTAMO_RELACIONADO_INGRESO: { etiqueta: "Préstamo entre relacionadas: ingreso", esIngreso: true },
  PRESTAMO_RELACIONADO_EGRESO: { etiqueta: "Préstamo entre relacionadas: egreso", esIngreso: false },
  PRESTAMO_DESEMBOLSO_DEFECTO: { etiqueta: "Préstamo bancario: tipo por defecto del desembolso", esIngreso: true },
  PRESTAMO_PAGO_CUOTAS_DEFECTO: { etiqueta: "Préstamo bancario: tipo por defecto del pago de cuotas", esIngreso: false },
};

export const ROLES_CATEGORIA_MOV = {
  GASTOS_A_RENDIR: { etiqueta: "Gastos a rendir (asignaciones)", esIngreso: false },
  REMUNERACIONES: { etiqueta: "Remuneraciones (deudas con el personal)", esIngreso: false },
  TRIBUTOS: { etiqueta: "Tributos y aportes (deudas tributarias)", esIngreso: false },
};

/**
 * Opciones para un Dropdown: solo los roles cuyo sentido coincide con el del tipo/categoría que se edita.
 */
export const opcionesRolesPorSentido = (catalogo, esIngreso) =>
  Object.entries(catalogo)
    .filter(([, rol]) => rol.esIngreso === esIngreso)
    .map(([codigo, rol]) => ({ label: rol.etiqueta, value: codigo }));
