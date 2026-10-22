// src/components/movimientoCaja/PrestamosPagoEspecializado/ConfirmacionPrestamoEntidadDialog.jsx
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
 * CONFIRMACIÓN DE LA OPERACIÓN DE PRÉSTAMO CON ACCIONISTA / TERCERO
 * ════════════════════════════════════════════════════════════
 * Mismo criterio que ConfirmacionOperacionPrestamoDialog. Muestra:
 * - Correlativo de la operación y el préstamo afectado
 * - Movimientos de caja creados (principal, ITF, comisión) con sus saldos
 * - Asientos contables generados (con visor del asiento y voucher contable)
 *
 * Props:
 * - resultado: `data` devuelto por el backend (operacion = DESEMBOLSO | PAGO)
 */
export default function ConfirmacionPrestamoEntidadDialog({ visible, onHide, resultado }) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  if (!resultado) return null;

  const esDesembolso = resultado.operacion === "DESEMBOLSO";
  const recibido = resultado.sentido === "RECIBIDO";
  const prestamo = resultado.prestamo || {};
  const simbolo = prestamo.simbolo || "";
  const accion = esDesembolso ? "Desembolso" : "Devolución";
  const otraParte = recibido ? "Prestamista" : "Deudor";

  const renderHeader = () => (
    <div className="text-center mb-4">
      <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
      <h3 className="mt-3 mb-2">{`¡${accion} de Préstamo Registrado Exitosamente!`}</h3>
      <div className="text-xl">
        <Tag value={`Operación #${resultado.correlativo}`} severity="success" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }} />
      </div>
      <div className="mt-2 text-sm">
        Préstamo <b>{prestamo.numeroPrestamo}</b> - {otraParte} {prestamo.tipoContraparte?.toLowerCase()}: {prestamo.contraparte}
        <Tag value={`La empresa es el ${recibido ? "DEUDOR" : "PRESTAMISTA"}`} severity={recibido ? "warning" : "success"} style={{ marginLeft: 8, fontSize: "0.7rem" }} />
      </div>
    </div>
  );

  const renderPrestamo = () => (
    <Panel header="🤝 Préstamo" className="mb-3">
      <DataTable value={[prestamo]} showGridlines size="small" className="p-datatable-sm">
        <Column field="numeroPrestamo" header="Préstamo" style={{ fontWeight: "bold" }} />
        <Column header={otraParte} body={(p) => `${p.tipoContraparte}: ${p.contraparte}`} />
        <Column header="Monto del Préstamo" body={(p) => `${p.simbolo} ${formatearNumero(p.montoDesembolsado)}`} style={{ textAlign: "right" }} />
        <Column
          header={esDesembolso ? "Capital desembolsado" : "Capital devuelto"}
          body={() => (
            <span style={{ fontWeight: "bold" }}>
              {simbolo} {formatearNumero(resultado.resumen?.monto)}
            </span>
          )}
          style={{ textAlign: "right" }}
        />
        <Column header="Saldo Pendiente" body={(p) => `${p.simbolo} ${formatearNumero(p.saldoCapital)}`} style={{ textAlign: "right" }} />
        <Column
          header="Estado"
          body={() => <Tag value={resultado.resumen?.prestamoCancelado ? "PAGADO" : "VIGENTE"} severity={resultado.resumen?.prestamoCancelado ? "success" : "info"} />}
        />
      </DataTable>
    </Panel>
  );

  const renderMovimientos = () => {
    if (!resultado.movimientos || !resultado.saldosCuentaCorriente) return null;
    const saldosMap = {};
    resultado.saldosCuentaCorriente.forEach((saldo) => {
      saldosMap[saldo.tipo] = saldo;
    });

    // Convención del backend: el movimiento principal guarda la cuenta en cuentaCorrienteDestino;
    // ITF y comisión la guardan en cuentaCorrienteOrigen.
    const tipoPrincipal = resultado.movimientos.principal?.tipoMovimiento?.esIngreso ? "Ingreso" : "Egreso";
    const definiciones = [
      { tipo: tipoPrincipal, clave: "principal", campoCuenta: "cuentaCorrienteDestino" },
      { tipo: "ITF", clave: "itf", campoCuenta: "cuentaCorrienteOrigen" },
      { tipo: "Comisión", clave: "comision", campoCuenta: "cuentaCorrienteOrigen" },
    ];
    const movimientos = definiciones
      .filter((def) => resultado.movimientos[def.clave])
      .map((def) => {
        const mov = resultado.movimientos[def.clave];
        const saldo = saldosMap[def.tipo] || {};
        return {
          tipo: def.tipo,
          id: mov.id,
          monto: mov.monto,
          moneda: mov.moneda,
          saldoAnterior: saldo.saldoAnterior || 0,
          ingresos: saldo.ingresos || 0,
          egresos: saldo.egresos || 0,
          saldoActual: saldo.saldoActual || 0,
          cuentaObj: mov[def.campoCuenta],
        };
      });
    if (movimientos.length === 0) return null;

    return (
      <Panel header="📋 Movimientos de Caja y Saldos" className="mb-3">
        <DataTable value={movimientos} showGridlines size="small" className="p-datatable-sm">
          <Column field="tipo" header="Tipo" style={{ width: "12%", fontWeight: "bold" }} />
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
          <Column header="Monto" body={(r) => <span style={{ fontWeight: "bold" }}>{r.moneda?.simbolo} {formatearNumero(r.monto || 0, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
          <Column header="Saldo Anterior" body={(r) => `${r.moneda?.simbolo} ${formatearNumero(r.saldoAnterior, 2)}`} style={{ width: "14%", textAlign: "right" }} />
          <Column header="Ingresos" body={(r) => <span style={{ color: "#28a745", fontWeight: "bold" }}>+{r.moneda?.simbolo} {formatearNumero(r.ingresos, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
          <Column header="Egresos" body={(r) => <span style={{ color: "#dc3545", fontWeight: "bold" }}>-{r.moneda?.simbolo} {formatearNumero(r.egresos, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
          <Column header="Saldo Actual" body={(r) => <span style={{ fontWeight: "bold", color: "#1976D2" }}>{r.moneda?.simbolo} {formatearNumero(r.saldoActual, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
        </DataTable>
      </Panel>
    );
  };

  const renderAsientosContables = () => {
    const asientos = resultado.asientosContables;
    if (!Array.isArray(asientos) || asientos.length === 0) return null;

    const asientosConTipo = asientos.map((asiento) => {
      const procesoId = Number(asiento.procesoOrigenId);
      let tipo = "Desconocido";
      if (procesoId === Number(resultado.movimientoPrincipalId)) tipo = accion;
      else if (procesoId === Number(resultado.movimientoITFId)) tipo = "ITF";
      else if (procesoId === Number(resultado.movimientoComisionId)) tipo = "Comisión";
      return { ...asiento, tipo };
    });

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <DataTable value={asientosConTipo} showGridlines size="small" className="p-datatable-sm">
          <Column field="tipo" header="Tipo" style={{ width: "16%", fontWeight: "bold" }} />
          <Column field="id" header="ID Asiento" style={{ width: "8%" }} />
          <Column field="numeroAsiento" header="Nº Asiento" style={{ width: "16%", fontWeight: "bold", color: "#1976D2" }} />
          <Column header="Debe" body={(r) => <span style={{ fontWeight: "bold" }}>{r.moneda?.simbolo} {formatearNumero(r.totalDebe || 0, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
          <Column header="Haber" body={(r) => <span style={{ fontWeight: "bold" }}>{r.moneda?.simbolo} {formatearNumero(r.totalHaber || 0, 2)}</span>} style={{ width: "13%", textAlign: "right" }} />
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
        header={`Confirmación de ${accion} de Préstamo con Accionista / Tercero`}
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
        {renderPrestamo()}
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
