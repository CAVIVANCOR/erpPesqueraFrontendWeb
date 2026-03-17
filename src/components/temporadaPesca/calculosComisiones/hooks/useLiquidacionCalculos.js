/**
 * useLiquidacionCalculos.js
 * Hook personalizado para cálculos de liquidación
 * Incluye carga de parámetros y cálculo de liquidaciones estimadas/reales
 */

import { useState, useCallback } from "react";
import { getParametrosLiquidacion } from "../../../../api/empresa";
import { calcularLiquidaciones as calcularLiquidacionesAPI } from "../../../../api/temporadaPesca";

export const useLiquidacionCalculos = (temporadaId, empresaId, setValue, toast, onGuardarTemporada, getValues) => {
  const [calculando, setCalculando] = useState(false);
  const [cargandoParametros, setCargandoParametros] = useState(false);
  const [baseLiquidacionEstimada, setBaseLiquidacionEstimada] = useState(0);
  const [baseLiquidacionReal, setBaseLiquidacionReal] = useState(0);
  const [codigoMonedaLiquidacion, setCodigoMonedaLiquidacion] = useState("USD");

  // Cargar parámetros de liquidación desde la empresa
  const cargarParametros = useCallback(async () => {
    if (!empresaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
        life: 3000,
      });
      return;
    }

    setCargandoParametros(true);
    try {
      const parametros = await getParametrosLiquidacion(empresaId);

      // ⭐ USAR LOS NOMBRES CORRECTOS DE LOS CAMPOS
      setValue("porcentajeBaseLiqPesca", parametros.porcentajeBaseLiqPesca || 0);
      setValue("porcentajeComisionPatron", parametros.porcentajeComisionPatron || 0);
      setValue("cantPersonalCalcComisionMotorista", parametros.cantPersonalCalcComisionMotorista || 0);
      setValue("cantDivisoriaCalcComisionMotorista", parametros.cantDivisoriaCalcComisionMotorista || 0);
      setValue("porcentajeCalcComisionPanguero", parametros.porcentajeCalcComisionPanguero || 0);

      toast?.current?.show({
        severity: "success",
        summary: "Parámetros Cargados",
        detail: "Los parámetros de liquidación se cargaron correctamente desde la empresa.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al cargar parámetros de liquidación:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "Ocurrió un error al cargar los parámetros de liquidación.",
        life: 3000,
      });
    } finally {
      setCargandoParametros(false);
    }
  }, [empresaId, setValue, toast]);

  // Calcular liquidaciones estimadas y reales
  const calcularLiquidaciones = useCallback(async () => {
    if (!temporadaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de calcular liquidaciones",
        life: 3000,
      });
      return;
    }

    setCalculando(true);

    try {
      // ⭐ PRESERVAR precioPorTonDolaresAlternativo antes de guardar
      const valorPreservado = getValues ? getValues("precioPorTonDolaresAlternativo") || 0 : 0;

      // ⭐ CRÍTICO: GUARDAR LA TEMPORADA PRIMERO ANTES DE CALCULAR
      if (onGuardarTemporada) {
        toast?.current?.show({
          severity: "info",
          summary: "Guardando cambios",
          detail: "Guardando la temporada antes de calcular...",
          life: 2000,
        });

        await onGuardarTemporada();

        // Esperar un momento para que el backend complete el guardado y recálculo de cuotas
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

     const resultado = await calcularLiquidacionesAPI(temporadaId);

// ⭐ LOG DE DEPURACIÓN - Ver respuesta completa del backend
console.log("🔍 BACKEND RESPONSE - resultado completo:", resultado);
console.log("🔍 BACKEND RESPONSE - liqTripulantesPescaEstimado:", resultado.liqTripulantesPescaEstimado);
console.log("🔍 BACKEND RESPONSE - liqTripulantesPescaReal:", resultado.liqTripulantesPescaReal);

      // ⭐ GUARDAR BASES DE CÁLCULO
      setBaseLiquidacionEstimada(resultado.baseLiquidacionEstimada || 0);
      setBaseLiquidacionReal(resultado.baseLiquidacionReal || 0);
      setCodigoMonedaLiquidacion(resultado.codigoMonedaLiquidacion || "USD");

      // ⭐ ACTUALIZAR TODOS LOS CAMPOS DEL FORMULARIO CON LOS VALORES CALCULADOS
      setValue("liqTripulantesPescaEstimado", resultado.liqTripulantesPescaEstimado || 0);
      setValue("liqTripulantesPescaReal", resultado.liqTripulantesPescaReal || 0);

      setValue("liqComisionPatronEstimado", resultado.liqComisionPatronEstimado || 0);
      setValue("liqComisionPatronReal", resultado.liqComisionPatronReal || 0);

      setValue("liqComisionMotoristaEstimado", resultado.liqComisionMotoristaEstimado || 0);
      setValue("liqComisionMotoristaReal", resultado.liqComisionMotoristaReal || 0);

      setValue("liqComisionPangueroEstimado", resultado.liqComisionPangueroEstimado || 0);
      setValue("liqComisionPangueroReal", resultado.liqComisionPangueroReal || 0);

      setValue("liqTotalPescaEstimada", resultado.liqTotalPescaEstimada || 0);
      setValue("liqTotalPescaReal", resultado.liqTotalPescaReal || 0);

      setValue("liqComisionAlquilerCuota", resultado.liqComisionAlquilerCuota || 0);

      setValue("ingresosPorAlquilerCuotaSur", resultado.ingresosPorAlquilerCuotaSur || 0);

      // ⭐ RESTAURAR precioPorTonDolaresAlternativo si se perdió
      if (resultado.precioPorTonDolaresAlternativo === undefined || resultado.precioPorTonDolaresAlternativo === null) {
        setValue("precioPorTonDolaresAlternativo", valorPreservado);
      }

      toast?.current?.show({
        severity: "success",
        summary: "Liquidaciones Calculadas",
        detail: "Todas las liquidaciones se calcularon correctamente.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al calcular liquidaciones:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "Ocurrió un error al calcular las liquidaciones.",
        life: 3000,
      });
    } finally {
      setCalculando(false);
    }
  }, [temporadaId, setValue, toast, onGuardarTemporada, getValues]);

  return {
    calculando,
    cargandoParametros,
    baseLiquidacionEstimada,
    baseLiquidacionReal,
    codigoMonedaLiquidacion,
    calcularLiquidaciones,
    cargarParametros,
  };
};