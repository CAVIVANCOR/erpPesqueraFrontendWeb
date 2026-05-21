/**
 * ActivoSelector.jsx
 * 
 * Componente reutilizable para selección de Activo con búsqueda avanzada
 * Muestra una tabla con Empresa, Tipo de Activo y Activo para facilitar la búsqueda
 * Incluye carrusel de filtros por empresa y tipo de activo con colores dinámicos
 * 
 * PATRÓN: Replica exactamente EntidadComercialSelector.jsx
 * - CARGA INTERNAMENTE todas las empresas, tipos de activo y activos
 * - Filtra dinámicamente por empresa y tipo
 * - Excluye activos cesados automáticamente
 * 
 * CORRECCIÓN v1.2.0: Layout de 3 columnas verticales + carga interna
 * - Columna 1: Botones de empresas (vertical)
 * - Columna 2: Botones de tipos de activo (vertical)
 * - Columna 3: DataTable de activos con columna Empresa
 * 
 * @author ERP Megui
 * @version 1.2.0
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { getResponsiveFontSize } from "../../utils/utils";
import { getActivos } from "../../api/activo";
import { getTiposActivo } from "../../api/tipoActivo";
import { getAllEmpresas } from "../../api/empresa";

/**
 * Paleta de colores infinita para empresas y tipos de activo
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

// Color para el botón "TODAS/TODOS"
const COLOR_TODAS = { bg: '#2196F3', text: '#FFFFFF', border: '#2196F3' }; // Azul

// Colores específicos para Empresa, Tipo y Activo
const COLORES_TEXTO = {
  empresa: '#1976D2',      // 🔵 Azul
  tipo: '#2E7D32',         // 🟢 Verde
  activo: '#D32F2F',       // 🔴 Rojo
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
 * Componente ActivoSelector
 * @param {number|string} props.value - ID del activo seleccionado
 * @param {Function} props.onChange - Callback cuando se selecciona un activo (recibe el ID)
 * @param {number|string} props.empresaIdPreseleccionada - ID de empresa a preseleccionar
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.error - Si hay error de validación
 * @param {string} props.errorMessage - Mensaje de error
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.mostrarCesados - Si se deben mostrar activos cesados (por defecto false)
 * @returns {JSX.Element}
 */
const ActivoSelector = ({
  value = null,
  onChange,
  empresaIdPreseleccionada = null,
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  placeholder = "Seleccione activo",
  mostrarCesados = false,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState(empresaIdPreseleccionada);
  const [tipoFiltro, setTipoFiltro] = useState(null);
  const [activos, setActivos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposActivo, setTiposActivo] = useState([]);
  const [loading, setLoading] = useState(false);
  const dt = useRef(null);

  // 🔄 CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [activosData, empresasData, tiposData] = await Promise.all([
          getActivos(),
          getAllEmpresas(),
          getTiposActivo()
        ]);
        
        setActivos(activosData || []);
        setEmpresas(empresasData || []);
        setTiposActivo(tiposData || []);
        
        console.log("📊 ActivoSelector - Empresas cargadas:", empresasData?.length || 0);
        console.log("📊 ActivoSelector - Tipos de activo cargados:", tiposData?.length || 0);
        console.log("📊 ActivoSelector - Activos cargados:", activosData?.length || 0);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
        setActivos([]);
        setEmpresas([]);
        setTiposActivo([]);
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

  // Obtener el activo seleccionado (buscar en array original completo)
  const activoSeleccionado = useMemo(() => {
    if (!value) {
      return null;
    }
    
    const activo = activos.find((a) => Number(a.id) === Number(value));
    return activo;
  }, [activos, value]);

  // ⚠️ FILTRO ACTIVOS CESADOS
  // Excluimos activos cesados por defecto (cesado=true)
  const activosConFiltroCesados = useMemo(() => {
    if (mostrarCesados) {
      return activos;
    }
    const filtrados = activos.filter((a) => a.cesado === false);
    return filtrados;
  }, [activos, mostrarCesados]);

  // ✅ MOSTRAR TODAS LAS EMPRESAS - No filtrar por activos
  const empresasUnicas = useMemo(() => {
    // Usar directamente el array de empresas recibido, ordenado alfabéticamente
    const empresasOrdenadas = [...empresas].sort((a, b) =>
      (a.nombre || a.razonSocial || "").localeCompare(b.nombre || b.razonSocial || "")
    );
    return empresasOrdenadas;
  }, [empresas]);

  // ⚠️ FILTRO POR EMPRESA PRIMERO (antes de aplicar filtro de tipo)
  const activosFiltradosPorEmpresa = useMemo(() => {
    if (!empresaFiltro) {
      return activosConFiltroCesados;
    }
    
    const filtrados = activosConFiltroCesados.filter(
      (activo) => Number(activo.empresaId) === Number(empresaFiltro)
    );
    return filtrados;
  }, [activosConFiltroCesados, empresaFiltro]);

  // Extraer tipos únicos desde los activos filtrados por empresa
  const tiposUnicos = useMemo(() => {
    const tiposMap = new Map();
    activosFiltradosPorEmpresa.forEach((activo) => {
      if (activo.tipo && activo.tipo.id) {
        tiposMap.set(Number(activo.tipo.id), activo.tipo);
      }
    });
    const tipos = Array.from(tiposMap.values()).sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
    return tipos;
  }, [activosFiltradosPorEmpresa]);

  // Filtrar activos por tipo seleccionado
  const activosFiltradosPorTipo = useMemo(() => {
    if (!tipoFiltro) {
      return activosFiltradosPorEmpresa;
    }
    const filtrados = activosFiltradosPorEmpresa.filter(
      (activo) => Number(activo.tipoId) === Number(tipoFiltro)
    );
    return filtrados;
  }, [activosFiltradosPorEmpresa, tipoFiltro]);

  // Ordenar activos: primero por empresa, luego por tipo, luego por nombre
  const activosOrdenados = useMemo(() => {
    return [...activosFiltradosPorTipo].sort((a, b) => {
      // Primero por empresa
      const empA = getEmpresaNombre(a.empresaId, empresas);
      const empB = getEmpresaNombre(b.empresaId, empresas);
      if (empA !== empB) {
        return empA.localeCompare(empB);
      }
      // Luego por tipo
      const tipoA = a.tipo?.nombre || "";
      const tipoB = b.tipo?.nombre || "";
      if (tipoA !== tipoB) {
        return tipoA.localeCompare(tipoB);
      }
      // Finalmente por nombre
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [activosFiltradosPorTipo, empresas]);

  /**
   * Maneja el cambio de empresa
   * Reset automático de tipo al cambiar empresa
   */
  const handleEmpresaChange = (empresaId) => {
    setEmpresaFiltro(empresaId);
    setTipoFiltro(null); // Reset tipo
  };

  /**
   * Maneja la selección de un activo
   */
  const handleSeleccion = (activo) => {
    if (onChange) {
      onChange(Number(activo.id));
    }
    
    setDialogVisible(false);
    setGlobalFilterValue("");
    // No resetear empresaFiltro para mantener la preselección
    setTipoFiltro(null);
  };

  /**
   * Maneja el cierre del dialog
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    setGlobalFilterValue("");
    // Restaurar empresa preseleccionada al cerrar
    setEmpresaFiltro(empresaIdPreseleccionada);
    setTipoFiltro(null);
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
   * Template para el tipo de activo
   */
  const tipoTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.tipo, fontSize: "0.9rem", fontWeight: "bold" }}>
        {rowData.tipo?.nombre || "Sin tipo"}
      </span>
    );
  };

  /**
   * Template para el activo
   */
  const activoTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.activo, fontWeight: "bold" }}>
        {rowData.nombre}
      </span>
    );
  };

  /**
   * Template para la descripción
   */
  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ fontSize: "0.9rem", color: "#555" }}>
        {rowData.descripcion || "Sin descripción"}
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
      <h4 style={{ margin: 0 }}>Activos</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
          }}
          placeholder="Buscar activo..."
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
      Total: {activosOrdenados.length} activo(s)
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
        Activo {required && <span style={{ color: "red" }}>*</span>}
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
        ) : activoSeleccionado ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ color: COLORES_TEXTO.empresa }}>
              {getEmpresaNombre(activoSeleccionado.empresaId, empresas)}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.tipo }}>
              {activoSeleccionado.tipo?.nombre || "Sin tipo"}
            </span>
            <span style={{ color: COLORES_TEXTO.separador }}> - </span>
            <span style={{ color: COLORES_TEXTO.activo, fontWeight: "bold" }}>
              {activoSeleccionado.nombre || "Sin nombre"}
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

      {/* Dialog con layout de 3 columnas */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "1600px" }}
        header="Seleccionar Activo"
        modal
        onHide={() => {
          handleCloseDialog();
        }}
        maximizable
      >
        {/* Layout de 3 columnas */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "180px 180px 1fr", 
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

          {/* ========== COLUMNA 2: TIPOS DE ACTIVO ========== */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            borderRight: "1px solid #dee2e6"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: "600" }}>
              Tipos de Activo
            </h4>
            {empresaFiltro && tiposUnicos.length > 0 ? (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.35rem",
                overflowY: "auto",
                paddingRight: "0.5rem"
              }}>
                {/* Botón TODOS */}
                <Button
                  type="button"
                  label="TODOS"
                  size="small"
                  onClick={() => setTipoFiltro(null)}
                  style={{
                    backgroundColor: !tipoFiltro ? COLOR_TODAS.bg : "#FFFFFF",
                    color: !tipoFiltro ? COLOR_TODAS.text : COLOR_TODAS.bg,
                    borderColor: COLOR_TODAS.border,
                    fontWeight: "500",
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                  className={!tipoFiltro ? "" : "p-button-outlined"}
                />

                {/* Botones de tipos */}
                {tiposUnicos.map((tipo, index) => {
                  const color = getColorCategoria(index);
                  const isActive = Number(tipoFiltro) === Number(tipo.id);

                  return (
                    <Button
                      key={tipo.id}
                      type="button"
                      label={tipo.nombre}
                      size="small"
                      onClick={() => setTipoFiltro(Number(tipo.id))}
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
                      tooltip={tipo.nombre}
                      tooltipOptions={{ position: 'right' }}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#999", fontSize: "0.85rem", fontStyle: "italic" }}>
                {empresaFiltro ? "No hay tipos disponibles" : "Seleccione una empresa"}
              </div>
            )}
          </div>

          {/* ========== COLUMNA 3: TABLA DE ACTIVOS ========== */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {header}
            
            <DataTable
              ref={dt}
              value={activosOrdenados}
              selectionMode="single"
              onRowSelect={(e) => {
                handleSeleccion(e.data);
              }}
              dataKey="id"
              paginator
              rows={20}
              rowsPerPageOptions={[20, 40, 100]}
              globalFilter={globalFilterValue}
              globalFilterFields={['nombre', 'descripcion']}
              emptyMessage="No se encontraron activos"
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
                style={{ minWidth: "150px" }}
              />
              <Column
                field="tipo.nombre"
                header="Tipo de Activo"
                body={tipoTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="nombre"
                header="Activo"
                body={activoTemplate}
                sortable
                filterField="nombre"
                style={{ minWidth: "250px" }}
              />
              <Column
                field="descripcion"
                header="Descripción"
                body={descripcionTemplate}
                sortable
                filterField="descripcion"
                style={{ minWidth: "300px" }}
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

export default ActivoSelector;