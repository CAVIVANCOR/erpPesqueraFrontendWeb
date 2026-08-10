import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { getDeudaConPersonalById } from '../../../../api/tesoreria/deudaConPersonal';
import DeudaConPersonalForm from '../../../deudaConPersonal/DeudaConPersonalForm';
import { getEmpresas } from '../../../../api/empresa';
import { getPersonal } from '../../../../api/personal';
import { getTiposDeudaPersonalActivos } from '../../../../api/tesoreria/tipoDeudaPersonal';
import { getMonedas } from '../../../../api/moneda';
import { getEstadosMultiFuncion } from '../../../../api/estadoMultiFuncion';
import { getPeriodosContables } from '../../../../api/contabilidad/periodoContable';
import { getMediosPago } from '../../../../api/medioPago';

export default function DeudaConPersonalViewer({ id, visible, onHide, readOnly = true }) {
  const toast = useRef(null);
  const formRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
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
      const [
        deudaData,
        empresasData,
        personalData,
        tiposDeudaData,
        monedasData,
        estadosData,
        periodosContablesData,
        mediosPagoData,
      ] = await Promise.all([
        getDeudaConPersonalById(id),
        getEmpresas(),
        getPersonal(),
        getTiposDeudaPersonalActivos(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
        getMediosPago(),
      ]);

      setData(deudaData);
      setEmpresas(empresasData);
      setPersonal(personalData);
      setTiposDeuda(tiposDeudaData);
      setMonedas(monedasData);
      setPeriodosContables(periodosContablesData || []);
      setMediosPago(mediosPagoData || []);

      // Filtrar estados por tipoProvieneDeId = 28 (Deuda con Personal)
      const estadosFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 28 && !e.cesado,
      );
      setEstados(estadosFiltrados);

    } catch (err) {
      setError(err.message || 'Error al cargar la deuda con personal');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const deudaActualizada = await getDeudaConPersonalById(id);
      setData(deudaActualizada);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="👥 Deuda con Personal - Vista de Origen"
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
          <DeudaConPersonalForm
            isEdit={true}
            defaultValues={data}
            empresas={empresas}
            personal={personal}
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
            permisos={{ puedeEditar: false }}
            toast={toast}
            ref={formRef}
          />
        )}
      </Dialog>
    </>
  );
}