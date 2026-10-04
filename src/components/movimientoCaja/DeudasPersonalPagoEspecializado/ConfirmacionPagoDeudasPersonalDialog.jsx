// src/components/movimientoCaja/DeudasPersonalPagoEspecializado/ConfirmacionPagoDeudasPersonalDialog.jsx
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
 * CONFIRMACIÓN DEL PAGO MÚLTIPLE DE DEUDAS CON PERSONAL
 * ════════════════════════════════════════════════════════════
 *
 * Basado en ConfirmacionEntregaFondosDialog. Muestra:
 * - Correlativo de la operación
 * - Deudas pagadas y cómo se repartió el pago (proporcional al saldo)
 * - Movimientos de caja creados (egreso consolidado, ITF, comisión) con sus saldos
 * - Asientos contables generados
 *
 * Props:
 * - resultadoPago: `data` devuelto por el backend
 * - simbolo: símbolo de la moneda de las deudas (para el reparto)
 */
export default function ConfirmacionPagoDeudasPersonalDialog({
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
      <h3 className="mt-3 mb-2">¡Pago de Deudas del Personal Procesado Exitosamente!</h3>
      <div className="text-xl">
        <Tag
          value={`Operación #${resultadoPago.correlativo}`}
          severity="success"
          style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}
        />
      </div>
    </div>
  );

  // Reparto del pago entre las deudas seleccionadas
  const renderDistribucion = () => {
    const distribucion = resultadoPago?.distribucion;
    if (!Array.isArray(distribucion) || distribucion.length === 0) return null;

    const total = distribucion.reduce((acc, d) => acc + Number(d.montoAplicado || 0), 0);

    return (
      <Panel header="👥 Deudas Pagadas" className="mb-3">
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
          <Column field="personal" header="Personal" style={{ fontWeight: "bold" }} />
          <Column field="tipoDeuda" header="Tipo de Deuda" />
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
      { tipo: "ITF Origen", clave: "itfOrigen", campoCuenta: "cuentaCorrienteOrigen" },
      { tipo: "Comisión Origen", clave: "comisionOrigen", campoCuenta: "cuentaCorrienteOrigen" },
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
            style={{ width: "24%" }}
          />
          <Column
            header="Monto"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.monto || 0, 2)}
              </span>
            )}
            style={{ width: "14%", textAlign: "right" }}
          />
          <Column
            header="Saldo Anterior"
            body={(rowData) => `${rowData.moneda?.simbolo} ${formatearNumero(rowData.saldoAnterior, 2)}`}
            style={{ width: "16%", textAlign: "right" }}
          />
          <Column
            header="Egresos"
            body={(rowData) => (
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                -{rowData.moneda?.simbolo} {formatearNumero(rowData.egresos, 2)}
              </span>
            )}
            style={{ width: "14%", textAlign: "right" }}
          />
          <Column
            header="Saldo Actual"
            body={(rowData) => (
              <span style={{ fontWeight: "bold", color: "#1976D2" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoActual, 2)}
              </span>
            )}
            style={{ width: "16%", textAlign: "right" }}
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
        tipo = "Pago de Deudas";
      } else if (procesoId === Number(resultadoPago.movimientoITFOrigenId)) {
        tipo = "ITF Origen";
      } else if (procesoId === Number(resultadoPago.movimientoComisionOrigenId)) {
        tipo = "Comisión Origen";
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
        header="Confirmación de Pago de Deudas del Personal"
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={renderFooter()}
        modal
        maximizable
      >
        {renderHeader()}
        {renderDistribucion()}
        {renderMovimientos()}
        {renderAsientosContables()}
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
