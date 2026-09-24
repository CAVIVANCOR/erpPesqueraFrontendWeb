import React from 'react';
import { Chip } from 'primereact/chip';
import { Button } from 'primereact/button';
import { generarResumenFiltros } from '../utils/filtrosHelpers';
import { formatearResumenChip, formatearMonto } from '../utils/filtrosFormatters';
import { useFiltrosPreview } from '../../../hooks/useFiltrosPreview';

/**
 * Componente que muestra resumen de filtros activos y vista previa de resultados
 */
const ResumenFiltrosActivos = ({ 
  filtros, 
  opciones, 
  onRemoveFiltro, 
  onLimpiarTodos,
  documentos = []
}) => {
  
  const resumen = generarResumenFiltros(filtros, opciones);
  const preview = useFiltrosPreview(filtros, documentos);

  const handleRemove = (filtro) => {
    if (filtro.campo === 'fechas') {
      onRemoveFiltro('fechaDesde', null);
      onRemoveFiltro('fechaHasta', null);
    } else if (filtro.campo === 'montos') {
      onRemoveFiltro('montoDesde', null);
      onRemoveFiltro('montoHasta', null);
    } else if (filtro.campo === 'numeroDocumento') {
      onRemoveFiltro('numeroDocumento', '');
    } else {
      // Para arrays, remover el ID específico
      const valorActual = filtros[filtro.campo] || [];
      const nuevoValor = valorActual.filter(id => {
        // Buscar el ID del item que coincide con la descripción
        const opcionesArray = opciones[filtro.tipo + 's'] || opciones[filtro.tipo] || [];
        const item = opcionesArray.find(opt => 
          (opt.razonSocial === filtro.descripcion || 
           opt.nombre === filtro.descripcion ||
           opt.descripcion === filtro.descripcion ||
           opt.codigo === filtro.descripcion ||
           opt.nombreCompleto === filtro.descripcion)
        );
        return item ? id !== item.id : true;
      });
      onRemoveFiltro(filtro.campo, nuevoValor);
    }
  };

  if (resumen.length === 0) {
    return (
      <div className="field">
        <div className="p-3 surface-100 border-round text-center">
          <p className="text-muted m-0">
            Ningún filtro seleccionado - Mostrando todos los documentos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="field">
      <div className="p-3 surface-100 border-round">
        <div className="flex align-items-center justify-content-between mb-3">
          <strong>🏷️ Filtros Seleccionados ({resumen.length})</strong>
          <Button
            label="Limpiar todos"
            icon="pi pi-times"
            className="p-button-text p-button-sm p-button-danger"
            onClick={onLimpiarTodos}
          />
        </div>
        
        {/* Chips de filtros */}
        <div className="flex flex-wrap gap-2 mb-3">
          {resumen.map((filtro, index) => (
            <Chip
              key={index}
              label={formatearResumenChip(filtro)}
              removable
              onRemove={() => handleRemove(filtro)}
            />
          ))}
        </div>

        {/* Vista previa de resultados */}
        {preview.totalDocumentos >= 0 && (
          <div className="p-3 surface-200 border-round">
            <strong className="block mb-2">📊 Vista Previa de Resultados</strong>
            <div className="grid">
              <div className="col-12 md:col-6">
                <p className="m-0 mb-2">
                  <i className="pi pi-file mr-2"></i>
                  <strong>{preview.totalDocumentos}</strong> documento{preview.totalDocumentos !== 1 ? 's' : ''}
                  {documentos.length > 0 && (
                    <span className="text-muted ml-2">
                      ({preview.porcentaje}% del total)
                    </span>
                  )}
                </p>
              </div>
              <div className="col-12 md:col-6">
                <p className="m-0 mb-2">
                  <i className="pi pi-money-bill mr-2"></i>
                  {preview.totalSoles > 0 && (
                    <span className="mr-3">
                      <strong>S/. {formatearMonto(preview.totalSoles)}</strong>
                    </span>
                  )}
                  {preview.totalDolares > 0 && (
                    <span>
                      <strong>US$ {formatearMonto(preview.totalDolares)}</strong>
                    </span>
                  )}
                  {preview.totalSoles === 0 && preview.totalDolares === 0 && (
                    <span className="text-muted">S/. 0.00</span>
                  )}
                </p>
              </div>
            </div>

            {/* Distribución por estado */}
            {Object.keys(preview.distribucionEstados).length > 0 && (
              <div className="mt-2">
                <small className="text-muted block mb-1">Distribución por estado:</small>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.distribucionEstados).map(([estado, data]) => (
                    <small key={estado} className="text-muted">
                      • {estado}: {data.cantidad} doc{data.cantidad !== 1 ? 's' : ''}
                    </small>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumenFiltrosActivos;
