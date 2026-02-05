// src/components/oTMantenimiento/DetEntregaRendirOTMantenimiento.jsx
// Componente para gestión de detalle de entregas a rendir en OT de Mantenimiento
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import DetMovsEntregaRendirOTMantenimientoForm from "./DetMovsEntregaRendirOTMantenimientoForm";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  crearDetMovEntregaRendirOTMantenimiento,
  actualizarDetMovEntregaRendirOTMantenimiento,
  eliminarDetMovEntregaRendirOTMantenimiento,
} from "../../api/detMovsEntregaRendirOTMantenimiento.api";
import { actualizarEntregaRendirOTMantenimiento } from "../../api/entregaARendirOTMantenimiento.api";

export default function DetEntregaRendirOTMantenimiento({
  entregaARendir,
  movimientos = [],
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  productos = [],
  otAprobada = false,
  loading = false,
  selectedMovimientos = [],
  onSelectionChange,
  onDataChange,
}) {
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroIngresoEgreso, setFiltroIngresoEgreso] = useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);

  const toast = useRef(null);

  const obtenerMovimientosFiltrados = () => {
    let movimientosFiltrados = [...movimientos];

    if (filtroTipoMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.tipoMovimientoId) === Number(filtroTipoMovimiento),
      );
    }

    if (filtroCentroCosto) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.centroCostoId) === Number(filtroCentroCosto),
      );
    }

    if (filtroIngresoEgreso !== null) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        const tipoMov = tiposMovimiento.find(
          (t) => Number(t.id) === Number(mov.tipoMovimientoId),
        );
        return tipoMov?.esIngreso === filtroIngresoEgreso;
      });
    }

    if (filtroValidacionTesoreria !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.validadoTesoreria === filtroValidacionTesoreria,
      );
    }

    return movimientosFiltrados;
  };
  // Filtrar movimientos que son asignaciones (inicial o adicional) y forman parte del cálculo
  const movimientosAsignacionEntregaRendir = (movimientos || []).filter(
    (mov) =>
      (mov.tipoMovimientoId === 1 || mov.tipoMovimientoId === 2) &&
      mov.formaParteCalculoEntregaARendir === true,
  );
  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroIngresoEgreso(null);
    setFiltroValidacionTesoreria(null);
  };

  const alternarFiltroIngresoEgreso = () => {
    if (filtroIngresoEgreso === null) {
      setFiltroIngresoEgreso(true);
    } else if (filtroIngresoEgreso === true) {
      setFiltroIngresoEgreso(false);
    } else {
      setFiltroIngresoEgreso(null);
    }
  };

  const alternarFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      setFiltroValidacionTesoreria(true);
    } else if (filtroValidacionTesoreria === true) {
      setFiltroValidacionTesoreria(false);
    } else {
      setFiltroValidacionTesoreria(null);
    }
  };

  const obtenerPropiedadesFiltroIngresoEgreso = () => {
    if (filtroIngresoEgreso === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroIngresoEgreso === true) {
      return { label: "Ingresos", severity: "success" };
    } else {
      return { label: "Egresos", severity: "danger" };
    }
  };

  const obtenerPropiedadesFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroValidacionTesoreria === true) {
      return { label: "Validados", severity: "success" };
    } else {
      return { label: "Pendientes", severity: "danger" };
    }
  };

  const handleNuevoMovimiento = () => {
    setEditingMovimiento(null);
    setShowMovimientoForm(true);
  };

  const handleEditarMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setShowMovimientoForm(true);
  };

  const handleGuardarMovimiento = async (data) => {
    try {
      if (editingMovimiento) {
        await actualizarDetMovEntregaRendirOTMantenimiento(
          editingMovimiento.id,
          data,
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetMovEntregaRendirOTMantenimiento(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
      }

      setShowMovimientoForm(false);
      setEditingMovimiento(null);
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar movimiento",
        life: 3000,
      });
    }
  };

  const handleEliminarMovimiento = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento del ${new Date(
        movimiento.fechaMovimiento,
      ).toLocaleDateString("es-PE")}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarDetMovEntregaRendirOTMantenimiento(movimiento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar movimiento:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar movimiento",
            life: 3000,
          });
        }
      },
    });
  };

  // Templates para columnas
  const fechaBodyTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
  };

  const tipoMovimientoBodyTemplate = (rowData) => {
    const tipoMov = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId),
    );
    const severity = tipoMov?.esIngreso ? "success" : "danger";
    return <Badge value={tipoMov?.descripcion || "N/A"} severity={severity} />;
  };

  const responsableBodyTemplate = (rowData) => {
    const resp = personal.find(
      (p) => Number(p.id) === Number(rowData.responsableId),
    );
    return resp
      ? `${resp.nombres || ""} ${resp.apellidos || ""}`.trim()
      : "N/A";
  };

  const centroCostoBodyTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId),
    );
    return centro ? `${centro.Codigo} - ${centro.Nombre}` : "N/A";
  };

  const montoBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const simbolo = moneda?.simbolo || "S/";
    return `${simbolo} ${Number(rowData.monto).toFixed(2)}`;
  };

  const entidadComercialBodyTemplate = (rowData) => {
    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId),
    );
    return entidad?.razonSocial || "N/A";
  };

  const validadoBodyTemplate = (rowData) => {
    return rowData.validadoTesoreria ? (
      <Badge value="Validado" severity="success" />
    ) : (
      <Badge value="Pendiente" severity="warning" />
    );
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => handleEditarMovimiento(rowData)}
          disabled={entregaARendir?.entregaLiquidada}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleEliminarMovimiento(rowData)}
          disabled={entregaARendir?.entregaLiquidada}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const movimientosFiltrados = obtenerMovimientosFiltrados();
  const propsFiltroIngresoEgreso = obtenerPropiedadesFiltroIngresoEgreso();
  const propsFiltroValidacionTesoreria =
    obtenerPropiedadesFiltroValidacionTesoreria();

  return (
    <>
      {/* Barra de filtros */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label className="block text-900 font-medium mb-2">
            Tipo Movimiento
          </label>
          <Dropdown
            value={filtroTipoMovimiento}
            options={tiposMovimiento.map((t) => ({
              label: t.descripcion,
              value: Number(t.id),
            }))}
            onChange={(e) => setFiltroTipoMovimiento(e.value)}
            placeholder="Todos"
            showClear
            className="w-full"
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label className="block text-900 font-medium mb-2">
            Centro de Costo
          </label>
          <Dropdown
            value={filtroCentroCosto}
            options={centrosCosto.map((c) => ({
              label: `${c.Codigo} - ${c.Nombre}`,
              value: Number(c.id),
            }))}
            onChange={(e) => setFiltroCentroCosto(e.value)}
            placeholder="Todos"
            showClear
            filter
            className="w-full"
          />
        </div>
        <div style={{ flex: "0 1 150px" }}>
          <label className="block text-900 font-medium mb-2">Tipo</label>
          <Button
            label={propsFiltroIngresoEgreso.label}
            severity={propsFiltroIngresoEgreso.severity}
            onClick={alternarFiltroIngresoEgreso}
            className="w-full"
          />
        </div>
        <div style={{ flex: "0 1 150px" }}>
          <label className="block text-900 font-medium mb-2">Validación</label>
          <Button
            label={propsFiltroValidacionTesoreria.label}
            severity={propsFiltroValidacionTesoreria.severity}
            onClick={alternarFiltroValidacionTesoreria}
            className="w-full"
          />
        </div>
        <div style={{ flex: "0 1 auto", alignSelf: "flex-end" }}>
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="p-button-outlined"
            onClick={limpiarFiltros}
          />
        </div>
      </div>

      {/* Botón nuevo movimiento */}
      <div style={{ marginBottom: "1rem" }}>
        <Button
          label="Nuevo Movimiento"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleNuevoMovimiento}
          disabled={!otAprobada || entregaARendir?.entregaLiquidada}
        />
      </div>

      {/* Tabla de movimientos */}
      <DataTable
        dataKey="id"
        value={movimientosFiltrados}
        loading={loading}
        selection={selectedMovimientos}
        onSelectionChange={onSelectionChange}
        selectionMode="single"
        emptyMessage="No hay movimientos registrados"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
        onRowClick={(e) => handleEditarMovimiento(e.data)}
        rowClassName={() => "p-selectable-row"}
        showGridlines
        stripedRows
        size="small"
      >
        <Column selectionMode="single" headerStyle={{ width: "3rem" }} />
        <Column
          field="fechaMovimiento"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="tipoMovimientoId"
          header="Tipo"
          body={tipoMovimientoBodyTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="responsableId"
          header="Responsable"
          body={responsableBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="centroCostoId"
          header="Centro Costo"
          body={centroCostoBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="monto"
          header="Monto"
          body={montoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="entidadComercialId"
          header="Proveedor"
          body={entidadComercialBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="validadoTesoreria"
          header="Validado"
          body={validadoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Acciones"
          body={accionesBodyTemplate}
          style={{ minWidth: "120px" }}
        />
      </DataTable>
      {/* Dialog para formulario de movimiento */}
      <Dialog
        visible={showMovimientoForm}
        onHide={() => setShowMovimientoForm(false)}
        header={editingMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
      >
        <DetMovsEntregaRendirOTMantenimientoForm
          movimiento={editingMovimiento}
          entregaARendirOTMantenimientoId={entregaARendir?.id}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales}
          movimientosAsignacionEntregaRendir={
            movimientosAsignacionEntregaRendir
          }
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          onGuardadoExitoso={handleGuardarMovimiento}
          onCancelar={() => setShowMovimientoForm(false)}
        />
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}
