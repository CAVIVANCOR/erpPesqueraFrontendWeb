import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import RangoFechasField from '../comunes/RangoFechasField';
import MultiSelectDinamico from '../comunes/MultiSelectDinamico';
import NumeroDocumentoField from '../comunes/NumeroDocumentoField';
import RangoMontosField from '../comunes/RangoMontosField';
import { TIPO_VENCIMIENTO_TESORERIA } from '../../../../../utils/tesoreria.constants';

/**
 * Filtros especializados para Cuentas por Cobrar
 */
const FiltrosCxC = ({ filtros, opciones, onFiltroChange }) => {
  
  const opcionesVencimiento = [
    { label: 'Todos', value: TIPO_VENCIMIENTO_TESORERIA.TODOS },
    { label: 'Vence Hoy', value: TIPO_VENCIMIENTO_TESORERIA.HOY },
    { label: 'Vence Esta Semana', value: TIPO_VENCIMIENTO_TESORERIA.SEMANA },
    { label: 'Vencidos', value: TIPO_VENCIMIENTO_TESORERIA.VENCIDOS }
  ];

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
        label="Rango de Fechas de Emisión"
      />

      {/* Clientes */}
      <MultiSelectDinamico
        label="Clientes"
        value={filtros.clienteIds || []}
        opciones={opciones.clientes || []}
        onChange={(value) => onFiltroChange('clienteIds', value)}
        placeholder="Seleccionar clientes..."
        filterBy="razonSocial,numeroDocumento,nombre"
        showContadores={true}
        tipo="cliente"
        icono="👤"
      />

      <div className="formgrid grid">
        
        {/* Tipos de Documento */}
        <div className="field col-12 md:col-6">
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
        <div className="field col-12 md:col-6">
          <NumeroDocumentoField
            value={filtros.numeroDocumento || ''}
            onChange={(value) => onFiltroChange('numeroDocumento', value)}
            totalDocumentos={opciones.totalDocumentos}
            placeholder="E001-2258"
          />
        </div>
      </div>

      <div className="formgrid grid">
        
        {/* Monedas */}
        <div className="field col-12 md:col-4">
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
        <div className="field col-12 md:col-4">
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

        {/* Vencimiento */}
        <div className="field col-12 md:col-4">
          <label htmlFor="vencimiento">⏰ Vencimiento</label>
          <Dropdown
            id="vencimiento"
            value={filtros.vencimiento}
            options={opcionesVencimiento}
            onChange={(e) => onFiltroChange('vencimiento', e.value)}
            placeholder="Todos"
            className="w-full"
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

export default FiltrosCxC;
