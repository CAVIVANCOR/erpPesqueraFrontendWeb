/**
 * Formulario para Tarifa de Costo de Exportación por Ruta
 * Permite crear/editar tarifas específicas por ruta
 * @module components/incoterm/TarifaRutaForm
 */

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import {
  crearTarifaCostoExportacionRuta,
  actualizarTarifaCostoExportacionRuta,
} from "../../api/tarifaCostoExportacionRuta";
import { getPaises } from "../../api/pais";
import { getPuertosPesca } from "../../api/puertoPesca";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getMonedas } from "../../api/moneda";
import AuditInfo from "../shared/AuditInfo";

/**
 * Esquema de validación YUP
 */
const esquemaValidacion = yup.object().shape({
  puertoOrigenId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  puertoDestinoId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  paisOrigenId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  paisDestinoId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  proveedorId: yup
    .number()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  monedaId: yup
    .number()
    .required("La moneda es obligatoria")
    .typeError("Debe seleccionar una moneda"),
  valorVenta: yup
    .number()
    .required("El valor de venta es obligatorio")
    .positive("El valor debe ser mayor a cero")
    .typeError("Debe ingresar un valor válido"),
  fechaVigenciaDesde: yup.date().required("La fecha de vigencia es obligatoria"),
  fechaVigenciaHasta: yup.date().nullable(),
  activo: yup.boolean().required(),
  observaciones: yup.string().nullable(),
});

/**
 * Componente TarifaRutaForm
 */
const TarifaRutaForm = ({
  tarifa,
  costoIncotermId,
  onSave,
  onCancel,
  toast,
}) => {
  const modoEdicion = Boolean(tarifa?.id);
  const [paises, setPaises] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configuración de React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      puertoOrigenId: null,
      puertoDestinoId: null,
      paisOrigenId: null,
      paisDestinoId: null,
      proveedorId: null,
      monedaId: null,
      valorVenta: null,
      fechaVigenciaDesde: new Date(),
      fechaVigenciaHasta: null,
      activo: true,
      observaciones: null,
    },
  });

  /**
   * Carga los datos necesarios para el formulario
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataPaises, dataPuertos, dataProveedores, dataMonedas] = await Promise.all([
        getPaises(),
        getPuertosPesca(),
        getEntidadesComerciales(),
        getMonedas(),
      ]);

      setPaises(dataPaises.filter((p) => p.activo));
      setPuertos(dataPuertos.filter((p) => p.activo));
      setProveedores(dataProveedores.filter((p) => p.activo));
      setMonedas(dataMonedas.filter((m) => m.activo));
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos del formulario",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos y setear valores en modo edición
   */
  useEffect(() => {
    cargarDatos();

    if (modoEdicion && tarifa) {
      setValue("puertoOrigenId", tarifa.puertoOrigenId ? Number(tarifa.puertoOrigenId) : null);
      setValue("puertoDestinoId", tarifa.puertoDestinoId ? Number(tarifa.puertoDestinoId) : null);
      setValue("paisOrigenId", tarifa.paisOrigenId ? Number(tarifa.paisOrigenId) : null);
      setValue("paisDestinoId", tarifa.paisDestinoId ? Number(tarifa.paisDestinoId) : null);
      setValue("proveedorId", tarifa.proveedorId ? Number(tarifa.proveedorId) : null);
      setValue("monedaId", Number(tarifa.monedaId));
      setValue("valorVenta", Number(tarifa.valorVenta));
      setValue("fechaVigenciaDesde", new Date(tarifa.fechaVigenciaDesde));
      setValue("fechaVigenciaHasta", tarifa.fechaVigenciaHasta ? new Date(tarifa.fechaVigenciaHasta) : null);
      setValue("activo", tarifa.activo);
      setValue("observaciones", tarifa.observaciones);
    } else {
      reset({
        puertoOrigenId: null,
        puertoDestinoId: null,
        paisOrigenId: null,
        paisDestinoId: null,
        proveedorId: null,
        monedaId: null,
        valorVenta: null,
        fechaVigenciaDesde: new Date(),
        fechaVigenciaHasta: null,
        activo: true,
        observaciones: null,
      });
    }
  }, [tarifa, modoEdicion, setValue, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      // Normalización de datos
      const datosNormalizados = {
        costoIncotermId: Number(costoIncotermId),
        puertoOrigenId: data.puertoOrigenId ? Number(data.puertoOrigenId) : null,
        puertoDestinoId: data.puertoDestinoId ? Number(data.puertoDestinoId) : null,
        paisOrigenId: data.paisOrigenId ? Number(data.paisOrigenId) : null,
        paisDestinoId: data.paisDestinoId ? Number(data.paisDestinoId) : null,
        proveedorId: data.proveedorId ? Number(data.proveedorId) : null,
        monedaId: Number(data.monedaId),
        valorVenta: Number(data.valorVenta),
        fechaVigenciaDesde: data.fechaVigenciaDesde,
        fechaVigenciaHasta: data.fechaVigenciaHasta,
        activo: Boolean(data.activo),
        observaciones: data.observaciones,
      };

      if (modoEdicion) {
        await actualizarTarifaCostoExportacionRuta(tarifa.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tarifa por ruta actualizada correctamente",
        });
      } else {
        await crearTarifaCostoExportacionRuta(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tarifa por ruta creada correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar tarifa por ruta:", error);

      let mensajeError = "Error al guardar la tarifa por ruta";

      if (error.response?.status === 400) {
        mensajeError = error.response?.data?.message || "Datos inválidos. Verifique la información ingresada";
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
        {/* SECCIÓN: RUTA */}
        <div style={{ marginBottom: "1rem" }}>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Definición de Ruta
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* País Origen */}
            <div>
              <label htmlFor="paisOrigenId" className="font-bold">
                País Origen
              </label>
              <Controller
                name="paisOrigenId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="paisOrigenId"
                    value={field.value}
                    options={paises.map((p) => ({
                      label: p.nombre,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar país"
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* Puerto Origen */}
            <div>
              <label htmlFor="puertoOrigenId" className="font-bold">
                Puerto Origen
              </label>
              <Controller
                name="puertoOrigenId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="puertoOrigenId"
                    value={field.value}
                    options={puertos.map((p) => ({
                      label: p.nombre,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar puerto"
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* País Destino */}
            <div>
              <label htmlFor="paisDestinoId" className="font-bold">
                País Destino
              </label>
              <Controller
                name="paisDestinoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="paisDestinoId"
                    value={field.value}
                    options={paises.map((p) => ({
                      label: p.nombre,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar país"
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* Puerto Destino */}
            <div>
              <label htmlFor="puertoDestinoId" className="font-bold">
                Puerto Destino
              </label>
              <Controller
                name="puertoDestinoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="puertoDestinoId"
                    value={field.value}
                    options={puertos.map((p) => ({
                      label: p.nombre,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar puerto"
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN: TARIFA */}
        <div style={{ marginBottom: "1rem" }}>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Tarifa
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Proveedor */}
            <div>
              <label htmlFor="proveedorId" className="font-bold">
                Proveedor
              </label>
              <Controller
                name="proveedorId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="proveedorId"
                    value={field.value}
                    options={proveedores.map((p) => ({
                      label: p.razonSocial,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar proveedor"
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            {/* Moneda */}
            <div>
              <label htmlFor="monedaId" className="font-bold">
                Moneda *
              </label>
              <Controller
                name="monedaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="monedaId"
                    value={field.value}
                    options={monedas.map((m) => ({
                      label: `${m.codigoSunat} - ${m.nombreLargo}`,
                      value: Number(m.id),
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionar moneda"
                    className={getFormErrorClass("monedaId")}
                    filter
                    showClear
                    disabled={isSubmitting || loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.monedaId && (
                <small className="p-error">{errors.monedaId.message}</small>
              )}
            </div>

            {/* Valor Venta */}
            <div>
              <label htmlFor="valorVenta" className="font-bold">
                Valor Venta *
              </label>
              <Controller
                name="valorVenta"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="valorVenta"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    placeholder="0.00"
                    className={getFormErrorClass("valorVenta")}
                    disabled={isSubmitting || loading}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.valorVenta && (
                <small className="p-error">{errors.valorVenta.message}</small>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN: VIGENCIA */}
        <div style={{ marginBottom: "1rem" }}>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Vigencia
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Fecha Vigencia Desde */}
            <div>
              <label htmlFor="fechaVigenciaDesde" className="font-bold">
                Vigente Desde *
              </label>
              <Controller
                name="fechaVigenciaDesde"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVigenciaDesde"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className={getFormErrorClass("fechaVigenciaDesde")}
                    disabled={isSubmitting || loading}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.fechaVigenciaDesde && (
                <small className="p-error">{errors.fechaVigenciaDesde.message}</small>
              )}
            </div>

            {/* Fecha Vigencia Hasta */}
            <div>
              <label htmlFor="fechaVigenciaHasta" className="font-bold">
                Vigente Hasta
              </label>
              <Controller
                name="fechaVigenciaHasta"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVigenciaHasta"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    disabled={isSubmitting || loading}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
              <small style={{ display: "block", marginTop: "0.25rem", color: "#6c757d" }}>
                Dejar vacío para vigencia indefinida
              </small>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="observaciones" className="font-bold">
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales..."
                disabled={isSubmitting || loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
        </div>

        {/* Estado Activo */}
        <div style={{ marginBottom: "1rem" }}>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "ACTIVO" : "INACTIVO"}
                className={field.value ? "p-button-primary" : "p-button-danger"}
                onClick={() => field.onChange(!field.value)}
                disabled={isSubmitting || loading}
                style={{ width: "200px" }}
              />
            )}
          />
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
            {modoEdicion && <AuditInfo data={tarifa} />}
          </div>

          {/* BOTONES */}
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              onClick={onCancel}
              disabled={isSubmitting || loading}
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
              disabled={isSubmitting || loading}
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

export default TarifaRutaForm;