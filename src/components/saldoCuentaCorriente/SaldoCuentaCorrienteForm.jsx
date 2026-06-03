// src/components/saldoCuentaCorriente/SaldoCuentaCorrienteForm.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import { TabView, TabPanel } from "primereact/tabview";
import {
  crearSaldoCuentaCorriente,
  actualizarSaldoCuentaCorriente,
} from "../../api/saldoCuentaCorriente";
import CardAsientoContable from "../common/CardAsientoContable";

export default function SaldoCuentaCorrienteForm({
  isEdit = false,
  defaultValues = {},
  cuentasCorrientes = [],
  empresas = [],
  centrosCosto = [],
  onSubmit,
  onCancel,
  onGenerarAsiento,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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

  // ✅ NUEVO: Filtrar cuentas corrientes por empresa seleccionada
  const cuentasFiltradas = useMemo(() => {
    if (!formData.empresaId) {
      return cuentasCorrientes;
    }

    return cuentasCorrientes.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(formData.empresaId),
    );
  }, [cuentasCorrientes, formData.empresaId]);

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

  // ✅ NUEVO: Validar que la cuenta seleccionada pertenezca a la empresa
  useEffect(() => {
    if (formData.cuentaCorrienteId && formData.empresaId) {
      const cuentaValida = cuentasFiltradas.find(
        (c) => Number(c.id) === Number(formData.cuentaCorrienteId),
      );

      if (!cuentaValida) {
        setFormData((prev) => ({ ...prev, cuentaCorrienteId: null }));
      }
    }
  }, [formData.empresaId, formData.cuentaCorrienteId, cuentasFiltradas]);

  const handleChange = (field, value) => {
    // ✅ Si cambia la empresa, resetear la cuenta corriente
    if (field === "empresaId") {
      setFormData((prev) => ({
        ...prev,
        empresaId: value,
        cuentaCorrienteId: null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
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

  // ✅ ACTUALIZADO: Usar cuentasFiltradas en lugar de cuentasCorrientes
  const cuentasOptions = cuentasFiltradas.map((cuenta) => ({
    label: `${cuenta.tipoCuentaCorriente?.nombre || "Sin tipo"} - ${cuenta.banco?.nombre || "Sin banco"} - ${cuenta.moneda?.codigoSunat || ""} - ${cuenta.numeroCuenta || ""}`,
    value: Number(cuenta.id),
  }));

  // ✅ ACTUALIZADO: Template profesional para el dropdown de cuentas
  const cuentaItemTemplate = (option) => {
    if (!option) return null;

    // ✅ Buscar en cuentasFiltradas en lugar de cuentasCorrientes
    const cuenta = cuentasFiltradas.find((c) => Number(c.id) === option.value);
    if (!cuenta) return option.label;

    const tipoCuenta = cuenta.tipoCuentaCorriente?.nombre || "Sin tipo";
    const banco = cuenta.banco?.nombre || "Sin banco";
    const moneda = cuenta.moneda?.codigoSunat || "";
    const numero = cuenta.numeroCuenta || "";

    // Determinar color de moneda
    const estiloMoneda =
      moneda === "USD"
        ? { bg: "#d1e7dd", color: "#0f5132", border: "#badbcc" }
        : moneda === "PEN"
          ? { bg: "#fff3cd", color: "#664d03", border: "#ffecb5" }
          : { bg: "#e2e3e5", color: "#41464b", border: "#d3d6d8" };

    return (
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "4px 0",
        }}
      >
        {/* TAG 1: TIPO DE CUENTA */}
        <span
          style={{
            backgroundColor: "#e0cffc",
            color: "#59359a",
            border: "1px solid #d4bbf7",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            minWidth: "100px",
          }}
        >
          <i className="pi pi-credit-card" style={{ fontSize: "0.75rem" }} />
          {tipoCuenta}
        </span>

        {/* TAG 2: BANCO */}
        <span
          style={{
            backgroundColor: "#cfe2ff",
            color: "#084298",
            border: "1px solid #b6d4fe",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            minWidth: "100px",
          }}
        >
          <i className="pi pi-building" style={{ fontSize: "0.75rem" }} />
          {banco}
        </span>

        {/* TAG 3: MONEDA */}
        <span
          style={{
            backgroundColor: estiloMoneda.bg,
            color: estiloMoneda.color,
            border: `1px solid ${estiloMoneda.border}`,
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "600",
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {moneda}
        </span>

        {/* TAG 4: NÚMERO */}
        <span
          style={{
            backgroundColor: "#e2e3e5",
            color: "#41464b",
            border: "1px solid #d3d6d8",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="pi pi-hashtag" style={{ fontSize: "0.75rem" }} />
          {numero}
        </span>
      </div>
    );
  };

  const centrosOptions = centrosCosto.map((cc) => ({
    label: cc.Nombre || cc.nombre,
    value: Number(cc.id),
  }));

  return (
    <>
      <Toast ref={toast} />
      <div className="p-fluid">
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          {/* TAB 1: DATOS GENERALES */}
          <TabPanel header="Datos Generales" leftIcon="pi pi-file">
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
                  <label
                    htmlFor="cuentaCorrienteId"
                    style={{ fontWeight: "bold" }}
                  >
                    Cuenta Corriente <span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    id="cuentaCorrienteId"
                    value={formData.cuentaCorrienteId}
                    options={cuentasOptions}
                    onChange={(e) => handleChange("cuentaCorrienteId", e.value)}
                    itemTemplate={cuentaItemTemplate}
                    valueTemplate={cuentaItemTemplate} // ✅ AGREGAR ESTA LÍNEA
                    placeholder="Seleccione cuenta"
                    required
                    disabled={readOnly || loading || guardando}
                    filter
                    filterBy="label"
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
                    onValueChange={(e) =>
                      handleChange("saldoAnterior", e.value)
                    }
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
                    alignItems: "end",
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label htmlFor="saldoContable">Saldo Contable</label>
                    <InputNumber
                      id="saldoContable"
                      value={formData.saldoContable}
                      onValueChange={(e) =>
                        handleChange("saldoContable", e.value)
                      }
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
                          formData.diferencia &&
                          Math.abs(formData.diferencia) > 0.01
                            ? "red"
                            : "green",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="fechaConciliacion">
                      Fecha Conciliación
                    </label>
                    <Calendar
                      id="fechaConciliacion"
                      value={formData.fechaConciliacion}
                      onChange={(e) =>
                        handleChange("fechaConciliacion", e.value)
                      }
                      dateFormat="dd/mm/yy"
                      showIcon
                      disabled={readOnly || loading || guardando}
                      placeholder="Seleccione fecha"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <ToggleButton
                      id="conciliado"
                      checked={formData.conciliado}
                      onChange={(e) => handleChange("conciliado", e.value)}
                      onLabel="CONCILIADO"
                      offLabel="CONCILIADO"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      disabled={readOnly || loading || guardando}
                      className={
                        formData.conciliado
                          ? "p-button-success"
                          : "p-button-danger"
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
            </form>
          </TabPanel>

          {/* TAB 2: ASIENTO CONTABLE */}
          {isEdit && (
            <TabPanel header="Asientos Contables" leftIcon="pi pi-book">
              <CardAsientoContable
                asientosContables={defaultValues?.asientosContables || []}
                saldoCuentaCorrienteId={defaultValues?.id}
                onGenerarAsiento={() => onGenerarAsiento(defaultValues)}
                disabled={loading || guardando}
                loading={loading || guardando}
              />
            </TabPanel>
          )}
        </TabView>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid #dee2e6",
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
          />
          <Button
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            type="button"
            onClick={(e) => {
              const form = document.querySelector("form");
              if (form) {
                form.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true }),
                );
              }
            }}
            loading={loading || guardando}
            disabled={readOnly || loading || guardando}
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </div>
    </>
  );
}
