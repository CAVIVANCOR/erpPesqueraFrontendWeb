// src/components/deudaTributaria/PagoDeudaTributariaDialog.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const PagoDeudaTributariaDialog = ({
  pago,
  deudaId,
  monedaDeudaId,
  saldoPendiente,
  monedas,
  mediosPago,
  onSubmit,
  onCancel,
}) => {
  const { usuario } = useAuthStore();

  const [fechaPago, setFechaPago] = useState(
    pago?.fechaPago ? new Date(pago.fechaPago) : new Date()
  );
  const [medioPagoId, setMedioPagoId] = useState(pago?.medioPagoId || null);
  const [monedaPagoId, setMonedaPagoId] = useState(pago?.monedaPagoId || monedaDeudaId || null);
  const [montoPagado, setMontoPagado] = useState(pago?.montoPagado || 0);
  const [tipoCambio, setTipoCambio] = useState(pago?.tipoCambio || 1);
  const [montoAplicadoDeuda, setMontoAplicadoDeuda] = useState(
    pago?.montoAplicadoDeuda || pago?.montoPagado || 0
  );
  const [numeroOperacion, setNumeroOperacion] = useState(pago?.numeroOperacion || "");
  const [observaciones, setObservaciones] = useState(pago?.observaciones || "");

  // Recalcular montoAplicadoDeuda cuando cambian montoPagado o tipoCambio
  useEffect(() => {
    if (!pago) {
      const montoAplicado = Number(montoPagado) * Number(tipoCambio);
      setMontoAplicadoDeuda(montoAplicado);
    }
  }, [montoPagado, tipoCambio, pago]);

  // Detectar si las monedas son diferentes
  useEffect(() => {
    if (Number(monedaPagoId) === Number(monedaDeudaId)) {
      setTipoCambio(1);
    }
  }, [monedaPagoId, monedaDeudaId]);

  const handleSubmit = () => {
    const data = {
      deudaTributariaId: Number(deudaId),
      fechaPago,
      medioPagoId: Number(medioPagoId),
      monedaPagoId: Number(monedaPagoId),
      montoPagado: Number(montoPagado),
      tipoCambio: Number(tipoCambio),
      montoAplicadoDeuda: Number(montoAplicadoDeuda),
      numeroOperacion,
      observaciones,
      creadoPor: pago?.creadoPor || (usuario?.personalId ? Number(usuario.personalId) : null),
      actualizadoPor: pago ? (usuario?.personalId ? Number(usuario.personalId) : null) : null,
    };
    onSubmit(data);
  };

  const getColorPorMoneda = (monedaId) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.colorFondo || "#ffffff";
  };

  const monedasDiferentes = Number(monedaPagoId) !== Number(monedaDeudaId);

  return (
    <div className="p-fluid formgrid grid">
      {/* Fecha Pago */}
      <div className="field col-12 md:col-6">
        <label htmlFor="fechaPago">
          Fecha de Pago <span className="text-red-500">*</span>
        </label>
        <Calendar
          id="fechaPago"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
        />
      </div>

      {/* Medio de Pago */}
      <div className="field col-12 md:col-6">
        <label htmlFor="medioPagoId">
          Medio de Pago <span className="text-red-500">*</span>
        </label>
        <Dropdown
          id="medioPagoId"
          value={medioPagoId}
          options={mediosPago}
          onChange={(e) => setMedioPagoId(e.value)}
          optionLabel="descripcion"
          optionValue="id"
          placeholder="Seleccione medio de pago"
          filter
        />
      </div>

      {/* Moneda Pago */}
      <div className="field col-12 md:col-6">
        <label htmlFor="monedaPagoId">
          Moneda de Pago <span className="text-red-500">*</span>
        </label>
        <Dropdown
          id="monedaPagoId"
          value={monedaPagoId}
          options={monedas}
          onChange={(e) => setMonedaPagoId(e.value)}
          optionLabel="codigoSunat"
          optionValue="id"
          placeholder="Seleccione moneda"
        />
      </div>

      {/* Monto Pagado */}
      <div className="field col-12 md:col-6">
        <label htmlFor="montoPagado">
          Monto Pagado <span className="text-red-500">*</span>
        </label>
        <InputNumber
          id="montoPagado"
          value={montoPagado}
          onValueChange={(e) => setMontoPagado(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          style={{ backgroundColor: getColorPorMoneda(monedaPagoId) }}
        />
      </div>

      {/* Tipo de Cambio (solo si monedas diferentes) */}
      {monedasDiferentes && (
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoCambio">
            Tipo de Cambio <span className="text-red-500">*</span>
          </label>
          <InputNumber
            id="tipoCambio"
            value={tipoCambio}
            onValueChange={(e) => setTipoCambio(e.value)}
            mode="decimal"
            minFractionDigits={4}
            maxFractionDigits={4}
            min={0.0001}
          />
          <small className="text-muted">
            Conversión de moneda de pago a moneda de deuda
          </small>
        </div>
      )}

      {/* Monto Aplicado a Deuda */}
      <div className="field col-12 md:col-6">
        <label htmlFor="montoAplicadoDeuda">Monto Aplicado a Deuda</label>
        <InputNumber
          id="montoAplicadoDeuda"
          value={montoAplicadoDeuda}
          onValueChange={(e) => setMontoAplicadoDeuda(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          style={{ backgroundColor: getColorPorMoneda(monedaDeudaId) }}
          disabled={!monedasDiferentes}
        />
        <small className="text-muted">
          Saldo pendiente: {saldoPendiente?.toFixed(2) || "0.00"}
        </small>
      </div>

      {/* Número de Operación */}
      <div className="field col-12">
        <label htmlFor="numeroOperacion">Número de Operación</label>
        <InputText
          id="numeroOperacion"
          value={numeroOperacion}
          onChange={(e) => setNumeroOperacion(e.target.value)}
          placeholder="Ej: OP-2024-001, Transferencia 12345"
        />
      </div>

      {/* Observaciones */}
      <div className="field col-12">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea
          id="observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="field col-12">
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-warning"
            onClick={onCancel}
            outlined
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default PagoDeudaTributariaDialog;