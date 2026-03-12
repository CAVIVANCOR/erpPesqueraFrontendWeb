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
import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { generarLiquidacionArmadoresPDF } from "./reports/generarLiquidacionArmadoresPDF";
import { generarLiquidacionArmadoresExcel } from "./reports/generarLiquidacionArmadoresExcel";
import { generarLiquidacionComisionistaPDF } from "./reports/generarLiquidacionComisionistaPDF";
import { generarLiquidacionComisionistaExcel } from "./reports/generarLiquidacionComisionistaExcel";
import { generarComisionesPMMPDF } from "./reports/generarComisionesPMMPDF";
import { generarComisionesPMMExcel } from "./reports/generarComisionesPMMExcel";
import { getPersonal } from "../../api/personal";
import { getAllEntregaARendir } from "../../api/entregaARendir";
import { getAllDetMovsEntregaRendir } from "../../api/detMovsEntregaRendir";
import {
  getClientesPorEmpresa,
  getEntidadesComerciales,
} from "../../api/entidadComercial";
// Agregar estos imports después de los existentes
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getDescargasPorTemporada,
  actualizarDescargaFaenaPesca,
} from "../../api/descargaFaenaPesca";
import {
  generarComisionesFidelizacion,
  getComisionesPorTemporada,
} from "../../api/comisionFidelizacion";
import { getResponsiveFontSize } from "../../utils/utils";

export default function DatosLiquidacionPersonalPesca({
  control,
  errors,
  setValue,
  watch,
  monedas = [],
  readOnly = false,
  onGuardarTemporada,
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
  const [showFormatSelectorLiqArmadores, setShowFormatSelectorLiqArmadores] =
    useState(false);
  const [showPDFViewerLiqArmadores, setShowPDFViewerLiqArmadores] =
    useState(false);
  const [showExcelViewerLiqArmadores, setShowExcelViewerLiqArmadores] =
    useState(false);
  const [reportDataLiqArmadores, setReportDataLiqArmadores] = useState(null);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [
    showFormatSelectorLiqComisionista,
    setShowFormatSelectorLiqComisionista,
  ] = useState(false);
  const [showPDFViewerLiqComisionista, setShowPDFViewerLiqComisionista] =
    useState(false);
  const [showExcelViewerLiqComisionista, setShowExcelViewerLiqComisionista] =
    useState(false);
  const [reportDataLiqComisionista, setReportDataLiqComisionista] =
    useState(null);
  // Estados para reporte Comisiones PMM
  const [showFormatSelectorComisionesPMM, setShowFormatSelectorComisionesPMM] =
    useState(false);
  const [showPDFViewerComisionesPMM, setShowPDFViewerComisionesPMM] =
    useState(false);
  const [showExcelViewerComisionesPMM, setShowExcelViewerComisionesPMM] =
    useState(false);
  const [reportDataComisionesPMM, setReportDataComisionesPMM] = useState(null);

  // Estados para Descargas y Comisiones de Fidelización
  const [descargasData, setDescargasData] = useState([]);
  const [loadingDescargas, setLoadingDescargas] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [generandoComisiones, setGenerandoComisiones] = useState(false);
  const [comisionesGeneradas, setComisionesGeneradas] = useState([]);
  const [loadingComisionesGeneradas, setLoadingComisionesGeneradas] =
    useState(false);
    const [actualizandoPrecios, setActualizandoPrecios] = useState(false);
  // Cargar entidades comerciales al montar el componente
  useEffect(() => {
    const cargarEntidades = async () => {
      try {
        const entidades = await getEntidadesComerciales();
        setEntidadesComerciales(
          entidades.map((e) => ({
            ...e,
            label: e.razonSocial || e.nombreComercial,
            value: Number(e.id),
          })),
        );
      } catch (error) {
        console.error("Error al cargar entidades comerciales:", error);
      }
    };
    cargarEntidades();
  }, []);
  // Asegurar que los valores de los dropdowns sean Number cuando cambien
  useEffect(() => {
    const entidadEmpresarialAlquiladaId = watch(
      "entidadEmpresarialAlquiladaId",
    );
    const entidadComercialComisionistaAlquiler = watch(
      "entidadComercialComisionistaAlquiler",
    );
    if (
      entidadEmpresarialAlquiladaId &&
      typeof entidadEmpresarialAlquiladaId === "string"
    ) {
      setValue(
        "entidadEmpresarialAlquiladaId",
        Number(entidadEmpresarialAlquiladaId),
      );
    }
    if (
      entidadComercialComisionistaAlquiler &&
      typeof entidadComercialComisionistaAlquiler === "string"
    ) {
      setValue(
        "entidadComercialComisionistaAlquiler",
        Number(entidadComercialComisionistaAlquiler),
      );
    }
  }, [
    watch("entidadEmpresarialAlquiladaId"),
    watch("entidadComercialComisionistaAlquiler"),
  ]);
  // Calcular liquidaciones automáticamente al cargar la temporada
  useEffect(() => {
    const temporadaId = watch("id");
    if (temporadaId && !readOnly) {
      calcularLiquidaciones();
    }
  }, [watch("id")]);

  // Cargar descargas cuando cambia el ID de la temporada
  useEffect(() => {
    const cargarDescargas = async () => {
      const temporadaId = watch("id");
      if (!temporadaId) {
        setDescargasData([]);
        return;
      }

      try {
        setLoadingDescargas(true);
        const response = await getDescargasPorTemporada(temporadaId);
        setDescargasData(response || []);
      } catch (error) {
        console.error("Error al cargar descargas:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar descargas de la temporada",
          life: 4000,
        });
        setDescargasData([]);
      } finally {
        setLoadingDescargas(false);
      }
    };
    cargarDescargas();
  }, [watch("id")]);

  // Cargar comisiones generadas cuando cambia el ID de la temporada
  useEffect(() => {
    const cargarComisionesGeneradas = async () => {
      const temporadaId = watch("id");
      if (!temporadaId) {
        setComisionesGeneradas([]);
        return;
      }

      setLoadingComisionesGeneradas(true);
      try {
        const comisiones = await getComisionesPorTemporada(temporadaId);
        setComisionesGeneradas(comisiones || []);
      } catch (error) {
        console.error("Error al cargar comisiones generadas:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar comisiones generadas",
          life: 3000,
        });
        setComisionesGeneradas([]);
      } finally {
        setLoadingComisionesGeneradas(false);
      }
    };
    cargarComisionesGeneradas();
  }, [watch("id")]);

  // Cargar clientes filtrados por empresa de la temporada
  const cargarClientes = useCallback(async (empresaId) => {
    if (!empresaId) {
      setClientes([]);
      return;
    }

    try {
      const clientesData = await getClientesPorEmpresa(empresaId);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar clientes",
        life: 4000,
      });
      setClientes([]);
    }
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "empresaId") {
        cargarClientes(value.empresaId);
      }
    });

    // Cargar clientes inicialmente
    const empresaIdInicial = watch("empresaId");
    if (empresaIdInicial) {
      cargarClientes(empresaIdInicial);
    }

    return () => subscription.unsubscribe();
  }, [cargarClientes]);

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
          c.cuotaPropia === true && c.esAlquiler === false && c.zona === zona,
      );
      if (cuotaPropia) {
        setValue(
          "precioPorTonDolares",
          Number(cuotaPropia.precioPorTonDolares || 0),
        );
      }

      const cuotaAlquilada = cuotas.find(
        (c) =>
          c.cuotaPropia === false && c.esAlquiler === false && c.zona === zona,
      );
      if (cuotaAlquilada) {
        setValue(
          "precioPorTonAlquilerDolares",
          Number(cuotaAlquilada.precioPorTonDolares || 0),
        );
      }

      // Cargar nuevos campos desde cuota alquilada
      const cuotaAlquilerComision = cuotas.find(
        (c) =>
          c.cuotaPropia === false && c.esAlquiler === false && c.zona === zona,
      );

      if (cuotaAlquilerComision) {
        setValue(
          "precioPorTonComisionAlquilerDolares",
          Number(cuotaAlquilerComision.precioPorTonComisionAlquiler || 0),
        );
        setValue(
          "entidadEmpresarialAlquiladaId",
          cuotaAlquilerComision.entidadEmpresarialId
            ? Number(cuotaAlquilerComision.entidadEmpresarialId)
            : null,
        );
        setValue(
          "entidadComercialComisionistaAlquiler",
          cuotaAlquilerComision.entidadComercialComisionistaAlquiler
            ? Number(cuotaAlquilerComision.entidadComercialComisionistaAlquiler)
            : null,
        );
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
      // ⭐ GUARDAR LA TEMPORADA PRIMERO ANTES DE CALCULAR
      if (onGuardarTemporada) {
        toast.current?.show({
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
            d.validadoTesoreria === true &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "SUELDOS",
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

  const handleLiquidacionArmadores = async () => {
    const temporadaId = watch("id");
    const empresaId = watch("empresaId");
    const entidadEmpresarialAlquiladaId = watch(
      "entidadEmpresarialAlquiladaId",
    );

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar el reporte",
        life: 3000,
      });
      return;
    }

    if (!entidadEmpresarialAlquiladaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay entidad empresarial alquilada configurada",
        life: 3000,
      });
      return;
    }

    try {
      // Obtener datos completos de la temporada
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener cuotas ALQUILADAS (cuotaPropia = false) filtradas por zona
      const cuotas = await getDetallesCuotaPesca({
        empresaId: empresaId,
        activo: true,
      });
      const cuotasAlquiladas = cuotas.filter(
        (c) => c.zona === temporadaCompleta.zona && c.cuotaPropia === false,
      );

      if (!cuotasAlquiladas || cuotasAlquiladas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: `No hay cuotas alquiladas en la zona ${temporadaCompleta.zona}`,
          life: 3000,
        });
        return;
      }

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

      // Obtener adelantos: EntregaARendir de esta temporada → DetMovsEntregaRendir filtrados
      const todasEntregas = await getAllEntregaARendir();
      const entregaTemporada = todasEntregas.find(
        (e) => Number(e.temporadaPescaId) === Number(temporadaId),
      );
      let adelantos = [];
      if (entregaTemporada) {
        const todosDetMovs = await getAllDetMovsEntregaRendir();
        adelantos = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiqAlquilerCuota === true &&
            d.validadoTesoreria === true &&
            Number(d.entidadComercialId) ===
              Number(entidadEmpresarialAlquiladaId) &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "ALQUILERES",
        );
      }

      setReportDataLiqArmadores({
        temporada: temporadaCompleta,
        cuotas: cuotasAlquiladas,
        descargas: descargasTemporada,
        adelantos,
      });

      setShowFormatSelectorLiqArmadores(true);
    } catch (error) {
      console.error("Error al preparar liquidación armadores:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar el reporte de liquidación armadores",
        life: 3000,
      });
    }
  };
  const handleLiquidacionComisionista = async () => {
    const temporadaId = watch("id");
    const empresaId = watch("empresaId");
    const entidadComercialComisionistaAlquiler = watch(
      "entidadComercialComisionistaAlquiler",
    );

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar el reporte",
        life: 3000,
      });
      return;
    }

    if (!entidadComercialComisionistaAlquiler) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay entidad comercial comisionista configurada",
        life: 3000,
      });
      return;
    }

    try {
      // Obtener datos completos de la temporada
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener cuotas ALQUILADAS (cuotaPropia = false) filtradas por zona
      const cuotas = await getDetallesCuotaPesca({
        empresaId: empresaId,
        activo: true,
      });
      const cuotasAlquiladas = cuotas.filter(
        (c) => c.zona === temporadaCompleta.zona && c.cuotaPropia === false,
      );

      if (!cuotasAlquiladas || cuotasAlquiladas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: `No hay cuotas alquiladas en la zona ${temporadaCompleta.zona}`,
          life: 3000,
        });
        return;
      }

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

      // Obtener movimientos: EntregaARendir de esta temporada → DetMovsEntregaRendir filtrados
      const todasEntregas = await getAllEntregaARendir();
      const entregaTemporada = todasEntregas.find(
        (e) => Number(e.temporadaPescaId) === Number(temporadaId),
      );
      let movimientos = [];
      if (entregaTemporada) {
        const todosDetMovs = await getAllDetMovsEntregaRendir();
        movimientos = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiqAlquilerCuota === true &&
            d.validadoTesoreria === true &&
            Number(d.entidadComercialId) ===
              Number(entidadComercialComisionistaAlquiler) &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "COMISIONES",
        );
      }

      setReportDataLiqComisionista({
        temporada: temporadaCompleta,
        cuotas: cuotasAlquiladas,
        descargas: descargasTemporada,
        movimientos,
      });

      setShowFormatSelectorLiqComisionista(true);
    } catch (error) {
      console.error("Error al preparar liquidación comisionista:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar el reporte de liquidación comisionista",
        life: 3000,
      });
    }
  };
  const handleComisionesPMM = async () => {
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
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);
      const cuotas = await getDetallesCuotaPesca({ empresaId, activo: true });
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

      const todasFaenas = await getFaenasPesca();
      const faenasTemporada = todasFaenas.filter(
        (f) => Number(f.temporadaId) === Number(temporadaId),
      );

      if (!faenasTemporada || faenasTemporada.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: "No hay faenas registradas en esta temporada",
          life: 3000,
        });
        return;
      }

      const primeraFaena = faenasTemporada.sort(
        (a, b) => Number(a.id) - Number(b.id),
      )[0];
      const todosPersonal = await getPersonal();

      const patron = todosPersonal.find(
        (p) => Number(p.id) === Number(primeraFaena.patronId),
      );
      const motorista = todosPersonal.find(
        (p) => Number(p.id) === Number(primeraFaena.motoristaId),
      );
      const panguero = todosPersonal.find(
        (p) => Number(p.id) === Number(primeraFaena.pangueroId),
      );

      if (!patron || !motorista || !panguero) {
        toast.current?.show({
          severity: "warn",
          summary: "Datos incompletos",
          detail:
            "La primera faena no tiene Patrón, Motorista o Panguero asignado",
          life: 3000,
        });
        return;
      }

      const entidadComercialPatron = patron.enlaceEntidadComercialId;
      const entidadComercialMotorista = motorista.enlaceEntidadComercialId;
      const entidadComercialPanguero = panguero.enlaceEntidadComercialId;

      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

      const todasEntregas = await getAllEntregaARendir();
      const entregaTemporada = todasEntregas.find(
        (e) => Number(e.temporadaPescaId) === Number(temporadaId),
      );

      let descuentosPatron = [];
      let descuentosMotorista = [];
      let descuentosPanguero = [];

      if (entregaTemporada) {
        const todosDetMovs = await getAllDetMovsEntregaRendir();

        descuentosPatron = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiquidacionTripulantes === true &&
            d.validadoTesoreria === true &&
            Number(d.entidadComercialId) === Number(entidadComercialPatron) &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "COMISIONES",
        );

        descuentosMotorista = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiquidacionTripulantes === true &&
            d.validadoTesoreria === true &&
            Number(d.entidadComercialId) ===
              Number(entidadComercialMotorista) &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "COMISIONES",
        );

        descuentosPanguero = todosDetMovs.filter(
          (d) =>
            Number(d.entregaARendirId) === Number(entregaTemporada.id) &&
            d.formaParteCalculoLiquidacionTripulantes === true &&
            d.validadoTesoreria === true &&
            Number(d.entidadComercialId) === Number(entidadComercialPanguero) &&
            d.producto?.descripcionBase === "ADELANTO" &&
            d.producto?.descripcionExtendida === "COMISIONES",
        );
      }

      setReportDataComisionesPMM({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        descargas: descargasTemporada,
        patron: { personal: patron, descuentos: descuentosPatron },
        motorista: { personal: motorista, descuentos: descuentosMotorista },
        panguero: { personal: panguero, descuentos: descuentosPanguero },
      });

      setShowFormatSelectorComisionesPMM(true);
    } catch (error) {
      console.error("Error al preparar reporte comisiones PMM:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar el reporte de comisiones",
        life: 3000,
      });
    }
  };

  // Función para guardar cambios en descarga
  const guardarCambiosDescarga = async (descargaId, campo, valor) => {
    try {
      setLoadingDescargas(true);

      const dataActualizar = {
        [campo]: valor,
      };

      await actualizarDescargaFaenaPesca(descargaId, dataActualizar);

      setDescargasData((prev) =>
        prev.map((d) => (d.id === descargaId ? { ...d, [campo]: valor } : d)),
      );

      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Descarga actualizada correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al actualizar descarga:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar descarga",
        life: 4000,
      });
    } finally {
      setLoadingDescargas(false);
    }
  };

  const handleClienteChange = async (descargaId, clienteId) => {
    try {
      setLoadingDescargas(true);

      // Buscar el cliente seleccionado en el array de clientes
      const clienteSeleccionado = clientes.find(
        (c) => Number(c.value) === Number(clienteId),
      );

      // Preparar datos a actualizar
      const dataActualizar = {
        clienteId: clienteId,
      };

      // Si el cliente tiene precio configurado, también actualizar el precio
      if (
        clienteSeleccionado &&
        clienteSeleccionado.precioPorTonComisionFidelizacion
      ) {
        dataActualizar.precioPorTonComisionFidelizacion = Number(
          clienteSeleccionado.precioPorTonComisionFidelizacion,
        );
      }

      // Actualizar en backend
      await actualizarDescargaFaenaPesca(descargaId, dataActualizar);

      // Actualizar estado local
      setDescargasData((prev) =>
        prev.map((d) =>
          d.id === descargaId ? { ...d, ...dataActualizar } : d,
        ),
      );

      // Mostrar mensaje de éxito
      if (dataActualizar.precioPorTonComisionFidelizacion) {
        toast.current?.show({
          severity: "success",
          summary: "Cliente y Precio Actualizados",
          detail: `Precio/Ton Comisión: $${dataActualizar.precioPorTonComisionFidelizacion.toFixed(2)}`,
          life: 4000,
        });
      } else {
        toast.current?.show({
          severity: "success",
          summary: "Cliente Actualizado",
          detail: "Cliente asignado correctamente",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar cliente",
        life: 4000,
      });
    } finally {
      setLoadingDescargas(false);
    }
  };

  // Función para actualizar precios de TODAS las descargas desde sus clientes
  const handleActualizarTodosPreciosDesdeClientes = async () => {
  if (!descargasData || descargasData.length === 0) {
    toast.current?.show({
      severity: "warn",
      summary: "Sin Descargas",
      detail: "No hay descargas para actualizar",
      life: 3000,
    });
    return;
  }

  setActualizandoPrecios(true);
  try {
    let actualizadas = 0;
    let sinCliente = 0;
    let sinPrecio = 0;
    let errores = 0;

    for (const descarga of descargasData) {
      if (!descarga.clienteId) {
        sinCliente++;
        continue;
      }

      const clienteSeleccionado = clientes.find(
        (c) => Number(c.value) === Number(descarga.clienteId),
      );

      if (!clienteSeleccionado) {
        sinCliente++;
        continue;
      }

      if (!clienteSeleccionado.precioPorTonComisionFidelizacion) {
        sinPrecio++;
        continue;
      }

      try {
        const dataActualizar = {
          clienteId: descarga.clienteId,
          precioPorTonComisionFidelizacion: Number(
            clienteSeleccionado.precioPorTonComisionFidelizacion,
          ),
        };

        await actualizarDescargaFaenaPesca(descarga.id, dataActualizar);

        setDescargasData((prev) =>
          prev.map((d) =>
            d.id === descarga.id ? { ...d, ...dataActualizar } : d,
          ),
        );

        actualizadas++;
      } catch (error) {
        console.error(
          `Error al actualizar descarga ${descarga.id}:`,
          error,
        );
        errores++;
      }
    }

    const mensajes = [];
    if (actualizadas > 0) mensajes.push(`${actualizadas} actualizadas`);
    if (sinCliente > 0) mensajes.push(`${sinCliente} sin cliente`);
    if (sinPrecio > 0)
      mensajes.push(`${sinPrecio} sin precio configurado`);
    if (errores > 0) mensajes.push(`${errores} con errores`);

    toast.current?.show({
      severity: actualizadas > 0 ? "success" : "warn",
      summary: "Actualización Masiva Completada",
      detail: mensajes.join(", "),
      life: 5000,
    });
  } catch (error) {
    console.error("Error en actualización masiva:", error);
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: "Error al actualizar precios masivamente",
      life: 4000,
    });
  } finally {
    setActualizandoPrecios(false);
  }
};

  // Función para generar comisiones
  const handleGenerarComisiones = () => {
    const temporadaId = watch("id");

    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar comisiones",
        life: 3000,
      });
      return;
    }

    if (!descargasData || descargasData.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay descargas en esta temporada para generar comisiones",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de generar comisiones para esta temporada? 
    
Esta acción eliminará las comisiones previamente generadas y creará nuevas comisiones basadas en las descargas actuales.`,
      header: "Confirmar Generación de Comisiones",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, generar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-success",
      rejectClassName: "p-button-secondary",
      accept: async () => {
        setGenerandoComisiones(true);
        try {
          const resultado = await generarComisionesFidelizacion(temporadaId);

          const detalles = [];
          if (resultado.comisionesEliminadas > 0) {
            detalles.push(
              `${resultado.comisionesEliminadas} comisión(es) eliminada(s)`,
            );
          }
          if (resultado.comisionesGeneradas > 0) {
            detalles.push(
              `${resultado.comisionesGeneradas} comisión(es) generada(s)`,
            );
          }
          if (
            resultado.clientesSinConfiguracion &&
            resultado.clientesSinConfiguracion.length > 0
          ) {
            detalles.push(
              `${resultado.clientesSinConfiguracion.length} cliente(s) sin configuración`,
            );
          }
          if (resultado.descargasSinPrecio > 0) {
            detalles.push(
              `${resultado.descargasSinPrecio} descarga(s) sin precio`,
            );
          }

          toast.current?.show({
            severity: "success",
            summary: "Comisiones Generadas",
            detail: detalles.join(", "),
            life: 5000,
          });

          if (
            resultado.clientesSinConfiguracion &&
            resultado.clientesSinConfiguracion.length > 0
          ) {
            setTimeout(() => {
              toast.current?.show({
                severity: "warn",
                summary: "Clientes sin Configuración",
                detail: `Los siguientes clientes no tienen personal configurado: ${resultado.clientesSinConfiguracion.join(", ")}`,
                life: 8000,
              });
            }, 1000);
          }

          // Recargar comisiones generadas
          const comisiones = await getComisionesPorTemporada(temporadaId);
          setComisionesGeneradas(comisiones || []);
        } catch (error) {
          console.error("Error al generar comisiones:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message ||
              "Error al generar comisiones de fidelización",
            life: 5000,
          });
        } finally {
          setGenerandoComisiones(false);
        }
      },
    });
  };

  // Body templates para tabla de descargas
  const fechaDescargaBodyTemplate = (rowData) => {
    if (!rowData.fechaHoraInicioDescarga) return "-";
    return new Date(rowData.fechaHoraInicioDescarga).toLocaleDateString(
      "es-PE",
    );
  };

  const faenaBodyTemplate = (rowData) => {
    return rowData.faenaPesca?.descripcion || "-";
  };

  const toneladasBodyTemplate = (rowData) => {
    return Number(rowData.toneladas || 0).toFixed(3);
  };
  const especieBodyTemplate = (rowData) => {
    return rowData.especie?.nombre || "-";
  };

  const clienteEditableBodyTemplate = (rowData) => {
    const clienteIdNumero = rowData.clienteId
      ? Number(rowData.clienteId)
      : null;

    return (
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Dropdown
          value={clienteIdNumero}
          options={clientes}
          onChange={(e) => handleClienteChange(rowData.id, e.value)}
          placeholder="Seleccione cliente"
          filter
          showClear
          disabled={readOnly || loadingDescargas}
          style={{ width: "100%", fontWeight: "bold" }}
          optionLabel="label"
          optionValue="value"
        />
        {clienteIdNumero && (
          <Button
            icon="pi pi-refresh"
            size="small"
            severity="info"
            outlined
            onClick={() => handleClienteChange(rowData.id, clienteIdNumero)}
            disabled={readOnly || loadingDescargas}
            tooltip="Actualizar precio desde cliente"
            tooltipOptions={{ position: "top" }}
            style={{ flexShrink: 0 }}
          />
        )}
      </div>
    );
  };

  const precioComisionEditableBodyTemplate = (rowData) => {
    return (
      <InputNumber
        value={rowData.precioPorTonComisionFidelizacion}
        onValueChange={(e) =>
          guardarCambiosDescarga(
            rowData.id,
            "precioPorTonComisionFidelizacion",
            e.value,
          )
        }
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        prefix="$ "
        disabled={readOnly || loadingDescargas}
        inputStyle={{ fontWeight: "bold", width: "120px" }}
      />
    );
  };

  // Body templates para tabla de comisiones generadas
  const clienteComisionBodyTemplate = (rowData) => {
    return (
      <div style={{ fontWeight: "bold" }}>
        {rowData.descargaFaenaPesca?.cliente?.razonSocial || "Sin cliente"}
      </div>
    );
  };

  const personalComisionBodyTemplate = (rowData) => {
    const personal = rowData.personal;
    if (!personal) return "Sin personal";
    return `${personal.nombres} ${personal.apellidos}`;
  };

  const montoComisionBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", color: "#2196F3" }}>
        $ {Number(rowData.monto || 0).toFixed(2)}
      </div>
    );
  };

  const toneladasComisionBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        {Number(rowData.descargaFaenaPesca?.toneladasDescargadas || 0).toFixed(
          2,
        )}{" "}
        Ton
      </div>
    );
  };

  const precioTonComisionBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        ${" "}
        {Number(
          rowData.descargaFaenaPesca?.precioPorTonComisionFidelizacion || 0,
        ).toFixed(2)}
      </div>
    );
  };

  const fechaComisionBodyTemplate = (rowData) => {
    if (!rowData.descargaFaenaPesca?.fechaDescarga) return "-";
    return new Date(
      rowData.descargaFaenaPesca.fechaDescarga,
    ).toLocaleDateString("es-PE");
  };

  // Headers para las tablas
  const headerDescargas = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <h3 style={{ margin: 0 }}>Descargas de la Temporada</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button
          label="Actualizar Todos los Precios"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          type="button"
          onClick={handleActualizarTodosPreciosDesdeClientes}
          loading={loadingDescargas}
          disabled={
            !watch("id") ||
            loadingDescargas ||
            generandoComisiones ||
            readOnly ||
            descargasData.length === 0
          }
          tooltip="Actualizar precio de comisión desde cliente para TODAS las descargas"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          label="Generar Comisiones"
          icon="pi pi-calculator"
          severity="info"
          type="button"
          onClick={handleGenerarComisiones}
          loading={generandoComisiones}
          disabled={
            !watch("id") || loadingDescargas || generandoComisiones || readOnly
          }
          tooltip="Generar comisiones de fidelización para esta temporada"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    </div>
  );

  const headerComisionesGeneradas = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3 style={{ margin: 0 }}>Comisiones Generadas</h3>
      <Tag
        value={`${comisionesGeneradas.length} comisión(es)`}
        severity="info"
        icon="pi pi-info-circle"
      />
    </div>
  );

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
          ></div>
        }
        className="mb-3"
      >
        <div className="p-fluid">
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
                icon={
                  cargandoParametros
                    ? "pi pi-spin pi-spinner"
                    : "pi pi-download"
                }
                onClick={cargarParametrosDesdeEmpresa}
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
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
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

            <div style={{ flex: 1 }}>
              <label
                htmlFor="entidadEmpresarialAlquiladaId"
                className="block mb-2"
              >
                Entidad Empresarial Alquilada
              </label>
              <Controller
                name="entidadEmpresarialAlquiladaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="entidadEmpresarialAlquiladaId"
                    value={field.value}
                    options={entidadesComerciales}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione entidad"
                    filter
                    showClear
                    className={classNames({
                      "p-invalid": errors.entidadEmpresarialAlquiladaId,
                    })}
                    disabled={true}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.entidadEmpresarialAlquiladaId && (
                <small className="p-error">
                  {errors.entidadEmpresarialAlquiladaId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="precioPorTonComisionAlquilerDolares"
                className="block mb-2"
              >
                Precio por Ton. US$ (Comisión Alquiler)
              </label>
              <Controller
                name="precioPorTonComisionAlquilerDolares"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioPorTonComisionAlquilerDolares"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="$ "
                    placeholder="$ 0.00"
                    className={classNames({
                      "p-invalid": errors.precioPorTonComisionAlquilerDolares,
                    })}
                    disabled={readOnly}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.precioPorTonComisionAlquilerDolares && (
                <small className="p-error">
                  {errors.precioPorTonComisionAlquilerDolares.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="entidadComercialComisionistaAlquiler"
                className="block mb-2"
              >
                Entidad Comisionista Alquiler
              </label>
              <Controller
                name="entidadComercialComisionistaAlquiler"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="entidadComercialComisionistaAlquiler"
                    value={field.value}
                    options={entidadesComerciales}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione entidad"
                    filter
                    showClear
                    className={classNames({
                      "p-invalid": errors.entidadComercialComisionistaAlquiler,
                    })}
                    disabled={true}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.entidadComercialComisionistaAlquiler && (
                <small className="p-error">
                  {errors.entidadComercialComisionistaAlquiler.message}
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
            <div style={{ flex: 1 }}>
              <h3>Liquidaciones Estimadas</h3>
            </div>
            <div style={{ flex: 1 }}>
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
            {/* Mostrar Base de Cálculo Estimada */}
            <div style={{ flex: 1 }}>
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
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
              marginBottom: "1rem",
            }}
          >
            {/* CELDA 1: Distribución Temporada */}
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

            {/* CELDA 2: Reporte Pesca */}
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

            {/* CELDA 3: Liquidación Tripulantes */}
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

            {/* CELDA 4: Liquidación Armadores */}
            <Button
              label="Liq. Armadores"
              icon="pi pi-briefcase"
              className="p-button-outlined p-button-info"
              type="button"
              onClick={handleLiquidacionArmadores}
              disabled={
                readOnly ||
                !watch("id") ||
                !watch("entidadEmpresarialAlquiladaId")
              }
              tooltip="Generar liquidación de pesca armadores"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* CELDA 5: Liquidación Comisionista */}
            <Button
              label="Liq. Comisionista"
              icon="pi pi-dollar"
              className="p-button-outlined p-button-success"
              type="button"
              onClick={handleLiquidacionComisionista}
              disabled={
                readOnly ||
                !watch("id") ||
                !watch("entidadComercialComisionistaAlquiler")
              }
              tooltip="Generar liquidación alquiler comisionista"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* CELDA 6: Comisiones Patrón Motorista Panguero */}
            <Button
              label="Comisiones PMM"
              icon="pi pi-id-card"
              className="p-button-outlined p-button-help"
              type="button"
              onClick={handleComisionesPMM}
              disabled={readOnly || !watch("id")}
              tooltip="Generar comisiones Patrón Motorista Panguero"
              tooltipOptions={{ position: "top" }}
              style={{
                height: "60px",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            />

            {/* CELDA 7: Reporte Consolidado (Espacio reservado) */}
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

        {/* Selector de formato para Liquidación Armadores */}
        <ReportFormatSelector
          visible={showFormatSelectorLiqArmadores}
          onHide={() => setShowFormatSelectorLiqArmadores(false)}
          onSelectPDF={() => setShowPDFViewerLiqArmadores(true)}
          onSelectExcel={() => setShowExcelViewerLiqArmadores(true)}
          title="Liquidación de Pesca Armadores"
        />

        {/* Visor PDF para Liquidación Armadores */}
        <TemporaryPDFViewer
          visible={showPDFViewerLiqArmadores}
          onHide={() => {
            setShowPDFViewerLiqArmadores(false);
            setShowFormatSelectorLiqArmadores(false);
          }}
          data={reportDataLiqArmadores}
          generatePDF={generarLiquidacionArmadoresPDF}
          fileName={`liq_armadores_${reportDataLiqArmadores?.temporada?.nombre || "temporada"}.pdf`}
        />

        {/* Visor Excel para Liquidación Armadores */}
        <TemporaryExcelViewer
          visible={showExcelViewerLiqArmadores}
          onHide={() => {
            setShowExcelViewerLiqArmadores(false);
            setShowFormatSelectorLiqArmadores(false);
          }}
          data={reportDataLiqArmadores}
          generateExcel={generarLiquidacionArmadoresExcel}
          fileName={`liq_armadores_${reportDataLiqArmadores?.temporada?.nombre || "temporada"}.xlsx`}
        />

        {/* Selector de formato para Liquidación Comisionista */}
        <ReportFormatSelector
          visible={showFormatSelectorLiqComisionista}
          onHide={() => setShowFormatSelectorLiqComisionista(false)}
          onSelectPDF={() => setShowPDFViewerLiqComisionista(true)}
          onSelectExcel={() => setShowExcelViewerLiqComisionista(true)}
          title="Liquidación Alquiler Comisionista"
        />

        {/* Visor PDF para Liquidación Comisionista */}
        <TemporaryPDFViewer
          visible={showPDFViewerLiqComisionista}
          onHide={() => {
            setShowPDFViewerLiqComisionista(false);
            setShowFormatSelectorLiqComisionista(false);
          }}
          data={reportDataLiqComisionista}
          generatePDF={generarLiquidacionComisionistaPDF}
          fileName={`liq_comisionista_${reportDataLiqComisionista?.temporada?.nombre || "temporada"}.pdf`}
        />

        {/* Visor Excel para Liquidación Comisionista */}
        <TemporaryExcelViewer
          visible={showExcelViewerLiqComisionista}
          onHide={() => {
            setShowExcelViewerLiqComisionista(false);
            setShowFormatSelectorLiqComisionista(false);
          }}
          data={reportDataLiqComisionista}
          generateExcel={generarLiquidacionComisionistaExcel}
          fileName={`liq_comisionista_${reportDataLiqComisionista?.temporada?.nombre || "temporada"}.xlsx`}
        />

        {/* Selector de formato para Comisiones PMM */}
        <ReportFormatSelector
          visible={showFormatSelectorComisionesPMM}
          onHide={() => setShowFormatSelectorComisionesPMM(false)}
          onSelectPDF={() => setShowPDFViewerComisionesPMM(true)}
          onSelectExcel={() => setShowExcelViewerComisionesPMM(true)}
          title="Comisiones Patrón Motorista Panguero"
        />

        {/* Visor PDF para Comisiones PMM */}
        <TemporaryPDFViewer
          visible={showPDFViewerComisionesPMM}
          onHide={() => {
            setShowPDFViewerComisionesPMM(false);
            setShowFormatSelectorComisionesPMM(false);
          }}
          data={reportDataComisionesPMM}
          generatePDF={generarComisionesPMMPDF}
          fileName={`comisiones_pmm_${reportDataComisionesPMM?.temporada?.nombre || "temporada"}.pdf`}
        />

        {/* Visor Excel para Comisiones PMM */}
        <TemporaryExcelViewer
          visible={showExcelViewerComisionesPMM}
          onHide={() => {
            setShowExcelViewerComisionesPMM(false);
            setShowFormatSelectorComisionesPMM(false);
          }}
          data={reportDataComisionesPMM}
          generateExcel={generarComisionesPMMExcel}
          fileName={`comisiones_pmm_${reportDataComisionesPMM?.temporada?.nombre || "temporada"}.xlsx`}
        />

        {/* Tabla de Descargas Editable */}
        <div style={{ marginTop: "2rem" }}>
          <DataTable
            key={`descargas-table-${clientes.length}`}
            value={descargasData}
            loading={loadingDescargas}
            header={headerDescargas}
            stripedRows
            showGridlines
            emptyMessage="No se encontraron descargas para esta temporada"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            size="small"
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column
              header="Fecha"
              body={fechaDescargaBodyTemplate}
              sortable
              style={{ width: "8%" }}
            />
            <Column
              header="Faena"
              body={faenaBodyTemplate}
              sortable
              style={{ width: "15%" }}
            />
            <Column
              header="Especie"
              body={especieBodyTemplate}
              sortable
              style={{ width: "12%" }}
            />
            <Column
              header="Toneladas"
              body={toneladasBodyTemplate}
              sortable
              style={{ width: "8%" }}
            />

            <Column
              header="Cliente"
              body={clienteEditableBodyTemplate}
              style={{ width: "30%" }}
            />
            <Column
              header="Precio/Ton Comisión (USD)"
              body={precioComisionEditableBodyTemplate}
              style={{ width: "27%" }}
            />
          </DataTable>
        </div>

        {/* Tabla de Comisiones Generadas (Solo Lectura) */}
        <div style={{ marginTop: "2rem" }}>
          <DataTable
            value={comisionesGeneradas}
            loading={loadingComisionesGeneradas}
            header={headerComisionesGeneradas}
            stripedRows
            showGridlines
            emptyMessage="No hay comisiones generadas para esta temporada"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            size="small"
            style={{ fontSize: getResponsiveFontSize() }}
            rowGroupMode="rowspan"
            groupRowsBy="descargaFaenaPesca.cliente.razonSocial"
            sortField="descargaFaenaPesca.cliente.razonSocial"
            sortOrder={1}
          >
            <Column
              header="Cliente"
              body={clienteComisionBodyTemplate}
              sortable
              style={{ width: "25%" }}
            />
            <Column
              header="Personal"
              body={personalComisionBodyTemplate}
              sortable
              style={{ width: "25%" }}
            />
            <Column
              header="Fecha Descarga"
              body={fechaComisionBodyTemplate}
              sortable
              style={{ width: "10%" }}
            />
            <Column
              header="Toneladas"
              body={toneladasComisionBodyTemplate}
              sortable
              style={{ width: "10%" }}
            />
            <Column
              header="Precio/Ton (USD)"
              body={precioTonComisionBodyTemplate}
              sortable
              style={{ width: "15%" }}
            />
            <Column
              header="Monto Comisión (USD)"
              body={montoComisionBodyTemplate}
              sortable
              style={{ width: "15%" }}
            />
          </DataTable>
        </div>

        {/* ConfirmDialog para confirmaciones */}
        <ConfirmDialog />
      </Card>
    </>
  );
}
