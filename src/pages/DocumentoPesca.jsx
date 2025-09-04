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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [globalFilter, setGlobalFilter] = useState("");

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
        value={items}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Documentos de Pesca</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={handleAdd}
              disabled={loading}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar ..."
                style={{ width: "300px" }}
              />
            </span>
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
        />
      </Dialog>
    </div>
  );
}
