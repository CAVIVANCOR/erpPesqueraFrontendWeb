/**
 * ProcessProgressDialog.jsx
 * 
 * Componente genérico reutilizable para mostrar el progreso de cualquier proceso.
 * Usa ProgressBar de PrimeReact y se puede alimentar con props para cualquier flujo.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';

/**
 * Componente genérico para mostrar el progreso de un proceso
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Función callback al cerrar el diálogo
 * @param {string} title - Título del proceso
 * @param {Array} steps - Array de pasos [{label: 'Paso 1', completed: true}, ...]
 * @param {number} currentStep - Índice del paso actual (0-based)
 * @param {boolean} isComplete - Indica si el proceso está completo
 * @param {boolean} hasError - Indica si hubo un error
 * @param {string} errorMessage - Mensaje de error (opcional)
 * @param {object} summary - Resumen final {creados: 0, actualizados: 0, etc.}
 */
export default function ProcessProgressDialog({
  visible,
  onHide,
  title = 'Procesando...',
  steps = [],
  currentStep = 0,
  isComplete = false,
  hasError = false,
  errorMessage = '',
  summary = null
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (steps.length > 0) {
      const completedSteps = steps.filter(s => s.completed).length;
      const newProgress = Math.round((completedSteps / steps.length) * 100);
      setProgress(newProgress);
    } else if (isComplete) {
      setProgress(100);
    }
  }, [steps, currentStep, isComplete]);

  const getStepIcon = (step, index) => {
    if (step.completed) {
      return <i className="pi pi-check-circle" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i>;
    } else if (index === currentStep && !isComplete) {
      return <i className="pi pi-spin pi-spinner" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>;
    } else {
      return <i className="pi pi-circle" style={{ color: '#d1d5db', fontSize: '1.2rem' }}></i>;
    }
  };

  const footer = (
    <div>
      {isComplete && (
        <Button
          label="Cerrar"
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-text"
        />
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={isComplete ? onHide : null}
      header={title}
      style={{ width: '500px' }}
      modal
      closable={isComplete}
      footer={footer}
    >
      <div style={{ padding: '1rem 0' }}>
        {/* Barra de progreso */}
        <ProgressBar 
          value={progress} 
          showValue={true}
          style={{ height: '24px', marginBottom: '1.5rem' }}
        />

        {/* Lista de pasos */}
        {steps.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  borderBottom: index < steps.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                {getStepIcon(step, index)}
                <span
                  style={{
                    flex: 1,
                    fontWeight: index === currentStep ? 'bold' : 'normal',
                    color: step.completed ? '#22c55e' : index === currentStep ? '#3b82f6' : '#6b7280'
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje de error */}
        {hasError && errorMessage && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="pi pi-exclamation-triangle" style={{ color: '#dc2626' }}></i>
            <span style={{ color: '#dc2626', fontSize: '0.9rem' }}>
              {errorMessage}
            </span>
          </div>
        )}

        {/* Resumen final */}
        {isComplete && summary && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '4px',
              marginTop: '1rem'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>
              ✅ Proceso Completado
            </div>
            {summary.creados > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                - {summary.creados} registro(s) creado(s)
              </div>
            )}
            {summary.actualizados > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                - {summary.actualizados} registro(s) actualizado(s)
              </div>
            )}
            {summary.saldosDetActualizados > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                - {summary.saldosDetActualizados} saldo(s) detallado(s) actualizado(s)
              </div>
            )}
            {summary.saldosGenActualizados > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                - {summary.saldosGenActualizados} saldo(s) general(es) actualizado(s)
              </div>
            )}
            {summary.errores > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                ⚠️ {summary.errores} error(es) encontrado(s)
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}