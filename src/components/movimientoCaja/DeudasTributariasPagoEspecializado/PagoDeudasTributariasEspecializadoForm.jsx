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
import { sincronizarAdjuntosPagoDeudaTributaria } from "../../../api/tesoreria/pagoDeudaTributaria";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import EntidadComercialSelector from "../../common/EntidadComercialSelector";
import { generarYSubirVoucherIndividual } from "../utils/VoucherIndividualMovimientoPDF";
import { generarYSubirVoucherConsolidado } from "./VoucherConsolidadoPagoDeudasTributariasPDF";
import ConfirmacionPagoDeudasTributariasDialog from "./ConfirmacionPagoDeudasTributariasDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PAGO MÚLTIPLE (ESPECIALIZADO) DE DEUDAS TRIBUTARIAS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Réplica de PagoDeudasPersonalEspecializadoForm (que a su vez replica EntregarFondosForm)
 * con estas diferencias por negocio:
 *   - Paga N deudas tributarias (IGV, Renta, ESSALUD, ONP…) con UN solo egreso.
 *   - El usuario puede desmarcar ítems aquí; el footer suma solo los marcados.
 *   - El monto puede ser total o parcial: se reparte proporcionalmente al saldo
 *     (método del mayor resto, igual que el backend) y se muestra como vista previa.
 *   - Entidad destino SIEMPRE obligatoria: se preselecciona la entidad recaudadora del tipo
 *     de deuda (TipoDeudaTributaria.entidadRecaudadoraId) cuando es la misma para todas las
 *     deudas marcadas; si hay varias (p. ej. SUNAT y ESSALUD) la elige el usuario.
 *   - Las deudas tributarias siempre son formales: la operación es FISCAL (no existe gerencial).
 *   - La glosa toma el mes del período tributario de la deuda (p. ej. "2026-01").
 */

// Tipo de movimiento SUNAT: valor por defecto sugerido (mismo valor que pagoDeudaTributaria.service.js).
// El selector muestra todos los tipos, igual que el resto de implementaciones.
const TIPO_MOVIMIENTO_SUNAT_ID = 165;

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

/**
 * El período tributario puede ser mensual ("2026-01"), trimestral ("2025-Q4") o anual ("2026").
 * Debe mantenerse idéntico al del backend (pagoDeudaTributariaMultiple.service.js).
 */
const textoPeriodo = (periodo, fechaGeneracion) => {
  const texto = String(periodo || "").trim();
  let m = texto.match(/^(\d{4})-(\d{2})$/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return `MES DE ${MESES[Number(m[2]) - 1]} ${m[1]}`;
  m = texto.match(/^(\d{4})-Q([1-4])$/i);
  if (m) return `TRIMESTRE ${m[2]} DE ${m[1]}`;
  m = texto.match(/^(\d{4})$/);
  if (m) return `AÑO ${m[1]}`;
  return `MES DE ${MESES[new Date(fechaGeneracion).getUTCMonth()]}`;
};

const aCentimos = (valor) => BigInt(Math.round(Number(valor || 0) * 100));

/**
 * Reparto proporcional al saldo en céntimos (método del mayor resto).
 * Debe mantenerse idéntico al del backend (pagoDeudaTributariaMultiple.service.js).
 */
const repartirProporcional = (saldosCent, totalCent) => {
  const sumaSaldos = saldosCent.reduce((acc, s) => acc + s, 0n);
  if (sumaSaldos === 0n) return saldosCent.map(() => 0n);

  const partes = saldosCent.map((s) => (totalCent * s) / sumaSaldos);
  const restos = saldosCent.map((s) => (totalCent * s) % sumaSaldos);

  let faltante = totalCent - partes.reduce((acc, p) => acc + p, 0n);
  const orden = restos
    .map((resto, indice) => ({ resto, indice }))
    .sort((a, b) => (a.resto === b.resto ? a.indice - b.indice : a.resto > b.resto ? -1 : 1));

  for (const { indice } of orden) {
    if (faltante <= 0n) break;
    partes[indice] += 1n;
    faltante -= 1n;
  }
  return partes;
};

const PagoDeudasTributariasEspecializadoForm = ({
  deudas = [],
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

  // Ítems marcados para pagar (parten con todos los que llegan de la tabla de pendientes)
  const [seleccionados, setSeleccionados] = useState(deudas);

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
  const [montoPago, setMontoPago] = useState(0);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);
  const [entidadDestinoId, setEntidadDestinoId] = useState(null);

  // Evitan pisar lo que el usuario ya escribió/eligió al cambiar la selección
  const montoEditado = useRef(false);
  const glosaEditada = useRef(false);
  const entidadElegidaPorUsuario = useRef(false);

  const [procesando, setProcesando] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoPago, setResultadoPago] = useState(null);

  const cargando = loading || procesando;

  // ════════════════════════════════════════════════════════════
  // DATOS DERIVADOS DE LA SELECCIÓN
  // ════════════════════════════════════════════════════════════
  const base = seleccionados[0] || deudas[0] || null;
  const empresaId = base?.empresa?.id;
  const monedaDeuda = base?.moneda;
  const esMonedaNacional = monedaDeuda?.codigoSunat === "PEN";
  const simbolo = monedaDeuda?.simbolo || "";
  // Las deudas tributarias siempre son formales: no existe esGerencial en DeudaTributaria
  const esGerencial = false;

  // El backend exige misma empresa y moneda: se valida también aquí
  const errorLote = useMemo(() => {
    if (seleccionados.length === 0) return null;
    const distintos = (fn) => new Set(seleccionados.map(fn)).size > 1;
    if (distintos((d) => Number(d.empresa?.id))) return "Las deudas deben ser de la misma empresa";
    if (distintos((d) => Number(d.moneda?.id))) return "Las deudas deben estar en la misma moneda";
    return null;
  }, [seleccionados]);

  const totalSaldos = useMemo(
    () => seleccionados.reduce((acc, d) => acc + Number(d.saldoPendiente || 0), 0),
    [seleccionados],
  );

  // Vista previa del reparto proporcional por ítem marcado
  const montoPorDeuda = useMemo(() => {
    if (seleccionados.length === 0) return {};
    const saldosCent = seleccionados.map((d) => aCentimos(d.saldoPendiente));
    const sumaCent = saldosCent.reduce((acc, s) => acc + s, 0n);
    const totalCent = aCentimos(montoPago);
    if (totalCent <= 0n || totalCent > sumaCent) return {};
    const partes = repartirProporcional(saldosCent, totalCent);
    const mapa = {};
    seleccionados.forEach((d, i) => {
      mapa[d.id] = Number(partes[i]) / 100;
    });
    return mapa;
  }, [seleccionados, montoPago]);

  // Entidades recaudadoras distintas entre las deudas marcadas (SUNAT, ESSALUD, ONP…)
  const entidadesRecaudadoras = useMemo(() => {
    const mapa = new Map();
    seleccionados.forEach((d) => {
      const entidad = d.tipoDeuda?.entidadRecaudadora;
      if (entidad?.id) mapa.set(Number(entidad.id), entidad);
    });
    return [...mapa.values()];
  }, [seleccionados]);

  // Si todas las deudas tienen tipo de deuda con entidad recaudadora y es la misma, se sugiere esa
  const todasConRecaudadora = seleccionados.every((d) => d.tipoDeuda?.entidadRecaudadoraId);
  const unaSolaRecaudadora = todasConRecaudadora && entidadesRecaudadoras.length === 1;
  const recaudadoraUnica = unaSolaRecaudadora ? entidadesRecaudadoras[0] : null;

  const cuentaOrigen =
    cuentasCorrientes.find((c) => Number(c.id) === Number(cuentaOrigenId)) || null;

  const esCheque = useMemo(() => {
    if (!medioPagoId || !mediosPago.length) return false;
    const medioPago = mediosPago.find((m) => Number(m.id) === Number(medioPagoId));
    return medioPago?.nombre?.toUpperCase().includes("CHEQUE") || false;
  }, [medioPagoId, mediosPago]);

  const totalDebitado = Number(montoPago || 0) + Number(itf || 0) + Number(comision || 0);

  // ════════════════════════════════════════════════════════════
  // EFECTOS
  // ════════════════════════════════════════════════════════════
  // Si la tabla de pendientes cambia de selección, el formulario parte de ella
  useEffect(() => {
    setSeleccionados(deudas);
  }, [deudas]);

  // Monto por defecto = total de lo marcado (pago total); si el usuario ya lo editó solo se acota
  useEffect(() => {
    setMontoPago((prev) =>
      montoEditado.current ? Math.min(Number(prev || 0), totalSaldos) : totalSaldos,
    );
  }, [totalSaldos]);

  // Tipo de movimiento por defecto: SUNAT, solo si existe en el catálogo cargado
  useEffect(() => {
    if (tipoMovimientoId) return;
    const sunat = tiposMovimiento.find((t) => Number(t.id) === TIPO_MOVIMIENTO_SUNAT_ID);
    if (sunat) setTipoMovimientoId(Number(sunat.id));
  }, [tiposMovimiento]);

  // Glosa automática (misma regla que el backend) mientras el usuario no la edite
  useEffect(() => {
    if (glosaEditada.current || seleccionados.length === 0) return;
    const tipos = [...new Set(seleccionados.map((d) => d.tipoDeuda?.nombre?.toUpperCase()).filter(Boolean))];
    const periodos = [
      ...new Set(seleccionados.map((d) => textoPeriodo(d.periodo, d.fechaEmision))),
    ];
    setDescripcion(`PAGO DE ${tipos.join(" / ")} ${periodos.join(" / ")}`);
  }, [seleccionados]);

  // Entidad destino: si todas las deudas comparten entidad recaudadora se preselecciona;
  // si hay varias (p. ej. SUNAT y ESSALUD) no se preselecciona nada y la elige el usuario.
  // Nunca se pisa una elección manual del usuario.
  useEffect(() => {
    if (entidadElegidaPorUsuario.current) return;
    setEntidadDestinoId(recaudadoraUnica ? Number(recaudadoraUnica.id) : null);
  }, [recaudadoraUnica?.id, entidadesRecaudadoras.length]);

  // Tipo de cambio SUNAT: solo si las deudas no son en soles.
  // Se usa TC de venta (sell_price) porque alimenta el asiento (igual que EntregarFondosForm).
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaPago || esMonedaNacional || !monedaDeuda) return;

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
  }, [fechaPago, esMonedaNacional, monedaDeuda?.id]);

  // ════════════════════════════════════════════════════════════
  // VALIDACIONES (mismos criterios que EntregarFondosForm)
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    const mostrarError = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
      return false;
    };

    if (seleccionados.length === 0) return mostrarError("Debe marcar al menos una deuda a pagar");
    if (errorLote) return mostrarError(errorLote);
    if (!fechaPago) return mostrarError("Debe ingresar la fecha de la operación");
    if (!descripcion || descripcion.trim() === "") {
      return mostrarError("Debe ingresar la glosa de la operación");
    }
    if (!numeroOperacion || numeroOperacion.trim() === "") {
      return mostrarError("Debe ingresar el número de operación");
    }
    if (!entidadDestinoId) return mostrarError("Debe seleccionar la entidad destino");
    if (!cuentaOrigenId) return mostrarError("Debe seleccionar la cuenta de origen");
    if (!montoPago || montoPago <= 0) return mostrarError("El monto a pagar debe ser mayor a cero");
    if (aCentimos(montoPago) > aCentimos(totalSaldos)) {
      return mostrarError(
        `El monto a pagar no puede superar la suma de saldos (${simbolo} ${formatearNumero(totalSaldos)})`,
      );
    }
    if (!medioPagoId) return mostrarError("Debe seleccionar el medio de pago");
    if (esCheque && (!numeroCheque || numeroCheque.trim() === "")) {
      return mostrarError("Debe ingresar el número de cheque");
    }
    if (!tipoMovimientoId) return mostrarError("Debe seleccionar el tipo de movimiento");
    if (monedaOrigenSelector && Number(monedaOrigenSelector.id) !== Number(monedaDeuda?.id)) {
      return mostrarError("La moneda de la cuenta no coincide con la de las deudas");
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

      for (const clave of ["egreso", "itfOrigen", "comisionOrigen"]) {
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

      // Voucher consolidado: al subirlo, el backend guarda su URL en el primer pago de la
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
          await sincronizarAdjuntosPagoDeudaTributaria(consolidado.pagoId);
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
      // El hook usePagarDeudasTributariasMultiple ejecuta el servicio y ya muestra los errores
      let descripcionFinal = descripcion.trim();
      if (numeroCheque) descripcionFinal += ` N° CHEQUE: ${numeroCheque}`;

      const resultado = await onSubmit({
        deudaIds: seleccionados.map((d) => Number(d.origenId)),
        montoPago: Number(montoPago),
        fechaPago: fechaPago.toISOString(),
        cuentaCorrienteOrigenId: Number(cuentaOrigenId),
        medioPagoId: Number(medioPagoId),
        tipoMovimientoId: Number(tipoMovimientoId),
        entidadComercialId: Number(entidadDestinoId),
        numeroOperacion,
        descripcion: descripcionFinal,
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
  // TEMPLATES DE LA TABLA DE ÍTEMS
  // ════════════════════════════════════════════════════════════
  const estaMarcado = (row) => seleccionados.some((s) => s.id === row.id);

  const saldoTemplate = (row) => (
    <div className="text-right">
      {row.moneda?.simbolo} {formatearNumero(row.saldoPendiente)}
    </div>
  );

  const aPagarTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const monto = montoPorDeuda[row.id];
    return (
      <div className="text-right font-bold" style={{ color: "#2e7d32" }}>
        {row.moneda?.simbolo} {formatearNumero(monto || 0)}
      </div>
    );
  };

  const quedaTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const resta = Number(row.saldoPendiente || 0) - Number(montoPorDeuda[row.id] || 0);
    return (
      <div className="text-right">
        {row.moneda?.simbolo} {formatearNumero(resta)}
      </div>
    );
  };

  const totalAPagar = Object.values(montoPorDeuda).reduce((acc, m) => acc + m, 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-fluid">
        {/* SECCIÓN 1: Deudas a pagar (con casillas; el footer suma solo las marcadas) */}
        <Panel header="📋 Deudas a Pagar" className="mb-3">
          <DataTable
            value={deudas}
            selection={seleccionados}
            onSelectionChange={(e) => setSeleccionados(e.value)}
            dataKey="id"
            emptyMessage="No hay deudas para pagar"
            size="small"
            stripedRows
            showGridlines
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} footer="" />
            <Column
              header="Tipo de Deuda"
              body={(row) => <span className="font-bold">{row.tipoDeuda?.nombre}</span>}
              footer={`${seleccionados.length} de ${deudas.length} marcada(s)`}
            />
            <Column header="Período" body={(row) => row.periodo} />
            <Column header="N° Declaración" body={(row) => row.numeroDeclaracion || "-"} />
            <Column header="F. Emisión" body={(row) => formatearFecha(row.fechaEmision)} />
            <Column header="F. Vencimiento" body={(row) => formatearFecha(row.fechaVencimiento)} />
            <Column
              header="S. Inicial"
              body={(row) => (
                <Tag
                  value={row.esSaldoInicial ? "SI" : "NO"}
                  severity={row.esSaldoInicial ? "warning" : "secondary"}
                />
              )}
              style={{ textAlign: "center" }}
            />
            <Column
              header="Saldo Pendiente"
              body={saldoTemplate}
              footer={
                <div className="text-right">
                  {simbolo} {formatearNumero(totalSaldos)}
                </div>
              }
            />
            <Column
              header="A Pagar"
              body={aPagarTemplate}
              footer={
                <div className="text-right" style={{ color: "#2e7d32" }}>
                  {simbolo} {formatearNumero(totalAPagar)}
                </div>
              }
            />
            <Column header="Queda" body={quedaTemplate} />
          </DataTable>
          {errorLote && <small className="p-error block mt-2">{errorLote}</small>}
          <small className="p-text-secondary block mt-2">
            Marque o desmarque las deudas que se pagarán. Si el monto es menor a la suma de saldos,
            el pago se reparte proporcionalmente al saldo de cada deuda marcada.
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
                <label htmlFor="fecha" className="font-bold">Fecha de Pago *</label>
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

            {/* ENTIDAD DESTINO: siempre obligatoria */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <EntidadComercialSelector
                  key={`entidad-${empresaId || 0}`}
                  value={entidadDestinoId}
                  onChange={(id) => {
                    entidadElegidaPorUsuario.current = true;
                    setEntidadDestinoId(id ? Number(id) : null);
                  }}
                  empresaIdPreseleccionada={empresaId}
                  label="Entidad Destino"
                  placeholder="Seleccione la entidad destino del pago"
                  required={true}
                  disabled={cargando}
                />
                {!todasConRecaudadora && (
                  <small className="p-error block">
                    Alguno de los tipos de deuda marcados no tiene entidad recaudadora. Asígnela en
                    Tipos de Deuda Tributaria para que se preseleccione automáticamente.
                  </small>
                )}
                {todasConRecaudadora && entidadesRecaudadoras.length > 1 && (
                  <small className="p-text-secondary block">
                    Hay {entidadesRecaudadoras.length} entidades recaudadoras en el pago (
                    {entidadesRecaudadoras.map((e) => e.razonSocial).join(", ")}): indique la entidad
                    que recibe el dinero.
                  </small>
                )}
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
                  <label htmlFor="montoOrigen" className="font-bold">
                    Monto a Pagar ({simbolo}) *
                  </label>
                  <InputNumber
                    id="montoOrigen"
                    value={montoPago}
                    onValueChange={(e) => {
                      montoEditado.current = true;
                      setMontoPago(e.value);
                    }}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    max={totalSaldos}
                    disabled={cargando}
                    style={{ width: "100%" }}
                  />
                  {aCentimos(montoPago) < aCentimos(totalSaldos) && (
                    <small className="p-text-secondary">
                      Pago parcial: se reparte proporcionalmente entre las deudas marcadas.
                    </small>
                  )}
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

              {/* TIPO DE CAMBIO: solo si las deudas no son en soles */}
              {!esMonedaNacional && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="tipoCambio" className="font-bold">Tipo de Cambio *</label>
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
            label="Pagar Deudas"
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={cargando}
            disabled={seleccionados.length === 0}
          />
        </div>
      </form>

      {/* Confirmación del pago: deudas pagadas, movimientos y asientos */}
      <ConfirmacionPagoDeudasTributariasDialog
        visible={showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultadoPago(null);
          onCancel(); // Cierra el formulario principal
        }}
        resultadoPago={resultadoPago}
        simbolo={simbolo}
      />
    </>
  );
};

export default PagoDeudasTributariasEspecializadoForm;
