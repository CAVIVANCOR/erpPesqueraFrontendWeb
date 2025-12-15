// src/pages/DocumentoPesca.jsx
// Pantalla CRUD profesional para DocumentoPesca. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import DocumentoPescaForm from "../components/documentoPesca/DocumentoPescaForm";
import {
  getDocumentosPesca,
  crearDocumentoPesca,
  actualizarDocumentoPesca,
  eliminarDocumentoPesca,
} from "../api/documentoPesca";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Documentos de Pesca.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DocumentoPesca() {
  const toast = useRef(null);
  const permisos = usePermissions("DocumentoPesca");
  const [items, setItems] = useState([]);
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // ✅ Estado para filtro de tipo

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getDocumentosPesca();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarDocumentoPesca(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarDocumentoPesca(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearDocumentoPesca(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const obligatorioTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.obligatorio ? "Si" : "No"}
        severity={rowData.obligatorio ? "success" : "primary"}
      />
    );
  };
  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "Sí" : "No"}
        severity={rowData.cesado ? "danger" : "secondary"}
      />
    );
  };

  const paraEmbarcacionTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraEmbarcacion ? "Sí" : "No"}
        severity={rowData.paraEmbarcacion ? "warning" : "info"}
      />
    );
  };

  const paraTripulantesTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraTripulantes ? "Sí" : "No"}
        severity={rowData.paraTripulantes ? "warning" : "info"}
      />
    );
  };

  const paraOperacionFaenaTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraOperacionFaena ? "Sí" : "No"}
        severity={rowData.paraOperacionFaena ? "warning" : "info"}
      />
    );
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  // ✅ Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroTipo("todos");
    setGlobalFilter("");
  };

  // ✅ Función para cambiar filtro de tipo
  const cambiarFiltroTipo = () => {
    const tipos = ["todos", "embarcacion", "tripulantes", "operacionFaena"];
    const indiceActual = tipos.indexOf(filtroTipo);
    const siguienteIndice = (indiceActual + 1) % tipos.length;
    setFiltroTipo(tipos[siguienteIndice]);
  };

  // ✅ Función para obtener configuración del filtro de tipo
  const obtenerConfigFiltroTipo = () => {
    switch (filtroTipo) {
      case "embarcacion":
        return {
          label: "EMBARCACIÓN",
          icon: "pi pi-compass",
          className: "p-button-info",
          tooltip: "Mostrando documentos para embarcación",
        };
      case "tripulantes":
        return {
          label: "TRIPULANTES",
          icon: "pi pi-users",
          className: "p-button-warning",
          tooltip: "Mostrando documentos para tripulantes",
        };
      case "operacionFaena":
        return {
          label: "OPERACIÓN FAENA",
          icon: "pi pi-briefcase",
          className: "p-button-success",
          tooltip: "Mostrando documentos para operación faena",
        };
      default:
        return {
          label: "TODOS",
          icon: "pi pi-list",
          className: "p-button-secondary",
          tooltip: "Mostrando todos los documentos",
        };
    }
  };

  // ✅ Filtrar datos según el tipo seleccionado
  const itemsFiltrados = items.filter((item) => {
    switch (filtroTipo) {
      case "embarcacion":
        return item.paraEmbarcacion === true;
      case "tripulantes":
        return item.paraTripulantes === true;
      case "operacionFaena":
        return item.paraOperacionFaena === true;
      default:
        return true; // "todos"
    }
  });

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este registro?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        header={
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>DOCUMENTOS DE PESCA</h2>
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={handleAdd}
                  disabled={loading || !permisos.puedeCrear}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  {...obtenerConfigFiltroTipo()}
                  onClick={cambiarFiltroTipo}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  type="button"
                  icon="pi pi-filter-slash"
                  label="Limpiar Filtros"
                  outlined
                  onClick={limpiarFiltros}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        }
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "descripcion"]}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="obligatorio"
          header="Obligatorio"
          body={obligatorioTemplate}
          sortable
        />
        <Column
          field="paraEmbarcacion"
          header="Para Embarcación"
          body={paraEmbarcacionTemplate}
          sortable
        />
        <Column
          field="paraTripulantes"
          header="Para Tripulantes"
          body={paraTripulantesTemplate}
          sortable
        />
        <Column
          field="paraOperacionFaena"
          header="Para Operación Faena"
          body={paraOperacionFaenaTemplate}
          sortable
        />
        <Column field="cesado" header="Cesado" body={cesadoTemplate} sortable />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing ? "Editar Documento de Pesca" : "Nuevo Documento de Pesca"
        }
        visible={showDialog}
        style={{ width: 1300 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <DocumentoPescaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}