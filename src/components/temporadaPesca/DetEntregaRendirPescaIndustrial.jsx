// src/components/temporadaPesca/DetEntregaRendirPescaIndustrial.jsx
// Componente autónomo para gestión de detalle de entregas a rendir en pesca industrial
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import DetMovsEntregaRendirForm from "./DetMovsEntregaRendirForm";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { actualizarEntregaARendir } from "../../api/entregaARendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function DetEntregaRendirPescaIndustrial({
  // Props de datos
  entregaARendir,
  movimientos = [],
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [], // Nueva prop
  monedas = [], // ← AGREGAR ESTA LÍNEA
  tiposDocumento = [],
  productos = [], // Nueva prop para productos (gastos)

  // Props de estado
  temporadaPescaIniciada = false,
  loading = false,
  selectedMovimientos = [],

  // Props de callbacks
  onSelectionChange,
  onDataChange,
}) {
  // Estados locales para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroIngresoEgreso, setFiltroIngresoEgreso] = useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);

  // Estados para el dialog
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);

  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

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

  // Handlers internos
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
        await actualizarDetMovsEntregaRendir(editingMovimiento.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetMovsEntregaRendir(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
      }

      setShowMovimientoForm(false);
      setEditingMovimiento(null);
      onDataChange?.(); // Notificar al padre que recargue datos
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
        movimiento.fechaMovimiento
      ).toLocaleDateString()}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarDetMovsEntregaRendir(movimiento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          onDataChange?.(); // Notificar al padre que recargue datos
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

  const handleProcesarLiquidacion = () => {
    confirmDialog({
      message:
        "¿Está seguro de procesar la liquidación? Esta acción no se puede deshacer y bloqueará todas las modificaciones futuras.",
      header: "Confirmar Procesamiento de Liquidación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const fechaActual = new Date();

          // Actualizar EntregaARendir - SOLO enviar campos escalares, NO relaciones
          const entregaActualizada = {
            temporadaPescaId: entregaARendir.temporadaPescaId,
            respEntregaRendirId: entregaARendir.respEntregaRendirId,
            centroCostoId: entregaARendir.centroCostoId,
            respLiquidacionId: usuario?.personalId || null,
            urlLiquidacionPdf: entregaARendir.urlLiquidacionPdf,
            entregaLiquidada: true,
            fechaLiquidacion: fechaActual,
            fechaCreacion: entregaARendir.fechaCreacion,
            fechaActualizacion: fechaActual,
          };

          await actualizarEntregaARendir(entregaARendir.id, entregaActualizada);

          // Actualizar todos los movimientos DetMovsEntregaRendir - SOLO campos escalares
          const promesasActualizacion = movimientos.map((movimiento) => {
            const movimientoActualizado = {
              entregaARendirId: movimiento.entregaARendirId,
              responsableId: movimiento.responsableId,
              fechaMovimiento: movimiento.fechaMovimiento,
              tipoMovimientoId: movimiento.tipoMovimientoId,
              productoId: movimiento.productoId,
              monto: movimiento.monto,
              descripcion: movimiento.descripcion,
              creadoEn: movimiento.creadoEn,
              actualizadoEn: fechaActual,
              centroCostoId: movimiento.centroCostoId,
              urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento,
              validadoTesoreria: true,
              fechaValidacionTesoreria: fechaActual,
              operacionSinFactura: movimiento.operacionSinFactura,
              fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja,
              operacionMovCajaId: movimiento.operacionMovCajaId,
              moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId,
              entidadComercialId: movimiento.entidadComercialId,
              monedaId: movimiento.monedaId,
              urlComprobanteOperacionMovCaja: movimiento.urlComprobanteOperacionMovCaja,
              tipoDocumentoId: movimiento.tipoDocumentoId,
              numeroSerieComprobante: movimiento.numeroSerieComprobante,
              numeroCorrelativoComprobante: movimiento.numeroCorrelativoComprobante,
            };
            return actualizarDetMovsEntregaRendir(
              movimiento.id,
              movimientoActualizado
            );
          });

          await Promise.all(promesasActualizacion);

          toast.current?.show({
            severity: "success",
            summary: "Liquidación Procesada",
            detail: "La entrega a rendir ha sido liquidada exitosamente",
            life: 5000,
          });

          onDataChange?.(); // Notificar al padre que recargue datos
        } catch (error) {
          console.error("Error al procesar liquidación:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al procesar la liquidación",
            life: 5000,
          });
        }
      },
    });
  };

  // Templates para las columnas
  const fechaMovimientoTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
  };

  const montoTemplate = (rowData) => {
    // Buscar la moneda correspondiente
    const moneda = monedas.find((m) => Number(m.id) === Number(rowData.monedaId));
    
    // Si no hay moneda, usar PEN por defecto
    const codigoMoneda = moneda?.codigoSunat || "PEN";
    const simboloMoneda = moneda?.simbolo || "S/.";
    
    // Definir color de fondo según la moneda
    let backgroundColor = "#fff9c4"; // Amarillo claro por defecto (SOLES)
    if (codigoMoneda === "USD") {
      backgroundColor = "#c8e6c9"; // Verde claro (DÓLARES)
    } else if (codigoMoneda !== "PEN") {
      backgroundColor = "#b3e5fc"; // Celeste claro (OTRAS MONEDAS)
    }
    
    // Formatear el monto con la moneda correcta
    const montoFormateado = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: codigoMoneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData.monto);
    
    return (
      <div
        style={{
          backgroundColor: backgroundColor,
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "bold",
          textAlign: "right",
        }}
      >
        {montoFormateado}
      </div>
    );
  };

  const responsableTemplate = (rowData) => {
    const responsable = personal.find(
      (p) => Number(p.id) === Number(rowData.responsableId)
    );
    return responsable
      ? responsable.nombreCompleto ||
          `${responsable.nombres} ${responsable.apellidos}`
      : "N/A";
  };

  const tipoMovimientoTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId)
    );
    return tipo ? tipo.nombre : "N/A";
  };

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId)
    );
    return centro ? centro.Codigo + " - " + centro.Nombre : "N/A";
  };

  // Template para mostrar entidad comercial
  const entidadComercialTemplate = (rowData) => {
    if (!rowData.entidadComercialId) return "N/A";

    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId)
    );
    return entidad ? entidad.razonSocial : "N/A";
  };

  const validacionTesoreriaTemplate = (rowData) => {
    return (
      <div className="text-center">
        <Badge
          value={rowData.validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
          severity={rowData.validadoTesoreria ? "success" : "danger"}
        />
      </div>
    );
  };

  const fechaValidacionTesoreriaTemplate = (rowData) => {
    return rowData.fechaValidacionTesoreria
      ? new Date(rowData.fechaValidacionTesoreria).toLocaleDateString("es-PE")
      : "N/A";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          aria-label="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminarMovimiento(rowData)}
          aria-label="Eliminar"
        />
      </div>
    );
  };

  if (!entregaARendir) {
    return null;
  }

  return (
    <>
      <div className="mt-4">
        <DataTable
          value={obtenerMovimientosFiltrados()}
          selection={selectedMovimientos}
          onSelectionChange={onSelectionChange}
          selectionMode="single"
          onRowClick={(e) => handleEditarMovimiento(e.data)}
          dataKey="id"
          loading={loading}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No hay movimientos registrados"
          style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
          rowClassName={() => "p-selectable-row"}
          header={
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "end",
                  marginTop: 18,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3>Detalle Entrega a Rendir</h3>
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    severity="success"
                    onClick={handleNuevoMovimiento}
                    disabled={
                      !temporadaPescaIniciada ||
                      !entregaARendir ||
                      entregaARendir?.entregaLiquidada
                    }
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Ingreso/Egreso</label>
                  <Button
                    label={obtenerPropiedadesFiltroIngresoEgreso().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroIngresoEgreso}
                    severity={obtenerPropiedadesFiltroIngresoEgreso().severity}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Validación Tesorería</label>
                  <Button
                    label={obtenerPropiedadesFiltroValidacionTesoreria().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroValidacionTesoreria}
                    severity={
                      obtenerPropiedadesFiltroValidacionTesoreria().severity
                    }
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined"
                    onClick={limpiarFiltros}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Procesar Liquidación"
                    icon="pi pi-check"
                    className="p-button-danger"
                    severity="danger"
                    onClick={handleProcesarLiquidacion}
                    type="button"
                    disabled={entregaARendir.entregaLiquidada}
                    raised
                  />
                </div>
              </div>

              {/* Sección de Filtros */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroTipoMovimiento}
                    options={tiposMovimiento}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Tipo de Movimiento"
                    onChange={(e) => setFiltroTipoMovimiento(e.value)}
                    className="w-full"
                    showClear
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCentroCosto}
                    options={centrosCosto.map((centro) => ({
                      ...centro,
                      displayLabel: centro.Codigo + " - " + centro.Nombre,
                    }))}
                    optionLabel="displayLabel"
                    optionValue="id"
                    placeholder="Filtrar por Centro de Costo"
                    onChange={(e) => setFiltroCentroCosto(e.value)}
                    className="w-full"
                    showClear
                  />
                </div>
              </div>
            </div>
          }
        >
          <Column
            selectionMode="single"
            headerStyle={{ width: "3rem" }}
          ></Column>
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={fechaMovimientoTemplate}
            sortable
          />
          <Column
            field="responsableId"
            header="Responsable"
            body={responsableTemplate}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Tipo"
            body={tipoMovimientoTemplate}
            sortable
          />
          <Column field="monto" header="Monto" body={montoTemplate} sortable />
          <Column
            field="centroCostoId"
            header="Centro de Costo"
            body={centroCostoTemplate}
            sortable
          />
          <Column
            field="validadoTesoreria"
            header="Validación Tesorería"
            body={validacionTesoreriaTemplate}
            sortable
          />
          <Column
            field="fechaValidacionTesoreria"
            header="Fecha Validación"
            body={fechaValidacionTesoreriaTemplate}
            sortable
          />
          <Column field="descripcion" header="Descripción" sortable />
          <Column
            field="entidadComercialId"
            header="Entidad Comercial"
            body={entidadComercialTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            headerStyle={{ width: "8rem", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Dialog para DetMovsEntregaRendir */}
      <Dialog
        visible={showMovimientoForm}
        style={{ width: "1300px" }}
        header={editingMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
        modal
        className="p-fluid"
        onHide={() => {
          setShowMovimientoForm(false);
          setEditingMovimiento(null);
        }}
      >
        <DetMovsEntregaRendirForm
          movimiento={editingMovimiento}
          entregaARendirId={entregaARendir?.id}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales} // Nueva prop
          monedas={monedas} // ← AGREGAR ESTA LÍNEA
          tiposDocumento={tiposDocumento}
          productos={productos} // Nueva prop para productos (gastos)
          onGuardadoExitoso={handleGuardarMovimiento}
          onCancelar={() => {
            setShowMovimientoForm(false);
            setEditingMovimiento(null);
          }}
        />
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}
