/**
 * ProductoSelector.jsx
 * 
 * Componente reutilizable para selección de Producto con búsqueda avanzada
 * Muestra una tabla con Empresa, Familia, Subfamilia y Producto para facilitar la búsqueda
 * Incluye carrusel de filtros por empresa, familia y subfamilia con colores dinámicos
 * 
 * ⚠️ IMPORTANTE: Este componente excluye automáticamente la familia MERCADERÍA (ID=1)
 * porque en gastos planificados solo se usan productos de otras familias
 * (insumos, servicios, mantenimiento, etc.)
 * 
 * PATRÓN: Replica exactamente EntidadComercialSelector.jsx
 * - CARGA INTERNAMENTE todas las empresas, familias, subfamilias y productos
 * - Filtra dinámicamente por empresa, familia y subfamilia
 * - Excluye familia MERCADERÍA automáticamente
 * 
 * CORRECCIÓN v2.2.0: Layout de 4 columnas verticales + carga interna
 * - Columna 1: Botones de empresas (vertical)
 * - Columna 2: Botones de familias (vertical)
 * - Columna 3: Botones de subfamilias (vertical)
 * - Columna 4: DataTable de productos con columna Empresa
 * 
 * @author ERP Megui
 * @version 2.2.0
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { getResponsiveFontSize } from "../../utils/utils";
import { getProductos } from "../../api/producto";
import { getAllEmpresas } from "../../api/empresa";

/**
 * Paleta de colores infinita para empresas, familias y subfamilias
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

// Colores específicos para Empresa, Familia, Subfamilia y Producto
const COLORES_TEXTO = {
  empresa: '#1565C0',      // 🔵 Azul oscuro
  familia: '#1976D2',      // 🔵 Azul
  subfamilia: '#2E7D32',   // 🟢 Verde
  producto: '#FF0000',     // 🔴 Rojo
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
 * Componente ProductoSelector
 * @param {number|string} props.value - ID del producto seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un producto (recibe el ID)
 * @param {number|string} props.empresaIdPreseleccionada - ID de empresa a preseleccionar
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @returns {JSX.Element}
 */
const ProductoSelector = ({
  value = null,
  onChange,
  empresaIdPreseleccionada = null,
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione producto",
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState(empresaIdPreseleccionada);
  const [familiaFiltro, setFamiliaFiltro] = useState(null);
  const [subfamiliaFiltro, setSubfamiliaFiltro] = useState(null);
  const [productos, setProductos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // 🔄 CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [productosData, empresasData] = await Promise.all([
          getProductos(),
          getAllEmpresas()
        ]);
        setProductos(productosData || []);
        setEmpresas(empresasData || []);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
        setProductos([]);
        setEmpresas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // Actualizar empresaFiltro si cambia la preselección
  useEffect(() => {
    if (empresaIdPreseleccionada) {
      setEmpresaFiltro(empresaIdPreseleccionada);
    }
  }, [empresaIdPreseleccionada]);

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

  // ✅ MOSTRAR TODAS LAS EMPRESAS - No filtrar por productos
  const empresasUnicas = useMemo(() => {
    const empresasOrdenadas = [...empresas].sort((a, b) =>
      (a.nombre || a.razonSocial || "").localeCompare(b.nombre || b.razonSocial || "")
    );
    return empresasOrdenadas;
  }, [empresas]);

  // ⚠️ FILTRO POR EMPRESA PRIMERO
  const productosFiltradosPorEmpresa = useMemo(() => {
    if (!empresaFiltro) {
      return productosConFiltroMercaderia;
    }
    
    const filtrados = productosConFiltroMercaderia.filter(
      (producto) => Number(producto.empresaId) === Number(empresaFiltro)
    );
    return filtrados;
  }, [productosConFiltroMercaderia, empresaFiltro]);

  // Extraer familias únicas desde los productos filtrados por empresa y ordenarlas alfabéticamente
  const familiasUnicas = useMemo(() => {
    const familiasMap = new Map();
    productosFiltradosPorEmpresa.forEach((producto) => {
      if (producto.familia && producto.familia.id) {
        familiasMap.set(Number(producto.familia.id), producto.familia);
      }
    });
    const familias = Array.from(familiasMap.values()).sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
    return familias;
  }, [productosFiltradosPorEmpresa]);

  // Filtrar productos por familia seleccionada
  const productosFiltradosPorFamilia = useMemo(() => {
    if (!familiaFiltro) {
      return productosFiltradosPorEmpresa;
    }
    const filtrados = productosFiltradosPorEmpresa.filter(
      (producto) => Number(producto.familiaId) === Number(familiaFiltro)
    );
    return filtrados;
  }, [productosFiltradosPorEmpresa, familiaFiltro]);

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

  // Ordenar productos: primero por empresa, luego por familia, luego por subfamilia, luego por descripción
  const productosOrdenados = useMemo(() => {
    return [...productosFiltradosPorSubfamilia].sort((a, b) => {
      // Primero por empresa
      const empA = getEmpresaNombre(a.empresaId, empresas);
      const empB = getEmpresaNombre(b.empresaId, empresas);
      if (empA !== empB) {
        return empA.localeCompare(empB);
      }
      // Luego por familia
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
  }, [productosFiltradosPorSubfamilia, empresas]);

  /**
   * Maneja el cambio de empresa
   * Reset automático de familia y subfamilia al cambiar empresa
   */
  const handleEmpresaChange = (empresaId) => {
    setEmpresaFiltro(empresaId);
    setFamiliaFiltro(null);
    setSubfamiliaFiltro(null);
  };

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
    // No resetear empresaFiltro para mantener la preselección
    setFamiliaFiltro(null);
    setSubfamiliaFiltro(null);
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    // Restaurar empresa preseleccionada al cerrar
    setEmpresaFiltro(empresaIdPreseleccionada);
    setFamiliaFiltro(null);
    setSubfamiliaFiltro(null);
  };

  /**
   * Template para la empresa
   */
  const empresaTemplate = (rowData) => {
    const nombreEmpresa = getEmpresaNombre(rowData.empresaId, empresas);
    return (
      <span style={{ color: COLORES_TEXTO.empresa, fontSize: "0.9rem", fontWeight: "bold" }}>
        {nombreEmpresa}
      </span>
    );
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
      <h4 style={{ margin: 0 }}>Productos</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
          }}
          placeholder="Buscar producto..."
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
      Total: {productosOrdenados.length} producto(s)
      {empresas.length === 0 && (
        <span style={{ color: "red", marginLeft: "1rem" }}>
          ⚠️ No se cargaron empresas
        </span>
      )}
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
          }
        }}
        disabled={disabled || loading}
        className={classNames("p-button-outlined w-full", {
          "p-invalid": error,
        })}
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
        }}
      >
        {loading ? (
          <span style={{ color: "#999" }}>Cargando...</span>
        ) : productoSeleccionado ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ color: COLORES_TEXTO.empresa }}>
              {getEmpresaNombre(productoSeleccionado.empresaId, empresas)}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.familia }}>
              {productoSeleccionado.familia?.nombre || "Sin familia"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.subfamilia }}>
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

      {/* Dialog con layout de 4 columnas */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "1800px" }}
        header="Seleccionar Producto"
        modal
        onHide={() => {
          handleCloseDialog();
        }}
        maximizable
      >
        {/* Layout de 4 columnas */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "160px 160px 160px 1fr", 
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

          {/* ========== COLUMNA 2: FAMILIAS ========== */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Familias
            </h4>
            {empresaFiltro && familiasUnicas.length > 0 ? (
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
                  onClick={() => handleFamiliaChange(null)}
                  style={{
                    backgroundColor: !familiaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                    color: !familiaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                    borderColor: COLOR_TODAS.border,
                    fontWeight: "500",
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                  className={!familiaFiltro ? "" : "p-button-outlined"}
                />

                {/* Botones de familias */}
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
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.5rem",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      className={isActive ? "" : "p-button-outlined"}
                      tooltip={familia.nombre}
                      tooltipOptions={{ position: 'right' }}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#999", fontSize: "0.85rem", fontStyle: "italic" }}>
                {empresaFiltro ? "No hay familias disponibles" : "Seleccione una empresa"}
              </div>
            )}
          </div>

          {/* ========== COLUMNA 3: SUBFAMILIAS ========== */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Subfamilias
            </h4>
            {familiaFiltro && subfamiliasUnicas.length > 0 ? (
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
                  onClick={() => setSubfamiliaFiltro(null)}
                  style={{
                    backgroundColor: !subfamiliaFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                    color: !subfamiliaFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                    borderColor: COLOR_TODAS.border,
                    fontWeight: "500",
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                  className={!subfamiliaFiltro ? "" : "p-button-outlined"}
                />

                {/* Botones de subfamilias */}
                {subfamiliasUnicas.map((subfamilia, index) => {
                  const color = getColorCategoria(index);
                  const isActive = Number(subfamiliaFiltro) === Number(subfamilia.id);

                  return (
                    <Button
                      key={subfamilia.id}
                      type="button"
                      label={subfamilia.nombre}
                      size="small"
                      onClick={() => setSubfamiliaFiltro(Number(subfamilia.id))}
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
                      tooltip={subfamilia.nombre}
                      tooltipOptions={{ position: 'right' }}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#999", fontSize: "0.85rem", fontStyle: "italic" }}>
                {familiaFiltro ? "No hay subfamilias disponibles" : "Seleccione una familia"}
              </div>
            )}
          </div>

          {/* ========== COLUMNA 4: TABLA DE PRODUCTOS ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}
            
            <DataTable
              ref={dt}
              value={productosOrdenados}
              selectionMode="single"
              onRowSelect={(e) => {
                handleSeleccion(e.data);
              }}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              globalFilter={globalFilterValue}
              globalFilterFields={['descripcionArmada']}
              emptyMessage="No se encontraron productos"
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
                field="empresaId"
                header="Empresa"
                body={empresaTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="familia.nombre"
                header="Familia"
                body={familiaTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="subfamilia.nombre"
                header="Subfamilia"
                body={subfamiliaTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="descripcionArmada"
                header="Producto"
                body={productoTemplate}
                sortable
                filterField="descripcionArmada"
                style={{ minWidth: "400px" }}
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

export default ProductoSelector;