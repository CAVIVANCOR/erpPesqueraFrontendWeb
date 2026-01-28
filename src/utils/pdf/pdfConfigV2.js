/**
 * pdfConfigV2.js - Configuración centralizada del sistema PDF V2
 * C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\utils\pdf\pdfConfigV2.js
 * AGREGAR NUEVO MÓDULO: Copiar un elemento existente y ajustar valores
 * Tiempo: 30 segundos
 */

export const PDF_MODULES_CONFIG = {
  "temporada-pesca": {
    uploadPath: "uploads/pdf-system/temporada-pesca",
    oldPaths: [],
    apiEndpoint: "/pdf/temporada-pesca",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "TemporadaPesca",
      field: "urlResolucionPdf",
    },
  },

  "novedad-pesca-consumo": {
    uploadPath: "uploads/pdf-system/novedad-pesca-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/novedad-pesca-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "NovedadPescaConsumo",
      field: "urlResolucionPdf",
    },
  },

  "tesoreria-prestamos-principal": {
    uploadPath: "uploads/pdf-system/tesoreria-prestamos-principal",
    oldPaths: [],
    apiEndpoint: "/pdf/tesoreria-prestamos-principal",
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "PrestamoBancario",
      field: "urlDocumentoPrincipal",
    },
  },

  "tesoreria-prestamos-adicional": {
    uploadPath: "uploads/pdf-system/tesoreria-prestamos-adicional",
    oldPaths: [],
    apiEndpoint: "/pdf/tesoreria-prestamos-adicional",
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "PrestamoBancario",
      field: "urlDocumentoAdicional",
    },
  },

  "requerimiento-compra": {
    uploadPath: "uploads/pdf-system/requerimientos",
    oldPaths: [],
    apiEndpoint: "/pdf/requerimiento-compra",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "RequerimientoCompra",
      field: "urlReqCompraPdf",
    },
  },

  "orden-compra": {
    uploadPath: "uploads/pdf-system/ordenes-compra",
    oldPaths: [],
    apiEndpoint: "/pdf/orden-compra",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "OrdenCompra",
      field: "urlOrdenCompraPdf",
    },
  },

  "cotizacion-ventas": {
    uploadPath: "uploads/pdf-system/cotizaciones-ventas",
    oldPaths: [],
    apiEndpoint: "/pdf/cotizacion-ventas",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "CotizacionVentas",
      field: "urlCotizacionPdf",
    },
  },

  "pre-factura": {
    uploadPath: "uploads/pdf-system/pre-facturas",
    oldPaths: [],
    apiEndpoint: "/pdf/pre-factura",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "PreFactura",
      field: "urlPreFacturaPdf",
    },
  },

  "movimiento-almacen": {
    uploadPath: "uploads/pdf-system/movimientos-almacen",
    oldPaths: [],
    apiEndpoint: "/pdf/movimiento-almacen",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "MovimientoAlmacen",
      field: "urlMovimientoAlmacenPdf",
    },
  },

  "documentacion-personal": {
    uploadPath: "uploads/pdf-system/documentacion-personal",
    oldPaths: [],
    apiEndpoint: "/pdf/documentacion-personal",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DocumentacionPersonal",
      field: "urlDocPdf",
    },
  },

  "documentacion-embarcacion": {
    uploadPath: "uploads/pdf-system/documentacion-embarcacion",
    oldPaths: [],
    apiEndpoint: "/pdf/documentacion-embarcacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DocumentacionEmbarcacion",
      field: "urlDocPdf",
    },
  },

  "detalle-doc-embarcacion": {
    uploadPath: "uploads/pdf-system/detalle-doc-embarcacion",
    oldPaths: [],
    apiEndpoint: "/pdf/detalle-doc-embarcacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetalleDocEmbarcacion",
      field: "urlDocPdf",
    },
  },

  "detalle-doc-tripulantes": {
    uploadPath: "uploads/pdf-system/detalle-doc-tripulantes",
    oldPaths: [],
    apiEndpoint: "/pdf/detalle-doc-tripulantes",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetalleDocTripulantes",
      field: "urlDocPdf",
    },
  },

  "detalle-doc-tripulantes-consumo": {
    uploadPath: "uploads/pdf-system/detalle-doc-tripulantes-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/detalle-doc-tripulantes-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetDocTripulantesFaenaConsumo",
      field: "urlDocPdf",
    },
  },

  "detalle-doc-embarcacion-consumo": {
    uploadPath: "uploads/pdf-system/detalle-doc-embarcacion-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/detalle-doc-embarcacion-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetalleDocEmbarcacionConsumo",
      field: "urlDocPdf",
    },
  },

  "confirmacion-accion-previa": {
    uploadPath: "uploads/pdf-system/confirmacion-accion-previa",
    oldPaths: [],
    apiEndpoint: "/pdf/confirmacion-accion-previa",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetAccionesPreviasFaena",
      field: "urlConfirmaAccionPdf",
    },
  },

  "confirmacion-accion-previa-consumo": {
    uploadPath: "uploads/pdf-system/confirmacion-accion-previa-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/confirmacion-accion-previa-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetAccionesPreviasFaenaConsumo",
      field: "urlConfirmaAccionPdf",
    },
  },

  "datos-adicionales": {
    uploadPath: "uploads/pdf-system/datos-adicionales",
    oldPaths: [],
    apiEndpoint: "/pdf/datos-adicionales",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DatosAdicionales",
      field: "urlDocPdf",
    },
  },

  "documento-requerido": {
    uploadPath: "uploads/pdf-system/documento-requerido",
    oldPaths: [],
    apiEndpoint: "/pdf/documento-requerido",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DocumentoRequerido",
      field: "urlDocPdf",
    },
  },

  "contrato-servicio": {
    uploadPath: "uploads/pdf-system/contrato-servicio",
    oldPaths: [],
    apiEndpoint: "/pdf/contrato-servicio",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "ContratoServicio",
      field: "urlContratoPdf",
    },
  },

  "det-mov-entregar-rendir": {
    uploadPath: "uploads/pdf-system/det-mov-entregar-rendir",
    oldPaths: [],
    apiEndpoint: "/pdf/det-mov-entregar-rendir",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendir",
      field: "urlComprobantePdf",
    },
  },

  "comprobante-operacion-contrato": {
    uploadPath: "uploads/pdf-system/comprobante-operacion-contrato",
    oldPaths: [],
    apiEndpoint: "/pdf/comprobante-operacion-contrato",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendir",
      field: "urlComprobanteOperacionPdf",
    },
  },

  "comprobante-operacion-compras": {
    uploadPath: "uploads/pdf-system/comprobante-operacion-compras",
    oldPaths: [],
    apiEndpoint: "/pdf/comprobante-operacion-compras",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsCompras",
      field: "urlComprobanteOperacionPdf",
    },
  },

  "ot-mantenimiento-comprobante": {
    uploadPath: "uploads/pdf-system/ot-mantenimiento-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/ot-mantenimiento-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirOTMantenimiento",
      field: "urlComprobanteMovimiento",
    },
  },

  "ot-mantenimiento-operacion": {
    uploadPath: "uploads/pdf-system/ot-mantenimiento-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/ot-mantenimiento-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirOTMantenimiento",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

  "ot-mantenimiento-fotos-antes": {
    uploadPath: "uploads/pdf-system/ot-mantenimiento-fotos-antes",
    oldPaths: [],
    apiEndpoint: "/pdf/ot-mantenimiento-fotos-antes",
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "OTMantenimiento",
      field: "urlFotosAntesPdf",
    },
  },

  "ot-mantenimiento-fotos-despues": {
    uploadPath: "uploads/pdf-system/ot-mantenimiento-fotos-despues",
    oldPaths: [],
    apiEndpoint: "/pdf/ot-mantenimiento-fotos-despues",
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "OTMantenimiento",
      field: "urlFotosDespuesPdf",
    },
  },

  "ot-mantenimiento-documento": {
    uploadPath: "uploads/pdf-system/ot-mantenimiento-documento",
    oldPaths: [],
    apiEndpoint: "/pdf/ot-mantenimiento-documento",
    maxFileSize: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf"],
    maxFiles: 1,
    database: {
      table: "OTMantenimiento",
      field: "urlOrdenTrabajoPdf",
    },
  },

  "cotizacion-ventas-movimiento": {
    uploadPath: "uploads/pdf-system/cotizacion-ventas-movimiento",
    oldPaths: [],
    apiEndpoint: "/pdf/cotizacion-ventas-movimiento",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirVentas",
      field: "urlComprobanteMovimiento",
    },
  },

  "contrato-servicio-movimiento": {
    uploadPath: "uploads/pdf-system/contrato-servicio-movimiento",
    oldPaths: [],
    apiEndpoint: "/pdf/contrato-servicio-movimiento",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirContrato",
      field: "urlComprobanteMovimiento",
    },
  },

  "datos-adicionales-oc": {
    uploadPath: "uploads/pdf-system/datos-adicionales-oc",
    oldPaths: [],
    apiEndpoint: "/pdf/datos-adicionales-oc",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetDatosAdicionalesOrdenCompra",
      field: "urlDocumento",
    },
  },

  "boliche-red": {
    uploadPath: "uploads/pdf-system/boliche-red",
    oldPaths: [],
    apiEndpoint: "/pdf/boliche-red",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "BolicheRed",
      field: "urlBolicheRedPdf",
    },
  },

  producto: {
    uploadPath: "uploads/pdf-system/productos",
    oldPaths: [],
    apiEndpoint: "/pdf/producto",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "Producto",
      field: "urlFichaTecnica",
    },
  },

  "acceso-instalacion": {
    uploadPath: "uploads/pdf-system/acceso-instalacion",
    oldPaths: [],
    apiEndpoint: "/pdf/acceso-instalacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "AccesoInstalacion",
      field: "urlDocumentoVisitante",
    },
  },

  "novedad-pesca-consumo": {
    uploadPath: "uploads/pdf-system/novedad-pesca-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/novedad-pesca-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirNovedad",
      field: "urlComprobanteMovimiento",
    },
  },

  "det-tareas-ot-fotos": {
    uploadPath: "uploads/pdf-system/det-tareas-ot-fotos",
    oldPaths: [],
    apiEndpoint: "/pdf/det-tareas-ot-fotos",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetTareasOT",
      field: "urlFotosAntesPdf",
    },
  },

  "det-tareas-ot-cotizacion-uno": {
    uploadPath: "uploads/pdf-system/det-tareas-ot-cotizacion-uno",
    oldPaths: [],
    apiEndpoint: "/pdf/det-tareas-ot-cotizacion-uno",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetTareasOT",
      field: "urlCotizacionUnoPdf",
    },
  },

  "det-tareas-ot-cotizacion-dos": {
    uploadPath: "uploads/pdf-system/det-tareas-ot-cotizacion-dos",
    oldPaths: [],
    apiEndpoint: "/pdf/det-tareas-ot-cotizacion-dos",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetTareasOT",
      field: "urlCotizacionDosPdf",
    },
  },
  "confirmaciones-acciones-previas": {
    uploadPath: "uploads/pdf-system/confirmaciones-acciones-previas",
    oldPaths: [],
    apiEndpoint: "/pdf/confirmaciones-acciones-previas",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetAccionesPreviasFaena",
      field: "urlConfirmaAccionPdf",
    },
  },

  "confirmaciones-acciones-previas-consumo": {
    uploadPath: "uploads/pdf-system/confirmaciones-acciones-previas-consumo",
    oldPaths: [],
    apiEndpoint: "/pdf/confirmaciones-acciones-previas-consumo",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetAccionesPreviasFaenaConsumo",
      field: "urlConfirmaAccionPdf",
    },
  },
  "det-movs-entrega-rendir-pesca-industrial-comprobante": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-pesca-industrial-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-pesca-industrial-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendir",
      field: "urlComprobanteMovimiento",
    },
  },

  "det-movs-entrega-rendir-pesca-industrial-operacion": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-pesca-industrial-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-pesca-industrial-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendir",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

  "det-movs-entrega-rendir-reqcompras-comprobante": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-reqcompras-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-reqcompras-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirCompras",
      field: "urlComprobanteMovimiento",
    },
  },

  "det-movs-entrega-rendir-reqcompras-operacion": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-reqcompras-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-reqcompras-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirCompras",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

  "cotizacion-ventas-movimiento-comprobante": {
    uploadPath: "uploads/pdf-system/cotizacion-ventas-movimiento-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/cotizacion-ventas-movimiento-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirVentas",
      field: "urlComprobanteMovimiento",
    },
  },

  "cotizacion-ventas-movimiento-operacion": {
    uploadPath: "uploads/pdf-system/cotizacion-ventas-movimiento-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/cotizacion-ventas-movimiento-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirVentas",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

  "det-movs-entrega-rendir-pesca-consumo-comprobante": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-pesca-consumo-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-pesca-consumo-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntRendirPescaConsumo",
      field: "urlComprobanteMovimiento",
    },
  },

  "det-movs-entrega-rendir-pesca-consumo-operacion": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-pesca-consumo-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-pesca-consumo-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntRendirPescaConsumo",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

    "faena-pesca-reporte-calas": {
    uploadPath: "uploads/pdf-system/faena-pesca-reporte-calas",
    oldPaths: [],
    apiEndpoint: "/pdf/faena-pesca-reporte-calas",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "FaenaPesca",
      field: "urlReporteFaenaCalas",
    },
  },

  "faena-pesca-declaracion-desembarque": {
    uploadPath: "uploads/pdf-system/faena-pesca-declaracion-desembarque",
    oldPaths: [],
    apiEndpoint: "/pdf/faena-pesca-declaracion-desembarque",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "FaenaPesca",
      field: "urlDeclaracionDesembarqueArmador",
    },
  },
    "det-movs-entrega-rendir-mov-almacen-comprobante": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-mov-almacen-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-mov-almacen-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirMovAlmacen",
      field: "urlComprobanteMovimiento",
    },
  },

  "det-movs-entrega-rendir-mov-almacen-operacion": {
    uploadPath: "uploads/pdf-system/det-movs-entrega-rendir-mov-almacen-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/det-movs-entrega-rendir-mov-almacen-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "DetMovsEntregaRendirMovAlmacen",
      field: "urlComprobanteOperacionMovCaja",
    },
  },

  "movimiento-caja-comprobante": {
    uploadPath: "uploads/pdf-system/movimiento-caja-comprobante",
    oldPaths: [],
    apiEndpoint: "/pdf/movimiento-caja-comprobante",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "MovimientoCaja",
      field: "urlDocumentoMovCaja",  // ✅ CORREGIDO
    },
  },

  "movimiento-caja-operacion": {
    uploadPath: "uploads/pdf-system/movimiento-caja-operacion",
    oldPaths: [],
    apiEndpoint: "/pdf/movimiento-caja-operacion",
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 20,
    database: {
      table: "MovimientoCaja",
      field: "urlComprobanteOperacionMovCaja",  // ✅ CORREGIDO
    },
  },
  
};

export function getModuleConfig(moduleName) {
  const config = PDF_MODULES_CONFIG[moduleName];

  if (!config) {
    throw new Error(`Configuración no encontrada para módulo: ${moduleName}`);
  }

  return config;
}

export function getAllModuleNames() {
  return Object.keys(PDF_MODULES_CONFIG);
}

export function validateModuleName(moduleName) {
  return moduleName && PDF_MODULES_CONFIG.hasOwnProperty(moduleName);
}
