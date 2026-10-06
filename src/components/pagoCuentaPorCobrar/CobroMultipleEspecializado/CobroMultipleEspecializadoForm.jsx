import React, { useState, useEffect, useMemo, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../../utils/utils";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { actualizarUrlVoucherIndividual } from "../../../api/tesoreria/transferencias";
import { sincronizarVoucherCobroMultiple } from "../../../api/tesoreria/pagoEspecializadoCuentaPorCobrar";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import { generarYSubirVoucherIndividual } from "../../movimientoCaja/utils/VoucherIndividualMovimientoPDF";
import { generarYSubirVoucherConsolidado } from "./VoucherConsolidadoCobroMultiplePDF";
import ConfirmacionCobroMultipleDialog from "./ConfirmacionCobroMultipleDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * COBRO MÚLTIPLE (ESPECIALIZADO) DE FACTURAS DE UN CLIENTE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Réplica de PagoDeudasTributariasEspecializadoForm (que a su vez replica EntregarFondosForm)
 * adaptada al cobro de Cuentas por Cobrar:
 *   - Un cliente deposita UN solo monto para amortizar varias facturas: una sola operación
 *     bancaria, un solo movimiento de caja de INGRESO.
 *   - El monto de cada documento lo escribe el usuario a mano (no hay reparto automático);
 *     el pie de la tabla suma lo que pagó el cliente.
 *   - Solo se cobra el NETO: cada documento tiene como máximo saldo - detracción pendiente.
 *     Detracción, retención y percepción se registran por documento con el cobro individual,
 *     porque cada uno tiene su propio comprobante. Un documento queda pagado únicamente
 *     cuando se cancela la totalidad, incluido el impuesto.
 *   - Un solo cliente por operación; misma empresa, moneda y tipo de operación (fiscal/gerencial).
 *   - Tipo de cambio: siempre TC de venta (sell_price).
 */

const redondear2 = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const aCentimos = (valor) => BigInt(Math.round(Number(valor || 0) * 100));

// Neto cobrable de un documento = saldo - detracción pendiente (misma regla que el cobro individual)
const netoCobrable = (row) =>
  Math.max(0, redondear2(Number(row.saldoPendiente || 0) - Number(row.detraccionPendiente || 0)));

const CobroMultipleEspecializadoForm = ({
  cuentasPorCobrar = [],
  mediosPago = [],
  tiposMovimiento = [],
  empresas = [],
  onSubmit,
  onCancel,
  loading = false,
  toast,
}) => {
  const usuario = useAuthStore((state) => state.usuario);
  const ultimaConsultaTC = useRef(null);

  // Documentos marcados para cobrar (parten con todos los que llegan de la tabla de pendientes)
  const [seleccionados, setSeleccionados] = useState(cuentasPorCobrar);
  // Monto a cobrar por documento, escrito manualmente (parte en el neto cobrable)
  const [montos, setMontos] = useState({});

  // Datos del cobro (mismos nombres y semántica que EntregarFondosForm)
  const [fechaPago, setFechaPago] = useState(new Date());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cuentaDestinoId, setCuentaDestinoId] = useState(null);
  const [monedaDestinoSelector, setMonedaDestinoSelector] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [itf, setItf] = useState(0);
  const [comision, setComision] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(1);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);

  // Evita pisar la glosa que el usuario ya escribió al cambiar la selección
  const glosaEditada = useRef(false);

  const [procesando, setProcesando] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoPago, setResultadoPago] = useState(null);

  const cargando = loading || procesando;

  // ════════════════════════════════════════════════════════════
  // DATOS DERIVADOS DE LA SELECCIÓN
  // ════════════════════════════════════════════════════════════
  const base = seleccionados[0] || cuentasPorCobrar[0] || null;
  const empresaId = base?.empresa?.id;
  const cliente = base?.entidadComercial;
  const monedaDoc = base?.moneda;
  const esMonedaNacional = monedaDoc?.codigoSunat === "PEN";
  const simbolo = monedaDoc?.simbolo || "";
  const esGerencial = Boolean(base?.esGerencial);

  // El backend exige mismo cliente, empresa, moneda y tipo de operación: se valida también aquí
  const errorLote = useMemo(() => {
    if (seleccionados.length === 0) return null;
    const distintos = (fn) => new Set(seleccionados.map(fn)).size > 1;
    if (distintos((d) => Number(d.entidadComercial?.id))) return "Los documentos deben ser de un mismo cliente";
    if (distintos((d) => Number(d.empresa?.id))) return "Los documentos deben ser de la misma empresa";
    if (distintos((d) => Number(d.moneda?.id))) return "Los documentos deben estar en la misma moneda";
    if (distintos((d) => Boolean(d.esGerencial))) {
      return "No se pueden mezclar documentos gerenciales con documentos formales en un mismo cobro";
    }
    return null;
  }, [seleccionados]);

  // Total recibido del cliente = suma de lo que se descuenta de cada documento marcado
  const totalRecibido = useMemo(
    () => seleccionados.reduce((acc, d) => acc + Number(montos[d.id] || 0), 0),
    [seleccionados, montos],
  );
  const totalSaldos = useMemo(
    () => seleccionados.reduce((acc, d) => acc + Number(d.saldoPendiente || 0), 0),
    [seleccionados],
  );
  const totalNetoCobrable = useMemo(
    () => seleccionados.reduce((acc, d) => acc + netoCobrable(d), 0),
    [seleccionados],
  );

  // Lo que realmente queda en el banco: el ITF y la comisión se descuentan del depósito
  const totalNetoAcreditado = Number(totalRecibido || 0) - Number(itf || 0) - Number(comision || 0);

  // ════════════════════════════════════════════════════════════
  // EFECTOS
  // ════════════════════════════════════════════════════════════
  // Si la tabla de pendientes cambia de selección, el formulario parte de ella con el
  // neto cobrable como monto inicial de cada documento
  useEffect(() => {
    setSeleccionados(cuentasPorCobrar);
    const iniciales = {};
    cuentasPorCobrar.forEach((d) => {
      iniciales[d.id] = netoCobrable(d);
    });
    setMontos(iniciales);
  }, [cuentasPorCobrar]);

  // Glosa automática mientras el usuario no la edite, según la referencia contable
  // COBRO_FACTURA_VENTA (casos A venta formal y B venta gerencial por igual):
  // "Cobro de fact. {NumDoc} por venta de {Concepto}". Debe mantenerse idéntica a la glosa por
  // defecto del backend (ver MAPA DE BIFURCACIONES en cobroCuentaPorCobrarMultiple.service.js).
  useEffect(() => {
    if (glosaEditada.current || seleccionados.length === 0) return;
    const documentos = seleccionados
      .map((d) => d.numeroDocumentoFinal || d.documentoNumero)
      .filter(Boolean)
      .join(" / ");
    const conceptos = [
      ...new Set(seleccionados.flatMap((d) => (d.concepto ? d.concepto.split(" / ") : []))),
    ].join(" / ");
    const concepto = conceptos.length > 150 ? `${conceptos.slice(0, 147)}...` : conceptos;

    setDescripcion(
      concepto
        ? `Cobro de fact. ${documentos} por venta de ${concepto}`
        : `Cobro de fact. ${documentos} - CLIENTE: ${cliente?.razonSocial || ""}`,
    );
  }, [seleccionados]);

  // Tipo de cambio SUNAT: solo si los documentos no son en soles.
  // Siempre TC de venta (sell_price), igual que en todo el sistema.
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaPago || esMonedaNacional || !monedaDoc) return;

      const year = fechaPago.getFullYear();
      const month = String(fechaPago.getMonth() + 1).padStart(2, "0");
      const day = String(fechaPago.getDate()).padStart(2, "0");
      const fechaISO = `${year}-${month}-${day}`;

      if (ultimaConsultaTC.current === fechaISO) return;

      try {
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });
        if (tipoCambioData && tipoCambioData.sell_price) {
          const tc = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tc);
          ultimaConsultaTC.current = fechaISO;
          toast?.current?.show({
            severity: "success",
            summary: "✅ Tipo de Cambio Actualizado",
            detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta)`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error al consultar tipo de cambio:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo obtener el tipo de cambio de SUNAT",
          life: 4000,
        });
      }
    };

    consultarTipoCambio();
  }, [fechaPago, esMonedaNacional, monedaDoc?.id]);

  // ════════════════════════════════════════════════════════════
  // VALIDACIONES (mismos criterios que EntregarFondosForm)
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    const mostrarError = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
      return false;
    };

    if (seleccionados.length === 0) return mostrarError("Debe marcar al menos un documento a cobrar");
    if (errorLote) return mostrarError(errorLote);
    if (!fechaPago) return mostrarError("Debe ingresar la fecha de la operación");
    if (!descripcion || descripcion.trim() === "") {
      return mostrarError("Debe ingresar la glosa de la operación");
    }
    if (!numeroOperacion || numeroOperacion.trim() === "") {
      return mostrarError("Debe ingresar el número de operación");
    }
    if (!cuentaDestinoId) return mostrarError("Debe seleccionar la cuenta de destino");

    for (const d of seleccionados) {
      const monto = Number(montos[d.id] || 0);
      if (!(monto > 0)) {
        return mostrarError(`Indique el monto a cobrar del documento ${d.documentoNumero}`);
      }
      if (aCentimos(monto) > aCentimos(netoCobrable(d))) {
        return mostrarError(
          `El monto del documento ${d.documentoNumero} supera su neto cobrable (${simbolo} ${formatearNumero(netoCobrable(d))})`,
        );
      }
    }

    if (!medioPagoId) return mostrarError("Debe seleccionar el medio de pago");
    if (!tipoMovimientoId) return mostrarError("Debe seleccionar el tipo de movimiento");
    if (monedaDestinoSelector && Number(monedaDestinoSelector.id) !== Number(monedaDoc?.id)) {
      return mostrarError("La moneda de la cuenta no coincide con la de los documentos");
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) {
      return mostrarError("Debe ingresar un tipo de cambio válido");
    }
    if (Number(itf || 0) + Number(comision || 0) > totalRecibido) {
      return mostrarError("El ITF y la comisión no pueden superar lo recibido del cliente");
    }

    return true;
  };

  // Vouchers individuales (ingreso, ITF y comisión), mismo mecanismo que EntregarFondosForm,
  // más el voucher consolidado de toda la operación (se guarda en el primer pago y se copia
  // a los demás). Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (resultado) => {
    try {
      const movimientos = resultado.movimientos;

      for (const clave of ["ingreso", "itf", "comision"]) {
        const movimiento = movimientos[clave];
        if (!movimiento) continue;

        try {
          const empresaMovimiento = empresas.find(
            (e) => Number(e.id) === Number(movimiento.empresaId),
          );
          const voucher = await generarYSubirVoucherIndividual(
            movimiento,
            null,
            empresaMovimiento,
            null,
            usuario,
          );

          if (voucher.success && voucher.urlPdf && voucher.urlPdf.trim() !== "") {
            await actualizarUrlVoucherIndividual(movimiento.id, voucher.urlPdf);
            movimientos[clave].urlOperacionIndividualOperacionCaja = voucher.urlPdf;
          }
        } catch (error) {
          console.error(`❌ Error voucher ${clave}:`, error);
        }
      }

      // Voucher consolidado: al subirlo, el backend lo guarda en el primer pago de la
      // operación y luego se copia a los demás pagos para que todos muestren el mismo archivo
      try {
        const empresaPago = empresas.find(
          (e) => Number(e.id) === Number(movimientos.ingreso?.empresaId),
        );
        const consolidado = await generarYSubirVoucherConsolidado(
          {
            correlativo: resultado.correlativo,
            fechaPago,
            numeroOperacion,
            descripcion,
            tipoCambio: esMonedaNacional ? 1 : tipoCambio,
            esGerencial,
          },
          resultado,
          empresaPago,
          usuario,
        );
        if (consolidado.success) {
          resultado.urlVoucherConsolidado = consolidado.urlPdf;
          await sincronizarVoucherCobroMultiple(consolidado.pagoId);
        } else {
          console.error("❌ Error voucher consolidado:", consolidado.error);
        }
      } catch (error) {
        console.error("❌ Error voucher consolidado:", error);
      }
    } catch (error) {
      console.error("❌ Error al generar vouchers:", error);
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El cobro se procesó pero hubo un error al generar algunos vouchers",
        life: 5000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setProcesando(true);
    try {
      // El hook useCobrarFacturasMultiple ejecuta el servicio y ya muestra los errores
      const resultado = await onSubmit({
        items: seleccionados.map((d) => ({
          cuentaPorCobrarId: Number(d.origenId),
          monto: Number(montos[d.id]),
        })),
        fechaPago: fechaPago.toISOString(),
        cuentaCorrienteDestinoId: Number(cuentaDestinoId),
        medioPagoId: Number(medioPagoId),
        tipoMovimientoId: Number(tipoMovimientoId),
        numeroOperacion,
        descripcion: descripcion.trim(),
        itf: Number(itf || 0),
        comision: Number(comision || 0),
        tipoCambio: esMonedaNacional ? 1 : Number(tipoCambio),
      });

      if (resultado?.data) {
        await generarVouchers(resultado.data);
        setResultadoPago(resultado.data);
        setShowConfirmacion(true);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    } finally {
      setProcesando(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // TEMPLATES DE LA TABLA DE DOCUMENTOS
  // ════════════════════════════════════════════════════════════
  const estaMarcado = (row) => seleccionados.some((s) => s.id === row.id);

  const montoTemplate = (valor) => (row) => (
    <div className="text-right">
      {row.moneda?.simbolo} {formatearNumero(valor(row))}
    </div>
  );

  // Monto manual por documento: acotado al neto cobrable
  const aCobrarTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const neto = netoCobrable(row);
    return (
      <InputNumber
        value={montos[row.id] ?? 0}
        onValueChange={(e) =>
          setMontos((prev) => ({ ...prev, [row.id]: Math.min(Number(e.value || 0), neto) }))
        }
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        max={neto}
        disabled={cargando}
        inputStyle={{ textAlign: "right", fontWeight: "bold", width: "100%" }}
        style={{ width: "100%" }}
      />
    );
  };

  const quedaTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const resta = Number(row.saldoPendiente || 0) - Number(montos[row.id] || 0);
    return (
      <div className="text-right">
        {row.moneda?.simbolo} {formatearNumero(resta)}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-fluid">
        {/* SECCIÓN 1: Facturas a cobrar (con casillas y monto manual; el pie suma lo recibido) */}
        <Panel header="🧾 Facturas a Cobrar" className="mb-3">
          <DataTable
            value={cuentasPorCobrar}
            selection={seleccionados}
            onSelectionChange={(e) => setSeleccionados(e.value)}
            dataKey="id"
            emptyMessage="No hay documentos para cobrar"
            size="small"
            stripedRows
            showGridlines
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} footer="" />
            <Column
              header="Documento"
              body={(row) => <span className="font-bold">{row.documentoNumero}</span>}
              footer={`${seleccionados.length} de ${cuentasPorCobrar.length} marcado(s)`}
            />
            <Column header="F. Emisión" body={(row) => formatearFecha(row.fechaEmision)} />
            <Column header="F. Vencimiento" body={(row) => formatearFecha(row.fechaVencimiento)} />
            <Column
              header="Saldo Pendiente"
              body={montoTemplate((row) => row.saldoPendiente)}
              footer={
                <div className="text-right">
                  {simbolo} {formatearNumero(totalSaldos)}
                </div>
              }
            />
            <Column
              header="Detracción Pendiente"
              body={montoTemplate((row) => row.detraccionPendiente)}
            />
            <Column
              header="Neto Cobrable"
              body={montoTemplate((row) => netoCobrable(row))}
              footer={
                <div className="text-right">
                  {simbolo} {formatearNumero(totalNetoCobrable)}
                </div>
              }
            />
            <Column
              header="Monto a Cobrar"
              body={aCobrarTemplate}
              style={{ minWidth: "11rem" }}
              footer={
                <div className="text-right font-bold" style={{ color: "#2e7d32" }}>
                  TOTAL RECIBIDO: {simbolo} {formatearNumero(totalRecibido)}
                </div>
              }
            />
            <Column header="Queda" body={quedaTemplate} />
          </DataTable>
          {errorLote && <small className="p-error block mt-2">{errorLote}</small>}
          <small className="p-text-secondary block mt-2">
            Marque las facturas que cancela el cliente y escriba cuánto se descuenta de cada una.
            Solo se cobra el neto: la detracción, retención o percepción se registra por documento
            con el cobro individual, y la factura queda pagada únicamente al cancelar el total.
          </small>
        </Panel>

        <Divider />

        {/* SECCIÓN 2: Datos del Cobro (ingreso, mismo layout que EntregarFondosForm) */}
        <Panel header="💳 Datos del Cobro">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* DATOS GENERALES */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">Fecha del Cobro *</label>
                <Calendar
                  id="fecha"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación *</label>
                <InputText
                  id="numeroOperacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="Ingrese número de operación"
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
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
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="font-bold block mb-2">Operación</label>
                <Tag
                  value={esGerencial ? "GERENCIAL" : "FISCAL"}
                  severity={esGerencial ? "help" : "success"}
                  icon={esGerencial ? "pi pi-eye-slash" : "pi pi-eye"}
                />
              </div>
            </div>

            {/* CLIENTE: viene de los documentos, no se elige */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="font-bold">Cliente</label>
                <InputText
                  value={
                    cliente
                      ? `${cliente.numeroDocumento ? `${cliente.numeroDocumento} - ` : ""}${cliente.razonSocial}`
                      : ""
                  }
                  disabled
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
            </div>

            {/* CUENTA DESTINO */}
            <Panel header={<span>📥 Cuenta de Destino (INGRESO)</span>} toggleable>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 5,
                  marginBottom: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="cuentaDestino" className="font-bold">Cuenta Corriente *</label>
                  <CuentaCorrienteSelector
                    empresaIdPreseleccionada={empresaId}
                    value={cuentaDestinoId}
                    onChange={({ cuentaCorrienteId, moneda }) => {
                      setCuentaDestinoId(cuentaCorrienteId);
                      setMonedaDestinoSelector(moneda);
                    }}
                    label=""
                    placeholder="Seleccione cuenta de destino"
                    mostrarSaldo={true}
                    disabled={cargando}
                  />
                </div>
              </div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  marginBottom: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label htmlFor="medioPagoDestino" className="font-bold">Medio de Pago *</label>
                  <Dropdown
                    id="medioPagoDestino"
                    value={medioPagoId}
                    options={mediosPago}
                    onChange={(e) => setMedioPagoId(e.value)}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione medio de pago"
                    disabled={cargando}
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <TipoMovimientoSelector
                    tiposMovimiento={tiposMovimiento}
                    value={tipoMovimientoId}
                    onChange={setTipoMovimientoId}
                    esIngreso={true}
                    required={true}
                    placeholder="Buscar tipo de movimiento..."
                    disabled={cargando}
                  />
                </div>
              </div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label className="font-bold">Total Recibido ({simbolo})</label>
                  <Tag
                    severity="success"
                    style={{ fontSize: "1.2rem", padding: "0.5rem 1rem", width: "100%" }}
                  >
                    {simbolo} {formatearNumero(totalRecibido)}
                  </Tag>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="itfDestino" className="font-bold">ITF</label>
                  <InputNumber
                    id="itfDestino"
                    value={itf}
                    onValueChange={(e) => setItf(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={cargando}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="comisionDestino" className="font-bold">Comisión</label>
                  <InputNumber
                    id="comisionDestino"
                    value={comision}
                    onValueChange={(e) => setComision(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={cargando}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-bold">Neto Acreditado:</span>
                    <Tag severity="info" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
                      {simbolo} {formatearNumero(totalNetoAcreditado)}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* TIPO DE CAMBIO: solo si los documentos no son en soles (siempre TC de venta) */}
              {!esMonedaNacional && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="tipoCambio" className="font-bold">Tipo de Cambio (Venta) *</label>
                  <InputNumber
                    id="tipoCambio"
                    value={tipoCambio}
                    onValueChange={(e) => setTipoCambio(e.value)}
                    mode="decimal"
                    minFractionDigits={4}
                    maxFractionDigits={4}
                    disabled={cargando}
                    style={{ width: "100%" }}
                    placeholder="Tipo de cambio SUNAT"
                  />
                  <small className="p-text-secondary">
                    Se aplicará para registrar el asiento en soles
                  </small>
                </div>
              )}
            </Panel>
          </div>
        </Panel>

        {/* Botones */}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            onClick={onCancel}
            type="button"
            disabled={cargando}
          />
          <Button
            label="Cobrar Facturas"
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={procesando}
            disabled={cargando || seleccionados.length === 0}
          />
        </div>
      </form>

      <ConfirmacionCobroMultipleDialog
        visible={showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultadoPago(null);
          onCancel?.(); // Cierra el formulario principal
        }}
        resultadoPago={resultadoPago}
        simbolo={simbolo}
      />
    </>
  );
};

export default CobroMultipleEspecializadoForm;
