/**
 * Formulario para Requisitos de Documentos por País
 * Define qué documentos son obligatorios para cada país/producto
 * Ejemplo: China + Langostinos = Certificado Sanitario obligatorio
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import {
  crearRequisitoDocPorPais,
  actualizarRequisitoDocPorPais,
} from "../../api/requisitoDocPorPais";
import { getDocRequeridaVentas } from "../../api/docRequeridaVentas";
import { getPaises } from "../../api/pais";
import { getTiposProducto } from "../../api/tipoProducto";
import { toUpperCaseSafe } from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  docRequeridaVentasId: yup
    .number()
    .required("El documento requerido es obligatorio")
    .typeError("Debe seleccionar un documento"),
  paisId: yup
    .number()
    .required("El país es obligatorio")
    .typeError("Debe seleccionar un país"),
  tipoProductoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  esObligatorio: yup.boolean().default(true),
  observaciones: yup.string().nullable(),
});

const RequisitoDocPorPaisForm = ({
  requisitoInicial = null,
  onSubmit,
  onCancel,
  toast,
}) => {
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      docRequeridaVentasId: requisitoInicial?.docRequeridaVentasId
        ? Number(requisitoInicial.docRequeridaVentasId)
        : null,
      paisId: requisitoInicial?.paisId ? Number(requisitoInicial.paisId) : null,
      tipoProductoId: requisitoInicial?.tipoProductoId
        ? Number(requisitoInicial.tipoProductoId)
        : null,
      esObligatorio: requisitoInicial?.esObligatorio ?? true,
      observaciones: requisitoInicial?.observaciones || "",
    },
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [dataDocumentos, dataPaises, dataTiposProducto] =
        await Promise.all([
          getDocRequeridaVentas(),
          getPaises(),
          getTiposProducto(),
        ]);

      setDocumentos(dataDocumentos.filter((d) => d.activo));
      setPaises(dataPaises.filter((p) => p.activo));
      setTiposProducto(dataTiposProducto.filter((t) => t.activo));
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
        docRequeridaVentasId: Number(data.docRequeridaVentasId),
        paisId: Number(data.paisId),
        tipoProductoId: data.tipoProductoId ? Number(data.tipoProductoId) : null,
        esObligatorio: data.esObligatorio,
        observaciones: data.observaciones
          ? toUpperCaseSafe(data.observaciones)
          : null,
      };

      if (requisitoInicial?.id) {
        await actualizarRequisitoDocPorPais(requisitoInicial.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Requisito actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearRequisitoDocPorPais(payload);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Requisito creado correctamente",
          life: 3000,
        });
      }

      reset();
      onSubmit();
    } catch (error) {
      let mensajeError = "Error al guardar el requisito";

      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            mensajeError = data.message || "Error de validación";
            break;
          case 409:
            mensajeError =
              data.message ||
              "Ya existe un requisito para esta combinación de documento, país y tipo de producto";
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
      {/* Documento Requerido */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="docRequeridaVentasId"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Documento Requerido *
        </label>
        <Controller
          name="docRequeridaVentasId"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              id="docRequeridaVentasId"
              options={documentos.map((d) => ({
                label: d.nombre,
                value: Number(d.id),
              }))}
              placeholder="Seleccionar documento"
              filter
              style={{ width: "100%", fontWeight: "bold" }}
              className={errors.docRequeridaVentasId ? "p-invalid" : ""}
              disabled={loading}
            />
          )}
        />
        {errors.docRequeridaVentasId && (
          <small className="p-error">
            {errors.docRequeridaVentasId.message}
          </small>
        )}
      </div>

      {/* Fila: País y Tipo de Producto */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {/* País */}
        <div style={{ flex: 1 }}>
          <label
            htmlFor="paisId"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            País *
          </label>
          <Controller
            name="paisId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id="paisId"
                options={paises.map((p) => ({
                  label: p.nombre,
                  value: Number(p.id),
                }))}
                placeholder="Seleccionar país"
                filter
                style={{ width: "100%", fontWeight: "bold" }}
                className={errors.paisId ? "p-invalid" : ""}
                disabled={loading}
              />
            )}
          />
          {errors.paisId && (
            <small className="p-error">{errors.paisId.message}</small>
          )}
        </div>

        {/* Tipo de Producto */}
        <div style={{ flex: 1 }}>
          <label
            htmlFor="tipoProductoId"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Tipo de Producto (Opcional)
          </label>
          <Controller
            name="tipoProductoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id="tipoProductoId"
                options={tiposProducto.map((t) => ({
                  label: t.nombre,
                  value: Number(t.id),
                }))}
                placeholder="Todos los productos"
                showClear
                filter
                style={{ width: "100%", fontWeight: "bold" }}
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Es Obligatorio */}
      <div style={{ marginBottom: "1rem" }}>
        <Controller
          name="esObligatorio"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "Obligatorio: SÍ" : "Obligatorio: NO"}
              icon={field.value ? "pi pi-check" : "pi pi-times"}
              className={
                field.value ? "p-button-success" : "p-button-secondary"
              }
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
            />
          )}
        />
      </div>

      {/* Observaciones */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="observaciones"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Observaciones
        </label>
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              id="observaciones"
              rows={3}
              style={{ width: "100%", textTransform: "uppercase", fontWeight: "bold" }}
              placeholder="INGRESE OBSERVACIONES"
              disabled={loading}
            />
          )}
        />
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
          label={requisitoInicial?.id ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default RequisitoDocPorPaisForm;