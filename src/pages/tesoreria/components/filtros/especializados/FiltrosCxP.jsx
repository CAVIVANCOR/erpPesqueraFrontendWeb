import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import NumeroDocumentoField from '../comunes/NumeroDocumentoField';
import RangoMontosField from '../comunes/RangoMontosField';
import { TIPO_VENCIMIENTO_TESORERIA } from '../../../../../utils/tesoreria.constants';

/**
 * Filtros especializados para Cuentas por Pagar
 */
const FiltrosCxP = ({ filtros, opciones, onFiltroChange }) => {

  const opcionesVencimiento = [
    { label: 'Todos', value: TIPO_VENCIMIENTO_TESORERIA.TODOS },
    { label: 'Vence Hoy', value: TIPO_VENCIMIENTO_TESORERIA.HOY },
    { label: 'Vence Esta Semana', value: TIPO_VENCIMIENTO_TESORERIA.SEMANA },
    { label: 'Vencidos', value: TIPO_VENCIMIENTO_TESORERIA.VENCIDOS }
  ];

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
        {/* Rango de Fechas */}
        <div style={{ flex: 1 }}>
          <RangoFechasField
            fechaDesde={filtros.fechaDesde}
            fechaHasta={filtros.fechaHasta}
            onChange={({ fechaDesde, fechaHasta }) => {
              onFiltroChange('fechaDesde', fechaDesde);
              onFiltroChange('fechaHasta', fechaHasta);
            }}
            totalDocumentos={opciones.totalDocumentos}
            label="Rango de Fechas de Emisión"
          />
        </div>
        {/* Proveedores */}
        <div style={{ flex: 1 }}>
          <MultiSelectDinamico
            label="Proveedores"
            value={filtros.proveedorIds || []}
            opciones={opciones.proveedores || []}
            onChange={(value) => onFiltroChange('proveedorIds', value)}
            placeholder="Seleccionar proveedores..."
            filterBy="razonSocial,numeroDocumento,nombre"
            showContadores={true}
            tipo="proveedor"
            icono="🏭"
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
        {/* Número de Documento */}
        <div style={{ flex: 1 }}>
          <NumeroDocumentoField
            value={filtros.numeroDocumento || ''}
            onChange={(value) => onFiltroChange('numeroDocumento', value)}
            totalDocumentos={opciones.totalDocumentos}
            placeholder="F001-1234"
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
        {/* Vencimiento */}
        <div style={{ flex: 1 }}>
          <label htmlFor="vencimiento">⏰ Vencimiento</label>
          <Dropdown
            id="vencimiento"
            value={filtros.vencimiento}
            options={opcionesVencimiento}
            onChange={(e) => onFiltroChange('vencimiento', e.value)}
            placeholder="Todos"
          />
        </div>
        {/* Rango de Montos */}
        <div style={{ flex: 2 }}>
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

export default FiltrosCxP;
