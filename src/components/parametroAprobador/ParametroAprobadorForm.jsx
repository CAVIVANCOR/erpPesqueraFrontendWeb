// src/components/parametroAprobador/ParametroAprobadorForm.jsx
// Formulario profesional para alta y edición de ParametroAprobador en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { ToggleButton } from "primereact/togglebutton";
import { Button } from "primereact/button";

// Esquema de validación profesional
const schema = Yup.object().shape({
  personalRespId: Yup.number()
    .required("El personal responsable es obligatorio")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  moduloSistemaId: Yup.number()
    .required("El módulo sistema es obligatorio")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  empresaId: Yup.number()
    .required("La empresa es obligatoria")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  embarcacionId: Yup.number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  sedeId: Yup.number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  vigenteDesde: Yup.date().required("La fecha vigente desde es obligatoria"),
  vigenteHasta: Yup.date().nullable(),
  cesado: Yup.boolean(),
});

/**
 * Formulario desacoplado para alta/edición de ParametroAprobador
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading, readOnly, y datos de combos
 */
export default function ParametroAprobadorForm({
  isEdit = false,
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
  personal = [],
  modulosSistema = [],
  empresas = [],
  sedes = [],
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || {
      personalRespId: null,
      moduloSistemaId: null,
      empresaId: null,
      embarcacionId: null,
      sedeId: null,
      vigenteDesde: null,
      vigenteHasta: null,
      cesado: false,
    },
  });

  // Watch empresaId para filtrar sedes
  const empresaWatched = watch("empresaId");

  // Cargar valores en edición
  useEffect(() => {
    if (defaultValues && isEdit) {
      reset({
        personalRespId: defaultValues.personalRespId
          ? Number(defaultValues.personalRespId)
          : null,
        moduloSistemaId: defaultValues.moduloSistemaId
          ? Number(defaultValues.moduloSistemaId)
          : null,
        empresaId: defaultValues.empresaId
          ? Number(defaultValues.empresaId)
          : null,
        embarcacionId: defaultValues.embarcacionId
          ? Number(defaultValues.embarcacionId)
          : null,
        sedeId: defaultValues.sedeId ? Number(defaultValues.sedeId) : null,
        vigenteDesde: defaultValues.vigenteDesde
          ? new Date(defaultValues.vigenteDesde)
          : null,
        vigenteHasta: defaultValues.vigenteHasta
          ? new Date(defaultValues.vigenteHasta)
          : null,
        cesado: defaultValues.cesado || false,
      });
    }
  }, [defaultValues, isEdit, reset]);

  // Opciones para combos
  const personalOptions = personal.map((persona) => {
    const empresa = empresas.find(
      (emp) => Number(emp.id) === Number(persona.empresaId)
    );
    const empresaNombre = empresa ? empresa.razonSocial : "Sin empresa";
    return {
      label: `${persona.nombres} ${persona.apellidos} - ${empresaNombre}`,
      value: Number(persona.id),
    };
  });

  const modulosSistemaOptions = modulosSistema.map((modulo) => ({
    label: modulo.nombre,
    value: Number(modulo.id),
  }));

  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const sedesOptions = sedes
    .filter((sede) => Number(sede.empresaId) === Number(empresaWatched))
    .map((sede) => ({
      label: sede.nombre,
      value: Number(sede.id),
    }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Empresa */}
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">
            Empresa <span className="p-error">*</span>
          </label>
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={empresasOptions}
                placeholder="Seleccione una empresa"
                className={errors.empresaId ? "p-invalid" : ""}
                filter
                showClear
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.empresaId && (
            <small className="p-error">{errors.empresaId.message}</small>
          )}
        </div>

        {/* Campo Personal Responsable */}
        <div style={{ flex: 1 }}>
          <label htmlFor="personalRespId">
            Personal Responsable <span className="p-error">*</span>
          </label>
          <Controller
            name="personalRespId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personalRespId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={personalOptions}
                placeholder="Seleccione personal responsable"
                className={errors.personalRespId ? "p-invalid" : ""}
                filter
                showClear
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.personalRespId && (
            <small className="p-error">{errors.personalRespId.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 12,
        }}
      >
        {/* Campo Módulo Sistema */}
        <div style={{ flex: 1 }}>
          <label htmlFor="moduloSistemaId">
            Módulo Sistema <span className="p-error">*</span>
          </label>
          <Controller
            name="moduloSistemaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="moduloSistemaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={modulosSistemaOptions}
                placeholder="Seleccione módulo sistema"
                className={errors.moduloSistemaId ? "p-invalid" : ""}
                filter
                showClear
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.moduloSistemaId && (
            <small className="p-error">{errors.moduloSistemaId.message}</small>
          )}
        </div>

        {/* Campo Sede */}
        <div style={{ flex: 1 }}>
          <label htmlFor="sedeId">Sede</label>
          <Controller
            name="sedeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="sedeId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={sedesOptions}
                placeholder={
                  empresaWatched
                    ? "Seleccione sede (opcional)"
                    : "Primero seleccione una empresa"
                }
                className={errors.sedeId ? "p-invalid" : ""}
                filter
                showClear
                disabled={readOnly || loading || !empresaWatched}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.sedeId && (
            <small className="p-error">{errors.sedeId.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 12,
        }}
      >
        {/* Campo Vigente Desde */}
        <div style={{ flex: 1 }}>
          <label htmlFor="vigenteDesde">
            Vigente Desde <span className="p-error">*</span>
          </label>
          <Controller
            name="vigenteDesde"
            control={control}
            render={({ field }) => (
              <Calendar
                id="vigenteDesde"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione fecha desde"
                className={errors.vigenteDesde ? "p-invalid" : ""}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.vigenteDesde && (
            <small className="p-error">{errors.vigenteDesde.message}</small>
          )}
        </div>

        {/* Campo Vigente Hasta */}
        <div style={{ flex: 1 }}>
          <label htmlFor="vigenteHasta">Vigente Hasta</label>
          <Controller
            name="vigenteHasta"
            control={control}
            render={({ field }) => (
              <Calendar
                id="vigenteHasta"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione fecha hasta (opcional)"
                className={errors.vigenteHasta ? "p-invalid" : ""}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.vigenteHasta && (
            <small className="p-error">{errors.vigenteHasta.message}</small>
          )}
        </div>
        <div style={{ flex: 1}}>
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "CESADO" : "ACTIVO"}
                className={field.value ? "p-button-danger" : "p-button-primary"}
                icon={field.value ? "pi pi-times-circle" : "pi pi-check-circle"}
                onClick={() => !readOnly && field.onChange(!field.value)}
                disabled={readOnly || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
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
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-save"
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
