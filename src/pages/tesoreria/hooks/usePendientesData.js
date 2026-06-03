import { useState, useEffect } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getPendientes,
  getResumenPendientes,
} from "../../../api/tesoreria/pendientes";

/**
 * Hook para cargar datos de documentos pendientes
 */
const usePendientesData = (filtros) => {
  const permisos = usePermissions("tesoreriaPendientes");
  const [pendientes, setPendientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar pendientes
  const cargarPendientes = async () => {
    if (!permisos?.puedeVer) return;

    setLoading(true);
    setError(null);

    try {
      const [dataPendientes, dataResumen] = await Promise.all([
        getPendientes(filtros),
        getResumenPendientes(filtros.empresaId),
      ]);

      setPendientes(dataPendientes || []);
      setResumen(dataResumen || null);
    } catch (err) {
      console.error("Error al cargar pendientes:", err);
      setError(
        err.response?.data?.error || "Error al cargar documentos pendientes",
      );
      setPendientes([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (permisos?.puedeVer) {
      cargarPendientes();
    }
  }, [filtros, permisos?.puedeVer]);

  return {
    pendientes,
    resumen,
    permisos,
    loading,
    error,
    recargarPendientes: cargarPendientes,
  };
};

export default usePendientesData;
