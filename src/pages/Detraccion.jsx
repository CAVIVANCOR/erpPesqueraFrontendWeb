// src/pages/Detraccion.jsx
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
import DetraccionForm from "../components/detraccion/DetraccionForm";
import {
  getDetracciones,
  getDetraccionById,
  createDetraccion,
  updateDetraccion,
  deleteDetraccion,
} from "../api/tesoreria/detraccion";
import { getEmpresas } from "../api/empresa";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { getTiposDetraccionActivos } from "../api/tesoreria/tipoDetraccion";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function Detraccion({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const formRef = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [detracciones, setDetracciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDetraccion, setTiposDetraccion] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  // Estados de filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoDetraccionSeleccionado, setTipoDetraccionSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [origenSeleccionado, setOrigenSeleccionado] = useState("TODOS"); // "TODOS" | "VENTA" | "COMPRA"
  const [periodoContableSeleccionado, setPeriodoContableSeleccionado] = useState(null);
  const [periodosContablesFiltrados, setPeriodosContablesFiltrados] = useState([]);

  // Opciones dinámicas para filtros
  const [detraccionesFiltradas, setDetraccionesFiltradas] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [tiposDetraccionUnicos, setTiposDetraccionUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [monedasUnicas, setMonedasUnicas] = useState([]);
  const [periodosUnicos, setPeriodosUnicos] = useState([]);

  const [selectedDetraccion, setSelectedDetraccion] = useState(null);
  const [detraccionDialog, setDetraccionDialog] = useState(false);
  const [deleteDetraccionDialog, setDeleteDetraccionDialog] = useState(false);
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

    setTiposDetraccionUnicos(opciones.tiposDetraccionUnicos);
    setEstadosUnicos(opciones.estadosUnicos);
    setMonedasUnicas(opciones.monedasUnicas);
    setPeriodosUnicos(opciones.periodosUnicos);

    // Limpiar selecciones que ya no existen
    if (tipoDetraccionSeleccionado && !opciones.tiposDetraccionUnicos.find(t => Number(t.id) === Number(tipoDetraccionSeleccionado))) {
      setTipoDetraccionSeleccionado(null);
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
  }, [itemsFiltrados, detraccionesFiltradas, empresaSeleccionada]);

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

  // Aplicar filtros a las detracciones
  useEffect(() => {
    let filtrados = detracciones;

    // Filtro por empresa (nivel 1)
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }
    setDetraccionesFiltradas(filtrados);

    // Filtros secundarios
    if (tipoDetraccionSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoDetraccionId) === Number(tipoDetraccionSeleccionado)
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
    tipoDetraccionSeleccionado,
    estadoSeleccionado,
    monedaSeleccionada,
    origenSeleccionado,
    periodoContableSeleccionado,
    detracciones,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        detraccionesData,
        empresasData,
        tiposDetraccionData,
        monedasData,
        estadosData,
        periodosContablesData,
        entidadesComercialesData,
      ] = await Promise.all([
        getDetracciones(),
        getEmpresas(),
        getTiposDetraccionActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getEntidadesComerciales(),
      ]);

      setDetracciones(detraccionesData || []);
      setEmpresas(empresasData || []);
      setTiposDetraccion(tiposDetraccionData || []);
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
    const datosParaOpciones = itemsFiltrados.length > 0 ? itemsFiltrados : detraccionesFiltradas;

    // Tipos de detracción únicos
    const tiposDetraccionUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.tipoDetraccion)
        .map(d => [d.tipoDetraccion.id, d.tipoDetraccion])
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
      tiposDetraccionUnicos,
      estadosUnicos,
      monedasUnicas,
      periodosUnicos
    };
  };

  const openNew = () => {
    setFormData({
      empresaId: empresaSeleccionada,
    });
    setSelectedDetraccion(null);
    setIsEdit(false);
    setDetraccionDialog(true);
  };

  const hideDialog = () => {
    setDetraccionDialog(false);
    setFormData({});
    setSelectedDetraccion(null);
  };

  const editDetraccion = async (detraccion) => {
    try {
      setLoading(true);
      const detraccionCompleta = await getDetraccionById(detraccion.id);

      const dataParaEdicion = {
        ...detraccionCompleta,
        empresaId: Number(detraccionCompleta.empresaId),
        entidadComercialId: Number(detraccionCompleta.entidadComercialId),
        tipoDetraccionId: detraccionCompleta.tipoDetraccionId ? Number(detraccionCompleta.tipoDetraccionId) : null,
        monedaId: Number(detraccionCompleta.monedaId),
        estadoPagoId: Number(detraccionCompleta.estadoPagoId),
        periodoContableId: detraccionCompleta.periodoContableId ? Number(detraccionCompleta.periodoContableId) : null,
      };

      setFormData(dataParaEdicion);
      setSelectedDetraccion(detraccion);
      setIsEdit(true);
      setDetraccionDialog(true);
    } catch (error) {
      console.error("Error al cargar detracción:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar detracción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDetraccion = async (data) => {
    const esEdicion = isEdit && selectedDetraccion;

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
        await updateDetraccion(selectedDetraccion.id, dataConAuditoria);

        if (formRef.current?.recargarDetraccionDesdeBackend) {
          await formRef.current.recargarDetraccionDesdeBackend();
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detracción actualizada correctamente",
          life: 3000,
        });
      } else {
        await createDetraccion(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detracción creada correctamente",
          life: 3000,
        });
        hideDialog();
      }

      loadData();
    } catch (error) {
      console.error("Error al guardar detracción:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar detracción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteDetraccion = (detraccion) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedDetraccion(detraccion);
    setDeleteDetraccionDialog(true);
  };

  const deleteDetraccionConfirmed = async () => {
    try {
      setLoading(true);
      await deleteDetraccion(selectedDetraccion.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Detracción eliminada correctamente",
        life: 3000,
      });

      setDeleteDetraccionDialog(false);
      setSelectedDetraccion(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar detracción:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar detracción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteDetraccionDialog = () => {
    setDeleteDetraccionDialog(false);
    setSelectedDetraccion(null);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoDetraccionSeleccionado(null);
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

  const tipoDetraccionBodyTemplate = (rowData) => {
    return rowData.tipoDetraccion?.nombre || "-";
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
          onClick={() => editDetraccion(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeleteDetraccion(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const deleteDetraccionDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteDetraccionDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deleteDetraccionConfirmed}
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
        emptyMessage="No se encontraron detracciones"
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
                <h2>Gestión de Detracciones</h2>
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
                        : "Nueva Detracción"
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
                <label htmlFor="tipoDetraccionFiltro" style={{ fontWeight: "bold" }}>
                  Tipo de Detracción
                </label>
                <Dropdown
                  id="tipoDetraccionFiltro"
                  value={tipoDetraccionSeleccionado}
                  options={tiposDetraccionUnicos.map((t) => ({
                    label: t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTipoDetraccionSeleccionado(e.value)}
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
          body={tipoDetraccionBodyTemplate}
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
          header="Importe Requerido"
          body={(rowData) => montoBodyTemplate(rowData, "importeRequerido")}
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
        visible={detraccionDialog}
        style={{ width: "95vw" }}
        header={isEdit ? "Editar Detracción" : "Nueva Detracción"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <DetraccionForm
          ref={formRef}
          isEdit={isEdit}
          defaultValues={formData}
          empresas={empresas}
          tiposDetraccion={tiposDetraccion}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          entidadesComerciales={entidadesComerciales}
          empresaFija={empresaSeleccionada}
          onSubmit={saveDetraccion}
          onCancel={hideDialog}
          loading={loading}
          readOnly={!permisos.puedeEditar && isEdit}
          permisos={permisos}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={deleteDetraccionDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDetraccionDialogFooter}
        onHide={hideDeleteDetraccionDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedDetraccion && (
            <span>
              ¿Está seguro de eliminar la detracción <b>{selectedDetraccion.id}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}