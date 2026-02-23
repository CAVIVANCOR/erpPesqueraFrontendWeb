// src/config/modulosConfig.js
// 🎯 FUENTE ÚNICA DE VERDAD - Configuración centralizada de módulos
// Todos los dashboards leen de aquí para evitar duplicación

/**
 * CONFIGURACIÓN POR UNIDADES DE NEGOCIO
 * Usada por: DashboardUnidad.jsx, DashboardUnidades.jsx
 */
export const modulosPorUnidad = {
  1: {
    nombre: "PESCA INDUSTRIAL",
    icono: "🚢",
    color: "#1E40AF",
    descripcion: "Temporadas, faenas, descargas y cuotas de pesca industrial",
    procesosPrincipales: [
      {
        id: "temporadaPesca",
        titulo: "Temporadas de Pesca",
        descripcion: "Gestión de temporadas y cuotas",
        icono: "pi-calendar",
        color: "#1E40AF",
        tablas: [
          {
            id: "detCuotaPesca",
            titulo: "Detalle Cuotas Pesca",
            icono: "pi-percentage",
          },
        ],
      },
      {
        id: "oTMantenimiento",
        titulo: "Órdenes de Trabajo",
        descripcion: "Mantenimiento",
        icono: "pi-wrench",
        color: "#DC2626",
        tablas: [],
      },
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
          { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
          {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de exportación",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [],
      },
    ],
  },
  2: {
    nombre: "PESCA CONSUMO",
    icono: "🐟",
    color: "#059669",
    descripcion: "Novedades, faenas y descargas de pesca de consumo humano",
    procesosPrincipales: [
      {
        id: "novedadPescaConsumo",
        titulo: "Novedades Pesca Consumo",
        descripcion: "Registro de novedades",
        icono: "pi-file-edit",
        color: "#059669",
        tablas: [
          {
            id: "katanaTripulacion",
            titulo: "Katana Tripulación",
            icono: "pi-users",
          },
        ],
      },
      {
        id: "oTMantenimiento",
        titulo: "Órdenes de Trabajo",
        descripcion: "Mantenimiento",
        icono: "pi-wrench",
        color: "#DC2626",
        tablas: [],
      },
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
          { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
          {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de exportación",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [],
      },
    ],
  },
  3: {
    nombre: "CONSERVAS DE PESCADO",
    icono: "🥫",
    color: "#DC2626",
    descripcion: "Producción y comercialización de conservas hidrobiológicas",
    procesosPrincipales: [
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
          { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [

        ],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
           {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "cotizacionVentas",
        titulo: "Cotización Ventas",
        descripcion: "Cotizaciones de exportación",
        icono: "pi-dollar",
        color: "#8E44AD",
        tablas: [
          
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de exportación",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [
          
        ],
      },
    ],
  },
  4: {
    nombre: "CONGELADOS HIDROBIOLÓGICOS",
    icono: "❄️",
    color: "#0891B2",
    descripcion: "Procesamiento y almacenamiento de productos congelados",
    procesosPrincipales: [
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
           { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [
         
        ],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
          {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "cotizacionVentas",
        titulo: "Cotización Ventas",
        descripcion: "Cotizaciones de exportación",
        icono: "pi-dollar",
        color: "#8E44AD",
        tablas: [
          
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de exportación",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [
          
        ],
      },
    ],
  },
  5: {
    nombre: "AGROINDUSTRIAS",
    icono: "🌾",
    color: "#65A30D",
    descripcion: "Producción y comercialización de productos agroindustriales",
    procesosPrincipales: [
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
          { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [
         
        ],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
          {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "cotizacionVentas",
        titulo: "Cotización Ventas",
        descripcion: "Cotizaciones de exportación",
        icono: "pi-dollar",
        color: "#8E44AD",
        tablas: [
          
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de exportación",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [
          
        ],
      },
    ],
  },
  6: {
    nombre: "SERVICIOS",
    icono: "🏭",
    color: "#7C3AED",
    descripcion: "Servicios de almacenamiento y logística para terceros",
    procesosPrincipales: [
      {
        id: "contratoServicio",
        titulo: "Contratos de Servicios",
        descripcion: "Gestión de contratos",
        icono: "pi-file-check",
        color: "#E67E22",
        tablas: [
          { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          {
            id: "tipoContrato",
            titulo: "Tipo Contrato",
            icono: "pi-file-edit",
          },
        ],
      },
      {
        id: "preFactura",
        titulo: "Pre-Facturas",
        descripcion: "Pre-facturas de servicios",
        icono: "pi-file",
        color: "#5DADE2",
        tablas: [
         
        ],
      },
      {
        id: "movimientoAlmacen",
        titulo: "Movimientos de Almacén",
        descripcion: "Control de inventarios",
        icono: "pi-box",
        color: "#2874A6",
        tablas: [
          {
            id: "conceptoMovAlmacen",
            titulo: "Conceptos Movimientos",
            icono: "pi-tags",
          },
          {
            id: "tipoAlmacen",
            titulo: "Tipos de Almacén",
            icono: "pi-building",
          },
          {
            id: "centrosAlmacen",
            titulo: "Centros de Almacén",
            icono: "pi-sitemap",
          },
          { id: "almacen", titulo: "Almacenes", icono: "pi-warehouse" },
          {
            id: "ubicacionFisica",
            titulo: "Ubicaciones Físicas",
            icono: "pi-map-marker",
          },
          {
            id: "unidadMedida",
            titulo: "Unidad Medida",
            icono: "pi-chart-bar",
          },
        ],
      },
      {
        id: "oTMantenimiento",
        titulo: "Órdenes de Trabajo",
        descripcion: "Mantenimiento",
        icono: "pi-wrench",
        color: "#DC2626",
        tablas: [

        ],
      },
      {
        id: "requerimientoCompra",
        titulo: "Requerimientos de Compra",
        descripcion: "Solicitudes de compra",
        icono: "pi-file-edit",
        color: "#1E8449",
        tablas: [
         { id: "producto", titulo: "Producto", icono: "pi-box" },
          {
            id: "entidadComercial",
            titulo: "Entidades Comerciales",
            icono: "pi-building",
          },
          { id: "formaPago", titulo: "Forma de Pago", icono: "pi-credit-card" },
        ],
      },
      {
        id: "ordenCompra",
        titulo: "Órdenes de Compra",
        descripcion: "Órdenes aprobadas",
        icono: "pi-shopping-cart",
        color: "#1E8449",
        tablas: [
        ],
      },
    ],
  },
};

/**
 * LISTA DE UNIDADES (para selector)
 * Usada por: DashboardUnidades.jsx
 */
export const unidadesNegocio = [
  {
    id: 1,
    nombre: "PESCA INDUSTRIAL",
    icono: "🚢",
    color: "#1E40AF",
    descripcion: "Temporadas, faenas, descargas y cuotas de pesca industrial",
  },
  {
    id: 2,
    nombre: "PESCA CONSUMO",
    icono: "🐟",
    color: "#059669",
    descripcion: "Novedades, faenas y descargas de pesca de consumo humano",
  },
  {
    id: 3,
    nombre: "CONSERVAS DE PESCADO",
    icono: "🥫",
    color: "#DC2626",
    descripcion: "Producción y comercialización de conservas hidrobiológicas",
  },
  {
    id: 4,
    nombre: "CONGELADOS HIDROBIOLÓGICOS",
    icono: "❄️",
    color: "#0891B2",
    descripcion: "Procesamiento y almacenamiento de productos congelados",
  },
  {
    id: 5,
    nombre: "AGROINDUSTRIAS",
    icono: "🌾",
    color: "#65A30D",
    descripcion: "Producción y comercialización de productos agroindustriales",
  },
  {
    id: 6,
    nombre: "SERVICIOS DE ALMACENES",
    icono: "🏭",
    color: "#7C3AED",
    descripcion: "Servicios de almacenamiento y logística para terceros",
  },
];

/**
 * Función auxiliar: Calcular total de módulos por unidad
 */
export const calcularModulosPorUnidad = (unidadId) => {
  const unidad = modulosPorUnidad[unidadId];
  if (!unidad) return 0;

  const totalProcesos = unidad.procesosPrincipales?.length || 0;
  const totalTablas =
    unidad.procesosPrincipales?.reduce(
      (acc, proceso) => acc + (proceso.tablas?.length || 0),
      0,
    ) || 0;

  return totalProcesos + totalTablas;
};
