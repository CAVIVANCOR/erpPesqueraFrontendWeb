// src/pages/CentroCosto.jsx
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
import CentroCostoForm from "../components/centroCosto/CentroCostoForm";
import { getCentrosCosto, eliminarCentroCosto } from "../api/centroCosto";
import { getAllCategoriaCCosto } from "../api/categoriaCCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

export default function CentroCosto({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [centroPadreFilter, setCentroPadreFilter] = useState(null);
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
  }, [items, categoriaFilter, centroPadreFilter]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [centrosData, categoriasData] = await Promise.all([
        getCentrosCosto(),
        getAllCategoriaCCosto(),
      ]);
      setItems(centrosData);
      setCategorias(categoriasData);
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

    if (categoriaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.CategoriaID) === Number(categoriaFilter),
      );
    }

    if (centroPadreFilter) {
      filtrados = filtrados.filter(
        (item) => item.ParentCentroID === centroPadreFilter,
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
      await eliminarCentroCosto(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Centro eliminado",
        detail: `El centro de costo ${row.Nombre} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar el centro de costo.",
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
        summary: isEdit ? "Centro actualizado" : "Centro creado",
        detail: isEdit
          ? "El centro de costo fue actualizado correctamente."
          : "El centro de costo fue creado correctamente.",
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
        detail: "No se pudo guardar el centro de costo.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setCategoriaFilter(null);
    setCentroPadreFilter(null);
    setGlobalFilter("");
  };

  const categoriaNombreBodyTemplate = (rowData) => {
    const categoria = categorias.find(
      (c) => Number(c.id) === Number(rowData.CategoriaID),
    );
    return categoria ? categoria.nombre : "-";
  };

  const actionBodyTemplate = (rowData) => {
    return (
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
  };

  // Opciones para filtros
  const categoriaOptions = categorias.map((cat) => ({
    label: cat.nombre,
    value: Number(cat.id),
  }));

  const centroPadreOptions = Array.from(
    new Set(items.map((item) => item.ParentCentroID).filter(Boolean)),
  ).map((centro) => ({
    label: centro,
    value: centro,
  }));

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el centro de
            costo <b>{confirmState.row?.Nombre}</b>?
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} centros de costo"
        sortField="Codigo"
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
        globalFilterFields={[
          "Codigo",
          "Nombre",
          "Descripcion",
          "ParentCentroID",
        ]}
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
                <h2>Centros de Costo</h2>
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
                  tooltip="Nuevo Centro de Costo"
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
                <label htmlFor="categoriaFilter">Filtrar por Categoría</label>
                <Dropdown
                  id="categoriaFilter"
                  value={categoriaFilter}
                  options={categoriaOptions}
                  onChange={(e) => setCategoriaFilter(e.value)}
                  placeholder="Seleccionar categoría"
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="centroPadreFilter">
                  Filtrar por Centro Padre
                </label>
                <Dropdown
                  id="centroPadreFilter"
                  value={centroPadreFilter}
                  options={centroPadreOptions}
                  onChange={(e) => setCentroPadreFilter(e.value)}
                  placeholder="Seleccionar centro padre"
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
          field="CategoriaID"
          header="Categoría"
          body={categoriaNombreBodyTemplate}
          sortable
        />
        <Column field="Codigo" header="Código" sortable />
        <Column field="Nombre" header="Nombre" sortable />
        <Column field="Descripcion" header="Descripción" sortable />
        <Column field="ParentCentroID" header="Centro Padre" sortable />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Centro de Costo"
              : "Ver Centro de Costo"
            : "Nuevo Centro de Costo"
        }
        visible={showDialog}
        style={{ width: "700px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <CentroCostoForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          categorias={categorias}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
