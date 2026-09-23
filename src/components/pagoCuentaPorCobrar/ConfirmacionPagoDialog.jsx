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
import PDFViewerV2 from '../pdf/PDFViewerV2';
import PdfComprobanteImpuestoCard from './PdfComprobanteImpuestoCard';
import AsientoContableViewer from '../common/AsientoContableViewer';
import { formatearNumero } from '../../utils/utils';

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
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  
  // Estados para visualización de vouchers
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);

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
  // HANDLERS: VER ASIENTO Y VOUCHER
  // ════════════════════════════════════════════════════════════
  
  /**
   * Abre el diálogo para ver el voucher contable en PDF
   * Usa el endpoint de generación de voucher del movimiento
   */
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
  // RENDER: MOVIMIENTOS DE CAJA CON SALDOS - UNIFICADO
  // ════════════════════════════════════════════════════════════
  const renderMovimientos = () => {
    if (!resultadoPago?.movimientos || !resultadoPago?.saldosCuentaCorriente) return null;

    const movimientos = [];
    const saldosMap = {};

    // Crear mapa de saldos por tipo
    resultadoPago.saldosCuentaCorriente.forEach(saldo => {
      saldosMap[saldo.tipo] = saldo;
    });

    if (resultadoPago.movimientos.ingreso) {
      const saldo = saldosMap['Ingreso'] || {};
      movimientos.push({
        tipo: 'Ingreso',
        id: resultadoPago.movimientos.ingreso.id,
        monto: resultadoPago.movimientos.ingreso.monto,
        movimiento: resultadoPago.movimientos.ingreso, // ✅ Objeto completo para acceder a relaciones
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0
      });
    }

    if (resultadoPago.movimientos.itf) {
      const saldo = saldosMap['ITF'] || {};
      movimientos.push({
        tipo: 'ITF',
        id: resultadoPago.movimientos.itf.id,
        monto: resultadoPago.movimientos.itf.monto,
        movimiento: resultadoPago.movimientos.itf, // ✅ Objeto completo para acceder a relaciones
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0
      });
    }

    if (resultadoPago.movimientos.comision) {
      const saldo = saldosMap['Comisión'] || {};
      movimientos.push({
        tipo: 'Comisión',
        id: resultadoPago.movimientos.comision.id,
        monto: resultadoPago.movimientos.comision.monto,
        movimiento: resultadoPago.movimientos.comision, // ✅ Objeto completo para acceder a relaciones
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0
      });
    }

    // ✅ AUTODETRACCIÓN EGRESO (Cuenta Empresa)
    if (resultadoPago.movimientos.autodetraccionEgreso) {
      const saldo = saldosMap['Autodetracción (Egreso)'] || {};
      movimientos.push({
        tipo: 'Autodetracción (Egreso)',
        id: resultadoPago.movimientos.autodetraccionEgreso.id,
        monto: resultadoPago.movimientos.autodetraccionEgreso.monto,
        movimiento: resultadoPago.movimientos.autodetraccionEgreso,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0
      });
    }

    // ✅ AUTODETRACCIÓN INGRESO (Banco Nación)
    if (resultadoPago.movimientos.autodetraccionIngreso) {
      const saldo = saldosMap['Autodetracción (Ingreso)'] || {};
      movimientos.push({
        tipo: 'Autodetracción (Ingreso)',
        id: resultadoPago.movimientos.autodetraccionIngreso.id,
        monto: resultadoPago.movimientos.autodetraccionIngreso.monto,
        movimiento: resultadoPago.movimientos.autodetraccionIngreso,
        saldoAnterior: saldo.saldoAnterior || 0,
        ingresos: saldo.ingresos || 0,
        egresos: saldo.egresos || 0,
        saldoActual: saldo.saldoActual || 0
      });
    }

    if (movimientos.length === 0) return null;

    const monedaPago = monedas.find(m =>
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaPagoId)
    );

    return (
      <Panel header="📋 Movimientos de Caja y Saldos de Cuenta Corriente" className="mb-3">
        <DataTable 
          value={movimientos} 
          showGridlines 
          size="small"
          className="p-datatable-sm"
        >
          <Column field="tipo" header="Tipo" style={{ width: '10%', fontWeight: 'bold' }} />
          <Column field="id" header="ID Mov. Caja" style={{ width: '5%' }} />
          <Column
            field="monto"
            header="Monto"
            body={(rowData) => (
              <Tag
                value={`${monedaPago?.simbolo || ''} ${Number(rowData.monto || 0).toFixed(2)}`}
                severity={rowData.tipo === 'Ingreso' ? 'success' : 'warning'}
              />
            )}
            style={{ width: '10%' }}
          />
          <Column 
            field="cuentaCorriente" 
            header="Cuenta Corriente" 
            body={(rowData) => {
              if (!rowData.movimiento) return '-';
              
              const cuentaOrigen = rowData.movimiento.cuentaCorrienteOrigen;
              const cuentaDestino = rowData.movimiento.cuentaCorrienteDestino;
              const cuenta = cuentaDestino || cuentaOrigen;
              
              if (!cuenta) return '-';
              
              const tipoCuenta = cuenta.tipoCuentaCorriente?.nombre || 'S/T';
              const banco = cuenta.banco?.nombre || 'S/B';
              const moneda = cuenta.moneda?.codigoSunat || 'N/A';
              const descripcion = cuenta.descripcion || 'Sin descripción';
              const numero = cuenta.numeroCuenta || 'Sin número';
              
              return (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                  {/* 🔵 TIPO CUENTA */}
                  <span style={{ color: '#50b1b8', fontWeight: "600", fontSize: "0.85rem" }}>
                    {tipoCuenta}
                  </span>
                  
                  {/* 🔵 BANCO */}
                  <span style={{ color: '#1976D2', fontWeight: "600", fontSize: "0.85rem" }}>
                    {banco}
                  </span>
                  <span style={{ color: '#666' }}> - </span>

                  {/* 🟢 MONEDA */}
                  <span style={{ color: '#2E7D32', fontWeight: "600", fontSize: "0.85rem" }}>
                    {moneda}
                  </span>
                  <span style={{ color: '#666' }}> - </span>

                  {/* 🟡 DESCRIPCIÓN */}
                  <span style={{ color: '#F57C00', fontWeight: "500", fontSize: "0.85rem" }}>
                    {descripcion}
                  </span>
                  <span style={{ color: '#666' }}> - </span>

                  {/* 🔴 NÚMERO DE CUENTA */}
                  <span style={{ color: '#D32F2F', fontWeight: "bold", fontSize: "0.85rem" }}>
                    {numero}
                  </span>
                </span>
              );
            }}
            style={{ width: '25%' }} 
          />
          <Column
            field="saldoAnterior"
            header="Saldo Anterior"
            body={(rowData) => formatearNumero(rowData.saldoAnterior || 0, 2)}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column
            field="ingresos"
            header="Ingresos"
            body={(rowData) => (
              <span className="text-green-600 font-bold">
                +{formatearNumero(rowData.ingresos || 0, 2)}
              </span>
            )}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column
            field="egresos"
            header="Egresos"
            body={(rowData) => (
              <span className="text-red-600 font-bold">
                -{formatearNumero(rowData.egresos || 0, 2)}
              </span>
            )}
            style={{ width: '10%', textAlign: 'right' }}
          />
          <Column
            field="saldoActual"
            header="Saldo Actual"
            body={(rowData) => (
              <Tag
                value={formatearNumero(rowData.saldoActual || 0, 2)}
                severity="info"
              />
            )}
            style={{ width: '10%' }}
          />
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
      // ✅ CORRECCIÓN: Usar importePagado (monto de autodetracción) en lugar de importeDetraido (monto total requerido)
      const montoDetraccion = detraccion.importePagado || detraccion.importeDetraido || 0;
      
      conceptos.push({
        tipo: 'Detracción',
        id: detraccion.id,
        numeroConstancia: detraccion.numeroDocumento || detraccion.numeroConstancia || '-',
        importe: montoDetraccion
      });
    }

    if (retencion) {
      conceptos.push({
        tipo: 'Retención',
        id: retencion.id,
        numeroConstancia: retencion.numeroDocumento || '-',
        importe: retencion.importeRetenido
      });
    }

    if (percepcion) {
      conceptos.push({
        tipo: 'Percepción',
        id: percepcion.id,
        numeroConstancia: percepcion.numeroDocumento || '-',
        importe: percepcion.importePercibido
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
          <Column field="id" header="ID" style={{ width: '15%' }} />
          <Column field="numeroConstancia" header="N° Constancia" style={{ width: '40%' }} />
          <Column
            field="importe"
            header="Importe"
            body={(rowData) => (
              <Tag
                value={`${monedaPago?.simbolo || ''} ${Number(rowData.importe || 0).toFixed(2)}`}
                severity="contrast"
              />
            )}
            style={{ width: '25%' }}
          />
        </DataTable>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: ASIENTOS CONTABLES GENERADOS
  // ════════════════════════════════════════════════════════════
  const renderAsientosContables = () => {
    if (!resultadoPago?.asientosContables || !Array.isArray(resultadoPago.asientosContables)) return null;

    const asientos = resultadoPago.asientosContables;

    if (asientos.length === 0) return null;

    // 🔍 DEBUG: Ver qué asientos y movimientos llegaron
    console.log('📊 DEBUG Asientos Contables:');
    console.log('  Total asientos recibidos:', asientos.length);
    console.log('  IDs asientos:', asientos.map(a => a.id));
    console.log('  procesoOrigenId de asientos:', asientos.map(a => a.procesoOrigenId));
    console.log('  Movimientos disponibles:', {
      ingreso: resultadoPago.movimientos.ingreso?.id,
      itf: resultadoPago.movimientos.itf?.id,
      comision: resultadoPago.movimientos.comision?.id,
      autodetraccionEgreso: resultadoPago.movimientos.autodetraccionEgreso?.id,
      autodetraccionIngreso: resultadoPago.movimientos.autodetraccionIngreso?.id
    });

    const monedaPago = monedas.find(m =>
      Number(m.id) === Number(resultadoPago.pagoCuentaPorCobrar?.monedaPagoId)
    );

    // Mapear asientos con tipo según el movimiento relacionado
    const asientosConTipo = asientos.map((asiento) => {
      let tipo = 'Desconocido';
      
      // Buscar el movimiento relacionado por procesoOrigenId
      if (resultadoPago.movimientos.ingreso && Number(asiento.procesoOrigenId) === Number(resultadoPago.movimientos.ingreso.id)) {
        tipo = 'Ingreso';
      } else if (resultadoPago.movimientos.itf && Number(asiento.procesoOrigenId) === Number(resultadoPago.movimientos.itf.id)) {
        tipo = 'ITF';
      } else if (resultadoPago.movimientos.comision && Number(asiento.procesoOrigenId) === Number(resultadoPago.movimientos.comision.id)) {
        tipo = 'Comisión';
      } else if (resultadoPago.movimientos.autodetraccionEgreso && Number(asiento.procesoOrigenId) === Number(resultadoPago.movimientos.autodetraccionEgreso.id)) {
        tipo = 'Autodetracción (Egreso)';
      } else if (resultadoPago.movimientos.autodetraccionIngreso && Number(asiento.procesoOrigenId) === Number(resultadoPago.movimientos.autodetraccionIngreso.id)) {
        tipo = 'Autodetracción (Ingreso)';
      }

      return {
        ...asiento,
        tipo
      };
    });

    // 🔍 DEBUG: Ver tipos asignados
    console.log('  Tipos asignados:', asientosConTipo.map(a => ({ id: a.id, tipo: a.tipo, procesoOrigenId: a.procesoOrigenId })));

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <div className="mb-2 p-2" style={{ backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9rem' }}>
          💡 <strong>Nota:</strong> Use los botones <strong>"Ver"</strong> y <strong>"Voucher"</strong> para visualizar el detalle de cada asiento.
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
                {monedaPago?.simbolo || ''} {formatearNumero(rowData.totalDebe || 0, 2)}
              </span>
            )}
            style={{ width: '15%', textAlign: 'right' }}
          />
          <Column
            field="totalHaber"
            header="Haber"
            body={(rowData) => (
              <span style={{ fontWeight: 'bold' }}>
                {monedaPago?.simbolo || ''} {formatearNumero(rowData.totalHaber || 0, 2)}
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
                  label="Voucher"
                  className="p-button-help p-button-sm"
                  tooltip="Ver voucher contable en PDF"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => handleVerVoucher(rowData)}
                />
              </div>
            )}
            style={{ width: '15%' }}
          />
          <Column
            header="Voucher"
            body={(rowData) => (
              <Button
                icon="pi pi-file-pdf"
                label="Ver Voucher"
                size="small"
                severity="success"
                outlined
                tooltip="Ver voucher del asiento contable"
                tooltipOptions={{ position: 'top' }}
                onClick={() => {
                  setAsientoSeleccionado(rowData);
                  setVoucherAsientoVisible(true);
                }}
              />
            )}
            style={{ width: '12%' }}
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

      <Divider />

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
      {(resultadoPago?.movimientos?.autodetraccionEgreso?.id || resultadoPago?.movimientos?.autodetraccionIngreso?.id || resultadoPago?.pagoCuentaPorCobrar?.id) && (
        <>
          <Divider />
          <PdfComprobanteImpuestoCard
            movimientoId={resultadoPago.movimientos.autodetraccionEgreso?.id || resultadoPago.movimientos.autodetraccionIngreso?.id}
            pagoCuentaPorCobrarId={resultadoPago.pagoCuentaPorCobrar?.id}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={{
              ...resultadoPago.movimientos.autodetraccionEgreso,
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
              {resultadoPago.movimientos.autodetraccionEgreso?.urlOperacionIndividualOperacionCaja && (
                <div className="col-12 md:col-6">
                  <Panel header={`📤 Autodetracción Egreso - Mov. #${resultadoPago.movimientos.autodetraccionEgreso.id}`} className="mb-3">
                    <PDFViewerV2
                      pdfUrl={resultadoPago.movimientos.autodetraccionEgreso.urlOperacionIndividualOperacionCaja}
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
                          link.href = resultadoPago.movimientos.autodetraccionEgreso.urlOperacionIndividualOperacionCaja;
                          link.download = `voucher-autodet-egreso-${resultadoPago.movimientos.autodetraccionEgreso.id}.pdf`;
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

      {/* Modal para ver voucher del asiento contable */}
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
      {/* DIÁLOGO: VER VOUCHER CONTABLE EN PDF                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog
        visible={showVoucherDialog}
        onHide={() => {
          setShowVoucherDialog(false);
          setVoucherPdfUrl(null);
        }}
        header="📄 Voucher Contable"
        style={{ width: '95vw', maxWidth: '1200px' }}
        modal
        maximizable
        blockScroll
      >
        {voucherPdfUrl && (
          <PDFViewerV2
            pdfUrl={voucherPdfUrl}
            height="80vh"
          />
        )}
      </Dialog>
    </Dialog>
  );
}