import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { formatearMonto } from '../utils/filtrosFormatters';

/**
 * Componente para seleccionar rango de montos
 */
const RangoMontosField = ({
  montoDesde,
  montoHasta,
  onChange,
  rangoDatos = { min: 0, max: 0 },
  moneda = "S/."
}) => {

  const handleDesdeChange = (e) => {
    onChange({
      montoDesde: e.value,
      montoHasta
    });
  };

  const handleHastaChange = (e) => {
    onChange({
      montoDesde,
      montoHasta: e.value
    });
  };

  return (
    <>
      <label>🔢 Rango de Montos</label>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="montoDesde" className="text-sm">Desde</label>
          <InputNumber
            id="montoDesde"
            value={montoDesde}
            onValueChange={handleDesdeChange}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoHasta" className="text-sm">Hasta</label>
          <InputNumber
            id="montoHasta"
            value={montoHasta}
            onValueChange={handleHastaChange}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
      </div>
      {rangoDatos.min > 0 || rangoDatos.max > 0 ? (
        <small className="text-muted">
          ℹ️ Rango real: {moneda} {formatearMonto(rangoDatos.min)} - {moneda} {formatearMonto(rangoDatos.max)}
        </small>
      ) : null}
    </>
  );
};

export default RangoMontosField;
