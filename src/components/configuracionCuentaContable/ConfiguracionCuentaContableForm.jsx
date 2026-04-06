// src/components/configuracionCuentaContable/ConfiguracionCuentaContableForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import {
  crearConfiguracionCuentaContable,
  actualizarConfiguracionCuentaContable,
} from "../../api/configuracionCuentaContable";
import { getPlanCuentasContableActivas } from "../../api/contabilidad/planCuentasContable";

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
  const [cuentasContables, setCuentasContables] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId || null,
    tipoMovimientoId: defaultValues?.tipoMovimientoId || null,
    tipoReferenciaId: defaultValues?.tipoReferenciaId || null,
    cuentaContableDebeId: defaultValues?.cuentaContableDebeId || null,
    cuentaContableHaberId: defaultValues?.cuentaContableHaberId || null,
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
      cuentaContableDebeId: defaultValues?.cuentaContableDebeId
        ? Number(defaultValues.cuentaContableDebeId)
        : null,
      cuentaContableHaberId: defaultValues?.cuentaContableHaberId
        ? Number(defaultValues.cuentaContableHaberId)
        : null,
      descripcionPlantilla: defaultValues?.descripcionPlantilla || "",
      activo:
        defaultValues?.activo !== undefined ? !!defaultValues.activo : true,
    });
  }, [defaultValues]);

  useEffect(() => {
    if (formData.empresaId) {
      cargarCuentasContables();
    } else {
      setCuentasContables([]);
    }
  }, [formData.empresaId]);

  const cargarCuentasContables = async () => {
    setCargandoCuentas(true);
    try {
      const cuentas = await getPlanCuentasContableActivas();
      const cuentasImputables = cuentas.filter(
        (cuenta) => cuenta.esImputable && cuenta.activo
      );
      setCuentasContables(cuentasImputables);
    } catch (error) {
      console.error("Error al cargar cuentas contables:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las cuentas contables",
        life: 3000,
      });
      setCuentasContables([]);
    } finally {
      setCargandoCuentas(false);
    }
  };

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

    if (!formData.cuentaContableDebeId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar la cuenta contable DEBE",
        life: 3000,
      });
      return;
    }

    if (!formData.cuentaContableHaberId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar la cuenta contable HABER",
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
      cuentaContableDebeId: Number(formData.cuentaContableDebeId),
      cuentaContableHaberId: Number(formData.cuentaContableHaberId),
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
    label: tipo.descripcion || tipo.codigo,
    value: Number(tipo.id),
  }));

  const cuentasDebeOptions = cuentasContables
    .filter((cuenta) => cuenta.naturaleza === "DEUDORA")
    .map((cuenta) => ({
      label: `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`,
      value: Number(cuenta.id),
    }));

  const cuentasHaberOptions = cuentasContables
    .filter((cuenta) => cuenta.naturaleza === "ACREEDORA")
    .map((cuenta) => ({
      label: `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`,
      value: Number(cuenta.id),
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
            <small style={{ color: "#666", fontSize: "0.85rem" }}>
              Ej: EFECTIVO, TRANSFERENCIA, CHEQUE, DEPÓSITO
            </small>
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
            <label htmlFor="cuentaContableDebeId" style={{ fontWeight: "bold" }}>
              Cuenta Contable DEBE <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="cuentaContableDebeId"
              value={formData.cuentaContableDebeId}
              options={cuentasDebeOptions}
              onChange={(e) => handleChange("cuentaContableDebeId", e.value)}
              placeholder={
                formData.empresaId
                  ? "Seleccione cuenta DEBE"
                  : "Primero seleccione empresa"
              }
              required
              disabled={
                !formData.empresaId ||
                readOnly ||
                loading ||
                guardando ||
                cargandoCuentas
              }
              filter
              showClear
              emptyMessage="No hay cuentas DEUDORAS disponibles"
              loading={cargandoCuentas}
            />
            <small style={{ color: "#666", fontSize: "0.85rem" }}>
              Solo cuentas de naturaleza DEUDORA
            </small>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="cuentaContableHaberId" style={{ fontWeight: "bold" }}>
              Cuenta Contable HABER <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="cuentaContableHaberId"
              value={formData.cuentaContableHaberId}
              options={cuentasHaberOptions}
              onChange={(e) => handleChange("cuentaContableHaberId", e.value)}
              placeholder={
                formData.empresaId
                  ? "Seleccione cuenta HABER"
                  : "Primero seleccione empresa"
              }
              required
              disabled={
                !formData.empresaId ||
                readOnly ||
                loading ||
                guardando ||
                cargandoCuentas
              }
              filter
              showClear
              emptyMessage="No hay cuentas ACREEDORAS disponibles"
              loading={cargandoCuentas}
            />
            <small style={{ color: "#666", fontSize: "0.85rem" }}>
              Solo cuentas de naturaleza ACREEDORA
            </small>
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
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