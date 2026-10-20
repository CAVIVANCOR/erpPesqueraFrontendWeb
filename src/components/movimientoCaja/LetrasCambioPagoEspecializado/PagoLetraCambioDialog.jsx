// src/components/movimientoCaja/LetrasCambioPagoEspecializado/PagoLetraCambioDialog.jsx
// Pago (letra por pagar) o cobranza (letra por cobrar) de una letra de cambio desde Tesorería.
// Capital, interés y mora se ingresan manualmente el día del pago.
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import { getLetrasPendientesPago, pagarLetra } from "../../../api/tesoreria/letrasOperaciones";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const aISO = (f) => (f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null);
const r2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");
const TIPOS = [
  { label: "Letras por pagar (compras)", value: "PAGAR" },
  { label: "Letras por cobrar (ventas)", value: "COBRAR" },
];

export default function PagoLetraCambioDialog({ visible, onHide, onSuccess, toast, mediosPago = [], tiposMovimiento = [], empresas = [], letraInicial = null }) {
  const [tipoLetra, setTipoLetra] = useState("PAGAR");
  const [empresaId, setEmpresaId] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [letra, setLetra] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [fechaPago, setFechaPago] = useState(new Date());
  const [cuenta, setCuenta] = useState(null); // { cuentaCorrienteId, empresaId, moneda, cuenta }
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);
  const [capital, setCapital] = useState(0);
  const [interes, setInteres] = useState(0);
  const [mora, setMora] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [itf, setItf] = useState(0);
  const [comision, setComision] = useState(0);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [resultado, setResultado] = useState(null);

  const pagar = (letra?.tipoLetra || tipoLetra) === "PAGAR";

  const reiniciarFormulario = (l) => {
    setFechaPago(new Date());
    setCuenta(null);
    setMedioPagoId(null);
    setTipoMovimientoId(null);
    setCapital(l ? Number(l.saldoCapital) : 0);
    setInteres(0);
    setMora(0);
    setTipoCambio(null);
    setItf(0);
    setComision(0);
    setNumeroOperacion("");
    setDescripcion("");
  };

  useEffect(() => {
    if (!visible) return;
    setResultado(null);
    setLetra(letraInicial || null);
    setEmpresaId(letraInicial ? Number(letraInicial.empresaId) : null);
    if (letraInicial) setTipoLetra(letraInicial.tipoLetra);
    reiniciarFormulario(letraInicial);
  }, [visible, letraInicial?.id]);

  // Letras pendientes de la empresa y tipo elegidos
  useEffect(() => {
    if (!visible || letraInicial || !empresaId) {
      setPendientes([]);
      return;
    }
    setCargando(true);
    getLetrasPendientesPago({ empresaId, tipoLetra })
      .then(setPendientes)
      .catch((err) => toast?.current?.show({ severity: "error", summary: "No se pudieron cargar las letras", detail: mensajeDeError(err, "Error al consultar las letras pendientes"), life: 8000 }))
      .finally(() => setCargando(false));
    setLetra(null);
  }, [visible, empresaId, tipoLetra]);

  const seleccionarLetra = (l) => {
    setLetra(l);
    reiniciarFormulario(l);
  };

  const monedaLetraId = Number(letra?.monedaId || 0);
  const monedaCuentaId = Number(cuenta?.moneda?.id || 0);
  const simboloLetra = letra?.moneda?.simbolo || "";
  const simboloCuenta = cuenta?.moneda?.simbolo || "";
  const hayExtranjera = letra && cuenta && (monedaLetraId !== 1 || monedaCuentaId !== 1);
  const hayConversion = letra && cuenta && monedaLetraId !== monedaCuentaId;
  const totalLetra = r2(Number(capital || 0) + Number(interes || 0) + Number(mora || 0));
  const montoMovimiento = useMemo(() => {
    if (!hayConversion || !(Number(tipoCambio) > 0)) return hayConversion ? null : totalLetra;
    return r2(monedaLetraId === 1 ? totalLetra / Number(tipoCambio) : totalLetra * Number(tipoCambio));
  }, [hayConversion, tipoCambio, totalLetra, monedaLetraId]);
  const saldoLetra = Number(letra?.saldoCapital || 0);
  const tiposDisponibles = tiposMovimiento
    .filter((t) => t.activo !== false && Boolean(t.esIngreso) === !pagar)
    .map((t) => ({ label: t.nombre, value: Number(t.id) }));

  const validar = () => {
    if (!letra) return "Seleccione la letra que se va a " + (pagar ? "pagar." : "cobrar.");
    if (!fechaPago) return "Indique la fecha de la operación.";
    if (!cuenta) return `Seleccione la cuenta bancaria ${pagar ? "de donde sale" : "a donde entra"} el dinero.`;
    if (Number(cuenta.empresaId) !== Number(letra.empresaId)) return `La cuenta seleccionada no es de ${letra.empresa?.razonSocial || "la empresa de la letra"}.`;
    if (!medioPagoId) return "Seleccione el medio de pago.";
    if (!tipoMovimientoId) return "Seleccione el tipo de movimiento.";
    if (Number(capital) < 0 || Number(interes) < 0 || Number(mora) < 0) return "El capital, el interés y la mora no pueden ser negativos.";
    if (!(totalLetra > 0)) return "Ingrese el capital, el interés o la mora que se paga: el total debe ser mayor a cero.";
    if (Number(capital) > saldoLetra + 0.01) return `El capital (${formatearNumero(capital, 2)}) excede el saldo de capital de la letra (${formatearNumero(saldoLetra, 2)}).`;
    if (hayExtranjera && !(Number(tipoCambio) > 0)) return "Ingrese el tipo de cambio de la fecha de la operación (la letra o la cuenta están en moneda extranjera).";
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
      const r = await pagarLetra({
        letraCambioId: letra.id,
        fechaPago: aISO(fechaPago),
        cuentaCorrienteId: cuenta.cuentaCorrienteId,
        medioPagoId,
        tipoMovimientoId,
        montoCapital: Number(capital || 0),
        montoInteres: Number(interes || 0),
        montoMora: Number(mora || 0),
        tipoCambio: hayExtranjera ? Number(tipoCambio) : undefined,
        itf: Number(itf || 0),
        comision: Number(comision || 0),
        numeroOperacion: numeroOperacion || undefined,
        descripcion: descripcion || undefined,
      });
      setResultado(r.data);
      toast?.current?.show({ severity: "success", summary: pagar ? "Pago registrado" : "Cobranza registrada", detail: r.message, life: 6000 });
      onSuccess?.(r.data);
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar la operación", detail: mensajeDeError(err, "Error al registrar el pago de la letra"), life: 10000 });
    }
    setGuardando(false);
  };

  // ── Resultado ─────────────────────────────────────────────
  if (resultado) {
    const resumen = resultado.resumen;
    return (
      <Dialog header={`${pagar ? "Pago" : "Cobranza"} de letra registrado - Operación #${resultado.correlativo}`} visible={visible} onHide={onHide} style={{ width: "80vw", maxWidth: 900 }} modal>
        <Message severity="success" className="mb-3" style={{ width: "100%", justifyContent: "flex-start" }} text={`Letra ${resultado.numeroLetra}: ${resumen.letraCancelada ? "cancelada totalmente" : `saldo de capital pendiente ${formatearNumero(resumen.saldoCapitalLetra, 2)}`}.`} />
        <h4>Desglose</h4>
        <div style={{ marginBottom: 10 }}>
          Capital {formatearNumero(resumen.capital, 2)} + Interés {formatearNumero(resumen.interes, 2)} + Mora {formatearNumero(resumen.mora, 2)} = <b>{formatearNumero(resumen.totalLetra, 2)}</b> (monto del movimiento: {formatearNumero(resumen.montoMovimiento, 2)})
        </div>
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
        {resumen.documentosSaldados?.length > 0 && (
          <Message
            severity="info"
            style={{ width: "100%", justifyContent: "flex-start" }}
            text={`Con este pago se canceló el capital de ${resumen.documentosSaldados.length} factura(s) respaldada(s) por letras: su detracción, retención y percepción pendientes ya pueden resolverse.`}
          />
        )}
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <Button label="Cerrar" icon="pi pi-check" onClick={onHide} />
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      header={letra ? `${pagar ? "Pagar" : "Cobrar"} letra ${letra.numeroDocumento}` : "Pago / cobro de letras de cambio"}
      visible={visible}
      onHide={onHide}
      style={{ width: "92vw", maxWidth: 1100 }}
      modal
      footer={
        <div>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={guardando} />
          <Button label={pagar ? "Registrar pago" : "Registrar cobranza"} icon="pi pi-check" onClick={confirmar} loading={guardando} disabled={!letra} />
        </div>
      }
    >
      {!letraInicial && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Tipo de letra</label>
              <Dropdown value={tipoLetra} options={TIPOS} onChange={(e) => setTipoLetra(e.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={etiqueta}>Empresa *</label>
              <Dropdown value={empresaId} options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))} onChange={(e) => setEmpresaId(e.value)} placeholder="Seleccione la empresa" filter style={{ width: "100%" }} />
            </div>
          </div>
          <DataTable
            value={pendientes}
            selection={letra}
            onSelectionChange={(e) => seleccionarLetra(e.value)}
            selectionMode="single"
            dataKey="id"
            loading={cargando}
            size="small"
            stripedRows
            scrollable
            scrollHeight="200px"
            emptyMessage={empresaId ? "No hay letras con capital pendiente." : "Seleccione la empresa."}
            className="mb-3"
          >
            <Column field="numeroDocumento" header="Letra" />
            <Column header={pagar ? "Beneficiario" : "Girado"} body={(l) => (pagar ? l.beneficiario?.razonSocial : l.girado?.razonSocial)} />
            <Column header="Vence" body={(l) => fechaCorta(l.fechaVencimiento)} />
            <Column header="Saldo de capital" body={(l) => `${l.moneda?.simbolo} ${formatearNumero(l.saldoCapital, 2)}`} />
            <Column header="Estado" body={(l) => <Tag value={l.estado?.descripcion} severity={l.estado?.severityColor || "info"} />} />
          </DataTable>
        </>
      )}

      {letra && (
        <>
          <Message
            severity={letra.estado?.descripcion === "PROTESTADA" ? "error" : letra.estado?.descripcion === "VENCIDA" ? "warn" : "info"}
            className="mb-3"
            style={{ width: "100%", justifyContent: "flex-start" }}
            text={`${letra.numeroDocumento} - ${pagar ? letra.beneficiario?.razonSocial : letra.girado?.razonSocial} - vence ${fechaCorta(letra.fechaVencimiento)} - saldo de capital ${simboloLetra} ${formatearNumero(saldoLetra, 2)} - ${letra.estado?.descripcion}`}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Fecha de la operación *</label>
              <Calendar value={fechaPago} onChange={(e) => setFechaPago(e.value)} dateFormat="dd/mm/yy" showIcon style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 3 }}>
              <label style={etiqueta}>{pagar ? "Cuenta de origen (de donde sale el dinero) *" : "Cuenta de destino (a donde entra el dinero) *"}</label>
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: 10, background: "#f5f7fa", borderRadius: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Capital ({simboloLetra}) *</label>
              <InputNumber value={capital} onValueChange={(e) => setCapital(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
              <Button label="Saldo total" className="p-button-text p-button-sm" onClick={() => setCapital(saldoLetra)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Interés ({simboloLetra}) - manual</label>
              <InputNumber value={interes} onValueChange={(e) => setInteres(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Mora ({simboloLetra}) - manual</label>
              <InputNumber value={mora} onValueChange={(e) => setMora(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1, alignSelf: "end", fontWeight: "bold" }}>
              Total {pagar ? "a pagar" : "a cobrar"}: {simboloLetra} {formatearNumero(totalLetra, 2)}
              {hayConversion && (
                <div style={{ fontWeight: "normal" }}>
                  En la cuenta: {simboloCuenta} {montoMovimiento == null ? "(ingrese el tipo de cambio)" : formatearNumero(montoMovimiento, 2)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {hayExtranjera && (
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Tipo de cambio *</label>
                <InputNumber value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} minFractionDigits={3} maxFractionDigits={4} style={{ width: "100%" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>ITF ({simboloCuenta || "moneda de la cuenta"})</label>
              <InputNumber value={itf} onValueChange={(e) => setItf(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={etiqueta}>Comisión ({simboloCuenta || "moneda de la cuenta"})</label>
              <InputNumber value={comision} onValueChange={(e) => setComision(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2} style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <label style={etiqueta}>Glosa (opcional: si la deja vacía se arma automáticamente)</label>
            <InputText value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ width: "100%" }} />
          </div>
        </>
      )}
    </Dialog>
  );
}
