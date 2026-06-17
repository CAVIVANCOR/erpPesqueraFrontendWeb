// src/pages/DeudaConPersonal.jsx
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
import DeudaConPersonalForm from "../components/deudaConPersonal/DeudaConPersonalForm";
import { getMediosPago } from "../api/medioPago";
import {
  getDeudasConPersonal,
  getDeudaConPersonalById,
  createDeudaConPersonal,
  updateDeudaConPersonal,
  deleteDeudaConPersonal,
} from "../api/tesoreria/deudaConPersonal";
import { getTiposDeudaPersonalActivos } from "../api/tesoreria/tipoDeudaPersonal";
import { getEmpresas } from "../api/empresa";
import { getPersonal } from "../api/personal";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";


export default function DeudaConPersonal({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const formRef = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [deudas, setDeudas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [tiposDeuda, setTiposDeuda] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);

  // Estados de filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [tipoDeudaSeleccionado, setTipoDeudaSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState(null);
  const [periodoContableSeleccionado, setPeriodoContableSeleccionado] = useState(null);

  // Opciones dinámicas para filtros
  const [deudasFiltradas, setDeudasFiltradas] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [personalesUnicos, setPersonalesUnicos] = useState([]);
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

    setPersonalesUnicos(opciones.personalesUnicos);
    setTiposDeudaUnicos(opciones.tiposDeudaUnicos);
    setEstadosUnicos(opciones.estadosUnicos);
    setMonedasUnicas(opciones.monedasUnicas);
    setPeriodosUnicos(opciones.periodosUnicos);

    // Limpiar selecciones que ya no existen
    if (personalSeleccionado && !opciones.personalesUnicos.find(p => Number(p.id) === Number(personalSeleccionado))) {
      setPersonalSeleccionado(null);
    }
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
    if (personalSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.personalId) === Number(personalSeleccionado)
      );
    }

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

    if (tipoPagoSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.esGerencial === tipoPagoSeleccionado
      );
    }

    if (periodoContableSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.periodoContableId) === Number(periodoContableSeleccionado)
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    personalSeleccionado,
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
        personalData,
        tiposDeudaData,
        monedasData,
        estadosData,
        periodosContablesData,
        mediosPagoData,
      ] = await Promise.all([
        getDeudasConPersonal(),
        getEmpresas(),
        getPersonal(),
        getTiposDeudaPersonalActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getMediosPago(),
      ]);

      setDeudas(deudasData || []);
      setEmpresas(empresasData || []);
      setPersonal(personalData || []);
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

    // Personales únicos (filtrados por empresa si hay una seleccionada)
    const personalesUnicos = [...new Map(
      datosParaOpciones
        .filter(d => d.personal)
        .filter(d => !empresaSeleccionada || Number(d.empresaId) === Number(empresaSeleccionada))
        .map(d => [d.personal.id, d.personal])
    ).values()];

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
      personalesUnicos,
      tiposDeudaUnicos,
      estadosUnicos,
      monedasUnicas,
      periodosUnicos
    };
  };

  const openNew = () => {
    setFormData({
      empresaId: empresaSeleccionada, // Precargar empresa seleccionada
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
      const deudaCompleta = await getDeudaConPersonalById(deuda.id);

      const dataParaEdicion = {
        ...deudaCompleta,
        empresaId: Number(deudaCompleta.empresaId),
        personalId: Number(deudaCompleta.personalId),
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
      console.error("Error al cargar deuda con personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar deuda con personal",
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
        await updateDeudaConPersonal(selectedDeuda.id, dataConAuditoria);

        if (formRef.current?.recargarDeudaDesdeBackend) {
          await formRef.current.recargarDeudaDesdeBackend();
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Deuda con personal actualizada correctamente",
          life: 3000,
        });
      } else {
        await createDeudaConPersonal(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Deuda con personal creada correctamente",
          life: 3000,
        });
      }

      loadData();
    } catch (error) {
      console.error("Error al guardar deuda con personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar deuda con personal",
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
      await deleteDeudaConPersonal(selectedDeuda.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Deuda con personal eliminada correctamente",
        life: 3000,
      });

      setDeleteDeudaDialog(false);
      setSelectedDeuda(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar deuda con personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar deuda con personal",
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
    setPersonalSeleccionado(null);
    setTipoDeudaSeleccionado(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setTipoPagoSeleccionado(null);
    setPeriodoContableSeleccionado(null);
  };

  const empresaBodyTemplate = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId)
    );
    return empresa?.razonSocial || "-";
  };

  const personalBodyTemplate = (rowData) => {
    const pers = personal.find(
      (p) => Number(p.id) === Number(rowData.personalId)
    );
    return pers?.nombreCompleto || "-";
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
        emptyMessage="No se encontraron deudas con personal"
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
              <div style={{ flex: 2 }}>
                <h2>Gestión de Deudas con Personal</h2>
              </div>
              <div style={{ flex: 2 }}>
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
                  disabled={!permisos.puedeCrear || loading || !empresaSeleccionada}
                  tooltip={
                    !permisos.puedeCrear
                      ? "No tiene permisos para crear"
                      : !empresaSeleccionada
                        ? "Seleccione una empresa primero"
                        : "Nueva Deuda con Personal"
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Actualizar"
                  icon="pi pi-refresh"
                  className="p-button-info"
                  onClick={loadData}
                  loading={loading}
                />
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
                <label htmlFor="personalFiltro" style={{ fontWeight: "bold" }}>
                  Personal (Trabajador)
                </label>
                <Dropdown
                  id="personalFiltro"
                  value={personalSeleccionado}
                  options={personalesUnicos.map((p) => ({
                    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPersonalSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                />
              </div>
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
                />
              </div>
            </div>

            {/* Fila 3: Filtros adicionales */}
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
                <label htmlFor="tipoPagoFiltro" style={{ fontWeight: "bold" }}>
                  Tipo de Pago
                </label>
                <Dropdown
                  id="tipoPagoFiltro"
                  value={tipoPagoSeleccionado}
                  options={[
                    { label: "Todos", value: null },
                    { label: "Pago Blanco (Formal)", value: false },
                    { label: "Pago Negro (Gerencial)", value: true },
                  ]}
                  onChange={(e) => setTipoPagoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="periodoFiltro" style={{ fontWeight: "bold" }}>
                  Periodo Contable
                </label>
                <Dropdown
                  id="periodoFiltro"
                  value={periodoContableSeleccionado}
                  options={periodosUnicos.map((p) => ({
                    label: p.nombre || `${p.anio} - ${p.mes}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPeriodoContableSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 2 }}>
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
              <div style={{ flex: 2 }}></div>
            </div>
          </div>
        }
        rows={100}
        rowsPerPageOptions={[100, 200, 300, 500]}
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
          header="Personal"
          body={personalBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Tipo Deuda"
          body={tipoDeudaBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="numeroDocumento"
          header="N° Documento"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Fecha"
          body={(rowData) => fechaBodyTemplate(rowData, "fecha")}
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
          header="Saldo Pend."
          body={(rowData) => montoBodyTemplate(rowData, "saldoPendiente")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
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
          isEdit ? "Editar Deuda con Personal" : "Nueva Deuda con Personal"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <DeudaConPersonalForm
          isEdit={isEdit}
          defaultValues={formData}
          empresas={empresas}
          personal={personal}
          tiposDeuda={tiposDeuda}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          mediosPago={mediosPago}
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
              ¿Está seguro de eliminar la deuda con personal{" "}
              <b>{selectedDeuda.numeroDocumento || selectedDeuda.id}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}