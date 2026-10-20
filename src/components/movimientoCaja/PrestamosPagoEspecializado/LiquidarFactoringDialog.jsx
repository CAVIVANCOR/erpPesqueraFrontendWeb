// src/components/movimientoCaja/PrestamosPagoEspecializado/LiquidarFactoringDialog.jsx
// Liquidación de un factoring por el cobro de sus facturas: la entidad cobra directo al cliente (con recurso),
// por lo que no hay movimiento de caja. Asiento por factura: DEBE 454911/454912 · HABER 121401/121402.
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import {
  getPrestamosFactoring,
  getDetalleFactoring,
  liquidarFactoring,
  anularLiquidacionFactoring,
} from "../../../api/tesoreria/operacionPrestamo";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aISO = (f) => (f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null);
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");

export default function LiquidarFactoringDialog({ visible, onHide, toast, onSuccess }) {
  const [prestamos, setPrestamos] = useState([]);
  const [prestamo, setPrestamo] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [fecha, setFecha] = useState(new Date());
  const [tipoCambio, setTipoCambio] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const error = (resumen, err, accion) => toast?.current?.show({ severity: "error", summary: resumen, detail: mensajeDeError(err, accion), life: 10000 });

  const cargarPrestamos = async () => {
    setCargando(true);
    try {
      setPrestamos(await getPrestamosFactoring());
    } catch (err) {
      error("No se pudieron cargar los factorings", err, "Error al consultar los préstamos de factoring");
    }
    setCargando(false);
  };

  const cargarDetalle = async (fila) => {
    setCargando(true);
    try {
      setDetalle(await getDetalleFactoring(Number(fila.id)));
      setSeleccion([]);
    } catch (err) {
      error("No se pudo cargar el factoring", err, "Error al consultar las facturas del factoring");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (!visible) return;
    setPrestamo(null);
    setDetalle(null);
    setSeleccion([]);
    setFecha(new Date());
    setTipoCambio(null);
    cargarPrestamos();
  }, [visible]);

  const esExtranjera = detalle && Number(detalle.prestamo.moneda?.id) !== 1;

  // TC de venta SUNAT (editable) cuando el factoring no es en soles
  useEffect(() => {
    if (!esExtranjera || !fecha) return;
    consultarTipoCambioSunat({ date: aISO(fecha) })
      .then((tc) => tc?.sell_price && setTipoCambio(parseFloat(tc.sell_price)))
      .catch(() => {});
  }, [esExtranjera, fecha]);

  const liquidar = async () => {
    if (seleccion.length === 0) {
      toast?.current?.show({ severity: "error", summary: "Seleccione facturas", detail: "Marque las facturas que la entidad ya cobró.", life: 6000 });
      return;
    }
    if (esExtranjera && !(Number(tipoCambio) > 0)) {
      toast?.current?.show({ severity: "error", summary: "Falta el tipo de cambio", detail: "Ingrese el tipo de cambio de la fecha de cobro.", life: 6000 });
      return;
    }
    setGuardando(true);
    try {
      const r = await liquidarFactoring({
        prestamoBancarioId: Number(detalle.prestamo.id),
        pagoIds: seleccion.map((f) => Number(f.pagoId)),
        fecha: aISO(fecha),
        tipoCambio: esExtranjera ? Number(tipoCambio) : undefined,
      });
      toast?.current?.show({
        severity: "success",
        summary: "Factoring liquidado",
        detail: `${r.facturasLiquidadas.length} factura(s) por ${formatearNumero(r.total, 2)}. Asientos: ${r.asientos.map((a) => a.numeroAsiento).join(", ")}. Saldo del préstamo: ${formatearNumero(r.prestamo.saldoCapital, 2)}.`,
        life: 9000,
      });
      onSuccess?.(r);
      await cargarDetalle(detalle.prestamo);
      await cargarPrestamos();
    } catch (err) {
      error("No se pudo liquidar el factoring", err, "Error al liquidar el factoring");
    }
    setGuardando(false);
  };

  const anular = (factura) => {
    confirmDialog({
      header: "Anular liquidación",
      icon: "pi pi-exclamation-triangle",
      message: `Se anulará la liquidación de la factura ${factura.numeroDocumento}: se elimina su asiento y se restituye la deuda del préstamo. ¿Desea continuar?`,
      acceptLabel: "Sí, anular",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await anularLiquidacionFactoring(Number(factura.pagoId));
          toast?.current?.show({ severity: "success", summary: "Liquidación anulada", detail: `La factura ${factura.numeroDocumento} vuelve a estar pendiente de liquidar.`, life: 7000 });
          await cargarDetalle(detalle.prestamo);
          await cargarPrestamos();
          onSuccess?.();
        } catch (err) {
          error("No se pudo anular la liquidación", err, "Error al anular la liquidación");
        }
      },
    });
  };

  return (
    <Dialog header="Liquidación de factoring por cobro de la factura" visible={visible} onHide={onHide} style={{ width: "92vw", maxWidth: 1100 }} modal>
      <Message
        severity="info"
        className="mb-3"
        style={{ width: "100%", justifyContent: "flex-start" }}
        text="Cuando la entidad de factoring cobra la factura al cliente (con recurso), se cancela la obligación contra las facturas en descuento. No hay movimiento de caja. Las cuotas del préstamo deben ser solo capital."
      />

      {!detalle ? (
        <DataTable
          value={prestamos}
          selection={prestamo}
          onSelectionChange={(e) => {
            setPrestamo(e.value);
            if (e.value) cargarDetalle(e.value);
          }}
          selectionMode="single"
          dataKey="id"
          loading={cargando}
          size="small"
          stripedRows
          emptyMessage="No hay préstamos de factoring desembolsados con facturas entregadas."
        >
          <Column field="numeroPrestamo" header="Préstamo" />
          <Column header="Empresa" body={(p) => p.empresa?.razonSocial} />
          <Column field="banco" header="Entidad" />
          <Column header="Saldo de capital" body={(p) => `${p.moneda?.simbolo} ${formatearNumero(p.saldoCapital, 2)}`} />
          <Column field="facturas" header="Facturas" />
          <Column field="pendientesDeLiquidar" header="Por liquidar" />
        </DataTable>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b>
              Préstamo {detalle.prestamo.numeroPrestamo} - {detalle.prestamo.banco} - saldo {detalle.prestamo.moneda?.simbolo} {formatearNumero(detalle.prestamo.saldoCapital, 2)}
            </b>
            <Button label="Cambiar préstamo" icon="pi pi-arrow-left" className="p-button-text" onClick={() => { setDetalle(null); setPrestamo(null); }} />
          </div>
          <DataTable
            value={detalle.facturas}
            selection={seleccion}
            onSelectionChange={(e) => setSeleccion(e.value)}
            isDataSelectable={(e) => !e.data.liquidada && !e.data.recomprada}
            dataKey="pagoId"
            loading={cargando}
            size="small"
            stripedRows
          >
            <Column selectionMode="multiple" style={{ width: "3rem" }} />
            <Column field="numeroDocumento" header="Factura" />
            <Column field="cliente" header="Cliente" />
            <Column header="Vencimiento" body={(f) => fechaCorta(f.fechaVencimiento)} />
            <Column header="Monto" body={(f) => `${f.simbolo} ${formatearNumero(f.monto, 2)}`} />
            <Column
              header="Estado"
              body={(f) =>
                f.liquidada ? <Tag value={`LIQUIDADA ${fechaCorta(f.fechaLiquidacion)} (${f.asientoLiquidacion})`} severity="success" /> : f.recomprada ? <Tag value="VOLVIÓ A CARTERA (MEGUI pagó la cuota)" severity="info" /> : <Tag value="POR LIQUIDAR" severity="warning" />
              }
            />
            <Column
              style={{ width: "5rem" }}
              body={(f) => f.liquidada && <Button icon="pi pi-undo" className="p-button-text p-button-danger" tooltip="Anular liquidación" onClick={() => anular(f)} />}
            />
          </DataTable>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 12 }}>
            <div>
              <label style={etiqueta}>Fecha de cobro *</label>
              <Calendar value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon />
            </div>
            {esExtranjera && (
              <div>
                <label style={etiqueta}>Tipo de cambio *</label>
                <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} />
              </div>
            )}
            <div style={{ fontWeight: "bold" }}>
              Seleccionado: {detalle.prestamo.moneda?.simbolo} {formatearNumero(seleccion.reduce((a, f) => a + f.monto, 0), 2)}
            </div>
            <Button label="Liquidar facturas" icon="pi pi-check" onClick={liquidar} loading={guardando} disabled={seleccion.length === 0} />
          </div>
        </>
      )}
    </Dialog>
  );
}
