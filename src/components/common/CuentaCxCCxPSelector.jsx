/**
 * CuentaCxCCxPSelector.jsx
 *
 * Componente UNIFICADO para selección de Cuentas por Cobrar (CxC) y Cuentas por Pagar (CxP)
 * Muestra Tags con colores para N° Documento, Fecha, Entidad, Monto y Saldo
 * Incluye filtros dinámicos por empresa, entidad comercial y rango de fechas
 *
 * PATRÓN: Componente parametrizable por tipo (CXC | CXP)
 * - CARGA INTERNAMENTE todas las cuentas pendientes según el tipo
 * - Filtra dinámicamente por empresa, entidad y rango de fechas
 * - Permite preseleccionar empresa, entidad y cuenta desde props
 * - Solo muestra cuentas con saldo pendiente > 0
 *
 * @param {string} tipo - "CXC" para Cuentas por Cobrar, "CXP" para Cuentas por Pagar
 * @author ERP Megui
 * @version 2.0.0 - Unificado CxC/CxP
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import { getCuentaPorCobrar } from "../../api/cuentasPorCobrarPagar/cuentaPorCobrar";
import { getCuentaPorPagar } from "../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { getAllEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import {
  getResponsiveFontSize,
  formatearFecha,
  formatearNumero,
} from "../../utils/utils";

/**
 * Configuración por tipo de cuenta
 */
const CONFIG = {
  CXC: {
    api: getCuentaPorCobrar,
    campoDocumento: "numeroPreFactura",
    campoEntidad: "clienteId",
    labelEntidad: "Cliente",
    labelEntidadPlural: "Clientes",
    iconoEntidad: "pi-user",
    labelCuenta: "Cuenta por Cobrar",
    labelCuentaPlural: "Cuentas por Cobrar",
    placeholder: "Seleccione una cuenta por cobrar...",
    headerDialog: "Seleccionar Cuenta por Cobrar",
    tooltipBuscar: "Buscar cuenta por cobrar",
    emptyMessage: "No se encontraron cuentas por cobrar pendientes",
  },
  CXP: {
    api: getCuentaPorPagar,
    campoDocumento: "numeroOrdenCompra",
    campoEntidad: "proveedorId",
    labelEntidad: "Proveedor",
    labelEntidadPlural: "Proveedores",
    iconoEntidad: "pi-building",
    labelCuenta: "Cuenta por Pagar",
    labelCuentaPlural: "Cuentas por Pagar",
    placeholder: "Seleccione una cuenta por pagar...",
    headerDialog: "Seleccionar Cuenta por Pagar",
    tooltipBuscar: "Buscar cuenta por pagar",
    emptyMessage: "No se encontraron cuentas por pagar pendientes",
  },
};

/**
 * Paleta de colores para filtros de empresa
 */
const COLORES_CATEGORIAS = [
  { bg: "#4CAF50", text: "#FFFFFF", border: "#4CAF50" }, // Verde
  { bg: "#00BCD4", text: "#FFFFFF", border: "#00BCD4" }, // Cyan
  { bg: "#FF9800", text: "#FFFFFF", border: "#FF9800" }, // Naranja
  { bg: "#009688", text: "#FFFFFF", border: "#009688" }, // Teal
  { bg: "#9C27B0", text: "#FFFFFF", border: "#9C27B0" }, // Morado
  { bg: "#3F51B5", text: "#FFFFFF", border: "#3F51B5" }, // Índigo
  { bg: "#E91E63", text: "#FFFFFF", border: "#E91E63" }, // Rosa
  { bg: "#FFC107", text: "#000000", border: "#FFC107" }, // Ámbar
];

const COLOR_TODAS = { bg: "#2196F3", text: "#FFFFFF", border: "#2196F3" };

const getColorCategoria = (index) => {
  return COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length];
};

/**
 * Helper: Obtiene el nombre de la empresa dado un empresaId
 */
const getEmpresaNombre = (empresaId, empresas) => {
  if (!empresaId || !empresas || empresas.length === 0) return "Sin empresa";
  const empresa = empresas.find((e) => Number(e.id) === Number(empresaId));
  return empresa?.nombre || empresa?.razonSocial || `ID: ${empresaId}`;
};

/**
 * Helper: Obtiene el nombre de la entidad (cliente o proveedor) dado un entidadId
 */
const getEntidadNombre = (entidadId, entidades) => {
  if (!entidadId || !entidades || entidades.length === 0) return "Sin entidad";
  const entidad = entidades.find((e) => Number(e.id) === Number(entidadId));
  return entidad?.razonSocial || entidad?.nombre || `ID: ${entidadId}`;
};

export default function CuentaCxCCxPSelector({
  tipo = "CXC", // "CXC" o "CXP"
  value,
  empresaIdPreseleccionada = null,
  entidadIdPreseleccionada = null, // clienteId o proveedorId según tipo
  onChange,
  disabled = false,
  label = null, // Si null, usa el del CONFIG
  placeholder = null, // Si null, usa el del CONFIG
  cuentaActual = null,
}) {
  const config = CONFIG[tipo];

  const [visible, setVisible] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Filtros
  const [filtroEmpresaId, setFiltroEmpresaId] = useState(
    empresaIdPreseleccionada,
  );
  const [filtroEntidadId, setFiltroEntidadId] = useState(
    entidadIdPreseleccionada,
  );
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);

  const dt = useRef(null);

  // Cuenta seleccionada actual
  const cuentaSeleccionada = useMemo(() => {
    if (cuentaActual && Number(cuentaActual.id) === Number(value)) {
      return cuentaActual;
    }

    if (!value || !cuentas || cuentas.length === 0) return null;
    return cuentas.find((c) => Number(c.id) === Number(value));
  }, [value, cuentas, cuentaActual]);

  // Cargar datos al abrir el diálogo O si hay cuentaActual pero no hay entidades cargadas
  useEffect(() => {
    if (visible) {
      cargarDatos();
    } else if (cuentaActual && entidades.length === 0) {
      cargarEntidadesInicial();
    }
  }, [visible, cuentaActual]);

  const cargarEntidadesInicial = async () => {
    try {
      const entidadesData = await getEntidadesComerciales();
      setEntidades(entidadesData || []);
    } catch (error) {
      console.error("Error al cargar entidades:", error);
      setEntidades([]);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cuentasData, empresasData, entidadesData] = await Promise.all([
        config.api(),
        getAllEmpresas(),
        getEntidadesComerciales(),
      ]);

      // Filtrar solo cuentas con saldo pendiente > 0
      const cuentasPendientes =
        cuentasData?.filter((c) => Number(c.saldoPendiente || 0) > 0) || [];

      setCuentas(cuentasPendientes);
      setEmpresas(empresasData || []);
      setEntidades(entidadesData || []);
    } catch (error) {
      console.error(`Error al cargar ${config.labelCuentaPlural}:`, error);
      setCuentas([]);
      setEmpresas([]);
      setEntidades([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de cuentas
  const cuentasFiltradas = useMemo(() => {
    let resultado = [...cuentas];

    // Filtro por empresa
    if (filtroEmpresaId) {
      resultado = resultado.filter(
        (c) => Number(c.empresaId) === Number(filtroEmpresaId),
      );
    }

    // Filtro por entidad (cliente o proveedor)
    if (filtroEntidadId) {
      resultado = resultado.filter(
        (c) => Number(c[config.campoEntidad]) === Number(filtroEntidadId),
      );
    }

    // Filtro por rango de fechas
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde);
      desde.setHours(0, 0, 0, 0);
      resultado = resultado.filter((c) => {
        const fecha = new Date(c.fechaEmision);
        return fecha >= desde;
      });
    }

    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta);
      hasta.setHours(23, 59, 59, 999);
      resultado = resultado.filter((c) => {
        const fecha = new Date(c.fechaEmision);
        return fecha <= hasta;
      });
    }

    return resultado;
  }, [
    cuentas,
    filtroEmpresaId,
    filtroEntidadId,
    filtroFechaDesde,
    filtroFechaHasta,
    config,
  ]);

  // Lista única de empresas en las cuentas
  const empresasDisponibles = useMemo(() => {
    const empresasIds = [...new Set(cuentas.map((c) => c.empresaId))];
    return empresas.filter((e) => empresasIds.includes(e.id));
  }, [cuentas, empresas]);

  // Lista única de entidades en las cuentas
  const entidadesDisponibles = useMemo(() => {
    const entidadesIds = [
      ...new Set(cuentas.map((c) => c[config.campoEntidad])),
    ];
    return entidades.filter((ent) => entidadesIds.includes(ent.id));
  }, [cuentas, entidades, config]);

  const handleSeleccionar = (cuenta) => {
    if (onChange) {
      onChange(cuenta);
    }
    setVisible(false);
  };

  const limpiarFiltros = () => {
    setFiltroEmpresaId(empresaIdPreseleccionada);
    setFiltroEntidadId(entidadIdPreseleccionada);
    setFiltroFechaDesde(null);
    setFiltroFechaHasta(null);
    setGlobalFilter("");
  };

  // Renderizadores de columnas
  const numeroDocumentoBodyTemplate = (rowData) => {
    return (
      <Tag severity="info" value={rowData[config.campoDocumento] || "S/N"} />
    );
  };

  const fechaBodyTemplate = (rowData) => {
    return (
      <Tag
        severity="success"
        icon="pi pi-calendar"
        value={formatearFecha(rowData.fechaEmision)}
      />
    );
  };

  const entidadBodyTemplate = (rowData) => {
    const nombreEntidad = getEntidadNombre(
      rowData[config.campoEntidad],
      entidades,
    );
    return (
      <Tag severity="info" icon={config.iconoEntidad} value={nombreEntidad} />
    );
  };

  const montoBodyTemplate = (rowData) => {
    return (
      <Tag
        severity="warning"
        icon="pi pi-dollar"
        value={`S/ ${formatearNumero(rowData.montoTotal, 2)}`}
      />
    );
  };

  const saldoBodyTemplate = (rowData) => {
    return (
      <Tag
        severity="danger"
        value={`S/ ${formatearNumero(rowData.saldoPendiente, 2)}`}
      />
    );
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-check"
        rounded
        outlined
        severity="success"
        onClick={() => handleSeleccionar(rowData)}
        tooltip="Seleccionar"
        tooltipOptions={{ position: "top" }}
      />
    );
  };

  // Header de la tabla
  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: getResponsiveFontSize(), fontWeight: "bold" }}>
        {config.labelCuentaPlural} Pendientes ({cuentasFiltradas.length})
      </span>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          style={{ fontSize: getResponsiveFontSize() }}
        />
      </span>
    </div>
  );

  // Renderizado del input principal
  const renderInputDisplay = () => {
    if (!cuentaSeleccionada) {
      return (
        <InputText
          value={placeholder || config.placeholder}
          readOnly
          disabled={disabled}
          style={{
            width: "100%",
            fontSize: getResponsiveFontSize(),
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
      );
    }

    const nombreEntidad = getEntidadNombre(
      cuentaSeleccionada[config.campoEntidad],
      entidades,
    );

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px",
          border: "1px solid #ced4da",
          borderRadius: "6px",
          backgroundColor: disabled ? "#e9ecef" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: "42px",
          alignItems: "center",
        }}
      >
        <Tag
          severity="info"
          value={`N°: ${cuentaSeleccionada[config.campoDocumento] || "S/N"}`}
        />
        <Tag
          severity="success"
          icon="pi pi-calendar"
          value={formatearFecha(cuentaSeleccionada.fechaEmision)}
        />
        <Tag severity="info" icon={config.iconoEntidad} value={nombreEntidad} />
        <Tag
          severity="warning"
          icon="pi pi-dollar"
          value={`Monto: ${formatearNumero(cuentaSeleccionada.montoTotal, 2)}`}
        />
        <Tag
          severity="danger"
          value={`Saldo: ${formatearNumero(cuentaSeleccionada.saldoPendiente, 2)}`}
        />
      </div>
    );
  };

  return (
    <div className="field" style={{ marginBottom: "1rem" }}>
      <label
        htmlFor="cuentaSelector"
        style={{ fontSize: getResponsiveFontSize(), fontWeight: "bold" }}
      >
        {label || config.labelCuenta}
      </label>
      <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
        <div style={{ flex: 1 }}>{renderInputDisplay()}</div>
        <Button
          icon="pi pi-search"
          onClick={() => setVisible(true)}
          disabled={disabled}
          tooltip={config.tooltipBuscar}
          tooltipOptions={{ position: "top" }}
          style={{ fontSize: getResponsiveFontSize() }}
        />
      </div>

      <Dialog
        visible={visible}
        style={{ width: "90vw", maxWidth: "1400px" }}
        header={config.headerDialog}
        modal
        onHide={() => setVisible(false)}
      >
        {/* FILTROS */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Filtro Empresa */}
            <div>
              <label
                style={{
                  fontSize: getResponsiveFontSize(),
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                🏢 Empresa
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Button
                  label="TODAS"
                  size="small"
                  style={{
                    backgroundColor: !filtroEmpresaId
                      ? COLOR_TODAS.bg
                      : "#f8f9fa",
                    color: !filtroEmpresaId ? COLOR_TODAS.text : "#495057",
                    border: `2px solid ${!filtroEmpresaId ? COLOR_TODAS.border : "#dee2e6"}`,
                    fontSize: getResponsiveFontSize(),
                  }}
                  onClick={() => setFiltroEmpresaId(null)}
                />
                {empresasDisponibles.map((empresa, index) => {
                  const color = getColorCategoria(index);
                  const isSelected =
                    Number(filtroEmpresaId) === Number(empresa.id);
                  return (
                    <Button
                      key={empresa.id}
                      label={empresa.nombre || empresa.razonSocial}
                      size="small"
                      style={{
                        backgroundColor: isSelected ? color.bg : "#f8f9fa",
                        color: isSelected ? color.text : "#495057",
                        border: `2px solid ${isSelected ? color.border : "#dee2e6"}`,
                        fontSize: getResponsiveFontSize(),
                      }}
                      onClick={() => setFiltroEmpresaId(empresa.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Filtro Entidad (Cliente o Proveedor) */}
            <div>
              <label
                style={{
                  fontSize: getResponsiveFontSize(),
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                {tipo === "CXC" ? "👤" : "🏭"} {config.labelEntidad}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Button
                  label="TODOS"
                  size="small"
                  style={{
                    backgroundColor: !filtroEntidadId
                      ? COLOR_TODAS.bg
                      : "#f8f9fa",
                    color: !filtroEntidadId ? COLOR_TODAS.text : "#495057",
                    border: `2px solid ${!filtroEntidadId ? COLOR_TODAS.border : "#dee2e6"}`,
                    fontSize: getResponsiveFontSize(),
                  }}
                  onClick={() => setFiltroEntidadId(null)}
                />
                {entidadesDisponibles.slice(0, 5).map((entidad, index) => {
                  const color = getColorCategoria(index);
                  const isSelected =
                    Number(filtroEntidadId) === Number(entidad.id);
                  return (
                    <Button
                      key={entidad.id}
                      label={entidad.razonSocial || entidad.nombre}
                      size="small"
                      style={{
                        backgroundColor: isSelected ? color.bg : "#f8f9fa",
                        color: isSelected ? color.text : "#495057",
                        border: `2px solid ${isSelected ? color.border : "#dee2e6"}`,
                        fontSize: getResponsiveFontSize(),
                      }}
                      onClick={() => setFiltroEntidadId(entidad.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Filtro Rango de Fechas */}
            <div>
              <label
                style={{
                  fontSize: getResponsiveFontSize(),
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                📅 Rango de Fechas
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <Calendar
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.value)}
                  placeholder="Desde"
                  dateFormat="dd/mm/yy"
                  showIcon
                  style={{ fontSize: getResponsiveFontSize() }}
                />
                <span>-</span>
                <Calendar
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.value)}
                  placeholder="Hasta"
                  dateFormat="dd/mm/yy"
                  showIcon
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "8px" }}>
            <Button
              label="Limpiar Filtros"
              icon="pi pi-filter-slash"
              severity="secondary"
              size="small"
              onClick={limpiarFiltros}
              style={{ fontSize: getResponsiveFontSize() }}
            />
          </div>
        </div>

        {/* TABLA */}
        <DataTable
          ref={dt}
          value={cuentasFiltradas}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          globalFilter={globalFilter}
          header={header}
          emptyMessage={config.emptyMessage}
          responsiveLayout="scroll"
          style={{ fontSize: getResponsiveFontSize() }}
        >
          <Column
            field={config.campoDocumento}
            header="N° Documento"
            body={numeroDocumentoBodyTemplate}
            sortable
          />
          <Column
            field="fechaEmision"
            header="Fecha"
            body={fechaBodyTemplate}
            sortable
          />
          <Column
            field={config.campoEntidad}
            header={config.labelEntidad}
            body={entidadBodyTemplate}
          />
          <Column
            field="montoTotal"
            header="Monto Total"
            body={montoBodyTemplate}
            sortable
          />
          <Column
            field="saldoPendiente"
            header="Saldo Pendiente"
            body={saldoBodyTemplate}
            sortable
          />
          <Column
            header="Acciones"
            body={accionesBodyTemplate}
            style={{ width: "100px", textAlign: "center" }}
          />
        </DataTable>
      </Dialog>
    </div>
  );
}
