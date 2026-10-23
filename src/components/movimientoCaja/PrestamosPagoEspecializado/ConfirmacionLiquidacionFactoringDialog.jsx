// src/components/movimientoCaja/PrestamosPagoEspecializado/ConfirmacionLiquidacionFactoringDialog.jsx
// Confirmación cuando el cliente pagó al banco: no hay movimiento de caja, solo asientos y la cuota cancelada.
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AsientoContableViewer from "../../common/AsientoContableViewer";
import { formatearNumero } from "../../../utils/utils";

export default function ConfirmacionLiquidacionFactoringDialog({ visible, onHide, resultado, simbolo = "" }) {
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  if (!resultado) return null;

  const prestamo = resultado.prestamo || {};
  const cancelado = Number(prestamo.saldoCapital) <= 0;

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Confirmación: el cliente pagó al banco"
        style={{ width: "90vw", maxWidth: "1100px" }}
        footer={<Button label="Cerrar" icon="pi pi-times" onClick={onHide} severity="secondary" />}
        modal
        maximizable
      >
        <div className="text-center mb-4">
          <i className="pi pi-check-circle text-green-500" style={{ fontSize: "4rem" }}></i>
          <h3 className="mt-3 mb-2">¡Cobro del cliente registrado exitosamente!</h3>
          <Tag value="Sin movimiento de caja" severity="info" style={{ fontSize: "1rem", padding: "0.4rem 1rem" }} />
          <div className="mt-2 text-sm">
            Préstamo <b>{prestamo.numeroPrestamo}</b> - saldo de capital {simbolo} {formatearNumero(prestamo.saldoCapital, 2)}
            <Tag value={cancelado ? "CANCELADO" : "VIGENTE"} severity={cancelado ? "success" : "info"} style={{ marginLeft: 8, fontSize: "0.7rem" }} />
          </div>
        </div>

        <Panel header="🧾 Facturas cobradas por el banco" className="mb-3">
          <DataTable value={resultado.facturasLiquidadas || []} showGridlines size="small" className="p-datatable-sm" dataKey="pagoId">
            <Column field="numeroDocumento" header="Factura" style={{ fontWeight: "bold" }} />
            <Column header="Monto" body={(f) => `${simbolo} ${formatearNumero(f.monto, 2)}`} style={{ textAlign: "right" }} />
          </DataTable>
          <div className="flex justify-content-end mt-2">
            <Tag severity="success" style={{ fontSize: "1.1rem", padding: "0.4rem 1rem" }}>
              Total cobrado por el banco: {simbolo} {formatearNumero(resultado.total, 2)}
            </Tag>
          </div>
        </Panel>

        <Panel header="📊 Asientos Contables Generados" className="mb-3">
          <DataTable value={resultado.asientos || []} showGridlines size="small" className="p-datatable-sm" dataKey="id">
            <Column field="id" header="ID Asiento" style={{ width: "10%" }} />
            <Column field="numeroAsiento" header="Nº Asiento" style={{ width: "18%", fontWeight: "bold", color: "#1976D2" }} />
            <Column field="glosa" header="Glosa" />
            <Column header="Debe" body={(a) => `${simbolo} ${formatearNumero(a.totalDebe || 0, 2)}`} style={{ width: "12%", textAlign: "right" }} />
            <Column header="Haber" body={(a) => `${simbolo} ${formatearNumero(a.totalHaber || 0, 2)}`} style={{ width: "12%", textAlign: "right" }} />
            <Column
              header="Acciones"
              body={(a) => <Button icon="pi pi-file-pdf" label="Ver Asiento" size="small" severity="success" outlined onClick={() => setAsientoSeleccionado(a)} />}
              style={{ width: "16%" }}
            />
          </DataTable>
        </Panel>
      </Dialog>

      <Dialog
        visible={Boolean(asientoSeleccionado)}
        onHide={() => setAsientoSeleccionado(null)}
        header={`📊 Asiento Contable - ${asientoSeleccionado?.numeroAsiento || ""}`}
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
        maximizable
      >
        {asientoSeleccionado && <AsientoContableViewer asientoContableId={asientoSeleccionado.id} showHeader={true} />}
      </Dialog>
    </>
  );
}
