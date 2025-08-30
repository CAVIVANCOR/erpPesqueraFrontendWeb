// src/pages/Especie.jsx
// Gestión profesional de Especies. CRUD completo con patrón ERP Megui.
import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EspecieForm from "../components/especie/EspecieForm";
import {
  getEspecies,
  crearEspecie,
  actualizarEspecie,
  eliminarEspecie,
} from "../api/especie";
import { getResponsiveFontSize } from "../utils/utils";


/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function EspeciePage() {
  const usuario = useAuthStore((state) => state.usuario);
  const [especies, setEspecies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  useEffect(() => {
    cargarEspecies();
  }, []);
  const cargarEspecies = async () => {
    setLoading(true);
    try {
      const data = await getEspecies();
      setEspecies(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las especies",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };
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
    setLoading(true);
    try {
      await eliminarEspecie(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Especie eliminada correctamente",
      });
      cargarEspecies();
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

  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };
  const onCancel = () => setShowForm(false);
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        nombreCientifico: data.nombreCientifico,
      };
      if (isEdit && selected) {
        await actualizarEspecie(selected.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Especie actualizada",
        });
      } else {
        await crearEspecie(payload);
        toast.current?.show({
          severity: "success",
          summary: "Registrada",
          detail: "Especie creada",
        });
      }
      setShowForm(false);
      cargarEspecies();
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la especie{" "}
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
        value={especies}
        loading={loading}
        paginator
        rows={10}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={onRowClick}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Especies</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nueva Especie"
                icon="pi pi-plus"
                className="p-button-success"
                onClick={onNew}
                type="button"
                tooltip="Agregar nueva especie"
                tooltipOptions={{ position: "top" }}
                raised
                outlined
                severity="success"
                size="small"
              />
            </div>
            <div style={{ flex: 1 }}>
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  onInput={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar..."
                />
              </span>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="nombreCientifico" header="Nombre Científico" />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ minWidth: 120 }}
        />
      </DataTable>
      <Dialog
        header={isEdit ? "Editar Especie" : "Nueva Especie"}
        visible={showForm}
        style={{ width: 400 }}
        modal
        onHide={onCancel}
      >
        <EspecieForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
