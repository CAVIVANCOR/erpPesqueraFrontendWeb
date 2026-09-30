import React from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Chip } from 'primereact/chip';
import { generarResumenFiltros, contarFiltrosActivos } from './filtros/utils/filtrosHelpers';
import { formatearResumenChip } from './filtros/utils/filtrosFormatters';

/**
 * Botón compacto que muestra resumen de filtros activos
 */
const BotonFiltrosAvanzados = ({ filtros, opciones, onOpenDialog }) => {
  
  const resumen = generarResumenFiltros(filtros, opciones);
  const totalFiltros = contarFiltrosActivos(filtros);

  // Mostrar solo los primeros 3 filtros en el botón
  const filtrosVisibles = resumen.slice(0, 3);
  const filtrosOcultos = resumen.length - filtrosVisibles.length;

  if (totalFiltros === 0) {
    // Sin filtros activos
    return (
      <Button
        icon="pi pi-filter"
        onClick={onOpenDialog}
        className="p-button-outlined w-full"
        style={{ 
          minHeight: '85px',
          justifyContent: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong style={{ fontSize: '0.85rem' }}>🔍 Filtros Avanzados</strong>
          <Badge value="0" severity="secondary" />
        </div>
        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
          Sin filtros aplicados - Haz clic para filtrar
        </small>
      </Button>
    );
  }

  // Con filtros activos
  return (
    <div 
      className="p-2 surface-100 border-round cursor-pointer hover:surface-200 transition-colors transition-duration-150"
      onClick={onOpenDialog}
      style={{ 
        border: '2px solid var(--primary-color)',
        minHeight: '85px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex align-items-center justify-content-between mb-1">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-filter text-primary" style={{ fontSize: '0.9rem' }}></i>
          <strong className="text-primary" style={{ fontSize: '0.85rem' }}>Filtros Avanzados</strong>
          <Badge value={totalFiltros} severity="info" />
        </div>
        <i className="pi pi-angle-down text-primary" style={{ fontSize: '0.8rem' }}></i>
      </div>

      {/* Chips de filtros visibles */}
      <div className="flex flex-wrap gap-1 mb-1">
        {filtrosVisibles.map((filtro, index) => (
          <Chip
            key={index}
            label={formatearResumenChip(filtro)}
            style={{ 
              backgroundColor: 'var(--primary-100)', 
              color: 'var(--primary-700)',
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              height: 'auto',
            }}
          />
        ))}
        {filtrosOcultos > 0 && (
          <Chip
            label={`+${filtrosOcultos} más...`}
            style={{ 
              backgroundColor: 'var(--surface-300)',
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              height: 'auto',
            }}
          />
        )}
      </div>

      <small className="text-muted" style={{ fontSize: '0.65rem' }}>
        Haz clic para modificar filtros
      </small>
    </div>
  );
};

export default BotonFiltrosAvanzados;
