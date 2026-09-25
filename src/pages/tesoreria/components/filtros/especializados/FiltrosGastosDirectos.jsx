import React from 'react';
import { InputText } from 'primereact/inputtext';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import RangoMontosField from '../comunes/RangoMontosField';

/**
 * Filtros especializados para Gastos Directos
 */
const FiltrosGastosDirectos = ({ filtros, opciones, onFiltroChange }) => {

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
        {/* Concepto */}
        <div style={{ flex: 2 }}>
          <label htmlFor="concepto">📝 Concepto</label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-search"></i>
            </span>
            <InputText
              id="concepto"
              value={filtros.numeroDocumento || ''}
              onChange={(e) => onFiltroChange('numeroDocumento', e.target.value)}
              placeholder="Buscar por concepto..."
              className="w-full"
            />
          </div>
          <small className="text-muted">
            Búsqueda parcial en conceptos de gastos
          </small>
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
        <div style={{ flex: 2 }}>
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

export default FiltrosGastosDirectos;
