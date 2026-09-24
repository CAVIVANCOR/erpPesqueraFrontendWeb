import React from 'react';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import RangoMontosField from '../comunes/RangoMontosField';

/**
 * Filtros especializados para Asignaciones de Fondos
 */
const FiltrosAsignaciones = ({ filtros, opciones, onFiltroChange }) => {
  
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
        label="Rango de Fechas de Asignación"
      />

      {/* Personal */}
      <MultiSelectDinamico
        label="Personal"
        value={filtros.personalIds || []}
        opciones={opciones.personal || []}
        onChange={(value) => onFiltroChange('personalIds', value)}
        placeholder="Seleccionar personal..."
        filterBy="nombreCompleto,nombre"
        showContadores={true}
        tipo="personal"
        icono="👤"
      />

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

export default FiltrosAsignaciones;
