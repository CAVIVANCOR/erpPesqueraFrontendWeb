import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import UbicacionFisicaForm from "../components/ubicacionFisica/UbicacionFisicaForm";
import {
  getUbicacionesFisicas,
  crearUbicacionFisica,
  actualizarUbicacionFisica,
  eliminarUbicacionFisica,
} from "../api/ubicacionFisica";
import { getAlmacenes } from "../api/almacen";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";

/**
 * Página CRUD para UbicacionFisica
 * Cumple la regla transversal ERP Megui.
 * Documentado en español.
 */
export default function UbicacionFisica({ ruta }) {
  const { user } = useAuthStore();
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [ubicacionesData, almacenesData] = await Promise.all([
        getUbicacionesFisicas(),
        getAlmacenes(),
      ]);
      setItems(ubicacionesData);
      setAlmacenes(almacenesData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleNew = () => {
    if (!almacenSeleccionado) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un almacén primero.",
      });
      return;
    }
    setEditing(null);
    setShowDialog(true);
  };

  // Filtrar ubicaciones por almacén seleccionado
  const ubicacionesFiltradas = React.useMemo(() => {
    if (!almacenSeleccionado) return items;
    return items.filter(
      (ubicacion) => Number(ubicacion.almacenId) === Number(almacenSeleccionado),
    );
  }, [items, almacenSeleccionado]);

  const limpiarFiltros = () => {
    setAlmacenSeleccionado(null);
  };

  const handleEdit = (rowData) => {
    if (rowData.almacenId) {
      setAlmacenSeleccionado(rowData.almacenId);
    }
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing) {
        await actualizarUbicacionFisica(editing.id, data);
        // Si cambió el almacén, limpiar el filtro para mostrar todos los registros
        if (data.almacenId && Number(data.almacenId) !== Number(editing.almacenId)) {
          setAlmacenSeleccionado(null);
        }
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Ubicación física actualizada correctamente.",
        });
      } else {
        await crearUbicacionFisica(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Ubicación física creada correctamente.",
        });
      }
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "Error al guardar.",
      });
    }
    setLoading(false);
  };

  const handleDelete = (rowData) => {
    const canDelete = user?.rol === "superusuario" || user?.rol === "admin";

    if (!canDelete) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail:
          "No tiene permisos para eliminar registros. Solo superusuarios y administradores pueden realizar esta acción.",
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar la ubicación física "${rowData.descripcion}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarUbicacionFisica(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ubicación física eliminada correctamente.",
          });
          cargarDatos();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "Error al eliminar.",
          });
        }
      },
    });
  };

  const almacenNombre = (rowData) => rowData.almacen?.nombre || "-";

  const actionBody = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(rowData);
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(rowData);
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <DataTable
        value={ubicacionesFiltradas}
        loading={loading}
        dataKey="id"
        paginator
        size="small"
        showGridlines
        stripedRows
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ubicaciones físicas"
        emptyMessage="No hay ubicaciones físicas registradas"
        sortField="id"
        sortOrder={-1}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h1>Ubicaciones Físicas</h1>
              </div>
              <div style={{ flex: 3 }}>
                <label
                  htmlFor="almacenFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Almacén:
                </label>
                <Dropdown
                  id="almacenFilter"
                  value={almacenSeleccionado}
                  options={almacenes}
                  onChange={(e) => setAlmacenSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleNew}
                  disabled={!almacenSeleccionado || !permisos.puedeCrear}
                  style={{ marginTop: "1.8rem" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-outlined p-button-secondary"
                  onClick={limpiarFiltros}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ fontWeight: "bold" }}
        />
        <Column
          field="almacenId"
          header="Almacén"
          body={almacenNombre}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Ubicación Física" : "Nueva Ubicación Física"}
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <UbicacionFisicaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          almacenes={almacenes}
          almacenId={almacenSeleccionado}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}
