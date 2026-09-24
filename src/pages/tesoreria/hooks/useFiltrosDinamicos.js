import { useState, useCallback } from 'react';
import { TIPO_FILTRO_TESORERIA, TIPO_VENCIMIENTO_TESORERIA, TIPO_DEUDA_TESORERIA } from '../../../utils/tesoreria.constants';

/**
 * Hook para manejar el estado de filtros dinámicos
 * @param {string} tipo - Tipo de filtro activo
 * @param {number} empresaId - ID de la empresa
 * @returns {object} Estado y funciones para manejar filtros
 */
export const useFiltrosDinamicos = (tipo, empresaId) => {
  const [filtros, setFiltros] = useState({
    empresaId: empresaId || null,
    tipo: tipo || TIPO_FILTRO_TESORERIA.TODOS,
    vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
    tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
    
    // Filtros dinámicos con arrays para selección múltiple
    fechaDesde: null,
    fechaHasta: null,
    clienteIds: [],
    proveedorIds: [],
    entidadComercialIds: [],
    tipoDocumentoIds: [],
    numeroDocumento: '',
    monedaIds: [],
    estadoIds: [],
    personalIds: [],
    montoDesde: null,
    montoHasta: null,
  });

  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      empresaId: empresaId || null,
      tipo: tipo || TIPO_FILTRO_TESORERIA.TODOS,
      vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
      tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
      fechaDesde: null,
      fechaHasta: null,
      clienteIds: [],
      proveedorIds: [],
      entidadComercialIds: [],
      tipoDocumentoIds: [],
      numeroDocumento: '',
      monedaIds: [],
      estadoIds: [],
      personalIds: [],
      montoDesde: null,
      montoHasta: null,
    });
  }, [empresaId, tipo]);

  const contarFiltrosActivos = useCallback(() => {
    let count = 0;
    
    if (filtros.fechaDesde || filtros.fechaHasta) count++;
    if (filtros.clienteIds?.length > 0) count += filtros.clienteIds.length;
    if (filtros.proveedorIds?.length > 0) count += filtros.proveedorIds.length;
    if (filtros.entidadComercialIds?.length > 0) count += filtros.entidadComercialIds.length;
    if (filtros.tipoDocumentoIds?.length > 0) count += filtros.tipoDocumentoIds.length;
    if (filtros.numeroDocumento) count++;
    if (filtros.monedaIds?.length > 0) count += filtros.monedaIds.length;
    if (filtros.estadoIds?.length > 0) count += filtros.estadoIds.length;
    if (filtros.personalIds?.length > 0) count += filtros.personalIds.length;
    if (filtros.montoDesde !== null || filtros.montoHasta !== null) count++;
    
    return count;
  }, [filtros]);

  return {
    filtros,
    setFiltros,
    handleFiltroChange,
    limpiarFiltros,
    contarFiltrosActivos
  };
};
