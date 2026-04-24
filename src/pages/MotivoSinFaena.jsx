/**
 * Pantalla CRUD para gestión de Motivos Sin Faena
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por descripción
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import {
  getMotivosSinFaena,
  eliminarMotivoSinFaena,
} from "../api/motivoSinFaena";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import MotivoSinFaenaForm from "../components/motivoSinFaena/MotivoSinFaenaForm";
import { getResponsiveFontSize } from "../utils/utils";

const MotivoSinFaena = ({ ruta }) => {
  const usuario = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [motivosSinFaena, setMotivosSinFaena] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [motivoAEliminar, setMotivoAEliminar] = useState(null);
  const toast = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarMotivosSinFaena();
  }, []);

  const cargarMotivosSinFaena = async () => {
    try {
      setLoading(true);
      const data = await getMotivosSinFaena();
      setMotivosSinFaena(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar motivos sin faena",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
  };

  const abrirDialogoNuevo = () => {
    setMotivoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (motivo) => {
    setMotivoSeleccionado(motivo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setMotivoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: "Motivo sin faena guardado correctamente",
      life: 3000,
    });
    cargarMotivosSinFaena();
    cerrarDialogo();
  };

  const confirmarEliminacion = (motivo) => {
    setMotivoAEliminar(motivo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarMotivoSinFaena(motivoAEliminar.id);
      setMotivosSinFaena(
        motivosSinFaena.filter(
          (m) => Number(m.id) !== Number(motivoAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Motivo sin faena eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar motivo sin faena",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setMotivoAEliminar(null);
    }
  };

  const idTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976d2" }}>{rowData.id}</span>
    );
  };

  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.descripcion || (
          <em style={{ color: "#999" }}>Sin descripción</em>
        )}
      </span>
    );
  };

  const activoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            abrirDialogoEdicion(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            confirmarEliminacion(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={motivosSinFaena}
        loading={loading}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} motivos sin faena"
        size="small"
        showGridlines
        stripedRows
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => abrirDialogoEdicion(e.data)
            : undefined
        }
        style={{
          fontSize: getResponsiveFontSize(),
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
        }}
        emptyMessage="No se encontraron motivos sin faena"
        globalFilter={globalFilter}
        globalFilterFields={["descripcion"]}
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
              <h2>Gestión de Motivos Sin Faena</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                raised
                tooltip="Nuevo Motivo Sin Faena"
                className="p-button-success"
                severity="success"
                disabled={!permisos.puedeCrear}
                onClick={abrirDialogoNuevo}
              />
            </div>
            <div style={{ flex: 2 }}>
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar motivos sin faena..."
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Limpiar"
                icon="pi pi-filter-slash"
                className="p-button-secondary"
                size="small"
                onClick={limpiarFiltros}
                disabled={!globalFilter}
              />
            </div>
          </div>
        }
        scrollable
        scrollHeight="600px"
      >
        <Column
          field="id"
          header="ID"
          body={idTemplate}
          sortable
          style={{ width: "80px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          body={descripcionTemplate}
          sortable
        />
        <Column
          header="Estado"
          body={activoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          motivoSeleccionado
            ? permisos.puedeEditar
              ? "Editar Motivo Sin Faena"
              : "Ver Motivo Sin Faena"
            : "Nuevo Motivo Sin Faena"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <MotivoSinFaenaForm
          motivoSinFaena={motivoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={motivoSeleccionado && !permisos.puedeEditar}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el motivo sin faena "${
          motivoAEliminar?.descripcion || `ID: ${motivoAEliminar?.id}`
        }"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default MotivoSinFaena;