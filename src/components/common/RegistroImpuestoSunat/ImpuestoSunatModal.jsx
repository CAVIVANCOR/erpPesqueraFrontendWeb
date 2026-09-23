// src/components/common/RegistroImpuestoSunat/ImpuestoSunatModal.jsx
import React from 'react';
import { Dialog } from 'primereact/dialog';
import DetraccionForm from '../../detraccion/DetraccionForm';
import RetencionForm from '../../retencion/RetencionForm';
import PercepcionForm from '../../percepcion/PercepcionForm';
import { getColorConfig } from './impuestoSunatUtils';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: MODAL DE DETALLE DE IMPUESTO SUNAT
 * ════════════════════════════════════════════════════════════
 * Modal que muestra el formulario completo del impuesto en modo solo lectura
 * 
 * @param {boolean} visible - Visibilidad del modal
 * @param {function} onHide - Callback al cerrar el modal
 * @param {string} tipo - 'DETRACCION' | 'RETENCION' | 'PERCEPCION'
 * @param {object} registro - Objeto del registro de impuesto
 * @param {array} empresas - Array de empresas
 * @param {array} monedas - Array de monedas
 * @param {array} periodosContables - Array de períodos contables
 * @param {array} entidadesComerciales - Array de clientes/proveedores
 * @param {array} tiposDetraccion - Array de tipos de detracción (solo para DETRACCION)
 * @param {array} tiposRetencionPercepcion - Array de tipos de retención/percepción (para RETENCION y PERCEPCION)
 * @param {array} estados - Array de estados de pago
 * @param {object} toast - Ref de Toast
 * @param {object} permisos - Objeto de permisos
 * @param {function} onUpdate - Callback al actualizar (opcional)
 */
export default function ImpuestoSunatModal({
  visible,
  onHide,
  tipo,
  registro,
  empresas = [],
  monedas = [],
  periodosContables = [],
  entidadesComerciales = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  estados = [],
  toast = null,
  permisos = {},
  onUpdate = null
}) {
  if (!registro || !tipo) return null;

  const colors = getColorConfig(tipo);

  /**
   * Convierte fechas string a objetos Date para los formularios
   */
  const prepararDefaultValues = (registro) => {
    return {
      ...registro,
      fechaEmision: registro.fechaEmision ? new Date(registro.fechaEmision) : null,
      fechaContable: registro.fechaContable ? new Date(registro.fechaContable) : null,
      fechaAplicacion: registro.fechaAplicacion ? new Date(registro.fechaAplicacion) : null,
      fechaDeposito: registro.fechaDeposito ? new Date(registro.fechaDeposito) : null,
    };
  };

  /**
   * Renderiza el formulario correspondiente según el tipo
   */
  const renderForm = () => {
    const defaultValues = prepararDefaultValues(registro);

    switch(tipo) {
      case 'DETRACCION':
        return (
          <DetraccionForm
            isEdit={true}
            defaultValues={defaultValues}
            empresas={empresas}
            tiposDetraccion={tiposDetraccion}
            monedas={monedas}
            estados={estados}
            periodosContables={periodosContables}
            entidadesComerciales={entidadesComerciales}
            empresaFija={null}
            onSubmit={() => {}}
            onCancel={onHide}
            loading={false}
            readOnly={true}
            permisos={permisos}
            toast={toast}
          />
        );

      case 'RETENCION':
        return (
          <RetencionForm
            isEdit={true}
            defaultValues={defaultValues}
            empresas={empresas}
            tiposRetencionPercepcion={tiposRetencionPercepcion}
            monedas={monedas}
            estados={estados}
            periodosContables={periodosContables}
            entidadesComerciales={entidadesComerciales}
            empresaFija={null}
            onSubmit={() => {}}
            onCancel={onHide}
            loading={false}
            readOnly={true}
            permisos={permisos}
            toast={toast}
          />
        );

      case 'PERCEPCION':
        return (
          <PercepcionForm
            isEdit={true}
            defaultValues={defaultValues}
            empresas={empresas}
            tiposRetencionPercepcion={tiposRetencionPercepcion}
            monedas={monedas}
            estados={estados}
            periodosContables={periodosContables}
            entidadesComerciales={entidadesComerciales}
            empresaFija={null}
            onSubmit={() => {}}
            onCancel={onHide}
            loading={false}
            readOnly={true}
            permisos={permisos}
            toast={toast}
          />
        );

      default:
        return <div>Tipo de impuesto no reconocido</div>;
    }
  };

  return (
    <Dialog
      header={
        <div>
          <i className={`pi ${colors.icon}`} style={{ marginRight: "0.5rem" }} />
          {`${colors.label} ID: ${registro.id}`}
        </div>
      }
      visible={visible}
      style={{ width: "95vw", maxWidth: "1400px" }}
      onHide={onHide}
      modal
      maximizable
      blockScroll
    >
      {renderForm()}
    </Dialog>
  );
}
