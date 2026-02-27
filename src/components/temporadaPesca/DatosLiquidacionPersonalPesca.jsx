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

import ReportFormatSelector from "../reports/ReportFormatSelector";
import TemporaryPDFViewer from "../reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../reports/TemporaryExcelViewer";
import { generarDistribucionTemporadaPDF } from "./reports/generarDistribucionTemporadaPDF";
import { generarDistribucionTemporadaExcel } from "./reports/generarDistribucionTemporadaExcel";
import { getDetallesCuotaPesca } from "../../api/detCuotaPesca";
import * as temporadaPescaService from "../../api/temporadaPesca";
import { generarReportePescaExcel } from "./reports/generarReportePescaExcel";
import { generarReportePescaPDF } from "./reports/generarReportePescaPDF";
import { getFaenasPesca } from "../../api/faenaPesca";
import { getAllDescargaFaenaPesca } from "../../api/descargaFaenaPesca";

import { generarLiquidacionTripulantesPDF } from "./reports/generarLiquidacionTripulantesPDF";
import { generarLiquidacionTripulantesExcel } from "./reports/generarLiquidacionTripulantesExcel";
import { getAllEntregaARendir } from "../../api/entregaARendir";
import { getAllDetMovsEntregaRendir } from "../../api/detMovsEntregaRendir";

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
  // Estados para reportes
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showFormatSelectorPesca, setShowFormatSelectorPesca] = useState(false);
  const [showPDFViewerPesca, setShowPDFViewerPesca] = useState(false);
  const [showExcelViewerPesca, setShowExcelViewerPesca] = useState(false);
  const [reportDataPesca, setReportDataPesca] = useState(null);

  const [
    showFormatSelectorLiqTripulantes,
    setShowFormatSelectorLiqTripulantes,
  ] = useState(false);
  const [showPDFViewerLiqTripulantes, setShowPDFViewerLiqTripulantes] =
    useState(false);
  const [showExcelViewerLiqTripulantes, setShowExcelViewerLiqTripulantes] =
    useState(false);
  const [reportDataLiqTripulantes, setReportDataLiqTripulantes] =
    useState(null);

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

      // Cargar precio por tonelada desde la cuota propia activa de la temporada
      const temporadaId = watch("id");
      const temporadaCompleta = temporadaId
        ? await temporadaPescaService.getTemporadaPescaPorId(temporadaId)
        : null;
      const zona = temporadaCompleta?.zona || watch("zona");
      const cuotas = await getDetallesCuotaPesca({ empresaId, activo: true });
      const cuotaPropia = cuotas.find(
        (c) =>
          c.cuotaPropia === true &&
          c.esAlquiler === false &&
          c.zona === zona,
      );
      if (cuotaPropia) {
        setValue("precioPorTonDolares", Number(cuotaPropia.precioPorTonDolares || 0));
      }

      const cuotaAlquilada = cuotas.find(
        (c) =>
          c.cuotaPropia === false &&
          c.esAlquiler === false &&
          c.zona === zona,
      );
      if (cuotaAlquilada) {
        setValue("precioPorTonAlquilerDolares", Number(cuotaAlquilada.precioPorTonDolares || 0));
      }

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

      setValue(
        "ingresosPorAlquilerCuotaSur",
        resultado.ingresosPorAlquilerCuotaSur || 0,
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
  /**
   * Función para generar reporte de distribución
   */
  const handleReporteDistribucion = async () => {
    const temporadaId = watch("id");
    const empresaId = watch("empresaId");

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar el reporte",
        life: 3000,
      });
      return;
    }

    try {
      // Obtener datos completos de la temporada (incluyendo empresa)
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener cuotas activas de la empresa
      const cuotas = await getDetallesCuotaPesca({
        empresaId: empresaId,
        activo: true,
      });

      if (!cuotas || cuotas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: "No hay cuotas activas para generar el reporte",
          life: 3000,
        });
        return;
      }

      // Ordenar cuotas
      const cuotasOrdenadas = cuotas.sort((a, b) => {
        if (a.zona !== b.zona) return a.zona.localeCompare(b.zona);
        if (a.cuotaPropia !== b.cuotaPropia) return b.cuotaPropia ? 1 : -1;
        if (a.esAlquiler !== b.esAlquiler) return a.esAlquiler ? 1 : -1;
        return Number(a.id) - Number(b.id);
      });

      setReportData({
        temporada: temporadaCompleta, // Objeto completo con empresa
        cuotas: cuotasOrdenadas,
      });

      setShowFormatSelector(true);
    } catch (error) {
      console.error("Error al preparar reporte:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar los datos del reporte",
        life: 3000,
      });
    }
  };
  /**
   * Función para generar reporte de pesca
   */
  /**
   * Función para generar reporte de pesca
   */
  const handleReportePesca = async () => {
    const temporadaId = watch("id");
    const empresaId = watch("empresaId");

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar el reporte",
        life: 3000,
      });
      return;
    }

    try {
      // Obtener datos completos de la temporada (incluyendo zona)
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener cuotas activas de la empresa
      const cuotas = await getDetallesCuotaPesca({
        empresaId: empresaId,
        activo: true,
      });

      // FILTRAR cuotas por zona de la temporada
      const cuotasFiltradas = cuotas.filter(
        (c) => c.zona === temporadaCompleta.zona,
      );

      if (!cuotasFiltradas || cuotasFiltradas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: `No hay cuotas activas en la zona ${temporadaCompleta.zona} para generar el reporte`,
          life: 3000,
        });
        return;
      }

      // Ordenar cuotas (misma lógica que primer reporte)
      const cuotasOrdenadas = cuotasFiltradas.sort((a, b) => {
        if (a.zona !== b.zona) return a.zona.localeCompare(b.zona);
        if (a.cuotaPropia !== b.cuotaPropia) return b.cuotaPropia ? 1 : -1;
        if (a.esAlquiler !== b.esAlquiler) return a.esAlquiler ? 1 : -1;
        return Number(a.id) - Number(b.id);
      });

      // PASO 1: Obtener faenas filtradas por temporadaId
      const todasFaenas = await getFaenasPesca();
      const faenasTemporada = todasFaenas.filter(
        (f) => Number(f.temporadaId) === Number(temporadaId),
      );

      // PASO 2: Obtener todas las descargas y filtrar por faenaPescaId
      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

      setReportDataPesca({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        faenas: faenasTemporada,
        descargas: descargasTemporada, // ⭐ NUEVO: Agregar descargas al objeto de datos
      });

      setShowFormatSelectorPesca(true);
    } catch (error) {
      console.error("Error al preparar reporte de pesca:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar el reporte de pesca",
        life: 3000,
      });
    }
  };
  const handleLiquidacionTripulantes = async () => {
    const temporadaId = watch("id");
    const empresaId = watch("empresaId");

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar el reporte",
        life: 3000,
      });
      return;
    }

    try {
      // Obtener datos completos de la temporada
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener cuotas activas filtradas por zona
      const cuotas = await getDetallesCuotaPesca({
        empresaId: empresaId,
        activo: true,
      });
      const cuotasFiltradas = cuotas.filter(
        (c) => c.zona === temporadaCompleta.zona,
      );
      if (!cuotasFiltradas || cuotasFiltradas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: `No hay cuotas activas en la zona ${temporadaCompleta.zona}`,
          life: 3000,
        });
        return;
      }
      const cuotasOrdenadas = cuotasFiltradas.sort((a, b) => {
        if (a.zona !== b.zona) return a.zona.localeCompare(b.zona);
        if (a.cuotaPropia !== b.cuotaPropia) return b.cuotaPropia ? 1 : -1;
        if (a.esAlquiler !== b.esAlquiler) return a.esAlquiler ? 1 : -1;
        return Number(a.id) - Number(b.id);
      });

      // Obtener descargas
      const todasFaenas = await getFaenasPesca();
      const faenasTemporada = todasFaenas.filter(
        (f) => Number(f.temporadaId) === Number(temporadaId),
      );
      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

      // Obtener descuentos: EntregaARendir de esta temporada → DetMovsEntregaRendir filtrados
      const todasEntregas = await getAllEntregaARendir();
      const entregaTemporada = todasEntregas.find(
        (e) => Number(e.temporadaPescaId) === Number(temporadaId),
      );
      let descuentos = [];
      if (entregaTemporada) {
        const todosDetMovs = await getAllDetMovsEntregaRendir();
        descuentos = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiquidacionTripulantes === true &&
            d.validadoTesoreria === true,
        );
      }

      setReportDataLiqTripulantes({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        descargas: descargasTemporada,
        descuentos,
      });

      setShowFormatSelectorLiqTripulantes(true);
    } catch (error) {
      console.error("Error al preparar liquidación tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar el reporte de liquidación",
        life: 3000,
      });
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
            <div style={{ flex: 1 }}>
              <label
                htmlFor="precioPorTonDolares"
                className="block mb-2"
              >
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
            <div style={{ flex: 1 }}>
              <label
                htmlFor="precioPorTonAlquilerDolares"
                className="block mb-2"
              >
                Precio por Ton. US$ (Alquiler)
              </label>
              <Controller
                name="precioPorTonAlquilerDolares"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioPorTonAlquilerDolares"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="$ "
                    placeholder="$ 0.00"
                    className={classNames({
                      "p-invalid": errors.precioPorTonAlquilerDolares,
                    })}
                    disabled={readOnly}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.precioPorTonAlquilerDolares && (
                <small className="p-error">
                  {errors.precioPorTonAlquilerDolares.message}
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
              text={`Base de Cálculo Estimada: ${baseLiquidacionEstimada.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion}`}
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
            <div style={{ flex: 1 }}>
              <label
                htmlFor="ingresosPorAlquilerCuotaSur"
                className="block mb-2"
              >
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
                    inputStyle={{ fontWeight: "bold" }}
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
              text={`Base de Cálculo Real: ${baseLiquidacionReal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigoMonedaLiquidacion}`}
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

          {/* DIVIDER PARA REPORTES */}
          <Divider />

          {/* SECCIÓN DE REPORTES */}
          <h3
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#495057",
            }}
          >
            <i className="pi pi-file-pdf" style={{ marginRight: "0.5rem" }}></i>
            Reportes de Temporada
          </h3>

          {/* GRILLA DE BOTONES 4 COLUMNAS x 2 FILAS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              marginBottom: "1rem",
            }}
          >
            {/* FILA 1 - CELDA 1: Distribución Temporada */}
            <Button
              label="Distribución Temporada"
              icon="pi pi-file"
              className="p-button-outlined p-button-secondary"
              type="button"
              onClick={handleReporteDistribucion}
              disabled={readOnly || !watch("id")}
              tooltip="Generar reporte de distribución de temporada"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* FILA 1 - CELDA 2: Reporte Pesca */}
            <Button
              label="Reporte Pesca"
              icon="pi pi-chart-bar"
              className="p-button-outlined p-button-info"
              type="button"
              onClick={handleReportePesca}
              disabled={readOnly || !watch("id")}
              tooltip="Generar reporte de pesca industrial"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* FILA 1 - CELDA 3: Liquidación Tripulantes */}
            <Button
              label="Liq. Tripulantes"
              icon="pi pi-users"
              className="p-button-outlined p-button-warning"
              type="button"
              onClick={handleLiquidacionTripulantes}
              disabled={readOnly || !watch("id")}
              tooltip="Generar liquidación de tripulantes pesca industrial"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* FILA 1 - CELDA 4: Vacía */}
            <div></div>

            {/* FILA 2 - CELDA 1: Vacía */}
            <div></div>

            {/* FILA 2 - CELDA 2: Vacía */}
            <div></div>

            {/* FILA 2 - CELDA 3: Vacía */}
            <div></div>

            {/* FILA 2 - CELDA 4: Vacía */}
            <div></div>
          </div>
        </div>
        {/* Selector de formato de reporte */}
        <ReportFormatSelector
          visible={showFormatSelector}
          onHide={() => setShowFormatSelector(false)}
          onSelectPDF={() => setShowPDFViewer(true)}
          onSelectExcel={() => setShowExcelViewer(true)}
          title="Reporte Distribución Temporada"
        />

        {/* Visor PDF temporal */}
        <TemporaryPDFViewer
          visible={showPDFViewer}
          onHide={() => setShowPDFViewer(false)}
          generatePDF={generarDistribucionTemporadaPDF}
          data={reportData}
          fileName={`distribucion-temporada-${watch("id") || "reporte"}.pdf`}
          title="Distribución Embarcaciones Temporada Pesca"
        />

        {/* Visor Excel temporal */}
        <TemporaryExcelViewer
          visible={showExcelViewer}
          onHide={() => setShowExcelViewer(false)}
          generateExcel={generarDistribucionTemporadaExcel}
          data={reportData}
          fileName={`distribucion-temporada-${watch("id") || "reporte"}.xlsx`}
          title="Distribución Embarcaciones Temporada Pesca"
        />

        {/* Selector de formato para Reporte Pesca */}
        <ReportFormatSelector
          visible={showFormatSelectorPesca}
          onHide={() => setShowFormatSelectorPesca(false)}
          onSelectPDF={() => setShowPDFViewerPesca(true)}
          onSelectExcel={() => setShowExcelViewerPesca(true)}
          title="Reporte de Pesca Industrial"
        />

        {/* Visor PDF para Reporte Pesca */}
        <TemporaryPDFViewer
          visible={showPDFViewerPesca}
          onHide={() => {
            setShowPDFViewerPesca(false);
            setShowFormatSelectorPesca(false);
          }}
          data={reportDataPesca}
          generatePDF={generarReportePescaPDF}
          fileName={`reporte_pesca_${reportDataPesca?.temporada?.nombre || "temporada"}.pdf`}
        />

        {/* Visor Excel para Reporte Pesca */}
        <TemporaryExcelViewer
          visible={showExcelViewerPesca}
          onHide={() => {
            setShowExcelViewerPesca(false);
            setShowFormatSelectorPesca(false);
          }}
          data={reportDataPesca}
          generateExcel={generarReportePescaExcel}
          fileName={`reporte_pesca_${reportDataPesca?.temporada?.nombre || "temporada"}.xlsx`}
        />


        {/* Selector de formato para Liquidación Tripulantes */}
        <ReportFormatSelector
          visible={showFormatSelectorLiqTripulantes}
          onHide={() => setShowFormatSelectorLiqTripulantes(false)}
          onSelectPDF={() => setShowPDFViewerLiqTripulantes(true)}
          onSelectExcel={() => setShowExcelViewerLiqTripulantes(true)}
          title="Liquidación de Pesca Tripulantes"
        />

        {/* Visor PDF para Liquidación Tripulantes */}
        <TemporaryPDFViewer
          visible={showPDFViewerLiqTripulantes}
          onHide={() => {
            setShowPDFViewerLiqTripulantes(false);
            setShowFormatSelectorLiqTripulantes(false);
          }}
          data={reportDataLiqTripulantes}
          generatePDF={generarLiquidacionTripulantesPDF}
          fileName={`liq_tripulantes_${reportDataLiqTripulantes?.temporada?.nombre || "temporada"}.pdf`}
        />

        {/* Visor Excel para Liquidación Tripulantes */}
        <TemporaryExcelViewer
          visible={showExcelViewerLiqTripulantes}
          onHide={() => {
            setShowExcelViewerLiqTripulantes(false);
            setShowFormatSelectorLiqTripulantes(false);
          }}
          data={reportDataLiqTripulantes}
          generateExcel={generarLiquidacionTripulantesExcel}
          fileName={`liq_tripulantes_${reportDataLiqTripulantes?.temporada?.nombre || "temporada"}.xlsx`}
        />


      </Card>
    </>
  );
}
