// src/components/movimientoCaja/PrestamosPagoEspecializado/DesembolsoFactoringIndirectoForm.jsx
// Desembolso de un factoring indirecto (compras): el proveedor cedió sus facturas al banco. No entra ni sale dinero:
// cada factura de compra de las cuotas se cancela con un pago de medio FACTORING y su deuda pasa a 421203.
// Mismo patrón que el resto de operaciones especializadas de préstamos (Panel, DataTable, confirmación con asientos, toast con el error específico).
import React, { useEffect, useRef, useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { formatearNumero, formatearFecha, getResponsiveFontSize } from "../../../utils/utils";
import { mensajeDeError } from "../../../utils/mensajeError";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { getFacturasParaCuotas, getCronogramaPrestamo } from "../../../api/tesoreria/prestamoBancarios";
import { desembolsarFactoringIndirecto } from "../../../api/tesoreria/operacionPrestamo";
import ConfirmacionDesembolsoFactoringIndirectoDialog from "./ConfirmacionDesembolsoFactoringIndirectoDialog";

const etiqueta = { fontWeight: "bold", fontSize: getResponsiveFontSize() };

export default function DesembolsoFactoringIndirectoForm({ filas = [], onOperacionRegistrada, onCancel, toast }) {
  const fila = filas[0] || {};
  const prestamo = fila.prestamo || {};
  const moneda = fila.moneda || {};
  const esMonedaNacional = Number(moneda.id) === 1;
  const simbolo = moneda.simbolo || "";

  const [fecha, setFecha] = useState(new Date());
  const [tipoCambio, setTipoCambio] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const ultimaConsultaTC = useRef(null);

  // Cuotas del préstamo con los datos de su factura de compra
  useEffect(() => {
    if (!prestamo.id || !fila.empresa?.id || !moneda.id) return;
    setCargando(true);
    Promise.all([
      getCronogramaPrestamo(Number(prestamo.id)),
      getFacturasParaCuotas({ tipo: "COMPRAS", empresaId: Number(fila.empresa.id), monedaId: Number(moneda.id), prestamoId: Number(prestamo.id) }),
    ])
      .then(([cronograma, facturas]) =>
        setCuotas(
          (cronograma || [])
            .filter((c) => c.cuentaPorPagarId)
            .map((c) => {
              const f = (facturas || []).find((x) => String(x.id) === String(c.cuentaPorPagarId));
              return { ...c, factura: f?.numeroDocumento || `CxP ${c.cuentaPorPagarId}`, proveedor: f?.entidad || "" };
            }),
        ),
      )
      .catch((err) => toast?.current?.show({ severity: "error", summary: "No se pudieron cargar las facturas", detail: mensajeDeError(err, "Error al consultar las cuotas del factoring"), life: 8000 }))
      .finally(() => setCargando(false));
  }, [prestamo.id]);

  // Tipo de cambio SUNAT (venta) de la fecha del desembolso, solo en moneda extranjera
  useEffect(() => {
    if (esMonedaNacional || !fecha) return;
    const fechaConsulta = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    if (ultimaConsultaTC.current === fechaConsulta) return;
    consultarTipoCambioSunat({ date: fechaConsulta })
      .then((tc) => {
        if (tc?.sell_price) {
          setTipoCambio(parseFloat(tc.sell_price));
          ultimaConsultaTC.current = fechaConsulta;
        }
      })
      .catch(() => toast?.current?.show({ severity: "error", summary: "Tipo de cambio", detail: "No se pudo obtener el tipo de cambio de SUNAT: ingréselo manualmente.", life: 5000 }));
  }, [fecha, esMonedaNacional]);

  const total = cuotas.reduce((a, c) => a + Number(c.montoCapital || 0), 0);

  const registrar = async () => {
    if (!fecha) return toast?.current?.show({ severity: "warn", summary: "Dato obligatorio", detail: "Indique la fecha del desembolso (canje de las facturas).", life: 5000 });
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) {
      return toast?.current?.show({ severity: "warn", summary: "Dato obligatorio", detail: "Ingrese el tipo de cambio de la fecha del desembolso.", life: 5000 });
    }
    setGuardando(true);
    try {
      const res = await desembolsarFactoringIndirecto({
        prestamoBancarioId: Number(prestamo.id),
        fechaDesembolso: fecha.toISOString(),
        tipoCambio: esMonedaNacional ? 1 : Number(tipoCambio),
      });
      setResultado(res);
      onOperacionRegistrada?.();
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar el desembolso", detail: mensajeDeError(err, "Error al registrar el desembolso del factoring indirecto"), life: 10000 });
    }
    setGuardando(false);
  };

  return (
    <div>
      <Panel header="🏦 Factoring indirecto (compras): canje de las facturas del proveedor" className="mb-3">
        <div className="mb-2" style={{ fontSize: "0.95rem" }}>
          Préstamo <b>{prestamo.numeroPrestamo}</b> · Banco <b>{fila.entidadComercial?.razonSocial}</b> · {fila.empresa?.razonSocial}
          <Tag value="Sin movimiento de caja" severity="info" style={{ marginLeft: 8, fontSize: "0.75rem" }} />
        </div>
        <Message
          severity="info"
          className="mb-3"
          style={{ width: "100%", justifyContent: "flex-start" }}
          text="No entra ni sale dinero: cada factura de compra se cancela con un pago de medio FACTORING y su deuda pasa de 421201 (proveedor) a 421203 (factoring, a favor del banco). Solo quedan por pagar las cuotas."
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ minWidth: 200 }}>
            <label style={etiqueta}>Fecha del desembolso *</label>
            <Calendar value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
          </div>
          {!esMonedaNacional && (
            <div style={{ minWidth: 200 }}>
              <label style={etiqueta}>Tipo de cambio (venta SUNAT) *</label>
              <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={4} maxFractionDigits={4} style={{ width: "100%" }} />
            </div>
          )}
        </div>

        <DataTable value={cuotas} loading={cargando} dataKey="id" showGridlines size="small" stripedRows emptyMessage="El préstamo no tiene cuotas con facturas de compra.">
          <Column field="numeroCuota" header="Cuota" style={{ width: "5rem" }} />
          <Column field="factura" header="Factura de compra" style={{ fontWeight: "bold" }} />
          <Column field="proveedor" header="Proveedor" />
          <Column header="Vence la cuota" body={(c) => formatearFecha(c.fechaVencimiento)} />
          <Column header="Capital" body={(c) => `${simbolo} ${formatearNumero(c.montoCapital, 2)}`} style={{ textAlign: "right" }} />
        </DataTable>
        <div className="flex justify-content-end mt-2">
          <Tag severity="success" style={{ fontSize: "1.1rem", padding: "0.4rem 1rem" }}>
            Total a canjear: {simbolo} {formatearNumero(total, 2)}
          </Tag>
        </div>
      </Panel>

      <div className="flex justify-content-end gap-2">
        <Button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={onCancel} disabled={guardando} />
        <Button type="button" label="Registrar desembolso (sin caja)" icon="pi pi-check" severity="success" onClick={registrar} loading={guardando} disabled={cuotas.length === 0} />
      </div>

      <ConfirmacionDesembolsoFactoringIndirectoDialog
        visible={Boolean(resultado)}
        onHide={() => {
          setResultado(null);
          onCancel?.();
        }}
        resultado={resultado}
        simbolo={simbolo}
      />
    </div>
  );
}
