// src/pages/TipoAfectacionIGVList.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import TipoAfectacionIGVForm from "../components/tipoAfectacionIGV/TipoAfectacionIGVForm";
import {
  getTiposAfectacionIGV,
  getTipoAfectacionIGVById,
  createTipoAfectacionIGV,
  updateTipoAfectacionIGV,
  deleteTipoAfectacionIGV,
} from "../api/facturacionElectronica/tipoAfectacionIGV";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { Dropdown } from "primereact/dropdown";

export default function TipoAfectacionIGVList({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [tipos, setTipos] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [tipoDialog, setTipoDialog] = useState(false);
  const [deleteTipoDialog, setDeleteTipoDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tiposData = await getTiposAfectacionIGV();
      setTipos(tiposData || []);
    } catch (error) {
      console.error("Error al cargar tipos de afectación IGV:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de afectación IGV",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const tiposFiltrados = tipos.filter((tipo) => {
    if (!selectedCategoria) return true;
    return tipo.categoria === selectedCategoria;
  });

  const openNew = () => {
    setFormData({});
    setSelectedTipo(null);
    setIsEdit(false);
    setTipoDialog(true);
  };

  const hideDialog = () => {
    setTipoDialog(false);
    setFormData({});
    setSelectedTipo(null);
  };

  const editTipo = async (tipo) => {
    try {
      setLoading(true);
      const tipoCompleto = await getTipoAfectacionIGVById(tipo.id);
      setFormData(tipoCompleto);
      setSelectedTipo(tipo);
      setIsEdit(true);
      setTipoDialog(true);
    } catch (error) {
      console.error("Error al cargar tipo de afectación IGV:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipo de afectación IGV",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTipo = async (data) => {
    const esEdicion = isEdit && selectedTipo;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      if (esEdicion) {
        await updateTipoAfectacionIGV(selectedTipo.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de afectación IGV actualizado correctamente",
          life: 3000,
        });
      } else {
        await createTipoAfectacionIGV(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de afectación IGV creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar tipo de afectación IGV:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar tipo de afectación IGV",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTipo = (tipo) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedTipo(tipo);
    setDeleteTipoDialog(true);
  };

  const deleteTipoConfirmed = async () => {
    try {
      setLoading(true);
      await deleteTipoAfectacionIGV(selectedTipo.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de afectación IGV eliminado correctamente",
        life: 3000,
      });

      setDeleteTipoDialog(false);
      setSelectedTipo(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar tipo de afectación IGV:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar tipo de afectación IGV",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteTipoDialog = () => {
    setDeleteTipoDialog(false);
    setSelectedTipo(null);
  };

  const codigoBodyTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.codigo}</span>;
  };

  const categoriaBodyTemplate = (rowData) => {
    const severityMap = {
      GRAVADO: "success",
      EXONERADO: "info",
      INAFECTO: "warning",
      EXPORTACION: "primary",
      GRATUITO: "secondary",
    };
    return (
      <Tag
        value={rowData.categoria}
        severity={severityMap[rowData.categoria] || "info"}
      />
    );
  };

  const booleanBodyTemplate = (rowData, field) => {
    return rowData[field] ? (
      <Tag value="Sí" severity="success" />
    ) : (
      <Tag value="No" severity="danger" />
    );
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="p-button-warning"
          onClick={() => editTipo(rowData)}
          disabled={!permisos.puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDeleteTipo(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const headerTemplate = () => {
    const hasFilters = selectedCategoria !== null || globalFilter !== "";
    const clearFilters = () => {
      setSelectedCategoria(null);
      setGlobalFilter("");
    };

    const categoriasEnDatos = tipos.reduce((acc, tipo) => {
      if (tipo.categoria && !acc.includes(tipo.categoria)) {
        acc.push(tipo.categoria);
      }
      return acc;
    }, []);

    return (
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>Tipos de Afectación IGV</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            severity="success"
            onClick={openNew}
            disabled={!permisos.puedeCrear}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Dropdown
            value={selectedCategoria}
            options={[
              { label: "Todas las categorías", value: null },
              ...categoriasEnDatos
                .sort()
                .map((cat) => ({
                  label: cat,
                  value: cat,
                })),
            ]}
            onChange={(e) => setSelectedCategoria(e.value)}
            placeholder="Filtrar por categoría"
            showClear
            filter
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              style={{ width: "100%" }}
            />
          </span>
        </div>
        {hasFilters && (
          <div style={{ flex: 1 }}>
            <Button
              icon="pi pi-filter-slash"
              label="Limpiar"
              outlined
              onClick={clearFilters}
              tooltip="Limpiar todos los filtros"
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    );
  };

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteTipoDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteTipoConfirmed}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={tiposFiltrados}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron tipos de afectación IGV"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 150]}
        size="small"
        stripedRows
        showGridlines
        onRowClick={(e) => editTipo(e.data)}
        selectionMode="single"
        style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
        header={headerTemplate}
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ width: "80px" }}
        />
        <Column
          field="codigo"
          header="Código"
          body={codigoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por código"
          style={{ width: "100px" }}
        />
        <Column
          field="nombre"
          header="Nombre"
          sortable
          filter
          filterPlaceholder="Buscar por nombre"
        />
        <Column
          field="categoria"
          header="Categoría"
          body={categoriaBodyTemplate}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
        />
        <Column
          field="permiteCreditoFiscal"
          header="Crédito Fiscal"
          body={(rowData) => booleanBodyTemplate(rowData, "permiteCreditoFiscal")}
          sortable
          style={{ width: "130px" }}
        />
        <Column
          field="calculaIGV"
          header="Calcula IGV"
          body={(rowData) => booleanBodyTemplate(rowData, "calculaIGV")}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={activoBodyTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "120px" }}
          header="Acciones"
        />
      </DataTable>

      <Dialog
        visible={tipoDialog}
        style={{ width: "600px" }}
        header={
          isEdit
            ? "Editar Tipo de Afectación IGV"
            : "Nuevo Tipo de Afectación IGV"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <TipoAfectacionIGVForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveTipo}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteTipoDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteTipoDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedTipo && (
            <span>
              ¿Está seguro de eliminar el tipo de afectación IGV{" "}
              <b>{selectedTipo.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}