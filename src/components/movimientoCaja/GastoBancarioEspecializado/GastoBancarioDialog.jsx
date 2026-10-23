// src/components/movimientoCaja/GastoBancarioEspecializado/GastoBancarioDialog.jsx
// Registro especializado de Gastos Bancarios (comisiones, comisión por retención judicial, ITF, portes...).
// Mismo criterio de pantalla que PrestamoEntidadDialog / TransferenciaInternaDialog: componentes genéricos para
// empresa, cuenta corriente y libro, y ventana de confirmación con los movimientos y asientos generados.
// El ITF y la comisión siempre son egresos aparte: aquí cada gasto es un egreso de caja con su propio asiento.
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
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import ConfirmarSinFondosDialog from "../../common/ConfirmarSinFondosDialog";
import ConfirmacionGastoBancarioDialog from "./ConfirmacionGastoBancarioDialog";
import { obtenerAvisoSinFondos } from "../../../utils/avisoSinFondos";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { actualizarUrlVoucherIndividual } from "../../../api/tesoreria/transferencias";
import { generarYSubirVoucherIndividual } from "../utils/VoucherIndividualMovimientoPDF";
import { getConceptosGastoBancario, registrarGastosBancarios } from "../../../api/tesoreria/gastosBancarios";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import { mensajeDeError } from "../../../utils/mensajeError";
import { formatearNumero } from "../../../utils/utils";

const redondear2 = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const fila = { alignItems: "end", display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" };
const nuevaLinea = () => ({ clave: `${Date.now()}-${Math.random()}`, concepto: null, monto: 0, glosa: "" });

export default function GastoBancarioDialog({ visible, onHide, onSuccess, toast, mediosPago = [], empresas = [] }) {
  const usuario = useAuthStore((state) => state.usuario);

  const [conceptos, setConceptos] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [esGerencial, setEsGerencial] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cuentaId, setCuentaId] = useState(null);
  const [monedaCuenta, setMonedaCuenta] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [lineas, setLineas] = useState([nuevaLinea()]);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [avisoSinFondos, setAvisoSinFondos] = useState(null);

  const sinFondosConfirmadoRef = useRef(false);
  const ultimaConsultaTC = useRef(null);

  const simbolo = monedaCuenta?.simbolo || "";
  const esMonedaNacional = !monedaCuenta || Number(monedaCuenta.id) === 1;
  const totalDebitar = redondear2(lineas.reduce((a, l) => a + Number(l.monto || 0), 0));

  const reiniciar = () => {
    setFecha(new Date());
    setNumeroOperacion("");
    setDescripcion("");
    setCuentaId(null);
    setMonedaCuenta(null);
    setMedioPagoId(null);
    setLineas([nuevaLinea()]);
    setTipoCambio(null);
    setEsGerencial(false);
    ultimaConsultaTC.current = null;
  };

  useEffect(() => {
    if (!visible) return;
    setResultado(null);
    setShowConfirmacion(false);
    reiniciar();
    getConceptosGastoBancario()
      .then(setConceptos)
      .catch((err) => toast?.current?.show({ severity: "error", summary: "No se pudieron cargar los conceptos", detail: mensajeDeError(err, "Error al consultar los conceptos de gastos bancarios"), life: 8000 }));
  }, [visible]);

  // Tipo de cambio de venta de SUNAT (editable) cuando la cuenta no es en soles
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
  }, [fecha, esMonedaNacional, monedaCuenta?.id]);

  const cambiarLinea = (clave, cambios) => setLineas((prev) => prev.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));
  const quitarLinea = (clave) => setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.clave !== clave) : prev));

  const validar = () => {
    const error = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 4000 });
      return false;
    };
    if (!empresaId) return error("Seleccione la empresa del gasto bancario.");
    if (!fecha) return error("Debe ingresar la fecha del cargo del banco.");
    if (!cuentaId) return error("Seleccione la cuenta corriente donde el banco hizo el cargo.");
    if (!medioPagoId) return error("Seleccione el medio de pago.");
    for (let i = 0; i < lineas.length; i += 1) {
      if (!lineas[i].concepto) return error(`Seleccione el concepto del gasto ${i + 1}.`);
      if (!(Number(lineas[i].monto) > 0)) return error(`El monto del gasto ${i + 1} debe ser mayor a cero.`);
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) return error("Debe ingresar un tipo de cambio válido");
    return true;
  };

  // Vouchers individuales de cada movimiento, mismo mecanismo que PrestamoEntidadDialog.
  // Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (data) => {
    for (const linea of data.lineas || []) {
      const movimiento = linea.movimiento;
      if (!movimiento) continue;
      try {
        const empresaMovimiento = empresas.find((e) => Number(e.id) === Number(movimiento.empresaId));
        const voucher = await generarYSubirVoucherIndividual(movimiento, null, empresaMovimiento, null, usuario);
        if (voucher.success && voucher.urlPdf && voucher.urlPdf.trim() !== "") {
          await actualizarUrlVoucherIndividual(movimiento.id, voucher.urlPdf);
          linea.movimiento.urlOperacionIndividualOperacionCaja = voucher.urlPdf;
        }
      } catch (error) {
        console.error(`❌ Error voucher del movimiento ${movimiento.id}:`, error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validar()) return;

    // Egreso sin fondos: no se bloquea, pero se pide confirmación antes de procesar
    if (!sinFondosConfirmadoRef.current) {
      const aviso = await obtenerAvisoSinFondos({ cuentaCorrienteId: cuentaId, totalRequerido: totalDebitar, simbolo });
      if (aviso) {
        setAvisoSinFondos(aviso);
        return;
      }
    }
    sinFondosConfirmadoRef.current = false;

    setProcesando(true);
    try {
      // La fecha viaja como ISO completo (medianoche local): una fecha sin hora retrocedería un día en el servidor
      const respuesta = await registrarGastosBancarios({
        empresaId,
        cuentaCorrienteId: cuentaId,
        medioPagoId: Number(medioPagoId),
        fecha: fecha.toISOString(),
        esGerencial,
        numeroOperacion: numeroOperacion || undefined,
        descripcion: descripcion.trim() || undefined,
        tipoCambio: esMonedaNacional ? undefined : Number(tipoCambio),
        lineas: lineas.map((l) => ({ concepto: l.concepto, monto: Number(l.monto), glosa: l.glosa?.trim() || undefined })),
      });
      if (respuesta?.data) {
        await generarVouchers(respuesta.data);
        setResultado(respuesta.data);
        setShowConfirmacion(true);
        toast?.current?.show({ severity: "success", summary: "Gastos bancarios registrados", detail: respuesta.message, life: 4000 });
        onSuccess?.(respuesta.data);
      }
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo registrar los gastos bancarios", detail: mensajeDeError(err, "Error al registrar los gastos bancarios"), life: 10000 });
    }
    setProcesando(false);
  };

  const opcionesConcepto = conceptos.map((c) => ({ label: `${c.etiqueta} (cta. ${c.cuenta})`, value: c.codigo }));

  return (
    <>
      <Dialog header="🏦 Gastos Bancarios" visible={visible && !showConfirmacion} style={{ width: "1100px" }} onHide={onHide} modal maximizable>
        <form onSubmit={handleSubmit}>
          <Panel header="🏦 Datos del Gasto Bancario" className="mb-3">
            <div style={fila}>
              <div style={{ flex: 2 }}>
                <label className="font-bold block mb-1">Empresa *</label>
                <EmpresaSelector
                  empresaId={empresaId}
                  onEmpresaChange={(id) => {
                    setEmpresaId(id);
                    setCuentaId(null);
                    setMonedaCuenta(null);
                  }}
                  disabled={procesando}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">Fecha del Cargo *</label>
                <Calendar id="fecha" value={fecha} onChange={(e) => setFecha(e.value)} dateFormat="dd/mm/yy" showIcon disabled={procesando} style={{ width: "100%" }} />
              </div>
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
            </div>
            <div style={fila}>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación del Banco</label>
                <InputText id="numeroOperacion" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} placeholder="Número de operación bancaria" disabled={procesando} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="descripcion" className="font-bold">Glosa General</label>
                <InputText id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Cargos del estado de cuenta de octubre" disabled={procesando} style={{ width: "100%" }} />
              </div>
            </div>
          </Panel>

          <Panel header="📤 Cuenta del Cargo (EGRESO)" className="mb-3">
            <div style={fila}>
              <div style={{ flex: 2 }}>
                <label className="font-bold">Cuenta Corriente *</label>
                <CuentaCorrienteSelector
                  empresaIdPreseleccionada={empresaId}
                  value={cuentaId}
                  onChange={({ cuentaCorrienteId, moneda }) => {
                    setCuentaId(cuentaCorrienteId);
                    setMonedaCuenta(moneda);
                  }}
                  label=""
                  placeholder="Seleccione la cuenta donde el banco hizo el cargo"
                  mostrarSaldo={true}
                  disabled={procesando}
                />
              </div>
              <div style={{ flex: 1 }}>
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
            </div>
            {!esMonedaNacional && (
              <div>
                <label htmlFor="tipoCambio" className="font-bold">Tipo de Cambio (Venta) *</label>
                <InputNumber id="tipoCambio" value={tipoCambio} onValueChange={(e) => setTipoCambio(e.value)} mode="decimal" minFractionDigits={4} maxFractionDigits={4} disabled={procesando} style={{ width: "100%" }} placeholder="Tipo de cambio SUNAT" />
                <small className="p-text-secondary">Se propone el TC de venta de SUNAT; puede modificarlo. Se aplicará para registrar el asiento en soles</small>
              </div>
            )}
          </Panel>

          <Panel header="🧾 Gastos del Banco" className="mb-3">
            {lineas.map((l, i) => (
              <div key={l.clave} style={fila}>
                <div style={{ flex: 3 }}>
                  <label className="font-bold">{`Concepto ${i + 1} *`}</label>
                  <Dropdown
                    value={l.concepto}
                    options={opcionesConcepto}
                    onChange={(e) => cambiarLinea(l.clave, { concepto: e.value })}
                    placeholder="Seleccione el concepto"
                    disabled={procesando}
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="font-bold">{`Monto${simbolo ? ` (${simbolo})` : ""} *`}</label>
                  <InputNumber value={l.monto} onValueChange={(e) => cambiarLinea(l.clave, { monto: e.value })} mode="decimal" minFractionDigits={2} maxFractionDigits={2} min={0} disabled={procesando} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="font-bold">Detalle (opcional)</label>
                  <InputText value={l.glosa} onChange={(e) => cambiarLinea(l.clave, { glosa: e.target.value })} placeholder="Ej: Embargo del expediente 123-2026" disabled={procesando} style={{ width: "100%" }} />
                </div>
                <Button type="button" icon="pi pi-trash" severity="danger" outlined onClick={() => quitarLinea(l.clave)} disabled={procesando || lineas.length === 1} tooltip="Quitar este gasto" />
              </div>
            ))}
            <div className="flex justify-content-between align-items-center">
              <Button type="button" label="Agregar gasto" icon="pi pi-plus" severity="secondary" outlined onClick={() => setLineas((prev) => [...prev, nuevaLinea()])} disabled={procesando} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="font-bold">Total a Debitar:</span>
                <Tag severity="danger" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
                  {simbolo} {formatearNumero(totalDebitar)}
                </Tag>
              </div>
            </div>
            <small style={{ color: "#6c757d" }}>
              Cada gasto se registra como un egreso aparte (ITF / comisión) con su propio asiento: DEBE la cuenta de gasto, HABER la cuenta contable del banco.
            </small>
          </Panel>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={onHide} type="button" disabled={procesando} />
            <Button label="Registrar Gastos Bancarios" icon="pi pi-check" severity="success" type="submit" loading={procesando} />
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

      <ConfirmacionGastoBancarioDialog
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
