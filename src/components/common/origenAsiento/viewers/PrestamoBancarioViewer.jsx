import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getPrestamoBancarioById } from '../../../../api/tesoreria/prestamoBancarios';
import PrestamoBancarioForm from '../../../tesoreria/PrestamoBancarioForm';

export default function PrestamoBancarioViewer({ id, visible, onHide, readOnly = true }) {
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
      const response = await getPrestamoBancarioById(id);
      setData(response);
    } catch (err) {
      setError(err.message || 'Error al cargar el préstamo bancario');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const prestamoActualizado = await getPrestamoBancarioById(id);
      setData(prestamoActualizado);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="🏦 Préstamo Bancario - Vista de Origen"
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
        <PrestamoBancarioForm
          isEdit={true}
          defaultValues={data}
          empresaFija={data.empresaId}
          onSubmit={() => {}}
          onCancel={onHide}
          onRefresh={handleRefresh}
          loading={false}
          readOnly={true}
        />
      )}
    </Dialog>
  );
}