/**
 * Formulario para Costo de Exportación por Incoterm
 * Permite crear/editar costos asociados a un Incoterm
 * @module components/incoterm/CostoExportacionForm
 */

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import {
  crearCostoExportacionPorIncoterm,
  actualizarCostoExportacionPorIncoterm,
} from "../../api/costoExportacionPorIncoterm";
import { getProductos } from "../../api/producto";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getMonedas } from "../../api/moneda";
import { getDocRequeridaVentas } from "../../api/docRequeridaVentas";
import AuditInfo from "../shared/AuditInfo";

/**
 * Esquema de validación YUP
 */
const esquemaValidacion = yup.object().shape({
  productoId: yup
    .number()
    .required("El producto es obligatorio")
    .typeError("Debe seleccionar un producto"),
  esResponsabilidadVendedor: yup.boolean().required(),
  activo: yup.boolean().required(),
  esObligatorio: yup.boolean().required(),
  orden: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .typeError("El orden debe ser un número"),
  proveedorDefaultId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  monedaDefaultId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  valorVentaDefault: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  requiereDocumento: yup.boolean().required(),
  documentoAsociadoId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
});

/**
 * Componente CostoExportacionForm
 */
const CostoExportacionForm = ({
  costo,
  incotermId,
  onSave,
  onCancel,
  toast,
}) => {
  const modoEdicion = Boolean(costo?.id);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Configuración de React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      productoId: null,
      esResponsabilidadVendedor: true,
      activo: true,
      esObligatorio: true,
      orden: null,
      proveedorDefaultId: null,
      monedaDefaultId: null,
      valorVentaDefault: null,
      requiereDocumento: false,
      documentoAsociadoId: null,
    },
  });

  /**
   * Carga los productos de la familia "Gastos Exportación" (familiaId=7)
   */
  const cargarProductos = async () => {
    try {
      setLoadingProductos(true);
      const [dataProductos, dataProveedores, dataMonedas, dataDocumentos] = await Promise.all([
        getProductos(),
        getEntidadesComerciales(),
        getMonedas(),
        getDocRequeridaVentas(),
      ]);

      // Filtrar solo productos de familia "Gastos Exportación" (id=7)
      const productosGastosExportacion = dataProductos.filter(
        (p) => Number(p.familiaId) === 7
      );
      setProductos(productosGastosExportacion);

      // Filtrar solo proveedores activos
      const proveedoresActivos = dataProveedores.filter((p) => p.activo);
      setProveedores(proveedoresActivos);

      // Filtrar solo monedas activas
      const monedasActivas = dataMonedas.filter((m) => m.activo);
      setMonedas(monedasActivas);

      // Filtrar solo documentos activos
      const documentosActivos = dataDocumentos.filter((d) => d.activo);
      setDocumentos(documentosActivos);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos del formulario",
      });
    } finally {
      setLoadingProductos(false);
    }
  };

  /**
   * Efecto para cargar productos y datos en modo edición
   */
  useEffect(() => {
    cargarProductos();

    if (modoEdicion && costo) {
      setValue("productoId", Number(costo.productoId));
      setValue("esResponsabilidadVendedor", costo.esResponsabilidadVendedor);
      setValue("activo", costo.activo);
      setValue("esObligatorio", costo.esObligatorio);
      setValue("orden", costo.orden);
      setValue("proveedorDefaultId", costo.proveedorDefaultId ? Number(costo.proveedorDefaultId) : null);
      setValue("monedaDefaultId", costo.monedaDefaultId ? Number(costo.monedaDefaultId) : null);
      setValue("valorVentaDefault", costo.valorVentaDefault);
      setValue("requiereDocumento", costo.requiereDocumento ?? false);
      setValue("documentoAsociadoId", costo.documentoAsociadoId ? Number(costo.documentoAsociadoId) : null);
    } else {
      reset({
        productoId: null,
        esResponsabilidadVendedor: true,
        activo: true,
        esObligatorio: true,
        orden: null,
        proveedorDefaultId: null,
        monedaDefaultId: null,
        valorVentaDefault: null,
        requiereDocumento: false,
        documentoAsociadoId: null,
      });
    }
  }, [costo, modoEdicion, setValue, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      // Normalización de datos
      const datosNormalizados = {
        incotermId: Number(incotermId),
        productoId: Number(data.productoId),
        esResponsabilidadVendedor: Boolean(data.esResponsabilidadVendedor),
        activo: Boolean(data.activo),
        esObligatorio: Boolean(data.esObligatorio),
        orden: data.orden ? Number(data.orden) : null,
        proveedorDefaultId: data.proveedorDefaultId ? Number(data.proveedorDefaultId) : null,
        monedaDefaultId: data.monedaDefaultId ? Number(data.monedaDefaultId) : null,
        valorVentaDefault: data.valorVentaDefault ? Number(data.valorVentaDefault) : null,
        requiereDocumento: Boolean(data.requiereDocumento),
        documentoAsociadoId: data.documentoAsociadoId ? Number(data.documentoAsociadoId) : null,
      };

      if (modoEdicion) {
        await actualizarCostoExportacionPorIncoterm(
          costo.id,
          datosNormalizados
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Costo de exportación actualizado correctamente",
        });
      } else {
        await crearCostoExportacionPorIncoterm(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Costo de exportación creado correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar costo de exportación:", error);

      let mensajeError = "Error al guardar el costo de exportación";

      if (error.response?.status === 409) {
        mensajeError = "Este costo ya está asociado a este Incoterm";
      } else if (error.response?.status === 400) {
        mensajeError = "Datos inválidos. Verifique la información ingresada";
      } else if (error.response?.status === 500) {
        mensajeError = "Error interno del servidor. Intente nuevamente";
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
  };

  /**
   * Obtiene la clase CSS para campos con error
   */
  const getFormErrorClass = (fieldName) =>
    classNames({ "p-invalid": errors[fieldName] });

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {/* Producto */}
          <div style={{ flex: 1 }}>
            <label htmlFor="productoId" className="font-bold">
              Producto/Costo de Exportación *
            </label>
            <Controller
              name="productoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="productoId"
                  value={field.value}
                  options={productos.map((p) => ({
                    label: `${p.codigo} - ${p.descripcionArmada}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un producto"
                  className={getFormErrorClass("productoId")}
                  disabled={isSubmitting || loadingProductos}
                  filter
                  showClear
                  emptyMessage="No hay productos de gastos de exportación disponibles"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.productoId && (
              <small className="p-error">{errors.productoId.message}</small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {/* Responsable */}
          <div style={{ flex: 1 }}>
            <label htmlFor="esResponsabilidadVendedor" className="font-bold">
              Responsable del Costo *
            </label>
            <Controller
              name="esResponsabilidadVendedor"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="esResponsabilidadVendedor"
                  value={field.value}
                  options={[
                    { label: "VENDEDOR", value: true },
                    { label: "COMPRADOR", value: false },
                  ]}
                  onChange={(e) => field.onChange(e.value)}
                  disabled={isSubmitting}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="orden" className="font-bold">
              Orden
            </label>
            <Controller
              name="orden"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="orden"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="Orden de presentación"
                  disabled={isSubmitting}
                  min={0}
                  showButtons
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.orden && (
              <small className="p-error">{errors.orden.message}</small>
            )}
          </div>
        </div>

        {/* SECCIÓN: VALORES POR DEFECTO */}
        <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Valores por Defecto
          </h4>

          {/* Grid: Proveedor, Moneda, Valor */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Proveedor Default */}
            <div>
              <label htmlFor="proveedorDefaultId" className="font-bold">
                Proveedor
              </label>
              <Controller
                name="proveedorDefaultId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="proveedorDefaultId"
                    value={field.value}
                    options={proveedores.map((p) => ({
                      label: p.razonSocial,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar proveedor"
                    filter
                    showClear
                    disabled={isSubmitting}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* Moneda Default */}
            <div>
              <label htmlFor="monedaDefaultId" className="font-bold">
                Moneda 
              </label>
              <Controller
                name="monedaDefaultId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="monedaDefaultId"
                    value={field.value}
                    options={monedas.map((m) => ({
                      label: `${m.codigoSunat} - ${m.nombreLargo}`,
                      value: Number(m.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar moneda"
                    filter
                    showClear
                    disabled={isSubmitting}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* Valor Venta Default */}
            <div>
              <label htmlFor="valorVentaDefault" className="font-bold">
                Valor Venta
              </label>
              <Controller
                name="valorVentaDefault"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="valorVentaDefault"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    placeholder="0.00"
                    disabled={isSubmitting}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN: DOCUMENTO ASOCIADO */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="documentoAsociadoId" className="font-bold">
            Documento Asociado
          </label>
          <Controller
            name="documentoAsociadoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="documentoAsociadoId"
                value={field.value}
                options={documentos.map((d) => ({
                  label: d.nombre,
                  value: Number(d.id),
                }))}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccionar documento"
                filter
                showClear
                disabled={isSubmitting}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          <small style={{ display: "block", marginTop: "0.25rem", color: "#6c757d" }}>
            Documento requerido para este costo (opcional)
          </small>
        </div>

        {/* Orden y Obligatorio */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <Controller
              name="esObligatorio"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "OBLIGATORIO" : "OPCIONAL"}
                  className={
                    field.value ? "p-button-primary" : "p-button-secondary"
                  }
                  onClick={() => field.onChange(!field.value)}
                  disabled={isSubmitting}
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>
          {/* Estado Activo */}
          <div className="field">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "ACTIVO" : "INACTIVO"}
                  className={
                    field.value ? "p-button-primary" : "p-button-danger"
                  }
                  onClick={() => field.onChange(!field.value)}
                  disabled={isSubmitting}
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>
          {/* Requiere Documento */}
          <div className="field">
            <Controller
              name="requiereDocumento"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "REQUIERE DOC" : "NO REQUIERE DOC"}
                  className={
                    field.value ? "p-button-warning" : "p-button-secondary"
                  }
                  onClick={() => field.onChange(!field.value)}
                  disabled={isSubmitting}
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>
        </div>

        {/* Botones de acción e Información de Auditoría */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 8,
            marginTop: 18,
          }}
        >
          {/* INFORMACIÓN DE AUDITORÍA */}
          <div style={{ flex: 3 }}>
            {modoEdicion && <AuditInfo data={costo} />}
          </div>

          {/* BOTONES */}
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              onClick={onCancel}
              disabled={isSubmitting}
              className="p-button-warning"
              severity="warning"
              raised
              outlined
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              type="submit"
              label={
                isSubmitting ? (
                  <div className="flex align-items-center gap-2">
                    <ProgressSpinner
                      style={{ width: "16px", height: "16px" }}
                      strokeWidth="4"
                    />
                    <span>Guardando...</span>
                  </div>
                ) : modoEdicion ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )
              }
              icon={!isSubmitting ? "pi pi-check" : ""}
              className="p-button-success"
              disabled={isSubmitting}
              severity="success"
              raised
              outlined
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CostoExportacionForm;
