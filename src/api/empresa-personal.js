// src/api/empresa-personal.js
// API profesional para obtener el personal de una empresa para uso en combos, cumpliendo reglas JWT y documentación.
import { getPersonal } from './personal';

export async function listarPersonalEmpresa(empresaId) {
  // Devuelve un array [{ id, nombreCompleto }]
  const data = await getPersonal(empresaId);
  // Mapea a formato profesional para combos
  return data.map(p => ({
    id: p.id,
    nombreCompleto: `${p.nombres} ${p.apellidos}${p.cargo?.nombre || '' ? ' (' + p.cargo?.nombre + ')' : ''}`.trim()
  }));
}
