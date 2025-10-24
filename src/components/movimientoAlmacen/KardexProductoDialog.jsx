// src/components/movimientoAlmacen/KardexProductoDialog.jsx
// Componente reutilizable para mostrar el kardex de un producto
import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

// Constantes de colores para el kardex
const COLOR_INGRESO = "#f4fcf5"; // Verde claro para ingresos
const COLOR_EGRESO = "#f9e8e9"; // Rojo claro para egresos
const COLOR_SALDO = "#f2f8fc"; // Celeste claro para saldos finales
const COLOR_SALDO_INICIAL = "#fcfaf4"; // Azul claro para saldos iniciales

/**
 * Componente independiente para mostrar el kardex de un producto
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Función callback al cerrar el diálogo
 * @param {number|string} empresaId - ID de la empresa
 * @param {number|string} almacenId - ID del almacén
 * @param {number|string} productoId - ID del producto
 * @param {boolean} esCustodia - Si es mercadería en custodia (default: false)
 * @param {number|string} clienteId - ID del cliente (solo para custodia)
 * @param {string} productoNombre - Nombre del producto para mostrar en el header
 * @param {string} fechaDesde - Fecha desde para filtrar (opcional)
 * @param {string} fechaHasta - Fecha hasta para filtrar (opcional)
 */
export default function KardexProductoDialog({
  visible,
  onHide,
  empresaId,
  almacenId,
  productoId,
  esCustodia = false,
  clienteId = null,
  productoNombre = "Producto",
  fechaDesde = null,
  fechaHasta = null,
}) {
  const [kardex, setKardex] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroVencimiento, setFiltroVencimiento] = useState(null); // 'vencidos', 'porVencer', 'todos'
  const [filtroEstadosMercaderia, setFiltroEstadosMercaderia] = useState([]);
  const [filtroEstadosCalidad, setFiltroEstadosCalidad] = useState([]);

  useEffect(() => {
    if (visible && empresaId && almacenId && productoId) {
      cargarKardex();
    }
  }, [visible, empresaId, almacenId, productoId, esCustodia, clienteId]);

  const cargarKardex = async () => {
    try {
      setLoading(true);
      const token = useAuthStore.getState().token;
      const API_URL = `${import.meta.env.VITE_API_URL}/kardex-almacen/producto`;

      const params = {
        empresaId,
        almacenId,
        productoId,
        esCustodia,
      };

      if (esCustodia && clienteId) {
        params.clienteId = clienteId;
      }

      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;

      const res = await axios.get(API_URL, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setKardex(res.data || []);
    } catch (error) {
      console.error("Error al cargar kardex:", error);
      setKardex([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener opciones dinámicas de estados de mercadería
  const opcionesEstadosMercaderia = useMemo(() => {
    const estados = new Set();
    kardex.forEach((item) => {
      if (item.estado?.descripcion) {
        estados.add(item.estado.descripcion);
      }
    });
    return Array.from(estados)
      .sort()
      .map((estado) => ({ label: estado, value: estado }));
  }, [kardex]);

  // Obtener opciones dinámicas de estados de calidad
  const opcionesEstadosCalidad = useMemo(() => {
    const estados = new Set();
    kardex.forEach((item) => {
      if (item.estadoCalidad?.descripcion) {
        estados.add(item.estadoCalidad.descripcion);
      }
    });
    return Array.from(estados)
      .sort()
      .map((estado) => ({ label: estado, value: estado }));
  }, [kardex]);

  // Opciones para filtro de vencimiento
  const opcionesVencimiento = [
    { label: "Todos", value: null },
    { label: "Vencidos", value: "vencidos" },
    { label: "Por Vencer (30 días)", value: "porVencer" },
  ];

  // Función para verificar si un producto está vencido o por vencer
  const verificarVencimiento = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const diasDiferencia = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

    if (diasDiferencia < 0) return "vencido";
    if (diasDiferencia <= 30) return "porVencer";
    return "vigente";
  };

  // Función auxiliar para aplicar filtros
  const aplicarFiltros = (datos) => {
    let resultado = [...datos];

    // Filtro por fecha de documento
    if (filtroFechaDesde) {
      resultado = resultado.filter((item) => {
        if (!item.fechaMovimientoAlmacen) return false;
        const fechaItem = new Date(item.fechaMovimientoAlmacen);
        return fechaItem >= filtroFechaDesde;
      });
    }

    if (filtroFechaHasta) {
      resultado = resultado.filter((item) => {
        if (!item.fechaMovimientoAlmacen) return false;
        const fechaItem = new Date(item.fechaMovimientoAlmacen);
        return fechaItem <= filtroFechaHasta;
      });
    }

    // Filtro por vencimiento
    if (filtroVencimiento) {
      resultado = resultado.filter((item) => {
        const estadoVenc = verificarVencimiento(item.fechaVencimiento);
        if (filtroVencimiento === "vencidos") return estadoVenc === "vencido";
        if (filtroVencimiento === "porVencer")
          return estadoVenc === "porVencer";
        return true;
      });
    }

    // Filtro por estados de mercadería
    if (filtroEstadosMercaderia.length > 0) {
      resultado = resultado.filter((item) =>
        filtroEstadosMercaderia.includes(item.estado?.descripcion)
      );
    }

    // Filtro por estados de calidad
    if (filtroEstadosCalidad.length > 0) {
      resultado = resultado.filter((item) =>
        filtroEstadosCalidad.includes(item.estadoCalidad?.descripcion)
      );
    }

    return resultado;
  };

  // KARDEX VALORIZADO: Ordenamiento simple (fecha, tipo, ID)
  const kardexValorizado = useMemo(() => {
    let resultado = aplicarFiltros(kardex);

    // Ordenamiento simple para kardex valorizado
    resultado.sort((a, b) => {
      // 1. Ordenar por fecha
      const fechaA = new Date(a.fechaMovimientoAlmacen);
      const fechaB = new Date(b.fechaMovimientoAlmacen);
      if (fechaA.getTime() !== fechaB.getTime()) {
        return fechaA - fechaB;
      }
      
      // 2. Ingresos primero (true antes que false)
      if (a.esIngresoEgreso !== b.esIngresoEgreso) {
        return b.esIngresoEgreso - a.esIngresoEgreso;
      }
      
      // 3. Por ID ascendente
      return Number(a.id) - Number(b.id);
    });
    
    return resultado;
  }, [
    kardex,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroVencimiento,
    filtroEstadosMercaderia,
    filtroEstadosCalidad,
  ]);

  // KARDEX POR VARIABLES: Ordenamiento completo (fecha, tipo, variables, ID)
  const kardexPorVariables = useMemo(() => {
    let resultado = aplicarFiltros(kardex);

    // Ordenamiento completo con variables de trazabilidad
    resultado.sort((a, b) => {
      // 1. Ordenar por fecha
      const fechaA = new Date(a.fechaMovimientoAlmacen);
      const fechaB = new Date(b.fechaMovimientoAlmacen);
      if (fechaA.getTime() !== fechaB.getTime()) {
        return fechaA - fechaB;
      }
      
      // 2. Ingresos primero
      if (a.esIngresoEgreso !== b.esIngresoEgreso) {
        return b.esIngresoEgreso - a.esIngresoEgreso;
      }
      
      // 3. Variables de trazabilidad
      // 3.1 Lote
      const loteA = (a.lote || "").toLowerCase();
      const loteB = (b.lote || "").toLowerCase();
      if (loteA !== loteB) {
        return loteA.localeCompare(loteB);
      }
      
      // 3.2 Fecha Ingreso
      const fechaIngA = a.fechaIngreso ? new Date(a.fechaIngreso).getTime() : 0;
      const fechaIngB = b.fechaIngreso ? new Date(b.fechaIngreso).getTime() : 0;
      if (fechaIngA !== fechaIngB) {
        return fechaIngA - fechaIngB;
      }
      
      // 3.3 Fecha Producción
      const fechaProdA = a.fechaProduccion ? new Date(a.fechaProduccion).getTime() : 0;
      const fechaProdB = b.fechaProduccion ? new Date(b.fechaProduccion).getTime() : 0;
      if (fechaProdA !== fechaProdB) {
        return fechaProdA - fechaProdB;
      }
      
      // 3.4 Fecha Vencimiento
      const fechaVencA = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : 0;
      const fechaVencB = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : 0;
      if (fechaVencA !== fechaVencB) {
        return fechaVencA - fechaVencB;
      }
      
      // 3.5 Estado Mercadería
      const estadoA = Number(a.estadoId || 0);
      const estadoB = Number(b.estadoId || 0);
      if (estadoA !== estadoB) {
        return estadoA - estadoB;
      }
      
      // 3.6 Estado Calidad
      const calidadA = Number(a.estadoCalidadId || 0);
      const calidadB = Number(b.estadoCalidadId || 0);
      if (calidadA !== calidadB) {
        return calidadA - calidadB;
      }
      
      // 3.7 Contenedor
      const contA = (a.numContenedor || "").toLowerCase();
      const contB = (b.numContenedor || "").toLowerCase();
      if (contA !== contB) {
        return contA.localeCompare(contB);
      }
      
      // 3.8 Serie
      const serieA = (a.nroSerie || "").toLowerCase();
      const serieB = (b.nroSerie || "").toLowerCase();
      if (serieA !== serieB) {
        return serieA.localeCompare(serieB);
      }
      
      // 4. Por ID ascendente
      return Number(a.id) - Number(b.id);
    });
    
    return resultado;
  }, [
    kardex,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroVencimiento,
    filtroEstadosMercaderia,
    filtroEstadosCalidad,
  ]);

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroFechaDesde(null);
    setFiltroFechaHasta(null);
    setFiltroVencimiento(null);
    setFiltroEstadosMercaderia([]);
    setFiltroEstadosCalidad([]);
  };

  const numberTemplate = (value) => {
    if (!value && value !== 0) return "-";
    return Number(value).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const moneyTemplate = (value) => {
    if (!value && value !== 0) return "-";
    return (
      "S/ " +
      Number(value).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const dateTemplate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("es-PE");
  };

  // Template para fecha de vencimiento con colores
  const fechaVencimientoTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return "-";
    const estadoVenc = verificarVencimiento(rowData.fechaVencimiento);
    const fecha = dateTemplate(rowData.fechaVencimiento);

    let color = "inherit";
    let fontWeight = "normal";

    if (estadoVenc === "vencido") {
      color = "#dc2626";
      fontWeight = "bold";
    } else if (estadoVenc === "porVencer") {
      color = "#f59e0b";
      fontWeight = "bold";
    }

    return <span style={{ color, fontWeight }}>{fecha}</span>;
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Kardex ${
        esCustodia ? "Custodia" : "Propio"
      } - ${productoNombre}`}
      style={{ width: "95vw", maxWidth: "1600px" }}
      modal
      maximizable
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem" }}
          ></i>
        </div>
      ) : (
        <>
          {/* PANEL DE FILTROS */}
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "end",
              }}
            >
              <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
                <label
                  htmlFor="fechaDesde"
                  style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}
                >
                  Fecha Desde
                </label>
                <Calendar
                  id="fechaDesde"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Desde"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
                <label
                  htmlFor="fechaHasta"
                  style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}
                >
                  Fecha Hasta
                </label>
                <Calendar
                  id="fechaHasta"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Hasta"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: "1 1 180px", minWidth: "180px" }}>
                <label
                  htmlFor="vencimiento"
                  style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}
                >
                  Vencimiento
                </label>
                <Dropdown
                  id="vencimiento"
                  value={filtroVencimiento}
                  options={opcionesVencimiento}
                  onChange={(e) => setFiltroVencimiento(e.value)}
                  placeholder="Todos"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
                <label
                  htmlFor="estadoMercaderia"
                  style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}
                >
                  Estado Mercadería
                </label>
                <MultiSelect
                  id="estadoMercaderia"
                  value={filtroEstadosMercaderia}
                  options={opcionesEstadosMercaderia}
                  onChange={(e) => setFiltroEstadosMercaderia(e.value)}
                  placeholder="Todos"
                  display="chip"
                  style={{ width: "100%" }}
                  disabled={opcionesEstadosMercaderia.length === 0}
                />
              </div>

              <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
                <label
                  htmlFor="estadoCalidad"
                  style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}
                >
                  Estado Calidad
                </label>
                <MultiSelect
                  id="estadoCalidad"
                  value={filtroEstadosCalidad}
                  options={opcionesEstadosCalidad}
                  onChange={(e) => setFiltroEstadosCalidad(e.value)}
                  placeholder="Todos"
                  display="chip"
                  style={{ width: "100%" }}
                  disabled={opcionesEstadosCalidad.length === 0}
                />
              </div>

              <div style={{ flex: "0 0 auto" }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  onClick={limpiarFiltros}
                  size="small"
                />
              </div>
            </div>

            {/* Indicador de registros filtrados */}
            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: "#6c757d",
              }}
            >
              Mostrando <strong>{kardexValorizado.length}</strong> de{" "}
              <strong>{kardex.length}</strong> registros
            </div>
          </div>

          <TabView>
            {/* VISTA 1: KARDEX VALORIZADO */}
            <TabPanel header="Kardex Valorizado">
              <DataTable
                value={kardexValorizado}
                emptyMessage="No hay movimientos de kardex para este producto"
                size="small"
                stripedRows
                showGridlines
                scrollable
                scrollHeight="500px"
                style={{ fontSize: "11px" }}
              >
                <Column
                  field="fechaMovimientoAlmacen"
                  header="Fecha"
                  body={(row) => dateTemplate(row.fechaMovimientoAlmacen)}
                  style={{ width: "80px", fontWeight: "bold" }}
                  frozen
                />
                <Column
                  field="numDocCompleto"
                  header="N° Dcmto"
                  style={{ width: "140px", fontWeight: "bold" }}
                  frozen
                />
                <Column
                  field="esIngresoEgreso"
                  header="Tipo"
                  body={(row) => (
                    <Tag
                      value={row.esIngresoEgreso ? "INGRESO" : "EGRESO"}
                      severity={row.esIngresoEgreso ? "success" : "danger"}
                    />
                  )}
                  style={{ width: "80px", textAlign: "center" }}
                  frozen
                />

                <Column
                  field="conceptoMovAlmacen.descripcionArmada"
                  header="Concepto"
                  style={{ width: "250px", fontWeight: "bold" }}
                  frozen
                />

                {/* INGRESOS VALORIZADOS */}
                <Column
                  field="ingresoCant"
                  header="Ing.Cant"
                  body={(row) => numberTemplate(row.ingresoCant)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="ingresoCantCostoUnit"
                  header="Ing.C.Unit"
                  body={(row) => moneyTemplate(row.ingresoCantCostoUnit)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="ingresoCantCostoTotal"
                  header="Ing.C.Total"
                  body={(row) => moneyTemplate(row.ingresoCantCostoTotal)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="ingresoPeso"
                  header="Ing.Peso"
                  body={(row) => numberTemplate(row.ingresoPeso)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />

                {/* EGRESOS VALORIZADOS */}
                <Column
                  field="egresoCant"
                  header="Egr.Cant"
                  body={(row) => numberTemplate(row.egresoCant)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="egresoCantCostoUnit"
                  header="Egr.C.Unit"
                  body={(row) => moneyTemplate(row.egresoCantCostoUnit)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="egresoCantCostoTotal"
                  header="Egr.C.Total"
                  body={(row) => moneyTemplate(row.egresoCantCostoTotal)}
                  style={{
                    width: "120px",
                    textAlign: "right",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="egresoPeso"
                  header="Egr.Peso"
                  body={(row) => numberTemplate(row.egresoPeso)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />

                {/* SALDOS FINALES VALORIZADOS */}
                <Column
                  field="saldoFinalCant"
                  header="Saldo Cant"
                  body={(row) => numberTemplate(row.saldoFinalCant)}
                  style={{
                    width: "100px",
                    textAlign: "right",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="saldoFinalCostoUnitCant"
                  header="Saldo C.Unit"
                  body={(row) => moneyTemplate(row.saldoFinalCostoUnitCant)}
                  style={{
                    width: "120px",
                    textAlign: "right",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="saldoFinalCostoTotalCant"
                  header="Saldo C.Total"
                  body={(row) => moneyTemplate(row.saldoFinalCostoTotalCant)}
                  style={{
                    width: "120px",
                    textAlign: "right",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="saldoFinalPeso"
                  header="Saldo Peso"
                  body={(row) => numberTemplate(row.saldoFinalPeso)}
                  style={{
                    width: "90px",
                    textAlign: "right",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
              </DataTable>
            </TabPanel>

            {/* VISTA 2: KARDEX POR VARIABLES DE STOCK */}
            <TabPanel header="Kardex por Variables de Stock">
              <DataTable
                value={kardexPorVariables}
                emptyMessage="No hay movimientos de kardex para este producto"
                stripedRows
                showGridlines
                scrollable
                scrollHeight="500px"
                style={{ fontSize: getResponsiveFontSize() }}
                size="small"
              >
                <Column
                  field="fechaMovimientoAlmacen"
                  header="Fecha"
                  body={(row) => dateTemplate(row.fechaMovimientoAlmacen)}
                  style={{ minWidth: "80px", width: "80px", maxWidth: "80px" }}
                />
                <Column
                  field="numDocCompleto"
                  header="N° Dcmto"
                  style={{
                    minWidth: "140px",
                    width: "140px",
                    maxWidth: "140px",
                  }}
                />
                <Column
                  field="conceptoMovAlmacen.descripcionArmada"
                  header="Concepto"
                  style={{
                    minWidth: "250px",
                    width: "250px",
                    maxWidth: "250px",
                  }}
                />
                <Column
                  field="esIngresoEgreso"
                  header="Tipo"
                  body={(row) => (
                    <Tag
                      value={row.esIngresoEgreso ? "INGRESO" : "EGRESO"}
                      severity={row.esIngresoEgreso ? "success" : "danger"}
                    />
                  )}
                  style={{
                    minWidth: "100px",
                    width: "100px",
                    maxWidth: "100px",
                    textAlign: "center",
                  }}
                />

                {/* VARIABLES DE TRAZABILIDAD */}
                <Column
                  field="fechaIngreso"
                  header="Fecha Ingreso"
                  body={(row) => dateTemplate(row.fechaIngreso)}
                  style={{
                    minWidth: "70px",
                    maxWidth: "100px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="fechaProduccion"
                  header="Fecha Produccion"
                  body={(row) => dateTemplate(row.fechaProduccion)}
                  style={{
                    minWidth: "70px",
                    maxWidth: "110px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="numContenedor"
                  header="N° Contenedor"
                  style={{
                    minWidth: "120px",
                    maxWidth: "120px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="estado.descripcion"
                  header="Estado Mercaderia"
                  body={(row) => row.estado?.descripcion || "-"}
                  style={{
                    minWidth: "90px",
                    maxWidth: "120px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="estadoCalidad.descripcion"
                  header="Estado Calidad"
                  body={(row) => row.estadoCalidad?.descripcion || "-"}
                  style={{
                    minWidth: "100px",
                    maxWidth: "160px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="lote"
                  header="Lote"
                  style={{
                    minWidth: "120px",
                    maxWidth: "120px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  headerStyle={{ textAlign: "center" }}
                />
                <Column
                  field="fechaVencimiento"
                  header="Fecha Vencimiento"
                  body={fechaVencimientoTemplate}
                  style={{
                    minWidth: "70px",
                    maxWidth: "100px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                />

                {/* INGRESOS - Solo cantidades y pesos */}
                <Column
                  field="ingresoCantVariables"
                  header="Ing. Cant."
                  body={(row) => numberTemplate(row.ingresoCantVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="ingresoPesoVariables"
                  header="Ing. Peso"
                  body={(row) => numberTemplate(row.ingresoPesoVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_INGRESO,
                    fontWeight: "bold",
                  }}
                />

                {/* EGRESOS - Solo cantidades y pesos */}
                <Column
                  field="egresoCantVariables"
                  header="Egr. Cant."
                  body={(row) => numberTemplate(row.egresoCantVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="egresoPesoVariables"
                  header="Egr. Peso"
                  body={(row) => numberTemplate(row.egresoPesoVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_EGRESO,
                    fontWeight: "bold",
                  }}
                />

                {/* SALDOS INICIALES */}
                <Column
                  field="saldoInicialCantVariables"
                  header="Saldo Ini. Cant."
                  body={(row) => numberTemplate(row.saldoInicialCantVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_SALDO_INICIAL,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="saldoInicialPesoVariables"
                  header="Saldo Ini. Peso"
                  body={(row) => numberTemplate(row.saldoInicialPesoVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_SALDO_INICIAL,
                    fontWeight: "bold",
                  }}
                />

                {/* SALDOS FINALES */}
                <Column
                  field="saldoFinalCantVariables"
                  header="Saldo Fin. Cant."
                  body={(row) => numberTemplate(row.saldoFinalCantVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
                <Column
                  field="saldoFinalPesoVariables"
                  header="Saldo Fin. Peso"
                  body={(row) => numberTemplate(row.saldoFinalPesoVariables)}
                  style={{
                    minWidth: "80px",
                    maxWidth: "100px",
                    textAlign: "center",
                    backgroundColor: COLOR_SALDO,
                    fontWeight: "bold",
                  }}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </>
      )}
    </Dialog>
  );
}