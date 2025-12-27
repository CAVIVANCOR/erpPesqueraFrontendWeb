// src/components/asientoContableInterfaz/AsientoContableInterfazForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import {
  crearAsientoContableInterfaz,
  actualizarAsientoContableInterfaz,
} from "../../api/asientoContableInterfaz";

export default function AsientoContableInterfazForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    movimientoCajaId: defaultValues?.movimientoCajaId || null,
    fechaContable: defaultValues?.fechaContable
      ? new Date(defaultValues.fechaContable)
      : new Date(),
    cuentaContable: defaultValues?.cuentaContable || "",
    descripcion: defaultValues?.descripcion || "",
    debe: defaultValues?.debe || 0,
    haber: defaultValues?.haber || 0,
    monedaId: defaultValues?.monedaId || null,
    empresaId: defaultValues?.empresaId || null,
    referenciaExtId: defaultValues?.referenciaExtId || "",
    tipoReferenciaId: defaultValues?.tipoReferenciaId || null,
    estado: defaultValues?.estado || "PENDIENTE",
    fechaEnvio: defaultValues?.fechaEnvio
      ? new Date(defaultValues.fechaEnvio)
      : null,
  });

  useEffect(() => {
    setFormData({
      movimientoCajaId: defaultValues?.movimientoCajaId
        ? Number(defaultValues.movimientoCajaId)
        : null,
      fechaContable: defaultValues?.fechaContable
        ? new Date(defaultValues.fechaContable)
        : new Date(),
      cuentaContable: (defaultValues?.cuentaContable || "").toUpperCase(),
      descripcion: defaultValues?.descripcion || "",
      debe: defaultValues?.debe || 0,
      haber: defaultValues?.haber || 0,
      monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
      empresaId: defaultValues?.empresaId
        ? Number(defaultValues.empresaId)
        : null,
      referenciaExtId: defaultValues?.referenciaExtId || "",
      tipoReferenciaId: defaultValues?.tipoReferenciaId
        ? Number(defaultValues.tipoReferenciaId)
        : null,
      estado: defaultValues?.estado || "PENDIENTE",
      fechaEnvio: defaultValues?.fechaEnvio
        ? new Date(defaultValues.fechaEnvio)
        : null,
    });
  }, [defaultValues]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fechaContable) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar la fecha contable",
        life: 3000,
      });
      return;
    }

    if (!formData.cuentaContable) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar la cuenta contable",
        life: 3000,
      });
      return;
    }

    if (formData.debe === 0 && formData.haber === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un monto en Debe o Haber",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      movimientoCajaId: formData.movimientoCajaId
        ? Number(formData.movimientoCajaId)
        : null,
      fechaContable: formData.fechaContable,
      cuentaContable: formData.cuentaContable.trim().toUpperCase(),
      descripcion: formData.descripcion.trim(),
      debe: Number(formData.debe),
      haber: Number(formData.haber),
      monedaId: formData.monedaId ? Number(formData.monedaId) : null,
      empresaId: formData.empresaId ? Number(formData.empresaId) : null,
      referenciaExtId: formData.referenciaExtId.trim(),
      tipoReferenciaId: formData.tipoReferenciaId
        ? Number(formData.tipoReferenciaId)
        : null,
      estado: formData.estado,
      fechaEnvio: formData.fechaEnvio,
    };

    setGuardando(true);
    try {
      if (isEdit) {
        await actualizarAsientoContableInterfaz(defaultValues.id, dataToSend);
      } else {
        await crearAsientoContableInterfaz(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message || "Error al guardar asiento",
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const estadoOptions = [
    { label: "PENDIENTE", value: "PENDIENTE" },
    { label: "ENVIADO", value: "ENVIADO" },
    { label: "ERROR", value: "ERROR" },
  ];

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
            <label htmlFor="movimientoCajaId">Movimiento Caja</label>
            <InputNumber
              id="movimientoCajaId"
              value={formData.movimientoCajaId}
              onValueChange={(e) => handleChange("movimientoCajaId", e.value)}
              disabled={readOnly || loading || guardando}
              useGrouping={false}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaContable" style={{ fontWeight: "bold" }}>
              Fecha Contable <span style={{ color: "red" }}>*</span>
            </label>
            <Calendar
              id="fechaContable"
              value={formData.fechaContable}
              onChange={(e) => handleChange("fechaContable", e.value)}
              showIcon
              dateFormat="dd/mm/yy"
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
            <label htmlFor="cuentaContable" style={{ fontWeight: "bold" }}>
              Cuenta Contable <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="cuentaContable"
              value={formData.cuentaContable}
              onChange={(e) =>
                handleChange("cuentaContable", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
              maxLength={20}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="descripcion">Descripción</label>
            <InputText
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              disabled={readOnly || loading || guardando}
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
            <label htmlFor="debe" style={{ fontWeight: "bold" }}>
              Debe <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="debe"
              value={formData.debe}
              onValueChange={(e) => handleChange("debe", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="haber" style={{ fontWeight: "bold" }}>
              Haber <span style={{ color: "red" }}>*</span>
            </label>
            <InputNumber
              id="haber"
              value={formData.haber}
              onValueChange={(e) => handleChange("haber", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              disabled={readOnly || loading || guardando}
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
            <label htmlFor="monedaId">Moneda ID</label>
            <InputNumber
              id="monedaId"
              value={formData.monedaId}
              onValueChange={(e) => handleChange("monedaId", e.value)}
              disabled={readOnly || loading || guardando}
              useGrouping={false}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId">Empresa ID</label>
            <InputNumber
              id="empresaId"
              value={formData.empresaId}
              onValueChange={(e) => handleChange("empresaId", e.value)}
              disabled={readOnly || loading || guardando}
              useGrouping={false}
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
            <label htmlFor="referenciaExtId">Referencia Externa</label>
            <InputText
              id="referenciaExtId"
              value={formData.referenciaExtId}
              onChange={(e) => handleChange("referenciaExtId", e.target.value)}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoReferenciaId">Tipo Referencia ID</label>
            <InputNumber
              id="tipoReferenciaId"
              value={formData.tipoReferenciaId}
              onValueChange={(e) => handleChange("tipoReferenciaId", e.value)}
              disabled={readOnly || loading || guardando}
              useGrouping={false}
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
            <label htmlFor="estado" style={{ fontWeight: "bold" }}>
              Estado <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="estado"
              value={formData.estado}
              options={estadoOptions}
              onChange={(e) => handleChange("estado", e.value)}
              disabled={readOnly || loading || guardando}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaEnvio">Fecha Envío</label>
            <Calendar
              id="fechaEnvio"
              value={formData.fechaEnvio}
              onChange={(e) => handleChange("fechaEnvio", e.value)}
              showIcon
              showTime
              dateFormat="dd/mm/yy"
              disabled={readOnly || loading || guardando}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            severity="secondary"
            size="small"
            raised
            outlined
            onClick={onCancel}
            type="button"
            disabled={loading || guardando}
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