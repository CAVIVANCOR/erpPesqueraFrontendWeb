// src/pages/tesoreria/LineaCredito.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import LineaCreditoForm from "../../components/tesoreria/LineaCreditoForm";
import {
  getLineaCredito,
  deleteLineaCredito,
  getLineaCreditoById,
} from "../../api/tesoreria/lineaCredito";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function LineaCredito({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getLineaCredito();
      setItems(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
        life: 3000,
      });
    }
    setLoading(false);
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }

    try {
      const lineaCompleta = await getLineaCreditoById(rowData.id);
      setSelected(lineaCompleta);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar línea de crédito:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la línea de crédito",
        life: 3000,
      });
    }
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deleteLineaCredito(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Línea eliminada",
        detail: `La línea de crédito ${row.numeroLinea} fue eliminada correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar la línea de crédito.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data;
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Línea actualizada" : "Línea creada",
        detail: isEdit
          ? "La línea de crédito fue actualizada correctamente."
          : "La línea de crédito fue creada correctamente.",
        life: 3000,
      });
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la línea de crédito.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
  };

  const estadoTemplate = (rowData) => {
    const colores = {
      86: "success",
      87: "info",
      88: "danger",
      89: "secondary",
      90: "warning",
    };
    return (
      <Tag
        value={rowData.estado?.estado || "N/A"}
        severity={colores[rowData.estadoId] || "info"}
      />
    );
  };

  const tipoLineaTemplate = (rowData) => {
    const tipos = {
      REVOLVENTE: { label: "REVOLVENTE", severity: "info" },
      CARTA_CREDITO: { label: "CARTA CRÉDITO", severity: "success" },
      GARANTIA_BANCARIA: { label: "GARANTÍA", severity: "warning" },
      SOBREGIRO: { label: "SOBREGIRO", severity: "danger" },
    };
    const tipo = tipos[rowData.tipoLinea] || { label: rowData.tipoLinea, severity: "info" };
    return <Tag value={tipo.label} severity={tipo.severity} />;
  };

  const montoTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const fechaTemplate = (rowData, field) => {
    if (!rowData[field]) return "N/A";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            onEdit(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            onDelete(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la línea de crédito{" "}
            <b>
              {confirmState.row
                ? `${confirmState.row.numeroLinea}`
                : ""}
            </b>
            ?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={
          <span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={items}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} líneas de crédito"
        sortField="fechaAprobacion"
        sortOrder={-1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={["numeroLinea", "descripcion", "empresa.razonSocial", "banco.nombreBanco"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Líneas de Crédito</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {items.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nueva Línea de Crédito"
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar por número, descripción..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column field="numeroLinea" header="Número" sortable style={{ width: 150 }} />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          sortable
          style={{ width: 200 }}
        />
        <Column
          field="banco.nombreBanco"
          header="Banco"
          sortable
          style={{ width: 150 }}
        />
        <Column
          field="tipoLinea"
          header="Tipo"
          body={tipoLineaTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="montoAprobado"
          header="Monto Aprobado"
          body={(rowData) => montoTemplate(rowData, "montoAprobado")}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="montoDisponible"
          header="Disponible"
          body={(rowData) => montoTemplate(rowData, "montoDisponible")}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="fechaVencimiento"
          header="Vencimiento"
          body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
          style={{ width: 130 }}
          sortable
        />
        <Column
          field="estadoId"
          header="Estado"
          body={estadoTemplate}
          style={{ width: 130 }}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" style={{ width: 120 }} />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Línea de Crédito"
              : "Ver Línea de Crédito"
            : "Nueva Línea de Crédito"
        }
        visible={showDialog}
        style={{ width: "1200px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <LineaCreditoForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}