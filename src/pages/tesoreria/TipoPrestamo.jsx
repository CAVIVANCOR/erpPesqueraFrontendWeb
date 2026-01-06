// src/pages/tesoreria/TipoPrestamo.jsx
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
import TipoPrestamoForm from "../../components/tesoreria/TipoPrestamoForm";
import {
  getTipoPrestamo,
  deleteTipoPrestamo,
  getTipoPrestamoById,
} from "../../api/tesoreria/tipoPrestamo";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function TipoPrestamo({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para filtros tipo botón
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [esComercioExteriorSeleccionado, setEsComercioExteriorSeleccionado] = useState(null);
  const [esLeasingSeleccionado, setEsLeasingSeleccionado] = useState(null);
  const [esFactoringSeleccionado, setEsFactoringSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = items;

    // Filtro por activo
    if (activoSeleccionado !== null) {
      filtrados = filtrados.filter((item) => item.activo === activoSeleccionado);
    }

    // Filtro por comercio exterior
    if (esComercioExteriorSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.esComercioExterior === esComercioExteriorSeleccionado
      );
    }

    // Filtro por leasing
    if (esLeasingSeleccionado !== null) {
      filtrados = filtrados.filter((item) => item.esLeasing === esLeasingSeleccionado);
    }

    // Filtro por factoring
    if (esFactoringSeleccionado !== null) {
      filtrados = filtrados.filter((item) => item.esFactoring === esFactoringSeleccionado);
    }

    setItemsFiltrados(filtrados);
  }, [
    items,
    activoSeleccionado,
    esComercioExteriorSeleccionado,
    esLeasingSeleccionado,
    esFactoringSeleccionado,
  ]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getTipoPrestamo();
      setItems(data);
      setItemsFiltrados(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de préstamo.",
        life: 3000,
      });
    }
    setLoading(false);
  };

  const handleNuevo = () => {
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const handleEditar = async (row) => {
    try {
      const data = await getTipoPrestamoById(row.id);
      setSelected(data);
      setIsEdit(true);
      setShowDialog(true);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el tipo de préstamo.",
        life: 3000,
      });
    }
  };

  const handleEliminar = (row) => {
    setConfirmState({ visible: true, row });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteTipoPrestamo(confirmState.row.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de préstamo eliminado correctamente.",
        life: 3000,
      });
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar el tipo de préstamo.",
        life: 3000,
      });
    }
    setConfirmState({ visible: false, row: null });
  };

  const handleGuardado = () => {
    setShowDialog(false);
    cargarDatos();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: `Tipo de préstamo ${isEdit ? "actualizado" : "creado"} correctamente.`,
      life: 3000,
    });
  };

  const limpiarFiltros = () => {
    setActivoSeleccionado(null);
    setEsComercioExteriorSeleccionado(null);
    setEsLeasingSeleccionado(null);
    setEsFactoringSeleccionado(null);
    setGlobalFilter("");
  };

  // Templates de columnas
  const descripcionTemplate = (row) => (
    <div>
      <div style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
        {row.descripcion}
      </div>
      {row.descripcionCorta && (
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          {row.descripcionCorta}
        </div>
      )}
    </div>
  );

  const caracteristicasTemplate = (row) => (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
      {row.requiereGarantia && (
        <Tag value="GARANTÍA" severity="warning" style={{ fontSize: "0.7rem" }} />
      )}
      {row.esComercioExterior && (
        <Tag value="COMEX" severity="info" style={{ fontSize: "0.7rem" }} />
      )}
      {row.esLeasing && (
        <Tag value="LEASING" severity="success" style={{ fontSize: "0.7rem" }} />
      )}
      {row.esFactoring && (
        <Tag value="FACTORING" severity="help" style={{ fontSize: "0.7rem" }} />
      )}
      {row.permiteRefinanciar && (
        <Tag value="REFINANCIABLE" style={{ fontSize: "0.7rem", backgroundColor: "#6c757d" }} />
      )}
    </div>
  );

  const estadoTemplate = (row) => (
    <Tag
      value={row.activo ? "ACTIVO" : "INACTIVO"}
      severity={row.activo ? "success" : "danger"}
    />
  );

  const severityTemplate = (row) => {
    if (!row.severityColor) return "-";
    return (
      <Tag
        value={row.severityColor.toUpperCase()}
        severity={row.severityColor}
        style={{ fontSize: "0.75rem" }}
      />
    );
  };

  const accionesTemplate = (row) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {permisos.puedeEditar && (
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditar(row);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
      )}
      {permisos.puedeEliminar && (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEliminar(row);
          }}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      )}
    </div>
  );

  return (
    <div style={{ padding: "1rem" }}>
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message="¿Está seguro de eliminar este tipo de préstamo?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminar}
        reject={() => setConfirmState({ visible: false, row: null })}
        acceptLabel="Sí"
        rejectLabel="No"
        acceptClassName="p-button-danger"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: getResponsiveFontSize(1.5) }}>
          TIPOS DE PRÉSTAMO
        </h2>
        {permisos.puedeCrear && (
          <Button
            label="Nuevo Tipo de Préstamo"
            icon="pi pi-plus"
            onClick={handleNuevo}
            className="p-button-success"
          />
        )}
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Búsqueda Global
          </label>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Estado
          </label>
          <Button
            label={
              activoSeleccionado === null
                ? "TODOS"
                : activoSeleccionado
                ? "ACTIVO"
                : "INACTIVO"
            }
            icon={
              activoSeleccionado === null
                ? "pi pi-filter"
                : activoSeleccionado
                ? "pi pi-check-circle"
                : "pi pi-times-circle"
            }
            severity={
              activoSeleccionado === null
                ? "secondary"
                : activoSeleccionado
                ? "success"
                : "danger"
            }
            onClick={() => {
              if (activoSeleccionado === null) {
                setActivoSeleccionado(true); // TODOS -> ACTIVO
              } else if (activoSeleccionado === true) {
                setActivoSeleccionado(false); // ACTIVO -> INACTIVO
              } else {
                setActivoSeleccionado(null); // INACTIVO -> TODOS
              }
            }}
            disabled={loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Comercio Exterior
          </label>
          <Button
            label={
              esComercioExteriorSeleccionado === null
                ? "TODOS"
                : esComercioExteriorSeleccionado
                ? "SÍ COMEX"
                : "NO COMEX"
            }
            icon={
              esComercioExteriorSeleccionado === null
                ? "pi pi-filter"
                : esComercioExteriorSeleccionado
                ? "pi pi-globe"
                : "pi pi-times"
            }
            severity={
              esComercioExteriorSeleccionado === null
                ? "secondary"
                : esComercioExteriorSeleccionado
                ? "info"
                : "secondary"
            }
            onClick={() => {
              if (esComercioExteriorSeleccionado === null) {
                setEsComercioExteriorSeleccionado(true);
              } else if (esComercioExteriorSeleccionado === true) {
                setEsComercioExteriorSeleccionado(false);
              } else {
                setEsComercioExteriorSeleccionado(null);
              }
            }}
            disabled={loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Leasing
          </label>
          <Button
            label={
              esLeasingSeleccionado === null
                ? "TODOS"
                : esLeasingSeleccionado
                ? "SÍ LEASING"
                : "NO LEASING"
            }
            icon={
              esLeasingSeleccionado === null
                ? "pi pi-filter"
                : esLeasingSeleccionado
                ? "pi pi-check"
                : "pi pi-times"
            }
            severity={
              esLeasingSeleccionado === null
                ? "secondary"
                : esLeasingSeleccionado
                ? "success"
                : "secondary"
            }
            onClick={() => {
              if (esLeasingSeleccionado === null) {
                setEsLeasingSeleccionado(true);
              } else if (esLeasingSeleccionado === true) {
                setEsLeasingSeleccionado(false);
              } else {
                setEsLeasingSeleccionado(null);
              }
            }}
            disabled={loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Factoring
          </label>
          <Button
            label={
              esFactoringSeleccionado === null
                ? "TODOS"
                : esFactoringSeleccionado
                ? "SÍ FACTORING"
                : "NO FACTORING"
            }
            icon={
              esFactoringSeleccionado === null
                ? "pi pi-filter"
                : esFactoringSeleccionado
                ? "pi pi-check"
                : "pi pi-times"
            }
            severity={
              esFactoringSeleccionado === null
                ? "secondary"
                : esFactoringSeleccionado
                ? "help"
                : "secondary"
            }
            onClick={() => {
              if (esFactoringSeleccionado === null) {
                setEsFactoringSeleccionado(true);
              } else if (esFactoringSeleccionado === true) {
                setEsFactoringSeleccionado(false);
              } else {
                setEsFactoringSeleccionado(null);
              }
            }}
            disabled={loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            onClick={limpiarFiltros}
            className="p-button-secondary"
            outlined
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Tabla con clic en fila */}
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron tipos de préstamo"
        responsiveLayout="scroll"
        stripedRows
        size="small"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEditar(e.data)
            : undefined
        }
        style={{
          cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column
          field="descripcion"
          header="DESCRIPCIÓN"
          body={descripcionTemplate}
          sortable
          style={{ minWidth: "250px" }}
        />
        <Column
          header="CARACTERÍSTICAS"
          body={caracteristicasTemplate}
          style={{ minWidth: "300px" }}
        />
        <Column
          header="COLOR TAG"
          body={severityTemplate}
          style={{ minWidth: "120px" }}
        />
        <Column
          field="activo"
          header="ESTADO"
          body={estadoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="ACCIONES"
          body={accionesTemplate}
          style={{ minWidth: "150px" }}
        />
      </DataTable>

      {/* Dialog Formulario */}
      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={isEdit ? "Editar Tipo de Préstamo" : "Nuevo Tipo de Préstamo"}
        style={{ width: "90vw", maxWidth: "800px" }}
        modal
      >
        <TipoPrestamoForm
          initialData={selected}
          onSuccess={handleGuardado}
          onCancel={() => setShowDialog(false)}
          isEdit={isEdit}
          usuario={usuario}
        />
      </Dialog>
    </div>
  );
}