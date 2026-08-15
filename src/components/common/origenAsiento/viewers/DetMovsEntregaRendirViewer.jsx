import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getDetMovsEntregaRendirPorId } from '../../../../api/detMovsEntregaRendir';
import DetMovsRendicionGastosForm from '../../../rendicionGastos/DetMovsRendicionGastosForm';
import { getPersonal } from '../../../../api/personal';
import { getCentrosCosto } from '../../../../api/centroCosto';
import { getAllTipoMovEntregaRendir } from '../../../../api/tipoMovEntregaRendir';
import { getAllCategoriaTipoMovEntregaRendir } from '../../../../api/categoriaTipoMovEntregaRendir';
import { getEntidadesComerciales } from '../../../../api/entidadComercial';
import { getMonedas } from '../../../../api/moneda';
import { getTiposDocumento } from '../../../../api/tipoDocumento';
import { getProductos } from '../../../../api/producto';
import { getEmpresas } from '../../../../api/empresa';
import { getAllDetMovsEntregaRendir } from '../../../../api/detMovsEntregaRendir';

export default function DetMovsEntregaRendirViewer({ id, visible, onHide, readOnly = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para catálogos
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [productos, setProductos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

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
        detMovData,
        personalData,
        centrosCostoData,
        tiposMovimientoData,
        categoriasData,
        entidadesComercialesData,
        monedasData,
        tiposDocumentoData,
        productosData,
        empresasData,
        movimientosData,
      ] = await Promise.all([
        getDetMovsEntregaRendirPorId(id),
        getPersonal(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getAllCategoriaTipoMovEntregaRendir(),
        getEntidadesComerciales(),
        getMonedas(),
        getTiposDocumento(),
        getProductos(),
        getEmpresas(),
        getAllDetMovsEntregaRendir(),
      ]);

      setData(detMovData);
      setPersonal(
        (personalData || []).map((p) => ({
          ...p,
          nombreCompleto: `${p.nombres} ${p.apellidos}`.trim(),
        }))
      );
      setCentrosCosto(centrosCostoData || []);
      setTiposMovimiento(tiposMovimientoData || []);
      setCategorias(categoriasData || []);
      setEntidadesComerciales(entidadesComercialesData || []);
      setMonedas(monedasData || []);
      setTiposDocumento(tiposDocumentoData || []);
      setProductos(productosData || []);
      setEmpresas(empresasData || []);
      setMovimientos(movimientosData || []);

    } catch (err) {
      console.error('Error al cargar rendición de gastos:', err);
      setError('No se pudo cargar la rendición de gastos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar movimientos que son asignaciones
  const movimientosAsignacionEntregaRendir = (movimientos || []).filter(
    (mov) => mov.formaParteCalculoEntregaARendir === true && mov.liquidado === false
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="💰 Rendición de Gastos - Vista de Origen"
      style={{ width: '95vw', maxHeight: '90vh' }}
      modal
      maximizable
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
        <DetMovsRendicionGastosForm
          movimiento={data}
          rendicionGastos={null}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          categorias={categorias}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          empresas={empresas}
          movimientosAsignacionEntregaRendir={movimientosAsignacionEntregaRendir}
          todosLosMovimientos={movimientos}
          onGuardadoExitoso={() => {}}
          onCancelar={onHide}
          permisos={{ puedeVer: true, puedeEditar: false, puedeCrear: false, puedeEliminar: false }}
          onEntidadComercialCreada={() => {}}
        />
      )}
    </Dialog>
  );
}