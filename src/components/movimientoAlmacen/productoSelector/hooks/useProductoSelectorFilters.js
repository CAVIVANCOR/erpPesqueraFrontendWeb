// src/components/movimientoAlmacen/productoSelector/hooks/useProductoSelectorFilters.js
import { useState, useEffect, useCallback, useMemo } from "react";
import { getProductoFromRow } from "../utils/productoSelectorHelpers";

/**
 * Custom hook para gestionar filtros y opciones dinámicas
 * @param {Array} items - Items a filtrar
 * @param {Object} catalogos - Catálogos disponibles
 * @param {string} modo - Modo de operación
 * @returns {Object} Filtros y funciones
 */
export const useProductoSelectorFilters = (items, catalogos, modo) => {
  const esIngreso = modo === "ingreso";

  // Estados de filtros
  const [familiaId, setFamiliaId] = useState(null);
  const [subfamiliaId, setSubfamiliaId] = useState(null);
  const [marcaId, setMarcaId] = useState(null);
  const [procedenciaId, setProcedenciaId] = useState(null);
  const [tipoAlmacenamientoId, setTipoAlmacenamientoId] = useState(null);
  const [tipoMaterialId, setTipoMaterialId] = useState(null);
  const [unidadMedidaId, setUnidadMedidaId] = useState(null);
  const [especieId, setEspecieId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Items filtrados
  const [filteredItems, setFilteredItems] = useState([]);

  // Opciones dinámicas
  const [opcionesDinamicas, setOpcionesDinamicas] = useState({
    familias: [],
    subfamilias: [],
    marcas: [],
    procedencias: [],
    tiposAlmacenamiento: [],
    tiposMaterial: [],
    unidadesMedida: [],
    especies: [],
  });

  // Memoizar catálogos para evitar recreación en cada render
  const catalogosEstables = useMemo(() => catalogos, [
    catalogos.familias,
    catalogos.subfamilias,
    catalogos.marcas,
    catalogos.paises,
    catalogos.tiposAlmacenamiento,
    catalogos.tiposMaterial,
    catalogos.unidadesMedida,
    catalogos.especies,
  ]);

  const calcularOpcionesDinamicas = useCallback(() => {
    if (items.length === 0) {
      setOpcionesDinamicas({
        familias: [],
        subfamilias: [],
        marcas: [],
        procedencias: [],
        tiposAlmacenamiento: [],
        tiposMaterial: [],
        unidadesMedida: [],
        especies: [],
      });
      return;
    }

    const idsUnicos = {
      familias: new Set(),
      subfamilias: new Set(),
      marcas: new Set(),
      procedencias: new Set(),
      tiposAlmacenamiento: new Set(),
      tiposMaterial: new Set(),
      unidadesMedida: new Set(),
      especies: new Set(),
    };

    items.forEach((item) => {
      const prod = getProductoFromRow(item, esIngreso);
      if (prod) {
        if (prod.familiaId) idsUnicos.familias.add(Number(prod.familiaId));
        if (prod.subfamiliaId) idsUnicos.subfamilias.add(Number(prod.subfamiliaId));
        if (prod.marcaId) idsUnicos.marcas.add(Number(prod.marcaId));
        if (prod.procedenciaId) idsUnicos.procedencias.add(Number(prod.procedenciaId));
        if (prod.tipoAlmacenamientoId) idsUnicos.tiposAlmacenamiento.add(Number(prod.tipoAlmacenamientoId));
        if (prod.tipoMaterialId) idsUnicos.tiposMaterial.add(Number(prod.tipoMaterialId));
        if (prod.unidadMedidaId) idsUnicos.unidadesMedida.add(Number(prod.unidadMedidaId));
        if (prod.especieId) idsUnicos.especies.add(Number(prod.especieId));
      }
    });

    setOpcionesDinamicas({
      familias: catalogosEstables.familias.filter((f) => idsUnicos.familias.has(Number(f.id))),
      subfamilias: catalogosEstables.subfamilias.filter((s) => idsUnicos.subfamilias.has(Number(s.id))),
      marcas: catalogosEstables.marcas.filter((m) => idsUnicos.marcas.has(Number(m.id))),
      procedencias: catalogosEstables.paises.filter((p) => idsUnicos.procedencias.has(Number(p.id))),
      tiposAlmacenamiento: catalogosEstables.tiposAlmacenamiento.filter((t) => idsUnicos.tiposAlmacenamiento.has(Number(t.id))),
      tiposMaterial: catalogosEstables.tiposMaterial.filter((t) => idsUnicos.tiposMaterial.has(Number(t.id))),
      unidadesMedida: catalogosEstables.unidadesMedida.filter((u) => idsUnicos.unidadesMedida.has(Number(u.id))),
      especies: catalogosEstables.especies.filter((e) => idsUnicos.especies.has(Number(e.id))),
    });
  }, [items, esIngreso, catalogosEstables]);

  const aplicarFiltros = useCallback(() => {
    let filtered = [...items];

    // Filtros de producto
    if (familiaId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.familiaId) === Number(familiaId);
      });
    }

    if (subfamiliaId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.subfamiliaId) === Number(subfamiliaId);
      });
    }

    if (marcaId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.marcaId) === Number(marcaId);
      });
    }

    if (procedenciaId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.procedenciaId) === Number(procedenciaId);
      });
    }

    if (tipoAlmacenamientoId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.tipoAlmacenamientoId) === Number(tipoAlmacenamientoId);
      });
    }

    if (tipoMaterialId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.tipoMaterialId) === Number(tipoMaterialId);
      });
    }

    if (unidadMedidaId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.unidadMedidaId) === Number(unidadMedidaId);
      });
    }

    if (especieId) {
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return Number(prod?.especieId) === Number(especieId);
      });
    }

    // Búsqueda por texto
    if (busqueda && busqueda.trim() !== "") {
      const searchTerm = busqueda.toLowerCase();
      filtered = filtered.filter((item) => {
        const prod = getProductoFromRow(item, esIngreso);
        return (
          prod?.descripcionArmada?.toLowerCase().includes(searchTerm) ||
          prod?.codigo?.toLowerCase().includes(searchTerm) ||
          item?.lote?.toLowerCase().includes(searchTerm)
        );
      });
    }

    setFilteredItems(filtered);
  }, [
    items,
    familiaId,
    subfamiliaId,
    marcaId,
    procedenciaId,
    tipoAlmacenamientoId,
    tipoMaterialId,
    unidadMedidaId,
    especieId,
    busqueda,
    esIngreso,
  ]);

  // Calcular opciones dinámicas cuando cambian items o catálogos
  useEffect(() => {
    calcularOpcionesDinamicas();
  }, [calcularOpcionesDinamicas]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const limpiarFiltros = () => {
    setFamiliaId(null);
    setSubfamiliaId(null);
    setMarcaId(null);
    setProcedenciaId(null);
    setTipoAlmacenamientoId(null);
    setTipoMaterialId(null);
    setUnidadMedidaId(null);
    setEspecieId(null);
    setBusqueda("");
  };

  return {
    // Estados de filtros
    filtros: {
      familiaId,
      subfamiliaId,
      marcaId,
      procedenciaId,
      tipoAlmacenamientoId,
      tipoMaterialId,
      unidadMedidaId,
      especieId,
      busqueda,
    },
    // Setters
    setFamiliaId,
    setSubfamiliaId,
    setMarcaId,
    setProcedenciaId,
    setTipoAlmacenamientoId,
    setTipoMaterialId,
    setUnidadMedidaId,
    setEspecieId,
    setBusqueda,
    // Datos
    filteredItems,
    opcionesDinamicas,
    // Funciones
    limpiarFiltros,
  };
};