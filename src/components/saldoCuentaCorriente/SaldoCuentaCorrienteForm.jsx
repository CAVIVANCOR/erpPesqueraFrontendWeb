// src/components/saldoCuentaCorriente/SaldoCuentaCorrienteForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import {
  crearSaldoCuentaCorriente,
  actualizarSaldoCuentaCorriente,
} from "../../api/saldoCuentaCorriente";

export default function SaldoCuentaCorrienteForm({
  isEdit = false,
  defaultValues = {},
  cuentasCorrientes = [],
  empresas = [],
  centrosCosto = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    cuentaCorrienteId: defaultValues?.cuentaCorrienteId || null,
    empresaId: defaultValues?.empresaId || null,
    fecha: defaultValues?.fecha ? new Date(defaultValues.fecha) : new Date(),
    saldoAnterior: defaultValues?.saldoAnterior || 0,
    ingresos: defaultValues?.ingresos || 0,
    egresos: defaultValues?.egresos || 0,
    saldoActual: defaultValues?.saldoActual || 0,
    movimientoCajaId: defaultValues?.movimientoCajaId || null,
    saldoContable: defaultValues?.saldoContable || null,
    diferencia: defaultValues?.diferencia || null,
    conciliado: defaultValues?.conciliado || false,
    fechaConciliacion: defaultValues?.fechaConciliacion
      ? new Date(defaultValues.fechaConciliacion)
      : null,
    centroCostoId: defaultValues?.centroCostoId || null,
  });

  useEffect(() => {
    setFormData({
      cuentaCorrienteId: defaultValues?.cuentaCorrienteId
        ? Number(defaultValues.cuentaCorrienteId)
        : null,
      empresaId: defaultValues?.empresaId
        ? Number(defaultValues.empresaId)
        : null,
      fecha: defaultValues?.fecha ? new Date(defaultValues.fecha) : new Date(),
      saldoAnterior: defaultValues?.saldoAnterior || 0,
      ingresos: defaultValues?.ingresos || 0,
      egresos: defaultValues?.egresos || 0,
      saldoActual: defaultValues?.saldoActual || 0,
      movimientoCajaId: defaultValues?.movimientoCajaId
        ? Number(defaultValues.movimientoCajaId)
        : null,
      saldoContable: defaultValues?.saldoContable || null,
      diferencia: defaultValues?.diferencia || null,
      conciliado: defaultValues?.conciliado || false,
      fechaConciliacion: defaultValues?.fechaConciliacion
        ? new Date(defaultValues.fechaConciliacion)
        : null,
      centroCostoId: defaultValues?.centroCostoId
        ? Number(defaultValues.centroCostoId)
        : null,
    });
  }, [defaultValues]);

  // Calcular saldo actual automáticamente
  useEffect(() => {
    const calculado =
      Number(formData.saldoAnterior) +
      Number(formData.ingresos) -
      Number(formData.egresos);
    setFormData((prev) => ({ ...prev, saldoActual: calculado }));
  }, [formData.saldoAnterior, formData.ingresos, formData.egresos]);

  // Calcular diferencia automáticamente si hay saldo contable
  useEffect(() => {
    if (
      formData.saldoContable !== null &&
      formData.saldoContable !== undefined
    ) {
      const dif = Number(formData.saldoActual) - Number(formData.saldoContable);
      setFormData((prev) => ({ ...prev, diferencia: dif }));
    } else {
      setFormData((prev) => ({ ...prev, diferencia: null }));
    }
  }, [formData.saldoActual, formData.saldoContable]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una empresa",
        life: 3000,
      });
      return;
    }

    if (!formData.cuentaCorrienteId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una cuenta corriente",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      cuentaCorrienteId: Number(formData.cuentaCorrienteId),
      fecha: formData.fecha || new Date(),
      saldoAnterior: Number(formData.saldoAnterior),
      ingresos: Number(formData.ingresos),
      egresos: Number(formData.egresos),
      saldoActual: Number(formData.saldoActual),
      movimientoCajaId: formData.movimientoCajaId
        ? Number(formData.movimientoCajaId)
        : null,
      saldoContable:
        formData.saldoContable !== null ? Number(formData.saldoContable) : null,
      diferencia:
        formData.diferencia !== null ? Number(formData.diferencia) : null,
      conciliado: formData.conciliado,
      fechaConciliacion: formData.fechaConciliacion || null,
      centroCostoId: formData.centroCostoId
        ? Number(formData.centroCostoId)
        : null,
    };

    setGuardando(true);
    try {
      if (isEdit) {
        await actualizarSaldoCuentaCorriente(defaultValues.id, dataToSend);
      } else {
        await crearSaldoCuentaCorriente(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail: error.response?.data?.message || "Error al guardar saldo",
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const cuentasOptions = cuentasCorrientes.map((cuenta) => ({
    label: `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`,
    value: Number(cuenta.id),
  }));

  const centrosOptions = centrosCosto.map((cc) => ({
    label: cc.Nombre || cc.nombre,
    value: Number(cc.id),
  }));

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit} className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
              Empresa <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresasOptions}
              onChange={(e) => handleChange("empresaId", e.value)}
              placeholder="Seleccione empresa"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="cuentaCorrienteId" style={{ fontWeight: "bold" }}>
              Cuenta Corriente <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="cuentaCorrienteId"
              value={formData.cuentaCorrienteId}
              options={cuentasOptions}
              onChange={(e) => handleChange("cuentaCorrienteId", e.value)}
              placeholder="Seleccione cuenta"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fecha" style={{ fontWeight: "bold" }}>
              Fecha <span style={{ color: "red" }}>*</span>
            </label>
            <Calendar
              id="fecha"
              value={formData.fecha}
              onChange={(e) => handleChange("fecha", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={readOnly || loading || guardando}
              required
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="saldoAnterior" style={{ fontWeight: "bold" }}>
              Saldo Anterior <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="saldoAnterior"
              value={formData.saldoAnterior}
              onValueChange={(e) => handleChange("saldoAnterior", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="ingresos" style={{ fontWeight: "bold" }}>
              Ingresos <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="ingresos"
              value={formData.ingresos}
              onValueChange={(e) => handleChange("ingresos", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="egresos" style={{ fontWeight: "bold" }}>
              Egresos <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="egresos"
              value={formData.egresos}
              onValueChange={(e) => handleChange("egresos", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="saldoActual">Saldo Actual (Calculado)</label>
            <InputNumber
              id="saldoActual"
              value={formData.saldoActual}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={true}
              style={{ backgroundColor: "#e9ecef" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="centroCostoId">Centro de Costo</label>
            <Dropdown
              id="centroCostoId"
              value={formData.centroCostoId}
              options={centrosOptions}
              onChange={(e) => handleChange("centroCostoId", e.value)}
              placeholder="Seleccione centro de costo"
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: "#f0f8ff",
            borderRadius: 8,
            border: "1px solid #b0d4f1",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#1e3a5f" }}>
            Conciliación Bancaria
          </h4>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="saldoContable">Saldo Contable</label>
              <InputNumber
                id="saldoContable"
                value={formData.saldoContable}
                onValueChange={(e) => handleChange("saldoContable", e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={readOnly || loading || guardando}
                placeholder="Ingrese saldo contable"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="diferencia">Diferencia (Calculada)</label>
              <InputNumber
                id="diferencia"
                value={formData.diferencia}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={true}
                style={{
                  backgroundColor: "#e9ecef",
                  color:
                    formData.diferencia && Math.abs(formData.diferencia) > 0.01
                      ? "red"
                      : "green",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaConciliacion">Fecha Conciliación</label>
              <Calendar
                id="fechaConciliacion"
                value={formData.fechaConciliacion}
                onChange={(e) => handleChange("fechaConciliacion", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly || loading || guardando}
                placeholder="Seleccione fecha"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="conciliado">Conciliado</label>
              <ToggleButton
                id="conciliado"
                checked={formData.conciliado}
                onChange={(e) => handleChange("conciliado", e.value)}
                onLabel="SÍ"
                offLabel="NO"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                disabled={readOnly || loading || guardando}
                className={
                  formData.conciliado ? "p-button-success" : "p-button-warning"
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
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
            type="button"
            onClick={onCancel}
            disabled={loading || guardando}
            className="p-button-warning"
            severity="warning"
            raised
            size="small"
            outlined
          />
          <Button
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            type="submit"
            loading={loading || guardando}
            disabled={readOnly || loading || guardando}
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
          />
        </div>
      </form>
    </>
  );
}
