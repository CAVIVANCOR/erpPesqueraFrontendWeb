// src/components/detCuotaPesca/DetCuotaPescaForm.jsx
// Formulario modular y reutilizable para alta y edición de detalles de cuota de pesca.
// Usa react-hook-form y Yup para validación profesional.
// Documentado en español técnico.

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import AuditInfo from "../shared/AuditInfo";
import { Dropdown } from "primereact/dropdown";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  empresaId: Yup.number().required("La empresa es obligatoria"),
  nombre: Yup.string().required("El nombre es obligatorio"),
  porcentajeCuota: Yup.number()
    .required("El porcentaje de cuota es obligatorio")
    .min(0, "El porcentaje no puede ser negativo")
    .max(100, "El porcentaje no puede ser mayor a 100%"),
  precioPorTonDolares: Yup.number()
    .min(0, "El precio no puede ser negativo")
    .nullable(),
  zona: Yup.string()
    .required("La zona es obligatoria")
    .oneOf(["NORTE", "SUR"], "La zona debe ser NORTE o SUR"),
});

/**
 * Formulario modular de detalle de cuota de pesca.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales (debe incluir empresaId)
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {boolean} props.readOnly Solo lectura
 */
export default function DetCuotaPescaForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  // Estados para campos booleanos
  const [esAlquiler, setEsAlquiler] = useState(defaultValues.esAlquiler ?? false);
  const [cuotaPropia, setCuotaPropia] = useState(defaultValues.cuotaPropia ?? false);
  const [activo, setActivo] = useState(defaultValues.activo ?? true);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      empresaId: defaultValues.empresaId || null,
      nombre: defaultValues.nombre || "",
      porcentajeCuota: defaultValues.porcentajeCuota || 0,
      precioPorTonDolares: defaultValues.precioPorTonDolares || 0,
      zona: defaultValues.zona || "NORTE",
    },
  });

  // Resetear formulario cuando cambian defaultValues
  useEffect(() => {
    reset({
      empresaId: defaultValues.empresaId || null,
      nombre: defaultValues.nombre || "",
      porcentajeCuota: defaultValues.porcentajeCuota || 0,
      precioPorTonDolares: defaultValues.precioPorTonDolares || 0,
      zona: defaultValues.zona || "NORTE",
    });
    setEsAlquiler(defaultValues.esAlquiler ?? false);
    setCuotaPropia(defaultValues.cuotaPropia ?? false);
    setActivo(defaultValues.activo ?? true);
  }, [defaultValues, reset]);

  // Maneja el submit interno
  const onSubmitInterno = (data) => {
    const payload = {
      empresaId: Number(data.empresaId),
      nombre: data.nombre.trim().toUpperCase(),
      porcentajeCuota: Number(data.porcentajeCuota),
      precioPorTonDolares: data.precioPorTonDolares !== null && data.precioPorTonDolares !== undefined ? Number(data.precioPorTonDolares) : 0,
      zona: data.zona,
      esAlquiler: esAlquiler,
      cuotaPropia: cuotaPropia,
      activo: activo,
      idPersonaActualiza: Number(defaultValues.idPersonaActualiza),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitInterno)}>
      <div className="p-fluid">
        {/* Nombre del detalle de cuota */}
        <div className="field">
          <label htmlFor="nombre">
            Nombre <span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="nombre"
            {...register("nombre")}
            disabled={readOnly}
            className={errors.nombre ? "p-invalid" : ""}
            placeholder="Ej: Cuota Propia Principal, Cuota Alquilada Secundaria"
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Porcentaje de cuota */}
        <div className="field">
          <label htmlFor="porcentajeCuota">
            Porcentaje de Cuota (%) <span style={{ color: "red" }}>*</span>
          </label>
          <Controller
            name="porcentajeCuota"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeCuota"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                disabled={readOnly}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={6}
                min={0}
                max={100}
                suffix="%"
                className={errors.porcentajeCuota ? "p-invalid" : ""}
              />
            )}
          />
          {errors.porcentajeCuota && (
            <small className="p-error">{errors.porcentajeCuota.message}</small>
          )}
        </div>

        {/* Precio por tonelada en dólares */}
        <div className="field">
          <label htmlFor="precioPorTonDolares">Precio por Tonelada (USD)</label>
          <Controller
            name="precioPorTonDolares"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="precioPorTonDolares"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                disabled={readOnly}
                mode="currency"
                currency="USD"
                locale="en-US"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                className={errors.precioPorTonDolares ? "p-invalid" : ""}
              />
            )}
          />
          {errors.precioPorTonDolares && (
            <small className="p-error">
              {errors.precioPorTonDolares.message}
            </small>
          )}
        </div>

        {/* Zona */}
        <div className="field">
          <label htmlFor="zona">
            Zona <span style={{ color: "red" }}>*</span>
          </label>
          <Controller
            name="zona"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="zona"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={[
                  { label: "NORTE", value: "NORTE" },
                  { label: "SUR", value: "SUR" },
                ]}
                disabled={readOnly}
                placeholder="Seleccione zona"
                className={errors.zona ? "p-invalid" : ""}
              />
            )}
          />
          {errors.zona && (
            <small className="p-error">{errors.zona.message}</small>
          )}
        </div>

        {/* Botones booleanos en grilla 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          {/* Estado de Operación (esAlquiler) */}
          <div className="field">
            <label htmlFor="esAlquiler">Estado de Operación</label>
            <Button
              type="button"
              label={esAlquiler ? "ALQUILER" : "PESCA"}
              className={esAlquiler ? "p-button-warning" : "p-button-info"}
              icon={esAlquiler ? "pi pi-dollar" : "pi pi-anchor"}
              onClick={() => setEsAlquiler(!esAlquiler)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          {/* Tipo de Cuota (cuotaPropia) */}
          <div className="field">
            <label htmlFor="cuotaPropia">Tipo de Cuota</label>
            <Button
              type="button"
              label={cuotaPropia ? "CUOTA PROPIA" : "CUOTA ALQUILADA"}
              className={cuotaPropia ? "p-button-success" : "p-button-secondary"}
              icon={cuotaPropia ? "pi pi-home" : "pi pi-building"}
              onClick={() => setCuotaPropia(!cuotaPropia)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>

          {/* Estado (activo) */}
          <div className="field">
            <label htmlFor="activo">Estado</label>
            <Button
              type="button"
              label={activo ? "ACTIVO" : "INACTIVO"}
              className={activo ? "p-button-success" : "p-button-danger"}
              icon={activo ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => setActivo(!activo)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Información de Auditoría */}
        {isEdit && <AuditInfo data={defaultValues} />}

        {/* Botones */}
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
            type="button"
            onClick={onCancel}
            className="p-button-secondary"
            disabled={loading}
          />
          <Button
            label={isEdit ? "Actualizar" : "Crear"}
            icon={isEdit ? "pi pi-check" : "pi pi-plus"}
            type="submit"
            className="p-button-success"
            loading={loading}
            disabled={readOnly}
          />
        </div>
      </div>
    </form>
  );
}