import React from 'react';
import FiltrosTodos from './especializados/FiltrosTodos';
import FiltrosCxC from './especializados/FiltrosCxC';
import FiltrosCxP from './especializados/FiltrosCxP';
import FiltrosAsignaciones from './especializados/FiltrosAsignaciones';
import FiltrosGastosDirectos from './especializados/FiltrosGastosDirectos';
import FiltrosDeudaPersonal from './especializados/FiltrosDeudaPersonal';
import FiltrosDeudaTributaria from './especializados/FiltrosDeudaTributaria';
import FiltrosPrestamo from './especializados/FiltrosPrestamo';
import ResumenFiltrosActivos from './comunes/ResumenFiltrosActivos';
import { TIPO_FILTRO_TESORERIA, TIPO_DEUDA_TESORERIA } from '../../../../utils/tesoreria.constants';

/**
 * Controlador que bifurca a componentes especializados según el tipo de filtro
 */
const FiltrosController = ({ 
  tipo, 
  tipoDeuda,
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

    // tipoDeuda tiene prioridad sobre tipo (son mutuamente excluyentes)
    if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_PERSONAL) {
      return <FiltrosDeudaPersonal {...props} />;
    }
    if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_TRIBUTARIAS) {
      return <FiltrosDeudaTributaria {...props} />;
    }
    // Préstamos: el "vencimiento" del desembolso es su fecha prevista de desembolso
    if (tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_CUOTAS) {
      return <FiltrosPrestamo {...props} />;
    }
    if (tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_DESEMBOLSOS) {
      return <FiltrosPrestamo {...props} etiquetaFecha="Rango de Fechas de Desembolso" />;
    }

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
    onFiltroChange('tipoDeudaIds', []);
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
