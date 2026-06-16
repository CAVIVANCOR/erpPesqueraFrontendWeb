// src/pages/ventas/MotivoNotaCreditoDebito.jsx
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
import MotivoNotaCreditoDebitoForm from "../../components/ventas/MotivoNotaCreditoDebitoForm";
import {
  getMotivoNotaCreditoDebito,
  deleteMotivoNotaCreditoDebito,
  getMotivoNotaCreditoDebitoById,
} from "../../api/ventas/motivoNotaCreditoDebito";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function MotivoNotaCreditoDebito({ ruta }) {
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
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null); // null = TODOS, false = NC, true = ND

  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = items;

    // Filtro por activo
    if (activoSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.activo === activoSeleccionado,
      );
    }

    // Filtro por tipo (NC/ND)
    if (tipoSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.esNCND === tipoSeleccionado,
      );
    }

    setItemsFiltrados(filtrados);
  }, [items, activoSeleccionado, tipoSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getMotivoNotaCreditoDebito();
      setItems(data);
      setItemsFiltrados(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los motivos de NC/ND.",
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
      const data = await getMotivoNotaCreditoDebitoById(row.id);
      setSelected(data);
      setIsEdit(true);
      setShowDialog(true);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el motivo de NC/ND.",
        life: 3000,
      });
    }
  };

  const handleEliminar = (row) => {
    setConfirmState({ visible: true, row });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteMotivoNotaCreditoDebito(confirmState.row.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Motivo de NC/ND eliminado correctamente.",
        life: 3000,
      });
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar el motivo de NC/ND.",
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
      detail: `Motivo de NC/ND ${isEdit ? "actualizado" : "creado"} correctamente.`,
      life: 3000,
    });
  };

  const limpiarFiltros = () => {
    setActivoSeleccionado(null);
    setTipoSeleccionado(null);
    setGlobalFilter("");
  };

  // Templates de columnas
  const codigoTemplate = (row) => (
    <div style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
      {row.codigoSunat}
    </div>
  );

  const descripcionTemplate = (row) => (
    <div style={{ fontSize: getResponsiveFontSize() }}>
      {row.descripcion}
    </div>
  );

  const tipoTemplate = (row) => (
    <Tag
      value={row.esNCND ? "NOTA DE DÉBITO" : "NOTA DE CRÉDITO"}
      severity={row.esNCND ? "warning" : "info"}
      style={{ fontSize: "0.75rem" }}
    />
  );

  const estadoTemplate = (row) => (
    <Tag
      value={row.activo ? "ACTIVO" : "INACTIVO"}
      severity={row.activo ? "success" : "danger"}
    />
  );

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
        message="¿Está seguro de eliminar este motivo de NC/ND?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminar}
        reject={() => setConfirmState({ visible: false, row: null })}
        acceptLabel="Sí"
        rejectLabel="No"
        acceptClassName="p-button-danger"
      />
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>MOTIVOS DE NOTAS DE CRÉDITO Y DÉBITO</h2>
        </div>
        {permisos.puedeCrear && (
          <div style={{ flex: 0.5 }}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              onClick={handleNuevo}
              className="p-button-success"
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Búsqueda Global
          </label>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Tipo Documento
          </label>
          <Button
            label={
              tipoSeleccionado === null
                ? "TODOS"
                : tipoSeleccionado
                  ? "NOTA DÉBITO"
                  : "NOTA CRÉDITO"
            }
            icon={
              tipoSeleccionado === null
                ? "pi pi-filter"
                : tipoSeleccionado
                  ? "pi pi-arrow-up"
                  : "pi pi-arrow-down"
            }
            severity={
              tipoSeleccionado === null
                ? "secondary"
                : tipoSeleccionado
                  ? "warning"
                  : "info"
            }
            onClick={() => {
              if (tipoSeleccionado === null) {
                setTipoSeleccionado(false); // TODOS -> NC
              } else if (tipoSeleccionado === false) {
                setTipoSeleccionado(true); // NC -> ND
              } else {
                setTipoSeleccionado(null); // ND -> TODOS
              }
            }}
            disabled={loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
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

        <div style={{ flex: 1 }}>
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
        emptyMessage="No se encontraron motivos de NC/ND"
        responsiveLayout="scroll"
        stripedRows
        size="small"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEditar(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "70px" }} />
        <Column
          field="codigoSunat"
          header="CÓDIGO SUNAT"
          body={codigoTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="descripcion"
          header="DESCRIPCIÓN"
          body={descripcionTemplate}
          sortable
          style={{ minWidth: "300px" }}
        />
        <Column
          field="esNCND"
          header="TIPO"
          body={tipoTemplate}
          sortable
          style={{ minWidth: "180px" }}
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
        header={isEdit ? "Editar Motivo NC/ND" : "Nuevo Motivo NC/ND"}
        style={{ width: "90vw", maxWidth: "600px" }}
        modal
      >
        <MotivoNotaCreditoDebitoForm
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