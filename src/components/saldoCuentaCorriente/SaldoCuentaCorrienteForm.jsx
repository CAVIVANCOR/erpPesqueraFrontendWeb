// src/components/saldoCuentaCorriente/SaldoCuentaCorrienteForm.jsx
// Formulario profesional para SaldoCuentaCorriente. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";

export default function SaldoCuentaCorrienteForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  cuentasCorrientes = [],
  empresas = [],
  movimientosCaja = [],
  centrosCosto = [],
}) {
  const [cuentaCorrienteId, setCuentaCorrienteId] = React.useState(
    defaultValues.cuentaCorrienteId || ""
  );
  const [empresaId, setEmpresaId] = React.useState(
    defaultValues.empresaId || ""
  );
  const [fecha, setFecha] = React.useState(
    defaultValues.fecha ? new Date(defaultValues.fecha) : new Date()
  );
  const [saldoAnterior, setSaldoAnterior] = React.useState(
    defaultValues.saldoAnterior || 0
  );
  const [ingresos, setIngresos] = React.useState(defaultValues.ingresos || 0);
  const [egresos, setEgresos] = React.useState(defaultValues.egresos || 0);
  const [saldoActual, setSaldoActual] = React.useState(
    defaultValues.saldoActual || 0
  );
  const [movimientoCajaId, setMovimientoCajaId] = React.useState(
    defaultValues.movimientoCajaId || null
  );
  const [saldoContable, setSaldoContable] = React.useState(
    defaultValues.saldoContable || null
  );
  const [diferencia, setDiferencia] = React.useState(
    defaultValues.diferencia || null
  );
  const [conciliado, setConciliado] = React.useState(
    defaultValues.conciliado || false
  );
  const [fechaConciliacion, setFechaConciliacion] = React.useState(
    defaultValues.fechaConciliacion
      ? new Date(defaultValues.fechaConciliacion)
      : null
  );
  const [centroCostoId, setCentroCostoId] = React.useState(
    defaultValues.centroCostoId || null
  );

  React.useEffect(() => {
    setCuentaCorrienteId(defaultValues.cuentaCorrienteId || "");
    setEmpresaId(defaultValues.empresaId || "");
    setFecha(
      defaultValues.fecha ? new Date(defaultValues.fecha) : new Date()
    );
    setSaldoAnterior(defaultValues.saldoAnterior || 0);
    setIngresos(defaultValues.ingresos || 0);
    setEgresos(defaultValues.egresos || 0);
    setSaldoActual(defaultValues.saldoActual || 0);
    setMovimientoCajaId(defaultValues.movimientoCajaId || null);
    setSaldoContable(defaultValues.saldoContable || null);
    setDiferencia(defaultValues.diferencia || null);
    setConciliado(defaultValues.conciliado || false);
    setFechaConciliacion(
      defaultValues.fechaConciliacion
        ? new Date(defaultValues.fechaConciliacion)
        : null
    );
    setCentroCostoId(defaultValues.centroCostoId || null);
  }, [defaultValues]);

  // Calcular saldo actual automáticamente
  React.useEffect(() => {
    const calculado = Number(saldoAnterior) + Number(ingresos) - Number(egresos);
    setSaldoActual(calculado);
  }, [saldoAnterior, ingresos, egresos]);

  // Calcular diferencia automáticamente si hay saldo contable
  React.useEffect(() => {
    if (saldoContable !== null && saldoContable !== undefined) {
      const dif = Number(saldoActual) - Number(saldoContable);
      setDiferencia(dif);
    } else {
      setDiferencia(null);
    }
  }, [saldoActual, saldoContable]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones básicas en frontend
    if (!empresaId || !cuentaCorrienteId) {
      return;
    }

    onSubmit({
      empresaId: Number(empresaId),
      cuentaCorrienteId: Number(cuentaCorrienteId),
      fecha: fecha || new Date(),
      saldoAnterior: Number(saldoAnterior),
      ingresos: Number(ingresos),
      egresos: Number(egresos),
      saldoActual: Number(saldoActual),
      movimientoCajaId: movimientoCajaId ? Number(movimientoCajaId) : null,
      saldoContable: saldoContable !== null ? Number(saldoContable) : null,
      diferencia: diferencia !== null ? Number(diferencia) : null,
      conciliado,
      fechaConciliacion: fechaConciliacion || null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa*</label>
          <Dropdown
            id="empresaId"
            value={empresaId}
            options={empresas.map((empresa) => ({
              label: empresa.razonSocial,
              value: empresa.id,
            }))}
            onChange={(e) => setEmpresaId(e.value)}
            placeholder="Seleccione empresa"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaCorrienteId">Cuenta Corriente*</label>
          <Dropdown
            id="cuentaCorrienteId"
            value={cuentaCorrienteId}
            options={cuentasCorrientes.map((cuenta) => ({
              label: `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`,
              value: cuenta.id,
            }))}
            onChange={(e) => setCuentaCorrienteId(e.value)}
            placeholder="Seleccione cuenta"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fecha">Fecha*</label>
          <Calendar
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoAnterior">Saldo Anterior*</label>
          <InputNumber
            id="saldoAnterior"
            value={saldoAnterior}
            onValueChange={(e) => setSaldoAnterior(e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="ingresos">Ingresos*</label>
          <InputNumber
            id="ingresos"
            value={ingresos}
            onValueChange={(e) => setIngresos(e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="egresos">Egresos*</label>
          <InputNumber
            id="egresos"
            value={egresos}
            onValueChange={(e) => setEgresos(e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="saldoActual">Saldo Actual (Calculado)</label>
          <InputNumber
            id="saldoActual"
            value={saldoActual}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={true}
            style={{ fontWeight: "bold", backgroundColor: "#e9ecef" }}
          />
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="centroCostoId">Centro de Costo</label>
          <Dropdown
            id="centroCostoId"
            value={centroCostoId}
            options={centrosCosto.map((cc) => ({
              label: cc.nombre,
              value: cc.id,
            }))}
            onChange={(e) => setCentroCostoId(e.value)}
            placeholder="Seleccione centro de costo"
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="movimientoCajaId">Movimiento de Caja</label>
          <Dropdown
            id="movimientoCajaId"
            value={movimientoCajaId}
            options={movimientosCaja.map((mov) => ({
              label: `${mov.id} - ${mov.concepto || "Sin concepto"}`,
              value: mov.id,
            }))}
            onChange={(e) => setMovimientoCajaId(e.value)}
            placeholder="Seleccione movimiento"
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
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
            alignItems: "center",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="saldoContable">Saldo Contable</label>
            <InputNumber
              id="saldoContable"
              value={saldoContable}
              onValueChange={(e) => setSaldoContable(e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={loading}
              placeholder="Ingrese saldo contable"
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="diferencia">Diferencia (Calculada)</label>
            <InputNumber
              id="diferencia"
              value={diferencia}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={true}
              style={{
                fontWeight: "bold",
                backgroundColor: "#e9ecef",
                color: diferencia && Math.abs(diferencia) > 0.01 ? "red" : "green",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaConciliacion">Fecha Conciliación</label>
            <Calendar
              id="fechaConciliacion"
              value={fechaConciliacion}
              onChange={(e) => setFechaConciliacion(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={loading}
              placeholder="Seleccione fecha"
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div
            style={{
              flex: 0.5,
              display: "flex",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Checkbox
              inputId="conciliado"
              checked={conciliado}
              onChange={(e) => setConciliado(e.checked)}
              disabled={loading}
            />
            <label
              htmlFor="conciliado"
              style={{ marginLeft: 8, fontWeight: "bold" }}
            >
              Conciliado
            </label>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
