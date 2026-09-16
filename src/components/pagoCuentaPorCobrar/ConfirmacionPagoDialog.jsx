// src/components/pagoCuentaPorCobrar/ConfirmacionPagoDialog.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import VerImpresionVoucherPagoCxC from './VerImpresionVoucherPagoCxC';
import PDFViewerV2 from '../pdf/PDFViewerV2';
import PdfComprobanteImpuestoCard from './PdfComprobanteImpuestoCard';

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
  empresas = [],
  toast
}) {
  const [mostrarVouchers, setMostrarVouchers] = useState(false);

  // ✅ REACT HOOK FORM - Estándar profesional
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: {
      urlPagoImpuesto: resultadoPago?.pagoCuentaPorCobrar?.urlPagoImpuesto || null
    }
  });

  // ✅ Actualizar valores cuando cambien
  useEffect(() => {
    if (resultadoPago?.pagoCuentaPorCobrar) {
      setValue('urlPagoImpuesto', resultadoPago.pagoCuentaPorCobrar.urlPagoImpuesto || null);
    }
  }, [resultadoPago?.pagoCuentaPorCobrar?.urlPagoImpuesto, setValue]);


  // Obtener empresa del pago
  const empresa = empresas.find(e =>
    Number(e.id) === Number(resultadoPago?.pagoCuentaPorCobrar?.empresaId)
  );
  // ════════════════════════════════════════════════════════════
  // RENDER: HEADER CONFIRMACIÓN
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => {
    if (!resultadoPago) return null;

    return (
      <div className="text-center mb-4">
        <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
        <h3 className="mt-3 mb-2">¡Pago Procesado Exitosamente!</h3>
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
  // RENDER: RESUMEN DE MONTOS - OPTIMIZADO HORIZONTAL
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

    const items = [
      { label: 'Monto Bruto', value: resumen.montoBruto, severity: 'info' },
      resumen.montoITF > 0 && { label: 'ITF', value: resumen.montoITF, severity: 'warning' },
      resumen.montoComision > 0 && { label: 'Comisión', value: resumen.montoComision, severity: 'warning' },
      resumen.montoDetraccion > 0 && { label: 'Detracción', value: resumen.montoDetraccion, severity: 'warning' },
      { label: 'Neto en Caja', value: resumen.montoNetoCaja, severity: 'success' },
      { label: 'Deuda Cancelada', value: resumen.montoAplicadoDeuda, severity: 'success' },
      { label: 'Saldo Pendiente', value: resumen.saldoPendiente, severity: resumen.saldoPendiente === 0 ? 'success' : 'warning' },
    ].filter(Boolean);

    return (
      <Panel header="💰 Resumen de Montos" className="mb-3">
        <DataTable 
          value={items} 
          showGridlines 
          size="small"
          className="p-datatable-sm"
        >
          <Column 
            field="label" 
            header="Concepto" 
            style={{ width: '40%', fontWeight: 'bold' }}
          />
          <Column 
            field="value" 
            header="Monto" 
            body={(rowData) => (
              <Tag
                value={`${monedaPago?.simbolo || ''} ${Number(rowData.value || 0).toFixed(2)}`}
                severity={rowData.severity}
              />
            )}
            style={{ width: '60%' }}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: MOVIMIENTOS DE CAJA - OPTIMIZADO
  // ════════════════════════════════════════════════════════════
  const renderMovimientos = () => {
    if (!resultadoPago?.movimientos) return null;

    const movimientos = [];

    // Helper para obtener severidad del estado
    const getEstadoSeverity = (estadoNombre) => {
      if (!estadoNombre) return 'secondary';
      const nombre = estadoNombre.toUpperCase();
      if (nombre.includes('VALIDADO')) return 'success';
      if (nombre.includes('ASIENTO')) return 'info';
      if (nombre.includes('PENDIENTE')) return 'warning';
      return 'secondary';
    };

    if (resultadoPago.movimientos.ingreso) {
      movimientos.push({
        tipo: 'Ingreso',
        id: resultadoPago.movimientos.ingreso.id,
        monto: resultadoPago.movimientos.ingreso.monto,
        estado: resultadoPago.movimientos.ingreso.estadoMovimientoCaja?.nombre || 
                resultadoPago.movimientos.ingreso.estadoId || '-',
        observaciones: resultadoPago.movimientos.ingreso.observaciones || '-'
      });
    }

    if (resultadoPago.movimientos.itf) {
      movimientos.push({
        tipo: 'ITF',
        id: resultadoPago.movimientos.itf.id,
        monto: resultadoPago.movimientos.itf.monto,
        estado: resultadoPago.movimientos.itf.estadoMovimientoCaja?.nombre || 
                resultadoPago.movimientos.itf.estadoId || '-',
        observaciones: resultadoPago.movimientos.itf.observaciones || '-'
      });
    }

    if (resultadoPago.movimientos.comision) {
      movimientos.push({
        tipo: 'Comisión',
        id: resultadoPago.movimientos.comision.id,
        monto: resultadoPago.movimientos.comision.monto,
        estado: resultadoPago.movimientos.comision.estadoMovimientoCaja?.nombre || 
                resultadoPago.movimientos.comision.estadoId || '-',
        observaciones: resultadoPago.movimientos.comision.observaciones || '-'
      });
    }

    if (movimientos.length === 0) return null;

    const monedaPago = monedas.find(m =>
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaPagoId)
    );

    return (
      <Panel header="📋 Movimientos de Caja Creados" className="mb-3">
        <DataTable 
          value={movimientos} 
          showGridlines 
          size="small"
          className="p-datatable-sm"
        >
          <Column field="tipo" header="Tipo" style={{ width: '15%' }} />
          <Column field="id" header="ID Mov. Caja" style={{ width: '10%' }} />
          <Column
            field="monto"
            header="Monto"
            body={(rowData) => (
              <Tag
                value={`${monedaPago?.simbolo || ''} ${Number(rowData.monto || 0).toFixed(2)}`}
                severity={rowData.tipo === 'Ingreso' ? 'success' : 'warning'}
              />
            )}
            style={{ width: '20%' }}
          />
          <Column 
            field="estado" 
            header="Estado"
            body={(rowData) => (
              <Tag
                value={rowData.estado}
                severity={getEstadoSeverity(rowData.estado)}
              />
            )}
            style={{ width: '20%' }}
          />
          <Column field="observaciones" header="Observaciones" style={{ width: '35%' }} />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONCEPTOS SUNAT - OPTIMIZADO
  // ════════════════════════════════════════════════════════════
  const renderConceptosSunat = () => {
    if (!resultadoPago?.conceptosSunat) return null;

    const { detraccion, retencion, percepcion } = resultadoPago.conceptosSunat;

    if (!detraccion && !retencion && !percepcion) return null;

    const conceptos = [];
    const monedaPago = monedas.find(m =>
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaPagoId)
    );

    if (detraccion) {
      conceptos.push({
        tipo: 'Detracción',
        id: detraccion.id,
        numeroConstancia: detraccion.numeroConstancia || '-',
        importe: detraccion.importeDetraido,
        estado: detraccion.estado?.nombre || detraccion.estadoDetraccionId || '-'
      });
    }

    if (retencion) {
      conceptos.push({
        tipo: 'Retención',
        id: retencion.id,
        numeroConstancia: retencion.numeroDocumento || '-',
        importe: retencion.importeRetenido,
        estado: retencion.estado?.nombre || retencion.estadoRetencionId || '-'
      });
    }

    if (percepcion) {
      conceptos.push({
        tipo: 'Percepción',
        id: percepcion.id,
        numeroConstancia: percepcion.numeroDocumento || '-',
        importe: percepcion.importePercibido,
        estado: percepcion.estado?.nombre || percepcion.estadoPercepcionId || '-'
      });
    }

    return (
      <Panel header="📄 Conceptos SUNAT Aplicados" className="mb-3">
        <DataTable 
          value={conceptos} 
          showGridlines 
          size="small"
          className="p-datatable-sm"
        >
          <Column field="tipo" header="Tipo" style={{ width: '20%', fontWeight: 'bold' }} />
          <Column field="id" header="ID" style={{ width: '10%' }} />
          <Column field="numeroConstancia" header="N° Constancia" style={{ width: '30%' }} />
          <Column
            field="importe"
            header="Importe"
            body={(rowData) => (
              <Tag
                value={`${monedaPago?.simbolo || ''} ${Number(rowData.importe || 0).toFixed(2)}`}
                severity="contrast"
              />
            )}
            style={{ width: '20%' }}
          />
          <Column 
            field="estado" 
            header="Estado"
            body={(rowData) => (
              <Tag
                value={rowData.estado}
                severity={rowData.estado === 'PAGADO' ? 'success' : 'warning'}
              />
            )}
            style={{ width: '20%' }}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: ASIENTOS CONTABLES GENERADOS
  // ════════════════════════════════════════════════════════════
  const renderAsientosContables = () => {
    if (!resultadoPago?.asientosContables) return null;

    const { pagoCxC, itf, comision } = resultadoPago.asientosContables;

    if (!pagoCxC && !itf && !comision) return null;

    const asientos = [];

    if (pagoCxC) {
      asientos.push({
        tipo: 'Pago CxC',
        numeroAsiento: pagoCxC.numeroAsiento,
        correlativo: pagoCxC.correlativo,
        totalDebe: pagoCxC.totalDebe,
        totalHaber: pagoCxC.totalHaber,
        estaCuadrado: pagoCxC.estaCuadrado
      });
    }

    if (itf) {
      asientos.push({
        tipo: 'ITF',
        numeroAsiento: itf.numeroAsiento,
        correlativo: itf.correlativo,
        totalDebe: itf.totalDebe,
        totalHaber: itf.totalHaber,
        estaCuadrado: itf.estaCuadrado
      });
    }

    if (comision) {
      asientos.push({
        tipo: 'Comisión Bancaria',
        numeroAsiento: comision.numeroAsiento,
        correlativo: comision.correlativo,
        totalDebe: comision.totalDebe,
        totalHaber: comision.totalHaber,
        estaCuadrado: comision.estaCuadrado
      });
    }

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <DataTable value={asientos} size="small">
          <Column field="tipo" header="Tipo" />
          <Column field="numeroAsiento" header="Nº Asiento" />
          <Column field="correlativo" header="Correlativo" />
          <Column
            field="totalDebe"
            header="Total Debe"
            body={(rowData) => Number(rowData.totalDebe || 0).toFixed(2)}
          />
          <Column
            field="totalHaber"
            header="Total Haber"
            body={(rowData) => Number(rowData.totalHaber || 0).toFixed(2)}
          />
          <Column
            field="estaCuadrado"
            header="Estado"
            body={(rowData) => (
              <Tag
                value={rowData.estaCuadrado ? 'Cuadrado' : 'Descuadrado'}
                severity={rowData.estaCuadrado ? 'success' : 'danger'}
              />
            )}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: SALDOS DE CUENTA CORRIENTE
  // ════════════════════════════════════════════════════════════
  const renderSaldosCuentaCorriente = () => {
    if (!resultadoPago?.saldosCuentaCorriente) return null;

    const saldos = resultadoPago.saldosCuentaCorriente;

    if (!saldos || saldos.length === 0) return null;

    return (
      <Panel header="💳 Saldos de Cuenta Corriente Actualizados" className="mb-3">
        <DataTable value={saldos} size="small">
          <Column field="tipo" header="Movimiento" />
          <Column
            field="saldoAnterior"
            header="Saldo Anterior"
            body={(rowData) => Number(rowData.saldoAnterior || 0).toFixed(2)}
          />
          <Column
            field="ingresos"
            header="Ingresos"
            body={(rowData) => (
              <span className="text-green-600 font-bold">
                +{Number(rowData.ingresos || 0).toFixed(2)}
              </span>
            )}
          />
          <Column
            field="egresos"
            header="Egresos"
            body={(rowData) => (
              <span className="text-red-600 font-bold">
                -{Number(rowData.egresos || 0).toFixed(2)}
              </span>
            )}
          />
          <Column
            field="saldoActual"
            header="Saldo Actual"
            body={(rowData) => (
              <Tag
                value={Number(rowData.saldoActual || 0).toFixed(2)}
                severity="info"
                style={{ fontSize: '1rem' }}
              />
            )}
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
          className="p-button-secondary"
        />
      </div>
    );
  };

  // Nota: El backend actualiza automáticamente la BD cuando se sube un PDF.
  // No necesitamos un botón "Guardar" adicional porque:
  // 1. El voucher consolidado ya se guardó al procesar el pago
  // 2. El comprobante de detracción se guarda automáticamente al subirlo
  // Los logs del backend confirmarán si la actualización fue exitosa.

  // ════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="✅ Confirmación de Pago"
      style={{ width: '90vw', maxWidth: '1200px' }}
      modal
      footer={renderFooter()}
    >
      {renderHeader()}
      {renderResumen()}
      {renderMovimientos()}
      {renderConceptosSunat()}
      {renderAsientosContables()}
      {renderSaldosCuentaCorriente()}

      {/* Voucher Consolidado Automático */}
      {resultadoPago?.pagoCuentaPorCobrar?.urlVoucherOperacionConsolidado && (
        <>
          <Divider />
          <Panel header="📄 Voucher Consolidado del Pago" className="mb-3">
            <PDFViewerV2
              pdfUrl={resultadoPago.pagoCuentaPorCobrar.urlVoucherOperacionConsolidado}
              moduleName="pago-cxc-voucher-consolidado"
              height="600px"
            />
            <div className="mt-3 text-center">
              <Button
                label="Descargar Voucher"
                icon="pi pi-download"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultadoPago.urlVoucherConsolidado;
                  link.download = `voucher-consolidado-${resultadoPago.correlativo || 'pago'}.pdf`;
                  link.click();
                }}
                className="p-button-primary"
              />
            </div>
          </Panel>
        </>
      )}

      {/* Comprobante de Pago de Detracción (Opcional) */}
      {(resultadoPago?.movimientos?.autodetraccionSalida?.id || resultadoPago?.movimientos?.autodetraccionIngreso?.id || resultadoPago?.pagoCuentaPorCobrar?.id) && (
        <>
          <Divider />
          <PdfComprobanteImpuestoCard
            movimientoId={resultadoPago.movimientos.autodetraccionSalida?.id || resultadoPago.movimientos.autodetraccionIngreso?.id}
            pagoCuentaPorCobrarId={resultadoPago.pagoCuentaPorCobrar?.id}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={{
              ...resultadoPago.movimientos.autodetraccionSalida,
              ...resultadoPago.movimientos.autodetraccionIngreso,
              ...resultadoPago.pagoCuentaPorCobrar
            }}
            readOnly={false}
          />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* VOUCHERS INDIVIDUALES DE MOVIMIENTOS */}
      {/* ════════════════════════════════════════════════════════════ */}
      {resultadoPago?.movimientos && (
        <>
          <Divider />
          <Panel header="📋 Vouchers Individuales de Movimientos" className="mb-3" toggleable collapsed>
            <div className="grid">
              {/* Voucher del Movimiento de Ingreso */}
              {resultadoPago.movimientos.ingreso?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`💰 Ingreso - Mov. #${resultadoPago.movimientos.ingreso.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.ingreso.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.ingreso.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-ingreso-${resultadoPago.movimientos.ingreso.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de ITF */}
              {resultadoPago.movimientos.itf?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`💳 ITF - Mov. #${resultadoPago.movimientos.itf.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.itf.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.itf.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-itf-${resultadoPago.movimientos.itf.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de Comisión */}
              {resultadoPago.movimientos.comision?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`🏦 Comisión - Mov. #${resultadoPago.movimientos.comision.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.comision.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.comision.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-comision-${resultadoPago.movimientos.comision.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de Autodetracción Salida */}
              {resultadoPago.movimientos.autodetraccionSalida?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`📤 Autodetracción Salida - Mov. #${resultadoPago.movimientos.autodetraccionSalida.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.autodetraccionSalida.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.autodetraccionSalida.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-autodet-salida-${resultadoPago.movimientos.autodetraccionSalida.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de Autodetracción Ingreso */}
              {resultadoPago.movimientos.autodetraccionIngreso?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`📥 Autodetracción Ingreso BN - Mov. #${resultadoPago.movimientos.autodetraccionIngreso.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.autodetraccionIngreso.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.autodetraccionIngreso.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-autodet-ingreso-${resultadoPago.movimientos.autodetraccionIngreso.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de Autodetracción (NUEVO - campo correcto) */}
              {resultadoPago.movimientos.autodetraccion?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`📤 Autodetracción - Mov. #${resultadoPago.movimientos.autodetraccion.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.autodetraccion.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.autodetraccion.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-autodetraccion-${resultadoPago.movimientos.autodetraccion.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* Voucher del Movimiento de Detracción Ingreso (si cliente pagó) */}
              {resultadoPago.movimientos.detraccionIngreso?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`📥 Detracción Ingreso BN - Mov. #${resultadoPago.movimientos.detraccionIngreso.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.detraccionIngreso.urlOperacionIndividualOperacionCaja}
                      moduleName="movimiento-caja-voucher-individual"
                      height="400px"
                    />
                    <div className="mt-2 text-center">
                      <Button
                        label="Descargar"
                        icon="pi pi-download"
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultadoPago.movimientos.detraccionIngreso.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-det-ingreso-${resultadoPago.movimientos.detraccionIngreso.id}.pdf`;
                          link.click();
                        }}
                        className="p-button-sm"
                      />
                    </div>
                  </Panel>
                </div>
              )}
            </div>
          </Panel>
        </>
      )}
    </Dialog>
  );
}