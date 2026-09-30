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
      const mov = resultadoTransferencia.movimientos.egreso;
      movimientos.push({
        tipo: 'Egreso',
        id: mov.id,
        monto: mov.monto,
        moneda: mov.moneda,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteDestino,
        empresa: mov.empresa || mov.cuentaCorrienteDestino?.empresa // Empresa del movimiento o de la cuenta
      });
    }

    if (resultadoTransferencia.movimientos.itfOrigen) {
      const saldo = saldosMap['ITF Origen'] || {};
      const mov = resultadoTransferencia.movimientos.itfOrigen;
      movimientos.push({
        tipo: 'ITF Origen',
        id: mov.id,
        monto: mov.monto,
        moneda: mov.moneda,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteOrigen,
        empresa: mov.empresa || mov.cuentaCorrienteOrigen?.empresa // Empresa del movimiento o de la cuenta
      });
    }

    if (resultadoTransferencia.movimientos.comisionOrigen) {
      const saldo = saldosMap['Comisión Origen'] || {};
      const mov = resultadoTransferencia.movimientos.comisionOrigen;
      movimientos.push({
        tipo: 'Comisión Origen',
        id: mov.id,
        monto: mov.monto,
        moneda: mov.moneda,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteOrigen,
        empresa: mov.empresa || mov.cuentaCorrienteOrigen?.empresa // Empresa del movimiento o de la cuenta
      });
    }

    if (resultadoTransferencia.movimientos.ingreso) {
      const saldo = saldosMap['Ingreso'] || {};
      const mov = resultadoTransferencia.movimientos.ingreso;
      movimientos.push({
        tipo: 'Ingreso',
        id: mov.id,
        monto: mov.monto,
        moneda: mov.moneda,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteOrigen,
        empresa: mov.empresa || mov.cuentaCorrienteOrigen?.empresa // Empresa del movimiento o de la cuenta
      });
    }

    if (resultadoTransferencia.movimientos.itfDestino) {
      const saldo = saldosMap['ITF Destino'] || {};
      const mov = resultadoTransferencia.movimientos.itfDestino;
      movimientos.push({
        tipo: 'ITF Destino',
        id: mov.id,
        monto: mov.monto,
        moneda: mov.moneda,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteOrigen,
        empresa: mov.empresa || mov.cuentaCorrienteOrigen?.empresa // Empresa del movimiento o de la cuenta
      });
    }

    if (resultadoTransferencia.movimientos.comisionDestino) {
      const saldo = saldosMap['Comisión Destino'] || {};
      const mov = resultadoTransferencia.movimientos.comisionDestino;
      movimientos.push({
        tipo: 'Comisión Destino',
        id: mov.id,
        moneda: mov.moneda,
        monto: mov.monto,
        movimiento: mov,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0,
        cuentaObj: mov.cuentaCorrienteOrigen,
        empresa: mov.empresa || mov.cuentaCorrienteOrigen?.empresa // Empresa del movimiento o de la cuenta
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
            style={{ width: '12%', fontWeight: 'bold' }}
          />
          <Column 
            header="Empresa" 
            body={(rowData) => (
              <div>
                {rowData.empresa ? (
                  <Tag 
                    value={rowData.empresa.razonSocial} 
                    severity="info"
                    style={{ fontSize: '0.85rem' }}
                  />
                ) : (
                  <span style={{ color: '#999' }}>N/A</span>
                )}
              </div>
            )}
            style={{ width: '12%' }}
          />
          <Column 
            header="Cuenta" 
            body={(rowData) => {
              const cuenta = rowData.cuentaObj;
              if (!cuenta) {
                return <span style={{ color: '#999' }}>N/A</span>;
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {cuenta.banco?.nombre || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {cuenta.numeroCuenta}
                  </div>
                  {cuenta.moneda && (
                    <Tag 
                      value={cuenta.moneda.codigo} 
                      style={{ 
                        backgroundColor: cuenta.moneda.colorFondo || '#e0e0e0',
                        fontSize: '0.75rem',
                        padding: '2px 6px'
                      }}
                    />
                  )}
                </div>
              );
            }}
            style={{ width: '18%' }}
          />
          <Column 
            field="monto" 
            header="Monto" 
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.monto || 0, 2)}
              </span>
            )}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column 
            field="saldoAnterior" 
            header="Saldo Anterior" 
            body={(rowData) => `${rowData.moneda?.simbolo} ${formatearNumero(rowData.saldoAnterior, 2)}`}
            style={{ width: '12%', textAlign: 'right' }}
          />
          <Column 
            field="ingresos" 
            header="Ingresos" 
            body={(rowData) => (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                +{rowData.moneda?.simbolo} {formatearNumero(rowData.ingresos, 2)}
              </span>
            )}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column 
            field="egresos" 
            header="Egresos" 
            body={(rowData) => (
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                -{rowData.moneda?.simbolo} {formatearNumero(rowData.egresos, 2)}
              </span>
            )}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column 
            field="saldoActual" 
            header="Saldo Actual" 
            body={(rowData) => (
              <span style={{ fontWeight: 'bold', color: '#1976D2' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoActual, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
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
          <Column field="tipo" header="Tipo" style={{ width: '12%', fontWeight: 'bold' }} />
          <Column 
            header="Empresa" 
            body={(rowData) => (
              <div>
                {rowData.empresa ? (
                  <Tag 
                    value={rowData.empresa.razonSocial} 
                    severity="info"
                    style={{ fontSize: '0.85rem' }}
                  />
                ) : (
                  <span style={{ color: '#999' }}>N/A</span>
                )}
              </div>
            )}
            style={{ width: '12%' }}
          />
          <Column field="id" header="ID Asiento" style={{ width: '8%' }} />
          <Column
            field="numeroAsiento"
            header="Nº Asiento"
            style={{ width: '15%', fontWeight: 'bold', color: '#1976D2' }}
          />
          <Column
            field="totalDebe"
            header="Debe"
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalDebe || 0, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
          />
          <Column
            field="totalHaber"
            header="Haber"
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalHaber || 0, 2)}
              </span>
            )}
            style={{ width: '12%', textAlign: 'right' }}
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
