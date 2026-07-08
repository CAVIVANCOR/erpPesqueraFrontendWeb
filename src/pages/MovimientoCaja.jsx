// src/pages/MovimientoCaja.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import MovimientoCajaDialog from "../components/movimientoCaja/MovimientoCajaDialog";
import { getAllMovimientoCaja } from "../api/movimientoCaja";
import { getEmpresas } from "../api/empresa";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../utils/utils";
import EmpresaSelector from "../components/common/EmpresaSelector";

// Constantes de estados de Movimientos Caja
const ESTADOS_MOVIMIENTO_CAJA = {
  PENDIENTE: 20,
  VALIDADO: 21,
  ASIENTO_GENERADO: 22
};

const ESTADOS_MOVIMIENTO_CAJA_IDS = Object.values(ESTADOS_MOVIMIENTO_CAJA);

export default function MovimientoCaja({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [movimientos, setMovimientos] = useState([]);
  const [movimientosFiltrados, setMovimientosFiltrados] = useState([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [empresas, setEmpresas] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [estados, setEstados] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [empresaIdSelector, setEmpresaIdSelector] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  const [tiposMovimientoUnicos, setTiposMovimientoUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [movimientosData, empresasData, tiposMovData, estadosData] = await Promise.all([
        getAllMovimientoCaja(),
        getEmpresas(),
        getAllTipoMovEntregaRendir(),
        getEstadosMultiFuncion()
      ]);

      // Filtrar solo estados de Movimientos Caja
      const estadosMovimientoCaja = estadosData.filter(e =>
        ESTADOS_MOVIMIENTO_CAJA_IDS.includes(Number(e.id))
      );

      setMovimientos(movimientosData);
      setMovimientosFiltrados(movimientosData);
      setEmpresas(empresasData);
      setTiposMovimiento(tiposMovData);
      setEstados(estadosMovimientoCaja);
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

  const obtenerOpcionesDinamicas = () => {
    const datosParaOpciones = movimientosFiltrados.length > 0 ? movimientosFiltrados : movimientos;

    const tiposMovimientoUnicos = [...new Map(
      datosParaOpciones
        .filter(m => m.tipoMovimiento)
        .map(m => [m.tipoMovimiento.id, m.tipoMovimiento])
    ).values()];

    const estadosUnicos = [...new Map(
      datosParaOpciones
        .filter(m => m.estadoMovimientoCaja)
        .map(m => [m.estadoMovimientoCaja.id, m.estadoMovimientoCaja])
    ).values()];

    return {
      tiposMovimientoUnicos,
      estadosUnicos
    };
  };

  useEffect(() => {
    const opciones = obtenerOpcionesDinamicas();
    setTiposMovimientoUnicos(opciones.tiposMovimientoUnicos);
    setEstadosUnicos(opciones.estadosUnicos);

    if (tipoSeleccionado && !opciones.tiposMovimientoUnicos.find(t => Number(t.id) === Number(tipoSeleccionado))) {
      setTipoSeleccionado(null);
    }
    if (estadoSeleccionado && !opciones.estadosUnicos.find(e => Number(e.id) === Number(estadoSeleccionado))) {
      setEstadoSeleccionado(null);
    }
  }, [movimientosFiltrados, movimientos, empresaSeleccionada]);

  useEffect(() => {
    aplicarFiltros();
  }, [empresaSeleccionada, rangoFechas, tipoSeleccionado, estadoSeleccionado, movimientos]);

  const aplicarFiltros = () => {
    let filtrados = [...movimientos];

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(m => Number(m.empresaOrigenId) === Number(empresaSeleccionada));
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter(m => {
        const fechaMov = new Date(m.fechaOperacionMovCaja);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        if (rangoFechas[1]) {
          const fechaFin = new Date(rangoFechas[1]);
          fechaFin.setHours(23, 59, 59, 999);
          return fechaMov >= fechaIni && fechaMov <= fechaFin;
        }
        return fechaMov >= fechaIni;
      });
    }

    if (tipoSeleccionado) {
      filtrados = filtrados.filter(m => Number(m.tipoMovimientoId) === Number(tipoSeleccionado));
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(m => Number(m.estadoId) === Number(estadoSeleccionado));
    }

    setMovimientosFiltrados(filtrados);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setRangoFechas(null);
    setTipoSeleccionado(null);
    setEstadoSeleccionado(null);
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

  const fechaTemplate = (rowData) => formatearFecha(rowData.fechaOperacionMovCaja, "");

  const montoTemplate = (rowData) => {
    const monto = Number(rowData.monto) || 0;
    const simboloMoneda = rowData.moneda?.simbolo || "";

    return (
      <div style={{ textAlign: "right" }}>
        <Tag
          value={`${simboloMoneda} ${formatearNumero(monto)}`}
          severity="info"
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
        value={rowData.estadoMovimientoCaja.nombre}
        severity={severity}
        size="small"
      />
    );
  };

  const tipoMovimientoTemplate = (rowData) => {
    return rowData.tipoMovimiento?.nombre || "N/A";
  };

  const empresaTemplate = (rowData) => {
    if (!rowData.empresaOrigen) return "N/A";
    return (
      <div>
        <div className="font-medium text-blue-600">
          {rowData.empresaOrigen.razonSocial || "Sin nombre"}
        </div>
      </div>
    );
  };

  const monedaTemplate = (rowData) => {
    return rowData.moneda?.codigoSunat || "";
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
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: "bold" }}>Empresa*</label>
                  <EmpresaSelector
                    empresaId={usuario?.empresaId}
                    onEmpresaChange={(id) => {
                      setEmpresaIdSelector(id);
                      setEmpresaSeleccionada(id);
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    className="p-button-secondary"
                    outlined
                    onClick={limpiarFiltros}
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row"
              }}>
                <div style={{ flex: 2 }}>
                  <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
                    Rango de Fechas
                  </label>
                  <Calendar
                    id="rangoFechas"
                    value={rangoFechas}
                    onChange={(e) => setRangoFechas(e.value)}
                    selectionMode="range"
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Seleccionar rango..."
                    style={{ width: "100%" }}
                    disabled={loading}
                    readOnlyInput
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="tipoFiltro" style={{ fontWeight: "bold" }}>
                    Tipo Movimiento
                  </label>
                  <Dropdown
                    id="tipoFiltro"
                    value={tipoSeleccionado}
                    options={tiposMovimientoUnicos.map((t) => ({
                      label: t.nombre,
                      value: Number(t.id)
                    }))}
                    onChange={(e) => setTipoSeleccionado(e.value)}
                    placeholder="Todos"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                    Estado
                  </label>
                  <Dropdown
                    id="estadoFiltro"
                    value={estadoSeleccionado}
                    options={estadosUnicos.map((e) => ({
                      label: e.descripcion,
                      value: Number(e.id)
                    }))}
                    onChange={(e) => setEstadoSeleccionado(e.value)}
                    placeholder="Todos"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    disabled={loading}
                  />
                </div>
              </div>
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
            field="empresaOrigenId"
            header="Empresa"
            body={empresaTemplate}
            style={{ verticalAlign: "top" }}
          />
          <Column
            field="fechaOperacionMovCaja"
            header="Fecha"
            body={fechaTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Tipo"
            body={tipoMovimientoTemplate}
            style={{ width: 200, verticalAlign: "top" }}
            sortable
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ verticalAlign: "top" }}
            sortable
          />
          <Column
            field="monedaId"
            header="Moneda"
            body={monedaTemplate}
            style={{ width: 80, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            header="Monto"
            body={montoTemplate}
            style={{ width: 180, textAlign: "right", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "right" }}
          />
          <Column
            field="refOperacionEspecializadaMovCaja"
            header="Correlativo"
            body={correlativoTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="estadoId"
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
      />
    </div>
  );
}