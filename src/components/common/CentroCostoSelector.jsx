/**
 * CentroCostoSelector.jsx
 * 
 * Componente reutilizable para selección de Centro de Costo
 * Muestra una tabla con ID, Categoría, Código y Nombre para facilitar la búsqueda
 * Incluye filtro por Categoría
 * 
 * PATRÓN: Replica exactamente PlanCuentaContableSelector.jsx
 * - CARGA INTERNAMENTE todos los centros de costo y categorías
 * - Filtra dinámicamente por categoría
 * - Permite filtrar por empresa si se proporciona
 * - Muestra centros activos
 * 
 * IMPORTANTE: Usa campos del schema CentroCosto
 * - Codigo: String (código del centro)
 * - Nombre: String (nombre del centro)
 * - CategoriaID: BigInt (categoría del centro)
 * - Descripcion: String (descripción)
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
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllCategoriaCCosto } from "../../api/categoriaCCosto";
import { getResponsiveFontSize } from "../../utils/utils";

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
 * Componente CentroCostoSelector
 * @param {number|string} props.value - ID del centro de costo seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un centro (recibe el ID)
 * @param {number|string} props.empresaId - ID de empresa para filtrar (opcional)
 * @param {string} props.label - Etiqueta personalizada
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.showClearButton - Mostrar botón para limpiar selección
 * @param {number} props.refreshTrigger - Timestamp para forzar recarga de datos
 * @returns {JSX.Element}
 */
const CentroCostoSelector = ({
  value = null,
  onChange,
  empresaId = null,
  label = "Centro de Costo",
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Elegir un Centro de Costo",
  showClearButton = true,
  refreshTrigger = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [centros, setCentros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // 🔄 CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [centrosData, categoriasData] = await Promise.all([
          getCentrosCosto(),
          getAllCategoriaCCosto(),
        ]);
        setCentros(centrosData || []);
        setCategorias(categoriasData || []);
      } catch (error) {
        console.error("❌ Error cargando centros de costo:", error);
        setCentros([]);
        setCategorias([]);
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
          const [centrosData, categoriasData] = await Promise.all([
            getCentrosCosto(),
            getAllCategoriaCCosto(),
          ]);
          setCentros(centrosData || []);
          setCategorias(categoriasData || []);
        } catch (error) {
          console.error("❌ Error recargando centros de costo:", error);
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
          const [centrosData, categoriasData] = await Promise.all([
            getCentrosCosto(),
            getAllCategoriaCCosto(),
          ]);
          setCentros(centrosData || []);
          setCategorias(categoriasData || []);
        } catch (error) {
          console.error("❌ Error recargando centros de costo:", error);
        }
      };
      recargarDatos();
    }
  }, [refreshTrigger]);

  // Obtener el centro seleccionado
  const centroSeleccionado = useMemo(() => {
    if (!value) {
      return null;
    }

    const centro = centros.find((c) => Number(c.id) === Number(value));
    return centro;
  }, [centros, value]);

  // Filtrar centros por categoría seleccionada
  const centrosFiltrados = useMemo(() => {
    if (!categoriaFiltro) {
      return centros;
    }
    const filtrados = centros.filter(
      (centro) => Number(centro.CategoriaID) === Number(categoriaFiltro)
    );
    return filtrados;
  }, [centros, categoriaFiltro]);

  // Ordenar centros por código
  const centrosOrdenados = useMemo(() => {
    return [...centrosFiltrados].sort((a, b) => {
      const codigoA = a.Codigo || "";
      const codigoB = b.Codigo || "";
      return codigoA.localeCompare(codigoB, undefined, { numeric: true });
    });
  }, [centrosFiltrados]);

  /**
   * Maneja el cambio de categoría
   */
  const handleCategoriaChange = (categoriaId) => {
    setCategoriaFiltro(categoriaId);
  };

  /**
   * Maneja la selección de un centro
   */
  const handleSeleccion = (centro) => {
    if (onChange) {
      onChange(Number(centro.id));
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
   * Maneja la limpieza de selección
   */
  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  /**
   * Template para el código del centro
   */
  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976D2", fontSize: "0.95rem" }}>
        {rowData.Codigo}
      </span>
    );
  };

  /**
   * Template para el nombre del centro
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.Nombre}
      </span>
    );
  };

  /**
   * Template para la categoría
   */
  const categoriaTemplate = (rowData) => {
    const categoria = categorias.find(
      (c) => Number(c.id) === Number(rowData.CategoriaID)
    );

    if (!categoria) return <span style={{ color: "#999" }}>-</span>;

    return (
      <Tag
        value={categoria.nombre}
        severity="info"
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
      <h4 style={{ margin: 0 }}>Centros de Costo</h4>
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
      Total: {centrosOrdenados.length} centro(s)
      {categoriaFiltro && (
        <span style={{ marginLeft: "1rem", color: "#2196F3" }}>
          📊 Filtrando por Categoría: {categorias.find(c => Number(c.id) === Number(categoriaFiltro))?.nombre}
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
          icon="pi pi-building"
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
          ) : centroSeleccionado ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <Tag
                value={centroSeleccionado.Codigo}
                severity="info"
                style={{ fontWeight: "bold" }}
              />
              <Tag
                value={centroSeleccionado.Nombre}
                severity="success"
              />
            </span>
          ) : (
            <span style={{ color: "#999" }}>📂 {placeholder}</span>
          )}
        </Button>

        {/* Botón Clear */}
        {showClearButton && centroSeleccionado && !disabled && (
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

          {/* ========== COLUMNA 1: CATEGORÍAS (FILTRO) ========== */}
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
                onClick={() => handleCategoriaChange(null)}
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
              {categorias.map((categoria, index) => {
                const color = getColorCategoria(index);
                const isActive = Number(categoriaFiltro) === Number(categoria.id);

                return (
                  <Button
                    key={categoria.id}
                    type="button"
                    label={categoria.nombre}
                    size="small"
                    onClick={() => handleCategoriaChange(categoria.id)}
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

          {/* ========== COLUMNA 2: TABLA DE CENTROS ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}

            <DataTable
              ref={dt}
              value={centrosOrdenados}
              selectionMode="single"
              onRowSelect={(e) => {
                handleSeleccion(e.data);
              }}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              globalFilter={globalFilterValue}
              globalFilterFields={['Codigo', 'Nombre', 'Descripcion']}
              emptyMessage="No se encontraron centros de costo"
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
                field="id"
                header="ID"
                sortable
                style={{ width: "80px" }}
              />
              <Column
                field="CategoriaID"
                header="Categoría"
                body={categoriaTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="Codigo"
                header="Código"
                body={codigoTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="Nombre"
                header="Nombre"
                body={nombreTemplate}
                sortable
                filterField="Nombre"
                style={{ minWidth: "250px" }}
              />
              <Column
                field="Descripcion"
                header="Descripción"
                sortable
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

export default CentroCostoSelector;