/**
 * Pantalla CRUD para gestión de Activos
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

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getActivos, eliminarActivo } from "../api/activo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import ActivoForm from "../components/activo/ActivoForm";
import { getResponsiveFontSize } from "../utils/utils";
import { getEmpresas } from "../api/empresa";

const Activo = ({ ruta }) => {
  const [activos, setActivos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [activoAEliminar, setActivoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }

  const [globalFilter, setGlobalFilter] = useState("");

  // Determinar si es modo solo lectura
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarActivos();
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar empresas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarActivos = async () => {
    try {
      setLoading(true);
      const data = await getActivos();
      setActivos(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar activos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setActivoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (activo) => {
    setActivoSeleccionado(activo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setActivoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarActivos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: activoSeleccionado
        ? "Activo actualizado correctamente"
        : "Activo creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (activo) => {
    setActivoAEliminar(activo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarActivo(activoAEliminar.id);
      setActivos(
        activos.filter((a) => Number(a.id) !== Number(activoAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Activo eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar activo",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setActivoAEliminar(null);
    }
  };

  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.nombre}
      </span>
    );
  };

  const tipoActivoTemplate = (rowData) => {
    return rowData.tipo?.nombre || "N/A";
  };

  const empresaTemplate = (rowData) => {
    const empresaRazonSocial = empresas.find(e => Number(e.id) === Number(rowData.empresaId))?.razonSocial;
    return empresaRazonSocial || "N/A";
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
        value={activos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron activos"
        globalFilter={globalFilter}
        globalFilterFields={['nombre', 'descripcion']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Activos</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Activo"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar activos..."
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
          sortable 
        />
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
          header="Tipo" 
          body={tipoActivoTemplate}
          sortable 
        />
        <Column 
          header="Empresa" 
          body={empresaTemplate}
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
          activoSeleccionado
            ? "Editar Activo"
            : "Nuevo Activo"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <ActivoForm
          activo={activoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el activo "${activoAEliminar?.nombre}"?`}
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

export default Activo;
