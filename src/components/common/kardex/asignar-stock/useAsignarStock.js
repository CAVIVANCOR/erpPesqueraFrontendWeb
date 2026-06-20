// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\useAsignarStock.js

import { useState, useEffect, useRef } from "react";
import { getSaldosDetProductoCliente } from "../../../../api/saldosDetProductoCliente";
import {
  agruparPorAlmacen,
  calcularProgreso,
  aplicarFIFO,
  calcularPesoProporcional,
  validarCantidadLote,
  prepararResultado
} from "./asignarStockUtils";

/**
 * ============================================================================
 * CUSTOM HOOK: useAsignarStock
 * ============================================================================
 * 
 * Hook personalizado que encapsula toda la lógica de asignación de stock.
 * Maneja estado, efectos, y handlers para el flujo completo.
 * 
 * @param {Object} config - Configuración del hook
 * @returns {Object} Estados, handlers y datos
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */
export const useAsignarStock = ({
  visible,
  empresaId,
  productoId,
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  asignacionPrevia,
  onConfirmar,
  onHide
}) => {
  const toast = useRef(null);

  // ============================================================================
  // ESTADOS
  // ============================================================================
  
  const [loading, setLoading] = useState(false);
  const [pantalla, setPantalla] = useState(1);
  
  // Stock disponible
  const [stockPorAlmacen, setStockPorAlmacen] = useState([]);
  const [stockDetallado, setStockDetallado] = useState([]);
  
  // Almacén seleccionado
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
  
  // Asignaciones
  const [asignaciones, setAsignaciones] = useState([]);
  const [lotesSeleccionados, setLotesSeleccionados] = useState([]);
  
  // Progreso
  const [cantidadAsignada, setCantidadAsignada] = useState(0);
  const [porcentajeAsignado, setPorcentajeAsignado] = useState(0);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (visible && empresaId && productoId) {
      cargarStockDisponible();
      
      if (asignacionPrevia && asignacionPrevia.lotes) {
        setAsignaciones(asignacionPrevia.lotes);
        const { cantidadAsignada, porcentajeAsignado } = calcularProgreso(
          asignacionPrevia.lotes,
          cantidadRequerida
        );
        setCantidadAsignada(cantidadAsignada);
        setPorcentajeAsignado(porcentajeAsignado);
      } else {
        resetearEstado();
      }
    }
  }, [visible, empresaId, productoId]);

  useEffect(() => {
    const { cantidadAsignada, porcentajeAsignado } = calcularProgreso(
      asignaciones,
      cantidadRequerida
    );
    setCantidadAsignada(cantidadAsignada);
    setPorcentajeAsignado(porcentajeAsignado);
  }, [asignaciones, cantidadRequerida]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const cargarStockDisponible = async () => {
    try {
      setLoading(true);

      const saldos = await getSaldosDetProductoCliente({
        empresaId: Number(empresaId),
        productoId: Number(productoId),
        soloConSaldo: true,
        esCustodia: false
      });

      if (!saldos || saldos.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Sin Stock",
          detail: "No hay stock disponible para este producto",
          life: 5000
        });
        setStockPorAlmacen([]);
        return;
      }

      const agrupado = agruparPorAlmacen(saldos);
      setStockPorAlmacen(agrupado);

    } catch (error) {
      console.error("Error al cargar stock:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el stock disponible",
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS DE NAVEGACIÓN
  // ============================================================================

  const handleSeleccionarAlmacen = (almacen) => {
    setAlmacenSeleccionado(almacen);
    setStockDetallado(almacen.lotes);
    setLotesSeleccionados([]);
    setPantalla(2);
  };

  const handleVolverAPantalla1 = () => {
    setPantalla(1);
    setAlmacenSeleccionado(null);
    setStockDetallado([]);
    setLotesSeleccionados([]);
  };

  const handleIrAConfirmacion = () => {
    if (cantidadAsignada < cantidadRequerida) {
      toast.current?.show({
        severity: "warn",
        summary: "Asignación Incompleta",
        detail: `Falta asignar ${cantidadRequerida - cantidadAsignada} ${unidadMedida}`,
        life: 5000
      });
      return;
    }

    setPantalla(3);
  };

  const handleVolverDesdePantalla3 = () => {
    setPantalla(1);
  };

  // ============================================================================
  // HANDLERS DE ASIGNACIÓN
  // ============================================================================

  const handleAgregarSeleccion = () => {
    if (lotesSeleccionados.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin Selección",
        detail: "Debe seleccionar al menos un lote",
        life: 3000
      });
      return;
    }

    const nuevasAsignaciones = [...asignaciones, ...lotesSeleccionados];
    setAsignaciones(nuevasAsignaciones);

    toast.current?.show({
      severity: "success",
      summary: "Lotes Agregados",
      detail: `Se agregaron ${lotesSeleccionados.length} lote(s) de ${almacenSeleccionado.almacenNombre}`,
      life: 3000
    });

    handleVolverAPantalla1();
  };

  const handleEliminarAsignacion = (index) => {
    const nuevasAsignaciones = asignaciones.filter((_, i) => i !== index);
    setAsignaciones(nuevasAsignaciones);

    toast.current?.show({
      severity: "info",
      summary: "Lote Eliminado",
      detail: "Asignación eliminada correctamente",
      life: 3000
    });
  };

  const handleToggleLote = (lote, checked) => {
    if (checked) {
      const loteConCantidad = {
        ...lote,
        cantidadAsignada: Number(lote.saldoCantidad || 0),
        pesoAsignado: Number(lote.saldoPeso || 0)
      };
      setLotesSeleccionados([...lotesSeleccionados, loteConCantidad]);
    } else {
      setLotesSeleccionados(lotesSeleccionados.filter(l => l.id !== lote.id));
    }
  };

  const handleCambiarCantidad = (lote, nuevaCantidad) => {
    const cantidadMaxima = Number(lote.saldoCantidad || 0);
    const cantidadValida = validarCantidadLote(nuevaCantidad, cantidadMaxima);

    const pesoAsignado = calcularPesoProporcional(
      cantidadValida,
      cantidadMaxima,
      Number(lote.saldoPeso || 0)
    );

    setLotesSeleccionados(lotesSeleccionados.map(l =>
      l.id === lote.id
        ? { ...l, cantidadAsignada: cantidadValida, pesoAsignado: pesoAsignado }
        : l
    ));
  };

  const handleAsignarAutomaticoFIFO = () => {
    if (cantidadAsignada >= cantidadRequerida) {
      toast.current?.show({
        severity: "info",
        summary: "Ya Completado",
        detail: "La asignación ya está completa",
        life: 3000
      });
      return;
    }

    const nuevosLotes = aplicarFIFO(stockDetallado, cantidadRequerida, cantidadAsignada);

    setLotesSeleccionados(nuevosLotes);

    toast.current?.show({
      severity: "success",
      summary: "FIFO Aplicado",
      detail: `Se seleccionaron ${nuevosLotes.length} lote(s) automáticamente`,
      life: 3000
    });
  };

  // ============================================================================
  // HANDLERS DE CONFIRMACIÓN
  // ============================================================================

  const handleConfirmarAsignacion = () => {
    if (cantidadAsignada < cantidadRequerida) {
      toast.current?.show({
        severity: "error",
        summary: "Asignación Incompleta",
        detail: `Debe asignar ${cantidadRequerida} ${unidadMedida}. Asignado: ${cantidadAsignada}`,
        life: 5000
      });
      return;
    }

    const resultado = prepararResultado({
      productoId,
      productoNombre,
      cantidadRequerida,
      cantidadAsignada,
      asignaciones
    });

    onConfirmar(resultado);
    handleCerrar();
  };

  const handleCerrar = () => {
    resetearEstado();
    onHide();
  };

  const resetearEstado = () => {
    setPantalla(1);
    setAsignaciones([]);
    setLotesSeleccionados([]);
    setAlmacenSeleccionado(null);
    setStockDetallado([]);
    setCantidadAsignada(0);
    setPorcentajeAsignado(0);
  };

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================

  return {
    // Estados
    toast,
    loading,
    pantalla,
    stockPorAlmacen,
    stockDetallado,
    almacenSeleccionado,
    asignaciones,
    lotesSeleccionados,
    cantidadAsignada,
    porcentajeAsignado,

    // Handlers de navegación
    handleSeleccionarAlmacen,
    handleVolverAPantalla1,
    handleIrAConfirmacion,
    handleVolverDesdePantalla3,

    // Handlers de asignación
    handleAgregarSeleccion,
    handleEliminarAsignacion,
    handleToggleLote,
    handleCambiarCantidad,
    handleAsignarAutomaticoFIFO,

    // Handlers de confirmación
    handleConfirmarAsignacion,
    handleCerrar,

    // Datos adicionales
    productoNombre,
    cantidadRequerida,
    unidadMedida
  };
};