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

import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { getParametrosLiquidacion } from "../../api/empresa";
import { calcularLiquidaciones as calcularLiquidacionesAPI } from "../../api/temporadaPesca";

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
  const [cargandoParametros, setCargandoParametros] = useState(false);
  const [baseLiquidacionEstimada, setBaseLiquidacionEstimada] = useState(0);
  const [baseLiquidacionReal, setBaseLiquidacionReal] = useState(0);
  const [codigoMonedaLiquidacion, setCodigoMonedaLiquidacion] = useState("USD");
// Calcular liquidaciones automáticamente al cargar la temporada
useEffect(() => {
  const temporadaId = watch("id");
  if (temporadaId && !readOnly) {
    calcularLiquidaciones();
  }
}, [watch("id")]);
  /**
   * Función para cargar parámetros de liquidación desde la empresa
   */
  const cargarParametrosDesdeEmpresa = async () => {
    const empresaId = watch("empresaId");
    console.log("cargarParametrosDesdeEmpresa: empresaId", empresaId);

    if (!empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se ha seleccionado una empresa.",
        life: 3000,
      });
      return;
    }

    setCargandoParametros(true);

    try {
      const parametros = await getParametrosLiquidacion(empresaId);
      console.log("PARAMETROS", parametros);
      setValue(
        "porcentajeBaseLiqPesca",
        parametros.porcentajeBaseLiqPesca || 0,
      );
      setValue(
        "porcentajeComisionPatron",
        parametros.porcentajeComisionPatron || 0,
      );
      setValue(
        "cantPersonalCalcComisionMotorista",
        parametros.cantPersonalCalcComisionMotorista || 0,
      );
      setValue(
        "cantDivisoriaCalcComisionMotorista",
        parametros.cantDivisoriaCalcComisionMotorista || 0,
      );
      setValue(
        "porcentajeCalcComisionPanguero",
        parametros.porcentajeCalcComisionPanguero || 0,
      );

      toast.current?.show({
        severity: "success",
        summary: "Parámetros Cargados",
        detail:
          "Los parámetros de liquidación se cargaron correctamente desde la empresa.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al cargar parámetros de liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error ||
          "Ocurrió un error al cargar los parámetros de liquidación.",
        life: 3000,
      });
    } finally {
      setCargandoParametros(false);
    }
  };

  /**
   * Función para calcular las liquidaciones estimadas y reales
   * TODO: Implementar las fórmulas de cálculo cuando estén definidas
   */
  const calcularLiquidaciones = async () => {
    const temporadaId = watch("id");

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de calcular liquidaciones.",
        life: 3000,
      });
      return;
    }

    setCalculando(true);

    try {
      const resultado = await calcularLiquidacionesAPI(temporadaId);
      // Guardar bases de cálculo
      setBaseLiquidacionEstimada(resultado.baseLiquidacionEstimada || 0);
      setBaseLiquidacionReal(resultado.baseLiquidacionReal || 0);
      setCodigoMonedaLiquidacion(resultado.codigoMonedaLiquidacion || "USD");

      // Actualizar todos los campos del formulario con los valores calculados
      setValue(
        "liqTripulantesPescaEstimado",
        resultado.liqTripulantesPescaEstimado || 0,
      );
      setValue(
        "liqTripulantesPescaReal",
        resultado.liqTripulantesPescaReal || 0,
      );

      setValue(
        "liqComisionPatronEstimado",
        resultado.liqComisionPatronEstimado || 0,
      );
      setValue("liqComisionPatronReal", resultado.liqComisionPatronReal || 0);

      setValue(
        "liqComisionMotoristaEstimado",
        resultado.liqComisionMotoristaEstimado || 0,
      );
      setValue(
        "liqComisionMotoristaReal",
        resultado.liqComisionMotoristaReal || 0,
      );

      setValue(
        "liqComisionPangueroEstimado",
        resultado.liqComisionPangueroEstimado || 0,
      );
      setValue(
        "liqComisionPangueroReal",
        resultado.liqComisionPangueroReal || 0,
      );

      setValue("liqTotalPescaEstimada", resultado.liqTotalPescaEstimada || 0);
      setValue("liqTotalPescaReal", resultado.liqTotalPescaReal || 0);

      setValue(
        "liqComisionAlquilerCuota",
        resultado.liqComisionAlquilerCuota || 0,
      );

      toast.current?.show({
        severity: "success",
        summary: "Liquidaciones Calculadas",
        detail: "Todas las liquidaciones se calcularon correctamente.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al calcular liquidaciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error ||
          "Ocurrió un error al calcular las liquidaciones.",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <Button
              label="Cargar Parámetros Empresa"
              icon={
                cargandoParametros ? "pi pi-spin pi-spinner" : "pi pi-download"
              }
              onClick={cargarParametrosDesdeEmpresa}
              disabled={readOnly || cargandoParametros}
              className="p-button-info"
              size="small"
              tooltip="Cargar parámetros de liquidación desde la empresa"
              tooltipOptions={{ position: "bottom" }}
            />
            <Button
              label="Calcular Liquidaciones"
              icon={calculando ? "pi pi-spin pi-spinner" : "pi pi-calculator"}
              onClick={calcularLiquidaciones}
              disabled={readOnly || calculando}
              className="p-button-success"
              size="small"
              tooltip="Calcular todas las liquidaciones estimadas y reales"
              tooltipOptions={{ position: "bottom" }}
            />
          </div>
        }
        className="mb-3"
      >
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
            <i
              className="pi pi-percentage"
              style={{ marginRight: "0.5rem" }}
            ></i>
            Parámetros de Comisiones
          </h3>

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
            <i
              className="pi pi-chart-line"
              style={{ marginRight: "0.5rem" }}
            ></i>
            Liquidaciones Estimadas
          </h3>
                    {/* Mostrar Base de Cálculo Estimada */}
          <div style={{ marginBottom: "1rem" }}>
            <Message
              severity="info"
              text={`Base de Cálculo Estimada: ${baseLiquidacionEstimada.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion}`}
              style={{
                display: "block",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="liqTripulantesPescaEstimado"
                className="block mb-2"
              >
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
              <label
                htmlFor="liqComisionPangueroEstimado"
                className="block mb-2"
              >
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

          <Divider />
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
          {/* Mostrar Base de Cálculo Real */}
          <div style={{ marginBottom: "1rem" }}>
            <Message
              severity="success"
              text={`Base de Cálculo Real: ${baseLiquidacionReal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion}`}
              style={{
                display: "block",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            />
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
