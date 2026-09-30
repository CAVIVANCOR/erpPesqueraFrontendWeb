/**
 * TipoMovimientoSelector.jsx
 * 
 * Componente reutilizable para selección de Tipo de Movimiento con búsqueda avanzada
 * Muestra una tabla con Categoría y Tipo de Movimiento para facilitar la búsqueda
 * Incluye filtros por categoría con colores dinámicos
 * NUEVO: Incluye botón toggle INTERNO para filtrar por EGRESOS/INGRESOS
 * 
 * CORRECCIÓN v3.1.0: Layout de 2 columnas verticales
 * - Columna 1: Botones de categorías (vertical)
 * - Columna 2: DataTable de tipos de movimiento
 * 
 * CORRECCIÓN v3.2.0: Comportamiento del toggle EGRESOS/INGRESOS
 * - El toggle NO modifica el valor seleccionado, solo cambia el filtro
 * - El valor solo cambia cuando el usuario selecciona explícitamente un tipo
 * - Al abrir el diálogo, el filtro se inicializa según el tipo seleccionado
 * 
 * NUEVO v3.3.0: Prop esIngreso para controlar filtro inicial
 * - esIngreso={false} → Muestra EGRESOS por defecto (default)
 * - esIngreso={true} → Muestra INGRESOS por defecto
 * - Útil para transferencias: origen=EGRESOS, destino=INGRESOS
 * 
 * @author ERP Megui
 * @version 3.3.0
 */

import React, { useState, useRef, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

/**
 * Paleta de colores infinita para categorías
 * Se repite cíclicamente si hay más categorías que colores
 */
const COLORES_CATEGORIAS = [
  { bg: '#DCFCE7', text: '#000000', border: '#86EFAC' }, // Verde pastel
  { bg: '#E0F2FE', text: '#000000', border: '#7DD3FC' }, // Cyan pastel
  { bg: '#FFEDD5', text: '#000000', border: '#FDBA74' }, // Naranja pastel
  { bg: '#CCFBF1', text: '#000000', border: '#5EEAD4' }, // Teal pastel
  { bg: '#F3E8FF', text: '#000000', border: '#D8B4FE' }, // Morado pastel
  { bg: '#E0E7FF', text: '#000000', border: '#A5B4FC' }, // Índigo pastel
  { bg: '#FCE7F3', text: '#000000', border: '#F9A8D4' }, // Rosa pastel
  { bg: '#FEF3C7', text: '#000000', border: '#FCD34D' }, // Ámbar pastel
  { bg: '#ECFCCB', text: '#000000', border: '#BEF264' }, // Lima pastel
  { bg: '#E2E8F0', text: '#000000', border: '#94A3B8' }, // Azul Gris pastel
  { bg: '#F5F5F4', text: '#000000', border: '#D6D3D1' }, // Café pastel
  { bg: '#FEE2E2', text: '#000000', border: '#FCA5A5' }, // Rojo pastel
  { bg: '#EDE9FE', text: '#000000', border: '#C4B5FD' }, // Púrpura pastel
  { bg: '#DBEAFE', text: '#000000', border: '#93C5FD' }, // Azul claro pastel
  { bg: '#FEF9C3', text: '#000000', border: '#FDE047' }, // Lima amarillo pastel
  { bg: '#FFDDD6', text: '#000000', border: '#FDA18B' }, // Rojo naranja pastel
];

// Color para el botón "TODAS"
const COLOR_TODAS = { bg: '#DBEAFE', text: '#000000', border: '#93C5FD' }; // Azul pastel

// Colores para badges de EGRESO/INGRESO en el botón selector
const COLORES_TIPO_BADGE = {
  egreso: {
    color: '#000000', // Negro
    backgroundColor: '#FEE2E2', // Rojo pastel
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '700',
    border: '2px solid #FCA5A5',
    display: 'inline-flex',
    alignItems: 'center',
  },
  ingreso: {
    color: '#000000', // Negro
    backgroundColor: '#DCFCE7', // Verde pastel
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '700',
    border: '2px solid #86EFAC',
    display: 'inline-flex',
    alignItems: 'center',
  },
  separador: '#666'
};

/**
 * Obtiene el color para una categoría basado en su índice
 * Usa módulo para repetir colores si hay más categorías que colores
 */
const getColorCategoria = (index) => {
  return COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length];
};

/**
 * Componente TipoMovimientoSelector
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tiposMovimiento - Array de tipos de movimiento con relación categoria
 * @param {number|string} props.value - ID del tipo de movimiento seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un tipo (recibe el ID)
 * @param {boolean} props.esIngreso - Filtro inicial: false=EGRESOS (default), true=INGRESOS
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.soloLectura - Si es true, muestra el label sin permitir abrir el diálogo
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @param {Function} props.filterFunction - Función personalizada de filtro (opcional)
 * 
 * @returns {JSX.Element}
 */
const TipoMovimientoSelector = ({
  tiposMovimiento = [],
  value = null,
  onChange,
  esIngreso = false, // 🆕 Por defecto EGRESOS (false)
  disabled = false,
  soloLectura = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione tipo de movimiento",
  filterFunction = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  // 🆕 Inicializar según prop esIngreso: false=EGRESOS (tipo=true), true=INGRESOS (tipo=false)
  const [tipo, setTipo] = useState(!esIngreso);
  const dt = useRef(null);

  // Obtener el tipo de movimiento seleccionado
  const tipoSeleccionado = tiposMovimiento.find(
    (t) => Number(t.id) === Number(value)
  );

  // Inicializar el filtro de tipo cuando se abre el diálogo
  React.useEffect(() => {
    if (dialogVisible && tipoSeleccionado) {
      // Si hay un tipo seleccionado, inicializar el filtro según su tipo
      if (tipoSeleccionado.categoria && tipoSeleccionado.categoria.tipo !== undefined) {
        setTipo(tipoSeleccionado.categoria.tipo);
      } else {
        // tipo=true (EGRESOS) → esIngreso=false
        // tipo=false (INGRESOS) → esIngreso=true
        setTipo(!tipoSeleccionado.esIngreso);
      }
    }
  }, [dialogVisible, tipoSeleccionado]);

  // NUEVO: Filtrar por tipo (EGRESOS/INGRESOS)
  const tiposFiltradosPorTipo = useMemo(() => {
    return tiposMovimiento.filter((t) => {
      // Si la categoría tiene el campo tipo, usarlo
      if (t.categoria && t.categoria.tipo !== undefined) {
        return t.categoria.tipo === tipo;
      }
      // Si no, usar esIngreso del tipo movimiento
      // tipo=true (EGRESOS) → esIngreso=false
      // tipo=false (INGRESOS) → esIngreso=true
      return t.esIngreso === !tipo;
    });
  }, [tiposMovimiento, tipo]);

  // Aplicar filtro personalizado si existe
  const tiposConFiltroPersonalizado = filterFunction
    ? tiposFiltradosPorTipo.filter(filterFunction)
    : tiposFiltradosPorTipo;

  // Extraer categorías únicas y ordenarlas alfabéticamente
  const categoriasUnicas = useMemo(() => {
    const categoriasMap = new Map();
    tiposConFiltroPersonalizado.forEach((tipo) => {
      if (tipo.categoria && tipo.categoria.id) {
        categoriasMap.set(Number(tipo.categoria.id), tipo.categoria);
      }
    });
    return Array.from(categoriasMap.values()).sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
  }, [tiposConFiltroPersonalizado]);

  // Aplicar filtro por categoría seleccionada
  const tiposFiltradosPorCategoria = useMemo(() => {
    if (!categoriaFiltro) {
      return tiposConFiltroPersonalizado;
    }
    return tiposConFiltroPersonalizado.filter(
      (tipo) => Number(tipo.categoriaId) === Number(categoriaFiltro)
    );
  }, [tiposConFiltroPersonalizado, categoriaFiltro]);

  // Ordenar tipos de movimiento: primero por categoría, luego por nombre
  const tiposOrdenados = useMemo(() => {
    return [...tiposFiltradosPorCategoria].sort((a, b) => {
      // Primero por categoría
      const catA = a.categoria?.nombre || "";
      const catB = b.categoria?.nombre || "";
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }
      // Luego por nombre del tipo
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [tiposFiltradosPorCategoria]);

  /**
   * NUEVO: Maneja el cambio de tipo (EGRESOS/INGRESOS)
   * NO modifica el valor seleccionado, solo cambia el filtro
   */
  const handleTipoToggle = () => {
    const nuevoTipo = !tipo;
    setTipo(nuevoTipo);
    // NO limpiar selección - solo cambiar el filtro
    // El valor solo debe cambiar cuando el usuario selecciona explícitamente un tipo
  };

  /**
   * Maneja la selección de un tipo de movimiento
   */
  const handleSeleccion = (tipo) => {
    if (onChange) {
      onChange(Number(tipo.id));
    }
    setDialogVisible(false);
    setGlobalFilterValue("");
    setCategoriaFiltro(null);
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    setCategoriaFiltro(null);
  };

  /**
   * Template para la categoría
   */
  const categoriaTemplate = (rowData) => {
    return (
      <span style={{ color: "#666", fontSize: "0.9rem" }}>
        {rowData.categoria?.nombre || "Sin categoría"}
      </span>
    );
  };

  /**
   * Template para el tipo de movimiento
   */
  const tipoMovimientoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.nombre}
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
      <h4 style={{ margin: 0 }}>Tipos de Movimiento</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar tipo..."
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
      Total: {tiposOrdenados.length} tipo(s) de movimiento
    </div>
  );

  return (
    <div className="field">
      {/* Label */}
      <label className="block text-900 font-medium mb-2">
        Tipo de Movimiento {required && <span style={{ color: "red" }}>*</span>}
      </label>

      {/* Botón selector */}
      <Button
        type="button"
        icon="pi pi-search"
        onClick={() => !disabled && !soloLectura && setDialogVisible(true)}
        disabled={disabled}
        className={classNames("p-button-outlined w-full", {
          "p-invalid": error,
        })}
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
          fontWeight: "bold",
          width:"100%"
        }}
      >
        {tipoSeleccionado ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
            {/* 🔴/🟢 TIPO (EGRESO/INGRESO) - Badge destacado */}
            <span style={tipoSeleccionado.esIngreso ? COLORES_TIPO_BADGE.ingreso : COLORES_TIPO_BADGE.egreso}>
              {tipoSeleccionado.esIngreso ? "INGRESO" : "EGRESO"}
            </span>
            <span style={{ color: COLORES_TIPO_BADGE.separador }}> - </span>

            {/* 🏷️ CATEGORÍA - Badge con color dinámico */}
            {tipoSeleccionado.categoria && (
              <>
                <span style={{
                  color: '#000000', // Negro
                  backgroundColor: getColorCategoria(
                    categoriasUnicas.findIndex(c => Number(c.id) === Number(tipoSeleccionado.categoria.id))
                  ).bg,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: '700', // Negrita
                  border: `2px solid ${getColorCategoria(
                    categoriasUnicas.findIndex(c => Number(c.id) === Number(tipoSeleccionado.categoria.id))
                  ).border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}>
                  {tipoSeleccionado.categoria.nombre}
                </span>
                <span style={{ color: COLORES_TIPO_BADGE.separador }}> - </span>
              </>
            )}

            {/* 📝 DESCRIPCIÓN - Texto negro negrita */}
            <span style={{ color: '#000000', fontWeight: '700' }}>
              {tipoSeleccionado.nombre}
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

      {/* Dialog con tabla de selección */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "1400px" }}
        header="Seleccionar Tipo de Movimiento"
        modal
        onHide={handleCloseDialog}
        maximizable
      >
        {/* NUEVO: Botón toggle EGRESOS/INGRESOS (DENTRO DEL MODAL) */}
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <label style={{ fontWeight: "500" }}>Tipo:</label>
          <Button
            type="button"
            label={tipo ? "EGRESOS" : "INGRESOS"}
            onClick={handleTipoToggle}
            style={{
              backgroundColor: tipo ? "#ef4444" : "#22c55e",
              color: "white",
              borderColor: tipo ? "#ef4444" : "#22c55e",
              fontWeight: "600",
              width: "150px",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            className="hover:brightness-110 active:scale-95"
          />
        </div>

        {/* Layout de 2 columnas */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "calc(200px + 2cm) 1fr", 
          gap: "1rem",
          height: "600px"
        }}>
          
          {/* ========== COLUMNA 1: CATEGORÍAS ========== */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Categorías
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
                onClick={() => setCategoriaFiltro(null)}
                style={{
                  backgroundColor: COLOR_TODAS.bg,
                  color: "#000000",
                  borderColor: COLOR_TODAS.border,
                  borderWidth: !categoriaFiltro ? "2px" : "1px",
                  fontWeight: "700",
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.5rem",
                  justifyContent: "flex-start",
                  textAlign: "left",
                }}
                className={!categoriaFiltro ? "" : "p-button-outlined"}
              />

              {/* Botones de categorías */}
              {categoriasUnicas.map((categoria, index) => {
                const color = getColorCategoria(index);
                const isActive = Number(categoriaFiltro) === Number(categoria.id);

                return (
                  <Button
                    key={categoria.id}
                    type="button"
                    label={categoria.nombre}
                    size="small"
                    onClick={() => setCategoriaFiltro(Number(categoria.id))}
                    style={{
                      backgroundColor: color.bg,
                      color: "#000000",
                      borderColor: color.border,
                      borderWidth: isActive ? "2px" : "1px",
                      fontWeight: "700",
                      fontSize: "0.75rem",
                      padding: "0.35rem 0.5rem",
                      justifyContent: "flex-start",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    className={isActive ? "" : "p-button-outlined"}
                    tooltip={categoria.nombre}
                    tooltipOptions={{ position: 'right' }}
                  />
                );
              })}
            </div>
          </div>

          {/* ========== COLUMNA 2: TABLA DE TIPOS DE MOVIMIENTO ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}
            
            <DataTable
              ref={dt}
              value={tiposOrdenados}
              selectionMode="single"
              onRowSelect={(e) => handleSeleccion(e.data)}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              globalFilter={globalFilterValue}
              globalFilterFields={['nombre', 'categoria.nombre']}
              emptyMessage="No se encontraron tipos de movimiento"
              stripedRows
              showGridlines
              size="small"
              scrollable
              scrollHeight="500px"
              rowClassName={rowClassName}
            >
              <Column
                field="categoria.nombre"
                header="Categoría"
                body={categoriaTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="nombre"
                header="Tipo de Movimiento"
                body={tipoMovimientoTemplate}
                sortable
                filterField="nombre"
                style={{ minWidth: "400px" }}
              />
            </DataTable>

            {footer}
          </div>
        </div>

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
      </Dialog>
    </div>
  );
};

export default TipoMovimientoSelector;