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
 * @author ERP Megui
 * @version 3.2.0
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
 * Componente TipoMovimientoSelector
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tiposMovimiento - Array de tipos de movimiento con relación categoria
 * @param {number|string} props.value - ID del tipo de movimiento seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un tipo (recibe el ID)
 * @param {boolean} props.disabled - Si el selector está deshabilitado
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
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione tipo de movimiento",
  filterFunction = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [tipo, setTipo] = useState(true); // NUEVO: Estado interno para tipo (true=EGRESOS, false=INGRESOS)
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
        label={
          tipoSeleccionado
            ? `${tipoSeleccionado.categoria?.nombre || ""} - ${tipoSeleccionado.nombre}`
            : placeholder
        }
        icon="pi pi-search"
        onClick={() => !disabled && setDialogVisible(true)}
        disabled={disabled}
        className={classNames("p-button-outlined w-full", {
          "p-invalid": error,
        })}
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
          fontWeight: tipoSeleccionado ? "bold" : "normal",
          color: tipoSeleccionado ? "#000" : "#999",
        }}
      />

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
          gridTemplateColumns: "200px 1fr", 
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
                  backgroundColor: !categoriaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                  color: !categoriaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                  borderColor: COLOR_TODAS.border,
                  fontWeight: "500",
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