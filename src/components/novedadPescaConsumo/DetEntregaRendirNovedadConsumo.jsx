/**
 * DetEntregaRendirNovedadConsumo.jsx
 *
 * Componente para gestión de detalle de entregas a rendir en novedad pesca consumo.
 * Maneja los movimientos DetMovsEntRendirPescaConsumo asociados a una EntregaARendirPescaConsumo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import DetMovsEntRendirNovedadForm from "./DetMovsEntRendirNovedadForm";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  getAllDetMovsEntRendirPescaConsumo,
  crearDetMovsEntRendirPescaConsumo,
  actualizarDetMovsEntRendirPescaConsumo,
  eliminarDetMovsEntRendirPescaConsumo,
} from "../../api/detMovsEntRendirPescaConsumo";

export default function DetEntregaRendirNovedadConsumo({
  entregaARendirPescaConsumoId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  onDataChange,
}) {
  // Estados locales
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);

  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroIngresoEgreso, setFiltroIngresoEgreso] = useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);

  // Estados para el dialog
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);

  const toast = useRef(null);

  // Cargar movimientos
  useEffect(() => {
    if (entregaARendirPescaConsumoId) {
      cargarMovimientos();
    }
  }, [entregaARendirPescaConsumoId]);

  const cargarMovimientos = async () => {
    if (!entregaARendirPescaConsumoId) return;

    try {
      setLoading(true);
      const movimientosData = await getAllDetMovsEntRendirPescaConsumo();
      const movimientosFiltrados = movimientosData.filter(
        (mov) =>
          Number(mov.entregaARendirPescaConsumoId) ===
          Number(entregaARendirPescaConsumoId)
      );
      setMovimientos(movimientosFiltrados);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los movimientos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener movimientos filtrados
  const obtenerMovimientosFiltrados = () => {
    let movimientosFiltrados = [...movimientos];

    if (filtroTipoMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.tipoMovimientoId) === Number(filtroTipoMovimiento)
      );
    }

    if (filtroCentroCosto) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.centroCostoId) === Number(filtroCentroCosto)
      );
    }

    if (filtroIngresoEgreso !== null) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        const tipoMov = tiposMovimiento.find(
          (t) => Number(t.id) === Number(mov.tipoMovimientoId)
        );
        return tipoMov?.esIngreso === filtroIngresoEgreso;
      });
    }

    if (filtroValidacionTesoreria !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.validadoTesoreria === filtroValidacionTesoreria
      );
    }

    return movimientosFiltrados;
  };

  // Funciones para filtros
  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroIngresoEgreso(null);
    setFiltroValidacionTesoreria(null);
  };

  const alternarFiltroIngresoEgreso = () => {
    if (filtroIngresoEgreso === null) {
      setFiltroIngresoEgreso(true); // Ingresos
    } else if (filtroIngresoEgreso === true) {
      setFiltroIngresoEgreso(false); // Egresos
    } else {
      setFiltroIngresoEgreso(null); // Todos
    }
  };

  const alternarFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      setFiltroValidacionTesoreria(true); // Validados
    } else if (filtroValidacionTesoreria === true) {
      setFiltroValidacionTesoreria(false); // No validados
    } else {
      setFiltroValidacionTesoreria(null); // Todos
    }
  };

  // Handlers CRUD
  const handleNuevoMovimiento = () => {
    setEditingMovimiento(null);
    setShowMovimientoForm(true);
  };

  const handleEditarMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setShowMovimientoForm(true);
  };

  const handleEliminarMovimiento = (movimiento) => {
    confirmDialog({
      message: "¿Está seguro de eliminar este movimiento?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await eliminarDetMovsEntRendirPescaConsumo(movimiento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          cargarMovimientos();
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar movimiento:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar el movimiento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleGuardarMovimiento = async (data) => {
    try {
      const movimientoData = {
        ...data,
        entregaARendirPescaConsumoId: Number(entregaARendirPescaConsumoId),
      };

      if (editingMovimiento) {
        await actualizarDetMovsEntRendirPescaConsumo(
          editingMovimiento.id,
          movimientoData
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetMovsEntRendirPescaConsumo(movimientoData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
      }

      setShowMovimientoForm(false);
      cargarMovimientos();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el movimiento",
        life: 3000,
      });
    }
  };

  // Templates para columnas
  const tipoMovimientoTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId)
    );
    return tipo ? tipo.descripcion : "-";
  };

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId)
    );
    return centro ? `${centro.Codigo} - ${centro.Nombre}` : "-";
  };

  const personalTemplate = (rowData) => {
    const persona = personal.find(
      (p) => Number(p.id) === Number(rowData.personalId)
    );
    return persona ? `${persona.nombres} ${persona.apellidos}` : "-";
  };

  const entidadComercialTemplate = (rowData) => {
    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId)
    );
    return entidad ? entidad.razonSocial : "-";
  };

  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(rowData.monto || 0);
  };

  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field.field];
    return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-";
  };

  const ingresoEgresoTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId)
    );
    if (!tipo) return "-";

    return (
      <Tag
        value={tipo.esIngreso ? "INGRESO" : "EGRESO"}
        severity={tipo.esIngreso ? "success" : "danger"}
      />
    );
  };

  const validacionTesoreriaTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
        severity={rowData.validadoTesoreria ? "success" : "warning"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          tooltip="Editar movimiento"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => handleEliminarMovimiento(rowData)}
          tooltip="Eliminar movimiento"
        />
      </div>
    );
  };

  // Preparar opciones para filtros
  const tipoMovimientoOptions = tiposMovimiento.map((t) => ({
    label: t.descripcion,
    value: Number(t.id),
  }));

  const centroCostoOptions = centrosCosto.map((c) => ({
    label: `${c.Codigo} - ${c.Nombre}`,
    value: Number(c.id),
  }));

  const movimientosFiltrados = obtenerMovimientosFiltrados();

  return (
    <>
      <div className="card">
        <DataTable
          value={movimientosFiltrados}
          loading={loading}
          selection={selectedMovimientos}
          onSelectionChange={(e) => setSelectedMovimientos(e.value)}
          emptyMessage="No hay movimientos registrados"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
          header={
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3>Detalle Entrega a Rendir</h3>
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    onClick={handleNuevoMovimiento}
                    className="p-button-success"
                    severity="success"
                    type="button"
                    raised
                    size="small"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label={
                      filtroIngresoEgreso === null
                        ? "Todos"
                        : filtroIngresoEgreso
                        ? "Ingresos"
                        : "Egresos"
                    }
                    icon="pi pi-filter"
                    onClick={alternarFiltroIngresoEgreso}
                    className="p-button-outlined"
                    type="button"
                    size="small"
                    raised
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label={
                      filtroValidacionTesoreria === null
                        ? "Todos"
                        : filtroValidacionTesoreria
                        ? "Validados"
                        : "Pendientes"
                    }
                    icon="pi pi-check-circle"
                    className="p-button-outlined p-button-sm"
                    onClick={alternarFiltroValidacionTesoreria}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroTipoMovimiento}
                    options={tipoMovimientoOptions}
                    onChange={(e) => setFiltroTipoMovimiento(e.value)}
                    placeholder="Filtrar por tipo"
                    showClear
                    className="w-12rem"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCentroCosto}
                    options={centroCostoOptions}
                    onChange={(e) => setFiltroCentroCosto(e.value)}
                    placeholder="Filtrar por centro"
                    showClear
                    className="w-12rem"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-times"
                    className="p-button-text p-button-sm"
                    onClick={limpiarFiltros}
                  />
                </div>
              </div>
            </div>
          }
        >
          <Column selectionMode="multiple" style={{ width: "3rem" }} />
          <Column field="id" header="ID" style={{ width: "80px" }} sortable />
          <Column
            field="tipoMovimientoId"
            header="Tipo"
            body={tipoMovimientoTemplate}
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
            field="monto"
            header="Monto"
            body={montoTemplate}
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="tipoMovimientoId"
            header="Tipo Mov."
            body={ingresoEgresoTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="centroCostoId"
            header="Centro Costo"
            body={centroCostoTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="personalId"
            header="Personal"
            body={personalTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={(rowData) =>
              fechaTemplate(rowData, { field: "fechaMovimiento" })
            }
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="validadoTesoreria"
            header="Validación"
            body={validacionTesoreriaTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {/* Dialog para formulario de movimiento */}
      <Dialog
        visible={showMovimientoForm}
        style={{ width: "800px" }}
        header={editingMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
        modal
        onHide={() => setShowMovimientoForm(false)}
        className="p-fluid"
      >
        <DetMovsEntRendirNovedadForm
          movimiento={editingMovimiento}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales}
          onSave={handleGuardarMovimiento}
          onCancel={() => setShowMovimientoForm(false)}
        />
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}
