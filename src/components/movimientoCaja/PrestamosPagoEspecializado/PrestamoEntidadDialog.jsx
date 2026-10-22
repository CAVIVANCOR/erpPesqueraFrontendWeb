// src/components/movimientoCaja/PrestamosPagoEspecializado/PrestamoEntidadDialog.jsx
// Operaciones de Tesorería de préstamos con accionistas y terceros (solo capital, sin intereses):
//   - Desembolso: ingreso de caja si la empresa es el Deudor, egreso si es el Prestamista.
//   - Devolución de capital: egreso si la empresa es el Deudor, ingreso si es el Prestamista.
// Mismo criterio de pantalla que OperacionPrestamoForm / TransferenciaInternaDialog. El banco del asiento es la
// cuenta contable de la cuenta corriente elegida.
import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import EmpresaSelector from "../../common/EmpresaSelector";
import PartesPrestamoEntidad from "../../tesoreria/PartesPrestamoEntidad";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import ConfirmarSinFondosDialog from "../../common/ConfirmarSinFondosDialog";
import ConfirmacionPrestamoEntidadDialog from "./ConfirmacionPrestamoEntidadDialog";
import { obtenerAvisoSinFondos } from "../../../utils/avisoSinFondos";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { actualizarUrlVoucherIndividual } from "../../../api/tesoreria/transferencias";
import { generarYSubirVoucherIndividual } from "../utils/VoucherIndividualMovimientoPDF";
import { getPrestamosEntidadVigentes, desembolsarPrestamoEntidad, pagarPrestamoEntidad } from "../../../api/tesoreria/prestamosEntidad";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

// Solo hay dos términos: PRESTAMISTA (presta el dinero) y DEUDOR (recibe el préstamo y debe devolverlo).
// Valores internos: OTORGADO = la empresa es el Prestamista; RECIBIDO = la empresa es el Deudor.
const OPERACIONES = [
  { label: "Desembolso: nuevo préstamo (el Prestamista entrega el dinero al Deudor)", value: "DESEMBOLSO" },
  { label: "Devolución: el Deudor devuelve capital al Prestamista (total o parcial)", value: "PAGO" },
];

const redondear2 = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const fila = { alignItems: "end", display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" };

export default function PrestamoEntidadDialog({ visible, onHide, onSuccess, toast, mediosPago = [], tiposMovimiento = [], empresas = [] }) {
  const usuario = useAuthStore((state) => state.usuario);

  const [operacion, setOperacion] = useState("DESEMBOLSO");
  const [empresaId, setEmpresaId] = useState(null);
  const [sentido, setSentido] = useState("RECIBIDO");
  const [esAccionista, setEsAccionista] = useState(true);
  const [entidadId, setEntidadId] = useState(null);
  const [vigentes, setVigentes] = useState([]);
  const [prestamoId, setPrestamoId] = useState(null);
  const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [fecha, setFecha] = useState(new Date());
  const [fechaVencimiento, setFechaVencimiento] = useState(null);
  const [esGerencial, setEsGerencial] = useState(false);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cuentaId, setCuentaId] = useState(null);
  const [monedaCuenta, setMonedaCuenta] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);
  const [monto, setMonto] = useState(0);
  const [itf, setItf] = useState(0);
  const [comision, setComision] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [avisoSinFondos, setAvisoSinFondos] = useState(null);

  const glosaEditada = useRef(false);
  const sinFondosConfirmadoRef = useRef(false);
  const ultimaConsultaTC = useRef(null);

  const esPago = operacion === "PAGO";
  const prestamo = vigentes.find((p) => Number(p.id) === Number(prestamoId)) || null;
  const sentidoOperacion = esPago ? prestamo?.sentido : sentido;
  const contraparteEsAccionista = esPago ? prestamo?.esAccionista : esAccionista;
  // Ingreso: recibir un préstamo nuevo o cobrar uno otorgado. Egreso: otorgar un préstamo nuevo o pagar uno recibido.
  const esIngreso = esPago ? sentidoOperacion === "OTORGADO" : sentidoOperacion === "RECIBIDO";

  const monedaOperacion = esPago ? (prestamo ? { id: Number(prestamo.monedaId), simbolo: prestamo.simbolo } : null) : monedaCuenta;
  const simbolo = monedaOperacion?.simbolo || "";
  const esMonedaNacional = !monedaOperacion || Number(monedaOperacion.id) === 1;

  const totalAcreditado = redondear2(Number(monto || 0)); // ITF y comisión nunca se restan: son movimientos aparte
  const totalDebitado = redondear2(Number(monto || 0) + Number(itf || 0) + Number(comision || 0));

  const reiniciar = () => {
    setFecha(new Date());
    setFechaVencimiento(null);
    setEsGerencial(false);
    setNumeroOperacion("");
    setDescripcion("");
    glosaEditada.current = false;
    setCuentaId(null);
    setMonedaCuenta(null);
    setMedioPagoId(null);
    setTipoMovimientoId(null);
    setMonto(0);
    setItf(0);
    setComision(0);
    setTipoCambio(null);
    setEntidadId(null);
    setPrestamoId(null);
    ultimaConsultaTC.current = null;
  };

  useEffect(() => {
    if (!visible) return;
    setResultado(null);
    setShowConfirmacion(false);
    reiniciar();
  }, [visible, operacion]);

  // Préstamos vigentes de la empresa (devolución)
  useEffect(() => {
    if (!visible || !esPago || !empresaId) {
      setVigentes([]);
      return;
    }
    setCargandoPrestamos(true);
    getPrestamosEntidadVigentes({ empresaId })
      .then(setVigentes)
      .catch((err) => toast?.current?.show({ severity: "error", summary: "No se pudieron cargar los préstamos", detail: mensajeDeError(err, "Error al consultar los préstamos vigentes"), life: 8000 }))
      .finally(() => setCargandoPrestamos(false));
    setPrestamoId(null);
  }, [visible, esPago, empresaId]);

  const seleccionarPrestamo = (id) => {
    setPrestamoId(id);
    const p = vigentes.find((x) => Number(x.id) === Number(id));
    setMonto(p ? Number(p.saldoCapital) : 0);
    setCuentaId(null);
    setMonedaCuenta(null);
    setTipoMovimientoId(null);
  };

  // Glosa propuesta (editable): no se pisa si el usuario ya la escribió
  useEffect(() => {
    if (glosaEditada.current) return;
    const tipo = contraparteEsAccionista ? "ACCIONISTA" : "TERCERO";
    if (esPago) {
      if (!prestamo) return setDescripcion("");
      setDescripcion(`${sentidoOperacion === "RECIBIDO" ? "DEVOLUCIÓN DE PRÉSTAMO AL PRESTAMISTA" : "DEVOLUCIÓN DE PRÉSTAMO DEL DEUDOR"} ${tipo} ${prestamo.entidad} - PRÉSTAMO ${prestamo.numeroPrestamo}`);
    } else {
      setDescripcion(`${sentido === "RECIBIDO" ? "POR EL PRÉSTAMO RECIBIDO DEL PRESTAMISTA" : "POR EL PRÉSTAMO OTORGADO AL DEUDOR"} ${tipo}`);
    }
  }, [operacion, sentido, esAccionista, prestamoId, vigentes]);

  // Tipo de cambio de venta de SUNAT (editable) cuando la operación no es en soles
  useEffect(() => {
    const consultar = async () => {
      if (!fecha || esMonedaNacional) return;
      const fechaISO = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
      if (ultimaConsultaTC.current === fechaISO) return;
      try {
        const datos = await consultarTipoCambioSunat({ date: fechaISO });
        if (datos?.sell_price) {
          const tc = parseFloat(datos.sell_price);
          setTipoCambio(tc);
          ultimaConsultaTC.current = fechaISO;
          toast?.current?.show({ severity: "success", summary: "✅ Tipo de Cambio Actualizado", detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta)`, life: 3000 });
        }
      } catch (error) {
        toast?.current?.show({ severity: "error", summary: "Error", detail: "No se pudo obtener el tipo de cambio de SUNAT", life: 4000 });
      }
    };
    consultar();
  }, [fecha, esMonedaNacional, monedaOperacion?.id]);

  const validar = () => {
    const error = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 4000 });
      return false;
    };
    if (!empresaId) return error("Seleccione la empresa del préstamo.");
    if (esPago) {
      if (!prestamo) return error("Seleccione el préstamo al que se aplica la devolución.");
    } else {
      const otraParte = sentido === "RECIBIDO" ? "Prestamista" : "Deudor";
      if (!entidadId) return error(`Seleccione el ${otraParte} (${esAccionista ? "accionista" : "tercero"}) del préstamo.`);
    }
    if (!fecha) return error("Debe ingresar la fecha de la operación");
    if (!cuentaId) return error(`Seleccione la cuenta bancaria ${esIngreso ? "de destino" : "de origen"}.`);
    if (esPago && Number(monedaCuenta?.id) !== Number(prestamo.monedaId)) {
      return error(`La cuenta está en ${monedaCuenta?.simbolo} y el préstamo en ${simbolo}: elija una cuenta en la moneda del préstamo.`);
    }
    if (!medioPagoId) return error("Seleccione el medio de pago.");
    if (!tipoMovimientoId) return error("Seleccione el tipo de movimiento.");
    if (!(Number(monto) > 0)) return error("El monto debe ser mayor a cero.");
    if (esPago && Number(monto) > Number(prestamo.saldoCapital) + 0.01) {
      return error(`El monto (${simbolo} ${formatearNumero(monto)}) excede el saldo pendiente del préstamo (${simbolo} ${formatearNumero(prestamo.saldoCapital)}).`);
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) return error("Debe ingresar un tipo de cambio válido");
    if (!esPago && fechaVencimiento && fechaVencimiento < fecha) return error("La fecha de vencimiento no puede ser anterior a la fecha del desembolso.");
    if (!descripcion || descripcion.trim() === "") return error("Debe ingresar la glosa de la operación");
    return true;
  };

  // Vouchers individuales de cada movimiento (principal, ITF y comisión), mismo mecanismo que OperacionPrestamoForm.
  // Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (data) => {
    for (const clave of ["principal", "itf", "comision"]) {
      const movimiento = data.movimientos?.[clave];
      if (!movimiento) continue;
      try {
        const empresaMovimiento = empresas.find((e) => Number(e.id) === Number(movimiento.empresaId));
        const voucher = await generarYSubirVoucherIndividual(movimiento, null, empresaMovimiento, null, usuario);
        if (voucher.success && voucher.urlPdf && voucher.urlPdf.trim() !== "") {
          await actualizarUrlVoucherIndividual(movimiento.id, voucher.urlPdf);
          data.movimientos[clave].urlOperacionIndividualOperacionCaja = voucher.urlPdf;
        }
      } catch (error) {
        console.error(`❌ Error voucher ${clave}:`, error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validar()) return;

    // Egreso sin fondos: no se bloquea, pero se pide confirmación antes de procesar
    if (!esIngreso && !sinFondosConfirmadoRef.current) {
      const aviso = await obtenerAvisoSinFondos({ cuentaCorrienteId: cuentaId, totalRequerido: totalDebitado, simbolo });
      if (aviso) {
        setAvisoSinFondos(aviso);
        return;
      }
    }
    sinFondosConfirmadoRef.current = false;

    setProcesando(true);
    try {
      const comunes = {
        cuentaCorrienteId: cuentaId,
        medioPagoId: Number(medioPagoId),
        tipoMovimientoId: Number(tipoMovimientoId),
        monto: Number(monto),
        tipoCambio: esMonedaNacional ? undefined : Number(tipoCambio),
        itf: Number(itf || 0),
        comision: Number(comision || 0),
        numeroOperacion: numeroOperacion || undefined,
        descripcion: descripcion.trim(),
      };
      // Las fechas viajan como ISO completo (medianoche local): una fecha sin hora se interpretaría en UTC y retrocedería un día
      const respuesta = esPago
        ? await pagarPrestamoEntidad({ ...comunes, prestamoEntidadId: prestamo.id, fechaPago: fecha.toISOString() })
        : await desembolsarPrestamoEntidad({
            ...comunes,
            empresaId,
            entidadComercialId: entidadId,
            sentido,
            esAccionista,
            esGerencial,
            fechaDesembolso: fecha.toISOString(),
            fechaVencimiento: fechaVencimiento ? fechaVencimiento.toISOString() : undefined,
          });
      if (respuesta?.data) {
        await generarVouchers(respuesta.data);
        setResultado(respuesta.data);
        setShowConfirmacion(true);
        toast?.current?.show({ severity: "success", summary: "Operación registrada", detail: respuesta.message, life: 4000 });
        onSuccess?.(respuesta.data);
      }
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar la operación", detail: mensajeDeError(err, "Error al registrar la operación del préstamo"), life: 10000 });
    }
    setProcesando(false);
  };

  const etiquetaBoton = esPago ? "Registrar Devolución" : "Registrar Desembolso";
  const tiposDisponibles = tiposMovimiento;

  return (
    <>
      <Dialog
        header="🤝 Préstamos con Accionistas y Terceros"
        visible={visible && !showConfirmacion}
        style={{ width: "1300px" }}
        onHide={onHide}
        modal
        maximizable
      >
        <form onSubmit={handleSubmit}>
          <Panel header="🤝 Datos del Préstamo" className="mb-3">
            <div style={fila}>
              <div style={{ flex: 1 }}>
                <label htmlFor="operacion" className="font-bold">Operación *</label>
                <Dropdown id="operacion" value={operacion} options={OPERACIONES} onChange={(e) => setOperacion(e.value)} disabled={procesando} style={{ width: "100%" }} />
              </div>
            </div>

            {!esPago && (
              <>
                <PartesPrestamoEntidad
                  esPrestamista={sentido === "OTORGADO"}
                  onRolChange={(v) => { setSentido(v ? "OTORGADO" : "RECIBIDO"); setTipoMovimientoId(null); }}
                  empresaId={empresaId}
                  onEmpresaChange={(id) => { setEmpresaId(id); setCuentaId(null); setMonedaCuenta(null); }}
                  esAccionista={esAccionista}
                  onTipoChange={(v) => { setEsAccionista(v); setTipoMovimientoId(null); }}
                  entidadId={entidadId}
                  onEntidadChange={setEntidadId}
                  disabled={procesando}
                />
                <small style={{ color: "#6c757d" }}>
                  Se creará un nuevo préstamo. Su número (PE-000001...) se genera automáticamente al confirmar. Solo capital: sin intereses, mora ni retención.
                </small>
              </>
            )}

            {esPago && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <label className="font-bold block mb-1">Empresa *</label>
                  <EmpresaSelector empresaId={empresaId} onEmpresaChange={(id) => { setEmpresaId(id); setCuentaId(null); setMonedaCuenta(null); }} disabled={procesando} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="prestamoId" className="font-bold">Préstamo que se devuelve *</label>
                  <Dropdown
                    id="prestamoId"
                    value={prestamoId}
                    options={vigentes.map((p) => ({
                      label: `N° ${p.numeroPrestamo} · ${p.sentido === "OTORGADO" ? "Deudor" : "Prestamista"} ${p.esAccionista ? "accionista" : "tercero"} ${p.entidad} · saldo ${p.simbolo} ${formatearNumero(p.saldoCapital)}`,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => seleccionarPrestamo(e.value)}
                    placeholder={cargandoPrestamos ? "Cargando préstamos..." : empresaId ? "Seleccione el préstamo" : "Seleccione primero la empresa"}
                    emptyMessage="No hay préstamos vigentes con saldo para esta empresa"
                    disabled={procesando || cargandoPrestamos || !empresaId}
                    filter
                    style={{ width: "100%" }}
                  />
                  <small style={{ color: "#6c757d" }}>
                    Si la empresa es el Deudor, devuelve el capital (egreso). Si es el Prestamista, recibe la devolución (ingreso). Se admiten devoluciones parciales.
                  </small>
                </div>
                {prestamo && (
                  <PartesPrestamoEntidad
                    nombres={{
                      prestamista: prestamo.sentido === "OTORGADO" ? prestamo.empresa : prestamo.entidad,
                      deudor: prestamo.sentido === "OTORGADO" ? prestamo.entidad : prestamo.empresa,
                      tipoOtraParte: prestamo.esAccionista ? "ACCIONISTA" : "TERCERO",
                      esPrestamistaLaEmpresa: prestamo.sentido === "OTORGADO",
                    }}
                  />
                )}
              </>
            )}
          </Panel>

          <Panel header={esPago ? "💳 Datos de la Devolución" : "💳 Datos del Desembolso"} className="mb-3">
            <div style={fila}>
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">Fecha de la Operación *</label>
                <Calendar id="fecha" value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon disabled={procesando} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación</label>
                <InputText id="numeroOperacion" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} placeholder="Número de operación bancaria" disabled={procesando} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="descripcion" className="font-bold">Glosa *</label>
                <InputText
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => {
                    glosaEditada.current = true;
                    setDescripcion(e.target.value);
                  }}
                  placeholder="Ingrese glosa de la operación"
                  disabled={procesando}
                  style={{ width: "100%" }}
                />
              </div>
              {!esPago && (
                <div style={{ flex: 1 }}>
                  <label className="font-bold block mb-1">Tipo de Libro</label>
                  <BooleanToggleButton
                    labelTrue="GERENCIAL"
                    labelFalse="FISCAL"
                    severityTrue="help"
                    severityFalse="success"
                    icon={esGerencial ? "pi-eye-slash" : "pi-eye"}
                    value={esGerencial}
                    onChange={setEsGerencial}
                    disabled={procesando}
                  />
                </div>
              )}
              {!esPago && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="fechaVencimiento" className="font-bold">Fecha de Vencimiento</label>
                  <Calendar id="fechaVencimiento" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.value)} dateFormat="dd/mm/yy" showIcon disabled={procesando} style={{ width: "100%" }} />
                </div>
              )}
            </div>

            <Panel header={<span>{esIngreso ? "📥 Cuenta de Destino (INGRESO)" : "📤 Cuenta de Origen (EGRESO)"}</span>} toggleable>
              <div style={fila}>
                <div style={{ flex: 1 }}>
                  <label className="font-bold">Cuenta Corriente *</label>
                  <CuentaCorrienteSelector
                    empresaIdPreseleccionada={empresaId}
                    value={cuentaId}
                    onChange={({ cuentaCorrienteId, moneda }) => {
                      setCuentaId(cuentaCorrienteId);
                      setMonedaCuenta(moneda);
                    }}
                    label=""
                    placeholder={esIngreso ? "Seleccione cuenta de destino" : "Seleccione cuenta de origen"}
                    mostrarSaldo={true}
                    disabled={procesando}
                  />
                </div>
              </div>
              <div style={fila}>
                <div style={{ flex: 2 }}>
                  <label htmlFor="medioPago" className="font-bold">Medio de Pago *</label>
                  <Dropdown
                    id="medioPago"
                    value={medioPagoId}
                    options={mediosPago}
                    onChange={(e) => setMedioPagoId(e.value)}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione medio de pago"
                    disabled={procesando}
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <TipoMovimientoSelector
                    tiposMovimiento={tiposDisponibles}
                    value={tipoMovimientoId}
                    onChange={setTipoMovimientoId}
                    esIngreso={esIngreso}
                    required={true}
                    placeholder="Buscar tipo de movimiento..."
                    disabled={procesando}
                  />
                </div>
              </div>
              <div style={fila}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="monto" className="font-bold">{`Monto del Capital${simbolo ? ` (${simbolo})` : ""} *`}</label>
                  <InputNumber id="monto" value={monto} onValueChange={(e) => setMonto(e.value)} mode="decimal" minFractionDigits={2} maxFractionDigits={2} min={0} disabled={procesando} style={{ width: "100%" }} />
                  {esPago && prestamo && <Button type="button" label="Saldo total" className="p-button-text p-button-sm" onClick={() => setMonto(Number(prestamo.saldoCapital))} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="itf" className="font-bold">ITF</label>
                  <InputNumber id="itf" value={itf} onValueChange={(e) => setItf(e.value)} mode="decimal" minFractionDigits={2} maxFractionDigits={2} disabled={procesando} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="comision" className="font-bold">Comisión bancaria</label>
                  <InputNumber id="comision" value={comision} onValueChange={(e) => setComision(e.value)} mode="decimal" minFractionDigits={2} maxFractionDigits={2} disabled={procesando} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-bold">{esIngreso ? "Monto Acreditado:" : "Total a Debitar:"}</span>
                    <Tag severity={esIngreso ? "info" : "danger"} style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
                      {simbolo} {formatearNumero(esIngreso ? totalAcreditado : totalDebitado)}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* TIPO DE CAMBIO: solo si el préstamo no es en soles (TC de venta, editable) */}
              {!esMonedaNacional && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="tipoCambio" className="font-bold">Tipo de Cambio (Venta) *</label>
                  <InputNumber id="tipoCambio" value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} mode="decimal" minFractionDigits={4} maxFractionDigits={4} disabled={procesando} style={{ width: "100%" }} placeholder="Tipo de cambio SUNAT" />
                  <small className="p-text-secondary">Se propone el TC de venta de SUNAT; puede modificarlo. Se aplicará para registrar el asiento en soles</small>
                </div>
              )}
            </Panel>
          </Panel>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={onHide} type="button" disabled={procesando} />
            <Button label={etiquetaBoton} icon="pi pi-check" severity="success" type="submit" loading={procesando} />
          </div>
        </form>
      </Dialog>

      <ConfirmarSinFondosDialog
        mensaje={avisoSinFondos}
        onCancelar={() => setAvisoSinFondos(null)}
        onConfirmar={() => {
          sinFondosConfirmadoRef.current = true;
          setAvisoSinFondos(null);
          handleSubmit();
        }}
      />

      <ConfirmacionPrestamoEntidadDialog
        visible={visible && showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultado(null);
          onHide?.();
        }}
        resultado={resultado}
      />
    </>
  );
}
