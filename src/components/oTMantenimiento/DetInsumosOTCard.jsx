// src/components/oTMantenimiento/DetInsumosOTCard.jsx
// Componente modular para gestionar insumos de una tarea OT
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
  getInsumosPorTarea,
  crearDetInsumosTareaOT,
  actualizarDetInsumosTareaOT,
  deleteDetInsumosTareaOT,
} from "../../api/detInsumosTareaOT";
import DetInsumosOTForm from "./DetInsumosOTForm";
import { formatNumber } from "../../utils/formatters";

const DetInsumosOTCard = ({
  tareaId,
  estadosInsumo = [],
  productos = [],
  empresaId = null,
  almacenId = null,
  permisos = {},
  onInsumosChange,
  disabled = false,
  readOnly = false,
}) => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const toast = useRef(null);

  // Cargar insumos al montar o cuando cambie la tarea
  useEffect(() => {
    if (tareaId) {
      cargarInsumos();
    }
  }, [tareaId]);

  const cargarInsumos = async () => {
    if (!tareaId) return;

    setLoading(true);
    try {
      const data = await getInsumosPorTarea(tareaId);
      // Normalizar IDs
      const insumosNormalizados = data.map((i) => ({
        ...i,
        id: Number(i.id),
        tareaId: Number(i.tareaId),
        productoId: Number(i.productoId),
        estadoInsumoId: i.estadoInsumoId ? Number(i.estadoInsumoId) : null,
      }));
      setInsumos(insumosNormalizados);
      onInsumosChange?.(insumosNormalizados);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los insumos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    if (disabled || readOnly) return;
    setInsumoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEditar = (insumo) => {
    if (disabled || readOnly) return;
    setInsumoSeleccionado(insumo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setInsumoSeleccionado(null);
  };

  const guardarInsumo = async (datosInsumo) => {
    try {
      const payload = {
        ...datosInsumo,
        tareaId: Number(tareaId),
      };

      if (insumoSeleccionado?.id) {
        await actualizarDetInsumosTareaOT(insumoSeleccionado.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Insumo actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetInsumosTareaOT(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Insumo agregado correctamente",
          life: 3000,
        });
      }

      cerrarDialogo();
      cargarInsumos();
    } catch (error) {
      console.error("Error al guardar insumo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar el insumo",
        life: 3000,
      });
    }
  };

  const confirmarEliminar = (insumo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el insumo "${insumo.producto?.descripcion}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => eliminarInsumo(insumo.id),
    });
  };

  const eliminarInsumo = async (id) => {
    try {
      await deleteDetInsumosTareaOT(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Insumo eliminado correctamente",
        life: 3000,
      });
      cargarInsumos();
    } catch (error) {
      console.error("Error al eliminar insumo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al eliminar el insumo",
        life: 3000,
      });
    }
  };

  // TEMPLATES DE COLUMNAS
  const productoTemplate = (rowData) => {
    if (rowData.producto) {
      return (
        <div>
          <div style={{ fontWeight: "bold" }}>
            {rowData.producto.codigo}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            {rowData.producto.descripcion}
          </div>
        </div>
      );
    }
    return <span style={{ color: "#999" }}>Sin producto</span>;
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        {formatNumber(rowData.cantidad, 2)} {rowData.producto?.unidadMedida || ""}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    if (rowData.estadoInsumo) {
      return (
        <Badge
          value={rowData.estadoInsumo.descripcion}
          severity={rowData.estadoInsumo.severityColor || "secondary"}
        />
      );
    }
    return <Badge value="Sin estado" severity="secondary" />;
  };

  const observacionesTemplate = (rowData) => {
    if (rowData.observaciones) {
      return (
        <div style={{ fontSize: "0.85rem", maxWidth: "200px" }}>
          {rowData.observaciones}
        </div>
      );
    }
    return <span style={{ color: "#999" }}>-</span>;
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
          disabled={disabled || readOnly}
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
            disabled={disabled || readOnly}
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
      <span style={{ fontWeight: "bold" }}>
        Insumos ({insumos.length})
      </span>
      <Button
        label="Agregar Insumo"
        icon="pi pi-plus"
        onClick={abrirDialogoNuevo}
        disabled={disabled || !tareaId}
        size="small"
      />
    </div>
  );

  return (
    <div className="det-insumos-ot-card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={insumos}
        loading={loading}
        header={header}
        emptyMessage="No hay insumos registrados"
        stripedRows
        size="small"
        scrollable
        scrollHeight="300px"
        onRowClick={(e) => !(disabled || readOnly) && abrirDialogoEditar(e.data)}
        rowHover
        style={{ cursor: (disabled || readOnly) ? "default" : "pointer" }}
      >
        <Column
          header="Producto"
          body={productoTemplate}
          sortable
          style={{ minWidth: "250px" }}
        />
        <Column
          header="Cantidad"
          body={cantidadTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          style={{ width: "140px" }}
        />
        <Column
          header="Observaciones"
          body={observacionesTemplate}
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          frozen
          alignFrozen="right"
          style={{ width: "100px" }}
        />
      </DataTable>

      {/* DIÁLOGO FORMULARIO */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "600px" }}
        header={
          insumoSeleccionado ? "Editar Insumo" : "Nuevo Insumo"
        }
        modal
        onHide={cerrarDialogo}
      >
        <DetInsumosOTForm
          insumo={insumoSeleccionado}
          estadosInsumo={estadosInsumo}
          productos={productos}
          empresaId={empresaId}
          almacenId={almacenId}
          onSubmit={guardarInsumo}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetInsumosOTCard;
