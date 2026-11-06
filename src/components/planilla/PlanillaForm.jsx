// src/components/planilla/PlanillaForm.jsx
// Datos para generar una planilla: empresa, periodo y periodicidad. Al guardar se calculan las boletas.
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import EmpresaSelector from "../common/EmpresaSelector";

// Valor del combo para la planilla por temporada o faena (sin periodicidad fija)
const TEMPORADA = "temporada";

const PERIODICIDADES = [
  { label: "Semanal (7 días)", value: 7 },
  { label: "Quincenal (15 días)", value: 15 },
  { label: "Mensual (30 días)", value: 30 },
  { label: "Por temporada o faena", value: TEMPORADA },
];

export default function PlanillaForm({ empresaFija, onSave, onCancel, loading = false }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      empresaId: empresaFija ? Number(empresaFija) : null,
      descripcion: "",
      periodicidad: 30,
      fechaInicio: null,
      fechaFin: null,
      fechaPago: null,
    },
    mode: "onTouched",
  });

  const onSubmit = (data) => {
    onSave({
      empresaId: Number(data.empresaId),
      descripcion: data.descripcion.trim(),
      periodicidadDias: data.periodicidad === TEMPORADA ? null : Number(data.periodicidad),
      // Fechas persistidas: ISO de la medianoche local (nunca texto YYYY-MM-DD)
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
      fechaPago: data.fechaPago ? data.fechaPago.toISOString() : null,
    });
  };

  const fila = { display: "flex", gap: 10, marginTop: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Empresa *</label>
          <Controller
            name="empresaId"
            control={control}
            rules={{ required: "Seleccione la empresa de la planilla" }}
            render={({ field }) => (
              <EmpresaSelector empresaId={field.value ? Number(field.value) : null} onEmpresaChange={(id) => field.onChange(id)} disabled={loading} />
            )}
          />
          <small className="p-error">{errors.empresaId?.message}</small>
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 2 }}>
          <label>Descripción *</label>
          <Controller
            name="descripcion"
            control={control}
            rules={{ required: "La descripción es obligatoria", maxLength: { value: 150, message: "Máximo 150 caracteres" } }}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value || ""}
                maxLength={150}
                placeholder='Ej: "Semana 44 - noviembre 2026" o "Faena 12"'
                className={classNames({ "p-invalid": errors.descripcion })}
                style={{ fontWeight: "bold" }}
                disabled={loading}
              />
            )}
          />
          <small className="p-error">{errors.descripcion?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Periodicidad de pago *</label>
          <Controller
            name="periodicidad"
            control={control}
            render={({ field }) => (
              <Dropdown value={field.value} options={PERIODICIDADES} onChange={(e) => field.onChange(e.value)} disabled={loading} />
            )}
          />
          <small style={{ color: "#666" }}>Se incluyen los contratos con esta misma periodicidad.</small>
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Inicio del periodo *</label>
          <Controller
            name="fechaInicio"
            control={control}
            rules={{ required: "La fecha de inicio es obligatoria" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": errors.fechaInicio })}
                disabled={loading}
              />
            )}
          />
          <small className="p-error">{errors.fechaInicio?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Fin del periodo *</label>
          <Controller
            name="fechaFin"
            control={control}
            rules={{ required: "La fecha de fin es obligatoria" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": errors.fechaFin })}
                disabled={loading}
              />
            )}
          />
          <small className="p-error">{errors.fechaFin?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Fecha de pago</label>
          <Controller
            name="fechaPago"
            control={control}
            render={({ field }) => (
              <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon showButtonBar disabled={loading} />
            )}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button type="button" label="Cancelar" icon="pi pi-times" onClick={onCancel} disabled={loading} className="p-button-warning" severity="warning" raised size="small" />
        <Button type="submit" label="Generar planilla" icon="pi pi-cog" loading={loading} disabled={loading} className="p-button-success" severity="success" raised size="small" />
      </div>
    </form>
  );
}
