// src/components/common/RegistroImpuestoSunat/RegistroImpuestoSunatPanel.jsx
import React, { useState } from 'react';
import { Panel } from 'primereact/panel';
import ImpuestoSunatCard from './ImpuestoSunatCard';
import ImpuestoSunatModal from './ImpuestoSunatModal';
import { detectarImpuesto } from './impuestoSunatUtils';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE MAESTRO: PANEL DE REGISTRO DE IMPUESTO SUNAT
 * ════════════════════════════════════════════════════════════
 * Componente genérico e independiente que muestra información de impuestos
 * SUNAT (Detracción, Retención o Percepción) asociados a una CxC o CxP.
 * 
 * Detecta automáticamente el tipo de impuesto y renderiza:
 * - Tarjeta visual con información resumida (clickeable)
 * - Modal con formulario completo en modo solo lectura
 * 
 * USO:
 * <RegistroImpuestoSunatPanel
 *   documento={cuentaPorCobrar || cuentaPorPagar}
 *   monedas={monedas}
 *   tiposDetraccion={tiposDetraccion}
 *   tiposRetencionPercepcion={tiposRetencionPercepcion}
 *   periodosContables={periodosContables}
 *   empresas={empresas}
 *   entidadesComerciales={clientes || proveedores}
 *   estadosDetraccion={estadosDetraccion}
 *   estadosRetencion={estadosRetencion}
 *   estadosPercepcion={estadosPercepcion}
 *   toast={toast}
 *   permisos={permisos}
 *   compact={false}
 *   showPanel={true}
 *   onUpdate={(data) => {}}
 * />
 * 
 * @param {object} documento - CuentaPorCobrar o CuentaPorPagar con preFactura
 * @param {array} monedas - Array de monedas
 * @param {array} tiposDetraccion - Array de tipos de detracción
 * @param {array} tiposRetencionPercepcion - Array de tipos de retención/percepción
 * @param {array} periodosContables - Array de períodos contables
 * @param {array} empresas - Array de empresas
 * @param {array} entidadesComerciales - Array de clientes o proveedores
 * @param {array} estadosDetraccion - Array de estados para detracción
 * @param {array} estadosRetencion - Array de estados para retención
 * @param {array} estadosPercepcion - Array de estados para percepción
 * @param {object} toast - Ref de Toast
 * @param {object} permisos - Objeto de permisos
 * @param {boolean} compact - Modo compacto (sin panel wrapper)
 * @param {boolean} showPanel - Mostrar panel wrapper
 * @param {function} onUpdate - Callback al actualizar
 */
export default function RegistroImpuestoSunatPanel({
  documento,
  monedas = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  periodosContables = [],
  empresas = [],
  entidadesComerciales = [],
  estadosDetraccion = [],
  estadosRetencion = [],
  estadosPercepcion = [],
  toast = null,
  permisos = {},
  compact = false,
  showPanel = true,
  onUpdate = null
}) {
  const [showModal, setShowModal] = useState(false);

  // ════════════════════════════════════════════════════════════
  // DETECCIÓN AUTOMÁTICA DEL TIPO DE IMPUESTO
  // ════════════════════════════════════════════════════════════
  const impuestoData = detectarImpuesto(
    documento,
    estadosDetraccion,
    estadosRetencion,
    estadosPercepcion
  );

  // Si no hay impuesto, no renderizar nada
  if (!impuestoData) return null;

  const { tipo, registro, estados } = impuestoData;

  // ════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════
  const handleCardClick = () => {
    setShowModal(true);
  };

  const handleModalHide = () => {
    setShowModal(false);
  };

  const handleUpdate = (updatedData) => {
    setShowModal(false);
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(updatedData);
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONTENIDO
  // ════════════════════════════════════════════════════════════
  const renderContent = () => (
    <>
      <ImpuestoSunatCard
        registro={registro}
        tipo={tipo}
        monedas={monedas}
        onClick={handleCardClick}
      />

      <ImpuestoSunatModal
        visible={showModal}
        onHide={handleModalHide}
        tipo={tipo}
        registro={registro}
        empresas={empresas}
        monedas={monedas}
        periodosContables={periodosContables}
        entidadesComerciales={entidadesComerciales}
        tiposDetraccion={tiposDetraccion}
        tiposRetencionPercepcion={tiposRetencionPercepcion}
        estados={estados}
        toast={toast}
        permisos={permisos}
        onUpdate={handleUpdate}
      />
    </>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: CON O SIN PANEL WRAPPER
  // ════════════════════════════════════════════════════════════
  if (compact || !showPanel) {
    return renderContent();
  }

  return (
    <Panel header="📋 Registro de Impuesto SUNAT Generado" className="mb-3">
      {renderContent()}
    </Panel>
  );
}
