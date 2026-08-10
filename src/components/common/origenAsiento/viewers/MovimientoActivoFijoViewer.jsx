import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getMovimientoActivoFijoPorId } from '../../../../api/movimientoActivoFijo';
import MovimientoActivoFijoForm from "../../../movimientoActivoFijo/MovimientoActivoFijoForm";
import { getEmpresas } from '../../../../api/empresa';
import { getActivos } from '../../../../api/activo';
import { getTiposMovimientoActivoFijo } from '../../../../api/tipoMovimientoActivoFijo';

export default function MovimientoActivoFijoViewer({ id, visible, onHide, readOnly = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);

  useEffect(() => {
    if (id && visible) {
      cargarDatos();
    }
  }, [id, visible]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        movimientoData,
        empresasData,
        activosData,
        tiposData
      ] = await Promise.all([
        getMovimientoActivoFijoPorId(id),
        getEmpresas(),
        getActivos(),
        getTiposMovimientoActivoFijo(),
      ]);

      setData(movimientoData);
      setEmpresas(empresasData);
      setActivos(activosData);
      setTiposMovimiento(tiposData);

    } catch (err) {
      setError(err.message || 'Error al cargar el movimiento de activo fijo');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const movimientoActualizado = await getMovimientoActivoFijoPorId(id);
      setData(movimientoActualizado);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="🏢 Movimiento de Activo Fijo - Vista de Origen"
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
        <MovimientoActivoFijoForm
          movimiento={data}
          empresas={empresas}
          activos={activos}
          tiposMovimiento={tiposMovimiento}
          esEdicion={true}
          empresaIdInicial={data.empresaId}
          activoIdInicial={data.activoId}
          onSave={() => {}}
          onCancel={onHide}
          permisos={{ puedeEditar: false }}
          readOnly={true}
        />
      )}
    </Dialog>
  );
}