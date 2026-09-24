import React from 'react';
import FiltrosTodos from './especializados/FiltrosTodos';
import FiltrosCxC from './especializados/FiltrosCxC';
import FiltrosCxP from './especializados/FiltrosCxP';
import FiltrosAsignaciones from './especializados/FiltrosAsignaciones';
import FiltrosGastosDirectos from './especializados/FiltrosGastosDirectos';
import ResumenFiltrosActivos from './comunes/ResumenFiltrosActivos';
import { TIPO_FILTRO_TESORERIA } from '../../../../utils/tesoreria.constants';

/**
 * Controlador que bifurca a componentes especializados según el tipo de filtro
 */
const FiltrosController = ({ 
  tipo, 
  filtros, 
  opciones, 
  onFiltroChange,
  documentos = []
}) => {
  
  // Renderizar componente especializado según tipo
  const renderFiltrosEspecializados = () => {
    const props = {
      filtros,
      opciones,
      onFiltroChange
    };

    switch (tipo) {
      case TIPO_FILTRO_TESORERIA.TODOS:
        return <FiltrosTodos {...props} />;
      
      case TIPO_FILTRO_TESORERIA.COBRAR:
        return <FiltrosCxC {...props} />;
      
      case TIPO_FILTRO_TESORERIA.PAGAR:
        return <FiltrosCxP {...props} />;
      
      case TIPO_FILTRO_TESORERIA.ASIGNACIONES:
        return <FiltrosAsignaciones {...props} />;
      
      case TIPO_FILTRO_TESORERIA.GASTOS_DIRECTOS:
        return <FiltrosGastosDirectos {...props} />;
      
      default:
        return <FiltrosTodos {...props} />;
    }
  };

  const handleLimpiarTodos = () => {
    // Limpiar todos los filtros dinámicos
    onFiltroChange('fechaDesde', null);
    onFiltroChange('fechaHasta', null);
    onFiltroChange('clienteIds', []);
    onFiltroChange('proveedorIds', []);
    onFiltroChange('entidadComercialIds', []);
    onFiltroChange('tipoDocumentoIds', []);
    onFiltroChange('numeroDocumento', '');
    onFiltroChange('monedaIds', []);
    onFiltroChange('estadoIds', []);
    onFiltroChange('personalIds', []);
    onFiltroChange('montoDesde', null);
    onFiltroChange('montoHasta', null);
  };

  return (
    <div className="filtros-controller">
      {/* Componente especializado */}
      {renderFiltrosEspecializados()}

      {/* Resumen de filtros activos y vista previa */}
      <ResumenFiltrosActivos
        filtros={filtros}
        opciones={opciones}
        onRemoveFiltro={onFiltroChange}
        onLimpiarTodos={handleLimpiarTodos}
        documentos={documentos}
      />
    </div>
  );
};

export default FiltrosController;
