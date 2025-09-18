/**
 * EntregasARendirTemporadaCard.jsx
 *
 * Card para gestionar la entrega a rendir única por temporada de pesca.
 * Muestra el registro único de EntregaARendir y permite gestionar sus movimientos detallados.
 * Se habilita solo cuando TemporadaPesca.temporadaPescaIniciada = true.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import EntregaARendirForm from "./EntregaARendirForm";
import DetMovsEntregaRendirForm from "./DetMovsEntregaRendirForm";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  getAllEntregaARendir,
  crearEntregaARendir,
  actualizarEntregaARendir,
  eliminarEntregaARendir,
} from "../../api/entregaARendir";
import {
  getAllDetMovsEntregaRendir,
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";

const EntregasARendirTemporadaCard = ({
  temporadaPescaId,
  temporadaPescaIniciada = false,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  onDataChange,
}) => {
  const toast = useRef(null);

  // Estados para EntregaARendir
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [responsableEntrega, setResponsableEntrega] = useState(null);
  const [centroCostoEntrega, setCentroCostoEntrega] = useState(null);

  // Estados para DetMovsEntregaRendir
  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] =
    useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para filtros de movimientos
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroIngresoEgreso, setFiltroIngresoEgreso] = useState(null);

  // Cargar entrega a rendir de la temporada
  const cargarEntregaARendir = async () => {
    if (!temporadaPescaId) return;

    try {
      setLoadingEntrega(true);
      const entregasData = await getAllEntregaARendir();
      const entregaTemporada = entregasData.find(
        (entrega) =>
          Number(entrega.temporadaPescaId) === Number(temporadaPescaId)
      );
      setEntregaARendir(entregaTemporada || null);
    } catch (error) {
      console.error("Error al cargar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  // Cargar movimientos de la entrega
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    try {
      setLoadingMovimientos(true);
      const movimientosData = await getAllDetMovsEntregaRendir();
      const movimientosEntrega = movimientosData.filter(
        (mov) => Number(mov.entregaARendirId) === Number(entregaARendir.id)
      );
      setMovimientos(movimientosEntrega);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar movimientos de entrega",
        life: 3000,
      });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  // Efectos
  useEffect(() => {
    cargarEntregaARendir();
  }, [temporadaPescaId]);

  useEffect(() => {
    cargarMovimientos();
  }, [entregaARendir]);

  useEffect(() => {
    obtenerResponsableEntrega();
    obtenerCentroCostoEntrega();
  }, [entregaARendir, personal, centrosCosto]);

  useEffect(() => {
    calcularTotales();
  }, [movimientos, tiposMovimiento]);

  // Handlers para EntregaARendir
  const handleEditarEntrega = () => {
    setShowEntregaForm(true);
  };

  const handleGuardarEntrega = async (data) => {
    try {
      if (entregaARendir) {
        await actualizarEntregaARendir(entregaARendir.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega a rendir actualizada correctamente",
          life: 3000,
        });
      } else {
        const nuevaEntrega = await crearEntregaARendir({
          ...data,
          temporadaPescaId: Number(temporadaPescaId),
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega a rendir creada correctamente",
          life: 3000,
        });
      }

      setShowEntregaForm(false);
      cargarEntregaARendir();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar entrega a rendir",
        life: 3000,
      });
    }
  };

  // Handlers para DetMovsEntregaRendir
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
      message: `¿Está seguro de eliminar el movimiento del ${new Date(
        movimiento.fechaMovimiento
      ).toLocaleDateString()}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await eliminarDetMovsEntregaRendir(movimiento.id);
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
            detail: "Error al eliminar movimiento",
            life: 3000,
          });
        }
      },
    });
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
      cargarMovimientos();
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

  // Templates para las columnas
  const fechaMovimientoTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
  };

  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(rowData.monto);
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
    return tipo ? tipo.descripcion : "N/A";
  };

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId)
    );
    console.log("centro", centro);
    return centro ? centro.Codigo + " - " + centro.Nombre : "N/A";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          tooltip="Editar"
          disabled={!temporadaPescaIniciada}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => handleEliminarMovimiento(rowData)}
          tooltip="Eliminar"
          disabled={!temporadaPescaIniciada}
        />
      </div>
    );
  };

  /**
   * Función para obtener el responsable específico de la entrega a rendir
   * Actualiza el estado responsableEntrega
   */
  const obtenerResponsableEntrega = () => {
    if (!entregaARendir?.respEntregaRendirId || !personal.length) {
      setResponsableEntrega(null);
      return;
    }

    const responsable = personal.find(
      (p) => Number(p.id) === Number(entregaARendir.respEntregaRendirId)
    );

    if (!responsable) {
      setResponsableEntrega(null);
      return;
    }

    const responsableNormalizado = {
      id: Number(responsable.id),
      label: `${responsable.nombres} ${responsable.apellidos}`.trim(),
    };

    setResponsableEntrega(responsableNormalizado);
  };

  /**
   * Función para obtener el centro de costo específico de la entrega a rendir
   * Actualiza el estado centroCostoEntrega
   */
  const obtenerCentroCostoEntrega = () => {
    if (!entregaARendir?.centroCostoId || !centrosCosto.length) {
      setCentroCostoEntrega(null);
      return;
    }

    const centroCosto = centrosCosto.find(
      (c) => Number(c.id) === Number(entregaARendir.centroCostoId)
    );

    if (!centroCosto) {
      setCentroCostoEntrega(null);
      return;
    }

    const centroCostoNormalizado = {
      id: Number(centroCosto.id),
      label: centroCosto.Codigo + " - " + centroCosto.Nombre || "N/A",
    };
    setCentroCostoEntrega(centroCostoNormalizado);
  };

  /**
   * Función para calcular totales automáticamente
   * Calcula asignaciones, gastos y saldo de la entrega a rendir
   */
  const calcularTotales = () => {
    if (!movimientos.length || !tiposMovimiento.length) {
      setTotalAsignacionesEntregasRendir(0);
      setTotalGastosEntregasRendir(0);
      setTotalSaldoEntregasRendir(0);
      return;
    }

    // Calcular total de asignaciones (ingresos)
    const asignaciones = movimientos
      .filter((mov) => {
        const tipoMov = tiposMovimiento.find(
          (t) => Number(t.id) === Number(mov.tipoMovimientoId)
        );
        return tipoMov?.esIngreso === true;
      })
      .reduce((total, mov) => total + Number(mov.monto || 0), 0);

    // Calcular total de gastos (egresos)
    const gastos = movimientos
      .filter((mov) => {
        const tipoMov = tiposMovimiento.find(
          (t) => Number(t.id) === Number(mov.tipoMovimientoId)
        );
        return tipoMov?.esIngreso === false;
      })
      .reduce((total, mov) => total + Number(mov.monto || 0), 0);

    // Calcular saldo
    const saldo = asignaciones - gastos;

    setTotalAsignacionesEntregasRendir(asignaciones);
    setTotalGastosEntregasRendir(gastos);
    setTotalSaldoEntregasRendir(saldo);
  };

  const obtenerMovimientosFiltrados = () => {
    let movimientosFiltrados = movimientos;

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

    return movimientosFiltrados;
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroIngresoEgreso(null);
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

  const obtenerPropiedadesFiltroIngresoEgreso = () => {
    if (filtroIngresoEgreso === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroIngresoEgreso === true) {
      return { label: "Ingresos", severity: "success" };
    } else {
      return { label: "Egresos", severity: "danger" };
    }
  };

  // Renderizado condicional si la temporada no está iniciada
  if (!temporadaPescaIniciada) {
    return (
      <Card title="Entregas a Rendir" className="mb-4">
        <Message
          severity="info"
          text="La temporada de pesca debe estar iniciada para gestionar entregas a rendir"
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        {/* Sección de EntregaARendir */}
        <div className="mb-4">
          <h2 className="text-900 font-medium mb-3">
            {entregaARendir
              ? `Entrega a Rendir ID: ${entregaARendir.id}`
              : "Entrega a Rendir"}
          </h2>
          {entregaARendir ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Responsable
                </label>
                <Dropdown
                  value={responsableEntrega?.id}
                  options={responsableEntrega ? [responsableEntrega] : []}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Sin responsable asignado"
                  disabled
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Estado
                </label>
                <Button
                  label={
                    entregaARendir.entregaLiquidada
                      ? "TEMPORADA LIQUIDADA"
                      : "PENDIENTE LIQUIDACION"
                  }
                  severity={
                    entregaARendir.entregaLiquidada ? "success" : "danger"
                  }
                  className="w-full"
                  disabled
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha Liquidación
                </label>
                <InputText
                  value={
                    entregaARendir.fechaLiquidacion
                      ? new Date(
                          entregaARendir.fechaLiquidacion
                        ).toLocaleDateString("es-PE")
                      : "N/A"
                  }
                  readOnly
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Centro de Costo
                </label>
                <Dropdown
                  value={centroCostoEntrega?.id}
                  options={centroCostoEntrega ? [centroCostoEntrega] : []}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Sin centro de costo asignado"
                  disabled
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Message
                severity="warn"
                text="No se ha creado la entrega a rendir para esta temporada"
              />
              <Button
                label="Crear Entrega"
                icon="pi pi-plus"
                className="mt-3"
                onClick={() => setShowEntregaForm(true)}
              />
            </div>
          )}
        </div>

        {entregaARendir && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 20,
              padding: 15,
              backgroundColor: "#d4edda",
              borderRadius: 8,
              border: "1px solid #c3e6cb",
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Total Asignaciones
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalAsignacionesEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: "#155724",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Total Gastos
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalGastosEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: "#155724",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Saldo Total
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalSaldoEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: totalSaldoEntregasRendir >= 0 ? "#155724" : "#721c24",
                }}
              />
            </div>
          </div>
        )}

        <Divider />

        {/* Sección de DetMovsEntregaRendir */}
        {entregaARendir && (
          <div className="mt-4">
            <DataTable
              value={obtenerMovimientosFiltrados()}
              selection={selectedMovimientos}
              onSelectionChange={(e) => setSelectedMovimientos(e.value)}
              dataKey="id"
              loading={loadingMovimientos}
              paginator
              rows={5}
              rowsPerPageOptions={[5, 10, 25]}
              className="p-datatable-sm"
              emptyMessage="No hay movimientos registrados"
              style={{ fontSize: getResponsiveFontSize() }}
              header={
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 18,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h2 className="text-900 font-medium mb-3">
                        Detalle de Movimientos
                      </h2>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Button
                        label="Nuevo Movimiento"
                        icon="pi pi-plus"
                        className="p-button-success"
                        severity="success"
                        onClick={handleNuevoMovimiento}
                        disabled={entregaARendir.entregaLiquidada}
                        type="button"
                      />
                    </div>
                    <div style={{ flex: 1}}>
                      <Button
                        label={obtenerPropiedadesFiltroIngresoEgreso().label}
                        icon="pi pi-filter"
                        className="p-button-sm"
                        onClick={alternarFiltroIngresoEgreso}
                        severity={obtenerPropiedadesFiltroIngresoEgreso().severity}
                        type="button"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Button
                        label="Limpiar"
                        icon="pi pi-filter-slash"
                        className="p-button-sm p-button-outlined"
                        onClick={limpiarFiltros}
                        type="button"
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
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ flex: 1}}>
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
                    <div style={{ flex: 1}}>
                      <Dropdown
                        value={filtroCentroCosto}
                        options={centrosCosto.map(centro => ({
                          ...centro,
                          displayLabel: centro.Codigo + " - " + centro.Nombre
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
              <Column
                field="monto"
                header="Monto"
                body={montoTemplate}
                sortable
              />
              <Column
                field="centroCostoId"
                header="Centro de Costo"
                body={centroCostoTemplate}
                sortable
              />
              <Column field="descripcion" header="Descripción" sortable />
              <Column
                header="Acciones"
                body={accionesTemplate}
                headerStyle={{ width: "8rem", textAlign: "center" }}
                bodyStyle={{ textAlign: "center" }}
              />
            </DataTable>
          </div>
        )}
      </Card>
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
};

export default EntregasARendirTemporadaCard;
