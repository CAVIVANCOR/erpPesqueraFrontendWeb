// Cálculo de totales de sublíneas de una línea de crédito (lista de líneas y formulario de sublíneas).
//
// CUPO COMPARTIDO: las sublíneas con la MISMA descripción comparten un solo cupo (p. ej. COMEX Pre y Post
// embarque comparten USD 300,000). Por eso, en cada grupo el Asignado cuenta una sola vez (el mayor) y el
// Utilizado y los sobregiros se suman. El Disponible del grupo se calcula con esos mismos tres valores para
// que los totales cuadren: Disponible = Asignado + Sobregiros - Utilizado.
// Una sublínea SIN descripción no comparte cupo con nadie: es su propio grupo.

const numero = (valor) => parseFloat(valor || 0);
const redondear2 = (valor) => Math.round(valor * 100) / 100;

/** Clave del cupo: descripción normalizada (sin espacios ni mayúsculas) o la propia sublínea si no tiene. */
export const claveCupo = (sublinea) => {
  const descripcion = String(sublinea.descripcion || "").trim().toUpperCase();
  return descripcion ? `D:${descripcion}` : `S:${sublinea.id}`;
};

/** Grupos de cupo (Map clave -> sublíneas), sin las sublíneas excluidas del cálculo. */
export const agruparCupos = (sublineas) => {
  const grupos = new Map();
  (sublineas || [])
    .filter((sublinea) => !sublinea.excluirDeCalculo)
    .forEach((sublinea) => {
      const clave = claveCupo(sublinea);
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(sublinea);
    });
  return grupos;
};

/** Sublínea de mayor asignado del grupo (la primera si hay empate): es la que aporta el cupo. */
const sublineaBaseDelGrupo = (grupo) =>
  grupo.reduce((base, sublinea) => (numero(sublinea.montoAsignado) > numero(base.montoAsignado) ? sublinea : base), grupo[0]);

/** Totales de las sublíneas respetando el cupo compartido. */
export const calcularTotalesSublineas = (sublineas) => {
  const totales = { totalAsignado: 0, totalUtilizado: 0, totalSobregiros: 0, totalDisponible: 0 };

  agruparCupos(sublineas).forEach((grupo) => {
    const asignado = numero(sublineaBaseDelGrupo(grupo).montoAsignado);
    const utilizado = grupo.reduce((suma, sublinea) => suma + numero(sublinea.montoUtilizado), 0);
    const sobregiros = grupo.reduce((suma, sublinea) => suma + numero(sublinea.totalSobregiros), 0);

    totales.totalAsignado += asignado;
    totales.totalUtilizado += utilizado;
    totales.totalSobregiros += sobregiros;
    totales.totalDisponible += asignado + sobregiros - utilizado;
  });

  Object.keys(totales).forEach((clave) => (totales[clave] = redondear2(totales[clave])));
  return totales;
};

/** ¿Esta sublínea es la que aporta el cupo (asignado) de su grupo? Sirve para resaltar la fila. */
export const esSublineaBase = (sublinea, sublineas) => {
  if (sublinea.excluirDeCalculo) return false;
  const grupo = agruparCupos(sublineas).get(claveCupo(sublinea)) || [];
  return grupo.length > 0 && sublineaBaseDelGrupo(grupo).id === sublinea.id;
};

/** ¿Comparte cupo con otra sublínea (grupo de más de una)? */
export const comparteCupo = (sublinea, sublineas) => {
  if (sublinea.excluirDeCalculo) return false;
  return (agruparCupos(sublineas).get(claveCupo(sublinea)) || []).length > 1;
};
