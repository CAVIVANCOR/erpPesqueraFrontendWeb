// src/components/movimientoCaja/PrestamosPagoEspecializado/PrestamoEntidadDialog.jsx
// Operaciones de Tesorería de préstamos con accionistas y terceros (solo capital, sin intereses):
//   - Nuevo préstamo (desembolso): RECIBIDO = ingreso de caja, OTORGADO = egreso de caja.
//   - Pago (préstamo recibido: egreso) o cobro (préstamo otorgado: ingreso) del capital.
// El banco del asiento es la cuenta contable de la cuenta corriente elegida.
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import EntidadComercialSelector from "../../common/EntidadComercialSelector";
import { getPrestamosEntidadVigentes, desembolsarPrestamoEntidad, pagarPrestamoEntidad } from "../../../api/tesoreria/prestamosEntidad";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aISO = (f) => (f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null);
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");
const MODOS = [
  { label: "Nuevo préstamo", value: "DESEMBOLSO" },
  { label: "Pagar / cobrar un préstamo", value: "PAGO" },
];
const SENTIDOS = [
  { label: "Recibido (la empresa es la deudora)", value: "RECIBIDO" },
  { label: "Otorgado (la empresa es la acreedora)", value: "OTORGADO" },
];
const CONTRAPARTES = [
  { label: "Accionista", value: true },
  { label: "Tercero", value: false },
];

export default function PrestamoEntidadDialog({ visible, onHide, onSuccess, toast, mediosPago = [], tiposMovimiento = [], empresas = [] }) {
  const [modo, setModo] = useState("DESEMBOLSO");
  const [empresaId, setEmpresaId] = useState(null);
  const [sentido, setSentido] = useState("RECIBIDO");
  const [esAccionista, setEsAccionista] = useState(true);
  const [entidadId, setEntidadId] = useState(null);
  const [vigentes, setVigentes] = useState([]);
  const [prestamo, setPrestamo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [fecha, setFecha] = useState(new Date());
  const [fechaVencimiento, setFechaVencimiento] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);
  const [monto, setMonto] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [itf, setItf] = useState(0);
  const [comision, setComision] = useState(0);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [resultado, setResultado] = useState(null);

  const esPago = modo === "PAGO";
  const sentidoOperacion = esPago ? prestamo?.sentido : sentido;
  const contraparteEsAccionista = esPago ? prestamo?.esAccionista : esAccionista;
  // Ingreso: recibir un préstamo nuevo o cobrar uno otorgado. Egreso: otorgar un préstamo nuevo o pagar uno recibido.
  const esIngreso = esPago ? sentidoOperacion === "OTORGADO" : sentidoOperacion === "RECIBIDO";

  const reiniciar = () => {
    setFecha(new Date());
    setFechaVencimiento(null);
    setCuenta(null);
    setMedioPagoId(null);
    setTipoMovimientoId(null);
    setMonto(0);
    setTipoCambio(null);
    setItf(0);
    setComision(0);
    setNumeroOperacion("");
    setDescripcion("");
    setObservaciones("");
  };

  useEffect(() => {
    if (!visible) return;
    setResultado(null);
    setPrestamo(null);
    reiniciar();
  }, [visible, modo]);

  useEffect(() => {
    if (!visible || !esPago || !empresaId) {
      setVigentes([]);
      return;
    }
    setCargando(true);
    getPrestamosEntidadVigentes({ empresaId })
      .then(setVigentes)
      .catch((err) => toast?.current?.show({ severity: "error", summary: "No se pudieron cargar los préstamos", detail: mensajeDeError(err, "Error al consultar los préstamos vigentes"), life: 8000 }))
      .finally(() => setCargando(false));
    setPrestamo(null);
  }, [visible, esPago, empresaId]);

  const seleccionarPrestamo = (p) => {
    setPrestamo(p);
    setMonto(p ? Number(p.saldoCapital) : 0);
    setCuenta(null);
    setTipoMovimientoId(null);
  };

  const monedaId = esPago ? Number(prestamo?.monedaId || 0) : Number(cuenta?.moneda?.id || 0);
  const simbolo = esPago ? prestamo?.simbolo || "" : cuenta?.moneda?.simbolo || "";
  const extranjera = monedaId > 1;
  const tiposDisponibles = useMemo(() => {
    const patron = contraparteEsAccionista ? /ACCIONISTA/i : /TERCERO/i;
    return tiposMovimiento
      .filter((t) => t.activo !== false && Boolean(t.esIngreso) === esIngreso)
      .sort((a, b) => Number(patron.test(b.nombre)) - Number(patron.test(a.nombre)) || a.nombre.localeCompare(b.nombre))
      .map((t) => ({ label: t.nombre, value: Number(t.id) }));
  }, [tiposMovimiento, esIngreso, contraparteEsAccionista]);

  const validar = () => {
    if (!esPago) {
      if (!empresaId) return "Seleccione la empresa del préstamo.";
      if (!entidadId) return `Seleccione el ${esAccionista ? "accionista" : "tercero"} del préstamo.`;
    } else if (!prestamo) return "Seleccione el préstamo al que se aplica el pago o cobro.";
    if (!fecha) return "Indique la fecha de la operación.";
    if (!cuenta) return `Seleccione la cuenta bancaria ${esIngreso ? "a donde entra" : "de donde sale"} el dinero.`;
    if (Number(cuenta.empresaId) !== Number(empresaId)) return "La cuenta seleccionada no es de la empresa del préstamo.";
    if (esPago && Number(cuenta.moneda?.id) !== monedaId) return `La cuenta está en ${cuenta.moneda?.simbolo} y el préstamo en ${simbolo}: elija una cuenta en la moneda del préstamo.`;
    if (!medioPagoId) return "Seleccione el medio de pago.";
    if (!tipoMovimientoId) return "Seleccione el tipo de movimiento.";
    if (!(Number(monto) > 0)) return "El monto debe ser mayor a cero.";
    if (esPago && Number(monto) > Number(prestamo.saldoCapital) + 0.01) return `El monto (${formatearNumero(monto, 2)}) excede el saldo pendiente del préstamo (${formatearNumero(prestamo.saldoCapital, 2)}).`;
    if (extranjera && !(Number(tipoCambio) > 0)) return "Ingrese el tipo de cambio de la fecha de la operación (el préstamo está en moneda extranjera).";
    if (!esPago && fechaVencimiento && fechaVencimiento < fecha) return "La fecha de vencimiento no puede ser anterior a la fecha del desembolso.";
    return null;
  };

  const confirmar = async () => {
    const error = validar();
    if (error) {
      toast?.current?.show({ severity: "error", summary: "Revise los datos de la operación", detail: error, life: 8000 });
      return;
    }
    setGuardando(true);
    try {
      const comun = {
        cuentaCorrienteId: cuenta.cuentaCorrienteId,
        medioPagoId,
        tipoMovimientoId,
        monto: Number(monto),
        tipoCambio: extranjera ? Number(tipoCambio) : undefined,
        itf: Number(itf || 0),
        comision: Number(comision || 0),
        numeroOperacion: numeroOperacion || undefined,
        descripcion: descripcion || undefined,
        observaciones: observaciones || undefined,
      };
      const r = esPago
        ? await pagarPrestamoEntidad({ ...comun, prestamoEntidadId: prestamo.id, fechaPago: aISO(fecha) })
        : await desembolsarPrestamoEntidad({
            ...comun,
            empresaId,
            entidadComercialId: entidadId,
            sentido,
            esAccionista,
            fechaDesembolso: aISO(fecha),
            fechaVencimiento: fechaVencimiento ? aISO(fechaVencimiento) : undefined,
          });
      setResultado(r.data);
      toast?.current?.show({ severity: "success", summary: "Operación registrada", detail: r.message, life: 6000 });
      onSuccess?.(r.data);
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar la operación", detail: mensajeDeError(err, "Error al registrar la operación del préstamo"), life: 10000 });
    }
    setGuardando(false);
  };

  if (resultado) {
    const resumen = resultado.resumen;
    return (
      <Dialog header={`Préstamo ${resultado.numeroPrestamo} - Operación #${resultado.correlativo}`} visible={visible} onHide={onHide} style={{ width: "80vw", maxWidth: 900 }} modal>
        <Message
          severity="success"
          className="mb-3"
          style={{ width: "100%", justifyContent: "flex-start" }}
          text={`${resultado.message}. ${resumen.prestamoCancelado ? "El préstamo quedó cancelado." : `Saldo pendiente del préstamo: ${formatearNumero(resumen.saldoCapital, 2)}.`}`}
        />
        <h4>Saldos de la cuenta</h4>
        <DataTable value={resultado.saldosCuentaCorriente} size="small" stripedRows className="mb-3">
          <Column field="tipo" header="Movimiento" />
          <Column header="Saldo anterior" body={(s) => formatearNumero(s.saldoAnterior, 2)} />
          <Column header="Ingresos" body={(s) => formatearNumero(s.ingresos, 2)} />
          <Column header="Egresos" body={(s) => formatearNumero(s.egresos, 2)} />
          <Column header="Saldo actual" body={(s) => formatearNumero(s.saldoActual, 2)} />
        </DataTable>
        <h4>Asientos contables generados</h4>
        <ul>
          {resultado.asientosContables.map((a) => (
            <li key={String(a.id)}>{a.numeroAsiento}</li>
          ))}
        </ul>
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <Button label="Cerrar" icon="pi pi-check" onClick={onHide} />
        </div>
      </Dialog>
    );
  }

  const listoParaFormulario = esPago ? Boolean(prestamo) : true;
  const accion = esPago ? (sentidoOperacion === "RECIBIDO" ? "Registrar pago" : "Registrar cobranza") : "Registrar desembolso";

  return (
    <Dialog
      header="Préstamos con accionistas y terceros"
      visible={visible}
      onHide={onHide}
      style={{ width: "92vw", maxWidth: 1100 }}
      modal
      footer={
        <div>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={guardando} />
          <Button label={accion} icon="pi pi-check" onClick={confirmar} loading={guardando} disabled={!listoParaFormulario} />
        </div>
      }
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <label style={etiqueta}>Operación</label>
          <SelectButton value={modo} options={MODOS} onChange={(e) => e.value && setModo(e.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={etiqueta}>Empresa *</label>
          <Dropdown value={empresaId} options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))} onChange={(e) => { setEmpresaId(e.value); setCuenta(null); }} placeholder="Seleccione la empresa" filter style={{ width: "100%" }} />
        </div>
      </div>

      {!esPago && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <label style={etiqueta}>Sentido *</label>
            <Dropdown value={sentido} options={SENTIDOS} onChange={(e) => { setSentido(e.value); setTipoMovimientoId(null); }} style={{ width: "100%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={etiqueta}>La contraparte es *</label>
            <SelectButton value={esAccionista} options={CONTRAPARTES} onChange={(e) => e.value !== null && (setEsAccionista(e.value), setTipoMovimientoId(null))} />
          </div>
          <div style={{ flex: 3 }}>
            <EntidadComercialSelector value={entidadId} onChange={setEntidadId} label={esAccionista ? "Accionista *" : "Tercero *"} placeholder="Seleccione la persona o empresa" />
          </div>
        </div>
      )}

      {esPago && (
        <DataTable
          value={vigentes}
          selection={prestamo}
          onSelectionChange={(e) => seleccionarPrestamo(e.value)}
          selectionMode="single"
          dataKey="id"
          loading={cargando}
          size="small"
          stripedRows
          scrollable
          scrollHeight="200px"
          emptyMessage={empresaId ? "No hay préstamos vigentes con saldo para esta empresa." : "Seleccione la empresa."}
          className="mb-3"
        >
          <Column field="numeroPrestamo" header="Préstamo" />
          <Column header="Sentido" body={(p) => (p.sentido === "RECIBIDO" ? "Recibido" : "Otorgado")} />
          <Column header="Contraparte" body={(p) => `${p.esAccionista ? "Accionista" : "Tercero"}: ${p.entidad}`} />
          <Column header="Desembolso" body={(p) => fechaCorta(p.fechaDesembolso)} />
          <Column header="Vence" body={(p) => fechaCorta(p.fechaVencimiento)} />
          <Column header="Saldo" body={(p) => `${p.simbolo} ${formatearNumero(p.saldoCapital, 2)}`} />
        </DataTable>
      )}

      {listoParaFormulario && (
        <>
          <Message
            severity="info"
            className="mb-3"
            style={{ width: "100%", justifyContent: "flex-start" }}
            text={`${esIngreso ? "INGRESO" : "EGRESO"} de caja: ${esPago ? (sentidoOperacion === "RECIBIDO" ? "pago del préstamo recibido" : "cobranza del préstamo otorgado") : sentidoOperacion === "RECIBIDO" ? "la empresa recibe el préstamo" : "la empresa otorga el préstamo"}. Solo capital, sin intereses.`}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Fecha de la operación *</label>
              <Calendar value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 3 }}>
              <label style={etiqueta}>{esIngreso ? "Cuenta de destino (a donde entra el dinero) *" : "Cuenta de origen (de donde sale el dinero) *"}</label>
              <CuentaCorrienteSelector value={cuenta?.cuentaCorrienteId || null} onChange={setCuenta} label="" placeholder="Seleccione la cuenta bancaria" mostrarSaldo={true} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Medio de pago *</label>
              <Dropdown value={medioPagoId} options={mediosPago.map((m) => ({ label: m.nombre, value: Number(m.id) }))} onChange={(e) => setMedioPagoId(e.value)} placeholder="Seleccione" filter style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Tipo de movimiento *</label>
              <Dropdown value={tipoMovimientoId} options={tiposDisponibles} onChange={(e) => setTipoMovimientoId(e.value)} placeholder="Seleccione" filter style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>N° de operación bancaria</label>
              <InputText value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Monto ({simbolo || "moneda de la cuenta"}) *</label>
              <InputNumber value={monto} onValueChange={(e) => setMonto(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
              {esPago && <Button label="Saldo total" className="p-button-text p-button-sm" onClick={() => setMonto(Number(prestamo.saldoCapital))} />}
            </div>
            {extranjera && (
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Tipo de cambio *</label>
                <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} style={{ width: "100%" }} />
              </div>
            )}
            {!esPago && (
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Fecha de vencimiento (opcional)</label>
                <Calendar value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.value)} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>ITF ({simbolo || "moneda de la cuenta"})</label>
              <InputNumber value={itf} onValueChange={(e) => setItf(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Comisión ({simbolo || "moneda de la cuenta"})</label>
              <InputNumber value={comision} onValueChange={(e) => setComision(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Glosa (opcional: si la deja vacía se arma automáticamente)</label>
              <InputText value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Observaciones</label>
              <InputText value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
