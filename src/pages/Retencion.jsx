// src/pages/Retencion.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import EmpresaSelector from "../components/common/EmpresaSelector";
import RetencionForm from "../components/retencion/RetencionForm";
import {
  getRetenciones,
  getRetencionById,
  createRetencion,
  updateRetencion,
  deleteRetencion,
} from "../api/tesoreria/retencion";
import { getEmpresas } from "../api/empresa";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { getTiposRetencionPercepcionActivos } from "../api/tesoreria/tipoRetencionPercepcion";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function Retencion({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const formRef = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [retenciones, setRetenciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposRetencionPercepcion, setTiposRetencionPercepcion] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  // Estados de filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoRetencionPercepcionSeleccionado, setTipoRetencionPercepcionSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [origenSeleccionado, setOrigenSeleccionado] = useState("TODOS"); // "TODOS" | "VENTA" | "COMPRA"
  const [periodoContableSeleccionado, setPeriodoContableSeleccionado] = useState(null);
  const [periodosContablesFiltrados, setPeriodosContablesFiltrados] = useState([]);

  // Opciones dinámicas para filtros
  const [retencionesFiltradas, setRetencionesFiltradas] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [tiposRetencionPercepcionUnicos, setTiposRetencionPercepcionUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [monedasUnicas, setMonedasUnicas] = useState([]);
  const [periodosUnicos, setPeriodosUnicos] = useState([]);

  const [selectedRetencion, setSelectedRetencion] = useState(null);
  const [retencionDialog, setRetencionDialog] = useState(false);
  const [deleteRetencionDialog, setDeleteRetencionDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  // Actualizar opciones de filtros basadas en datos visibles
  useEffect(() => {
    const opciones = obtenerOpcionesDinamicas();

    setTiposRetencionPercepcionUnicos(opciones.tiposRetencionPercepcionUnicos);
    setEstadosUnicos(opciones.estadosUnicos);
    setMonedasUnicas(opciones.monedasUnicas);
    setPeriodosUnicos(opciones.periodosUnicos);

    // Limpiar selecciones que ya no existen
    if (tipoRetencionPercepcionSeleccionado && !opciones.tiposRetencionPercepcionUnicos.find(t => Number(t.id) === Number(tipoRetencionPercepcionSeleccionado))) {
      setTipoRetencionPercepcionSeleccionado(null);
    }
    if (estadoSeleccionado && !opciones.estadosUnicos.find(e => Number(e.id) === Number(estadoSeleccionado))) {
      setEstadoSeleccionado(null);
    }
    if (monedaSeleccionada && !opciones.monedasUnicas.find(m => Number(m.id) === Number(monedaSeleccionada))) {
      setMonedaSeleccionada(null);
    }
    if (periodoContableSeleccionado && !opciones.periodosUnicos.find(p => Number(p.id) === Number(periodoContableSeleccionado))) {
      setPeriodoContableSeleccionado(null);
    }
  }, [itemsFiltrados, retencionesFiltradas, empresaSeleccionada]);

  // Filtrar períodos contables por empresa seleccionada
  useEffect(() => {
    if (empresaSeleccionada) {
      const periodosDeLaEmpresa = periodosContables.filter(
        (p) => Number(p.empresaId) === Number(empresaSeleccionada)
      );
      setPeriodosContablesFiltrados(periodosDeLaEmpresa);
    } else {
      setPeriodosContablesFiltrados(periodosContables);
    }
  }, [empresaSeleccionada, periodosContables]);

  // Aplicar filtros a las retenciones
  useEffect(() => {
    let filtrados = retenciones;

    // Filtro por empresa (nivel 1)
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }
    setRetencionesFiltradas(filtrados);

    // Filtros secundarios
    if (tipoRetencionPercepcionSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoRetencionPercepcionId) === Number(tipoRetencionPercepcionSeleccionado)
      );
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoPagoId) === Number(estadoSeleccionado)
      );
    }

    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.monedaId) === Number(monedaSeleccionada)
      );
    }

    if (origenSeleccionado === "VENTA") {
      filtrados = filtrados.filter((item) => item.origenOperacionComprasVentas === false);
    } else if (origenSeleccionado === "COMPRA") {
      filtrados = filtrados.filter((item) => item.origenOperacionComprasVentas === true);
    }
    // Si es "TODOS", no filtra

    if (periodoContableSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.periodoContableId) === Number(periodoContableSeleccionado)
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    tipoRetencionPercepcionSeleccionado,
    estadoSeleccionado,
    monedaSeleccionada,
    origenSeleccionado,
    periodoContableSeleccionado,
    retenciones,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        retencionesData,
        empresasData,
        tiposRetencionPercepcionData,
        monedasData,
        estadosData,
        periodosContablesData,
        entidadesComercialesData,
      ] = await Promise.all([
        getRetenciones(),
        getEmpresas(),
        getTiposRetencionPercepcionActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getEntidadesComerciales(),
      ]);

      setRetenciones(retencionesData || []);
      setEmpresas(empresasData || []);
      setTiposRetencionPercepcion(tiposRetencionPercepcionData || []);
      setMonedas(monedasData || []);
      setEstados(estadosData || []);
      setPeriodosContables(periodosContablesData || []);
      setEntidadesComerciales(entidadesComercialesData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generar opciones dinámicas basadas en datos filtrados
  const obtenerOpcionesDinamicas = () => {
    const datosParaOpciones = itemsFiltrados.length > 0 ? itemsFiltrados : retencionesFiltradas;

    // Tipos de retención únicos
    const tiposRetencionPercepcionUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.tipoRetencionPercepcion)
        .map(d => [d.tipoRetencionPercepcion.id, d.tipoRetencionPercepcion])
    ).values()];

    // Estados únicos
    const estadosUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.estadoPago)
        .map(d => [d.estadoPago.id, d.estadoPago])
    ).values()];

    // Monedas únicas
    const monedasUnicas = [...new Map(
      datosParaOpciones
        .filter(d => d.moneda)
        .map(d => [d.moneda.id, d.moneda])
    ).values()];

    // Periodos únicos
    const periodosUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.periodoContable)
        .map(d => [d.periodoContable.id, d.periodoContable])
    ).values()];

    return {
      tiposRetencionPercepcionUnicos,
      estadosUnicos,
      monedasUnicas,
      periodosUnicos
    };
  };

  const openNew = () => {
    setFormData({
      empresaId: empresaSeleccionada,
    });
    setSelectedRetencion(null);
    setIsEdit(false);
    setRetencionDialog(true);
  };

  const hideDialog = () => {
    setRetencionDialog(false);
    setFormData({});
    setSelectedRetencion(null);
  };

  const editRetencion = async (retencion) => {
    try {
      setLoading(true);
      const retencionCompleta = await getRetencionById(retencion.id);

      const dataParaEdicion = {
        ...retencionCompleta,
        empresaId: Number(retencionCompleta.empresaId),
        entidadComercialId: Number(retencionCompleta.entidadComercialId),
        tipoRetencionPercepcionId: retencionCompleta.tipoRetencionPercepcionId ? Number(retencionCompleta.tipoRetencionPercepcionId) : null,
        monedaId: Number(retencionCompleta.monedaId),
        estadoPagoId: Number(retencionCompleta.estadoPagoId),
        periodoContableId: retencionCompleta.periodoContableId ? Number(retencionCompleta.periodoContableId) : null,
      };

      setFormData(dataParaEdicion);
      setSelectedRetencion(retencion);
      setIsEdit(true);
      setRetencionDialog(true);
    } catch (error) {
      console.error("Error al cargar retención:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar retención",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRetencion = async (data) => {
    const esEdicion = isEdit && selectedRetencion;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const dataConAuditoria = {
        ...data,
        creadoPor: esEdicion
          ? data.creadoPor
          : usuario?.personalId
            ? Number(usuario.personalId)
            : null,
        actualizadoPor:
          esEdicion && usuario?.personalId
            ? Number(usuario.personalId)
            : null,
      };

      if (esEdicion) {
        await updateRetencion(selectedRetencion.id, dataConAuditoria);

        if (formRef.current?.recargarRetencionDesdeBackend) {
          await formRef.current.recargarRetencionDesdeBackend();
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Retención actualizada correctamente",
          life: 3000,
        });
      } else {
        await createRetencion(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Retención creada correctamente",
          life: 3000,
        });
        hideDialog();
      }

      loadData();
    } catch (error) {
      console.error("Error al guardar retención:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar retención",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRetencion = (retencion) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedRetencion(retencion);
    setDeleteRetencionDialog(true);
  };

  const deleteRetencionConfirmed = async () => {
    try {
      setLoading(true);
      await deleteRetencion(selectedRetencion.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Retención eliminada correctamente",
        life: 3000,
      });

      setDeleteRetencionDialog(false);
      setSelectedRetencion(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar retención:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar retención",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteRetencionDialog = () => {
    setDeleteRetencionDialog(false);
    setSelectedRetencion(null);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoRetencionPercepcionSeleccionado(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setOrigenSeleccionado("TODOS");
    setPeriodoContableSeleccionado(null);
  };

  const empresaBodyTemplate = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId)
    );
    return empresa?.razonSocial || "-";
  };

  const entidadComercialBodyTemplate = (rowData) => {
    return rowData.entidadComercial?.razonSocial || "-";
  };

  const tipoRetencionPercepcionBodyTemplate = (rowData) => {
    return rowData.tipoRetencionPercepcion?.nombre || "-";
  };

  const origenBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.origenOperacionComprasVentas ? "COMPRA" : "VENTA"}
        severity={rowData.origenOperacionComprasVentas ? "warning" : "success"}
      />
    );
  };

  const monedaBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId)
    );

    const colorFondo = moneda?.colorFondo || "#e2e3e5";

    return (
      <span
        style={{
          backgroundColor: colorFondo,
          color: "#000",
          fontSize: "0.9rem",
          fontWeight: "bold",
          padding: "4px 8px",
          borderRadius: "4px",
          border: `1px solid ${colorFondo}`,
          display: "inline-block",
          minWidth: "50px",
          textAlign: "center",
        }}
      >
        {moneda?.codigoSunat || "-"}
      </span>
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = estados.find(
      (e) => Number(e.id) === Number(rowData.estadoPagoId)
    );
    return (
      <Tag
        value={estado?.descripcion || "-"}
        severity={estado?.severityColor || "info"}
      />
    );
  };

  const fechaBodyTemplate = (rowData, field) => {
    if (!rowData[field]) return "-";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field] || 0;
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId)
    );

    const colorFondo = moneda?.colorFondo || "#ffffff";

    return (
      <div
        style={{
          backgroundColor: colorFondo,
          padding: "0.5rem",
          borderRadius: "4px",
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {new Intl.NumberFormat("es-PE", {
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(monto)}
      </div>
    );
  };

  const booleanBodyTemplate = (rowData, field) => {
    return rowData[field] ? (
      <i className="pi pi-check" style={{ color: "green" }}></i>
    ) : (
      <i className="pi pi-times" style={{ color: "red" }}></i>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editRetencion(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeleteRetencion(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const deleteRetencionDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteRetencionDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deleteRetencionConfirmed}
        loading={loading}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron retenciones"
        stripedRows
        showGridlines
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        header={
          <div>
            {/* Fila 1: Título, Empresa, Botones */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Gestión de Retenciones</h2>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Empresa*</label>
                <EmpresaSelector
                  empresaId={usuario?.empresaId}
                  onEmpresaChange={(id) => {
                    setEmpresaSeleccionada(id);
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={openNew}
                  className="p-button-primary"
                  style={{ width: "100%" }}
                  disabled={!permisos.puedeCrear || loading || !empresaSeleccionada}
                  tooltip={
                    !permisos.puedeCrear
                      ? "No tiene permisos para crear"
                      : !empresaSeleccionada
                        ? "Seleccione una empresa primero"
                        : "Nueva Retención"
                  }
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-info"
                  onClick={loadData}
                  loading={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="busquedaGlobal" style={{ fontWeight: "bold" }}>
                  Búsqueda Global
                </label>
                <span className="p-input-icon-left" style={{ width: "100%" }}>
                  <i className="pi pi-search" />
                  <InputText
                    id="busquedaGlobal"
                    type="search"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>

            {/* Fila 2: Filtros principales */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="tipoRetencionPercepcionFiltro" style={{ fontWeight: "bold" }}>
                  Tipo de Retención
                </label>
                <Dropdown
                  id="tipoRetencionPercepcionFiltro"
                  value={tipoRetencionPercepcionSeleccionado}
                  options={tiposRetencionPercepcionUnicos.map((t) => ({
                    label: t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTipoRetencionPercepcionSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                  Estado
                </label>
                <Dropdown
                  id="estadoFiltro"
                  value={estadoSeleccionado}
                  options={estadosUnicos.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="monedaFiltro" style={{ fontWeight: "bold" }}>
                  Moneda
                </label>
                <Dropdown
                  id="monedaFiltro"
                  value={monedaSeleccionada}
                  options={monedasUnicas.map((m) => ({
                    label: m.codigoSunat || m.codigo,
                    value: Number(m.id),
                  }))}
                  onChange={(e) => setMonedaSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="origenFiltro" style={{ fontWeight: "bold" }}>
                  Origen
                </label>
                <Button
                  label={
                    origenSeleccionado === "TODOS"
                      ? "TODOS"
                      : origenSeleccionado === "VENTA"
                        ? "VENTA"
                        : "COMPRA"
                  }
                  severity={
                    origenSeleccionado === "TODOS"
                      ? "secondary"
                      : origenSeleccionado === "VENTA"
                        ? "success"
                        : "warning"
                  }
                  onClick={() => {
                    if (origenSeleccionado === "TODOS") {
                      setOrigenSeleccionado("VENTA");
                    } else if (origenSeleccionado === "VENTA") {
                      setOrigenSeleccionado("COMPRA");
                    } else {
                      setOrigenSeleccionado("TODOS");
                    }
                  }}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="periodoContableFiltro" style={{ fontWeight: "bold" }}>
                  Período Contable
                </label>
                <Dropdown
                  id="periodoContableFiltro"
                  value={periodoContableSeleccionado}
                  options={periodosUnicos.map((p) => ({
                    label: p.nombrePeriodo,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPeriodoContableSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Entidad"
          body={entidadComercialBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Origen"
          body={origenBodyTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          header="Tipo"
          body={tipoRetencionPercepcionBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          sortable
          style={{ width: "100px" }}
        />
        <Column
          header="Importe Retenido"
          body={(rowData) => montoBodyTemplate(rowData, "importeRetenido")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          header="Importe Pagado"
          body={(rowData) => montoBodyTemplate(rowData, "importePagado")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          header="Saldo Pendiente"
          body={(rowData) => montoBodyTemplate(rowData, "saldoPendiente")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          header="Aplicado"
          body={(rowData) => booleanBodyTemplate(rowData, "aplicado")}
          sortable
          style={{ width: "100px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={retencionDialog}
        style={{ width: "95vw" }}
        header={isEdit ? "Editar Retención" : "Nueva Retención"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <RetencionForm
          ref={formRef}
          isEdit={isEdit}
          defaultValues={formData}
          empresas={empresas}
          tiposRetencionPercepcion={tiposRetencionPercepcion}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          entidadesComerciales={entidadesComerciales}
          empresaFija={empresaSeleccionada}
          onSubmit={saveRetencion}
          onCancel={hideDialog}
          loading={loading}
          readOnly={!permisos.puedeEditar && isEdit}
          permisos={permisos}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={deleteRetencionDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteRetencionDialogFooter}
        onHide={hideDeleteRetencionDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedRetencion && (
            <span>
              ¿Está seguro de eliminar la retención <b>{selectedRetencion.id}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
