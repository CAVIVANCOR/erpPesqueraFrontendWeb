/**
 * Pantalla CRUD para gestión de Tipos Proviene De
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por descripción
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
import { InputText } from "primereact/inputtext";
import { getTiposProvieneDe, eliminarTipoProvieneDe } from "../api/tipoProvieneDe";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoProvieneDeForm from "../components/tipoProvieneDe/TipoProvieneDeForm";
import { getResponsiveFontSize } from "../utils/utils";

const TipoProvieneDe = () => {
  const [tiposProvieneDe, setTiposProvieneDe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarTiposProvieneDe();
  }, []);

  const cargarTiposProvieneDe = async () => {
    try {
      setLoading(true);
      const data = await getTiposProvieneDe();
      setTiposProvieneDe(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos proviene de",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipo) => {
    setTipoSeleccionado(tipo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarTiposProvieneDe();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: tipoSeleccionado
        ? "Tipo proviene de actualizado correctamente"
        : "Tipo proviene de creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (tipo) => {
    setTipoAEliminar(tipo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoProvieneDe(tipoAEliminar.id);
      setTiposProvieneDe(
        tiposProvieneDe.filter((t) => Number(t.id) !== Number(tipoAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo proviene de eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar tipo proviene de",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setTipoAEliminar(null);
    }
  };

  const idTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.id}
      </span>
    );
  };

  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.descripcion}
      </span>
    );
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
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
        value={tiposProvieneDe}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos proviene de"
        globalFilter={globalFilter}
        globalFilterFields={['descripcion']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos Proviene De</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Tipo Proviene De"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar tipos proviene de..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column 
          field="id" 
          header="ID" 
          body={idTemplate}
          sortable 
        />
        <Column 
          field="descripcion" 
          header="Descripción" 
          body={descripcionTemplate}
          sortable 
        />
        <Column 
          header="Estado" 
          body={cesadoTemplate}
          sortable 
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          tipoSeleccionado
            ? "Editar Tipo Proviene De"
            : "Nuevo Tipo Proviene De"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <TipoProvieneDeForm
          tipoProvieneDe={tipoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo proviene de "${tipoAEliminar?.descripcion || `ID: ${tipoAEliminar?.id}`}"?`}
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

export default TipoProvieneDe;
