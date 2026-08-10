import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getDeudaTributariaById } from '../../../../api/tesoreria/deudaTributaria';
import { getTiposDeudaTributariaActivos } from '../../../../api/tesoreria/tipoDeudaTributaria';
import { getEmpresas } from '../../../../api/empresa';
import { getMonedas } from '../../../../api/moneda';
import { getEstadosMultiFuncion } from '../../../../api/estadoMultiFuncion';
import { getPeriodosContables } from '../../../../api/contabilidad/periodoContable';
import { getMediosPago } from '../../../../api/medioPago';
import DeudaTributariaForm from '../../../deudaTributaria/DeudaTributariaForm';

export default function DeudaTributariaViewer({ id, visible, onHide, readOnly = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para los datos de los dropdowns
  const [empresas, setEmpresas] = useState([]);
  const [tiposDeuda, setTiposDeuda] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);

  useEffect(() => {
    if (id && visible) {
      cargarDatos();
    }
  }, [id, visible]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar datos en paralelo
      const [deuda, empresasData, tiposDeudaData, monedasData, estadosData, periodosData, mediosPagoData] = await Promise.all([
        getDeudaTributariaById(id),
        getEmpresas(),
        getTiposDeudaTributariaActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getMediosPago(),
      ]);
      
      setData(deuda);
      setEmpresas(empresasData);
      setTiposDeuda(tiposDeudaData);
      setMonedas(monedasData);
      setEstados(estadosData);
      setPeriodosContables(periodosData);
      setMediosPago(mediosPagoData);
    } catch (err) {
      setError(err.message || 'Error al cargar la deuda tributaria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="🏛️ Deuda Tributaria - Vista de Origen"
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
        <DeudaTributariaForm
          isEdit={true}
          defaultValues={data}
          empresas={empresas}
          tiposDeuda={tiposDeuda}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          mediosPago={mediosPago}
          empresaFija={data.empresaId}
          onSubmit={() => {}}
          onCancel={onHide}
          loading={false}
          readOnly={true}
          permisos={{ puedeEditar: false, puedeCrear: false, puedeEliminar: false }}
          toast={{ current: null }}
        />
      )}
    </Dialog>
  );
}