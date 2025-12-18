// src/components/layout/BaseLayout.jsx
import React, { useState, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Toast } from 'primereact/toast';
import { useAuthRefresh } from '../../shared/hooks/useAuthRefresh';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { ModuloContext } from '../../context/ModuloContext';
import AppHeader from './AppHeader';
import logoCerebro13 from "../../assets/LogoCerebro13.png";

// Importar componentes de módulos
import Producto from '../../pages/Producto';
import Empresas from '../../pages/Empresas';
import KatanaTripulacion from '../../pages/KatanaTripulacion';
import AreasFisicasSede from '../../pages/AreasFisicasSede';
import Usuarios from '../../pages/Usuarios';
import Personal from '../../pages/Personal';
import TipoDocumento from '../../pages/TipoDocumento';
import TipoContrato from '../../pages/TipoContrato';
import CargosPersonal from '../../pages/CargosPersonal';
import ModulosSistema from '../../pages/ModulosSistema';
import SubmodulosSistema from '../../pages/SubmodulosSistema';
import DocumentacionPersonal from '../../pages/DocumentacionPersonal';
import TipoMovEntregaRendir from '../../pages/TipoMovEntregaRendir';
import CuentaCorriente from '../../pages/CuentaCorriente';
import Activo from '../../pages/Activo';
import DetallePermisoActivo from '../../pages/DetallePermisoActivo';
import Especie from '../../pages/Especie';
import DetCuotaPesca from '../../pages/DetCuotaPesca';
import EstadoMultiFuncion from '../../pages/EstadoMultiFuncion';
import PermisoAutorizacion from '../../pages/PermisoAutorizacion';
import TipoActivo from '../../pages/TipoActivo';
import TipoProvieneDe from '../../pages/TipoProvieneDe';
import Moneda from '../../pages/Moneda';
import ParametroAprobador from '../../pages/ParametroAprobador';
import PuertoPesca from '../../pages/PuertoPesca';
import TipoMantenimiento from '../../pages/TipoMantenimiento';
import MotivoOriginoOT from '../../pages/MotivoOriginoOT';
import Banco from '../../pages/Banco';
import Incoterm from '../../pages/Incoterm';
import MovimientoCaja from '../../pages/MovimientoCaja';
import TipoCuentaCorriente from '../../pages/TipoCuentaCorriente';
import TipoReferenciaMovimientoCaja from '../../pages/TipoReferenciaMovimientoCaja';
import CentroCosto from '../../pages/CentroCosto';
import CategoriaCCosto from '../../pages/CategoriaCCosto';
import EmpresaCentroCosto from '../../pages/EmpresaCentroCosto';
import AsientoContableInterfaz from '../../pages/AsientoContableInterfaz';
import AccesosUsuario from '../../pages/AccesosUsuario';
import TiposDocIdentidad from '../../pages/TiposDocIdentidad';
import EntidadComercial from '../../pages/EntidadComercial';
import TipoEntidad from '../../pages/TipoEntidad';
import AgrupacionEntidad from '../../pages/AgrupacionEntidad';
import FamiliaProducto from '../../pages/FamiliaProducto';
import SubfamiliaProducto from '../../pages/SubfamiliaProducto';
import TipoAlmacenamiento from '../../pages/TipoAlmacenamiento';
import Marca from '../../pages/Marca';
import UnidadMedida from '../../pages/UnidadMedida';
import TipoMaterial from '../../pages/TipoMaterial';
import Color from '../../pages/Color';
import TipoVehiculo from '../../pages/TipoVehiculo';
import Pais from '../../pages/Pais';
import Departamento from '../../pages/Departamento';
import Provincia from '../../pages/Provincia';
import Ubigeo from '../../pages/Ubigeo';
import SedesEmpresa from '../../pages/SedesEmpresa';
import AccesoInstalacion from '../../pages/AccesoInstalacion';
import TipoMovimientoAcceso from '../../pages/TipoMovimientoAcceso';
import TipoEquipo from '../../pages/TipoEquipo';
import TipoPersona from '../../pages/TipoPersona';
import MotivoAcceso from '../../pages/MotivoAcceso';
import TipoAccesoInstalacion from '../../pages/TipoAccesoInstalacion';
import TemporadaPesca from '../../pages/TemporadaPesca';
import NovedadPescaConsumo from '../../pages/NovedadPescaConsumo';
import AccionesPreviasFaena from '../../pages/AccionesPreviasFaena';
import Embarcacion from '../../pages/Embarcacion';
import TipoEmbarcacion from '../../pages/TipoEmbarcacion';
import BolicheRed from '../../pages/BolicheRed';
import DocumentoPesca from '../../pages/DocumentoPesca';
import DocumentacionEmbarcacion from '../../pages/DocumentacionEmbarcacion';
import RequerimientoCompra from '../../pages/RequerimientoCompra';
import OrdenCompra from '../../pages/OrdenCompra';
import TipoProducto from '../../pages/TipoProducto';
import TipoEstadoProducto from '../../pages/TipoEstadoProducto';
import DestinoProducto from '../../pages/DestinoProducto';
import FormaPago from '../../pages/FormaPago';
import ModoDespachoRecepcion from '../../pages/ModoDespachoRecepcion';
import CotizacionVentas from '../../pages/CotizacionVentas';
import PreFactura from '../../pages/PreFactura';
import ContratoServicio from '../../pages/ContratoServicio';
import DocRequeridaVentas from '../../pages/DocRequeridaVentas';
import RequisitoDocPorPais from '../../pages/RequisitoDocPorPais';
import TipoContenedor from '../../pages/TipoContenedor';
import FormaTransaccion from '../../pages/FormaTransaccion';
import MovimientoAlmacen from '../../pages/MovimientoAlmacen';
import KardexAlmacen from '../../pages/KardexAlmacen';
import SaldosProductoCliente from '../../pages/SaldosProductoCliente';
import SaldosDetProductoCliente from '../../pages/SaldosDetProductoCliente';
import ConceptoMovAlmacen from '../../pages/ConceptoMovAlmacen';
import TipoConcepto from '../../pages/TipoConcepto';
import TipoMovimientoAlmacen from '../../pages/TipoMovimientoAlmacen';
import TipoAlmacen from '../../pages/TipoAlmacen';
import CentrosAlmacen from '../../pages/CentrosAlmacen';
import Almacen from '../../pages/Almacen';
import SerieDoc from '../../pages/SerieDoc';
import OTMantenimiento from '../../pages/OTMantenimiento';

/**
 * BaseLayout - Layout principal con gestión de módulos
 * 
 * Responsabilidades:
 * - Proveer el contexto de módulos a toda la aplicación
 * - Gestionar el estado de pestañas abiertas
 * - Renderizar el header y el contenido principal
 */
export default function BaseLayout({ children, onLogout }) {
  const toast = useRef(null);
  const navigate = useNavigate();
  const isAuth = useAuthStore(state => state.isAuth);

  // Estado de pestañas (gestionado aquí para compartir entre AppHeader y MultiCrud)
  const [tabs, setTabs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1); // -1 significa Dashboard activo

  // Catálogo de módulos disponibles
  const modulos = {
    accesoInstalacion: { label: "Movimientos Acceso Instalaciones", componente: <AccesoInstalacion ruta="accesoInstalacion" /> },
    tipoMovimientoAcceso: { label: "Tipos de Movimiento de Acceso", componente: <TipoMovimientoAcceso ruta="tipoMovimientoAcceso" /> },
    tipoEquipo: { label: "Tipo Equipos", componente: <TipoEquipo ruta="tipoEquipo" /> },
    tipoPersona: { label: "Tipos de Persona", componente: <TipoPersona ruta="tipoPersona" /> },
    motivoAcceso: { label: "Motivos de Acceso", componente: <MotivoAcceso ruta="motivoAcceso" /> },
    tipoAccesoInstalacion: { label: "Tipos de Acceso a Instalaciones", componente: <TipoAccesoInstalacion ruta="tipoAccesoInstalacion" /> },
    temporadaPesca: { label: "Pesca Industrial", componente: <TemporadaPesca ruta="temporadaPesca" /> },
    novedadPescaConsumo: { label: "Pesca de Consumo", componente: <NovedadPescaConsumo ruta="novedadPescaConsumo" /> },
    especie: { label: "Especies", componente: <Especie ruta="especie" /> },
    detCuotaPesca: { label: "Detalle Cuotas Pesca", componente: <DetCuotaPesca ruta="detCuotaPesca" /> },
    accionesPreviasFaena: { label: "Acciones previas Faena", componente: <AccionesPreviasFaena ruta="accionesPreviasFaena" /> },
    embarcacion: { label: "Embarcaciones", componente: <Embarcacion ruta="embarcacion" /> },
    tipoEmbarcacion: { label: "Tipo Embarcación", componente: <TipoEmbarcacion ruta="tipoEmbarcacion" /> },
    bolicheRed: { label: "Boliche de Red", componente: <BolicheRed ruta="bolicheRed" /> },
    documentoPesca: { label: "Documentación Pesca", componente: <DocumentoPesca ruta="documentoPesca" /> },
    documentacionEmbarcacion: { label: "Detalle Documentación Embarcación", componente: <DocumentacionEmbarcacion ruta="documentacionEmbarcacion" /> },
    documentacionPersonal: { label: "Documentación Personal", componente: <DocumentacionPersonal ruta="documentacionPersonal" /> },
    puertoPesca: { label: "Puerto de Pesca", componente: <PuertoPesca ruta="puertoPesca" /> },
    requerimientoCompra: { label: "Requerimiento Compra", componente: <RequerimientoCompra ruta="requerimientoCompra" /> },
    ordenCompra: { label: "Orden de Compra", componente: <OrdenCompra ruta="ordenCompra" /> },
    tipoProducto: { label: "Tipo Producto", componente: <TipoProducto ruta="tipoProducto" /> },
    tipoEstadoProducto: { label: "Tipo Estado Producto", componente: <TipoEstadoProducto ruta="tipoEstadoProducto" /> },
    destinoProducto: { label: "Destino Producto", componente: <DestinoProducto ruta="destinoProducto" /> },
    formaPago: { label: "Forma de Pago", componente: <FormaPago ruta="formaPago" /> },
    modoDespachoRecepcion: { label: "Modo Despacho/Recepción", componente: <ModoDespachoRecepcion ruta="modoDespachoRecepcion" /> },
    cotizacionVentas: { label: "Cotización Ventas", componente: <CotizacionVentas ruta="cotizacionVentas" /> },
    preFactura: { label: "Pre-Factura", componente: <PreFactura ruta="preFactura" /> },
    contratoServicio: { label: "Contratos de Servicios", componente: <ContratoServicio ruta="contratoServicio" /> },
    incoterm: { label: "Incoterms", componente: <Incoterm ruta="incoterm" /> },
    docRequeridaVentas: { label: "Documentos Requeridos Ventas", componente: <DocRequeridaVentas ruta="docRequeridaVentas" /> },
    requisitoDocPorPais: { label: "Requisitos Documentales por País", componente: <RequisitoDocPorPais ruta="requisitoDocPorPais" /> },
    tipoContenedor: { label: "Tipo Contenedor", componente: <TipoContenedor ruta="tipoContenedor" /> },
    formaTransaccion: { label: "Formas Transacción", componente: <FormaTransaccion ruta="formaTransaccion" /> },
    movimientoAlmacen: { label: "Movimientos Almacén", componente: <MovimientoAlmacen ruta="movimientoAlmacen" /> },
    kardexAlmacen: { label: "Kardex Almacén", componente: <KardexAlmacen ruta="kardexAlmacen" /> },
    saldosProductoCliente: { label: "Saldos Productos-Cliente", componente: <SaldosProductoCliente ruta="saldosProductoCliente" /> },
    saldosDetProductoCliente: { label: "Saldos Productos-Cliente Variables Control Stock", componente: <SaldosDetProductoCliente ruta="saldosDetProductoCliente" /> },
    conceptoMovAlmacen: { label: "Conceptos Movimientos Almacén", componente: <ConceptoMovAlmacen ruta="conceptoMovAlmacen" /> },
    tipoDocumento: { label: "Tipos de Documento", componente: <TipoDocumento ruta="tipoDocumento" /> },
    tipoConcepto: { label: "Tipos de Concepto Movimientos Almacén", componente: <TipoConcepto ruta="tipoConcepto" /> },
    tipoMovimientoAlmacen: { label: "Tipos de Movimiento Almacén", componente: <TipoMovimientoAlmacen ruta="tipoMovimientoAlmacen" /> },
    tipoAlmacen: { label: "Tipos de Almacén", componente: <TipoAlmacen ruta="tipoAlmacen" /> },
    centrosAlmacen: { label: "Centros de Almacén", componente: <CentrosAlmacen ruta="centrosAlmacen" /> },
    almacen: { label: "Almacenes", componente: <Almacen ruta="almacen" /> },
    serieDoc: { label: "Series de Documento", componente: <SerieDoc ruta="serieDoc" /> },
    oTMantenimiento: { label: "Órdenes de Trabajo", componente: <OTMantenimiento ruta="oTMantenimiento" /> },
    tipoMantenimiento: { label: "Tipo de Mantenimiento", componente: <TipoMantenimiento ruta="tipoMantenimiento" /> },
    motivoOriginoOT: { label: "Motivo Origino OT", componente: <MotivoOriginoOT ruta="motivoOriginoOT" /> },
    movimientoCaja: { label: "Movimientos de Caja", componente: <MovimientoCaja ruta="movimientoCaja" /> },
    cuentaCorriente: { label: "Cuenta Corriente", componente: <CuentaCorriente ruta="cuentaCorriente" /> },
    tipoMovEntregaRendir: { label: "Tipos Movimiento Entrega a Rendir", componente: <TipoMovEntregaRendir ruta="tipoMovEntregaRendir" /> },
    asientoContableInterfaz: { label: "Asientos Contables Generados", componente: <AsientoContableInterfaz ruta="asientoContableInterfaz" /> },
    centroCosto: { label: "Centros de Costo", componente: <CentroCosto ruta="centroCosto" /> },
    categoriaCCosto: { label: "Categorías de Centros de Costo", componente: <CategoriaCCosto ruta="categoriaCCosto" /> },
    empresaCentroCosto: { label: "Empresa por Centro Costo", componente: <EmpresaCentroCosto ruta="empresaCentroCosto" /> },
    tipoCuentaCorriente: { label: "Tipo Cuenta Corriente", componente: <TipoCuentaCorriente ruta="tipoCuentaCorriente" /> },
    tipoReferenciaMovimientoCaja: { label: "Tipo Referencia Movimiento Caja", componente: <TipoReferenciaMovimientoCaja ruta="tipoReferenciaMovimientoCaja" /> },
    banco: { label: "Bancos", componente: <Banco ruta="banco" /> },
    usuarios: { label: "Usuarios del Sistema", componente: <Usuarios ruta="usuarios" /> },
    accesosUsuario: { label: "Accesos Usuario", componente: <AccesosUsuario ruta="accesosUsuario" /> },
    modulosSistema: { label: "Módulos Sistema", componente: <ModulosSistema ruta="modulosSistema" /> },
    SubmodulosSistema: { label: "Submódulos Sistema", componente: <SubmodulosSistema ruta="SubmodulosSistema" /> },
    empresas: { label: "Empresas", componente: <Empresas ruta="empresas" /> },
    katanaTripulacion: { label: "Katana Tripulación", componente: <KatanaTripulacion ruta="katanaTripulacion" /> },
    sedesEmpresa: { label: "Sedes Empresa", componente: <SedesEmpresa ruta="sedesEmpresa" /> },
    areasFisicasSede: { label: "Áreas Físicas Sede", componente: <AreasFisicasSede ruta="areasFisicasSede" /> },
    estadoMultiFuncion: { label: "Estado Multi Función", componente: <EstadoMultiFuncion ruta="estadoMultiFuncion" /> },
    tipoProvieneDe: { label: "Tipo Proviene De", componente: <TipoProvieneDe ruta="tipoProvieneDe" /> },
    monedas: { label: "Monedas", componente: <Moneda ruta="monedas" /> },
    personal: { label: "Personal", componente: <Personal ruta="personal" /> },
    cargosPersonal: { label: "Cargos del Personal", componente: <CargosPersonal ruta="cargosPersonal" /> },
    tipoContrato: { label: "Tipo Contrato", componente: <TipoContrato ruta="tipoContrato" /> },
    parametroAprobador: { label: "Aprobadores", componente: <ParametroAprobador ruta="parametroAprobador" /> },
    tiposDocIdentidad: { label: "Tipos Documento Identidad", componente: <TiposDocIdentidad ruta="tiposDocIdentidad" /> },
    entidadComercial: { label: "Entidad Comercial", componente: <EntidadComercial ruta="entidadComercial" /> },
    tipoEntidad: { label: "Tipo Entidad", componente: <TipoEntidad ruta="tipoEntidad" /> },
    agrupacionEntidad: { label: "Agrupaciones Entidad", componente: <AgrupacionEntidad ruta="agrupacionEntidad" /> },
    producto: { label: "Productos y Servicios", componente: <Producto ruta="producto" /> },
    familiaProducto: { label: "Familia Producto", componente: <FamiliaProducto ruta="familiaProducto" /> },
    subfamiliaProducto: { label: "Subfamilia Producto", componente: <SubfamiliaProducto ruta="subfamiliaProducto" /> },
    tipoAlmacenamiento: { label: "Tipo Almacenamiento", componente: <TipoAlmacenamiento ruta="tipoAlmacenamiento" /> },
    marca: { label: "Marca", componente: <Marca ruta="marca" /> },
    unidadMedida: { label: "Unidad Medida", componente: <UnidadMedida ruta="unidadMedida" /> },
    tipoMaterial: { label: "Tipo Material", componente: <TipoMaterial ruta="tipoMaterial" /> },
    color: { label: "Color", componente: <Color ruta="color" /> },
    tipoVehiculo: { label: "Tipo Vehículos", componente: <TipoVehiculo ruta="tipoVehiculo" /> },
    pais: { label: "País", componente: <Pais ruta="pais" /> },
    departamento: { label: "Departamento", componente: <Departamento ruta="departamento" /> },
    provincia: { label: "Provincia", componente: <Provincia ruta="provincia" /> },
    ubigeo: { label: "Ubigeo", componente: <Ubigeo ruta="ubigeo" /> },
    activo: { label: "Activos", componente: <Activo ruta="activo" /> },
    tipoActivo: { label: "Tipo Activo", componente: <TipoActivo ruta="tipoActivo" /> },
    detallePermisoActivo: { label: "Detalle Permiso Activo", componente: <DetallePermisoActivo ruta="detallePermisoActivo" /> },
    permisoAutorizacion: { label: "Permiso Autorización", componente: <PermisoAutorizacion ruta="permisoAutorizacion" /> },
  };

  /**
   * Función para abrir un módulo en una nueva pestaña
   * @param {string} key - Identificador único del módulo
   * @param {string} label - Etiqueta visible de la pestaña (opcional)
   */
  const abrirModulo = (key, label) => {
    // Verificar si el módulo ya está abierto
    const existe = tabs.findIndex((t) => t.key === key);
    if (existe !== -1) {
      // Si ya existe, solo activar esa pestaña
      setActiveIndex(existe);
    } else {
      // Buscar el módulo en el catálogo
      const moduloConfig = modulos[key];
      if (moduloConfig) {
        // Si existe en el catálogo, agregar nueva pestaña
        setTabs([...tabs, {
          key,
          label: moduloConfig.label || label,
          content: moduloConfig.componente
        }]);
        setActiveIndex(tabs.length); // Activar la nueva pestaña
      } else {
        // Si no existe, mostrar mensaje "Próximamente"
        setTabs([...tabs, {
          key,
          label: label || key,
          content: (
            <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
              <i className="pi pi-cog" style={{ fontSize: 36, marginBottom: 12 }} />
              <h3>Módulo próximamente</h3>
              <p>Este módulo estará disponible en una próxima versión.</p>
            </div>
          )
        }]);
        setActiveIndex(tabs.length);
      }
    }
  };

  /**
   * Función para cerrar una pestaña
   * @param {number} index - Índice de la pestaña a cerrar
   */
  const cerrarTab = (index) => {
    const nuevaTabs = tabs.filter((_, i) => i !== index);
    setTabs(nuevaTabs);
    
    // Ajustar el índice activo
    if (activeIndex === index) {
      // Si cerramos la pestaña activa, ir al Dashboard
      setActiveIndex(-1);
    } else if (activeIndex > index) {
      // Si cerramos una pestaña antes de la activa, ajustar el índice
      setActiveIndex(activeIndex - 1);
    }
  };

  /**
   * Función para volver al dashboard SIN cerrar las pestañas
   */
  const volverAlDashboard = () => {
    setActiveIndex(-1); // -1 significa Dashboard activo
  };

  /**
   * Callback de expiración de sesión
   */
  const onSessionExpire = (motivo) => {
    const detail = motivo === 'inactividad'
      ? 'Tu sesión ha expirado por inactividad prolongada. Ingresa nuevamente para continuar.'
      : 'Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    
    toast.current?.show({
      severity: 'warn',
      summary: 'Sesión expirada',
      detail,
      life: 9000,
      closable: true,
      icon: 'pi pi-exclamation-triangle'
    });

    setTimeout(() => {
      navigate('/login?expired=1', { replace: true });
    }, 2000);
  };

  // Hook para refrescar el token automáticamente
  useAuthRefresh({ onSessionExpire });

  /**
   * Maneja el cierre de sesión
   */
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login", { replace: true });
    }
  };

  // Valor del contexto que se compartirá
  const moduloContextValue = {
    tabs,
    activeIndex,
    setActiveIndex,
    abrirModulo,
    cerrarTab,
    volverAlDashboard
  };

  return (
    <ModuloContext.Provider value={moduloContextValue}>
      <div className="layout-wrapper">
        {/* Toast global */}
        <Toast ref={toast} position="top-right" />

        {/* Header con menú */}
        <AppHeader onLogout={handleLogout} />

        {/* Contenido principal */}
        <main className="layout-main">
          <Outlet />
          {children}
        </main>
      </div>
    </ModuloContext.Provider>
  );
}