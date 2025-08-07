// src/pages/TipoEntidad.jsx
// Pantalla CRUD profesional para TipoEntidad. Cumple la regla transversal ERP Megui.
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getTiposEntidad, eliminarTipoEntidad, crearTipoEntidad, actualizarTipoEntidad } from "../api/tipoEntidad";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoEntidadForm from "../components/tipoEntidad/TipoEntidadForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla CRUD para gestión de Tipos de Entidad
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por nombre, descripción
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

const TipoEntidad = () => {
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarTiposEntidad();
  }, []);

  const cargarTiposEntidad = async () => {
    try {
      setLoading(true);
      const data = await getTiposEntidad();
      setTiposEntidad(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de entidad",
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

  const onGuardarExitoso = async () => {
    // El formulario ya manejó la creación/actualización
    // Aquí solo manejamos el feedback visual y actualización de lista
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: tipoSeleccionado 
        ? "Tipo de entidad actualizado correctamente"
        : "Tipo de entidad creado correctamente",
      life: 3000,
    });
    
    cargarTiposEntidad();
    cerrarDialogo();
  };

  const confirmarEliminacion = (tipo) => {
    setTipoAEliminar(tipo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoEntidad(tipoAEliminar.id);
      setTiposEntidad(
        tiposEntidad.filter((t) => Number(t.id) !== Number(tipoAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de entidad eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar tipo de entidad",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setTipoAEliminar(null);
    }
  };

  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.nombre}
      </span>
    );
  };

  const aplicacionTemplate = (rowData) => {
    const tags = [];
    if (rowData.esCliente) {
      tags.push(
        <Tag
          key="cliente"
          value="CLIENTE"
          severity="info"
          style={{ fontSize: "10px", padding: "2px 8px", marginRight: "4px" }}
        />
      );
    }
    if (rowData.esProveedor) {
      tags.push(
        <Tag
          key="proveedor"
          value="PROVEEDOR"
          severity="warning"
          style={{ fontSize: "10px", padding: "2px 8px", marginRight: "4px" }}
        />
      );
    }
    return tags.length > 0 ? tags : <span style={{ color: "#6c757d" }}>-</span>;
  };

  const estadoTemplate = (rowData) => {
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
        value={tiposEntidad}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de entidad"
        globalFilter={globalFilter}
        globalFilterFields={['nombre', 'descripcion']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Entidad</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Tipo de Entidad"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar tipos de entidad..."
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
        <Column 
          field="nombre" 
          header="Nombre" 
          body={nombreTemplate}
          sortable 
        />
        <Column 
          field="descripcion" 
          header="Descripción" 
          sortable 
        />
        <Column 
          header="Aplicación" 
          body={aplicacionTemplate}
          sortable 
        />
        <Column 
          header="Estado" 
          body={estadoTemplate}
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
            ? "Editar Tipo de Entidad"
            : "Nuevo Tipo de Entidad"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <TipoEntidadForm
          tipoEntidad={tipoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de entidad "${tipoAEliminar?.nombre}"?`}
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

export default TipoEntidad;
