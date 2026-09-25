// src/components/movimientoCaja/transferenciaEspecializada/ConfirmacionTransferenciaDialog.jsx
import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import PDFViewerV2 from '../../pdf/PDFViewerV2';
import AsientoContableViewer from '../../common/AsientoContableViewer';
import { formatearNumero } from '../../../utils/utils';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: CONFIRMACIÓN DE TRANSFERENCIA INTERNA
 * ════════════════════════════════════════════════════════════
 * 
 * Muestra el resultado de la transferencia procesada:
 * - Correlativo de operación
 * - Movimientos de caja creados
 * - Asientos contables generados
 * - Enlaces a vouchers PDF
 */

export default function ConfirmacionTransferenciaDialog({
  visible,
  onHide,
  resultadoTransferencia,
  monedas = [],
  toast
}) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  // ════════════════════════════════════════════════════════════
  // HANDLERS: VER VOUCHER
  // ════════════════════════════════════════════════════════════
  
  const handleVerVoucher = (asiento) => {
    const movimientoId = asiento.procesoOrigenId;
    const pdfUrl = `/api/movimientos-caja/${movimientoId}/generar-voucher-contable`;
    setVoucherPdfUrl(pdfUrl);
    setShowVoucherDialog(true);
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: HEADER CONFIRMACIÓN
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => {
    if (!resultadoTransferencia) return null;

    return (
      <div className="text-center mb-4">
        <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
        <h3 className="mt-3 mb-2">¡Transferencia Procesada Exitosamente!</h3>
        <div className="text-xl">
          <Tag
            value={`Operación #${resultadoTransferencia.correlativo}`}
            severity="success"
            style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
          />
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: MOVIMIENTOS DE CAJA CON SALDOS
  // ════════════════════════════════════════════════════════════
  const renderMovimientos = () => {
    if (!resultadoTransferencia?.movimientos || !resultadoTransferencia?.saldosCuentaCorriente) return null;

    const movimientos = [];
    const saldosMap = {};

    // Crear mapa de saldos por tipo
    resultadoTransferencia.saldosCuentaCorriente.forEach(saldo => {
      saldosMap[saldo.tipo] = saldo;
    });

    // Agregar movimientos si existen (siguiendo el patrón de CxC/CxP)
    if (resultadoTransferencia.movimientos.egreso) {
      const saldo = saldosMap['Egreso'] || {};
      movimientos.push({
        tipo: 'Egreso',
        id: resultadoTransferencia.movimientos.egreso.id,
        monto: resultadoTransferencia.movimientos.egreso.monto,
        moneda: resultadoTransferencia.movimientos.egreso.moneda,
        movimiento: resultadoTransferencia.movimientos.egreso,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.egreso.cuentaCorrienteDestino?.banco?.nombre || 'N/A'
      });
    }

    if (resultadoTransferencia.movimientos.itfOrigen) {
      const saldo = saldosMap['ITF Origen'] || {};
      movimientos.push({
        tipo: 'ITF Origen',
        id: resultadoTransferencia.movimientos.itfOrigen.id,
        monto: resultadoTransferencia.movimientos.itfOrigen.monto,
        moneda: resultadoTransferencia.movimientos.itfOrigen.moneda,
        movimiento: resultadoTransferencia.movimientos.itfOrigen,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.itfOrigen.cuentaCorrienteDestino?.banco?.nombre || 'N/A'
      });
    }

    if (resultadoTransferencia.movimientos.comisionOrigen) {
      const saldo = saldosMap['Comisión Origen'] || {};
      movimientos.push({
        tipo: 'Comisión Origen',
        id: resultadoTransferencia.movimientos.comisionOrigen.id,
        monto: resultadoTransferencia.movimientos.comisionOrigen.monto,
        moneda: resultadoTransferencia.movimientos.comisionOrigen.moneda,
        movimiento: resultadoTransferencia.movimientos.comisionOrigen,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.comisionOrigen.cuentaCorrienteDestino?.banco?.nombre || 'N/A'
      });
    }

    if (resultadoTransferencia.movimientos.ingreso) {
      const saldo = saldosMap['Ingreso'] || {};
      movimientos.push({
        tipo: 'Ingreso',
        id: resultadoTransferencia.movimientos.ingreso.id,
        monto: resultadoTransferencia.movimientos.ingreso.monto,
        moneda: resultadoTransferencia.movimientos.ingreso.moneda,
        movimiento: resultadoTransferencia.movimientos.ingreso,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.ingreso.cuentaCorrienteOrigen?.banco?.nombre || 'N/A'
      });
    }

    if (resultadoTransferencia.movimientos.itfDestino) {
      const saldo = saldosMap['ITF Destino'] || {};
      movimientos.push({
        tipo: 'ITF Destino',
        id: resultadoTransferencia.movimientos.itfDestino.id,
        monto: resultadoTransferencia.movimientos.itfDestino.monto,
        moneda: resultadoTransferencia.movimientos.itfDestino.moneda,
        movimiento: resultadoTransferencia.movimientos.itfDestino,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.itfDestino.cuentaCorrienteOrigen?.banco?.nombre || 'N/A'
      });
    }

    if (resultadoTransferencia.movimientos.comisionDestino) {
      const saldo = saldosMap['Comisión Destino'] || {};
      movimientos.push({
        tipo: 'Comisión Destino',
        id: resultadoTransferencia.movimientos.comisionDestino.id,
        moneda: resultadoTransferencia.movimientos.comisionDestino.moneda,
        monto: resultadoTransferencia.movimientos.comisionDestino.monto,
        movimiento: resultadoTransferencia.movimientos.comisionDestino,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuenta: resultadoTransferencia.movimientos.comisionDestino.cuentaCorrienteOrigen?.banco?.nombre || 'N/A'
      });
    }

    if (movimientos.length === 0) return null;

    return (
      <Panel header="📋 Movimientos de Caja y Saldos" className="mb-3">
        <DataTable
          value={movimientos}
          showGridlines
          size="small"
          className="p-datatable-sm"
        >
          <Column 
            field="tipo" 
            header="Tipo" 
            style={{ width: '15%', fontWeight: 'bold' }}
          />
          <Column 
            field="cuenta" 
            header="Cuenta" 
            style={{ width: '15%' }}
          />
          <Column 
            field="monto" 
            header="Monto" 
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.monto || 0, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
          />
          <Column 
            field="saldoAnterior" 
            header="Saldo Anterior" 
            body={(rowData) => `${rowData.moneda?.simbolo} ${formatearNumero(rowData.saldoAnterior, 2)}`}
            style={{ width: '14%', textAlign: 'right' }}
          />
          <Column 
            field="ingresos" 
            header="Ingresos" 
            body={(rowData) => (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{rowData.moneda?.simbolo} {formatearNumero(rowData.ingresos, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
          />
          <Column 
            field="egresos" 
            header="Egresos" 
            body={(rowData) => (
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                -{rowData.moneda?.simbolo} {formatearNumero(rowData.egresos, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
          />
          <Column 
            field="saldoActual" 
            header="Saldo Actual" 
            body={(rowData) => (
              <span style={{ fontWeight: 'bold', color: '#1976D2' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoActual, 2)}
              </span>
            )}
            style={{ width: '14%', textAlign: 'right' }}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: TABLA DE ASIENTOS CONTABLES
  // ════════════════════════════════════════════════════════════
  const renderAsientosContables = () => {
    if (!resultadoTransferencia?.asientosContables || !Array.isArray(resultadoTransferencia.asientosContables)) return null;

    const asientos = resultadoTransferencia.asientosContables;

    if (asientos.length === 0) return null;

    // Asignar tipo según el movimiento vinculado
    const asientosConTipo = asientos.map(asiento => {
      let tipo = 'Desconocido';

      if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoEgresoId)) {
        tipo = 'Egreso';
      } else if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoIngresoId)) {
        tipo = 'Ingreso';
      } else if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoITFOrigenId)) {
        tipo = 'ITF Origen';
      } else if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoComisionOrigenId)) {
        tipo = 'Comisión Origen';
      } else if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoITFDestinoId)) {
        tipo = 'ITF Destino';
      } else if (Number(asiento.procesoOrigenId) === Number(resultadoTransferencia.movimientoComisionDestinoId)) {
        tipo = 'Comisión Destino';
      }

      return {
        ...asiento,
        tipo
      };
    });

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <div className="mb-2 p-2" style={{ backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9rem' }}>
          💡 <strong>Nota:</strong> Use el botón <strong>"Ver Voucher"</strong> para visualizar el detalle de cada asiento.
        </div>
        <DataTable
          value={asientosConTipo}
          showGridlines
          size="small"
          className="p-datatable-sm"
        >
          <Column field="tipo" header="Tipo" style={{ width: '15%', fontWeight: 'bold' }} />
          <Column field="id" header="ID Asiento" style={{ width: '10%' }} />
          <Column
            field="numeroAsiento"
            header="Nº Asiento"
            style={{ width: '20%', fontWeight: 'bold', color: '#1976D2' }}
          />
          <Column
            field="totalDebe"
            header="Debe"
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalDebe || 0, 2)}
              </span>
            )}
            style={{ width: '15%', textAlign: 'right' }}
          />
          <Column
            field="totalHaber"
            header="Haber"
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalHaber || 0, 2)}
              </span>
            )}
            style={{ width: '15%', textAlign: 'right' }}
          />
          <Column
            header="Acciones"
            body={(rowData) => (
              <div className="flex gap-2 justify-content-center">
                <Button
                  icon="pi pi-file-pdf"
                  label="Ver Asiento"
                  size="small"
                  severity="success"
                  outlined
                  tooltip="Ver asiento contable"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => {
                    setAsientoSeleccionado(rowData);
                    setVoucherAsientoVisible(true);
                  }}
                />
                <Button 
                  icon="pi pi-file-pdf" 
                  label="Voucher Contable"
                  className="p-button-help p-button-sm"
                  tooltip="Ver voucher contable en PDF"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => handleVerVoucher(rowData)}
                />
              </div>
            )}
            style={{ width: '25%' }}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FOOTER
  // ════════════════════════════════════════════════════════════
  const renderFooter = () => {
    return (
      <div className="flex justify-content-end gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          onClick={onHide}
          severity="secondary"
        />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Confirmación de Transferencia"
        style={{ width: '90vw', maxWidth: '1200px' }}
        footer={renderFooter()}
        modal
        maximizable
      >
        {renderHeader()}
        {renderMovimientos()}
        {renderAsientosContables()}
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* DIÁLOGO: VER ASIENTO CONTABLE                               */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog
        visible={voucherAsientoVisible}
        onHide={() => {
          setVoucherAsientoVisible(false);
          setAsientoSeleccionado(null);
        }}
        header={`📊 Voucher Asiento Contable - ${asientoSeleccionado?.numeroAsiento || ''}`}
        style={{ width: '90vw', maxWidth: '1200px' }}
        modal
        maximizable
      >
        {asientoSeleccionado && (
          <AsientoContableViewer
            asientoContableId={asientoSeleccionado.id}
            showHeader={true}
          />
        )}
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* DIÁLOGO: VER VOUCHER CONTABLE EN PDF                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog
        visible={showVoucherDialog}
        onHide={() => {
          setShowVoucherDialog(false);
          setVoucherPdfUrl(null);
        }}
        header="📄 Voucher Contable"
        style={{ width: '90vw', maxWidth: '1200px' }}
        modal
        maximizable
      >
        {voucherPdfUrl && (
          <PDFViewerV2
            pdfUrl={voucherPdfUrl}
            height="70vh"
          />
        )}
      </Dialog>
    </>
  );
}
