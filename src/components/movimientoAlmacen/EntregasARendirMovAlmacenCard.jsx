/**
 * EntregasARendirMovAlmacenCard.jsx
 *
 * Card para gestionar la entrega a rendir única por movimiento de almacén.
 * Muestra el registro único de EntregaARendirMovAlmacen y permite gestionar sus movimientos detallados.
 * Se habilita solo cuando existe un movimiento de almacén guardado de tipo ingreso.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge";
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
import { getDetMovsEntregaRendirMovAlmacen } from "../../api/detMovsEntregaRendirMovAlmacen";
import { getProductos } from "../../api/producto";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function EntregasARendirMovAlmacenCard({
  movimientoAlmacen,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  puedeEditar = true,
  onCountChange,
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

  // Estados para edición de la entrega
  const [responsableEditado, setResponsableEditado] = useState(null);
  const [centroCostoEditado, setCentroCostoEditado] = useState(null);
  const [hayCambios, setHayCambios] = useState(false);

  // Verificar y cargar entrega a rendir cuando cambie el movimiento
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

  // Cargar productos
  useEffect(() => {
    cargarProductos();
  }, []);

  // Calcular totales cuando cambien los movimientos
  useEffect(() => {
    calcularTotales();
  }, [movimientos]);

  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const verificarYCargarEntrega = async () => {
    setVerificandoEntrega(true);
    try {
      const entregas = await getAllEntregaARendirMovAlmacen();
      const entregaExistente = entregas.find(
        (e) => Number(e.movimientoAlmacenId) === Number(movimientoAlmacen.id)
      );

      if (entregaExistente) {
        setEntregaARendir(entregaExistente);
        setResponsableEditado(entregaExistente.respEntregaRendirId);
        setCentroCostoEditado(entregaExistente.centroCostoId);
      } else {
        setEntregaARendir(null);
      }
    } catch (error) {
      console.error("Error al verificar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al verificar entrega a rendir",
        life: 3000,
      });
    } finally {
      setVerificandoEntrega(false);
    }
  };

  const cargarMovimientos = async () => {
    setLoadingMovimientos(true);
    try {
      const data = await getDetMovsEntregaRendirMovAlmacen();
      const movimientosFiltrados = data.filter(
        (m) => Number(m.entregaARendirMovAlmacenId) === Number(entregaARendir.id)
      );
      setMovimientos(movimientosFiltrados);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar movimientos",
        life: 3000,
      });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const calcularTotales = () => {
    let totalIngresos = 0;
    let totalEgresos = 0;

    movimientos.forEach((mov) => {
      const monto = Number(mov.monto) || 0;
      const tipoMov = tiposMovimiento.find((t) => Number(t.id) === Number(mov.tipoMovimientoId));

      if (tipoMov?.esIngreso) {
        totalIngresos += monto;
      } else {
        totalEgresos += monto;
      }
    });

    setTotalAsignacionesEntregasRendir(totalIngresos);
    setTotalGastosEntregasRendir(totalEgresos);
    setTotalSaldoEntregasRendir(totalIngresos - totalEgresos);
  };

  const handleCrearEntrega = async () => {
    if (!movimientoAlmacen?.id) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el movimiento de almacén primero",
        life: 3000,
      });
      return;
    }

    if (!usuario?.personalId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se pudo identificar el usuario actual",
        life: 3000,
      });
      return;
    }

    // Asignar centro de costo ID 14 (Compras de materia prima) por defecto
    const centroCostoId = 14;

    try {
      setLoadingEntrega(true);
      const nuevaEntrega = await crearEntregaARendirMovAlmacen({
        movimientoAlmacenId: Number(movimientoAlmacen.id),
        respEntregaRendirId: Number(usuario.personalId),
        centroCostoId: Number(centroCostoId),
        entregaLiquidada: false,
        fechaLiquidacion: null,
        respLiquidacionId: null,
        urlLiquidacionPdf: null,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      });

      setEntregaARendir(nuevaEntrega);
      setResponsableEditado(nuevaEntrega.respEntregaRendirId);
      setCentroCostoEditado(nuevaEntrega.centroCostoId);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega a rendir creada correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al crear entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al crear entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!entregaARendir?.id) return;

    try {
      setLoadingEntrega(true);
      await actualizarEntregaARendirMovAlmacen(entregaARendir.id, {
        movimientoAlmacenId: entregaARendir.movimientoAlmacenId,
        respEntregaRendirId: responsableEditado,
        centroCostoId: centroCostoEditado,
        entregaLiquidada: entregaARendir.entregaLiquidada,
        fechaLiquidacion: entregaARendir.fechaLiquidacion,
        respLiquidacionId: entregaARendir.respLiquidacionId,
        urlLiquidacionPdf: entregaARendir.urlLiquidacionPdf,
        fechaCreacion: entregaARendir.fechaCreacion,
        fechaActualizacion: new Date(),
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cambios guardados correctamente",
        life: 3000,
      });

      setHayCambios(false);
      await verificarYCargarEntrega();
    } catch (error) {
      console.error("Error al actualizar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cambios",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  const handleEliminarEntrega = () => {
    if (!entregaARendir?.id) return;

    confirmDialog({
      message: "¿Está seguro de eliminar esta entrega a rendir? Esta acción no se puede deshacer.",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoadingEntrega(true);
          await eliminarEntregaARendirMovAlmacen(entregaARendir.id);

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
            detail: error.message || "Error al eliminar entrega a rendir",
            life: 3000,
          });
        } finally {
          setLoadingEntrega(false);
        }
      },
    });
  };

  // Verificar si el movimiento es de tipo ingreso
  // Verificamos múltiples formas de acceder al tipo de concepto
  const esMovimientoIngreso = 
    movimientoAlmacen?.conceptoMovAlmacen?.tipoConcepto?.codigo === "ING" ||
    movimientoAlmacen?.conceptoMovAlmacen?.tipoConcepto?.Codigo === "ING" ||
    movimientoAlmacen?.conceptoMovAlmacen?.TipoConcepto?.codigo === "ING" ||
    movimientoAlmacen?.conceptoMovAlmacen?.TipoConcepto?.Codigo === "ING";

  // Debug: ver qué datos tenemos
  console.log("MovimientoAlmacen para entregas a rendir:", movimientoAlmacen);
  console.log("Es movimiento ingreso:", esMovimientoIngreso);

  if (verificandoEntrega) {
    return (
      <Card title="Entrega a Rendir" style={{ marginTop: "1rem" }}>
        <Message severity="info" text="Verificando entrega a rendir..." />
      </Card>
    );
  }

  if (!movimientoAlmacen?.id) {
    return (
      <Card title="Entrega a Rendir" style={{ marginTop: "1rem" }}>
        <Message severity="info" text="Debe guardar el movimiento de almacén primero" />
      </Card>
    );
  }

  // Permitir entregas a rendir para todos los tipos de movimiento
  // if (!esMovimientoIngreso) {
  //   return (
  //     <Card title="Entrega a Rendir" style={{ marginTop: "1rem" }}>
  //       <Message
  //         severity="warn"
  //         text="Las entregas a rendir solo están disponibles para movimientos de tipo INGRESO"
  //       />
  //     </Card>
  //   );
  // }

  return (
    <Card title="Entrega a Rendir" style={{ marginTop: "1rem" }}>
      <Toast ref={toast} />

      {!entregaARendir ? (
        <div>
          <Message
            severity="info"
            text="No existe una entrega a rendir para este movimiento de almacén"
          />
          <Button
            label="Crear Entrega a Rendir"
            icon="pi pi-plus"
            onClick={handleCrearEntrega}
            loading={loadingEntrega}
            disabled={!puedeEditar}
            style={{ marginTop: "1rem" }}
          />
        </div>
      ) : (
        <div>
          {/* Información de la entrega */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label>Responsable *</label>
              <Dropdown
                value={responsableEditado}
                options={personal.map((p) => ({
                  label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
                  value: Number(p.id),
                }))}
                onChange={(e) => {
                  setResponsableEditado(e.value);
                  setHayCambios(true);
                }}
                placeholder="Seleccione responsable"
                filter
                disabled={entregaARendir.entregaLiquidada || !puedeEditar}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label>Centro de Costo</label>
              <Dropdown
                value={centroCostoEditado}
                options={centrosCosto.map((cc) => ({
                  label: `${cc.Codigo} - ${cc.Nombre}`,
                  value: Number(cc.id),
                }))}
                onChange={(e) => {
                  setCentroCostoEditado(e.value);
                  setHayCambios(true);
                }}
                placeholder="Seleccione centro"
                filter
                disabled={entregaARendir.entregaLiquidada || !puedeEditar}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label>Estado</label>
              <div>
                <Badge
                  value={entregaARendir.entregaLiquidada ? "LIQUIDADA" : "PENDIENTE"}
                  severity={entregaARendir.entregaLiquidada ? "success" : "warning"}
                  style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {hayCambios && (
              <Button
                label="Guardar Cambios"
                icon="pi pi-save"
                onClick={handleGuardarCambios}
                loading={loadingEntrega}
                disabled={entregaARendir.entregaLiquidada || !puedeEditar}
              />
            )}
            <Button
              label="Eliminar Entrega"
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={handleEliminarEntrega}
              loading={loadingEntrega}
              disabled={entregaARendir.entregaLiquidada || movimientos.length > 0 || !puedeEditar}
            />
          </div>

          {/* Resumen de totales */}
          <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
            <div>
              <strong>Total Asignaciones:</strong>{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                S/ {formatearNumero(totalAsignacionesEntregasRendir)}
              </span>
            </div>
            <div>
              <strong>Total Gastos:</strong>{" "}
              <span style={{ color: "red", fontWeight: "bold" }}>
                S/ {formatearNumero(totalGastosEntregasRendir)}
              </span>
            </div>
            <div>
              <strong>Saldo:</strong>{" "}
              <span style={{ color: totalSaldoEntregasRendir >= 0 ? "green" : "red", fontWeight: "bold" }}>
                S/ {formatearNumero(totalSaldoEntregasRendir)}
              </span>
            </div>
          </div>

          {/* TabView con movimientos */}
          <TabView>
            <TabPanel header="Movimientos">
              <DetEntregaRendirMovAlmacen
                entregaARendir={entregaARendir}
                movimientos={movimientos}
                personal={personal}
                centrosCosto={centrosCosto}
                tiposMovimiento={tiposMovimiento}
                entidadesComerciales={entidadesComerciales}
                monedas={monedas}
                tiposDocumento={tiposDocumento}
                productos={productos}
                movimientoAlmacenAprobado={true}
                loading={loadingMovimientos}
                onDataChange={cargarMovimientos}
              />
            </TabPanel>
          </TabView>
        </div>
      )}
    </Card>
  );
}
