// src/pages/CentroCosto.jsx
// Pantalla CRUD profesional para CentroCosto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown"; // Import Dropdown component
import CentroCostoForm from "../components/centroCosto/CentroCostoForm";
import {
  getCentrosCosto,
  crearCentroCosto,
  actualizarCentroCosto,
  eliminarCentroCosto,
} from "../api/centroCosto";
import { getAllCategoriaCCosto } from "../api/categoriaCCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Centros de Costo.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function CentroCosto() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [centroPadreFilter, setCentroPadreFilter] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [centrosData, categoriasData] = await Promise.all([
        getCentrosCosto(),
        getAllCategoriaCCosto(),
      ]);
      setItems(centrosData);
      setCategorias(categoriasData);
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
      await eliminarCentroCosto(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Centro de costo eliminado correctamente.",
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

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarCentroCosto(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Centro de costo actualizado.",
        });
      } else {
        await crearCentroCosto(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Centro de costo creado.",
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
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const categoriaNombre = (rowData) => {
    const categoria = categorias.find(
      (c) => Number(c.id) === Number(rowData.CategoriaID)
    );
    return categoria ? categoria.nombre : "";
  };

  // Filtrar datos según los filtros seleccionados
  const filteredItems = items.filter(item => {
    const categoriaMatch = !categoriaFilter || Number(item.CategoriaID) === Number(categoriaFilter);
    const centroPadreMatch = !centroPadreFilter || item.ParentCentroID === centroPadreFilter;
    return categoriaMatch && centroPadreMatch;
  });

  // Opciones para filtros
  const categoriaOptions = [
    { label: "Todas las categorías", value: null },
    ...categorias.map(cat => ({
      label: cat.nombre,
      value: Number(cat.id)
    }))
  ];

  const centroPadreOptions = [
    { label: "Todos los centros padre", value: null },
    ...Array.from(new Set(items.map(item => item.ParentCentroID).filter(Boolean)))
      .map(centro => ({
        label: centro,
        value: centro
      }))
  ];

  const limpiarFiltros = () => {
    setCategoriaFilter(null);
    setCentroPadreFilter(null);
    setGlobalFilter("");
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
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este centro de costo?"
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
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Centros de Costo</h2>
            <span className="text-sm text-gray-600">
              ({filteredItems.length} de {items.length} registros)
            </span>
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
            <div className="flex gap-2">
              <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar Centros de Costo..."
                style={{ width: 240 }}
              />
              <Dropdown
                value={categoriaFilter}
                options={categoriaOptions}
                onChange={(e) => setCategoriaFilter(e.value)}
                placeholder="Filtrar por categoría"
                showClear
                style={{ width: 200 }}
              />
              <Dropdown
                value={centroPadreFilter}
                options={centroPadreOptions}
                onChange={(e) => setCentroPadreFilter(e.value)}
                placeholder="Filtrar por centro padre"
                showClear
                style={{ width: 200 }}
              />
              <Button
                icon="pi pi-filter-slash"
                className="p-button-text p-button-sm"
                onClick={limpiarFiltros}
                aria-label="Limpiar filtros"
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="CategoriaID" header="Categoría" body={categoriaNombre} sortable />
        <Column field="ParentCentroID" header="Centro Padre" sortable />
        <Column field="Codigo" header="Código" sortable />
        <Column field="Nombre" header="Nombre" sortable />
        <Column field="Descripcion" header="Descripción" sortable />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <CentroCostoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          categorias={categorias}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
