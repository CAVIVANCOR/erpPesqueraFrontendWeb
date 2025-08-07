/**
 * Pantalla CRUD para gestión de Tipos de Equipo
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { getTiposEquipo, eliminarTipoEquipo } from "../api/tipoEquipo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoEquipoForm from "../components/tipoEquipo/TipoEquipoForm";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";

const TipoEquipo = () => {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoEquipoSeleccionado, setTipoEquipoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoEquipoAEliminar, setTipoEquipoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarTiposEquipo();
  }, []);

  const cargarTiposEquipo = async () => {
    try {
      setLoading(true);
      const data = await getTiposEquipo();
      setTiposEquipo(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de equipo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoEquipoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipoEquipo) => {
    setTipoEquipoSeleccionado(tipoEquipo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoEquipoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarTiposEquipo();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: tipoEquipoSeleccionado
        ? "Tipo de equipo actualizado correctamente"
        : "Tipo de equipo creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (tipoEquipo) => {
    setTipoEquipoAEliminar(tipoEquipo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoEquipo(tipoEquipoAEliminar.id);
      setTiposEquipo(
        tiposEquipo.filter((t) => t.id !== tipoEquipoAEliminar.id)
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de equipo eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar tipo de equipo",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setTipoEquipoAEliminar(null);
    }
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={tiposEquipo}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de equipo"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Equipo</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Tipo de Equipo"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar tipos de equipo..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          tipoEquipoSeleccionado
            ? "Editar Tipo de Equipo"
            : "Nuevo Tipo de Equipo"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <TipoEquipoForm
          tipoEquipo={tipoEquipoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de equipo "${tipoEquipoAEliminar?.nombre}"?`}
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

export default TipoEquipo;
