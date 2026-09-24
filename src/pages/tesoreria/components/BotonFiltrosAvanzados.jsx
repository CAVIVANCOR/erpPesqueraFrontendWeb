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
      <div className="mb-3">
        <Button
          label="🔍 Filtros Avanzados"
          icon="pi pi-filter"
          onClick={onOpenDialog}
          className="p-button-outlined w-full"
          style={{ justifyContent: 'flex-start' }}
        >
          <span className="ml-2 text-muted">(Sin filtros aplicados - Haz clic para filtrar)</span>
        </Button>
      </div>
    );
  }

  // Con filtros activos
  return (
    <div className="p-fluid">
      <div 
        className="p-3 surface-100 border-round cursor-pointer hover:surface-200 transition-colors transition-duration-150"
        onClick={onOpenDialog}
        style={{ border: '2px solid var(--primary-color)' }}
      >
        <div className="flex align-items-center justify-content-between mb-2">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-filter text-primary"></i>
            <strong className="text-primary">Filtros Avanzados</strong>
            <Badge value={totalFiltros} severity="info" />
          </div>
          <i className="pi pi-angle-down text-primary"></i>
        </div>

        {/* Chips de filtros visibles */}
        <div className="flex flex-wrap gap-2 mb-2">
          {filtrosVisibles.map((filtro, index) => (
            <Chip
              key={index}
              label={formatearResumenChip(filtro)}
              className="p-chip-sm"
              style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
            />
          ))}
          {filtrosOcultos > 0 && (
            <Chip
              label={`+${filtrosOcultos} más...`}
              className="p-chip-sm"
              style={{ backgroundColor: 'var(--surface-300)' }}
            />
          )}
        </div>

        <small className="text-muted">
          Haz clic para modificar filtros
        </small>
      </div>
    </div>
  );
};

export default BotonFiltrosAvanzados;
