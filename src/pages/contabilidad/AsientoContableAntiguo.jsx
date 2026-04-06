// src/pages/contabilidad/AsientoContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import AsientoContableForm from "../../components/contabilidad/AsientoContableForm";
import {
  getAsientoContable,
  getAsientoContableById,
  deleteAsientoContable,
  aprobarAsiento,
  anularAsiento,
} from "../../api/contabilidad/asientoContable";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getMonedas } from "../../api/moneda";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function AsientoContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [periodoFilter, setPeriodoFilter] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
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

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, periodoFilter, estadoFilter, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [asientosData, empresasData, periodosData, estadosData, monedasData] =
        await Promise.all([
          getAsientoContable(),
          getEmpresas(),
          getPeriodosContables(),
          getEstadosMultiFuncionPorTipoProviene(20), // ASIENTO CONTABLE
          getMonedas(),
        ]);

      setItems(asientosData);
      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setEstados(estadosData);
      setMonedas(monedasData);
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

    if (periodoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.periodoContableId) === Number(periodoFilter)
      );
    }

    if (estadoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoFilter)
      );
    }

    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaAsiento = new Date(item.fechaAsiento);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaAsiento >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaAsiento = new Date(item.fechaAsiento);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaAsiento <= fechaFinDia;
      });
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
    if (!empresaFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
        life: 3000,
      });
      return;
    }
    if (!periodoFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un período contable primero",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }

    try {
      const asientoCompleto = await getAsientoContableById(rowData.id);
      setSelected(asientoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar asiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el asiento contable",
        life: 3000,
      });
    }
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
      await deleteAsientoContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Asiento eliminado",
        detail: `El asiento ${row.numeroAsiento} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar el asiento contable.",
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
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data; // El formulario ya maneja la llamada a la API
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Asiento actualizado" : "Asiento creado",
        detail: isEdit
          ? "El asiento contable fue actualizado correctamente."
          : "El asiento contable fue creado correctamente.",
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
        detail: "No se pudo guardar el asiento contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para aprobar asientos.",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "aprobar",
    });
  };

  const handleAnular = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para anular asientos.",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "anular",
    });
  };

  const handleConfirmAction = async () => {
    const { row, action } = confirmState;
    if (!row) return;

    setConfirmState({ visible: false, row: null });
    setLoading(true);

    try {
      if (action === "aprobar") {
        await aprobarAsiento(row.id, usuario.personalId);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Asiento contable aprobado correctamente",
          life: 3000,
        });
      } else if (action === "anular") {
        await anularAsiento(row.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Asiento contable anulado correctamente",
          life: 3000,
        });
      }
      await cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || `Error al ${action} asiento`,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setPeriodoFilter(null);
    setEstadoFilter(null);
    setFechaInicio(null);
    setFechaFin(null);
    setGlobalFilter("");
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado?.descripcion || "";
    let severity = "info";
    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "APROBADO") severity = "success";
    if (estado === "ANULADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const cuadradoBodyTemplate = (rowData) => {
    return rowData.estaCuadrado ? (
      <Tag value="CUADRADO" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="DESCUADRADO" severity="danger" icon="pi pi-times" />
    );
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
    }).format(rowData[field] || 0);
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaAsiento) return "-";
    return new Date(rowData.fechaAsiento).toLocaleDateString("es-PE");
  };

  const actionBodyTemplate = (rowData) => {
    const estadoDesc = rowData.estado?.descripcion || "";
    const esPendiente = estadoDesc === "PENDIENTE";
    const esAprobado = estadoDesc === "APROBADO";
    const esAnulado = estadoDesc === "ANULADO";

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={
            (!permisos.puedeVer && !permisos.puedeEditar) ||
            esAprobado ||
            esAnulado
          }
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
          disabled={!permisos.puedeEliminar || !esPendiente}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
        {permisos.puedeEditar && esPendiente && rowData.estaCuadrado && (
          <Button
            icon="pi pi-check"
            className="p-button-text p-button-success"
            onClick={() => handleAprobar(rowData)}
            tooltip="Aprobar"
          />
        )}
        {permisos.puedeEditar && esAprobado && (
          <Button
            icon="pi pi-ban"
            className="p-button-text p-button-danger"
            onClick={() => handleAnular(rowData)}
            tooltip="Anular"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            {confirmState.action === "aprobar" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>aprobar</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
              </>
            )}
            {confirmState.action === "anular" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>anular</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
                <br />
                <span style={{ fontWeight: 400, color: "#b71c1c" }}>
                  Esta acción no se puede deshacer.
                </span>
              </>
            )}
            {!confirmState.action && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>eliminar</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
                <br />
                <span style={{ fontWeight: 400, color: "#b71c1c" }}>
                  Esta acción no se puede deshacer.
                </span>
              </>
            )}
          </span>
        }
        header={
          <span style={{ color: "#b71c1c" }}>
            {confirmState.action === "aprobar" && "Confirmar Aprobación"}
            {confirmState.action === "anular" && "Confirmar Anulación"}
            {!confirmState.action && "Confirmar eliminación"}
          </span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel={
          confirmState.action === "aprobar"
            ? "Aprobar"
            : confirmState.action === "anular"
            ? "Anular"
            : "Eliminar"
        }
        rejectLabel="Cancelar"
        accept={
          confirmState.action ? handleConfirmAction : handleConfirmDelete
        }
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asientos"
        sortField="numeroAsiento"
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
        globalFilterFields={["numeroAsiento", "glosa"]}
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
                <h2>Asientos Contables</h2>
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
                  disabled={
                    !permisos.puedeCrear || !empresaFilter || !periodoFilter
                  }
                  tooltip="Nuevo Asiento Contable"
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
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaFilter">Filtrar por Empresa</label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaFilter}
                  options={empresas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEmpresaFilter(e.value)}
                  placeholder="Seleccionar empresa"
                  showClear
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="periodoFilter">Filtrar por Período</label>
                <Dropdown
                  id="periodoFilter"
                  value={periodoFilter}
                  options={periodos.map((p) => ({
                    label: p.nombrePeriodo,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPeriodoFilter(e.value)}
                  placeholder="Seleccionar período"
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoFilter">Filtrar por Estado</label>
                <Dropdown
                  id="estadoFilter"
                  value={estadoFilter}
                  options={estados.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoFilter(e.value)}
                  placeholder="Seleccionar estado"
                  showClear
                  style={{ width: "100%" }}
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
                <label htmlFor="fechaInicio">Fecha Inicio</label>
                <Calendar
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFin">Fecha Fin</label>
                <Calendar
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
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
        <Column field="numeroAsiento" header="Número" sortable />
        <Column
          field="fechaAsiento"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
        />
        <Column field="glosa" header="Glosa" sortable />
        <Column
          field="totalDebe"
          header="Total Debe"
          body={(rowData) => montoBodyTemplate(rowData, "totalDebe")}
          sortable
        />
        <Column
          field="totalHaber"
          header="Total Haber"
          body={(rowData) => montoBodyTemplate(rowData, "totalHaber")}
          sortable
        />
        <Column
          field="estaCuadrado"
          header="Cuadre"
          body={cuadradoBodyTemplate}
          sortable
        />
        <Column
          field="estado.descripcion"
          header="Estado"
          body={estadoBodyTemplate}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Asiento Contable"
              : "Ver Asiento Contable"
            : "Nuevo Asiento Contable"
        }
        visible={showDialog}
        style={{ width: "95vw" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <AsientoContableForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          empresaFija={empresaFilter}
          periodoFijo={periodoFilter}
          empresas={empresas}
          periodos={periodos}
          estados={estados}
          monedas={monedas}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}