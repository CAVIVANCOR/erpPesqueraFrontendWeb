import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getMovimientoCajaById } from '../../../../api/movimientoCaja';
import MovimientoCajaDialog from "../../../movimientoCaja/MovimientoCajaDialog";

export default function MovimientoCajaViewer({ id, visible, onHide, readOnly = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && visible) {
      cargarDatos();
    }
  }, [id, visible]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMovimientoCajaById(id);
      setData(response);
    } catch (err) {
      setError(err.message || 'Error al cargar el movimiento de caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="💵 Movimiento de Caja - Vista de Origen"
      style={{ width: '90vw', maxHeight: '90vh' }}
      modal
      dismissableMask
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <ProgressSpinner />
          <p>Cargando datos...</p>
        </div>
      )}

      {error && (
        <Message severity="error" text={error} style={{ width: '100%' }} />
      )}

      {data && !loading && (
        <MovimientoCajaDialog
          visible={true}
          onHide={() => { }}
          movimiento={data}
          readOnly={true}
        />
      )}
    </Dialog>
  );
}
