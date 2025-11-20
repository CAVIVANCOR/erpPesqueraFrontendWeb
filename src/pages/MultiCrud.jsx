// src/pages/MultiCrud.jsx
// Componente profesional de multitarea con pestañas dinámicas para el ERP Megui.
// Arquitectura profesional: Todo el ERP opera bajo un sistema multitarea, eliminando menús globales redundantes.
// El menú de módulos (Menubar PrimeReact) es el único punto de entrada para abrir módulos CRUD en pestañas.
// La lógica centraliza la experiencia y evita confusión, asegurando coherencia visual y funcional.
// Documentado en español técnico para mantenibilidad y claridad.
// Permite abrir y gestionar múltiples módulos CRUD (Clientes, Empresas, Áreas Físicas) en paralelo.
// Usa PrimeReact TabView y componentes desacoplados. Documentado en español técnico.

import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button"; // Importación única de Button para evitar errores de redeclaración
import { MegaMenu } from "primereact/megamenu";
import { Sidebar } from "primereact/sidebar";
import { useIsMobile } from "../shared/hooks/useIsMobile";

// Importa tus módulos CRUD desacoplados
import Producto from "./Producto";
import Empresas from "./Empresas";
import AreasFisicasSede from "./AreasFisicasSede";
import Usuarios from "./Usuarios";
import Personal from "./Personal";
import TipoDocumento from "./TipoDocumento";
import TipoContrato from "./TipoContrato";
import CargosPersonal from "./CargosPersonal";
import ModulosSistema from "./ModulosSistema";
import SubmodulosSistema from "./SubmodulosSistema";
import DocumentacionPersonal from "./DocumentacionPersonal";
import TipoMovEntregaRendir from "./TipoMovEntregaRendir";
import CuentaCorriente from "./CuentaCorriente";
import Activo from "./Activo";
import DetallePermisoActivo from "./DetallePermisoActivo";
import Especie from "./Especie";
import EstadoMultiFuncion from "./EstadoMultiFuncion";
import PermisoAutorizacion from "./PermisoAutorizacion";
import TipoActivo from "./TipoActivo";
import TipoProvieneDe from "./TipoProvieneDe";
import Moneda from "./Moneda";
import ParametroAprobador from "./ParametroAprobador";
import PuertoPesca from "./PuertoPesca";
import TipoMantenimiento from "./TipoMantenimiento";
import MotivoOriginoOT from "./MotivoOriginoOT";
import Banco from "./Banco";
import Incoterm from "./Incoterm";
import MovimientoCaja from "./MovimientoCaja";
import TipoCuentaCorriente from "./TipoCuentaCorriente";
import TipoReferenciaMovimientoCaja from "./TipoReferenciaMovimientoCaja";
import AsientoContableInterfaz from "./AsientoContableInterfaz";
import TipoEmbarcacion from "./TipoEmbarcacion";
import DocumentoPesca from "./DocumentoPesca";
import DocumentacionEmbarcacion from "./DocumentacionEmbarcacion";
import AccesosUsuario from "./AccesosUsuario";
import CotizacionVentas from "./CotizacionVentas";
import TipoProducto from "./TipoProducto";
import TipoEstadoProducto from "./TipoEstadoProducto";
import DestinoProducto from "./DestinoProducto";
import FormaTransaccion from "./FormaTransaccion";
import ModoDespachoRecepcion from "./ModoDespachoRecepcion";
import TipoPersona from "./TipoPersona";
import MotivoAcceso from "./MotivoAcceso";
import TipoAccesoInstalacion from "./TipoAccesoInstalacion";
import TipoEntidad from "./TipoEntidad";
import FormaPago from "./FormaPago";
import AgrupacionEntidad from "./AgrupacionEntidad";
import ContactoEntidad from "./ContactoEntidad";
import EntidadComercial from "./EntidadComercial";
import DireccionEntidad from "./DireccionEntidad";
import PrecioEntidad from "./PrecioEntidad";
import Pais from "./Pais";
import Departamento from "./Departamento";
import Provincia from "./Provincia";
import Ubigeo from "./Ubigeo";
import TipoVehiculo from "./TipoVehiculo";
import VehiculoEntidad from "./VehiculoEntidad";
import LineaCreditoEntidad from "./LineaCreditoEntidad";
import MovimientoAlmacen from "./MovimientoAlmacen";
import TipoConcepto from "./TipoConcepto";
import ConceptoMovAlmacen from "./ConceptoMovAlmacen";
import TipoMovimientoAlmacen from "./TipoMovimientoAlmacen";
import TipoAlmacen from "./TipoAlmacen";
import CentrosAlmacen from "./CentrosAlmacen";
import Almacen from "./Almacen";
import SerieDoc from "./SerieDoc";
import FamiliaProducto from "./FamiliaProducto";
import SubfamiliaProducto from "./SubfamiliaProducto";
import UnidadMedida from "./UnidadMedida";
import TipoMaterial from "./TipoMaterial";
import Color from "./Color";
import KardexAlmacen from "./KardexAlmacen";
import SaldosProductoCliente from "./SaldosProductoCliente";
import SaldosDetProductoCliente from "./SaldosDetProductoCliente";
import TemporadaPesca from "./TemporadaPesca";
import Embarcacion from "./Embarcacion";
import DetalleEmbarcacion from "./DetalleEmbarcacion";
import DetalleDocEmbarcacion from "./DetalleDocEmbarcacion";
import BolicheRed from "./BolicheRed";
import CentroCosto from "./CentroCosto";
import CategoriaCCosto from "./CategoriaCCosto";
import EmpresaCentroCosto from "./EmpresaCentroCosto";
import DetalleDescargaFaena from "./DetalleDescargaFaena";
import AccionesPreviasFaena from "./AccionesPreviasFaena";
import DetAccionesPreviasFaena from "./DetAccionesPreviasFaena";
import DetCotizacionVentas from "./DetCotizacionVentas";
import AccesoInstalacion from "./AccesoInstalacion";
import TipoEquipo from "./TipoEquipo";
import TipoMovimiento from "./TipoMovimiento";
import NovedadPescaConsumo from "./NovedadPescaConsumo";
import TripulanteFaenaConsumo from "./TripulanteFaenaConsumo";
import FaenaPesca from "./FaenaPesca";
import FaenaPescaConsumo from "./FaenaPescaConsumo";
import Cala from "./Cala";
import DetalleCalaEspecie from "./DetalleCalaEspecie";
import DetCalaPescaConsumo from "./DetCalaPescaConsumo";
import DetDescargaFaenaConsumo from "./DetDescargaFaenaConsumo";
import DetAccionesPreviasFaenaConsumo from "./DetAccionesPreviasFaenaConsumo";
import RequerimientoCompra from "./RequerimientoCompra";
import DetalleReqCompra from "./DetalleReqCompra";
import OrdenCompra from "./OrdenCompra";
import DetalleOrdenCompra from "./DetalleOrdenCompra";
import PreFactura from "./PreFactura";
import DetallePreFactura from "./DetallePreFactura";
import OTMantenimiento from "./OTMantenimiento";
import DetPermisoGestionadoOT from "./DetPermisoGestionadoOT";
import DetTareasOT from "./DetTareasOT";
import DetInsumosTareaOT from "./DetInsumosTareaOT";
import TiposDocIdentidad from "./TiposDocIdentidad";
import DetDocsReqCotizaVentas from "./DetDocsReqCotizaVentas";
import AccesoInstalacionDetalle from "./AccesoInstalacionDetalle";
import TipoMovimientoAcceso from "./TipoMovimientoAcceso";
import SedesEmpresa from "./SedesEmpresa";
import TipoAlmacenamiento from "./TipoAlmacenamiento";
import Marca from "./Marca";
import DocRequeridaVentas from "./DocRequeridaVentas";
import RequisitoDocPorPais from "./RequisitoDocPorPais";
import TipoContenedor from "./TipoContenedor";
/**
 * Componente MultiCrud
 *
 * Permite abrir múltiples módulos CRUD en pestañas dinámicas.
 * Cada módulo se representa como un TabPanel independiente.
 * El usuario puede alternar, cerrar y abrir módulos sin perder el estado de cada uno.
 */
export default function MultiCrud() {
  // Detecta si es móvil (responsivo)
  const isMobile = useIsMobile();
  // Estado para mostrar/ocultar el Drawer en móvil
  const [visibleSidebar, setVisibleSidebar] = useState(false);
  // Estado para las pestañas abiertas (inicia vacío, sin módulos abiertos)
  const [tabs, setTabs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Catálogo de módulos disponibles (key -> componente)
  const modulos = {
    tipoContenedor: {
      label: "Tipo Contenedor",
      componente: <TipoContenedor ruta="tipoContenedor" />,
    },
    almacen: { label: "Almacenes", componente: <Almacen ruta="almacen" /> },
    centrosAlmacen: {
      label: "Centros de Almacén",
      componente: <CentrosAlmacen ruta="centrosAlmacen" />,
    },
    tipoAlmacenamiento: {
      label: "Tipo Almacenamiento",
      componente: <TipoAlmacenamiento ruta="tipoAlmacenamiento" />,
    },
    marca: { label: "Marca", componente: <Marca ruta="marca" /> },
    parametroAprobador: {
      label: "Aprobadores",
      componente: <ParametroAprobador ruta="parametroAprobador" />,
    },
    tiposDocIdentidad: {
      label: "Tipos de Documentos de Identidad",
      componente: <TiposDocIdentidad ruta="tiposDocIdentidad" />,
    },
    oTMantenimiento: {
      label: "Ordenes de Trabajo",
      componente: <OTMantenimiento ruta="oTMantenimiento" />,
    },
    detPermisoGestionadoOT: {
      label: "Detalle Permisos Gestionados OT",
      componente: <DetPermisoGestionadoOT ruta="detPermisoGestionadoOT" />,
    },
    detTareasOT: {
      label: "Detalle Tareas OT",
      componente: <DetTareasOT ruta="detTareasOT" />,
    },
    detInsumosTareaOT: {
      label: "Detalle Insumos de Tarea OT",
      componente: <DetInsumosTareaOT ruta="detInsumosTareaOT" />,
    },
    preFactura: {
      label: "Pre-Factura",
      componente: <PreFactura ruta="preFactura" />,
    },
    detallePreFactura: {
      label: "Detalle Pre-Factura",
      componente: <DetallePreFactura ruta="detallePreFactura" />,
    },
    docRequeridaVentas: {
      label: "Documentos Requeridos Ventas",
      componente: <DocRequeridaVentas ruta="docRequeridaVentas" />,
    },
    requisitoDocPorPais: {
      label: "Requisitos Documentales por País",
      componente: <RequisitoDocPorPais ruta="requisitoDocPorPais" />,
    },
    ordenCompra: {
      label: "Orden Compra",
      componente: <OrdenCompra ruta="ordenCompra" />,
    },
    detalleOrdenCompra: {
      label: "Detalle Orden Compra",
      componente: <DetalleOrdenCompra ruta="detalleOrdenCompra" />,
    },
    requerimientoCompra: {
      label: "Requerimiento Compra",
      componente: <RequerimientoCompra ruta="requerimientoCompra" />,
    },
    detalleReqCompra: {
      label: "Detalle Requerimiento Compra",
      componente: <DetalleReqCompra ruta="detalleReqCompra" />,
    },
    detAccionesPreviasFaenaConsumo: {
      label: "Detalle Acciones Previas Faena Novedad Pesca Consumo",
      componente: (
        <DetAccionesPreviasFaenaConsumo ruta="detAccionesPreviasFaenaConsumo" />
      ),
    },
    detDescargaFaenaConsumo: {
      label: "Detalle Descargas Faena Novedad Pesca Consumo",
      componente: <DetDescargaFaenaConsumo ruta="detDescargaFaenaConsumo" />,
    },
    detCalaPescaConsumo: {
      label: "Detalle Cala Faena Novedad Pesca Consumo",
      componente: <DetCalaPescaConsumo ruta="detCalaPescaConsumo" />,
    },
    detalleCalaEspecie: {
      label: "Detalle Cala Faena Temporada Pesca",
      componente: <DetalleCalaEspecie ruta="detalleCalaEspecie" />,
    },
    cala: {
      label: "Cala Faena Temporada Pesca",
      componente: <Cala ruta="cala" />,
    },
    faenaPescaConsumo: {
      label: "Faena Novedad Pesca Consumo",
      componente: <FaenaPescaConsumo ruta="faenaPescaConsumo" />,
    },
    faenaPesca: {
      label: "Faena Temporada Pesca",
      componente: <FaenaPesca ruta="faenaPesca" />,
    },
    tripulanteFaenaConsumo: {
      label: "Tripulante Faena Consumo",
      componente: <TripulanteFaenaConsumo ruta="tripulanteFaenaConsumo" />,
    },
    novedadPescaConsumo: {
      label: "Novedad Pesca Consumo",
      componente: <NovedadPescaConsumo ruta="novedadPescaConsumo" />,
    },
    tipoMovimiento: {
      label: "Tipo Movimiento",
      componente: <TipoMovimiento ruta="tipoMovimiento" />,
    },
    accesoInstalacion: {
      label: "Acceso Instalaciones",
      componente: <AccesoInstalacion ruta="accesoInstalacion" />,
    },
    accesoInstalacionDetalle: {
      label: "Detalle Acceso Instalaciones",
      componente: <AccesoInstalacionDetalle ruta="accesoInstalacionDetalle" />,
    },
    tipoMovimientoAcceso: {
      label: "Tipos de Movimiento de Acceso",
      componente: <TipoMovimientoAcceso ruta="tipoMovimientoAcceso" />,
    },
    tipoEquipo: {
      label: "Tipo Equipo",
      componente: <TipoEquipo ruta="tipoEquipo" />,
    },
    personal: { label: "Personal", componente: <Personal ruta="personal" /> },
    cargosPersonal: {
      label: "Cargos del Personal",
      componente: <CargosPersonal ruta="cargosPersonal" />,
    },
    tipoContrato: {
      label: "Tipo Contrato",
      componente: <TipoContrato ruta="tipoContrato" />,
    },
    tipoDocumento: {
      label: "Tipo Documento",
      componente: <TipoDocumento ruta="tipoDocumento" />,
    },
    usuarios: { label: "Usuarios", componente: <Usuarios ruta="usuarios" /> },
    modulosSistema: {
      label: "Módulos Sistema",
      componente: <ModulosSistema ruta="modulosSistema" />,
    },
    SubmodulosSistema: {
      label: "Submódulos Sistema",
      componente: <SubmodulosSistema ruta="SubmodulosSistema" />,
    },
    empresas: { label: "Empresas", componente: <Empresas ruta="empresas" /> },
    sedesEmpresa: {
      label: "Sedes Empresa",
      componente: <SedesEmpresa ruta="sedesEmpresa" />,
    },
    areasFisicasSede: {
      label: "Áreas Físicas Sede Empresa",
      componente: <AreasFisicasSede ruta="areasFisicasSede" />,
    },
    activo: { label: "Activos", componente: <Activo ruta="activo" /> },
    detallePermisoActivo: {
      label: "Detalle Permisos Activo",
      componente: <DetallePermisoActivo ruta="detallePermisoActivo" />,
    },
    especie: { label: "Especies", componente: <Especie ruta="especie" /> },
    estadoMultiFuncion: {
      label: "Estado Multifunción",
      componente: <EstadoMultiFuncion ruta="estadoMultiFuncion" />,
    },
    permisoAutorizacion: {
      label: "Permisos para Activos",
      componente: <PermisoAutorizacion ruta="permisoAutorizacion" />,
    },
    tipoActivo: {
      label: "Tipos de Activo",
      componente: <TipoActivo ruta="tipoActivo" />,
    },
    tipoProvieneDe: {
      label: "Tipo Proviene De",
      componente: <TipoProvieneDe ruta="tipoProvieneDe" />,
    },
    monedas: { label: "Monedas", componente: <Moneda ruta="monedas" /> },
    puertoPesca: {
      label: "Puerto de Pesca",
      componente: <PuertoPesca ruta="puertoPesca" />,
    },
    tipoMantenimiento: {
      label: "Tipo de Mantenimiento",
      componente: <TipoMantenimiento ruta="tipoMantenimiento" />,
    },
    motivoOriginoOT: {
      label: "Motivo Origino OT",
      componente: <MotivoOriginoOT ruta="motivoOriginoOT" />,
    },
    banco: { label: "Bancos", componente: <Banco ruta="banco" /> },
    incoterm: { label: "Incoterms", componente: <Incoterm ruta="incoterm" /> },
    movimientoCaja: {
      label: "Movimientos de Caja",
      componente: <MovimientoCaja ruta="movimientoCaja" />,
    },
    detalleEmbarcacion: {
      label: "Detalle Embarcación",
      componente: <DetalleEmbarcacion ruta="detalleEmbarcacion" />,
    },
    cuentaCorriente: {
      label: "Cuenta Corriente",
      componente: <CuentaCorriente ruta="cuentaCorriente" />,
    },
    tipoCuentaCorriente: {
      label: "Tipo Cuenta Corriente",
      componente: <TipoCuentaCorriente ruta="tipoCuentaCorriente" />,
    },
    tipoReferenciaMovimientoCaja: {
      label: "Tipo Referencia Movimiento Caja",
      componente: (
        <TipoReferenciaMovimientoCaja ruta="tipoReferenciaMovimientoCaja" />
      ),
    },
    asientoContableInterfaz: {
      label: "Asientos Contable Generados",
      componente: <AsientoContableInterfaz ruta="asientoContableInterfaz" />,
    },
    tipoEmbarcacion: {
      label: "Tipo Embarcación",
      componente: <TipoEmbarcacion ruta="tipoEmbarcacion" />,
    },
    documentoPesca: {
      label: "Documento Pesca",
      componente: <DocumentoPesca ruta="documentoPesca" />,
    },
    documentacionEmbarcacion: {
      label: "Documentación Embarcación",
      componente: <DocumentacionEmbarcacion ruta="documentacionEmbarcacion" />,
    },
    detalleDocEmbarcacion: {
      label: "Detalle Doc Embarcación",
      componente: <DetalleDocEmbarcacion ruta="detalleDocEmbarcacion" />,
    },
    bolicheRed: {
      label: "Boliche Red",
      componente: <BolicheRed ruta="bolicheRed" />,
    },
    accesosUsuario: {
      label: "Accesos Usuario",
      componente: <AccesosUsuario ruta="accesosUsuario" />,
    },
    documentacionPersonal: {
      label: "Documentación Personal",
      componente: <DocumentacionPersonal ruta="documentacionPersonal" />,
    },
    tipoMovEntregaRendir: {
      label: "Tipo Movimiento Entrega a Rendir",
      componente: <TipoMovEntregaRendir ruta="tipoMovEntregaRendir" />,
    },
    centroCosto: {
      label: "Centro de Costo",
      componente: <CentroCosto ruta="centroCosto" />,
    },
    categoriaCCosto: {
      label: "Categoría Centro de Costo",
      componente: <CategoriaCCosto ruta="categoriaCCosto" />,
    },
    empresaCentroCosto: {
      label: "Empresa Centro de Costo",
      componente: <EmpresaCentroCosto ruta="empresaCentroCosto" />,
    },
    detalleDescargaFaena: {
      label: "Detalle Descarga Faena Temporada Pesca",
      componente: <DetalleDescargaFaena />,
    },
    accionesPreviasFaena: {
      label: "Acciones Previas Faena",
      componente: <AccionesPreviasFaena ruta="accionesPreviasFaena" />,
    },
    detAccionesPreviasFaena: {
      label: "Detalle Acciones Previas Faena Temporada Pesca",
      componente: <DetAccionesPreviasFaena ruta="detAccionesPreviasFaena" />,
    },
    tipoEntidad: { label: "Tipos de Entidad", componente: <TipoEntidad ruta="tipoEntidad" /> },
    formaPago: { label: "Formas de Pago", componente: <FormaPago ruta="formaPago" /> },
    agrupacionEntidad: {
      label: "Agrupaciones de Entidad Comercial",
      componente: <AgrupacionEntidad ruta="agrupacionEntidad" />,
    },
    contactoEntidad: {
      label: "Contactos de Entidad Comercial",
      componente: <ContactoEntidad ruta="contactoEntidad" />,
    },
    entidadComercial: {
      label: "Entidades Comerciales",
      componente: <EntidadComercial ruta="entidadComercial" />,
    },
    direccionEntidad: {
      label: "Direcciones de Entidad Comercial",
      componente: <DireccionEntidad ruta="direccionEntidad" />,
    },
    precioEntidad: {
      label: "Precios Especiales Entidad Comercial",
      componente: <PrecioEntidad ruta="precioEntidad" />,
    },
    pais: { label: "Países", componente: <Pais ruta="pais" /> },
    departamento: { label: "Departamentos", componente: <Departamento ruta="departamento" /> },
    provincia: { label: "Provincias", componente: <Provincia ruta="provincia" /> },
    ubigeo: { label: "Ubigeos", componente: <Ubigeo ruta="ubigeo" /> },
    tipoVehiculo: { label: "Tipos de Vehículo", componente: <TipoVehiculo ruta="tipoVehiculo" /> },
    vehiculoEntidad: {
      label: "Vehículos Entidad Comercial",
      componente: <VehiculoEntidad ruta="vehiculoEntidad" />,
    },
    lineaCreditoEntidad: {
      label: "Líneas Crédito Entidad Comercial",
      componente: <LineaCreditoEntidad ruta="lineaCreditoEntidad" />,
    },
    movimientoAlmacen: {
      label: "Movimientos de Almacén",
      componente: <MovimientoAlmacen ruta="movimientoAlmacen" />,
    },
    tipoConcepto: {
      label: "Tipos de Concepto Movimientos Almacén",
      componente: <TipoConcepto ruta="tipoConcepto" />,
    },
    conceptoMovAlmacen: {
      label: "Conceptos Movimientos Almacén",
      componente: <ConceptoMovAlmacen ruta="conceptoMovAlmacen" />,
    },
    tipoMovimientoAlmacen: {
      label: "Tipos de Movimiento Almacén",
      componente: <TipoMovimientoAlmacen ruta="tipoMovimientoAlmacen" />,
    },
    tipoAlmacen: { label: "Tipos de Almacén", componente: <TipoAlmacen ruta="tipoAlmacen" /> },
    serieDoc: { label: "Series de Documento", componente: <SerieDoc ruta="serieDoc" /> },
    familiaProducto: {
      label: "Familias de Producto",
      componente: <FamiliaProducto ruta="familiaProducto" />,
    },
    subfamiliaProducto: {
      label: "Subfamilias de Producto",
      componente: <SubfamiliaProducto ruta="subfamiliaProducto" />,
    },
    unidadMedida: {
      label: "Empaques Unidades de Medida",
      componente: <UnidadMedida ruta="unidadMedida" />,
    },
    tipoMaterial: {
      label: "Tipos de Material Producto",
      componente: <TipoMaterial ruta="tipoMaterial" />,
    },
    color: { label: "Colores Producto", componente: <Color ruta="color" /> },
    producto: { label: "Productos y Servicios", componente: <Producto ruta="producto" /> },
    kardexAlmacen: {
      label: "Kardex de Almacén",
      componente: <KardexAlmacen ruta="kardexAlmacen" />,
    },
    saldosProductoCliente: {
      label: "Saldos de Productos-Cliente",
      componente: <SaldosProductoCliente ruta="saldosProductoCliente" />,
    },
    saldosDetProductoCliente: {
      label: "Saldos de Productos-Cliente Variables Control",
      componente: <SaldosDetProductoCliente ruta="saldosDetProductoCliente" />,
    },
    cotizacionVentas: {
      label: "Cotización de Ventas",
      componente: <CotizacionVentas ruta="cotizacionVentas" />,
    },
    detCotizacionVentas: {
      label: "Detalle Cotización Ventas",
      componente: <DetCotizacionVentas ruta="detCotizacionVentas" />,
    },
    detDocsReqCotizaVentas: {
      label: "Documentos Requeridos Cotización Ventas",
      componente: <DetDocsReqCotizaVentas ruta="detDocsReqCotizaVentas" />,
    },
    tipoProducto: {
      label: "Tipos de Mercaderia",
      componente: <TipoProducto ruta="tipoProducto" />,
    },
    tipoEstadoProducto: {
      label: "Estado del Producto",
      componente: <TipoEstadoProducto ruta="tipoEstadoProducto" />,
    },
    destinoProducto: {
      label: "Destinos de Mercaderia",
      componente: <DestinoProducto ruta="destinoProducto" />,
    },
    formaTransaccion: {
      label: "Formas de Transacción Venta",
      componente: <FormaTransaccion ruta="formaTransaccion" />,
    },
    modoDespachoRecepcion: {
      label: "Formas Entrega(Venta)/Recepción(Compra) de Mercaderia",
      componente: <ModoDespachoRecepcion ruta="modoDespachoRecepcion" />,
    },
    tipoPersona: { label: "Tipos de Persona", componente: <TipoPersona ruta="tipoPersona" /> },
    motivoAcceso: { label: "Motivos de Acceso", componente: <MotivoAcceso ruta="motivoAcceso" /> },
    tipoAccesoInstalacion: {
      label: "Tipos de Acceso Instalación",
      componente: <TipoAccesoInstalacion ruta="tipoAccesoInstalacion" />,
    },
    temporadaPesca: {
      label: "Temporadas de Pesca",
      componente: <TemporadaPesca ruta="temporadaPesca" />,
    },
    embarcacion: { label: "Embarcaciones", componente: <Embarcacion ruta="embarcacion" /> },
    // ...agrega aquí los componentes reales según los vayas creando
  };

  /**
   * Lógica profesional para abrir módulos en pestañas dinámicas desde cualquier opción del menú.
   * Si el módulo existe, abre el componente real; si no, abre una pestaña temporal con mensaje "Próximamente".
   */
  const abrirModulo = (key, label) => {
    const existe = !!modulos[key];
    const idx = tabs.findIndex((tab) => tab.key === key);
    if (idx === -1) {
      setTabs([
        ...tabs,
        existe
          ? { key, label: modulos[key].label, content: modulos[key].componente }
          : {
              key,
              label: label || key,
              content: (
                <div
                  style={{ padding: 32, textAlign: "center", color: "#888" }}
                >
                  <i
                    className="pi pi-cog"
                    style={{ fontSize: 36, marginBottom: 12 }}
                  />
                  <h3>Módulo próximamente</h3>
                  <p>Este módulo estará disponible en una próxima versión.</p>
                </div>
              ),
            },
      ]);
      setActiveIndex(tabs.length);
    } else {
      setActiveIndex(idx);
    }
  };

  /**
   * Menú jerárquico profesional (idéntico a BaseLayout, pero adaptado a multitarea)
   * Cada opción con command abre su módulo en pestaña.
   * Submenús y estructura visual se mantienen.
   */
  const menuItems = [
    {
      label: "INICIO",
      icon: "pi pi-home",
      command: () => abrirModulo("inicio", "Inicio"),
    },
    {
      label: "ACCESO INSTALACIONES",
      icon: "pi pi-shield",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              {
                label: "Movimientos Acceso",
                icon: "pi pi-sign-in", // ✅ Entrada/Salida
                command: () =>
                  abrirModulo(
                    "accesoInstalacion",
                    "Movimientos Acceso Instalaciones"
                  ),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Tipos de Movimiento",
                icon: "pi pi-arrows-h", // ✅ Movimientos bidireccionales
                command: () =>
                  abrirModulo(
                    "tipoMovimientoAcceso",
                    "Tipos de Movimiento de Acceso"
                  ),
              },
              {
                label: "Tipo Equipos",
                icon: "pi pi-desktop", // ✅ Equipos tecnológicos
                command: () => abrirModulo("tipoEquipo", "Tipo Equipos"),
              },
              {
                label: "Tipos de Persona",
                icon: "pi pi-users", // ✅ Correcto
                command: () => abrirModulo("tipoPersona", "Tipos de Persona"),
              },
              {
                label: "Motivos de Acceso",
                icon: "pi pi-question-circle", // ✅ Correcto
                command: () => abrirModulo("motivoAcceso", "Motivos de Acceso"),
              },
              {
                label: "Tipos de Acceso",
                icon: "pi pi-key", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "tipoAccesoInstalacion",
                    "Tipos de Acceso a Instalaciones"
                  ),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "PESCA",
      icon: "pi pi-anchor",
      items: [
        [
          {
            label: "Pesca",
            items: [
              {
                label: "Pesca Industrial",
                icon: "pi pi-compass", // ✅ Navegación/Faenas
                command: () =>
                  abrirModulo("temporadaPesca", "Pesca Industrial"),
              },
              {
                label: "Pesca de Consumo",
                icon: "pi pi-shopping-bag", // ✅ Consumo directo
                command: () =>
                  abrirModulo("novedadPescaConsumo", "Pesca de Consumo"),
              },
            ],
          },
        ],
        [
          {
            label: "Configuración",
            items: [
              {
                label: "Especies",
                icon: "pi pi-star", // ✅ Especies destacadas
                command: () => abrirModulo("especie", "Especies"),
              },
              {
                label: "Acciones Previas",
                icon: "pi pi-list-check", // ✅ Checklist de acciones
                command: () =>
                  abrirModulo("accionesPreviasFaena", "Acciones previas Faena"),
              },
              {
                label: "Embarcaciones",
                icon: "pi pi-directions", // ✅ Embarcaciones/Navegación
                command: () => abrirModulo("embarcacion", "Embarcaciones"),
              },
              {
                label: "Tipo Embarcación",
                icon: "pi pi-tags", // ✅ Clasificación
                command: () =>
                  abrirModulo("tipoEmbarcacion", "Tipo Embarcación"),
              },
              {
                label: "Boliche de Red",
                icon: "pi pi-circle", // ✅ Correcto
                command: () => abrirModulo("bolicheRed", "Boliche de Red"),
              },
              {
                label: "Documentación Pesca",
                icon: "pi pi-file-pdf", // ✅ Documentos
                command: () =>
                  abrirModulo("documentoPesca", "Documentación Pesca"),
              },
              {
                label: "Documentación Embarcación",
                icon: "pi pi-folder-open", // ✅ Carpeta de documentos
                command: () =>
                  abrirModulo(
                    "documentacionEmbarcacion",
                    "Detalle Documentación Embarcación"
                  ),
              },
              {
                label: "Documentación Personal",
                icon: "pi pi-id-card", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "documentacionPersonal",
                    "Documentación Personal"
                  ),
              },
              {
                label: "Puerto de Pesca",
                icon: "pi pi-map-marker", // ✅ Ubicación de puertos
                command: () => abrirModulo("puertoPesca", "Puerto de Pesca"),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "COMPRAS",
      icon: "pi pi-shopping-cart",
      items: [
        [
          {
            label: "Proceso de Compras",
            items: [
              {
                label: "Requerimiento Compra",
                icon: "pi pi-file-edit", // ✅ Editar solicitud
                command: () =>
                  abrirModulo("requerimientoCompra", "Requerimiento Compra"),
              },
              {
                label: "Orden de Compra",
                icon: "pi pi-shopping-cart", // ✅ Compra confirmada
                command: () => abrirModulo("ordenCompra", "Orden de Compra"),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Tipo Producto",
                icon: "pi pi-box", // ✅ Productos
                command: () => abrirModulo("tipoProducto", "Tipo Producto"),
              },
              {
                label: "Tipo Estado Producto",
                icon: "pi pi-flag", // ✅ Estados
                command: () =>
                  abrirModulo("tipoEstadoProducto", "Tipo Estado Producto"),
              },
              {
                label: "Destino Producto",
                icon: "pi pi-send", // ✅ Envío/Destino
                command: () =>
                  abrirModulo("destinoProducto", "Destino Producto"),
              },
              {
                label: "Forma de Pago",
                icon: "pi pi-credit-card", // ✅ Pago
                command: () => abrirModulo("formaPago", "Forma de Pago"),
              },
              {
                label: "Modo Despacho/Recepción",
                icon: "pi pi-truck", // ✅ Transporte
                command: () =>
                  abrirModulo(
                    "modoDespachoRecepcion",
                    "Modo Despacho/Recepción"
                  ),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "VENTAS",
      icon: "pi pi-dollar",
      items: [
        [
          {
            label: "Proceso de Ventas",
            items: [
              {
                label: "Cotización Ventas",
                icon: "pi pi-file-edit", // ✅ Editar cotización
                command: () =>
                  abrirModulo("cotizacionVentas", "Cotización Ventas"),
              },
              {
                label: "Pre-Factura",
                icon: "pi pi-file-pdf", // ✅ Documento PDF
                command: () => abrirModulo("preFactura", "Pre-Factura"),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Incoterms",
                icon: "pi pi-globe", // ✅ Internacional
                command: () => abrirModulo("incoterm", "Incoterms"),
              },
              {
                label: "Documentos Requeridos Ventas",
                icon: "pi pi-file-check",
                command: () =>
                  abrirModulo(
                    "docRequeridaVentas",
                    "Documentos Requeridos Ventas"
                  ),
              },
              {
                label: "Requisitos Doc. por País",
                icon: "pi pi-map",
                command: () =>
                  abrirModulo(
                    "requisitoDocPorPais",
                    "Requisitos Documentales por País"
                  ),
              },
              {
                label: "Tipo Contenedor",
                icon: "pi pi-box",
                command: () => abrirModulo("tipoContenedor", "Tipo Contenedor"),
              },
              {
                label: "Formas Transaccion",
                icon: "pi pi-sync",
                command: () => abrirModulo("formaTransaccion", "Formas Transaccion"),
              }
            ],
          },
        ],
      ],
    },
    {
      label: "INVENTARIOS",
      icon: "pi pi-warehouse",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              {
                label: "Movimientos Almacén",
                icon: "pi pi-arrows-h", // ✅ Movimientos
                command: () =>
                  abrirModulo("movimientoAlmacen", "Movimientos Almacén"),
              },
            ],
          },
          {
            label: "Reportes",
            items: [
              {
                label: "Kardex Almacén",
                icon: "pi pi-chart-line", // ✅ Correcto
                command: () => abrirModulo("kardexAlmacen", "Kardex Almacén"),
              },
              {
                label: "Saldos Productos-Cliente",
                icon: "pi pi-chart-bar", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "saldosProductoCliente",
                    "Saldos Productos-Cliente"
                  ),
              },
              {
                label: "Saldos Productos-Cliente por Variables Control Stock",
                icon: "pi pi-table", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "saldosDetProductoCliente",
                    "Saldos Productos-Cliente Variables Control Stock"
                  ),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Conceptos Movimientos",
                icon: "pi pi-bookmark", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "conceptoMovAlmacen",
                    "Conceptos Movimientos Almacén"
                  ),
              },
              {
                label: "Tipos de Documento",
                icon: "pi pi-file", // ✅ Documentos
                command: () =>
                  abrirModulo("tipoDocumento", "Tipos de Documento"),
              },
              {
                label: "Tipos de Concepto",
                icon: "pi pi-tags", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "tipoConcepto",
                    "Tipos de Concepto Movimientos Almacén"
                  ),
              },
              {
                label: "Tipos de Movimiento",
                icon: "pi pi-sort-alt", // ✅ Clasificación de movimientos
                command: () =>
                  abrirModulo(
                    "tipoMovimientoAlmacen",
                    "Tipos de Movimiento Almacén"
                  ),
              },
              {
                label: "Tipos de Almacén",
                icon: "pi pi-building", // ✅ Correcto
                command: () => abrirModulo("tipoAlmacen", "Tipos de Almacén"),
              },
              {
                label: "Centros de Almacén",
                icon: "pi pi-sitemap", // ✅ Estructura organizacional
                command: () =>
                  abrirModulo("centrosAlmacen", "Centros de Almacén"),
              },
              {
                label: "Almacenes",
                icon: "pi pi-warehouse", // ✅ Almacenes
                command: () => abrirModulo("almacen", "Almacenes"),
              },
              {
                label: "Series de Documento",
                icon: "pi pi-hashtag", // ✅ Numeración
                command: () => abrirModulo("serieDoc", "Series de Documento"),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "MANTENIMIENTO",
      icon: "pi pi-wrench",
      items: [
        [
          {
            label: "Órdenes de Trabajo",
            items: [
              {
                label: "Ordenes de Trabajo",
                icon: "pi pi-wrench", // ✅ Mantenimiento
                command: () =>
                  abrirModulo("oTMantenimiento", "Ordenes de Trabajo"),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Tipo de Mantenimiento",
                icon: "pi pi-cog", // ✅ Configuración
                command: () =>
                  abrirModulo("tipoMantenimiento", "Tipo de Mantenimiento"),
              },
              {
                label: "Motivo Origino OT",
                icon: "pi pi-exclamation-circle", // ✅ Motivo/Alerta
                command: () =>
                  abrirModulo("motivoOriginoOT", "Motivo Origino OT"),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "FLUJO DE CAJA",
      icon: "pi pi-money-bill",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              {
                label: "Movimientos de Caja",
                icon: "pi pi-money-bill", // ✅ Correcto
                command: () =>
                  abrirModulo("movimientoCaja", "Movimientos de Caja"),
              },
              {
                label: "Cuenta Corriente",
                icon: "pi pi-wallet", // ✅ Correcto
                command: () =>
                  abrirModulo("cuentaCorriente", "Cuenta Corriente"),
              },
              {
                label: "Tipos Movimiento Entregas a Rendir",
                icon: "pi pi-send", // ✅ Entregas
                command: () =>
                  abrirModulo(
                    "tipoMovEntregaRendir",
                    "Tipos Movimiento Entrega a Rendir"
                  ),
              },
            ],
          },
          {
            label: "Contabilidad",
            items: [
              {
                label: "Asientos Contables",
                icon: "pi pi-book", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "asientoContableInterfaz",
                    "Asientos Contables Generados"
                  ),
              },
              {
                label: "Centros de Costo",
                icon: "pi pi-sitemap", // ✅ Estructura de costos
                command: () => abrirModulo("centroCosto", "Centros de Costo"),
              },
              {
                label: "Categorías Centro Costo",
                icon: "pi pi-tags", // ✅ Categorías
                command: () =>
                  abrirModulo(
                    "categoriaCCosto",
                    "Categorias de Centros de Costo"
                  ),
              },
              {
                label: "Empresa por Centro Costo",
                icon: "pi pi-building", // ✅ Empresas
                command: () =>
                  abrirModulo("empresaCentroCosto", "Empresa por Centro Costo"),
              },
            ],
          },
          {
            label: "Configuración",
            items: [
              {
                label: "Tipo Cuenta Corriente",
                icon: "pi pi-list", // ✅ Listado
                command: () =>
                  abrirModulo("tipoCuentaCorriente", "Tipo Cuenta Corriente"),
              },
              {
                label: "Tipo Referencia",
                icon: "pi pi-tag", // ✅ Correcto
                command: () =>
                  abrirModulo(
                    "tipoReferenciaMovimientoCaja",
                    "Tipo Referencia Movimiento Caja"
                  ),
              },
              {
                label: "Bancos",
                icon: "pi pi-credit-card", // ✅ Correcto
                command: () => abrirModulo("banco", "Bancos"),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "USUARIOS",
      icon: "pi pi-users",
      items: [
        [
          {
            label: "Gestión Usuarios",
            items: [
              {
                label: "Usuarios del Sistema",
                icon: "pi pi-user", // ✅ Usuario individual
                command: () => abrirModulo("usuarios", "Usuarios del Sistema"),
              },
              {
                label: "Accesos Usuario",
                icon: "pi pi-lock", // ✅ Permisos/Seguridad
                command: () => abrirModulo("accesosUsuario", "Accesos Usuario"),
              },
              {
                label: "Módulos Sistema",
                icon: "pi pi-th-large", // ✅ Módulos/Grid
                command: () => abrirModulo("modulosSistema", "Módulos Sistema"),
              },
              {
                label: "Submódulos Sistema",
                icon: "pi pi-sitemap", // ✅ Estructura jerárquica
                command: () =>
                  abrirModulo("SubmodulosSistema", "Submódulos Sistema"),
              },
            ],
          },
        ],
      ],
    },
    {
      label: "MAESTROS",
      icon: "pi pi-database",
      items: [
        [
          {
            label: "Organización",
            items: [
              {
                label: "Empresas",
                icon: "pi pi-building", // ✅ Correcto
                command: () => abrirModulo("empresas", "Empresas"),
              },
              {
                label: "Sedes Empresa",
                icon: "pi pi-map-marker", // ✅ Correcto
                command: () => abrirModulo("sedesEmpresa", "Sedes Empresa"),
              },
              {
                label: "Areas Físicas Sede",
                icon: "pi pi-map", // ✅ Correcto
                command: () =>
                  abrirModulo("areasFisicasSede", "Areas Fisicas Sede"),
              },
              {
                label: "Estado Multi Función",
                icon: "pi pi-flag", // ✅ Estados
                command: () =>
                  abrirModulo("estadoMultiFuncion", "Estado Multi Funcion"),
              },
              {
                label: "Tipo Proviene De",
                icon: "pi pi-arrow-circle-left", // ✅ Procedencia
                command: () =>
                  abrirModulo("tipoProvieneDe", "Tipo Proviene De"),
              },
              {
                label: "Monedas",
                icon: "pi pi-dollar", // ✅ Correcto
                command: () => abrirModulo("monedas", "Monedas"),
              },
              {
                label: "Personal",
                icon: "pi pi-id-card", // ✅ Identificación personal
                command: () => abrirModulo("personal", "Personal"),
              },
              {
                label: "Cargos Personal",
                icon: "pi pi-briefcase", // ✅ Cargos/Puestos
                command: () =>
                  abrirModulo("cargosPersonal", "Cargos del Personal"),
              },
              {
                label: "Tipo Contrato",
                icon: "pi pi-file-edit", // ✅ Contratos
                command: () => abrirModulo("tipoContrato", "Tipo Contrato"),
              },
              {
                label: "Aprobadores",
                icon: "pi pi-check-circle", // ✅ Aprobación
                command: () => abrirModulo("parametroAprobador", "Aprobadores"),
              },
              {
                label: "Tipos Documento Identidad",
                icon: "pi pi-id-card", // ✅ Documentos de identidad
                command: () =>
                  abrirModulo("tiposDocIdentidad", "Tipos Documento Identidad"),
              },
            ],
          },
        ],
        [
          {
            label: "Operaciones",
            items: [
              {
                label: "Entidad Comercial",
                icon: "pi pi-briefcase", // ✅ Correcto
                command: () =>
                  abrirModulo("entidadComercial", "Entidad Comercial"),
              },
              {
                label: "Tipo Entidad",
                icon: "pi pi-tags", // ✅ Clasificación
                command: () => abrirModulo("tipoEntidad", "Tipo Entidad"),
              },
              {
                label: "Agrupaciones Entidad",
                icon: "pi pi-users", // ✅ Agrupaciones
                command: () =>
                  abrirModulo("agrupacionEntidad", "Agrupaciones Entidad"),
              },
              {
                label: "Forma Pago",
                icon: "pi pi-credit-card", // ✅ Pago
                command: () => abrirModulo("formaPago", "Forma Pago"),
              },
              {
                label: "Productos y Servicios",
                icon: "pi pi-box", // ✅ Productos
                command: () => abrirModulo("producto", "Productos y Servicios"),
              },
              {
                label: "Familia Producto",
                icon: "pi pi-sitemap", // ✅ Jerarquía
                command: () =>
                  abrirModulo("familiaProducto", "Familia Producto"),
              },
              {
                label: "Subfamilia Producto",
                icon: "pi pi-list", // ✅ Sublista
                command: () =>
                  abrirModulo("subfamiliaProducto", "Subfamilia Producto"),
              },
              {
                label: "Tipo Almacenamiento",
                icon: "pi pi-database", // ✅ Almacenamiento
                command: () =>
                  abrirModulo("tipoAlmacenamiento", "Tipo Almacenamiento"),
              },
              {
                label: "Marca",
                icon: "pi pi-tag", // ✅ Marca/Etiqueta
                command: () => abrirModulo("marca", "Marca"),
              },
              {
                label: "Unidad Medida",
                icon: "pi pi-calculator", // ✅ Medidas
                command: () => abrirModulo("unidadMedida", "Unidad Medida"),
              },
              {
                label: "Tipo Material",
                icon: "pi pi-box", // ✅ Materiales
                command: () => abrirModulo("tipoMaterial", "Tipo Material"),
              },
              {
                label: "Color",
                icon: "pi pi-palette", // ✅ Paleta de colores
                command: () => abrirModulo("color", "Color"),
              },
              {
                label: "Tipo Vehiculos",
                icon: "pi pi-car", // ✅ Vehículos
                command: () => abrirModulo("tipoVehiculo", "Tipo Vehiculos"),
              },
            ],
          },
        ],
        [
          {
            label: "Ubicaciones",
            items: [
              {
                label: "Pais",
                icon: "pi pi-globe", // ✅ Global/País
                command: () => abrirModulo("pais", "Pais"),
              },
              {
                label: "Departamento",
                icon: "pi pi-map", // ✅ Región
                command: () => abrirModulo("departamento", "Departamento"),
              },
              {
                label: "Provincia",
                icon: "pi pi-map-marker", // ✅ Ubicación específica
                command: () => abrirModulo("provincia", "Provincia"),
              },
              {
                label: "Ubigeo",
                icon: "pi pi-compass", // ✅ Coordenadas/Ubicación
                command: () => abrirModulo("ubigeo", "Ubigeo"),
              },
            ],
          },
        ],
        [
          {
            label: "Activos",
            items: [
              {
                label: "Activos",
                icon: "pi pi-cog", // ✅ Correcto
                command: () => abrirModulo("activo", "Activos"),
              },
              {
                label: "Tipo Activo",
                icon: "pi pi-tags", // ✅ Clasificación
                command: () => abrirModulo("tipoActivo", "Tipo Activo"),
              },
              {
                label: "Detalle Permiso Activo",
                icon: "pi pi-lock-open", // ✅ Permisos detallados
                command: () =>
                  abrirModulo("detallePermisoActivo", "Detalle Permiso Activo"),
              },
              {
                label: "Permiso Autorización",
                icon: "pi pi-key", // ✅ Correcto
                command: () =>
                  abrirModulo("permisoAutorizacion", "Permiso Autorizacion"),
              },
            ],
          },
        ],
      ],
    },
  ];

  // Cierra una pestaña por índice
  const cerrarTab = (index) => {
    const nuevaTabs = tabs.filter((_, i) => i !== index);
    setTabs(nuevaTabs);
    // Ajusta el índice activo
    if (activeIndex >= nuevaTabs.length) {
      setActiveIndex(nuevaTabs.length - 1);
    }
  };

  return (
    <div>
      {/*
        Menú profesional de módulos multitarea mejorado para móviles:
        - En desktop: MegaMenu horizontal PrimeReact con subcategorías organizadas
        - En móvil: Botón hamburguesa que abre Sidebar tipo Drawer con los módulos
        - Mejorado: renderizado jerárquico completo, estilos responsive y navegación táctil
        Documentado en español técnico.
      */}
      {isMobile ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
              padding: "8px 0",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Button
              icon="pi pi-bars"
              className="p-button-text p-button-lg"
              onClick={() => setVisibleSidebar(true)}
              style={{
                marginRight: 12,
                minWidth: "48px",
                minHeight: "48px",
              }}
              aria-label="Abrir menú de módulos"
            />
            <h3 style={{ margin: 0, color: "#495057" }}>ERP Megui - Módulos</h3>
          </div>

          <Sidebar
            visible={visibleSidebar}
            onHide={() => setVisibleSidebar(false)}
            position="left"
            style={{
              width: "85vw",
              maxWidth: "320px",
              fontSize: "14px",
            }}
            showCloseIcon
            modal
            dismissable
          >
            <div style={{ padding: "0 8px" }}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: "#2196F3",
                  borderBottom: "2px solid #2196F3",
                  paddingBottom: 8,
                }}
              >
                Módulos del Sistema
              </h3>

              {/* Renderizado profesional del menú jerárquico mejorado para móvil */}
              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {menuItems.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    {/* Categoría principal */}
                    <div
                      style={{
                        backgroundColor: "#f8f9fa",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: 8,
                        borderLeft: "4px solid #2196F3",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontWeight: "bold",
                          color: "#2196F3",
                          fontSize: "15px",
                        }}
                      >
                        <i
                          className={item.icon}
                          style={{ marginRight: 8, fontSize: "16px" }}
                        />
                        {item.label}
                      </div>
                    </div>

                    {/* Submenús organizados por grupos */}
                    {item.items &&
                      item.items.map((grupo, grupoIdx) => (
                        <div key={grupoIdx} style={{ marginBottom: 12 }}>
                          {grupo.map((subgrupo, subgrupoIdx) => (
                            <div key={subgrupoIdx} style={{ marginBottom: 8 }}>
                              {/* Título del subgrupo */}
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#6c757d",
                                  marginBottom: 6,
                                  paddingLeft: 12,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {subgrupo.label}
                              </div>

                              {/* Items del subgrupo */}
                              {subgrupo.items &&
                                subgrupo.items.map((subitem, subitemIdx) => (
                                  <Button
                                    key={subitemIdx}
                                    label={subitem.label}
                                    icon={subitem.icon}
                                    className="p-button-text"
                                    style={{
                                      width: "100%",
                                      justifyContent: "flex-start",
                                      marginBottom: 4,
                                      paddingLeft: 20,
                                      minHeight: "44px",
                                      fontSize: "13px",
                                      borderRadius: "6px",
                                      transition: "all 0.2s ease",
                                    }}
                                    onClick={() => {
                                      if (subitem.command) {
                                        subitem.command();
                                        setVisibleSidebar(false);
                                      }
                                    }}
                                    disabled={!subitem.command}
                                  />
                                ))}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </Sidebar>
        </>
      ) : (
        <MegaMenu model={menuItems} style={{ marginBottom: 12 }} />
      )}

      {/* Vista de pestañas dinámicas */}
      {/* Si no hay pestañas abiertas, muestra un mensaje profesional de bienvenida */}
      {tabs.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
          <i
            className="pi pi-folder-open"
            style={{ fontSize: 48, marginBottom: 16 }}
          />
          <h2>Bienvenido al ERP Megui</h2>
          <p>Seleccione un módulo del menú para comenzar a trabajar.</p>
        </div>
      ) : (
        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          renderActiveOnly={false} // Mantiene el estado de cada módulo
          scrollable
        >
          {tabs.map((tab, idx) => (
            <TabPanel
              key={tab.key}
              header={tab.label}
              closable={tabs.length > 1}
              onClose={() => cerrarTab(idx)}
            >
              {tab.content}
            </TabPanel>
          ))}
        </TabView>
      )}
    </div>
  );
}
