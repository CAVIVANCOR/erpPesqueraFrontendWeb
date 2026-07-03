import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { generarCorrelativo, buscarSeriesPorEmpresaYTipo } from '../../api/serieDoc';

export default function CambiarTipoSerieDialog({
  visible,
  onHide,
  empresaId,
  tipoDocumentoActual,
  serieActual,
  tiposDocumentoOptions,
  onConfirmar,
  moduloOrigen = 'Documento',
  toast
}) {
  const [nuevoTipoId, setNuevoTipoId] = useState(null);
  const [nuevaSerieId, setNuevaSerieId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seriesCargadas, setSeriesCargadas] = useState([]);
  const [cargandoSeries, setCargandoSeries] = useState(false);

  useEffect(() => {
    if (nuevoTipoId && empresaId) {
      cargarSeriesPorTipo(nuevoTipoId);
    } else {
      setSeriesCargadas([]);
    }
    setNuevaSerieId(null);
  }, [nuevoTipoId, empresaId]);

  const cargarSeriesPorTipo = async (tipoDocId) => {
    try {
      setCargandoSeries(true);
      const series = await buscarSeriesPorEmpresaYTipo(empresaId, tipoDocId);
      setSeriesCargadas(series);
    } catch (error) {
      console.error('Error al cargar series:', error);
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las series',
        life: 3000
      });
      setSeriesCargadas([]);
    } finally {
      setCargandoSeries(false);
    }
  };

  const seriesDocOptions = seriesCargadas.map((s) => ({
    ...s,
    label: `${s.serie} (Correlativo: ${s.correlativo})`,
    value: Number(s.id),
  }));

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
    setSeriesCargadas([]);
    onHide();
  };

  const serieSeleccionada = seriesDocOptions.find(s => s.value === nuevaSerieId);

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
            onChange={(e) => setNuevoTipoId(e.value)}
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
            options={seriesDocOptions}
            onChange={(e) => setNuevaSerieId(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder={cargandoSeries ? "Cargando series..." : "Seleccionar serie"}
            filter
            disabled={!nuevoTipoId || loading || cargandoSeries}
            style={{ width: '100%' }}
          />
          {nuevoTipoId && seriesDocOptions.length === 0 && !cargandoSeries && (
            <small style={{ color: 'red', marginTop: '0.5rem', display: 'block' }}>
              No hay series disponibles para este tipo de documento
            </small>
          )}
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