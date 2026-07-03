import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { generarCorrelativo } from '../../api/serieDoc';

export default function CambiarTipoSerieDialog({
  visible,
  onHide,
  empresaId,
  tipoDocumentoActual,
  serieActual,
  tiposDocumentoOptions,
  seriesDocOptions,
  onConfirmar,
  moduloOrigen = 'Documento',
  toast
}) {
  const [nuevoTipoId, setNuevoTipoId] = useState(null);
  const [nuevaSerieId, setNuevaSerieId] = useState(null);
  const [loading, setLoading] = useState(false);

  const seriesFiltradas = seriesDocOptions.filter(s => 
    Number(s.empresaId) === Number(empresaId) &&
    Number(s.tipoDocumentoId) === Number(nuevoTipoId || tipoDocumentoActual?.id)
  );

  const handleConfirmar = async () => {
    if (!nuevoTipoId || !nuevaSerieId) {
      return;
    }

    try {
      setLoading(true);
      const datos = await generarCorrelativo(nuevaSerieId);
      
      onConfirmar(datos);
      handleCerrar();
    } catch (error) {
      console.error('Error al generar correlativo:', error);
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el nuevo correlativo',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    setNuevoTipoId(null);
    setNuevaSerieId(null);
    onHide();
  };

  const serieSeleccionada = seriesFiltradas.find(s => s.value === nuevaSerieId);

  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleCerrar}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Confirmar Cambio"
        icon="pi pi-check"
        onClick={handleConfirmar}
        disabled={!nuevoTipoId || !nuevaSerieId || loading}
        severity="success"
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      header={`🔄 Cambiar Tipo y Serie de ${moduloOrigen}`}
      visible={visible}
      style={{ width: '600px' }}
      onHide={handleCerrar}
      footer={footer}
      modal
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 Datos Actuales</h4>
          <div><strong>Tipo:</strong> {tipoDocumentoActual?.nombre || '-'}</div>
          <div><strong>Serie:</strong> {serieActual?.serie || '-'}</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Nuevo Tipo de Documento*
          </label>
          <Dropdown
            value={nuevoTipoId}
            options={tiposDocumentoOptions}
            onChange={(e) => {
              setNuevoTipoId(e.value);
              setNuevaSerieId(null);
            }}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            filter
            style={{ width: '100%' }}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            Nueva Serie*
          </label>
          <Dropdown
            value={nuevaSerieId}
            options={seriesFiltradas}
            onChange={(e) => setNuevaSerieId(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            filter
            disabled={!nuevoTipoId || loading}
            style={{ width: '100%' }}
          />
        </div>

        {serieSeleccionada && (
          <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 Serie Seleccionada</h4>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
              {serieSeleccionada.label}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Al confirmar se generará el nuevo correlativo
            </div>
          </div>
        )}

        <Message
          severity="warn"
          text="⚠️ Al confirmar se generará un nuevo correlativo. Esta acción es irreversible."
        />
      </div>
    </Dialog>
  );
}