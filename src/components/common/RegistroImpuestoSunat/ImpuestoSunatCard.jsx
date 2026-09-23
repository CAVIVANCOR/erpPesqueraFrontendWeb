// src/components/common/RegistroImpuestoSunat/ImpuestoSunatCard.jsx
import React from 'react';
import { getColorConfig, getFieldConfig, formatearNumero, formatearFecha } from './impuestoSunatUtils';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: TARJETA VISUAL DE IMPUESTO SUNAT
 * ════════════════════════════════════════════════════════════
 * Tarjeta clickeable que muestra información resumida de un impuesto
 * (Detracción, Retención o Percepción)
 * 
 * @param {object} registro - Objeto del registro de impuesto
 * @param {string} tipo - 'DETRACCION' | 'RETENCION' | 'PERCEPCION'
 * @param {array} monedas - Array de monedas
 * @param {function} onClick - Callback al hacer click
 */
export default function ImpuestoSunatCard({ registro, tipo, monedas = [], onClick }) {
  if (!registro || !tipo) return null;

  const colors = getColorConfig(tipo);
  const fields = getFieldConfig(tipo, registro);

  if (!fields) return null;

  // Obtener símbolo de moneda
  const moneda = monedas?.find(m => Number(m.id) === Number(registro.monedaId));
  const simboloMoneda = moneda?.simbolo || 'S/.';

  /**
   * Renderiza una celda de la tarjeta
   */
  const renderCell = (field, colorConfig, flex = 1) => {
    return (
      <div
        style={{
          flex: flex,
          backgroundColor: colorConfig.bg,
          color: '#000',
          padding: '0.5rem',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          border: `1px solid ${colorConfig.border}`,
          minWidth: 0 // Permite que el texto se trunque
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 'normal',
            color: '#555',
            marginBottom: '0.25rem'
          }}
        >
          {field.label}
        </div>
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: field === fields.tipo ? 'normal' : 'nowrap',
            lineHeight: field === fields.tipo ? '1.2' : 'normal',
            minHeight: field === fields.tipo ? '2.4em' : 'auto'
          }}
          title={field.value?.toString()}
        >
          {field.value}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#fff',
        flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
    >
      {/* Tipo de Impuesto */}
      {renderCell(
        { label: fields.tipo.label, value: fields.tipo.value },
        colors.tipo,
        window.innerWidth < 768 ? 1 : 1.5
      )}

      {/* Tasa */}
      {renderCell(
        { label: fields.tasa.label, value: `${fields.tasa.value}%` },
        colors.tasa,
        window.innerWidth < 768 ? 0.5 : 0.5
      )}

      {/* Fecha */}
      {renderCell(
        { label: fields.fecha.label, value: formatearFecha(fields.fecha.value) },
        colors.fecha,
        window.innerWidth < 768 ? 0.8 : 0.6
      )}

      {/* Total */}
      {renderCell(
        { label: fields.total.label, value: `${simboloMoneda} ${formatearNumero(fields.total.value)}` },
        colors.total,
        window.innerWidth < 768 ? 0.8 : 0.7
      )}

      {/* Requerido/Retenido/Percibido */}
      {renderCell(
        { label: fields.requerido.label, value: `${simboloMoneda} ${formatearNumero(fields.requerido.value)}` },
        colors.requerido,
        window.innerWidth < 768 ? 0.8 : 0.7
      )}

      {/* Pagado */}
      {renderCell(
        { label: fields.pagado.label, value: `${simboloMoneda} ${formatearNumero(fields.pagado.value)}` },
        colors.pagado,
        window.innerWidth < 768 ? 0.8 : 0.7
      )}

      {/* Saldo */}
      {renderCell(
        { label: fields.saldo.label, value: `${simboloMoneda} ${formatearNumero(fields.saldo.value)}` },
        colors.saldo,
        window.innerWidth < 768 ? 0.8 : 0.7
      )}
    </div>
  );
}
