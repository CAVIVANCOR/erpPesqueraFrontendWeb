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
            label="Rango de Fechas de Asignación"
          />
        </div>
        <div style={{ flex: 1 }}>
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
    </div >
  );
};

export default FiltrosAsignaciones;
