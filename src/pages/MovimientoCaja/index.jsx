import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";

// Components
import MovimientoCajaHeader from "./components/MovimientoCajaHeader";
import MovimientoCajaTabs from "./components/MovimientoCajaTabs";
import MovimientoCajaDialogs from "./components/MovimientoCajaDialogs";

// Hooks
import useMovimientoCajaData from "./hooks/useMovimientoCajaData";
import useMovimientoCajaCRUD from "./hooks/useMovimientoCajaCRUD";
import useMovimientoCajaFilters from "./hooks/useMovimientoCajaFilters";
import useMovimientoCajaTabsData from "./hooks/useMovimientoCajaTabsData";

// Constants
import { MODULOS_ORIGEN, ESTADOS } from "./utils/constants";

const MovimientoCaja = () => {
  // Refs
  const toast = useRef(null);

  // States principales
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);

  // Hooks personalizados
  const {
    movimientos,
    empresas,
    monedas,
    tipoMovEntregaRendir,
    mediosPago,
    cuentasCorrientes,
    entidadesComerciales,
    cuentasEntidadComercial,
    permisos,
    centrosCosto,
    personal,
    modulos,
    productos,
    estadosMultiFuncion,
    cuentasOrigenFiltradas,
    cuentasDestinoFiltradas,
    loading: dataLoading,
    error,
    recargarDatos
  } = useMovimientoCajaData();

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // ✅ CORRECCIÓN: Pasar parámetros a useMovimientoCajaCRUD
  const {
    handleCrear,
    handleEditar,
    handleGuardar,
    handleEliminar,
    handleValidarMovimiento,
    handleAprobar,
    handleRechazar,
    handleRevertir,
    handleAplicarMovimientos
  } = useMovimientoCajaCRUD({
    toast,
    setLoading,
    setShowDialog,
    setEditingMovimiento,
    recargarDatos,
    empresas,
    monedas,
    tipoMovEntregaRendir,
    mediosPago,
    cuentasCorrientes,
    entidadesComerciales,
    cuentasEntidadComercial,
    centrosCosto,
    personal,
    modulos,
    productos,
    estadosMultiFuncion
  });

  const {
    filtros,
    filteredMovimientos,
    filterStats,
    handleFiltroChange,
    limpiarFiltros
  } = useMovimientoCajaFilters(movimientos);
  // Hook para datos de tabs de procesos productivos
  const tabsData = useMovimientoCajaTabsData(toast);
  // Effects
  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error,
        life: 3000,
      });
    }
  }, [error]);

  // Event handlers
  const handleRowClick = (event) => {
    // ✅ CORRECCIÓN: Extraer datos correctamente del evento de PrimeReact
    const movimiento = event?.data || event;
    if (permisos?.puedeVer || permisos?.puedeEditar) {
      handleEditar(movimiento);
      setShowDialog(true);
    }
  };

  const handleSelectionChange = (e) => {
    setSelectedMovimiento(e.value);
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header con filtros */}
      <MovimientoCajaHeader
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiarFiltros={limpiarFiltros}
        onNuevo={handleCrear}
        loading={loading || dataLoading}
        permisos={permisos}
        filterStats={filterStats}
        // ✅ DATOS PARA FILTROS:
        empresas={empresas}
        cuentasCorrientes={cuentasCorrientes}
        monedas={monedas}
        centrosCosto={centrosCosto}
        personal={personal}
        modulos={modulos}
        estadosMultiFuncion={estadosMultiFuncion}
        tipoMovEntregaRendir={tipoMovEntregaRendir}
      />

      {/* Tabs principales según acuerdo */}
      <MovimientoCajaTabs
        onAplicarMovimientos={handleAplicarMovimientos}
        loading={loading || dataLoading}
        empresas={empresas}
        movimientos={movimientos}
        filteredMovimientos={filteredMovimientos}
        onRowClick={handleRowClick}
        onSelectionChange={handleSelectionChange}
        permisos={permisos}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        onRevertir={handleRevertir}
        onEliminar={handleEliminar}
        toast={toast}
        // ✅ DATOS COMPLETOS PARA TABLA:
        cuentasCorrientes={cuentasCorrientes}
        monedas={monedas}
        centrosCosto={centrosCosto}
        personal={personal}
        modulos={modulos}
        estadosMultiFuncion={estadosMultiFuncion}
        // ✅ DATOS PARA TABS DE PROCESOS PRODUCTIVOS:
        {...tabsData}
        tipoMovEntregaRendir={tipoMovEntregaRendir}
        entidadesComerciales={entidadesComerciales}
        productos={productos}
      />

      {/* Diálogos */}
      <MovimientoCajaDialogs
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        movimiento={editingMovimiento}
        onSave={handleGuardar}
        loading={loading}
        permisos={permisos}
        empresas={empresas}
        monedas={monedas}
        tipoMovEntregaRendir={tipoMovEntregaRendir}
        mediosPago={mediosPago}
        cuentasCorrientes={cuentasCorrientes}
        entidadesComerciales={entidadesComerciales}
        cuentasEntidadComercial={cuentasEntidadComercial}
        centrosCosto={centrosCosto}
        personal={personal}
        modulos={modulos}
        productos={productos}
        estadosMultiFuncion={estadosMultiFuncion}
        cuentasOrigenFiltradas={cuentasOrigenFiltradas}
        cuentasDestinoFiltradas={cuentasDestinoFiltradas}
        onValidarMovimiento={handleValidarMovimiento}
      />
    </div>
  );
};

export default MovimientoCaja;