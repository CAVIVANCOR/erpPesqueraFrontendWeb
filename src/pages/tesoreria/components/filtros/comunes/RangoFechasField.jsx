import React from 'react';
import { Calendar } from 'primereact/calendar';
import { formatearContador } from '../utils/filtrosFormatters';

/**
 * Componente para seleccionar un rango de fechas
 */
const RangoFechasField = ({
  fechaDesde,
  fechaHasta,
  onChange,
  totalDocumentos = 0,
  label = "Rango de Fechas"
}) => {

  const handleChange = (e) => {
    const value = e.value;

    if (Array.isArray(value) && value.length === 2) {
      onChange({
        fechaDesde: value[0],
        fechaHasta: value[1]
      });
    } else if (value === null) {
      onChange({
        fechaDesde: null,
        fechaHasta: null
      });
    }
  };

  const rangoValue = fechaDesde && fechaHasta ? [fechaDesde, fechaHasta] : null;

  return (
    <div>
      <label htmlFor="rangoFechas">📅 {label}</label>
      <Calendar
        id="rangoFechas"
        value={rangoValue}
        onChange={handleChange}
        selectionMode="range"
        dateFormat="dd/mm/yy"
        placeholder="Seleccionar rango de fechas"
        showIcon
        showButtonBar
        readOnlyInput
        className="w-full"
      />
      {totalDocumentos > 0 && (
        <small className="text-muted">
          {formatearContador(totalDocumentos)} en este rango
        </small>
      )}
    </div>
  );
};

export default RangoFechasField;
