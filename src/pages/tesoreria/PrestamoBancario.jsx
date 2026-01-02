// src/pages/tesoreria/PrestamoBancario.jsx
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
import PrestamoBancarioForm from "../../components/tesoreria/PrestamoBancarioForm";
import {
  getPrestamoBancario,
  deletePrestamoBancario,
  getPrestamoBancarioById,
} from "../../api/tesoreria/prestamoBancarios";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PrestamoBancario({ ruta }) {
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
      const data = await getPrestamoBancario();
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
      const prestamoCompleto = await getPrestamoBancarioById(rowData.id);
      setSelected(prestamoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar préstamo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el préstamo bancario",
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
      await deletePrestamoBancario(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Préstamo eliminado",
        detail: `El préstamo ${row.numeroPrestamo} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar el préstamo bancario.",
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

  const onSubmit = async (resultado) => {
    const esEdicion = isEdit && selected && selected.id;

    if (esEdicion && !permisos.puedeEditar) {
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      toast.current?.show({
        severity: "success",
        summary: esEdicion ? "Préstamo actualizado" : "Préstamo creado",
        detail: esEdicion
          ? "El préstamo bancario fue actualizado correctamente."
          : `Préstamo creado con número: ${resultado.numeroPrestamo}. Ahora puedes agregar documentos.`,
        life: 3000,
      });

      if (esEdicion) {
        // Recargar el préstamo actualizado
        const prestamoActualizado = await getPrestamoBancarioById(selected.id);
        setSelected(prestamoActualizado);
      } else {
        // Cargar el préstamo recién creado con todas sus relaciones
        const prestamoCompleto = await getPrestamoBancarioById(resultado.id);
        setSelected(prestamoCompleto);
        setIsEdit(true);
        // NO cerrar el dialog, mantenerlo abierto en modo edición
      }

      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el préstamo bancario.",
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
      79: "contrast",
      80: "success",
      81: "info",
      82: "warning",
      83: "danger",
      84: "info",
      85: "secondary",
    };
    return (
      <Tag
        value={rowData.estado?.estado || "N/A"}
        severity={colores[rowData.estadoId] || "info"}
      />
    );
  };

  const tipoPrestamoTemplate = (rowData) => {
    const tipos = {
      CAPITAL_TRABAJO: { label: "CAPITAL TRABAJO", severity: "info" },
      ACTIVO_FIJO: { label: "ACTIVO FIJO", severity: "success" },
      LEASING: { label: "LEASING", severity: "warning" },
      FACTORING: { label: "FACTORING", severity: "help" },
      CONFIRMING: { label: "CONFIRMING", severity: "danger" },
      OTROS: { label: "OTROS", severity: "secondary" },
    };
    const tipo = tipos[rowData.tipoPrestamo] || { label: rowData.tipoPrestamo, severity: "info" };
    return <Tag value={tipo.label} severity={tipo.severity} />;
  };

  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData.montoAprobado || 0);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> el préstamo{" "}
            <b>
              {confirmState.row
                ? `${confirmState.row.numeroPrestamo}`
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} préstamos"
        sortField="fechaContrato"
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
        globalFilterFields={["numeroPrestamo", "descripcion", "empresa.razonSocial", "banco.nombreBanco"]}
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
                <h2>Préstamos Bancarios</h2>
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
                  tooltip="Nuevo Préstamo Bancario"
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
        <Column field="numeroPrestamo" header="Número" sortable style={{ width: 150 }} />
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
          field="tipoPrestamo"
          header="Tipo"
          body={tipoPrestamoTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="montoAprobado"
          header="Monto Aprobado"
          body={montoTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="fechaContrato"
          header="Fecha Contrato"
          body={(rowData) => fechaTemplate(rowData, "fechaContrato")}
          style={{ width: 130 }}
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
          style={{ width: 150 }}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" style={{ width: 120 }} />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Préstamo Bancario"
              : "Ver Préstamo Bancario"
            : "Nuevo Préstamo Bancario"
        }
        visible={showDialog}
        style={{ width: "1400px" }}
        modal
        maximizable
        maximized={true}
        onHide={() => setShowDialog(false)}
      >
        <PrestamoBancarioForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          onSubmit={onSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={!permisos.puedeEditar && isEdit}
        />
      </Dialog>
    </div>
  );
}