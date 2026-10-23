// src/components/movimientoCaja/PrestamosPagoEspecializado/LiquidacionFactoringPanel.jsx
// "El cliente pagó al banco": el banco cobró las facturas directamente al cliente, por lo que NO hay movimiento de caja.
// Solo se registra el asiento por factura (DEBE 454911/454912 · HABER 121401/121402) y se cancela la cuota del préstamo.
// La factura ya quedó pagada (canjeada) por el préstamo al desembolsar: aquí solo se registra que el banco la cobró al cliente.
// Se muestra dentro del pago de cuotas de un factoring (OperacionPrestamoForm).
import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { getDetalleFactoring, liquidarFactoring } from "../../../api/tesoreria/operacionPrestamo";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import ConfirmacionLiquidacionFactoringDialog from "./ConfirmacionLiquidacionFactoringDialog";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
// Solo para consultar el TC de SUNAT; lo que se guarda viaja como ISO completo (medianoche local)
const aISO = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");

export default function LiquidacionFactoringPanel({ prestamoId, toast, onRegistrada }) {
  const [detalle, setDetalle] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [fecha, setFecha] = useState(new Date());
  const [tipoCambio, setTipoCambio] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const error = (resumen, err, accion) => toast?.current?.show({ severity: "error", summary: resumen, detail: mensajeDeError(err, accion), life: 10000 });

  const cargarDetalle = async () => {
    setCargando(true);
    try {
      setDetalle(await getDetalleFactoring(Number(prestamoId)));
      setSeleccion([]);
    } catch (err) {
      error("No se pudo cargar el factoring", err, "Error al consultar las facturas del factoring");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (prestamoId) cargarDetalle();
  }, [prestamoId]);

  const simbolo = detalle?.prestamo?.moneda?.simbolo || "";
  const esExtranjera = detalle && Number(detalle.prestamo.moneda?.id) !== 1;

  // TC de venta SUNAT (editable) cuando el factoring no es en soles
  useEffect(() => {
    if (!esExtranjera || !fecha) return;
    consultarTipoCambioSunat({ date: aISO(fecha) })
      .then((tc) => tc?.sell_price && setTipoCambio(parseFloat(tc.sell_price)))
      .catch(() => {});
  }, [esExtranjera, fecha]);

  const registrar = async () => {
    if (seleccion.length === 0) {
      toast?.current?.show({ severity: "error", summary: "Seleccione facturas", detail: "Marque las facturas que el cliente ya pagó al banco.", life: 6000 });
      return;
    }
    if (esExtranjera && !(Number(tipoCambio) > 0)) {
      toast?.current?.show({ severity: "error", summary: "Falta el tipo de cambio", detail: "Ingrese el tipo de cambio de la fecha en que el banco cobró.", life: 6000 });
      return;
    }
    setGuardando(true);
    try {
      const r = await liquidarFactoring({
        prestamoBancarioId: Number(detalle.prestamo.id),
        pagoIds: seleccion.map((f) => Number(f.pagoId)),
        fecha: fecha.toISOString(),
        tipoCambio: esExtranjera ? Number(tipoCambio) : undefined,
      });
      setResultado(r);
      onRegistrada?.(r);
      await cargarDetalle();
    } catch (err) {
      error("No se pudo registrar el cobro del cliente", err, "Error al registrar el cobro del cliente al banco");
    }
    setGuardando(false);
  };

  if (!detalle) return <div>{cargando ? "Cargando facturas del factoring..." : "No se encontró el factoring."}</div>;

  return (
    <div>
      <Message
        severity="info"
        className="mb-3"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text="El cliente pagó al banco: no hay movimiento de caja. Marque las facturas que el banco cobró; se registra el asiento (DEBE obligación del factoring / HABER facturas en descuento) y se cancela la cuota del préstamo."
      />
      <b>
        Préstamo {detalle.prestamo.numeroPrestamo} - {detalle.prestamo.banco} - saldo de capital {simbolo} {formatearNumero(detalle.prestamo.saldoCapital, 2)}
      </b>
      <DataTable
        value={detalle.facturas}
        selection={seleccion}
        onSelectionChange={(e) => setSeleccion(e.value)}
        isDataSelectable={(e) => !e.data.liquidada && !e.data.recomprada}
        dataKey="pagoId"
        loading={cargando}
        size="small"
        stripedRows
        className="mt-2"
      >
        <Column selectionMode="multiple" style={{ width: "3rem" }} />
        <Column field="numeroDocumento" header="Factura" />
        <Column field="cliente" header="Cliente" />
        <Column header="Vencimiento" body={(f) => fechaCorta(f.fechaVencimiento)} />
        <Column header="Monto" body={(f) => `${f.simbolo} ${formatearNumero(f.monto, 2)}`} />
        <Column
          header="Estado"
          body={(f) =>
            f.liquidada ? (
              <Tag value={`COBRADA POR EL BANCO ${fechaCorta(f.fechaLiquidacion)} (${f.asientoLiquidacion})`} severity="success" />
            ) : f.recomprada ? (
              <Tag value="VOLVIÓ A CARTERA (MEGUI pagó al banco)" severity="info" />
            ) : (
              <Tag value="PENDIENTE DE COBRO POR EL BANCO" severity="warning" />
            )
          }
        />
      </DataTable>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 12 }}>
        <div>
          <label style={etiqueta}>Fecha en que el banco cobró *</label>
          <Calendar value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon />
        </div>
        {esExtranjera && (
          <div>
            <label style={etiqueta}>Tipo de cambio *</label>
            <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} />
          </div>
        )}
        <div style={{ fontWeight: "bold" }}>
          Seleccionado: {simbolo} {formatearNumero(seleccion.reduce((a, f) => a + f.monto, 0), 2)}
        </div>
        <Button type="button" label="Registrar cobro del cliente" icon="pi pi-check" severity="success" onClick={registrar} loading={guardando} disabled={seleccion.length === 0} />
      </div>

      <ConfirmacionLiquidacionFactoringDialog visible={Boolean(resultado)} onHide={() => setResultado(null)} resultado={resultado} simbolo={simbolo} />
    </div>
  );
}
