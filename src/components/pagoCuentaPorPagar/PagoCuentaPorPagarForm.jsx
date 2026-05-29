// src/components/pagoCuentaPorPagar/PagoCuentaPorPagarForm.jsx
// ✅ VERSIÓN COMPLETA CON TODOS LOS CAMPOS DEL SCHEMA
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Checkbox } from "primereact/checkbox";
import { getResponsiveFontSize } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function PagoCuentaPorPagarForm({
  isEdit,
  defaultValues,
  cuentasPorPagar,
  monedas,
  mediosPago,
  bancos,
  cuentasCorrientes,
  prestamosBancarios,
  estados,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
  hideCuentaField = false,
}) {
  const usuario = useAuthStore((state) => state.usuario);

  // ========================================
  // ESTADOS PRINCIPALES
  // ========================================
  const [cuentaPorPagarId, setCuentaPorPagarId] = useState(
    defaultValues?.cuentaPorPagarId || null
  );
  const [fechaPago, setFechaPago] = useState(
    defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date()
  );
  
  const [montoPagado, setMontoPagado] = useState(
    defaultValues?.montoPagado || 0
  );
  
  const [monedaPagoId, setMonedaPagoId] = useState(
    defaultValues?.monedaPagoId || null
  );
  
  const [tipoCambio, setTipoCambio] = useState(
    defaultValues?.tipoCambio || 1
  );

  const [montoAplicadoDeuda, setMontoAplicadoDeuda] = useState(
    defaultValues?.montoAplicadoDeuda || 0
  );
  const [monedaDeudaId, setMonedaDeudaId] = useState(
    defaultValues?.monedaDeudaId || null
  );

  // ========================================
  // ESTADOS DETRACCIÓN
  // ========================================
  const [tieneDetraccion, setTieneDetraccion] = useState(
    defaultValues?.tieneDetraccion || false
  );
  const [montoDetraccion, setMontoDetraccion] = useState(
    defaultValues?.montoDetraccion || 0
  );
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(
    defaultValues?.porcentajeDetraccion || null
  );
  const [numeroConstanciaDetraccion, setNumeroConstanciaDetraccion] = useState(
    defaultValues?.numeroConstanciaDetraccion || ""
  );
  const [fechaDetraccion, setFechaDetraccion] = useState(
    defaultValues?.fechaDetraccion ? new Date(defaultValues.fechaDetraccion) : null
  );

  // ========================================
  // ESTADOS RETENCIÓN
  // ========================================
  const [tieneRetencion, setTieneRetencion] = useState(
    defaultValues?.tieneRetencion || false
  );
  const [montoRetencion, setMontoRetencion] = useState(
    defaultValues?.montoRetencion || 0
  );
  const [porcentajeRetencion, setPorcentajeRetencion] = useState(
    defaultValues?.porcentajeRetencion || null
  );
  const [numeroComprobanteRetencion, setNumeroComprobanteRetencion] = useState(
    defaultValues?.numeroComprobanteRetencion || ""
  );
  const [fechaRetencion, setFechaRetencion] = useState(
    defaultValues?.fechaRetencion ? new Date(defaultValues.fechaRetencion) : null
  );

  // ========================================
  // ESTADOS PERCEPCIÓN
  // ========================================
  const [tienePercepcion, setTienePercepcion] = useState(
    defaultValues?.tienePercepcion || false
  );
  const [montoPercepcion, setMontoPercepcion] = useState(
    defaultValues?.montoPercepcion || 0
  );
  const [porcentajePercepcion, setPorcentajePercepcion] = useState(
    defaultValues?.porcentajePercepcion || null
  );
  const [numeroComprobantePercepcion, setNumeroComprobantePercepcion] = useState(
    defaultValues?.numeroComprobantePercepcion || ""
  );
  const [fechaPercepcion, setFechaPercepcion] = useState(
    defaultValues?.fechaPercepcion ? new Date(defaultValues.fechaPercepcion) : null
  );

  // ========================================
  // ESTADOS MEDIO DE PAGO
  // ========================================
  const [medioPagoId, setMedioPagoId] = useState(
    defaultValues?.medioPagoId || null
  );
  const [numeroOperacion, setNumeroOperacion] = useState(
    defaultValues?.numeroOperacion || ""
  );
  const [bancoId, setBancoId] = useState(
    defaultValues?.bancoId || null
  );
  const [cuentaBancariaId, setCuentaBancariaId] = useState(
    defaultValues?.cuentaBancariaId || null
  );
  const [prestamoBancarioId, setPrestamoBancarioId] = useState(
    defaultValues?.prestamoBancarioId || null
  );
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || ""
  );

  // ========================================
  // ESTADOS CONTABILIDAD
  // ========================================
  const [fechaContable, setFechaContable] = useState(
    defaultValues?.fechaContable ? new Date(defaultValues.fechaContable) : new Date()
  );
  const [periodoContableId, setPeriodoContableId] = useState(
    defaultValues?.periodoContableId || null
  );

  // ========================================
  // ESTADOS AUDITORÍA
  // ========================================
  const [creadoPor, setCreadoPor] = useState(defaultValues?.creadoPor || null);
  const [actualizadoPor, setActualizadoPor] = useState(
    defaultValues?.actualizadoPor || null
  );
  const [fechaCreacion, setFechaCreacion] = useState(
    defaultValues?.fechaCreacion ? new Date(defaultValues.fechaCreacion) : null
  );
  const [fechaActualizacion, setFechaActualizacion] = useState(
    defaultValues?.fechaActualizacion ? new Date(defaultValues.fechaActualizacion) : null
  );

  // ========================================
  // ESTADOS AUXILIARES
  // ========================================
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [empresaId, setEmpresaId] = useState(null);
  const [estadoId, setEstadoId] = useState(null);

  // ========================================
  // EFFECT: Cargar datos al editar
  // ========================================
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setCuentaPorPagarId(
        defaultValues.cuentaPorPagarId ? Number(defaultValues.cuentaPorPagarId) : null
      );
      setFechaPago(
        defaultValues.fechaPago ? new Date(defaultValues.fechaPago) : new Date()
      );
      setMontoPagado(defaultValues.montoPagado || 0);
      setMonedaPagoId(
        defaultValues.monedaPagoId ? Number(defaultValues.monedaPagoId) : null
      );
      setTipoCambio(defaultValues.tipoCambio || 1);
      setMontoAplicadoDeuda(defaultValues.montoAplicadoDeuda || 0);
      setMonedaDeudaId(
        defaultValues.monedaDeudaId ? Number(defaultValues.monedaDeudaId) : null
      );

      setTieneDetraccion(defaultValues.tieneDetraccion || false);
      setMontoDetraccion(defaultValues.montoDetraccion || 0);
      setPorcentajeDetraccion(defaultValues.porcentajeDetraccion || null);
      setNumeroConstanciaDetraccion(defaultValues.numeroConstanciaDetraccion || "");
      setFechaDetraccion(
        defaultValues.fechaDetraccion ? new Date(defaultValues.fechaDetraccion) : null
      );

      setTieneRetencion(defaultValues.tieneRetencion || false);
      setMontoRetencion(defaultValues.montoRetencion || 0);
      setPorcentajeRetencion(defaultValues.porcentajeRetencion || null);
      setNumeroComprobanteRetencion(defaultValues.numeroComprobanteRetencion || "");
      setFechaRetencion(
        defaultValues.fechaRetencion ? new Date(defaultValues.fechaRetencion) : null
      );

      setTienePercepcion(defaultValues.tienePercepcion || false);
      setMontoPercepcion(defaultValues.montoPercepcion || 0);
      setPorcentajePercepcion(defaultValues.porcentajePercepcion || null);
      setNumeroComprobantePercepcion(defaultValues.numeroComprobantePercepcion || "");
      setFechaPercepcion(
        defaultValues.fechaPercepcion ? new Date(defaultValues.fechaPercepcion) : null
      );

      setMedioPagoId(
        defaultValues.medioPagoId ? Number(defaultValues.medioPagoId) : null
      );
      setNumeroOperacion(defaultValues.numeroOperacion || "");
      setBancoId(
        defaultValues.bancoId ? Number(defaultValues.bancoId) : null
      );
      setCuentaBancariaId(
        defaultValues.cuentaBancariaId ? Number(defaultValues.cuentaBancariaId) : null
      );
      setPrestamoBancarioId(
        defaultValues.prestamoBancarioId ? Number(defaultValues.prestamoBancarioId) : null
      );
      setObservaciones(defaultValues.observaciones || "");

      setFechaContable(
        defaultValues.fechaContable ? new Date(defaultValues.fechaContable) : new Date()
      );
      setPeriodoContableId(defaultValues.periodoContableId || null);

      setCreadoPor(defaultValues.creadoPor || null);
      setActualizadoPor(defaultValues.actualizadoPor || null);
      setFechaCreacion(
        defaultValues.fechaCreacion ? new Date(defaultValues.fechaCreacion) : null
      );
      setFechaActualizacion(
        defaultValues.fechaActualizacion ? new Date(defaultValues.fechaActualizacion) : null
      );
    }
  }, [defaultValues]);

  // ========================================
  // EFFECT: Cargar datos de cuenta seleccionada
  // ========================================
  useEffect(() => {
    if (cuentaPorPagarId && cuentasPorPagar) {
      const cuenta = cuentasPorPagar.find(
        (c) => Number(c.id) === Number(cuentaPorPagarId)
      );
      if (cuenta) {
        setCuentaSeleccionada(cuenta);
        setSaldoPendiente(Number(cuenta.saldoPendiente || 0));
        setMonedaPagoId(Number(cuenta.monedaId));
        setMonedaDeudaId(Number(cuenta.monedaId));
        setEmpresaId(Number(cuenta.empresaId));
        setEstadoId(Number(cuenta.estadoId));
      }
    }
  }, [cuentaPorPagarId, cuentasPorPagar]);

  // ========================================
  // EFFECT: Calcular monto aplicado a deuda
  // ========================================
  useEffect(() => {
    const montoBase = Number(montoPagado) || 0;
    const detraccion = tieneDetraccion ? Number(montoDetraccion) || 0 : 0;
    const retencion = tieneRetencion ? Number(montoRetencion) || 0 : 0;
    
    const montoCalculado = montoBase + detraccion + retencion;
    setMontoAplicadoDeuda(montoCalculado);
  }, [montoPagado, tieneDetraccion, montoDetraccion, tieneRetencion, montoRetencion]);

  // ========================================
  // HANDLER: Submit
  // ========================================
  const handleSubmit = () => {
    const estadoPagoId = estados?.find(
      (e) =>
        e.nombre?.toUpperCase().includes("PAGADO") ||
        e.nombre?.toUpperCase().includes("COBRADO")
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
      porcentajeDetraccion: tieneDetraccion && porcentajeDetraccion ? Number(porcentajeDetraccion) : null,
      numeroConstanciaDetraccion: tieneDetraccion ? numeroConstanciaDetraccion : null,
      fechaDetraccion: tieneDetraccion ? fechaDetraccion : null,

      tieneRetencion,
      montoRetencion: tieneRetencion ? Number(montoRetencion) : 0,
      porcentajeRetencion: tieneRetencion && porcentajeRetencion ? Number(porcentajeRetencion) : null,
      numeroComprobanteRetencion: tieneRetencion ? numeroComprobanteRetencion : null,
      fechaRetencion: tieneRetencion ? fechaRetencion : null,

      tienePercepcion,
      montoPercepcion: tienePercepcion ? Number(montoPercepcion) : 0,
      porcentajePercepcion: tienePercepcion && porcentajePercepcion ? Number(porcentajePercepcion) : null,
      numeroComprobantePercepcion: tienePercepcion ? numeroComprobantePercepcion : null,
      fechaPercepcion: tienePercepcion ? fechaPercepcion : null,

      medioPagoId: medioPagoId ? Number(medioPagoId) : null,
      numeroOperacion: numeroOperacion || null,
      bancoId: bancoId ? Number(bancoId) : null,
      cuentaBancariaId: cuentaBancariaId ? Number(cuentaBancariaId) : null,
      prestamoBancarioId: prestamoBancarioId ? Number(prestamoBancarioId) : null,
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
        `El monto del pago (${montoPagado}) no puede ser mayor al saldo pendiente (${saldoPendiente})`
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
      label: `${m.codigoSunat} - ${m.nombre}`,
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

  const prestamosBancariosOptions =
    prestamosBancarios?.map((p) => ({
      label: `${p.numeroPrestamo || p.id} - ${p.banco?.nombre || ""}`,
      value: Number(p.id),
    })) || [];

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="formgrid grid">
      <Panel header="Información del Pago" className="col-12 mb-3">
        <div className="formgrid grid">
          {!hideCuentaField && (
            <div className="field col-12 md:col-6">
              <label htmlFor="cuentaPorPagarId">
                Cuenta por Pagar <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="cuentaPorPagarId"
                value={cuentaPorPagarId}
                options={cuentasPorPagarOptions}
                onChange={(e) => setCuentaPorPagarId(e.value)}
                placeholder="Seleccione cuenta por pagar"
                filter
                showClear
                disabled={readOnly || isEdit}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          )}

          <div className="field col-12 md:col-6">
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

          {cuentaSeleccionada && (
            <div className="field col-12">
              <Panel
                header="Información de la Cuenta"
                className="p-3"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <strong>Proveedor:</strong>{" "}
                    {cuentaSeleccionada.proveedor?.razonSocial || "-"}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Monto Total:</strong>{" "}
                    {Number(cuentaSeleccionada.montoTotal || 0).toFixed(2)}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Saldo Pendiente:</strong>{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      {Number(saldoPendiente).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          <div className="field col-12 md:col-4">
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

          <div className="field col-12 md:col-4">
            <label htmlFor="monedaPagoId">
              Moneda Pago <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="monedaPagoId"
              value={monedaPagoId}
              options={monedasOptions}
              onChange={(e) => setMonedaPagoId(e.value)}
              placeholder="Seleccione moneda"
              disabled={readOnly || cuentaSeleccionada}
              style={{ width: "100%" }}
            />
          </div>

          <div className="field col-12 md:col-4">
            <label htmlFor="tipoCambio">Tipo de Cambio</label>
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

          <div className="field col-12 md:col-6">
            <label htmlFor="montoAplicadoDeuda">
              Monto Aplicado a Deuda (calculado)
            </label>
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

          <div className="field col-12 md:col-6">
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
        </div>
      </Panel>

      <Panel header="Detracción (SUNAT)" className="col-12 mb-3">
        <div className="formgrid grid">
          <div className="field col-12">
            <div className="flex align-items-center">
              <Checkbox
                inputId="tieneDetraccion"
                checked={tieneDetraccion}
                onChange={(e) => setTieneDetraccion(e.checked)}
                disabled={readOnly}
              />
              <label htmlFor="tieneDetraccion" className="ml-2">
                Tiene Detracción
              </label>
            </div>
          </div>

          {tieneDetraccion && (
            <>
              <div className="field col-12 md:col-4">
                <label htmlFor="montoDetraccion">Monto Detracción</label>
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

              <div className="field col-12 md:col-4">
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

              <div className="field col-12 md:col-4">
                <label htmlFor="fechaDetraccion">Fecha Detracción</label>
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

              <div className="field col-12">
                <label htmlFor="numeroConstanciaDetraccion">
                  N° Constancia SUNAT
                </label>
                <InputText
                  id="numeroConstanciaDetraccion"
                  value={numeroConstanciaDetraccion}
                  onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </div>
      </Panel>

      <Panel header="Retención (SUNAT)" className="col-12 mb-3">
        <div className="formgrid grid">
          <div className="field col-12">
            <div className="flex align-items-center">
              <Checkbox
                inputId="tieneRetencion"
                checked={tieneRetencion}
                onChange={(e) => setTieneRetencion(e.checked)}
                disabled={readOnly}
              />
              <label htmlFor="tieneRetencion" className="ml-2">
                Tiene Retención
              </label>
            </div>
          </div>

          {tieneRetencion && (
            <>
              <div className="field col-12 md:col-4">
                <label htmlFor="montoRetencion">Monto Retención</label>
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

              <div className="field col-12 md:col-4">
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

              <div className="field col-12 md:col-4">
                <label htmlFor="fechaRetencion">Fecha Retención</label>
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

              <div className="field col-12">
                <label htmlFor="numeroComprobanteRetencion">
                  N° Comprobante Retención
                </label>
                <InputText
                  id="numeroComprobanteRetencion"
                  value={numeroComprobanteRetencion}
                  onChange={(e) => setNumeroComprobanteRetencion(e.target.value)}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </div>
      </Panel>

      <Panel header="Percepción (SUNAT)" className="col-12 mb-3">
        <div className="formgrid grid">
          <div className="field col-12">
            <div className="flex align-items-center">
              <Checkbox
                inputId="tienePercepcion"
                checked={tienePercepcion}
                onChange={(e) => setTienePercepcion(e.checked)}
                disabled={readOnly}
              />
              <label htmlFor="tienePercepcion" className="ml-2">
                Tiene Percepción
              </label>
            </div>
          </div>

          {tienePercepcion && (
            <>
              <div className="field col-12 md:col-4">
                <label htmlFor="montoPercepcion">Monto Percepción</label>
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

              <div className="field col-12 md:col-4">
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

              <div className="field col-12 md:col-4">
                <label htmlFor="fechaPercepcion">Fecha Percepción</label>
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

              <div className="field col-12">
                <label htmlFor="numeroComprobantePercepcion">
                  N° Comprobante Percepción
                </label>
                <InputText
                  id="numeroComprobantePercepcion"
                  value={numeroComprobantePercepcion}
                  onChange={(e) => setNumeroComprobantePercepcion(e.target.value)}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </div>
      </Panel>

      <Panel header="Medio de Pago" className="col-12 mb-3">
        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
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

          <div className="field col-12 md:col-6">
            <label htmlFor="numeroOperacion">Número de Operación</label>
            <InputText
              id="numeroOperacion"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="bancoId">Banco</label>
            <Dropdown
              id="bancoId"
              value={bancoId}
              options={bancosOptions}
              onChange={(e) => setBancoId(e.value)}
              placeholder="Seleccione banco"
              showClear
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="cuentaBancariaId">Cuenta Bancaria</label>
            <Dropdown
              id="cuentaBancariaId"
              value={cuentaBancariaId}
              options={cuentasCorrientesOptions}
              onChange={(e) => setCuentaBancariaId(e.value)}
              placeholder="Seleccione cuenta bancaria"
              showClear
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          <div className="field col-12">
            <label htmlFor="prestamoBancarioId">Préstamo Bancario</label>
            <Dropdown
              id="prestamoBancarioId"
              value={prestamoBancarioId}
              options={prestamosBancariosOptions}
              onChange={(e) => setPrestamoBancarioId(e.value)}
              placeholder="Seleccione préstamo bancario"
              showClear
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Contabilidad" className="col-12 mb-3">
        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
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

          <div className="field col-12 md:col-6">
            <label htmlFor="periodoContableId">Periodo Contable</label>
            <InputText
              id="periodoContableId"
              value={periodoContableId || ""}
              onChange={(e) => setPeriodoContableId(e.target.value)}
              disabled={readOnly}
              placeholder="ID del periodo contable"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Panel>

      <Panel header="Observaciones" className="col-12 mb-3">
        <div className="field col-12">
          <InputTextarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            disabled={readOnly}
            style={{ width: "100%" }}
          />
        </div>
      </Panel>

      {isEdit && (
        <Panel header="Auditoría" className="col-12 mb-3">
          <div className="formgrid grid">
            <div className="field col-12 md:col-6">
              <label>Creado Por</label>
              <InputText
                value={creadoPor ? `Usuario ID: ${creadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div className="field col-12 md:col-6">
              <label>Fecha Creación</label>
              <Calendar
                value={fechaCreacion}
                disabled
                dateFormat="dd/mm/yy"
                showTime
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div className="field col-12 md:col-6">
              <label>Actualizado Por</label>
              <InputText
                value={actualizadoPor ? `Usuario ID: ${actualizadoPor}` : "N/A"}
                disabled
                style={{ width: "100%", backgroundColor: "#f0f0f0" }}
              />
            </div>

            <div className="field col-12 md:col-6">
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

      {!readOnly && (
        <div className="col-12" style={{ textAlign: "right" }}>
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
