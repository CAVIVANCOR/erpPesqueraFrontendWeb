// src/pages/contabilidad/PeriodoContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import PeriodoContableForm from "../../components/contabilidad/PeriodoContableForm";
import {
  getPeriodosContables,
  getPeriodoContableById,
  deletePeriodoContable,
  cerrarPeriodo,
  reabrirPeriodo,
  bloquearPeriodo,
} from "../../api/contabilidad/periodoContable";
import { getEmpresas } from "../../api/empresa";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PeriodoContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
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
  }, [items, empresaFilter, estadoFilter]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [periodosData, empresasData, estadosData] = await Promise.all([
        getPeriodosContables(),
        getEmpresas(),
        getEstadosMultiFuncionPorTipoProviene(19), // PERIODO_CONTABLE
      ]);

      setItems(periodosData);
      setEmpresas(empresasData);
      setEstados(estadosData);
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

    if (estadoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoFilter)
      );
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
      const periodoCompleto = await getPeriodoContableById(rowData.id);
      setSelected(periodoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar período:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el período contable",
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
      await deletePeriodoContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Período eliminado",
        detail: `El período ${row.nombrePeriodo} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message || "No se pudo eliminar el período contable.",
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
        summary: isEdit ? "Período actualizado" : "Período creado",
        detail: isEdit
          ? "El período contable fue actualizado correctamente."
          : "El período contable fue creado correctamente.",
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
        detail: "No se pudo guardar el período contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarPeriodo = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para cerrar períodos.",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "cerrar",
    });
  };

  const handleReabrirPeriodo = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para reabrir períodos.",
        life: 3000,
      });
      return;
    }

    const motivo = prompt("Ingrese el motivo de la reapertura:");
    if (!motivo?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe proporcionar un motivo para la reapertura",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await reabrirPeriodo(item.id, {
        reabiertoPor: usuario.personalId,
        motivoReapertura: motivo,
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Período reabierto correctamente",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al reabrir período",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBloquearPeriodo = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para bloquear períodos.",
        life: 3000,
      });
      return;
    }

    const motivo = prompt("Ingrese el motivo del bloqueo:");
    if (!motivo?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe proporcionar un motivo para el bloqueo",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "bloquear",
      motivo: motivo,
    });
  };

  const handleConfirmAction = async () => {
    const { row, action, motivo } = confirmState;
    if (!row) return;

    setConfirmState({ visible: false, row: null });
    setLoading(true);

    try {
      if (action === "cerrar") {
        await cerrarPeriodo(row.id, {
          cerradoPor: usuario.personalId,
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Período cerrado correctamente",
          life: 3000,
        });
      } else if (action === "bloquear") {
        await bloquearPeriodo(row.id, {
          bloqueadoPor: usuario.personalId,
          motivoBloqueo: motivo,
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Período bloqueado correctamente",
          life: 3000,
        });
      }
      await cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || `Error al ${action} período`,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setEstadoFilter(null);
    setGlobalFilter("");
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado?.descripcion || "";
    let severity = "info";
    if (estado === "ABIERTO") severity = "success";
    if (estado === "CERRADO") severity = "warning";
    if (estado === "BLOQUEADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData, field) => {
    const fecha = rowData[field];
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  const actionBodyTemplate = (rowData) => {
    const estadoDesc = rowData.estado?.descripcion || "";
    const esAbierto = estadoDesc === "ABIERTO";
    const esCerrado = estadoDesc === "CERRADO";
    const esBloqueado = estadoDesc === "BLOQUEADO";

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={(!permisos.puedeVer && !permisos.puedeEditar) || esBloqueado}
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
          disabled={!permisos.puedeEliminar || !esAbierto}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
        {permisos.puedeEditar && esAbierto && (
          <Button
            icon="pi pi-lock"
            className="p-button-text p-button-secondary"
            onClick={() => handleCerrarPeriodo(rowData)}
            tooltip="Cerrar Período"
          />
        )}
        {permisos.puedeEditar && esCerrado && (
          <>
            <Button
              icon="pi pi-lock-open"
              className="p-button-text p-button-help"
              onClick={() => handleReabrirPeriodo(rowData)}
              tooltip="Reabrir Período"
            />
            <Button
              icon="pi pi-ban"
              className="p-button-text p-button-danger"
              onClick={() => handleBloquearPeriodo(rowData)}
              tooltip="Bloquear Período"
            />
          </>
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
            {confirmState.action === "cerrar" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>cerrar</span> el período{" "}
                <b>{confirmState.row?.nombrePeriodo}</b>?
              </>
            )}
            {confirmState.action === "bloquear" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>bloquear</span> el período{" "}
                <b>{confirmState.row?.nombrePeriodo}</b>?
                <br />
                <span style={{ fontWeight: 400, color: "#b71c1c" }}>
                  Esta acción es irreversible.
                </span>
              </>
            )}
            {!confirmState.action && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>eliminar</span> el período{" "}
                <b>{confirmState.row?.nombrePeriodo}</b>?
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
            {confirmState.action === "cerrar" && "Confirmar Cierre"}
            {confirmState.action === "bloquear" && "Confirmar Bloqueo"}
            {!confirmState.action && "Confirmar eliminación"}
          </span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel={
          confirmState.action === "cerrar"
            ? "Cerrar"
            : confirmState.action === "bloquear"
            ? "Bloquear"
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} períodos"
        sortField="nombrePeriodo"
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
        globalFilterFields={["nombrePeriodo", "anio", "mes"]}
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
                <h2>Períodos Contables</h2>
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
                  disabled={!permisos.puedeCrear || !empresaFilter}
                  tooltip="Nuevo Período Contable"
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
        <Column field="nombrePeriodo" header="Período" sortable />
        <Column field="anio" header="Año" sortable />
        <Column field="mes" header="Mes" sortable />
        <Column
          field="fechaInicio"
          header="Fecha Inicio"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaInicio")}
          sortable
        />
        <Column
          field="fechaFin"
          header="Fecha Fin"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaFin")}
          sortable
        />
        <Column
          field="estado"
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
              ? "Editar Período Contable"
              : "Ver Período Contable"
            : "Nuevo Período Contable"
        }
        visible={showDialog}
        style={{ width: "1000px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <PeriodoContableForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          empresas={empresas}
          estados={estados}
          empresaFija={empresaFilter}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}