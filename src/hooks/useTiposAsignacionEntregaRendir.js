// src/hooks/useTiposAsignacionEntregaRendir.js
// Devuelve una función `esTipoAsignacion(tipoMovimientoId)`: un tipo es una asignación a rendir cuando pertenece a la
// categoría con el rol GASTOS_A_RENDIR (codigoSistema). No se usan ids de tipos ni de categorías.
import { useEffect, useState } from "react";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";

export default function useTiposAsignacionEntregaRendir() {
  const [idsAsignacion, setIdsAsignacion] = useState(() => new Set());

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const tipos = await getAllTipoMovEntregaRendir();
        if (!activo) return;
        setIdsAsignacion(
          new Set(
            (tipos || [])
              .filter((t) => t.categoria?.codigoSistema === "GASTOS_A_RENDIR")
              .map((t) => Number(t.id)),
          ),
        );
      } catch (error) {
        console.error("No se pudieron cargar los tipos de asignación a rendir:", error);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return (tipoMovimientoId) => idsAsignacion.has(Number(tipoMovimientoId));
}
