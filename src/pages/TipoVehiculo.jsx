// src/pages/TipoVehiculo.jsx
// Pantalla CRUD profesional para TipoVehiculo. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import TipoVehiculoForm from "../components/tipoVehiculo/TipoVehiculoForm";
import {
  getTiposVehiculo,
  crearTipoVehiculo,
  actualizarTipoVehiculo,
  eliminarTipoVehiculo,
} from "../api/tipoVehiculo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";


/**
 * Pantalla profesional para gestión de Tipos de Vehículo.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function TipoVehiculo() {
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
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getTiposVehiculo();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
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
      await eliminarTipoVehiculo(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Tipo de vehículo eliminado correctamente.",
      });
      cargarDatos();
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
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilter(value);
  };
  const handleFormSubmit = async (data) => {
    try {
      if (editing && editing.id) {
        await actualizarTipoVehiculo(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Tipo de vehículo actualizado.",
        });
      } else {
        await crearTipoVehiculo(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Tipo de vehículo creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar.",
      });
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-green-600" : "text-red-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

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
        message="¿Está seguro que desea eliminar este tipo de vehículo?"
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
        globalFilter={globalFilter}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer" }}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Vehículo</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              onClick={handleAdd}
              disabled={loading}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar tipos de documentos..."
              style={{ width: 240 }}
            />
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => booleanTemplate(rowData, "activo")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Tipo de Vehículo" : "Nuevo Tipo de Vehículo"}
        visible={showDialog}
        style={{ width: 600 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <TipoVehiculoForm
          tipoVehiculo={editing}
          onSave={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}
