// src/components/movimientoCaja/GastoBancarioEspecializado/ConfirmacionGastoBancarioDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PDFViewerV2 from "../../pdf/PDFViewerV2";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import BotonRevertirOperacion from "../reversionOperacion/BotonRevertirOperacion";
import { formatearNumero } from "../../../utils/utils";

/**
 * ════════════════════════════════════════════════════════════
 * CONFIRMACIÓN DEL REGISTRO DE GASTOS BANCARIOS
 * ════════════════════════════════════════════════════════════
 * Mismo criterio que ConfirmacionPrestamoEntidadDialog / ConfirmacionOperacionPrestamoDialog. Muestra:
 * - Correlativo de la operación, cuenta y total
 * - Movimientos de caja creados (un egreso por gasto) con sus saldos en cascada
 * - Asientos contables generados (con visor del asiento y voucher contable)
 * - Botón para revertir la operación completa
 *
 * Props:
 * - resultado: `data` devuelto por el backend
 */
export default function ConfirmacionGastoBancarioDialog({ visible, onHide, resultado }) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  if (!resultado) return null;

  const simbolo = resultado.cuenta?.moneda?.simbolo || "";
  const lineas = resultado.lineas || [];

  const renderHeader = () => (
    <div className="text-center mb-4">
      <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
      <h3 className="mt-3 mb-2">¡Gastos Bancarios Registrados Exitosamente!</h3>
      <div className="text-xl">
        <Tag value={`Operación #${resultado.correlativo}`} severity="success" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }} />
      </div>
      <div className="mt-2 text-sm">
        {resultado.empresa?.razonSocial} - {resultado.cuenta?.banco} CTA. {resultado.cuenta?.numeroCuenta}
        <Tag
          value={resultado.resumen?.esGerencial ? "GERENCIAL" : "FISCAL"}
          severity={resultado.resumen?.esGerencial ? "warning" : "success"}
          style={{ marginLeft: 8, fontSize: "0.7rem" }}
        />
      </div>
    </div>
  );

  const renderGastos = () => (
    <Panel header="🏦 Gastos del Banco" className="mb-3">
      <DataTable value={lineas} showGridlines size="small" className="p-datatable-sm" dataKey="movimientoCajaId">
        <Column header="Concepto" field="etiqueta" style={{ fontWeight: "bold" }} />
        <Column header="Cuenta de Gasto" field="cuentaGasto" style={{ width: "14%", textAlign: "center" }} />
        <Column header="Monto" body={(l) => <span style={{ fontWeight: "bold" }}>{simbolo} {formatearNumero(l.monto, 2)}</span>} style={{ width: "16%", textAlign: "right" }} />
      </DataTable>
      <div className="flex justify-content-end mt-2">
        <Tag severity="danger" style={{ fontSize: "1.1rem", padding: "0.4rem 1rem" }}>
          Total debitado: {simbolo} {formatearNumero(resultado.resumen?.total, 2)}
        </Tag>
      </div>
    </Panel>
  );

  const renderMovimientos = () => {
    const movimientos = lineas.filter((l) => l.movimiento);
    if (movimientos.length === 0) return null;
    return (
      <Panel header="📋 Movimientos de Caja y Saldos" className="mb-3">
        <DataTable value={movimientos} showGridlines size="small" className="p-datatable-sm" dataKey="movimientoCajaId">
          <Column header="Tipo" body={(l) => <span style={{ fontWeight: "bold" }}>Egreso · {l.etiqueta}</span>} style={{ width: "22%" }} />
          <Column header="ID Mov." body={(l) => l.movimiento.id} style={{ width: "7%" }} />
          <Column
            header="Cuenta"
            body={(l) => {
              const cuenta = l.movimiento.cuentaCorrienteOrigen;
              if (!cuenta) return <span style={{ color: "#999" }}>N/A</span>;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontWeight: "bold" }}>{cuenta.banco?.nombre || "N/A"}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>{cuenta.numeroCuenta}</div>
                </div>
              );
            }}
            style={{ width: "18%" }}
          />
          <Column header="Monto" body={(l) => <span style={{ fontWeight: "bold" }}>{l.movimiento.moneda?.simbolo} {formatearNumero(l.monto, 2)}</span>} style={{ width: "11%", textAlign: "right" }} />
          <Column header="Saldo Anterior" body={(l) => `${l.movimiento.moneda?.simbolo} ${formatearNumero(l.saldo.saldoAnterior, 2)}`} style={{ width: "12%", textAlign: "right" }} />
          <Column header="Ingresos" body={(l) => <span style={{ color: "#28a745", fontWeight: "bold" }}>+{l.movimiento.moneda?.simbolo} {formatearNumero(l.saldo.ingresos, 2)}</span>} style={{ width: "10%", textAlign: "right" }} />
          <Column header="Egresos" body={(l) => <span style={{ color: "#dc3545", fontWeight: "bold" }}>-{l.movimiento.moneda?.simbolo} {formatearNumero(l.saldo.egresos, 2)}</span>} style={{ width: "10%", textAlign: "right" }} />
          <Column header="Saldo Actual" body={(l) => <span style={{ fontWeight: "bold", color: "#1976D2" }}>{l.movimiento.moneda?.simbolo} {formatearNumero(l.saldo.saldoActual, 2)}</span>} style={{ width: "10%", textAlign: "right" }} />
        </DataTable>
      </Panel>
    );
  };

  const renderAsientosContables = () => {
    const asientos = lineas.filter((l) => l.asiento).map((l) => ({ ...l.asiento, tipo: l.etiqueta }));
    if (asientos.length === 0) return null;
    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <DataTable value={asientos} showGridlines size="small" className="p-datatable-sm" dataKey="id">
          <Column field="tipo" header="Concepto" style={{ width: "22%", fontWeight: "bold" }} />
          <Column field="id" header="ID Asiento" style={{ width: "8%" }} />
          <Column field="numeroAsiento" header="Nº Asiento" style={{ width: "14%", fontWeight: "bold", color: "#1976D2" }} />
          <Column header="Debe" body={(r) => <span style={{ fontWeight: "bold" }}>{simbolo} {formatearNumero(r.totalDebe || 0, 2)}</span>} style={{ width: "11%", textAlign: "right" }} />
          <Column header="Haber" body={(r) => <span style={{ fontWeight: "bold" }}>{simbolo} {formatearNumero(r.totalHaber || 0, 2)}</span>} style={{ width: "11%", textAlign: "right" }} />
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
                  onClick={() => {
                    setVoucherPdfUrl(`/api/movimientos-caja/${rowData.procesoOrigenId}/generar-voucher-contable`);
                    setShowVoucherDialog(true);
                  }}
                />
              </div>
            )}
            style={{ width: "34%" }}
          />
        </DataTable>
      </Panel>
    );
  };

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Confirmación de Gastos Bancarios"
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <BotonRevertirOperacion resultado={resultado} onRevertida={onHide} />
            <Button label="Cerrar" icon="pi pi-times" onClick={onHide} severity="secondary" />
          </div>
        }
        modal
        maximizable
      >
        {renderHeader()}
        {renderGastos()}
        {renderMovimientos()}
        {renderAsientosContables()}
      </Dialog>

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
        {asientoSeleccionado && <AsientoContableViewer asientoContableId={asientoSeleccionado.id} showHeader={true} />}
      </Dialog>

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
