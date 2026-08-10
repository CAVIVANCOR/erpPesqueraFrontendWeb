import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { getMovimientoAlmacenPorId } from '../../../../api/movimientoAlmacen';
import MovimientoAlmacenForm from '../../../movimientoAlmacen/MovimientoAlmacenForm';
import { getEmpresas } from '../../../../api/empresa';
import { getTiposDocumento } from '../../../../api/tipoDocumento';
import { getEntidadesComerciales } from '../../../../api/entidadComercial';
import { getConceptosMovAlmacen } from '../../../../api/conceptoMovAlmacen';
import { getProductos } from '../../../../api/producto';
import { getPersonal } from '../../../../api/personal';
import { getEstadosMultiFuncion } from '../../../../api/estadoMultiFuncion';
import { getCentrosCosto } from '../../../../api/centroCosto';
import { getAllTipoMovEntregaRendir } from '../../../../api/tipoMovEntregaRendir';
import { getMonedas } from '../../../../api/moneda';
import { getUnidadesNegocio } from '../../../../api/unidadNegocio';
import { getUbicacionesFisicas } from '../../../../api/ubicacionFisica';

export default function MovimientoAlmacenViewer({ id, visible, onHide, readOnly = true }) {
  const toast = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [conceptosMovAlmacen, setConceptosMovAlmacen] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosMercaderia, setEstadosMercaderia] = useState([]);
  const [estadosCalidad, setEstadosCalidad] = useState([]);
  const [ubicacionesFisicas, setUbicacionesFisicas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);

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
        tiposData,
        entidadesData,
        conceptosData,
        productosData,
        personalData,
        estadosData,
        ubicacionesData,
        centrosCostoData,
        tiposMovimientoData,
        monedasData,
        unidadesNegocioData,
      ] = await Promise.all([
        getMovimientoAlmacenPorId(id),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getConceptosMovAlmacen(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getUbicacionesFisicas(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getMonedas(),
        getUnidadesNegocio({ activo: true }),
      ]);

      setData(movimientoData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposData);
      setEntidadesComerciales(entidadesData);
      setConceptosMovAlmacen(conceptosData);
      setProductos(productosData);

      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de mercadería (tipoProvieneDeId = 2 para PRODUCTOS)
      const estadosMercaderiaFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado,
      );
      setEstadosMercaderia(estadosMercaderiaFiltrados);

      // Filtrar estados de calidad (tipoProvieneDeId = 10 para PRODUCTOS CALIDAD)
      const estadosCalidadFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 10 && !e.cesado,
      );
      setEstadosCalidad(estadosCalidadFiltrados);

      setUbicacionesFisicas(ubicacionesData);
      setCentrosCosto(centrosCostoData);
      setTiposMovimiento(tiposMovimientoData);
      setMonedas(monedasData);
      setUnidadesNegocio(unidadesNegocioData || []);

    } catch (err) {
      setError(err.message || 'Error al cargar el movimiento de almacén');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const movimientoActualizado = await getMovimientoAlmacenPorId(id);
      setData(movimientoActualizado);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="📦 Movimiento de Almacén - Vista de Origen"
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
          <MovimientoAlmacenForm
            isEdit={true}
            defaultValues={data}
            empresas={empresas}
            tiposDocumento={tiposDocumento}
            entidadesComerciales={entidadesComerciales}
            conceptosMovAlmacen={conceptosMovAlmacen}
            productos={productos}
            personalOptions={personalOptions}
            estadosMercaderia={estadosMercaderia}
            estadosCalidad={estadosCalidad}
            ubicacionesFisicas={ubicacionesFisicas}
            empresaFija={data.empresaId}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            monedas={monedas}
            unidadesNegocio={unidadesNegocio}
            onSubmit={() => {}}
            onCancel={onHide}
            onCerrar={() => {}}
            onAnular={() => {}}
            onReactivar={() => {}}
            onGenerarKardex={() => {}}
            onIrAOrdenCompra={() => {}}
            onIrAPreFactura={() => {}}
            loading={false}
            toast={toast}
            permisos={{ puedeEditar: false }}
            readOnly={true}
          />
        )}
      </Dialog>
    </>
  );
}