// src/components/pagoCuentaPorPagar/PagoMultipleEspecializado/ConfirmacionPagoMultipleDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PDFViewerV2 from "../../pdf/PDFViewerV2";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import { formatearNumero } from "../../../utils/utils";

/**
 * ════════════════════════════════════════════════════════════
 * CONFIRMACIÓN DEL PAGO MÚLTIPLE DE FACTURAS
 * ════════════════════════════════════════════════════════════
 *
 * Basado en ConfirmacionPagoDeudasTributariasDialog. Muestra:
 * - Correlativo de la operación
 * - Documentos pagados y el monto aplicado a cada uno
 * - Movimientos de caja creados (egreso consolidado, ITF, comisión) con sus saldos
 * - Asientos contables generados
 * - Voucher consolidado de toda la operación
 *
 * No incluye comprobante de impuesto: cada documento tiene el suyo y se registra con
 * el pago individual (detracción, retención y percepción no se pagan en esta operación).
 *
 * Props:
 * - resultadoPago: `data` devuelto por el backend
 * - simbolo: símbolo de la moneda de los documentos
 */
export default function ConfirmacionPagoMultipleDialog({
  visible,
  onHide,
  resultadoPago,
  simbolo = "",
}) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  const handleVerVoucher = (asiento) => {
    setVoucherPdfUrl(`/api/movimientos-caja/${asiento.procesoOrigenId}/generar-voucher-contable`);
    setShowVoucherDialog(true);
  };

  const renderHeader = () => (
    <div className="text-center mb-4">
      <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
      <h3 className="mt-3 mb-2">¡Pago de Facturas Procesado Exitosamente!</h3>
      <div className="text-xl">
        <Tag
          value={`Operación #${resultadoPago.correlativo}`}
          severity="success"
          style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}
        />
      </div>
    </div>
  );

  // Monto aplicado a cada documento
  const renderDistribucion = () => {
    const distribucion = resultadoPago?.distribucion;
    if (!Array.isArray(distribucion) || distribucion.length === 0) return null;

    const total = distribucion.reduce((acc, d) => acc + Number(d.montoAplicado || 0), 0);

    return (
      <Panel header="🧾 Documentos Pagados" className="mb-3">
        <DataTable
          value={distribucion}
          showGridlines
          size="small"
          className="p-datatable-sm"
          footer={
            <div className="flex justify-content-end font-bold">
              TOTAL PAGADO: {simbolo} {formatearNumero(total)}
            </div>
          }
        >
          <Column field="documento" header="Documento" style={{ fontWeight: "bold" }} />
          <Column
            header="Saldo Anterior"
            body={(row) => `${simbolo} ${formatearNumero(row.saldoAnterior)}`}
            style={{ textAlign: "right" }}
          />
          <Column
            header="Monto Aplicado"
            body={(row) => (
              <span style={{ fontWeight: "bold" }}>
                {simbolo} {formatearNumero(row.montoAplicado)}
              </span>
            )}
            style={{ textAlign: "right" }}
          />
          <Column
            header="Nuevo Saldo"
            body={(row) => `${simbolo} ${formatearNumero(row.nuevoSaldo)}`}
            style={{ textAlign: "right" }}
          />
          <Column
            header="Estado"
            body={(row) => (
              <Tag
                value={Number(row.nuevoSaldo) === 0 ? "PAGADO" : "PAGO PARCIAL"}
                severity={Number(row.nuevoSaldo) === 0 ? "success" : "warning"}
              />
            )}
          />
        </DataTable>
        <small className="p-text-secondary block mt-2">
          Un documento queda pagado solo cuando se cancela la totalidad, incluido el impuesto
          (detracción, retención o percepción), que se registra con el pago individual.
        </small>
      </Panel>
    );
  };

  const renderMovimientos = () => {
    if (!resultadoPago?.movimientos || !resultadoPago?.saldosCuentaCorriente) return null;

    const saldosMap = {};
    resultadoPago.saldosCuentaCorriente.forEach((saldo) => {
      saldosMap[saldo.tipo] = saldo;
    });

    // Convención del backend: el egreso guarda la cuenta en cuentaCorrienteDestino;
    // ITF y comisión la guardan en cuentaCorrienteOrigen.
    const definiciones = [
      { tipo: "Egreso", clave: "egreso", campoCuenta: "cuentaCorrienteDestino" },
      { tipo: "ITF", clave: "itf", campoCuenta: "cuentaCorrienteOrigen" },
      { tipo: "Comisión", clave: "comision", campoCuenta: "cuentaCorrienteOrigen" },
    ];

    const movimientos = definiciones
      .filter((def) => resultadoPago.movimientos[def.clave])
      .map((def) => {
        const mov = resultadoPago.movimientos[def.clave];
        const saldo = saldosMap[def.tipo] || {};
        return {
          tipo: def.tipo,
          id: mov.id,
          monto: mov.monto,
          moneda: mov.moneda,
          saldoAnterior: saldo.saldoAnterior || 0,
          egresos: saldo.egresos || 0,
          saldoActual: saldo.saldoActual || 0,
          cuentaObj: mov[def.campoCuenta],
        };
      });

    if (movimientos.length === 0) return null;

    return (
      <Panel header="📋 Movimientos de Caja y Saldos" className="mb-3">
        <DataTable value={movimientos} showGridlines size="small" className="p-datatable-sm">
          <Column field="tipo" header="Tipo" style={{ width: "14%", fontWeight: "bold" }} />
          <Column
            header="Cuenta"
            body={(rowData) => {
              const cuenta = rowData.cuentaObj;
              if (!cuenta) return <span style={{ color: "#999" }}>N/A</span>;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontWeight: "bold" }}>{cuenta.banco?.nombre || "N/A"}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>{cuenta.numeroCuenta}</div>
                </div>
              );
            }}
            style={{ width: "22%" }}
          />
          <Column
            header="Monto"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.monto || 0, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
          />
          <Column
            header="Saldo Anterior"
            body={(rowData) => `${rowData.moneda?.simbolo} ${formatearNumero(rowData.saldoAnterior, 2)}`}
            style={{ width: "14%", textAlign: "right" }}
          />

          <Column
            header="Egresos"
            body={(rowData) => (
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                -{rowData.moneda?.simbolo} {formatearNumero(rowData.egresos, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
          />
          <Column
            header="Saldo Actual"
            body={(rowData) => (
              <span style={{ fontWeight: "bold", color: "#1976D2" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoActual, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
          />
        </DataTable>
      </Panel>
    );
  };

  const renderAsientosContables = () => {
    const asientos = resultadoPago?.asientosContables;
    if (!Array.isArray(asientos) || asientos.length === 0) return null;

    const asientosConTipo = asientos.map((asiento) => {
      let tipo = "Desconocido";
      const procesoId = Number(asiento.procesoOrigenId);

      if (procesoId === Number(resultadoPago.movimientoEgresoId)) {
        tipo = "Pago de Facturas";
      } else if (procesoId === Number(resultadoPago.movimientoITFId)) {
        tipo = "ITF";
      } else if (procesoId === Number(resultadoPago.movimientoComisionId)) {
        tipo = "Comisión";
      }

      return { ...asiento, tipo };
    });

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <DataTable value={asientosConTipo} showGridlines size="small" className="p-datatable-sm">
          <Column field="tipo" header="Tipo" style={{ width: "16%", fontWeight: "bold" }} />
          <Column field="id" header="ID Asiento" style={{ width: "8%" }} />
          <Column
            field="numeroAsiento"
            header="Nº Asiento"
            style={{ width: "16%", fontWeight: "bold", color: "#1976D2" }}
          />
          <Column
            header="Debe"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalDebe || 0, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
          />
          <Column
            header="Haber"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalHaber || 0, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
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
                  onClick={() => {
                    setAsientoSeleccionado(rowData);
                    setVoucherAsientoVisible(true);
                  }}
                />
                <Button
                  icon="pi pi-file-pdf"
                  label="Voucher Contable"
                  className="p-button-help p-button-sm"
                  onClick={() => handleVerVoucher(rowData)}
                />
              </div>
            )}
            style={{ width: "34%" }}
          />
        </DataTable>
      </Panel>
    );
  };

  // Voucher consolidado de toda la operación (se genera y sube automáticamente al pagar)
  const renderVoucherConsolidado = () => {
    if (!resultadoPago?.urlVoucherConsolidado) return null;

    return (
      <Panel header="📄 Voucher Consolidado del Pago" className="mb-3">
        <PDFViewerV2
          pdfUrl={resultadoPago.urlVoucherConsolidado}
          moduleName="pago-cxp-voucher-consolidado"
          height="600px"
        />
      </Panel>
    );
  };

  const renderFooter = () => (
    <div className="flex justify-content-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" onClick={onHide} severity="secondary" />
    </div>
  );

  if (!resultadoPago) return null;

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Confirmación de Pago de Facturas"
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={renderFooter()}
        modal
        maximizable
      >
        {renderHeader()}
        {renderDistribucion()}
        {renderMovimientos()}
        {renderAsientosContables()}
        {renderVoucherConsolidado()}
      </Dialog>

      {/* DIÁLOGO: VER ASIENTO CONTABLE */}
      <Dialog
        visible={voucherAsientoVisible}
        onHide={() => {
          setVoucherAsientoVisible(false);
          setAsientoSeleccionado(null);
        }}
        header={`📊 Voucher Asiento Contable - ${asientoSeleccionado?.numeroAsiento || ""}`}
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
        maximizable
      >
        {asientoSeleccionado && (
          <AsientoContableViewer asientoContableId={asientoSeleccionado.id} showHeader={true} />
        )}
      </Dialog>

      {/* DIÁLOGO: VER VOUCHER CONTABLE EN PDF */}
      <Dialog
        visible={showVoucherDialog}
        onHide={() => {
          setShowVoucherDialog(false);
          setVoucherPdfUrl(null);
        }}
        header="📄 Voucher Contable"
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
        maximizable
      >
        {voucherPdfUrl && <PDFViewerV2 pdfUrl={voucherPdfUrl} height="70vh" />}
      </Dialog>
    </>
  );
}
