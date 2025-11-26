// src/components/oTMantenimiento/DetTareasOTCard.jsx
// Componente modular para gestionar tareas de una OT siguiendo patrón DetCotizacionVentasCard
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import { Tag } from "primereact/tag";
import {
  getTareasPorOrdenTrabajo,
  createDetTareasOT,
  updateDetTareasOT,
  eliminarDetalleTareaOT,
} from "../../api/detTareasOT";
import DetTareasOTForm from "./DetTareasOTForm";
import DetInsumosOTCard from "./DetInsumosOTCard";
import { formatDate } from "../../utils/formatters";

const DetTareasOTCard = ({
  otMantenimientoId,
  estadosTarea = [],
  estadosInsumo = [],
  personalOptions = [],
  contratistas = [],
  productos = [],
  empresaId = null,
  almacenId = null,
  permisos = {},
  onTareasChange,
  disabled = false,
}) => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const toast = useRef(null);

  // Cargar tareas al montar o cuando cambie la OT
  useEffect(() => {
    if (otMantenimientoId) {
      cargarTareas();
    }
  }, [otMantenimientoId]);

  const cargarTareas = async () => {
    if (!otMantenimientoId) return;

    setLoading(true);
    try {
      const data = await getTareasPorOrdenTrabajo(otMantenimientoId);
      // Normalizar IDs
      const tareasNormalizadas = data.map((t) => ({
        ...t,
        id: Number(t.id),
        otMantenimientoId: Number(t.otMantenimientoId),
        responsableId: t.responsableId ? Number(t.responsableId) : null,
        validaTerminoTareaId: t.validaTerminoTareaId
          ? Number(t.validaTerminoTareaId)
          : null,
        contratistaId: t.contratistaId ? Number(t.contratistaId) : null,
        estadoTareaId: t.estadoTareaId ? Number(t.estadoTareaId) : null,
      }));
      setTareas(tareasNormalizadas);
      onTareasChange?.(tareasNormalizadas);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las tareas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    if (disabled) return;
    setTareaSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEditar = (tarea) => {
    if (disabled) return;
    setTareaSeleccionada(tarea);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTareaSeleccionada(null);
  };

  const guardarTarea = async (datosTarea) => {
    try {
      const payload = {
        ...datosTarea,
        otMantenimientoId: Number(otMantenimientoId),
      };

      if (tareaSeleccionada?.id) {
        await updateDetTareasOT(tareaSeleccionada.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tarea actualizada correctamente",
          life: 3000,
        });
      } else {
        await createDetTareasOT(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tarea creada correctamente",
          life: 3000,
        });
      }

      cerrarDialogo();
      cargarTareas();
    } catch (error) {
      console.error("Error al guardar tarea:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la tarea",
        life: 3000,
      });
    }
  };

  const confirmarEliminar = (tarea) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la tarea #${tarea.numeroTarea}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => eliminarTarea(tarea.id),
    });
  };

  const eliminarTarea = async (id) => {
    try {
      await eliminarDetalleTareaOT(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tarea eliminada correctamente",
        life: 3000,
      });
      cargarTareas();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al eliminar la tarea",
        life: 3000,
      });
    }
  };

  // TEMPLATES DE COLUMNAS
  const numeroTareaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
        #{rowData.numeroTarea}
      </span>
    );
  };

  const descripcionTemplate = (rowData) => {
    return (
      <div style={{ maxWidth: "300px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          {rowData.descripcion}
        </div>
        {rowData.observaciones && (
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            {rowData.observaciones}
          </div>
        )}
      </div>
    );
  };

  const responsableTemplate = (rowData) => {
    if (rowData.responsable) {
      return `${rowData.responsable.nombres} ${rowData.responsable.apellidos}`;
    }
    if (rowData.contratista) {
      return (
        <Tag value={rowData.contratista.razonSocial} severity="info" />
      );
    }
    return <span style={{ color: "#999" }}>Sin asignar</span>;
  };

  const estadoTemplate = (rowData) => {
    if (rowData.estadoTarea) {
      return (
        <Badge
          value={rowData.estadoTarea.descripcion}
          severity={rowData.estadoTarea.severityColor || "secondary"}
        />
      );
    }
    return <Badge value="Sin estado" severity="secondary" />;
  };

  const fechasTemplate = (rowData) => {
    return (
      <div style={{ fontSize: "0.85rem" }}>
        {rowData.fechaProgramada && (
          <div>
            <strong>Prog:</strong> {formatDate(rowData.fechaProgramada)}
          </div>
        )}
        {rowData.fechaInicio && (
          <div>
            <strong>Inicio:</strong> {formatDate(rowData.fechaInicio)}
          </div>
        )}
        {rowData.fechaFin && (
          <div>
            <strong>Fin:</strong> {formatDate(rowData.fechaFin)}
          </div>
        )}
      </div>
    );
  };

  const realizadoTemplate = (rowData) => {
    return rowData.realizado ? (
      <Tag value="REALIZADO" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="PENDIENTE" severity="warning" icon="pi pi-clock" />
    );
  };

  const insumosTemplate = (rowData) => {
    const cantidadInsumos = rowData.insumosOT?.length || 0;
    return cantidadInsumos > 0 ? (
      <Badge value={cantidadInsumos} severity="info" />
    ) : (
      <span style={{ color: "#999" }}>0</span>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={disabled}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {permisos.eliminar && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => confirmarEliminar(rowData)}
            disabled={disabled}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  // HEADER
  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
        Tareas de la Orden de Trabajo ({tareas.length})
      </span>
      <Button
        label="Nueva Tarea"
        icon="pi pi-plus"
        onClick={abrirDialogoNuevo}
        disabled={disabled || !otMantenimientoId}
        size="small"
      />
    </div>
  );

  return (
    <div className="det-tareas-ot-card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={tareas}
        loading={loading}
        header={header}
        emptyMessage="No hay tareas registradas"
        stripedRows
        size="small"
        scrollable
        scrollHeight="400px"
        onRowClick={(e) => !disabled && abrirDialogoEditar(e.data)}
        rowHover
        style={{ cursor: disabled ? "default" : "pointer" }}
      >
        <Column
          field="numeroTarea"
          header="#"
          body={numeroTareaTemplate}
          sortable
          style={{ width: "80px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          body={descripcionTemplate}
          sortable
          style={{ minWidth: "300px" }}
        />
        <Column
          header="Responsable"
          body={responsableTemplate}
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          style={{ width: "140px" }}
        />
        <Column
          header="Fechas"
          body={fechasTemplate}
          style={{ width: "150px" }}
        />
        <Column
          header="Realizado"
          body={realizadoTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Insumos"
          body={insumosTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          frozen
          alignFrozen="right"
          style={{ width: "120px" }}
        />
      </DataTable>

      {/* DIÁLOGO FORMULARIO */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: tareaSeleccionada?.id ? "1000px" : "800px" }}
        header={
          tareaSeleccionada ? "Editar Tarea" : "Nueva Tarea"
        }
        modal
        onHide={cerrarDialogo}
        maximizable
      >
        <DetTareasOTForm
          tarea={tareaSeleccionada}
          estadosTarea={estadosTarea}
          personalOptions={personalOptions}
          contratistas={contratistas}
          onSubmit={guardarTarea}
          onCancel={cerrarDialogo}
        />

        {/* INSUMOS DE LA TAREA (solo al editar) */}
        {tareaSeleccionada?.id && (
          <div style={{ marginTop: "2rem", borderTop: "1px solid #dee2e6", paddingTop: "1rem" }}>
            <h4 style={{ marginBottom: "1rem", color: "#495057" }}>
              <i className="pi pi-box" style={{ marginRight: "0.5rem" }}></i>
              Insumos de la Tarea
            </h4>
            <DetInsumosOTCard
              tareaId={tareaSeleccionada.id}
              estadosInsumo={estadosInsumo}
              productos={productos}
              empresaId={empresaId}
              almacenId={almacenId}
              permisos={permisos}
              disabled={disabled}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default DetTareasOTCard;
