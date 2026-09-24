import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import FiltrosController from './FiltrosController';
import { contarFiltrosActivos, validarFiltros } from './utils/filtrosHelpers';
import { TIPO_FILTRO_TESORERIA } from '../../../../utils/tesoreria.constants';

/**
 * Diálogo modal para filtros avanzados
 */
const FiltrosDialog = ({ 
  visible, 
  tipo, 
  filtros, 
  opciones, 
  onHide, 
  onAplicarFiltros,
  documentos = []
}) => {
  
  // Estado local temporal para edición de filtros
  const [filtrosTemp, setFiltrosTemp] = useState(filtros);

  // Sincronizar filtros temporales cuando se abre el diálogo
  useEffect(() => {
    if (visible) {
      setFiltrosTemp({ ...filtros });
    }
  }, [visible, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltrosTemp(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleAplicar = () => {
    // Validar filtros
    const validacion = validarFiltros(filtrosTemp);
    
    if (!validacion.valido) {
      // Mostrar errores (puedes usar toast aquí)
      console.error('Errores de validación:', validacion.errores);
      return;
    }

    // Aplicar filtros
    onAplicarFiltros(filtrosTemp);
    onHide();
  };

  const handleCancelar = () => {
    // Descartar cambios temporales
    setFiltrosTemp({ ...filtros });
    onHide();
  };

  // Obtener título según tipo
  const getTitulo = () => {
    switch (tipo) {
      case TIPO_FILTRO_TESORERIA.TODOS:
        return 'Todos los Documentos';
      case TIPO_FILTRO_TESORERIA.COBRAR:
        return 'Cuentas por Cobrar';
      case TIPO_FILTRO_TESORERIA.PAGAR:
        return 'Cuentas por Pagar';
      case TIPO_FILTRO_TESORERIA.ASIGNACIONES:
        return 'Asignaciones de Fondos';
      case TIPO_FILTRO_TESORERIA.GASTOS_DIRECTOS:
        return 'Gastos Directos';
      default:
        return 'Filtros Avanzados';
    }
  };

  const totalDocumentos = opciones.totalDocumentos || 0;
  const filtrosActivos = contarFiltrosActivos(filtrosTemp);

  // Footer del diálogo
  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleCancelar}
        className="p-button-secondary"
      />
      <Button
        label={`Aplicar Filtros${filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}`}
        icon="pi pi-check"
        onClick={handleAplicar}
        className="p-button-primary"
      />
    </div>
  );

  return (
    <Dialog
      header={`🔍 Filtros Avanzados - ${getTitulo()} (${totalDocumentos} documentos)`}
      visible={visible}
      onHide={handleCancelar}
      footer={footer}
      style={{ width: '90vw', maxWidth: '1200px' }}
      modal
      maximizable
      dismissableMask={false}
      draggable={false}
      resizable={false}
    >
      <FiltrosController
        tipo={tipo}
        filtros={filtrosTemp}
        opciones={opciones}
        onFiltroChange={handleFiltroChange}
        documentos={documentos}
      />
    </Dialog>
  );
};

export default FiltrosDialog;
