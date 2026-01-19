// src/components/layout/AppHeader/menuConfig.js
// Configuración del Mega Menu reorganizado profesionalmente

export const getMenuConfig = (abrirModulo) => ({
  // ============================================
  // 1. ACCESO INSTALACIONES (Dropdown simple)
  // ============================================
  accesoInstalaciones: {
    id: "accesoInstalaciones",
    label: "ACCESO INSTALACIONES",
    icon: "pi pi-shield",
    type: "dropdown",
    items: [
      {
        label: "Movimientos Acceso",
        icon: "pi pi-sign-in",
        action: () => abrirModulo("accesoInstalacion", "Movimientos Acceso Instalaciones")
      },
      {
        label: "Tipos de Movimiento",
        icon: "pi pi-arrows-h",
        action: () => abrirModulo("tipoMovimientoAcceso", "Tipos de Movimiento de Acceso")
      },
      {
        label: "Tipo Equipos",
        icon: "pi pi-desktop",
        action: () => abrirModulo("tipoEquipo", "Tipo Equipos")
      },
      {
        label: "Tipos de Persona",
        icon: "pi pi-users",
        action: () => abrirModulo("tipoPersona", "Tipos de Persona")
      },
      {
        label: "Motivos de Acceso",
        icon: "pi pi-question-circle",
        action: () => abrirModulo("motivoAcceso", "Motivos de Acceso")
      },
      {
        label: "Tipos de Acceso",
        icon: "pi pi-key",
        action: () => abrirModulo("tipoAccesoInstalacion", "Tipos de Acceso a Instalaciones")
      }
    ]
  },

  // ============================================
  // 2. PROCESOS (Mega Menu con 6 columnas)
  // ============================================
  procesos: {
    id: "procesos",
    label: "PROCESOS",
    icon: "pi pi-sync",
    type: "megamenu",
    columns: [
      // COLUMNA 1: PESCA
      {
        id: "pesca",
        title: "🐟 PESCA",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Pesca Industrial",
                icon: "pi pi-compass",
                action: () => abrirModulo("temporadaPesca", "Pesca Industrial")
              },
              {
                label: "Pesca de Consumo",
                icon: "pi pi-shopping-bag",
                action: () => abrirModulo("novedadPescaConsumo", "Pesca de Consumo")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Katana Tripulación",
                icon: "pi pi-users",
                action: () => abrirModulo("katanaTripulacion", "Katana Tripulación")
              },
              {
                label: "Especies",
                icon: "pi pi-star",
                action: () => abrirModulo("especie", "Especies")
              },
              {
                label: "Detalle Cuotas Pesca",
                icon: "pi pi-percentage",
                action: () => abrirModulo("detCuotaPesca", "Detalle Cuotas Pesca")
              },
              {
                label: "Acciones Previas",
                icon: "pi pi-list-check",
                action: () => abrirModulo("accionesPreviasFaena", "Acciones previas Faena")
              },
              {
                label: "Embarcaciones",
                icon: "pi pi-directions",
                action: () => abrirModulo("embarcacion", "Embarcaciones")
              },
              {
                label: "Tipo Embarcación",
                icon: "pi pi-tags",
                action: () => abrirModulo("tipoEmbarcacion", "Tipo Embarcación")
              },
              {
                label: "Boliche de Red",
                icon: "pi pi-circle",
                action: () => abrirModulo("bolicheRed", "Boliche de Red")
              },
              {
                label: "Documentación Pesca",
                icon: "pi pi-file-pdf",
                action: () => abrirModulo("documentoPesca", "Documentación Pesca")
              },
              {
                label: "Documentación Embarcación",
                icon: "pi pi-folder-open",
                action: () => abrirModulo("documentacionEmbarcacion", "Detalle Documentación Embarcación")
              },
              {
                label: "Documentación Personal",
                icon: "pi pi-id-card",
                action: () => abrirModulo("documentacionPersonal", "Documentación Personal")
              },
              {
                label: "Puerto de Pesca",
                icon: "pi pi-map-marker",
                action: () => abrirModulo("puertoPesca", "Puerto de Pesca")
              }
            ]
          }
        ]
      },

      // COLUMNA 2: COMPRAS
      {
        id: "compras",
        title: "🛒 COMPRAS",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Requerimiento Compra",
                icon: "pi pi-file-edit",
                action: () => abrirModulo("requerimientoCompra", "Requerimiento Compra")
              },
              {
                label: "Orden de Compra",
                icon: "pi pi-shopping-cart",
                action: () => abrirModulo("ordenCompra", "Orden de Compra")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Tipo Producto",
                icon: "pi pi-box",
                action: () => abrirModulo("tipoProducto", "Tipo Producto")
              },
              {
                label: "Tipo Estado Producto",
                icon: "pi pi-flag",
                action: () => abrirModulo("tipoEstadoProducto", "Tipo Estado Producto")
              },
              {
                label: "Destino Producto",
                icon: "pi pi-send",
                action: () => abrirModulo("destinoProducto", "Destino Producto")
              },
              {
                label: "Forma de Pago",
                icon: "pi pi-credit-card",
                action: () => abrirModulo("formaPago", "Forma de Pago")
              },
              {
                label: "Modo Despacho/Recepción",
                icon: "pi pi-truck",
                action: () => abrirModulo("modoDespachoRecepcion", "Modo Despacho/Recepción")
              }
            ]
          }
        ]
      },

      // COLUMNA 3: VENTAS
      {
        id: "ventas",
        title: "💰 VENTAS",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Cotización Ventas",
                icon: "pi pi-file-edit",
                action: () => abrirModulo("cotizacionVentas", "Cotización Ventas")
              },
              {
                label: "Pre-Factura",
                icon: "pi pi-file-pdf",
                action: () => abrirModulo("preFactura", "Pre-Factura")
              },
              {
                label: "Comprobantes Electrónicos SUNAT",
                icon: "pi pi-send",
                action: () => abrirModulo("comprobanteElectronico", "Comprobantes Electrónicos SUNAT")
              },
              {
                label: "Contratos de Servicios",
                icon: "pi pi-file-contract",
                action: () => abrirModulo("contratoServicio", "Contratos de Servicios")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Incoterms",
                icon: "pi pi-globe",
                action: () => abrirModulo("incoterm", "Incoterms")
              },
              {
                label: "Documentos Requeridos Ventas",
                icon: "pi pi-file-check",
                action: () => abrirModulo("docRequeridaVentas", "Documentos Requeridos Ventas")
              },
              {
                label: "Requisitos Doc. por País",
                icon: "pi pi-map",
                action: () => abrirModulo("requisitoDocPorPais", "Requisitos Documentales por País")
              },
              {
                label: "Tipo Contenedor",
                icon: "pi pi-box",
                action: () => abrirModulo("tipoContenedor", "Tipo Contenedor")
              },
              {
                label: "Formas Transacción",
                icon: "pi pi-sync",
                action: () => abrirModulo("formaTransaccion", "Formas Transacción")
              }
            ]
          }
        ]
      },

      // COLUMNA 4: INVENTARIOS
      {
        id: "inventarios",
        title: "🏭 INVENTARIOS",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Movimientos Almacén",
                icon: "pi pi-arrows-h",
                action: () => abrirModulo("movimientoAlmacen", "Movimientos Almacén")
              },
              {
                label: "Kardex Almacén",
                icon: "pi pi-chart-line",
                action: () => abrirModulo("kardexAlmacen", "Kardex Almacén")
              },
              {
                label: "Saldos Productos-Cliente",
                icon: "pi pi-chart-bar",
                action: () => abrirModulo("saldosProductoCliente", "Saldos Productos-Cliente")
              },
              {
                label: "Saldos Productos-Cliente Variables",
                icon: "pi pi-table",
                action: () => abrirModulo("saldosDetProductoCliente", "Saldos Productos-Cliente Variables Control Stock")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Conceptos Movimientos",
                icon: "pi pi-bookmark",
                action: () => abrirModulo("conceptoMovAlmacen", "Conceptos Movimientos Almacén")
              },
              {
                label: "Tipos de Documento",
                icon: "pi pi-file",
                action: () => abrirModulo("tipoDocumento", "Tipos de Documento")
              },
              {
                label: "Tipos de Concepto",
                icon: "pi pi-tags",
                action: () => abrirModulo("tipoConcepto", "Tipos de Concepto Movimientos Almacén")
              },
              {
                label: "Tipos de Movimiento",
                icon: "pi pi-sort-alt",
                action: () => abrirModulo("tipoMovimientoAlmacen", "Tipos de Movimiento Almacén")
              },
              {
                label: "Tipos de Almacén",
                icon: "pi pi-building",
                action: () => abrirModulo("tipoAlmacen", "Tipos de Almacén")
              },
              {
                label: "Centros de Almacén",
                icon: "pi pi-sitemap",
                action: () => abrirModulo("centrosAlmacen", "Centros de Almacén")
              },
              {
                label: "Almacenes",
                icon: "pi pi-warehouse",
                action: () => abrirModulo("almacen", "Almacenes")
              },
              {
                label: "Series de Documento",
                icon: "pi pi-hashtag",
                action: () => abrirModulo("serieDoc", "Series de Documento")
              }
            ]
          }
        ]
      },

      // COLUMNA 5: MANTENIMIENTO
      {
        id: "mantenimiento",
        title: "🔧 MANTENIMIENTO",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Órdenes de Trabajo",
                icon: "pi pi-wrench",
                action: () => abrirModulo("oTMantenimiento", "Órdenes de Trabajo")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Tipo de Mantenimiento",
                icon: "pi pi-cog",
                action: () => abrirModulo("tipoMantenimiento", "Tipo de Mantenimiento")
              },
              {
                label: "Motivo Origino OT",
                icon: "pi pi-exclamation-circle",
                action: () => abrirModulo("motivoOriginoOT", "Motivo Origino OT")
              }
            ]
          }
        ]
      },

      // COLUMNA 6: FLUJO DE CAJA
      {
        id: "flujoCaja",
        title: "💵 FLUJO DE CAJA",
        sections: [
          {
            title: "Procesos",
            items: [
              {
                label: "Movimientos de Caja",
                icon: "pi pi-money-bill",
                action: () => abrirModulo("movimientoCaja", "Movimientos de Caja")
              }
            ]
          },
          {
            title: "📋 Tablas",
            items: [
              {
                label: "Cuenta Corriente",
                icon: "pi pi-wallet",
                action: () => abrirModulo("cuentaCorriente", "Cuenta Corriente")
              },
              {
                label: "Saldos Cuenta Corriente",
                icon: "pi pi-chart-line",
                action: () => abrirModulo("saldoCuentaCorriente", "Saldos Cuenta Corriente")
              },
              {
                label: "Configuración Cuenta Contable",
                icon: "pi pi-cog",
                action: () => abrirModulo("configuracionCuentaContable", "Configuración Cuenta Contable")
              },
              {
                label: "Tipos Movimiento Entregas a Rendir",
                icon: "pi pi-send",
                action: () => abrirModulo("tipoMovEntregaRendir", "Tipos Movimiento Entrega a Rendir")
              },
              {
                label: "Asientos Contables",
                icon: "pi pi-book",
                action: () => abrirModulo("asientoContableInterfaz", "Asientos Contables Generados")
              },
              {
                label: "Centros de Costo",
                icon: "pi pi-sitemap",
                action: () => abrirModulo("centroCosto", "Centros de Costo")
              },
              {
                label: "Categorías Centro Costo",
                icon: "pi pi-tags",
                action: () => abrirModulo("categoriaCCosto", "Categorías de Centros de Costo")
              },
              {
                label: "Empresa por Centro Costo",
                icon: "pi pi-building",
                action: () => abrirModulo("empresaCentroCosto", "Empresa por Centro Costo")
              },
              {
                label: "Tipo Cuenta Corriente",
                icon: "pi pi-list",
                action: () => abrirModulo("tipoCuentaCorriente", "Tipo Cuenta Corriente")
              },
              {
                label: "Tipo Referencia",
                icon: "pi pi-tag",
                action: () => abrirModulo("tipoReferenciaMovimientoCaja", "Tipo Referencia Movimiento Caja")
              },
              {
                label: "Bancos",
                icon: "pi pi-credit-card",
                action: () => abrirModulo("banco", "Bancos")
              }
            ]
          }
        ]
      }
    ]
  },

  // ============================================
  // 3. FINANZAS (Dropdown simple)
  // ============================================
  finanzas: {
    id: "finanzas",
    label: "FINANZAS",
    icon: "pi pi-wallet",
    type: "dropdown",
    items: [
      {
        label: "Cuenta Por Cobrar",
        icon: "pi pi-money-bill",
        action: () => abrirModulo("cuentaPorCobrar", "Cuenta Por Cobrar")
      },
      {
        label: "Cuenta Por Pagar",
        icon: "pi pi-credit-card",
        action: () => abrirModulo("cuentaPorPagar", "Cuenta Por Pagar")
      },
      {
        label: "Pagos",
        icon: "pi pi-dollar",
        action: () => abrirModulo("pago", "Pagos")
      },
      {
        label: "Tipos de Préstamo",
        icon: "pi pi-tags",
        action: () => abrirModulo("tipoPrestamo", "Tipos de Préstamo")
      },
      {
        label: "Préstamo Bancario",
        icon: "pi pi-briefcase",
        action: () => abrirModulo("prestamoBancario", "Préstamo Bancario")
      },
      {
        label: "Línea de Crédito",
        icon: "pi pi-credit-card",
        action: () => abrirModulo("lineaCredito", "Línea de Crédito")
      },
      {
        label: "Inversión Financiera",
        icon: "pi pi-chart-pie",
        action: () => abrirModulo("inversionFinanciera", "Inversión Financiera")
      },
      {
        label: "Reporte Líneas Disponibles",
        icon: "pi pi-chart-bar",
        action: () => abrirModulo("reporteLineasDisponibles", "Reporte Líneas Disponibles")
      }
    ]
  },

  // ============================================
  // 4. CONTABILIDAD (Dropdown simple)
  // ============================================
  contabilidad: {
    id: "contabilidad",
    label: "CONTABILIDAD",
    icon: "pi pi-calculator",
    type: "dropdown",
    items: [
      {
        label: "Plan Contable",
        icon: "pi pi-list",
        action: () => abrirModulo("planCuentasContable", "Plan Contable")
      },
      {
        label: "Período Contable",
        icon: "pi pi-calendar",
        action: () => abrirModulo("periodoContable", "Período Contable")
      },
      {
        label: "Asiento Contable",
        icon: "pi pi-book",
        action: () => abrirModulo("asientoContable", "Asiento Contable")
      },
      {
        label: "Tipo Afectación IGV",
        icon: "pi pi-percentage",
        action: () => abrirModulo("tipoAfectacionIGV", "Tipo Afectación IGV")
      },
      {
        label: "Flujo de Caja Financiero",
        icon: "pi pi-chart-line",
        action: () => abrirModulo("flujoCaja", "Flujo de Caja Financiero")
      },
      {
        label: "Conciliación Bancaria",
        icon: "pi pi-check-square",
        action: () => abrirModulo("conciliacionBancaria", "Conciliación Bancaria")
      },
      {
        label: "Letras de Cambio",
        icon: "pi pi-file-edit",
        action: () => abrirModulo("letraCambio", "Letras de Cambio")
      },
      {
        label: "Retenciones",
        icon: "pi pi-minus-circle",
        action: () => abrirModulo("retencion", "Retenciones")
      },
      {
        label: "Percepciones",
        icon: "pi pi-plus-circle",
        action: () => abrirModulo("percepcion", "Percepciones")
      },
      {
        label: "Presupuestos",
        icon: "pi pi-chart-bar",
        action: () => abrirModulo("presupuesto", "Presupuestos")
      }
    ]
  },

  // ============================================
  // 5. MAESTROS (Mega Menu con 7 columnas)
  // ============================================
  maestros: {
    id: "maestros",
    label: "MAESTROS",
    icon: "pi pi-database",
    type: "megamenu",
    columns: [
      // COLUMNA 1: CONFIGURACIÓN EMPRESARIAL
      {
        id: "empresarial",
        title: "🏢 Configuración Empresarial",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Empresas",
                icon: "pi pi-building",
                action: () => abrirModulo("empresas", "Empresas")
              },
              {
                label: "Sedes Empresa",
                icon: "pi pi-map-marker",
                action: () => abrirModulo("sedesEmpresa", "Sedes Empresa")
              },
              {
                label: "Áreas Físicas Sede",
                icon: "pi pi-map",
                action: () => abrirModulo("areasFisicasSede", "Áreas Físicas Sede")
              }
            ]
          }
        ]
      },

      // COLUMNA 2: PERSONAL Y RRHH
      {
        id: "personal",
        title: "👤 Personal y RRHH",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Personal",
                icon: "pi pi-id-card",
                action: () => abrirModulo("personal", "Personal")
              },
              {
                label: "Cargos Personal",
                icon: "pi pi-briefcase",
                action: () => abrirModulo("cargosPersonal", "Cargos del Personal")
              },
              {
                label: "Tipo Contrato",
                icon: "pi pi-file-edit",
                action: () => abrirModulo("tipoContrato", "Tipo Contrato")
              },
              {
                label: "Aprobadores",
                icon: "pi pi-check-circle",
                action: () => abrirModulo("parametroAprobador", "Aprobadores")
              },
              {
                label: "Tipos Documento Identidad",
                icon: "pi pi-id-card",
                action: () => abrirModulo("tiposDocIdentidad", "Tipos Documento Identidad")
              }
            ]
          }
        ]
      },

      // COLUMNA 3: ENTIDADES COMERCIALES
      {
        id: "entidades",
        title: "🤝 Entidades Comerciales",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Entidad Comercial",
                icon: "pi pi-briefcase",
                action: () => abrirModulo("entidadComercial", "Entidad Comercial")
              },
              {
                label: "Tipo Entidad",
                icon: "pi pi-tags",
                action: () => abrirModulo("tipoEntidad", "Tipo Entidad")
              },
              {
                label: "Agrupaciones Entidad",
                icon: "pi pi-users",
                action: () => abrirModulo("agrupacionEntidad", "Agrupaciones Entidad")
              }
            ]
          }
        ]
      },

      // COLUMNA 4: PRODUCTOS Y SERVICIOS
      {
        id: "productos",
        title: "📦 Productos y Servicios",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Productos y Servicios",
                icon: "pi pi-box",
                action: () => abrirModulo("producto", "Productos y Servicios")
              },
              {
                label: "Familia Producto",
                icon: "pi pi-sitemap",
                action: () => abrirModulo("familiaProducto", "Familia Producto")
              },
              {
                label: "Subfamilia Producto",
                icon: "pi pi-list",
                action: () => abrirModulo("subfamiliaProducto", "Subfamilia Producto")
              },
              {
                label: "Tipo Almacenamiento",
                icon: "pi pi-database",
                action: () => abrirModulo("tipoAlmacenamiento", "Tipo Almacenamiento")
              },
              {
                label: "Marca",
                icon: "pi pi-tag",
                action: () => abrirModulo("marca", "Marca")
              },
              {
                label: "Unidad Medida",
                icon: "pi pi-calculator",
                action: () => abrirModulo("unidadMedida", "Unidad Medida")
              },
              {
                label: "Tipo Material",
                icon: "pi pi-box",
                action: () => abrirModulo("tipoMaterial", "Tipo Material")
              },
              {
                label: "Color",
                icon: "pi pi-palette",
                action: () => abrirModulo("color", "Color")
              }
            ]
          }
        ]
      },

      // COLUMNA 5: UBICACIÓN GEOGRÁFICA
      {
        id: "ubicacion",
        title: "🌎 Ubicación Geográfica",
        sections: [
          {
            title: "",
            items: [
              {
                label: "País",
                icon: "pi pi-globe",
                action: () => abrirModulo("pais", "País")
              },
              {
                label: "Departamento",
                icon: "pi pi-map",
                action: () => abrirModulo("departamento", "Departamento")
              },
              {
                label: "Provincia",
                icon: "pi pi-map-marker",
                action: () => abrirModulo("provincia", "Provincia")
              },
              {
                label: "Ubigeo",
                icon: "pi pi-compass",
                action: () => abrirModulo("ubigeo", "Ubigeo")
              }
            ]
          }
        ]
      },

      // COLUMNA 6: ACTIVOS
      {
        id: "activos",
        title: "🏭 Activos",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Activos",
                icon: "pi pi-cog",
                action: () => abrirModulo("activo", "Activos")
              },
              {
                label: "Tipo Activo",
                icon: "pi pi-tags",
                action: () => abrirModulo("tipoActivo", "Tipo Activo")
              },
              {
                label: "Detalle Permiso Activo",
                icon: "pi pi-lock-open",
                action: () => abrirModulo("detallePermisoActivo", "Detalle Permiso Activo")
              },
              {
                label: "Permiso Autorización",
                icon: "pi pi-key",
                action: () => abrirModulo("permisoAutorizacion", "Permiso Autorización")
              }
            ]
          }
        ]
      },

      // COLUMNA 7: OTROS CATÁLOGOS
      {
        id: "catalogos",
        title: "⚙️ Otros Catálogos",
        sections: [
          {
            title: "",
            items: [
              {
                label: "Estado Multi Función",
                icon: "pi pi-flag",
                action: () => abrirModulo("estadoMultiFuncion", "Estado Multi Función")
              },
              {
                label: "Tipo Proviene De",
                icon: "pi pi-arrow-circle-left",
                action: () => abrirModulo("tipoProvieneDe", "Tipo Proviene De")
              },
              {
                label: "Monedas",
                icon: "pi pi-dollar",
                action: () => abrirModulo("monedas", "Monedas")
              },
              {
                label: "Tipo Vehículos",
                icon: "pi pi-car",
                action: () => abrirModulo("tipoVehiculo", "Tipo Vehículos")
              }
            ]
          }
        ]
      }
    ]
  },

  // ============================================
  // 6. USUARIOS (Dropdown simple)
  // ============================================
  usuarios: {
    id: "usuarios",
    label: "USUARIOS",
    icon: "pi pi-users",
    type: "dropdown",
    items: [
      {
        label: "Usuarios del Sistema",
        icon: "pi pi-user",
        action: () => abrirModulo("usuarios", "Usuarios del Sistema")
      },
      {
        label: "Accesos Usuario",
        icon: "pi pi-lock",
        action: () => abrirModulo("accesosUsuario", "Accesos Usuario")
      },
      {
        label: "Módulos Sistema",
        icon: "pi pi-th-large",
        action: () => abrirModulo("modulosSistema", "Módulos Sistema")
      },
      {
        label: "Submódulos Sistema",
        icon: "pi pi-sitemap",
        action: () => abrirModulo("SubmodulosSistema", "Submódulos Sistema")
      }
    ]
  }
});