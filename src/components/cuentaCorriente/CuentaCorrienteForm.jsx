// src/components/cuentaCorriente/CuentaCorrienteForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import {
  crearCuentaCorriente,
  actualizarCuentaCorriente,
} from "../../api/cuentaCorriente";

export default function CuentaCorrienteForm({
  isEdit = false,
  defaultValues = {},
  empresas = [],
  bancos = [],
  tiposCuentaCorriente = [],
  monedas = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId || null,
    bancoId: defaultValues?.bancoId || null,
    numeroCuenta: defaultValues?.numeroCuenta || "",
    tipoCuentaCorrienteId: defaultValues?.tipoCuentaCorrienteId || null,
    monedaId: defaultValues?.monedaId || null,
    descripcion: defaultValues?.descripcion || "",
    activa: defaultValues?.activa !== undefined ? !!defaultValues.activa : true,
    codigoSwift: defaultValues?.codigoSwift || "",
    numeroCuentaCCI: defaultValues?.numeroCuentaCCI || "",
    saldoMinimo: defaultValues?.saldoMinimo || null,
    fechaApertura: defaultValues?.fechaApertura
      ? new Date(defaultValues.fechaApertura)
      : null,
    fechaCierre: defaultValues?.fechaCierre
      ? new Date(defaultValues.fechaCierre)
      : null,
  });

  useEffect(() => {
    setFormData({
      empresaId: defaultValues?.empresaId
        ? Number(defaultValues.empresaId)
        : null,
      bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
      numeroCuenta: (defaultValues?.numeroCuenta || "").toUpperCase(),
      tipoCuentaCorrienteId: defaultValues?.tipoCuentaCorrienteId
        ? Number(defaultValues.tipoCuentaCorrienteId)
        : null,
      monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
      descripcion: (defaultValues?.descripcion || "").toUpperCase(),
      activa:
        defaultValues?.activa !== undefined ? !!defaultValues.activa : true,
      codigoSwift: (defaultValues?.codigoSwift || "").toUpperCase(),
      numeroCuentaCCI: (defaultValues?.numeroCuentaCCI || "").toUpperCase(),
      saldoMinimo: defaultValues?.saldoMinimo || null,
      fechaApertura: defaultValues?.fechaApertura
        ? new Date(defaultValues.fechaApertura)
        : null,
      fechaCierre: defaultValues?.fechaCierre
        ? new Date(defaultValues.fechaCierre)
        : null,
    });
  }, [defaultValues]);

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

    if (!formData.bancoId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un banco",
        life: 3000,
      });
      return;
    }

    if (!formData.numeroCuenta) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un número de cuenta",
        life: 3000,
      });
      return;
    }

    if (!formData.tipoCuentaCorrienteId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un tipo de cuenta corriente",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      bancoId: Number(formData.bancoId),
      numeroCuenta: formData.numeroCuenta.trim().toUpperCase(),
      tipoCuentaCorrienteId: Number(formData.tipoCuentaCorrienteId),
      monedaId: formData.monedaId ? Number(formData.monedaId) : null,
      descripcion: formData.descripcion.trim().toUpperCase(),
      activa: formData.activa,
      codigoSwift: formData.codigoSwift.trim().toUpperCase(),
      numeroCuentaCCI: formData.numeroCuentaCCI.trim().toUpperCase(),
      saldoMinimo: formData.saldoMinimo || null,
      fechaApertura: formData.fechaApertura || null,
      fechaCierre: formData.fechaCierre || null,
    };

    setGuardando(true);
    try {
      if (isEdit) {
        await actualizarCuentaCorriente(defaultValues.id, dataToSend);
      } else {
        await crearCuentaCorriente(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message || "Error al guardar cuenta corriente",
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

  const bancosOptions = bancos.map((banco) => ({
    label: banco.nombre,
    value: Number(banco.id),
  }));

  const monedasOptions = monedas.map((moneda) => ({
    label: moneda.codigoSunat,
    value: Number(moneda.id),
  }));

  const tiposOptions = tiposCuentaCorriente.map((tipo) => ({
    label: tipo.nombre,
    value: Number(tipo.id),
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
            <label htmlFor="bancoId" style={{ fontWeight: "bold" }}>
              Banco <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="bancoId"
              value={formData.bancoId}
              options={bancosOptions}
              onChange={(e) => handleChange("bancoId", e.value)}
              placeholder="Seleccione banco"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
              Moneda <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              options={monedasOptions}
              onChange={(e) => handleChange("monedaId", e.value)}
              placeholder="Seleccione moneda"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
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
            <label htmlFor="numeroCuenta" style={{ fontWeight: "bold" }}>
              Número de Cuenta <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="numeroCuenta"
              value={formData.numeroCuenta}
              onChange={(e) =>
                handleChange("numeroCuenta", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroCuentaCCI">Número CCI</label>
            <InputText
              id="numeroCuentaCCI"
              value={formData.numeroCuentaCCI}
              onChange={(e) =>
                handleChange("numeroCuentaCCI", e.target.value.toUpperCase())
              }
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="codigoSwift">Código Swift</label>
            <InputText
              id="codigoSwift"
              value={formData.codigoSwift}
              onChange={(e) =>
                handleChange("codigoSwift", e.target.value.toUpperCase())
              }
              disabled={readOnly || loading || guardando}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="descripcion">Descripción</label>
            <InputText
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                handleChange("descripcion", e.target.value.toUpperCase())
              }
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="tipoCuentaCorrienteId"
              style={{ fontWeight: "bold" }}
            >
              Tipo de Cuenta Corriente <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="tipoCuentaCorrienteId"
              value={formData.tipoCuentaCorrienteId}
              options={tiposOptions}
              onChange={(e) => handleChange("tipoCuentaCorrienteId", e.value)}
              placeholder="Seleccione tipo de cuenta corriente"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <ToggleButton
              id="activa"
              checked={formData.activa}
              onChange={(e) => handleChange("activa", e.value)}
              onLabel="ACTIVO"
              offLabel="INACTIVO"
              onIcon="pi pi-check"
              offIcon="pi pi-times"
              disabled={readOnly || loading || guardando}
              className={
                formData.activa ? "p-button-success" : "p-button-danger"
              }
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
            <label htmlFor="saldoMinimo">Saldo Mínimo</label>
            <InputNumber
              id="saldoMinimo"
              value={formData.saldoMinimo}
              onValueChange={(e) => handleChange("saldoMinimo", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={readOnly || loading || guardando}
              placeholder="0.00"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaApertura">Fecha de Apertura</label>
            <Calendar
              id="fechaApertura"
              value={formData.fechaApertura}
              onChange={(e) => handleChange("fechaApertura", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={readOnly || loading || guardando}
              placeholder="Seleccione fecha"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaCierre">Fecha de Cierre</label>
            <Calendar
              id="fechaCierre"
              value={formData.fechaCierre}
              onChange={(e) => handleChange("fechaCierre", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={readOnly || loading || guardando}
              placeholder="Seleccione fecha"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems:"end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <div style={{ flex: 1 }}>
            {isEdit && defaultValues.creadoEn && (
              <div
                style={{
                  marginTop: 20,
                  padding: 10,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 4,
                  border: "1px solid #dee2e6",
                }}
              >
                <small style={{ color: "#666" }}>
                  <strong>Creado:</strong>{" "}
                  {new Date(defaultValues.creadoEn).toLocaleString("es-PE")}
                  {defaultValues.personalCreador &&
                    ` - ${defaultValues.personalCreador.nombres} ${defaultValues.personalCreador.apellidoPaterno}`}
                  {defaultValues.actualizadoEn && (
                    <>
                      {" | "}
                      <strong>Actualizado:</strong>{" "}
                      {new Date(defaultValues.actualizadoEn).toLocaleString(
                        "es-PE"
                      )}
                      {defaultValues.personalActualizador &&
                        ` - ${defaultValues.personalActualizador.nombres} ${defaultValues.personalActualizador.apellidoPaterno}`}
                    </>
                  )}
                </small>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
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
          </div>
          <div style={{ flex: 1 }}>
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
        </div>
      </form>
    </>
  );
}
