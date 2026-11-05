// src/components/plantillaFormatoExterno/PlantillaFormatoExternoForm.jsx
// Formulario de plantilla de formato externo (PLAME, AFPnet). La definición se edita como JSON.
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import AuditoriaDialog from "../common/AuditoriaDialog";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VALORES_INICIALES = { codigo: "", descripcion: "", definicion: "{\n  \n}", vigenteDesde: null, vigenteHasta: null };

const aFecha = (valor) => (valor ? new Date(valor) : null);

// Valida que el texto sea JSON antes de enviarlo (el servidor también lo valida)
const validarJson = (texto) => {
  try {
    JSON.parse(texto);
    return true;
  } catch (error) {
    return `La definición no es un JSON válido: ${error.message}`;
  }
};

export default function PlantillaFormatoExternoForm({ plantilla, personalAuditoria = [], onSave, onCancel, loading = false, readOnly = false }) {
  const usuario = useAuthStore((state) => state.usuario);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onTouched" });

  useEffect(() => {
    if (!plantilla) {
      reset(VALORES_INICIALES);
      return;
    }
    reset({
      codigo: plantilla.codigo,
      descripcion: plantilla.descripcion,
      definicion: JSON.stringify(plantilla.definicion, null, 2),
      vigenteDesde: aFecha(plantilla.vigenteDesde),
      vigenteHasta: aFecha(plantilla.vigenteHasta),
    });
  }, [plantilla, reset]);

  const onSubmit = (data) => {
    onSave({
      codigo: data.codigo.trim().toUpperCase(),
      descripcion: data.descripcion.trim(),
      definicion: data.definicion,
      // Fechas persistidas: ISO de la medianoche local (nunca texto YYYY-MM-DD)
      vigenteDesde: data.vigenteDesde.toISOString(),
      vigenteHasta: data.vigenteHasta ? data.vigenteHasta.toISOString() : null,
    });
  };

  const bloqueado = readOnly || loading;
  const fila = { display: "flex", gap: 10, marginTop: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Código *</label>
          <Controller
            name="codigo"
            control={control}
            rules={{ required: "El código es obligatorio", pattern: { value: /^[A-Za-z0-9_]+$/, message: "Solo letras, números y guion bajo" } }}
            render={({ field }) => (
              <InputText
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                maxLength={40}
                placeholder="Ej: AFPNET_PLANILLA, PLAME_REM"
                className={classNames({ "p-invalid": errors.codigo })}
                style={{ fontWeight: "bold" }}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.codigo?.message}</small>
        </div>
        <div style={{ flex: 2 }}>
          <label>Descripción *</label>
          <Controller
            name="descripcion"
            control={control}
            rules={{ required: "La descripción es obligatoria" }}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value || ""}
                maxLength={150}
                placeholder="Qué archivo genera esta plantilla"
                className={classNames({ "p-invalid": errors.descripcion })}
                style={{ fontWeight: "bold" }}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.descripcion?.message}</small>
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Vigente desde *</label>
          <Controller
            name="vigenteDesde"
            control={control}
            rules={{ required: "La fecha de inicio es obligatoria" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": errors.vigenteDesde })}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.vigenteDesde?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Vigente hasta (vacío = sin fin)</label>
          <Controller
            name="vigenteHasta"
            control={control}
            render={({ field }) => (
              <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon showButtonBar disabled={readOnly || loading} />
            )}
          />
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Definición del formato (JSON: columnas, orden, largo, relleno, separador, equivalencias) *</label>
          <Controller
            name="definicion"
            control={control}
            rules={{ required: "La definición es obligatoria", validate: validarJson }}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value || ""}
                rows={18}
                className={classNames({ "p-invalid": errors.definicion })}
                style={{ fontFamily: "monospace", fontSize: "0.9em" }}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.definicion?.message}</small>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end", gap: 8, marginTop: 18 }}>
        {/* Auditoría (solo en edición) */}
        {plantilla && (
          <div style={{ flex: 1 }}>
            <AuditoriaDialog
              data={plantilla}
              fieldMapping={{
                fechaCreacion: "creadoEn",
                creadoPor: "creadoPor",
                fechaActualizacion: "actualizadoEn",
                actualizadoPor: "actualizadoPor",
              }}
              usuarios={personalAuditoria.map((p) => ({ label: `${p.nombres} ${p.apellidos}`.trim(), value: Number(p.id) }))}
              esSuperUsuario={Boolean(usuario?.esSuperUsuario)}
              buttonProps={{
                label: usuario?.esSuperUsuario ? "Auditoría" : "Ver Auditoría",
                className: "p-button-info",
                style: { width: "100%" },
              }}
            />
          </div>
        )}
        <Button type="button" label="Cancelar" icon="pi pi-times" onClick={onCancel} disabled={loading} className="p-button-warning" severity="warning" raised size="small" />
        <Button
          type="submit"
          label={plantilla ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
