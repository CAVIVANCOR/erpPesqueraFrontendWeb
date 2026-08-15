import React from 'react';
import MovimientoActivoFijoViewer from './viewers/MovimientoActivoFijoViewer';
import MovimientoAlmacenViewer from './viewers/MovimientoAlmacenViewer';
import OrdenCompraViewer from './viewers/OrdenCompraViewer';
import PreFacturaViewer from './viewers/PreFacturaViewer';
import PrestamoBancarioViewer from './viewers/PrestamoBancarioViewer';
import SaldoCuentaCorrienteViewer from './viewers/SaldoCuentaCorrienteViewer';
import DeudaConPersonalViewer from './viewers/DeudaConPersonalViewer';
import DeudaTributariaViewer from './viewers/DeudaTributariaViewer';
import MovimientoCajaViewer from './viewers/MovimientoCajaViewer';
import DetMovsEntregaRendirViewer from './viewers/DetMovsEntregaRendirViewer';

const MODELO_VIEWERS = {
  MovimientoActivoFijo: MovimientoActivoFijoViewer,
  MovimientoAlmacen: MovimientoAlmacenViewer,
  OrdenCompra: OrdenCompraViewer,
  PreFactura: PreFacturaViewer,
  PrestamoBancario: PrestamoBancarioViewer,
  SaldoCuentaCorriente: SaldoCuentaCorrienteViewer,
  DeudaConPersonal: DeudaConPersonalViewer,
  DeudaTributaria: DeudaTributariaViewer,
  MovimientoCaja: MovimientoCajaViewer,
  DetMovsEntregaRendir: DetMovsEntregaRendirViewer,
};

export default function OrigenAsientoViewer({ nombreModeloOrigen, procesoOrigenId, visible, onHide }) {
  if (!nombreModeloOrigen || !procesoOrigenId) {
    return null;
  }

  const ViewerComponent = MODELO_VIEWERS[nombreModeloOrigen];

  if (!ViewerComponent) {
    return null;
  }

  return (
    <ViewerComponent
      id={procesoOrigenId}
      visible={visible}
      onHide={onHide}
      readOnly={true}
    />
  );
}
