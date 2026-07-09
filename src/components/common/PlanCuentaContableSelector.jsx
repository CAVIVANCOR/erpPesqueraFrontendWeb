/**
 * PlanCuentaContableSelector.jsx
 * 
 * Componente reutilizable para selección de Cuenta Contable del Plan de Cuentas
 * Muestra una tabla con Código, Nombre, Nivel y Tipo para facilitar la búsqueda
 * Incluye filtro por Clase (2 primeros dígitos del código)
 * 
 * PATRÓN: Replica exactamente EntidadComercialSelector.jsx
 * - CARGA INTERNAMENTE todas las cuentas contables
 * - Filtra dinámicamente por clase (2 dígitos)
 * - Permite filtrar por empresa si se proporciona
 * - Excluye cuentas inactivas automáticamente
 * 
 * IMPORTANTE: Usa campos del schema PlanCuentasContable
 * - codigoCuenta: String (código de la cuenta)
 * - nombreCuenta: String (nombre de la cuenta)
 * - nivel: Enum (CLASE, CUENTA, SUBCUENTA, etc.)
 * - tipoCuenta: Enum (ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO)
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
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import { getPlanCuentasContable, getPlanCuentasContableByEmpresa } from "../../api/contabilidad/planCuentasContable";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Paleta de colores infinita para clases de cuentas
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

/**
 * Obtiene el color para una categoría basado en su índice
 * Usa módulo para repetir colores si hay más categorías que colores
 */
const getColorCategoria = (index) => {
  return COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length];
};

/**
 * Extrae la clase (2 primeros dígitos) del código de cuenta
 * Ej: "62.1" → "62", "10.1.1" → "10"
 */
const extraerClase = (codigoCuenta) => {
  if (!codigoCuenta) return "";
  const codigo = String(codigoCuenta);
  // Extraer los primeros 2 dígitos antes del primer punto o tomar los 2 primeros caracteres
  const match = codigo.match(/^(\d{1,2})/);
  return match ? match[1] : codigo.substring(0, 2);
};

/**
 * Componente PlanCuentaContableSelector
 * @param {number|string} props.value - ID de la cuenta seleccionada
 * @param {Function} props.onChange - Callback cuando se selecciona una cuenta (recibe el ID)
 * @param {number|string} props.empresaId - ID de empresa para filtrar (opcional)
 * @param {string} props.label - Etiqueta personalizada
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.mostrarInactivas - Si se deben mostrar cuentas inactivas (por defecto false)
 * @param {boolean} props.showClearButton - Mostrar botón para limpiar selección
 * @param {number} props.refreshTrigger - Timestamp para forzar recarga de datos
 * @returns {JSX.Element}
 */
const PlanCuentaContableSelector = ({
  value = null,
  onChange,
  empresaId = null,
  label = "Cuenta Contable",
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Elegir una Cuenta Contable",
  mostrarInactivas = false,
  showClearButton = true,
  refreshTrigger = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [claseFiltro, setClaseFiltro] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // 🔄 CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        let cuentasData;
        if (empresaId) {
          cuentasData = await getPlanCuentasContableByEmpresa(empresaId);
        } else {
          cuentasData = await getPlanCuentasContable();
        }
        setCuentas(cuentasData || []);
      } catch (error) {
        console.error("❌ Error cargando cuentas contables:", error);
        setCuentas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [empresaId]);

  // 🔄 RECARGAR DATOS CUANDO SE ABRE EL DIÁLOGO
  useEffect(() => {
    if (dialogVisible) {
      const recargarDatos = async () => {
        try {
          let cuentasData;
          if (empresaId) {
            cuentasData = await getPlanCuentasContableByEmpresa(empresaId);
          } else {
            cuentasData = await getPlanCuentasContable();
          }
          setCuentas(cuentasData || []);
        } catch (error) {
          console.error("❌ Error recargando cuentas contables:", error);
        }
      };
      recargarDatos();
    }
  }, [dialogVisible, empresaId]);

  // 🔄 RECARGAR DATOS CUANDO CAMBIA refreshTrigger
  useEffect(() => {
    if (refreshTrigger) {
      const recargarDatos = async () => {
        try {
          let cuentasData;
          if (empresaId) {
            cuentasData = await getPlanCuentasContableByEmpresa(empresaId);
          } else {
            cuentasData = await getPlanCuentasContable();
          }
          setCuentas(cuentasData || []);
        } catch (error) {
          console.error("❌ Error recargando cuentas contables:", error);
        }
      };
      recargarDatos();
    }
  }, [refreshTrigger, empresaId]);

  // Obtener la cuenta seleccionada
  const cuentaSeleccionada = useMemo(() => {
    if (!value) {
      return null;
    }

    const cuenta = cuentas.find((c) => Number(c.id) === Number(value));
    return cuenta;
  }, [cuentas, value]);

  // ⚠️ FILTRO CUENTAS INACTIVAS
  // Excluimos cuentas con activo=false por defecto
  const cuentasConFiltroEstado = useMemo(() => {
    if (mostrarInactivas) {
      return cuentas;
    }
    const filtradas = cuentas.filter((c) => c.activo === true);
    return filtradas;
  }, [cuentas, mostrarInactivas]);

  // Extraer clases únicas (2 primeros dígitos)
  const clasesUnicas = useMemo(() => {
    const clasesMap = new Map();
    cuentasConFiltroEstado.forEach((cuenta) => {
      const clase = extraerClase(cuenta.codigoCuenta);
      if (clase && !clasesMap.has(clase)) {
        // Buscar la cuenta de nivel CLASE para obtener el nombre
        const cuentaClase = cuentasConFiltroEstado.find(
          (c) => c.codigoCuenta === clase && c.nivel === 'CLASE'
        );
        clasesMap.set(clase, {
          codigo: clase,
          nombre: cuentaClase?.nombreCuenta || `Clase ${clase}`,
        });
      }
    });

    // Ordenar por código
    const clases = Array.from(clasesMap.values()).sort((a, b) =>
      a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
    );
    return clases;
  }, [cuentasConFiltroEstado]);

  // Filtrar cuentas por clase seleccionada
  const cuentasFiltradas = useMemo(() => {
    if (!claseFiltro) {
      return cuentasConFiltroEstado;
    }
    const filtradas = cuentasConFiltroEstado.filter(
      (cuenta) => extraerClase(cuenta.codigoCuenta) === claseFiltro
    );
    return filtradas;
  }, [cuentasConFiltroEstado, claseFiltro]);

  // Ordenar cuentas por jerarquía contable (Clase > Cuenta > SubCuenta > Divisionaria > SubDivisionaria)
  const cuentasOrdenadas = useMemo(() => {
    return [...cuentasFiltradas].sort((a, b) => {
      const codigoA = String(a.codigoCuenta || "");
      const codigoB = String(b.codigoCuenta || "");

      // Dividir por puntos para comparar jerárquicamente
      const partesA = codigoA.split('.').map(p => p.padStart(10, '0'));
      const partesB = codigoB.split('.').map(p => p.padStart(10, '0'));

      // Comparar nivel por nivel
      const maxNiveles = Math.max(partesA.length, partesB.length);
      for (let i = 0; i < maxNiveles; i++) {
        const parteA = partesA[i] || '';
        const parteB = partesB[i] || '';

        if (parteA !== parteB) {
          return parteA.localeCompare(parteB);
        }
      }

      return 0;
    });
  }, [cuentasFiltradas]);

  // Filtrar por búsqueda global (inteligente: numérica busca en código, texto busca en nombre/descripción)
  const cuentasConBusqueda = useMemo(() => {
    if (!globalFilterValue || globalFilterValue.trim() === '') {
      return cuentasOrdenadas;
    }

    const searchTerm = globalFilterValue.trim();
    const searchTermLower = searchTerm.toLowerCase();

    // Detectar si la búsqueda es numérica (solo dígitos y puntos)
    const esNumerico = /^[\d.]+$/.test(searchTerm);

    return cuentasOrdenadas.filter((cuenta) => {
      const codigo = String(cuenta.codigoCuenta || '').toLowerCase();
      const nombre = String(cuenta.nombreCuenta || '').toLowerCase();
      const descripcion = String(cuenta.descripcion || '').toLowerCase();

      if (esNumerico) {
        // Búsqueda numérica: SOLO en código (desde el inicio)
        return codigo.startsWith(searchTermLower);
      } else {
        // Búsqueda de texto: en nombre Y descripción (DENTRO DE - includes)
        return nombre.includes(searchTermLower) || descripcion.includes(searchTermLower);
      }
    });
  }, [cuentasOrdenadas, globalFilterValue]);

  /**
   * Maneja el cambio de clase
   */
  const handleClaseChange = (clase) => {
    setClaseFiltro(clase);
  };

  /**
   * Maneja la selección de una cuenta
   */
  const handleSeleccion = (cuenta) => {
    if (onChange) {
      onChange(Number(cuenta.id));
    }

    setDialogVisible(false);
    setGlobalFilterValue("");
    setClaseFiltro(null);
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    setClaseFiltro(null);
  };

  /**
   * Maneja la limpieza de selección
   */
  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  /**
   * Template para el código de cuenta
   */
  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976D2", fontSize: "0.95rem" }}>
        {rowData.codigoCuenta}
      </span>
    );
  };

  /**
   * Template para el nombre de cuenta
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.nombreCuenta}
      </span>
    );
  };

  /**
   * Template para el nivel
   */
  const nivelTemplate = (rowData) => {
    const severityMap = {
      'CLASE': 'info',
      'CUENTA': 'success',
      'SUBCUENTA': 'warning',
      'DIVISIONARIA': 'danger',
      'SUBDIVISIONARIA': 'secondary',
    };

    return (
      <Tag
        value={rowData.nivel}
        severity={severityMap[rowData.nivel] || 'info'}
        style={{ fontSize: "0.75rem" }}
      />
    );
  };

  /**
   * Template para el tipo de cuenta
   */
  const tipoTemplate = (rowData) => {
    if (!rowData.tipoCuenta) return <span style={{ color: "#999" }}>-</span>;

    const severityMap = {
      'ACTIVO': 'success',
      'PASIVO': 'danger',
      'PATRIMONIO': 'info',
      'INGRESO': 'success',
      'GASTO': 'warning',
    };

    return (
      <Tag
        value={rowData.tipoCuenta}
        severity={severityMap[rowData.tipoCuenta] || 'secondary'}
        style={{ fontSize: "0.75rem" }}
      />
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
      <h4 style={{ margin: 0 }}>Cuentas Contables</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
          }}
          placeholder="Buscar por código o nombre..."
          style={{ width: "300px" }}
        />
      </span>
    </div>
  );

  /**
   * Footer de la tabla
   */
  const footer = (
    <div style={{ textAlign: "left", color: "#666", fontSize: "0.9rem" }}>
      Total: {cuentasConBusqueda.length} cuenta(s)
      {claseFiltro && (
        <span style={{ marginLeft: "1rem", color: "#2196F3" }}>
          📊 Filtrando por Clase {claseFiltro}
        </span>
      )}
      {globalFilterValue && (
        <span style={{ marginLeft: "1rem", color: "#FF9800" }}>
          🔍 Búsqueda: "{globalFilterValue}"
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
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button
          type="button"
          icon="pi pi-book"
          onClick={() => {
            if (!disabled) {
              setDialogVisible(true);
            }
          }}
          disabled={disabled || loading}
          className={classNames("p-button-outlined", {
            "p-invalid": error,
          })}
          style={{
            justifyContent: "flex-start",
            textAlign: "left",
            flex: 1,
          }}
        >
          {loading ? (
            <span style={{ color: "#999" }}>Cargando...</span>
          ) : cuentaSeleccionada ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <Tag
                value={cuentaSeleccionada.codigoCuenta}
                severity="info"
                style={{ fontWeight: "bold" }}
              />
              <Tag
                value={cuentaSeleccionada.nombreCuenta}
                severity="success"
              />
            </span>
          ) : (
            <span style={{ color: "#999" }}>📋 {placeholder}</span>
          )}
        </Button>

        {/* Botón Clear */}
        {showClearButton && cuentaSeleccionada && !disabled && (
          <Button
            type="button"
            icon="pi pi-times"
            onClick={handleClear}
            className="p-button-rounded p-button-text p-button-danger"
            tooltip="Limpiar selección"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>

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
          gridTemplateColumns: "200px 1fr",
          gap: "1rem",
          height: "600px"
        }}>

          {/* ========== COLUMNA 1: CLASES (FILTRO) ========== */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Clases (2 dígitos)
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
                onClick={() => handleClaseChange(null)}
                style={{
                  backgroundColor: !claseFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                  color: !claseFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                  borderColor: COLOR_TODAS.border,
                  fontWeight: "500",
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.5rem",
                  justifyContent: "flex-start",
                  textAlign: "left",
                }}
                className={!claseFiltro ? "" : "p-button-outlined"}
              />

              {/* Botones de clases */}
              {clasesUnicas.map((clase, index) => {
                const color = getColorCategoria(index);
                const isActive = claseFiltro === clase.codigo;

                return (
                  <Button
                    key={clase.codigo}
                    type="button"
                    label={`${clase.codigo} - ${clase.nombre}`}
                    size="small"
                    onClick={() => handleClaseChange(clase.codigo)}
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
                    tooltip={`${clase.codigo} - ${clase.nombre}`}
                    tooltipOptions={{ position: 'right' }}
                  />
                );
              })}
            </div>
          </div>

          {/* ========== COLUMNA 2: TABLA DE CUENTAS ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}

            <DataTable
              ref={dt}
              value={cuentasConBusqueda}
              selectionMode="single"
              onRowSelect={(e) => {
                handleSeleccion(e.data);
              }}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              emptyMessage="No se encontraron cuentas contables"
              stripedRows
              showGridlines
              size="small"
              scrollable
              scrollHeight="500px"
              rowClassName={rowClassName}
              loading={loading}
              style={{ fontSize: getResponsiveFontSize() }}
            >
              <Column
                field="codigoCuenta"
                header="Código"
                body={codigoTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="nombreCuenta"
                header="Nombre de Cuenta"
                body={nombreTemplate}
                sortable
                filterField="nombreCuenta"
                style={{ minWidth: "350px" }}
              />
              <Column
                field="nivel"
                header="Nivel"
                body={nivelTemplate}
                sortable
                style={{ minWidth: "130px" }}
              />
              <Column
                field="tipoCuenta"
                header="Tipo"
                body={tipoTemplate}
                sortable
                style={{ minWidth: "120px" }}
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

export default PlanCuentaContableSelector;