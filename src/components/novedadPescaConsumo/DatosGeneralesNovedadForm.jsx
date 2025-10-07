/**
 * DatosGeneralesNovedadForm.jsx
 *
 * Componente Card para gestionar los datos generales de una novedad de pesca consumo.
 * Incluye campos básicos de identificación, fechas y configuración.
 * Integra el CRUD de FaenaPescaConsumo siguiendo el patrón de DatosGeneralesTemporadaForm.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 2.0.0
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
  novedadData = null,
  onNovedadDataChange, // Callback para notificar cambios en datos de novedad
}) {

  const detalleFaenasRef = useRef(null);

  // Estado para controlar actualizaciones de faenas
  const [faenasUpdateTrigger, setFaenasUpdateTrigger] = useState(0);

  const empresaWatched = watch("empresaId");
  const fechaInicioWatched = watch("fechaInicio");

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
                  options={bahiasComerciales} // ← Usar directamente sin formatear
                  optionLabel="label"
                  optionValue="value" // ← CAMBIAR de "id" a "value"
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
        </div>
        {/* Segunda fila: Nombre, Fecha Inicio, Fecha Fin */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="nombre" className="block text-900 font-medium mb-2">
              Nombre de la Novedad *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{
                required: "El nombre es obligatorio",
                minLength: {
                  value: 5,
                  message: "El nombre debe tener al menos 5 caracteres",
                },
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  placeholder="Nombre de la novedad"
                  className={classNames({ "p-invalid": errors.nombre })}
                  style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                />
              )}
            />
            {errors.nombre && (
              <small className="p-error">{errors.nombre.message}</small>
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
                  id="toneladasCapturadas"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="0.00"
                  suffix=" TM"
                  className={classNames({
                    "p-invalid": errors.toneladasCapturadas,
                  })}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.toneladasCapturadas && (
              <small className="p-error">
                {errors.toneladasCapturadas.message}
              </small>
            )}
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
              bahiasComerciales={bahiasComerciales} // ← AGREGAR
              onDataChange={onNovedadDataChange}
              updateTrigger={faenasUpdateTrigger}
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
