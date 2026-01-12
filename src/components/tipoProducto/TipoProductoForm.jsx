/**
 * Formulario para gestión de Tipos de Producto
 * Adaptado al modelo backend: nombre (único), descripcion, activo, paraCompras, paraVentas
 * NUEVOS CAMPOS: especificacionesCompra, especificacionesVenta, validezOfertaCompra, validezOfertaVenta
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
import { classNames } from "primereact/utils";
import { getSubfamiliasProducto } from "../../api/subfamiliaProducto";

const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .trim(),
  descripcion: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  subfamiliaId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  activo: yup.boolean().default(true),
  paraCompras: yup.boolean().default(false),
  paraVentas: yup.boolean().default(false),
  especificacionesCompra: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  especificacionesVenta: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  validezOfertaCompra: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  validezOfertaVenta: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
});

const TipoProductoForm = ({ tipoProducto, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [subfamilias, setSubfamilias] = useState([]);
  const [loadingSubfamilias, setLoadingSubfamilias] = useState(false);
  const esEdicion = !!tipoProducto;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: "",
      descripcion: "",
      subfamiliaId: null,
      activo: true,
      paraCompras: false,
      paraVentas: false,
      especificacionesCompra: "",
      especificacionesVenta: "",
      validezOfertaCompra: "",
      validezOfertaVenta: "",
    },
  });

  useEffect(() => {
    cargarSubfamilias();
  }, []);

  const cargarSubfamilias = async () => {
    try {
      setLoadingSubfamilias(true);
      const data = await getSubfamiliasProducto();
      setSubfamilias(data);
    } catch (error) {
      console.error("Error al cargar subfamilias:", error);
    } finally {
      setLoadingSubfamilias(false);
    }
  };

  useEffect(() => {
    if (tipoProducto) {
      setValue("nombre", tipoProducto.nombre || "");
      setValue("descripcion", tipoProducto.descripcion || "");
      setValue("subfamiliaId", tipoProducto.subfamiliaId ? Number(tipoProducto.subfamiliaId) : null);
      setValue("activo", tipoProducto.activo !== undefined ? tipoProducto.activo : true);
      setValue("paraCompras", tipoProducto.paraCompras || false);
      setValue("paraVentas", tipoProducto.paraVentas || false);
      setValue("especificacionesCompra", tipoProducto.especificacionesCompra || "");
      setValue("especificacionesVenta", tipoProducto.especificacionesVenta || "");
      setValue("validezOfertaCompra", tipoProducto.validezOfertaCompra || "");
      setValue("validezOfertaVenta", tipoProducto.validezOfertaVenta || "");
    } else {
      reset({
        nombre: "",
        descripcion: "",
        subfamiliaId: null,
        activo: true,
        paraCompras: false,
        paraVentas: false,
        especificacionesCompra: "",
        especificacionesVenta: "",
        validezOfertaCompra: "",
        validezOfertaVenta: "",
      });
    }
  }, [tipoProducto, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim() || null,
        subfamiliaId: data.subfamiliaId ? Number(data.subfamiliaId) : null,
        activo: data.activo,
        paraCompras: data.paraCompras,
        paraVentas: data.paraVentas,
        especificacionesCompra: data.especificacionesCompra?.trim() || null,
        especificacionesVenta: data.especificacionesVenta?.trim() || null,
        validezOfertaCompra: data.validezOfertaCompra?.trim() || null,
        validezOfertaVenta: data.validezOfertaVenta?.trim() || null,
      };
      
      onGuardar(datosNormalizados);
    } catch (error) {
      console.error("Error al guardar tipo de producto:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo Nombre */}
        <div className="p-col-12 p-field">
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
                placeholder="Ingrese el nombre"
                className={getFieldClass("nombre")}
                style={{ textTransform: 'uppercase' }}
                autoFocus
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error p-d-block">{errors.nombre.message}</small>
          )}
        </div>

        {/* Campo Subfamilia */}
        <div className="p-col-12 p-field">
          <label htmlFor="subfamiliaId" className="p-d-block">
            Subfamilia
          </label>
          <Controller
            name="subfamiliaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="subfamiliaId"
                value={field.value}
                options={subfamilias.map((s) => ({
                  label: s.nombre,
                  value: Number(s.id),
                }))}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione una subfamilia"
                className={getFieldClass("subfamiliaId")}
                filter
                showClear
                loading={loadingSubfamilias}
                emptyMessage="No hay subfamilias disponibles"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            )}
          />
          {errors.subfamiliaId && (
            <small className="p-error p-d-block">{errors.subfamiliaId.message}</small>
          )}
        </div>

        {/* Campo Descripción */}
        <div className="p-col-12 p-field">
          <label htmlFor="descripcion" className="p-d-block">
            Descripción
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="descripcion"
                {...field}
                placeholder="Descripción detallada del tipo de producto (opcional)"
                className={getFieldClass("descripcion")}
                rows={3}
                autoResize
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">{errors.descripcion.message}</small>
          )}
        </div>

        {/* Campo Especificaciones Compra */}
        <div className="p-col-12 p-field">
          <label htmlFor="especificacionesCompra" className="p-d-block">
            Especificaciones para Compras
          </label>
          <Controller
            name="especificacionesCompra"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="especificacionesCompra"
                {...field}
                placeholder="Especificaciones técnicas o condiciones para compras (opcional)"
                className={getFieldClass("especificacionesCompra")}
                rows={3}
                autoResize
              />
            )}
          />
          {errors.especificacionesCompra && (
            <small className="p-error p-d-block">{errors.especificacionesCompra.message}</small>
          )}
        </div>

        {/* Campo Especificaciones Venta */}
        <div className="p-col-12 p-field">
          <label htmlFor="especificacionesVenta" className="p-d-block">
            Especificaciones para Ventas
          </label>
          <Controller
            name="especificacionesVenta"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="especificacionesVenta"
                {...field}
                placeholder="Especificaciones técnicas o condiciones para ventas (opcional)"
                className={getFieldClass("especificacionesVenta")}
                rows={3}
                autoResize
              />
            )}
          />
          {errors.especificacionesVenta && (
            <small className="p-error p-d-block">{errors.especificacionesVenta.message}</small>
          )}
        </div>

        {/* Campo Validez Oferta Compra */}
        <div className="p-col-12 p-field">
          <label htmlFor="validezOfertaCompra" className="p-d-block">
            Validez de Oferta para Compras
          </label>
          <Controller
            name="validezOfertaCompra"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="validezOfertaCompra"
                {...field}
                placeholder="Ej: Oferta válida por 30 días calendario (opcional)"
                className={getFieldClass("validezOfertaCompra")}
                rows={2}
                autoResize
              />
            )}
          />
          {errors.validezOfertaCompra && (
            <small className="p-error p-d-block">{errors.validezOfertaCompra.message}</small>
          )}
        </div>

        {/* Campo Validez Oferta Venta */}
        <div className="p-col-12 p-field">
          <label htmlFor="validezOfertaVenta" className="p-d-block">
            Validez de Oferta para Ventas
          </label>
          <Controller
            name="validezOfertaVenta"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="validezOfertaVenta"
                {...field}
                placeholder="Ej: Oferta válida por 15 días hábiles (opcional)"
                className={getFieldClass("validezOfertaVenta")}
                rows={2}
                autoResize
              />
            )}
          />
          {errors.validezOfertaVenta && (
            <small className="p-error p-d-block">{errors.validezOfertaVenta.message}</small>
          )}
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-field">
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("activo")}
                />
                <label htmlFor="activo" className="p-checkbox-label">
                  Tipo de producto activo
                </label>
              </div>
            )}
          />
        </div>

        {/* Campo Para Compras */}
        <div className="p-col-12 p-field">
          <Controller
            name="paraCompras"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="paraCompras"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("paraCompras")}
                />
                <label htmlFor="paraCompras" className="p-checkbox-label">
                  Disponible para compras
                </label>
              </div>
            )}
          />
        </div>

        {/* Campo Para Ventas */}
        <div className="p-col-12 p-field">
          <Controller
            name="paraVentas"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="paraVentas"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("paraVentas")}
                />
                <label htmlFor="paraVentas" className="p-checkbox-label">
                  Disponible para ventas
                </label>
              </div>
            )}
          />
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
        />
      </div>
    </form>
  );
};

export default TipoProductoForm;