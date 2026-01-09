/**
 * EntregaARendirMovAlmacenCard.jsx
 *
 * Card para gestionar la entrega a rendir única por movimiento de almacén.
 * Muestra el registro único de EntregaARendirMovAlmacen y permite gestionar sus movimientos detallados.
 * Se habilita solo cuando existe un movimiento de almacén guardado con responsableId válido.
 * Patrón replicado EXACTAMENTE de EntregaARendirContratoCard.jsx
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import DetEntregaRendirMovAlmacen from "./DetEntregaRendirMovAlmacen";
import { formatearNumero } from "../../utils/utils";
import {
  getAllEntregaARendirMovAlmacen,
  crearEntregaARendirMovAlmacen,
  actualizarEntregaARendirMovAlmacen,
  eliminarEntregaARendirMovAlmacen,
} from "../../api/entregaARendirMovAlmacen";
import { getAllDetMovsEntregaRendirMovAlmacen } from "../../api/detMovsEntregaRendirMovAlmacen";
import { getProductos } from "../../api/producto";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function EntregaARendirMovAlmacenCard({
  movimientoAlmacen,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  puedeEditar = true,
  onCountChange,
  permisos = {},
  readOnly = false,
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados para EntregaARendirMovAlmacen (única)
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [verificandoEntrega, setVerificandoEntrega] = useState(true);

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] = useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para DetMovsEntregaRendirMovAlmacen
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Estado para productos (gastos)
  const [productos, setProductos] = useState([]);

  // Estado para entidades comerciales filtradas por empresa
  const [entidadesComercialesFiltradas, setEntidadesComercialesFiltradas] = useState([]);

  // Estados para edición de la entrega
  const [responsableEditado, setResponsableEditado] = useState(null);
  const [centroCostoEditado, setCentroCostoEditado] = useState(null);
  const [hayCambios, setHayCambios] = useState(false);

  // Verificar y cargar entrega a rendir cuando cambie el movimiento de almacén
  useEffect(() => {
    if (movimientoAlmacen?.id) {
      verificarYCargarEntrega();
    } else {
      setEntregaARendir(null);
      setVerificandoEntrega(false);
    }
  }, [movimientoAlmacen?.id]);

  // Cargar movimientos cuando cambie la entrega
  useEffect(() => {
    if (entregaARendir?.id) {
      cargarMovimientos();
    } else {
      setMovimientos([]);
    }
  }, [entregaARendir?.id]);

  // Notificar cambios en el contador
  useEffect(() => {
    if (onCountChange) {
      onCountChange(entregaARendir ? 1 : 0);
    }
  }, [entregaARendir, onCountChange]);

  // Cargar productos cuando cambie el movimiento de almacén
  useEffect(() => {
    if (movimientoAlmacen?.empresaId) {
      cargarProductos();
    }
  }, [movimientoAlmacen?.empresaId]);

  // Filtrar entidades comerciales por empresaId
  useEffect(() => {
    if (movimientoAlmacen?.empresaId && entidadesComerciales.length > 0) {
      const entidadesFiltradas = entidadesComerciales.filter(
        (e) => Number(e.empresaId) === Number(movimientoAlmacen.empresaId)
      );
      setEntidadesComercialesFiltradas(entidadesFiltradas);
    } else {
      setEntidadesComercialesFiltradas([]);
    }
  }, [movimientoAlmacen?.empresaId, entidadesComerciales]);

  /**
   * Cargar productos filtrados por familias de gastos y empresaId
   */
  const cargarProductos = async () => {
    try {
      const familiasGastosIds = [2, 3, 4, 6, 7];
      const productosData = await getProductos();
      const productosFiltrados = productosData.filter(
        (p) =>
          familiasGastosIds.includes(Number(p.familiaId)) &&
          Number(p.empresaId) === Number(movimientoAlmacen?.empresaId)
      );
      setProductos(productosFiltrados);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los productos",
        life: 3000,
      });
    }
  };

  /**
   * Verificar si existe una entrega a rendir para este movimiento de almacén
   */
  const verificarYCargarEntrega = async () => {
    setVerificandoEntrega(true);
    try {
      const data = await getAllEntregaARendirMovAlmacen();
      const entregaExistente = data.find(
        (e) => Number(e.movimientoAlmacenId) === Number(movimientoAlmacen.id)
      );

      if (entregaExistente) {
        setEntregaARendir(entregaExistente);
        setResponsableEditado(Number(entregaExistente.respEntregaRendirId));
        setCentroCostoEditado(Number(entregaExistente.centroCostoId));
        setHayCambios(false);
      } else {
        preguntarCrearEntrega();
      }
    } catch (error) {
      console.error("Error al verificar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo verificar la entrega a rendir",
        life: 3000,
      });
    } finally {
      setVerificandoEntrega(false);
    }
  };

  /**
   * Preguntar al usuario si desea crear una entrega a rendir
   */
  const preguntarCrearEntrega = () => {
    confirmDialog({
      message: "No existe una entrega a rendir para este movimiento de almacén. ¿Desea crear una?",
      header: "Crear Entrega a Rendir",
      icon: "pi pi-question-circle",
      acceptLabel: "Sí, Crear",
      rejectLabel: "No",
      accept: () => crearEntregaAutomatica(),
      reject: () => {
        setEntregaARendir(null);
      },
    });
  };

  /**
   * Crear entrega a rendir automáticamente
   */
  const crearEntregaAutomatica = async () => {
    if (!movimientoAlmacen.personalRespAlmacen || Number(movimientoAlmacen.personalRespAlmacen) <= 0) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El movimiento de almacén debe tener un Responsable asignado para crear una entrega a rendir",
        life: 5000,
      });
      return;
    }

    setLoadingEntrega(true);
    try {
      const dataToCreate = {
        movimientoAlmacenId: Number(movimientoAlmacen.id),
        respEntregaRendirId: Number(movimientoAlmacen.personalRespAlmacen),
        centroCostoId: 1, // Centro de costo por defecto para almacén
        entregaLiquidada: false,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      const nuevaEntrega = await crearEntregaARendirMovAlmacen(dataToCreate);

      const entregaNormalizada = {
        ...nuevaEntrega,
        id: Number(nuevaEntrega.id),
        movimientoAlmacenId: Number(nuevaEntrega.movimientoAlmacenId),
        respEntregaRendirId: Number(nuevaEntrega.respEntregaRendirId),
        centroCostoId: Number(nuevaEntrega.centroCostoId),
        creadoPor: nuevaEntrega.creadoPor ? Number(nuevaEntrega.creadoPor) : null,
        actualizadoPor: nuevaEntrega.actualizadoPor ? Number(nuevaEntrega.actualizadoPor) : null,
      };

      setEntregaARendir(entregaNormalizada);
      setResponsableEditado(Number(entregaNormalizada.respEntregaRendirId));
      setCentroCostoEditado(Number(entregaNormalizada.centroCostoId));
      setHayCambios(false);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega a rendir creada correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al crear entrega automática:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "Error al crear la entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  /**
   * Cargar movimientos de la entrega a rendir
   */
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    setLoadingMovimientos(true);
    try {
      const data = await getAllDetMovsEntregaRendirMovAlmacen();
      const movsFiltrados = data.filter(
        (m) => Number(m.entregaARendirMovAlmacenId) === Number(entregaARendir.id)
      );
      setMovimientos(movsFiltrados);
      calcularTotales(movsFiltrados);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los movimientos",
        life: 3000,
      });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  /**
   * Calcular totales de asignaciones, gastos y saldo
   */
  const calcularTotales = (movs) => {
    let totalAsignaciones = 0;
    let totalGastos = 0;

    movs.forEach((mov) => {
      const monto = Number(mov.monto) || 0;
      const tipoMov = tiposMovimiento.find((t) => Number(t.id) === Number(mov.tipoMovimientoId));
      
      if (tipoMov?.esIngreso === true) {
        totalAsignaciones += monto;
      } else if (tipoMov?.esIngreso === false) {
        totalGastos += monto;
      }
    });

    const saldo = totalAsignaciones - totalGastos;

    setTotalAsignacionesEntregasRendir(totalAsignaciones);
    setTotalGastosEntregasRendir(totalGastos);
    setTotalSaldoEntregasRendir(saldo);
  };

  /**
   * Manejar cambios en el responsable
   */
  const handleResponsableChange = (value) => {
    setResponsableEditado(value);
    setHayCambios(
      Number(value) !== Number(entregaARendir.respEntregaRendirId) ||
        Number(centroCostoEditado) !== Number(entregaARendir.centroCostoId)
    );
  };

  /**
   * Manejar cambios en el centro de costo
   */
  const handleCentroCostoChange = (value) => {
    setCentroCostoEditado(value);
    setHayCambios(
      Number(responsableEditado) !== Number(entregaARendir.respEntregaRendirId) ||
        Number(value) !== Number(entregaARendir.centroCostoId)
    );
  };

  /**
   * Guardar cambios en la entrega a rendir
   */
  const handleGuardarCambios = async () => {
    setLoadingEntrega(true);
    try {
      const dataToUpdate = {
        movimientoAlmacenId: Number(entregaARendir.movimientoAlmacenId),
        respEntregaRendirId: Number(responsableEditado),
        centroCostoId: Number(centroCostoEditado),
        entregaLiquidada: entregaARendir.entregaLiquidada,
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      const entregaActualizada = await actualizarEntregaARendirMovAlmacen(
        entregaARendir.id,
        dataToUpdate
      );

      const entregaNormalizada = {
        ...entregaActualizada,
        id: Number(entregaActualizada.id),
        movimientoAlmacenId: Number(entregaActualizada.movimientoAlmacenId),
        respEntregaRendirId: Number(entregaActualizada.respEntregaRendirId),
        centroCostoId: Number(entregaActualizada.centroCostoId),
        creadoPor: entregaActualizada.creadoPor ? Number(entregaActualizada.creadoPor) : null,
        actualizadoPor: entregaActualizada.actualizadoPor ? Number(entregaActualizada.actualizadoPor) : null,
      };

      setEntregaARendir(entregaNormalizada);
      setResponsableEditado(Number(entregaNormalizada.respEntregaRendirId));
      setCentroCostoEditado(Number(entregaNormalizada.centroCostoId));
      setHayCambios(false);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega a rendir actualizada correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al actualizar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "Error al actualizar la entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  /**
   * Cancelar cambios y restaurar valores originales
   */
  const handleCancelarCambios = () => {
    if (entregaARendir) {
      setResponsableEditado(Number(entregaARendir.respEntregaRendirId));
      setCentroCostoEditado(Number(entregaARendir.centroCostoId));
      setHayCambios(false);
    }
  };

  /**
   * Eliminar entrega a rendir
   */
  const handleEliminarEntrega = () => {
    confirmDialog({
      message: "¿Está seguro de eliminar esta entrega a rendir? Esta acción no se puede deshacer.",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setLoadingEntrega(true);
        try {
          await eliminarEntregaARendirMovAlmacen(entregaARendir.id);
          setEntregaARendir(null);
          setMovimientos([]);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Entrega a rendir eliminada correctamente",
            life: 3000,
          });
        } catch (error) {
          console.error("Error al eliminar entrega:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.mensaje || "Error al eliminar la entrega a rendir",
            life: 3000,
          });
        } finally {
          setLoadingEntrega(false);
        }
      },
    });
  };

  // Opciones para dropdowns
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}`,
    value: Number(cc.id),
  }));

  // Renderizado condicional
  if (!movimientoAlmacen || !movimientoAlmacen.id) {
    return (
      <Panel header="Entrega a Rendir" className="mt-4">
        <Message
          severity="info"
          text="Debe guardar el movimiento de almacén antes de gestionar la entrega a rendir"
        />
      </Panel>
    );
  }

  if (verificandoEntrega) {
    return (
      <Panel header="Entrega a Rendir" className="mt-4">
        <div className="flex align-items-center justify-content-center p-4">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
          <span className="ml-2">Verificando entrega a rendir...</span>
        </div>
      </Panel>
    );
  }

  if (!entregaARendir) {
    return (
      <Panel header="Entrega a Rendir" className="mt-4">
        <Message
          severity="warn"
          text="No existe una entrega a rendir para este movimiento de almacén"
        />
        <div className="mt-3">
          <Button
            label="Crear Entrega a Rendir"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={crearEntregaAutomatica}
            loading={loadingEntrega}
            disabled={!permisos.puedeCrear}
            tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : ""}
          />
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel header="Entrega a Rendir" className="mt-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Responsable
            </label>
            <Dropdown
              value={responsableEditado}
              options={personal.map((p) => ({
                ...p,
                label:
                  p.nombreCompleto || `${p.nombres || ""} ${p.apellidos || ""}`,
                value: Number(p.id),
              }))}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => handleResponsableChange(e.value)}
              placeholder="Seleccione un responsable"
              filter
              showClear
              className="w-full"
              style={{ fontWeight: "bold" }}
              disabled={!puedeEditar || entregaARendir.entregaLiquidada}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label className="block text-900 font-medium mb-2">Estado</label>
            <Button
              label={
                entregaARendir.entregaLiquidada
                  ? "LIQUIDADA"
                  : movimientos.length > 0 && totalSaldoEntregasRendir === 0
                  ? "LISTA PARA LIQUIDAR"
                  : "PENDIENTE"
              }
              severity={
                entregaARendir.entregaLiquidada
                  ? "success"
                  : movimientos.length > 0 && totalSaldoEntregasRendir === 0
                  ? "info"
                  : "danger"
              }
              className="w-full"
              disabled
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1}}>
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
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label className="block text-900 font-medium mb-2">
              Centro de Costo
            </label>
            <Dropdown
              value={centroCostoEditado}
              options={centrosCosto.map((c) => ({
                ...c,
                label: `${c.Codigo} - ${c.Nombre}`,
                value: Number(c.id),
              }))}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => handleCentroCostoChange(e.value)}
              placeholder="Seleccione un centro de costo"
              filter
              showClear
              className="w-full"
              style={{ fontWeight: "bold" }}
              disabled={!puedeEditar || entregaARendir.entregaLiquidada}
            />
          </div>

        </div>
        <Divider />

        {/* Totales con fondo verde */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
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
          {/* Botón de acción para actualizar */}
          <div style={{ flex: 0.5 }}>
            <Button
              label="Actualizar"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleGuardarCambios}
              loading={loadingEntrega}
              disabled={entregaARendir.entregaLiquidada || !permisos.puedeEditar}
              tooltip={!permisos.puedeEditar ? "No tiene permisos para editar" : ""}
            />
          </div>
        </div>

        <Divider />

        {/* TabView: Movimientos */}
        <TabView>
          <TabPanel header="Movimientos" leftIcon="pi pi-list">
            <DetEntregaRendirMovAlmacen
              entregaARendir={entregaARendir}
              movimientos={movimientos}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              entidadesComerciales={entidadesComercialesFiltradas}
              monedas={monedas}
              tiposDocumento={tiposDocumento}
              productos={productos}
              movimientoAlmacenAprobado={true}
              onDataChange={cargarMovimientos}
              permisos={permisos}
            />
          </TabPanel>
        </TabView>
      </Panel>

      <Toast ref={toast} />
      <ConfirmDialog />
    </>
  );
}
