/**
 * TipoMovimientoSelector.jsx
 * 
 * Componente reutilizable para selección de Tipo de Movimiento con búsqueda avanzada
 * Muestra una tabla con Categoría y Tipo de Movimiento para facilitar la búsqueda
 * Incluye carrusel de filtros por categoría con colores dinámicos
 * 
 * @author ERP Megui
 * @version 2.0.0
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
  const dt = useRef(null);

  // Obtener el tipo de movimiento seleccionado
  const tipoSeleccionado = tiposMovimiento.find(
    (t) => Number(t.id) === Number(value)
  );

  // Aplicar filtro personalizado si existe
  const tiposConFiltroPersonalizado = filterFunction
    ? tiposMovimiento.filter(filterFunction)
    : tiposMovimiento;

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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0 }}>Seleccionar Tipo de Movimiento</h3>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar por categoría o tipo..."
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
        style={{ width: "90vw", maxWidth: "1200px", height: "700px" }}
        header={header}
        modal
        onHide={handleCloseDialog}
        footer={footer}
      >
        {/* Carrusel de filtros por categoría */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
            Filtrar por Categoría:
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
              }}
              className={!categoriaFiltro ? "" : "p-button-outlined"}
            />

            {/* Botones de categorías dinámicos */}
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
                  }}
                  className={isActive ? "" : "p-button-outlined"}
                />
              );
            })}
          </div>
        </div>

        {/* Tabla de tipos de movimiento */}
        <DataTable
          ref={dt}
          value={tiposOrdenados}
          selectionMode="single"
          onRowSelect={(e) => handleSeleccion(e.data)}
          dataKey="id"
          paginator
          rows={40}
          rowsPerPageOptions={[40, 80, 160]}
          globalFilter={globalFilterValue}
          emptyMessage="No se encontraron tipos de movimiento"
          stripedRows
          showGridlines
          size="small"
          scrollable
          scrollHeight="450px"
          rowClassName={rowClassName}
        >
          <Column
            field="categoria.nombre"
            header="Categoría"
            body={categoriaTemplate}
            sortable
            style={{ minWidth: "300px" }}
          />
          <Column
            field="nombre"
            header="Tipo de Movimiento"
            body={tipoMovimientoTemplate}
            sortable
            style={{ minWidth: "500px" }}
          />
        </DataTable>

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