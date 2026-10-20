// src/components/tesoreria/letras/LetraCambioFichaDialog.jsx
// Ficha de una letra de cambio: datos, facturas que respalda, pagos con sus movimientos de caja, refinanciación y asientos del canje
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { formatearNumero } from "../../../utils/utils";

const fecha = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");
const Dato = ({ titulo, children }) => (
  <div style={{ flex: "1 1 200px", minWidth: 180 }}>
    <div style={{ fontSize: "0.8rem", color: "#607d8b", fontWeight: "bold" }}>{titulo}</div>
    <div>{children ?? "-"}</div>
  </div>
);
const Seccion = ({ titulo, children }) => (
  <div style={{ marginTop: 16 }}>
    <div style={{ background: "#e3f2fd", padding: "6px 12px", borderRadius: 6, fontWeight: "bold", color: "#1976d2", marginBottom: 8 }}>{titulo}</div>
    {children}
  </div>
);

export default function LetraCambioFichaDialog({ visible, letra, onHide, onPagar, onRefinanciar, onAnularCanje, onRevertirRefinanciacion, permisos = {} }) {
  if (!letra) return null;
  const simbolo = letra.moneda?.simbolo || "";
  const pagar = letra.tipoLetra === "PAGAR";
  const resumen = letra.resumen || {};
  const numeroFactura = (d) =>
    d.cuentaPorPagar?.ordenCompra?.numeroDocumentoFinal || d.cuentaPorPagar?.ordenCompra?.numeroDocumento || d.cuentaPorPagar?.numeroOrdenCompra ||
    d.cuentaPorCobrar?.preFactura?.numeroDocumentoFinal || d.cuentaPorCobrar?.preFactura?.numeroDocumento || d.cuentaPorCobrar?.numeroPreFactura || "-";
  const impuestos = (d) => {
    const c = d.cuentaPorPagar || d.cuentaPorCobrar;
    return [c?.tieneDetraccion && "Detracción", c?.tieneRetencion && "Retención", c?.tienePercepcion && "Percepción"].filter(Boolean).join(", ") || "-";
  };

  return (
    <Dialog header={`Letra de cambio ${letra.numeroDocumento}`} visible={visible} onHide={onHide} style={{ width: "92vw", maxWidth: 1150 }} modal>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {resumen.puedePagar && permisos.puedeEditar !== false && (
          <Button label={pagar ? "Pagar letra" : "Cobrar letra"} icon="pi pi-wallet" onClick={() => onPagar?.(letra)} />
        )}
        {resumen.puedeRefinanciar && permisos.puedeCrear !== false && (
          <Button label="Refinanciar" icon="pi pi-refresh" className="p-button-warning" onClick={() => onRefinanciar?.(letra)} />
        )}
        {resumen.puedeAnularCanje && permisos.puedeEliminar !== false && (
          <Button label="Anular canje" icon="pi pi-undo" className="p-button-danger p-button-outlined" onClick={() => onAnularCanje?.(letra)} />
        )}
        {letra.renovada && permisos.puedeEliminar !== false && (
          <Button label="Revertir refinanciación" icon="pi pi-undo" className="p-button-secondary p-button-outlined" onClick={() => onRevertirRefinanciacion?.(letra)} />
        )}
      </div>

      {letra.protestada && (
        <Message severity="error" className="mb-2" style={{ width: "100%", justifyContent: "flex-start" }} text={`Letra protestada el ${fecha(letra.fechaProtesto)}. ${letra.motivoProtesto || ""}`} />
      )}

      <Seccion titulo="Datos de la letra">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Dato titulo="Tipo">{pagar ? "Por pagar (compras)" : "Por cobrar (ventas)"}</Dato>
          <Dato titulo="Estado"><Tag value={letra.estado?.descripcion} severity={letra.estado?.severityColor || "info"} /></Dato>
          <Dato titulo="Empresa">{letra.empresa?.razonSocial}</Dato>
          <Dato titulo={pagar ? "Beneficiario (proveedor)" : "Girado (cliente)"}>{pagar ? letra.beneficiario?.razonSocial : letra.girado?.razonSocial}</Dato>
          <Dato titulo="Aval">{letra.aval?.razonSocial}</Dato>
          <Dato titulo="Fecha de emisión">{fecha(letra.fechaEmision)}</Dato>
          <Dato titulo="Vencimiento">{fecha(letra.fechaVencimiento)}</Dato>
          <Dato titulo="Fecha límite de protesto (7 días hábiles)">{fecha(letra.fechaLimiteProtesto)}</Dato>
          <Dato titulo="Monto de la letra">{simbolo} {formatearNumero(letra.montoOriginal, 2)}</Dato>
          <Dato titulo="Capital pagado">{simbolo} {formatearNumero(resumen.capitalPagado, 2)}</Dato>
          <Dato titulo="Saldo de capital"><b>{simbolo} {formatearNumero(resumen.saldoCapital, 2)}</b></Dato>
          <Dato titulo="Intereses pagados">{simbolo} {formatearNumero(resumen.interesPagado, 2)}</Dato>
          <Dato titulo="Mora pagada">{simbolo} {formatearNumero(resumen.moraPagada, 2)}</Dato>
          <Dato titulo="Observaciones">{letra.observaciones}</Dato>
        </div>
      </Seccion>

      <Seccion titulo={`Facturas que respalda (${letra.documentos?.length || 0})`}>
        <DataTable value={letra.documentos || []} size="small" stripedRows emptyMessage="Esta letra no respalda facturas (registro manual).">
          <Column header="Factura" body={numeroFactura} />
          <Column header="Canjeado en esta letra" body={(d) => `${simbolo} ${formatearNumero(d.montoCanjeado, 2)}`} />
          <Column header="Capital pagado" body={(d) => `${simbolo} ${formatearNumero(d.capitalPagado, 2)}`} />
          <Column header="Impuestos pendientes de la factura" body={impuestos} />
        </DataTable>
      </Seccion>

      <Seccion titulo={`Pagos registrados (${letra.pagos?.length || 0})`}>
        <DataTable
          value={letra.pagos || []}
          size="small"
          stripedRows
          emptyMessage="Aún no tiene pagos."
          rowExpansionTemplate={(p) => (
            <DataTable value={p.movimientos || []} size="small">
              <Column header="Mov." body={(m) => `#${m.id}`} />
              <Column header="Tipo" body={(m) => m.tipoMovimiento?.nombre} />
              <Column header="Cuenta" body={(m) => { const c = m.cuentaCorrienteDestino || m.cuentaCorrienteOrigen; return c ? `${c.banco?.nombre || ""} ${c.numeroCuenta || ""}` : "-"; }} />
              <Column header="Medio de pago" body={(m) => m.medioPago?.nombre} />
              <Column header="N° operación banco" field="numeroOperacionPagoBanco" />
              <Column header="Monto" body={(m) => `${m.moneda?.simbolo || ""} ${formatearNumero(m.monto, 2)}`} />
            </DataTable>
          )}
          expandedRows={(letra.pagos || []).filter((p) => p.movimientos?.length > 0).reduce((a, p) => ({ ...a, [p.id]: true }), {})}
          dataKey="id"
        >
          <Column header="Fecha" body={(p) => fecha(p.fechaPago)} />
          <Column header="Operación" body={(p) => (p.refOperacionEspecializadaMovCaja ? `#${p.refOperacionEspecializadaMovCaja}` : "-")} />
          <Column header="Capital" body={(p) => `${simbolo} ${formatearNumero(p.montoCapital, 2)}`} />
          <Column header="Interés" body={(p) => `${simbolo} ${formatearNumero(p.montoInteres, 2)}`} />
          <Column header="Mora" body={(p) => `${simbolo} ${formatearNumero(p.montoMora, 2)}`} />
          <Column header="Movido en caja" body={(p) => `${p.moneda?.simbolo || ""} ${formatearNumero(p.montoPago, 2)}`} />
          <Column header="T/C" body={(p) => (p.tipoCambio ? Number(p.tipoCambio).toFixed(4) : "-")} />
          <Column header="Medio de pago" body={(p) => p.medioPago?.nombre} />
        </DataTable>
        {(letra.pagos?.length || 0) > 0 && <small>Un pago se revierte desde Tesorería (Operaciones): se restituye el saldo de la letra.</small>}
      </Seccion>

      {(letra.letraRenovada || letra.renovaciones?.length > 0) && (
        <Seccion titulo="Refinanciación">
          {letra.letraRenovada && <div>Esta letra nació de la refinanciación de la letra <b>{letra.letraRenovada.numeroDocumento}</b>.</div>}
          {letra.renovaciones?.length > 0 && (
            <DataTable value={letra.renovaciones} size="small" stripedRows>
              <Column field="numeroDocumento" header="Letra nueva" />
              <Column header="Vencimiento" body={(r) => fecha(r.fechaVencimiento)} />
              <Column header="Monto" body={(r) => `${simbolo} ${formatearNumero(r.montoOriginal, 2)}`} />
              <Column header="Saldo" body={(r) => `${simbolo} ${formatearNumero(r.saldoCapital, 2)}`} />
              <Column header="Estado" body={(r) => <Tag value={r.estado?.descripcion} severity={r.estado?.severityColor || "info"} />} />
            </DataTable>
          )}
        </Seccion>
      )}

      {letra.asientosCanje?.length > 0 && (
        <Seccion titulo="Asientos del canje">
          <DataTable value={letra.asientosCanje} size="small" stripedRows>
            <Column field="numeroAsiento" header="N° asiento" />
            <Column header="Fecha" body={(a) => fecha(a.fechaAsiento)} />
            <Column field="glosa" header="Glosa" />
            <Column header="Importe" body={(a) => formatearNumero(a.totalDebe, 2)} />
          </DataTable>
        </Seccion>
      )}
    </Dialog>
  );
}
