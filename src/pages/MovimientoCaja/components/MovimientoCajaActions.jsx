import React from "react";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { Badge } from "primereact/badge";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { 
  puedeAprobar, 
  puedeRechazar, 
  puedeRevertir, 
  puedeEditar, 
  puedeEliminar 
} from "../utils/helpers";

const MovimientoCajaActions = ({
  movimiento,
  permisos,
  onAprobar,
  onRechazar,
  onRevertir,
  onEditar,
  onEliminar,
  loading = false
}) => {
  // Si no hay movimiento, no mostrar acciones
  if (!movimiento) {
    return null;
  }

  // Determinar si se puede mostrar el grupo de acciones
  const puedeMostrarWorkflow = () => {
    return !movimiento.esReversion;
  };

  // Opciones del menú de acciones adicionales
  const accionesAdicionales = [
    {
      label: 'Ver Detalles',
      icon: 'pi pi-eye',
      command: () => {
        // Implementar vista de detalles
      }
    },
    {
      label: 'Duplicar',
      icon: 'pi pi-copy',
      command: () => {
        // Implementar duplicación
      }
    },
    {
      label: 'Exportar PDF',
      icon: 'pi pi-file-pdf',
      command: () => {
        // Implementar exportación PDF
      }
    },
    {
      label: 'Historial',
      icon: 'pi pi-history',
      command: () => {
        // Implementar historial de cambios
      }
    }
  ];

  // Separador para acciones agrupadas
  const renderAccionesWorkflow = () => {
    if (!puedeMostrarWorkflow()) {
      return null;
    }

    const puedeAprobarMovimiento = puedeAprobar(movimiento, permisos);
    const puedeRechazarMovimiento = puedeRechazar(movimiento, permisos);
    const puedeRevertirMovimiento = puedeRevertir(movimiento, permisos);

    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-check"
          rounded
          severity="success"
          size="small"
          onClick={() => onAprobar(movimiento)}
          loading={loading}
          disabled={!puedeAprobarMovimiento}
          tooltip={!puedeAprobarMovimiento ? "No puede aprobar este movimiento" : "Aprobar movimiento"}
          tooltipOptions={{ position: 'top' }}
        />
        
        <Button
          icon="pi pi-times"
          rounded
          severity="danger"
          size="small"
          onClick={() => onRechazar(movimiento)}
          loading={loading}
          disabled={!puedeRechazarMovimiento}
          tooltip={!puedeRechazarMovimiento ? "No puede rechazar este movimiento" : "Rechazar movimiento"}
          tooltipOptions={{ position: 'top' }}
        />
        
        <Button
          icon="pi pi-replay"
          rounded
          severity="warning"
          size="small"
          onClick={() => onRevertir(movimiento)}
          loading={loading}
          disabled={!puedeRevertirMovimiento}
          tooltip={!puedeRevertirMovimiento ? "No puede revertir este movimiento" : "Revertir movimiento"}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // Separador para acciones de edición
  const renderAccionesEdicion = () => {
    const puedeEditarMovimiento = puedeEditar(movimiento, permisos);
    const puedeEliminarMovimiento = puedeEliminar(movimiento, permisos);

    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          size="small"
          onClick={() => onEditar(movimiento)}
          loading={loading}
          disabled={!puedeEditarMovimiento}
          tooltip={!puedeEditarMovimiento ? "No puede editar este movimiento" : "Editar movimiento"}
          tooltipOptions={{ position: 'top' }}
        />
        
        <Button
          icon="pi pi-trash"
          rounded
          severity="secondary"
          size="small"
          onClick={() => onEliminar(movimiento)}
          loading={loading}
          disabled={!puedeEliminarMovimiento}
          tooltip={!puedeEliminarMovimiento ? "No puede eliminar este movimiento" : "Eliminar movimiento"}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // Renderizado principal
  return (
    <div className="flex align-items-center gap-2">
      {/* Estado del movimiento */}
      <div className="flex align-items-center">
        <Badge 
          value={movimiento.estado?.descripcion || 'PENDIENTE'} 
          severity={movimiento.estado?.severityColor || 'secondary'}
          className="mr-2"
        />
        
        {movimiento.esReversion && (
          <Badge 
            value="REVERSIÓN" 
            severity="warning" 
            className="mr-2"
          />
        )}
      </div>

      <Divider layout="vertical" />

      {/* Acciones de Workflow */}
      {renderAccionesWorkflow()}

      {/* Acciones de Edición */}
      {renderAccionesEdicion()}

      {/* Menú de acciones adicionales */}
      <SplitButton
        label="Más"
        icon="pi pi-ellipsis-h"
        model={accionesAdicionales}
        size="small"
        className="p-button-outlined"
        disabled={loading}
      />

      {/* Mensaje informativo si es reversión */}
      {movimiento.esReversion && (
        <Message 
          severity="info" 
          text="Este movimiento es una reversión" 
          className="ml-2"
        />
      )}
    </div>
  );
};

export default MovimientoCajaActions;