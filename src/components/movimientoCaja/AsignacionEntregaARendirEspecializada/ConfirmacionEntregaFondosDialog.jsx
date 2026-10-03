// src/components/movimientoCaja/AsignacionEntregaARendirEspecializada/ConfirmacionEntregaFondosDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PDFViewerV2 from "../../pdf/PDFViewerV2";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import { formatearNumero } from "../../../utils/utils";

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: CONFIRMACIÓN DE ENTREGA DE FONDOS (ENTREGA A RENDIR)
 * ════════════════════════════════════════════════════════════
 *
 * Basado en ConfirmacionTransferenciaDialog. Muestra el resultado de la entrega:
 * - Correlativo de operación y datos de la asignación atendida
 * - Movimientos de caja creados (egreso, ITF, comisión) con sus saldos
 * - Asientos contables generados
 * - Voucher consolidado de la entrega
 *
 * Props:
 * - resultadoEntrega: data devuelta por el backend (+ urlVoucherConsolidado si se generó)
 * - asignacion: asignación atendida (la que muestra Tesorería Pendientes)
 */
export default function ConfirmacionEntregaFondosDialog({
  visible,
  onHide,
  resultadoEntrega,
  asignacion,
}) {
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherPdfUrl, setVoucherPdfUrl] = useState(null);
  const [voucherAsientoVisible, setVoucherAsientoVisible] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);

  // ════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════
  const handleVerVoucher = (asiento) => {
    setVoucherPdfUrl(`/api/movimientos-caja/${asiento.procesoOrigenId}/generar-voucher-contable`);
    setShowVoucherDialog(true);
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: ENCABEZADO
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => {
    if (!resultadoEntrega) return null;

    return (
      <div className="text-center mb-4">
        <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
        <h3 className="mt-3 mb-2">¡Entrega de Fondos Procesada Exitosamente!</h3>
        <div className="text-xl">
          <Tag
            value={`Operación #${resultadoEntrega.correlativo}`}
            severity="success"
            style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}
          />
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: ASIGNACIÓN ATENDIDA
  // ════════════════════════════════════════════════════════════
  const renderAsignacion = () => {
    if (!asignacion) return null;

    return (
      <Panel header="📋 Asignación Atendida" className="mb-3">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div className="font-bold">N° Asignación</div>
            <div>ER-{asignacion.origenId}</div>
          </div>
          <div>
            <div className="font-bold">Responsable</div>
            <div>{asignacion.entidadComercial?.razonSocial || "N/A"}</div>
          </div>
          <div>
            <div className="font-bold">Tipo de Movimiento</div>
            <div>{asignacion.tipoMovimiento?.nombre || "N/A"}</div>
          </div>
          <div>
            <div className="font-bold">Monto Asignado</div>
            <div>
              {asignacion.moneda?.simbolo}{" "}
              {formatearNumero(Number(asignacion.montoTotal || asignacion.monto || 0))}
            </div>
          </div>
        </div>
        {asignacion.descripcion && (
          <div className="mt-2">
            <span className="font-bold">Descripción: </span>
            {asignacion.descripcion}
          </div>
        )}
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: MOVIMIENTOS DE CAJA CON SALDOS
  // ════════════════════════════════════════════════════════════
  const renderMovimientos = () => {
    if (!resultadoEntrega?.movimientos || !resultadoEntrega?.saldosCuentaCorriente) return null;

    const saldosMap = {};
    resultadoEntrega.saldosCuentaCorriente.forEach((saldo) => {
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
      .filter((def) => resultadoEntrega.movimientos[def.clave])
      .map((def) => {
        const mov = resultadoEntrega.movimientos[def.clave];
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
                  {cuenta.moneda && (
                    <Tag
                      value={cuenta.moneda.codigo}
                      style={{
                        backgroundColor: cuenta.moneda.colorFondo || "#e0e0e0",
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                      }}
                    />
                  )}
                </div>
              );
            }}
            style={{ width: "24%" }}
          />
          <Column
            field="monto"
            header="Monto"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.monto || 0, 2)}
              </span>
            )}
            style={{ width: "14%", textAlign: "right" }}
          />
          <Column
            field="saldoAnterior"
            header="Saldo Anterior"
            body={(rowData) => `${rowData.moneda?.simbolo} ${formatearNumero(rowData.saldoAnterior, 2)}`}
            style={{ width: "16%", textAlign: "right" }}
          />
          <Column
            field="egresos"
            header="Egresos"
            body={(rowData) => (
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                -{rowData.moneda?.simbolo} {formatearNumero(rowData.egresos, 2)}
              </span>
            )}
            style={{ width: "14%", textAlign: "right" }}
          />
          <Column
            field="saldoActual"
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

  // ════════════════════════════════════════════════════════════
  // RENDER: ASIENTOS CONTABLES
  // ════════════════════════════════════════════════════════════
  const renderAsientosContables = () => {
    const asientos = resultadoEntrega?.asientosContables;
    if (!Array.isArray(asientos) || asientos.length === 0) return null;

    const asientosConTipo = asientos.map((asiento) => {
      let tipo = "Desconocido";
      const procesoId = Number(asiento.procesoOrigenId);

      if (procesoId === Number(resultadoEntrega.movimientoEgresoId)) {
        tipo = "Entrega a Rendir";
      } else if (procesoId === Number(resultadoEntrega.movimientoITFOrigenId)) {
        tipo = "ITF Origen";
      } else if (procesoId === Number(resultadoEntrega.movimientoComisionOrigenId)) {
        tipo = "Comisión Origen";
      }

      return { ...asiento, tipo };
    });

    return (
      <Panel header="📊 Asientos Contables Generados" className="mb-3">
        <div
          className="mb-2 p-2"
          style={{ backgroundColor: "#e3f2fd", borderRadius: "4px", fontSize: "0.9rem" }}
        >
          💡 <strong>Nota:</strong> Use el botón <strong>"Ver Asiento"</strong> para visualizar el
          detalle de cada asiento.
        </div>
        <DataTable value={asientosConTipo} showGridlines size="small" className="p-datatable-sm">
          <Column field="tipo" header="Tipo" style={{ width: "16%", fontWeight: "bold" }} />
          <Column field="id" header="ID Asiento" style={{ width: "8%" }} />
          <Column
            field="numeroAsiento"
            header="Nº Asiento"
            style={{ width: "16%", fontWeight: "bold", color: "#1976D2" }}
          />
          <Column
            field="totalDebe"
            header="Debe"
            body={(rowData) => (
              <span style={{ fontWeight: "bold" }}>
                {rowData.moneda?.simbolo} {formatearNumero(rowData.totalDebe || 0, 2)}
              </span>
            )}
            style={{ width: "13%", textAlign: "right" }}
          />
          <Column
            field="totalHaber"
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
                  tooltip="Ver asiento contable"
                  tooltipOptions={{ position: "top" }}
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
                  tooltipOptions={{ position: "top" }}
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

  // ════════════════════════════════════════════════════════════
  // RENDER: VOUCHER CONSOLIDADO
  // ════════════════════════════════════════════════════════════
  const renderVoucherConsolidado = () => {
    if (!resultadoEntrega?.urlVoucherConsolidado) return null;

    return (
      <>
        <Divider />
        <Panel header="📄 Voucher de la Entrega" className="mb-3">
          <PDFViewerV2
            pdfUrl={resultadoEntrega.urlVoucherConsolidado}
            moduleName="det-movs-entrega-rendir-operacion"
            height="600px"
          />
        </Panel>
      </>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FOOTER
  // ════════════════════════════════════════════════════════════
  const renderFooter = () => (
    <div className="flex justify-content-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" onClick={onHide} severity="secondary" />
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Confirmación de Entrega de Fondos"
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={renderFooter()}
        modal
        maximizable
      >
        {renderHeader()}
        {renderAsignacion()}
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
