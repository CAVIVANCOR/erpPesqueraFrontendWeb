import React, { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { formatearContador } from '../utils/filtrosFormatters';

/**
 * Componente para seleccionar un rango de fechas
 * Implementa el patrón oficial de PrimeReact para selectionMode="range"
 * Componente no controlado (uncontrolled) con estado interno
 */
const RangoFechasField = ({
  onChange,
  totalDocumentos = 0,
  label = "Rango de Fechas"
}) => {

  // Estado local para el rango (patrón oficial de PrimeReact)
  const [dates, setDates] = useState(null);

  const handleChange = (e) => {
    // Actualizar estado local (patrón oficial)
    setDates(e.value);
    
    // Notificar al padre con el formato esperado
    if (e.value && e.value[0] && e.value[1]) {
      // Rango completo seleccionado
      onChange({
        fechaDesde: e.value[0],
        fechaHasta: e.value[1]
      });
    } else if (e.value === null) {
      // Rango limpiado
      onChange({
        fechaDesde: null,
        fechaHasta: null
      });
    }
  };

  return (
    <div className="field">
      <label htmlFor="rangoFechas">📅 {label}</label>
      <Calendar
        id="rangoFechas"
        value={dates}
        onChange={handleChange}
        selectionMode="range"
        dateFormat="dd/mm/yy"
        placeholder="Seleccionar rango de fechas"
        showIcon
        showButtonBar
        readOnlyInput
        hideOnRangeSelection
        className="w-full"
      />
      {totalDocumentos > 0 && (
        <small className="text-muted block mt-1">
          {formatearContador(totalDocumentos)} en este rango
        </small>
      )}
    </div>
  );
};

export default RangoFechasField;
