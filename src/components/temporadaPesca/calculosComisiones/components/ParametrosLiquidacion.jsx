/**
 * ParametrosLiquidacion.jsx
 * Componente para renderizar el formulario de parámetros de liquidación
 */

import React from "react";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import { classNames } from "primereact/utils";

export const ParametrosLiquidacion = ({
  control,
  errors,
  onCargarParametros,
  cargandoParametros,
  readOnly,
  empresaId,
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>Parámetros de Comisiones</h3>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Cargar Parámetros Empresa"
            icon={cargandoParametros ? "pi pi-spin pi-spinner" : "pi pi-download"}
            onClick={onCargarParametros}
            disabled={readOnly || cargandoParametros}
            className="p-button-info"
            size="small"
            tooltip="Cargar parámetros de liquidación desde la empresa"
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
          <label htmlFor="porcentajeBaseLiqPesca" className="block mb-2">
            % Base Liquidación Pesca
          </label>
          <Controller
            name="porcentajeBaseLiqPesca"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeBaseLiqPesca"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                suffix=" %"
                placeholder="0.00 %"
                className={classNames({
                  "p-invalid": errors.porcentajeBaseLiqPesca,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.porcentajeBaseLiqPesca && (
            <small className="p-error">
              {errors.porcentajeBaseLiqPesca.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="porcentajeComisionPatron" className="block mb-2">
            % Comisión Patrón
          </label>
          <Controller
            name="porcentajeComisionPatron"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeComisionPatron"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                suffix=" %"
                placeholder="0.00 %"
                className={classNames({
                  "p-invalid": errors.porcentajeComisionPatron,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.porcentajeComisionPatron && (
            <small className="p-error">
              {errors.porcentajeComisionPatron.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="cantPersonalCalcComisionMotorista"
            className="block mb-2"
          >
            Cant. Personal C/Motorista
          </label>
          <Controller
            name="cantPersonalCalcComisionMotorista"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="cantPersonalCalcComisionMotorista"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.cantPersonalCalcComisionMotorista,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.cantPersonalCalcComisionMotorista && (
            <small className="p-error">
              {errors.cantPersonalCalcComisionMotorista.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="cantDivisoriaCalcComisionMotorista"
            className="block mb-2"
          >
            Cant. Divisoria C/Motorista
          </label>
          <Controller
            name="cantDivisoriaCalcComisionMotorista"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="cantDivisoriaCalcComisionMotorista"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={classNames({
                  "p-invalid": errors.cantDivisoriaCalcComisionMotorista,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.cantDivisoriaCalcComisionMotorista && (
            <small className="p-error">
              {errors.cantDivisoriaCalcComisionMotorista.message}
            </small>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="porcentajeCalcComisionPanguero"
            className="block mb-2"
          >
            % Comisión Panguero
          </label>
          <Controller
            name="porcentajeCalcComisionPanguero"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeCalcComisionPanguero"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                suffix=" %"
                placeholder="0.00 %"
                className={classNames({
                  "p-invalid": errors.porcentajeCalcComisionPanguero,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.porcentajeCalcComisionPanguero && (
            <small className="p-error">
              {errors.porcentajeCalcComisionPanguero.message}
            </small>
          )}
        </div>

        {/* ⭐ NUEVO CAMPO: Precio por Tonelada (Propia) */}
        <div style={{ flex: 1 }}>
          <label htmlFor="precioPorTonDolares" className="block mb-2">
            Precio por Ton. US$ (Propia)
          </label>
          <Controller
            name="precioPorTonDolares"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="precioPorTonDolares"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                prefix="$ "
                placeholder="$ 0.00"
                className={classNames({
                  "p-invalid": errors.precioPorTonDolares,
                })}
                disabled={readOnly}
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.precioPorTonDolares && (
            <small className="p-error">
              {errors.precioPorTonDolares.message}
            </small>
          )}
        </div>
      </div>
    </>
  );
};