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
import EntregaARendir from "./EntregaARendir";
import DetMovsEntregaRendir from "./DetMovsEntregaRendir";
import TipoMovEntregaRendir from "./TipoMovEntregaRendir";
import DescargaFaenaConsumo from "./DescargaFaenaConsumo";
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
import DescargaFaenaPesca from "./DescargaFaenaPesca";
import CotizacionVentas from './CotizacionVentas';
import TipoProducto from './TipoProducto';
import TipoEstadoProducto from './TipoEstadoProducto';
import DestinoProducto from './DestinoProducto';
import FormaTransaccion from './FormaTransaccion';
import ModoDespachoRecepcion from './ModoDespachoRecepcion';
import DocRequeridaComprasVentas from './DocRequeridaComprasVentas';
import EntregaARendirPVentas from './EntregaARendirPVentas';
import DetMovsEntregaRendirPVentas from './DetMovsEntregaRendirPVentas';
import TipoPersona from './TipoPersona';
import MotivoAcceso from './MotivoAcceso';
import TipoAccesoInstalacion from './TipoAccesoInstalacion';
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
import DetalleMovimientoAlmacen from "./DetalleMovimientoAlmacen";
import TipoConcepto from "./TipoConcepto";
import ConceptoMovAlmacen from "./ConceptoMovAlmacen";
import TipoMovimientoAlmacen from "./TipoMovimientoAlmacen";
import TipoAlmacen from "./TipoAlmacen";
import SerieDoc from "./SerieDoc";
import FamiliaProducto from "./FamiliaProducto";
import SubfamiliaProducto from "./SubfamiliaProducto";
import UnidadMedida from "./UnidadMedida";
import TipoMaterial from "./TipoMaterial";
import Color from "./Color";
import KardexAlmacen from "./KardexAlmacen";
import SaldosProductoCliente from "./SaldosProductoCliente";
import SaldosDetProductoCliente from "./SaldosDetProductoCliente";
import DetGastosComprasProd from "./DetGastosComprasProd";
import LiquidacionProcesoComprasProd from "./LiquidacionProcesoComprasProd";
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
import DetProductoFinalCotizacionCompras from "./DetProductoFinalCotizacionCompras";
import EntregaARendirPCompras from "./EntregaARendirPCompras";
import DetMovsEntregaRendirPCompras from "./DetMovsEntregaRendirPCompras";
import MovLiquidacionProcesoComprasProd from "./MovLiquidacionProcesoComprasProd";
import AccesoInstalacion from "./AccesoInstalacion";
import TipoEquipo from "./TipoEquipo";
import TipoMovimiento from "./TipoMovimiento"
import NovedadPescaConsumo from "./NovedadPescaConsumo";
import TripulanteFaenaConsumo from "./TripulanteFaenaConsumo";
import FaenaPesca from "./FaenaPesca";
import FaenaPescaConsumo from "./FaenaPescaConsumo";
import EntregaARendirPescaConsumo from "./EntregaARendirPescaConsumo";
import DetDocEmbarcacionPescaConsumo from "./DetDocEmbarcacionPescaConsumo";
import Cala from "./Cala";
import DetalleCalaEspecie from "./DetalleCalaEspecie";
import CalaFaenaConsumo from "./CalaFaenaConsumo";
import DetCalaPescaConsumo from "./DetCalaPescaConsumo";
import DetDescargaFaenaConsumo from "./DetDescargaFaenaConsumo";
import DetAccionesPreviasFaenaConsumo from "./DetAccionesPreviasFaenaConsumo";
import DetMovsEntRendirPescaConsumo from "./DetMovsEntRendirPescaConsumo";
import CotizacionCompra from "./CotizacionCompra";
import DetCotizacionCompras from "./DetCotizacionCompras";
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
import DetDocsReqCotizaCompras from "./DetDocsReqCotizaCompras";
import SedesEmpresa from "./SedesEmpresa";
import TipoAlmacenamiento from "./TipoAlmacenamiento";
import Marca from "./Marca";


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
    tipoAlmacenamiento: { label: "Tipo Almacenamiento", componente: <TipoAlmacenamiento /> },
    marca: { label: "Marca", componente: <Marca /> },
    parametroAprobador: { label: "Aprobadores", componente: <ParametroAprobador /> },
    tiposDocIdentidad: { label: "Tipos de Documentos de Identidad", componente: <TiposDocIdentidad /> },
    oTMantenimiento: { label: "Ordenes de Trabajo", componente: <OTMantenimiento /> },
    detPermisoGestionadoOT: { label: "Detalle Permisos Gestionados OT", componente: <DetPermisoGestionadoOT /> },
    detTareasOT: { label: "Detalle Tareas OT", componente: <DetTareasOT /> },
    detInsumosTareaOT: { label: "Detalle Insumos de Tarea OT", componente: <DetInsumosTareaOT /> },
    preFactura: { label: "Pre-Factura", componente: <PreFactura /> },
    detallePreFactura: { label: "Detalle Pre-Factura", componente: <DetallePreFactura /> },
    cotizacionCompra: { label: "Cotización Compra", componente: <CotizacionCompra /> },
    detCotizacionCompras: { label: "Detalle Cotización Compra", componente: <DetCotizacionCompras /> },
    ordenCompra: { label: "Orden Compra", componente: <OrdenCompra /> },
    detalleOrdenCompra: { label: "Detalle Orden Compra", componente: <DetalleOrdenCompra /> },
    requerimientoCompra: { label: "Requerimiento Compra", componente: <RequerimientoCompra /> },
    detalleReqCompra: { label: "Detalle Requerimiento Compra", componente: <DetalleReqCompra /> },
    detMovsEntRendirPescaConsumo: { label: "Detalle Movimientos Entrega a Rendir Novedad Pesca Consumo", componente: <DetMovsEntRendirPescaConsumo /> },
    detAccionesPreviasFaenaConsumo: { label: "Detalle Acciones Previas Faena Novedad Pesca Consumo", componente: <DetAccionesPreviasFaenaConsumo /> },
    detDescargaFaenaConsumo: { label: "Detalle Descargas Faena Novedad Pesca Consumo", componente: <DetDescargaFaenaConsumo /> },
    detCalaPescaConsumo: { label: "Detalle Cala Faena Novedad Pesca Consumo", componente: <DetCalaPescaConsumo /> },
    calaFaenaConsumo: { label: "Cala Faena Novedad Pesca Consumo", componente: <CalaFaenaConsumo /> },
    detalleCalaEspecie: { label: "Detalle Cala Faena Temporada Pesca", componente: <DetalleCalaEspecie /> },
    cala: { label: "Cala Faena Temporada Pesca", componente: <Cala /> },
    detDocEmbarcacionPescaConsumo: { label: "Documentación Embarcación Novedad Pesca Consumo", componente: <DetDocEmbarcacionPescaConsumo /> },
    entregaARendirPescaConsumo: { label: "Entrega a Rendir Novedad Pesca Consumo", componente: <EntregaARendirPescaConsumo /> },
    faenaPescaConsumo: { label: "Faena Novedad Pesca Consumo", componente: <FaenaPescaConsumo /> },
    faenaPesca: { label: "Faena Temporada Pesca", componente: <FaenaPesca /> },
    tripulanteFaenaConsumo: { label: "Tripulante Faena Consumo", componente: <TripulanteFaenaConsumo /> },
    novedadPescaConsumo: { label: "Novedad Pesca Consumo", componente: <NovedadPescaConsumo /> },
    tipoMovimiento: { label: "Tipo Movimiento", componente: <TipoMovimiento /> },
    accesoInstalacion: { label: "Acceso Instalaciones", componente: <AccesoInstalacion /> },
    accesoInstalacionDetalle: { label: "Detalle Acceso Instalaciones", componente: <AccesoInstalacionDetalle /> },
    tipoMovimientoAcceso: { label: "Tipos de Movimiento de Acceso", componente: <TipoMovimientoAcceso /> },
    tipoEquipo: { label: "Tipo Equipo", componente: <TipoEquipo /> },
    personal: { label: "Personal", componente: <Personal /> },
    cargosPersonal: { label: "Cargos del Personal", componente: <CargosPersonal /> },
    tipoContrato: { label: "Tipo Contrato", componente: <TipoContrato /> },
    tipoDocumento: { label: "Tipo Documento", componente: <TipoDocumento /> },
    usuarios: { label: "Usuarios", componente: <Usuarios /> },
    modulosSistema: { label: "Módulos Sistema", componente: <ModulosSistema /> },
    SubmodulosSistema: { label: "Submódulos Sistema", componente: <SubmodulosSistema /> },
    empresas: { label: "Empresas", componente: <Empresas /> },
    sedesEmpresa: { label: "Sedes Empresa", componente: <SedesEmpresa /> },
    areasFisicasSede: { label: "Áreas Físicas Sede Empresa", componente: <AreasFisicasSede /> },
    activo: { label: "Activos", componente: <Activo /> },
    detallePermisoActivo: { label: "Detalle Permisos Activo", componente: <DetallePermisoActivo /> },
    especie: { label: "Especies", componente: <Especie /> },
    estadoMultiFuncion: { label: "Estado Multifunción", componente: <EstadoMultiFuncion /> },
    permisoAutorizacion: { label: "Permisos para Activos", componente: <PermisoAutorizacion /> },
    tipoActivo: { label: "Tipos de Activo", componente: <TipoActivo /> },
    tipoProvieneDe: { label: "Tipo Proviene De", componente: <TipoProvieneDe /> },
    monedas: { label: "Monedas", componente: <Moneda /> },
    puertoPesca: { label: "Puerto de Pesca", componente: <PuertoPesca /> },
    tipoMantenimiento: { label: "Tipo de Mantenimiento", componente: <TipoMantenimiento /> },
    motivoOriginoOT: { label: "Motivo Origino OT", componente: <MotivoOriginoOT /> },
    banco: { label: "Bancos", componente: <Banco /> },
    incoterm: { label: "Incoterms", componente: <Incoterm /> },
    movimientoCaja: { label: "Movimientos de Caja", componente: <MovimientoCaja /> },
    detalleEmbarcacion: { label: "Detalle Embarcación", componente: <DetalleEmbarcacion /> },
    cuentaCorriente: { label: "Cuenta Corriente", componente: <CuentaCorriente /> },
    tipoCuentaCorriente: { label: "Tipo Cuenta Corriente", componente: <TipoCuentaCorriente /> },
    tipoReferenciaMovimientoCaja: { label: "Tipo Referencia Movimiento Caja", componente: <TipoReferenciaMovimientoCaja /> },
    asientoContableInterfaz: { label: "Asientos Contable Generados", componente: <AsientoContableInterfaz /> },
    tipoEmbarcacion: { label: "Tipo Embarcación", componente: <TipoEmbarcacion /> },
    documentoPesca: { label: "Documento Pesca", componente: <DocumentoPesca /> },
    documentacionEmbarcacion: { label: "Documentación Embarcación", componente: <DocumentacionEmbarcacion /> },
    detalleDocEmbarcacion: { label: "Detalle Doc Embarcación", componente: <DetalleDocEmbarcacion /> },
    bolicheRed: { label: "Boliche Red", componente: <BolicheRed /> },
    accesosUsuario: { label: "Accesos Usuario", componente: <AccesosUsuario /> },
    documentacionPersonal: { label: "Documentación Personal", componente: <DocumentacionPersonal /> },
    entregaARendir: { label: "Entrega a Rendir", componente: <EntregaARendir /> },
    detMovsEntregaRendir: { label: "Detalle Movimientos Entrega a Rendir Temporada Pesca", componente: <DetMovsEntregaRendir /> },
    tipoMovEntregaRendir: { label: "Tipo Movimiento Entrega a Rendir", componente: <TipoMovEntregaRendir /> },
    centroCosto: { label: "Centro de Costo", componente: <CentroCosto /> },
    categoriaCCosto: { label: "Categoría Centro de Costo", componente: <CategoriaCCosto /> },
    empresaCentroCosto: { label: "Empresa Centro de Costo", componente: <EmpresaCentroCosto /> },
    descargaFaenaPesca: { label: "Descarga Faena Temporada Pesca", componente: <DescargaFaenaPesca /> },
    detalleDescargaFaena: { label: "Detalle Descarga Faena Temporada Pesca", componente: <DetalleDescargaFaena /> },
    accionesPreviasFaena: { label: "Acciones Previas Faena", componente: <AccionesPreviasFaena /> },
    detAccionesPreviasFaena: { label: "Detalle Acciones Previas Faena Temporada Pesca", componente: <DetAccionesPreviasFaena /> },
    tipoEntidad: { label: "Tipos de Entidad", componente: <TipoEntidad /> },
    formaPago: { label: "Formas de Pago", componente: <FormaPago /> },
    agrupacionEntidad: { label: "Agrupaciones de Entidad Comercial", componente: <AgrupacionEntidad /> },
    contactoEntidad: { label: "Contactos de Entidad Comercial", componente: <ContactoEntidad /> },
    entidadComercial: { label: "Entidades Comerciales", componente: <EntidadComercial /> },
    direccionEntidad: { label: "Direcciones de Entidad Comercial", componente: <DireccionEntidad /> },
    precioEntidad: { label: "Precios Especiales Entidad Comercial", componente: <PrecioEntidad /> },
    pais: { label: "Países", componente: <Pais /> },
    departamento: { label: "Departamentos", componente: <Departamento /> },
    provincia: { label: "Provincias", componente: <Provincia /> },
    ubigeo: { label: "Ubigeos", componente: <Ubigeo /> },
    tipoVehiculo: { label: "Tipos de Vehículo", componente: <TipoVehiculo /> },
    vehiculoEntidad: { label: "Vehículos Entidad Comercial", componente: <VehiculoEntidad /> },
    lineaCreditoEntidad: { label: "Líneas Crédito Entidad Comercial", componente: <LineaCreditoEntidad /> },
    movimientoAlmacen: { label: "Movimientos de Almacén", componente: <MovimientoAlmacen /> },
    detalleMovimientoAlmacen: { label: "Detalles Movimientos de Almacén", componente: <DetalleMovimientoAlmacen /> },
    tipoConcepto: { label: "Tipos de Concepto Movimientos Almacén", componente: <TipoConcepto /> },
    conceptoMovAlmacen: { label: "Conceptos Movimientos Almacén", componente: <ConceptoMovAlmacen /> },
    tipoMovimientoAlmacen: { label: "Tipos de Movimiento Almacén", componente: <TipoMovimientoAlmacen /> },
    tipoAlmacen: { label: "Tipos de Almacén", componente: <TipoAlmacen /> },
    serieDoc: { label: "Series de Documento", componente: <SerieDoc /> },
    familiaProducto: { label: "Familias de Producto", componente: <FamiliaProducto /> },
    subfamiliaProducto: { label: "Subfamilias de Producto", componente: <SubfamiliaProducto /> },
    unidadMedida: { label: "Empaques Unidades de Medida", componente: <UnidadMedida /> },
    tipoMaterial: { label: "Tipos de Material Producto", componente: <TipoMaterial /> },
    color: { label: "Colores Producto", componente: <Color /> },
    producto: { label: "Productos y Servicios", componente: <Producto /> },
    kardexAlmacen: { label: "Kardex de Almacén", componente: <KardexAlmacen /> },
    saldosProductoCliente: { label: "Saldos de Productos-Cliente", componente: <SaldosProductoCliente /> },
    saldosDetProductoCliente: { label: "Saldos de Productos-Cliente Variables Control", componente: <SaldosDetProductoCliente /> },
    descargaFaenaConsumo: { label: "Descargas de Faena", componente: <DescargaFaenaConsumo /> },
    cotizacionVentas: { label: "Cotización de Ventas", componente: <CotizacionVentas /> },
    detCotizacionVentas: { label: "Detalle Cotización Ventas", componente: <DetCotizacionVentas /> },
    detDocsReqCotizaVentas: { label: "Documentos Requeridos Cotización Ventas", componente: <DetDocsReqCotizaVentas /> },
    detDocsReqCotizaCompras: { label: "Documentos Requeridos Cotización Compras", componente: <DetDocsReqCotizaCompras /> },
    tipoProducto: { label: "Tipos de Mercaderia", componente: <TipoProducto /> },
    tipoEstadoProducto: { label: "Estado del Producto", componente: <TipoEstadoProducto /> },
    destinoProducto: { label: "Destinos de Mercaderia", componente: <DestinoProducto /> },
    formaTransaccion: { label: "Formas de Transacción Venta", componente: <FormaTransaccion /> },
    modoDespachoRecepcion: { label: "Formas Entrega(Venta)/Recepción(Compra) de Mercaderia", componente: <ModoDespachoRecepcion /> },
    docRequeridaComprasVentas: { label: "Documentación Requerida Compras y Ventas", componente: <DocRequeridaComprasVentas /> },
    entregaARendirPVentas: { label: "Entregas a Rendir Cotización Ventas", componente: <EntregaARendirPVentas /> },
    detMovsEntregaRendirPVentas: { label: "Movimientos Entregas a Rendir Cotización Ventas", componente: <DetMovsEntregaRendirPVentas /> },
    tipoPersona: { label: "Tipos de Persona", componente: <TipoPersona /> },
    motivoAcceso: { label: "Motivos de Acceso", componente: <MotivoAcceso /> },
    tipoAccesoInstalacion: { label: "Tipos de Acceso Instalación", componente: <TipoAccesoInstalacion /> },
    detGastosComprasProd: { label: "Detalle Gastos Cotización Compras", componente: <DetGastosComprasProd /> },
    detProductoFinalCotizacionCompras: { label: "Detalle Productos Finales Cotización Compras", componente: <DetProductoFinalCotizacionCompras /> },
    entregaARendirPCompras: { label: "Entregas a Rendir Cotización Compras", componente: <EntregaARendirPCompras /> },
    detMovsEntregaRendirPCompras: { label: "Detalle Movimientos Entregas Rendir Cotización Compras", componente: <DetMovsEntregaRendirPCompras /> },
    liquidacionProcesoComprasProd: { label: "Liquidación Cotización Compras", componente: <LiquidacionProcesoComprasProd /> },
    movLiquidacionProcesoComprasProd: { label: "Movimientos Liquidación Cotización Compras", componente: <MovLiquidacionProcesoComprasProd /> },
    temporadaPesca: { label: "Temporadas de Pesca", componente: <TemporadaPesca /> },
    embarcacion: { label: "Embarcaciones", componente: <Embarcacion /> },
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
          : { key, label: label || key, content: <div style={{ padding: 32, textAlign: 'center', color: '#888' }}><i className="pi pi-cog" style={{ fontSize: 36, marginBottom: 12 }} /><h3>Módulo próximamente</h3><p>Este módulo estará disponible en una próxima versión.</p></div> }
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
      label: "Inicio",
      icon: "pi pi-home",
      command: () => abrirModulo("inicio", "Inicio")
    },
    {
      label: "Acceso Instalaciones",
      icon: "pi pi-shield",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              { label: "Movimientos Acceso", icon: "pi pi-leaf", command: () => abrirModulo("accesoInstalacion", "Movimientos Acceso Instalaciones") },
              { label: "Tipos de Movimiento", icon: "pi pi-arrow-right-arrow-left", command: () => abrirModulo("tipoMovimientoAcceso", "Tipos de Movimiento de Acceso") }
            ]
          },
          {
            label: "Configuración",
            items: [
              { label: "Tipo Equipos", icon: "pi pi-snowflake", command: () => abrirModulo("tipoEquipo", "Tipo Equipos") },
              { label: "Tipos de Persona", icon: "pi pi-users", command: () => abrirModulo("tipoPersona", "Tipos de Persona") },
              { label: "Motivos de Acceso", icon: "pi pi-question-circle", command: () => abrirModulo("motivoAcceso", "Motivos de Acceso") },
              { label: "Tipos de Acceso", icon: "pi pi-key", command: () => abrirModulo("tipoAccesoInstalacion", "Tipos de Acceso a Instalaciones") }
            ]
          }
        ]
      ]
    },
    {
      label: "Pesca",
      icon: "pi pi-anchor",
      items: [
        [
          {
            label: "Pesca",
            items: [
              { label: "Pesca Industrial", icon: "pi pi-leaf", command: () => abrirModulo("temporadaPesca", "Pesca Industrial") },
              { label: "Pesca de Consumo", icon: "pi pi-ship", command: () => abrirModulo("novedadPescaConsumo", "Pesca de Consumo") },
            ]
          }
        ],
        [
          {
            label: "Tablas Maestras Pesca",
            items: [
              { label: "Pesca Industrial", icon: "pi pi-leaf", command: () => abrirModulo("temporadaPesca", "Pesca Industrial") },
              { label: "Pesca de Consumo", icon: "pi pi-ship", command: () => abrirModulo("novedadPescaConsumo", "Pesca de Consumo") },
              { label: "Especies", icon: "pi pi-leaf", command: () => abrirModulo("especie", "Especies") },
              { label: "Acciones Previas", icon: "pi pi-archive", command: () => abrirModulo("accionesPreviasFaena", "Acciones previas Faena") },
              { label: "Embarcaciones", icon: "pi pi-snowflake", command: () => abrirModulo("embarcacion", "Embarcaciones") },
              { label: "Tipo Embarcación", icon: "pi pi-compass", command: () => abrirModulo("tipoEmbarcacion", "Tipo Embarcación") },
              { label: "Boliche de Red", icon: "pi pi-circle", command: () => abrirModulo("bolicheRed", "Boliche de Red") },
              { label: "Documentación Pesca", icon: "pi pi-file-o", command: () => abrirModulo("documentoPesca", "Documentación Pesca") },
              { label: "Documentación Embarcación", icon: "pi pi-folder", command: () => abrirModulo("documentacionEmbarcacion", "Detalle Documentación Embarcación") },
              { label: "Documentación Personal", icon: "pi pi-id-card", command: () => abrirModulo("documentacionPersonal", "Documentación Personal") },
              { label: "Puerto de Pesca", icon: "pi pi-anchor", command: () => abrirModulo("puertoPesca", "Puerto de Pesca") }
            ]
          }
        ],
      ]
    },
    {
      label: "Compras",
      icon: "pi pi-shopping-cart",
      items: [
        [
          {
            label: "Cotizaciones",
            items: [
              { label: "Cotización Compra", icon: "pi pi-leaf", command: () => abrirModulo("cotizacionCompra", "Cotización Compra") },
              { label: "Detalle Cotización", icon: "pi pi-list", command: () => abrirModulo("detCotizacionCompras", "Detalle Cotizacion Compras") },
              { label: "Documentos Requeridos", icon: "pi pi-file-o", command: () => abrirModulo("detDocsReqCotizaCompras", "Documentos Requeridos Cotización Compras") },
              { label: "Gastos Cotización", icon: "pi pi-dollar", command: () => abrirModulo("detGastosComprasProd", "Detalle Gastos Cotizacion Compras") }
            ]
          },
          {
            label: "Órdenes",
            items: [
              { label: "Requerimiento Compra", icon: "pi pi-ship", command: () => abrirModulo("requerimientoCompra", "Requerimiento Compra") },
              { label: "Detalle Requerimiento", icon: "pi pi-ship", command: () => abrirModulo("detalleReqCompra", "Detalle Requerimiento Compra") },
              { label: "Orden de Compra", icon: "pi pi-archive", command: () => abrirModulo("ordenCompra", "Orden de Compra") },
              { label: "Detalle Orden", icon: "pi pi-archive", command: () => abrirModulo("detalleOrdenCompra", "Detalle Orden Compra") }
            ]
          },
          {
            label: "Liquidaciones",
            items: [
              { label: "Liquidación Cotización", icon: "pi pi-file-check", command: () => abrirModulo("liquidacionProcesoComprasProd", "Liquidacion Cotización Compras") },
              { label: "Movimientos Liquidación", icon: "pi pi-exchange", command: () => abrirModulo("movLiquidacionProcesoComprasProd", "Movimientos Liquidación Cotización Compras") },
              { label: "Entregas a Rendir", icon: "pi pi-send", command: () => abrirModulo("entregaARendirPCompras", "Entregas a Rendir Cotizacion Compras") }
            ]
          }
        ]
      ]
    },
    {
      label: "Ventas",
      icon: "pi pi-dollar",
      items: [
        [
          {
            label: "Cotizaciones",
            items: [
              { label: "Cotización Ventas", icon: "pi pi-file-edit", command: () => abrirModulo("cotizacionVentas", "Cotización Ventas") },
              { label: "Detalle Cotización", icon: "pi pi-list", command: () => abrirModulo("detCotizacionVentas", "Detalle Cotización Ventas") },
              { label: "Documentos Requeridos", icon: "pi pi-file-check", command: () => abrirModulo("detDocsReqCotizaVentas", "Documentos Requeridos Cotización Ventas") },
              { label: "Entregas a Rendir", icon: "pi pi-send", command: () => abrirModulo("entregaARendirPVentas", "Entregas a Rendir Cotización Ventas") }
            ]
          },
          {
            label: "Facturación",
            items: [
              { label: "Pre-Factura", icon: "pi pi-ship", command: () => abrirModulo("preFactura", "Pre-Factura") },
              { label: "Detalle Pre-Factura", icon: "pi pi-ship", command: () => abrirModulo("detallePreFactura", "Detalle Pre-Factura") }
            ]
          },
          {
            label: "Configuración",
            items: [
              { label: "Formas de Transacción", icon: "pi pi-snowflake", command: () => abrirModulo("formaTransaccion", "Formas de Transacción Venta") },
              { label: "Incoterms", icon: "pi pi-snowflake", command: () => abrirModulo("incoterm", "Incoterms") },
              { label: "Modos Despacho", icon: "pi pi-truck", command: () => abrirModulo("modoDespachoRecepcion", "Forma Entrega(Venta)/Recepción(Compra) de Mercaderia") },
              { label: "Estados Mercadería", icon: "pi pi-flag", command: () => abrirModulo("tipoEstadoProducto", "Estado de la Mercaderia") },
              { label: "Tipos Mercadería", icon: "pi pi-tags", command: () => abrirModulo("tipoProducto", "Tipos de Mercaderia") },
              { label: "Destinos Mercadería", icon: "pi pi-map-marker", command: () => abrirModulo("destinoProducto", "Destinos de Mercaderia") }
            ]
          }
        ]
      ]
    },
    {
      label: "Inventarios",
      icon: "pi pi-warehouse",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              { label: "Movimientos Almacén", icon: "pi pi-arrow-right-arrow-left", command: () => abrirModulo("movimientoAlmacen", "Movimientos Almacén") },
              { label: "Detalles Movimiento", icon: "pi pi-list", command: () => abrirModulo("detalleMovimientoAlmacen", "Detalles Movimiento Almacén") },
              { label: "Conceptos Movimientos", icon: "pi pi-bookmark", command: () => abrirModulo("conceptoMovAlmacen", "Conceptos Movimientos Almacén") }
            ]
          },
          {
            label: "Reportes",
            items: [
              { label: "Kardex Almacén", icon: "pi pi-chart-line", command: () => abrirModulo("kardexAlmacen", "Kardex Almacén") },
              { label: "Saldos Productos-Cliente", icon: "pi pi-chart-bar", command: () => abrirModulo("saldosProductoCliente", "Saldos Productos-Cliente") },
              { label: "Variables Control", icon: "pi pi-table", command: () => abrirModulo("saldosDetProductoCliente", "Saldos Productos-Cliente Variables Control") }
            ]
          },
          {
            label: "Configuración",
            items: [
              { label: "Tipos de Concepto", icon: "pi pi-tags", command: () => abrirModulo("tipoConcepto", "Tipos de Concepto Movimientos Almacén") },
              { label: "Tipos de Movimiento", icon: "pi pi-sort", command: () => abrirModulo("tipoMovimientoAlmacen", "Tipos de Movimiento Almacén") },
              { label: "Tipos de Almacén", icon: "pi pi-building", command: () => abrirModulo("tipoAlmacen", "Tipos de Almacén") }
            ]
          }
        ]
      ]
    },
    {
      label: "Mantenimiento",
      icon: "pi pi-wrench",
      items: [
        [
          {
            label: "Órdenes de Trabajo",
            items: [
              { label: "Ordenes de Trabajo", icon: "pi pi-leaf", command: () => abrirModulo("oTMantenimiento", "Ordenes de Trabajo") },
              { label: "Detalle Permisos", icon: "pi pi-leaf", command: () => abrirModulo("detPermisoGestionadoOT", "Detalle Permisos Gestionados OT") },
              { label: "Detalle Tareas", icon: "pi pi-leaf", command: () => abrirModulo("detTareasOT", "Detalle Tareas OT") },
              { label: "Insumos de Tareas", icon: "pi pi-leaf", command: () => abrirModulo("detInsumosTareasOT", "Detalle Insumos de Tareas OT") }
            ]
          },
          {
            label: "Configuración",
            items: [
              { label: "Tipo de Mantenimiento", icon: "pi pi-archive", command: () => abrirModulo("tipoMantenimiento", "Tipo de Mantenimiento") },
              { label: "Motivo Origino OT", icon: "pi pi-question-circle", command: () => abrirModulo("motivoOriginoOT", "Motivo Origino OT") }
            ]
          }
        ]
      ]
    },
    {
      label: "Flujo Caja",
      icon: "pi pi-money-bill",
      items: [
        [
          {
            label: "Movimientos",
            items: [
              { label: "Movimientos de Caja", icon: "pi pi-money-bill", command: () => abrirModulo("movimientoCaja", "Movimientos de Caja") },
              { label: "Cuenta Corriente", icon: "pi pi-wallet", command: () => abrirModulo("cuentaCorriente", "Cuenta Corriente") },
              { label: "Tipos Movimiento Entregas a Rendir", icon: "pi pi-anchor", command: () => abrirModulo("tipoMovEntregaRendir", "Tipos Movimiento Entrega a Rendir") }
            ]
          },
          {
            label: "Contabilidad",
            items: [
              { label: "Asientos Contables", icon: "pi pi-book", command: () => abrirModulo("asientoContableInterfaz", "Asientos Contables Generados") },
              { label: "Centros de Costo", icon: "pi pi-anchor", command: () => abrirModulo("centroCosto", "Centros de Costo") },
              { label: "Categorías Centro Costo", icon: "pi pi-anchor", command: () => abrirModulo("categoriaCCosto", "Categorias de Centros de Costo") },
              { label: "Empresa por Centro Costo", icon: "pi pi-anchor", command: () => abrirModulo("empresaCentroCosto", "Empresa por Centro Costo") }
            ]
          },
          {
            label: "Configuración",
            items: [
              { label: "Tipo Cuenta Corriente", icon: "pi pi-list", command: () => abrirModulo("tipoCuentaCorriente", "Tipo Cuenta Corriente") },
              { label: "Tipo Referencia", icon: "pi pi-tag", command: () => abrirModulo("tipoReferenciaMovimientoCaja", "Tipo Referencia Movimiento Caja") },
              { label: "Bancos", icon: "pi pi-credit-card", command: () => abrirModulo("banco", "Bancos") }
            ]
          }
        ]
      ]
    },
    {
      label: "Usuarios",
      icon: "pi pi-users",
      items: [
        [
          {
            label: "Gestión Usuarios",
            items: [
              { label: "Usuarios del Sistema", icon: "pi pi-leaf", command: () => abrirModulo("usuarios", "Usuarios del Sistema") },
              { label: "Accesos Usuario", icon: "pi pi-key", command: () => abrirModulo("accesosUsuario", "Accesos Usuario") },
              { label: "Módulos Sistema", icon: "pi pi-snowflake", command: () => abrirModulo("modulosSistema", "Módulos Sistema") },
              { label: "Submódulos Sistema", icon: "pi pi-snowflake", command: () => abrirModulo("SubmodulosSistema", "Submódulos Sistema") }
            ]
          },
          {
            label: "Personal",
            items: [
              { label: "Personal", icon: "pi pi-ship", command: () => abrirModulo("personal", "Personal") },
              { label: "Cargos Personal", icon: "pi pi-sitemap", command: () => abrirModulo("cargosPersonal", "Cargos del Personal") },
              { label: "Tipo Contrato", icon: "pi pi-ship", command: () => abrirModulo("tipoContrato", "Tipo Contrato") },
              { label: "Aprobadores", icon: "pi pi-sitemap", command: () => abrirModulo("parametroAprobador", "Aprobadores") }
            ]
          },
          {
            label: "Documentación",
            items: [
              { label: "Tipos Documento Identidad", icon: "pi pi-ship", command: () => abrirModulo("tiposDocIdentidad", "Tipos Documento Identidad") }
            ]
          }
        ]
      ]
    },
    {
      label: "Maestros",
      icon: "pi pi-cog",
      items: [
        [
          {
            label: "Organización",
            items: [
              { label: "Empresas", icon: "pi pi-building", command: () => abrirModulo("empresas", "Empresas") },
              { label: "Sedes Empresa", icon: "pi pi-map-marker", command: () => abrirModulo("sedesEmpresa", "Sedes Empresa") },
              { label: "Areas Físicas Sede", icon: "pi pi-map", command: () => abrirModulo("areasFisicasSede", "Areas Fisicas Sede") },
              { label: "Entidad Comercial", icon: "pi pi-briefcase", command: () => abrirModulo("entidadComercial", "Entidad Comercial") },
              { label: "Tipo Entidad", icon: "pi pi-briefcase", command: () => abrirModulo("tipoEntidad", "Tipo Entidad") },
              { label: "Agrupaciones Entidad", icon: "pi pi-briefcase", command: () => abrirModulo("agrupacionEntidad", "Agrupaciones Entidad") },
              { label: "Forma Pago", icon: "pi pi-briefcase", command: () => abrirModulo("formaPago", "Forma Pago") },
              { label: "Pais", icon: "pi pi-briefcase", command: () => abrirModulo("pais", "Pais") },
              { label: "Departamento", icon: "pi pi-briefcase", command: () => abrirModulo("departamento", "Departamento") },
              { label: "Provincia", icon: "pi pi-briefcase", command: () => abrirModulo("provincia", "Provincia") },
              { label: "Ubigeo", icon: "pi pi-briefcase", command: () => abrirModulo("ubigeo", "Ubigeo") },
              { label: "Productos y Servicios", icon: "pi pi-briefcase", command: () => abrirModulo("producto", "Productos y Servicios") },
              { label: "Familia Producto", icon: "pi pi-briefcase", command: () => abrirModulo("familiaProducto", "Familia Producto") },
              { label: "Subfamilia Producto", icon: "pi pi-briefcase", command: () => abrirModulo("subfamiliaProducto", "Subfamilia Producto") },
              { label: "Tipo Almacenamiento", icon: "pi pi-briefcase", command: () => abrirModulo("tipoAlmacenamiento", "Tipo Almacenamiento") },
              { label: "Marca", icon: "pi pi-briefcase", command: () => abrirModulo("marca", "Marca") },
              { label: "Unidad Medida", icon: "pi pi-briefcase", command: () => abrirModulo("unidadMedida", "Unidad Medida") },
              { label: "Tipo Material", icon: "pi pi-briefcase", command: () => abrirModulo("tipoMaterial", "Tipo Material") },
              { label: "Color", icon: "pi pi-briefcase", command: () => abrirModulo("color", "Color") },
              { label: "Estado Multi Función", icon: "pi pi-cog", command: () => abrirModulo("estadoMultiFuncion", "Estado Multi Funcion") },
              { label: "Tipo Proviene De", icon: "pi pi-cog", command: () => abrirModulo("tipoProvieneDe", "Tipo Proviene De") },
              { label: "Monedas", icon: "pi pi-dollar", command: () => abrirModulo("monedas", "Monedas") },
              { label: "Tipo Vehiculos", icon: "pi pi-ship", command: () => abrirModulo("tipoVehiculo", "Tipo Vehiculos") }
            ]
          },
        ],
        [
          {
            label: "Activos",
            items: [
              { label: "Activos", icon: "pi pi-cog", command: () => abrirModulo("activo", "Activos") },
              { label: "Tipo Activo", icon: "pi pi-cog", command: () => abrirModulo("tipoActivo", "Tipo Activo") },
              { label: "Detalle Permiso Activo", icon: "pi pi-key", command: () => abrirModulo("detallePermisoActivo", "Detalle Permiso Activo") },
            ]
          },
          {
            label: "Permisos",
            items: [
              { label: "Permiso Autorización", icon: "pi pi-key", command: () => abrirModulo("permisoAutorizacion", "Permiso Autorizacion") },
            ]
          }
        ],
        [
          {
            label: "Financiero",
            items: [
              { label: "Bancos", icon: "pi pi-building", command: () => abrirModulo("banco", "Bancos") },
              { label: "Incoterms", icon: "pi pi-globe", command: () => abrirModulo("incoterm", "Incoterms") }
            ]
          },
          {
            label: "Cuentas",
            items: [
              { label: "Cuenta Corriente", icon: "pi pi-credit-card", command: () => abrirModulo("cuentaCorriente", "Cuenta Corriente") },
              { label: "Tipo Cuenta Corriente", icon: "pi pi-credit-card", command: () => abrirModulo("tipoCuentaCorriente", "Tipo Cuenta Corriente") },
              { label: "Tipo Referencia Movimiento Caja", icon: "pi pi-money-bill", command: () => abrirModulo("tipoReferenciaMovimientoCaja", "Tipo Referencia Movimiento Caja") }
            ]
          }
        ]
      ]
    }
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: 12, 
            padding: '8px 0',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Button 
              icon="pi pi-bars" 
              className="p-button-text p-button-lg" 
              onClick={() => setVisibleSidebar(true)} 
              style={{ 
                marginRight: 12,
                minWidth: '48px',
                minHeight: '48px'
              }} 
              aria-label="Abrir menú de módulos" 
            />
            <h3 style={{ margin: 0, color: '#495057' }}>ERP Megui - Módulos</h3>
          </div>
          
          <Sidebar 
            visible={visibleSidebar} 
            onHide={() => setVisibleSidebar(false)} 
            position="left" 
            style={{ 
              width: '85vw', 
              maxWidth: '320px',
              fontSize: '14px'
            }} 
            showCloseIcon
            modal
            dismissable
          >
            <div style={{ padding: '0 8px' }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: 16, 
                color: '#2196F3',
                borderBottom: '2px solid #2196F3',
                paddingBottom: 8
              }}>Módulos del Sistema</h3>
              
              {/* Renderizado profesional del menú jerárquico mejorado para móvil */}
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {menuItems.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    {/* Categoría principal */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: 8,
                      borderLeft: '4px solid #2196F3'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        color: '#2196F3',
                        fontSize: '15px'
                      }}>
                        <i className={item.icon} style={{ marginRight: 8, fontSize: '16px' }} />
                        {item.label}
                      </div>
                    </div>
                    
                    {/* Submenús organizados por grupos */}
                    {item.items && item.items.map((grupo, grupoIdx) => (
                      <div key={grupoIdx} style={{ marginBottom: 12 }}>
                        {grupo.map((subgrupo, subgrupoIdx) => (
                          <div key={subgrupoIdx} style={{ marginBottom: 8 }}>
                            {/* Título del subgrupo */}
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#6c757d',
                              marginBottom: 6,
                              paddingLeft: 12,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {subgrupo.label}
                            </div>
                            
                            {/* Items del subgrupo */}
                            {subgrupo.items && subgrupo.items.map((subitem, subitemIdx) => (
                              <Button
                                key={subitemIdx}
                                label={subitem.label}
                                icon={subitem.icon}
                                className="p-button-text"
                                style={{ 
                                  width: '100%', 
                                  justifyContent: 'flex-start',
                                  marginBottom: 4,
                                  paddingLeft: 20,
                                  minHeight: '44px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s ease'
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
          <i className="pi pi-folder-open" style={{ fontSize: 48, marginBottom: 16 }} />
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
