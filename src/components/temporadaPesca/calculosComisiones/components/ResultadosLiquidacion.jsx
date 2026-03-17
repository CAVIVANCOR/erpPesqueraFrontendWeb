/**
 * ResultadosLiquidacion.jsx
 * Componente para mostrar los resultados de liquidaciones estimadas y reales
 */
import React, { useMemo, useState, useEffect } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { calcularTotalIngresos } from "../../calculosComisiones/utils/calcularTotalIngresos";
import { calcularIngresosTotalPesca } from "../../calculosComisiones/utils/calculoIngresosFacturacionTotalPescaIndustrial";
import { calcularIngresoFidelizacion } from "../../calculosComisiones/utils/calcularIngresoFidelizacion";
import { calcularFidelizacionPersonal } from "../../calculosComisiones/utils/calcularFidelizacionPersonal";
import { getResponsiveFontSize } from "../../../../utils/utils";

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
  // ⭐ NUEVOS PROPS PARA CÁLCULO DE TOTAL INGRESOS
  descargas = [],
  precioPorTonDolaresAlternativo = 0,
  // ⭐ NUEVOS PROPS PARA CÁLCULO DE INGRESOS TOTAL PESCA
  temporada = null,
  toast = null,
  comisionesGeneradas = [], // ⭐ NUEVO: Comisiones generadas del hook
  esTemporadaSoloAlquiler = false,
  zona = "NORTE", // ⭐ NUEVO: Zona de la temporada
}) => {
  // ⭐ CALCULAR LABEL DINÁMICO PARA INGRESOS DE ALQUILER
  const labelIngresoAlquiler = esTemporadaSoloAlquiler
    ? `Ingresos Alq. Cuota ${zona}` // Solo alquiler: misma zona
    : `Ingresos Alq. Cuota ${zona === "NORTE" ? "SUR" : "NORTE"}`; // Operativa: zona opuesta
  // Construir la fórmula estimada en una sola línea
  const formulaEstimada = `((${Number(cuotaPropiaTon || 0).toFixed(2)} + ${Number(cuotaAlquiladaTon || 0).toFixed(2)}) Ton × $${Number(precioPorTonDolares || 0).toFixed(2)}) × ${Number(porcentajeBaseLiqPesca || 0).toFixed(2)}%`;
  // Construir la fórmula real en una sola línea
  const formulaReal = `(${Number(toneladasCapturadasTemporada || 0).toFixed(2)} Ton × $${Number(precioPorTonDolares || 0).toFixed(2)}) × ${Number(porcentajeBaseLiqPesca || 0).toFixed(2)}%`;  // ⭐ CALCULAR Ingreso Total Temporada (NO es campo de BD, es cálculo)
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

  // ⭐ CALCULAR Total Ingresos Liquidación Tripulantes (cuota propia)
  const totalIngresosCalculado = useMemo(() => {
    return calcularTotalIngresos(
      {
        cuotaPropiaTon,
        precioPorTonDolares,
        precioPorTonDolaresAlternativo,
        porcentajeBaseLiqPesca, // ⭐ AGREGAR porcentajeBaseLiqPesca
      },
      descargas,
    );
  }, [
    cuotaPropiaTon,
    precioPorTonDolares,
    precioPorTonDolaresAlternativo,
    porcentajeBaseLiqPesca, // ⭐ AGREGAR a dependencias
    descargas,
  ]);

  // ⭐ CALCULAR Total Ingresos Facturación Pesca (precios especiales/globales)
  const [ingresosTotalPesca, setIngresosTotalPesca] = useState(0);
  const [calculandoIngresosPesca, setCalculandoIngresosPesca] = useState(false);
  // ⭐ NUEVO: Estados para Ingreso Fidelización y Fidelización a Personal
  const [ingresoFidelizacion, setIngresoFidelizacion] = useState(0);
  const [fidelizacionPersonal, setFidelizacionPersonal] = useState(0);
  useEffect(() => {
    const calcular = async () => {
      if (!temporada || !descargas || descargas.length === 0) {
        setIngresosTotalPesca(0);
        return;
      }

      setCalculandoIngresosPesca(true);
      const showToast = (config) => {
        toast?.current?.show(config);
      };

      const total = await calcularIngresosTotalPesca(
        temporada,
        descargas,
        showToast,
      );
      setIngresosTotalPesca(total || 0);
      setCalculandoIngresosPesca(false);
    };

    calcular();
  }, [temporada, descargas, toast]);

  // DESPUÉS del useEffect de ingresosTotalPesca, AGREGAR:

  // ⭐ NUEVO: Calcular Ingreso Fidelización (lo que pagan los clientes a Megui)
  useMemo(() => {
    if (!descargas || descargas.length === 0) {
      setIngresoFidelizacion(0);
      return;
    }

    const total = calcularIngresoFidelizacion(descargas);
    setIngresoFidelizacion(total);
  }, [descargas]);

  // ⭐ NUEVO: Calcular Fidelización a Personal (lo que Megui reparte al personal)
  useMemo(() => {
    if (!comisionesGeneradas || comisionesGeneradas.length === 0) {
      setFidelizacionPersonal(0);
      return;
    }

    const total = calcularFidelizacionPersonal(comisionesGeneradas);
    setFidelizacionPersonal(total);
  }, [comisionesGeneradas]);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Mensaje informativo para temporadas de solo alquiler */}
          {esTemporadaSoloAlquiler && (
            <Message
              severity="warn"
              text="⚠️ TEMPORADA DE SOLO ALQUILER: Los ingresos se calculan automáticamente en base a la cuota propia y el precio de alquiler."
              style={{
                marginBottom: "1rem",
                display: "block",
              }}
            />
          )}
          <h3>Liquidaciones Estimadas</h3>
        </div>
        <div style={{ flex: 2 }}>
          <Message
            severity="info"
            text={`Base de Cálculo Estimada: ${baseLiquidacionEstimada.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion} = ${formulaEstimada}`}
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          />
        </div>
        {/* ⭐ NUEVO CAMPO: Ingresos Total Pesca Industrial */}
        <div style={{ flex: 0.5 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Facturacion Pesca US$
          </label>
          <InputNumber
            id="ingresosTotalPesca"
            value={ingresosTotalPesca}
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
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          {/* ⭐ NUEVO CAMPO: Ingreso Fidelización */}
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Bonificación Fidelización
          </label>
          <InputNumber
            id="ingresoFidelizacion"
            value={ingresoFidelizacion}
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
              textAlign: "right",
            }}
            style={{ width: "100%" }}
            prefix="$ "
          />
        </div>

        <div style={{ flex: 0.5 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
            {labelIngresoAlquiler}
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
                  textAlign: "right",
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

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.5 }}>
          <Button
            label="Calcular"
            icon={calculando ? "pi pi-spin pi-spinner" : "pi pi-calculator"}
            onClick={onCalcularLiquidaciones}
            disabled={readOnly || calculando || !temporadaId}
            className="p-button-success"
            tooltip="Calcular todas las liquidaciones estimadas y reales"
            tooltipOptions={{ position: "bottom" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Liq. Tripulantes Estimada US$
          </label>
          <InputNumber
            id="baseLiquidacionEstimadaCalc"
            value={baseLiquidacionEstimada}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            placeholder="0.00"
            disabled={true}
            inputStyle={{
              fontWeight: "bold",
              textAlign: "right",
              backgroundColor: "#f7afaf",
              color: "black",
            }}
            prefix="$ "
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Liq. Total Comisionistas
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
                  textAlign: "right",
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
          alignItems: "end",
          marginTop: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>Liquidaciones Reales</h3>
        </div>
        <div style={{ flex: 5 }}>
          <Message
            severity="success"
            text={`Base de Cálculo Real: ${baseLiquidacionReal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion} = ${formulaReal}`}
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
              />
            )}
          />
          {errors.liqTripulantesPescaEstimado && (
            <small className="p-error">
              {errors.liqTripulantesPescaEstimado.message}
            </small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* ⭐ NUEVO CAMPO: Total Ingresos Calculado */}
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Liq. Tripulantes US$
          </label>
          <InputNumber
            id="totalIngresosCalculado"
            value={totalIngresosCalculado}
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
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                inputStyle={{ fontWeight: "bold", textAlign: "right" }}
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Liq. Total Comisionistas
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
                  textAlign: "right",
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
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
                  textAlign: "right",
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
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Comisión Alquiler Cuota
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
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: getResponsiveFontSize() }}>
            Bonificación a Personal:
          </label>
          <InputNumber
            id="fidelizacionPersonal"
            value={fidelizacionPersonal}
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
              textAlign: "right",
            }}
            style={{ width: "100%" }}
            prefix="$ "
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      ></div>
    </>
  );
};
