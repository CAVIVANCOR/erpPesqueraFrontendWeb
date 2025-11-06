/**
 * Formulario para Costos de Exportación por Incoterm
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
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import {
  crearCostoExportacionPorIncoterm,
  actualizarCostoExportacionPorIncoterm,
} from "../../api/costoExportacionPorIncoterm";
import { getIncoterms } from "../../api/incoterm";
import { getProductos } from "../../api/producto";
import { toUpperCaseSafe } from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  incotermId: yup
    .number()
    .required("El Incoterm es obligatorio")
    .typeError("Debe seleccionar un Incoterm"),
  productoId: yup
    .number()
    .required("El producto (costo) es obligatorio")
    .typeError("Debe seleccionar un producto"),
  esCargoVendedor: yup.boolean().default(true),
  aplicaSiempre: yup.boolean().default(true),
  observaciones: yup.string().nullable(),
});

const CostoExportacionPorIncotermForm = ({
  costoInicial = null,
  onSubmit,
  onCancel,
  toast,
}) => {
  const [loading, setLoading] = useState(false);
  const [incoterms, setIncoterms] = useState([]);
  const [productos, setProductos] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      incotermId: costoInicial?.incotermId || null,
      productoId: costoInicial?.productoId || null,
      esCargoVendedor: costoInicial?.esCargoVendedor ?? true,
      aplicaSiempre: costoInicial?.aplicaSiempre ?? true,
      observaciones: costoInicial?.observaciones || "",
    },
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [dataIncoterms, dataProductos] = await Promise.all([
        getIncoterms(),
        getProductos(),
      ]);
      setIncoterms(dataIncoterms);
      
      // Filtrar solo productos de la familia "Gastos Exportación" (ID 7)
      const productosGastosExportacion = dataProductos.filter(
        (p) => Number(p.familiaProductoId) === 7
      );
      setProductos(productosGastosExportacion);
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
        incotermId: Number(data.incotermId),
        productoId: Number(data.productoId),
        esCargoVendedor: data.esCargoVendedor,
        aplicaSiempre: data.aplicaSiempre,
        observaciones: data.observaciones ? toUpperCaseSafe(data.observaciones) : null,
      };

      if (costoInicial?.id) {
        await actualizarCostoExportacionPorIncoterm(costoInicial.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Costo actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearCostoExportacionPorIncoterm(payload);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Costo creado correctamente",
          life: 3000,
        });
      }

      reset();
      onSubmit();
    } catch (error) {
      let mensajeError = "Error al guardar el costo";

      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            mensajeError = data.message || "Error de validación";
            break;
          case 409:
            mensajeError = data.message || "Ya existe este costo para el Incoterm y producto seleccionados";
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
      {/* Incoterm */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="incotermId" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
          Incoterm *
        </label>
        <Controller
          name="incotermId"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              id="incotermId"
              options={incoterms.map((i) => ({ 
                label: `${i.codigo} - ${i.nombre}`, 
                value: i.id 
              }))}
              placeholder="Seleccionar Incoterm"
              filter
              filterBy="label"
              style={{ width: "100%" }}
              className={errors.incotermId ? "p-invalid" : ""}
              disabled={loading}
            />
          )}
        />
        {errors.incotermId && (
          <small className="p-error">{errors.incotermId.message}</small>
        )}
      </div>

      {/* Producto (Costo) */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="productoId" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
          Costo (Producto de Gastos Exportación) *
        </label>
        <Controller
          name="productoId"
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              id="productoId"
              options={productos.map((p) => ({ 
                label: p.nombre, 
                value: p.id 
              }))}
              placeholder="Seleccionar costo"
              filter
              filterBy="label"
              style={{ width: "100%" }}
              className={errors.productoId ? "p-invalid" : ""}
              disabled={loading}
            />
          )}
        />
        {errors.productoId && (
          <small className="p-error">{errors.productoId.message}</small>
        )}
        <small style={{ display: "block", marginTop: "0.25rem", color: "#6c757d" }}>
          Solo se muestran productos de la familia "Gastos Exportación"
        </small>
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="esCargoVendedor"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="esCargoVendedor"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="esCargoVendedor" style={{ fontWeight: "bold" }}>
            Es Cargo del Vendedor
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Controller
            name="aplicaSiempre"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                inputId="aplicaSiempre"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked)}
                disabled={loading}
              />
            )}
          />
          <label htmlFor="aplicaSiempre" style={{ fontWeight: "bold" }}>
            Aplica Siempre
          </label>
        </div>
      </div>

      {/* Observaciones */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="observaciones" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
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
              style={{ width: "100%", textTransform: "uppercase" }}
              placeholder="INGRESE OBSERVACIONES"
              disabled={loading}
            />
          )}
        />
      </div>

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
          label={costoInicial?.id ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default CostoExportacionPorIncotermForm;