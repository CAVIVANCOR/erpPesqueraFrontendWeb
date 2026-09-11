/**
 * AsignarActivoMasivo.jsx
 * 
 * Componente para asignación masiva de Activo a múltiples movimientos de rendición de gastos.
 * Permite seleccionar un activo y aplicarlo a todos los registros seleccionados en una sola operación.
 * 
 * PATRÓN: Replica AsignarCentroCostoMasivo.jsx para mantener consistencia en la UI/UX
 * 
 * @component
 * @example
 * <AsignarActivoMasivo
 *   visible={showDialog}
 *   onHide={() => setShowDialog(false)}
 *   registrosSeleccionados={[1, 2, 3]}
 *   onAsignar={handleAsignar}
 *   nombreModulo="movimientos"
 * />
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import ActivoSelector from "./ActivoSelector";

/**
 * Componente de diálogo para asignación masiva de activos
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.visible - Controla la visibilidad del diálogo
 * @param {Function} props.onHide - Callback ejecutado al cerrar el diálogo
 * @param {Array<number>} props.registrosSeleccionados - IDs de los registros a actualizar
 * @param {Function} props.onAsignar - Callback ejecutado al confirmar asignación (activoId, registrosIds)
 * @param {string} [props.nombreModulo="registros"] - Nombre descriptivo del módulo para mensajes
 * @returns {JSX.Element} Diálogo de asignación masiva
 */
const AsignarActivoMasivo = ({
  visible,
  onHide,
  registrosSeleccionados = [],
  onAsignar,
  nombreModulo = "registros",
}) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO LOCAL
  // ═══════════════════════════════════════════════════════════
  
  /**
   * ID del activo seleccionado para asignación masiva
   * @type {number|null}
   */
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);

  /**
   * Estado de carga durante la operación de asignación
   * @type {boolean}
   */
  const [loading, setLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Maneja la confirmación de asignación masiva
   * Valida que haya un activo seleccionado y ejecuta el callback
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleConfirmar = async () => {
    // Validación: Activo obligatorio
    if (!activoSeleccionado) {
      return;
    }

    setLoading(true);
    try {
      // Ejecutar callback de asignación con activo y registros seleccionados
      await onAsignar(activoSeleccionado, registrosSeleccionados);
      
      // Resetear estado y cerrar diálogo
      handleCancelar();
    } catch (error) {
      console.error("Error en asignación masiva de activo:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la cancelación del diálogo
   * Resetea el estado local y cierra el diálogo
   * 
   * @returns {void}
   */
  const handleCancelar = () => {
    setActivoSeleccionado(null);
    setLoading(false);
    onHide();
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Renderiza el footer del diálogo con botones de acción
   * 
   * @returns {JSX.Element} Footer con botones Cancelar y Asignar
   */
  const renderFooter = () => (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleCancelar}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Asignar Activo"
        icon="pi pi-check"
        onClick={handleConfirmar}
        disabled={!activoSeleccionado || loading}
        loading={loading}
        autoFocus
      />
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════

  return (
    <Dialog
      header="Asignar Activo a Movimientos Seleccionados"
      visible={visible}
      style={{ width: "600px" }}
      footer={renderFooter()}
      onHide={handleCancelar}
      modal
      draggable={false}
      resizable={false}
    >
      <div style={{ padding: "1rem 0" }}>
        {/* Información de registros seleccionados */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            borderLeft: "4px solid #2196F3",
          }}
        >
          <i className="pi pi-info-circle" style={{ marginRight: "0.5rem", color: "#2196F3" }} />
          <strong>{registrosSeleccionados.length}</strong> {nombreModulo} seleccionado(s)
        </div>

        {/* Selector de Activo */}
        <div className="field">
          <label htmlFor="activo" className="block text-900 font-medium mb-2">
            Seleccione Activo <span style={{ color: "red" }}>*</span>
          </label>
          <ActivoSelector
            value={activoSeleccionado}
            onChange={setActivoSeleccionado}
            placeholder="Seleccione el activo a asignar..."
            required={true}
            disabled={loading}
          />
          <small className="p-d-block" style={{ color: "#666", marginTop: "0.5rem" }}>
            El activo seleccionado se asignará a todos los {nombreModulo} seleccionados
          </small>
        </div>
      </div>
    </Dialog>
  );
};

export default AsignarActivoMasivo;
