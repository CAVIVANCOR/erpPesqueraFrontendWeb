/**
 * CuentaCorrienteSelector.jsx
 * 
 * Componente reutilizable para selección de Cuenta Corriente con búsqueda avanzada
 * Muestra una tabla con Empresa, Banco, Moneda y Número de Cuenta para facilitar la búsqueda
 * Incluye filtros por empresa con colores dinámicos
 * 
 * ⚠️ IMPORTANTE: Al seleccionar una cuenta corriente, automáticamente asigna el bancoId
 * El banco se asigna de forma TRANSPARENTE sin que el usuario lo vea
 * 
 * PATRÓN: Replica exactamente EntidadComercialSelector.jsx
 * - CARGA INTERNAMENTE todas las empresas, bancos y cuentas corrientes
 * - Filtra dinámicamente por empresa
 * - Excluye cuentas inactivas automáticamente
 * - Retorna { cuentaCorrienteId, bancoId } en el callback onChange
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getAllEmpresas } from "../../api/empresa";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Paleta de colores infinita para empresas
 * Se repite cíclicamente si hay más categorías que colores
 */
const COLORES_CATEGORIAS = [
  { bg: '#4CAF50', text: '#FFFFFF', border: '#4CAF50' }, // Verde
  { bg: '#00BCD4', text: '#FFFFFF', border: '#00BCD4' }, // Cyan
  { bg: '#FF9800', text: '#FFFFFF', border: '#FF9800' }, // Naranja
  { bg: '#009688', text: '#FFFFFF', border: '#009688' }, // Teal
  { bg: '#9C27B0', text: '#FFFFFF', border: '#9C27B0' }, // Morado
  { bg: '#3F51B5', text: '#FFFFFF', border: '#3F51B5' }, // Índigo
  { bg: '#E91E63', text: '#FFFFFF', border: '#E91E63' }, // Rosa
  { bg: '#FFC107', text: '#000000', border: '#FFC107' }, // Ámbar
  { bg: '#8BC34A', text: '#000000', border: '#8BC34A' }, // Lima
  { bg: '#607D8B', text: '#FFFFFF', border: '#607D8B' }, // Azul Gris
  { bg: '#795548', text: '#FFFFFF', border: '#795548' }, // Café
  { bg: '#F44336', text: '#FFFFFF', border: '#F44336' }, // Rojo
  { bg: '#673AB7', text: '#FFFFFF', border: '#673AB7' }, // Púrpura
  { bg: '#03A9F4', text: '#FFFFFF', border: '#03A9F4' }, // Azul claro
  { bg: '#CDDC39', text: '#000000', border: '#CDDC39' }, // Lima amarillo
  { bg: '#FF5722', text: '#FFFFFF', border: '#FF5722' }, // Rojo naranja
];

// Color para el botón "TODAS"
const COLOR_TODAS = { bg: '#2196F3', text: '#FFFFFF', border: '#2196F3' }; // Azul

// Colores específicos para Banco, Moneda y Número de Cuenta
const COLORES_TEXTO = {
  tipoCuenta: '#50b1b8',   // 🔵 Azul
  banco: '#1976D2',        // 🔵 Azul
  moneda: '#2E7D32',       // 🟢 Verde
  descripcion: '#F57C00',  // 🟡 Naranja (NUEVO)
  numeroCuenta: '#D32F2F', // 🔴 Rojo
  separador: '#666'        // Gris para los guiones
};

/**
 * Obtiene el color para una categoría basado en su índice
 * Usa módulo para repetir colores si hay más categorías que colores
 */
const getColorCategoria = (index) => {
  return COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length];
};

/**
 * Helper: Obtiene el nombre de la empresa dado un empresaId
 * BUSCA MANUALMENTE en el array de empresas
 */
const getEmpresaNombre = (empresaId, empresas) => {
  if (!empresaId) {
    return "Sin empresa";
  }

  if (!empresas || empresas.length === 0) {
    return `ID: ${empresaId}`;
  }

  const empresa = empresas.find((e) => Number(e.id) === Number(empresaId));

  if (!empresa) {
    return `ID: ${empresaId}`;
  }

  return empresa.nombre || empresa.razonSocial || `ID: ${empresaId}`;
};

/**
 * Componente CuentaCorrienteSelector
 * @param {number|string} props.value - ID de la cuenta corriente seleccionada
 * @param {Function} props.onChange - Callback cuando se selecciona una cuenta (recibe { cuentaCorrienteId, bancoId })
 * @param {number|string} props.empresaIdPreseleccionada - ID de empresa a preseleccionar
 * @param {string} props.label - Etiqueta personalizada (por defecto "Cuenta Corriente")
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.mostrarInactivas - Si se deben mostrar cuentas inactivas (por defecto false)
 * @param {number} props.refreshTrigger - Timestamp para forzar recarga de datos
 * @returns {JSX.Element}
 */
const CuentaCorrienteSelector = ({
  value = null,
  onChange,
  empresaIdPreseleccionada = null,
  label = "Cuenta Corriente",
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione cuenta corriente",
  mostrarInactivas = false,
  refreshTrigger = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState(empresaIdPreseleccionada);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // 🔄 CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [cuentasData, empresasData] = await Promise.all([
          getAllCuentaCorriente(),
          getAllEmpresas()
        ]);
        setCuentasCorrientes(cuentasData || []);
        setEmpresas(empresasData || []);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
        setCuentasCorrientes([]);
        setEmpresas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // 🔄 RECARGAR DATOS CUANDO SE ABRE EL DIÁLOGO
  useEffect(() => {
    if (dialogVisible) {
      const recargarDatos = async () => {
        try {
          const cuentasData = await getAllCuentaCorriente();
          setCuentasCorrientes(cuentasData || []);
        } catch (error) {
          console.error("❌ Error recargando cuentas corrientes:", error);
        }
      };
      recargarDatos();
    }
  }, [dialogVisible]);

  // 🔄 RECARGAR DATOS CUANDO CAMBIA refreshTrigger
  useEffect(() => {
    if (refreshTrigger) {
      const recargarDatos = async () => {
        try {
          const cuentasData = await getAllCuentaCorriente();
          setCuentasCorrientes(cuentasData || []);
        } catch (error) {
          console.error("❌ Error recargando cuentas corrientes:", error);
        }
      };
      recargarDatos();
    }
  }, [refreshTrigger]);

  // Actualizar empresaFiltro si cambia la preselección
  useEffect(() => {
    if (empresaIdPreseleccionada) {
      setEmpresaFiltro(empresaIdPreseleccionada);
    }
  }, [empresaIdPreseleccionada]);

  // Obtener la cuenta corriente seleccionada (buscar en array original completo)
  const cuentaSeleccionada = useMemo(() => {
    if (!value) {
      return null;
    }

    const cuenta = cuentasCorrientes.find((c) => Number(c.id) === Number(value));
    return cuenta;
  }, [cuentasCorrientes, value]);

  // ⚠️ FILTRO CUENTAS INACTIVAS
  // Excluimos cuentas con activa=false por defecto
  const cuentasConFiltroEstado = useMemo(() => {
    if (mostrarInactivas) {
      return cuentasCorrientes;
    }
    const filtradas = cuentasCorrientes.filter((c) => c.activa === true);
    return filtradas;
  }, [cuentasCorrientes, mostrarInactivas]);

  // ✅ MOSTRAR TODAS LAS EMPRESAS - No filtrar por cuentas
  const empresasUnicas = useMemo(() => {
    // Usar directamente el array de empresas recibido, ordenado alfabéticamente
    const empresasOrdenadas = [...empresas].sort((a, b) =>
      (a.nombre || a.razonSocial || "").localeCompare(b.nombre || b.razonSocial || "")
    );
    return empresasOrdenadas;
  }, [empresas]);

  // ⚠️ FILTRO POR EMPRESA
  const cuentasFiltradas = useMemo(() => {
    if (!empresaFiltro) {
      return cuentasConFiltroEstado;
    }

    const filtradas = cuentasConFiltroEstado.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(empresaFiltro)
    );
    return filtradas;
  }, [cuentasConFiltroEstado, empresaFiltro]);

  // Verificar si la empresa seleccionada tiene cuentas
  const empresaTieneCuentas = useMemo(() => {
    if (!empresaFiltro) return true;
    return cuentasFiltradas.length > 0;
  }, [empresaFiltro, cuentasFiltradas]);

  // Ordenar cuentas: primero por banco, luego por moneda, luego por número de cuenta
  const cuentasOrdenadas = useMemo(() => {
    return [...cuentasFiltradas].sort((a, b) => {
      // Primero por banco
      const bancoA = a.banco?.nombre || "";
      const bancoB = b.banco?.nombre || "";
      if (bancoA !== bancoB) {
        return bancoA.localeCompare(bancoB);
      }
      // Luego por moneda
      const monedaA = a.moneda?.codigoSunat || "";
      const monedaB = b.moneda?.codigoSunat || "";
      if (monedaA !== monedaB) {
        return monedaA.localeCompare(monedaB);
      }
      // Finalmente por número de cuenta
      return (a.numeroCuenta || "").localeCompare(b.numeroCuenta || "");
    });
  }, [cuentasFiltradas]);

  /**
   * Maneja el cambio de empresa
   */
  const handleEmpresaChange = (empresaId) => {
    setEmpresaFiltro(empresaId);
  };

  /**
   * Maneja la selección de una cuenta corriente
   * ⚠️ IMPORTANTE: Retorna { cuentaCorrienteId, bancoId }
   */
  const handleSeleccion = (cuenta) => {
    if (onChange) {
      onChange({
        cuentaCorrienteId: Number(cuenta.id),
        bancoId: Number(cuenta.bancoId), // ← BANCO AUTOMÁTICO
        moneda: cuenta.moneda // ← MONEDA AUTOMÁTICA (incluye colorFondo)
      });
    }

    setDialogVisible(false);
    setGlobalFilterValue("");
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    // Restaurar empresa preseleccionada al cerrar
    setEmpresaFiltro(empresaIdPreseleccionada);
  };

  /**
   * Template para el banco
   */
  const bancoTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.banco, fontSize: "0.9rem", fontWeight: "bold" }}>
        {rowData.banco?.nombreCorto || rowData.banco?.nombre || "Sin banco"}
      </span>
    );
  };

  /**
   * Template para la moneda
   */
  const monedaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.moneda, fontSize: "0.9rem", fontWeight: "bold" }}>
        {rowData.moneda?.codigoSunat || "N/A"}
      </span>
    );
  };

  /**
   * Template para el número de cuenta
   */
  const numeroCuentaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.numeroCuenta, fontWeight: "bold" }}>
        {rowData.numeroCuenta || "Sin número"}
      </span>
    );
  };

  /**
 * Template para el tipo de cuenta corriente
 */
  const tipoCuentaTemplate = (rowData) => {
    return (
      <span style={{ fontSize: "0.85rem", color: "#495057" }}>
        {rowData.tipoCuentaCorriente?.nombre || "N/A"}
      </span>
    );
  };

  /**
   * Template para la descripción
   */
  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.descripcion, fontWeight: "500", fontSize: "0.85rem" }}>
        {rowData.descripcion || ""}
      </span>
    );
  };


  /**
   * Función para determinar la clase CSS de la fila
   * Resalta la fila seleccionada actualmente
   */
  const rowClassName = (rowData) => {
    return Number(rowData.id) === Number(value) ? "row-selected" : "";
  };

  /**
   * Header de la tabla con búsqueda
   */
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
      <h4 style={{ margin: 0 }}>Cuentas Corrientes</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
          }}
          placeholder="Buscar cuenta..."
          style={{ width: "250px" }}
        />
      </span>
    </div>
  );

  /**
   * Footer de la tabla
   */
  const footer = (
    <div style={{ textAlign: "left", color: "#666", fontSize: "0.9rem" }}>
      Total: {cuentasOrdenadas.length} cuenta(s)
      {empresas.length === 0 && (
        <span style={{ color: "red", marginLeft: "1rem" }}>
          ⚠️ No se cargaron empresas
        </span>
      )}
      {!empresaTieneCuentas && empresaFiltro && (
        <span style={{ color: "orange", marginLeft: "1rem" }}>
          ⚠️ La empresa seleccionada no tiene cuentas corrientes
        </span>
      )}
    </div>
  );

  return (
    <div className="field">
      {/* Label */}
      <label className="block text-900 font-medium mb-2">
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </label>

      {/* Botón selector */}
      <Button
        type="button"
        icon="pi pi-search"
        onClick={() => {
          if (!disabled) {
            setDialogVisible(true);
          }
        }}
        disabled={disabled || loading}
        className={classNames("p-button-outlined w-full", {
          "p-invalid": error,
        })}
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
          backgroundColor: cuentaSeleccionada?.moneda?.colorFondo || "#ffffff",
          fontWeight: "bold",
        }}
      >
        {loading ? (
          <span style={{ color: "#999" }}>Cargando...</span>
        ) : cuentaSeleccionada ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
            {/* 🔵 TIPO CUENTA */}
            <span style={{ color: COLORES_TEXTO.tipoCuenta, fontWeight: "600" }}>
              {cuentaSeleccionada.tipoCuentaCorriente?.nombre || "S/T"}
            </span>
            {/* 🔵 BANCO */}
            <span style={{ color: COLORES_TEXTO.banco, fontWeight: "600" }}>
              {cuentaSeleccionada.banco?.nombre || "S/B"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>

            {/* 🟢 MONEDA */}
            <span style={{ color: COLORES_TEXTO.moneda, fontWeight: "600" }}>
              {cuentaSeleccionada.moneda?.codigoSunat || "N/A"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>

            {/* 🟡 DESCRIPCIÓN */}
            <span style={{ color: COLORES_TEXTO.descripcion, fontWeight: "500" }}>
              {cuentaSeleccionada.descripcion || "Sin descripción"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>

            {/* 🔴 NÚMERO DE CUENTA */}
            <span style={{ color: COLORES_TEXTO.numeroCuenta, fontWeight: "bold" }}>
              {cuentaSeleccionada.numeroCuenta || "Sin número"}
            </span>
          </span>
        ) : (
          <span style={{ color: "#999" }}>{placeholder}</span>
        )}
      </Button>

      {/* Mensaje de error */}
      {error && errorMessage && (
        <small className="p-error">{errorMessage}</small>
      )}

      {/* Dialog con layout de 2 columnas */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "1400px" }}
        header={`Seleccionar ${label}`}
        modal
        onHide={() => {
          handleCloseDialog();
        }}
        maximizable
      >
        {/* Layout de 2 columnas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: "1rem",
          height: "600px"
        }}>

          {/* ========== COLUMNA 1: EMPRESAS ========== */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Empresas
            </h4>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              overflowY: "auto",
              paddingRight: "0.5rem"
            }}>
              {/* Botón TODAS */}
              <Button
                type="button"
                label="TODAS"
                size="small"
                onClick={() => handleEmpresaChange(null)}
                style={{
                  backgroundColor: !empresaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                  color: !empresaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                  borderColor: COLOR_TODAS.border,
                  fontWeight: "500",
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.5rem",
                  justifyContent: "flex-start",
                  textAlign: "left",
                }}
                className={!empresaFiltro ? "" : "p-button-outlined"}
              />

              {/* Botones de empresas */}
              {empresasUnicas.map((empresa, index) => {
                const color = getColorCategoria(index);
                const isActive = Number(empresaFiltro) === Number(empresa.id);
                const nombreEmpresa = empresa.nombre || empresa.razonSocial || `ID: ${empresa.id}`;

                return (
                  <Button
                    key={empresa.id}
                    type="button"
                    label={nombreEmpresa}
                    size="small"
                    onClick={() => handleEmpresaChange(Number(empresa.id))}
                    style={{
                      backgroundColor: isActive ? color.bg : "#FFFFFF",
                      color: isActive ? color.text : color.bg,
                      borderColor: color.border,
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      padding: "0.35rem 0.5rem",
                      justifyContent: "flex-start",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    className={isActive ? "" : "p-button-outlined"}
                    tooltip={nombreEmpresa}
                    tooltipOptions={{ position: 'right' }}
                  />
                );
              })}
            </div>
          </div>

          {/* ========== COLUMNA 2: TABLA DE CUENTAS CORRIENTES ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}

            <DataTable
              ref={dt}
              value={cuentasOrdenadas}
              selectionMode="single"
              onRowSelect={(e) => {
                handleSeleccion(e.data);
              }}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              globalFilter={globalFilterValue}
              globalFilterFields={['numeroCuenta', 'numeroCuentaCCI', 'banco.nombre', 'moneda.codigoSunat', 'descripcion', 'tipoCuentaCorriente.nombre']}
              emptyMessage="No se encontraron cuentas corrientes"
              stripedRows
              showGridlines
              size="small"
              scrollable
              scrollHeight="500px"
              rowClassName={rowClassName}
              loading={loading}
              style={{ fontSize: getResponsiveFontSize() }}
            >
              {/* 🆕 NUEVA COLUMNA: TIPO CUENTA */}
              <Column
                field="tipoCuentaCorriente.nombre"
                header="Tipo Cuenta"
                body={tipoCuentaTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="banco.nombre"
                header="Banco"
                body={bancoTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="moneda.codigoSunat"
                header="Moneda"
                body={monedaTemplate}
                sortable
                style={{ minWidth: "80px" }}
              />

              {/* 🆕 NUEVA COLUMNA: DESCRIPCIÓN */}
              <Column
                field="descripcion"
                header="Descripción"
                body={descripcionTemplate}
                sortable
                style={{ minWidth: "180px" }}
              />
              <Column
                field="numeroCuenta"
                header="Número de Cuenta"
                body={numeroCuentaTemplate}
                sortable
                filterField="numeroCuenta"
                style={{ minWidth: "180px" }}
              />
              <Column
                field="numeroCuentaCCI"
                header="CCI"
                sortable
                filterField="numeroCuentaCCI"
                style={{ minWidth: "200px" }}
              />
            </DataTable>

            {footer}

            {/* Estilos CSS inline para la fila seleccionada */}
            <style>{`
              .row-selected {
                background-color: #E3F2FD !important;
                border-left: 4px solid #2196F3 !important;
                font-weight: 500 !important;
              }
              .row-selected:hover {
                background-color: #BBDEFB !important;
              }
            `}</style>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CuentaCorrienteSelector;