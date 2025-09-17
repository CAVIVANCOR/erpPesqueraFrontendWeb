/**
 * DatosGeneralesFaenaPesca.jsx
 *
 * Componente para mostrar y editar los datos generales de una faena de pesca.
 * Migrado a React Hook Form siguiendo el estándar del ERP.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { InputNumber } from "primereact/inputnumber"; // Import InputNumber
import DetalleCalasForm from "./DetalleCalasForm";
import { getFaenaPescaPorId } from "../../api/faenaPesca";

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
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  // Estado para controlar actualizaciones de calas
  const [calasUpdateTrigger, setCalasUpdateTrigger] = useState(0);

  // useEffect para recargar datos de faena cuando hay cambios en calas
  useEffect(() => {
    const recargarDatosFaena = async () => {
      if (faenaPescaId && calasUpdateTrigger > 0) {
        try {
          const faenaActualizada = await getFaenaPescaPorId(faenaPescaId);
          // Actualizar solo el campo toneladasCapturadasFaena
          setValue("toneladasCapturadasFaena", faenaActualizada.toneladasCapturadasFaena || 0);          
        } catch (error) {
          console.error('❌ Error recargando datos de faena:', error);
        }
      }
    };
    recargarDatosFaena();
  }, [calasUpdateTrigger, faenaPescaId, setValue]);
  // Función para notificar cambios en calas
  const handleCalasChange = () => {
    setCalasUpdateTrigger(prev => prev + 1);
  };
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
  const fechaHoraFondeo = watch("fechaHoraFondeo");
  const puertoFondeoId = watch("puertoFondeoId");
  const estadoFaenaId = watch("estadoFaenaId");
  const toneladasCapturadasFaena = watch("toneladasCapturadasFaena");

  // Validar si todos los campos requeridos están completos
  const todosCamposCompletos =
    fechaSalida &&
    puertoSalidaId &&
    fechaDescarga &&
    puertoDescargaId &&
    fechaHoraFondeo &&
    puertoFondeoId;
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
      fechaHoraFondeo,
      puertoSalidaId,
      puertoDescargaId,
      puertoFondeoId,
    ];

    return requiredFields.every(
      (field) => field !== null && field !== undefined && field !== ""
    );
  }, [
    fechaSalida,
    fechaDescarga,
    fechaHoraFondeo,
    puertoSalidaId,
    puertoDescargaId,
    puertoFondeoId,
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
              <InputText
                id="fechaDescarga"
                value={field.value ? 
                  new Date(field.value).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "2-digit", 
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  }) : ""
                }
                readOnly
                disabled
                style={{ fontWeight: "bold", color: "#21962e", backgroundColor: "#f8f9fa" }}
                className={classNames({
                  "p-invalid": errors.fechaDescarga,
                })}
                placeholder="Se actualiza automáticamente"
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
            render={({ field }) => {
              const puertoSeleccionado = puertos.find(p => Number(p.value) === Number(field.value));
              console.log("puertoDescargaId - field.value:", field.value, "puertoSeleccionado:", puertoSeleccionado, "puertos disponibles:", puertos.length);
              return (
                <InputText
                  id="puertoDescargaId"
                  value={puertoSeleccionado ? puertoSeleccionado.label : ""}
                  readOnly
                  disabled
                  style={{ fontWeight: "bold", color: "#21962e", backgroundColor: "#f8f9fa" }}
                  className={classNames({
                    "p-invalid": errors.puertoDescargaId,
                  })}
                  placeholder="Se actualiza automáticamente"
                />
              );
            }}
          />
          {errors.puertoDescargaId && (
            <Message severity="error" text={errors.puertoDescargaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraFondeo" style={{ color: "#c61515" }}>
            Fecha Hora Fondeo*
          </label>
          <Controller
            name="fechaHoraFondeo"
            control={control}
            render={({ field }) => (
              <InputText
                id="fechaHoraFondeo"
                value={field.value ? 
                  new Date(field.value).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "2-digit", 
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  }) : ""
                }
                readOnly
                disabled
                style={{ fontWeight: "bold", color: "#c61515", backgroundColor: "#f8f9fa" }}
                className={classNames({
                  "p-invalid": errors.fechaHoraFondeo,
                })}
                placeholder="Se actualiza automáticamente"
              />
            )}
          />
          {errors.fechaHoraFondeo && (
            <Message severity="error" text={errors.fechaHoraFondeo.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoFondeoId" style={{ color: "#c61515" }}>
            Puerto Fondeo*
          </label>
          <Controller
            name="puertoFondeoId"
            control={control}
            render={({ field }) => {
              const puertoSeleccionado = puertos.find(p => Number(p.value) === Number(field.value));
              return (
                <InputText
                  id="puertoFondeoId"
                  value={puertoSeleccionado ? puertoSeleccionado.label : ""}
                  readOnly
                  disabled
                  style={{ fontWeight: "bold", color: "#c61515", backgroundColor: "#f8f9fa" }}
                  className={classNames({
                    "p-invalid": errors.puertoFondeoId,
                  })}
                  placeholder="Se actualiza automáticamente"
                />
              );
            }}
          />
          {errors.puertoFondeoId && (
            <Message severity="error" text={errors.puertoFondeoId.message} />
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
        onFaenasChange={onFaenasChange} // Callback para notificar cambios en faenas
        onCalasChange={handleCalasChange} // Callback para notificar cambios en calas
      />
    </div>
  );
};

export default DatosGeneralesFaenaPesca;
