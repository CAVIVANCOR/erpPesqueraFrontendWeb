/**
 * DatosLiquidacionPersonalPesca.jsx
 *
 * Componente Card REFACTORIZADO para gestionar los parámetros y resultados de liquidación de personal de pesca.
 * Ahora utiliza hooks personalizados y componentes modulares para mejor mantenibilidad.
 *
 * @author ERP Megui
 * @version 2.0.0 - Refactorizado
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
import { ConfirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { getResponsiveFontSize } from "../../utils/utils";

// Imports de APIs
import { getParametrosLiquidacion } from "../../api/empresa";
import { getDetallesCuotaPesca } from "../../api/detCuotaPesca";
import * as temporadaPescaService from "../../api/temporadaPesca";
import { getFaenasPesca } from "../../api/faenaPesca";
import { getAllDescargaFaenaPesca } from "../../api/descargaFaenaPesca";
import { getPersonal } from "../../api/personal";
import { getAllEntregaARendir } from "../../api/entregaARendir";
import { getAllDetMovsEntregaRendir } from "../../api/detMovsEntregaRendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getDetallesPorTemporada } from "../../api/detalleDiaSinFaena";
import { formatearNumero } from "../../utils/utils";

// Imports de componentes de reportes
import ReportFormatSelector from "../reports/ReportFormatSelector";
import TemporaryPDFViewer from "../reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../reports/TemporaryExcelViewer";

// Imports de generadores de reportes
import { generarDistribucionTemporadaPDF } from "./reports/generarDistribucionTemporadaPDF";
import { generarDistribucionTemporadaExcel } from "./reports/generarDistribucionTemporadaExcel";
import { generarReportePescaExcel } from "./reports/generarReportePescaExcel";
import { generarReportePescaPDF } from "./reports/generarReportePescaPDF";
import { generarLiquidacionTripulantesPDF } from "./reports/generarLiquidacionTripulantesPDF";
import { generarLiquidacionTripulantesExcel } from "./reports/generarLiquidacionTripulantesExcel";
import { generarLiquidacionArmadoresPDF } from "./reports/generarLiquidacionArmadoresPDF";
import { generarLiquidacionArmadoresExcel } from "./reports/generarLiquidacionArmadoresExcel";
import { generarLiquidacionComisionistaPDF } from "./reports/generarLiquidacionComisionistaPDF";
import { generarLiquidacionComisionistaExcel } from "./reports/generarLiquidacionComisionistaExcel";
import { generarComisionesPMMPDF } from "./reports/generarComisionesPMMPDF";
import { generarComisionesPMMExcel } from "./reports/generarComisionesPMMExcel";
import { generarConsolidadoPescaPDF } from "./reports/generarConsolidadoPescaPDF";
import { generarConsolidadoPescaExcel } from "./reports/generarConsolidadoPescaExcel";
// ⭐ IMPORTS DE HOOKS PERSONALIZADOS
import { useDescargasTemporada } from "./calculosComisiones/hooks/useDescargasTemporada";
import { useComisionesFidelizacion } from "./calculosComisiones/hooks/useComisionesFidelizacion";
import { useClientesTemporada } from "./calculosComisiones/hooks/useClientesTemporada";
import { useLiquidacionCalculos } from "./calculosComisiones/hooks/useLiquidacionCalculos";
import { useReportesTemporada } from "./calculosComisiones/hooks/useReportesTemporada";

// ⭐ IMPORTS DE COMPONENTES UI
import { DescargasTable } from "./calculosComisiones/components/DescargasTable";
import { ComisionesTable } from "./calculosComisiones/components/ComisionesTable";
import { ParametrosLiquidacion } from "./calculosComisiones/components/ParametrosLiquidacion";
import { ResultadosLiquidacion } from "./calculosComisiones/components/ResultadosLiquidacion";
import { BotonesReportes } from "./calculosComisiones/components/BotonesReportes";

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
  const calculoInicialEjecutado = useRef(false);
  const temporadaId = watch("id");
  const empresaId = watch("empresaId");

  // ⭐ USAR HOOKS PERSONALIZADOS
  const { clientes, entidades } = useClientesTemporada(empresaId);

  const {
    descargasData,
    loadingDescargas,
    actualizandoPrecios,
    cargarDescargas,
    actualizarDescarga,
    actualizarTodosPrecios,
  } = useDescargasTemporada(temporadaId, empresaId, clientes, toast);

  const {
    comisionesGeneradas,
    generandoComisiones,
    loadingComisionesGeneradas,
    generarComisiones,
    cargarComisiones,
  } = useComisionesFidelizacion(temporadaId, descargasData, toast);

  const {
    calculando,
    cargandoParametros,
    baseLiquidacionEstimada,
    baseLiquidacionReal,
    codigoMonedaLiquidacion,
    calcularLiquidaciones,
    cargarParametros,
  } = useLiquidacionCalculos(
    temporadaId,
    empresaId,
    setValue,
    toast,
    onGuardarTemporada,
  );

  const { reportStates } = useReportesTemporada();
  // Estados locales adicionales
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [temporada, setTemporada] = useState(null); // ⭐ NUEVO: Estado para temporada completa

  // Cargar entidades comerciales al montar
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

  // ⭐ NUEVO: Cargar temporada completa cuando cambie temporadaId
  useEffect(() => {
    const cargarTemporada = async () => {
      if (!temporadaId) {
        setTemporada(null);
        calculoInicialEjecutado.current = false; // Resetear bandera
        return;
      }

      try {
        const temporadaCompleta =
          await temporadaPescaService.getTemporadaPescaPorId(temporadaId);
        setTemporada(temporadaCompleta);
        calculoInicialEjecutado.current = false; // Resetear para permitir cálculo de nueva temporada
      } catch (error) {
        console.error("Error al cargar temporada completa:", error);
        setTemporada(null);
      }
    };

    cargarTemporada();
  }, [temporadaId]);

  // Asegurar que los valores de los dropdowns sean Number
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

  // Calcular liquidaciones automáticamente al cargar la temporada (SOLO UNA VEZ)
  useEffect(() => {
    if (temporadaId && !readOnly && !calculoInicialEjecutado.current) {
      calculoInicialEjecutado.current = true;
      calcularLiquidaciones();
    }
  }, [temporadaId, readOnly]);

  /**
   * Función para cargar parámetros de liquidación desde la empresa
   */
  const cargarParametrosDesdeEmpresa = async () => {
    if (!empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se ha seleccionado una empresa.",
        life: 3000,
      });
      return;
    }

    await cargarParametros();

    // Cargar precio por tonelada desde la cuota propia activa de la temporada
    try {
      const temporadaCompleta = temporadaId
        ? await temporadaPescaService.getTemporadaPescaPorId(temporadaId)
        : null;
      const zona = temporadaCompleta?.zona || watch("zona");
      const cuotas = await getDetallesCuotaPesca({ empresaId, activo: true });

      // ⭐ CUOTA PROPIA: Cargar precioPorTonDolares y precioPorTonDolaresAlternativo
      const cuotaPropia = cuotas.find(
        (c) =>
          c.cuotaPropia === true && c.esAlquiler === false && c.zona === zona,
      );
      if (cuotaPropia) {
        const precioPropia = Number(cuotaPropia.precioPorTonDolares || 0);

        // Asignar el MISMO valor a ambos campos
        setValue("precioPorTonDolares", precioPropia);
        setValue("precioPorTonDolaresAlternativo", precioPropia);
      }

      // ⭐ CUOTA ALQUILADA: Cargar precios y entidades
      const cuotaAlquilada = cuotas.find(
        (c) =>
          c.cuotaPropia === false && c.esAlquiler === false && c.zona === zona,
      );
      if (cuotaAlquilada) {
        // Precio por tonelada de cuota alquilada
        setValue(
          "precioPorTonAlquilerDolares",
          Number(cuotaAlquilada.precioPorTonDolares || 0),
        );
        // Precio comisión por alquiler
        setValue(
          "precioPorTonComisionAlquilerDolares",
          Number(cuotaAlquilada.precioPorTonComisionAlquiler || 0),
        );
        // Entidades relacionadas
        setValue(
          "entidadEmpresarialAlquiladaId",
          cuotaAlquilada.entidadEmpresarialId
            ? Number(cuotaAlquilada.entidadEmpresarialId)
            : null,
        );
        setValue(
          "entidadComercialComisionistaAlquiler",
          cuotaAlquilada.entidadComercialComisionistaAlquiler
            ? Number(cuotaAlquilada.entidadComercialComisionistaAlquiler)
            : null,
        );
      }
    } catch (error) {
      console.error("Error al cargar cuotas:", error);
    }
  };

  /**
   * Wrapper para calcular liquidaciones con guardado previo
   */
  const handleCalcularLiquidaciones = async () => {
    if (!temporadaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de calcular liquidaciones.",
        life: 3000,
      });
      return;
    }

    // Guardar la temporada primero
    if (onGuardarTemporada) {
      toast.current?.show({
        severity: "info",
        summary: "Guardando cambios",
        detail: "Guardando la temporada antes de calcular...",
        life: 2000,
      });

      await onGuardarTemporada();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await calcularLiquidaciones();
  };

  /**
   * Handlers para cambios en descargas
   */
  const handleClienteChange = async (descargaId, clienteId) => {
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

    // ⭐ El hook useDescargasTemporada maneja todo (loading, actualización, toast)
    await actualizarDescarga(descargaId, dataActualizar);
  };

  const handlePrecioChange = async (descargaId, precio) => {
    const dataActualizar = {
      precioPorTonComisionFidelizacion: precio,
    };

    // ⭐ El hook useDescargasTemporada maneja todo (loading, actualización, toast)
    await actualizarDescarga(descargaId, dataActualizar);
  };

  const handleActualizarPrecioIndividual = async (descargaId) => {
    const descarga = descargasData.find((d) => d.id === descargaId);
    if (descarga && descarga.clienteId) {
      await handleClienteChange(descargaId, descarga.clienteId);
    }
  };

  // ⭐ Header para tabla de descargas
  const headerDescargas = (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 1 }}>
        <h3>Descargas de la Temporada</h3>
      </div>
      {/* ⭐ NUEVO: Visualización de Toneladas Capturadas */}
      <div style={{ flex: 1 }}>
        <Message
          severity="success"
          text={`${formatearNumero(watch("toneladasCapturadasTemporada"))} Ton.`}
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
          label="Actualizar Precios"
          icon="pi pi-refresh"
          severity="primary"
          type="button"
          onClick={actualizarTodosPrecios}
          loading={actualizandoPrecios}
          disabled={
            !temporadaId ||
            loadingDescargas ||
            generandoComisiones ||
            readOnly ||
            descargasData.length === 0
          }
          tooltip="Actualizar precio de comisión desde cliente para TODAS las descargas"
          tooltipOptions={{ position: "top" }}
          size="small"
        />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Generar Bonificación"
          icon="pi pi-calculator"
          severity="success"
          type="button"
          onClick={generarComisiones}
          loading={generandoComisiones}
          disabled={
            !temporadaId || loadingDescargas || generandoComisiones || readOnly
          }
          tooltip="Generar Bonificación de fidelización para esta temporada"
          tooltipOptions={{ position: "top" }}
          size="small"
        />
      </div>
    </div>
  );
  /**
   * Funciones para generar reportes
   */
  const handleReporteDistribucion = async () => {
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

      if (!cuotas || cuotas.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin datos",
          detail: "No hay cuotas activas para generar el reporte",
          life: 3000,
        });
        return;
      }

      const cuotasOrdenadas = cuotas.sort((a, b) => {
        if (a.zona !== b.zona) return a.zona.localeCompare(b.zona);
        if (a.cuotaPropia !== b.cuotaPropia) return b.cuotaPropia ? 1 : -1;
        if (a.esAlquiler !== b.esAlquiler) return a.esAlquiler ? 1 : -1;
        return Number(a.id) - Number(b.id);
      });

      reportStates.distribucion.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
      });

      reportStates.distribucion.setShowFormatSelector(true);
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

  const handleReportePesca = async () => {
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

      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas
        .filter((d) => faenaIds.includes(Number(d.faenaPescaId)))
        .sort((a, b) => {
          // Ordenar por fechaHoraInicioDescarga ascendente (más antigua primero)
          const fechaA = a.fechaHoraInicioDescarga ? new Date(a.fechaHoraInicioDescarga) : new Date(0);
          const fechaB = b.fechaHoraInicioDescarga ? new Date(b.fechaHoraInicioDescarga) : new Date(0);
          return fechaA - fechaB;
        });

      // Obtener días sin faena de la temporada
      const diasSinFaena = await getDetallesPorTemporada(temporadaId);

      reportStates.pesca.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        faenas: faenasTemporada,
        descargas: descargasTemporada,
        diasSinFaena: diasSinFaena,
      });

      reportStates.pesca.setShowFormatSelector(true);
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
      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

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

      reportStates.liquidacionTripulantes.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        descargas: descargasTemporada,
        descuentos,
      });

      reportStates.liquidacionTripulantes.setShowFormatSelector(true);
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
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);
      const cuotas = await getDetallesCuotaPesca({ empresaId, activo: true });
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

      const todasFaenas = await getFaenasPesca();
      const faenasTemporada = todasFaenas.filter(
        (f) => Number(f.temporadaId) === Number(temporadaId),
      );
      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

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

      reportStates.liquidacionArmadores.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasAlquiladas,
        descargas: descargasTemporada,
        adelantos,
      });

      reportStates.liquidacionArmadores.setShowFormatSelector(true);
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
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);
      const cuotas = await getDetallesCuotaPesca({ empresaId, activo: true });
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

      const todasFaenas = await getFaenasPesca();
      const faenasTemporada = todasFaenas.filter(
        (f) => Number(f.temporadaId) === Number(temporadaId),
      );
      const todasDescargas = await getAllDescargaFaenaPesca();
      const faenaIds = faenasTemporada.map((f) => Number(f.id));
      const descargasTemporada = todasDescargas.filter((d) =>
        faenaIds.includes(Number(d.faenaPescaId)),
      );

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

      reportStates.liquidacionComisionista.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasAlquiladas,
        descargas: descargasTemporada,
        movimientos,
      });

      reportStates.liquidacionComisionista.setShowFormatSelector(true);
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

      reportStates.comisionesPMM.setReportData({
        temporada: temporadaCompleta,
        cuotas: cuotasOrdenadas,
        descargas: descargasTemporada,
        patron: { personal: patron, descuentos: descuentosPatron },
        motorista: { personal: motorista, descuentos: descuentosMotorista },
        panguero: { personal: panguero, descuentos: descuentosPanguero },
      });

      reportStates.comisionesPMM.setShowFormatSelector(true);
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

  /**
   * Helper: Obtener DetCuotaPesca ALQUILADA
   * Filtro: empresaId, activo=true, zona, esAlquiler=false, cuotaPropia=false
   */
  const obtenerDetCuotaPescaAlquilada = async (temporada) => {
    try {
      const detalles = await getDetallesCuotaPesca({
        empresaId: temporada.empresaId,
      });

      // Filtrar manualmente según los criterios especificados
      const detalleFiltrado = detalles.find(
        (det) =>
          det.activo === true &&
          det.zona === temporada.zona &&
          det.esAlquiler === false &&
          det.cuotaPropia === false,
      );

      return detalleFiltrado || null;
    } catch (error) {
      console.error("Error al obtener DetCuotaPesca alquilada:", error);
      return null;
    }
  };

  /**
   * Helper: Obtener DetCuotaPesca PROPIA
   * Filtro: empresaId, activo=true, zona, esAlquiler=true, cuotaPropia=true
   */
  const obtenerDetCuotaPescaPropia = async (temporada) => {
    try {
      const detalles = await getDetallesCuotaPesca({
        empresaId: temporada.empresaId,
      });

      // Filtrar manualmente según los criterios especificados
      const detalleFiltrado = detalles.find(
        (det) =>
          det.activo === true &&
          det.zona === temporada.zona &&
          det.esAlquiler === true &&
          det.cuotaPropia === true,
      );

      return detalleFiltrado || null;
    } catch (error) {
      console.error("Error al obtener DetCuotaPesca propia:", error);
      return null;
    }
  };

  /**
   * Handler para generar Reporte Consolidado Pesca Industrial
   */
  const handleConsolidadoPesca = async () => {
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
      // Obtener temporada completa con relaciones
      const temporadaCompleta =
        await temporadaPescaService.getTemporadaPescaPorId(temporadaId);

      // Obtener nombre de embarcación (primera faena activa)
      const faenas = await getFaenasPesca(temporadaId);
      const primeraFaena = faenas.find((f) => f.embarcacion?.activo);
      const nombreEmbarcacion =
        primeraFaena?.embarcacion?.nombre || "SIN EMBARCACION";

      // Preparar datos para el reporte
      const datosReporte = {
        temporada: temporadaCompleta,
        descargas: descargasData,
        comisionesGeneradas: comisionesGeneradas,
        baseLiquidacionReal: watch("baseLiquidacionReal") || 0,

        // ✅ Estos SÍ son campos del formulario (funcionan con watch)
        liqComisionPatronReal: watch("liqComisionPatronReal") || 0,
        liqComisionMotoristaReal: watch("liqComisionMotoristaReal") || 0,
        liqComisionPangueroReal: watch("liqComisionPangueroReal") || 0,
        liqTripulantesPescaEstimado: watch("liqTripulantesPescaEstimado") || 0,
        liqTripulantesPescaReal: watch("liqTripulantesPescaReal") || 0,

        // ⭐ CALCULAR liqComisionAlquilerAdicional (NO es campo del formulario)
        liqComisionAlquilerAdicional:
          Number(temporadaCompleta.cuotaAlquiladaTon || 0) *
          Number(temporadaCompleta.precioPorTonComisionAlquilerDolares || 0),

        // ⭐ CALCULAR fidelizacionPersonal (NO es campo del formulario)
        // Fórmula: SUMA de todas las comisiones.montoPagarFidelizacionDolares
        fidelizacionPersonal: comisionesGeneradas.reduce((total, comision) => {
          return total + Number(comision.montoPagarFidelizacionDolares || 0);
        }, 0),

        cantPersonalCalcComisionMotorista:
          watch("cantPersonalCalcComisionMotorista") || 0,
        nombreEmbarcacion: nombreEmbarcacion,
        ingresosTotalPesca: watch("ingresosTotalPesca") || 0,
        ingresoFidelizacion: watch("ingresoFidelizacion") || 0,
        ingresosPorAlquilerCuotaSur: watch("ingresosPorAlquilerCuotaSur") || 0,

        // Agregar estos datos al objeto datosReporte:
        faenas: faenas,
        detCuotaPescaAlquilada:
          await obtenerDetCuotaPescaAlquilada(temporadaCompleta),
        detCuotaPescaPropia:
          await obtenerDetCuotaPescaPropia(temporadaCompleta),

        // ⭐ CALCULAR totalIngresosCalculado (NO es campo del formulario)
        // Fórmula: cuotaPropiaTon × precioPorTonDolares × (porcentajeBaseLiqPesca / 100)
        totalIngresosCalculado:
          Number(temporadaCompleta.cuotaPropiaTon || 0) *
          Number(temporadaCompleta.precioPorTonDolares || 0) *
          (Number(temporadaCompleta.porcentajeBaseLiqPesca || 0) / 100),
      };

      // Mostrar selector de formato
      reportStates.consolidadoPesca.setShowFormatSelector(true);
      reportStates.consolidadoPesca.setReportData(datosReporte);
    } catch (error) {
      console.error("Error al preparar reporte consolidado:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al preparar el reporte consolidado",
        life: 5000,
      });
    }
  };

  /**
   * Handler genérico para generar reportes
   */
  const handleGenerarReporte = (tipoReporte) => {
    const reportHandlers = {
      distribucion: handleReporteDistribucion,
      pesca: handleReportePesca,
      liquidacionTripulantes: handleLiquidacionTripulantes,
      liquidacionArmadores: handleLiquidacionArmadores,
      liquidacionComisionista: handleLiquidacionComisionista,
      comisionesPMM: handleComisionesPMM,
      consolidadoPesca: handleConsolidadoPesca,
    };

    const handler = reportHandlers[tipoReporte];
    if (handler) {
      handler();
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <Card
        pt={{
          body: { style: { paddingTop: "0rem" } },
        }}
      >
        <div className="p-fluid">
          {/* ⭐ COMPONENTE: Parámetros de Liquidación */}
          <ParametrosLiquidacion
            control={control}
            errors={errors}
            onCargarParametros={cargarParametrosDesdeEmpresa} // ✅ CORRECTO
            cargandoParametros={cargandoParametros} // ✅ CORRECTO - Es un boolean
            readOnly={readOnly}
            empresaId={empresaId}
          />

          {/* Campos adicionales de precios y entidades */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: getResponsiveFontSize() }}>
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
              <label style={{ fontSize: getResponsiveFontSize() }}>
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
              <label style={{ fontSize: getResponsiveFontSize() }}>
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
              <label style={{ fontSize: getResponsiveFontSize() }}>
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
        </div>
        <Panel
          header="Distribucion y Calculo Bonificacion Fidelizacion"
          toggleable
          collapsed={true}
          style={{ marginTop: "1rem" }}
        >
          {/* ⭐ CONTENEDOR: Tablas lado a lado */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "1rem",
              flexDirection: window.innerWidth < 1200 ? "column" : "row",
            }}
          >
            {/* ⭐ COMPONENTE: Tabla de Descargas */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <DescargasTable
                keyValue={`descargas-table-${clientes.length}`}
                descargasData={descargasData}
                loadingDescargas={loadingDescargas}
                clientes={clientes}
                onClienteChange={handleClienteChange}
                onPrecioChange={handlePrecioChange}
                onActualizarPrecio={handleActualizarPrecioIndividual}
                readOnly={readOnly}
                header={headerDescargas}
              />
            </div>

            {/* ⭐ COMPONENTE: Tabla de Comisiones Generadas */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ComisionesTable
                comisionesGeneradas={comisionesGeneradas}
                loadingComisiones={loadingComisionesGeneradas}
              />
            </div>
          </div>
        </Panel>
        {/* ⭐ COMPONENTE: Resultados de Liquidación */}
        <ResultadosLiquidacion
          control={control}
          errors={errors}
          baseLiquidacionEstimada={baseLiquidacionEstimada}
          baseLiquidacionReal={baseLiquidacionReal}
          codigoMonedaLiquidacion={codigoMonedaLiquidacion}
          onCalcularLiquidaciones={calcularLiquidaciones}
          calculando={calculando}
          readOnly={readOnly}
          temporadaId={temporadaId}
          cuotaPropiaTon={watch("cuotaPropiaTon") || 0}
          cuotaAlquiladaTon={watch("cuotaAlquiladaTon") || 0}
          precioPorTonDolares={watch("precioPorTonDolares") || 0}
          porcentajeBaseLiqPesca={watch("porcentajeBaseLiqPesca") || 0}
          toneladasReales={watch("toneladasReales") || 0}
          toneladasCapturadasTemporada={
            watch("toneladasCapturadasTemporada") || 0
          }
          precioPorTonComisionAlquilerDolares={
            watch("precioPorTonComisionAlquilerDolares") || 0
          }
          descargas={descargasData}
          precioPorTonDolaresAlternativo={
            watch("precioPorTonDolaresAlternativo") || 0
          }
          temporada={temporada}
          toast={toast}
          comisionesGeneradas={comisionesGeneradas} // ⭐ NUEVO: Pasar comisiones
          esTemporadaSoloAlquiler={watch("esTemporadaSoloAlquiler") || false}
          zona={watch("zona") || "NORTE"}
        />
        {/* ⭐ COMPONENTE: Botones de Reportes */}
        <BotonesReportes
          onGenerarReporte={handleGenerarReporte}
          readOnly={readOnly}
          temporadaId={temporadaId}
        />
        {/* Selectores y visores de reportes */}
        <ReportFormatSelector
          visible={reportStates.distribucion.showFormatSelector}
          onHide={() => reportStates.distribucion.setShowFormatSelector(false)}
          onSelectPDF={() => reportStates.distribucion.setShowPDFViewer(true)}
          onSelectExcel={() =>
            reportStates.distribucion.setShowExcelViewer(true)
          }
          title="Reporte Distribución Temporada"
        />
        <TemporaryPDFViewer
          visible={reportStates.distribucion.showPDFViewer}
          onHide={() => reportStates.distribucion.setShowPDFViewer(false)}
          generatePDF={generarDistribucionTemporadaPDF}
          data={reportStates.distribucion.reportData}
          fileName={`distribucion-temporada-${temporadaId || "reporte"}.pdf`}
          title="Distribución Embarcaciones Temporada Pesca"
        />
        <TemporaryExcelViewer
          visible={reportStates.distribucion.showExcelViewer}
          onHide={() => reportStates.distribucion.setShowExcelViewer(false)}
          generateExcel={generarDistribucionTemporadaExcel}
          data={reportStates.distribucion.reportData}
          fileName={`distribucion-temporada-${temporadaId || "reporte"}.xlsx`}
          title="Distribución Embarcaciones Temporada Pesca"
        />
        <ReportFormatSelector
          visible={reportStates.pesca.showFormatSelector}
          onHide={() => reportStates.pesca.setShowFormatSelector(false)}
          onSelectPDF={() => reportStates.pesca.setShowPDFViewer(true)}
          onSelectExcel={() => reportStates.pesca.setShowExcelViewer(true)}
          title="Reporte de Pesca Industrial"
        />
        <TemporaryPDFViewer
          visible={reportStates.pesca.showPDFViewer}
          onHide={() => {
            reportStates.pesca.setShowPDFViewer(false);
            reportStates.pesca.setShowFormatSelector(false);
          }}
          data={reportStates.pesca.reportData}
          generatePDF={generarReportePescaPDF}
          fileName={`reporte_pesca_${reportStates.pesca.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.pesca.showExcelViewer}
          onHide={() => {
            reportStates.pesca.setShowExcelViewer(false);
            reportStates.pesca.setShowFormatSelector(false);
          }}
          data={reportStates.pesca.reportData}
          generateExcel={generarReportePescaExcel}
          fileName={`reporte_pesca_${reportStates.pesca.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />
        <ReportFormatSelector
          visible={reportStates.liquidacionTripulantes.showFormatSelector}
          onHide={() =>
            reportStates.liquidacionTripulantes.setShowFormatSelector(false)
          }
          onSelectPDF={() =>
            reportStates.liquidacionTripulantes.setShowPDFViewer(true)
          }
          onSelectExcel={() =>
            reportStates.liquidacionTripulantes.setShowExcelViewer(true)
          }
          title="Liquidación de Pesca Tripulantes"
        />
        <TemporaryPDFViewer
          visible={reportStates.liquidacionTripulantes.showPDFViewer}
          onHide={() => {
            reportStates.liquidacionTripulantes.setShowPDFViewer(false);
            reportStates.liquidacionTripulantes.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionTripulantes.reportData}
          generatePDF={generarLiquidacionTripulantesPDF}
          fileName={`liq_tripulantes_${reportStates.liquidacionTripulantes.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.liquidacionTripulantes.showExcelViewer}
          onHide={() => {
            reportStates.liquidacionTripulantes.setShowExcelViewer(false);
            reportStates.liquidacionTripulantes.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionTripulantes.reportData}
          generateExcel={generarLiquidacionTripulantesExcel}
          fileName={`liq_tripulantes_${reportStates.liquidacionTripulantes.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />
        <ReportFormatSelector
          visible={reportStates.liquidacionArmadores.showFormatSelector}
          onHide={() =>
            reportStates.liquidacionArmadores.setShowFormatSelector(false)
          }
          onSelectPDF={() =>
            reportStates.liquidacionArmadores.setShowPDFViewer(true)
          }
          onSelectExcel={() =>
            reportStates.liquidacionArmadores.setShowExcelViewer(true)
          }
          title="Liquidación de Pesca Armadores"
        />
        <TemporaryPDFViewer
          visible={reportStates.liquidacionArmadores.showPDFViewer}
          onHide={() => {
            reportStates.liquidacionArmadores.setShowPDFViewer(false);
            reportStates.liquidacionArmadores.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionArmadores.reportData}
          generatePDF={generarLiquidacionArmadoresPDF}
          fileName={`liq_armadores_${reportStates.liquidacionArmadores.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.liquidacionArmadores.showExcelViewer}
          onHide={() => {
            reportStates.liquidacionArmadores.setShowExcelViewer(false);
            reportStates.liquidacionArmadores.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionArmadores.reportData}
          generateExcel={generarLiquidacionArmadoresExcel}
          fileName={`liq_armadores_${reportStates.liquidacionArmadores.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />
        <ReportFormatSelector
          visible={reportStates.liquidacionComisionista.showFormatSelector}
          onHide={() =>
            reportStates.liquidacionComisionista.setShowFormatSelector(false)
          }
          onSelectPDF={() =>
            reportStates.liquidacionComisionista.setShowPDFViewer(true)
          }
          onSelectExcel={() =>
            reportStates.liquidacionComisionista.setShowExcelViewer(true)
          }
          title="Liquidación Alquiler Comisionista"
        />
        <TemporaryPDFViewer
          visible={reportStates.liquidacionComisionista.showPDFViewer}
          onHide={() => {
            reportStates.liquidacionComisionista.setShowPDFViewer(false);
            reportStates.liquidacionComisionista.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionComisionista.reportData}
          generatePDF={generarLiquidacionComisionistaPDF}
          fileName={`liq_comisionista_${reportStates.liquidacionComisionista.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.liquidacionComisionista.showExcelViewer}
          onHide={() => {
            reportStates.liquidacionComisionista.setShowExcelViewer(false);
            reportStates.liquidacionComisionista.setShowFormatSelector(false);
          }}
          data={reportStates.liquidacionComisionista.reportData}
          generateExcel={generarLiquidacionComisionistaExcel}
          fileName={`liq_comisionista_${reportStates.liquidacionComisionista.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />
        <ReportFormatSelector
          visible={reportStates.comisionesPMM.showFormatSelector}
          onHide={() => reportStates.comisionesPMM.setShowFormatSelector(false)}
          onSelectPDF={() => reportStates.comisionesPMM.setShowPDFViewer(true)}
          onSelectExcel={() =>
            reportStates.comisionesPMM.setShowExcelViewer(true)
          }
          title="Comisiones Patrón Motorista Panguero"
        />
        <TemporaryPDFViewer
          visible={reportStates.comisionesPMM.showPDFViewer}
          onHide={() => {
            reportStates.comisionesPMM.setShowPDFViewer(false);
            reportStates.comisionesPMM.setShowFormatSelector(false);
          }}
          data={reportStates.comisionesPMM.reportData}
          generatePDF={generarComisionesPMMPDF}
          fileName={`comisiones_pmm_${reportStates.comisionesPMM.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.comisionesPMM.showExcelViewer}
          onHide={() => {
            reportStates.comisionesPMM.setShowExcelViewer(false);
            reportStates.comisionesPMM.setShowFormatSelector(false);
          }}
          data={reportStates.comisionesPMM.reportData}
          generateExcel={generarComisionesPMMExcel}
          fileName={`comisiones_pmm_${reportStates.comisionesPMM.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />

        {/* ⭐ COMPONENTES PARA REPORTE CONSOLIDADO PESCA */}
        <ReportFormatSelector
          visible={reportStates.consolidadoPesca.showFormatSelector}
          onHide={() =>
            reportStates.consolidadoPesca.setShowFormatSelector(false)
          }
          onSelectPDF={() => {
            reportStates.consolidadoPesca.setShowFormatSelector(false);
            reportStates.consolidadoPesca.setShowPDFViewer(true);
          }}
          onSelectExcel={() => {
            reportStates.consolidadoPesca.setShowFormatSelector(false);
            reportStates.consolidadoPesca.setShowExcelViewer(true);
          }}
          title="Reporte Consolidado Pesca Industrial"
        />
        <TemporaryPDFViewer
          visible={reportStates.consolidadoPesca.showPDFViewer}
          onHide={() => {
            reportStates.consolidadoPesca.setShowPDFViewer(false);
            reportStates.consolidadoPesca.setShowFormatSelector(false);
          }}
          data={reportStates.consolidadoPesca.reportData}
          generatePDF={generarConsolidadoPescaPDF}
          fileName={`consolidado_pesca_${reportStates.consolidadoPesca.reportData?.temporada?.nombre || "temporada"}.pdf`}
        />
        <TemporaryExcelViewer
          visible={reportStates.consolidadoPesca.showExcelViewer}
          onHide={() => {
            reportStates.consolidadoPesca.setShowExcelViewer(false);
            reportStates.consolidadoPesca.setShowFormatSelector(false);
          }}
          data={reportStates.consolidadoPesca.reportData}
          generateExcel={generarConsolidadoPescaExcel}
          fileName={`consolidado_pesca_${reportStates.consolidadoPesca.reportData?.temporada?.nombre || "temporada"}.xlsx`}
        />

        <ConfirmDialog />
      </Card>
    </>
  );
}
