import { useState, useMemo, useCallback } from "react";

const useMovimientoCajaFilters = (movimientos) => {

  // Estado de filtros - CORREGIDO: nombres correctos de campos
  const [filtros, setFiltros] = useState({
    global: "",
    fechaInicio: null,
    fechaFin: null,
    empresaOrigenId: null,
    empresaDestinoId: null,
    monedaId: null,
    estadoId: null,
    montoMin: null,
    montoMax: null,
    centroCostoId: null,
    personalId: null,
    moduloId: null,
    tipoMovimientoId: null,
    descripcion: ""
  });

  // Manejar cambio de filtros
  const handleFiltroChange = useCallback((field, value) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltros({
      global: "",
      fechaInicio: null,
      fechaFin: null,
      empresaOrigenId: null,
      empresaDestinoId: null,
      monedaId: null,
      estadoId: null,
      montoMin: null,
      montoMax: null,
      centroCostoId: null,
      personalId: null,
      moduloId: null,
      tipoMovimientoId: null,
      descripcion: ""
    });
  }, []);

  // ✅ CORRECCIÓN PRINCIPAL: Lógica de filtrado corregida
  const filteredMovimientos = useMemo(() => {

    if (!movimientos || movimientos.length === 0) {
      return [];
    }

    let filtrados = [...movimientos];

    // ✅ Filtro global - CORREGIDO
    if (filtros.global && filtros.global.trim()) {
      const searchTerm = filtros.global.toLowerCase().trim();
      filtrados = filtrados.filter(movimiento => {
        const textoBusqueda = [
          movimiento.descripcion || "",
          movimiento.referenciaExtId || "",
          movimiento.id?.toString() || ""
        ].join(" ").toLowerCase();
        
        return textoBusqueda.includes(searchTerm);
      });
    }

    // ✅ Filtro por empresa origen
    if (filtros.empresaOrigenId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.empresaOrigenId) === Number(filtros.empresaOrigenId)
      );
    }

    // ✅ Filtro por empresa destino
    if (filtros.empresaDestinoId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.empresaDestinoId) === Number(filtros.empresaDestinoId)
      );
    }

    // ✅ Filtro por tipo movimiento
    if (filtros.tipoMovimientoId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.tipoMovimientoId) === Number(filtros.tipoMovimientoId)
      );
    }

    // ✅ Filtro por moneda
    if (filtros.monedaId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.monedaId) === Number(filtros.monedaId)
      );
    }

    // ✅ Filtro por estado
    if (filtros.estadoId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.estadoId) === Number(filtros.estadoId)
      );
    }

    // ✅ Filtro por monto mínimo
    if (filtros.montoMin && !isNaN(filtros.montoMin)) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.monto) >= Number(filtros.montoMin)
      );
    }

    // ✅ Filtro por monto máximo
    if (filtros.montoMax && !isNaN(filtros.montoMax)) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.monto) <= Number(filtros.montoMax)
      );
    }

    // ✅ Filtro por centro costo
    if (filtros.centroCostoId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.centroCostoId) === Number(filtros.centroCostoId)
      );
    }

    // ✅ Filtro por personal
    if (filtros.personalId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.usuarioId) === Number(filtros.personalId)
      );
    }

    // ✅ Filtro por módulo
    if (filtros.moduloId) {
      filtrados = filtrados.filter(movimiento => 
        Number(movimiento.moduloOrigenId) === Number(filtros.moduloId)
      );
    }

    // ✅ Filtro por fecha inicio
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0); // Inicio del día
      filtrados = filtrados.filter(movimiento => {
        if (!movimiento.fechaOperacionMovCaja) return false;
        const fechaMovimiento = new Date(movimiento.fechaOperacionMovCaja);
        return fechaMovimiento >= fechaInicio;
      });
    }

    // ✅ Filtro por fecha fin
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999); // Fin del día
      filtrados = filtrados.filter(movimiento => {
        if (!movimiento.fechaOperacionMovCaja) return false;
        const fechaMovimiento = new Date(movimiento.fechaOperacionMovCaja);
        return fechaMovimiento <= fechaFin;
      });
    }

    // ✅ Filtro por descripción
    if (filtros.descripcion && filtros.descripcion.trim()) {
      const searchTerm = filtros.descripcion.toLowerCase().trim();
      filtrados = filtrados.filter(movimiento => 
        (movimiento.descripcion || "").toLowerCase().includes(searchTerm)
      );
    }

    return filtrados;
  }, [movimientos, filtros]);

  // Estadísticas de los filtros
  const filterStats = useMemo(() => {
    const total = movimientos?.length || 0;
    const filtrados = filteredMovimientos.length;
    const activos = Object.values(filtros).filter(value => 
      value !== null && value !== "" && value !== undefined
    ).length;

    return {
      total,
      filtrados,
      activos,
      porcentajeFiltrado: total > 0 ? Math.round((filtrados / total) * 100) : 0
    };
  }, [movimientos, filteredMovimientos, filtros]);

  return {
    // States
    filtros,
    filteredMovimientos,
    filterStats,

    // Actions
    handleFiltroChange,
    limpiarFiltros,
    setFiltros
  };
};

export default useMovimientoCajaFilters;