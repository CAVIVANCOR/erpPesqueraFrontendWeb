// src/pages/contabilidad/PlanCuentasContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import PlanCuentasContableForm from "../../components/contabilidad/PlanCuentasContableForm";
import {
  getPlanCuentasContable,
  deletePlanCuentasContable,
  getPlanCuentasContableById,
} from "../../api/contabilidad/planCuentasContable";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PlanCuentasContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const cuentasData = await getPlanCuentasContable();
      setItems(cuentasData);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
        life: 3000,
      });
    }
    setLoading(false);
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
      const cuentaCompleta = await getPlanCuentasContableById(rowData.id);
      setSelected(cuentaCompleta);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar cuenta:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la cuenta contable",
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
      await deletePlanCuentasContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Cuenta eliminada",
        detail: `La cuenta ${row.codigoCuenta} - ${row.nombreCuenta} fue eliminada correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar la cuenta contable.",
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
        summary: isEdit ? "Cuenta actualizada" : "Cuenta creada",
        detail: isEdit
          ? "La cuenta contable fue actualizada correctamente."
          : "La cuenta contable fue creada correctamente.",
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
        detail: "No se pudo guardar la cuenta contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
  };

  const cuentaPadreNombre = (rowData) => {
    return rowData.cuentaPadre
      ? `${rowData.cuentaPadre.codigoCuenta} - ${rowData.cuentaPadre.nombreCuenta}`
      : "RAÍZ";
  };

  const nivelTemplate = (rowData) => {
    const colores = {
      CLASE: "info",
      CUENTA: "success",
      SUBCUENTA: "warning",
      DIVISIONARIA: "help",
      SUBDIVISIONARIA: "danger",
    };
    return (
      <Tag value={rowData.nivel} severity={colores[rowData.nivel] || "info"} />
    );
  };

  const naturalezaTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.naturaleza}
        severity={rowData.naturaleza === "DEUDORA" ? "info" : "success"}
      />
    );
  };

  const activoTemplate = (rowData) => {
    return rowData.activo ? (
      <Tag value="SÍ" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="NO" severity="danger" icon="pi pi-times" />
    );
  };

  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
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

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la cuenta{" "}
            <b>
              {confirmState.row
                ? `${confirmState.row.codigoCuenta} - ${confirmState.row.nombreCuenta}`
                : ""}
            </b>
            ?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={
          <span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={items}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuentas"
        sortField="codigoCuenta"
        sortOrder={1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={["codigoCuenta", "nombreCuenta", "descripcion"]}
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
                <h2>Plan de Cuentas Contable</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {items.length}
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
                  tooltip="Nueva Cuenta Contable"
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
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar por código o nombre..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable />
        <Column field="codigoCuenta" header="Código" sortable />
        <Column field="nombreCuenta" header="Nombre" sortable />
        <Column
          field="cuentaPadreId"
          header="Cuenta Padre"
          body={cuentaPadreNombre}
          style={{ width: 200 }}
        />
        <Column
          field="nivel"
          header="Nivel"
          body={nivelTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="naturaleza"
          header="Naturaleza"
          body={naturalezaTemplate}
          style={{ width: 130 }}
          sortable
        />
        <Column
          field="esImputable"
          header="Imputable"
          body={(rowData) =>
            rowData.esImputable ? (
              <Tag value="SÍ" severity="success" icon="pi pi-check" />
            ) : (
              <Tag value="NO" severity="secondary" />
            )
          }
          style={{ width: 110 }}
        />
        <Column
          field="activo"
          header="Activo"
          body={activoTemplate}
          style={{ width: 100 }}
        />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Cuenta Contable"
              : "Ver Cuenta Contable"
            : "Nueva Cuenta Contable"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <PlanCuentasContableForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          cuentas={items}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}