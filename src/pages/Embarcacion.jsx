/**
 * Pantalla CRUD para gestión de Embarcaciones
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por matrícula, motor, tablet
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
import { getEmbarcaciones, eliminarEmbarcacion } from "../api/embarcacion";
import { getActivos } from "../api/activo";
import { getTiposEmbarcacion } from "../api/tipoEmbarcacion";
import { getEstadosMultiFuncionParaEmbarcaciones } from "../api/estadoMultiFuncion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import EmbarcacionForm from "../components/embarcacion/EmbarcacionForm";
import { getResponsiveFontSize } from "../utils/utils";

const Embarcacion = ({ ruta }) => {
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [embarcacionSeleccionada, setEmbarcacionSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [embarcacionAEliminar, setEmbarcacionAEliminar] = useState(null);
  const [activos, setActivos] = useState([]);                    // ⬅️ AGREGAR ESTA LÍNEA
const [tiposEmbarcacion, setTiposEmbarcacion] = useState([]);  // ⬅️ AGREGAR ESTA LÍNEA
const [estadosActivo, setEstadosActivo] = useState([]);        // ⬅️ AGREGAR ESTA LÍNEA
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }
  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [embarcacionesData, activosData, tiposData, estadosData] = await Promise.all([
        getEmbarcaciones(),
        getActivos(),
        getTiposEmbarcacion(),
        getEstadosMultiFuncionParaEmbarcaciones()
      ]);
      
      setEmbarcaciones(embarcacionesData);
      setActivos(activosData);
      setTiposEmbarcacion(tiposData);
      setEstadosActivo(estadosData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setEmbarcacionSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (embarcacion) => {
    setEmbarcacionSeleccionada(embarcacion);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEmbarcacionSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarDatos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: embarcacionSeleccionada
        ? "Embarcación actualizada correctamente"
        : "Embarcación creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (embarcacion) => {
    setEmbarcacionAEliminar(embarcacion);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarEmbarcacion(embarcacionAEliminar.id);
      setEmbarcaciones(
        embarcaciones.filter((e) => Number(e.id) !== Number(embarcacionAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Embarcación eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar embarcación",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setEmbarcacionAEliminar(null);
    }
  };

  const activoTemplate = (rowData) => {
    const activo = activos.find((a) => a.id === rowData.activoId);
    return activo?.nombre || "N/A";
  };

  const matriculaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.matricula}
      </span>
    );
  };

  const tipoEmbarcacionTemplate = (rowData) => {
    const tipo = tiposEmbarcacion.find((t) => t.id === rowData.tipoEmbarcacionId);
    return tipo?.nombre || "N/A";
  };

  const estadoTemplate = (rowData) => {
    const estado = estadosActivo.find((e) => e.id === rowData.estadoActivoId);
    return estado?.descripcion || "Sin Estado";
  };

  const capacidadTemplate = (rowData) => {
    return rowData.capacidadBodegaTon 
      ? `${rowData.capacidadBodegaTon} Ton`
      : "N/A";
  };

  const motorTemplate = (rowData) => {
    return rowData.motorMarca || "N/A";
  };

  const anioTemplate = (rowData) => {
    return rowData.anioFabricacion || "N/A";
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
        value={embarcaciones}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron embarcaciones"
        globalFilter={globalFilter}
        globalFilterFields={['matricula', 'motorMarca', 'tabletMarca']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Embarcaciones</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Embarcación"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar embarcaciones..."
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
          field="activo" 
          header="Activo" 
          body={activoTemplate}
          sortable 
        />
        <Column 
          field="matricula" 
          header="Matrícula" 
          body={matriculaTemplate}
          sortable 
        />
        <Column 
          header="Tipo" 
          body={tipoEmbarcacionTemplate}
          sortable 
        />
        <Column 
          field="capacidadBodegaTon" 
          header="Capacidad" 
          body={capacidadTemplate}
          sortable 
        />
        <Column 
          field="motorMarca" 
          header="Motor" 
          body={motorTemplate}
          sortable 
        />
        <Column 
          field="anioFabricacion" 
          header="Año Fab." 
          body={anioTemplate}
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
          embarcacionSeleccionada
            ? "Editar Embarcación"
            : "Nueva Embarcación"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "90vw", maxWidth: "1300px" }}

        modal
      >
        <EmbarcacionForm
          embarcacion={embarcacionSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la embarcación "${embarcacionAEliminar?.matricula}"?`}
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

export default Embarcacion;
