import React from 'react';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import RangoMontosField from '../comunes/RangoMontosField';

/**
 * Filtros especializados para Deudas con Personal (tabla DeudaConPersonal)
 */
const FiltrosDeudaPersonal = ({ filtros, opciones, onFiltroChange }) => {
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
            label="Rango de Fechas de la Deuda"
          />
        </div>
        <div style={{ flex: 1 }}>
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
      <div style={filaStyle}>
        <div style={{ flex: 1 }}>
          <MultiSelectDinamico
            label="Tipos de Deuda"
            value={filtros.tipoDeudaIds || []}
            opciones={opciones.tiposDeuda || []}
            onChange={(value) => onFiltroChange('tipoDeudaIds', value)}
            placeholder="Todos los tipos de deuda"
            filterBy="nombre,descripcion"
            showContadores={true}
            tipo="tipoDeuda"
            icono="🧾"
          />
        </div>
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

export default FiltrosDeudaPersonal;
