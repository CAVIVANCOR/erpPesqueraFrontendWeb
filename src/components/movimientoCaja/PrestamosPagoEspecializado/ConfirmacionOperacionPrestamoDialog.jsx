// src/components/movimientoCaja/PrestamosPagoEspecializado/ConfirmacionOperacionPrestamoDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PDFViewerV2 from "../../pdf/PDFViewerV2";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import { formatearNumero, ESTADO_CUOTA_PRESTAMO } from "../../../utils/utils";

/**
 * ════════════════════════════════════════════════════════════
 * CONFIRMACIÓN DE LA OPERACIÓN DE PRÉSTAMO (pago de cuotas o desembolso)
 * ════════════════════════════════════════════════════════════
 *
 * Basado en ConfirmacionCobroMultipleDialog. Muestra:
 * - Correlativo de la operación
 * - Pago de cuotas: cuota, monto aplicado, mora, nuevo saldo y estado
 *   Desembolso: préstamo y monto desembolsado
 * - Movimientos de caja creados (principal, ITF, comisión) con sus saldos
 * - Asientos contables generados
 *
 * Props:
 * - resultado: `data` devuelto por el backend (operacion = PAGO_CUOTAS | DESEMBOLSO)
 * - simbolo: símbolo de la moneda del préstamo
 */
export default function ConfirmacionOperacionPrestamoDialog({
  visible,
  onHide,
  resultado,
  simbolo = "",
}) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  if (!resultado) return null;

  const esDesembolso = resultado.operacion === "DESEMBOLSO";

  const handleVerVoucher = (asiento) => {
    setVoucherPdfUrl(`/api/movimientos-caja/${asiento.procesoOrigenId}/generar-voucher-contable`);
    setShowVoucherDialog(true);
  };

  const renderHeader = () => (
    <div className="text-center mb-4">
      <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
      <h3 className="mt-3 mb-2">
        {esDesembolso
          ? "¡Desembolso de Préstamo Registrado Exitosamente!"
          : "¡Pago de Cuotas Procesado Exitosamente!"}
      </h3>
      <div className="text-xl">
        <Tag
          value={`Operación #${resultado.correlativo}`}
          severity="success"
          style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}
        />
      </div>
      <div className="mt-2 text-sm">
        Préstamo <b>{resultado.prestamo?.numeroPrestamo}</b> - {resultado.prestamo?.banco}
        {resultado.caso === "FACTORING" && (
          <Tag value="FACTORING" severity="info" style={{ marginLeft: 8, fontSize: "0.7rem" }} />
        )}
      </div>
    </div>
  );

  // Pago de cuotas: monto aplicado y mora de cada cuota
  const renderCuotas = () => {
    const distribucion = resultado.distribucion;
    if (esDesembolso || !Array.isArray(distribucion) || distribucion.length === 0) return null;

    const totalAplicado = distribucion.reduce((acc, d) => acc + Number(d.montoAplicado || 0), 0);
    const totalMora = distribucion.reduce((acc, d) => acc + Number(d.mora || 0), 0);

    return (
      <Panel header="🏦 Cuotas Pagadas" className="mb-3">
        <DataTable
          value={distribucion}
          showGridlines
          size="small"
          className="p-datatable-sm"
          footer={
            <div className="flex justify-content-end font-bold">
              TOTAL PAGADO: {simbolo} {formatearNumero(totalAplicado + totalMora)}
              {totalMora > 0 && ` (incluye mora ${simbolo} ${formatearNumero(totalMora)})`}
            </div>
          }
        >
          <Column field="documento" header="Cuota" style={{ fontWeight: "bold" }} />
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
            header="Mora"
            body={(row) => `${simbolo} ${formatearNumero(row.mora)}`}
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
                value={Number(row.estadoCuotaId) === Number(ESTADO_CUOTA_PRESTAMO.PAGADO) ? "PAGADO" : "PAGO PARCIAL"}
                severity={Number(row.estadoCuotaId) === Number(ESTADO_CUOTA_PRESTAMO.PAGADO) ? "success" : "warning"}
              />
            )}
          />
        </DataTable>
        <small className="p-text-secondary block mt-2">
          El pago se imputa en este orden: comisión, seguro, interés y capital.
        </small>
      </Panel>
    );
  };

  const renderMovimientos = () => {
    if (!resultado.movimientos || !resultado.saldosCuentaCorriente) return null;

    const saldosMap = {};
    resultado.saldosCuentaCorriente.forEach((saldo) => {
      saldosMap[saldo.tipo] = saldo;
    });

    // Convención del backend: el movimiento principal guarda la cuenta en cuentaCorrienteDestino;
    // ITF y comisión la guardan en cuentaCorrienteOrigen.
    const tipoPrincipal = esDesembolso ? "Ingreso" : "Egreso";
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
            header="Ingresos"
            body={(rowData) => (
              <span style={{ color: "#28a745", fontWeight: "bold" }}>
                +{rowData.moneda?.simbolo} {formatearNumero(rowData.ingresos, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
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
    const asientos = resultado.asientosContables;
    if (!Array.isArray(asientos) || asientos.length === 0) return null;

    const asientosConTipo = asientos.map((asiento) => {
      let tipo = "Desconocido";
      const procesoId = Number(asiento.procesoOrigenId);

      if (procesoId === Number(resultado.movimientoPrincipalId)) {
        tipo = esDesembolso ? "Desembolso" : "Pago de Cuotas";
      } else if (procesoId === Number(resultado.movimientoITFId)) {
        tipo = "ITF";
      } else if (procesoId === Number(resultado.movimientoComisionId)) {
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

  const renderFooter = () => (
    <div className="flex justify-content-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" onClick={onHide} severity="secondary" />
    </div>
  );

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header={esDesembolso ? "Confirmación de Desembolso de Préstamo" : "Confirmación de Pago de Cuotas"}
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={renderFooter()}
        modal
        maximizable
      >
        {renderHeader()}
        {renderCuotas()}
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
