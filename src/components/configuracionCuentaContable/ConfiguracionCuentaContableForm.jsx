// src/components/configuracionCuentaContable/ConfiguracionCuentaContableForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import {
  crearConfiguracionCuentaContable,
  actualizarConfiguracionCuentaContable,
} from "../../api/configuracionCuentaContable";

export default function ConfiguracionCuentaContableForm({
  isEdit = false,
  defaultValues = {},
  empresas = [],
  tiposMovimiento = [],
  tiposReferencia = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId || null,
    tipoMovimientoId: defaultValues?.tipoMovimientoId || null,
    tipoReferenciaId: defaultValues?.tipoReferenciaId || null,
    cuentaContableDebe: defaultValues?.cuentaContableDebe || "",
    cuentaContableHaber: defaultValues?.cuentaContableHaber || "",
    descripcionPlantilla: defaultValues?.descripcionPlantilla || "",
    activo: defaultValues?.activo !== undefined ? !!defaultValues.activo : true,
  });

  useEffect(() => {
    setFormData({
      empresaId: defaultValues?.empresaId
        ? Number(defaultValues.empresaId)
        : null,
      tipoMovimientoId: defaultValues?.tipoMovimientoId
        ? Number(defaultValues.tipoMovimientoId)
        : null,
      tipoReferenciaId: defaultValues?.tipoReferenciaId
        ? Number(defaultValues.tipoReferenciaId)
        : null,
      cuentaContableDebe: (defaultValues?.cuentaContableDebe || "").toUpperCase(),
      cuentaContableHaber: (defaultValues?.cuentaContableHaber || "").toUpperCase(),
      descripcionPlantilla: defaultValues?.descripcionPlantilla || "",
      activo:
        defaultValues?.activo !== undefined ? !!defaultValues.activo : true,
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

    if (!formData.tipoMovimientoId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un tipo de movimiento",
        life: 3000,
      });
      return;
    }

    if (!formData.cuentaContableDebe) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar la cuenta contable DEBE",
        life: 3000,
      });
      return;
    }

    if (!formData.cuentaContableHaber) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar la cuenta contable HABER",
        life: 3000,
      });
      return;
    }

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      tipoMovimientoId: Number(formData.tipoMovimientoId),
      tipoReferenciaId: formData.tipoReferenciaId
        ? Number(formData.tipoReferenciaId)
        : null,
      cuentaContableDebe: formData.cuentaContableDebe.trim().toUpperCase(),
      cuentaContableHaber: formData.cuentaContableHaber.trim().toUpperCase(),
      descripcionPlantilla: formData.descripcionPlantilla.trim(),
      activo: formData.activo,
    };

    setGuardando(true);
    try {
      if (isEdit) {
        await actualizarConfiguracionCuentaContable(
          defaultValues.id,
          dataToSend
        );
      } else {
        await crearConfiguracionCuentaContable(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message ||
          "Error al guardar configuración",
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

  const tiposMovimientoOptions = tiposMovimiento.map((tipo) => ({
    label: tipo.nombre,
    value: Number(tipo.id),
  }));

  const tiposReferenciaOptions = tiposReferencia.map((tipo) => ({
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
            <label htmlFor="tipoMovimientoId" style={{ fontWeight: "bold" }}>
              Tipo de Movimiento <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="tipoMovimientoId"
              value={formData.tipoMovimientoId}
              options={tiposMovimientoOptions}
              onChange={(e) => handleChange("tipoMovimientoId", e.value)}
              placeholder="Seleccione tipo"
              required
              disabled={readOnly || loading || guardando}
              filter
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoReferenciaId">Tipo de Referencia</label>
            <Dropdown
              id="tipoReferenciaId"
              value={formData.tipoReferenciaId}
              options={tiposReferenciaOptions}
              onChange={(e) => handleChange("tipoReferenciaId", e.value)}
              placeholder="Seleccione tipo (opcional)"
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
            marginTop: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="cuentaContableDebe" style={{ fontWeight: "bold" }}>
              Cuenta Contable DEBE <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="cuentaContableDebe"
              value={formData.cuentaContableDebe}
              onChange={(e) =>
                handleChange("cuentaContableDebe", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
              maxLength={20}
              placeholder="Ej: 10411001"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="cuentaContableHaber" style={{ fontWeight: "bold" }}>
              Cuenta Contable HABER <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="cuentaContableHaber"
              value={formData.cuentaContableHaber}
              onChange={(e) =>
                handleChange("cuentaContableHaber", e.target.value.toUpperCase())
              }
              required
              disabled={readOnly || loading || guardando}
              maxLength={20}
              placeholder="Ej: 42111001"
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label htmlFor="activo">Estado</label>
            <ToggleButton
              id="activo"
              checked={formData.activo}
              onChange={(e) => handleChange("activo", e.value)}
              onLabel="ACTIVO"
              offLabel="INACTIVO"
              onIcon="pi pi-check"
              offIcon="pi pi-times"
              disabled={readOnly || loading || guardando}
              className={formData.activo ? "p-button-success" : "p-button-danger"}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label htmlFor="descripcionPlantilla">
            Plantilla de Descripción (Opcional)
          </label>
          <InputTextarea
            id="descripcionPlantilla"
            value={formData.descripcionPlantilla}
            onChange={(e) => handleChange("descripcionPlantilla", e.target.value)}
            disabled={readOnly || loading || guardando}
            rows={3}
            maxLength={200}
            placeholder="Ej: Movimiento de {tipo} - {concepto}"
          />
          <small style={{ color: "#666" }}>
            Puede usar variables como {"{tipo}"}, {"{concepto}"}, {"{monto}"}, etc.
          </small>
        </div>

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