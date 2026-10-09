// src/pages/MovimientoCaja.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import MovimientoCajaDialog from "../components/movimientoCaja/MovimientoCajaDialog";
import { getAllMovimientoCaja, actualizarMovimientoCaja } from "../api/movimientoCaja";
import { getEmpresas } from "../api/empresa";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../utils/utils";
import EmpresaSelector from "../components/common/EmpresaSelector";
import ReporteMovimientoFondos from "../components/reportes/ReporteMovimientoFondos";

// ============================================================
// CONFIGURACIÓN DE FILTROS
// ============================================================

const ORIGENES_MOVIMIENTO = {
  CXC: "Cobro de CxC",
  CXP: "Pago de CxP",
  TRANSFERENCIA: "Transferencia",
  REVERSION: "Reversión",
  OTROS: "Otras operaciones",
};

const NATURALEZAS = [
  { label: "Ingresos", value: "INGRESO" },
  { label: "Egresos", value: "EGRESO" },
];

const LIBROS = [
  { label: "Fiscal (Blanca)", value: "FISCAL" },
  { label: "Gerencial (Negra)", value: "GERENCIAL" },
];

const DOCUMENTO_SUSTENTO = [
  { label: "Con factura", value: "CON" },
  { label: "Sin factura", value: "SIN" },
];

const origenDe = (m) => {
  if (m.esReversion) return "REVERSION";
  if (m.esTransferencia || m.tipoMovimiento?.esTransferencia) return "TRANSFERENCIA";
  if (m.cuentaPorCobrarId) return "CXC";
  if (m.cuentaPorPagarId) return "CXP";
  return "OTROS";
};

const nombreCuenta = (c) =>
  `${c.banco?.nombre || "Banco"} · ${c.numeroCuenta || c.id}${c.moneda?.simbolo ? ` (${c.moneda.simbolo})` : ""}`;

/**
 * Filtros de selección múltiple. Cada uno es dinámico y cruzado: sus opciones se calculan
 * sobre los movimientos que cumplen TODOS los demás filtros (el filtro se excluye a sí mismo).
 * `extraer` devuelve las opciones {id, label} que aporta un movimiento a la faceta.
 */
const FACETAS = [
  {
    key: "estados",
    label: "Estado",
    placeholder: "Todos los estados",
    extraer: (m) =>
      m.estadoMovimientoCaja
        ? [{ id: m.estadoId, label: m.estadoMovimientoCaja.descripcion || m.estadoMovimientoCaja.nombre || `Estado ${m.estadoId}` }]
        : [],
  },
  {
    key: "monedas",
    label: "Moneda",
    placeholder: "Todas las monedas",
    extraer: (m) =>
      m.moneda
        ? [{ id: m.monedaId, label: `${m.moneda.codigoSunat || ""}${m.moneda.simbolo ? ` (${m.moneda.simbolo})` : ""}`.trim() }]
        : [],
  },
  {
    key: "tipos",
    label: "Tipo de Movimiento",
    placeholder: "Todos los tipos",
    extraer: (m) =>
      m.tipoMovimiento ? [{ id: m.tipoMovimientoId, label: m.tipoMovimiento.nombre }] : [],
  },
  {
    key: "entidades",
    label: "Entidad Comercial",
    placeholder: "Todas las entidades",
    extraer: (m) =>
      m.entidadComercial
        ? [{
            id: m.entidadComercialId,
            label: `${m.entidadComercial.razonSocial}${m.entidadComercial.numeroDocumento ? ` - ${m.entidadComercial.numeroDocumento}` : ""}`,
          }]
        : [],
  },
  {
    key: "mediosPago",
    label: "Medio de Pago",
    placeholder: "Todos los medios",
    extraer: (m) =>
      m.medioPago ? [{ id: m.medioPagoId, label: m.medioPago.nombre }] : [],
  },
  {
    key: "cuentas",
    label: "Cuenta Bancaria (origen / destino)",
    placeholder: "Todas las cuentas",
    extraer: (m) =>
      [m.cuentaCorrienteOrigen, m.cuentaCorrienteDestino]
        .filter(Boolean)
        .map((c) => ({ id: c.id, label: nombreCuenta(c) })),
  },
  {
    key: "centrosCosto",
    label: "Centro de Costo",
    placeholder: "Todos los centros",
    extraer: (m) =>
      m.centroCosto
        ? [{ id: m.centroCostoId, label: `${m.centroCosto.Codigo ? `${m.centroCosto.Codigo} - ` : ""}${m.centroCosto.Nombre}` }]
        : [],
  },
  {
    key: "origenes",
    label: "Origen de la Operación",
    placeholder: "Todos los orígenes",
    extraer: (m) => {
      const origen = origenDe(m);
      return [{ id: origen, label: ORIGENES_MOVIMIENTO[origen] }];
    },
  },
];

const FILTROS_INICIALES = {
  empresaId: null,
  rangoFechas: null,
  naturaleza: null,
  libro: null,
  sustento: null,
  montoMin: null,
  montoMax: null,
  busqueda: "",
  estados: [],
  monedas: [],
  tipos: [],
  entidades: [],
  mediosPago: [],
  cuentas: [],
  centrosCosto: [],
  origenes: [],
};

const FACETAS_AVANZADAS = ["tipos", "entidades", "mediosPago", "cuentas", "centrosCosto", "origenes"];

const coincideBusqueda = (m, texto) => {
  const t = (texto || "").trim().toLowerCase();
  if (!t) return true;
  if (t.startsWith("#")) {
    const id = t.slice(1).trim();
    return String(m.id) === id || String(m.refOperacionEspecializadaMovCaja ?? "") === id;
  }
  return [
    m.descripcion,
    m.referenciaExtId,
    m.numeroOperacionPagoBanco,
    m.numeroOperacionPagoBancoImpuesto,
    m.entidadComercial?.razonSocial,
    m.entidadComercial?.numeroDocumento,
    m.producto?.descripcionArmada,
    m.producto?.codigo,
  ].some((v) => v && String(v).toLowerCase().includes(t));
};

/**
 * Aplica todos los filtros sobre la lista. `excluir` omite una faceta
 * para calcular las opciones de esa misma faceta.
 */
const filtrarMovimientos = (lista, filtros, excluir = null) => {
  const [desde, hasta] = filtros.rangoFechas || [];
  const fechaIni = desde ? new Date(desde) : null;
  if (fechaIni) fechaIni.setHours(0, 0, 0, 0);
  const fechaFin = hasta ? new Date(hasta) : null;
  if (fechaFin) fechaFin.setHours(23, 59, 59, 999);

  return lista.filter((m) => {
    if (filtros.empresaId && Number(m.empresaId) !== Number(filtros.empresaId)) return false;

    if (fechaIni) {
      if (!m.fechaOperacionMovCaja) return false;
      const fecha = new Date(m.fechaOperacionMovCaja);
      if (fecha < fechaIni || (fechaFin && fecha > fechaFin)) return false;
    }

    if (filtros.naturaleza === "INGRESO" && m.tipoMovimiento?.esIngreso !== true) return false;
    if (filtros.naturaleza === "EGRESO" && m.tipoMovimiento?.esIngreso !== false) return false;

    if (filtros.libro === "FISCAL" && m.esGerencial) return false;
    if (filtros.libro === "GERENCIAL" && !m.esGerencial) return false;

    if (filtros.sustento === "CON" && m.operacionSinFactura) return false;
    if (filtros.sustento === "SIN" && !m.operacionSinFactura) return false;

    const monto = Number(m.monto) || 0;
    if (filtros.montoMin !== null && monto < filtros.montoMin) return false;
    if (filtros.montoMax !== null && monto > filtros.montoMax) return false;

    if (!coincideBusqueda(m, filtros.busqueda)) return false;

    for (const faceta of FACETAS) {
      if (faceta.key === excluir) continue;
      const seleccion = filtros[faceta.key];
      if (seleccion.length === 0) continue;
      const aporta = faceta.extraer(m);
      if (!aporta.some((o) => seleccion.some((id) => String(id) === String(o.id)))) return false;
    }
    return true;
  });
};

export default function MovimientoCaja({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [empresas, setEmpresas] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false);

  const setFiltro = (clave, valor) => setFiltros((prev) => ({ ...prev, [clave]: valor }));

  useEffect(() => {
    loadData();
  }, []);

  // Búsqueda de texto con retardo para no recalcular en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setFiltro("busqueda", busquedaInput), 300);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [movimientosData, empresasData] = await Promise.all([
        getAllMovimientoCaja(),
        getEmpresas(),
      ]);
      setMovimientos(movimientosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos",
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const movimientosFiltrados = useMemo(
    () => filtrarMovimientos(movimientos, filtros),
    [movimientos, filtros]
  );

  // Registros para el reporte: de TODAS las empresas; respetan los demás filtros salvo el rango,
  // que se elige en el propio reporte
  const movimientosParaReporte = useMemo(
    () => filtrarMovimientos(movimientos, { ...filtros, empresaId: null, rangoFechas: null }),
    [movimientos, filtros]
  );

  // Opciones dinámicas y cruzadas de cada filtro múltiple
  const opcionesPorFaceta = useMemo(() => {
    const resultado = {};
    FACETAS.forEach((faceta) => {
      const mapa = new Map();
      filtrarMovimientos(movimientos, filtros, faceta.key).forEach((m) =>
        faceta.extraer(m).forEach((o) => mapa.set(String(o.id), o))
      );
      resultado[faceta.key] = [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label));
    });
    return resultado;
  }, [movimientos, filtros]);

  // Depurar selecciones que ya no tienen movimientos al cambiar otros filtros
  useEffect(() => {
    if (movimientos.length === 0) return;
    setFiltros((prev) => {
      let cambio = false;
      const siguiente = { ...prev };
      FACETAS.forEach((faceta) => {
        const validos = prev[faceta.key].filter((id) =>
          opcionesPorFaceta[faceta.key].some((o) => String(o.id) === String(id))
        );
        if (validos.length !== prev[faceta.key].length) {
          siguiente[faceta.key] = validos;
          cambio = true;
        }
      });
      return cambio ? siguiente : prev;
    });
  }, [opcionesPorFaceta, movimientos.length]);

  const cantidadAvanzados =
    FACETAS_AVANZADAS.reduce((acc, k) => acc + filtros[k].length, 0) +
    (filtros.libro ? 1 : 0) +
    (filtros.sustento ? 1 : 0) +
    (filtros.montoMin !== null || filtros.montoMax !== null ? 1 : 0);

  const hayFiltros =
    cantidadAvanzados > 0 ||
    !!filtros.rangoFechas ||
    !!filtros.naturaleza ||
    !!filtros.busqueda ||
    filtros.estados.length > 0 ||
    filtros.monedas.length > 0;

  // La empresa se conserva: el selector sigue mostrando la empresa activa
  const limpiarFiltros = () => {
    setFiltros({ ...FILTROS_INICIALES, empresaId: filtros.empresaId });
    setBusquedaInput("");
  };

  const calcularTotalesPorMoneda = () => {
    let totalSoles = 0;
    let totalDolares = 0;
    let colorFondoSoles = "#FFE5B4";
    let colorFondoDolares = "#C8E6C9";
    let simboloSoles = "S/";
    let simboloDolares = "$";

    movimientosFiltrados.forEach(m => {
      const monto = Number(m.monto) || 0;

      if (Number(m.monedaId) === 1) {
        totalSoles += monto;
        if (m.moneda?.colorFondo) colorFondoSoles = m.moneda.colorFondo;
        if (m.moneda?.simbolo) simboloSoles = m.moneda.simbolo;
      } else if (Number(m.monedaId) === 2) {
        totalDolares += monto;
        if (m.moneda?.colorFondo) colorFondoDolares = m.moneda.colorFondo;
        if (m.moneda?.simbolo) simboloDolares = m.moneda.simbolo;
      }
    });

    return {
      totalSoles,
      totalDolares,
      colorFondoSoles,
      colorFondoDolares,
      simboloSoles,
      simboloDolares
    };
  };

  const footerTemplate = () => {
    const {
      totalSoles,
      totalDolares,
      colorFondoSoles,
      colorFondoDolares,
      simboloSoles,
      simboloDolares
    } = calcularTotalesPorMoneda();

    return (
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "15px",
        padding: "10px",
        fontWeight: "bold",
        fontSize: "14px"
      }}>
        <span>TOTALES:</span>
        {totalSoles > 0 && (
          <div style={{
            backgroundColor: colorFondoSoles,
            padding: "6px 12px",
            borderRadius: "4px",
            fontWeight: "bold"
          }}>
            {simboloSoles} {formatearNumero(totalSoles, 2)}
          </div>
        )}
        {totalDolares > 0 && (
          <div style={{
            backgroundColor: colorFondoDolares,
            padding: "6px 12px",
            borderRadius: "4px",
            fontWeight: "bold"
          }}>
            {simboloDolares} {formatearNumero(totalDolares, 2)}
          </div>
        )}
      </div>
    );
  };

  const onRowClick = (e) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      setSelectedMovimiento(e.data);
      setShowDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedMovimiento(null);
  };

  // ⭐ NUEVO: Manejar cambios en los campos del movimiento
  const handleFieldChange = (field, value) => {
    setSelectedMovimiento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ⭐ NUEVO: Guardar/actualizar movimiento
  const handleSaveMovimiento = async (movimientoActualizado) => {
    try {


      // ✅ IMPORTANTE: Filtrar solo los campos que se pueden actualizar
      // No enviar relaciones ni campos calculados
      const datosActualizacion = {
        empresaId: movimientoActualizado.empresaId,
        tipoMovimientoId: movimientoActualizado.tipoMovimientoId,
        entidadComercialId: movimientoActualizado.entidadComercialId,
        monto: movimientoActualizado.monto,
        monedaId: movimientoActualizado.monedaId,
        descripcion: movimientoActualizado.descripcion,
        medioPagoId: movimientoActualizado.medioPagoId,
        estadoId: movimientoActualizado.estadoId,
        cuentaCorrienteDestinoId: movimientoActualizado.cuentaCorrienteDestinoId,
        cuentaCorrienteOrigenId: movimientoActualizado.cuentaCorrienteOrigenId,
        centroCostoId: movimientoActualizado.centroCostoId,
        fechaOperacionMovCaja: movimientoActualizado.fechaOperacionMovCaja,
        numeroOperacion: movimientoActualizado.numeroOperacion,
        // Solo incluir campos opcionales si existen
        ...(movimientoActualizado.referenciaExtId && { referenciaExtId: movimientoActualizado.referenciaExtId }),
        ...(movimientoActualizado.productoId && { productoId: movimientoActualizado.productoId }),
        ...(movimientoActualizado.tipoCambio && { tipoCambio: movimientoActualizado.tipoCambio }),
      };


      await actualizarMovimientoCaja(movimientoActualizado.id, datosActualizacion);
      
      // Recargar la lista de movimientos
      await loadData();
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento de caja actualizado correctamente",
        life: 3000,
      });
      
      return true;
    } catch (error) {
      console.error("Error al actualizar movimiento:", error);
      throw new Error(error.response?.data?.message || "No se pudo actualizar el movimiento de caja");
    }
  };

  const fechaTemplate = (rowData) => formatearFecha(rowData.fechaOperacionMovCaja, "");

  const montoTemplate = (rowData) => {
    const monto = Number(rowData.monto) || 0;
    const simboloMoneda = rowData.moneda?.simbolo || "";
    const esIngreso = rowData.tipoMovimiento?.esIngreso;
    const severity = esIngreso === true ? "success" : esIngreso === false ? "danger" : "info";

    return (
      <div style={{ textAlign: "right" }}>
        <Tag
          value={`${simboloMoneda} ${formatearNumero(monto)}`}
          severity={severity}
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold"
          }}
        />
      </div>
    );
  };

  const correlativoTemplate = (rowData) => {
    if (!rowData.refOperacionEspecializadaMovCaja) return "-";
    return <Tag value={`#${rowData.refOperacionEspecializadaMovCaja}`} severity="info" />;
  };

  const estadoTemplate = (rowData) => {
    if (!rowData.estadoMovimientoCaja) return "N/A";
    const severity = rowData.estadoMovimientoCaja.severityColor || "secondary";
    return (
      <Badge
        value={rowData.estadoMovimientoCaja.descripcion || rowData.estadoMovimientoCaja.nombre}
        severity={severity}
        size="small"
      />
    );
  };

  const tipoMovimientoTemplate = (rowData) => {
    return rowData.tipoMovimiento?.nombre || "N/A";
  };

  const entidadTemplate = (rowData) => rowData.entidadComercial?.razonSocial || "-";

  const medioPagoTemplate = (rowData) => rowData.medioPago?.nombre || "-";

  const empresaTemplate = (rowData) => {
    if (!rowData.empresa) return "N/A";
    return (
      <div>
        <div className="font-medium text-blue-600">
          {rowData.empresa.razonSocial || rowData.empresa.nombreComercial || "Sin nombre"}
        </div>
      </div>
    );
  };

  const monedaTemplate = (rowData) => {
    return rowData.moneda?.codigoSunat || "";
  };

  const ordenarPorMonto = (e) =>
    [...e.data].sort((a, b) => e.order * ((Number(a.monto) || 0) - (Number(b.monto) || 0)));

  // MultiSelect de una faceta con opciones dinámicas y cruzadas
  const renderFaceta = (clave) => {
    const faceta = FACETAS.find((f) => f.key === clave);
    const opciones = opcionesPorFaceta[clave] || [];
    return (
      <div style={{ flex: 2, minWidth: "220px" }} key={clave}>
        <label htmlFor={`faceta-${clave}`} style={{ fontWeight: "bold" }}>
          {faceta.label}
        </label>
        <MultiSelect
          id={`faceta-${clave}`}
          value={filtros[clave]}
          options={opciones}
          optionLabel="label"
          optionValue="id"
          onChange={(e) => setFiltro(clave, e.value)}
          placeholder={faceta.placeholder}
          filter
          showClear
          display="comma"
          maxSelectedLabels={2}
          selectedItemsLabel="{0} seleccionados"
          emptyMessage="Sin opciones con los filtros actuales"
          disabled={loading}
          style={{ width: "100%" }}
        />
        <small style={{ color: "#6c757d" }}>{opciones.length} opción(es) disponible(s)</small>
      </div>
    );
  };

  const filaStyle = {
    alignItems: "start",
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={movimientosFiltrados}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          footer={footerTemplate}
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 150]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
          sortField="id"
          sortOrder={-1}
          style={{
            cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize()
          }}
          onRowClick={permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined}
          emptyMessage="No se encontraron movimientos"
          header={
            <div>
              <div style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row"
              }}>
                <div style={{ flex: 2 }}>
                  <h2>Movimientos de Caja</h2>
                  <small style={{ color: "#6c757d" }}>
                    {movimientosFiltrados.length} de {movimientos.length} movimiento(s)
                  </small>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: "bold" }}>Empresa*</label>
                  <EmpresaSelector
                    empresaId={usuario?.empresaId}
                    onEmpresaChange={(id) => setFiltro("empresaId", id)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Más filtros"
                    icon={mostrarAvanzados ? "pi pi-chevron-up" : "pi pi-sliders-h"}
                    className="p-button-outlined"
                    badge={cantidadAvanzados > 0 ? String(cantidadAvanzados) : null}
                    badgeClassName="p-badge-info"
                    onClick={() => setMostrarAvanzados((v) => !v)}
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <ReporteMovimientoFondos
                    movimientos={movimientosParaReporte}
                    rangoFechas={filtros.rangoFechas}
                    empresas={empresas}
                    usuarioNombre={usuario?.nombreCompleto || usuario?.username || usuario?.email || ""}
                    toast={toast}
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    className="p-button-secondary"
                    outlined
                    onClick={limpiarFiltros}
                    disabled={loading || !hayFiltros}
                  />
                </div>
              </div>

              {/* Filtros principales */}
              <div style={filaStyle}>
                <div style={{ flex: 2, minWidth: "220px" }}>
                  <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
                    Rango de Fechas
                  </label>
                  <Calendar
                    id="rangoFechas"
                    value={filtros.rangoFechas}
                    onChange={(e) => setFiltro("rangoFechas", e.value)}
                    selectionMode="range"
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    placeholder="Seleccionar rango..."
                    style={{ width: "100%" }}
                    disabled={loading}
                    readOnlyInput
                  />
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label htmlFor="naturalezaFiltro" style={{ fontWeight: "bold" }}>
                    Naturaleza
                  </label>
                  <Dropdown
                    id="naturalezaFiltro"
                    value={filtros.naturaleza}
                    options={NATURALEZAS}
                    onChange={(e) => setFiltro("naturaleza", e.value)}
                    placeholder="Ingresos y egresos"
                    showClear
                    disabled={loading}
                  />
                </div>
                {renderFaceta("estados")}
                {renderFaceta("monedas")}
                <div style={{ flex: 3, minWidth: "260px" }}>
                  <label htmlFor="busquedaFiltro" style={{ fontWeight: "bold" }}>
                    Buscar
                  </label>
                  <span className="p-input-icon-left" style={{ width: "100%" }}>
                    <i className="pi pi-search" />
                    <InputText
                      id="busquedaFiltro"
                      value={busquedaInput}
                      onChange={(e) => setBusquedaInput(e.target.value)}
                      placeholder="Descripción, N° operación, entidad... (#ID o #correlativo)"
                      style={{ width: "100%" }}
                      disabled={loading}
                    />
                  </span>
                </div>
              </div>

              {/* Filtros avanzados */}
              {mostrarAvanzados && (
                <>
                  <div style={filaStyle}>
                    {renderFaceta("tipos")}
                    {renderFaceta("entidades")}
                    {renderFaceta("mediosPago")}
                  </div>
                  <div style={filaStyle}>
                    {renderFaceta("cuentas")}
                    {renderFaceta("centrosCosto")}
                    {renderFaceta("origenes")}
                  </div>
                  <div style={filaStyle}>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <label htmlFor="libroFiltro" style={{ fontWeight: "bold" }}>
                        Tipo de Libro
                      </label>
                      <Dropdown
                        id="libroFiltro"
                        value={filtros.libro}
                        options={LIBROS}
                        onChange={(e) => setFiltro("libro", e.value)}
                        placeholder="Fiscal y gerencial"
                        showClear
                        disabled={loading}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <label htmlFor="sustentoFiltro" style={{ fontWeight: "bold" }}>
                        Documento Sustento
                      </label>
                      <Dropdown
                        id="sustentoFiltro"
                        value={filtros.sustento}
                        options={DOCUMENTO_SUSTENTO}
                        onChange={(e) => setFiltro("sustento", e.value)}
                        placeholder="Con y sin factura"
                        showClear
                        disabled={loading}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <label htmlFor="montoMinFiltro" style={{ fontWeight: "bold" }}>
                        Monto Mínimo
                      </label>
                      <InputNumber
                        id="montoMinFiltro"
                        value={filtros.montoMin}
                        onValueChange={(e) => setFiltro("montoMin", e.value ?? null)}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        min={0}
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <label htmlFor="montoMaxFiltro" style={{ fontWeight: "bold" }}>
                        Monto Máximo
                      </label>
                      <InputNumber
                        id="montoMaxFiltro"
                        value={filtros.montoMax}
                        onValueChange={(e) => setFiltro("montoMax", e.value ?? null)}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        min={0}
                        placeholder="Sin límite"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            style={{ width: 80, verticalAlign: "top" }}
            sortable
          />
          <Column
            field="empresa.razonSocial"
            header="Empresa"
            body={empresaTemplate}
            style={{ verticalAlign: "top" }}
            sortable
          />
          <Column
            field="fechaOperacionMovCaja"
            header="Fecha"
            body={fechaTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="tipoMovimiento.nombre"
            header="Tipo"
            body={tipoMovimientoTemplate}
            style={{ width: 200, verticalAlign: "top" }}
            sortable
          />
          <Column
            field="entidadComercial.razonSocial"
            header="Entidad Comercial"
            body={entidadTemplate}
            style={{ verticalAlign: "top" }}
            sortable
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ verticalAlign: "top" }}
            sortable
          />
          <Column
            field="medioPago.nombre"
            header="Medio de Pago"
            body={medioPagoTemplate}
            style={{ width: 140, verticalAlign: "top" }}
            sortable
          />
          <Column
            field="moneda.codigoSunat"
            header="Moneda"
            body={monedaTemplate}
            style={{ width: 80, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="monto"
            header="Monto"
            body={montoTemplate}
            style={{ width: 180, textAlign: "right", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "right" }}
            sortable
            sortFunction={ordenarPorMonto}
          />
          <Column
            field="refOperacionEspecializadaMovCaja"
            header="Correlativo"
            body={correlativoTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="estadoMovimientoCaja.descripcion"
            header="Estado"
            body={estadoTemplate}
            style={{ width: 150, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
        </DataTable>
      </div>

      <MovimientoCajaDialog
        visible={showDialog}
        movimiento={selectedMovimiento}
        empresas={empresas}
        onHide={handleCloseDialog}
        toast={toast}
        onFieldChange={handleFieldChange}
        onSave={handleSaveMovimiento}
        readOnly={!permisos.puedeEditar}
      />
    </div>
  );
}
