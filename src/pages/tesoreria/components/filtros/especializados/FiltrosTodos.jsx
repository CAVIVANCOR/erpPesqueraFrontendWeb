import React from 'react';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import NumeroDocumentoField from '../comunes/NumeroDocumentoField';
import RangoMontosField from '../comunes/RangoMontosField';

/**
 * Filtros genéricos para todos los tipos de documentos
 */
const FiltrosTodos = ({ filtros, opciones, onFiltroChange }) => {
  
  return (
    <div className="p-fluid">
      
      {/* Rango de Fechas */}
      <RangoFechasField
        fechaDesde={filtros.fechaDesde}
        fechaHasta={filtros.fechaHasta}
        onChange={({ fechaDesde, fechaHasta }) => {
          onFiltroChange('fechaDesde', fechaDesde);
          onFiltroChange('fechaHasta', fechaHasta);
        }}
        totalDocumentos={opciones.totalDocumentos}
        label="Rango de Fechas"
      />

      {/* Entidades Comerciales (Clientes + Proveedores) */}
      <MultiSelectDinamico
        label="Entidades Comerciales"
        value={filtros.entidadComercialIds || []}
        opciones={opciones.entidadesComerciales || []}
        onChange={(value) => onFiltroChange('entidadComercialIds', value)}
        placeholder="Seleccionar entidades..."
        filterBy="razonSocial,numeroDocumento,nombre"
        showContadores={true}
        tipo="entidad"
        icono="🏢"
      />

      <div className="formgrid grid">
        
        {/* Tipos de Documento */}
        <div className="field col-12 md:col-6">
          <MultiSelectDinamico
            label="Tipos de Documento"
            value={filtros.tipoDocumentoIds || []}
            opciones={opciones.tiposDocumento || []}
            onChange={(value) => onFiltroChange('tipoDocumentoIds', value)}
            placeholder="Seleccionar tipos..."
            filterBy="descripcion,codigo"
            showContadores={true}
            tipo="tipoDoc"
            icono="📄"
          />
        </div>

        {/* Número de Documento */}
        <div className="field col-12 md:col-6">
          <NumeroDocumentoField
            value={filtros.numeroDocumento || ''}
            onChange={(value) => onFiltroChange('numeroDocumento', value)}
            totalDocumentos={opciones.totalDocumentos}
            placeholder="Buscar número..."
          />
        </div>
      </div>

      <div className="formgrid grid">
        
        {/* Monedas */}
        <div className="field col-12 md:col-6">
          <MultiSelectDinamico
            label="Monedas"
            value={filtros.monedaIds || []}
            opciones={opciones.monedas || []}
            onChange={(value) => onFiltroChange('monedaIds', value)}
            placeholder="Todas las monedas"
            filterBy="descripcion,simbolo"
            showContadores={true}
            tipo="moneda"
            icono="💰"
          />
        </div>

        {/* Estados */}
        <div className="field col-12 md:col-6">
          <MultiSelectDinamico
            label="Estados"
            value={filtros.estadoIds || []}
            opciones={opciones.estados || []}
            onChange={(value) => onFiltroChange('estadoIds', value)}
            placeholder="Todos los estados"
            filterBy="descripcion"
            showContadores={true}
            tipo="estado"
            icono="📊"
          />
        </div>
      </div>

      {/* Rango de Montos */}
      <RangoMontosField
        montoDesde={filtros.montoDesde}
        montoHasta={filtros.montoHasta}
        onChange={({ montoDesde, montoHasta }) => {
          onFiltroChange('montoDesde', montoDesde);
          onFiltroChange('montoHasta', montoHasta);
        }}
        rangoDatos={opciones.rangoMontos}
        moneda="S/."
      />

    </div>
  );
};

export default FiltrosTodos;
