// src/components/pagoCuentaPorCobrar/ConfirmacionPagoDialog.jsx
import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: CONFIRMACIÓN DE PAGO ESPECIALIZADO
 * ════════════════════════════════════════════════════════════
 * 
 * Muestra el resultado del pago procesado:
 * - Correlativo de operación
 * - Resumen de montos
 * - Movimientos de caja creados
 * - Conceptos SUNAT aplicados
 * - Enlaces a vouchers PDF
 */

export default function ConfirmacionPagoDialog({
  visible,
  onHide,
  resultadoPago,
  cuentaPorCobrar,
  monedas = [],
  toast
}) {
  // ════════════════════════════════════════════════════════════
  // RENDER: HEADER CONFIRMACIÓN
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => {
    if (!resultadoPago) return null;

    return (
      <div className="text-center mb-4">
        <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
        <h2 className="mt-3 mb-2">¡Pago Procesado Exitosamente!</h2>
        <div className="text-xl">
          <Tag 
            value={`Operación #${resultadoPago.correlativo}`}
            severity="success"
            style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
          />
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: RESUMEN DE MONTOS
  // ════════════════════════════════════════════════════════════
  const renderResumen = () => {
    if (!resultadoPago?.resumen) return null;

    const { resumen } = resultadoPago;
    const monedaPago = monedas.find(m => 
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaPagoId)
    );
    const monedaDeuda = monedas.find(m => 
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaDeudaId)
    );

    return (
      <Panel header="💰 Resumen de Montos" className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">Monto Bruto:</label>
              <div>
                <Tag 
                  value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoBruto || 0).toFixed(2)}`}
                  severity="info"
                />
              </div>
            </div>
          </div>

          {resumen.montoITF > 0 && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">ITF:</label>
                <div>
                  <Tag 
                    value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoITF || 0).toFixed(2)}`}
                    severity="warning"
                  />
                </div>
              </div>
            </div>
          )}

          {resumen.montoComision > 0 && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Comisión:</label>
                <div>
                  <Tag 
                    value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoComision || 0).toFixed(2)}`}
                    severity="warning"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">Monto Neto en Caja:</label>
              <div>
                <Tag 
                  value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoNetoCaja || 0).toFixed(2)}`}
                  severity="success"
                />
              </div>
            </div>
          </div>

          {resumen.montoDetraccion > 0 && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Detracción:</label>
                <div>
                  <Tag 
                    value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoDetraccion || 0).toFixed(2)}`}
                    severity="contrast"
                  />
                </div>
              </div>
            </div>
          )}

          {resumen.montoRetencion > 0 && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Retención:</label>
                <div>
                  <Tag 
                    value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoRetencion || 0).toFixed(2)}`}
                    severity="contrast"
                  />
                </div>
              </div>
            </div>
          )}

          {resumen.montoPercepcion > 0 && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Percepción:</label>
                <div>
                  <Tag 
                    value={`${monedaPago?.simbolo || ''} ${Number(resumen.montoPercepcion || 0).toFixed(2)}`}
                    severity="contrast"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <Divider />
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold text-lg">Deuda Cancelada:</label>
              <div>
                <Tag 
                  value={`${monedaDeuda?.simbolo || ''} ${Number(resumen.deudaCancelada || 0).toFixed(2)}`}
                  severity="success"
                  style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold text-lg">Saldo Pendiente:</label>
              <div>
                <Tag 
                  value={`${monedaDeuda?.simbolo || ''} ${Number(resumen.saldoPendiente || 0).toFixed(2)}`}
                  severity={Number(resumen.saldoPendiente || 0) > 0 ? 'warning' : 'success'}
                  style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: MOVIMIENTOS DE CAJA
  // ════════════════════════════════════════════════════════════
  const renderMovimientos = () => {
    if (!resultadoPago?.movimientos) return null;

    const movimientos = [];
    
    if (resultadoPago.movimientos.ingreso) {
      movimientos.push({
        tipo: 'Ingreso',
        id: resultadoPago.movimientos.ingreso.id,
        monto: resultadoPago.movimientos.ingreso.monto,
        observaciones: resultadoPago.movimientos.ingreso.observaciones
      });
    }

    if (resultadoPago.movimientos.itf) {
      movimientos.push({
        tipo: 'ITF',
        id: resultadoPago.movimientos.itf.id,
        monto: resultadoPago.movimientos.itf.monto,
        observaciones: resultadoPago.movimientos.itf.observaciones
      });
    }

    if (resultadoPago.movimientos.comision) {
      movimientos.push({
        tipo: 'Comisión',
        id: resultadoPago.movimientos.comision.id,
        monto: resultadoPago.movimientos.comision.monto,
        observaciones: resultadoPago.movimientos.comision.observaciones
      });
    }

    if (movimientos.length === 0) return null;

    return (
      <Panel header="📋 Movimientos de Caja Creados" className="mb-3">
        <DataTable value={movimientos} size="small">
          <Column field="tipo" header="Tipo" />
          <Column field="id" header="ID" />
          <Column 
            field="monto" 
            header="Monto" 
            body={(rowData) => Number(rowData.monto || 0).toFixed(2)}
          />
          <Column field="observaciones" header="Observaciones" />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONCEPTOS SUNAT
  // ════════════════════════════════════════════════════════════
  const renderConceptosSunat = () => {
    if (!resultadoPago?.conceptosSunat) return null;

    const { detraccion, retencion, percepcion } = resultadoPago.conceptosSunat;

    if (!detraccion && !retencion && !percepcion) return null;

    return (
      <Panel header="📄 Conceptos SUNAT Creados" className="mb-3">
        <div className="grid">
          {detraccion && (
            <div className="col-12">
              <div className="field">
                <label className="font-bold">Detracción:</label>
                <div className="ml-3">
                  <div>ID: {detraccion.id}</div>
                  <div>Número Constancia: {detraccion.numeroConstancia}</div>
                  <div>Importe Detraído: {Number(detraccion.importeDetraido || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {retencion && (
            <div className="col-12">
              <div className="field">
                <label className="font-bold">Retención:</label>
                <div className="ml-3">
                  <div>ID: {retencion.id}</div>
                  <div>Número Documento: {retencion.numeroDocumento}</div>
                  <div>Importe Retenido: {Number(retencion.importeRetenido || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {percepcion && (
            <div className="col-12">
              <div className="field">
                <label className="font-bold">Percepción:</label>
                <div className="ml-3">
                  <div>ID: {percepcion.id}</div>
                  <div>Número Documento: {percepcion.numeroDocumento}</div>
                  <div>Importe Percibido: {Number(percepcion.importePercibido || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
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
          className="p-button-secondary"
        />
        <Button
          label="Imprimir Voucher"
          icon="pi pi-print"
          onClick={() => {
            toast?.current?.show({
              severity: 'info',
              summary: 'Información',
              detail: 'Funcionalidad de impresión de voucher en desarrollo.',
              life: 3000
            });
          }}
          className="p-button-primary"
        />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="✅ Confirmación de Pago"
      style={{ width: '90vw', maxWidth: '900px' }}
      modal
      footer={renderFooter()}
    >
      {renderHeader()}
      {renderResumen()}
      {renderMovimientos()}
      {renderConceptosSunat()}
    </Dialog>
  );
}