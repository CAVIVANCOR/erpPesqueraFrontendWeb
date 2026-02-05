/**
 * DatosGeneralesNovedadForm.jsx
 *
 * Componente Card para gestionar los datos generales de una novedad de pesca consumo.
 * Incluye campos básicos de identificación, fechas y configuración.
 * Integra el CRUD de FaenaPescaConsumo siguiendo el patrón de DatosGeneralesTemporadaForm.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 2.1.0
 */
import React, { useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Message } from "primereact/message";
import DetalleFaenasConsumoCard from "./DetalleFaenasConsumoCard";
import { getNovedadPescaConsumoPorId } from "../../api/novedadPescaConsumo";

export default function DatosGeneralesNovedadForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  empresas = [],
  bahiasComerciales = [],
  motoristas = [],
  patrones = [],
  estadosNovedad = [],
  empresaSeleccionada,
  defaultValues = {},
  // Props para DetalleFaenasConsumoCard
  embarcaciones = [],
  boliches = [],
  puertos = [],
  unidadesNegocio = [],
  novedadData = null,
  onNovedadDataChange, // Callback para notificar cambios en datos de novedad
  readOnly = false,
}) {
  const detalleFaenasRef = useRef(null);

  // Estado para controlar actualizaciones de faenas
  const [faenasUpdateTrigger, setFaenasUpdateTrigger] = useState(0);

  const empresaWatched = watch("empresaId");

  // Watch para generar nombre automáticamente
  const idWatched = watch("id");
  const numeroResolucionWatched = watch("numeroResolucion");
  const referenciaExtraWatched = watch("referenciaExtra");

  // Watch para toneladas capturadas
  const toneladasCapturadas = watch("toneladasCapturadas");

  // Autocompletar BahiaId cuando cambie la empresa
  useEffect(() => {
    if (empresaWatched) {
      autocompletarBahiaId(empresaWatched);
    } else {
      setValue("BahiaId", null);
    }
  }, [empresaWatched, setValue, bahiasComerciales]);

  // Generar nombre automáticamente cuando cambien id, numeroResolucion o referenciaExtra
  useEffect(() => {
    let nombreGenerado = "";

    if (idWatched && numeroResolucionWatched) {
      nombreGenerado = `Novedad Pesca Consumo - ${idWatched} - ${numeroResolucionWatched}`;
    } else if (numeroResolucionWatched && numeroResolucionWatched.trim()) {
      // Para nuevas novedades sin ID, usar solo numeroResolucion
      nombreGenerado = `Novedad Pesca Consumo - ${numeroResolucionWatched}`;
    } else if (idWatched) {
      nombreGenerado = `Novedad Pesca Consumo - ${idWatched}`;
    }

    // Agregar referenciaExtra al final si existe
    if (referenciaExtraWatched && referenciaExtraWatched.trim()) {
      nombreGenerado = nombreGenerado
        ? `${nombreGenerado} - ${referenciaExtraWatched}`
        : referenciaExtraWatched;
    }

    if (nombreGenerado) {
      setValue("nombre", nombreGenerado);
    }
  }, [idWatched, numeroResolucionWatched, referenciaExtraWatched, setValue]);

  const autocompletarBahiaId = async (empresaId) => {
    try {
      // Autocompletar siempre que haya solo una bahía disponible
      if (bahiasComerciales.length === 1) {
        const valorCalculado = Number(bahiasComerciales[0].value);
        setValue("BahiaId", valorCalculado);
      }
    } catch (error) {
      console.error("Error al autocompletar BahiaId:", error);
    }
  };

  // Función para recargar datos de novedad
  const recargarDatosNovedad = async () => {
    if (!novedadData?.id) {
      return;
    }
    try {
      const novedadActualizada = await getNovedadPescaConsumoPorId(
        novedadData.id,
      );
      const valorASetear = novedadActualizada.toneladasCapturadas || 0;
      setValue("toneladasCapturadas", valorASetear);
      // Verificar si se actualizó
      const valorActual = getValues("toneladasCapturadas");
      // Notificar al componente padre sobre los cambios
      if (onNovedadDataChange) {
        onNovedadDataChange(novedadActualizada);
      }
    } catch (error) {
      console.error("Error al recargar datos de novedad:", error);
    }
  };
  // Escuchar evento personalizado para recargar datos
  useEffect(() => {
    const handleRefreshFaenas = () => {
      recargarDatosNovedad();
    };
    window.addEventListener("refreshFaenas", handleRefreshFaenas);
    return () => {
      window.removeEventListener("refreshFaenas", handleRefreshFaenas);
    };
  }, [novedadData?.id]);
  // Función para formatear opciones de empresa
  const formatearOpcionesEmpresa = (empresas) => {
    return empresas.map((empresa) => ({
      ...empresa,
      id: Number(empresa.id),
      label: `${empresa.ruc} - ${empresa.razonSocial}`,
    }));
  };
  // Función para formatear opciones de estado
  const formatearOpcionesEstado = (estados) => {
    const estadosFormateados = estados.map((estado) => ({
      id: Number(estado.id),
      label: estado.descripcion,
    }));
    return estadosFormateados;
  };

  const unidadesNegocioOptions = unidadesNegocio.map((unidad) => ({
    label: unidad.nombre,
    value: Number(unidad.id),
  }));

  return (
    <Card
      title="Datos Generales de la Novedad"
      className="h-full"
      pt={{
        body: { className: "pb-0" },
        content: { className: "py-2" },
      }}
    >
      <div className="p-fluid">
        {/* Primera fila: Empresa, Bahía, Estado */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              htmlFor="empresaId"
              className="block text-900 font-medium mb-2"
            >
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: "La empresa es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={formatearOpcionesEmpresa(empresas)}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione una empresa"
                  className={classNames({ "p-invalid": errors.empresaId })}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="BahiaId"
              className="block text-900 font-medium mb-2"
            >
              Bahía Comercial *
            </label>
            <Controller
              name="BahiaId"
              control={control}
              rules={{ required: "La bahía comercial es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="BahiaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={bahiasComerciales}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione una bahía"
                  className={classNames({ "p-invalid": errors.BahiaId })}
                  filter
                  showClear
                  disabled={!empresaWatched}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.BahiaId && (
              <small className="p-error">{errors.BahiaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="estadoNovedadPescaConsumoId"
              className="block text-900 font-medium mb-2"
            >
              Estado *
            </label>
            <Controller
              name="estadoNovedadPescaConsumoId"
              control={control}
              rules={{ required: "El estado es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="estadoNovedadPescaConsumoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={formatearOpcionesEstado(estadosNovedad)}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione un estado"
                  className={classNames({
                    "p-invalid": errors.estadoNovedadPescaConsumoId,
                  })}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.estadoNovedadPescaConsumoId && (
              <small className="p-error">
                {errors.estadoNovedadPescaConsumoId.message}
              </small>
            )}
          </div>

          {/* Unidad de Negocio */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="unidadNegocioId"
              className="block text-900 font-medium mb-2"
            >
              Unidad de Negocio *
            </label>
            <Controller
              name="unidadNegocioId"
              control={control}
              rules={{ required: "La unidad de negocio es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="unidadNegocioId"
                  {...field}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("unidadNegocioId", e.value);
                  }}
                  options={unidadesNegocioOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione unidad de negocio"
                  filter
                  disabled={true}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": errors.unidadNegocioId,
                  })}
                />
              )}
            />
            {errors.unidadNegocioId && (
              <small className="p-error">
                {errors.unidadNegocioId.message}
              </small>
            )}
          </div>
        </div>

        {/* Tercera fila: Número de Resolución, Referencia Extra Fecha Inicio, Fecha Fin, Cuota Propia, Toneladas Capturadas */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Número de Resolución */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="numeroResolucion"
              className="block text-900 font-medium mb-2"
            >
              Número de Resolución *
            </label>
            <Controller
              name="numeroResolucion"
              control={control}
              rules={{ required: "El número de resolución es obligatorio" }}
              render={({ field }) => (
                <InputText
                  id="numeroResolucion"
                  {...field}
                  value={field.value?.toUpperCase() || ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  className={classNames({
                    "p-invalid": errors.numeroResolucion,
                  })}
                />
              )}
            />
            {errors.numeroResolucion && (
              <small className="p-error">
                {errors.numeroResolucion.message}
              </small>
            )}
          </div>

          {/* Referencia Extra */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="referenciaExtra"
              className="block text-900 font-medium mb-2"
            >
              Referencia Extra
            </label>
            <Controller
              name="referenciaExtra"
              control={control}
              render={({ field }) => (
                <InputText
                  id="referenciaExtra"
                  {...field}
                  value={field.value?.toUpperCase() || ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  className={classNames({
                    "p-invalid": errors.referenciaExtra,
                  })}
                />
              )}
            />
            {errors.referenciaExtra && (
              <small className="p-error">
                {errors.referenciaExtra.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="fechaInicio"
              className="block text-900 font-medium mb-2"
            >
              Fecha de Inicio *
            </label>
            <Controller
              name="fechaInicio"
              control={control}
              rules={{ required: "La fecha de inicio es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaInicio"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione fecha de inicio"
                  dateFormat="dd/mm/yy"
                  showIcon
                  className={classNames({ "p-invalid": errors.fechaInicio })}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.fechaInicio && (
              <small className="p-error">{errors.fechaInicio.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="fechaFin"
              className="block text-900 font-medium mb-2"
            >
              Fecha de Fin *
            </label>
            <Controller
              name="fechaFin"
              control={control}
              rules={{ required: "La fecha de fin es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaFin"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione fecha de fin"
                  dateFormat="dd/mm/yy"
                  showIcon
                  minDate={
                    watch("fechaInicio") ? new Date(watch("fechaInicio")) : null
                  }
                  className={classNames({ "p-invalid": errors.fechaFin })}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.fechaFin && (
              <small className="p-error">{errors.fechaFin.message}</small>
            )}
          </div>

          {/* Cuota Propia */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="cuotaPropiaTon"
              className="block text-900 font-medium mb-2"
            >
              Cuota Propia
            </label>
            <Controller
              name="cuotaPropiaTon"
              control={control}
              rules={{
                min: { value: 0, message: "La cuota no puede ser negativa" },
              }}
              render={({ field }) => (
                <InputNumber
                  id="cuotaPropiaTon"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  inputStyle={{ fontWeight: "bold" }}
                  min={0}
                  suffix=" Ton"
                  className={classNames({
                    "p-invalid": errors.cuotaPropiaTon,
                  })}
                />
              )}
            />
            {errors.cuotaPropiaTon && (
              <small className="p-error">{errors.cuotaPropiaTon.message}</small>
            )}
          </div>

          {/* Toneladas Capturadas */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="toneladasCapturadas"
              className="block text-900 font-medium mb-2"
            >
              Toneladas Capturadas
            </label>
            <Controller
              name="toneladasCapturadas"
              control={control}
              render={({ field }) => (
                <InputNumber
                  key={`toneladas-${faenasUpdateTrigger}`}
                  id="toneladasCapturadas"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.000"
                  mode="decimal"
                  minFractionDigits={3}
                  maxFractionDigits={3}
                  inputStyle={{ fontWeight: "bold" }}
                  min={0}
                  suffix=" Ton"
                  disabled
                />
              )}
            />
          </div>
        </div>

        {/* Card de Detalle de Faenas (solo si hay ID) - Integrado como en TemporadaPesca */}
        {novedadData?.id && (
          <div className="col-12">
            <DetalleFaenasConsumoCard
              ref={detalleFaenasRef}
              novedadPescaConsumo={novedadData}
              novedadPescaConsumoIniciada={
                novedadData.novedadPescaConsumoIniciada || false
              }
              embarcaciones={embarcaciones}
              boliches={boliches}
              puertos={puertos}
              motoristas={motoristas}
              patrones={patrones}
              bahiasComerciales={bahiasComerciales}
              onDataChange={onNovedadDataChange}
              updateTrigger={faenasUpdateTrigger}
              faenasUpdateTrigger={faenasUpdateTrigger}
              setFaenasUpdateTrigger={setFaenasUpdateTrigger}
            />
          </div>
        )}

        {/* Mensaje informativo si no hay ID */}
        {!novedadData?.id && (
          <div className="col-12">
            <Message
              severity="info"
              text="Guarde la novedad para poder gestionar las faenas de pesca consumo"
              className="w-full"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
