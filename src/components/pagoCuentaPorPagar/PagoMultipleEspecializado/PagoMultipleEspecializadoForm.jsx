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
import { sincronizarVoucherPagoMultiple } from "../../../api/tesoreria/pagoEspecializadoCuentaPorPagar";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import { generarYSubirVoucherIndividual } from "../../movimientoCaja/utils/VoucherIndividualMovimientoPDF";
import { generarYSubirVoucherConsolidado } from "./VoucherConsolidadoPagoMultiplePDF";
import ConfirmacionPagoMultipleDialog from "./ConfirmacionPagoMultipleDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PAGO MÚLTIPLE (ESPECIALIZADO) DE FACTURAS DE UN PROVEEDOR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Réplica de CobroMultipleEspecializadoForm (cobro de facturas de un cliente) adaptada
 * al pago de Cuentas por Pagar:
 *   - Se paga a un proveedor con UN solo monto para amortizar varias facturas: una sola
 *     operación bancaria, un solo movimiento de caja de EGRESO.
 *   - El monto de cada documento lo escribe el usuario a mano (no hay reparto automático);
 *     el pie de la tabla suma lo que se paga al proveedor.
 *   - Solo se paga el NETO: cada documento tiene como máximo saldo - detracción pendiente.
 *     Detracción, retención y percepción se registran por documento con el pago individual,
 *     porque cada uno tiene su propio comprobante. Un documento queda pagado únicamente
 *     cuando se cancela la totalidad, incluido el impuesto.
 *   - Un solo proveedor por operación; misma empresa y moneda. Documentos formales o
 *     gerenciales (compras sin factura), nunca mezclados: en los gerenciales el gasto se
 *     reparte entre las cuentas de gasto del detalle de la orden de compra.
 *   - Tipo de cambio: siempre TC de venta (sell_price).
 *   - No se bloquea por saldo insuficiente: solo se advierte.
 */

const redondear2 = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const aCentimos = (valor) => BigInt(Math.round(Number(valor || 0) * 100));

// Neto pagable de un documento = saldo - detracción pendiente (misma regla que el pago individual)
const netoPagable = (row) =>
  Math.max(0, redondear2(Number(row.saldoPendiente || 0) - Number(row.detraccionPendiente || 0)));

const PagoMultipleEspecializadoForm = ({
  cuentasPorPagar = [],
  cuentasCorrientes = [],
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

  // Documentos marcados para pagar (parten con todos los que llegan de la tabla de pendientes)
  const [seleccionados, setSeleccionados] = useState(cuentasPorPagar);
  // Monto a pagar por documento, escrito manualmente (parte en el neto pagable)
  const [montos, setMontos] = useState({});

  // Datos del pago (mismos nombres y semántica que EntregarFondosForm)
  const [fechaPago, setFechaPago] = useState(new Date());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cuentaOrigenId, setCuentaOrigenId] = useState(null);
  const [monedaOrigenSelector, setMonedaOrigenSelector] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [numeroCheque, setNumeroCheque] = useState("");
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
  const base = seleccionados[0] || cuentasPorPagar[0] || null;
  const empresaId = base?.empresa?.id;
  const proveedor = base?.entidadComercial;
  const monedaDoc = base?.moneda;
  const esMonedaNacional = monedaDoc?.codigoSunat === "PEN";
  const simbolo = monedaDoc?.simbolo || "";
  // Toda la operación es fiscal o gerencial (nunca mezcladas, ver errorLote)
  const esGerencial = Boolean(base?.esGerencial);

  // El backend exige mismo proveedor, empresa y moneda, sin mezclar gerenciales con formales:
  // se valida también aquí
  const errorLote = useMemo(() => {
    if (seleccionados.length === 0) return null;
    const distintos = (fn) => new Set(seleccionados.map(fn)).size > 1;
    if (distintos((d) => Number(d.entidadComercial?.id))) return "Los documentos deben ser de un mismo proveedor";
    if (distintos((d) => Number(d.empresa?.id))) return "Los documentos deben ser de la misma empresa";
    if (distintos((d) => Number(d.moneda?.id))) return "Los documentos deben estar en la misma moneda";
    if (distintos((d) => Boolean(d.esGerencial))) {
      return "No se pueden mezclar documentos gerenciales con documentos formales en un mismo pago";
    }
    return null;
  }, [seleccionados]);

  // Total a pagar al proveedor = suma de lo que se paga de cada documento marcado
  const totalPago = useMemo(
    () => seleccionados.reduce((acc, d) => acc + Number(montos[d.id] || 0), 0),
    [seleccionados, montos],
  );
  const totalSaldos = useMemo(
    () => seleccionados.reduce((acc, d) => acc + Number(d.saldoPendiente || 0), 0),
    [seleccionados],
  );
  const totalNetoPagable = useMemo(
    () => seleccionados.reduce((acc, d) => acc + netoPagable(d), 0),
    [seleccionados],
  );

  const cuentaOrigen =
    cuentasCorrientes.find((c) => Number(c.id) === Number(cuentaOrigenId)) || null;

  const esCheque = useMemo(() => {
    if (!medioPagoId || !mediosPago.length) return false;
    const medioPago = mediosPago.find((m) => Number(m.id) === Number(medioPagoId));
    return medioPago?.nombre?.toUpperCase().includes("CHEQUE") || false;
  }, [medioPagoId, mediosPago]);

  // Lo que realmente sale del banco: el pago más el ITF y la comisión
  const totalDebitado = Number(totalPago || 0) + Number(itf || 0) + Number(comision || 0);

  // ════════════════════════════════════════════════════════════
  // EFECTOS
  // ════════════════════════════════════════════════════════════
  // Si la tabla de pendientes cambia de selección, el formulario parte de ella con el
  // neto pagable como monto inicial de cada documento
  useEffect(() => {
    setSeleccionados(cuentasPorPagar);
    const iniciales = {};
    cuentasPorPagar.forEach((d) => {
      iniciales[d.id] = netoPagable(d);
    });
    setMontos(iniciales);
  }, [cuentasPorPagar]);

  // Glosa automática (misma regla que el backend) mientras el usuario no la edite, según la
  // referencia contable: honorarios "PAGO DE HONORARIOS N {NumDoc} - {RazonSocial}" y
  // gerenciales (gastos sin factura) "GASTOS VARIOS - {Concepto}"
  useEffect(() => {
    if (glosaEditada.current || seleccionados.length === 0) return;
    const documentos = seleccionados.map((d) => d.documentoNumero).filter(Boolean).join(" / ");
    const todosHonorarios = seleccionados.every((d) => d.esHonorarios);
    const todosGastosSinFactura = seleccionados.every((d) => d.esGerencial && !d.esHonorarios);
    const conceptos = [
      ...new Set(seleccionados.flatMap((d) => (d.concepto ? d.concepto.split(" / ") : []))),
    ].join(" / ");
    const concepto = conceptos.length > 150 ? `${conceptos.slice(0, 147)}...` : conceptos;

    // Los casos A / B / C son los del backend (ver MAPA DE BIFURCACIONES en
    // pagoCuentaPorPagarMultiple.service.js); la regla debe mantenerse idéntica
    if (todosHonorarios) {
      // [CASO B] honorarios
      setDescripcion(`PAGO DE HONORARIOS N ${documentos} - ${proveedor?.razonSocial || ""}`);
    } else if (todosGastosSinFactura) {
      // [CASO C] gasto sin factura (gerencial)
      setDescripcion(`GASTOS VARIOS - ${concepto || documentos}`);
    } else {
      // [CASO A] factura estándar o mezcla de casos
      setDescripcion(`PAGO DE ${documentos} - PROVEEDOR: ${proveedor?.razonSocial || ""}`);
    }
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

    if (seleccionados.length === 0) return mostrarError("Debe marcar al menos un documento a pagar");
    if (errorLote) return mostrarError(errorLote);
    if (!fechaPago) return mostrarError("Debe ingresar la fecha de la operación");
    if (!descripcion || descripcion.trim() === "") {
      return mostrarError("Debe ingresar la glosa de la operación");
    }
    if (!numeroOperacion || numeroOperacion.trim() === "") {
      return mostrarError("Debe ingresar el número de operación");
    }
    if (!cuentaOrigenId) return mostrarError("Debe seleccionar la cuenta de origen");

    for (const d of seleccionados) {
      const monto = Number(montos[d.id] || 0);
      if (!(monto > 0)) {
        return mostrarError(`Indique el monto a pagar del documento ${d.documentoNumero}`);
      }
      if (aCentimos(monto) > aCentimos(netoPagable(d))) {
        return mostrarError(
          `El monto del documento ${d.documentoNumero} supera su neto pagable (${simbolo} ${formatearNumero(netoPagable(d))})`,
        );
      }
    }

    if (!medioPagoId) return mostrarError("Debe seleccionar el medio de pago");
    if (esCheque && (!numeroCheque || numeroCheque.trim() === "")) {
      return mostrarError("Debe ingresar el número de cheque");
    }
    if (!tipoMovimientoId) return mostrarError("Debe seleccionar el tipo de movimiento");
    if (monedaOrigenSelector && Number(monedaOrigenSelector.id) !== Number(monedaDoc?.id)) {
      return mostrarError("La moneda de la cuenta no coincide con la de los documentos");
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) {
      return mostrarError("Debe ingresar un tipo de cambio válido");
    }

    // Solo advierte: el pago puede dejar la cuenta en negativo y no debe bloquearse
    const saldo = Number(cuentaOrigen?.saldoActual ?? cuentaOrigen?.saldo);
    if (cuentaOrigen && !Number.isNaN(saldo) && saldo < totalDebitado) {
      toast?.current?.show({
        severity: "warn",
        summary: "Saldo Insuficiente",
        detail: `Saldo disponible: ${simbolo} ${formatearNumero(saldo)}. Requerido: ${simbolo} ${formatearNumero(totalDebitado)}. La cuenta quedará en negativo.`,
        life: 6000,
      });
    }

    return true;
  };

  // Vouchers individuales (egreso, ITF y comisión), mismo mecanismo que EntregarFondosForm,
  // más el voucher consolidado de toda la operación (se guarda en el primer pago y se copia
  // a los demás). Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (resultado) => {
    try {
      const movimientos = resultado.movimientos;

      for (const clave of ["egreso", "itf", "comision"]) {
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
          (e) => Number(e.id) === Number(movimientos.egreso?.empresaId),
        );
        const consolidado = await generarYSubirVoucherConsolidado(
          {
            correlativo: resultado.correlativo,
            fechaPago,
            numeroOperacion,
            descripcion,
            tipoCambio: esMonedaNacional ? 1 : tipoCambio,
            esGerencial,
            numeroCheque,
          },
          resultado,
          empresaPago,
          usuario,
        );
        if (consolidado.success) {
          resultado.urlVoucherConsolidado = consolidado.urlPdf;
          await sincronizarVoucherPagoMultiple(consolidado.pagoId);
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
        detail: "El pago se procesó pero hubo un error al generar algunos vouchers",
        life: 5000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setProcesando(true);
    try {
      // El hook usePagarFacturasMultiple ejecuta el servicio y ya muestra los errores.
      // El N° de cheque lo agrega el backend a la glosa de los movimientos.
      const resultado = await onSubmit({
        items: seleccionados.map((d) => ({
          cuentaPorPagarId: Number(d.origenId),
          monto: Number(montos[d.id]),
        })),
        fechaPago: fechaPago.toISOString(),
        cuentaCorrienteOrigenId: Number(cuentaOrigenId),
        medioPagoId: Number(medioPagoId),
        tipoMovimientoId: Number(tipoMovimientoId),
        numeroOperacion,
        numeroCheque: esCheque ? numeroCheque : undefined,
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

  // Monto manual por documento: acotado al neto pagable
  const aPagarTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const neto = netoPagable(row);
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
        {/* SECCIÓN 1: Facturas a pagar (con casillas y monto manual; el pie suma lo que se paga) */}
        <Panel header="🧾 Facturas a Pagar" className="mb-3">
          <DataTable
            value={cuentasPorPagar}
            selection={seleccionados}
            onSelectionChange={(e) => setSeleccionados(e.value)}
            dataKey="id"
            emptyMessage="No hay documentos para pagar"
            size="small"
            stripedRows
            showGridlines
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} footer="" />
            <Column
              header="Documento"
              body={(row) => <span className="font-bold">{row.documentoNumero}</span>}
              footer={`${seleccionados.length} de ${cuentasPorPagar.length} marcado(s)`}
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
              header="Neto Pagable"
              body={montoTemplate((row) => netoPagable(row))}
              footer={
                <div className="text-right">
                  {simbolo} {formatearNumero(totalNetoPagable)}
                </div>
              }
            />
            <Column
              header="Monto a Pagar"
              body={aPagarTemplate}
              style={{ minWidth: "11rem" }}
              footer={
                <div className="text-right font-bold" style={{ color: "#c62828" }}>
                  TOTAL A PAGAR: {simbolo} {formatearNumero(totalPago)}
                </div>
              }
            />
            <Column header="Queda" body={quedaTemplate} />
          </DataTable>
          {errorLote && <small className="p-error block mt-2">{errorLote}</small>}
          <small className="p-text-secondary block mt-2">
            Marque las facturas que se cancelan y escriba cuánto se paga de cada una. Solo se paga
            el neto: la detracción, retención o percepción se registra por documento con el pago
            individual, y la factura queda pagada únicamente al cancelar el total.
          </small>
        </Panel>

        <Divider />

        {/* SECCIÓN 2: Datos del Pago (egreso, mismo layout que EntregarFondosForm) */}
        <Panel header="💳 Datos del Pago">
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
                <label htmlFor="fecha" className="font-bold">Fecha del Pago *</label>
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

            {/* PROVEEDOR: viene de los documentos, no se elige */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="font-bold">Proveedor</label>
                <InputText
                  value={
                    proveedor
                      ? `${proveedor.numeroDocumento ? `${proveedor.numeroDocumento} - ` : ""}${proveedor.razonSocial}`
                      : ""
                  }
                  disabled
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
            </div>

            {/* CUENTA ORIGEN */}
            <Panel header={<span>📤 Cuenta de Origen (EGRESO)</span>} toggleable>
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
                  <label htmlFor="cuentaOrigen" className="font-bold">Cuenta Corriente *</label>
                  <CuentaCorrienteSelector
                    empresaIdPreseleccionada={empresaId}
                    value={cuentaOrigenId}
                    onChange={({ cuentaCorrienteId, moneda }) => {
                      setCuentaOrigenId(cuentaCorrienteId);
                      setMonedaOrigenSelector(moneda);
                    }}
                    label=""
                    placeholder="Seleccione cuenta de origen"
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
                  <label htmlFor="medioPagoOrigen" className="font-bold">Medio de Pago *</label>
                  <Dropdown
                    id="medioPagoOrigen"
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
                {esCheque && (
                  <div style={{ flex: 2 }}>
                    <label htmlFor="numeroChequeOrigen" className="font-bold">Nº Cheque *</label>
                    <InputText
                      id="numeroChequeOrigen"
                      value={numeroCheque}
                      onChange={(e) => setNumeroCheque(e.target.value)}
                      placeholder="Ingrese número de cheque"
                      disabled={cargando}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
                <div style={{ flex: 2 }}>
                  <TipoMovimientoSelector
                    tiposMovimiento={tiposMovimiento}
                    value={tipoMovimientoId}
                    onChange={setTipoMovimientoId}
                    esIngreso={false}
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
                  <label className="font-bold">Total a Pagar ({simbolo})</label>
                  <Tag
                    severity="warning"
                    style={{ fontSize: "1.2rem", padding: "0.5rem 1rem", width: "100%" }}
                  >
                    {simbolo} {formatearNumero(totalPago)}
                  </Tag>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="itfOrigen" className="font-bold">ITF</label>
                  <InputNumber
                    id="itfOrigen"
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
                  <label htmlFor="comisionOrigen" className="font-bold">Comisión</label>
                  <InputNumber
                    id="comisionOrigen"
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
                    <span className="font-bold">Total a Debitar:</span>
                    <Tag severity="danger" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
                      {simbolo} {formatearNumero(totalDebitado)}
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
            label="Pagar Facturas"
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={procesando}
            disabled={cargando || seleccionados.length === 0}
          />
        </div>
      </form>

      <ConfirmacionPagoMultipleDialog
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

export default PagoMultipleEspecializadoForm;
