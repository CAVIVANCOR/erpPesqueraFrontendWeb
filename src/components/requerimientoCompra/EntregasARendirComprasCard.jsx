/**
 * EntregasARendirComprasCard.jsx
 *
 * Card para gestionar la entrega a rendir única por requerimiento de compra.
 * Muestra el registro único de EntregaARendirPCompras y permite gestionar sus movimientos detallados.
 * Se habilita solo cuando existe un requerimiento guardado con supervisorCampoId válido.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import DetEntregaRendirCompras from "./DetEntregaRendirCompras";
import VerImpresionLiquidacionCompras from "./VerImpresionLiquidacionCompras";
import { formatearNumero } from "../../utils/utils";
import {
  getAllEntregaARendirPCompras,
  crearEntregaARendirPCompras,
  actualizarEntregaARendirPCompras,
  eliminarEntregaARendirPCompras,
} from "../../api/entregaARendirPCompras";
import { getDetMovsEntregaRendirPCompras } from "../../api/detMovsEntregaRendirPCompras";
import { getProductos } from "../../api/producto";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function EntregasARendirComprasCard({
  requerimientoCompra,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  puedeEditar = true,
  onCountChange,
  readOnly = false,
  permisos = {},
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados para EntregaARendirPCompras (única)
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [verificandoEntrega, setVerificandoEntrega] = useState(true);

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] =
    useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para DetMovsEntregaRendirPCompras
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

  // Verificar y cargar entrega a rendir cuando cambie el requerimiento
  useEffect(() => {
    if (requerimientoCompra?.id) {
      verificarYCargarEntrega();
    } else {
      setEntregaARendir(null);
      setVerificandoEntrega(false);
    }
  }, [requerimientoCompra?.id]);

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

  // Cargar productos cuando cambie el requerimiento
  useEffect(() => {
    if (requerimientoCompra?.empresaId) {
      cargarProductos();
    }
  }, [requerimientoCompra?.empresaId]);

  // Filtrar entidades comerciales por empresaId (clientes Y proveedores)
  useEffect(() => {
    if (requerimientoCompra?.empresaId && entidadesComerciales.length > 0) {
      // Filtrar solo por empresaId, sin importar el tipo de entidad
      // Esto incluirá clientes, proveedores y cualquier otro tipo de entidad comercial
      const entidadesFiltradas = entidadesComerciales.filter(
        (e) => Number(e.empresaId) === Number(requerimientoCompra.empresaId)
      );
      setEntidadesComercialesFiltradas(entidadesFiltradas);
    } else {
      setEntidadesComercialesFiltradas([]);
    }
  }, [requerimientoCompra?.empresaId, entidadesComerciales]);

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
          Number(p.empresaId) === Number(requerimientoCompra?.empresaId)
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
   * Verificar si existe una entrega a rendir para este requerimiento
   * Si no existe, preguntar si desea crearla
   */
  const verificarYCargarEntrega = async () => {
    setVerificandoEntrega(true);
    try {
      const data = await getAllEntregaARendirPCompras();
      const entregaExistente = data.find(
        (e) =>
          Number(e.requerimientoCompraId) === Number(requerimientoCompra.id)
      );

      if (entregaExistente) {
        setEntregaARendir(entregaExistente);
        setResponsableEditado(Number(entregaExistente.respEntregaRendirId));
        setCentroCostoEditado(Number(entregaExistente.centroCostoId));
        setHayCambios(false);
      } else {
        // No existe entrega, preguntar si desea crearla
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
      message:
        "No existe una entrega a rendir para este requerimiento. ¿Desea crear una?",
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
    
    // Validar que supervisorCampoId esté asignado
    if (
      !requerimientoCompra.supervisorCampoId ||
      Number(requerimientoCompra.supervisorCampoId) <= 0
    ) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          "El requerimiento debe tener un Supervisor de Campo asignado. Por favor, edite el requerimiento y asigne un Supervisor de Campo antes de crear la entrega a rendir.",
        life: 5000,
      });
      return;
    }

    setLoadingEntrega(true);
    try {
      const dataToCreate = {
        requerimientoCompraId: Number(requerimientoCompra.id),
        respEntregaRendirId: Number(requerimientoCompra.supervisorCampoId),
        centroCostoId: 14, // Compras de Materia Prima
        entregaLiquidada: false,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      const nuevaEntrega = await crearEntregaARendirPCompras(dataToCreate);

      // Convertir BigInt a Number para evitar problemas de serialización
      const entregaNormalizada = {
        ...nuevaEntrega,
        id: Number(nuevaEntrega.id),
        requerimientoCompraId: Number(nuevaEntrega.requerimientoCompraId),
        respEntregaRendirId: Number(nuevaEntrega.respEntregaRendirId),
        centroCostoId: Number(nuevaEntrega.centroCostoId),
        creadoPor: nuevaEntrega.creadoPor
          ? Number(nuevaEntrega.creadoPor)
          : null,
        actualizadoPor: nuevaEntrega.actualizadoPor
          ? Number(nuevaEntrega.actualizadoPor)
          : null,
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
      console.error('❌ [EntregaARendir] Error al crear entrega automática:', error);
      console.error('❌ [EntregaARendir] Detalles del error:', error.response?.data);
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
   * Cargar movimientos de la entrega a rendir
   */
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    setLoadingMovimientos(true);
    try {
      const data = await getDetMovsEntregaRendirPCompras();
      const movsFiltrados = data.filter(
        (m) => Number(m.entregaARendirPComprasId) === Number(entregaARendir.id)
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
      
      // Buscar el tipo de movimiento en el array tiposMovimiento usando el ID
      const tipoMov = tiposMovimiento.find(
        (t) => Number(t.id) === Number(mov.tipoMovimientoId)
      );
      
      // Verificar si es ingreso o egreso usando el campo "esIngreso" (booleano)
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
   * Obtener nombre del responsable
   * Prioriza la relación del backend si está disponible
   */
  const getNombreResponsable = () => {
    // Priorizar relación del backend
    if (entregaARendir?.respEntregaRendir) {
      const resp = entregaARendir.respEntregaRendir;
      return (
        resp.nombreCompleto ||
        `${resp.nombres || ""} ${resp.apellidos || ""}`.trim() ||
        "N/A"
      );
    }

    // Fallback: buscar en el array de personal (retrocompatibilidad)
    if (!entregaARendir?.respEntregaRendirId) return "N/A";
    const resp = personal.find(
      (p) => Number(p.id) === Number(entregaARendir.respEntregaRendirId)
    );
    return (
      resp?.nombreCompleto ||
      `${resp?.nombres || ""} ${resp?.apellidos || ""}` ||
      "N/A"
    );
  };

  /**
   * Obtener nombre del centro de costo
   * Prioriza la relación del backend si está disponible
   */
  const getNombreCentroCosto = () => {
    // Priorizar relación del backend
    if (entregaARendir?.centroCosto) {
      const centro = entregaARendir.centroCosto;
      return `${centro.Codigo} - ${centro.Nombre}`;
    }

    // Fallback: buscar en el array de centrosCosto (retrocompatibilidad)
    if (!entregaARendir?.centroCostoId) return "N/A";
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(entregaARendir.centroCostoId)
    );
    return centro ? `${centro.Codigo} - ${centro.Nombre}` : "N/A";
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
      Number(responsableEditado) !==
        Number(entregaARendir.respEntregaRendirId) ||
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
        requerimientoCompraId: Number(entregaARendir.requerimientoCompraId),
        respEntregaRendirId: Number(responsableEditado),
        centroCostoId: Number(centroCostoEditado),
        entregaLiquidada: entregaARendir.entregaLiquidada,
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      const entregaActualizada = await actualizarEntregaARendirPCompras(
        entregaARendir.id,
        dataToUpdate
      );

      // Normalizar BigInt
      const entregaNormalizada = {
        ...entregaActualizada,
        id: Number(entregaActualizada.id),
        requerimientoCompraId: Number(entregaActualizada.requerimientoCompraId),
        respEntregaRendirId: Number(entregaActualizada.respEntregaRendirId),
        centroCostoId: Number(entregaActualizada.centroCostoId),
        creadoPor: entregaActualizada.creadoPor
          ? Number(entregaActualizada.creadoPor)
          : null,
        actualizadoPor: entregaActualizada.actualizadoPor
          ? Number(entregaActualizada.actualizadoPor)
          : null,
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
          error.response?.data?.mensaje || "Error al actualizar la entrega",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  /**
   * Manejar eliminación de la entrega a rendir
   */
  const handleEliminarEntrega = () => {
    confirmDialog({
      message:
        "¿Está seguro de eliminar esta entrega a rendir? Se eliminarán todos los movimientos asociados.",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarEntregaARendirPCompras(entregaARendir.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Entrega a rendir eliminada correctamente",
            life: 3000,
          });
          setEntregaARendir(null);
          setMovimientos([]);
        } catch (error) {
          console.error("Error al eliminar entrega:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.mensaje || "Error al eliminar la entrega",
            life: 3000,
          });
        }
      },
    });
  };

  // Renderizado
  if (!requerimientoCompra?.id) {
    return (
      <Card className="mt-3">
        <Message
          severity="info"
          text="Guarde el requerimiento primero para poder gestionar entregas a rendir"
        />
      </Card>
    );
  }

  if (verificandoEntrega) {
    return (
      <Card className="mt-3">
        <Message severity="info" text="Verificando entrega a rendir..." />
      </Card>
    );
  }

  if (!entregaARendir) {
    return (
      <Card className="mt-3">
        <Message
          severity="warn"
          text="No existe una entrega a rendir para este requerimiento"
        />
      </Card>
    );
  }

  return (
    <>
      <Panel
        header={
          <div className="flex justify-content-between align-items-center w-full">
            <span>
              <i className="pi pi-money-bill mr-2" />
              Entrega a Rendir - Requerimiento #{requerimientoCompra.id}
            </span>
          </div>
        }
        className="mt-3"
        toggleable
      >
        {/* Información de la entrega */}
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
            gap: 10,
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
              disabled={entregaARendir.entregaLiquidada}
            />
          </div>
        </div>

        <Divider />

        {/* TabView: Movimientos y Liquidación */}
        <TabView>
          <TabPanel header="Movimientos" leftIcon="pi pi-list">
            <DetEntregaRendirCompras
              entregaARendir={entregaARendir}
              movimientos={movimientos}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              entidadesComerciales={entidadesComercialesFiltradas}
              monedas={monedas}
              tiposDocumento={tiposDocumento}
              productos={productos}
              requerimientoCompraAprobado={true}
              onDataChange={cargarMovimientos}
            />
          </TabPanel>

          <TabPanel header="Liquidación PDF" leftIcon="pi pi-file-pdf">
            <VerImpresionLiquidacionCompras
              entregaARendirId={entregaARendir?.id}
              datosEntrega={entregaARendir}
              movimientos={movimientos}
              toast={toast}
              onPdfGenerated={(urlPdf) => {
                cargarEntregaARendir();
              }}
            />
          </TabPanel>
        </TabView>
      </Panel>

      <Toast ref={toast} />
    </>
  );
}
