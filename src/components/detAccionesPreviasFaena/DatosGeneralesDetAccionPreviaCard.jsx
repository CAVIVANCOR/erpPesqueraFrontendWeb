// src/components/detAccionesPreviasFaena/DatosGeneralesDetAccionPreviaCard.jsx
// Card para datos generales de DetAccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React from "react";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { ToggleButton } from "primereact/togglebutton";
import { Controller, useWatch } from "react-hook-form";

export default function DatosGeneralesDetAccionPreviaCard({
  control,
  acciones,
  personal = [],
  loading,
}) {
  // Normalizar opciones para los dropdowns
  const accionesOptions = acciones.map((a) => ({
    ...a,
    id: Number(a.id),
    label: a.nombre,
    value: Number(a.id),
  }));

  const personalOptions = personal.map((p) => ({
    ...p,
    id: Number(p.id),
    label: `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  // Observar el valor de accionPreviaId para mostrar la descripción
  const accionPreviaId = useWatch({
    control,
    name: "accionPreviaId",
  });

  const responsableId = useWatch({
    control,
    name: "responsableId",
  });

  const verificadorId = useWatch({
    control,
    name: "verificadorId",
  });

  return (
    <Card title="Datos Generales" className="p-mb-3">
      <div className="p-grid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="p-field">
              <label htmlFor="accionPreviaId">Acción Previa*</label>
              <Controller
                name="accionPreviaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="accionPreviaId"
                    value={field.value}
                    options={accionesOptions}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar acción"
                    disabled
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
            <div className="p-field" style={{ marginTop: "10px" }}>
              <label htmlFor="descripcionAccion">
                Descripción Acción Previa
              </label>
              <InputTextarea
                id="descripcionAccion"
                value={
                  accionPreviaId
                    ? acciones.find((a) => Number(a.id) === Number(accionPreviaId))?.descripcion || ""
                    : ""
                }
                rows={5}
                disabled
                style={{ fontStyle: "italic" }}
              />
            </div>
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
            <div className="p-field">
              <label htmlFor="responsableId">Responsable</label>
              <Controller
                name="responsableId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="responsableId"
                    value={field.value}
                    options={personalOptions}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar responsable"
                    disabled
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="p-field">
              <label htmlFor="fechaVerificacion">Fecha Verificación</label>
              <Controller
                name="fechaVerificacion"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVerificacion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    showIcon
                    showTime
                    hourFormat="24"
                    disabled
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="verificado"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="verificado"
                  onLabel="VERIFICADO"
                  offLabel="VERIFICAR"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  disabled
                  className={
                    field.value ? "p-button-success" : "p-button-secondary"
                  }
                />
              )}
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
            <div className="p-field">
              <label htmlFor="verificadorId">Verificador</label>
              <Controller
                name="verificadorId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="verificadorId"
                    value={field.value}
                    options={personalOptions}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar verificador"
                    disabled
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="p-field">
              <label htmlFor="fechaCumplida">Fecha Cumplida</label>
              <Controller
                name="fechaCumplida"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaCumplida"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    showIcon
                    showTime
                    hourFormat="24"
                    disabled
                  />
                )}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="cumplida"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="cumplida"
                  onLabel="CUMPLIDA"
                  offLabel="PENDIENTE"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  disabled
                  className={
                    field.value ? "p-button-success" : "p-button-secondary"
                  }
                />
              )}
            />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={3}
                  disabled={loading}
                  style={{
                    fontStyle: "italic",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "#ff0000",
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
