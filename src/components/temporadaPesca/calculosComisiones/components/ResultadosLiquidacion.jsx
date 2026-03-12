/**
 * ResultadosLiquidacion.jsx
 * Componente para mostrar los resultados de liquidaciones estimadas y reales
 */

import React, { useMemo } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";

export const ResultadosLiquidacion = ({
  control,
  errors,
  baseLiquidacionEstimada,
  baseLiquidacionReal,
  codigoMonedaLiquidacion,
  onCalcularLiquidaciones,
  calculando,
  readOnly,
  temporadaId,
  // ⭐ NUEVOS PROPS PARA LA FÓRMULA
  cuotaPropiaTon = 0,
  cuotaAlquiladaTon = 0,
  precioPorTonDolares = 0,
  porcentajeBaseLiqPesca = 0,
  // ⭐ NUEVO PROP PARA LA FÓRMULA REAL
  toneladasReales = 0,
  // ⭐ NUEVO PROP PARA INGRESO TOTAL TEMPORADA
  toneladasCapturadasTemporada = 0,
  // ⭐ NUEVO PROP PARA COMISIÓN ALQUILER ADICIONAL
  precioPorTonComisionAlquilerDolares = 0,
}) => {
  // Construir la fórmula estimada en una sola línea
  const formulaEstimada = `((${Number(cuotaPropiaTon || 0).toFixed(2)} + ${Number(cuotaAlquiladaTon || 0).toFixed(2)}) Ton × $${Number(precioPorTonDolares || 0).toFixed(2)}) × ${Number(porcentajeBaseLiqPesca || 0).toFixed(2)}%`;

  // Construir la fórmula real en una sola línea
  const formulaReal = `(${Number(toneladasReales || 0).toFixed(2)} Ton × $${Number(precioPorTonDolares || 0).toFixed(2)}) × ${Number(porcentajeBaseLiqPesca || 0).toFixed(2)}%`;

  // ⭐ CALCULAR Ingreso Total Temporada (NO es campo de BD, es cálculo)
  const ingresoTotalTemporada = useMemo(() => {
    return (
      Number(toneladasCapturadasTemporada || 0) *
      Number(precioPorTonDolares || 0)
    );
  }, [toneladasCapturadasTemporada, precioPorTonDolares]);

  // ⭐ CALCULAR Comisión Alquiler Adicional (NO es campo de BD, es cálculo)
  const liqComisionAlquilerAdicional = useMemo(() => {
    return (
      Number(cuotaAlquiladaTon || 0) *
      Number(precioPorTonComisionAlquilerDolares || 0)
    );
  }, [cuotaPropiaTon, cuotaAlquiladaTon, precioPorTonComisionAlquilerDolares]);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>Liquidaciones Estimadas</h3>
        </div>
        <div style={{ flex: 4 }}>
          <Message
            severity="info"
            text={`Base de Cálculo Estimada: ${baseLiquidacionEstimada.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion} = ${formulaEstimada}`}
            style={{
              display: "block",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Calcular Liquidaciones"
            icon={calculando ? "pi pi-spin pi-spinner" : "pi pi-calculator"}
            onClick={onCalcularLiquidaciones}
            disabled={readOnly || calculando || !temporadaId}
            className="p-button-success"
            size="small"
            tooltip="Calcular todas las liquidaciones estimadas y reales"
            tooltipOptions={{ position: "bottom" }}
          />
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
          <label htmlFor="liqTripulantesPescaEstimado" className="block mb-2">
            Tripulantes Pesca
          </label>
          <Controller
            name="liqTripulantesPescaEstimado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqTripulantesPescaEstimado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqTripulantesPescaEstimado,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqTripulantesPescaEstimado && (
            <small className="p-error">
              {errors.liqTripulantesPescaEstimado.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionPatronEstimado" className="block mb-2">
            Comisión Patrón
          </label>
          <Controller
            name="liqComisionPatronEstimado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionPatronEstimado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionPatronEstimado,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionPatronEstimado && (
            <small className="p-error">
              {errors.liqComisionPatronEstimado.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionMotoristaEstimado" className="block mb-2">
            Comisión Motorista
          </label>
          <Controller
            name="liqComisionMotoristaEstimado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionMotoristaEstimado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionMotoristaEstimado,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionMotoristaEstimado && (
            <small className="p-error">
              {errors.liqComisionMotoristaEstimado.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionPangueroEstimado" className="block mb-2">
            Comisión Panguero
          </label>
          <Controller
            name="liqComisionPangueroEstimado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionPangueroEstimado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionPangueroEstimado,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionPangueroEstimado && (
            <small className="p-error">
              {errors.liqComisionPangueroEstimado.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqTotalPescaEstimada" className="block mb-2">
            Liq. Total Pesca
          </label>
          <Controller
            name="liqTotalPescaEstimada"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqTotalPescaEstimada"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqTotalPescaEstimada,
                })}
                disabled={true}
                inputStyle={{
                  fontWeight: "bold",
                  color: "black",
                  backgroundColor: "#f7afaf",
                }}
              />
            )}
          />
          {errors.liqTotalPescaEstimada && (
            <small className="p-error">
              {errors.liqTotalPescaEstimada.message}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.5 }}>
          <h3>Liquidaciones Reales</h3>
        </div>
        <div style={{ flex: 4 }}>
          <Message
            severity="success"
            text={`Base de Cálculo Real: ${baseLiquidacionReal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion} = ${formulaReal}`}
            style={{
              display: "block",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          />
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
          <label htmlFor="liqTripulantesPescaReal" className="block mb-2">
            Tripulantes Pesca
          </label>
          <Controller
            name="liqTripulantesPescaReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqTripulantesPescaReal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqTripulantesPescaReal,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqTripulantesPescaReal && (
            <small className="p-error">
              {errors.liqTripulantesPescaReal.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionPatronReal" className="block mb-2">
            Comisión Patrón
          </label>
          <Controller
            name="liqComisionPatronReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionPatronReal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionPatronReal,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionPatronReal && (
            <small className="p-error">
              {errors.liqComisionPatronReal.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionMotoristaReal" className="block mb-2">
            Comisión Motorista
          </label>
          <Controller
            name="liqComisionMotoristaReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionMotoristaReal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionMotoristaReal,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionMotoristaReal && (
            <small className="p-error">
              {errors.liqComisionMotoristaReal.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionPangueroReal" className="block mb-2">
            Comisión Panguero
          </label>
          <Controller
            name="liqComisionPangueroReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionPangueroReal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionPangueroReal,
                })}
                disabled={true}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.liqComisionPangueroReal && (
            <small className="p-error">
              {errors.liqComisionPangueroReal.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="liqTotalPescaReal" className="block mb-2">
            Liq. Total Pesca
          </label>
          <Controller
            name="liqTotalPescaReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqTotalPescaReal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqTotalPescaReal,
                })}
                disabled={true}
                inputStyle={{
                  fontWeight: "bold",
                  color: "black",
                  backgroundColor: "#f7afaf",
                }}
              />
            )}
          />
          {errors.liqTotalPescaReal && (
            <small className="p-error">
              {errors.liqTotalPescaReal.message}
            </small>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionAlquilerCuota" className="block mb-2">
            Liq. Alquiler Cuota
          </label>
          <Controller
            name="liqComisionAlquilerCuota"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="liqComisionAlquilerCuota"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.liqComisionAlquilerCuota,
                })}
                disabled={true}
                inputStyle={{
                  fontWeight: "bold",
                  color: "black",
                  backgroundColor: "#f7afaf",
                }}
              />
            )}
          />
          {errors.liqComisionAlquilerCuota && (
            <small className="p-error">
              {errors.liqComisionAlquilerCuota.message}
            </small>
          )}
        </div>
        {/* ⭐ NUEVO CAMPO: Comisión Alquiler Adicional */}
        <div style={{ flex: 1 }}>
          <label htmlFor="liqComisionAlquilerAdicional" className="block mb-2">
            Comisión Alq. Adicional
          </label>
          <InputNumber
            id="liqComisionAlquilerAdicional"
            value={liqComisionAlquilerAdicional}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            placeholder="0.00"
            disabled={true}
            inputStyle={{
              fontWeight: "bold",
              color: "black",
              backgroundColor: "#f7afaf",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="ingresoTotalTemporada" className="block mb-2">
            Ingreso Total Temporada
          </label>
          <InputNumber
            id="ingresoTotalTemporada"
            value={ingresoTotalTemporada}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            placeholder="0.00"
            disabled={true}
            inputStyle={{
              fontWeight: "bold",
              color: "black",
              backgroundColor: "#a5c5f7",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="ingresosPorAlquilerCuotaSur" className="block mb-2">
            Ingresos Alq. Cuota Sur
          </label>
          <Controller
            name="ingresosPorAlquilerCuotaSur"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="ingresosPorAlquilerCuotaSur"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.ingresosPorAlquilerCuotaSur,
                })}
                disabled={true}
                inputStyle={{
                  fontWeight: "bold",
                  color: "black",
                  backgroundColor: "#a5c5f7",
                }}
              />
            )}
          />
          {errors.ingresosPorAlquilerCuotaSur && (
            <small className="p-error">
              {errors.ingresosPorAlquilerCuotaSur.message}
            </small>
          )}
        </div>
      </div>
    </>
  );
};
