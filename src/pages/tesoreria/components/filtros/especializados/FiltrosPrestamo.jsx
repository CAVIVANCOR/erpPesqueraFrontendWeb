import React from 'react';
import RangoFechasField from '../comunes/RangoFechasField';
import RangoMontosField from '../comunes/RangoMontosField';

/**
 * Filtros especializados para las secciones de Préstamos (cuotas pendientes y desembolsos
 * pendientes). Solo rango de fechas y de montos: la empresa, la moneda y el vencimiento se
 * filtran desde la cabecera, y el préstamo y la cuota no tienen tipos de deuda ni estados
 * de catálogo como las deudas.
 */
const FiltrosPrestamo = ({ filtros, opciones, onFiltroChange, etiquetaFecha = 'Rango de Fechas de Vencimiento' }) => {
  const filaStyle = {
    alignItems: "start",
    display: "flex",
    gap: 10,
    marginBottom: 15,
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  return (
    <div className="p-fluid">
      <div style={filaStyle}>
        <div style={{ flex: 1 }}>
          <RangoFechasField
            onChange={({ fechaDesde, fechaHasta }) => {
              onFiltroChange('fechaDesde', fechaDesde);
              onFiltroChange('fechaHasta', fechaHasta);
            }}
            totalDocumentos={opciones.totalDocumentos}
            label={etiquetaFecha}
          />
        </div>
      </div>
      <div style={{ ...filaStyle, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
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

export default FiltrosPrestamo;
