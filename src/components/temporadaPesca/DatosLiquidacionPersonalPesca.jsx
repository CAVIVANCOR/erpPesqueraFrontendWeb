/**
 * DatosLiquidacionPersonalPesca.jsx
 *
 * Componente Card para gestionar los parámetros y resultados de liquidación de personal de pesca.
 * Incluye campos de configuración de comisiones y cálculos estimados/reales de liquidación.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";

export default function DatosLiquidacionPersonalPesca({
  control,
  errors,
  setValue,
  watch,
  monedas = [],
  readOnly = false,
}) {
  const toast = useRef(null);
  const [calculando, setCalculando] = useState(false);

  /**
   * Función para calcular las liquidaciones estimadas y reales
   * TODO: Implementar las fórmulas de cálculo cuando estén definidas
   */
  const calcularLiquidaciones = () => {
    setCalculando(true);

    try {
      // Obtener valores actuales del formulario
      const porcentajeBaseLiqPesca = watch('porcentajeBaseLiqPesca');
      const porcentajeComisionPatron = watch('porcentajeComisionPatron');
      const cantPersonalCalcComisionMotorista = watch('cantPersonalCalcComisionMotorista');
      const cantDivisoriaCalcComisionMotorista = watch('cantDivisoriaCalcComisionMotorista');
      const porcentajeCalcComisionPanguero = watch('porcentajeCalcComisionPanguero');


      // TODO: Implementar fórmulas de cálculo aquí
      // Por ahora, solo mostrar mensaje informativo
      
      // Ejemplo de cómo se asignarían los valores calculados:
      // setValue('liqTripulantesPescaEstimado', valorCalculado);
      // setValue('liqComisionPatronEstimado', valorCalculado);
      // setValue('liqComisionMotoristaEstimado', valorCalculado);
      // setValue('liqComisionPangueroEstimado', valorCalculado);
      // setValue('liqTotalPescaEstimada', valorCalculado);
      // setValue('liqComisionAlquilerCuota', valorCalculado);
      // setValue('liqTripulantesPescaReal', valorCalculado);
      // setValue('liqComisionPatronReal', valorCalculado);
      // setValue('liqComisionMotoristaReal', valorCalculado);
      // setValue('liqComisionPangueroReal', valorCalculado);
      // setValue('liqTotalPescaReal', valorCalculado);

      toast.current?.show({
        severity: 'info',
        summary: 'Cálculo Pendiente',
        detail: 'Las fórmulas de cálculo aún no están implementadas. Por favor, complete esta función con las fórmulas correctas.',
        life: 5000,
      });

    } catch (error) {
      console.error('Error al calcular liquidaciones:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Ocurrió un error al calcular las liquidaciones.',
        life: 3000,
      });
    } finally {
      setCalculando(false);
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Button
              label="Calcular Liquidaciones"
              icon={calculando ? "pi pi-spin pi-spinner" : "pi pi-calculator"}
              onClick={calcularLiquidaciones}
              disabled={readOnly || calculando}
              className="p-button-success"
              size="small"
              tooltip="Calcular todas las liquidaciones estimadas y reales"
              tooltipOptions={{ position: "left" }}
            />
          </div>
        }
        className="mb-3"
      >
        {/* Sección: Parámetros de Comisiones */}
        <div className="p-fluid">
          <h3
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#495057",
            }}
          >
            <i className="pi pi-percentage" style={{ marginRight: "0.5rem" }}></i>
            Parámetros de Comisiones
          </h3>
        
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* % Base Liquidación Pesca */}
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
          {/* % Comisión Patrón */}
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

          {/* Cant. Personal Calc. Comisión Motorista */}
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

          {/* Cant. Divisoria Calc. Comisión Motorista */}
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
                    {/* % Comisión Panguero */}
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

        </div>
        <h3
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#495057",
          }}
        >
          <i className="pi pi-chart-line" style={{ marginRight: "0.5rem" }}></i>
          Liquidaciones Estimadas
        </h3>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Liq. Tripulantes Pesca Estimado */}
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Patrón Estimado */}
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Motorista Estimado */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="liqComisionMotoristaEstimado"
              className="block mb-2"
            >
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Panguero Estimado */}
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
                  disabled={readOnly}
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

          {/* Liq. Total Pesca Estimada */}
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
                  disabled={readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: "#e3f2fd",
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

          {/* Liq. Comisión Alquiler Cuota */}
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
                  disabled={readOnly}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.liqComisionAlquilerCuota && (
              <small className="p-error">
                {errors.liqComisionAlquilerCuota.message}
              </small>
            )}
          </div>
        </div>

        {/* Sección: Liquidaciones Estimadas */}
        <Divider />
        {/* Sección: Liquidaciones Reales */}
        <h3
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#495057",
          }}
        >
          <i
            className="pi pi-check-circle"
            style={{ marginRight: "0.5rem" }}
          ></i>
          Liquidaciones Reales
        </h3>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Liq. Tripulantes Pesca Real */}
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Patrón Real */}
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Motorista Real */}
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
                  disabled={readOnly}
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

          {/* Liq. Comisión Panguero Real */}
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
                  disabled={readOnly}
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

          {/* Liq. Total Pesca Real */}
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
                  disabled={readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: "#e8f5e9",
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
        </div>
      </div>
    </Card>
    </>
  );
}
