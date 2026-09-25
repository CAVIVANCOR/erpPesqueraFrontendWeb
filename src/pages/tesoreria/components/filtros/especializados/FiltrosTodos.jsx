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
      <div
        style={{
          alignItems: "start",
          display: "flex",
          gap: 10,
          marginBottom: 15,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Rango de Fechas */}
          <RangoFechasField
            onChange={({ fechaDesde, fechaHasta }) => {
              onFiltroChange('fechaDesde', fechaDesde);
              onFiltroChange('fechaHasta', fechaHasta);
            }}
            totalDocumentos={opciones.totalDocumentos}
            label="Rango de Fechas"
          />
        </div>
        <div style={{ flex: 1 }}>
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
        </div>
      </div>

      <div
        style={{
          alignItems: "start",
          display: "flex",
          gap: 10,
          marginBottom: 15,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Tipos de Documento */}
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1 }}>
          <NumeroDocumentoField
            value={filtros.numeroDocumento || ''}
            onChange={(value) => onFiltroChange('numeroDocumento', value)}
            totalDocumentos={opciones.totalDocumentos}
            placeholder="Buscar número..."
          />
        </div>
      </div>
      <div
        style={{
          alignItems: "start",
          display: "flex",
          gap: 10,
          marginBottom: 15,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Monedas */}
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1 }}>
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
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          marginBottom: 15,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
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
      </div>
    </div>
  );
};

export default FiltrosTodos;
