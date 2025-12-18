/**
 * Pantalla CRUD para gestión de Agrupaciones de Entidad
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 * - REGLA CRÍTICA: Solo el formulario graba, el componente padre solo maneja UI
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
import { getAgrupacionesEntidad, eliminarAgrupacionEntidad } from "../api/agrupacionEntidad";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import AgrupacionEntidadForm from "../components/agrupacionEntidad/AgrupacionEntidadForm";
import { getResponsiveFontSize } from "../utils/utils";

const AgrupacionEntidad = ({ ruta }) => {
  const [agrupacionesEntidad, setAgrupacionesEntidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [agrupacionEntidadSeleccionada, setAgrupacionEntidadSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [agrupacionEntidadAEliminar, setAgrupacionEntidadAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }
  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarAgrupacionesEntidad();
  }, []);

  const cargarAgrupacionesEntidad = async () => {
    try {
      setLoading(true);
      const data = await getAgrupacionesEntidad();
      setAgrupacionesEntidad(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las agrupaciones de entidad",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setAgrupacionEntidadSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (agrupacionEntidad) => {
    setAgrupacionEntidadSeleccionada(agrupacionEntidad);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setAgrupacionEntidadSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: agrupacionEntidadSeleccionada 
        ? "Agrupación de entidad actualizada correctamente"
        : "Agrupación de entidad creada correctamente",
      life: 3000,
    });
    
    cargarAgrupacionesEntidad();
    cerrarDialogo();
  };

  const confirmarEliminacion = (agrupacionEntidad) => {
    setAgrupacionEntidadAEliminar(agrupacionEntidad);
    setConfirmVisible(true);
  };

  const eliminarAgrupacionEntidadConfirmado = async () => {
    try {
      setLoading(true);
      await eliminarAgrupacionEntidad(agrupacionEntidadAEliminar.id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Agrupación de entidad eliminada correctamente",
        life: 3000,
      });
      cargarAgrupacionesEntidad();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la agrupación de entidad",
        life: 3000,
      });
    } finally {
      setLoading(false);
      setConfirmVisible(false);
      setAgrupacionEntidadAEliminar(null);
    }
  };

  // Template para mostrar si aplica para clientes
  const clienteTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esCliente ? "Sí" : "No"}
        severity={rowData.esCliente ? "info" : "secondary"}
      />
    );
  };

  // Template para mostrar si aplica para proveedores
  const proveedorTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esProveedor ? "Sí" : "No"}
        severity={rowData.esProveedor ? "warning" : "secondary"}
      />
    );
  };

  // Template para acciones (editar/eliminar)
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
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
        value={agrupacionesEntidad}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron agrupaciones de entidad"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Agrupaciones de Entidad</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Agrupación de Entidad"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar agrupaciones de entidad..."
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
        <Column field="esCliente" header="Para Clientes" body={clienteTemplate} sortable />
        <Column field="esProveedor" header="Para Proveedores" body={proveedorTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      {/* Dialog para crear/editar agrupación de entidad */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header={agrupacionEntidadSeleccionada ? "Editar Agrupación de Entidad" : "Nueva Agrupación de Entidad"}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <AgrupacionEntidadForm
          agrupacionEntidad={agrupacionEntidadSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      {/* ConfirmDialog para eliminación */}
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la agrupación de entidad "${agrupacionEntidadAEliminar?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={eliminarAgrupacionEntidadConfirmado}
        reject={() => {
          setConfirmVisible(false);
          setAgrupacionEntidadAEliminar(null);
        }}
      />
    </div>
  );
};

export default AgrupacionEntidad;
