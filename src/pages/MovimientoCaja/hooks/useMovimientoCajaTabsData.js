import { useState, useEffect, useCallback, useRef } from "react";

// APIs para tabs de procesos productivos
import { getAllDetMovsEntregaRendir } from "../../../api/detMovsEntregaRendir";
import { getAllEntregaARendir } from "../../../api/entregaARendir";
import { getAllDetMovsEntRendirPescaConsumo } from "../../../api/detMovsEntRendirPescaConsumo";
import { getEntregasARendirPescaConsumo } from "../../../api/entregaARendirPescaConsumo";
import { getDetMovsEntregaRendirPCompras } from "../../../api/detMovsEntregaRendirPCompras";
import { getEntregasARendirPCompras } from "../../../api/entregaARendirPCompras";
import { getAllDetMovsEntregaRendirPVentas } from "../../../api/detMovsEntregaRendirPVentas";
import { getAllEntregaARendirPVentas } from "../../../api/entregaARendirPVentas";
import { getAllDetMovsEntregaRendirMovAlmacen } from "../../../api/detMovsEntregaRendirMovAlmacen";
import { getAllEntregaARendirMovAlmacen } from "../../../api/entregaARendirMovAlmacen";
import { getAllDetMovsEntregaRendirContratoServicios } from "../../../api/detMovsEntregaRendirContratoServicios";
import { getAllEntregaARendirContratoServicios } from "../../../api/entregaARendirContratoServicios";
import { obtenerEntregasRendirOTMantenimiento } from "../../../api/entregaARendirOTMantenimiento.api";
import { obtenerDetMovsEntregaRendirOTMantenimiento } from "../../../api/detMovsEntregaRendirOTMantenimiento.api";
import { getTiposDocumento } from "../../../api/tipoDocumento";

const useMovimientoCajaTabsData = (toast) => {
  // Estados para Pesca Industrial
  const [movimientosDetEntrega, setMovimientosDetEntrega] = useState([]);
  const [entregasARendir, setEntregasARendir] = useState([]);
  const [selectedMovimientosDetEntrega, setSelectedMovimientosDetEntrega] = useState(null);
  const [loadingDetEntrega, setLoadingDetEntrega] = useState(false);
  const [selectedDetMovsIds, setSelectedDetMovsIds] = useState([]);

  // Estados para Pesca Consumo
  const [movimientosDetEntregaConsumo, setMovimientosDetEntregaConsumo] = useState([]);
  const [entregasARendirConsumo, setEntregasARendirConsumo] = useState([]);
  const [selectedMovimientosDetEntregaConsumo, setSelectedMovimientosDetEntregaConsumo] = useState(null);
  const [loadingDetEntregaConsumo, setLoadingDetEntregaConsumo] = useState(false);
  const [selectedDetMovsIdsConsumo, setSelectedDetMovsIdsConsumo] = useState([]);

  // Estados para Compras
  const [movimientosDetEntregaCompras, setMovimientosDetEntregaCompras] = useState([]);
  const [entregasARendirCompras, setEntregasARendirCompras] = useState([]);
  const [selectedMovimientosDetEntregaCompras, setSelectedMovimientosDetEntregaCompras] = useState(null);
  const [loadingDetEntregaCompras, setLoadingDetEntregaCompras] = useState(false);
  const [selectedDetMovsIdsCompras, setSelectedDetMovsIdsCompras] = useState([]);

  // Estados para Ventas
  const [movimientosDetEntregaVentas, setMovimientosDetEntregaVentas] = useState([]);
  const [entregasARendirVentas, setEntregasARendirVentas] = useState([]);
  const [selectedMovimientosDetEntregaVentas, setSelectedMovimientosDetEntregaVentas] = useState(null);
  const [loadingDetEntregaVentas, setLoadingDetEntregaVentas] = useState(false);
  const [selectedDetMovsIdsVentas, setSelectedDetMovsIdsVentas] = useState([]);

  // Estados para Almacén
  const [movimientosDetEntregaAlmacen, setMovimientosDetEntregaAlmacen] = useState([]);
  const [entregasARendirAlmacen, setEntregasARendirAlmacen] = useState([]);
  const [selectedMovimientosDetEntregaAlmacen, setSelectedMovimientosDetEntregaAlmacen] = useState(null);
  const [loadingDetEntregaAlmacen, setLoadingDetEntregaAlmacen] = useState(false);
  const [selectedDetMovsIdsAlmacen, setSelectedDetMovsIdsAlmacen] = useState([]);

  // Estados para Servicios
  const [movimientosDetEntregaServicios, setMovimientosDetEntregaServicios] = useState([]);
  const [entregasARendirServicios, setEntregasARendirServicios] = useState([]);
  const [selectedMovimientosDetEntregaServicios, setSelectedMovimientosDetEntregaServicios] = useState(null);
  const [loadingDetEntregaServicios, setLoadingDetEntregaServicios] = useState(false);
  const [selectedDetMovsIdsServicios, setSelectedDetMovsIdsServicios] = useState([]);

  // Estados para OT Mantenimiento
  const [entregasOTMantenimiento, setEntregasOTMantenimiento] = useState([]);
  const [movimientosOTMantenimiento, setMovimientosOTMantenimiento] = useState([]);
  const [selectedMovimientosOTMantenimiento, setSelectedMovimientosOTMantenimiento] = useState(null);
  const [selectedDetMovsIdsOTMantenimiento, setSelectedDetMovsIdsOTMantenimiento] = useState([]);

  // Estados adicionales
  const [tiposDocumento, setTiposDocumento] = useState([]);

  // Funciones de carga - Pesca Industrial
  const cargarMovimientosDetEntrega = useCallback(async () => {
    setLoadingDetEntrega(true);
    try {
      const data = await getAllDetMovsEntregaRendir();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntrega(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entrega a rendir.",
        life: 3000,
      });
    }
    setLoadingDetEntrega(false);
  }, [toast]);

  const cargarEntregasARendir = useCallback(async () => {
    try {
      const data = await getAllEntregaARendir();
      setEntregasARendir(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - Pesca Consumo
  const cargarMovimientosDetEntregaConsumo = useCallback(async () => {
    setLoadingDetEntregaConsumo(true);
    try {
      const data = await getAllDetMovsEntRendirPescaConsumo();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaConsumo(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entrega a rendir de pesca consumo.",
        life: 3000,
      });
    }
    setLoadingDetEntregaConsumo(false);
  }, [toast]);

  const cargarEntregasARendirConsumo = useCallback(async () => {
    try {
      const data = await getEntregasARendirPescaConsumo();
      setEntregasARendirConsumo(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de pesca consumo.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - Compras
  const cargarMovimientosDetEntregaCompras = useCallback(async () => {
    setLoadingDetEntregaCompras(true);
    try {
      const data = await getDetMovsEntregaRendirPCompras();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaCompras(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de compras.",
        life: 3000,
      });
    }
    setLoadingDetEntregaCompras(false);
  }, [toast]);

  const cargarEntregasARendirCompras = useCallback(async () => {
    try {
      const data = await getEntregasARendirPCompras();
      setEntregasARendirCompras(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de compras.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - Ventas
  const cargarMovimientosDetEntregaVentas = useCallback(async () => {
    setLoadingDetEntregaVentas(true);
    try {
      const data = await getAllDetMovsEntregaRendirPVentas();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaVentas(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de ventas.",
        life: 3000,
      });
    }
    setLoadingDetEntregaVentas(false);
  }, [toast]);

  const cargarEntregasARendirVentas = useCallback(async () => {
    try {
      const data = await getAllEntregaARendirPVentas();
      setEntregasARendirVentas(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de ventas.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - Almacén
  const cargarMovimientosDetEntregaAlmacen = useCallback(async () => {
    setLoadingDetEntregaAlmacen(true);
    try {
      const data = await getAllDetMovsEntregaRendirMovAlmacen();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaAlmacen(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de almacén.",
        life: 3000,
      });
    }
    setLoadingDetEntregaAlmacen(false);
  }, [toast]);

  const cargarEntregasARendirAlmacen = useCallback(async () => {
    try {
      const data = await getAllEntregaARendirMovAlmacen();
      setEntregasARendirAlmacen(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de almacén.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - Servicios
  const cargarMovimientosDetEntregaServicios = useCallback(async () => {
    setLoadingDetEntregaServicios(true);
    try {
      const data = await getAllDetMovsEntregaRendirContratoServicios();
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaServicios(pendientes);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de servicios.",
        life: 3000,
      });
    }
    setLoadingDetEntregaServicios(false);
  }, [toast]);

  const cargarEntregasARendirServicios = useCallback(async () => {
    try {
      const data = await getAllEntregaARendirContratoServicios();
      setEntregasARendirServicios(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de servicios.",
        life: 3000,
      });
    }
  }, [toast]);

  // Funciones de carga - OT Mantenimiento
  const cargarMovimientosOTMantenimiento = useCallback(async () => {
    try {
      const [entregasData, movimientosData] = await Promise.all([
        obtenerEntregasRendirOTMantenimiento(),
        obtenerDetMovsEntregaRendirOTMantenimiento(),
      ]);

      setEntregasOTMantenimiento(entregasData || []);

      const movimientosPendientes = (movimientosData || []).filter(
        (mov) => !mov.validadoTesoreria && !mov.operacionMovCajaId,
      );
      setMovimientosOTMantenimiento(movimientosPendientes);
    } catch (error) {
      console.error("Error cargando movimientos de OT Mantenimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de OT Mantenimiento.",
        life: 3000,
      });
    }
  }, [toast]);

  const cargarEntregasOTMantenimiento = useCallback(async () => {
    try {
      const data = await obtenerEntregasRendirOTMantenimiento();
      setEntregasOTMantenimiento(data || []);
    } catch (error) {
      console.error("Error cargando entregas OT Mantenimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas de OT Mantenimiento.",
        life: 3000,
      });
    }
  }, [toast]);

  // Función de carga - Tipos Documento
  const cargarTiposDocumento = useCallback(async () => {
    try {
      const data = await getTiposDocumento();
      setTiposDocumento(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de documento.",
        life: 3000,
      });
    }
  }, [toast]);

  // Effect para cargar datos iniciales de todos los tabs
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      await cargarTiposDocumento();
      await Promise.all([
        cargarMovimientosDetEntrega(),
        cargarEntregasARendir(),
        cargarMovimientosDetEntregaConsumo(),
        cargarEntregasARendirConsumo(),
        cargarMovimientosDetEntregaCompras(),
        cargarEntregasARendirCompras(),
        cargarMovimientosDetEntregaVentas(),
        cargarEntregasARendirVentas(),
        cargarMovimientosDetEntregaAlmacen(),
        cargarEntregasARendirAlmacen(),
        cargarMovimientosDetEntregaServicios(),
        cargarEntregasARendirServicios(),
        cargarMovimientosOTMantenimiento(),
      ]);
    };

    cargarDatosIniciales();
  }, [
    cargarTiposDocumento,
    cargarMovimientosDetEntrega,
    cargarEntregasARendir,
    cargarMovimientosDetEntregaConsumo,
    cargarEntregasARendirConsumo,
    cargarMovimientosDetEntregaCompras,
    cargarEntregasARendirCompras,
    cargarMovimientosDetEntregaVentas,
    cargarEntregasARendirVentas,
    cargarMovimientosDetEntregaAlmacen,
    cargarEntregasARendirAlmacen,
    cargarMovimientosDetEntregaServicios,
    cargarEntregasARendirServicios,
    cargarMovimientosOTMantenimiento,
  ]);

  return {
    // Pesca Industrial
    entregasARendir,
    movimientosDetEntrega,
    selectedMovimientosDetEntrega,
    setSelectedMovimientosDetEntrega,
    setSelectedDetMovsIds,
    loadingDetEntrega,
    cargarMovimientosDetEntrega,
    cargarEntregasARendir,

    // Pesca Consumo
    entregasARendirConsumo,
    movimientosDetEntregaConsumo,
    selectedMovimientosDetEntregaConsumo,
    setSelectedMovimientosDetEntregaConsumo,
    setSelectedDetMovsIdsConsumo,
    loadingDetEntregaConsumo,
    cargarMovimientosDetEntregaConsumo,
    cargarEntregasARendirConsumo,

    // Compras
    entregasARendirCompras,
    movimientosDetEntregaCompras,
    selectedMovimientosDetEntregaCompras,
    setSelectedMovimientosDetEntregaCompras,
    setSelectedDetMovsIdsCompras,
    loadingDetEntregaCompras,
    cargarMovimientosDetEntregaCompras,
    cargarEntregasARendirCompras,

    // Ventas
    entregasARendirVentas,
    movimientosDetEntregaVentas,
    selectedMovimientosDetEntregaVentas,
    setSelectedMovimientosDetEntregaVentas,
    setSelectedDetMovsIdsVentas,
    loadingDetEntregaVentas,
    cargarMovimientosDetEntregaVentas,
    cargarEntregasARendirVentas,

    // Almacén
    entregasARendirAlmacen,
    movimientosDetEntregaAlmacen,
    selectedMovimientosDetEntregaAlmacen,
    setSelectedMovimientosDetEntregaAlmacen,
    setSelectedDetMovsIdsAlmacen,
    loadingDetEntregaAlmacen,
    cargarMovimientosDetEntregaAlmacen,
    cargarEntregasARendirAlmacen,

    // Servicios
    entregasARendirServicios,
    movimientosDetEntregaServicios,
    selectedMovimientosDetEntregaServicios,
    setSelectedMovimientosDetEntregaServicios,
    setSelectedDetMovsIdsServicios,
    loadingDetEntregaServicios,
    cargarMovimientosDetEntregaServicios,
    cargarEntregasARendirServicios,

    // OT Mantenimiento
    entregasOTMantenimiento,
    movimientosOTMantenimiento,
    selectedMovimientosOTMantenimiento,
    setSelectedMovimientosOTMantenimiento,
    setSelectedDetMovsIdsOTMantenimiento,
    cargarMovimientosOTMantenimiento,
    cargarEntregasOTMantenimiento,

    // Datos adicionales
    tiposDocumento,
  };
};

export default useMovimientoCajaTabsData;
