// src/components/common/productoSelectorConStock/components/ProductoSelectorCarouselFilters.jsx
import React from "react";
import { SplitButton } from "primereact/splitbutton";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

/**
 * Panel de filtros compacto con SplitButton para el selector de productos
 * 100% nativo PrimeReact sin CSS externo
 */
export const ProductoSelectorCarouselFilters = ({
  filtros,
  opcionesDinamicas,
  onFiltroChange,
  onLimpiar,
  familiaProductoId,
  filtroFamiliaInicial,
}) => {
  const familiaFija = familiaProductoId !== null;
  
  // Opciones con "TODAS/TODOS"
  const opcionesFamilias = [
    { id: null, nombre: "TODAS" },
    ...opcionesDinamicas.familias,
  ];
  
  const opcionesSubfamilias = [
    { id: null, nombre: "TODAS" },
    ...opcionesDinamicas.subfamilias,
  ];
  
  const opcionesMarcas = [
    { id: null, nombre: "TODAS" },
    ...opcionesDinamicas.marcas,
  ];
  
  const opcionesProcedencias = [
    { id: null, gentilicio: "TODAS" },
    ...opcionesDinamicas.procedencias,
  ];
  
  const opcionesAlmacenes = [
    { id: null, descripcion: "TODOS" },
    ...opcionesDinamicas.almacenes,
  ];

  // Labels seleccionados
  const getFamiliaLabel = () => {
    if (!filtros.familiaId) return "TODAS";
    const familia = opcionesFamilias.find(f => f.id === filtros.familiaId);
    return familia?.nombre || "TODAS";
  };

  const getSubfamiliaLabel = () => {
    if (!filtros.subfamiliaId) return "TODAS";
    const subfamilia = opcionesSubfamilias.find(s => s.id === filtros.subfamiliaId);
    return subfamilia?.nombre || "TODAS";
  };

  const getMarcaLabel = () => {
    if (!filtros.marcaId) return "TODAS";
    const marca = opcionesMarcas.find(m => m.id === filtros.marcaId);
    return marca?.nombre || "TODAS";
  };

  const getProcedenciaLabel = () => {
    if (!filtros.procedenciaId) return "TODAS";
    const procedencia = opcionesProcedencias.find(p => p.id === filtros.procedenciaId);
    return procedencia?.gentilicio || "TODAS";
  };

  const getAlmacenLabel = () => {
    if (!filtros.almacenId) return "TODOS";
    const almacen = opcionesAlmacenes.find(a => a.id === filtros.almacenId);
    return almacen?.descripcion || "TODOS";
  };

  // Modelos para SplitButton
  const familiaItems = opcionesFamilias.map(f => ({
    label: f.nombre,
    command: () => onFiltroChange("familiaId", f.id)
  }));

  const subfamiliaItems = opcionesSubfamilias.map(s => ({
    label: s.nombre,
    command: () => onFiltroChange("subfamiliaId", s.id)
  }));

  const marcaItems = opcionesMarcas.map(m => ({
    label: m.nombre,
    command: () => onFiltroChange("marcaId", m.id)
  }));

  const procedenciaItems = opcionesProcedencias.map(p => ({
    label: p.gentilicio,
    command: () => onFiltroChange("procedenciaId", p.id)
  }));

  const almacenItems = opcionesAlmacenes.map(a => ({
    label: a.descripcion,
    command: () => onFiltroChange("almacenId", a.id)
  }));

  // Estilos inline
  const containerStyle = {
    padding: '12px 16px',
    background: '#FFFFFF'
  };

  const filaCompactaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  };

  const labelStyle = {
    fontWeight: 600,
    fontSize: '11px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'right',
    minWidth: '90px'
  };

  const separadorStyle = {
    height: '1px',
    background: '#E5E7EB',
    margin: '12px 0'
  };

  const busquedaStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  };

  const inputStyle = {
    flex: 1,
    textTransform: 'uppercase',
    fontSize: '12px'
  };

  return (
    <div style={containerStyle}>
      {/* Fila única con todos los filtros */}
      <div style={filaCompactaStyle}>
        <span style={labelStyle}>FAMILIAS:</span>
        <SplitButton
          label={getFamiliaLabel()}
          model={familiaItems}
          size="small"
          severity="info"
          disabled={familiaFija}
          raised
        />

        <span style={labelStyle}>SUBFAMILIAS:</span>
        <SplitButton
          label={getSubfamiliaLabel()}
          model={subfamiliaItems}
          size="small"
          severity="warning"
          raised
        />

        <span style={labelStyle}>MARCAS:</span>
        <SplitButton
          label={getMarcaLabel()}
          model={marcaItems}
          size="small"
          severity="help"
          raised
        />

        <span style={labelStyle}>PROCEDENCIAS:</span>
        <SplitButton
          label={getProcedenciaLabel()}
          model={procedenciaItems}
          size="small"
          severity="warning"
          raised
        />

        <span style={labelStyle}>ALMACENES:</span>
        <SplitButton
          label={getAlmacenLabel()}
          model={almacenItems}
          size="small"
          severity="danger"
          raised 
        />
      </div>

      {/* Separador */}
      <div style={separadorStyle}></div>

      {/* Búsqueda y Limpiar */}
      <div style={busquedaStyle}>
        <InputText
          value={filtros.busqueda}
          onChange={(e) => onFiltroChange("busqueda", e.target.value.toUpperCase())}
          placeholder="🔍 Buscar producto..."
          style={inputStyle}
        />
        <Button
          label="🧹 Limpiar Filtros"
          severity="secondary"
          outlined
          onClick={onLimpiar}
          size="small"
        />
      </div>
    </div>
  );
};