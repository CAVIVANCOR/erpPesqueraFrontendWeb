/**
 * ContactoEntidadForm.jsx
 *
 * Formulario profesional para ContactoEntidad siguiendo el patrón estándar ERP Megui.
 * Utiliza React Hook Form + Yup para validaciones y está alineado EXACTAMENTE al modelo Prisma.
 * CAMPOS REALES: entidadComercialId, nombres, cargoId, telefono, correoCorportivo, correoPersonal,
 * compras, ventas, finanzas, logistica, representanteLegal, observaciones, activo
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";

// Esquema de validación Yup alineado EXACTAMENTE al modelo Prisma
const esquemaValidacionContacto = yup.object().shape({
  entidadComercialId: yup
    .number()
    .required("La entidad comercial es requerida")
    .integer("Debe ser un número entero"),
  nombres: yup
    .string()
    .required("Los nombres son requeridos")
    .max(255, "Máximo 255 caracteres")
    .trim(),
  cargoId: yup
    .number()
    .nullable()
    .integer("Debe ser un número entero"),
  telefono: yup
    .string()
    .nullable()
    .max(20, "Máximo 20 caracteres")
    .trim(),
  correoCorportivo: yup
    .string()
    .nullable()
    .email("Formato de email inválido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  correoPersonal: yup
    .string()
    .nullable()
    .email("Formato de email inválido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  compras: yup.boolean(),
  ventas: yup.boolean(),
  finanzas: yup.boolean(),
  logistica: yup.boolean(),
  representanteLegal: yup.boolean(),
  observaciones: yup
    .string()
    .nullable()
    .max(500, "Máximo 500 caracteres")
    .trim(),
  activo: yup.boolean(),
});

/**
 * Componente ContactoEntidadForm
 * @param {Object} props - Props del componente
 * @param {boolean} props.isEdit - Indica si está en modo edición
 * @param {Object} props.defaultValues - Valores por defecto del formulario
 * @param {Array} props.entidades - Lista de entidades comerciales
 * @param {Array} props.cargos - Lista de cargos disponibles
 * @param {Function} props.onSubmit - Función callback para envío del formulario
 * @param {Function} props.onCancel - Función callback para cancelar
 * @param {boolean} props.loading - Estado de carga
 */
export default function ContactoEntidadForm({
  isEdit = false,
  defaultValues = {},
  entidades = [],
  cargos = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(esquemaValidacionContacto),
    defaultValues: {
      entidadComercialId: null,
      nombres: "",
      cargoId: null,
      telefono: "",
      correoCorportivo: "",
      correoPersonal: "",
      compras: false,
      ventas: false,
      finanzas: false,
      logistica: false,
      representanteLegal: false,
      observaciones: "",
      activo: true,
    },
  });

  // Efecto para cargar valores por defecto
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        entidadComercialId: defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null,
        nombres: (defaultValues.nombres || "").toUpperCase(),
        cargoId: defaultValues.cargoId ? Number(defaultValues.cargoId) : null,
        telefono: defaultValues.telefono || "",
        correoCorportivo: defaultValues.correoCorportivo || "",
        correoPersonal: defaultValues.correoPersonal || "",
        compras: Boolean(defaultValues.compras),
        ventas: Boolean(defaultValues.ventas),
        finanzas: Boolean(defaultValues.finanzas),
        logistica: Boolean(defaultValues.logistica),
        representanteLegal: Boolean(defaultValues.representanteLegal),
        observaciones: defaultValues.observaciones || "",
        activo: defaultValues.activo !== undefined ? Boolean(defaultValues.activo) : true,
      });
    }
  }, [defaultValues, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onFormSubmit = (data) => {
    // Normalizar datos antes del envío según modelo Prisma
    const datosNormalizados = {
      entidadComercialId: Number(data.entidadComercialId),
      nombres: data.nombres.trim().toUpperCase(),
      cargoId: data.cargoId ? Number(data.cargoId) : null,
      telefono: data.telefono?.trim() || null,
      correoCorportivo: data.correoCorportivo?.trim() || null,
      correoPersonal: data.correoPersonal?.trim() || null,
      compras: Boolean(data.compras),
      ventas: Boolean(data.ventas),
      finanzas: Boolean(data.finanzas),
      logistica: Boolean(data.logistica),
      representanteLegal: Boolean(data.representanteLegal),
      observaciones: data.observaciones?.trim() || null,
      activo: Boolean(data.activo),
    };

    onSubmit(datosNormalizados);
  };

  /**
   * Obtiene la clase CSS para campos con errores
   */
  const getFieldClass = (fieldName) => {
    return classNames({ "p-invalid": errors[fieldName] });
  };

  /**
   * Obtiene mensaje de error de validación
   */
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>;
  };

  // Normalizar opciones para dropdowns
  const entidadesOptions = entidades.map((entidad) => ({
    label: entidad.razonSocial,
    value: Number(entidad.id),
  }));

  const cargosOptions = cargos.map((cargo) => ({
    label: cargo.nombre,
    value: Number(cargo.id),
  }));

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-fluid">
      <div className="grid">
        {/* Información Básica */}
        <div className="col-12">
          <h5>Información Básica</h5>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="entidadComercialId">Entidad Comercial *</label>
            <Controller
              name="entidadComercialId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="entidadComercialId"
                  {...field}
                  options={entidadesOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar entidad comercial"
                  className={getFieldClass("entidadComercialId")}
                  disabled={loading}
                  filter
                  showClear
                />
              )}
            />
            {getFormErrorMessage("entidadComercialId")}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="nombres">Nombres *</label>
            <Controller
              name="nombres"
              control={control}
              render={({ field }) => (
                <InputText
                  id="nombres"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className={getFieldClass("nombres")}
                  disabled={loading}
                  maxLength={255}
                  style={{ textTransform: "uppercase" }}
                />
              )}
            />
            {getFormErrorMessage("nombres")}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="cargoId">Cargo</label>
            <Controller
              name="cargoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="cargoId"
                  {...field}
                  options={cargosOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cargo"
                  className={getFieldClass("cargoId")}
                  disabled={loading}
                  filter
                  showClear
                />
              )}
            />
            {getFormErrorMessage("cargoId")}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <InputText
                  id="telefono"
                  {...field}
                  className={getFieldClass("telefono")}
                  disabled={loading}
                  maxLength={20}
                />
              )}
            />
            {getFormErrorMessage("telefono")}
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="col-12">
          <h5>Información de Contacto</h5>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="correoCorportivo">Email Corporativo</label>
            <Controller
              name="correoCorportivo"
              control={control}
              render={({ field }) => (
                <InputText
                  id="correoCorportivo"
                  {...field}
                  type="email"
                  className={getFieldClass("correoCorportivo")}
                  disabled={loading}
                  maxLength={100}
                />
              )}
            />
            {getFormErrorMessage("correoCorportivo")}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="correoPersonal">Email Personal</label>
            <Controller
              name="correoPersonal"
              control={control}
              render={({ field }) => (
                <InputText
                  id="correoPersonal"
                  {...field}
                  type="email"
                  className={getFieldClass("correoPersonal")}
                  disabled={loading}
                  maxLength={100}
                />
              )}
            />
            {getFormErrorMessage("correoPersonal")}
          </div>
        </div>

        {/* Áreas de Responsabilidad */}
        <div className="col-12">
          <h5>Áreas de Responsabilidad</h5>
        </div>

        <div className="col-12 md:col-3">
          <div className="field-checkbox">
            <Controller
              name="compras"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="compras"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="compras" className="ml-2">Compras</label>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="field-checkbox">
            <Controller
              name="ventas"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="ventas"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="ventas" className="ml-2">Ventas</label>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="field-checkbox">
            <Controller
              name="finanzas"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="finanzas"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="finanzas" className="ml-2">Finanzas</label>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="field-checkbox">
            <Controller
              name="logistica"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="logistica"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="logistica" className="ml-2">Logística</label>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field-checkbox">
            <Controller
              name="representanteLegal"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="representanteLegal"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="representanteLegal" className="ml-2">Representante Legal</label>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field-checkbox">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={loading}
                />
              )}
            />
            <label htmlFor="activo" className="ml-2">Activo</label>
          </div>
        </div>

        {/* Observaciones */}
        <div className="col-12">
          <div className="field">
            <label htmlFor="observaciones">Observaciones</label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  rows={3}
                  className={getFieldClass("observaciones")}
                  disabled={loading}
                  maxLength={500}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
            {getFormErrorMessage("observaciones")}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-content-end gap-2 mt-3">
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
        />
      </div>
    </form>
  );
}
