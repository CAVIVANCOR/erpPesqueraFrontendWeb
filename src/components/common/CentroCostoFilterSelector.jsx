/**
 * CentroCostoFilterSelector.jsx
 * 
 * Componente reutilizable para FILTRAR por Centro de Costo en listas/tablas
 * Muestra tags con Categoría, Subcategoría y Descripción
 * 
 * DIFERENCIA con CentroCostoSelector.jsx:
 * - CentroCostoSelector: Para FORMULARIOS (guardar en BD)
 * - CentroCostoFilterSelector: Para FILTROS en listas (filtrar registros visibles)
 * 
 * CARACTERÍSTICAS:
 * - Siempre opcional (sin required)
 * - Sin validación de errores
 * - Placeholder: "Todos los centros"
 * - Botón clear siempre visible
 * - Label: "Filtrar por Centro de Costo"
 * - FILTRO DINÁMICO: Muestra solo centros que existen en los registros visibles
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
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllCategoriaCCosto } from "../../api/categoriaCCosto";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Paleta de colores infinita para categorías
 */
const COLORES_CATEGORIAS = [
  { bg: '#4CAF50', text: '#FFFFFF', border: '#4CAF50' },
  { bg: '#00BCD4', text: '#FFFFFF', border: '#00BCD4' },
  { bg: '#FF9800', text: '#FFFFFF', border: '#FF9800' },
  { bg: '#009688', text: '#FFFFFF', border: '#009688' },
  { bg: '#9C27B0', text: '#FFFFFF', border: '#9C27B0' },
  { bg: '#3F51B5', text: '#FFFFFF', border: '#3F51B5' },
  { bg: '#E91E63', text: '#FFFFFF', border: '#E91E63' },
  { bg: '#FFC107', text: '#000000', border: '#FFC107' },
  { bg: '#8BC34A', text: '#000000', border: '#8BC34A' },
  { bg: '#607D8B', text: '#FFFFFF', border: '#607D8B' },
  { bg: '#795548', text: '#FFFFFF', border: '#795548' },
  { bg: '#F44336', text: '#FFFFFF', border: '#F44336' },
  { bg: '#673AB7', text: '#FFFFFF', border: '#673AB7' },
  { bg: '#03A9F4', text: '#FFFFFF', border: '#03A9F4' },
  { bg: '#CDDC39', text: '#000000', border: '#CDDC39' },
  { bg: '#FF5722', text: '#FFFFFF', border: '#FF5722' },
];

const COLOR_TODAS = { bg: '#2196F3', text: '#FFFFFF', border: '#2196F3' };

const getColorCategoria = (index) => {
  return COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length];
};

/**
 * Componente CentroCostoFilterSelector
 * @param {number|string} props.value - ID del centro de costo seleccionado para filtrar
 * @param {Function} props.onChange - Callback cuando se selecciona un centro (recibe el ID o null)
 * @param {string} props.label - Etiqueta personalizada (default: "Filtrar por Centro de Costo")
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {Array<number>} props.availableCentros - IDs de centros disponibles en los registros visibles (opcional)
 * @returns {JSX.Element}
 */
const CentroCostoFilterSelector = ({
  value = null,
  onChange,
  label = "Filtrar por Centro de Costo",
  disabled = false,
  availableCentros = null,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [centros, setCentros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // Cargar datos al montar
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

  // Recargar cuando se abre el diálogo
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

  // Obtener centro seleccionado con categoría poblada
  const centroSeleccionado = useMemo(() => {
    if (!value) return null;

    const centro = centros.find((c) => Number(c.id) === Number(value));
    if (!centro) return null;

    const categoriaEncontrada = categorias.find(
      (cat) => Number(cat.id) === Number(centro.CategoriaID)
    );

    return {
      ...centro,
      categoria: categoriaEncontrada || null,
    };
  }, [centros, categorias, value]);

  // Filtrar centros por categoría
  const centrosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return centros;
    return centros.filter(
      (centro) => Number(centro.CategoriaID) === Number(categoriaFiltro)
    );
  }, [centros, categoriaFiltro]);

  // Ordenar centros por código
  const centrosOrdenados = useMemo(() => {
    return [...centrosFiltrados].sort((a, b) => {
      const codigoA = a.Codigo || "";
      const codigoB = b.Codigo || "";
      return codigoA.localeCompare(codigoB, undefined, { numeric: true });
    });
  }, [centrosFiltrados]);


  // Filtrar centros por availableCentros (dinámico)
  const centrosFiltradosPorDisponibles = useMemo(() => {
    if (!availableCentros || availableCentros.length === 0) {
      return centrosOrdenados;
    }
    return centrosOrdenados.filter(centro =>
      availableCentros.includes(Number(centro.id))
    );
  }, [centrosOrdenados, availableCentros]);

  const handleCategoriaChange = (categoriaId) => {
    setCategoriaFiltro(categoriaId);
  };

  const handleSeleccion = (centro) => {
    if (onChange) {
      onChange(Number(centro.id));
    }
    setDialogVisible(false);
    setGlobalFilterValue("");
    setCategoriaFiltro(null);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    setCategoriaFiltro(null);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976D2", fontSize: "0.95rem" }}>
        {rowData.Codigo}
      </span>
    );
  };

  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.Nombre}
      </span>
    );
  };

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

  const rowClassName = (rowData) => {
    return Number(rowData.id) === Number(value) ? "row-selected" : "";
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
      <h4 style={{ margin: 0 }}>Centros de Costo</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar por código o nombre..."
          style={{ width: "300px" }}
        />
      </span>
    </div>
  );

  const footer = (
    <div style={{ textAlign: "left", color: "#666", fontSize: "0.9rem" }}>
      Total: {centrosFiltradosPorDisponibles.length} centro(s)
      {availableCentros && (
        <span style={{ marginLeft: "1rem", color: "#FF9800" }}>
          🔍 Mostrando solo centros presentes en registros visibles
        </span>
      )}
      {categoriaFiltro && (
        <span style={{ marginLeft: "1rem", color: "#2196F3" }}>
          📊 Filtrando por Categoría: {categorias.find(c => Number(c.id) === Number(categoriaFiltro))?.nombre}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ flex: 1 }}>
      <label htmlFor="centroCostoFilter">{label}</label>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button
          id="centroCostoFilter"
          type="button"
          icon="pi pi-building"
          onClick={() => {
            if (!disabled) {
              setDialogVisible(true);
            }
          }}
          disabled={disabled || loading}
          className="p-button-outlined"
          style={{
            justifyContent: "flex-start",
            textAlign: "left",
            flex: 1,
            width: "100%",
          }}
        >
          {loading ? (
            <span style={{ color: "#999" }}>Cargando...</span>
          ) : centroSeleccionado ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {centroSeleccionado.categoria && (
                <Tag
                  value={centroSeleccionado.categoria.nombre}
                  severity="info"
                  style={{ fontWeight: "bold", fontSize: "0.75rem" }}
                />
              )}
              {centroSeleccionado.ParentCentroID && (
                <Tag
                  value={centroSeleccionado.ParentCentroID}
                  severity="warning"
                  style={{ fontWeight: "500", fontSize: "0.75rem" }}
                />
              )}
              <Tag
                value={centroSeleccionado.Descripcion || centroSeleccionado.Nombre}
                severity="success"
                style={{ fontSize: "0.75rem" }}
              />
            </span>
          ) : (
            <span style={{ color: "#999" }}>📂 Todos los centros</span>
          )}
        </Button>

        {centroSeleccionado && !disabled && (
          <Button
            type="button"
            icon="pi pi-times"
            onClick={handleClear}
            className="p-button-rounded p-button-text p-button-danger"
            tooltip="Limpiar filtro"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "1400px" }}
        header={`Seleccionar ${label}`}
        modal
        onHide={handleCloseDialog}
        maximizable
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: "1rem",
          height: "600px"
        }}>
          {/* COLUMNA 1: CATEGORÍAS */}
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

          {/* COLUMNA 2: TABLA */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}

            <DataTable
              ref={dt}
              value={centrosFiltradosPorDisponibles}
              selectionMode="single"
              onRowSelect={(e) => handleSeleccion(e.data)}
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

export default CentroCostoFilterSelector;