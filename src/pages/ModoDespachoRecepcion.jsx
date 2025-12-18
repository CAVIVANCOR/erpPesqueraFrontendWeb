/**
 * Pantalla CRUD para gestión de Modos de Despacho y Recepción
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por código, nombre, descripción
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
import {
  getAllModoDespachoRecepcion,
  deleteModoDespachoRecepcion,
  crearModoDespachoRecepcion,
  actualizarModoDespachoRecepcion,
} from "../api/modoDespachoRecepcion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import ModoDespachoRecepcionForm from "../components/modoDespachoRecepcion/ModoDespachoRecepcionForm";
import { getResponsiveFontSize } from "../utils/utils";

const ModoDespachoRecepcion = ({ ruta }) => {
  const [modosDespachoRecepcion, setModosDespachoRecepcion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [modoSeleccionado, setModoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [modoAEliminar, setModoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return (
      <div className="p-4">
        <h2>Sin Acceso</h2>
        <p>No tiene permisos para acceder a este módulo.</p>
      </div>
    );
  }

  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarModosDespachoRecepcion();
  }, []);

  const cargarModosDespachoRecepcion = async () => {
    try {
      setLoading(true);
      const data = await getAllModoDespachoRecepcion();
      setModosDespachoRecepcion(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar modos de despacho y recepción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setModoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (modo) => {
    setModoSeleccionado(modo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setModoSeleccionado(null);
  };

  const onGuardarExitoso = async (data) => {
    if (modoSeleccionado) {
      try {
        await actualizarModoDespachoRecepcion(modoSeleccionado.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Modo de despacho/recepción actualizado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar modo de despacho/recepción",
          life: 3000,
        });
      }
    } else {
      try {
        await crearModoDespachoRecepcion(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Modo de despacho/recepción creado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al crear modo de despacho/recepción",
          life: 3000,
        });
      }
    }
    cargarModosDespachoRecepcion();
    cerrarDialogo();
  };

  const confirmarEliminacion = (modo) => {
    setModoAEliminar(modo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await deleteModoDespachoRecepcion(modoAEliminar.id);
      setModosDespachoRecepcion(
        modosDespachoRecepcion.filter(
          (m) => Number(m.id) !== Number(modoAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Modo de despacho/recepción eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar modo de despacho/recepción",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setModoAEliminar(null);
    }
  };

  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.codigo}
      </span>
    );
  };

  const nombreTemplate = (rowData) => {
    return <span style={{ fontWeight: "500" }}>{rowData.nombre}</span>;
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
        value={modosDespachoRecepcion}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron modos de despacho y recepción"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "descripcion"]}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Modos de Despacho y Recepción</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Modo de Despacho y Recepción"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar modos de despacho/recepción..."
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
        <Column field="codigo" header="Código" body={codigoTemplate} sortable />
        <Column field="nombre" header="Nombre" body={nombreTemplate} sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Estado" body={activoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          modoSeleccionado
            ? "Editar Modo de Despacho/Recepción"
            : "Nuevo Modo de Despacho/Recepción"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <ModoDespachoRecepcionForm
          modoDespachoRecepcion={modoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el modo de despacho/recepción "${modoAEliminar?.nombre}"?`}
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

export default ModoDespachoRecepcion;
