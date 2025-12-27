// src/pages/MovimientoCaja.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import MovimientoCajaForm from "../components/movimientoCaja/MovimientoCajaForm";
import TabPanelPescaIndustrial from "../components/movimientoCaja/TabPanelPescaIndustrial";
import TabPanelPescaConsumo from "../components/movimientoCaja/TabPanelPescaConsumo";
import TabPanelCompras from "../components/movimientoCaja/TabPanelCompras";
import TabPanelVentas from "../components/movimientoCaja/TabPanelVentas";
import TabPanelAlmacen from "../components/movimientoCaja/TabPanelAlmacen";
import TabPanelServicios from "../components/movimientoCaja/TabPanelServicios";
import TabPanelMantenimiento from "../components/movimientoCaja/TabPanelMantenimiento";
import TabPanelOTMantenimiento from "../components/movimientoCaja/TabPanelOTMantenimiento";
import { getDetMovsEntregaRendirPCompras } from "../api/detMovsEntregaRendirPCompras";
import { getEntregasARendirPCompras } from "../api/entregaARendirPCompras";
import { getAllDetMovsEntregaRendirPVentas } from "../api/detMovsEntregaRendirPVentas";
import { getAllEntregaARendirPVentas } from "../api/entregaARendirPVentas";
import { getAllDetMovsEntregaRendirMovAlmacen } from "../api/detMovsEntregaRendirMovAlmacen";
import { getAllEntregaARendirMovAlmacen } from "../api/entregaARendirMovAlmacen";
import { getAllDetMovsEntregaRendirContratoServicios } from "../api/detMovsEntregaRendirContratoServicios";
import { getAllEntregaARendirContratoServicios } from "../api/entregaARendirContratoServicios";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getProductos } from "../api/producto";
import { obtenerEntregasRendirOTMantenimiento } from "../api/entregaARendirOTMantenimiento.api";
import { obtenerDetMovsEntregaRendirOTMantenimiento } from "../api/detMovsEntregaRendirOTMantenimiento.api";
import {
  getAllMovimientoCaja,
  crearMovimientoCaja,
  actualizarMovimientoCaja,
  eliminarMovimientoCaja,
  validarMovimientoCaja,
  aprobarMovimientoCaja,
  rechazarMovimientoCaja,
  revertirMovimientoCaja,
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
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";

export default function MovimientoCaja({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [empresaOrigenFilter, setEmpresaOrigenFilter] = useState(null);
  const [empresaDestinoFilter, setEmpresaDestinoFilter] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [fechaInicioFilter, setFechaInicioFilter] = useState(null);
  const [fechaFinFilter, setFechaFinFilter] = useState(null);
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [showRevertirDialog, setShowRevertirDialog] = useState(false);
  const [movimientoWorkflow, setMovimientoWorkflow] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [motivoReversion, setMotivoReversion] = useState("");
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tipoMovEntregaRendir, setTipoMovEntregaRendir] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tipoReferenciaMovimientoCaja, setTipoReferenciaMovimientoCaja] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [cuentasEntidadComercial, setCuentasEntidadComercial] = useState([]);
  const [movimientosDetEntrega, setMovimientosDetEntrega] = useState([]);
  const [entregasARendir, setEntregasARendir] = useState([]);
  const [selectedMovimientosDetEntrega, setSelectedMovimientosDetEntrega] = useState(null);
  const [loadingDetEntrega, setLoadingDetEntrega] = useState(false);
  const [selectedDetMovsIds, setSelectedDetMovsIds] = useState([]);
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]);
  const [movimientosDetEntregaConsumo, setMovimientosDetEntregaConsumo] = useState([]);
  const [entregasARendirConsumo, setEntregasARendirConsumo] = useState([]);
  const [selectedMovimientosDetEntregaConsumo, setSelectedMovimientosDetEntregaConsumo] = useState(null);
  const [loadingDetEntregaConsumo, setLoadingDetEntregaConsumo] = useState(false);
  const [selectedDetMovsIdsConsumo, setSelectedDetMovsIdsConsumo] = useState([]);
  const [movimientosDetEntregaCompras, setMovimientosDetEntregaCompras] = useState([]);
  const [entregasARendirCompras, setEntregasARendirCompras] = useState([]);
  const [selectedMovimientosDetEntregaCompras, setSelectedMovimientosDetEntregaCompras] = useState(null);
  const [loadingDetEntregaCompras, setLoadingDetEntregaCompras] = useState(false);
  const [selectedDetMovsIdsCompras, setSelectedDetMovsIdsCompras] = useState([]);
  const [movimientosDetEntregaVentas, setMovimientosDetEntregaVentas] = useState([]);
  const [entregasARendirVentas, setEntregasARendirVentas] = useState([]);
  const [selectedMovimientosDetEntregaVentas, setSelectedMovimientosDetEntregaVentas] = useState(null);
  const [loadingDetEntregaVentas, setLoadingDetEntregaVentas] = useState(false);
  const [selectedDetMovsIdsVentas, setSelectedDetMovsIdsVentas] = useState([]);
  const [movimientosDetEntregaAlmacen, setMovimientosDetEntregaAlmacen] = useState([]);
  const [entregasARendirAlmacen, setEntregasARendirAlmacen] = useState([]);
  const [selectedMovimientosDetEntregaAlmacen, setSelectedMovimientosDetEntregaAlmacen] = useState(null);
  const [loadingDetEntregaAlmacen, setLoadingDetEntregaAlmacen] = useState(false);
  const [selectedDetMovsIdsAlmacen, setSelectedDetMovsIdsAlmacen] = useState([]);
  const [movimientosDetEntregaServicios, setMovimientosDetEntregaServicios] = useState([]);
  const [entregasARendirServicios, setEntregasARendirServicios] = useState([]);
  const [selectedMovimientosDetEntregaServicios, setSelectedMovimientosDetEntregaServicios] = useState(null);
  const [loadingDetEntregaServicios, setLoadingDetEntregaServicios] = useState(false);
  const [selectedDetMovsIdsServicios, setSelectedDetMovsIdsServicios] = useState([]);
  const [entregasOTMantenimiento, setEntregasOTMantenimiento] = useState([]);
  const [movimientosOTMantenimiento, setMovimientosOTMantenimiento] = useState([]);
  const [selectedMovimientosOTMantenimiento, setSelectedMovimientosOTMantenimiento] = useState(null);
  const [selectedDetMovsIdsOTMantenimiento, setSelectedDetMovsIdsOTMantenimiento] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [productos, setProductos] = useState([]);
    useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [items, empresaOrigenFilter, empresaDestinoFilter, estadoFilter, fechaInicioFilter, fechaFinFilter, globalFilter]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarItems(),
        cargarCentrosCosto(),
        cargarModulos(),
        cargarPersonal(),
        cargarEmpresas(),
        cargarTipoMovEntregaRendir(),
        cargarMonedas(),
        cargarTipoReferenciaMovimientoCaja(),
        cargarCuentasCorrientes(),
        cargarEntidadesComerciales(),
        cargarCuentasEntidadComercial(),
        cargarEstadosMultiFuncion(),
        cargarTiposDocumento(),
        cargarProductos(),
      ]);
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
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...items];

    if (empresaOrigenFilter) {
      filtrados = filtrados.filter(item => Number(item.empresaOrigenId) === Number(empresaOrigenFilter));
    }
    if (empresaDestinoFilter) {
      filtrados = filtrados.filter(item => Number(item.empresaDestinoId) === Number(empresaDestinoFilter));
    }
    if (estadoFilter) {
      filtrados = filtrados.filter(item => Number(item.estadoId) === Number(estadoFilter));
    }
    if (fechaInicioFilter) {
      filtrados = filtrados.filter(item => {
        const fechaItem = new Date(item.fechaOperacionMovCaja);
        return fechaItem >= fechaInicioFilter;
      });
    }
    if (fechaFinFilter) {
      filtrados = filtrados.filter(item => {
        const fechaItem = new Date(item.fechaOperacionMovCaja);
        return fechaItem <= fechaFinFilter;
      });
    }

    if (globalFilter) {
      const filterLower = globalFilter.toLowerCase();
      filtrados = filtrados.filter(item => {
        return (
          item.id?.toString().includes(filterLower) ||
          item.descripcion?.toLowerCase().includes(filterLower) ||
          item.monto?.toString().includes(filterLower)
        );
      });
    }

    setItemsFiltrados(filtrados);
  };

  const cargarItems = async () => {
    try {
      const data = await getAllMovimientoCaja();
      const dataSorted = data.sort((a, b) => Number(b.id) - Number(a.id));
      setItems(dataSorted);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de caja.",
        life: 3000,
      });
    }
  };

  const cargarCentrosCosto = async () => {
    try {
      const data = await getCentrosCosto();
      setCentrosCosto(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los centros de costo.",
        life: 3000,
      });
    }
  };

  const cargarModulos = async () => {
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los módulos.",
        life: 3000,
      });
    }
  };

  const cargarPersonal = async () => {
    try {
      const data = await getPersonal();
      setPersonal(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el personal.",
        life: 3000,
      });
    }
  };

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las empresas.",
        life: 3000,
      });
    }
  };

  const cargarTipoMovEntregaRendir = async () => {
    try {
      const data = await getAllTipoMovEntregaRendir();
      setTipoMovEntregaRendir(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de movimiento.",
        life: 3000,
      });
    }
  };

  const cargarMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las monedas.",
        life: 3000,
      });
    }
  };

  const cargarTipoReferenciaMovimientoCaja = async () => {
    try {
      const data = await getAllTipoReferenciaMovimientoCaja();
      setTipoReferenciaMovimientoCaja(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de referencia.",
        life: 3000,
      });
    }
  };

  const cargarCuentasCorrientes = async () => {
    try {
      const data = await getAllCuentaCorriente();
      setCuentasCorrientes(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las cuentas corrientes.",
        life: 3000,
      });
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entidades comerciales.",
        life: 3000,
      });
    }
  };

  const cargarCuentasEntidadComercial = async () => {
    try {
      const data = await getCtasCteEntidad();
      setCuentasEntidadComercial(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las cuentas de entidades comerciales.",
        life: 3000,
      });
    }
  };

  const cargarEstadosMultiFuncion = async () => {
    try {
      const data = await getEstadosMultiFuncion();
      const estadosFiltrados = data.filter(
        (estado) => Number(estado.tipoProvieneDeId) === 6
      );
      setEstadosMultiFuncion(estadosFiltrados);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los estados multifunción.",
        life: 3000,
      });
    }
  };

  const cargarMovimientosDetEntrega = async () => {
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
  };

  const cargarEntregasARendir = async () => {
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
  };

  const cargarMovimientosDetEntregaConsumo = async () => {
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
  };

  const cargarEntregasARendirConsumo = async () => {
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
  };

  const cargarMovimientosDetEntregaCompras = async () => {
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
  };

  const cargarEntregasARendirCompras = async () => {
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
  };

  const cargarMovimientosDetEntregaVentas = async () => {
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
  };

  const cargarEntregasARendirVentas = async () => {
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
  };

  const cargarMovimientosDetEntregaAlmacen = async () => {
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
  };

  const cargarEntregasARendirAlmacen = async () => {
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
  };

  const cargarMovimientosDetEntregaServicios = async () => {
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
  };

  const cargarEntregasARendirServicios = async () => {
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
  };

  const cargarMovimientosOTMantenimiento = async () => {
    try {
      const [entregasData, movimientosData] = await Promise.all([
        obtenerEntregasRendirOTMantenimiento(),
        obtenerDetMovsEntregaRendirOTMantenimiento()
      ]);
      
      setEntregasOTMantenimiento(entregasData || []);
      
      const movimientosPendientes = (movimientosData || []).filter(
        mov => !mov.validadoTesoreria && !mov.operacionMovCajaId
      );
      setMovimientosOTMantenimiento(movimientosPendientes);
    } catch (error) {
      console.error('Error cargando movimientos de OT Mantenimiento:', error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de OT Mantenimiento.",
        life: 3000,
      });
    }
  };

  const cargarTiposDocumento = async () => {
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
  };

  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los productos.",
        life: 3000,
      });
    }
  };


  const handleNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para crear registros.',
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const handleEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para ver o editar registros.',
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar registros.',
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: (
        <div>
          <p>¿Está seguro de eliminar este registro?</p>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <strong>ID:</strong> {rowData.id}<br />
            <strong>Monto:</strong> {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(rowData.monto || 0)}<br />
            <strong>Descripción:</strong> {rowData.descripcion || "N/A"}
          </div>
        </div>
      ),
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => handleDeleteConfirm(rowData),
    });
  };

  const handleDeleteConfirm = async (rowData) => {
    setLoading(true);
    try {
      await eliminarMovimientoCaja(rowData.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
        life: 3000,
      });
      await cargarItems();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.mensaje || "No se pudo eliminar el registro.",
        life: 3000,
      });
    }
    setLoading(false);
  };

  const handleFormSubmit = async (data) => {
    const esEdicion = selected && selected.id;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para editar registros.',
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para crear registros.',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (esEdicion) {
        await actualizarMovimientoCaja(selected.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado correctamente.",
          life: 3000,
        });
        const movimientoActualizado = await getAllMovimientoCaja();
        const movActualizado = movimientoActualizado.find(
          (m) => Number(m.id) === Number(selected.id)
        );
        if (movActualizado) {
          setSelected(movActualizado);
        }
        await cargarItems();
      } else {
        const nuevoMovimiento = await crearMovimientoCaja(data);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado exitosamente. Puede continuar editando o cerrar la ventana.",
          life: 4000,
        });
        const movimientos = await getAllMovimientoCaja();
        const movimientoCreado = movimientos.find(
          (m) => Number(m.id) === Number(nuevoMovimiento.id)
        );
        if (movimientoCreado) {
          setSelected(movimientoCreado);
          setIsEdit(true);
        }
        await cargarItems();
      }
    } catch (err) {
      console.error("Error al guardar movimiento de caja:", err);
      const mensajeError =
        err.response?.data?.mensaje ||
        err.message ||
        "No se pudo guardar el movimiento de caja.";
      toast.current?.show({
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
      toast.current?.show({
        severity: "success",
        summary: "Validado",
        detail: "Movimiento validado correctamente y origen actualizado.",
        life: 4000,
      });
      setShowDialog(false);
      setSelected(null);
      await Promise.all([
        cargarItems(),
        cargarMovimientosDetEntrega(),
        cargarMovimientosDetEntregaConsumo(),
        cargarMovimientosDetEntregaCompras(),
        cargarMovimientosDetEntregaVentas(),
        cargarMovimientosDetEntregaAlmacen(),
        cargarMovimientosDetEntregaServicios(),
        cargarMovimientosOTMantenimiento(),
      ]);
    } catch (err) {
      const mensajeError =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "No se pudo validar el movimiento.";
      toast.current?.show({
        severity: "error",
        summary: "Error al Validar",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleGenerarAsiento = async (movimiento) => {
    toast.current?.show({
      severity: "info",
      summary: "En Desarrollo",
      detail: "Funcionalidad de generar asiento contable en desarrollo.",
      life: 3000,
    });
  };

  const handleAprobar = (movimiento) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para aprobar movimientos.',
        life: 3000,
      });
      return;
    }
    setMovimientoWorkflow(movimiento);
    setShowAprobarDialog(true);
  };

  const handleRechazar = (movimiento) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para rechazar movimientos.',
        life: 3000,
      });
      return;
    }
    setMovimientoWorkflow(movimiento);
    setMotivoRechazo("");
    setShowRechazarDialog(true);
  };

  const handleRevertir = (movimiento) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para revertir movimientos.',
        life: 3000,
      });
      return;
    }
    setMovimientoWorkflow(movimiento);
    setMotivoReversion("");
    setShowRevertirDialog(true);
  };

  const handleAprobarConfirm = async () => {
    if (!movimientoWorkflow) return;
    setLoading(true);
    try {
      await aprobarMovimientoCaja(movimientoWorkflow.id, usuario.personalId);
      toast.current?.show({
        severity: "success",
        summary: "Aprobado",
        detail: "Movimiento aprobado correctamente",
        life: 3000,
      });
      await cargarItems();
      setShowAprobarDialog(false);
      setMovimientoWorkflow(null);
    } catch (error) {
      const mensajeError = error.response?.data?.error || "No se pudo aprobar el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleRechazarConfirm = async () => {
    if (!movimientoWorkflow || !motivoRechazo.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar el motivo del rechazo",
        life: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      await rechazarMovimientoCaja(movimientoWorkflow.id, usuario.personalId, motivoRechazo);
      toast.current?.show({
        severity: "success",
        summary: "Rechazado",
        detail: "Movimiento rechazado correctamente",
        life: 3000,
      });
      await cargarItems();
      setShowRechazarDialog(false);
      setMovimientoWorkflow(null);
      setMotivoRechazo("");
    } catch (error) {
      const mensajeError = error.response?.data?.error || "No se pudo rechazar el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleRevertirConfirm = async () => {
    if (!movimientoWorkflow || !motivoReversion.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar el motivo de la reversión",
        life: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      await revertirMovimientoCaja(movimientoWorkflow.id, motivoReversion, usuario.id);
      toast.current?.show({
        severity: "success",
        summary: "Revertido",
        detail: "Movimiento revertido correctamente. Se creó un movimiento inverso.",
        life: 4000,
      });
      await cargarItems();
      setShowRevertirDialog(false);
      setMovimientoWorkflow(null);
      setMotivoReversion("");
    } catch (error) {
      const mensajeError = error.response?.data?.error || "No se pudo revertir el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

    const handleAplicarMovimientos = async (movimientoSeleccionado, tipoOrigen) => {
    if (!movimientoSeleccionado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un movimiento",
        life: 3000,
      });
      return;
    }

    try {
      const estadoPendiente = estadosMultiFuncion.find(
        (estado) => Number(estado.id) === 20
      );

      if (!estadoPendiente) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el estado PENDIENTE (id=20)",
          life: 3000,
        });
        return;
      }

      let empresaDestinoId = null;

      if (tipoOrigen === "industrial") {
        const entregaARendir = entregasARendir.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirId)
        );
        if (entregaARendir && entregaARendir.temporadaPesca) {
          empresaDestinoId = entregaARendir.temporadaPesca.empresaId;
        }
      } else if (tipoOrigen === "consumo") {
        const entregaARendirConsumo = entregasARendirConsumo.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirPescaConsumoId)
        );
        if (entregaARendirConsumo && entregaARendirConsumo.novedadPescaConsumo) {
          empresaDestinoId = entregaARendirConsumo.novedadPescaConsumo.empresaId;
        }
      } else if (tipoOrigen === "compras") {
        const entregaARendirCompras = entregasARendirCompras.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirPComprasId)
        );
        if (entregaARendirCompras && entregaARendirCompras.requerimientoCompra) {
          empresaDestinoId = entregaARendirCompras.requerimientoCompra.empresaId;
        }
      } else if (tipoOrigen === "ventas") {
        const entregaARendirVentas = entregasARendirVentas.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirPVentasId)
        );
        if (entregaARendirVentas && entregaARendirVentas.cotizacionVentas) {
          empresaDestinoId = entregaARendirVentas.cotizacionVentas.empresaId;
        }
      } else if (tipoOrigen === "almacen") {
        const entregaARendirAlmacen = entregasARendirAlmacen.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirMovAlmacenId)
        );
        if (entregaARendirAlmacen && entregaARendirAlmacen.movimientoAlmacen) {
          empresaDestinoId = entregaARendirAlmacen.movimientoAlmacen.empresaId;
        }
      } else if (tipoOrigen === "servicios") {
        const entregaARendirServicios = entregasARendirServicios.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirContratoServiciosId)
        );
        if (entregaARendirServicios && entregaARendirServicios.contratoServicio) {
          empresaDestinoId = entregaARendirServicios.contratoServicio.empresaId;
        }
      } else if (tipoOrigen === "otMantenimiento") {
        const entregaARendirOTMantenimiento = entregasOTMantenimiento.find(
          (e) => Number(e.id) === Number(movimientoSeleccionado.entregaARendirOTMantenimientoId)
        );
        if (entregaARendirOTMantenimiento && entregaARendirOTMantenimiento.otMantenimiento) {
          empresaDestinoId = entregaARendirOTMantenimiento.otMantenimiento.empresaId;
        }
      }

      let moduloOrigenId = movimientoSeleccionado.moduloOrigenMovCajaId
        ? Number(movimientoSeleccionado.moduloOrigenMovCajaId)
        : null;

      if (!moduloOrigenId) {
        if (tipoOrigen === "industrial") {
          moduloOrigenId = 2;
        } else if (tipoOrigen === "consumo") {
          moduloOrigenId = 3;
        } else if (tipoOrigen === "compras") {
          moduloOrigenId = 4;
        } else if (tipoOrigen === "ventas") {
          moduloOrigenId = 5;
        } else if (tipoOrigen === "almacen") {
          moduloOrigenId = 6;
        } else if (tipoOrigen === "servicios") {
          moduloOrigenId = 7;
        } else if (tipoOrigen === "otMantenimiento") {
          moduloOrigenId = 8;
        }
      }

      const datosIniciales = {
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
        estadoId: Number(estadoPendiente.id),
        centroCostoId: movimientoSeleccionado.centroCostoId
          ? Number(movimientoSeleccionado.centroCostoId)
          : null,
        origenMotivoOperacionId: Number(movimientoSeleccionado.id),
        operacionSinFactura: movimientoSeleccionado.operacionSinFactura || false,
        productoId: movimientoSeleccionado.productoId
          ? Number(movimientoSeleccionado.productoId)
          : null,
        empresaOrigenId: null,
        cuentaCorrienteOrigenId: null,
        cuentaCorrienteDestinoId: null,
        referenciaExtId: null,
        tipoReferenciaId: null,
        usuarioId: usuario?.id ? Number(usuario.id) : null,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        fechaOperacionMovCaja: new Date(),
        movimientoAplicado: movimientoSeleccionado,
        tipoOrigen: tipoOrigen,
      };

      setSelected(datosIniciales);
      setIsEdit(false);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al preparar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar los datos del movimiento",
        life: 3000,
      });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await cargarDatosIniciales();
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Datos actualizados correctamente desde el servidor",
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setGlobalFilter("");
    setEmpresaOrigenFilter(null);
    setEmpresaDestinoFilter(null);
    setEstadoFilter(null);
    setFechaInicioFilter(null);
    setFechaFinFilter(null);
  };

  const estadoWorkflowBodyTemplate = (rowData) => {
    const estaAprobado = rowData.aprobadoPorId != null;
    const estaRechazado = rowData.rechazadoPorId != null;
    const esReversion = rowData.esReversion === true;

    return (
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
        {estaAprobado && (
          <Tag severity="success" value="APROBADO" icon="pi pi-check" />
        )}
        {estaRechazado && (
          <Tag severity="danger" value="RECHAZADO" icon="pi pi-times" />
        )}
        {!estaAprobado && !estaRechazado && (
          <Tag severity="warning" value="PENDIENTE" icon="pi pi-clock" />
        )}
        {esReversion && (
          <Tag severity="info" value="REVERSIÓN" icon="pi pi-replay" />
        )}
      </div>
    );
  };

  const accionesWorkflowBodyTemplate = (rowData) => {
    const estaAprobado = rowData.aprobadoPorId != null;
    const estaRechazado = rowData.rechazadoPorId != null;
    const esReversion = rowData.esReversion === true;

    if (esReversion) return null;

    return (
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
        {!estaAprobado && !estaRechazado && (
          <>
            <Button
              icon="pi pi-check"
              rounded
              severity="success"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAprobar(rowData);
              }}
              tooltip="Aprobar"
              disabled={!permisos.puedeEditar || loading}
            />
            <Button
              icon="pi pi-times"
              rounded
              severity="danger"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRechazar(rowData);
              }}
              tooltip="Rechazar"
              disabled={!permisos.puedeEditar || loading}
            />
          </>
        )}
        {estaAprobado && (
          <Button
            icon="pi pi-replay"
            rounded
            severity="warning"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRevertir(rowData);
            }}
            tooltip="Revertir"
            disabled={!permisos.puedeEditar || loading}
          />
        )}
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(rowData);
          }}
          disabled={(!permisos.puedeVer && !permisos.puedeEditar) || loading}
          tooltip={permisos.puedeEditar ? 'Editar' : 'Ver'}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(rowData);
          }}
          disabled={!permisos.puedeEliminar || loading}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <div className="flex gap-2 align-items-center">
          <h4 className="m-0">Total de registros: {itemsFiltrados.length}</h4>
        </div>
        <div className="flex gap-2">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              style={{ width: '250px' }}
            />
          </span>
          <Button
            icon="pi pi-filter-slash"
            outlined
            severity="secondary"
            onClick={handleClearFilters}
            tooltip="Limpiar filtros"
            disabled={loading}
          />
          <Button
            icon="pi pi-refresh"
            outlined
            severity="info"
            onClick={handleRefresh}
            loading={loading}
            tooltip="Refrescar datos"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />

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
              handleAplicarMovimientos(selectedMovimientosDetEntrega, "industrial")
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
              handleAplicarMovimientos(selectedMovimientosDetEntregaConsumo, "consumo")
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
              handleAplicarMovimientos(selectedMovimientosDetEntregaCompras, "compras")
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
              handleAplicarMovimientos(selectedMovimientosDetEntregaVentas, "ventas")
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
              handleAplicarMovimientos(selectedMovimientosDetEntregaAlmacen, "almacen")
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
              handleAplicarMovimientos(selectedMovimientosDetEntregaServicios, "servicios")
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
              handleAplicarMovimientos(selectedMovimientosOTMantenimiento, "otMantenimiento")
            }
            toast={toast}
          />
        </TabPanel>
      </TabView>

      <Card className="mt-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Registro de Movimientos de Caja</h2>
          <Button
            label="Nuevo Movimiento"
            icon="pi pi-plus"
            severity="success"
            raised
            onClick={handleNew}
            disabled={!permisos.puedeCrear || loading}
            tooltip={!permisos.puedeCrear ? 'No tiene permisos para crear' : 'Nuevo Movimiento de Caja'}
          />
        </div>

        <DataTable
          value={itemsFiltrados}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay movimientos de caja registrados"
          size="small"
          stripedRows
          showGridlines
          header={renderHeader()}
          style={{ fontSize: getResponsiveFontSize() }}
          sortField="id"
          sortOrder={-1}
          selectionMode="single"
          selection={selected}
          onSelectionChange={(e) => setSelected(e.value)}
          onRowClick={(e) => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              handleEdit(e.data);
            }
          }}
        >
          <Column field="id" header="ID" sortable style={{ width: "80px" }} />

          <Column
            field="fechaOperacionMovCaja"
            header="Fecha Operación"
            sortable
            body={(rowData) => {
              return rowData.fechaOperacionMovCaja
                ? new Date(rowData.fechaOperacionMovCaja).toLocaleDateString("es-PE")
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
                  severity={estado.descripcion === "ACTIVO" ? "success" : "danger"}
                />
              ) : (
                "N/A"
              );
            }}
            style={{ width: "120px", textAlign: "center" }}
          />

          <Column
            header="Estado Workflow"
            body={estadoWorkflowBodyTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />

          <Column
            header="Workflow"
            body={accionesWorkflowBodyTemplate}
            style={{ width: "120px", textAlign: "center" }}
          />

          <Column
            header="Acciones"
            body={actionBodyTemplate}
            style={{ width: "120px", textAlign: "center" }}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        style={{ width: "1300px" }}
        header={isEdit ? "Editar Movimiento Caja" : "Nuevo Movimiento Caja"}
        modal
        onHide={() => {
          setShowDialog(false);
          setSelected(null);
          setIsEdit(false);
        }}
      >
        <MovimientoCajaForm
          key={selected?.id || "new"}
          isEdit={isEdit}
          defaultValues={selected || {}}
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
          permisos={permisos}
          readOnly={isEdit && !permisos.puedeEditar}
          onCancel={() => {
            setShowDialog(false);
            setSelected(null);
            setIsEdit(false);
          }}
        />
      </Dialog>

      <Dialog
        header="Aprobar Movimiento de Caja"
        visible={showAprobarDialog}
        style={{ width: "450px" }}
        onHide={() => setShowAprobarDialog(false)}
        modal
      >
        <div style={{ padding: "1rem" }}>
          <p>¿Está seguro de aprobar este movimiento de caja?</p>
          {movimientoWorkflow && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
              <strong>ID:</strong> {movimientoWorkflow.id}<br />
              <strong>Monto:</strong> {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(movimientoWorkflow.monto || 0)}<br />
              <strong>Descripción:</strong> {movimientoWorkflow.descripcion || "N/A"}
            </div>
          )}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowAprobarDialog(false)}
              outlined
            />
            <Button
              label="Aprobar"
              icon="pi pi-check"
              onClick={handleAprobarConfirm}
              loading={loading}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Rechazar Movimiento de Caja"
        visible={showRechazarDialog}
        style={{ width: "500px" }}
        onHide={() => setShowRechazarDialog(false)}
        modal
      >
        <div style={{ padding: "1rem" }}>
          <p>Indique el motivo del rechazo:</p>
          {movimientoWorkflow && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
              <strong>ID:</strong> {movimientoWorkflow.id}<br />
              <strong>Monto:</strong> {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(movimientoWorkflow.monto || 0)}<br />
              <strong>Descripción:</strong> {movimientoWorkflow.descripcion || "N/A"}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="motivoRechazo" style={{ fontWeight: "bold" }}>Motivo del Rechazo <span style={{ color: "red" }}>*</span></label>
            <InputTextarea
              id="motivoRechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo del rechazo..."
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowRechazarDialog(false)}
              outlined
            />
            <Button
              label="Rechazar"
              icon="pi pi-times"
              onClick={handleRechazarConfirm}
              loading={loading}
              severity="danger"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Revertir Movimiento de Caja"
        visible={showRevertirDialog}
        style={{ width: "500px" }}
        onHide={() => setShowRevertirDialog(false)}
        modal
      >
        <div style={{ padding: "1rem" }}>
          <p>Se creará un movimiento inverso. Indique el motivo de la reversión:</p>
          {movimientoWorkflow && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
              <strong>ID:</strong> {movimientoWorkflow.id}<br />
              <strong>Monto:</strong> {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(movimientoWorkflow.monto || 0)}<br />
              <strong>Descripción:</strong> {movimientoWorkflow.descripcion || "N/A"}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="motivoReversion" style={{ fontWeight: "bold" }}>Motivo de la Reversión <span style={{ color: "red" }}>*</span></label>
            <InputTextarea
              id="motivoReversion"
              value={motivoReversion}
              onChange={(e) => setMotivoReversion(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo de la reversión..."
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowRevertirDialog(false)}
              outlined
            />
            <Button
              label="Revertir"
              icon="pi pi-replay"
              onClick={handleRevertirConfirm}
              loading={loading}
              severity="warning"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
