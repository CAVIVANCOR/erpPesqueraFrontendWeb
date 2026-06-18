// src/pages/DeudaTributaria.jsx
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
import DeudaTributariaForm from "../components/deudaTributaria/DeudaTributariaForm";
import { getMediosPago } from "../api/medioPago";
import {
  getDeudasTributarias,
  getDeudaTributariaById,
  createDeudaTributaria,
  updateDeudaTributaria,
  deleteDeudaTributaria,
} from "../api/tesoreria/deudaTributaria";
import { getTiposDeudaTributariaActivos } from "../api/tesoreria/tipoDeudaTributaria";
import { getEmpresas } from "../api/empresa";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";


export default function DeudaTributaria({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const formRef = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [deudas, setDeudas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDeuda, setTiposDeuda] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);

  // Estados de filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoDeudaSeleccionado, setTipoDeudaSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState("TODOS"); // "TODOS" | "FISCAL" | "GERENCIAL"
  const [periodoContableSeleccionado, setPeriodoContableSeleccionado] = useState(null);
  const [periodosContablesFiltrados, setPeriodosContablesFiltrados] = useState([]);

  // Opciones dinámicas para filtros
  const [deudasFiltradas, setDeudasFiltradas] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [tiposDeudaUnicos, setTiposDeudaUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [monedasUnicas, setMonedasUnicas] = useState([]);
  const [periodosUnicos, setPeriodosUnicos] = useState([]);

  const [selectedDeuda, setSelectedDeuda] = useState(null);
  const [deudaDialog, setDeudaDialog] = useState(false);
  const [deleteDeudaDialog, setDeleteDeudaDialog] = useState(false);
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

    setTiposDeudaUnicos(opciones.tiposDeudaUnicos);
    setEstadosUnicos(opciones.estadosUnicos);
    setMonedasUnicas(opciones.monedasUnicas);
    setPeriodosUnicos(opciones.periodosUnicos);

    // Limpiar selecciones que ya no existen
    if (tipoDeudaSeleccionado && !opciones.tiposDeudaUnicos.find(t => Number(t.id) === Number(tipoDeudaSeleccionado))) {
      setTipoDeudaSeleccionado(null);
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
  }, [itemsFiltrados, deudasFiltradas, empresaSeleccionada]);

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

  // Aplicar filtros a las deudas
  // Filtrar items cuando cambien los filtros
  useEffect(() => {
    let filtrados = deudas;

    // Filtro por empresa (nivel 1)
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }
    setDeudasFiltradas(filtrados);

    // Filtros secundarios
    if (tipoDeudaSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoDeudaId) === Number(tipoDeudaSeleccionado)
      );
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado)
      );
    }

    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.monedaId) === Number(monedaSeleccionada)
      );
    }

    if (tipoPagoSeleccionado === "FISCAL") {
      filtrados = filtrados.filter((item) => item.esGerencial === false);
    } else if (tipoPagoSeleccionado === "GERENCIAL") {
      filtrados = filtrados.filter((item) => item.esGerencial === true);
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
    tipoDeudaSeleccionado,
    estadoSeleccionado,
    monedaSeleccionada,
    tipoPagoSeleccionado,
    periodoContableSeleccionado,
    deudas,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        deudasData,
        empresasData,
        tiposDeudaData,
        monedasData,
        estadosData,
        periodosContablesData,
        mediosPagoData,
      ] = await Promise.all([
        getDeudasTributarias(),
        getEmpresas(),
        getTiposDeudaTributariaActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getMediosPago(),
      ]);

      setDeudas(deudasData || []);
      setEmpresas(empresasData || []);
      setTiposDeuda(tiposDeudaData || []);
      setMonedas(monedasData || []);
      setEstados(estadosData || []);
      setPeriodosContables(periodosContablesData || []);
      setMediosPago(mediosPagoData || []);
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
    const datosParaOpciones = itemsFiltrados.length > 0 ? itemsFiltrados : deudasFiltradas;

    // Tipos de deuda únicos
    const tiposDeudaUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.tipoDeuda)
        .map(d => [d.tipoDeuda.id, d.tipoDeuda])
    ).values()];

    // Estados únicos
    const estadosUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.estado)
        .map(d => [d.estado.id, d.estado])
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
      tiposDeudaUnicos,
      estadosUnicos,
      monedasUnicas,
      periodosUnicos
    };
  };

  const openNew = () => {
    setFormData({
      empresaId: empresaSeleccionada,
    });
    setSelectedDeuda(null);
    setIsEdit(false);
    setDeudaDialog(true);
  };

  const hideDialog = () => {
    setDeudaDialog(false);
    setFormData({});
    setSelectedDeuda(null);
  };

  const editDeuda = async (deuda) => {
    try {
      setLoading(true);
      const deudaCompleta = await getDeudaTributariaById(deuda.id);

      const dataParaEdicion = {
        ...deudaCompleta,
        empresaId: Number(deudaCompleta.empresaId),
        tipoDeudaId: Number(deudaCompleta.tipoDeudaId),
        monedaId: Number(deudaCompleta.monedaId),
        estadoId: Number(deudaCompleta.estadoId),
        periodoContableId: deudaCompleta.periodoContableId
          ? Number(deudaCompleta.periodoContableId)
          : null,
      };

      setFormData(dataParaEdicion);
      setSelectedDeuda(deuda);
      setIsEdit(true);
      setDeudaDialog(true);
    } catch (error) {
      console.error("Error al cargar deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDeuda = async (data) => {
    const esEdicion = isEdit && selectedDeuda;

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
        await updateDeudaTributaria(selectedDeuda.id, dataConAuditoria);

        if (formRef.current?.recargarDeudaDesdeBackend) {
          await formRef.current.recargarDeudaDesdeBackend();
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Deuda tributaria actualizada correctamente",
          life: 3000,
        });
      } else {
        await createDeudaTributaria(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Deuda tributaria creada correctamente",
          life: 3000,
        });
      }

      loadData();
    } catch (error) {
      console.error("Error al guardar deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteDeuda = (deuda) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedDeuda(deuda);
    setDeleteDeudaDialog(true);
  };

  const deleteDeudaConfirmed = async () => {
    try {
      setLoading(true);
      await deleteDeudaTributaria(selectedDeuda.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Deuda tributaria eliminada correctamente",
        life: 3000,
      });

      setDeleteDeudaDialog(false);
      setSelectedDeuda(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteDeudaDialog = () => {
    setDeleteDeudaDialog(false);
    setSelectedDeuda(null);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setTipoDeudaSeleccionado(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setTipoPagoSeleccionado("TODOS");
    setPeriodoContableSeleccionado(null);
  };

  const empresaBodyTemplate = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId)
    );
    return empresa?.razonSocial || "-";
  };

  const tipoDeudaBodyTemplate = (rowData) => {
    const tipo = tiposDeuda.find(
      (t) => Number(t.id) === Number(rowData.tipoDeudaId)
    );
    return tipo?.nombre || "-";
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

  const saldoInicialBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esSaldoInicial ? "SI" : "NO"}
        severity={rowData.esSaldoInicial ? "info" : "secondary"}
      />
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = estados.find(
      (e) => Number(e.id) === Number(rowData.estadoId)
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
          onClick={() => editDeuda(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeleteDeuda(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const deleteDeudaDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteDeudaDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deleteDeudaConfirmed}
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
        emptyMessage="No se encontraron deudas tributarias"
        stripedRows
        showGridlines
        paginator
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
                <h2>Gestión de Deudas Tributarias</h2>
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
                        : "Nueva Deuda Tributaria"
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
                <label htmlFor="tipoDeudaFiltro" style={{ fontWeight: "bold" }}>
                  Tipo de Deuda
                </label>
                <Dropdown
                  id="tipoDeudaFiltro"
                  value={tipoDeudaSeleccionado}
                  options={tiposDeudaUnicos.map((t) => ({
                    label: t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTipoDeudaSeleccionado(e.value)}
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
                <label htmlFor="tipoPagoFiltro" style={{ fontWeight: "bold" }}>
                  Tipo de Pago
                </label>
                <Button
                  label={
                    tipoPagoSeleccionado === "TODOS"
                      ? "TODOS"
                      : tipoPagoSeleccionado === "FISCAL"
                        ? "FISCAL"
                        : "GERENCIAL"
                  }
                  severity={
                    tipoPagoSeleccionado === "TODOS"
                      ? "secondary"
                      : tipoPagoSeleccionado === "FISCAL"
                        ? "info"
                        : "success"
                  }
                  onClick={() => {
                    if (tipoPagoSeleccionado === "TODOS") {
                      setTipoPagoSeleccionado("FISCAL");
                    } else if (tipoPagoSeleccionado === "FISCAL") {
                      setTipoPagoSeleccionado("GERENCIAL");
                    } else {
                      setTipoPagoSeleccionado("TODOS");
                    }
                  }}
                  disabled={loading}
                  style={{ width: "100%", marginTop: "0.25rem" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="periodoFiltro" style={{ fontWeight: "bold" }}>
                  Periodo Contable
                </label>
                <Dropdown
                  id="periodoFiltro"
                  value={periodoContableSeleccionado}
                  options={periodosContablesFiltrados.map((p) => ({
                    label: p.nombrePeriodo,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPeriodoContableSeleccionado(e.value)}
                  placeholder="Todos"
                  showClear
                  filter
                  style={{ width: "100%", minWidth: "200px" }}
                />
              </div>
            </div>
          </div>
        }
        rows={100}
        rowsPerPageOptions={[100, 200, 300, 500]}
        sortField="id"
        sortOrder={-1}
        size="small"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => editDeuda(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Tipo Deuda"
          body={tipoDeudaBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="periodo"
          header="Período"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="numeroDeclaracion"
          header="N° Declaración"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Fecha Gen."
          body={(rowData) => fechaBodyTemplate(rowData, "fechaGeneracion")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Fecha Venc."
          body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Monto Original"
          body={(rowData) => montoBodyTemplate(rowData, "montoOriginal")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Pagado Anterior"
          body={(rowData) => montoBodyTemplate(rowData, "montoPagadoAnterior")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Monto Pagado"
          body={(rowData) => montoBodyTemplate(rowData, "montoPagado")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Saldo Pend."
          body={(rowData) => montoBodyTemplate(rowData, "saldoPendiente")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Saldo Inicial"
          body={saldoInicialBodyTemplate}
          sortable
          style={{ minWidth: "100px", textAlign: "center" }}
        />
        <Column
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Gerencial"
          body={(rowData) => booleanBodyTemplate(rowData, "esGerencial")}
          sortable
          style={{ minWidth: "100px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={deudaDialog}
        style={{ width: "1300px" }}
        maximizable
        maximized={true}
        header={
          isEdit ? "Editar Deuda Tributaria" : "Nueva Deuda Tributaria"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <DeudaTributariaForm
          key={`deuda-${selectedDeuda?.id || "new"}-${formData?.empresaId || ""}`}
          isEdit={isEdit}
          defaultValues={formData}
          empresas={empresas}
          tiposDeuda={tiposDeuda}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          mediosPago={mediosPago}
          empresaFija={empresaSeleccionada}
          onSubmit={saveDeuda}
          onCancel={hideDialog}
          loading={loading}
          readOnly={!!isEdit && !permisos.puedeEditar}
          permisos={permisos}
          toast={toast}
          ref={formRef}
        />
      </Dialog>

      <Dialog
        visible={deleteDeudaDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDeudaDialogFooter}
        onHide={hideDeleteDeudaDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedDeuda && (
            <span>
              ¿Está seguro de eliminar la deuda tributaria{" "}
              <b>{selectedDeuda.numeroDeclaracion || selectedDeuda.id}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}