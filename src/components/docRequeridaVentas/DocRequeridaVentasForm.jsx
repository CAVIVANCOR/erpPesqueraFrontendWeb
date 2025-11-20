/**
 * Formulario para Documentos Requeridos de Ventas
 *
 * Características:
 * - Validación con Yup
 * - Campos en mayúsculas automáticas
 * - Manejo de campos de auditoría
 * - Feedback visual con Toast
 * - Cumple estándares ERP Megui
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import {
  crearDocRequeridaVentas,
  actualizarDocRequeridaVentas,
} from "../../api/docRequeridaVentas";
import { getMonedas } from "../../api/moneda";
import { toUpperCaseSafe } from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  descripcion: yup.string().nullable(),
  aplicaPorPais: yup.boolean().default(false),
  aplicaPorProducto: yup.boolean().default(false),
  aplicaPorIncoterm: yup.boolean().default(false),
  esObligatorioPorDefecto: yup.boolean().default(true),
  tieneVencimiento: yup.boolean().default(false),
  diasValidez: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("tieneVencimiento", {
      is: true,
      then: (schema) =>
        schema.required("Días de validez es obligatorio si tiene vencimiento"),
    }),
  costoEstimado: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  monedaId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  activo: yup.boolean().default(true),
});

const DocRequeridaVentasForm = ({
  documentoInicial = null,
  onSubmit,
  onCancel,
  toast,
}) => {
  const [loading, setLoading] = useState(false);
  const [monedas, setMonedas] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: documentoInicial?.nombre || "",
      descripcion: documentoInicial?.descripcion || "",
      aplicaPorPais: documentoInicial?.aplicaPorPais ?? false,
      aplicaPorProducto: documentoInicial?.aplicaPorProducto ?? false,
      aplicaPorIncoterm: documentoInicial?.aplicaPorIncoterm ?? false,
      esObligatorioPorDefecto:
        documentoInicial?.esObligatorioPorDefecto ?? true,
      tieneVencimiento: documentoInicial?.tieneVencimiento ?? false,
      diasValidez: documentoInicial?.diasValidez
        ? Number(documentoInicial.diasValidez)
        : null,
      costoEstimado: documentoInicial?.costoEstimado
        ? Number(documentoInicial.costoEstimado)
        : null,
      monedaId: documentoInicial?.monedaId ? Number(documentoInicial.monedaId) : null,
      activo: documentoInicial?.activo ?? true,
    },
  });

  const tieneVencimiento = watch("tieneVencimiento");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataMonedas = await getMonedas();
      setMonedas(dataMonedas.filter((m) => m.activo));
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del formulario",
        life: 3000,
      });
    }
  };

  const onSubmitForm = async (data) => {
    try {
      setLoading(true);

      // Normalizar datos
      const payload = {
        nombre: toUpperCaseSafe(data.nombre),
        descripcion: data.descripcion
          ? toUpperCaseSafe(data.descripcion)
          : null,
        aplicaPorPais: data.aplicaPorPais,
        aplicaPorProducto: data.aplicaPorProducto,
        aplicaPorIncoterm: data.aplicaPorIncoterm,
        esObligatorioPorDefecto: data.esObligatorioPorDefecto,
        tieneVencimiento: data.tieneVencimiento,
        diasValidez: data.diasValidez ? Number(data.diasValidez) : null,
        costoEstimado: data.costoEstimado ? Number(data.costoEstimado) : null,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        activo: data.activo,
      };

      if (documentoInicial?.id) {
        await actualizarDocRequeridaVentas(documentoInicial.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Documento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDocRequeridaVentas(payload);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Documento creado correctamente",
          life: 3000,
        });
      }

      reset();
      onSubmit();
    } catch (error) {
      let mensajeError = "Error al guardar el documento";

      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            mensajeError = data.message || "Error de validación";
            break;
          case 409:
            mensajeError =
              data.message || "Ya existe un documento con ese nombre";
            break;
          case 404:
            mensajeError = "Recurso no encontrado";
            break;
          case 500:
            mensajeError = "Error interno del servidor";
            break;
          default:
            mensajeError = data.message || mensajeError;
        }
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} style={{ padding: "1rem" }}>
      {/* Nombre */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="nombre"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Nombre *
        </label>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              id="nombre"
              style={{ width: "100%", textTransform: "uppercase", fontWeight: "bold" }}
              placeholder="INGRESE EL NOMBRE DEL DOCUMENTO"
              className={errors.nombre ? "p-invalid" : ""}
              disabled={loading}
            />
          )}
        />
        {errors.nombre && (
          <small className="p-error">{errors.nombre.message}</small>
        )}
      </div>

      {/* Descripción */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="descripcion"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Descripción
        </label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              id="descripcion"
              rows={3}
              style={{ width: "100%", textTransform: "uppercase", fontWeight: "bold" }}
              placeholder="INGRESE LA DESCRIPCIÓN"
              disabled={loading}
            />
          )}
        />
      </div>

      {/* Fila: Días de Validez, Moneda y Costo Estimado */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="diasValidez"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Días de Validez {tieneVencimiento && "*"}
          </label>
          <Controller
            name="diasValidez"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="diasValidez"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={0}
                inputStyle={{ width: "100%", fontWeight: "bold" }}
                placeholder="Días de validez"
                className={errors.diasValidez ? "p-invalid" : ""}
                disabled={loading || !tieneVencimiento}
              />
            )}
          />
          {errors.diasValidez && (
            <small className="p-error">{errors.diasValidez.message}</small>
          )}
        </div>

        {/* Moneda */}
        <div style={{ flex: 1 }}>
          <label
            htmlFor="monedaId"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Moneda
          </label>
          <Controller
            name="monedaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id="monedaId"
                options={monedas.map((m) => ({
                  label: `${m.codigoSunat} - ${m.nombreLargo}`,
                  value: Number(m.id),
                }))}
                placeholder="Seleccionar moneda"
                showClear
                filter
                style={{ width: "100%", fontWeight: "bold" }}
                className={errors.monedaId ? "p-invalid" : ""}
                disabled={loading}
              />
            )}
          />
          {errors.monedaId && (
            <small className="p-error">{errors.monedaId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="costoEstimado"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Costo Estimado
          </label>
          <Controller
            name="costoEstimado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="costoEstimado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                inputStyle={{ width: "100%", fontWeight: "bold" }}
                placeholder="0.00"
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Sección: Reglas de Aplicabilidad */}
      <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "bold",
            marginBottom: "0.75rem",
          }}
        >
          Reglas de Aplicabilidad
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Controller
            name="aplicaPorPais"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Aplica por País: SÍ" : "Aplica por País: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="aplicaPorProducto"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Aplica por Producto: SÍ" : "Aplica por Producto: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="aplicaPorIncoterm"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Aplica por Incoterm: SÍ" : "Aplica por Incoterm: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Sección: Configuración General */}
      <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "bold",
            marginBottom: "0.75rem",
          }}
        >
          Configuración General
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Controller
            name="esObligatorioPorDefecto"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Obligatorio: SÍ" : "Obligatorio: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="tieneVencimiento"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Tiene Vencimiento: SÍ" : "Tiene Vencimiento: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />

          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "Activo: SÍ" : "Activo: NO"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                className={field.value ? "p-button-success" : "p-button-secondary"}
                onClick={() => field.onChange(!field.value)}
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Botones */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          marginTop: "2rem",
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={documentoInicial?.id ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default DocRequeridaVentasForm;