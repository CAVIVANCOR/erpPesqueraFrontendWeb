/**
 * EntregasARendirNovedadCard.jsx
 *
 * Card para gestionar la entrega a rendir única por novedad de pesca consumo.
 * Patrón replicado EXACTAMENTE de EntregaARendirMovAlmacenCard.jsx (ESTÁNDAR)
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { TabView, TabPanel } from "primereact/tabview";
import DetEntregaRendirNovedadConsumo from "./DetEntregaRendirNovedadConsumo";
import VerImpresionLiquidacionPC from "./VerImpresionLiquidacionPC";
import { 
  getEntregasARendirPescaConsumo,
  crearEntregaARendirPescaConsumo,
  actualizarEntregaARendirPescaConsumo,
} from "../../api/entregaARendirPescaConsumo";
import { getAllDetMovsEntRendirPescaConsumo } from "../../api/detMovsEntRendirPescaConsumo";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getMonedas } from "../../api/moneda";
import { getProductos } from "../../api/producto";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const EntregasARendirNovedadCard = ({
  novedadPescaConsumoId,
  novedadPescaConsumo = null,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  empresaId,
  novedadPescaConsumoIniciada = false,
  onDataChange,
  permisos = {},
  readOnly = false,
}) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados para EntregaARendirPescaConsumo
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [verificandoEntrega, setVerificandoEntrega] = useState(true);
  
  // Estados para edición de la entrega
  const [responsableEditado, setResponsableEditado] = useState(null);
  const [centroCostoEditado, setCentroCostoEditado] = useState(null);
  const [hayCambios, setHayCambios] = useState(false);

  // Estados para datos auxiliares
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  
  // Estado para entidades comerciales filtradas por empresa
  const [entidadesComercialesFiltradas, setEntidadesComercialesFiltradas] =
    useState([]);

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] =
    useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para DetMovsEntRendirPescaConsumo
  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  /**
   * Cargar entidades comerciales
   */
  const cargarEntidadesComerciales = async () => {
    try {
      const entidadesData = await getEntidadesComerciales();
      setEntidadesComerciales(entidadesData);
    } catch (error) {
      console.error("Error al cargar entidades comerciales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las entidades comerciales",
        life: 3000,
      });
    }
  };

  /**
   * Cargar monedas
   */
  const cargarMonedas = async () => {
    try {
      const monedasData = await getMonedas();
      setMonedas(monedasData);
    } catch (error) {
      console.error("Error al cargar monedas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las monedas",
        life: 3000,
      });
    }
  };

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
          Number(p.empresaId) === Number(empresaId),
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
   * Verificar si existe una entrega a rendir para esta novedad
   */
  const verificarYCargarEntrega = async () => {
    setVerificandoEntrega(true);
    try {
      const data = await getEntregasARendirPescaConsumo();
      const entregaExistente = data.find(
        (e) => Number(e.novedadPescaConsumoId) === Number(novedadPescaConsumoId),
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
   * Cargar entrega a rendir (para refrescar datos)
   */
  const cargarEntregaARendir = async () => {
    if (!novedadPescaConsumoId) return;

    try {
      const entregasData = await getEntregasARendirPescaConsumo();
      const entregaNovedad = entregasData.find(
        (entrega) =>
          Number(entrega.novedadPescaConsumoId) ===
          Number(novedadPescaConsumoId),
      );
      
      if (entregaNovedad) {
        setEntregaARendir(entregaNovedad);
        setResponsableEditado(Number(entregaNovedad.respEntregaRendirId));
        setCentroCostoEditado(Number(entregaNovedad.centroCostoId));
        setHayCambios(false);
      }
    } catch (error) {
      console.error("Error al cargar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entrega a rendir",
        life: 3000,
      });
    }
  };

  /**
   * Preguntar al usuario si desea crear una entrega a rendir
   */
  const preguntarCrearEntrega = () => {
    confirmDialog({
      message:
        "No existe una entrega a rendir para esta novedad de pesca consumo. ¿Desea crear una?",
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
    if (
      !novedadPescaConsumo?.BahiaId ||
      Number(novedadPescaConsumo.BahiaId) <= 0
    ) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          "La novedad de pesca consumo debe tener una Bahía asignada para crear una entrega a rendir",
        life: 5000,
      });
      return;
    }

    setLoadingEntrega(true);
    try {
      const dataToCreate = {
        novedadPescaConsumoId: Number(novedadPescaConsumoId),
        respEntregaRendirId: Number(novedadPescaConsumo.BahiaId),
        centroCostoId: 1,
        entregaLiquidada: false,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };

      const nuevaEntrega = await crearEntregaARendirPescaConsumo(dataToCreate);

      const entregaNormalizada = {
        ...nuevaEntrega,
        id: Number(nuevaEntrega.id),
        novedadPescaConsumoId: Number(nuevaEntrega.novedadPescaConsumoId),
        respEntregaRendirId: Number(nuevaEntrega.respEntregaRendirId),
        centroCostoId: Number(nuevaEntrega.centroCostoId),
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
        detail:
          error.response?.data?.mensaje || "Error al crear la entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  /**
   * Cargar movimientos de la entrega
   */
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    try {
      setLoadingMovimientos(true);
      const movimientosData = await getAllDetMovsEntRendirPescaConsumo();
      const movimientosEntrega = movimientosData.filter(
        (mov) =>
          Number(mov.entregaARendirPescaConsumoId) ===
          Number(entregaARendir.id),
      );
      setMovimientos(movimientosEntrega);
      calcularTotales(movimientosEntrega);
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

  /**
   * Calcular totales de asignaciones, gastos y saldo
   */
  const calcularTotales = (movs) => {
    let totalAsignaciones = 0;
    let totalGastos = 0;

    movs.forEach((mov) => {
      const monto = Number(mov.monto) || 0;

      const tipoMov = tiposMovimiento.find(
        (t) => Number(t.id) === Number(mov.tipoMovimientoId),
      );

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
        Number(centroCostoEditado) !== Number(entregaARendir.centroCostoId),
    );
  };

  /**
   * Manejar cambios en el centro de costo
   */
  const handleCentroCostoChange = (value) => {
    setCentroCostoEditado(value);
    setHayCambios(
      Number(responsableEditado) !==
        Number(entregaARendir.respEntregaRendirId) ||
        Number(value) !== Number(entregaARendir.centroCostoId),
    );
  };

  /**
   * Guardar cambios en la entrega a rendir
   */
  const handleGuardarCambios = async () => {
    setLoadingEntrega(true);
    try {
      const dataToUpdate = {
        novedadPescaConsumoId: Number(entregaARendir.novedadPescaConsumoId),
        respEntregaRendirId: Number(responsableEditado),
        centroCostoId: Number(centroCostoEditado),
        entregaLiquidada: entregaARendir.entregaLiquidada,
      };

      const entregaActualizada = await actualizarEntregaARendirPescaConsumo(
        entregaARendir.id,
        dataToUpdate,
      );

      const entregaNormalizada = {
        ...entregaActualizada,
        id: Number(entregaActualizada.id),
        novedadPescaConsumoId: Number(entregaActualizada.novedadPescaConsumoId),
        respEntregaRendirId: Number(entregaActualizada.respEntregaRendirId),
        centroCostoId: Number(entregaActualizada.centroCostoId),
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
        detail:
          error.response?.data?.mensaje ||
          "Error al actualizar la entrega a rendir",
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

  // Verificar y cargar entrega cuando cambie la novedad
  useEffect(() => {
    if (novedadPescaConsumoId && novedadPescaConsumoIniciada) {
      verificarYCargarEntrega();
      cargarEntidadesComerciales();
      cargarMonedas();
    } else {
      setEntregaARendir(null);
      setVerificandoEntrega(false);
    }
  }, [novedadPescaConsumoId, novedadPescaConsumoIniciada]);

  useEffect(() => {
    if (empresaId) {
      cargarProductos();
    }
  }, [empresaId]);

  useEffect(() => {
    if (entregaARendir) {
      cargarMovimientos();
    }
  }, [entregaARendir]);

  // Filtrar entidades comerciales por empresaId
  useEffect(() => {
    if (empresaId && entidadesComerciales.length > 0) {
      const entidadesFiltradas = entidadesComerciales.filter(
        (e) => Number(e.empresaId) === Number(empresaId),
      );
      setEntidadesComercialesFiltradas(entidadesFiltradas);
    } else {
      setEntidadesComercialesFiltradas([]);
    }
  }, [empresaId, entidadesComerciales]);

  // Renderizado condicional si la novedad no está iniciada
  if (!novedadPescaConsumoIniciada) {
    return (
      <Panel header="Entrega a Rendir" className="mt-4">
        <Message
          severity="info"
          text="La novedad de pesca consumo debe estar iniciada para gestionar entregas a rendir"
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

  // Renderizado condicional si no existe entrega a rendir
  if (!entregaARendir) {
    return (
      <>
        <Panel header="Entrega a Rendir" className="mt-4">
          <Message
            severity="warn"
            text="No existe una entrega a rendir para esta novedad de pesca consumo"
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
        <Toast ref={toast} />
        <ConfirmDialog />
      </>
    );
  }

  return (
    <>
      <Panel header="Entrega a Rendir" className="mt-4">
        {/* Sección de EntregaARendirPescaConsumo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
              disabled={!permisos.puedeEditar || entregaARendir.entregaLiquidada || readOnly}
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
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Fecha Liquidación
            </label>
            <InputText
              value={
                entregaARendir.fechaLiquidacion
                  ? new Date(
                      entregaARendir.fechaLiquidacion,
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
              disabled={!permisos.puedeEditar || entregaARendir.entregaLiquidada || readOnly}
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
              disabled={
                entregaARendir.entregaLiquidada || !permisos.puedeEditar || readOnly
              }
              tooltip={
                !permisos.puedeEditar ? "No tiene permisos para editar" : ""
              }
            />
          </div>
        </div>

        <Divider />

        {/* TabView: Movimientos y Liquidación */}
        <TabView>
          <TabPanel header="Movimientos" leftIcon="pi pi-list">
            <DetEntregaRendirNovedadConsumo
              entregaARendir={entregaARendir}
              movimientos={movimientos}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              entidadesComerciales={entidadesComercialesFiltradas}
              monedas={monedas}
              productos={productos}
              novedadPescaConsumo={novedadPescaConsumo}
              novedadPescaConsumoIniciada={novedadPescaConsumoIniciada}
              onDataChange={cargarMovimientos}
              permisos={permisos}
              readOnly={readOnly}
            />
          </TabPanel>
          <TabPanel header="Liquidación" leftIcon="pi pi-file-pdf">
            <VerImpresionLiquidacionPC
              entregaARendir={entregaARendir}
              novedadPescaConsumo={novedadPescaConsumo}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              monedas={monedas}
              productos={productos}
              movimientos={movimientos}
              totalAsignaciones={totalAsignacionesEntregasRendir}
              totalGastos={totalGastosEntregasRendir}
              totalSaldo={totalSaldoEntregasRendir}
              onLiquidar={cargarEntregaARendir}
              permisos={permisos}
            />
          </TabPanel>
        </TabView>
      </Panel>

      <Toast ref={toast} />
      <ConfirmDialog />
    </>
  );
};

export default EntregasARendirNovedadCard;