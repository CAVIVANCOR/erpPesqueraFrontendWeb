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
    saldoCapitalAntes: defaultValues?.saldoCapitalAntes || 0,
    montoCapital: defaultValues?.montoCapital || 0,
    montoInteres: defaultValues?.montoInteres || 0,
    montoComision: defaultValues?.montoComision || 0,
    montoSeguro: defaultValues?.montoSeguro || 0,
    montoTotal: defaultValues?.montoTotal || 0,
    saldoCapitalDespues: defaultValues?.saldoCapitalDespues || 0,
    estadoPago: defaultValues?.estadoPago || "PENDIENTE",
    fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
    montoPagado: defaultValues?.montoPagado || defaultValues?.montoTotal || 0,
  });

  const estadosOptions = [
    { label: "PENDIENTE", value: "PENDIENTE" },
    { label: "PAGADA", value: "PAGADA" },
    { label: "VENCIDA", value: "VENCIDA" },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

           // Calcular cuota total automáticamente (Capital + Interés + Comisión + Seguro)
      if (field === "montoCapital" || field === "montoInteres" || field === "montoComision" || field === "montoSeguro") {
        newData.montoTotal = 
          Number(newData.montoCapital || 0) + 
          Number(newData.montoInteres || 0) + 
          Number(newData.montoComision || 0) + 
          Number(newData.montoSeguro || 0);
      }

      // Los saldos se calculan automáticamente en el backend

      return newData;
    });
  };

    useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        numeroCuota: defaultValues?.numeroCuota || 1,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
        saldoCapitalAntes: defaultValues?.saldoCapitalAntes || 0,
        montoCapital: defaultValues?.montoCapital || 0,
        montoInteres: defaultValues?.montoInteres || 0,
        montoComision: defaultValues?.montoComision || 0,
        montoSeguro: defaultValues?.montoSeguro || 0,
        montoTotal: defaultValues?.montoTotal || 0,
        saldoCapitalDespues: defaultValues?.saldoCapitalDespues || 0,
        estadoPago: defaultValues?.estadoPago || "PENDIENTE",
        fechaPago: defaultValues?.fechaPago ? new Date(defaultValues.fechaPago) : new Date(),
        montoPagado: defaultValues?.montoPagado || defaultValues?.montoTotal || 0,
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
        montoCapital: Number(formData.montoCapital),
        montoInteres: Number(formData.montoInteres),
        montoComision: Number(formData.montoComision),
        montoSeguro: Number(formData.montoSeguro),
        montoTotal: Number(formData.montoTotal),
        estadoPago: formData.estadoPago,
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
          <label htmlFor="estadoPago" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoPago"
            value={formData.estadoPago}
            options={estadosOptions}
            onChange={(e) => handleChange("estadoPago", e.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
               <div style={{ flex: 1 }}>
          <label htmlFor="saldoCapitalAntes" style={{ fontWeight: "bold" }}>
            Saldo Capital Antes
          </label>
          <InputNumber
            id="saldoCapitalAntes"
            value={formData.saldoCapitalAntes}
            onValueChange={(e) => handleChange("saldoCapitalAntes", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
            tooltip="Calculado automáticamente por el sistema"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoCapital" style={{ fontWeight: "bold" }}>
            Monto Capital *
          </label>
          <InputNumber
            id="montoCapital"
            value={formData.montoCapital}
            onValueChange={(e) => handleChange("montoCapital", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoInteres" style={{ fontWeight: "bold" }}>
            Monto Interés *
          </label>
          <InputNumber
            id="montoInteres"
            value={formData.montoInteres}
            onValueChange={(e) => handleChange("montoInteres", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
          />
               </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoComision" style={{ fontWeight: "bold" }}>
            Monto Comisión
          </label>
          <InputNumber
            id="montoComision"
            value={formData.montoComision}
            onValueChange={(e) => handleChange("montoComision", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoSeguro" style={{ fontWeight: "bold" }}>
            Monto Seguro
          </label>
          <InputNumber
            id="montoSeguro"
            value={formData.montoSeguro}
            onValueChange={(e) => handleChange("montoSeguro", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoTotal" style={{ fontWeight: "bold" }}>
            Monto Total *
          </label>
          <InputNumber
            id="montoTotal"
            value={formData.montoTotal}
            onValueChange={(e) => handleChange("montoTotal", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            required
            disabled
          />
        </div>
                <div style={{ flex: 1 }}>
          <label htmlFor="saldoCapitalDespues" style={{ fontWeight: "bold" }}>
            Saldo Capital Después
          </label>
          <InputNumber
            id="saldoCapitalDespues"
            value={formData.saldoCapitalDespues}
            onValueChange={(e) => handleChange("saldoCapitalDespues", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
            tooltip="Calculado automáticamente por el sistema"
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