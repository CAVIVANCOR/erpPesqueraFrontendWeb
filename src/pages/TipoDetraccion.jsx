// src/pages/TipoDetraccion.jsx
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import {
  getAllTiposDetraccion,
  crearTipoDetraccion,
  actualizarTipoDetraccion,
  eliminarTipoDetraccion,
} from "../api/tipoDetraccion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";

export default function TipoDetraccion({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    tasa: 0,
    montoMinimo: null,
    activo: true,
  });

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllTiposDetraccion();
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
    setFormData({
      codigo: rowData.codigo || "",
      nombre: rowData.nombre || "",
      tasa: rowData.tasa || 0,
      montoMinimo: rowData.montoMinimo || null,
      activo: rowData.activo !== undefined ? rowData.activo : true,
    });
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
      await eliminarTipoDetraccion(toDelete.id);
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
        detail: err.response?.data?.message || "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarTipoDetraccion(editing.id, formData);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearTipoDetraccion(formData);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      resetForm();
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      tasa: 0,
      montoMinimo: null,
      activo: true,
    });
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
    <div className="p-fluid">
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
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
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
              <h2>Tipos de Detracción</h2>
            </div>
            <div style={{ flex: 2 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading || !permisos.puedeCrear}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column field="codigo" header="Código" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column
          field="tasa"
          header="Tasa (%)"
          body={(rowData) => `${Number(rowData.tasa).toFixed(2)}%`}
          sortable
        />
        <Column
          field="montoMinimo"
          header="Monto Mínimo"
          body={(rowData) =>
            rowData.montoMinimo
              ? `S/ ${Number(rowData.montoMinimo).toFixed(2)}`
              : "-"
          }
          sortable
        />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => (rowData.activo ? "Sí" : "No")}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Tipo de Detracción" : "Nuevo Tipo de Detracción"}
        visible={showDialog}
        style={{ width: 500 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <form onSubmit={handleFormSubmit} className="p-fluid">
          <div className="p-field">
            <label htmlFor="codigo">Código*</label>
            <InputText
              id="codigo"
              value={formData.codigo}
              onChange={(e) =>
                setFormData({ ...formData, codigo: e.target.value })
              }
              required
              disabled={loading || readOnly}
              maxLength={10}
            />
          </div>
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
              disabled={loading || readOnly}
              maxLength={200}
            />
          </div>
          <div className="p-field">
            <label htmlFor="tasa">Tasa (%)*</label>
            <InputNumber
              id="tasa"
              value={formData.tasa}
              onValueChange={(e) =>
                setFormData({ ...formData, tasa: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={100}
              disabled={loading || readOnly}
            />
          </div>
          <div className="p-field">
            <label htmlFor="montoMinimo">Monto Mínimo (S/)</label>
            <InputNumber
              id="montoMinimo"
              value={formData.montoMinimo}
              onValueChange={(e) =>
                setFormData({ ...formData, montoMinimo: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={loading || readOnly}
            />
          </div>
          <div className="p-field-checkbox">
            <Checkbox
              inputId="activo"
              checked={formData.activo}
              onChange={(e) =>
                setFormData({ ...formData, activo: e.checked })
              }
              disabled={loading || readOnly}
            />
            <label htmlFor="activo">Activo</label>
          </div>
          <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
            <Button
              type="button"
              label="Cancelar"
              className="p-button-text"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            />
            <Button
              type="submit"
              label={editing ? "Actualizar" : "Crear"}
              icon="pi pi-save"
              loading={loading}
              disabled={readOnly}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}