import React, { useState, useEffect, useMemo, useRef } from "react";
import ConfirmarSinFondosDialog from "../../common/ConfirmarSinFondosDialog";
import { obtenerAvisoSinFondos } from "../../../utils/avisoSinFondos";
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
import { sincronizarAdjuntosPagoCuotaPrestamo, getFacturasFactoringDisponibles } from "../../../api/tesoreria/operacionPrestamo";
import { getFacturasParaCuotas, getCronogramaPrestamo } from "../../../api/tesoreria/prestamoBancarios";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import LiquidacionFactoringPanel from "./LiquidacionFactoringPanel";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import { generarYSubirVoucherIndividual } from "../utils/VoucherIndividualMovimientoPDF";
import { generarYSubirVoucherConsolidado } from "./VoucherConsolidadoPagoCuotasPrestamoPDF";
import ConfirmacionOperacionPrestamoDialog from "./ConfirmacionOperacionPrestamoDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * OPERACIONES DE PRÉSTAMO BANCARIO (ESPECIALIZADO): UN COMPONENTE, DOS MODOS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Mismo criterio que TransferenciaInternaDialog (un componente para egreso e ingreso) pero con
 * una diferencia de fondo: aquí las dos operaciones NUNCA van juntas en una misma operación
 * (un desembolso y el pago de una cuota son eventos distintos), por eso son dos modos de la
 * misma pantalla y el backend tiene un servicio por operación (operacionPrestamo.service.js).
 *
 *   modo "PAGO_CUOTAS"  → EGRESO:  cuotas de UN mismo préstamo, con un solo egreso.
 *                         Monto de cada cuota y mora editables (pago parcial permitido).
 *   modo "DESEMBOLSO"   → INGRESO: el banco deposita el préstamo en la cuenta de la empresa.
 *
 * Réplica del patrón de PagoMultipleEspecializadoForm / CobroMultipleEspecializadoForm:
 * tabla con casillas, panel de la cuenta, ITF y comisión, tipo de cambio de venta editable,
 * vouchers individuales por movimiento y confirmación con asientos.
 *
 * El caso contable (préstamo estándar / factoring) lo resuelve el backend con
 * TipoPrestamo.esFactoring; el formulario solo lo informa con una etiqueta.
 */

// Tipos de movimiento sugeridos por defecto (el usuario puede elegir cualquiera:
// el selector muestra todos los tipos)
const TIPO_MOVIMIENTO_PAGO_CUOTAS_DEFECTO = 152; // PRESTAMOS (egreso)
const TIPO_MOVIMIENTO_DESEMBOLSO_DEFECTO = 15; // PRESTAMOS BANCARIOS (ingreso)

const redondear2 = (valor) => Math.round(Number(valor || 0) * 100) / 100;
const aCentimos = (valor) => BigInt(Math.round(Number(valor || 0) * 100));

// Días de atraso de una cuota a la fecha de pago (0 si no está vencida)
const diasDeAtraso = (fechaVencimiento, fechaPago) => {
  if (!fechaVencimiento || !fechaPago) return 0;
  const pago = new Date(fechaPago);
  pago.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((pago - new Date(fechaVencimiento)) / 86400000));
};

// Mora sugerida: misma fórmula del registro de pago de cuotas existente
// (monto de la cuota × tasa moratoria anual / 365 × días de atraso). El usuario puede ajustarla
// porque el banco cobra el monto real.
const moraSugerida = (fila, fechaPago) => {
  const dias = diasDeAtraso(fila.fechaVencimiento, fechaPago);
  const tasa = Number(fila.prestamo?.tasaMoratoria || 0);
  if (dias <= 0 || tasa <= 0) return 0;
  return redondear2(Number(fila.montoTotal) * (tasa / 100 / 365) * dias);
};

const OperacionPrestamoForm = ({
  modo = "PAGO_CUOTAS",
  filas = [],
  cuentasCorrientes = [],
  mediosPago = [],
  tiposMovimiento = [],
  empresas = [],
  onSubmit,
  onCancel,
  onOperacionRegistrada,
  loading = false,
  toast,
}) => {
  const esDesembolso = modo === "DESEMBOLSO";
  const usuario = useAuthStore((state) => state.usuario);
  const ultimaConsultaTC = useRef(null);

  // Cuotas marcadas para pagar (parten con todas las que llegan de la tabla de pendientes)
  const [seleccionados, setSeleccionados] = useState(filas);
  // Montos editables por cuota: lo que se paga de la cuota y la mora de esta operación
  const [montos, setMontos] = useState({});
  const [moras, setMoras] = useState({});
  // Cuotas cuya mora ya editó el usuario (no se recalcula al cambiar la fecha)
  const morasEditadas = useRef(new Set());

  const [fecha, setFecha] = useState(new Date());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cuentaId, setCuentaId] = useState(null);
  const [monedaCuentaSelector, setMonedaCuentaSelector] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [numeroCheque, setNumeroCheque] = useState("");
  const [itf, setItf] = useState(0);
  const [comision, setComision] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(1);
  const [tipoMovimientoId, setTipoMovimientoId] = useState(null);

  // Factoring: facturas (CxC) que se entregan en descuento y neto que deposita la entidad
  const [facturasDisponibles, setFacturasDisponibles] = useState([]);
  const [facturasElegidas, setFacturasElegidas] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  // Factoring cuyas cuotas ya están amarradas a sus facturas: el desembolso usa esas facturas y no se eligen aquí
  const [facturasDeCuotas, setFacturasDeCuotas] = useState(false);
  const [montoDescuento, setMontoDescuento] = useState(0);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);

  // Evita pisar la glosa que el usuario ya escribió al cambiar la selección
  const glosaEditada = useRef(false);

  // Factoring: quién pagó al banco. true = el cliente (sin caja, solo asiento y cuota cancelada); false = nosotros (pago normal desde nuestras cuentas)
  const [pagoElCliente, setPagoElCliente] = useState(true);

  const [procesando, setProcesando] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultado, setResultado] = useState(null);

  const cargando = loading || procesando;

  // ════════════════════════════════════════════════════════════
  // DATOS DERIVADOS DE LA SELECCIÓN
  // ════════════════════════════════════════════════════════════
  const base = seleccionados[0] || filas[0] || null;
  const empresaId = base?.empresa?.id;
  const monedaPrestamo = base?.moneda;
  const esMonedaNacional = monedaPrestamo?.codigoSunat === "PEN";
  const simbolo = monedaPrestamo?.simbolo || "";
  const prestamo = base?.prestamo;
  const esFactoring = Boolean(prestamo?.esFactoring);
  // La modalidad del interés la define el préstamo: descontado por adelantado (el banco deposita el neto) o diferido en las cuotas
  const interesDescontado = Boolean(prestamo?.interesDescontado);
  const pagaElCliente = !esDesembolso && esFactoring && pagoElCliente;

  // El backend exige cuotas de un mismo préstamo (y un único préstamo por desembolso)
  const errorLote = useMemo(() => {
    if (seleccionados.length === 0) return null;
    if (esDesembolso && seleccionados.length > 1) {
      return "Un desembolso se registra de uno en uno: seleccione un solo préstamo";
    }
    if (new Set(seleccionados.map((f) => Number(f.prestamo?.id))).size > 1) {
      return "Las cuotas deben pertenecer a un mismo préstamo";
    }
    return null;
  }, [seleccionados, esDesembolso]);

  // Total de la operación: cuotas = monto de cada cuota + su mora; desembolso = monto del préstamo
  const totalPrincipal = useMemo(() => {
    // Factoring: el ingreso de caja es el NETO depositado (bruto menos el interés descontado por adelantado; igual al bruto
    // si el interés es diferido). ITF y comisión nunca se restan aquí.
    if (esDesembolso) {
      if (!esFactoring) return Number(base?.saldoPendiente || 0);
      const bruto = redondear2(facturasElegidas.reduce((a, f) => a + Number(f.saldoPendiente || 0), 0));
      return redondear2(bruto - (interesDescontado ? Number(montoDescuento || 0) : 0));
    }
    return seleccionados.reduce(
      (acc, f) => acc + Number(montos[f.id] || 0) + Number(moras[f.id] || 0),
      0,
    );
  }, [esDesembolso, esFactoring, facturasElegidas, montoDescuento, interesDescontado, base, seleccionados, montos, moras]);
  const totalSaldos = useMemo(
    () => seleccionados.reduce((acc, f) => acc + Number(f.saldoPendiente || 0), 0),
    [seleccionados],
  );

  // Factoring: bruto = suma de las facturas elegidas; debe igualar el monto del préstamo
  // Búsqueda por razón social del cliente (sin distinguir mayúsculas ni tildes)
  const normalizar = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const facturasVisibles = useMemo(() => {
    const texto = normalizar(busquedaCliente).trim();
    const lista = texto ? facturasDisponibles.filter((f) => normalizar(f.cliente).includes(texto)) : facturasDisponibles;
    // Las más recientes primero (por fecha de emisión, luego vencimiento e id)
    const tiempo = (fecha) => (fecha ? new Date(fecha).getTime() : 0);
    return [...lista].sort((a, b) => tiempo(b.fechaEmision) - tiempo(a.fechaEmision) || tiempo(b.fechaVencimiento) - tiempo(a.fechaVencimiento) || Number(b.id) - Number(a.id));
  }, [facturasDisponibles, busquedaCliente]);
  // Con la lista filtrada, la selección de las facturas ocultas se conserva
  const cambiarSeleccionFacturas = (nueva) => {
    const visibles = new Set(facturasVisibles.map((f) => f.id));
    setFacturasElegidas((previa) => [...previa.filter((f) => !visibles.has(f.id)), ...nueva]);
  };

  const brutoFacturas = useMemo(() => redondear2(facturasElegidas.reduce((a, f) => a + Number(f.saldoPendiente || 0), 0)), [facturasElegidas]);
  const descuentoFactoring = redondear2(interesDescontado ? montoDescuento : 0);
  const netoFactoring = redondear2(brutoFacturas - descuentoFactoring);
  const montoPrestamoFactoring = Number(base?.saldoPendiente || 0);
  // El banco financia el total de cada factura: se cancelan todas aunque el monto del préstamo no las cubra (solo se avisa)
  const diferenciaConPrestamo = redondear2(brutoFacturas - montoPrestamoFactoring);
  const hayDiferenciaConPrestamo = esDesembolso && esFactoring && facturasElegidas.length > 0 && Math.abs(diferenciaConPrestamo) > 0.01;

  // Facturas del desembolso: las de las cuotas del préstamo (una por cuota); un préstamo sin cuotas amarradas conserva la selección manual
  useEffect(() => {
    if (!esDesembolso || !esFactoring || !empresaId || !monedaPrestamo?.id) return undefined;
    let vigente = true;
    setCargandoFacturas(true);
    setFacturasElegidas([]);
    setBusquedaCliente("");
    setFacturasDeCuotas(false);
    (async () => {
      try {
        const cuotas = prestamo?.id ? await getCronogramaPrestamo(Number(prestamo.id)) : [];
        const idsCuotas = new Set((cuotas || []).filter((c) => c.cuentaPorCobrarId).map((c) => String(c.cuentaPorCobrarId)));
        if (idsCuotas.size > 0) {
          const lista = await getFacturasParaCuotas({ tipo: "VENTAS", empresaId, monedaId: monedaPrestamo.id, prestamoId: prestamo.id });
          const deCuotas = (lista || []).filter((f) => idsCuotas.has(String(f.id))).map((f) => ({ ...f, cliente: f.entidad }));
          if (!vigente) return;
          setFacturasDisponibles(deCuotas);
          setFacturasElegidas(deCuotas);
          setFacturasDeCuotas(true);
        } else {
          const lista = await getFacturasFactoringDisponibles({ empresaId, monedaId: monedaPrestamo.id });
          if (vigente) setFacturasDisponibles(lista);
        }
      } catch (err) {
        if (vigente) {
          toast?.current?.show({
            severity: "error",
            summary: "No se pudieron cargar las facturas",
            detail: err?.response?.data?.mensaje || err?.response?.data?.message || "Error al consultar las facturas del factoring",
            life: 8000,
          });
        }
      } finally {
        if (vigente) setCargandoFacturas(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [esDesembolso, esFactoring, empresaId, monedaPrestamo?.id, filas]);

  // Interés descontado por adelantado: lo define el registro del préstamo, no las facturas elegidas:
  // monto aprobado (financiado) menos monto a desembolsar (neto que deposita el banco). El usuario puede ajustarlo con el
  // neto del estado de cuenta. Con interés diferido no hay descuento en el desembolso.
  const interesDelPrestamo = interesDescontado
    ? Math.max(0, redondear2(Number(prestamo?.montoAprobado || 0) - Number(prestamo?.montoDesembolsado || 0)))
    : 0;
  useEffect(() => {
    if (esDesembolso && esFactoring) setMontoDescuento(interesDelPrestamo);
  }, [esDesembolso, esFactoring, prestamo?.id, interesDelPrestamo]);

  const cuentaSeleccionada =
    cuentasCorrientes.find((c) => Number(c.id) === Number(cuentaId)) || null;

  const esCheque = useMemo(() => {
    if (esDesembolso || !medioPagoId || !mediosPago.length) return false;
    const medioPago = mediosPago.find((m) => Number(m.id) === Number(medioPagoId));
    return medioPago?.nombre?.toUpperCase().includes("CHEQUE") || false;
  }, [esDesembolso, medioPagoId, mediosPago]);

  // Egreso: lo que sale del banco = pago + ITF + comisión. Ingreso: lo que queda = desembolso - ITF - comisión
  const totalDebitado = totalPrincipal + Number(itf || 0) + Number(comision || 0);
  const totalAcreditado = totalPrincipal; // ITF y comisión nunca se restan: son movimientos aparte

  // ════════════════════════════════════════════════════════════
  // EFECTOS
  // ════════════════════════════════════════════════════════════
  // Valores iniciales al abrir (o si la selección de la tabla cambia): monto = saldo de la cuota,
  // cuenta propuesta por el préstamo, comisión inicial sugerida en el desembolso y fecha prevista
  useEffect(() => {
    setSeleccionados(filas);
    morasEditadas.current = new Set();

    const montosIniciales = {};
    filas.forEach((f) => {
      montosIniciales[f.id] = Number(f.saldoPendiente || 0);
    });
    setMontos(montosIniciales);

    const primera = filas[0];
    if (primera?.prestamo?.cuentaCorrienteId) {
      setCuentaId(Number(primera.prestamo.cuentaCorrienteId));
    }
    if (esDesembolso) {
      setComision(Number(primera?.prestamo?.comisionInicial || 0));
      if (primera?.fechaVencimiento) setFecha(new Date(primera.fechaVencimiento));
    }
  }, [filas]);

  // Tipo de movimiento sugerido (solo si existe y el usuario aún no eligió uno)
  useEffect(() => {
    if (tipoMovimientoId || !tiposMovimiento.length) return;
    const sugerido = esDesembolso
      ? TIPO_MOVIMIENTO_DESEMBOLSO_DEFECTO
      : TIPO_MOVIMIENTO_PAGO_CUOTAS_DEFECTO;
    if (tiposMovimiento.some((t) => Number(t.id) === sugerido)) setTipoMovimientoId(sugerido);
  }, [tiposMovimiento, esDesembolso]);

  // Mora sugerida de cada cuota según la fecha de pago, salvo las que el usuario ya editó
  useEffect(() => {
    if (esDesembolso) return;
    setMoras((prev) => {
      const nuevas = { ...prev };
      seleccionados.forEach((f) => {
        if (!morasEditadas.current.has(f.id)) nuevas[f.id] = moraSugerida(f, fecha);
      });
      return nuevas;
    });
  }, [seleccionados, fecha, esDesembolso]);

  // Glosa automática (misma regla que el backend) mientras el usuario no la edite:
  // [CASO A] préstamo estándar y [CASO B] factoring, ver MAPA DE BIFURCACIONES en
  // operacionPrestamo.service.js
  useEffect(() => {
    if (glosaEditada.current || seleccionados.length === 0 || !prestamo) return;
    const banco = base?.entidadComercial?.razonSocial || "";
    const detalle = esDesembolso
      ? `PRESTAMO ${prestamo.numeroPrestamo}`
      : `PRESTAMO ${prestamo.numeroPrestamo} CUOTA(S) ${seleccionados
          .map((f) => f.cuota?.numeroCuota)
          .join(", ")}`;

    if (esDesembolso) {
      setDescripcion(
        esFactoring
          ? `POR INGRESO DE FACTORING ${banco} - ${detalle}`
          : `POR EL PRESTAMO RECIBIDO DEL ${banco}, SEGÚN CONTRATO - ${detalle}`,
      );
    } else {
      setDescripcion(
        esFactoring
          ? `PAGO DE FACTORING ${banco} - ${detalle}`
          : `POR EL PAGO DE LA CUOTA DEL PRESTAMO OTORGADO POR ${banco} - ${detalle}`,
      );
    }
  }, [seleccionados, esFactoring, esDesembolso]);

  // Tipo de cambio SUNAT: solo si el préstamo no es en soles. Siempre TC de venta (sell_price);
  // el usuario puede editarlo y se respeta lo que escriba.
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fecha || esMonedaNacional || !monedaPrestamo) return;

      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, "0");
      const day = String(fecha.getDate()).padStart(2, "0");
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
  }, [fecha, esMonedaNacional, monedaPrestamo?.id]);

  // ════════════════════════════════════════════════════════════
  // VALIDACIONES (mismos criterios que EntregarFondosForm)
  // ════════════════════════════════════════════════════════════
  const [avisoSinFondos, setAvisoSinFondos] = useState(null);
  const sinFondosConfirmadoRef = useRef(false);

  const validarFormulario = () => {
    const mostrarError = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
      return false;
    };

    if (seleccionados.length === 0) {
      return mostrarError(esDesembolso ? "Debe seleccionar un préstamo" : "Debe marcar al menos una cuota a pagar");
    }
    if (errorLote) return mostrarError(errorLote);
    if (esDesembolso && esFactoring) {
      if (facturasElegidas.length === 0) {
        return mostrarError("Un factoring se desembolsa contra facturas: seleccione las facturas que entrega en descuento.");
      }
      if (descuentoFactoring < 0) return mostrarError("El descuento / interés no puede ser negativo.");
      if (descuentoFactoring >= brutoFacturas) return mostrarError("El descuento / interés debe ser menor al total de las facturas.");
    }
    if (!fecha) return mostrarError("Debe ingresar la fecha de la operación");
    if (!descripcion || descripcion.trim() === "") {
      return mostrarError("Debe ingresar la glosa de la operación");
    }
    if (!numeroOperacion || numeroOperacion.trim() === "") {
      return mostrarError("Debe ingresar el número de operación");
    }
    if (!cuentaId) {
      return mostrarError(esDesembolso ? "Debe seleccionar la cuenta de destino" : "Debe seleccionar la cuenta de origen");
    }

    if (!esDesembolso) {
      for (const f of seleccionados) {
        const monto = Number(montos[f.id] || 0);
        if (!(monto > 0)) {
          return mostrarError(`Indique el monto a pagar de la cuota ${f.cuota?.numeroCuota}`);
        }
        if (aCentimos(monto) > aCentimos(f.saldoPendiente)) {
          return mostrarError(
            `El monto de la cuota ${f.cuota?.numeroCuota} supera su saldo pendiente (${simbolo} ${formatearNumero(f.saldoPendiente)})`,
          );
        }
      }
    }

    if (!medioPagoId) return mostrarError("Debe seleccionar el medio de pago");
    if (esCheque && (!numeroCheque || numeroCheque.trim() === "")) {
      return mostrarError("Debe ingresar el número de cheque");
    }
    if (!tipoMovimientoId) return mostrarError("Debe seleccionar el tipo de movimiento");
    if (monedaCuentaSelector && Number(monedaCuentaSelector.id) !== Number(monedaPrestamo?.id)) {
      return mostrarError("La moneda de la cuenta no coincide con la del préstamo");
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) {
      return mostrarError("Debe ingresar un tipo de cambio válido");
    }
    return true;
  };

  // Vouchers individuales de cada movimiento (principal, ITF y comisión), mismo mecanismo que
  // EntregarFondosForm. Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (data) => {
    try {
      for (const clave of ["principal", "itf", "comision"]) {
        const movimiento = data.movimientos[clave];
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
            data.movimientos[clave].urlOperacionIndividualOperacionCaja = voucher.urlPdf;
          }
        } catch (error) {
          console.error(`❌ Error voucher ${clave}:`, error);
        }
      }

      // Voucher consolidado del pago de cuotas: al subirlo, el backend guarda su URL en el primer
      // pago de la operación y luego se copia a los demás pagos para que todos muestren el mismo archivo
      if (data.operacion === "PAGO_CUOTAS") {
        try {
          const empresaPago = empresas.find(
            (e) => Number(e.id) === Number(data.movimientos?.principal?.empresaId),
          );
          const consolidado = await generarYSubirVoucherConsolidado(
            {
              correlativo: data.correlativo,
              fechaPago: fecha,
              numeroOperacion,
              // Si el usuario no escribió glosa, el backend armó una: se usa la del movimiento
              descripcion: descripcion.trim() || data.movimientos?.principal?.descripcion,
              tipoCambio: esMonedaNacional ? 1 : tipoCambio,
              numeroCheque: esCheque ? numeroCheque : undefined,
            },
            data,
            empresaPago,
            usuario,
          );
          if (consolidado.success) {
            data.urlVoucherConsolidado = consolidado.urlPdf;
            await sincronizarAdjuntosPagoCuotaPrestamo(consolidado.pagoId);
          } else {
            console.error("❌ Error voucher consolidado:", consolidado.error);
          }
        } catch (error) {
          console.error("❌ Error voucher consolidado:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error al generar vouchers:", error);
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La operación se procesó pero hubo un error al generar algunos vouchers",
        life: 5000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Egreso sin fondos: no se bloquea, pero se pide confirmación antes de procesar (saldo real de la cuenta elegida)
    if (!esDesembolso && !sinFondosConfirmadoRef.current) {
      const aviso = await obtenerAvisoSinFondos({ cuentaCorrienteId: cuentaId, totalRequerido: totalDebitado, simbolo });
      if (aviso) {
        setAvisoSinFondos(aviso);
        return;
      }
    }
    sinFondosConfirmadoRef.current = false;

    setProcesando(true);
    try {
      // El hook useOperacionPrestamo ejecuta el servicio y ya muestra los errores.
      // El N° de cheque lo agrega el backend a la glosa de los movimientos.
      const comunes = {
        medioPagoId: Number(medioPagoId),
        tipoMovimientoId: Number(tipoMovimientoId),
        numeroOperacion,
        descripcion: descripcion.trim(),
        itf: Number(itf || 0),
        comision: Number(comision || 0),
        tipoCambio: esMonedaNacional ? 1 : Number(tipoCambio),
      };

      const respuesta = await onSubmit(
        esDesembolso
          ? {
              ...comunes,
              prestamoBancarioId: Number(base.origenId),
              ...(esFactoring && {
                facturasFactoringIds: facturasElegidas.map((f) => Number(f.id)),
                montoDescuento: descuentoFactoring,
              }),
              fechaDesembolso: fecha.toISOString(),
              cuentaCorrienteDestinoId: Number(cuentaId),
            }
          : {
              ...comunes,
              items: seleccionados.map((f) => ({
                cuotaPrestamoId: Number(f.origenId),
                monto: Number(montos[f.id]),
                mora: Number(moras[f.id] || 0),
              })),
              fechaPago: fecha.toISOString(),
              cuentaCorrienteOrigenId: Number(cuentaId),
              numeroCheque: esCheque ? numeroCheque : undefined,
            },
      );

      if (respuesta?.data) {
        await generarVouchers(respuesta.data);
        setResultado(respuesta.data);
        setShowConfirmacion(true);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    } finally {
      setProcesando(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // TEMPLATES DE LA TABLA
  // ════════════════════════════════════════════════════════════
  const estaMarcado = (row) => seleccionados.some((s) => s.id === row.id);

  const montoTemplate = (valor) => (row) => (
    <div className="text-right">
      {row.moneda?.simbolo} {formatearNumero(valor(row))}
    </div>
  );

  // Monto de la cuota a pagar (pago parcial permitido), acotado a su saldo pendiente
  const montoPagarTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    const saldo = Number(row.saldoPendiente || 0);
    return (
      <InputNumber
        value={montos[row.id] ?? 0}
        onValueChange={(e) =>
          setMontos((prev) => ({ ...prev, [row.id]: Math.min(Number(e.value || 0), saldo) }))
        }
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        max={saldo}
        disabled={cargando}
        inputStyle={{ textAlign: "right", fontWeight: "bold", width: "100%" }}
        style={{ width: "100%" }}
      />
    );
  };

  // Mora de esta operación: sugerida por la fecha de pago, editable
  const moraTemplate = (row) => {
    if (!estaMarcado(row)) return <div className="text-right text-500">—</div>;
    return (
      <InputNumber
        value={moras[row.id] ?? 0}
        onValueChange={(e) => {
          morasEditadas.current.add(row.id);
          setMoras((prev) => ({ ...prev, [row.id]: Number(e.value || 0) }));
        }}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        disabled={cargando}
        inputStyle={{ textAlign: "right", width: "100%" }}
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

  const composicionTemplate = (row) => {
    const otros = Number(row.cuota?.montoComision || 0) + Number(row.cuota?.montoSeguro || 0);
    return (
      <div style={{ fontSize: "0.8rem", lineHeight: 1.35 }}>
        <div>Capital: {row.moneda?.simbolo} {formatearNumero(row.cuota?.montoCapital)}</div>
        <div>Interés: {row.moneda?.simbolo} {formatearNumero(row.cuota?.montoInteres)}</div>
        {otros > 0 && <div>Com./Seg.: {row.moneda?.simbolo} {formatearNumero(otros)}</div>}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-fluid">
        {/* FACTORING: ¿quién pagó al banco? */}
        {!esDesembolso && esFactoring && (
          <Panel header="🏦 Factoring: ¿quién pagó al banco?" className="mb-3">
            <div style={{ display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 340 }}>
                <BooleanToggleButton
                  labelTrue="EL CLIENTE PAGÓ AL BANCO"
                  labelFalse="NOSOTROS PAGAMOS AL BANCO"
                  severityTrue="success"
                  severityFalse="warning"
                  icon={pagoElCliente ? "pi-check-circle" : "pi-wallet"}
                  value={pagoElCliente}
                  onChange={setPagoElCliente}
                  disabled={cargando}
                />
              </div>
              <small style={{ color: "#6c757d", flex: 1, minWidth: 260 }}>
                {pagoElCliente
                  ? "El cliente pagó directamente al banco: no hay movimiento de caja. Solo se registra el asiento y se cancela la cuota del préstamo."
                  : "El cliente no pagó y el banco nos cobra: se paga la cuota desde nuestras cuentas, como cualquier pago de préstamo."}
              </small>
            </div>
          </Panel>
        )}

        {pagaElCliente && (
          <>
            <LiquidacionFactoringPanel prestamoId={prestamo?.id} toast={toast} onRegistrada={onOperacionRegistrada} />
            <div className="flex justify-content-end gap-2 mt-3">
              <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined onClick={onCancel} type="button" />
            </div>
          </>
        )}

        {!pagaElCliente && (
          <>
        {/* SECCIÓN 1: Cuotas a pagar (con casillas y montos) o préstamo a desembolsar */}
        <Panel header={esDesembolso ? "🏦 Préstamo a Desembolsar" : "🏦 Cuotas a Pagar"} className="mb-3">
          {esDesembolso ? (
            <DataTable value={filas} dataKey="id" size="small" stripedRows showGridlines>
              <Column header="Préstamo" body={(row) => <span className="font-bold">{row.prestamo?.numeroPrestamo}</span>} />
              <Column header="Banco" body={(row) => row.entidadComercial?.razonSocial} />
              <Column header="Tipo de Préstamo" body={(row) => row.prestamo?.tipoPrestamo || "-"} />
              <Column header="F. Contrato" body={(row) => formatearFecha(row.fechaEmision)} />
              <Column header="F. Prevista Desembolso" body={(row) => formatearFecha(row.fechaVencimiento)} />
              <Column
                header="Monto a Desembolsar"
                body={montoTemplate((row) => row.saldoPendiente)}
                footer={
                  <div className="text-right font-bold" style={{ color: "#2e7d32" }}>
                    TOTAL: {simbolo} {formatearNumero(totalPrincipal)}
                  </div>
                }
              />
            </DataTable>
          ) : (
            <DataTable
              value={filas}
              selection={seleccionados}
              onSelectionChange={(e) => setSeleccionados(e.value)}
              dataKey="id"
              emptyMessage="No hay cuotas para pagar"
              size="small"
              stripedRows
              showGridlines
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} footer="" />
              <Column
                header="Cuota"
                body={(row) => (
                  <span className="font-bold">
                    {row.prestamo?.numeroPrestamo} - {row.cuota?.numeroCuota}/{row.prestamo?.numeroCuotas}
                  </span>
                )}
                footer={`${seleccionados.length} de ${filas.length} marcada(s)`}
              />
              <Column
                header="F. Vencimiento"
                body={(row) => (
                  <span>
                    {formatearFecha(row.fechaVencimiento)}
                    {row.vencidaAntesDelCorte && (
                      <i
                        className="pi pi-exclamation-triangle ml-2"
                        style={{ color: "#b45309" }}
                        title="Vence antes del 01/01/2026: verifique que no se pagó el año pasado"
                      />
                    )}
                  </span>
                )}
              />
              <Column
                header="Atraso"
                body={(row) => {
                  const dias = diasDeAtraso(row.fechaVencimiento, fecha);
                  return <div className="text-center">{dias > 0 ? `${dias} d` : "-"}</div>;
                }}
              />
              <Column header="Composición" body={composicionTemplate} />
              <Column
                header="Saldo Pendiente"
                body={montoTemplate((row) => row.saldoPendiente)}
                footer={
                  <div className="text-right">
                    {simbolo} {formatearNumero(totalSaldos)}
                  </div>
                }
              />
              <Column header="Monto a Pagar" body={montoPagarTemplate} style={{ minWidth: "10rem" }} />
              <Column header="Mora" body={moraTemplate} style={{ minWidth: "8rem" }} />
              <Column
                header="Queda"
                body={quedaTemplate}
                footer={
                  <div className="text-right font-bold" style={{ color: "#c62828" }}>
                    TOTAL A PAGAR: {simbolo} {formatearNumero(totalPrincipal)}
                  </div>
                }
              />
            </DataTable>
          )}
          {errorLote && <small className="p-error block mt-2">{errorLote}</small>}
          {/* Cuotas anteriores al corte del saldo inicial que aún no están marcadas como históricas:
              evita pagar de nuevo una cuota ya pagada el año anterior */}
          {!esDesembolso && seleccionados.some((f) => f.vencidaAntesDelCorte) && (
            <small className="block mt-2" style={{ color: "#b45309", fontWeight: 600 }}>
              <i className="pi pi-exclamation-triangle mr-1" />
              Hay cuotas con vencimiento anterior al 01/01/2026. Si ya se pagaron el año pasado, no las pague
              aquí: márquelas como históricas (saldo inicial) en el cronograma del préstamo.
            </small>
          )}
          {!esDesembolso && (
            <small className="p-text-secondary block mt-2">
              Marque las cuotas de un mismo préstamo y escriba cuánto se paga de cada una (puede ser un
              pago parcial). El pago se imputa en este orden: comisión, seguro, interés y capital. La mora
              se sugiere según los días de atraso y la tasa moratoria; ajústela al monto que cobra el banco.
            </small>
          )}
        </Panel>

        <Divider />

        {/* SECCIÓN 2: Datos de la operación (mismo layout que EntregarFondosForm) */}
        <Panel header={esDesembolso ? "💳 Datos del Desembolso" : "💳 Datos del Pago"}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">
                  {esDesembolso ? "Fecha del Desembolso *" : "Fecha del Pago *"}
                </label>
                <Calendar
                  id="fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.value)}
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
                <label className="font-bold block mb-2">Caso contable</label>
                <Tag
                  value={esFactoring ? "FACTORING" : "PRÉSTAMO"}
                  severity={esFactoring ? "info" : "success"}
                  icon="pi pi-building"
                />
              </div>
            </div>

            {/* FACTORING: facturas que se entregan en descuento y neto depositado */}
            {esDesembolso && esFactoring && (
              <Panel header={<span>🧾 Factoring: facturas entregadas en descuento</span>} toggleable className="mb-2">
                {facturasDeCuotas && (
                  <small style={{ display: "block", color: "#1565C0", fontWeight: 600, marginBottom: 8 }}>
                    Las facturas vienen de las cuotas del préstamo (una cuota por factura). Para cambiarlas edite las cuotas en Préstamo Bancario antes de desembolsar.
                  </small>
                )}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <span className="p-input-icon-left" style={{ flex: 1, minWidth: 260 }}>
                    <i className="pi pi-search" />
                    <InputText
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      placeholder="Buscar por razón social del cliente"
                      style={{ width: "100%" }}
                    />
                  </span>
                  {busquedaCliente && <Button type="button" icon="pi pi-times" className="p-button-text" onClick={() => setBusquedaCliente("")} tooltip="Quitar la búsqueda" />}
                  <small style={{ color: "#6c757d" }}>
                    Mostrando {facturasVisibles.length} de {facturasDisponibles.length} - {facturasElegidas.length} elegida(s)
                  </small>
                </div>
                <DataTable
                  value={facturasVisibles}
                  selection={facturasElegidas.filter((f) => facturasVisibles.some((v) => v.id === f.id))}
                  onSelectionChange={(e) => cambiarSeleccionFacturas(e.value)}
                  isDataSelectable={() => !facturasDeCuotas}
                  dataKey="id"
                  loading={cargandoFacturas}
                  size="small"
                  stripedRows
                  scrollable
                  scrollHeight="220px"
                  emptyMessage={busquedaCliente ? "Ninguna factura coincide con la razón social buscada." : "No hay facturas fiscales disponibles (con saldo, sin cobros y en la moneda del préstamo)."}
                >
                  <Column selectionMode="multiple" style={{ width: "3rem" }} />
                  <Column field="numeroDocumento" header="Factura" />
                  <Column field="cliente" header="Cliente" />
                  <Column header="Emisión" body={(f) => formatearFecha(f.fechaEmision)} />
                  <Column header="Vencimiento" body={(f) => formatearFecha(f.fechaVencimiento)} />
                  <Column header="Saldo" body={(f) => `${f.simbolo} ${formatearNumero(f.saldoPendiente)}`} />
                </DataTable>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
                  <div style={{ flex: 1.4 }}>
                    <label className="font-bold block mb-1">Interés del factoring</label>
                    <Tag
                      value={interesDescontado ? "DESCONTADO POR ADELANTADO" : "DIFERIDO EN LAS CUOTAS"}
                      severity={interesDescontado ? "success" : "info"}
                      style={{ fontSize: "0.9rem" }}
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: 4 }}>
                      {interesDescontado
                        ? "El banco descuenta el interés y deposita el neto: un solo ingreso por el neto y un solo asiento. Se define en el Préstamo Bancario."
                        : "El banco deposita el total de las facturas y cobra el interés con las cuotas: no hay descuento en el desembolso. Se define en el Préstamo Bancario."}
                    </small>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="font-bold block mb-1">Total de las facturas (bruto)</label>
                    <InputText value={`${simbolo} ${formatearNumero(brutoFacturas)}`} disabled style={{ width: "100%", fontWeight: "bold" }} />
                  </div>
                  {interesDescontado && (
                    <>
                      <div style={{ flex: 1 }}>
                        <label className="font-bold block mb-1">Interés descontado (cuenta 673111)</label>
                        <InputNumber
                          value={montoDescuento}
                          onValueChange={(e) => setMontoDescuento(e.value ?? 0)}
                          mode="decimal"
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          min={0}
                          max={brutoFacturas > 0 ? brutoFacturas - 0.01 : undefined}
                          disabled={cargando || facturasElegidas.length === 0}
                          inputStyle={{ width: "100%", fontWeight: "bold" }}
                        />
                        <small style={{ color: "#6c757d" }}>No incluye el ITF ni la comisión bancaria: esos siempre van aparte.</small>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="font-bold block mb-1">Monto que deposita el banco (neto)</label>
                        <InputNumber
                          value={netoFactoring}
                          onValueChange={(e) => setMontoDescuento(redondear2(brutoFacturas - Number(e.value || 0)))}
                          mode="decimal"
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          min={0}
                          max={brutoFacturas || undefined}
                          disabled={cargando || facturasElegidas.length === 0}
                          inputStyle={{ width: "100%", fontWeight: "bold" }}
                        />
                        <small style={{ color: "#6c757d" }}>Digite lo que ve en el estado de cuenta: el interés se calcula como la diferencia.</small>
                      </div>
                    </>
                  )}
                </div>
                {hayDiferenciaConPrestamo && (
                  <small style={{ color: "#b45309", display: "block", marginTop: 6, fontWeight: 600 }}>
                    <i className="pi pi-info-circle mr-1" />
                    Las facturas suman {simbolo} {formatearNumero(brutoFacturas)} y el capital del préstamo es {simbolo} {formatearNumero(montoPrestamoFactoring)} (diferencia {simbolo} {formatearNumero(diferenciaConPrestamo)}).
                    Se cancelarán todas las facturas por su saldo completo; revise el capital del préstamo.
                  </small>
                )}
              </Panel>
            )}

            {/* CUENTA: origen (egreso) o destino (ingreso) */}
            <Panel
              header={<span>{esDesembolso ? "📥 Cuenta de Destino (INGRESO)" : "📤 Cuenta de Origen (EGRESO)"}</span>}
              toggleable
            >
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
                  <label className="font-bold">Cuenta Corriente *</label>
                  <CuentaCorrienteSelector
                    empresaIdPreseleccionada={empresaId}
                    value={cuentaId}
                    onChange={({ cuentaCorrienteId, moneda }) => {
                      setCuentaId(cuentaCorrienteId);
                      setMonedaCuentaSelector(moneda);
                    }}
                    label=""
                    placeholder={esDesembolso ? "Seleccione cuenta de destino" : "Seleccione cuenta de origen"}
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
                  <label htmlFor="medioPago" className="font-bold">Medio de Pago *</label>
                  <Dropdown
                    id="medioPago"
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
                    <label htmlFor="numeroCheque" className="font-bold">Nº Cheque *</label>
                    <InputText
                      id="numeroCheque"
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
                    esIngreso={esDesembolso}
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
                  <label className="font-bold">
                    {esDesembolso ? `Monto Desembolsado (${simbolo})` : `Total a Pagar (${simbolo})`}
                  </label>
                  <Tag
                    severity={esDesembolso ? "success" : "warning"}
                    style={{ fontSize: "1.2rem", padding: "0.5rem 1rem", width: "100%" }}
                  >
                    {simbolo} {formatearNumero(totalPrincipal)}
                  </Tag>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="itf" className="font-bold">ITF</label>
                  <InputNumber
                    id="itf"
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
                  <label htmlFor="comision" className="font-bold">
                    {esDesembolso ? "Comisión (inicial / bancaria)" : "Comisión bancaria"}
                  </label>
                  <InputNumber
                    id="comision"
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
                    <span className="font-bold">{esDesembolso ? "Monto Acreditado:" : "Total a Debitar:"}</span>
                    <Tag
                      severity={esDesembolso ? "info" : "danger"}
                      style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}
                    >
                      {simbolo} {formatearNumero(esDesembolso ? totalAcreditado : totalDebitado)}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* TIPO DE CAMBIO: solo si el préstamo no es en soles (TC de venta, editable) */}
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
                    Se propone el TC de venta de SUNAT; puede modificarlo. Se aplicará para registrar el asiento en soles
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
            label={esDesembolso ? "Registrar Desembolso" : "Pagar Cuotas"}
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={procesando}
            disabled={cargando || seleccionados.length === 0}
          />
        </div>
          </>
        )}
      </form>

      <ConfirmarSinFondosDialog
        mensaje={avisoSinFondos}
        onCancelar={() => setAvisoSinFondos(null)}
        onConfirmar={() => {
          sinFondosConfirmadoRef.current = true;
          setAvisoSinFondos(null);
          handleSubmit({ preventDefault: () => {} });
        }}
      />

      <ConfirmacionOperacionPrestamoDialog
        visible={showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultado(null);
          onCancel?.(); // Cierra el formulario principal
        }}
        resultado={resultado}
        simbolo={simbolo}
      />
    </>
  );
};

export default OperacionPrestamoForm;
