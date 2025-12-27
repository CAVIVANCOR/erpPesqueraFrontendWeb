// src/components/contabilidad/PeriodoContableForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";
import {
  createPeriodoContable,
  updatePeriodoContable,
} from "../../api/contabilidad/periodoContable";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { MESES } from "../../utils/utils";

export default function PeriodoContableForm({
  isEdit = false,
  defaultValues = {},
  empresas = [],
  estados = [],
  empresaFija,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const { usuario } = useAuthStore();

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
      ? Number(empresaFija)
      : "",
    anio: defaultValues?.anio || new Date().getFullYear(),
    mes: defaultValues?.mes || new Date().getMonth() + 1,
    nombrePeriodo: defaultValues?.nombrePeriodo || "",
    fechaInicio: defaultValues?.fechaInicio
      ? new Date(defaultValues.fechaInicio)
      : null,
    fechaFin: defaultValues?.fechaFin ? new Date(defaultValues.fechaFin) : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : "",
  });

  useEffect(() => {
    if (formData.anio && formData.mes) {
      generarNombrePeriodo();
      generarFechas();
    }
  }, [formData.anio, formData.mes]);

  const generarNombrePeriodo = () => {
    const mesNombre =
      MESES.find((m) => m.value === Number(formData.mes))?.label || "";
    const nombreGenerado = `${mesNombre} ${formData.anio}`;
    setFormData((prev) => ({ ...prev, nombrePeriodo: nombreGenerado }));
  };

  const generarFechas = () => {
    const anio = Number(formData.anio);
    const mes = Number(formData.mes);

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    setFormData((prev) => ({
      ...prev,
      fechaInicio,
      fechaFin,
    }));
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const estadoAbierto = estados.find((e) => e.descripcion === "ABIERTO");

  useEffect(() => {
    if (!isEdit && estadoAbierto) {
      setFormData((prev) => ({ ...prev, estadoId: Number(estadoAbierto.id) }));
    }
  }, [estadoAbierto, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      empresaId: formData.empresaId ? Number(formData.empresaId) : null,
      anio: Number(formData.anio),
      mes: Number(formData.mes),
      nombrePeriodo: formData.nombrePeriodo,
      fechaInicio: formData.fechaInicio?.toISOString(),
      fechaFin: formData.fechaFin?.toISOString(),
      estadoId: formData.estadoId ? Number(formData.estadoId) : null,
    };

    if (isEdit && defaultValues) {
      await updatePeriodoContable(defaultValues.id, dataToSend);
    } else {
      await createPeriodoContable(dataToSend);
    }

    await onSubmit(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
          Empresa <span style={{ color: "red" }}>*</span>
        </label>
        <Dropdown
          id="empresaId"
          value={formData.empresaId}
          options={empresas.map((e) => ({
            label: e.razonSocial,
            value: Number(e.id),
          }))}
          onChange={(e) => handleChange("empresaId", e.value)}
          placeholder="Seleccionar empresa"
          disabled={readOnly || !!empresaFija}
          required
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="anio" style={{ fontWeight: "bold" }}>
            Año <span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="anio"
            type="number"
            value={formData.anio}
            onChange={(e) => handleChange("anio", e.target.value)}
            disabled={readOnly}
            required
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="mes" style={{ fontWeight: "bold" }}>
            Mes <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            id="mes"
            value={formData.mes}
            options={MESES}
            onChange={(e) => handleChange("mes", e.value)}
            placeholder="Seleccionar mes"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      <div className="p-field">
        <label htmlFor="nombrePeriodo" style={{ fontWeight: "bold" }}>
          Nombre del Período <span style={{ color: "red" }}>*</span>
        </label>
        <InputText
          id="nombrePeriodo"
          value={formData.nombrePeriodo}
          onChange={(e) => handleChange("nombrePeriodo", e.target.value)}
          disabled={readOnly}
          required
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
            Fecha de Inicio <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaInicio"
            value={formData.fechaInicio}
            onChange={(e) => handleChange("fechaInicio", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={readOnly}
            required
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
            Fecha de Fin <span style={{ color: "red" }}>*</span>
          </label>
          <Calendar
            id="fechaFin"
            value={formData.fechaFin}
            onChange={(e) => handleChange("fechaFin", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={readOnly}
            required
          />
        </div>
      </div>

      <div className="p-field">
        <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>
          Estado <span style={{ color: "red" }}>*</span>
        </label>
        <Dropdown
          id="estadoId"
          value={formData.estadoId}
          options={estados.map((e) => ({
            label: e.descripcion,
            value: Number(e.id),
          }))}
          onChange={(e) => handleChange("estadoId", e.value)}
          placeholder="Seleccionar estado"
          disabled={readOnly || isEdit}
          required
        />
      </div>

      {isEdit && defaultValues && (
        <>
          <Divider />
          <h4>Información de Cierre/Reapertura/Bloqueo</h4>

          {defaultValues.fechaCierre && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Fecha de Cierre:</label>
              <p>{new Date(defaultValues.fechaCierre).toLocaleString("es-PE")}</p>
            </div>
          )}

          {defaultValues.personalCierre && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Cerrado por:</label>
              <p>{defaultValues.personalCierre.nombreCompleto || "-"}</p>
            </div>
          )}

          {defaultValues.fechaReapertura && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Fecha de Reapertura:</label>
              <p>
                {new Date(defaultValues.fechaReapertura).toLocaleString("es-PE")}
              </p>
            </div>
          )}

          {defaultValues.personalReapertura && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Reabierto por:</label>
              <p>{defaultValues.personalReapertura.nombreCompleto || "-"}</p>
            </div>
          )}

          {defaultValues.motivoReapertura && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Motivo de Reapertura:</label>
              <p>{defaultValues.motivoReapertura}</p>
            </div>
          )}

          {defaultValues.fechaBloqueo && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Fecha de Bloqueo:</label>
              <p>{new Date(defaultValues.fechaBloqueo).toLocaleString("es-PE")}</p>
            </div>
          )}

          {defaultValues.personalBloqueo && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Bloqueado por:</label>
              <p>{defaultValues.personalBloqueo.nombreCompleto || "-"}</p>
            </div>
          )}

          {defaultValues.motivoBloqueo && (
            <div className="p-field">
              <label style={{ fontWeight: "bold" }}>Motivo de Bloqueo:</label>
              <p>{defaultValues.motivoBloqueo}</p>
            </div>
          )}
        </>
      )}

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