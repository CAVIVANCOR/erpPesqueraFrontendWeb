// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\configurar-movimientos\useConfigurarMovimientos.js

import { useState, useEffect, useRef } from "react";
import { getConceptosMovAlmacen } from "../../../../api/conceptoMovAlmacen";
import { obtenerDireccionesPorEntidad } from "../../../../api/direccionEntidad";
import {
  agruparPorAlmacen,
  inicializarConfiguraciones,
  actualizarConfiguracion,
  validarConfiguracionCompleta,
  prepararResultado,
  contarAlmacenesConfigurados,
  obtenerConcepto
} from "./configurarMovimientosUtils";

/**
 * ============================================================================
 * CUSTOM HOOK: useConfigurarMovimientos
 * ============================================================================
 * 
 * Hook personalizado que encapsula toda la lógica de configuración de movimientos.
 * Maneja estado, efectos, y handlers para el flujo completo.
 * 
 * @param {Object} config - Configuración del hook
 * @returns {Object} Estados, handlers y datos
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */
export const useConfigurarMovimientos = ({
  visible,
  empresaId,
  asignacionesStock,
  tipoMovimientoId,
  fechaPorDefecto,
  onConfirmar,
  onHide
}) => {
  const toast = useRef(null);

  // ============================================================================
  // ESTADOS
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [loadingConceptos, setLoadingConceptos] = useState(false);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);

  // Datos maestros
  const [conceptos, setConceptos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);

  // Agrupación por almacén
  const [almacenesAgrupados, setAlmacenesAgrupados] = useState([]);

  // Configuraciones por almacén
  const [configuraciones, setConfiguraciones] = useState([]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (visible) {
      cargarDatosMaestros();
      procesarAsignaciones();
    } else {
      resetearEstado();
    }
  }, [visible]);

  useEffect(() => {
    if (asignacionesStock && asignacionesStock.length > 0) {
      procesarAsignaciones();
    }
  }, [asignacionesStock]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const cargarDatosMaestros = async () => {
    await Promise.all([
      cargarConceptos(),
      cargarDirecciones()
    ]);
  };

  const cargarConceptos = async () => {
    try {
      setLoadingConceptos(true);

      const data = await getConceptosMovAlmacen();

      let conceptosFiltrados = data || [];

      if (tipoMovimientoId) {
        conceptosFiltrados = conceptosFiltrados.filter(
          c => Number(c.tipoMovimientoId) === Number(tipoMovimientoId)
        );
      }

      setConceptos(conceptosFiltrados);

    } catch (error) {
      console.error("Error al cargar conceptos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los conceptos de movimiento",
        life: 5000
      });
    } finally {
      setLoadingConceptos(false);
    }
  };

  const cargarDirecciones = async () => {
  try {
    setLoadingDirecciones(true);

    // Obtener entidadComercialId de la empresa
    if (!empresaId) {
      setDirecciones([]);
      return;
    }

    const data = await obtenerDireccionesPorEntidad(Number(empresaId));

    setDirecciones(data || []);

  } catch (error) {
    console.error("Error al cargar direcciones:", error);
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: "No se pudieron cargar las direcciones",
      life: 5000
    });
  } finally {
    setLoadingDirecciones(false);
  }
};

  const procesarAsignaciones = () => {
    if (!asignacionesStock || asignacionesStock.length === 0) {
      setAlmacenesAgrupados([]);
      setConfiguraciones([]);
      return;
    }

    const agrupados = agruparPorAlmacen(asignacionesStock);
    setAlmacenesAgrupados(agrupados);

    const configsIniciales = inicializarConfiguraciones(
      agrupados,
      fechaPorDefecto || new Date()
    );
    setConfiguraciones(configsIniciales);
  };

  // ============================================================================
  // HANDLERS DE CONFIGURACIÓN
  // ============================================================================

  const handleCambiarConcepto = (almacenId, conceptoId) => {
    const concepto = obtenerConcepto(conceptos, conceptoId);

    if (!concepto) {
      return;
    }

    const cambios = {
      conceptoMovAlmacenId: Number(conceptoId),
      conceptoMovAlmacenNombre: concepto.nombre || "",
      requiereDireccionOrigen: concepto.requiereDireccionOrigen || false,
      requiereDireccionDestino: concepto.requiereDireccionDestino || false
    };

    const nuevasConfigs = actualizarConfiguracion(configuraciones, almacenId, cambios);
    setConfiguraciones(nuevasConfigs);
  };

  const handleCambiarFecha = (almacenId, fecha) => {
    const nuevasConfigs = actualizarConfiguracion(configuraciones, almacenId, {
      fechaMovimiento: fecha
    });
    setConfiguraciones(nuevasConfigs);
  };

  const handleCambiarDireccionOrigen = (almacenId, direccionId) => {
    const nuevasConfigs = actualizarConfiguracion(configuraciones, almacenId, {
      direccionOrigenId: direccionId ? Number(direccionId) : null
    });
    setConfiguraciones(nuevasConfigs);
  };

  const handleCambiarDireccionDestino = (almacenId, direccionId) => {
    const nuevasConfigs = actualizarConfiguracion(configuraciones, almacenId, {
      direccionDestinoId: direccionId ? Number(direccionId) : null
    });
    setConfiguraciones(nuevasConfigs);
  };

  const handleCambiarObservaciones = (almacenId, observaciones) => {
    const nuevasConfigs = actualizarConfiguracion(configuraciones, almacenId, {
      observaciones: observaciones || ""
    });
    setConfiguraciones(nuevasConfigs);
  };

  // ============================================================================
  // HANDLERS DE CONFIRMACIÓN
  // ============================================================================

  const handleConfirmar = () => {
    const { esValido, mensajes } = validarConfiguracionCompleta(configuraciones);

    if (!esValido) {
      toast.current?.show({
        severity: "error",
        summary: "Configuración Incompleta",
        detail: mensajes.join("\n"),
        life: 7000
      });
      return;
    }

    const resultado = prepararResultado(configuraciones, almacenesAgrupados);

    onConfirmar(resultado);
    handleCerrar();
  };

  const handleCerrar = () => {
    resetearEstado();
    onHide();
  };

  const resetearEstado = () => {
    setAlmacenesAgrupados([]);
    setConfiguraciones([]);
  };

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================

  return {
    // Estados
    toast,
    loading: loading || loadingConceptos || loadingDirecciones,
    loadingConceptos,
    loadingDirecciones,

    // Datos maestros
    conceptos,
    direcciones,

    // Datos procesados
    almacenesAgrupados,
    configuraciones,

    // Handlers
    handleCambiarConcepto,
    handleCambiarFecha,
    handleCambiarDireccionOrigen,
    handleCambiarDireccionDestino,
    handleCambiarObservaciones,
    handleConfirmar,
    handleCerrar,

    // Utilidades
    almacenesConfigurados: contarAlmacenesConfigurados(configuraciones),
    totalAlmacenes: almacenesAgrupados.length
  };
};