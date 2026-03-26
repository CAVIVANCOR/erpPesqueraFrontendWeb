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
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { TabView, TabPanel } from "primereact/tabview";
import DetEntregaRendirPescaIndustrial from "./DetEntregaRendirPescaIndustrial";
import VerImpresionLiquidacionPI from "./VerImpresionLiquidacionPI";
import {
  getAllEntregaARendir,
  crearEntregaARendir,
} from "../../api/entregaARendir";
import {
  getAllDetMovsEntregaRendir,
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getMonedas } from "../../api/moneda"; // ← AGREGAR ESTA LÍNEA
import { getProductos } from "../../api/producto"; // Importar API de productos
import { useAuthStore } from "../../shared/stores/useAuthStore";

const EntregasARendirTemporadaCard = ({
  temporadaPescaId,
  temporadaPesca = null,
  temporadaPescaIniciada = false,
  empresaId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  tiposDocumento = [],
  onDataChange,
  permisos = {},
  readOnly = false,
}) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  // Estados para EntregaARendir
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [verificandoEntrega, setVerificandoEntrega] = useState(true);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [responsableEntrega, setResponsableEntrega] = useState(null);
  const [centroCostoEntrega, setCentroCostoEntrega] = useState(null);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [monedas, setMonedas] = useState([]); // ← AGREGAR ESTA LÍNEA
  const [productos, setProductos] = useState([]); // Estado para productos (gastos)

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] =
    useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para DetMovsEntregaRendir
  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  const cargarEntidadesComerciales = async () => {
    try {
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (error) {
      console.error("Error al cargar entidades comerciales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las entidades comerciales",
      });
    }
  };

  const cargarMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (error) {
      console.error("Error al cargar monedas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar monedas",
        life: 3000,
      });
    }
  };

  const cargarProductos = async () => {
    try {
      const familiasGastosIds = [2, 3, 4, 6, 7];
      const data = await getProductos();
      // Filtrar productos por familias de gastos y empresaId
      const productosFiltrados = data.filter(
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
        detail: "Error al cargar productos",
        life: 3000,
      });
    }
  };

  /**
   * Verificar si existe una entrega a rendir para esta temporada
   * Si no existe, preguntar si desea crearla
   */
  const verificarYCargarEntrega = async () => {
    if (!temporadaPescaId) {
      setVerificandoEntrega(false);
      return;
    }

    setVerificandoEntrega(true);
    try {
      const entregasData = await getAllEntregaARendir();
      const entregaExistente = entregasData.find(
        (e) => Number(e.temporadaPescaId) === Number(temporadaPescaId),
      );

      if (entregaExistente) {
        setEntregaARendir(entregaExistente);
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

  // Cargar movimientos de la entrega
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    try {
      setLoadingMovimientos(true);
      const movimientosData = await getAllDetMovsEntregaRendir();
      const movimientosEntrega = movimientosData.filter(
        (mov) => Number(mov.entregaARendirId) === Number(entregaARendir.id),
      );

      setMovimientos(movimientosEntrega);
      calcularTotales(movimientosEntrega);
    } catch (error) {
      console.error("❌ ERROR al cargar movimientos:", error);
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

      // Buscar el tipo de movimiento en el array tiposMovimiento usando el ID
      const tipoMov = tiposMovimiento.find(
        (t) => Number(t.id) === Number(mov.tipoMovimientoId),
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

  // Efectos
  useEffect(() => {
    verificarYCargarEntrega();
    cargarEntidadesComerciales();
    cargarMonedas();
  }, [temporadaPescaId]);

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

  useEffect(() => {
    obtenerResponsableEntrega();
    obtenerCentroCostoEntrega();
  }, [entregaARendir, personal, centrosCosto]);

  /**
   * Preguntar al usuario si desea crear una entrega a rendir
   */
  const preguntarCrearEntrega = () => {
    confirmDialog({
      message:
        "No existe una entrega a rendir para esta temporada. ¿Desea crear una?",
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
    // Validar que exista un responsable en la temporada
    if (!temporadaPesca?.BahiaId || Number(temporadaPesca.BahiaId) <= 0) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          "La temporada debe tener un Responsable asignado. Por favor, edite la temporada y asigne un Responsable antes de crear la entrega a rendir.",
        life: 5000,
      });
      return;
    }

    setLoadingEntrega(true);
    try {
      // Buscar el centro de costo "PESCA INDUSTRIAL" dinámicamente
      const centroCostoPescaIndustrial = centrosCosto.find(
        (cc) => cc.Nombre === "PESCA INDUSTRIAL",
      );

      if (!centroCostoPescaIndustrial) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            'No se encontró el centro de costo "PESCA INDUSTRIAL". Por favor, verifique la configuración.',
          life: 5000,
        });
        return;
      }

      const dataToCreate = {
        temporadaPescaId: Number(temporadaPescaId),
        respEntregaRendirId: Number(temporadaPesca.BahiaId),
        centroCostoId: Number(centroCostoPescaIndustrial.id),
        entregaLiquidada: false,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };

      const nuevaEntrega = await crearEntregaARendir(dataToCreate);

      // Convertir BigInt a Number para evitar problemas de serialización
      const entregaNormalizada = {
        ...nuevaEntrega,
        id: Number(nuevaEntrega.id),
        temporadaPescaId: Number(nuevaEntrega.temporadaPescaId),
        respEntregaRendirId: Number(nuevaEntrega.respEntregaRendirId),
        centroCostoId: Number(nuevaEntrega.centroCostoId),
      };

      // Recargar la entrega con todas sus relaciones desde el backend
      const entregasData = await getAllEntregaARendir();
      const entregaCompleta = entregasData.find(
        (e) => Number(e.id) === Number(entregaNormalizada.id),
      );

      if (entregaCompleta) {
        setEntregaARendir(entregaCompleta);
      } else {
        setEntregaARendir(entregaNormalizada);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entrega a rendir creada correctamente",
        life: 3000,
      });

      onDataChange?.();
    } catch (error) {
      console.error(
        "❌ [EntregaARendir] Error al crear entrega automática:",
        error,
      );
      console.error(
        "❌ [EntregaARendir] Detalles del error:",
        error.response?.data,
      );
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

  // Función para obtener el responsable específico de la entrega a rendir
  // Actualiza el estado responsableEntrega
  // Prioriza la relación del backend si está disponible
  const obtenerResponsableEntrega = () => {
    // Priorizar relación del backend
    if (entregaARendir?.respEntregaRendir) {
      const responsable = entregaARendir.respEntregaRendir;
      const responsableNormalizado = {
        id: Number(responsable.id),
        label: `${responsable.nombres} ${responsable.apellidos}`.trim(),
      };
      setResponsableEntrega(responsableNormalizado);
      return;
    }

    // Fallback: buscar en el array de personal (retrocompatibilidad)
    if (!entregaARendir?.respEntregaRendirId || !personal.length) {
      setResponsableEntrega(null);
      return;
    }

    const responsable = personal.find(
      (p) => Number(p.id) === Number(entregaARendir.respEntregaRendirId),
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
   * Prioriza la relación del backend si está disponible
   */
  const obtenerCentroCostoEntrega = () => {
    // Priorizar relación del backend
    if (entregaARendir?.centroCosto) {
      const centroCosto = entregaARendir.centroCosto;
      const centroCostoNormalizado = {
        id: Number(centroCosto.id),
        label: centroCosto.Codigo + " - " + centroCosto.Nombre || "N/A",
      };
      setCentroCostoEntrega(centroCostoNormalizado);
      return;
    }

    // Fallback: buscar en el array de centrosCosto (retrocompatibilidad)
    if (!entregaARendir?.centroCostoId || !centrosCosto.length) {
      setCentroCostoEntrega(null);
      return;
    }

    const centroCosto = centrosCosto.find(
      (c) => Number(c.id) === Number(entregaARendir.centroCostoId),
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

  if (verificandoEntrega) {
    return (
      <Card className="mb-4">
        <Message severity="info" text="Verificando entrega a rendir..." />
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
            <div>
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
                    Fecha Liquidación
                  </label>
                  <InputText
                    value={
                      entregaARendir.fechaLiquidacion
                        ? new Date(
                            entregaARendir.fechaLiquidacion,
                          ).toLocaleString("es-PE", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })
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

              {/* Segunda fila: Campos de liquidación */}
              {entregaARendir.entregaLiquidada && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#e8f5e9",
                    borderRadius: 5,
                    border: "1px solid #4caf50",
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <label className="block text-900 font-medium mb-2">
                      Liquidado Por
                    </label>
                    <InputText
                      value={
                        entregaARendir.respLiquidacion
                          ? `${entregaARendir.respLiquidacion.nombres} ${entregaARendir.respLiquidacion.apellidos}`.trim()
                          : "N/A"
                      }
                      readOnly
                      className="w-full"
                      style={{ fontWeight: "bold" }}
                    />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label className="block text-900 font-medium mb-2">
                      PDF de Liquidación
                    </label>
                    {entregaARendir.urlLiquidacionPdf ? (
                      <Button
                        label="Descargar PDF"
                        icon="pi pi-download"
                        className="w-full"
                        severity="success"
                        onClick={() =>
                          window.open(
                            entregaARendir.urlLiquidacionPdf,
                            "_blank",
                          )
                        }
                      />
                    ) : (
                      <InputText
                        value="PDF no disponible"
                        readOnly
                        className="w-full"
                        style={{ fontWeight: "bold", fontStyle: "italic" }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Message
                severity="warn"
                text="No se ha creado la entrega a rendir para esta temporada"
              />
              <Button
                type="button"
                label="Crear Entrega"
                icon="pi pi-plus"
                className="mt-3"
                onClick={preguntarCrearEntrega}
                disabled={readOnly}
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
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">Estado</label>
              <Button
                label={
                  entregaARendir.entregaLiquidada
                    ? "TEMPORADA LIQUIDADA"
                    : movimientos.length > 0 && totalSaldoEntregasRendir === 0
                      ? "LISTA PARA LIQUIDAR"
                      : "PENDIENTE LIQUIDACION"
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
          </div>
        )}

        <Divider />

        {/* TabView: Movimientos y Liquidación */}
        <TabView>
          <TabPanel header="Movimientos" leftIcon="pi pi-list">
            <DetEntregaRendirPescaIndustrial
              entregaARendir={entregaARendir}
              temporadaPesca={temporadaPesca}
              movimientos={movimientos}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tiposMovimiento}
              entidadesComerciales={entidadesComerciales}
              monedas={monedas}
              tiposDocumento={tiposDocumento}
              productos={productos}
              temporadaPescaIniciada={temporadaPescaIniciada}
              loading={loadingMovimientos}
              selectedMovimientos={selectedMovimientos}
              onSelectionChange={(e) => setSelectedMovimientos(e.value)}
              permisos={permisos}
              readOnly={readOnly}
              onDataChange={() => {
                cargarMovimientos();
                verificarYCargarEntrega();
                onDataChange?.();
              }}
            />
          </TabPanel>

          <TabPanel header="Liquidación PDF" leftIcon="pi pi-file-pdf">
            <VerImpresionLiquidacionPI
              entregaARendirId={entregaARendir?.id}
              datosEntrega={entregaARendir}
              movimientos={movimientos}
              toast={toast}
              onPdfGenerated={(urlPdf) => {
                // Actualizar la entrega con la nueva URL del PDF
                verificarYCargarEntrega();
              }}
            />
          </TabPanel>
        </TabView>
      </Card>

      <Toast ref={toast} />
    </>
  );
};

export default EntregasARendirTemporadaCard;
