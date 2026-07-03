// src/hooks/useStockData.js
// Hook compartido para consulta de stock (general y detallado)
// ÚNICA FUENTE DE VERDAD para datos de stock
import { useState, useEffect } from "react";
import { getSaldosProductoCliente } from "../api/saldosProductoCliente";
import { getSaldosDetProductoCliente } from "../api/saldosDetProductoCliente";

/**
 * Hook para gestionar consultas de stock
 * Soporta dos tipos de consulta:
 * - Saldos Generales (getSaldosProductoCliente)
 * - Saldos Detallados (getSaldosDetProductoCliente)
 * 
 * @param {Object} config - Configuración del hook
 * @param {string} config.tipo - Tipo de consulta: "general" o "detallado"
 * @param {number} config.empresaId - ID de la empresa
 * @param {number} config.clienteId - ID del cliente (opcional)
 * @param {boolean} config.esCustodia - Si es custodia
 * @param {boolean} config.autoLoad - Si debe cargar automáticamente al cambiar filtros
 */
export const useStockData = ({
  tipo = "detallado",
  empresaId = null,
  clienteId = null,
  esCustodia = false,
  autoLoad = true,
} = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos crudos de la API
  const [saldosGenerales, setSaldosGenerales] = useState([]);
  const [saldosDetallados, setSaldosDetallados] = useState([]);
  
  // Datos filtrados localmente
  const [saldosGeneralesFiltrados, setSaldosGeneralesFiltrados] = useState([]);
  const [saldosDetalladosFiltrados, setSaldosDetalladosFiltrados] = useState([]);
  
  // Almacenes dinámicos extraídos de los datos
  const [almacenesDisponibles, setAlmacenesDisponibles] = useState([]);
  
  // Ubicaciones físicas dinámicas (solo para detallado)
  const [ubicacionesFisicasDisponibles, setUbicacionesFisicasDisponibles] = useState([]);

  /**
   * Cargar saldos generales
   */
  const cargarSaldosGenerales = async (params = {}) => {
    const empresaIdParam = params.empresaId || empresaId;
    if (!empresaIdParam) return;

    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        empresaId: empresaIdParam,
        custodia: params.esCustodia !== undefined ? params.esCustodia : esCustodia,
      };
      if (params.clienteId || clienteId) {
        queryParams.clienteId = params.clienteId || clienteId;
      }

      const data = await getSaldosProductoCliente(queryParams);
      setSaldosGenerales(data);

      // Extraer almacenes únicos
      const almacenesUnicos = [];
      const idsVistos = new Set();
      data.forEach((item) => {
        if (item.almacenId && !idsVistos.has(Number(item.almacenId))) {
          idsVistos.add(Number(item.almacenId));
          almacenesUnicos.push({
            id: item.almacenId,
            descripcion: item.almacen?.nombre || `Almacén ${item.almacenId}`,
          });
        }
      });
      setAlmacenesDisponibles(
        almacenesUnicos.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      );

      // Por defecto, mostrar todos los datos sin filtro local
      setSaldosGeneralesFiltrados(data);

      return data;
    } catch (err) {
      console.error("Error al cargar saldos generales:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar saldos detallados
   */
  const cargarSaldosDetallados = async (params = {}) => {
    const empresaIdParam = params.empresaId || empresaId;
    if (!empresaIdParam) return;

    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        empresaId: empresaIdParam,
        esCustodia: params.esCustodia !== undefined ? params.esCustodia : esCustodia,
      };
      if (params.clienteId || clienteId) {
        queryParams.clienteId = params.clienteId || clienteId;
      }

      const data = await getSaldosDetProductoCliente(queryParams);
      setSaldosDetallados(data);

      // Extraer almacenes únicos
      const almacenesUnicos = [];
      const idsVistos = new Set();
      data.forEach((item) => {
        if (item.almacenId && !idsVistos.has(Number(item.almacenId))) {
          idsVistos.add(Number(item.almacenId));
          almacenesUnicos.push({
            id: item.almacenId,
            descripcion: item.almacen?.nombre || `Almacén ${item.almacenId}`,
          });
        }
      });
      setAlmacenesDisponibles(
        almacenesUnicos.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      );

      // Extraer ubicaciones físicas únicas
      const ubicacionesUnicas = [];
      const idsUbicacionesVistos = new Set();
      data.forEach((item) => {
        if (item.ubicacionFisicaId && !idsUbicacionesVistos.has(Number(item.ubicacionFisicaId))) {
          idsUbicacionesVistos.add(Number(item.ubicacionFisicaId));
          ubicacionesUnicas.push({
            id: item.ubicacionFisicaId,
            descripcion:
              item.ubicacionFisica?.nombre ||
              item.ubicacionFisica?.descripcion ||
              `Ubicación ${item.ubicacionFisicaId}`,
          });
        }
      });
      // Agregar opción "Sin ubicación" si hay registros sin ubicacionFisicaId
      const tieneSinUbicacion = data.some((item) => !item.ubicacionFisicaId);
      if (tieneSinUbicacion) {
        ubicacionesUnicas.push({
          id: 0,
          descripcion: "Sin ubicación",
        });
      }
      setUbicacionesFisicasDisponibles(
        ubicacionesUnicas.sort((a, b) => {
          if (a.id === 0) return 1; // "Sin ubicación" al final
          if (b.id === 0) return -1;
          return a.descripcion.localeCompare(b.descripcion);
        })
      );

      // Por defecto, mostrar todos los datos sin filtro local
      setSaldosDetalladosFiltrados(data);

      return data;
    } catch (err) {
      console.error("Error al cargar saldos detallados:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplicar filtro local a saldos generales
   */
  const aplicarFiltroLocalGenerales = (almacenId = null) => {
    let filtrados = [...saldosGenerales];

    if (almacenId) {
      filtrados = filtrados.filter(
        (item) => Number(item.almacenId) === Number(almacenId)
      );
    }

    setSaldosGeneralesFiltrados(filtrados);
    return filtrados;
  };

  /**
   * Aplicar filtro local a saldos detallados
   */
  const aplicarFiltroLocalDetallados = (almacenId = null, ubicacionFisicaId = null) => {
    let filtrados = [...saldosDetallados];

    if (almacenId) {
      filtrados = filtrados.filter(
        (item) => Number(item.almacenId) === Number(almacenId)
      );
    }

    if (ubicacionFisicaId !== null && ubicacionFisicaId !== undefined) {
      if (ubicacionFisicaId === 0) {
        // Filtrar registros sin ubicación
        filtrados = filtrados.filter((item) => !item.ubicacionFisicaId);
      } else {
        filtrados = filtrados.filter(
          (item) => Number(item.ubicacionFisicaId) === Number(ubicacionFisicaId)
        );
      }
    }

    setSaldosDetalladosFiltrados(filtrados);
    return filtrados;
  };

  /**
   * Limpiar todos los datos
   */
  const limpiarDatos = () => {
    setSaldosGenerales([]);
    setSaldosDetallados([]);
    setSaldosGeneralesFiltrados([]);
    setSaldosDetalladosFiltrados([]);
    setAlmacenesDisponibles([]);
    setUbicacionesFisicasDisponibles([]);
    setError(null);
  };

  // Auto-cargar cuando cambian los parámetros (si autoLoad está activo)
  useEffect(() => {
    if (autoLoad && empresaId) {
      if (tipo === "general") {
        cargarSaldosGenerales();
      } else if (tipo === "detallado") {
        cargarSaldosDetallados();
      }
    }
  }, [empresaId, clienteId, esCustodia, tipo, autoLoad]);

  return {
    // Estado
    loading,
    error,

    // Datos crudos
    saldosGenerales,
    saldosDetallados,

    // Datos filtrados
    saldosGeneralesFiltrados,
    saldosDetalladosFiltrados,

    // Opciones dinámicas
    almacenesDisponibles,
    ubicacionesFisicasDisponibles,

    // Métodos de carga
    cargarSaldosGenerales,
    cargarSaldosDetallados,

    // Métodos de filtrado local
    aplicarFiltroLocalGenerales,
    aplicarFiltroLocalDetallados,

    // Utilidades
    limpiarDatos,
  };
};