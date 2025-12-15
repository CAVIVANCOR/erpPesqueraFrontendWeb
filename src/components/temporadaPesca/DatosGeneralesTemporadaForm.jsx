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

import React, { useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Message } from "primereact/message";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getTemporadaPescaPorId } from "../../api/temporadaPesca";
import { getDetallesCuotaPesca } from "../../api/detCuotaPesca";
import DetalleFaenasPescaCard from "./DetalleFaenasPescaCard";

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
  // Nuevos props para DetalleFaenasPescaCard
  embarcaciones = [],
  boliches = [],
  puertos = [],
  temporadaData = null,
  onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
  onFaenasChange, // Callback para notificar cambios en faenas
  readOnly = false,
}) {
  const detalleFaenasRef = useRef(null);

  // Estado para controlar actualizaciones de faenas
  const [faenasUpdateTrigger, setFaenasUpdateTrigger] = useState(0);

  const empresaWatched = watch("empresaId");
  const limiteMaximoCapturaTnWatched = watch("limiteMaximoCapturaTn");

  // Watch para generar nombre automáticamente
  const idWatched = watch("id");
  const numeroResolucionWatched = watch("numeroResolucion");

  // Watch para toneladas capturadas
  const toneladasCapturadasTemporada = watch("toneladasCapturadasTemporada");

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
    } else if (numeroResolucionWatched && numeroResolucionWatched.trim()) {
      // Para nuevas temporadas sin ID, usar solo numeroResolucion
      const nombreGenerado = `Temporada Pesca - ${numeroResolucionWatched}`;
      setValue("nombre", nombreGenerado);
    } else if (idWatched) {
      const nombreGenerado = `Temporada Pesca - ${idWatched}`;
      setValue("nombre", nombreGenerado);
    } else {
    }
  }, [idWatched, numeroResolucionWatched, setValue]);

  // Calcular cuotas automáticamente cuando cambien empresa o límite máximo
  useEffect(() => {
    const calcularCuotas = async () => {
      if (!empresaWatched || !limiteMaximoCapturaTnWatched) {
        // Si no hay empresa o límite, limpiar cuotas
        setValue("cuotaPropiaTon", null);
        setValue("cuotaAlquiladaTon", null);
        return;
      }

      try {
        // Obtener detalles de cuota activos de la empresa
        const detalles = await getDetallesCuotaPesca({ empresaId: empresaWatched });
        const detallesActivos = detalles.filter(d => d.activo);

        // Sumar porcentajes de cuotas propias
        const totalPropiaPorcentaje = detallesActivos
          .filter(d => d.cuotaPropia)
          .reduce((sum, d) => sum + Number(d.porcentajeCuota), 0);

        // Sumar porcentajes de cuotas alquiladas
        const totalAlquiladaPorcentaje = detallesActivos
          .filter(d => !d.cuotaPropia)
          .reduce((sum, d) => sum + Number(d.porcentajeCuota), 0);

        // Calcular toneladas
        const limite = Number(limiteMaximoCapturaTnWatched);
        const cuotaPropia = limite * (totalPropiaPorcentaje / 100);
        const cuotaAlquilada = limite * (totalAlquiladaPorcentaje / 100);

        // Actualizar campos
        setValue("cuotaPropiaTon", cuotaPropia);
        setValue("cuotaAlquiladaTon", cuotaAlquilada);
      } catch (error) {
        console.error("Error al calcular cuotas:", error);
        setValue("cuotaPropiaTon", null);
        setValue("cuotaAlquiladaTon", null);
      }
    };

    calcularCuotas();
  }, [empresaWatched, limiteMaximoCapturaTnWatched, setValue]);

  const cargarDatos = async () => {
    try {
      // Solo cargar embarcaciones, el personal ya viene como props
      const embarcacionesData = await getEmbarcaciones();
      // setEmbarcaciones(embarcacionesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const autocompletarBahiaId = async (empresaId) => {
    try {
      // Autocompletar siempre que haya solo una bahía disponible
      if (bahiasComerciales.length === 1) {
        const valorCalculado = Number(bahiasComerciales[0].id);
        setValue("BahiaId", valorCalculado);
      }
    } catch (error) {
      console.error("Error al autocompletar BahiaId:", error);
    }
  };

  // Función para recargar datos de temporada
  const recargarDatosTemporada = async () => {
    if (!temporadaData?.id) {
      return;
    }
    
    try {
      const temporadaActualizada = await getTemporadaPescaPorId(temporadaData.id);
      const valorASetear = temporadaActualizada.toneladasCapturadas || temporadaActualizada.toneladasCapturadasTemporada || 0;
      setValue("toneladasCapturadasTemporada", valorASetear);
      
      // Verificar si se actualizó
      const valorActual = getValues("toneladasCapturadasTemporada");
      
      // Notificar cambios al componente padre
      if (onTemporadaDataChange) {
        onTemporadaDataChange(temporadaActualizada);
      }
    } catch (error) {
      console.error("❌ Error al recargar datos de temporada:", error);
    }
  };

  // useEffect para recargar datos cuando cambien las faenas
  useEffect(() => {
    if (faenasUpdateTrigger > 0) {
      recargarDatosTemporada();
    }
  }, [faenasUpdateTrigger]);

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
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("empresaId", e.value);
                  }}
                  options={empresasOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione una empresa"
                  filter
                  showClear
                  disabled={readOnly}
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
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("BahiaId", e.value);
                  }}
                  options={bahiasComercialesOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione una bahía comercial"
                  filter
                  showClear
                  disabled={readOnly || !empresaSeleccionada}
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
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    field.onChange(upperValue);
                    setValue("numeroResolucion", upperValue);
                  }}
                  placeholder="Ingrese el número de resolución"
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": errors.numeroResolucion,
                  })}
                />
              )}
            />
            {errors.numeroResolucion && (
              <Message
                severity="error"
                text={errors.numeroResolucion.message}
              />
            )}
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
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione un estado"
                  disabled={readOnly}
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
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("fechaInicio", e.value);
                  }}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Seleccione fecha de inicio"
                  showButtonBar
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
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
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("fechaFin", e.value);
                  }}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Seleccione fecha de fin"
                  showButtonBar
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                  className={classNames({ "p-invalid": errors.fechaFin })}
                />
              )}
            />
            {errors.fechaFin && (
              <Message severity="error" text={errors.fechaFin.message} />
            )}
          </div>
          {/* Límite Máximo de Captura */}
          <div style={{ flex: 1 }}>
            <label htmlFor="limiteMaximoCapturaTn" className="font-semibold">
              Máximo Captura*
            </label>
            <Controller
              name="limiteMaximoCapturaTn"
              control={control}
              rules={{
                required: "El límite máximo de captura es obligatorio",
                min: { value: 0, message: "El límite no puede ser negativo" },
              }}
              render={({ field }) => (
                <InputNumber
                  id="limiteMaximoCapturaTn"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
                  inputStyle={{ fontWeight: "bold" }}
                  min={0}
                  suffix=" Ton"
                  disabled={readOnly}
                  className={classNames({
                    "p-invalid": errors.limiteMaximoCapturaTn,
                  })}
                />
              )}
            />
            {errors.limiteMaximoCapturaTn && (
              <Message severity="error" text={errors.limiteMaximoCapturaTn.message} />
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
              render={({ field }) => (
                <InputNumber
                  id="cuotaPropiaTon"
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
                  className={classNames({
                    "p-invalid": errors.cuotaPropiaTon,
                  })}
                />
              )}
            />
          </div>

          {/* Cuota Alquilada */}
          <div style={{ flex: 1 }}>
            <label htmlFor="cuotaAlquiladaTon" className="font-semibold">
              Cuota Alquilada
            </label>
            <Controller
              name="cuotaAlquiladaTon"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="cuotaAlquiladaTon"
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
                  className={classNames({
                    "p-invalid": errors.cuotaAlquiladaTon,
                  })}
                />
              )}
            />
          </div>
          {/* Toneladas Capturadas */}
          <div style={{ flex: 1 }}>
            <label htmlFor="toneladasCapturadasTemporada" className="font-semibold">
              Toneladas Capturadas
            </label>
            <Controller
              name="toneladasCapturadasTemporada"
              control={control}
              render={({ field }) => (
                <InputNumber
                  key={`toneladas-${faenasUpdateTrigger}`}
                  id="toneladasCapturadasTemporada"
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
        <DetalleFaenasPescaCard
          ref={detalleFaenasRef}
          temporadaPescaId={temporadaData?.id}
          embarcaciones={embarcaciones}
          boliches={boliches}
          puertos={puertos}
          bahiasComerciales={bahiasComerciales}
          motoristas={motoristas}
          patrones={patrones}
          temporadaData={temporadaData}
          onTemporadaDataChange={onTemporadaDataChange} // Callback para notificar cambios en datos de temporada
          onFaenasChange={onFaenasChange} // Callback para notificar cambios en faenas
          faenasUpdateTrigger={faenasUpdateTrigger}
          setFaenasUpdateTrigger={setFaenasUpdateTrigger}
          readOnly={readOnly}
        />
      </div>
    </Card>
  );
}
