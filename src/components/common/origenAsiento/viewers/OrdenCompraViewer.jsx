import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getOrdenCompraPorId } from '../../../../api/ordenCompra';
import OrdenCompraForm from '../../../ordenCompra/OrdenCompraForm';
import { getEmpresas } from '../../../../api/empresa';
import { getEntidadesComerciales } from '../../../../api/entidadComercial';
import { getFormasPago } from '../../../../api/formaPago';
import { getProductos } from '../../../../api/producto';
import { getPersonal } from '../../../../api/personal';
import { getEstadosMultiFuncion } from '../../../../api/estadoMultiFuncion';
import { getRequerimientosCompra } from '../../../../api/requerimientoCompra';
import { getMonedas } from '../../../../api/moneda';
import { getCentrosCosto } from '../../../../api/centroCosto';
import { getTiposDocumento } from '../../../../api/tipoDocumento';
import { getSeriesDoc } from '../../../../api/serieDoc';
import { getUnidadesNegocio } from '../../../../api/unidadNegocio';
import { getPeriodosContables } from '../../../../api/contabilidad/periodoContable';
import { getMotivoNotaCreditoDebitoActivos } from '../../../../api/ventas/motivoNotaCreditoDebito';

export default function OrdenCompraViewer({ id, visible, onHide, readOnly = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [estadosOrden, setEstadosOrden] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [motivosNCND, setMotivosNCND] = useState([]);

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
        ordenData,
        empresasData,
        proveedoresData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        requerimientosData,
        monedasData,
        centrosCostoData,
        tiposDocumentoData,
        seriesDocData,
        unidadesNegocioData,
        periodosContablesData,
        motivosNCNDData,
      ] = await Promise.all([
        getOrdenCompraPorId(id),
        getEmpresas(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getRequerimientosCompra(),
        getMonedas(),
        getCentrosCosto(),
        getTiposDocumento(),
        getSeriesDoc(),
        getUnidadesNegocio({ activo: true }),
        getPeriodosContables(),
        getMotivoNotaCreditoDebitoActivos(),
      ]);

      setData(ordenData);
      setEmpresas(empresasData);
      setProveedores(proveedoresData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      setMonedas(monedasData);
      setCentrosCosto(centrosCostoData);
      setTiposDocumento(tiposDocumentoData);
      setSeriesDoc(seriesDocData);
      setUnidadesNegocio(unidadesNegocioData || []);
      setPeriodosContables(periodosContablesData || []);
      setMotivosNCND(motivosNCNDData || []);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 12 && !e.cesado,
      );
      setEstadosOrden(estadosDocFiltrados);

      const requerimientosAprobados = requerimientosData.filter(
        (r) => r.estadoDocId === 33,
      );
      setRequerimientos(requerimientosAprobados);

    } catch (err) {
      setError(err.message || 'Error al cargar la orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (id) {
      const ordenActualizada = await getOrdenCompraPorId(id);
      setData(ordenActualizada);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="🛒 Orden de Compra - Vista de Origen"
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
        <OrdenCompraForm
          isEdit={true}
          defaultValues={data}
          empresas={empresas}
          proveedores={proveedores}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          tiposDocumento={tiposDocumento}
          seriesDoc={seriesDoc}
          estadosOrden={estadosOrden}
          onProveedorCreado={() => {}}
          requerimientos={requerimientos}
          monedas={monedas}
          centrosCosto={centrosCosto}
          unidadesNegocio={unidadesNegocio}
          periodosContables={periodosContables}
          motivosNCND={motivosNCND}
          empresaFija={data.empresaId}
          onSubmit={() => {}}
          onCancel={onHide}
          onAprobar={() => {}}
          onAnular={() => {}}
          onReactivar={() => {}}
          onGenerarKardex={() => {}}
          onGenerarCxP={() => {}}
          onGenerarDesdeRequerimiento={() => {}}
          onIrAlOrigen={() => {}}
          onIrAMovimientoAlmacen={() => {}}
          loading={false}
          readOnly={true}
        />
      )}
    </Dialog>
  );
}