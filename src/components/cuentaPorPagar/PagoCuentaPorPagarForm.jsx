// src/components/cuentaPorPagar/PagoCuentaPorPagarForm.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

export default function PagoCuentaPorPagarForm({
  visible,
  pago,
  isEdit,
  saldoPendiente,
  monedaId,
  monedas,
  mediosPago,
  bancos,
  cuentasCorrientes,
  onHide,
  onSave,
  loading,
  readOnly = false,
}) {
  const [formData, setFormData] = useState({
    fechaPago: new Date(),
    montoPago: 0,
    monedaId: null,
    tipoCambio: 1,
    medioPagoId: null,
    numeroOperacion: "",
    bancoId: null,
    cuentaBancariaId: null,
    observaciones: "",
  });

  useEffect(() => {
    if (pago && isEdit) {
      setFormData({
        id: pago.id,
        fechaPago: new Date(pago.fechaPago),
        montoPago: Number(pago.montoPago),
        monedaId: Number(pago.monedaId),
        tipoCambio: Number(pago.tipoCambio),
        medioPagoId: Number(pago.medioPagoId),
        numeroOperacion: pago.numeroOperacion || "",
        bancoId: pago.bancoId ? Number(pago.bancoId) : null,
        cuentaBancariaId: pago.cuentaBancariaId
          ? Number(pago.cuentaBancariaId)
          : null,
        observaciones: pago.observaciones || "",
      });
    } else {
      setFormData({
        fechaPago: new Date(),
        montoPago: 0,
        monedaId: monedaId ? Number(monedaId) : null,
        tipoCambio: 1,
        medioPagoId: null,
        numeroOperacion: "",
        bancoId: null,
        cuentaBancariaId: null,
        observaciones: "",
      });
    }
  }, [pago, isEdit, monedaId, visible]);

  const puedeEditar = !readOnly && !loading;

  const handleSubmit = () => {
    onSave(formData);
  };

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

  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
          disabled={!puedeEditar}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "600px" }}
      header={isEdit ? "Editar Pago" : "Registrar Pago"}
      modal
      footer={footer}
      onHide={onHide}
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="fechaPago">
            Fecha de Pago <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => setFormData({ ...formData, fechaPago: e.value })}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="montoPago">
            Monto del Pago <span style={{ color: "red" }}>*</span>
          </label>
          <InputNumber
            id="montoPago"
            value={formData.montoPago}
            onValueChange={(e) =>
              setFormData({ ...formData, montoPago: e.value })
            }
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={!puedeEditar}
          />
          <small>
            Saldo pendiente: {Number(saldoPendiente || 0).toFixed(2)}
          </small>
        </div>

        <div className="field">
          <label htmlFor="monedaId">
            Moneda <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            options={monedasOptions}
            onChange={(e) => setFormData({ ...formData, monedaId: e.value })}
            placeholder="Seleccione moneda"
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="tipoCambio">Tipo de Cambio</label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) =>
              setFormData({ ...formData, tipoCambio: e.value })
            }
            mode="decimal"
            minFractionDigits={4}
            maxFractionDigits={4}
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="medioPagoId">
            Medio de Pago <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="medioPagoId"
            value={formData.medioPagoId}
            options={mediosPagoOptions}
            onChange={(e) => setFormData({ ...formData, medioPagoId: e.value })}
            placeholder="Seleccione medio de pago"
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="numeroOperacion">Número de Operación</label>
          <InputText
            id="numeroOperacion"
            value={formData.numeroOperacion}
            onChange={(e) =>
              setFormData({ ...formData, numeroOperacion: e.target.value })
            }
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="bancoId">Banco</label>
          <Dropdown
            id="bancoId"
            value={formData.bancoId}
            options={bancosOptions}
            onChange={(e) => setFormData({ ...formData, bancoId: e.value })}
            placeholder="Seleccione banco"
            showClear
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="cuentaBancariaId">Cuenta Bancaria</label>
          <Dropdown
            id="cuentaBancariaId"
            value={formData.cuentaBancariaId}
            options={cuentasCorrientesOptions}
            onChange={(e) =>
              setFormData({ ...formData, cuentaBancariaId: e.value })
            }
            placeholder="Seleccione cuenta bancaria"
            showClear
            disabled={!puedeEditar}
          />
        </div>

        <div className="field">
          <label htmlFor="observaciones">Observaciones</label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
            rows={3}
            disabled={!puedeEditar}
          />
        </div>
      </div>
    </Dialog>
  );
}
