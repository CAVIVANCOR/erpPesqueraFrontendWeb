/**
 * ProductoSelector.jsx
 * 
 * Componente reutilizable para selección de Producto con búsqueda avanzada
 * Muestra una tabla con Familia, Subfamilia y Producto para facilitar la búsqueda
 * Incluye carrusel de filtros por familia y subfamilia con colores dinámicos
 * 
 * ⚠️ IMPORTANTE: Este componente excluye automáticamente la familia MERCADERÍA (ID=1)
 * porque en gastos planificados solo se usan productos de otras familias
 * (insumos, servicios, mantenimiento, etc.)
 * 
 * PATRÓN: Replica exactamente TipoMovimientoSelector
 * - Recibe solo el array de productos con relaciones incluidas
 * - Extrae familias y subfamilias desde los productos
 * - Filtra dinámicamente por ID=1
 * 
 * @author ERP Megui
 * @version 2.0.1 - CON DIAGNÓSTICO
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

/**
 * Paleta de colores infinita para familias y subfamilias
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
// Colores específicos para Familia, Subfamilia y Producto
const COLORES_TEXTO = {
  familia: '#1976D2',      // 🔵 Azul
  subfamilia: '#2E7D32',   // 🟢 Verde
  producto: '#FF0000',     // 🍷 Rojo oscuro conche vino
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
 * Componente ProductoSelector
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.productos - Array de productos con relaciones familia y subfamilia incluidas
 * @param {number|string} props.value - ID del producto seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un producto (recibe el ID)
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @returns {JSX.Element}
 */
const ProductoSelector = ({
  productos = [],
  value = null,
  onChange,
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione producto",
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [familiaFiltro, setFamiliaFiltro] = useState(null);
  const [subfamiliaFiltro, setSubfamiliaFiltro] = useState(null);
  const dt = useRef(null);


  // Obtener el producto seleccionado (buscar en array original completo)
  const productoSeleccionado = useMemo(() => {
    if (!value) {
      return null;
    }
    
    const producto = productos.find((p) => Number(p.id) === Number(value));
    return producto;
  }, [productos, value]);

  // ⚠️ FILTRO FAMILIA MERCADERÍA
  // Excluimos productos con familiaId=1 (MERCADERÍA) porque no se usan en gastos planificados
  const productosConFiltroMercaderia = useMemo(() => {
    const filtrados = productos.filter((p) => Number(p.familiaId) !== 1);
    return filtrados;
  }, [productos]);

  // Extraer familias únicas desde los productos filtrados y ordenarlas alfabéticamente
  const familiasUnicas = useMemo(() => {
    const familiasMap = new Map();
    productosConFiltroMercaderia.forEach((producto) => {
      if (producto.familia && producto.familia.id) {
        familiasMap.set(Number(producto.familia.id), producto.familia);
      }
    });
    const familias = Array.from(familiasMap.values()).sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
    return familias;
  }, [productosConFiltroMercaderia]);

  // Filtrar productos por familia seleccionada
  const productosFiltradosPorFamilia = useMemo(() => {
    if (!familiaFiltro) {
      return productosConFiltroMercaderia;
    }
    const filtrados = productosConFiltroMercaderia.filter(
      (producto) => Number(producto.familiaId) === Number(familiaFiltro)
    );
    return filtrados;
  }, [productosConFiltroMercaderia, familiaFiltro]);

  // Extraer subfamilias únicas desde los productos filtrados por familia
  const subfamiliasUnicas = useMemo(() => {
    const subfamiliasMap = new Map();
    productosFiltradosPorFamilia.forEach((producto) => {
      if (producto.subfamilia && producto.subfamilia.id) {
        subfamiliasMap.set(Number(producto.subfamilia.id), producto.subfamilia);
      }
    });
    const subfamilias = Array.from(subfamiliasMap.values()).sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
    return subfamilias;
  }, [productosFiltradosPorFamilia]);

  // Filtrar productos por subfamilia seleccionada
  const productosFiltradosPorSubfamilia = useMemo(() => {
    if (!subfamiliaFiltro) {
      return productosFiltradosPorFamilia;
    }
    const filtrados = productosFiltradosPorFamilia.filter(
      (producto) => Number(producto.subfamiliaId) === Number(subfamiliaFiltro)
    );
    return filtrados;
  }, [productosFiltradosPorFamilia, subfamiliaFiltro]);

  // Ordenar productos: primero por familia, luego por subfamilia, luego por descripción
  const productosOrdenados = useMemo(() => {
    return [...productosFiltradosPorSubfamilia].sort((a, b) => {
      // Primero por familia
      const famA = a.familia?.nombre || "";
      const famB = b.familia?.nombre || "";
      if (famA !== famB) {
        return famA.localeCompare(famB);
      }
      // Luego por subfamilia
      const subfamA = a.subfamilia?.nombre || "";
      const subfamB = b.subfamilia?.nombre || "";
      if (subfamA !== subfamB) {
        return subfamA.localeCompare(subfamB);
      }
      // Finalmente por descripción
      return (a.descripcionArmada || "").localeCompare(b.descripcionArmada || "");
    });
  }, [productosFiltradosPorSubfamilia]);

  /**
   * Maneja el cambio de familia
   * Reset automático de subfamilia al cambiar familia
   */
  const handleFamiliaChange = (familiaId) => {
    setFamiliaFiltro(familiaId);
    setSubfamiliaFiltro(null); // Reset subfamilia
  };

  /**
   * Maneja la selección de un producto
   */
  const handleSeleccion = (producto) => {
    
    if (onChange) {
      onChange(Number(producto.id));
    }
    
    setDialogVisible(false);
    setGlobalFilterValue("");
    setFamiliaFiltro(null);
    setSubfamiliaFiltro(null);
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    setFamiliaFiltro(null);
    setSubfamiliaFiltro(null);
  };

  /**
   * Template para la familia
   */
  const familiaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.familia, fontSize: "0.9rem", fontWeight: "bold" }}>
        {rowData.familia?.nombre || "Sin familia"}
      </span>
    );
  };

  /**
   * Template para la subfamilia
   */
  const subfamiliaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.subfamilia, fontSize: "0.9rem", fontWeight: "bold" }}>
        {rowData.subfamilia?.nombre || "Sin subfamilia"}
      </span>
    );
  };

  /**
   * Template para el producto
   */
  const productoTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.producto, fontWeight: "bold" }}>
        {rowData.descripcionArmada}
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
      <h3 style={{ margin: 0 }}>Seleccionar Producto</h3>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
          }}
          placeholder="Buscar producto..."
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
      Total: {productosOrdenados.length} producto(s)
    </div>
  );

  return (
    <div className="field">
      {/* Label */}
      <label className="block text-900 font-medium mb-2">
        Producto (Gasto) {required && <span style={{ color: "red" }}>*</span>}
      </label>

      {/* Botón selector */}
           <Button
        type="button"
        icon="pi pi-search"
        onClick={() => {
          if (!disabled) {
            setDialogVisible(true);
          } else {
          }
        }}
        disabled={disabled}
        className={classNames("p-button-outlined w-full", {
          "p-invalid": error,
        })}
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
        }}
      >
        {productoSeleccionado ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ color: COLORES_TEXTO.familia,  }}>
              {productoSeleccionado.familia?.nombre || "Sin familia"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.subfamilia, }}>
              {productoSeleccionado.subfamilia?.nombre || "Sin subfamilia"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.producto, fontWeight: "bold" }}>
              {productoSeleccionado.descripcionArmada || "Sin descripción"}
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
        style={{ width: "90vw", maxWidth: "1200px", height: "700px" }}
        header={header}
        modal
        onHide={() => {
          handleCloseDialog();
        }}
        footer={footer}
      >
        {/* Carrusel de filtros por familia */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
            Filtrar por Familia:
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Botón TODAS */}
            <Button
              type="button"
              label="TODAS"
              size="small"
              onClick={() => handleFamiliaChange(null)}
              style={{
                backgroundColor: !familiaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                color: !familiaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                borderColor: COLOR_TODAS.border,
                fontWeight: "500",
              }}
              className={!familiaFiltro ? "" : "p-button-outlined"}
            />

            {/* Botones de familias dinámicos (ya excluye ID=1 automáticamente) */}
            {familiasUnicas.map((familia, index) => {
              const color = getColorCategoria(index);
              const isActive = Number(familiaFiltro) === Number(familia.id);

              return (
                <Button
                  key={familia.id}
                  type="button"
                  label={familia.nombre}
                  size="small"
                  onClick={() => handleFamiliaChange(Number(familia.id))}
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

        {/* Carrusel de filtros por subfamilia */}
        {familiaFiltro && subfamiliasUnicas.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
              Filtrar por Subfamilia:
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {/* Botón TODAS */}
              <Button
                type="button"
                label="TODAS"
                size="small"
                onClick={() => {
                  setSubfamiliaFiltro(null);
                }}
                style={{
                  backgroundColor: !subfamiliaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                  color: !subfamiliaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                  borderColor: COLOR_TODAS.border,
                  fontWeight: "500",
                }}
                className={!subfamiliaFiltro ? "" : "p-button-outlined"}
              />

              {/* Botones de subfamilias dinámicos */}
              {subfamiliasUnicas.map((subfamilia, index) => {
                const color = getColorCategoria(index);
                const isActive = Number(subfamiliaFiltro) === Number(subfamilia.id);

                return (
                  <Button
                    key={subfamilia.id}
                    type="button"
                    label={subfamilia.nombre}
                    size="small"
                    onClick={() => {
                      setSubfamiliaFiltro(Number(subfamilia.id));
                    }}
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
        )}

        {/* Tabla de productos */}
        <DataTable
          ref={dt}
          value={productosOrdenados}
          selectionMode="single"
          onRowSelect={(e) => {
            handleSeleccion(e.data);
          }}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          globalFilter={globalFilterValue}
          emptyMessage="No se encontraron productos"
          stripedRows
          showGridlines
          size="small"
          scrollable
          scrollHeight="400px"
          rowClassName={rowClassName}
        >
          <Column
            field="familia.nombre"
            header="Familia"
            body={familiaTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="subfamilia.nombre"
            header="Subfamilia"
            body={subfamiliaTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="descripcionArmada"
            header="Producto"
            body={productoTemplate}
            sortable
            style={{ minWidth: "400px" }}
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

export default ProductoSelector;