// src/components/tesoreria/CuotaPrestamoForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

export default function CuotaPrestamoForm({
  isEdit = false,
  isPago = false,
  defaultValues = {},
  prestamoBancarioId,
  onSubmit,
  onCancel,
  loading,
}) {
  const [formData, setFormData] = useState({
    numeroCuota: defaultValues?.numeroCuota || 1,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
    saldoInicial: defaultValues?.saldoInicial || 0,
    capital: defaultValues?.capital || 0,
    interes: defaultValues?.interes || 0,
    cuota: defaultValues?.cuota || 0,
    saldoFinal: defaultValues?.saldoFinal || 0,
    estado: defaultValues?.estado || "PENDIENTE",
    fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
    montoPagado: defaultValues?.montoPagado || defaultValues?.cuota || 0,
  });

  const estadosOptions = [
    { label: "PENDIENTE", value: "PENDIENTE" },
    { label: "PAGADA", value: "PAGADA" },
    { label: "VENCIDA", value: "VENCIDA" },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Calcular cuota total automáticamente
      if (field === "capital" || field === "interes") {
        newData.cuota = Number(newData.capital || 0) + Number(newData.interes || 0);
      }

      // Calcular saldo final automáticamente
      if (field === "saldoInicial" || field === "capital") {
        newData.saldoFinal = Number(newData.saldoInicial || 0) - Number(newData.capital || 0);
      }

      return newData;
    });
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        numeroCuota: defaultValues?.numeroCuota || 1,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
        saldoInicial: defaultValues?.saldoInicial || 0,
        capital: defaultValues?.capital || 0,
        interes: defaultValues?.interes || 0,
        cuota: defaultValues?.cuota || 0,
        saldoFinal: defaultValues?.saldoFinal || 0,
        estado: defaultValues?.estado || "PENDIENTE",
        fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
        montoPagado: defaultValues?.montoPagado || defaultValues?.cuota || 0,
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPago) {
      // Solo enviar datos de pago
      const dataToSend = {
        fechaPago: formData.fechaPago,
        montoPagado: Number(formData.montoPagado),
      };
      await onSubmit(dataToSend);
    } else {
      // Enviar datos completos de cuota
      const dataToSend = {
        numeroCuota: Number(formData.numeroCuota),
        fechaVencimiento: formData.fechaVencimiento,
        saldoInicial: Number(formData.saldoInicial),
        capital: Number(formData.capital),
        interes: Number(formData.interes),
        cuota: Number(formData.cuota),
        saldoFinal: Number(formData.saldoFinal),
        estado: formData.estado,
      };
      await onSubmit(dataToSend);
    }
  };

  if (isPago) {
    // Formulario simplificado para registrar pago
    return (
      <form onSubmit={handleSubmit} className="p-fluid">
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="fechaPago" style={{ fontWeight: "bold" }}>
            Fecha de Pago *
          </label>
          <Calendar
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => handleChange("fechaPago", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="montoPagado" style={{ fontWeight: "bold" }}>
            Monto Pagado *
          </label>
          <InputNumber
            id="montoPagado"
            value={formData.montoPagado}
            onValueChange={(e) => handleChange("montoPagado", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button label="Cancelar" icon="pi pi-times" onClick={onCancel} className="p-button-text" type="button" disabled={loading} />
          <Button label="Registrar Pago" icon="pi pi-check" type="submit" disabled={loading} loading={loading} />
        </div>
      </form>
    );
  }

  // Formulario completo para crear/editar cuota
  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuota" style={{ fontWeight: "bold" }}>
            Número de Cuota *
          </label>
          <InputNumber
            id="numeroCuota"
            value={formData.numeroCuota}
            onValueChange={(e) => handleChange("numeroCuota", e.value)}
            min={1}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha de Vencimiento *
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estado" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estado"
            value={formData.estado}
            options={estadosOptions}
            onChange={(e) => handleChange("estado", e.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoInicial" style={{ fontWeight: "bold" }}>
            Saldo Inicial *
          </label>
          <InputNumber
            id="saldoInicial"
            value={formData.saldoInicial}
            onValueChange={(e) => handleChange("saldoInicial", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="capital" style={{ fontWeight: "bold" }}>
            Capital *
          </label>
          <InputNumber
            id="capital"
            value={formData.capital}
            onValueChange={(e) => handleChange("capital", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="interes" style={{ fontWeight: "bold" }}>
            Interés *
          </label>
          <InputNumber
            id="interes"
            value={formData.interes}
            onValueChange={(e) => handleChange("interes", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="cuota" style={{ fontWeight: "bold" }}>
            Cuota Total *
          </label>
          <InputNumber
            id="cuota"
            value={formData.cuota}
            onValueChange={(e) => handleChange("cuota", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
            disabled
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoFinal" style={{ fontWeight: "bold" }}>
            Saldo Final *
          </label>
          <InputNumber
            id="saldoFinal"
            value={formData.saldoFinal}
            onValueChange={(e) => handleChange("saldoFinal", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
            disabled
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Button label="Cancelar" icon="pi pi-times" onClick={onCancel} className="p-button-text" type="button" disabled={loading} />
        <Button label={isEdit ? "Actualizar" : "Guardar"} icon="pi pi-check" type="submit" disabled={loading} loading={loading} />
      </div>
    </form>
  );
}