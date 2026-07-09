// src/pages/Dashboard.jsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModulo } from "../context/ModuloContext";
import { useDashboardStore } from "../shared/stores/useDashboardStore";

/**
 * Dashboard - Bento Grid con animaciones profesionales
 * Inspirado en Apple, Linear y Vercel
 */
export default function Dashboard() {
  const { abrirModulo } = useModulo();
  const { searchQuery } = useDashboardStore();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [reorderedModulos, setReorderedModulos] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // ← NUEVO: { moduloId: 'operaciones' | 'tablas' | 'maestros' }

  const containerRef = useRef(null);

  // Configuración de módulos con colores del logo Megui y sus submenús
  const modulosConfigBase = [
    {
      id: "accesoInstalaciones",
      titulo: "ACCESO INSTALACIONES",
      descripcion:
        "Control de accesos, movimientos y seguridad de instalaciones",
      icono: "pi-shield",
      modulos: 6,
      color: "#5DADE2",
      submenu: [
        {
          label: "Movimientos Acceso",
          key: "accesoInstalacion",
          icon: "pi-sign-in",
        },
        {
          label: "Tipos de Movimiento",
          key: "tipoMovimientoAcceso",
          icon: "pi-arrows-h",
        },
        { label: "Tipo Equipos", key: "tipoEquipo", icon: "pi-desktop" },
        { label: "Tipos de Persona", key: "tipoPersona", icon: "pi-users" },
        {
          label: "Motivos de Acceso",
          key: "motivoAcceso",
          icon: "pi-question-circle",
        },
        {
          label: "Tipos de Acceso",
          key: "tipoAccesoInstalacion",
          icon: "pi-key",
        },
      ],
    },
    {
      id: "pesca",
      titulo: "PESCA",
      descripcion:
        "Control de capturas, embarcaciones y documentación pesquera",
      icono: "pi-compass",
      modulos: 14,
      color: "#2874A6",
      submenu: [
        {
          label: "Pesca Industrial",
          key: "temporadaPesca",
          icon: "pi-chart-line",
          tab: "operaciones",
        },
        {
          label: "Pesca de Consumo",
          key: "novedadPescaConsumo",
          icon: "pi-shopping-bag",
          tab: "operaciones",
        },
        {
          label: "Katana Tripulación",
          key: "katanaTripulacion",
          icon: "pi-users",
          tab: "tablas",
        },
        {
          label: "Especies",
          key: "especie",
          icon: "pi-star",
          tab: "tablas",
        },
        {
          label: "Detalle Cuotas Pesca",
          key: "detCuotaPesca",
          icon: "pi-percentage",
          tab: "tablas",
        },
        {
          label: "Acciones Previas",
          key: "accionesPreviasFaena",
          icon: "pi-list",
          tab: "tablas",
        },
        {
          label: "Embarcaciones",
          key: "embarcacion",
          icon: "pi-compass",
          tab: "tablas",
        },
        {
          label: "Tipo Embarcación",
          key: "tipoEmbarcacion",
          icon: "pi-tag",
          tab: "tablas",
        },
        {
          label: "Boliche de Red",
          key: "bolicheRed",
          icon: "pi-circle",
          tab: "tablas",
        },
        {
          label: "Documentación Pesca",
          key: "documentoPesca",
          icon: "pi-file",
          tab: "tablas",
        },
        {
          label: "Documentación Embarcación",
          key: "documentacionEmbarcacion",
          icon: "pi-file-edit",
          tab: "tablas",
        },
        {
          label: "Documentación Personal",
          key: "documentacionPersonal",
          icon: "pi-id-card",
          tab: "tablas",
        },
        {
          label: "Puerto de Pesca",
          key: "puertoPesca",
          icon: "pi-map-marker",
          tab: "tablas",
        },
        {
          label: "Motivos sin Faena",
          key: "motivoSinFaena",
          icon: "pi-map",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "maestros",
        },
      ],
    },
    {
      id: "compras",
      titulo: "COMPRAS",
      descripcion: "Gestión de compras, proveedores y órdenes",
      icono: "pi-shopping-cart",
      modulos: 11,
      color: "#1E8449",
      submenu: [
        {
          label: "Requerimiento Compra",
          key: "requerimientoCompra",
          icon: "pi-file-edit",
          tab: "operaciones",
        },
        {
          label: "Orden de Compra",
          key: "ordenCompra",
          icon: "pi-shopping-cart",
          tab: "operaciones",
        },
        {
          label: "Rendición de Gastos",
          key: "rendicionGastos",
          icon: "pi-money-bill",
          tab: "operaciones",
        },
        {
          label: "Tipo Producto",
          key: "tipoProducto",
          icon: "pi-tag",
          tab: "tablas",
        },
        {
          label: "Tipo Estado Producto",
          key: "tipoEstadoProducto",
          icon: "pi-circle",
          tab: "tablas",
        },
        {
          label: "Destino Producto",
          key: "destinoProducto",
          icon: "pi-map-marker",
          tab: "tablas",
        },
        {
          label: "Forma de Pago",
          key: "formaPago",
          icon: "pi-credit-card",
          tab: "tablas",
        },
        {
          label: "Modo Despacho/Recepción",
          key: "modoDespachoRecepcion",
          icon: "pi-truck",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Producto",
          key: "producto",
          icon: "pi-box",
          tab: "maestros",
        },
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "maestros",
        },
      ],
    },
    {
      id: "ventas",
      titulo: "VENTAS",
      descripcion: "Control de ventas, cotizaciones y contratos",
      icono: "pi-dollar",
      modulos: 13,
      color: "#5DADE2",
      submenu: [
        {
          label: "Cotización Ventas",
          key: "cotizacionVentas",
          icon: "pi-file-edit",
          tab: "operaciones",
        },
        {
          label: "Pre-Factura",
          key: "preFactura",
          icon: "pi-file",
          tab: "operaciones",
        },
        {
          label: "Contratos de Servicios",
          key: "contratoServicio",
          icon: "pi-briefcase",
          tab: "operaciones",
        },
        {
          label: "Motivos para NC y ND",
          key: "motivoNotaCreditoDebito",
          icon: "pi-list",
          tab: "tablas",
        },
        {
          label: "Comprobantes Electrónicos SUNAT",
          key: "comprobanteElectronico",
          icon: "pi-send",
          tab: "tablas",
        },
        {
          label: "Incoterms",
          key: "incoterm",
          icon: "pi-globe",
          tab: "tablas",
        },
        {
          label: "Documentos Requeridos Ventas",
          key: "docRequeridaVentas",
          icon: "pi-file-check",
          tab: "tablas",
        },
        {
          label: "Requisitos Doc. por País",
          key: "requisitoDocPorPais",
          icon: "pi-flag",
          tab: "tablas",
        },
        {
          label: "Tipo Contenedor",
          key: "tipoContenedor",
          icon: "pi-box",
          tab: "tablas",
        },
        {
          label: "Formas Transacción",
          key: "formaTransaccion",
          icon: "pi-credit-card",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Producto",
          key: "producto",
          icon: "pi-box",
          tab: "maestros",
        },
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "maestros",
        },
      ],
    },
    {
      id: "inventarios",
      titulo: "INVENTARIOS",
      descripcion: "Gestión de almacenes, kardex y movimientos",
      icono: "pi-box",
      modulos: 14,
      color: "#2874A6",
      submenu: [
        {
          label: "Movimientos Almacén",
          key: "movimientoAlmacen",
          icon: "pi-arrows-h",
          tab: "operaciones",
        },
        {
          label: "Conceptos Movimientos",
          key: "conceptoMovAlmacen",
          icon: "pi-tags",
          tab: "tablas",
        },
        {
          label: "Tipos de Documento",
          key: "tipoDocumento",
          icon: "pi-file",
          tab: "tablas",
        },
        {
          label: "Tipos de Concepto",
          key: "tipoConcepto",
          icon: "pi-tag",
          tab: "tablas",
        },
        {
          label: "Tipos de Movimiento",
          key: "tipoMovimientoAlmacen",
          icon: "pi-arrows-h",
          tab: "tablas",
        },
        {
          label: "Tipos de Almacén",
          key: "tipoAlmacen",
          icon: "pi-building",
          tab: "tablas",
        },
        {
          label: "Centros de Almacén",
          key: "centrosAlmacen",
          icon: "pi-sitemap",
          tab: "tablas",
        },
        {
          label: "Almacenes",
          key: "almacen",
          icon: "pi-warehouse",
          tab: "tablas",
        },
        {
          label: "Ubicaciones Físicas",
          key: "ubicacionFisica",
          icon: "pi-map-marker",
          tab: "tablas",
        },
        {
          label: "Series de Documento",
          key: "serieDoc",
          icon: "pi-hashtag",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Producto",
          key: "producto",
          icon: "pi-box",
          tab: "maestros",
        },
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "maestros",
        },
        {
          label: "Unidades de Medida",
          key: "unidadMedida",
          icon: "pi-calculator",
          tab: "maestros",
        },
      ],
    },
    {
      id: "mantenimiento",
      titulo: "MANTENIMIENTO",
      descripcion: "Órdenes de trabajo y gestión de mantenimiento",
      icono: "pi-wrench",
      modulos: 3,
      color: "#1E8449",
      submenu: [
        {
          label: "Órdenes de Trabajo",
          key: "oTMantenimiento",
          icon: "pi-file-edit",
        },
        {
          label: "Tipo de Mantenimiento",
          key: "tipoMantenimiento",
          icon: "pi-tag",
        },
        {
          label: "Motivo Origino OT",
          key: "motivoOriginoOT",
          icon: "pi-question-circle",
        },
      ],
    },
    {
      id: "tesoreria",
      titulo: "TESORERIA",
      descripcion:
        "Control financiero, cuentas corrientes y asientos contables",
      icono: "pi-wallet",
      modulos: 24,
      color: "#5DADE2",
      submenu: [
        {
          label: "Movimientos de Caja",
          key: "movimientoCaja",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Tesorería Pendientes",
          key: "tesoreriaPendientes",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Deudas con el Personal",
          key: "deudaConPersonal",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Deudas Tributarias",
          key: "deudaTributaria",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Pagos Deuda al Personal",
          key: "pagoDeudaPersonal",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Pagos Deuda Tributaria",
          key: "pagoDeudaTributaria",
          icon: "pi-money-bill",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Retención",
          key: "retencion",
          icon: "pi-minus-circle",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Percepción",
          key: "percepcion",
          icon: "pi-plus-circle",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Flujo de Caja Proyectado",
          key: "flujo-caja-proyectado",
          icon: "pi-chart-line",
          tab: "operaciones", // ← NUEVO
        },
        {
          label: "Cuenta Corriente",
          key: "cuentaCorriente",
          icon: "pi-credit-card",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Categoría Tipo Movimiento caja",
          key: "categoriaTipoMovimientoCaja",
          icon: "pi-money-bill",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipos de Movimiento Caja",
          key: "tipoMovEntregaRendir",
          icon: "pi-send",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Centros de Costo",
          key: "centroCosto",
          icon: "pi-sitemap",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Categorías Centro Costo",
          key: "categoriaCCosto",
          icon: "pi-tags",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipo Cuenta Corriente",
          key: "tipoCuentaCorriente",
          icon: "pi-list",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipo Referencia",
          key: "tipoReferenciaMovimientoCaja",
          icon: "pi-tag",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Bancos",
          key: "banco",
          icon: "pi-credit-card",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Saldos Cuentas Corrientes",
          key: "saldoCuentaCorriente",
          icon: "pi-list",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Letra de Cambio",
          key: "letra-cambio",
          icon: "pi-file",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Endoso Letra de Cambio",
          key: "endoso-letra-cambio",
          icon: "pi-sync",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Pago Letra de Cambio",
          key: "pago-letra-cambio",
          icon: "pi-money-bill",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Ubicación de Letra",
          key: "ubicacion-letra",
          icon: "pi-map-marker",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipo Retención/Percepción",
          key: "tipo-retencion-percepcion",
          icon: "pi-percentage",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Presupuesto Anual",
          key: "presupuesto-anual",
          icon: "pi-calendar",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Ejecución Presupuestal",
          key: "ejecucion-presupuestal",
          icon: "pi-chart-bar",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Categorias Tipos Deuda con el Personal",
          key: "categoriaTipoDeudaPersonal",
          icon: "pi-folder",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipos Deuda de Personal",
          key: "tipoDeudaPersonal",
          icon: "pi-list",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Categorias Tipos Deudas Tributarias",
          key: "categoriaTipoDeudaTributaria",
          icon: "pi-folder",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipos de Deuda Tributaria",
          key: "tipoDeudaTributaria",
          icon: "pi-money-bill",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipos de Detracción",
          key: "tipoDetraccion",
          icon: "pi-percentage",
          tab: "tablas", // ← NUEVO
        },
        {
          label: "Tipos Afectación IGV",
          key: "tipoAfectacionIGV",
          icon: "pi-percentage",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros", // ← NUEVO
        },
        {
          label: "Producto",
          key: "producto",
          icon: "pi-box",
          tab: "maestros", // ← NUEVO
        },
      ],
    },
    {
      id: "finanzas",
      titulo: "FINANZAS",
      descripcion: "Tesorería Avanzada: Préstamos, Créditos e Inversiones",
      icono: "pi-wallet",
      modulos: 11,
      color: "#8E44AD",
      submenu: [
        {
          label: "Cuenta Por Cobrar",
          key: "cuentaPorCobrar",
          icon: "pi-money-bill",
          tab: "operaciones",
        },
        {
          label: "Cuenta Por Pagar",
          key: "cuentaPorPagar",
          icon: "pi-credit-card",
          tab: "operaciones",
        },
        {
          label: "Pagos Cuentas por Pagar",
          key: "pagoCuentaPorPagar",
          icon: "pi-shopping-cart",
          tab: "operaciones",
        },
        {
          label: "Pagos Cuentas Por Cobrar",
          key: "pagoCuentaPorCobrar",
          icon: "pi-shopping-cart",
          tab: "operaciones",
        },
        {
          label: "Préstamo Bancario",
          key: "prestamoBancario",
          icon: "pi-briefcase",
          tab: "operaciones",
        },
        {
          label: "Línea de Crédito",
          key: "lineaCredito",
          icon: "pi-credit-card",
          tab: "operaciones",
        },
        {
          label: "Medios de Pago",
          key: "medioPago",
          icon: "pi-wallet",
          tab: "tablas",
        },
        {
          label: "Tipos de Préstamo",
          key: "tipoPrestamo",
          icon: "pi-tags",
          tab: "tablas",
        },
        {
          label: "Inversión Financiera",
          key: "inversionFinanciera",
          icon: "pi-chart-pie",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Bancos",
          key: "banco",
          icon: "pi-credit-card",
          tab: "maestros",
        },
      ],
    },
    {
      id: "contabilidad",
      titulo: "CONTABILIDAD",
      descripcion: "Plan Contable, Asientos, Períodos y Activos Fijos",
      icono: "pi-calculator",
      modulos: 11,
      color: "#E74C3C",
      submenu: [
        {
          label: "Plan Contable",
          key: "planCuentasContable",
          icon: "pi-list",
          tab: "operaciones",
        },
        {
          label: "Asiento Contable",
          key: "asientoContable",
          icon: "pi-book",
          tab: "operaciones",
        },
        {
          label: "Movimientos Activo Fijo",
          key: "movActivoFijo",
          icon: "pi-chart-line",
          tab: "operaciones",
        },
        {
          label: "Período Contable",
          key: "periodoContable",
          icon: "pi-calendar",
          tab: "tablas",
        },
        {
          label: "Configuración Cuenta Contable",
          key: "configuracionCuentaContable",
          icon: "pi-cog",
          tab: "tablas",
        },
        {
          label: "Activos",
          key: "activo",
          icon: "pi-server",
          tab: "tablas",
        },
        {
          label: "Tipos de Activo",
          key: "tipoActivo",
          icon: "pi-tag",
          tab: "tablas",
        },
        {
          label: "Tipos de Movimiento Activo Fijo",
          key: "tipoMovActivo",
          icon: "pi-arrows-h",
          tab: "tablas",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-building",
          tab: "maestros",
        },
        {
          label: "Producto",
          key: "producto",
          icon: "pi-box",
          tab: "maestros",
        },
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "maestros",
        },
      ],
    },
    {
      id: "maestros",
      titulo: "MAESTROS",
      descripcion: "Configuración de empresas, personal, productos y entidades",
      icono: "pi-database",
      modulos: 31,
      color: "#2874A6",
      submenu: [
        {
          label: "Personal",
          key: "personal",
          icon: "pi-users",
          tab: "principales",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-briefcase",
          tab: "principales",
        },
        {
          label: "Productos y Servicios",
          key: "producto",
          icon: "pi-box",
          tab: "principales",
        },
        {
          label: "Estado Multi Función",
          key: "estadoMultiFuncion",
          icon: "pi-circle",
          tab: "principales",
        },
        {
          label: "Empresas",
          key: "empresas",
          icon: "pi-building",
          tab: "configuracion",
        },
        {
          label: "Sedes Empresa",
          key: "sedesEmpresa",
          icon: "pi-map-marker",
          tab: "configuracion",
        },
        {
          label: "Áreas Físicas Sede",
          key: "areasFisicasSede",
          icon: "pi-th-large",
          tab: "configuracion",
        },
        {
          label: "Cargos Personal",
          key: "cargosPersonal",
          icon: "pi-briefcase",
          tab: "configuracion",
        },
        {
          label: "Tipo Contrato",
          key: "tipoContrato",
          icon: "pi-file",
          tab: "configuracion",
        },
        {
          label: "Aprobadores",
          key: "parametroAprobador",
          icon: "pi-check-circle",
          tab: "configuracion",
        },
        {
          label: "Tipos Documento Identidad",
          key: "tiposDocIdentidad",
          icon: "pi-id-card",
          tab: "configuracion",
        },
        {
          label: "Tipo Entidad",
          key: "tipoEntidad",
          icon: "pi-tag",
          tab: "configuracion",
        },
        {
          label: "Agrupaciones Entidad",
          key: "agrupacionEntidad",
          icon: "pi-sitemap",
          tab: "configuracion",
        },
        {
          label: "Familia Producto",
          key: "familiaProducto",
          icon: "pi-tags",
          tab: "configuracion",
        },
        {
          label: "Subfamilia Producto",
          key: "subfamiliaProducto",
          icon: "pi-tag",
          tab: "configuracion",
        },
        {
          label: "Tipo Almacenamiento",
          key: "tipoAlmacenamiento",
          icon: "pi-warehouse",
          tab: "configuracion",
        },
        {
          label: "Marca",
          key: "marca",
          icon: "pi-bookmark",
          tab: "configuracion",
        },
        {
          label: "Unidad Medida",
          key: "unidadMedida",
          icon: "pi-chart-bar",
          tab: "configuracion",
        },
        {
          label: "Tipo Material",
          key: "tipoMaterial",
          icon: "pi-box",
          tab: "configuracion",
        },
        {
          label: "Color",
          key: "color",
          icon: "pi-palette",
          tab: "configuracion",
        },
        {
          label: "Tipo Vehículos",
          key: "tipoVehiculo",
          icon: "pi-car",
          tab: "configuracion",
        },
        {
          label: "País",
          key: "pais",
          icon: "pi-globe",
          tab: "configuracion",
        },
        {
          label: "Departamento",
          key: "departamento",
          icon: "pi-map",
          tab: "configuracion",
        },
        {
          label: "Provincia",
          key: "provincia",
          icon: "pi-map-marker",
          tab: "configuracion",
        },
        {
          label: "Ubigeo",
          key: "ubigeo",
          icon: "pi-map",
          tab: "configuracion",
        },
        {
          label: "Detalle Permiso Activo",
          key: "detallePermisoActivo",
          icon: "pi-lock",
          tab: "configuracion",
        },
        {
          label: "Permiso Autorización",
          key: "permisoAutorizacion",
          icon: "pi-shield",
          tab: "configuracion",
        },
        {
          label: "Tipo Proviene De",
          key: "tipoProvieneDe",
          icon: "pi-arrow-right",
          tab: "configuracion",
        },
        {
          label: "Monedas",
          key: "monedas",
          icon: "pi-dollar",
          tab: "configuracion",
        },
        {
          label: "Tipo Documento",
          key: "tipoDocumento",
          icon: "pi-file",
          tab: "configuracion",
        },
        {
          label: "Serie Documento",
          key: "serieDoc",
          icon: "pi-hashtag",
          tab: "configuracion",
        },
      ],
    },
    {
      id: "administracion",
      titulo: "ADMINISTRACIÓN",
      descripcion: "Gestión de usuarios, accesos y configuración del sistema",
      icono: "pi-users",
      modulos: 5,
      color: "#8B5CF6",
      submenu: [
        {
          label: "Usuarios del Sistema",
          key: "usuarios",
          icon: "pi-user",
        },
        {
          label: "Accesos Usuario",
          key: "accesosUsuario",
          icon: "pi-lock",
        },
        {
          label: "Módulos Sistema",
          key: "modulosSistema",
          icon: "pi-th-large",
        },
        {
          label: "Submódulos Sistema",
          key: "SubmodulosSistema",
          icon: "pi-sitemap",
        },
        {
          label: "Unidades de Negocio",
          key: "unidadesNegocio",
          icon: "pi-briefcase",
        },
      ],
    },
  ];

  // Filtrar módulos por búsqueda
  const filteredModulos = (reorderedModulos || modulosConfigBase).filter(
    (modulo) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();

      // Buscar en título, descripción y submódulos
      const matchTitle = modulo.titulo.toLowerCase().includes(query);
      const matchDescription = modulo.descripcion.toLowerCase().includes(query);
      const matchSubmenu = modulo.submenu?.some((item) =>
        item.label.toLowerCase().includes(query),
      );

      return matchTitle || matchDescription || matchSubmenu;
    },
  );

  // Usar módulos filtrados
  const modulosConfig = filteredModulos;

  // Animación del mesh gradient
  const meshVariants = {
    animate: {
      background: [
        "radial-gradient(circle at 20% 50%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 132, 73, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 80% 20%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(40, 116, 166, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 50% 50%, rgba(30, 132, 73, 0.1) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(93, 173, 226, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 20% 50%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 132, 73, 0.1) 0%, transparent 50%)",
      ],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const handleCardClick = (moduloId) => {
    if (expandedCard === moduloId) {
      // Si ya está expandido, cerrar y restaurar orden original
      setExpandedCard(null);
      setReorderedModulos(null);
    } else {
      // Reordenar: mover el módulo seleccionado al inicio
      const selectedIndex = modulosConfigBase.findIndex(
        (m) => m.id === moduloId,
      );
      const selectedModule = modulosConfigBase[selectedIndex];
      const otherModules = modulosConfigBase.filter((m) => m.id !== moduloId);

      // Crear nuevo array con el módulo seleccionado al inicio
      const newOrder = [selectedModule, ...otherModules];
      setReorderedModulos(newOrder);

      // Scroll hacia arriba
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 50);

      // Expandir después del reordenamiento
      setTimeout(() => {
        setExpandedCard(moduloId);
      }, 300);
    }
  };

  const handleSubmenuClick = (key, label) => {
    abrirModulo(key, label);
    setExpandedCard(null);
    setReorderedModulos(null);
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "#0a0e1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Mesh gradient animado de fondo */}
      <motion.div
        variants={meshVariants}
        animate="animate"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />

      {/* Grid pattern sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(93, 173, 226, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 173, 226, 0.03) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          zIndex: 0,
        }}
      />

      {/* Contenido principal */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1800px",
          margin: "0 auto",
          marginTop: "1rem",
          padding: "60px 40px",
        }}
      >
        {/* Mensaje de resultados */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              marginBottom: "24px",
              color: "#94a3b8",
              fontSize: "0.95rem",
            }}
          >
            {filteredModulos.length > 0 ? (
              <span>
                Se encontraron{" "}
                <strong style={{ color: "#5DADE2" }}>
                  {filteredModulos.length}
                </strong>{" "}
                módulos
              </span>
            ) : (
              <span style={{ color: "#ef4444" }}>
                No se encontraron resultados para "{searchQuery}"
              </span>
            )}
          </motion.div>
        )}

        {/* Bento Grid - Responsive: Desktop (6 cols), Laptop (4 cols), Tablet HD (3 cols) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "12px",
            gridAutoRows: "minmax(180px, auto)",
          }}
          className="dashboard-grid"
        >
          <style>{`
            /* Desktop y Laptop: 6 columnas (≥1280px) */
            @media (min-width: 1280px) {
              .dashboard-grid {
                grid-template-columns: repeat(6, 1fr) !important;
                gap: 10px !important;
              }
              .dashboard-grid .card-content h3 {
                font-size: 0.75rem !important;
              }
              .dashboard-grid .card-content p {
                font-size: 0.65rem !important;
              }
              .dashboard-grid .card-content .modulo-count {
                font-size: 0.65rem !important;
              }
            }
            
            /* Tablet HD: 3 columnas (768px - 1279px) */
            @media (min-width: 768px) and (max-width: 1279px) {
              .dashboard-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
            }
          `}</style>
          <AnimatePresence mode="popLayout">
            {modulosConfig.map((modulo, index) => (
              <motion.div
                key={modulo.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  layout: {
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
                style={{
                  gridColumn:
                    expandedCard === modulo.id
                      ? "1 / -1"
                      : modulo.size === "large"
                        ? "span 2"
                        : modulo.size === "small"
                          ? "span 1"
                          : "span 1",
                  position: "relative",
                  zIndex: expandedCard === modulo.id ? 10 : 1,
                }}
              >
                {/* Card principal */}
                <motion.div
                  layout
                  onMouseEnter={() =>
                    !expandedCard && setHoveredCard(modulo.id)
                  }
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(modulo.id)}
                  whileHover={!expandedCard ? { y: -8, scale: 1.02 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    background:
                      hoveredCard === modulo.id || expandedCard === modulo.id
                        ? "rgba(15, 23, 42, 0.8)"
                        : "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${hoveredCard === modulo.id || expandedCard === modulo.id
                      ? modulo.color
                      : "rgba(51, 65, 85, 0.5)"
                      }`,
                    borderRadius: "12px",
                    padding: "10px",
                    minHeight: expandedCard === modulo.id ? "auto" : "180px",
                    maxHeight: expandedCard === modulo.id ? "none" : "180px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    boxShadow:
                      hoveredCard === modulo.id || expandedCard === modulo.id
                        ? `0 20px 40px ${modulo.color}40, 0 0 0 1px ${modulo.color}30`
                        : "0 4px 20px rgba(0, 0, 0, 0.3)",
                    cursor: "pointer",
                  }}
                >
                  {/* Glow effect en hover */}
                  <AnimatePresence>
                    {(hoveredCard === modulo.id ||
                      expandedCard === modulo.id) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: "absolute",
                            inset: "-2px",
                            background: `radial-gradient(circle at 50% 0%, ${modulo.color}30, transparent 70%)`,
                            borderRadius: "24px",
                            zIndex: 0,
                            pointerEvents: "none",
                          }}
                        />
                      )}
                  </AnimatePresence>

                  {/* Header de la card */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    {/* Icono */}
                    <motion.div
                      animate={
                        hoveredCard === modulo.id && !expandedCard
                          ? {
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1],
                          }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: `linear-gradient(135deg, ${modulo.color}30, ${modulo.color}10)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${modulo.color}40`,
                      }}
                    >
                      <i
                        className={`pi ${modulo.icono}`}
                        style={{
                          fontSize: "18px",
                          color: modulo.color,
                        }}
                      />
                    </motion.div>

                    <div style={{ flex: 1 }} className="card-content">
                      {/* Título */}
                      <h3
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          color: "#ffffff",
                          marginBottom: "3px",
                          letterSpacing: "-0.01em",
                          lineHeight: "1.2",
                        }}
                      >
                        {modulo.titulo}
                      </h3>

                      {/* Descripción */}
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "#94a3b8",
                          lineHeight: "1.3",
                          marginBottom: "6px",
                        }}
                      >
                        {modulo.descripcion}
                      </p>

                      {/* Contador de módulos */}
                      <div
                        className="modulo-count"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.7rem",
                          color: "#64748b",
                        }}
                      >
                        <i className="pi pi-box" style={{ fontSize: "11px" }} />
                        <span>{modulo.modulos} módulos</span>
                        <motion.i
                          className={`pi ${expandedCard === modulo.id
                            ? "pi-chevron-up"
                            : "pi-chevron-down"
                            }`}
                          style={{
                            fontSize: "12px",
                            marginLeft: "auto",
                            color: modulo.color,
                          }}
                          animate={{
                            rotate: expandedCard === modulo.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submenú expandible */}
                  <AnimatePresence>
                    {expandedCard === modulo.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        style={{
                          position: "relative",
                          zIndex: 1,
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: `1px solid ${modulo.color}30`,
                        }}
                      >
                        {/* ✅ TABS: Solo para módulos que tienen propiedad 'tab' en submenu */}
                        {modulo.submenu.some(item => item.tab) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "16px",
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                              paddingBottom: "8px",
                            }}
                          >
                            {["operaciones", "tablas", "maestros", "principales", "configuracion"].map((tab) => {
                              const hasItems = modulo.submenu.some(item => item.tab === tab);
                              if (!hasItems) return null;

                              const defaultTab = modulo.id === "maestros" ? "principales" : "operaciones";
                              const isActive = (activeTab[modulo.id] || defaultTab) === tab;
                              const tabLabels = {
                                operaciones: "Operaciones Principales",
                                tablas: "Tablas Relacionadas",
                                maestros: "Maestros",
                                principales: "Maestros Principales",
                                configuracion: "Configuración y Tablas"
                              };

                              return (
                                <button
                                  key={tab}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab(prev => ({ ...prev, [modulo.id]: tab }));
                                  }}
                                  style={{
                                    padding: "6px 16px",
                                    background: isActive ? modulo.color : "rgba(15, 23, 42, 0.4)",
                                    border: `1px solid ${isActive ? modulo.color : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: "6px",
                                    color: isActive ? "#0f172a" : "#cbd5e1",
                                    fontSize: "0.75rem",
                                    fontWeight: isActive ? "600" : "400",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  {tabLabels[tab]}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "8px",
                          }}
                        >
                          {modulo.submenu
                            .filter(item => {
                              // Si el módulo tiene tabs, filtrar por tab activo
                              if (modulo.submenu.some(i => i.tab)) {
                                const defaultTab = modulo.id === "maestros" ? "principales" : "operaciones";
                                const currentTab = activeTab[modulo.id] || defaultTab;
                                return item.tab === currentTab;
                              }
                              // Si no tiene tabs, mostrar todos
                              return true;
                            })
                            .map((item, idx) => (
                              <motion.button
                                key={item.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.03 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmenuClick(item.key, item.label);
                                }}
                                whileHover={{
                                  x: 4,
                                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                                }}
                                style={{
                                  padding: "8px 12px",
                                  background: "rgba(15, 23, 42, 0.4)",
                                  border: `1px solid ${modulo.color}20`,
                                  borderRadius: "8px",
                                  color: "#cbd5e1",
                                  fontSize: "0.75rem",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <i
                                  className={`pi ${item.icon}`}
                                  style={{
                                    color: modulo.color,
                                    fontSize: "14px",
                                  }}
                                />
                                <span>{item.label}</span>
                              </motion.button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Stats footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            marginTop: "60px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #5DADE2, #1E8449)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              128
            </div>
            <div
              style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}
            >
              Módulos CRUD
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #2874A6, #5DADE2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              8
            </div>
            <div
              style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}
            >
              Procesos Principales
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #1E8449, #2874A6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              100%
            </div>
            <div
              style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "4px" }}
            >
              Operativo
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
