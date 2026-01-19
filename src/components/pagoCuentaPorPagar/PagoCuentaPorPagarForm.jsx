// src/components/pagoCuentaPorPagar/PagoCuentaPorPagarForm.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PagoCuentaPorPagarForm({
  isEdit,
  defaultValues,
  cuentasPorPagar,
  monedas,
  mediosPago,
  bancos,
  cuentasCorrientes,
  estados,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [cuentaPorPagarId, setCuentaPorPagarId] = useState(
    defaultValues?.cuentaPorPagarId || null
  );
  const [fechaPago, setFechaPago] = useState(
    defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date()
  );
  const [montoPago, setMontoPago] = useState(
    defaultValues?.montoPago || 0
  );
  const [monedaId, setMonedaId] = useState(
    defaultValues?.monedaId || null
  );
  const [tipoCambio, setTipoCambio] = useState(
    defaultValues?.tipoCambio || 1
  );
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
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || ""
  );

  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [empresaId, setEmpresaId] = useState(null);
  const [estadoId, setEstadoId] = useState(null);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setCuentaPorPagarId(
        defaultValues.cuentaPorPagarId ? Number(defaultValues.cuentaPorPagarId) : null
      );
      setFechaPago(
        defaultValues.fechaPago
          ? new Date(defaultValues.fechaPago)
          : new Date()
      );
      setMontoPago(defaultValues.montoPago || 0);
      setMonedaId(
        defaultValues.monedaId ? Number(defaultValues.monedaId) : null
      );
      setTipoCambio(defaultValues.tipoCambio || 1);
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
      setObservaciones(defaultValues.observaciones || "");
    }
  }, [defaultValues]);

  useEffect(() => {
    if (cuentaPorPagarId && cuentasPorPagar) {
      const cuenta = cuentasPorPagar.find(
        (c) => Number(c.id) === Number(cuentaPorPagarId)
      );
      if (cuenta) {
        setCuentaSeleccionada(cuenta);
        setSaldoPendiente(Number(cuenta.saldoPendiente || 0));
        setMonedaId(Number(cuenta.monedaId));
        setEmpresaId(Number(cuenta.empresaId));
        setEstadoId(Number(cuenta.estadoId));
      }
    }
  }, [cuentaPorPagarId, cuentasPorPagar]);

  const handleSubmit = () => {
    const estadoPagoId = estados?.find(e => e.nombre?.toUpperCase().includes('PAGADO') || e.nombre?.toUpperCase().includes('COBRADO'))?.id || estadoId;
    
    const dataParaGrabacion = {
      cuentaPorPagarId: cuentaPorPagarId ? Number(cuentaPorPagarId) : null,
      empresaId: empresaId ? Number(empresaId) : null,
      fechaPago,
      montoPagado: Number(montoPago),
      monedaId: monedaId ? Number(monedaId) : null,
      tipoCambio: Number(tipoCambio),
      medioPagoId: medioPagoId ? Number(medioPagoId) : null,
      numeroOperacion: numeroOperacion || null,
      bancoId: bancoId ? Number(bancoId) : null,
      cuentaBancariaId: cuentaBancariaId ? Number(cuentaBancariaId) : null,
      movimientoCajaId: null,
      estadoId: estadoPagoId ? Number(estadoPagoId) : null,
      observaciones: observaciones || null,
    };

    if (!dataParaGrabacion.cuentaPorPagarId) {
      alert("Debe seleccionar una Cuenta por Pagar");
      return;
    }

    if (!dataParaGrabacion.montoPago || dataParaGrabacion.montoPago <= 0) {
      alert("El monto del pago debe ser mayor a 0");
      return;
    }

    if (Number(montoPago) > Number(saldoPendiente)) {
      alert(`El monto del pago (${montoPago}) no puede ser mayor al saldo pendiente (${saldoPendiente})`);
      return;
    }

    if (!dataParaGrabacion.medioPagoId) {
      alert("Debe seleccionar un Medio de Pago");
      return;
    }

    onSubmit(dataParaGrabacion);
  };

  const cuentasPorPagarOptions = cuentasPorPagar?.map((c) => ({
    label: `${c.numeroOrdenCompra || c.id} - ${c.proveedor?.razonSocial || "Sin proveedor"} - Saldo: ${Number(c.saldoPendiente || 0).toFixed(2)}`,
    value: Number(c.id),
  })) || [];

  const monedasOptions = monedas?.map((m) => ({
    label: `${m.codigoSunat} - ${m.nombre}`,
    value: Number(m.id),
  })) || [];

  const mediosPagoOptions = mediosPago?.map((m) => ({
    label: m.nombre,
    value: Number(m.id),
  })) || [];

  const bancosOptions = bancos?.map((b) => ({
    label: b.nombre,
    value: Number(b.id),
  })) || [];

  const cuentasCorrientesOptions = cuentasCorrientes?.map((c) => ({
    label: `${c.numeroCuenta} - ${c.banco?.nombre || ""}`,
    value: Number(c.id),
  })) || [];

  return (
    <div className="formgrid grid">
      <Panel header="Información del Pago" className="col-12 mb-3">
        <div className="formgrid grid">
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
              style={{ width: "100%" }}
            />
          </div>

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
              <Panel header="Información de la Cuenta" className="p-3" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <strong>Proveedor:</strong> {cuentaSeleccionada.proveedor?.razonSocial || "-"}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Monto Total:</strong> {Number(cuentaSeleccionada.montoTotal || 0).toFixed(2)}
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
            <label htmlFor="montoPago">
              Monto del Pago <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="montoPago"
              value={montoPago}
              onValueChange={(e) => setMontoPago(e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          <div className="field col-12 md:col-4">
            <label htmlFor="monedaId">
              Moneda <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="monedaId"
              value={monedaId}
              options={monedasOptions}
              onChange={(e) => setMonedaId(e.value)}
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
