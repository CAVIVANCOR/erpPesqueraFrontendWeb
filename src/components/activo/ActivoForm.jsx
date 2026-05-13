/**
 * Formulario para gestión de Activos
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: empresaId, tipoId, nombre, descripcion, cesado
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearActivo, actualizarActivo } from "../../api/activo";
import { getTiposActivo } from "../../api/tipoActivo";
import { getEmpresas } from "../../api/empresa";
import { getMonedas } from "../../api/moneda";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  empresaId: yup
    .number()
    .required("La empresa es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tipoId: yup
    .number()
    .required("El tipo de activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  nombre: yup.string().required("El nombre es obligatorio").trim(),
  descripcion: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cesado: yup.boolean().default(false),
  // Campos para saldos iniciales (opcionales)
  fechaAdquisicion: yup.date().nullable(),
  costoOriginal: yup
    .number()
    .nullable()
    .min(0, "El costo debe ser mayor o igual a 0"),
  depreciacionAcumulada: yup
    .number()
    .nullable()
    .min(0, "La depreciación debe ser mayor o igual a 0"),
  vidaUtilAnios: yup
    .number()
    .nullable()
    .integer("Debe ser un número entero")
    .min(1, "La vida útil debe ser mayor a 0"),
  monedaId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
});

const ActivoForm = ({
  activo,
  empresaIdInicial,
  tipoIdInicial,
  onGuardar,
  onCancelar,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [tiposActivo, setTiposActivo] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const esEdicion = !!activo;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      empresaId: null,
      tipoId: null,
      nombre: "",
      descripcion: "",
      cesado: false,
      fechaAdquisicion: null,
      costoOriginal: null,
      depreciacionAcumulada: null,
      vidaUtilAnios: null,
      monedaId: null,
    },
  });

  // Cargar datos de combos al montar
  useEffect(() => {
    cargarCombos();
  }, []);

  // Efecto para cargar datos en modo edición o nuevo con filtros
  useEffect(() => {
    if (activo) {
      // Modo edición: cargar datos del activo
      setValue("empresaId", Number(activo.empresaId) || null);
      setValue("tipoId", Number(activo.tipoId) || null);
      setValue("nombre", activo.nombre || "");
      setValue("descripcion", activo.descripcion || "");
      setValue("cesado", activo.cesado || false);
      setValue(
        "fechaAdquisicion",
        activo.fechaAdquisicion ? new Date(activo.fechaAdquisicion) : null,
      );
      setValue("costoOriginal", activo.costoOriginal || null);
      setValue("depreciacionAcumulada", activo.depreciacionAcumulada || null);
      setValue("vidaUtilAnios", activo.vidaUtilAnios || null);
      setValue("monedaId", activo.monedaId ? Number(activo.monedaId) : null);
    } else {
      // Modo creación: usar filtros iniciales si existen
      reset({
        empresaId: empresaIdInicial ? Number(empresaIdInicial) : null,
        tipoId: tipoIdInicial ? Number(tipoIdInicial) : null,
        nombre: "",
        descripcion: "",
        cesado: false,
        fechaAdquisicion: null,
        costoOriginal: null,
        depreciacionAcumulada: null,
        vidaUtilAnios: null,
        monedaId: null,
      });
    }
  }, [activo, empresaIdInicial, tipoIdInicial, setValue, reset]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [tiposData, empresasData, monedasData] = await Promise.all([
        getTiposActivo(),
        getEmpresas(),
        getMonedas(),
      ]);

      setTiposActivo(tiposData);
      setEmpresas(empresasData);
      setMonedas(monedasData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
    }
  };

  const monedasOptions = monedas.map((moneda) => ({
    label: moneda.codigoSunat,
    value: Number(moneda.id),
  }));
  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        empresaId: Number(data.empresaId),
        tipoId: Number(data.tipoId),
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        cesado: data.cesado,
        fechaAdquisicion: data.fechaAdquisicion || null,
        costoOriginal: data.costoOriginal || null,
        depreciacionAcumulada: data.depreciacionAcumulada || null,
        vidaUtilAnios: data.vidaUtilAnios || null,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
      };

      if (esEdicion) {
        await actualizarActivo(activo.id, datosNormalizados);
      } else {
        await crearActivo(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar activo:", error);
      // El manejo de errores se realiza en el componente padre
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  // Opciones para combos
  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const tiposActivoOptions = tiposActivo.map((tipo) => ({
    label: tipo.nombre,
    value: Number(tipo.id),
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
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId" className="p-d-block">
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
                className={getFieldClass("empresaId")}
                filter
                showClear
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.empresaId && (
            <small className="p-error p-d-block">
              {errors.empresaId.message}
            </small>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoId" className="p-d-block">
            Tipo de Activo <span className="p-error">*</span>
          </label>
          <Controller
            name="tipoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={tiposActivoOptions}
                placeholder="Seleccione tipo de activo"
                className={getFieldClass("tipoId")}
                filter
                showClear
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.tipoId && (
            <small className="p-error p-d-block">{errors.tipoId.message}</small>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {/* Campo Cesado */}
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "CESADO" : "ACTIVO"}
                className={
                  field.value
                    ? "p-button-danger w-full"
                    : "p-button-success w-full"
                }
                icon={field.value ? "pi pi-times-circle" : "pi pi-check-circle"}
                onClick={() => !readOnly && field.onChange(!field.value)}
                disabled={readOnly}
                style={{ marginTop: "0.5rem" }}
              />
            )}
          />
          {errors.cesado && (
            <small className="p-error p-d-block">{errors.cesado.message}</small>
          )}
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
          <label htmlFor="nombre" className="p-d-block">
            Nombre <span className="p-error">*</span>
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                placeholder="Ingrese el nombre del activo"
                className={getFieldClass("nombre")}
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                disabled={readOnly}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error p-d-block">{errors.nombre.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Descripción */}
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcion" className="p-d-block">
            Descripción
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputText
                id="descripcion"
                {...field}
                placeholder="Descripción del activo (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                disabled={readOnly}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">
              {errors.descripcion.message}
            </small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Sección de Saldos Iniciales */}
        <div style={{ flex: 1 }}>
          <hr style={{ margin: "20px 0", borderTop: "2px solid #dee2e6" }} />
          <h4 style={{ marginBottom: "15px", color: "#495057" }}>
            📊 Saldos Iniciales (Opcional)
          </h4>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Fecha de Adquisición */}
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaAdquisicion" className="p-d-block">
            Fecha de Adquisición
          </label>
          <Controller
            name="fechaAdquisicion"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaAdquisicion"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione fecha"
                className={getFieldClass("fechaAdquisicion")}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.fechaAdquisicion && (
            <small className="p-error p-d-block">
              {errors.fechaAdquisicion.message}
            </small>
          )}
        </div>

        {/* Campo Moneda */}
        <div style={{ flex: 1 }}>
          <label htmlFor="monedaId" className="p-d-block">
            Moneda
          </label>
          <Controller
            name="monedaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="monedaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={monedasOptions}
                placeholder="Seleccione moneda"
                className={getFieldClass("monedaId")}
                filter
                showClear
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.monedaId && (
            <small className="p-error p-d-block">
              {errors.monedaId.message}
            </small>
          )}
        </div>

        {/* Campo Costo Original */}
        <div style={{ flex: 1 }}>
          <label htmlFor="costoOriginal" className="p-d-block">
            Costo Original
          </label>
          <Controller
            name="costoOriginal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="costoOriginal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="0.00"
                className={getFieldClass("costoOriginal")}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.costoOriginal && (
            <small className="p-error p-d-block">
              {errors.costoOriginal.message}
            </small>
          )}
        </div>

        {/* Campo Depreciación Acumulada */}
        <div style={{ flex: 1 }}>
          <label htmlFor="depreciacionAcumulada" className="p-d-block">
            Depreciación Acumulada
          </label>
          <Controller
            name="depreciacionAcumulada"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="depreciacionAcumulada"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="0.00"
                className={getFieldClass("depreciacionAcumulada")}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.depreciacionAcumulada && (
            <small className="p-error p-d-block">
              {errors.depreciacionAcumulada.message}
            </small>
          )}
        </div>

        {/* Campo Vida Útil en Años */}
        <div style={{ flex: 1 }}>
          <label htmlFor="vidaUtilAnios" className="p-d-block">
            Vida Útil (Años)
          </label>
          <Controller
            name="vidaUtilAnios"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="vidaUtilAnios"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="0"
                className={getFieldClass("vidaUtilAnios")}
                min={1}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.vidaUtilAnios && (
            <small className="p-error p-d-block">
              {errors.vidaUtilAnios.message}
            </small>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          type="submit"
          label={esEdicion ? "Actualizar" : "Crear"}
          icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
          loading={loading}
          disabled={readOnly}
        />
      </div>
    </form>
  );
};

export default ActivoForm;
