// c:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\movimientoCaja\DetEntregaRendirOTMantenimiento.jsx

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

const DetEntregaRendirOTMantenimiento = ({ entrega }) => {
  if (!entrega) {
    return <p>No hay información disponible</p>;
  }

  const calcularTotales = () => {
    const totalesPorMoneda = {};
    
    entrega.detallesMovimientos?.forEach((mov) => {
      const monedaCodigo = mov.moneda?.codigo || 'PEN';
      if (!totalesPorMoneda[monedaCodigo]) {
        totalesPorMoneda[monedaCodigo] = { entregado: 0, gastado: 0, devuelto: 0, saldo: 0 };
      }
      const monto = parseFloat(mov.monto);
      if (mov.tipoMovimientoId === 1 || mov.tipoMovimientoId === 4) {
        totalesPorMoneda[monedaCodigo].entregado += monto;
      } else if (mov.tipoMovimientoId === 2) {
        totalesPorMoneda[monedaCodigo].gastado += monto;
      } else if (mov.tipoMovimientoId === 3) {
        totalesPorMoneda[monedaCodigo].devuelto += monto;
      }
    });

    Object.keys(totalesPorMoneda).forEach((moneda) => {
      totalesPorMoneda[moneda].saldo = totalesPorMoneda[moneda].entregado - totalesPorMoneda[moneda].gastado - totalesPorMoneda[moneda].devuelto;
    });

    return totalesPorMoneda;
  };

  const totales = calcularTotales();

  const montoBodyTemplate = (rowData) => {
    return `${rowData.moneda?.simbolo || ''} ${parseFloat(rowData.monto).toFixed(2)}`;
  };

  const tipoMovBodyTemplate = (rowData) => {
    const severityMap = { 1: 'success', 2: 'danger', 3: 'info', 4: 'warning' };
    return <Tag value={rowData.tipoMovimiento?.descripcion} severity={severityMap[rowData.tipoMovimientoId]} />;
  };

  const pdfBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.urlComprobanteMovimiento && (
          <Button
            icon="pi pi-file-pdf"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}${rowData.urlComprobanteMovimiento}`, '_blank')}
            tooltip="Ver comprobante"
          />
        )}
        {rowData.urlComprobanteOperacionMovCaja && (
          <Button
            icon="pi pi-file-pdf"
            rounded
            outlined
            severity="info"
            size="small"
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}${rowData.urlComprobanteOperacionMovCaja}`, '_blank')}
            tooltip="Ver operación"
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 p-3" style={{ backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h4 className="mt-0">OT: {entrega.otMantenimiento?.numeroOT}</h4>
        <div className="grid">
          <div className="col-6">
            <p className="m-0"><strong>Activo:</strong> {entrega.otMantenimiento?.activo?.nombre}</p>
            <p className="m-0"><strong>Responsable:</strong> {entrega.respEntregaRendir?.nombre}</p>
            <p className="m-0"><strong>Centro de Costo:</strong> {entrega.centroCosto?.Nombre}</p>
          </div>
          <div className="col-6 text-right">
            {Object.entries(totales).map(([moneda, valores]) => (
              <div key={moneda} className="mb-2">
                <p className="m-0 text-lg"><strong>Saldo {moneda}:</strong> {valores.saldo.toFixed(2)}</p>
                <p className="m-0 text-sm text-500">
                  Entregado: {valores.entregado.toFixed(2)} | Gastado: {valores.gastado.toFixed(2)} | Devuelto: {valores.devuelto.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable value={entrega.detallesMovimientos} emptyMessage="No hay movimientos">
        <Column field="fechaMovimiento" header="Fecha" body={(row) => new Date(row.fechaMovimiento).toLocaleDateString()} />
        <Column field="tipoMovimiento.descripcion" header="Tipo" body={tipoMovBodyTemplate} />
        <Column field="descripcion" header="Descripción" />
        <Column field="responsable.nombre" header="Responsable" />
        <Column field="monto" header="Monto" body={montoBodyTemplate} />
        <Column field="entidadComercial.razonSocial" header="Proveedor" />
        <Column header="PDFs" body={pdfBodyTemplate} />
      </DataTable>
    </div>
  );
};

export default DetEntregaRendirOTMantenimiento;
