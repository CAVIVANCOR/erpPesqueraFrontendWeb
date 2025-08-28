// src/pages/ModulosSistema.jsx
// Página principal de gestión de módulos del sistema.
import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { InputText } from "primereact/inputtext";
import {
  getModulos,
  crearModulo,
  actualizarModulo,
  eliminarModulo,
} from "../api/moduloSistema";
import ModuloSistemaForm from "../components/modulos/ModuloSistemaForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function ModulosSistemaPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [modulos, setModulos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de módulos
  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    setLoading(true);
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los módulos",
      });
    } finally {
      setLoading(false);
    }
  };

  // Acciones CRUD
  const handleEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEdit(e.data);
  };

  const handleDelete = (row) => {
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    try {
      await eliminarModulo(row.id);
      toast?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Módulo eliminado correctamente",
      });
      cargarModulos();
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error || "No se pudo eliminar el módulo",
      });
    }
  };

  const handleSubmit = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo,
      };
      if (isEdit && selected) {
        await actualizarModulo(selected.id, payload);
        toast?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Módulo actualizado correctamente",
        });
      } else {
        await crearModulo(payload);
        toast?.show({
          severity: "success",
          summary: "Creado",
          detail: "Módulo creado correctamente",
        });
      }
      setShowForm(false);
      setSelected(null);
      cargarModulos();
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error || "No se pudo guardar el módulo",
      });
    }
  };

  const actionBodyTemplate = (row) => (
    <span>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        tooltip="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
          tooltip="Eliminar"
        />
      )}
    </span>
  );

  return (
    <div className="p-m-4">
      <Toast ref={setToast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el módulo{" "}
            <b>{confirmState.row ? confirmState.row.nombre : ""}</b>?<br />
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
        value={modulos}
        loading={loading}
        paginator
        rows={10}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={onRowClick}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Módulos del Sistema</h2>
            <Button
              label="Nuevo Módulo"
              size="small"
              raised
              outlined
              tooltip="Nuevo Módulo del Sistema"
              className="p-button-success"
              icon="pi pi-plus"
              onClick={() => {
                setIsEdit(false);
                setSelected(null);
                setShowForm(true);
              }}
            />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar módulos..."
              style={{ width: "300px" }}
            />
          </div>
        }
        style={{ cursor: 'pointer', fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="activo"
          header="Activo"
          body={(row) => (row.activo ? "Sí" : "No")}
          sortable
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ minWidth: "120px" }}
        />
      </DataTable>
      <Dialog
        header={isEdit ? "Editar Módulo" : "Nuevo Módulo"}
        visible={showForm}
        style={{ width: "400px" }}
        modal
        onHide={() => setShowForm(false)}
      >
        <ModuloSistemaForm
          initialValues={isEdit && selected ? selected : {}}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
