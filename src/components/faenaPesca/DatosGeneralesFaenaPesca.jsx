/**
 * DatosGeneralesFaenaPesca.jsx
 *
 * Componente para mostrar y editar los datos generales de una faena de pesca.
 * Migrado a React Hook Form siguiendo el estándar del ERP.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { InputNumber } from "primereact/inputnumber"; // Import InputNumber
import DetalleCalasForm from "./DetalleCalasForm";

const DatosGeneralesFaenaPesca = ({
  temporadaData,
  control,
  watch,
  errors,
  setValue,
  bahias,
  motoristas,
  patrones,
  puertos,
  embarcaciones,
  boliches,
  estadosFaena = [],
  faenaPescaId,
  loading = false,
  handleFinalizarFaena,
  onDataChange, // Callback para notificar cambios en los datos
  onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
}) => {
  // Transformar estadosFaena a formato options
  const estadosFaenaOptions = estadosFaena.map((estado) => ({
    label: estado.descripcion,
    value: Number(estado.id),
  }));

  // Watch valores para detectar cambios
  const fechaSalida = watch("fechaSalida");
  const puertoSalidaId = watch("puertoSalidaId");
  const fechaDescarga = watch("fechaDescarga");
  const puertoDescargaId = watch("puertoDescargaId");
  const fechaRetorno = watch("fechaRetorno");
  const puertoRetornoId = watch("puertoRetornoId");
  const estadoFaenaId = watch("estadoFaenaId");
  const toneladasCapturadasFaena = watch("toneladasCapturadasFaena");

  // Validar si todos los campos requeridos están completos
  const todosCamposCompletos =
    fechaSalida &&
    puertoSalidaId &&
    fechaDescarga &&
    puertoDescargaId &&
    fechaRetorno &&
    puertoRetornoId;
  // Lógica de cambio automático de estado
  useEffect(() => {
    // Solo cambiar si estado actual es 17 (INICIADA) y tenemos fechaSalida + puertoSalidaId
    if (Number(estadoFaenaId) === 17 && fechaSalida && puertoSalidaId) {
      setValue("estadoFaenaId", 18); // Cambiar a EN ZARPE
    } else {
    }
  }, [fechaSalida, puertoSalidaId, estadoFaenaId, setValue]);

  // Determinar si está en modo solo lectura
  const isReadOnlyState = Number(estadoFaenaId) === 19; // FINALIZADA
  const isReadOnly = isReadOnlyState || loading;

  // Verificar si todos los campos requeridos están completos
  const allRequiredFieldsComplete = useMemo(() => {
    const requiredFields = [
      fechaSalida,
      fechaDescarga,
      fechaRetorno,
      puertoSalidaId,
      puertoDescargaId,
      puertoRetornoId,
    ];

    return requiredFields.every(
      (field) => field !== null && field !== undefined && field !== ""
    );
  }, [
    fechaSalida,
    fechaDescarga,
    fechaRetorno,
    puertoSalidaId,
    puertoDescargaId,
    puertoRetornoId,
  ]);

  // Mostrar botón "Fin de Faena" solo cuando estado es EN ZARPE (18) y todos los campos están completos
  const showFinalizarButton =
    Number(estadoFaenaId) === 18 && allRequiredFieldsComplete;
  return (
    <div className="card">
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
                {...field}
                value={field.value}
                options={embarcaciones}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione embarcación"
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.embarcacionId,
                })}
              />
            )}
          />
          {errors.embarcacionId && (
            <Message severity="error" text={errors.embarcacionId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="bolicheRedId">Boliche Red</label>
          <Controller
            name="bolicheRedId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="bolicheRedId"
                {...field}
                value={field.value}
                options={boliches}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione boliche red"
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.bolicheRedId,
                })}
              />
            )}
          />
          {errors.bolicheRedId && (
            <Message severity="error" text={errors.bolicheRedId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoFaenaId">Estado de Faena</label>
          <Controller
            name="estadoFaenaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="estadoFaenaId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={estadosFaenaOptions}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione estado"
                disabled
                className={classNames({
                  "p-invalid": errors.estadoFaenaId,
                })}
              />
            )}
          />
          {errors.estadoFaenaId && (
            <Message severity="error" text={errors.estadoFaenaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="toneladasCapturadasFaena">Toneladas Capturadas</label>
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
                inputStyle={{ fontWeight: "bold" }}
                disabled
              />
            )}
          />
        </div>
        {/* Botón Fin de Faena */}
        {showFinalizarButton && (
          <div style={{ flex: 0.5 }}>
            <Button
              label="Fin de Faena"
              icon="pi pi-check"
              severity="danger"
              size="small"
              raised
              onClick={handleFinalizarFaena}
              disabled={loading}
            />
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="bahiaId">Bahía*</label>
          <Controller
            name="bahiaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="bahiaId"
                {...field}
                value={field.value}
                options={bahias}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione bahía comercial"
                required
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.bahiaId,
                })}
              />
            )}
          />
          {errors.bahiaId && (
            <Message severity="error" text={errors.bahiaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="motoristaId">Motorista*</label>
          <Controller
            name="motoristaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="motoristaId"
                {...field}
                value={field.value}
                options={motoristas}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione motorista"
                required
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.motoristaId,
                })}
              />
            )}
          />
          {errors.motoristaId && (
            <Message severity="error" text={errors.motoristaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="patronId">Patrón*</label>
          <Controller
            name="patronId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="patronId"
                {...field}
                value={field.value}
                options={patrones}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione patrón"
                required
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.patronId,
                })}
              />
            )}
          />
          {errors.patronId && (
            <Message severity="error" text={errors.patronId.message} />
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
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaSalida" style={{ color: "#2c32d3" }}>
            Fecha Zarpe*
          </label>
          <Controller
            name="fechaSalida"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaSalida"
                {...field}
                showIcon
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
                disabled={loading}
                required
                className={classNames({
                  "p-invalid": errors.fechaSalida,
                })}
              />
            )}
          />
          {errors.fechaSalida && (
            <Message severity="error" text={errors.fechaSalida.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoSalidaId" style={{ color: "#2c32d3" }}>
            Puerto Zarpe*
          </label>
          <Controller
            name="puertoSalidaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoSalidaId"
                {...field}
                value={field.value}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                pt={{
                  input: { style: { color: "#2c32d3", fontWeight: "bold" } },
                }}
                placeholder="Seleccione puerto"
                required
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.puertoSalidaId,
                })}
              />
            )}
          />
          {errors.puertoSalidaId && (
            <Message severity="error" text={errors.puertoSalidaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDescarga" style={{ color: "#21962e" }}>
            Fecha Descarga*
          </label>
          <Controller
            name="fechaDescarga"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaDescarga"
                {...field}
                showIcon
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#21962e" }}
                disabled={loading || isReadOnly}
                className={classNames({
                  "p-invalid": errors.fechaDescarga,
                })}
              />
            )}
          />
          {errors.fechaDescarga && (
            <Message severity="error" text={errors.fechaDescarga.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoDescargaId" style={{ color: "#21962e" }}>
            Zona Descarga*
          </label>
          <Controller
            name="puertoDescargaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoDescargaId"
                {...field}
                value={field.value}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                pt={{
                  input: { style: { color: "#21962e", fontWeight: "bold" } },
                }}
                placeholder="Seleccione zona"
                required
                disabled={loading || isReadOnly}
                className={classNames({
                  "p-invalid": errors.puertoDescargaId,
                })}
              />
            )}
          />
          {errors.puertoDescargaId && (
            <Message severity="error" text={errors.puertoDescargaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaRetorno" style={{ color: "#c61515" }}>
            Fecha Retorno*
          </label>
          <Controller
            name="fechaRetorno"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaRetorno"
                {...field}
                showIcon
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#c61515" }}
                disabled={loading || isReadOnly}
                required
                className={classNames({
                  "p-invalid": errors.fechaRetorno,
                })}
              />
            )}
          />
          {errors.fechaRetorno && (
            <Message severity="error" text={errors.fechaRetorno.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoRetornoId" style={{ color: "#c61515" }}>
            Puerto Retorno*
          </label>
          <Controller
            name="puertoRetornoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoRetornoId"
                {...field}
                value={field.value}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                pt={{
                  input: { style: { color: "#c61515", fontWeight: "bold" } },
                }}
                placeholder="Seleccione puerto"
                required
                disabled={loading || isReadOnly}
                className={classNames({
                  "p-invalid": errors.puertoRetornoId,
                })}
              />
            )}
          />
          {errors.puertoRetornoId && (
            <Message severity="error" text={errors.puertoRetornoId.message} />
          )}
        </div>
      </div>
      <DetalleCalasForm
        faenaPescaId={faenaPescaId}
        temporadaData={temporadaData}
        faenaData={{
          bahiaId: watch("bahiaId"),
          motoristaId: watch("motoristaId"),
          patronId: watch("patronId"),
          embarcacionId: watch("embarcacionId"),
          fechaSalida: watch("fechaSalida"),
          puertoSalidaId: watch("puertoSalidaId"),
        }}
        faenaDescripcion={watch("descripcion")}
        bahias={bahias}
        motoristas={motoristas}
        patrones={patrones}
        puertos={puertos}
        embarcaciones={embarcaciones}
        loading={loading}
        onDataChange={onDataChange} // Callback para notificar cambios en los datos
        onTemporadaDataChange={onTemporadaDataChange} // Callback para notificar cambios en datos de temporada
      />
    </div>
  );
};

export default DatosGeneralesFaenaPesca;
