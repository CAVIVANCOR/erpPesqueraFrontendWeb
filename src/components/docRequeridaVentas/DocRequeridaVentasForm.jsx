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
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import {
  crearDocRequeridaVentas,
  actualizarDocRequeridaVentas,
} from "../../api/docRequeridaVentas";
import { getPaises } from "../../api/pais";
import { getTiposProducto } from "../../api/tipoProducto";
import { getMonedas } from "../../api/moneda";
import { toUpperCaseSafe } from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  descripcion: yup.string().nullable(),
  paisId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  tipoProductoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  esObligatorio: yup.boolean().default(true),
  requiereVigencia: yup.boolean().default(false),
  diasVigencia: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("requiereVigencia", {
      is: true,
      then: (schema) => schema.required("Días de vigencia es obligatorio si requiere vigencia"),
    }),
  tieneCosto: yup.boolean().default(false),
  costoEstimado: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  monedaId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("tieneCosto", {
      is: true,
      then: (schema) => schema.required("Moneda es obligatoria si tiene costo"),
    }),
  activo: yup.boolean().default(true),
});

const DocRequeridaVentasForm = ({
  documentoInicial = null,
  onSubmit,
  onCancel,
  toast,
}) => {
  const [loading, setLoading] = useState(false);
  const [paises, setPaises] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
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
      paisId: documentoInicial?.paisId || null,
      tipoProductoId: documentoInicial?.tipoProductoId || null,
      esObligatorio: documentoInicial?.esObligatorio ?? true,
      requiereVigencia: documentoInicial?.requiereVigencia ?? false,
      diasVigencia: documentoInicial?.diasVigencia || null,
      tieneCosto: documentoInicial?.tieneCosto ?? false,
      costoEstimado: documentoInicial?.costoEstimado || null,
      monedaId: documentoInicial?.monedaId || null,
      activo: documentoInicial?.activo ?? true,
    },
  });

  const requiereVigencia = watch("requiereVigencia");
  const tieneCosto = watch("tieneCosto");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [dataPaises, dataTiposProducto, dataMonedas] = await Promise.all([
        getPaises(),
        getTiposProducto(),
        getMonedas(),
      ]);
      setPaises(dataPaises);
      setTiposProducto(dataTiposProducto);
      setMonedas(dataMonedas);
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
        descripcion: data.descripcion ? toUpperCaseSafe(data.descripcion) : null,
        paisId: data.paisId ? Number(data.paisId) : null,
        tipoProductoId: data.tipoProductoId ? Number(data.tipoProductoId) : null,
        esObligatorio: data.esObligatorio,
        requiereVigencia: data.requiereVigencia,
        diasVigencia: data.diasVigencia ? Number(data.diasVigencia) : null,
        tieneCosto: data.tieneCosto,
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
            mensajeError = data.message || "Ya existe un documento con ese nombre";
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
        <label htmlFor="nombre" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
          Nombre *
        </label>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              id="nombre"
              style={{ width: "100%", textTransform: "uppercase" }}
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
        <label htmlFor="descripcion" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
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
              style={{ width: "100%", textTransform: "uppercase" }}
              placeholder="INGRESE LA DESCRIPCIÓN"
              disabled={loading}
            />
          )}
        />
      </div>

      {/* Fila: País y Tipo Producto */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="paisId" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            País
          </label>
          <Controller
            name="paisId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id="paisId"
                options={paises.map((p) => ({ label: p.nombre, value: p.id }))}
                placeholder="Seleccionar país"
                showClear
                style={{ width: "100%" }}
                disabled={loading}
              />
            )}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="tipoProductoId" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Tipo de Producto
          </label>
          <Controller
            name="tipoProductoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id="tipoProductoId"
                options={tiposProducto.map((t) => ({ label: t.nombre, value: t.id }))}
                placeholder="Seleccionar tipo"
                showClear
                style={{ width: "100%" }}
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="esObligatorio"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="esObligatorio"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="esObligatorio" style={{ fontWeight: "bold" }}>
            Es Obligatorio
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="requiereVigencia"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="requiereVigencia"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="requiereVigencia" style={{ fontWeight: "bold" }}>
            Requiere Vigencia
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="tieneCosto"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="tieneCosto"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="tieneCosto" style={{ fontWeight: "bold" }}>
            Tiene Costo
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="activo"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="activo" style={{ fontWeight: "bold" }}>
            Activo
          </label>
        </div>
      </div>

      {/* Días de Vigencia (condicional) */}
      {requiereVigencia && (
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="diasVigencia" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Días de Vigencia *
          </label>
          <Controller
            name="diasVigencia"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                id="diasVigencia"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={0}
                style={{ width: "100%" }}
                placeholder="Ingrese días de vigencia"
                className={errors.diasVigencia ? "p-invalid" : ""}
                disabled={loading}
              />
            )}
          />
          {errors.diasVigencia && (
            <small className="p-error">{errors.diasVigencia.message}</small>
          )}
        </div>
      )}

      {/* Costo y Moneda (condicional) */}
      {tieneCosto && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="costoEstimado" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Costo Estimado
            </label>
            <Controller
              name="costoEstimado"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  id="costoEstimado"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  disabled={loading}
                />
              )}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="monedaId" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Moneda *
            </label>
            <Controller
              name="monedaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  id="monedaId"
                  options={monedas.map((m) => ({ label: `${m.codigo} - ${m.nombre}`, value: m.id }))}
                  placeholder="Seleccionar moneda"
                  style={{ width: "100%" }}
                  className={errors.monedaId ? "p-invalid" : ""}
                  disabled={loading}
                />
              )}
            />
            {errors.monedaId && (
              <small className="p-error">{errors.monedaId.message}</small>
            )}
          </div>
        </div>
      )}

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "2rem" }}>
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