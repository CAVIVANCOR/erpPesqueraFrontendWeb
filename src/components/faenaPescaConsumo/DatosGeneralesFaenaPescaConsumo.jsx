// src/components/faenaPescaConsumo/DatosGeneralesFaenaPescaConsumo.jsx
// Componente para datos generales de FaenaPescaConsumo
import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import CalasConsumoCard from "./CalasConsumoCard";
import {
  getFaenaPescaConsumoPorId,
} from "../../api/faenaPescaConsumo";

export default function DatosGeneralesFaenaPescaConsumo({
  control,
  errors,
  setValue,
  getValues,
  watch,
  faenaData,
  novedadData,
  estadosFaena,
  embarcaciones,
  boliches,
  bahias,
  motoristas,
  patrones,
  puertos,
  especies,
  onDataChange, // Mantener para callbacks
  onNovedadDataChange, // Mantener para callbacks
}) {
  const [calasUpdateTrigger, setCalasUpdateTrigger] = useState(0);
  const estadoFaenaId = watch("estadoFaenaId");
  const toneladasCapturadasFaena = watch("toneladasCapturadasFaena");

  useEffect(() => {
    const recargarDatosFaena = async () => {
      if (faenaData?.id && calasUpdateTrigger > 0) {
        try {
          const faenaActualizada = await getFaenaPescaConsumoPorId(
            faenaData.id
          );
          setValue(
            "toneladasCapturadasFaena",
            faenaActualizada.toneladasCapturadasFaena || 0
          );
        } catch (error) {
          console.error("❌ Error recargando datos de faena:", error);
        }
      }
    };
    recargarDatosFaena();
  }, [calasUpdateTrigger, faenaData?.id, setValue]);

  const handleCalasChange = () => {
    setCalasUpdateTrigger((prev) => prev + 1);
  };

  const estadosFaenaOptions =
    estadosFaena?.map((estado) => ({
      label: estado.descripcion || estado.nombre,
      value: Number(estado.id),
    })) || [];


  return (
    <div className="card">
      {!faenaData?.id && (
        <Message
          severity="info"
          text="Complete los datos y guarde para habilitar las demás secciones"
          className="mb-3"
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="embarcacionId">Embarcación</label>
          <Controller
            name="embarcacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="embarcacionId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={embarcaciones}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione embarcación"
                filter
                showClear
                className={classNames({ "p-invalid": errors.embarcacionId })}
              />
            )}
          />
          {errors.embarcacionId && (
            <small className="p-error">{errors.embarcacionId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="bolicheId">Boliche</label>
          <Controller
            name="bolicheId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="bolicheId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={boliches}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione boliche"
                filter
                showClear
                className={classNames({ "p-invalid": errors.bolicheId })}
              />
            )}
          />
          {errors.bolicheId && (
            <small className="p-error">{errors.bolicheId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="bahiaId">Bahía</label>
          <Controller
            name="bahiaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="bahiaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={bahias}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione bahía"
                filter
                showClear
                className={classNames({ "p-invalid": errors.bahiaId })}
              />
            )}
          />
          {errors.bahiaId && (
            <small className="p-error">{errors.bahiaId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="motoristaId">Motorista</label>
          <Controller
            name="motoristaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="motoristaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={motoristas}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione motorista"
                filter
                showClear
                className={classNames({ "p-invalid": errors.motoristaId })}
              />
            )}
          />
          {errors.motoristaId && (
            <small className="p-error">{errors.motoristaId.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="patronId">Patrón</label>
          <Controller
            name="patronId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="patronId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={patrones}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione patrón"
                filter
                showClear
                className={classNames({ "p-invalid": errors.patronId })}
              />
            )}
          />
          {errors.patronId && (
            <small className="p-error">{errors.patronId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaSalida">Fecha Salida</label>
          <Controller
            name="fechaSalida"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaSalida"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione fecha"
                className={classNames({ "p-invalid": errors.fechaSalida })}
              />
            )}
          />
          {errors.fechaSalida && (
            <small className="p-error">{errors.fechaSalida.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="puertoSalidaId">Puerto Salida</label>
          <Controller
            name="puertoSalidaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoSalidaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione puerto"
                filter
                showClear
                className={classNames({ "p-invalid": errors.puertoSalidaId })}
              />
            )}
          />
          {errors.puertoSalidaId && (
            <small className="p-error">{errors.puertoSalidaId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDescarga">Fecha Descarga</label>
          <Controller
            name="fechaDescarga"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaDescarga"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione fecha"
                className={classNames({ "p-invalid": errors.fechaDescarga })}
              />
            )}
          />
          {errors.fechaDescarga && (
            <small className="p-error">{errors.fechaDescarga.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoDescargaId">Puerto Descarga</label>
          <Controller
            name="puertoDescargaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoDescargaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione puerto"
                filter
                showClear
                className={classNames({
                  "p-invalid": errors.puertoDescargaId,
                })}
              />
            )}
          />
          {errors.puertoDescargaId && (
            <small className="p-error">
              {errors.puertoDescargaId.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraFondeo">Fecha Fondeo</label>
          <Controller
            name="fechaHoraFondeo"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaHoraFondeo"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione fecha"
                className={classNames({
                  "p-invalid": errors.fechaHoraFondeo,
                })}
              />
            )}
          />
          {errors.fechaHoraFondeo && (
            <small className="p-error">
              {errors.fechaHoraFondeo.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="puertoFondeoId">Puerto Fondeo</label>
          <Controller
            name="puertoFondeoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoFondeoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione puerto"
                filter
                showClear
                className={classNames({ "p-invalid": errors.puertoFondeoId })}
              />
            )}
          />
          {errors.puertoFondeoId && (
            <small className="p-error">{errors.puertoFondeoId.message}</small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="estadoFaenaId">Estado Faena</label>
          <Controller
            name="estadoFaenaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="estadoFaenaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={estadosFaenaOptions}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione estado"
                disabled
              />
            )}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="toneladasCapturadasFaena">
            Toneladas Capturadas
          </label>
          <Controller
            name="toneladasCapturadasFaena"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="toneladasCapturadasFaena"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={3}
                suffix=" Ton"
                style={{ fontWeight: "bold", backgroundColor: "#f7ee88" }}
                disabled
              />
            )}
          />
        </div>

        <div style={{ flex: 2 }}>
          <label htmlFor="descripcion">Descripción</label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputText
                id="descripcion"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                style={{ fontWeight: "bold", fontStyle: "italic" }}
                placeholder="Descripción de la faena"
              />
            )}
          />
        </div>
      </div>

      <CalasConsumoCard
        faenaPescaConsumoId={faenaData?.id}
        novedadPescaConsumoId={novedadData?.id}
        faenaData={{
          bahiaId: watch("bahiaId"),
          motoristaId: watch("motoristaId"),
          patronId: watch("patronId"),
          embarcacionId: watch("embarcacionId"),
          fechaSalida: watch("fechaSalida"),
          puertoSalidaId: watch("puertoSalidaId"),
        }}
        bahias={bahias}
        motoristas={motoristas}
        patrones={patrones}
        embarcaciones={embarcaciones}
        especies={especies}
        onDataChange={handleCalasChange}
      />
    </div>
  );
}