// src/pages/CategoriaCCosto.jsx
// Pantalla CRUD profesional para CategoriaCCosto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { usePermissions } from "../hooks/usePermissions";
import CategoriaCCostoForm from "../components/categoriaCCosto/CategoriaCCostoForm";
import {
  getAllCategoriaCCosto,
  crearCategoriaCCosto,
  actualizarCategoriaCCosto,
  eliminarCategoriaCCosto,
} from "../api/categoriaCCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Categorías de Centro de Costo.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Filtrado global en DataTable.
 * - Documentación de la regla en el encabezado.
 */
export default function CategoriaCCosto() {
  const toast = useRef(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const { usuario } = useAuthStore();
  const permisos = usePermissions("CategoriaCCosto");
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Configuración de filtros para DataTable
  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const data = await getAllCategoriaCCosto();
      setCategorias(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las categorías de centro de costo",
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirNuevo = () => {
    setCategoriaSeleccionada(null);
    setDialogVisible(true);
  };

  const editarCategoria = (categoria) => {
    setCategoriaSeleccionada({ ...categoria });
    setDialogVisible(true);
  };

  const confirmarEliminacion = (categoria) => {
    confirmDialog({
      message: `¿Está seguro que desea eliminar la categoría "${categoria.nombre}"?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => eliminarCategoria(categoria),
      reject: () => {},
    });
  };

  const eliminarCategoria = async (categoria) => {
    setLoading(true);
    try {
      await eliminarCategoriaCCosto(categoria.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: `Categoría "${categoria.nombre}" eliminada correctamente`,
      });
      cargarCategorias();
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la categoría",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarCategoria = async (categoriaData) => {
    setLoading(true);
    try {
      if (categoriaSeleccionada?.id) {
        await actualizarCategoriaCCosto(
          categoriaSeleccionada.id,
          categoriaData
        );
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Categoría actualizada correctamente",
        });
      } else {
        await crearCategoriaCCosto(categoriaData);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Categoría creada correctamente",
        });
      }
      setDialogVisible(false);
      setCategoriaSeleccionada(null);
      cargarCategorias();
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la categoría",
      });
    } finally {
      setLoading(false);
    }
  };

  const cerrarDialog = () => {
    setDialogVisible(false);
    setCategoriaSeleccionada(null);
  };

  // Renderizado de la columna de estado activo
  const activoBodyTemplate = (rowData) => {
    return (
      <span
        className={`badge ${rowData.activo ? "badge-success" : "badge-danger"}`}
      >
        {rowData.activo ? "Activo" : "Inactivo"}
      </span>
    );
  };

  // Renderizado de la columna de acciones
  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={() => editarCategoria(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="card">
        <DataTable
          value={categorias}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Categorías de Centro de Costo</h2>
              <Button
                label="Nueva Categoría"
                icon="pi pi-plus"
                size="small"
                className="p-button-success"
                tooltip="Agregar nueva categoría"
                tooltipOptions={{ position: "top" }}
                outlined
                raised
                onClick={abrirNuevo}
                disabled={loading}
              />
              <span className="p-input-icon-left">
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar categorías..."
                />
              </span>
            </div>
          }
          filters={filters}
          globalFilterFields={["nombre", "descripcion"]}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron categorías"
          onRowClick={(e) => editarCategoria(e.data)}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} categorías"
          scrollable
          scrollHeight="600px"
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        >
          <Column field="id" header="ID" sortable style={{ width: "80px" }} />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ minWidth: "250px" }}
          />
          <Column
            field="activo"
            header="Estado"
            body={activoBodyTemplate}
            sortable
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column
            body={actionBodyTemplate}
            header="Acciones"
            style={{ width: "120px", textAlign: "center" }}
            exportable={false}
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header={
          categoriaSeleccionada?.id ? "Editar Categoría" : "Nueva Categoría"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialog}
      >
        <CategoriaCCostoForm
          isEdit={!!categoriaSeleccionada?.id}
          defaultValues={categoriaSeleccionada || {}}
          onSubmit={guardarCategoria}
          onCancel={cerrarDialog}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}
