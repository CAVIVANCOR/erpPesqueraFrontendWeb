// src/pages/SaldoCuentaCorriente.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import SaldoCuentaCorrienteForm from "../components/saldoCuentaCorriente/SaldoCuentaCorrienteForm";
import HistoricoCuentaCorriente from "../components/saldoCuentaCorriente/HistoricoCuentaCorriente";
import ProyeccionCuentaCorriente from "../components/saldoCuentaCorriente/ProyeccionCuentaCorriente";
import {
  getAllSaldoCuentaCorriente,
  calcularSaldoActual,
  eliminarSaldoCuentaCorriente,
} from "../api/saldoCuentaCorriente";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEmpresas } from "../api/empresa";
import { getCentrosCosto } from "../api/centroCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

export default function SaldoCuentaCorriente({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [cuentaFilter, setCuentaFilter] = useState(null);
  const [fechaInicioFilter, setFechaInicioFilter] = useState(null);
  const [fechaFinFilter, setFechaFinFilter] = useState(null);
  const [conciliadoFilter, setConciliadoFilter] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);
  const [showProyeccion, setShowProyeccion] = useState(false);
  const [selectedCuentaAnalisis, setSelectedCuentaAnalisis] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, cuentaFilter, fechaInicioFilter, fechaFinFilter, conciliadoFilter]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [saldos, cuentas, emps, centros] = await Promise.all([
        getAllSaldoCuentaCorriente(),
        getAllCuentaCorriente(),
        getEmpresas(),
        getCentrosCosto(),
      ]);
      setItems(saldos);
      setCuentasCorrientes(cuentas);
      setEmpresas(emps);
      setCentrosCosto(centros);
    } catch (error) {
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

  const filtrarItems = () => {
    let filtrados = [...items];

    if (empresaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaFilter)
      );
    }

    if (cuentaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.cuentaCorrienteId) === Number(cuentaFilter)
      );
    }

    if (fechaInicioFilter) {
      filtrados = filtrados.filter((item) => {
        const fechaItem = new Date(item.fecha);
        const fechaIni = new Date(fechaInicioFilter);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaItem >= fechaIni;
      });
    }

    if (fechaFinFilter) {
      filtrados = filtrados.filter((item) => {
        const fechaItem = new Date(item.fecha);
        const fechaFinDia = new Date(fechaFinFilter);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaItem <= fechaFinDia;
      });
    }

    if (conciliadoFilter !== null) {
      filtrados = filtrados.filter((item) => item.conciliado === conciliadoFilter);
    }

    setItemsFiltrados(filtrados);
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarSaldoCuentaCorriente(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Saldo eliminado",
        detail: `El saldo del ${new Date(row.fecha).toLocaleDateString("es-PE")} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar el saldo.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data;
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Saldo actualizado" : "Saldo creado",
        detail: isEdit
          ? "El saldo fue actualizado correctamente."
          : "El saldo fue creado correctamente.",
        life: 3000,
      });
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el saldo.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerHistorico = (rowData) => {
    if (!rowData?.cuentaCorrienteId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se pudo identificar la cuenta corriente",
        life: 3000,
      });
      return;
    }
    setSelectedCuentaAnalisis(rowData);
    setShowHistorico(true);
  };

  const handleVerProyeccion = (rowData) => {
    if (!rowData?.cuentaCorrienteId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se pudo identificar la cuenta corriente",
        life: 3000,
      });
      return;
    }
    setSelectedCuentaAnalisis(rowData);
    setShowProyeccion(true);
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setCuentaFilter(null);
    setFechaInicioFilter(null);
    setFechaFinFilter(null);
    setConciliadoFilter(null);
    setGlobalFilter("");
  };

  const cuentaNombreBodyTemplate = (rowData) => {
    const cuenta = rowData.cuentaCorriente;
    return cuenta
      ? `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`
      : "-";
  };

  const empresaNombreBodyTemplate = (rowData) => {
    const empresa = rowData.empresa;
    return empresa ? empresa.razonSocial : "-";
  };

  const montoBodyTemplate = (rowData, field, color) => {
    const moneda = rowData.cuentaCorriente?.moneda;
    const simbolo = moneda?.simbolo || "";
    return (
      <span style={{ color: color || "inherit" }}>
        {simbolo} {Number(rowData[field]).toFixed(2)}
      </span>
    );
  };

  const diferenciaBodyTemplate = (rowData) => {
    if (!rowData.diferencia && rowData.diferencia !== 0) return "-";
    const moneda = rowData.cuentaCorriente?.moneda;
    const simbolo = moneda?.simbolo || "";
    const valor = Number(rowData.diferencia);
    return (
      <span style={{ color: Math.abs(valor) > 0.01 ? "red" : "green" }}>
        {simbolo} {valor.toFixed(2)}
      </span>
    );
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fecha) return "-";
    return new Date(rowData.fecha).toLocaleDateString("es-PE");
  };

  const conciliadoBodyTemplate = (rowData) => {
    return rowData.conciliado ? (
      <Tag value="SÍ" severity="success" />
    ) : (
      <Tag value="NO" severity="warning" />
    );
  };

  const actionBodyTemplate = (rowData) => {
    const saldosCuenta = items.filter(
      (item) => Number(item.cuentaCorrienteId) === Number(rowData.cuentaCorrienteId)
    );

    return (
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "0.25rem" }}>
        <Button
          icon="pi pi-chart-line"
          className="p-button-text p-button-info"
          disabled={loading || saldosCuenta.length === 0}
          onClick={() => handleVerHistorico(rowData)}
          tooltip="Análisis Histórico"
        />
        <Button
          icon="pi pi-chart-bar"
          className="p-button-text p-button-warning"
          disabled={loading || saldosCuenta.length === 0}
          onClick={() => handleVerProyeccion(rowData)}
          tooltip="Proyección Financiera"
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-text"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={() => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              onEdit(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const empresaOptions = empresas.map((emp) => ({
    label: emp.razonSocial,
    value: Number(emp.id),
  }));

  const cuentaOptions = cuentasCorrientes.map((cuenta) => ({
    label: `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`,
    value: Number(cuenta.id),
  }));

  const conciliadoOptions = [
    { label: "Sí", value: true },
    { label: "No", value: false },
  ];

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el saldo del{" "}
            <b>{confirmState.row?.fecha && new Date(confirmState.row.fecha).toLocaleDateString("es-PE")}</b>?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} saldos"
        sortField="fecha"
        sortOrder={-1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={["id"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Saldos de Cuentas Corrientes</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nuevo Saldo"
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaFilter">Filtrar por Empresa</label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaFilter}
                  options={empresaOptions}
                  onChange={(e) => setEmpresaFilter(e.value)}
                  placeholder="Todas"
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1.5 }}>
                <label htmlFor="cuentaFilter">Filtrar por Cuenta</label>
                <Dropdown
                  id="cuentaFilter"
                  value={cuentaFilter}
                  options={cuentaOptions}
                  onChange={(e) => setCuentaFilter(e.value)}
                  placeholder="Todas"
                  showClear
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaInicioFilter">Desde</label>
                <Calendar
                  id="fechaInicioFilter"
                  value={fechaInicioFilter}
                  onChange={(e) => setFechaInicioFilter(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Fecha inicio"
                  showButtonBar
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFinFilter">Hasta</label>
                <Calendar
                  id="fechaFinFilter"
                  value={fechaFinFilter}
                  onChange={(e) => setFechaFinFilter(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Fecha fin"
                  showButtonBar
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="conciliadoFilter">Conciliado</label>
                <Dropdown
                  id="conciliadoFilter"
                  value={conciliadoFilter}
                  options={conciliadoOptions}
                  onChange={(e) => setConciliadoFilter(e.value)}
                  placeholder="Todos"
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable />
        <Column
          field="fecha"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
        />
        <Column
          field="cuentaCorrienteId"
          header="Cuenta Corriente"
          body={cuentaNombreBodyTemplate}
          sortable
        />
        <Column
          field="empresaId"
          header="Empresa"
          body={empresaNombreBodyTemplate}
          sortable
        />
        <Column
          field="saldoAnterior"
          header="Saldo Anterior"
          body={(rowData) => montoBodyTemplate(rowData, "saldoAnterior")}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="ingresos"
          header="Ingresos"
          body={(rowData) => montoBodyTemplate(rowData, "ingresos", "green")}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="egresos"
          header="Egresos"
          body={(rowData) => montoBodyTemplate(rowData, "egresos", "red")}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="saldoActual"
          header="Saldo Actual"
          body={(rowData) => montoBodyTemplate(rowData, "saldoActual")}
          sortable
          style={{ textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          field="diferencia"
          header="Diferencia"
          body={diferenciaBodyTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="conciliado"
          header="Conciliado"
          body={conciliadoBodyTemplate}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" style={{ width: "180px" }} />
      </DataTable>

      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Saldo"
              : "Ver Saldo"
            : "Nuevo Saldo"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <SaldoCuentaCorrienteForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          cuentasCorrientes={cuentasCorrientes}
          empresas={empresas}
          centrosCosto={centrosCosto}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>

      <HistoricoCuentaCorriente
        visible={showHistorico}
        onHide={() => setShowHistorico(false)}
        saldos={
          selectedCuentaAnalisis
            ? items.filter(
                (item) =>
                  Number(item.cuentaCorrienteId) ===
                  Number(selectedCuentaAnalisis.cuentaCorrienteId)
              )
            : []
        }
        cuentaCorriente={selectedCuentaAnalisis?.cuentaCorriente || null}
      />

      <ProyeccionCuentaCorriente
        visible={showProyeccion}
        onHide={() => setShowProyeccion(false)}
        saldos={
          selectedCuentaAnalisis
            ? items.filter(
                (item) =>
                  Number(item.cuentaCorrienteId) ===
                  Number(selectedCuentaAnalisis.cuentaCorrienteId)
              )
            : []
        }
        cuentaCorriente={selectedCuentaAnalisis?.cuentaCorriente || null}
      />
    </div>
  );
}