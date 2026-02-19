// src/components/common/UnidadNegocioFilter.jsx
import React from 'react';
import { Button } from 'primereact/button';
import { useDashboardStore } from '../../shared/stores/useDashboardStore';

/**
 * UnidadNegocioFilter - Botón compacto que muestra la Unidad de Negocio activa
 * 
 * Características:
 * - Solo lectura (usuario NO puede cambiar)
 * - Se define automáticamente desde el Dashboard elegido
 * - Cambia de color y label según la unidad
 * - Dashboard Modular → Muestra "TODAS"
 * - Dashboard Unidades → Muestra la unidad seleccionada (bloqueado)
 * - Tooltip informativo al hacer hover
 */
export default function UnidadNegocioFilter() {
  const { vistaActual, unidadSeleccionada } = useDashboardStore();

  // Determinar la unidad a mostrar
  const unidadActiva = vistaActual === 'unidades' && unidadSeleccionada 
    ? unidadSeleccionada 
    : null;

  // Configuración visual según la unidad
  const config = unidadActiva 
    ? {
        label: unidadActiva.nombre,
        icono: unidadActiva.icono,
        color: unidadActiva.color || '#64748b',
        tooltip: `🔒 Filtrado por: ${unidadActiva.nombre}\n\nEl filtro se establece automáticamente desde el Dashboard de Unidades y no puede ser modificado.`,
        severity: 'info'
      }
    : {
        label: 'TODAS',
        icono: '🌐',
        color: '#64748b',
        tooltip: 'Mostrando registros de todas las unidades de negocio.\n\nAccediste desde el Dashboard Modular.',
        severity: 'secondary'
      };

  return (
    <Button
      label={`${config.icono} ${config.label}`}
      severity={config.severity}
      outlined
      tooltip={config.tooltip}
      tooltipOptions={{ 
        position: 'bottom',
        showDelay: 300,
        style: { maxWidth: '300px', whiteSpace: 'pre-line' }
      }}
      style={{
        fontWeight: '700',
        borderWidth: '2px',
        borderColor: config.color,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
      icon={unidadActiva ? 'pi pi-lock' : 'pi pi-filter'}
      iconPos="right"
    />
  );
}
