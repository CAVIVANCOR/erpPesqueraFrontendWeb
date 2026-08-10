import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { getPreFacturaPorId } from '../../../../api/preFactura';
import PreFacturaForm from '../../../preFactura/PreFacturaForm';
import { getEmpresas } from '../../../../api/empresa';
import { getTiposDocumento } from '../../../../api/tipoDocumento';
import { getEntidadesComerciales } from '../../../../api/entidadComercial';
import { getFormasPago } from '../../../../api/formaPago';
import { getProductos } from '../../../../api/producto';
import { getEstadosMultiFuncion } from '../../../../api/estadoMultiFuncion';
import { getCentrosCosto } from '../../../../api/centroCosto';
import { getMonedas } from '../../../../api/moneda';
import { getUnidadesNegocio } from '../../../../api/unidadNegocio';
import { getIncoterms } from '../../../../api/incoterm';
import { getTiposContenedor } from '../../../../api/tipoContenedor';
import { getTiposProducto } from '../../../../api/tipoProducto';
import { getPersonal } from '../../../../api/personal';
import { getBancos } from '../../../../api/banco';
import { getPeriodosContables } from '../../../../api/contabilidad/periodoContable';
import { getMotivoNotaCreditoDebitoActivos } from '../../../../api/ventas/motivoNotaCreditoDebito';

export default function PreFacturaViewer({ id, visible, onHide, readOnly = true }) {
  const toast = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [motivosNCND, setMotivosNCND] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [tiposContenedor, setTiposContenedor] = useState([]);

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
        preFacturaData,
        empresasData,
        tiposDocumentoData,
        clientesData,
        tiposProductoData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        centrosCostoData,
        monedasData,
        unidadesNegocioData,
        bancosData,
        periodosContablesData,
        motivosNCNDData,
        incotermsData,
        tiposContenedorData,
      ] = await Promise.all([
        getPreFacturaPorId(id),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getTiposProducto(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getMonedas(),
        getUnidadesNegocio({ activo: true }),
        getBancos(),
        getPeriodosContables(),
        getMotivoNotaCreditoDebitoActivos(),
        getIncoterms(),
        getTiposContenedor(),
      ]);

      setData(preFacturaData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposDocumentoData);
      setClientes(clientesData);
      setTiposProducto(tiposProductoData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      setCentrosCosto(centrosCostoData);
      setMonedas(monedasData);
      setUnidadesNegocio(unidadesNegocioData || []);
      setBancos(bancosData);
      setPeriodosContables(periodosContablesData || []);
      setMotivosNCND(motivosNCNDData || []);
      setIncoterms(incotermsData || []);
      setTiposContenedor(tiposContenedorData || []);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 13 && !e.cesado,
      );
      setEstadosDoc(estadosDocFiltrados);

    } catch (err) {
      setError(err.message || 'Error al cargar la pre-factura');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const preFacturaActualizada = await getPreFacturaPorId(id);
      setData(preFacturaActualizada);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="📄 PreFactura - Vista de Origen"
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
          <PreFacturaForm
            isEdit={true}
            defaultValues={data}
            onSubmit={() => {}}
            onCancel={onHide}
            onAprobar={() => {}}
            onAnular={() => {}}
            onReactivar={() => {}}
            onActualizar={handleRefresh}
            onClienteCreado={() => {}}
            onIrAPreFacturaOrigen={() => {}}
            loading={false}
            toast={toast}
            permisos={{ puedeEditar: false }}
            readOnly={true}
            empresas={empresas}
            tiposDocumento={tiposDocumento}
            clientes={clientes}
            tiposProducto={tiposProducto}
            formasPago={formasPago}
            productos={productos}
            personalOptions={personalOptions}
            estadosDoc={estadosDoc}
            centrosCosto={centrosCosto}
            monedas={monedas}
            unidadesNegocio={unidadesNegocio}
            bancos={bancos}
            periodosContables={periodosContables}
            motivosNCND={motivosNCND}
            incoterms={incoterms}
            tiposContenedor={tiposContenedor}
            empresaFija={data.empresaId}
            onIrAMovimientoAlmacen={() => {}}
            onIrACotizacionVenta={() => {}}
            onIrAContratoServicio={() => {}}
            onGenerarKardex={() => {}}
          />
        )}
      </Dialog>
    </>
  );
}