// src/components/contabilidad/PlanCuentasContableForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import {
  createPlanCuentasContable,
  updatePlanCuentasContable,
} from "../../api/contabilidad/planCuentasContable";
import { getEnumsContabilidad } from "../../api/contabilidad/enumsContabilidad";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function PlanCuentasContableForm({
  isEdit = false,
  defaultValues = {},
  cuentas = [],
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const { usuario } = useAuthStore();

  const [formData, setFormData] = useState({
    codigoCuenta: defaultValues?.codigoCuenta || "",
    nombreCuenta: defaultValues?.nombreCuenta || "",
    descripcion: defaultValues?.descripcion || "",
    nivel: defaultValues?.nivel || "CLASE",
    cuentaPadreId: defaultValues?.cuentaPadreId
      ? Number(defaultValues.cuentaPadreId)
      : null,
    naturaleza: defaultValues?.naturaleza || "DEUDORA",
    esImputable: defaultValues?.esImputable || false,
    requiereCentroCosto: defaultValues?.requiereCentroCosto || false,
    requiereEntidad: defaultValues?.requiereEntidad || false,
    requiereProyecto: defaultValues?.requiereProyecto || false,
    tipoCuenta: defaultValues?.tipoCuenta || null,
    esActivoCorriente: defaultValues?.esActivoCorriente || false,
    esActivoNoCorriente: defaultValues?.esActivoNoCorriente || false,
    esPasivoCorriente: defaultValues?.esPasivoCorriente || false,
    esPasivoNoCorriente: defaultValues?.esPasivoNoCorriente || false,
    activo: defaultValues?.activo !== undefined ? defaultValues.activo : true,
  });

  const [enums, setEnums] = useState({
    nivelesCuenta: [],
    naturalezasCuenta: [],
    tiposCuenta: [],
  });

  const [cargandoEnums, setCargandoEnums] = useState(true);

  useEffect(() => {
    cargarEnums();
  }, []);

  const cargarEnums = async () => {
    try {
      const data = await getEnumsContabilidad();
      setEnums(data);
    } catch (error) {
      console.error("Error al cargar enums:", error);
    } finally {
      setCargandoEnums(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        codigoCuenta: defaultValues?.codigoCuenta || "",
        nombreCuenta: defaultValues?.nombreCuenta || "",
        descripcion: defaultValues?.descripcion || "",
        nivel: defaultValues?.nivel || "CLASE",
        cuentaPadreId: defaultValues?.cuentaPadreId
          ? Number(defaultValues.cuentaPadreId)
          : null,
        naturaleza: defaultValues?.naturaleza || "DEUDORA",
        esImputable: defaultValues?.esImputable || false,
        requiereCentroCosto: defaultValues?.requiereCentroCosto || false,
        requiereEntidad: defaultValues?.requiereEntidad || false,
        requiereProyecto: defaultValues?.requiereProyecto || false,
        tipoCuenta: defaultValues?.tipoCuenta || null,
        esActivoCorriente: defaultValues?.esActivoCorriente || false,
        esActivoNoCorriente: defaultValues?.esActivoNoCorriente || false,
        esPasivoCorriente: defaultValues?.esPasivoCorriente || false,
        esPasivoNoCorriente: defaultValues?.esPasivoNoCorriente || false,
        activo:
          defaultValues?.activo !== undefined ? defaultValues.activo : true,
      });
    }
  }, [defaultValues]);

  const cuentasPadreFiltradas = cuentas.filter((c) => {
    if (isEdit && Number(c.id) === Number(defaultValues?.id)) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      codigoCuenta: formData.codigoCuenta.trim().toUpperCase(),
      nombreCuenta: formData.nombreCuenta.trim().toUpperCase(),
      descripcion: formData.descripcion?.trim() || null,
      nivel: formData.nivel,
      cuentaPadreId: formData.cuentaPadreId
        ? Number(formData.cuentaPadreId)
        : null,
      naturaleza: formData.naturaleza,
      esImputable: formData.esImputable,
      requiereCentroCosto: formData.requiereCentroCosto,
      requiereEntidad: formData.requiereEntidad,
      requiereProyecto: formData.requiereProyecto,
      tipoCuenta: formData.tipoCuenta,
      esActivoCorriente: formData.esActivoCorriente,
      esActivoNoCorriente: formData.esActivoNoCorriente,
      esPasivoCorriente: formData.esPasivoCorriente,
      esPasivoNoCorriente: formData.esPasivoNoCorriente,
      activo: formData.activo,
    };

    if (isEdit && defaultValues) {
      await updatePlanCuentasContable(defaultValues.id, dataToSend);
    } else {
      await createPlanCuentasContable(dataToSend);
    }

    await onSubmit(dataToSend);
  };

  if (cargandoEnums) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="codigoCuenta" style={{ fontWeight: "bold" }}>
            Código de Cuenta *
          </label>
          <InputText
            id="codigoCuenta"
            value={formData.codigoCuenta}
            onChange={(e) =>
              handleChange("codigoCuenta", e.target.value.toUpperCase())
            }
            placeholder="Ej: 10, 101, 1011"
            disabled={readOnly}
            required
            maxLength={20}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="nivel" style={{ fontWeight: "bold" }}>
            Nivel *
          </label>
          <Dropdown
            id="nivel"
            value={formData.nivel}
            options={enums.nivelesCuenta}
            onChange={(e) => handleChange("nivel", e.value)}
            placeholder="Seleccionar nivel"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="naturaleza" style={{ fontWeight: "bold" }}>
            Naturaleza *
          </label>
          <Dropdown
            id="naturaleza"
            value={formData.naturaleza}
            options={enums.naturalezasCuenta}
            onChange={(e) => handleChange("naturaleza", e.value)}
            placeholder="Seleccionar naturaleza"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoCuenta" style={{ fontWeight: "bold" }}>
            Tipo de Cuenta
          </label>
          <Dropdown
            id="tipoCuenta"
            value={formData.tipoCuenta}
            options={enums.tiposCuenta}
            onChange={(e) => handleChange("tipoCuenta", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            showClear
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label={formData.activo ? "ACTIVA" : "INACTIVA"}
            icon={
              formData.activo ? "pi pi-check-circle" : "pi pi-times-circle"
            }
            className={
              formData.activo ? "p-button-success" : "p-button-danger"
            }
            onClick={() => handleChange("activo", !formData.activo)}
            type="button"
            disabled={readOnly}
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
          <label htmlFor="nombreCuenta" style={{ fontWeight: "bold" }}>
            Nombre de Cuenta *
          </label>
          <InputText
            id="nombreCuenta"
            value={formData.nombreCuenta}
            onChange={(e) =>
              handleChange("nombreCuenta", e.target.value.toUpperCase())
            }
            placeholder="Nombre de la cuenta"
            disabled={readOnly}
            required
            maxLength={200}
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
          <label htmlFor="descripcion" style={{ fontWeight: "bold" }}>
            Descripción
          </label>
          <InputTextarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) =>
              handleChange("descripcion", e.target.value.toUpperCase())
            }
            placeholder="Descripción opcional de la cuenta"
            disabled={readOnly}
            rows={3}
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
          <label htmlFor="cuentaPadreId" style={{ fontWeight: "bold" }}>
            Cuenta Padre
          </label>
          <Dropdown
            id="cuentaPadreId"
            value={formData.cuentaPadreId}
            options={cuentasPadreFiltradas.map((c) => ({
              label: `${c.codigoCuenta} - ${c.nombreCuenta}`,
              value: Number(c.id),
            }))}
            onChange={(e) => handleChange("cuentaPadreId", e.value)}
            placeholder="Sin cuenta padre (Raíz)"
            disabled={readOnly}
            showClear
            filter
            filterBy="label"
          />
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label
          style={{
            fontWeight: "bold",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          Control de Uso
        </label>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <Button
            label="IMPUTABLE"
            icon={formData.esImputable ? "pi pi-check" : "pi pi-times"}
            className={
              formData.esImputable ? "p-button-success" : "p-button-secondary"
            }
            onClick={() => handleChange("esImputable", !formData.esImputable)}
            type="button"
            disabled={readOnly}
          />
          <Button
            label="REQUIERE CENTRO COSTO"
            icon={formData.requiereCentroCosto ? "pi pi-check" : "pi pi-times"}
            className={
              formData.requiereCentroCosto
                ? "p-button-info"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("requiereCentroCosto", !formData.requiereCentroCosto)
            }
            type="button"
            disabled={readOnly}
          />
          <Button
            label="REQUIERE ENTIDAD"
            icon={formData.requiereEntidad ? "pi pi-check" : "pi pi-times"}
            className={
              formData.requiereEntidad
                ? "p-button-warning"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("requiereEntidad", !formData.requiereEntidad)
            }
            type="button"
            disabled={readOnly}
          />
          <Button
            label="REQUIERE PROYECTO"
            icon={formData.requiereProyecto ? "pi pi-check" : "pi pi-times"}
            className={
              formData.requiereProyecto
                ? "p-button-help"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("requiereProyecto", !formData.requiereProyecto)
            }
            type="button"
            disabled={readOnly}
          />
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label
          style={{
            fontWeight: "bold",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          Clasificación
        </label>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <Button
            label="ACTIVO CORRIENTE"
            icon={formData.esActivoCorriente ? "pi pi-check" : "pi pi-times"}
            className={
              formData.esActivoCorriente
                ? "p-button-success"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("esActivoCorriente", !formData.esActivoCorriente)
            }
            type="button"
            disabled={readOnly}
          />
          <Button
            label="ACTIVO NO CORRIENTE"
            icon={formData.esActivoNoCorriente ? "pi pi-check" : "pi pi-times"}
            className={
              formData.esActivoNoCorriente
                ? "p-button-info"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("esActivoNoCorriente", !formData.esActivoNoCorriente)
            }
            type="button"
            disabled={readOnly}
          />
          <Button
            label="PASIVO CORRIENTE"
            icon={formData.esPasivoCorriente ? "pi pi-check" : "pi pi-times"}
            className={
              formData.esPasivoCorriente
                ? "p-button-warning"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("esPasivoCorriente", !formData.esPasivoCorriente)
            }
            type="button"
            disabled={readOnly}
          />
          <Button
            label="PASIVO NO CORRIENTE"
            icon={formData.esPasivoNoCorriente ? "pi pi-check" : "pi pi-times"}
            className={
              formData.esPasivoNoCorriente
                ? "p-button-help"
                : "p-button-secondary"
            }
            onClick={() =>
              handleChange("esPasivoNoCorriente", !formData.esPasivoNoCorriente)
            }
            type="button"
            disabled={readOnly}
          />
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
          label="Cancelar"
          icon="pi pi-times"
          type="button"
          onClick={onCancel}
          disabled={loading}
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
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
}