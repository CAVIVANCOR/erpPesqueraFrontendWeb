// src/pages/AccionesPreviasFaena.jsx
// Pantalla CRUD profesional para AccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import AccionesPreviasFaenaForm from "../components/accionesPreviasFaena/AccionesPreviasFaenaForm";
import {
  getAllAccionesPreviasFaena,
  crearAccionesPreviasFaena,
  actualizarAccionesPreviasFaena,
  eliminarAccionesPreviasFaena,
} from "../api/accionesPreviasFaena";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Acciones Previas de Faena.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function AccionesPreviasFaena() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroTipoPesca, setFiltroTipoPesca] = useState("todos");
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarItems();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [items, filtroTipoPesca]);

  const aplicarFiltros = () => {
    let itemsFiltrados = [...items];

    if (filtroTipoPesca === "todos") {
      // Mostrar todos los registros sin filtrar
      setFilteredItems(itemsFiltrados);
    } else if (filtroTipoPesca === "industrial") {
      // Filtrar solo registros con paraPescaIndustrial = true
      itemsFiltrados = itemsFiltrados.filter(item => item.paraPescaIndustrial === true);
      setFilteredItems(itemsFiltrados);
    } else if (filtroTipoPesca === "consumo") {
      // Filtrar solo registros con paraPescaConsumo = true
      itemsFiltrados = itemsFiltrados.filter(item => item.paraPescaConsumo === true);
      setFilteredItems(itemsFiltrados);
    }
  };

  const cambiarFiltroTipoPesca = () => {
    const siguienteEstado = {
      "todos": "industrial",
      "industrial": "consumo", 
      "consumo": "todos"
    };
    setFiltroTipoPesca(siguienteEstado[filtroTipoPesca]);
  };

  const obtenerConfigFiltro = () => {
    const config = {
      "todos": { 
        label: "Todos", 
        icon: "pi pi-check-circle", 
        severity: "info" 
      },
      "industrial": { 
        label: "Industrial", 
        icon: "pi pi-cog", 
        severity: "warning" 
      },
      "consumo": { 
        label: "Consumo", 
        icon: "pi pi-users", 
        severity: "success" 
      }
    };
    return config[filtroTipoPesca] || config["todos"];
  };

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllAccionesPreviasFaena();
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
      await eliminarAccionesPreviasFaena(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Acción eliminada correctamente.",
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
        await actualizarAccionesPreviasFaena(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Acción actualizada.",
        });
      } else {
        await crearAccionesPreviasFaena(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Acción creada.",
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

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const paraPescaIndustrialTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraPescaIndustrial ? "Sí" : "No"}
        severity={rowData.paraPescaIndustrial ? "warning" : "info"}
      />
    );
  };

  const paraPescaConsumoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraPescaConsumo ? "Sí" : "No"}
        severity={rowData.paraPescaConsumo ? "warning" : "info"}
      />
    );
  };

  const activoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Sí" : "No"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
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
        message="¿Está seguro que desea eliminar esta acción previa?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />

      <DataTable
        value={filteredItems}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Acciones Previas de Faena</h2>
            </div>
            <div style={{ flex: 1 }}>
            <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label={obtenerConfigFiltro().label}
                icon={obtenerConfigFiltro().icon}
                severity={obtenerConfigFiltro().severity}
                size="small"
                outlined
                onClick={cambiarFiltroTipoPesca}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="paraPescaIndustrial"
          header="Pesca Industrial"
          body={paraPescaIndustrialTemplate}
          style={{ width: 120, textAlign: "center" }}
          sortable
        />
        <Column
          field="paraPescaConsumo"
          header="Pesca Consumo"
          body={paraPescaConsumoTemplate}
          style={{ width: 120, textAlign: "center" }}
          sortable
        />
        <Column field="activo" header="Activo" body={activoTemplate} sortable />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Acción Previa" : "Nueva Acción Previa"}
        visible={showDialog}
        style={{ width: 900 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <AccionesPreviasFaenaForm
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
