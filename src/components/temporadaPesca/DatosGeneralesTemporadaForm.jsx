/**
 * DatosGeneralesTemporadaForm.jsx
 *
 * Componente Card para gestionar los datos generales de una temporada de pesca.
 * Incluye campos básicos de identificación, fechas, cuotas y configuración.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Message } from "primereact/message";
import { getEmbarcaciones } from "../../api/embarcacion";
import { crearFaenaPesca } from "../../api/faenaPesca";

export default function DatosGeneralesTemporadaForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  empresas = [],
  bahiasComerciales = [],
  motoristas = [],
  patrones = [],
  estadosTemporada = [],
  empresaSeleccionada,
  defaultValues = {},
  onIniciarTemporada,
}) {
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const empresaWatched = watch("empresaId");

  // Watch para generar nombre automáticamente
  const idWatched = watch("id");
  const numeroResolucionWatched = watch("numeroResolucion");

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Autocompletar BahiaId cuando cambie la empresa
  useEffect(() => {
    if (empresaWatched) {
      autocompletarBahiaId(empresaWatched);
    } else {
      setValue("BahiaId", null);
    }
  }, [empresaWatched, setValue, bahiasComerciales]);

  // Generar nombre automáticamente cuando cambien id o numeroResolucion
  useEffect(() => {
    if (idWatched && numeroResolucionWatched) {
      const nombreGenerado = `Temporada Pesca - ${idWatched} - ${numeroResolucionWatched}`;
      setValue("nombre", nombreGenerado);
    } else if (idWatched) {
      const nombreGenerado = `Temporada Pesca - ${idWatched}`;
      setValue("nombre", nombreGenerado);
    }
  }, [idWatched, numeroResolucionWatched, setValue]);

  const cargarDatos = async () => {
    try {
      // Solo cargar embarcaciones, el personal ya viene como props
      const embarcacionesData = await getEmbarcaciones();
      setEmbarcaciones(embarcacionesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const autocompletarBahiaId = async (empresaId) => {
    try {
      // Solo autocompletar si no hay valor previo
      const valorActual = getValues("BahiaId");
      if (valorActual) return;

      // Usar directamente el prop bahiasComerciales en lugar de filtrar personal
      if (bahiasComerciales.length === 1) {
        const valorCalculado = Number(bahiasComerciales[0].id);
        setValue("BahiaId", valorCalculado);
      }
    } catch (error) {
      console.error("Error al autocompletar BahiaId:", error);
    }
  };

  // Opciones normalizadas para dropdowns
  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial || empresa.nombre,
    value: Number(empresa.id),
  }));

  // Convertir bahías comerciales a opciones para dropdown
  const bahiasComercialesOptions = bahiasComerciales.map((persona) => ({
    label: persona.nombres + " " + persona.apellidos,
    value: Number(persona.id),
  }));

  const estadosTemporadaOptions = estadosTemporada.map((estado) => ({
    label: estado.descripcion,
    value: Number(estado.id),
  }));

  return (
    <Card
      title="Datos Generales de la Temporada"
      className="mb-4"
      pt={{
        body: { className: "pt-0" },
        content: { className: "pb-0" },
      }}
    >
      <div className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Empresa */}
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId" className="font-semibold">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: "La empresa es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={empresasOptions}
                  placeholder="Seleccione una empresa"
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  className={classNames({ "p-invalid": errors.empresaId })}
                />
              )}
            />
            {errors.empresaId && (
              <Message severity="error" text={errors.empresaId.message} />
            )}
          </div>

          {/* Bahía */}
          <div style={{ flex: 1 }}>
            <label htmlFor="BahiaId" className="font-semibold">
              Bahía Comercial *
            </label>
            <Controller
              name="BahiaId"
              control={control}
              rules={{ required: "La bahía comercial es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="BahiaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={bahiasComercialesOptions}
                  placeholder={
                    empresaSeleccionada
                      ? "Seleccione una bahía comercial"
                      : "Primero seleccione empresa"
                  }
                  filter
                  showClear
                  disabled={!empresaSeleccionada}
                  style={{ fontWeight: "bold" }}
                  className={classNames({ "p-invalid": errors.BahiaId })}
                />
              )}
            />
            {errors.BahiaId && (
              <Message severity="error" text={errors.BahiaId.message} />
            )}
          </div>
          {/* Número de Resolución */}
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroResolucion" className="font-semibold">
              Número de Resolución
            </label>
            <Controller
              name="numeroResolucion"
              control={control}
              render={({ field }) => (
                <InputText
                  id="numeroResolucion"
                  {...field}
                  placeholder="Ej: R.M. N° 123-2024-PRODUCE"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": errors.numeroResolucion,
                  })}
                />
              )}
            />
            <small className="text-muted">
              Número de la resolución ministerial
            </small>
          </div>
          {/* Estado de Temporada */}
          <div style={{ flex: 1 }}>
            <label htmlFor="estadoTemporadaId" className="font-semibold">
              Estado de Temporada *
            </label>
            <Controller
              name="estadoTemporadaId"
              control={control}
              rules={{ required: "El estado es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="estadoTemporadaId"
                  {...field}
                  value={field.value ? Number(field.value) : null}
                  options={estadosTemporadaOptions}
                  placeholder="Seleccione un estado"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": errors.estadoTemporadaId,
                  })}
                />
              )}
            />
            {errors.estadoTemporadaId && (
              <Message
                severity="error"
                text={errors.estadoTemporadaId.message}
              />
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
          {/* Fecha de Inicio */}
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaInicio" className="font-semibold">
              Fecha de Inicio *
            </label>
            <Controller
              name="fechaInicio"
              control={control}
              rules={{
                required: "La fecha de inicio es obligatoria",
                validate: (value) => {
                  const fin = watch("fechaFin");
                  if (fin && value >= fin) {
                    return "La fecha de inicio debe ser anterior a la fecha de fin";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaInicio"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha de inicio"
                  showIcon
                  inputStyle={{ fontWeight: "bold" }}
                  className={classNames({ "p-invalid": errors.fechaInicio })}
                />
              )}
            />
            {errors.fechaInicio && (
              <Message severity="error" text={errors.fechaInicio.message} />
            )}
          </div>

          {/* Fecha de Fin */}
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaFin" className="font-semibold">
              Fecha de Fin *
            </label>
            <Controller
              name="fechaFin"
              control={control}
              rules={{
                required: "La fecha de fin es obligatoria",
                validate: (value) => {
                  const inicio = watch("fechaInicio");
                  if (inicio && value <= inicio) {
                    return "La fecha de fin debe ser posterior a la fecha de inicio";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <Calendar
                  id="fechaFin"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha de fin"
                  showIcon
                  inputStyle={{ fontWeight: "bold" }}
                  className={classNames({ "p-invalid": errors.fechaFin })}
                />
              )}
            />
            {errors.fechaFin && (
              <Message severity="error" text={errors.fechaFin.message} />
            )}
          </div>
          {/* Cuota Propia */}
          <div style={{ flex: 1 }}>
            <label htmlFor="cuotaPropiaTon" className="font-semibold">
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
              <Message severity="error" text={errors.cuotaPropiaTon.message} />
            )}
          </div>

          {/* Cuota Alquilada */}
          <div style={{ flex: 1 }}>
            <label htmlFor="cuotaAlquiladaTon" className="font-semibold">
              Cuota Alquilada
            </label>
            <Controller
              name="cuotaAlquiladaTon"
              control={control}
              rules={{
                min: { value: 0, message: "La cuota no puede ser negativa" },
              }}
              render={({ field }) => (
                <InputNumber
                  id="cuotaAlquiladaTon"
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
                    "p-invalid": errors.cuotaAlquiladaTon,
                  })}
                />
              )}
            />
            {errors.cuotaAlquiladaTon && (
              <Message
                severity="error"
                text={errors.cuotaAlquiladaTon.message}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
