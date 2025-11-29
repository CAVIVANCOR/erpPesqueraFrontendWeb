// src/pages/MovimientoCaja.jsx
// Pantalla CRUD profesional para MovimientoCaja. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import MovimientoCajaForm from "../components/movimientoCaja/MovimientoCajaForm";
// Imports de TabPanels modulares
import TabPanelPescaIndustrial from "../components/movimientoCaja/TabPanelPescaIndustrial";
import TabPanelPescaConsumo from "../components/movimientoCaja/TabPanelPescaConsumo";
import TabPanelCompras from "../components/movimientoCaja/TabPanelCompras";
import TabPanelVentas from "../components/movimientoCaja/TabPanelVentas";
import TabPanelAlmacen from "../components/movimientoCaja/TabPanelAlmacen";
import TabPanelServicios from "../components/movimientoCaja/TabPanelServicios";
import TabPanelMantenimiento from "../components/movimientoCaja/TabPanelMantenimiento";
// APIs para Compras
import { getDetMovsEntregaRendirPCompras } from "../api/detMovsEntregaRendirPCompras";
import { getEntregasARendirPCompras } from "../api/entregaARendirPCompras";
// APIs para Ventas
import { getAllDetMovsEntregaRendirPVentas } from "../api/detMovsEntregaRendirPVentas";
import { getAllEntregaARendirPVentas } from "../api/entregaARendirPVentas";
// APIs para Almacén
import { getAllDetMovsEntregaRendirMovAlmacen } from "../api/detMovsEntregaRendirMovAlmacen";
import { getAllEntregaARendirMovAlmacen } from "../api/entregaARendirMovAlmacen";
// APIs para Contratos de Servicios
import { getAllDetMovsEntregaRendirContratoServicios } from "../api/detMovsEntregaRendirContratoServicios";
import { getAllEntregaARendirContratoServicios } from "../api/entregaARendirContratoServicios";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getProductos } from "../api/producto";
import { obtenerEntregasRendirOTMantenimiento } from '../api/entregaARendirOTMantenimiento.api';
import { obtenerDetMovsEntregaRendirOTMantenimiento } from '../api/detMovsEntregaRendirOTMantenimiento.api';
import TabPanelOTMantenimiento from '../components/movimientoCaja/TabPanelOTMantenimiento';
import {
  getAllMovimientoCaja,
  crearMovimientoCaja,
  actualizarMovimientoCaja,
  eliminarMovimientoCaja,
  validarMovimientoCaja,
} from "../api/movimientoCaja";
import { getCentrosCosto } from "../api/centroCosto";
import { getModulos } from "../api/moduloSistema";
import { getPersonal } from "../api/personal";
import { getEmpresas } from "../api/empresa";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { getAllTipoReferenciaMovimientoCaja } from "../api/tipoReferenciaMovimientoCaja";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getCtasCteEntidad } from "../api/ctaCteEntidad";
import { getAllDetMovsEntregaRendir } from "../api/detMovsEntregaRendir";
import { getAllEntregaARendir } from "../api/entregaARendir";
import { getAllDetMovsEntRendirPescaConsumo } from "../api/detMovsEntRendirPescaConsumo";
import { getEntregasARendirPescaConsumo } from "../api/entregaARendirPescaConsumo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";

export default function MovimientoCaja() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tipoMovEntregaRendir, setTipoMovEntregaRendir] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tipoReferenciaMovimientoCaja, setTipoReferenciaMovimientoCaja] =
    useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [cuentasEntidadComercial, setCuentasEntidadComercial] = useState([]);

  // Estados para DetEntregaRendirPescaIndustrial
  const [movimientosDetEntrega, setMovimientosDetEntrega] = useState([]);
  const [entregasARendir, setEntregasARendir] = useState([]);
  const [selectedMovimientosDetEntrega, setSelectedMovimientosDetEntrega] =
    useState(null);
  const [loadingDetEntrega, setLoadingDetEntrega] = useState(false);
  const [selectedDetMovsIds, setSelectedDetMovsIds] = useState([]);
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]);

  // Estados para DetEntregaRendirNovedadConsumo (Pesca Consumo)
  const [movimientosDetEntregaConsumo, setMovimientosDetEntregaConsumo] =
    useState([]);
  const [entregasARendirConsumo, setEntregasARendirConsumo] = useState([]);
  const [
    selectedMovimientosDetEntregaConsumo,
    setSelectedMovimientosDetEntregaConsumo,
  ] = useState(null);
  const [loadingDetEntregaConsumo, setLoadingDetEntregaConsumo] =
    useState(false);
  const [selectedDetMovsIdsConsumo, setSelectedDetMovsIdsConsumo] = useState(
    []
  );
  // Estados para DetEntregaRendirCompras (Compras)
  const [movimientosDetEntregaCompras, setMovimientosDetEntregaCompras] =
    useState([]);
  const [entregasARendirCompras, setEntregasARendirCompras] = useState([]);
  const [
    selectedMovimientosDetEntregaCompras,
    setSelectedMovimientosDetEntregaCompras,
  ] = useState(null);
  const [loadingDetEntregaCompras, setLoadingDetEntregaCompras] =
    useState(false);
  const [selectedDetMovsIdsCompras, setSelectedDetMovsIdsCompras] = useState(
    []
  );
  // Estados para DetEntregaRendirVentas (Ventas)
  const [movimientosDetEntregaVentas, setMovimientosDetEntregaVentas] =
    useState([]);
  const [entregasARendirVentas, setEntregasARendirVentas] = useState([]);
  const [
    selectedMovimientosDetEntregaVentas,
    setSelectedMovimientosDetEntregaVentas,
  ] = useState(null);
  const [loadingDetEntregaVentas, setLoadingDetEntregaVentas] =
    useState(false);
  const [selectedDetMovsIdsVentas, setSelectedDetMovsIdsVentas] = useState(
    []
  );
  // Estados para DetEntregaRendirMovAlmacen (Almacén)
  const [movimientosDetEntregaAlmacen, setMovimientosDetEntregaAlmacen] =
    useState([]);
  const [entregasARendirAlmacen, setEntregasARendirAlmacen] = useState([]);
  const [
    selectedMovimientosDetEntregaAlmacen,
    setSelectedMovimientosDetEntregaAlmacen,
  ] = useState(null);
  const [loadingDetEntregaAlmacen, setLoadingDetEntregaAlmacen] =
    useState(false);
  const [selectedDetMovsIdsAlmacen, setSelectedDetMovsIdsAlmacen] = useState(
    []
  );
  // Estados para DetEntregaRendirContratoServicios (Servicios)
  const [movimientosDetEntregaServicios, setMovimientosDetEntregaServicios] =
    useState([]);
  const [entregasARendirServicios, setEntregasARendirServicios] = useState([]);
  const [
    selectedMovimientosDetEntregaServicios,
    setSelectedMovimientosDetEntregaServicios,
  ] = useState(null);
  const [loadingDetEntregaServicios, setLoadingDetEntregaServicios] =
    useState(false);
  const [selectedDetMovsIdsServicios, setSelectedDetMovsIdsServicios] = useState(
    []
  );
  // Estados para OT Mantenimiento
  const [entregasOTMantenimiento, setEntregasOTMantenimiento] = useState([]);
  const [movimientosOTMantenimiento, setMovimientosOTMantenimiento] = useState([]);
    // Estados para OT Mantenimiento
  const [selectedMovimientosOTMantenimiento, setSelectedMovimientosOTMantenimiento] = useState(null);
  const [selectedDetMovsIdsOTMantenimiento, setSelectedDetMovsIdsOTMantenimiento] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [productos, setProductos] = useState([]);

  const cargarEstadosMultiFuncion = async () => {
    try {
      const data = await getEstadosMultiFuncion();
      // Filtrar solo los estados de "MOVIMIENTOS CAJA" (tipoProvieneDeId === 6)
      const estadosFiltrados = data.filter(
        (estado) => Number(estado.tipoProvieneDeId) === 6
      );
      setEstadosMultiFuncion(estadosFiltrados);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los estados multifunción.",
      });
    }
  };

  useEffect(() => {
    cargarItems();
    cargarCentrosCosto();
    cargarModulos();
    cargarPersonal();
    cargarEmpresas();
    cargarTipoMovEntregaRendir();
    cargarMonedas();
    cargarTipoReferenciaMovimientoCaja();
    cargarCuentasCorrientes();
    cargarEntidadesComerciales();
    cargarCuentasEntidadComercial();
    cargarMovimientosDetEntrega();
    cargarEntregasARendir();
    cargarMovimientosDetEntregaConsumo();
    cargarEntregasARendirConsumo();
    cargarEstadosMultiFuncion();
    cargarMovimientosDetEntregaCompras();
    cargarEntregasARendirCompras();
    cargarMovimientosDetEntregaVentas();
    cargarEntregasARendirVentas();
    cargarMovimientosDetEntregaAlmacen();
    cargarEntregasARendirAlmacen();
    cargarMovimientosDetEntregaServicios();
    cargarEntregasARendirServicios();
    cargarTiposDocumento();
    cargarProductos();
    cargarMovimientosOTMantenimiento();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllMovimientoCaja();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de caja.",
      });
    }
    setLoading(false);
  };

  const cargarCentrosCosto = async () => {
    try {
      const data = await getCentrosCosto();
      setCentrosCosto(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los centros de costo.",
      });
    }
  };

  const cargarModulos = async () => {
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los módulos.",
      });
    }
  };

  const cargarPersonal = async () => {
    try {
      const data = await getPersonal();
      setPersonal(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el personal.",
      });
    }
  };

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las empresas.",
      });
    }
  };

  const cargarTipoMovEntregaRendir = async () => {
    try {
      const data = await getAllTipoMovEntregaRendir();
      setTipoMovEntregaRendir(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de movimiento.",
      });
    }
  };

  const cargarMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las monedas.",
      });
    }
  };

  const cargarTipoReferenciaMovimientoCaja = async () => {
    try {
      const data = await getAllTipoReferenciaMovimientoCaja();
      setTipoReferenciaMovimientoCaja(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de referencia.",
      });
    }
  };

  const cargarCuentasCorrientes = async () => {
    try {
      const data = await getAllCuentaCorriente();
      setCuentasCorrientes(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las cuentas corrientes.",
      });
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entidades comerciales.",
      });
    }
  };

  const cargarCuentasEntidadComercial = async () => {
    try {
      const data = await getCtasCteEntidad();
      setCuentasEntidadComercial(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las cuentas de entidades comerciales.",
      });
    }
  };

  // Funciones para cargar datos de DetEntregaRendirPescaIndustrial
  const cargarMovimientosDetEntrega = async () => {
    setLoadingDetEntrega(true);
    try {
      const data = await getAllDetMovsEntregaRendir();
      // Filtrar solo los movimientos pendientes (no validados por tesorería)
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntrega(pendientes);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entrega a rendir.",
      });
    }
    setLoadingDetEntrega(false);
  };

  const cargarEntregasARendir = async () => {
    try {
      const data = await getAllEntregaARendir();
      setEntregasARendir(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir.",
      });
    }
  };



  // Funciones para cargar datos de DetEntregaRendirNovedadConsumo (Pesca Consumo)
  const cargarMovimientosDetEntregaConsumo = async () => {
    setLoadingDetEntregaConsumo(true);
    try {
      const data = await getAllDetMovsEntRendirPescaConsumo();
      // Filtrar solo los movimientos pendientes (no validados por tesorería)
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaConsumo(pendientes);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "No se pudo cargar los movimientos de entrega a rendir de pesca consumo.",
      });
    }
    setLoadingDetEntregaConsumo(false);
  };

  const cargarEntregasARendirConsumo = async () => {
    try {
      const data = await getEntregasARendirPescaConsumo();
      setEntregasARendirConsumo(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de pesca consumo.",
      });
    }
  };

  // Cargar movimientos de entregas a rendir para Compras
  const cargarMovimientosDetEntregaCompras = async () => {
    try {
      setLoadingDetEntregaCompras(true);
      const data = await getDetMovsEntregaRendirPCompras();
      // Filtrar solo los movimientos pendientes (no validados por tesorería)
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaCompras(pendientes);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "No se pudo cargar los movimientos de entregas a rendir de compras.",
      });
    } finally {
      setLoadingDetEntregaCompras(false);
    }
  };

  const cargarEntregasARendirCompras = async () => {
    try {
      const data = await getEntregasARendirPCompras();
      setEntregasARendirCompras(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de compras.",
      });
    }
  };

  // Cargar movimientos de entregas a rendir para Ventas
  const cargarMovimientosDetEntregaVentas = async () => {
    try {
      setLoadingDetEntregaVentas(true);
      const data = await getAllDetMovsEntregaRendirPVentas();
      // Filtrar solo los movimientos pendientes (no validados por tesorería)
      const pendientes = data.filter((mov) => !mov.validadoTesoreria);
      setMovimientosDetEntregaVentas(pendientes);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "No se pudo cargar los movimientos de entregas a rendir de ventas.",
      });
    } finally {
      setLoadingDetEntregaVentas(false);
    }
  };

  const cargarEntregasARendirVentas = async () => {
    try {
      const data = await getAllEntregaARendirPVentas();
      setEntregasARendirVentas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de ventas.",
      });
    }
  };

  // Cargar movimientos de entregas a rendir para Almacén
  const cargarMovimientosDetEntregaAlmacen = async () => {
    try {
      setLoadingDetEntregaAlmacen(true);
      const data = await getAllDetMovsEntregaRendirMovAlmacen();
      setMovimientosDetEntregaAlmacen(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de almacén.",
      });
    } finally {
      setLoadingDetEntregaAlmacen(false);
    }
  };

  const cargarEntregasARendirAlmacen = async () => {
    try {
      const data = await getAllEntregaARendirMovAlmacen();
      setEntregasARendirAlmacen(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de almacén.",
      });
    }
  };

  // Cargar movimientos de entregas a rendir para Contratos de Servicios
  const cargarMovimientosDetEntregaServicios = async () => {
    try {
      setLoadingDetEntregaServicios(true);
      const data = await getAllDetMovsEntregaRendirContratoServicios();
      setMovimientosDetEntregaServicios(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entregas a rendir de servicios.",
      });
    } finally {
      setLoadingDetEntregaServicios(false);
    }
  };

  const cargarEntregasARendirServicios = async () => {
    try {
      const data = await getAllEntregaARendirContratoServicios();
      setEntregasARendirServicios(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de servicios.",
      });
    }
  };

  // Cargar movimientos de entregas a rendir para OT Mantenimiento
  const cargarMovimientosOTMantenimiento = async () => {
    try {
      const [entregasData, movimientosData] = await Promise.all([
        obtenerEntregasRendirOTMantenimiento(),
        obtenerDetMovsEntregaRendirOTMantenimiento()
      ]);
      
      setEntregasOTMantenimiento(entregasData || []);
      
      // Filtrar solo movimientos no validados por tesorería
      const movimientosPendientes = (movimientosData || []).filter(
        mov => !mov.validadoTesoreria && !mov.operacionMovCajaId
      );
      setMovimientosOTMantenimiento(movimientosPendientes);
    } catch (error) {
      console.error('Error cargando movimientos de OT Mantenimiento:', error);
    }
  };

  const cargarTiposDocumento = async () => {
    try {
      const data = await getTiposDocumento();
      setTiposDocumento(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de documento.",
      });
    }
  };

  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los productos.",
      });
    }
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarMovimientoCaja(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarMovimientoCaja(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
        // Recargar datos del movimiento actualizado
        const movimientoActualizado = await getAllMovimientoCaja();
        const movActualizado = movimientoActualizado.find(
          (m) => m.id === editing.id
        );
        if (movActualizado) {
          setEditing(movActualizado);
        }
        cargarItems();
      } else {
        const nuevoMovimiento = await crearMovimientoCaja(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail:
            "Registro creado exitosamente. Puede continuar editando o cerrar la ventana.",
          life: 4000,
        });
        // Recargar datos del movimiento recién creado para mostrar el PDF
        const movimientos = await getAllMovimientoCaja();
        const movimientoCreado = movimientos.find(
          (m) => m.id === nuevoMovimiento.id
        );
        if (movimientoCreado) {
          setEditing(movimientoCreado);
        }
        cargarItems();
        // NO cerrar el diálogo para que el usuario pueda ver el PDF
      }
    } catch (err) {
      console.error("Error al guardar movimiento de caja:", err);
      const mensajeError =
        err.response?.data?.mensaje ||
        err.message ||
        "No se pudo guardar el movimiento de caja.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleValidarMovimiento = async (movimiento) => {
    setLoading(true);
    try {
      await validarMovimientoCaja(movimiento.id);
      toast.current.show({
        severity: "success",
        summary: "Validado",
        detail: "Movimiento validado correctamente y origen actualizado.",
        life: 4000,
      });
      setShowDialog(false);
      setEditing(null);
      cargarItems();
      cargarMovimientosDetEntrega();
      cargarMovimientosDetEntregaConsumo();
      cargarMovimientosDetEntregaCompras();
      cargarMovimientosDetEntregaVentas();
      cargarMovimientosDetEntregaAlmacen();
      cargarMovimientosDetEntregaServicios();
      cargarMovimientosOTMantenimiento();
    } catch (err) {
      const mensajeError =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "No se pudo validar el movimiento.";
      toast.current.show({
        severity: "error",
        summary: "Error al Validar",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleGenerarAsiento = async (movimiento) => {
    toast.current.show({
      severity: "info",
      summary: "En Desarrollo",
      detail: "Funcionalidad de generar asiento contable en desarrollo.",
      life: 3000,
    });
  };

  /**
   * Maneja la aplicación de movimientos seleccionados para crear un MovimientoCaja
   * REGLA: Solo se permite seleccionar UN item a la vez
   */
  const handleAplicarMovimientos = async (
    movimientoSeleccionado,
    tipoOrigen
  ) => {
    // Validar que haya un movimiento seleccionado
    if (!movimientoSeleccionado) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un movimiento",
        life: 3000,
      });
      return;
    }

    try {
      // Buscar el estado "PENDIENTE" (id=20)
      const estadoPendiente = estadosMultiFuncion.find(
        (estado) => Number(estado.id) === 20
      );

      if (!estadoPendiente) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el estado PENDIENTE (id=20)",
          life: 3000,
        });
        return;
      }

      // Obtener la entrega a rendir completa con sus relaciones
      let empresaDestinoId = null;

      if (tipoOrigen === "industrial") {
        // Para Pesca Industrial: DetMovsEntregaRendir -> EntregaARendir -> TemporadaPesca -> empresaId
        const entregaARendir = entregasARendir.find(
          (e) =>
            Number(e.id) === Number(movimientoSeleccionado.entregaARendirId)
        );

        if (entregaARendir && entregaARendir.temporadaPesca) {
          empresaDestinoId = entregaARendir.temporadaPesca.empresaId;
        }
      } else if (tipoOrigen === "consumo") {
        // Para Pesca Consumo: DetMovsEntRendirPescaConsumo -> EntregaARendirPescaConsumo -> NovedadPescaConsumo -> empresaId
        const entregaARendirConsumo = entregasARendirConsumo.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirPescaConsumoId)
        );

        if (
          entregaARendirConsumo &&
          entregaARendirConsumo.novedadPescaConsumo
        ) {
          empresaDestinoId =
            entregaARendirConsumo.novedadPescaConsumo.empresaId;
        }
      } else if (tipoOrigen === "compras") {
        // Para Compras: DetMovsEntregaRendirPCompras -> EntregaARendirPCompras -> RequerimientoCompra -> empresaId
        const entregaARendirCompras = entregasARendirCompras.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirPComprasId)
        );

        if (
          entregaARendirCompras &&
          entregaARendirCompras.requerimientoCompra
        ) {
          empresaDestinoId = entregaARendirCompras.requerimientoCompra.empresaId;
        }
      } else if (tipoOrigen === "ventas") {
        // Para Ventas: DetMovsEntregaRendirPVentas -> EntregaARendirPVentas -> CotizacionVentas -> empresaId
        const entregaARendirVentas = entregasARendirVentas.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirPVentasId)
        );

        if (
          entregaARendirVentas &&
          entregaARendirVentas.cotizacionVentas
        ) {
          empresaDestinoId = entregaARendirVentas.cotizacionVentas.empresaId;
        }
      } else if (tipoOrigen === "almacen") {
        // Para Almacén: DetMovsEntregaRendirMovAlmacen -> EntregaARendirMovAlmacen -> MovimientoAlmacen -> empresaId
        const entregaARendirAlmacen = entregasARendirAlmacen.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirMovAlmacenId)
        );

        if (
          entregaARendirAlmacen &&
          entregaARendirAlmacen.movimientoAlmacen
        ) {
          empresaDestinoId = entregaARendirAlmacen.movimientoAlmacen.empresaId;
        }
      } else if (tipoOrigen === "servicios") {
        // Para Servicios: DetMovsEntregaRendirContratoServicios -> EntregaARendirContratoServicios -> ContratoServicio -> empresaId
        const entregaARendirServicios = entregasARendirServicios.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirContratoServiciosId)
        );

        if (
          entregaARendirServicios &&
          entregaARendirServicios.contratoServicio
        ) {
          empresaDestinoId = entregaARendirServicios.contratoServicio.empresaId;
        }
      } else if (tipoOrigen === "otMantenimiento") {
        // Para OT Mantenimiento: DetMovsEntregaRendirOTMantenimiento -> EntregaARendirOTMantenimiento -> OTMantenimiento -> empresaId
        const entregaARendirOTMantenimiento = entregasOTMantenimiento.find(
          (e) =>
            Number(e.id) ===
            Number(movimientoSeleccionado.entregaARendirOTMantenimientoId)
        );

        if (
          entregaARendirOTMantenimiento &&
          entregaARendirOTMantenimiento.otMantenimiento
        ) {
          empresaDestinoId = entregaARendirOTMantenimiento.otMantenimiento.empresaId;
        }
      }

      // Determinar el módulo origen según el tipo
      let moduloOrigenId = movimientoSeleccionado.moduloOrigenMovCajaId
        ? Number(movimientoSeleccionado.moduloOrigenMovCajaId)
        : null;

      if (!moduloOrigenId) {
        if (tipoOrigen === "industrial") {
          moduloOrigenId = 2; // PESCA INDUSTRIAL
        } else if (tipoOrigen === "consumo") {
          moduloOrigenId = 3; // PESCA CONSUMO
        } else if (tipoOrigen === "compras") {
          moduloOrigenId = 4; // COMPRAS
        } else if (tipoOrigen === "ventas") {
          moduloOrigenId = 5; // VENTAS
        } else if (tipoOrigen === "almacen") {
          moduloOrigenId = 6; // ALMACÉN
        } else if (tipoOrigen === "servicios") {
          moduloOrigenId = 7; // SERVICIOS (Contratos de Servicios)
        } else if (tipoOrigen === "otMantenimiento") {
          moduloOrigenId = 8; // OT MANTENIMIENTO
        }
      }



            // Preparar datos iniciales para el formulario de MovimientoCaja según el mapeo
      const datosIniciales = {
        // Campos automáticos del mapeo
        empresaDestinoId: empresaDestinoId ? Number(empresaDestinoId) : null,
        tipoMovimientoId: movimientoSeleccionado.tipoMovimientoId
          ? Number(movimientoSeleccionado.tipoMovimientoId)
          : null,
        entidadComercialId: movimientoSeleccionado.entidadComercialId
          ? Number(movimientoSeleccionado.entidadComercialId)
          : null,
        monto: Number(movimientoSeleccionado.monto) || 0,
        monedaId: movimientoSeleccionado.monedaId
          ? Number(movimientoSeleccionado.monedaId)
          : null,
        descripcion: movimientoSeleccionado.descripcion || "",
        fechaMotivoOperacion: movimientoSeleccionado.fechaMovimiento
          ? new Date(movimientoSeleccionado.fechaMovimiento)
          : null,
        usuarioMotivoOperacionId: movimientoSeleccionado.responsableId
          ? Number(movimientoSeleccionado.responsableId)
          : null,
        moduloOrigenMotivoOperacionId: moduloOrigenId,
        estadoId: Number(estadoPendiente.id), // 20 - PENDIENTE
        centroCostoId: movimientoSeleccionado.centroCostoId
          ? Number(movimientoSeleccionado.centroCostoId)
          : null,
        origenMotivoOperacionId: Number(movimientoSeleccionado.id),
        operacionSinFactura:
          movimientoSeleccionado.operacionSinFactura || false,
        productoId: movimientoSeleccionado.productoId
          ? Number(movimientoSeleccionado.productoId)
          : null,

        // Campos que se llenarán en el formulario
        empresaOrigenId: null,
        cuentaCorrienteOrigenId: null,
        cuentaCorrienteDestinoId: null,
        referenciaExtId: null,
        tipoReferenciaId: null,
        usuarioId: usuario?.id ? Number(usuario.id) : null,

        // Fechas automáticas
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        fechaOperacionMovCaja: new Date(),

        // Metadata para el formulario
        movimientoAplicado: movimientoSeleccionado,
        tipoOrigen: tipoOrigen,
      };

      // Abrir el diálogo con los datos iniciales
      setEditing(datosIniciales);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al preparar datos:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar los datos del movimiento",
        life: 3000,
      });
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro de eliminar este registro?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />

    {/* TabView con TabPanels Modulares */}
    <TabView>
      <TabPanel header="Pesca Industrial">
        <TabPanelPescaIndustrial
          entregaARendir={entregasARendir[0] || null}
          movimientos={movimientosDetEntrega}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          loading={loadingDetEntrega}
          selectedMovimiento={selectedMovimientosDetEntrega}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntrega(e.value);
            setSelectedDetMovsIds(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntrega();
            cargarEntregasARendir();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntrega,
              "industrial"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="Pesca Consumo">
        <TabPanelPescaConsumo
          entregaARendir={entregasARendirConsumo[0] || null}
          movimientos={movimientosDetEntregaConsumo}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          loading={loadingDetEntregaConsumo}
          selectedMovimiento={selectedMovimientosDetEntregaConsumo}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntregaConsumo(e.value);
            setSelectedDetMovsIdsConsumo(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntregaConsumo();
            cargarEntregasARendirConsumo();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntregaConsumo,
              "consumo"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="Compras">
        <TabPanelCompras
          entregaARendir={entregasARendirCompras[0] || null}
          movimientos={movimientosDetEntregaCompras}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          loading={loadingDetEntregaCompras}
          selectedMovimiento={selectedMovimientosDetEntregaCompras}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntregaCompras(e.value);
            setSelectedDetMovsIdsCompras(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntregaCompras();
            cargarEntregasARendirCompras();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntregaCompras,
              "compras"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="Ventas">
        <TabPanelVentas
          entregaARendir={entregasARendirVentas[0] || null}
          movimientos={movimientosDetEntregaVentas}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          loading={loadingDetEntregaVentas}
          selectedMovimiento={selectedMovimientosDetEntregaVentas}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntregaVentas(e.value);
            setSelectedDetMovsIdsVentas(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntregaVentas();
            cargarEntregasARendirVentas();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntregaVentas,
              "ventas"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="Almacén">
        <TabPanelAlmacen
          entregaARendir={entregasARendirAlmacen[0] || null}
          movimientos={movimientosDetEntregaAlmacen}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          loading={loadingDetEntregaAlmacen}
          selectedMovimiento={selectedMovimientosDetEntregaAlmacen}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntregaAlmacen(e.value);
            setSelectedDetMovsIdsAlmacen(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntregaAlmacen();
            cargarEntregasARendirAlmacen();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntregaAlmacen,
              "almacen"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="Servicios">
        <TabPanelServicios
          entregaARendir={entregasARendirServicios[0] || null}
          movimientos={movimientosDetEntregaServicios}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          loading={loadingDetEntregaServicios}
          selectedMovimiento={selectedMovimientosDetEntregaServicios}
          onSelectionChange={(e) => {
            setSelectedMovimientosDetEntregaServicios(e.value);
            setSelectedDetMovsIdsServicios(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosDetEntregaServicios();
            cargarEntregasARendirServicios();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosDetEntregaServicios,
              "servicios"
            )
          }
          toast={toast}
        />
      </TabPanel>

      <TabPanel header="OT Mantenimiento">
        <TabPanelOTMantenimiento
          entregaARendir={entregasOTMantenimiento[0] || null}
          movimientos={movimientosOTMantenimiento}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tipoMovEntregaRendir}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          loading={false}
          selectedMovimiento={selectedMovimientosOTMantenimiento}
          onSelectionChange={(e) => {
            setSelectedMovimientosOTMantenimiento(e.value);
            setSelectedDetMovsIdsOTMantenimiento(e.value ? [e.value.id] : []);
          }}
          onDataChange={() => {
            cargarMovimientosOTMantenimiento();
          }}
          onAplicarValidacion={() =>
            handleAplicarMovimientos(
              selectedMovimientosOTMantenimiento,
              "otMantenimiento"
            )
          }
          toast={toast}
        />
      </TabPanel>
    </TabView>

    {/* Sección CRUD de Movimientos de Caja */}
    <Card className="mt-4">
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Registro de Movimientos de Caja</h2>
        <Button
          label="Nuevo Movimiento"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => {
            setEditing(null);
            setShowDialog(true);
          }}
        />
      </div>

      <DataTable
        value={items}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No hay movimientos de caja registrados"
        className="p-datatable-sm"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />

        <Column
          field="fechaOperacionMovCaja"
          header="Fecha Operación"
          sortable
          body={(rowData) => {
            return rowData.fechaOperacionMovCaja
              ? new Date(rowData.fechaOperacionMovCaja).toLocaleDateString(
                  "es-PE"
                )
              : "N/A";
          }}
          style={{ width: "120px" }}
        />

        <Column
          field="monto"
          header="Monto"
          sortable
          body={(rowData) => {
            return new Intl.NumberFormat("es-PE", {
              style: "currency",
              currency: "PEN",
            }).format(rowData.monto || 0);
          }}
          style={{ width: "120px", textAlign: "right" }}
        />

        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          field="empresaOrigenId"
          header="Empresa Origen"
          sortable
          body={(rowData) => {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(rowData.empresaOrigenId)
            );
            return empresa ? empresa.razonSocial : "N/A";
          }}
          style={{ width: "150px" }}
        />

        <Column
          field="empresaDestinoId"
          header="Empresa Destino"
          sortable
          body={(rowData) => {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(rowData.empresaDestinoId)
            );
            return empresa ? empresa.razonSocial : "N/A";
          }}
          style={{ width: "150px" }}
        />

        <Column
          field="cuentaCorrienteOrigenId"
          header="Cuenta Origen"
          sortable
          body={(rowData) => {
            const cuenta = cuentasCorrientes.find(
              (c) => Number(c.id) === Number(rowData.cuentaCorrienteOrigenId)
            );
            return cuenta ? cuenta.numeroCuenta : "N/A";
          }}
          style={{ width: "130px" }}
        />

        <Column
          field="cuentaCorrienteDestinoId"
          header="Cuenta Destino"
          sortable
          body={(rowData) => {
            const cuenta = cuentasCorrientes.find(
              (c) => Number(c.id) === Number(rowData.cuentaCorrienteDestinoId)
            );
            return cuenta ? cuenta.numeroCuenta : "N/A";
          }}
          style={{ width: "130px" }}
        />

        <Column
          field="operacionSinFactura"
          header="Sin Factura"
          sortable
          body={(rowData) => {
            return rowData.operacionSinFactura ? (
              <Badge value="SÍ" severity="warning" />
            ) : (
              <Badge value="NO" severity="success" />
            );
          }}
          style={{ width: "100px", textAlign: "center" }}
        />

        <Column
          field="estadoId"
          header="Estado"
          sortable
          body={(rowData) => {
            const estado = estadosMultiFuncion.find(
              (e) => Number(e.id) === Number(rowData.estadoId)
            );
            return estado ? (
              <Badge
                value={estado.descripcion}
                severity={
                  estado.descripcion === "ACTIVO" ? "success" : "danger"
                }
              />
            ) : (
              "N/A"
            );
          }}
          style={{ width: "120px", textAlign: "center" }}
        />

        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>
    </Card>


    {/* Dialog para formulario */}
    <Dialog
      visible={showDialog}
      style={{ width: "1300px" }}
      header={
        editing && !editing.movimientosAplicados
          ? "Editar Movimiento Caja"
          : "Nuevo Movimiento Caja"
      }
      modal
      onHide={() => {
        setShowDialog(false);
        setEditing(null);
      }}
    >
      <MovimientoCajaForm
        key={editing?.id || "new"}
        isEdit={editing && editing.id ? true : false}
        defaultValues={editing || {}}
        centrosCosto={centrosCosto}
        modulos={modulos}
        personal={personal}
        empresas={empresas}
        tipoMovEntregaRendir={tipoMovEntregaRendir}
        monedas={monedas}
        tipoReferenciaMovimientoCaja={tipoReferenciaMovimientoCaja}
        cuentasCorrientes={cuentasCorrientes}
        entidadesComerciales={entidadesComerciales}
        cuentasEntidadComercial={cuentasEntidadComercial}
        estadosMultiFuncion={estadosMultiFuncion}
        productos={productos}
        onSubmit={handleFormSubmit}
        onValidarMovimiento={handleValidarMovimiento}
        onGenerarAsiento={handleGenerarAsiento}
        loading={loading}
        onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
        />
      </Dialog>
    </div>
  );
}

