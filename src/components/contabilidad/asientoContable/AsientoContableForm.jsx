// src/components/contabilidad/asientoContable/AsientoContableForm.jsx
import React, { useRef } from "react";
import { Toast } from "primereact/toast";
import useAsientoLogic from "./useAsientoLogic";
import AsientoCabecera from "./AsientoCabecera";
import AsientoDetalles from "./AsientoDetalles";
import DetalleDialog from "./DetalleDialog";
import ClonarDialog from "./ClonarDialog";

export default function AsientoContableForm({
  isEdit = false,
  defaultValues = {},
  empresaFija = null,
  periodoFijo = null,
  empresas = [],
  periodos = [],
  estados = [],
  monedas = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);

  // ✅ USAR CUSTOM HOOK PARA TODA LA LÓGICA
  const {
    formData,
    detalles,
    planCuentas,
    tiposDocumento,
    centrosCosto,
    entidadesComerciales,
    preFacturas,
    nombreUsuarioCreador,
    nombreUsuarioActualizador,
    showDetalleDialog,
    setShowDetalleDialog,
    editingDetalle,
    setEditingDetalle,
    detalleFormData,
    setDetalleFormData,
    guardando,
    asientoId,
    tipoCambioSunat,
    submodulosMap,
    submodulosOptions,
    detallesSeleccionados,
    setDetallesSeleccionados,
    showClonarDialog,
    setShowClonarDialog,
    cantidadClones,
    setCantidadClones,
    detallesFiltrados,
    filtroCodigoCuenta,
    setFiltroCodigoCuenta,
    filtroEntidadComercial,
    setFiltroEntidadComercial,
    filtroGlosa,
    setFiltroGlosa,
    filtroNumeroDocOrigen,
    setFiltroNumeroDocOrigen,
    filtroFechaDocRango,
    setFiltroFechaDocRango,
    filtroFechaVenceRango,
    setFiltroFechaVenceRango,
    filtroSubmodulo,
    setFiltroSubmodulo,
    handleChange,
    openNewDetalle,
    openEditDetalle,
    handleCuentaChange,
    handleEntidadComercialChange,
    handleEntidadComercialCreada,
    handleSubmoduloOrigenChange,
    handlePreFacturaChange,
    handleSaveDetalle,
    handleDeleteDetalle,
    handleClonarDetalles,
    limpiarFiltros,
    handleSubmit,
    setNombreUsuarioCreador,
    setNombreUsuarioActualizador,
    obtenerOpcionesDinamicas,
  } = useAsientoLogic({
    isEdit,
    defaultValues,
    empresaFija,
    periodoFijo,
    toast,
  });

  const estadoId = Number(formData.estadoId);
  const esPendiente = estadoId === 76;
  const isReadOnly = readOnly || !esPendiente;

  return (
    <>
      <Toast ref={toast} />

      {/* ✅ COMPONENTE CABECERA */}
      <AsientoCabecera
        formData={formData}
        handleChange={handleChange}
        empresas={empresas}
        periodos={periodos}
        estados={estados}
        monedas={monedas}
        empresaFija={empresaFija}
        periodoFijo={periodoFijo}
        isReadOnly={isReadOnly}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        loading={loading}
        guardando={guardando}
        asientoId={asientoId}
      />

      {/* ✅ COMPONENTE DETALLES (DATATABLE) */}
      <AsientoDetalles
        detalles={detalles}
        detallesFiltrados={detallesFiltrados}
        formData={formData}
        monedas={monedas}
        entidadesComerciales={entidadesComerciales}
        submodulosOptions={submodulosOptions}
        detallesSeleccionados={detallesSeleccionados}
        setDetallesSeleccionados={setDetallesSeleccionados}
        openNewDetalle={openNewDetalle}
        openEditDetalle={openEditDetalle}
        handleDeleteDetalle={handleDeleteDetalle}
        setShowClonarDialog={setShowClonarDialog}
        limpiarFiltros={limpiarFiltros}
        filtroCodigoCuenta={filtroCodigoCuenta}
        setFiltroCodigoCuenta={setFiltroCodigoCuenta}
        filtroEntidadComercial={filtroEntidadComercial}
        setFiltroEntidadComercial={setFiltroEntidadComercial}
        filtroGlosa={filtroGlosa}
        setFiltroGlosa={setFiltroGlosa}
        filtroNumeroDocOrigen={filtroNumeroDocOrigen}
        setFiltroNumeroDocOrigen={setFiltroNumeroDocOrigen}
        filtroFechaDocRango={filtroFechaDocRango}
        setFiltroFechaDocRango={setFiltroFechaDocRango}
        filtroFechaVenceRango={filtroFechaVenceRango}
        setFiltroFechaVenceRango={setFiltroFechaVenceRango}
        filtroSubmodulo={filtroSubmodulo}
        setFiltroSubmodulo={setFiltroSubmodulo}
        asientoId={asientoId}
        isReadOnly={isReadOnly}
        obtenerOpcionesDinamicas={obtenerOpcionesDinamicas}
      />

      {/* ✅ DIÁLOGO DETALLE */}
      <DetalleDialog
        visible={showDetalleDialog}
        onHide={() => {
          setShowDetalleDialog(false);
          setEditingDetalle(null);
          setNombreUsuarioCreador("N/A");
          setNombreUsuarioActualizador("N/A");
        }}
        editingDetalle={editingDetalle}
        detalleFormData={detalleFormData}
        setDetalleFormData={setDetalleFormData}
        planCuentas={planCuentas}
        monedas={monedas}
        tiposDocumento={tiposDocumento}
        centrosCosto={centrosCosto}
        entidadesComerciales={entidadesComerciales}
        submodulosOptions={submodulosOptions}
        preFacturas={preFacturas}
        formData={formData}
        handleCuentaChange={handleCuentaChange}
        handleSubmoduloOrigenChange={handleSubmoduloOrigenChange}
        handlePreFacturaChange={handlePreFacturaChange}
        handleEntidadComercialChange={handleEntidadComercialChange}
        handleEntidadComercialCreada={handleEntidadComercialCreada}
        handleSaveDetalle={handleSaveDetalle}
        nombreUsuarioCreador={nombreUsuarioCreador}
        nombreUsuarioActualizador={nombreUsuarioActualizador}
        setNombreUsuarioCreador={setNombreUsuarioCreador}
        setNombreUsuarioActualizador={setNombreUsuarioActualizador}
        isReadOnly={isReadOnly}
        toast={toast}
      />

      {/* ✅ DIÁLOGO CLONAR */}
      <ClonarDialog
        visible={showClonarDialog}
        onHide={() => {
          setShowClonarDialog(false);
          setCantidadClones(1);
        }}
        cantidadClones={cantidadClones}
        setCantidadClones={setCantidadClones}
        detallesSeleccionados={detallesSeleccionados}
        onClonar={handleClonarDetalles}
      />
    </>
  );
}