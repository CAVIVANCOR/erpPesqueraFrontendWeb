// src/components/pagoCuentaPorPagar/PagoCuentaPorPagarForm.jsx
// ✅ VERSIÓN COMPLETA CON TODOS LOS CAMPOS DEL SCHEMA
import React, { useState, useEffect, useMemo } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { getResponsiveFontSize } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../common/CuentaCorrienteSelector";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import CuentaCxCCxPSelector from "../common/CuentaCxCCxPSelector";

export default function PagoCuentaPorPagarForm({
  isEdit,
  defaultValues,
  cuentasPorPagar,
  monedas,
  mediosPago,
  bancos,
  cuentasCorrientes,
  estados,
  periodosContables,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
  hideCuentaField = false,
  toast,
  empresaIdCuenta = null,
  proveedorIdCuenta = null,
}) {
  const usuario = useAuthStore((state) => state.usuario);

  // ========================================
  // ESTADOS PRINCIPALES
  // ========================================
  const [cuentaPorPagarId, setCuentaPorPagarId] = useState(
    defaultValues?.cuentaPorPagarId || null,
  );
  const [fechaPago, setFechaPago] = useState(
    defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
  );

  const [montoPagado, setMontoPagado] = useState(
    defaultValues?.montoPagado || 0,
  );

  const [monedaPagoId, setMonedaPagoId] = useState(
    defaultValues?.monedaPagoId || null,
  );

  const [tipoCambio, setTipoCambio] = useState(defaultValues?.tipoCambio || 1);

  const [montoAplicadoDeuda, setMontoAplicadoDeuda] = useState(
    defaultValues?.montoAplicadoDeuda || 0,
  );
  const [monedaDeudaId, setMonedaDeudaId] = useState(
    defaultValues?.monedaDeudaId || null,
  );

  // ========================================
  // ESTADOS DETRACCIÓN
  // ========================================
  const [tieneDetraccion, setTieneDetraccion] = useState(
    defaultValues?.tieneDetraccion || false,
  );
  const [montoDetraccion, setMontoDetraccion] = useState(
    defaultValues?.montoDetraccion || 0,
  );
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(
    defaultValues?.porcentajeDetraccion || null,
  );
  const [numeroConstanciaDetraccion, setNumeroConstanciaDetraccion] = useState(
    defaultValues?.numeroConstanciaDetraccion || "",
  );
  const [fechaDetraccion, setFechaDetraccion] = useState(
    defaultValues?.fechaDetraccion
      ? new Date(defaultValues.fechaDetraccion)
      : null,
  );

  // ========================================
  // ESTADOS RETENCIÓN
  // ========================================
  const [tieneRetencion, setTieneRetencion] = useState(
    defaultValues?.tieneRetencion || false,
  );
  const [montoRetencion, setMontoRetencion] = useState(
    defaultValues?.montoRetencion || 0,
  );
  const [porcentajeRetencion, setPorcentajeRetencion] = useState(
    defaultValues?.porcentajeRetencion || null,
  );
  const [numeroComprobanteRetencion, setNumeroComprobanteRetencion] = useState(
    defaultValues?.numeroComprobanteRetencion || "",
  );
  const [fechaRetencion, setFechaRetencion] = useState(
    defaultValues?.fechaRetencion
      ? new Date(defaultValues.fechaRetencion)
      : null,
  );

  // ========================================
  // ESTADOS PERCEPCIÓN
  // ========================================
  const [tienePercepcion, setTienePercepcion] = useState(
    defaultValues?.tienePercepcion || false,
  );
  const [montoPercepcion, setMontoPercepcion] = useState(
    defaultValues?.montoPercepcion || 0,
  );
  const [porcentajePercepcion, setPorcentajePercepcion] = useState(
    defaultValues?.porcentajePercepcion || null,
  );
  const [numeroComprobantePercepcion, setNumeroComprobantePercepcion] =
    useState(defaultValues?.numeroComprobantePercepcion || "");
  const [fechaPercepcion, setFechaPercepcion] = useState(
    defaultValues?.fechaPercepcion
      ? new Date(defaultValues.fechaPercepcion)
      : null,
  );

  // ========================================
  // ESTADOS MEDIO DE PAGO
  // ========================================
  const [medioPagoId, setMedioPagoId] = useState(
    defaultValues?.medioPagoId || null,
  );
  const [numeroOperacion, setNumeroOperacion] = useState(
    defaultValues?.numeroOperacion || "",
  );
  const [bancoId, setBancoId] = useState(defaultValues?.bancoId || null);
  const [cuentaBancariaId, setCuentaBancariaId] = useState(
    defaultValues?.cuentaBancariaId || null,
  );

  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || "",
  );

  // ========================================
  // ESTADOS CONTABILIDAD
  // ========================================
  const [fechaContable, setFechaContable] = useState(
    defaultValues?.fechaContable
      ? new Date(defaultValues.fechaContable)
      : new Date(),
  );
  const [periodoContableId, setPeriodoContableId] = useState(
    defaultValues?.periodoContableId || null,
  );

  // ========================================
  // ESTADOS AUDITORÍA
  // ========================================
  const [creadoPor, setCreadoPor] = useState(defaultValues?.creadoPor || null);
  const [actualizadoPor, setActualizadoPor] = useState(
    defaultValues?.actualizadoPor || null,
  );
  const [fechaCreacion, setFechaCreacion] = useState(
    defaultValues?.fechaCreacion ? new Date(defaultValues.fechaCreacion) : null,
  );
  const [fechaActualizacion, setFechaActualizacion] = useState(
    defaultValues?.fechaActualizacion
      ? new Date(defaultValues.fechaActualizacion)
      : null,
  );
  // ========================================
  // HANDLERS: Exclusividad mutua Detracción/Retención/Percepción
  // ========================================
  const handleToggleDetraccion = () => {
    const nuevoEstado = !tieneDetraccion;
    setTieneDetraccion(nuevoEstado);

    if (nuevoEstado) {
      setTieneRetencion(false);
      setTienePercepcion(false);
      setMontoRetencion(0);
      setPorcentajeRetencion(null);
      setNumeroComprobanteRetencion("");
      setFechaRetencion(null);
      setMontoPercepcion(0);
      setPorcentajePercepcion(null);
      setNumeroComprobantePercepcion("");
      setFechaPercepcion(null);
    } else {
      setMontoDetraccion(0);
      setPorcentajeDetraccion(null);
      setNumeroConstanciaDetraccion("");
      setFechaDetraccion(null);
    }
  };

  const handleToggleRetencion = () => {
    const nuevoEstado = !tieneRetencion;
    setTieneRetencion(nuevoEstado);

    if (nuevoEstado) {
      setTieneDetraccion(false);
      setTienePercepcion(false);
      setMontoDetraccion(0);
      setPorcentajeDetraccion(null);
      setNumeroConstanciaDetraccion("");
      setFechaDetraccion(null);
      setMontoPercepcion(0);
      setPorcentajePercepcion(null);
      setNumeroComprobantePercepcion("");
      setFechaPercepcion(null);
    } else {
      setMontoRetencion(0);
      setPorcentajeRetencion(null);
      setNumeroComprobanteRetencion("");
      setFechaRetencion(null);
    }
  };

  const handleTogglePercepcion = () => {
    const nuevoEstado = !tienePercepcion;
    setTienePercepcion(nuevoEstado);

    if (nuevoEstado) {
      setTieneDetraccion(false);
      setTieneRetencion(false);
      setMontoDetraccion(0);
      setPorcentajeDetraccion(null);
      setNumeroConstanciaDetraccion("");
      setFechaDetraccion(null);
      setMontoRetencion(0);
      setPorcentajeRetencion(null);
      setNumeroComprobanteRetencion("");
      setFechaRetencion(null);
    } else {
      setMontoPercepcion(0);
      setPorcentajePercepcion(null);
      setNumeroComprobantePercepcion("");
      setFechaPercepcion(null);
    }
  };

  // ========================================
  // ESTADOS AUXILIARES
  // ========================================
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [empresaId, setEmpresaId] = useState(null);
  const [estadoId, setEstadoId] = useState(null);

  const [fechaPagoInicial, setFechaPagoInicial] = useState(null);

  // ========================================
  // EFFECT: Cargar datos al editar
  // ========================================
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setCuentaPorPagarId(
        defaultValues.cuentaPorPagarId
          ? Number(defaultValues.cuentaPorPagarId)
          : null,
      );
      setFechaPago(
        defaultValues.fechaPago
          ? new Date(defaultValues.fechaPago)
          : new Date(),
      );
      setMontoPagado(defaultValues.montoPagado || 0);
      setMonedaPagoId(
        defaultValues.monedaPagoId ? Number(defaultValues.monedaPagoId) : null,
      );
      setTipoCambio(defaultValues.tipoCambio || 1);
      setMontoAplicadoDeuda(defaultValues.montoAplicadoDeuda || 0);
      setMonedaDeudaId(
        defaultValues.monedaDeudaId
          ? Number(defaultValues.monedaDeudaId)
          : null,
      );

      setTieneDetraccion(defaultValues.tieneDetraccion || false);
      setMontoDetraccion(defaultValues.montoDetraccion || 0);
      setPorcentajeDetraccion(defaultValues.porcentajeDetraccion || null);
      setNumeroConstanciaDetraccion(
        defaultValues.numeroConstanciaDetraccion || "",
      );
      setFechaDetraccion(
        defaultValues.fechaDetraccion
          ? new Date(defaultValues.fechaDetraccion)
          : null,
      );

      setTieneRetencion(defaultValues.tieneRetencion || false);
      setMontoRetencion(defaultValues.montoRetencion || 0);
      setPorcentajeRetencion(defaultValues.porcentajeRetencion || null);
      setNumeroComprobanteRetencion(
        defaultValues.numeroComprobanteRetencion || "",
      );
      setFechaRetencion(
        defaultValues.fechaRetencion
          ? new Date(defaultValues.fechaRetencion)
          : null,
      );

      setTienePercepcion(defaultValues.tienePercepcion || false);
      setMontoPercepcion(defaultValues.montoPercepcion || 0);
      setPorcentajePercepcion(defaultValues.porcentajePercepcion || null);
      setNumeroComprobantePercepcion(
        defaultValues.numeroComprobantePercepcion || "",
      );
      setFechaPercepcion(
        defaultValues.fechaPercepcion
          ? new Date(defaultValues.fechaPercepcion)
          : null,
      );

      setMedioPagoId(
        defaultValues.medioPagoId ? Number(defaultValues.medioPagoId) : null,
      );
      setNumeroOperacion(defaultValues.numeroOperacion || "");
      setBancoId(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
      setCuentaBancariaId(
        defaultValues.cuentaBancariaId
          ? Number(defaultValues.cuentaBancariaId)
          : null,
      );
      setObservaciones(defaultValues.observaciones || "");

      setFechaContable(
        defaultValues.fechaContable
          ? new Date(defaultValues.fechaContable)
          : new Date(),
      );
      if (defaultValues.periodoContableId !== undefined) {
        setPeriodoContableId(Number(defaultValues.periodoContableId));
      }

      setCreadoPor(defaultValues.creadoPor || null);
      setActualizadoPor(defaultValues.actualizadoPor || null);
      setFechaCreacion(
        defaultValues.fechaCreacion
          ? new Date(defaultValues.fechaCreacion)
          : null,
      );
      setFechaActualizacion(
        defaultValues.fechaActualizacion
          ? new Date(defaultValues.fechaActualizacion)
          : null,
      );
    }
  }, [defaultValues]);

  // ========================================
  // EFFECT: Cargar datos de cuenta seleccionada
  // ========================================
  useEffect(() => {
    if (cuentaPorPagarId && cuentasPorPagar) {
      const cuenta = cuentasPorPagar.find(
        (c) => Number(c.id) === Number(cuentaPorPagarId),
      );
      if (cuenta) {
        setCuentaSeleccionada(cuenta);
        setSaldoPendiente(Number(cuenta.saldoPendiente || 0));

        if (!isEdit || !defaultValues?.monedaPagoId) {
          setMonedaPagoId(Number(cuenta.monedaId));
        }

        setMonedaDeudaId(Number(cuenta.monedaId));
        setEmpresaId(Number(cuenta.empresaId));
        setEstadoId(Number(cuenta.estadoId));

        if (cuenta.periodoContableId) {
          setPeriodoContableId(Number(cuenta.periodoContableId));
        }
      }
    }
  }, [cuentaPorPagarId, cuentasPorPagar, isEdit, defaultValues]);

  // ========================================
  // EFFECT: Calcular montoAplicadoDeuda automáticamente
  // ========================================
  useEffect(() => {
    if (!monedaPagoId || !monedaDeudaId || !tipoCambio) {
      if (!montoPagado || montoPagado === 0) {
        setMontoAplicadoDeuda(0);
      }
      return;
    }

    if (!montoPagado || Number(montoPagado) === 0) {
      setMontoAplicadoDeuda(0);
      return;
    }

    const monedaPago = monedas?.find(
      (m) => Number(m.id) === Number(monedaPagoId),
    );
    const monedaDeuda = monedas?.find(
      (m) => Number(m.id) === Number(monedaDeudaId),
    );

    if (!monedaPago || !monedaDeuda) {
      setMontoAplicadoDeuda(0);
      return;
    }

    const codigoPago = monedaPago.codigoSunat;
    const codigoDeuda = monedaDeuda.codigoSunat;

    let montoCalculado = 0;

    if (codigoPago === codigoDeuda) {
      montoCalculado = Number(montoPagado);
    } else if (codigoPago === "PEN" && codigoDeuda === "USD") {
      montoCalculado = Number(montoPagado) / Number(tipoCambio);
    } else if (codigoPago === "USD" && codigoDeuda === "PEN") {
      montoCalculado = Number(montoPagado) * Number(tipoCambio);
    } else {
      montoCalculado = Number(montoPagado);
    }

    if (
      typeof montoCalculado === "number" &&
      isFinite(montoCalculado) &&
      !isNaN(montoCalculado)
    ) {
      const detraccion = tieneDetraccion ? Number(montoDetraccion) || 0 : 0;
      const retencion = tieneRetencion ? Number(montoRetencion) || 0 : 0;
      const montoFinal =
        Number(montoCalculado.toFixed(2)) + detraccion + retencion;

      setMontoAplicadoDeuda(Number(montoFinal.toFixed(2)));
    } else {
      setMontoAplicadoDeuda(0);
    }
  }, [
    montoPagado,
    monedaPagoId,
    monedaDeudaId,
    tipoCambio,
    monedas,
    tieneDetraccion,
    montoDetraccion,
    tieneRetencion,
    montoRetencion,
  ]);
  // ========================================
  // EFFECT: Inicializar fechaPagoInicial SOLO en el primer render
  // ========================================
  useEffect(() => {
    if (fechaPagoInicial === null) {
      setFechaPagoInicial(fechaPago);
    }
  }, []);

  // ========================================
  // EFFECT: Cargar tipo de cambio SUNAT al cambiar fecha de pago
  // ========================================
  useEffect(() => {
    const cargarTipoCambio = async () => {
      if (!fechaPago || fechaPagoInicial === null) return;

      const fechaActualISO = new Date(fechaPago).toISOString();
      const fechaInicialISO = new Date(fechaPagoInicial).toISOString();

      if (fechaActualISO === fechaInicialISO) return;

      try {
        const fecha = new Date(fechaPago);
        const fechaISO = fecha.toISOString().split("T")[0];

        const tipoCambioData = await consultarTipoCambioSunat({
          date: fechaISO,
        });

        // Para PAGOS usamos sell_price (precio de venta del dólar)
        if (tipoCambioData && tipoCambioData.sell_price) {
          const tipoCambioVenta = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tipoCambioVenta.toFixed(3));

          setFechaPagoInicial(fechaPago);

          toast?.current?.show({
            severity: "success",
            summary: "Tipo de Cambio Actualizado",
            detail: `T.C. SUNAT: S/ ${tipoCambioVenta.toFixed(3)} por USD (Fecha: ${fechaISO})`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error al cargar tipo de cambio SUNAT:", error);
      }
    };

    cargarTipoCambio();
  }, [fechaPago, fechaPagoInicial]);

  // ========================================
  // HANDLER: Submit
  // ========================================
  const handleSubmit = () => {
    const estadoPagoId =
      estados?.find(
        (e) =>
          e.nombre?.toUpperCase().includes("PAGADO") ||
          e.nombre?.toUpperCase().includes("COBRADO"),
      )?.id || estadoId;

    const dataParaGrabacion = {
      cuentaPorPagarId: cuentaPorPagarId ? Number(cuentaPorPagarId) : null,
      empresaId: empresaId ? Number(empresaId) : null,
      fechaPago,
      montoPagado: Number(montoPagado),
      monedaPagoId: monedaPagoId ? Number(monedaPagoId) : null,
      tipoCambio: Number(tipoCambio),
      montoAplicadoDeuda: Number(montoAplicadoDeuda),
      monedaDeudaId: monedaDeudaId ? Number(monedaDeudaId) : null,

      tieneDetraccion,
      montoDetraccion: tieneDetraccion ? Number(montoDetraccion) : 0,
      porcentajeDetraccion:
        tieneDetraccion && porcentajeDetraccion
          ? Number(porcentajeDetraccion)
          : null,
      numeroConstanciaDetraccion: tieneDetraccion
        ? numeroConstanciaDetraccion
        : null,
      fechaDetraccion: tieneDetraccion ? fechaDetraccion : null,

      tieneRetencion,
      montoRetencion: tieneRetencion ? Number(montoRetencion) : 0,
      porcentajeRetencion:
        tieneRetencion && porcentajeRetencion
          ? Number(porcentajeRetencion)
          : null,
      numeroComprobanteRetencion: tieneRetencion
        ? numeroComprobanteRetencion
        : null,
      fechaRetencion: tieneRetencion ? fechaRetencion : null,

      tienePercepcion,
      montoPercepcion: tienePercepcion ? Number(montoPercepcion) : 0,
      porcentajePercepcion:
        tienePercepcion && porcentajePercepcion
          ? Number(porcentajePercepcion)
          : null,
      numeroComprobantePercepcion: tienePercepcion
        ? numeroComprobantePercepcion
        : null,
      fechaPercepcion: tienePercepcion ? fechaPercepcion : null,

      medioPagoId: medioPagoId ? Number(medioPagoId) : null,
      numeroOperacion: numeroOperacion || null,
      bancoId: bancoId ? Number(bancoId) : null,
      cuentaBancariaId: cuentaBancariaId ? Number(cuentaBancariaId) : null,
      movimientoCajaId: null,
      estadoId: estadoPagoId ? Number(estadoPagoId) : null,
      observaciones: observaciones || null,

      fechaContable,
      periodoContableId: periodoContableId ? Number(periodoContableId) : null,

      creadoPor: isEdit
        ? creadoPor
        : usuario?.personalId
          ? Number(usuario.personalId)
          : null,
      actualizadoPor:
        isEdit && usuario?.personalId ? Number(usuario.personalId) : null,
    };

    // Validaciones
    if (!dataParaGrabacion.cuentaPorPagarId) {
      alert("Debe seleccionar una Cuenta por Pagar");
      return;
    }

    if (!dataParaGrabacion.montoPagado || dataParaGrabacion.montoPagado <= 0) {
      alert("El monto del pago debe ser mayor a 0");
      return;
    }

    if (Number(montoPagado) > Number(saldoPendiente)) {
      alert(
        `El monto del pago (${montoPagado}) no puede ser mayor al saldo pendiente (${saldoPendiente})`,
      );
      return;
    }

    if (!dataParaGrabacion.medioPagoId) {
      alert("Debe seleccionar un Medio de Pago");
      return;
    }

    onSubmit(dataParaGrabacion);
  };

  // ========================================
  // OPTIONS
  // ========================================
  const cuentasPorPagarOptions =
    cuentasPorPagar?.map((c) => ({
      label: `${c.numeroOrdenCompra || c.id} - ${c.proveedor?.razonSocial || "Sin proveedor"} - Saldo: ${Number(c.saldoPendiente || 0).toFixed(2)}`,
      value: Number(c.id),
    })) || [];

  const monedasOptions =
    monedas?.map((m) => ({
      label: m.codigoSunat,
      value: Number(m.id),
    })) || [];

  const mediosPagoOptions =
    mediosPago?.map((m) => ({
      label: m.nombre,
      value: Number(m.id),
    })) || [];

  const bancosOptions =
    bancos?.map((b) => ({
      label: b.nombre,
      value: Number(b.id),
    })) || [];

  const cuentasCorrientesOptions =
    cuentasCorrientes?.map((c) => ({
      label: `${c.numeroCuenta} - ${c.banco?.nombre || ""}`,
      value: Number(c.id),
    })) || [];

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="p-fluid">
      {/* PANEL: Información del Pago */}
      <Panel header="Información del Pago">
        <div className="p-fluid">
          {cuentaSeleccionada && (
            <div style={{ flex: 1 }}>
              <CuentaCxCCxPSelector
                tipo="CXP"
                value={cuentaPorPagarId}
                empresaIdPreseleccionada={empresaIdCuenta || empresaId}
                entidadIdPreseleccionada={proveedorIdCuenta}
                cuentaActual={cuentaSeleccionada}
                onChange={(cuenta) => {
                  setCuentaPorPagarId(Number(cuenta.id));
                  setSaldoPendiente(Number(cuenta.saldoPendiente || 0));

                  if (!isEdit || !defaultValues?.monedaPagoId) {
                    setMonedaPagoId(Number(cuenta.monedaId));
                  }

                  setMonedaDeudaId(Number(cuenta.monedaId));
                  setEmpresaId(Number(cuenta.empresaId));
                  setEstadoId(Number(cuenta.estadoId));
                  if (cuenta.periodoContableId) {
                    setPeriodoContableId(Number(cuenta.periodoContableId));
                  }
                }}
                disabled={readOnly || hideCuentaField}
                label="Cuenta por Pagar"
                placeholder="Seleccione una cuenta por pagar pendiente..."
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 0.7 }}>
              <label htmlFor="fechaPago">
                Fecha de Pago <span style={{ color: "red" }}>*</span>
              </label>
              <Calendar
                id="fechaPago"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="monedaPagoId">
                Moneda Pago <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="monedaPagoId"
                value={monedaPagoId}
                options={monedasOptions}
                onChange={(e) => setMonedaPagoId(e.value)}
                placeholder="Seleccione moneda"
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="montoPagado">
                Monto Pagado <span style={{ color: "red" }}>*</span>
              </label>
              <InputNumber
                id="montoPagado"
                value={montoPagado}
                onValueChange={(e) => setMontoPagado(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="medioPagoId">
                Medio de Pago <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="medioPagoId"
                value={medioPagoId}
                options={mediosPagoOptions}
                onChange={(e) => setMedioPagoId(e.value)}
                placeholder="Seleccione medio de pago"
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroOperacion">Número de Operación</label>
              <InputText
                id="numeroOperacion"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <CuentaCorrienteSelector
                empresaIdPreseleccionada={empresaId}
                value={cuentaBancariaId}
                onChange={({ cuentaCorrienteId, bancoId }) => {
                  setCuentaBancariaId(cuentaCorrienteId);
                  setBancoId(bancoId);
                }}
                label="Cuenta Corriente"
                disabled={readOnly}
                placeholder="Seleccione cuenta corriente"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 0.25 }}>
              <label htmlFor="tipoCambio">T/C</label>
              <InputNumber
                id="tipoCambio"
                value={tipoCambio}
                onValueChange={(e) => setTipoCambio(e.value)}
                mode="decimal"
                minFractionDigits={4}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="monedaDeudaId">Moneda Deuda</label>
              <Dropdown
                id="monedaDeudaId"
                value={monedaDeudaId}
                options={monedasOptions}
                onChange={(e) => setMonedaDeudaId(e.value)}
                placeholder="Seleccione moneda"
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="montoAplicadoDeuda">Monto Aplicado a Deuda</label>
              <InputNumber
                id="montoAplicadoDeuda"
                value={montoAplicadoDeuda}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled
                style={{ width: "100%", backgroundColor: "#e8f5e9" }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* PANEL: Detracción */}
      <Panel header="Detracción, Retencion, Percepcion (SUNAT)">
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* BOTÓN DETRACCIÓN */}
          {!tieneRetencion && !tienePercepcion && (
            <div style={{ flex: 1 }}>
              <Button
                label={tieneDetraccion ? "✅Detracción" : "Detracción"}
                icon={tieneDetraccion ? "pi pi-check-circle" : "pi pi-circle"}
                onClick={handleToggleDetraccion}
                disabled={readOnly}
                className={
                  tieneDetraccion ? "p-button-success" : "p-button-outlined"
                }
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  backgroundColor: tieneDetraccion ? "#4caf50" : "transparent",
                  borderColor: tieneDetraccion ? "#4caf50" : "#9e9e9e",
                  color: tieneDetraccion ? "#fff" : "#9e9e9e",
                }}
              />
            </div>
          )}

          {/* BOTÓN RETENCIÓN */}
          {!tieneDetraccion && !tienePercepcion && (
            <div style={{ flex: 1 }}>
              <Button
                label={tieneRetencion ? "✅Retención" : "Retención"}
                icon={tieneRetencion ? "pi pi-check-circle" : "pi pi-circle"}
                onClick={handleToggleRetencion}
                disabled={readOnly}
                className={
                  tieneRetencion ? "p-button-warning" : "p-button-outlined"
                }
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  backgroundColor: tieneRetencion ? "#ff9800" : "transparent",
                  borderColor: tieneRetencion ? "#ff9800" : "#9e9e9e",
                  color: tieneRetencion ? "#fff" : "#9e9e9e",
                }}
              />
            </div>
          )}

          {/* BOTÓN PERCEPCIÓN */}
          {!tieneDetraccion && !tieneRetencion && (
            <div style={{ flex: 1 }}>
              <Button
                label={tienePercepcion ? "✅Percepción" : "Percepción"}
                icon={tienePercepcion ? "pi pi-check-circle" : "pi pi-circle"}
                onClick={handleTogglePercepcion}
                disabled={readOnly}
                className={
                  tienePercepcion ? "p-button-info" : "p-button-outlined"
                }
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  backgroundColor: tienePercepcion ? "#2196f3" : "transparent",
                  borderColor: tienePercepcion ? "#2196f3" : "#9e9e9e",
                  color: tienePercepcion ? "#fff" : "#9e9e9e",
                }}
              />
            </div>
          )}
          {tieneDetraccion && (
            <>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="montoDetraccion">Monto</label>
                <InputNumber
                  id="montoDetraccion"
                  value={montoDetraccion}
                  onValueChange={(e) => setMontoDetraccion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 0.5 }}>
                <label htmlFor="porcentajeDetraccion">% Detracción</label>
                <InputNumber
                  id="porcentajeDetraccion"
                  value={porcentajeDetraccion}
                  onValueChange={(e) => setPorcentajeDetraccion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  suffix="%"
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 0.7 }}>
                <label htmlFor="fechaDetraccion">Fecha</label>
                <Calendar
                  id="fechaDetraccion"
                  value={fechaDetraccion}
                  onChange={(e) => setFechaDetraccion(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 0.5 }}>
                <label htmlFor="numeroConstanciaDetraccion">
                  N° Constancia
                </label>
                <InputText
                  id="numeroConstanciaDetraccion"
                  value={numeroConstanciaDetraccion}
                  onChange={(e) =>
                    setNumeroConstanciaDetraccion(e.target.value)
                  }
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
          {tieneRetencion && (
            <>
              <div style={{ flex: 1 }}>
                <label htmlFor="montoRetencion">Monto</label>
                <InputNumber
                  id="montoRetencion"
                  value={montoRetencion}
                  onValueChange={(e) => setMontoRetencion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="porcentajeRetencion">% Retención</label>
                <InputNumber
                  id="porcentajeRetencion"
                  value={porcentajeRetencion}
                  onValueChange={(e) => setPorcentajeRetencion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  suffix="%"
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaRetencion">Fecha</label>
                <Calendar
                  id="fechaRetencion"
                  value={fechaRetencion}
                  onChange={(e) => setFechaRetencion(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroComprobanteRetencion">
                  N° Constancia
                </label>
                <InputText
                  id="numeroComprobanteRetencion"
                  value={numeroComprobanteRetencion}
                  onChange={(e) =>
                    setNumeroComprobanteRetencion(e.target.value)
                  }
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
          {tienePercepcion && (
            <>
              <div style={{ flex: 1 }}>
                <label htmlFor="montoPercepcion">Monto</label>
                <InputNumber
                  id="montoPercepcion"
                  value={montoPercepcion}
                  onValueChange={(e) => setMontoPercepcion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="porcentajePercepcion">% Percepción</label>
                <InputNumber
                  id="porcentajePercepcion"
                  value={porcentajePercepcion}
                  onValueChange={(e) => setPorcentajePercepcion(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  suffix="%"
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaPercepcion">Fecha</label>
                <Calendar
                  id="fechaPercepcion"
                  value={fechaPercepcion}
                  onChange={(e) => setFechaPercepcion(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroComprobantePercepcion">
                  N° Constancia
                </label>
                <InputText
                  id="numeroComprobantePercepcion"
                  value={numeroComprobantePercepcion}
                  onChange={(e) =>
                    setNumeroComprobantePercepcion(e.target.value)
                  }
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaContable">Fecha Contable</label>
            <Calendar
              id="fechaContable"
              value={fechaContable}
              onChange={(e) => setFechaContable(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="periodoContableId">Periodo Contable</label>
            <Dropdown
              id="periodoContableId"
              value={periodoContableId ? Number(periodoContableId) : null}
              options={(() => {
                const opciones =
                  periodosContables
                    ?.filter((p) => {
                      const match = Number(p.empresaId) === Number(empresaId);
                      return match;
                    })
                    .map((p) => {
                      let estadoLabel = "";
                      const estadoId = Number(p.estadoId);
                      if (estadoId === 73) {
                        estadoLabel = "🟢 ABIERTO";
                      } else if (estadoId === 74) {
                        estadoLabel = "🔴 CERRADO";
                      } else if (estadoId === 75) {
                        estadoLabel = "🔒 BLOQUEADO";
                      } else {
                        estadoLabel = p.estado?.descripcion || "⚪ SIN ESTADO";
                      }
                      return {
                        label: `${p.nombrePeriodo} - ${estadoLabel}`,
                        value: Number(p.id),
                        estadoId: estadoId,
                        disabled: estadoId !== 73 && !isEdit,
                      };
                    }) || [];
                return opciones;
              })()}
              onChange={(e) => setPeriodoContableId(e.value)}
              placeholder="Seleccione periodo contable"
              showClear
              filter
              optionDisabled="disabled"
              disabled={readOnly}
              style={{ width: "100%", fontSize: getResponsiveFontSize() }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={1}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Panel>

      {/* PANEL: Auditoría (solo visible en edición) */}
      {isEdit && (
        <Panel header="Auditoría">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Creado Por</label>
              <InputText
                value={creadoPor ? `Usuario ID: ${creadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Fecha Creación</label>
              <Calendar
                value={fechaCreacion}
                disabled
                dateFormat="dd/mm/yy"
                showTime
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Actualizado Por</label>
              <InputText
                value={actualizadoPor ? `Usuario ID: ${actualizadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label>Fecha Actualización</label>
              <Calendar
                value={fechaActualizacion}
                disabled
                dateFormat="dd/mm/yy"
                showTime
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* BOTONES */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary mr-2"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label={isEdit ? "Actualizar" : "Registrar Pago"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
