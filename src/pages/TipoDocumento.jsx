// src/pages/TipoDocumento.jsx
// Página principal de gestión de tipos de documento en el ERP Megui.
// Reutiliza patrones de Usuarios.jsx y documenta en español técnico.

import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoDocumentoForm from "../components/tipoDocumento/TipoDocumentoForm";
import {
  getTiposDocumento,
  crearTipoDocumento,
  actualizarTipoDocumento,
  eliminarTipoDocumento,
} from "../api/tipoDocumento";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de tipos de documento.
 * Incluye DataTable, alta, edición y eliminación, con feedback visual profesional.
 */
/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function TipoDocumentoPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [tipos, setTipos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  // Carga inicial de tipos de documento
  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const data = await getTiposDocumento();
      setTipos(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de documento",
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de botones de acción
  const actionBodyTemplate = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(rowData);
        }}
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(rowData);
          }}
        />
      )}
    </>
  );

  // Lógica para alta y edición
  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };
  const onEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    onEdit(e.data);
  };
  const handleDelete = (row) => {
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarTipoDocumento(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Tipo de documento eliminado",
      });
      cargarTipos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar",
      });
    } finally {
      setLoading(false);
    }
  };
  const onCancel = () => setShowForm(false);
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        id: typeof data.id === "string" ? Number(data.id) : data.id,
        codigo: data.codigo,
        codigoSunat: data.codigoSunat,
        descripcion: data.descripcion,
        activo: data.activo,
      };
      if (isEdit && selected) {
        await actualizarTipoDocumento(selected.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Tipo de documento actualizado",
        });
      } else {
        await crearTipoDocumento(payload);
        toast.current?.show({
          severity: "success",
          summary: "Registrado",
          detail: "Tipo de documento creado",
        });
      }
      setShowForm(false);
      cargarTipos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el tipo de
            documento{" "}
            <b>{confirmState.row ? confirmState.row.descripcion : ""}</b>?<br />
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
        value={tipos}
        loading={loading}
        paginator
        rows={10}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={onRowClick}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        className="p-datatable-sm"
        header={
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h1>Tipos de Documento</h1>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={onNew}
                disabled={loading}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable />
        <Column field="codigo" header="Código" sortable />
        <Column field="codigoSunat" header="Código Sunat" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="activo"
          header="Activo"
          body={(row) => (row.activo ? "Sí" : "No")}
        />
        <Column field="createdAt" header="Creado" sortable />
        <Column field="updatedAt" header="Actualizado" sortable />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={isEdit ? "Editar Tipo de Documento" : "Nuevo Tipo de Documento"}
        visible={showForm}
        style={{ width: "35vw", minWidth: 340 }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <TipoDocumentoForm
          isEdit={isEdit}
          defaultValues={selected || { activo: true }}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
