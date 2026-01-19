// src/pages/Dashboard.jsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModulo } from "../context/ModuloContext";

/**
 * Dashboard - Bento Grid con animaciones profesionales
 * Inspirado en Apple, Linear y Vercel
 */
export default function Dashboard() {
  const { abrirModulo } = useModulo();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [reorderedModulos, setReorderedModulos] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      size: "medium",
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
      modulos: 13,
      color: "#2874A6",
      size: "large",
      submenu: [
        {
          label: "Pesca Industrial",
          key: "temporadaPesca",
          icon: "pi-chart-line",
        },
        {
          label: "Pesca de Consumo",
          key: "novedadPescaConsumo",
          icon: "pi-shopping-bag",
        },
        {
          label: "Katana Tripulación",
          key: "katanaTripulacion",
          icon: "pi-users",
        },
        { label: "Especies", key: "especie", icon: "pi-star" },
        {
          label: "Detalle Cuotas Pesca",
          key: "detCuotaPesca",
          icon: "pi-percentage",
        },
        {
          label: "Acciones Previas",
          key: "accionesPreviasFaena",
          icon: "pi-list",
        },
        { label: "Embarcaciones", key: "embarcacion", icon: "pi-compass" },
        { label: "Tipo Embarcación", key: "tipoEmbarcacion", icon: "pi-tag" },
        { label: "Boliche de Red", key: "bolicheRed", icon: "pi-circle" },
        {
          label: "Documentación Pesca",
          key: "documentoPesca",
          icon: "pi-file",
        },
        {
          label: "Documentación Embarcación",
          key: "documentacionEmbarcacion",
          icon: "pi-file-edit",
        },
        {
          label: "Documentación Personal",
          key: "documentacionPersonal",
          icon: "pi-id-card",
        },
        { label: "Puerto de Pesca", key: "puertoPesca", icon: "pi-map-marker" },
      ],
    },
    {
      id: "compras",
      titulo: "COMPRAS",
      descripcion: "Gestión de compras, proveedores y órdenes",
      icono: "pi-shopping-cart",
      modulos: 7,
      color: "#1E8449",
      size: "large",
      submenu: [
        {
          label: "Requerimiento Compra",
          key: "requerimientoCompra",
          icon: "pi-file-edit",
        },
        {
          label: "Orden de Compra",
          key: "ordenCompra",
          icon: "pi-shopping-cart",
        },
        { label: "Tipo Producto", key: "tipoProducto", icon: "pi-tag" },
        {
          label: "Tipo Estado Producto",
          key: "tipoEstadoProducto",
          icon: "pi-circle",
        },
        {
          label: "Destino Producto",
          key: "destinoProducto",
          icon: "pi-map-marker",
        },
        { label: "Forma de Pago", key: "formaPago", icon: "pi-credit-card" },
        {
          label: "Modo Despacho/Recepción",
          key: "modoDespachoRecepcion",
          icon: "pi-truck",
        },
      ],
    },
    {
      id: "ventas",
      titulo: "VENTAS",
      descripcion: "Control de ventas, cotizaciones y contratos",
      icono: "pi-dollar",
      modulos: 8,
      color: "#5DADE2",
      size: "large",
      submenu: [
        {
          label: "Cotización Ventas",
          key: "cotizacionVentas",
          icon: "pi-file-edit",
        },
        { label: "Pre-Factura", key: "preFactura", icon: "pi-file" },
        {
          label: "Comprobantes Electrónicos SUNAT",
          key: "comprobanteElectronico",
          icon: "pi-send",
        },
        {
          label: "Contratos de Servicios",
          key: "contratoServicio",
          icon: "pi-briefcase",
        },
        { label: "Incoterms", key: "incoterm", icon: "pi-globe" },
        {
          label: "Documentos Requeridos Ventas",
          key: "docRequeridaVentas",
          icon: "pi-file-check",
        },
        {
          label: "Requisitos Doc. por País",
          key: "requisitoDocPorPais",
          icon: "pi-flag",
        },
        { label: "Tipo Contenedor", key: "tipoContenedor", icon: "pi-box" },
        {
          label: "Formas Transacción",
          key: "formaTransaccion",
          icon: "pi-credit-card",
        },
      ],
    },
    {
      id: "inventarios",
      titulo: "INVENTARIOS",
      descripcion: "Gestión de almacenes, kardex y movimientos",
      icono: "pi-box",
      modulos: 12,
      color: "#2874A6",
      size: "medium",
      submenu: [
        {
          label: "Movimientos Almacén",
          key: "movimientoAlmacen",
          icon: "pi-arrows-h",
        },
        {
          label: "Kardex Almacén",
          key: "kardexAlmacen",
          icon: "pi-chart-line",
        },
        {
          label: "Saldos Productos-Cliente",
          key: "saldosProductoCliente",
          icon: "pi-chart-bar",
        },
        {
          label: "Saldos Productos-Cliente Variables",
          key: "saldosDetProductoCliente",
          icon: "pi-list",
        },
        {
          label: "Conceptos Movimientos",
          key: "conceptoMovAlmacen",
          icon: "pi-tags",
        },
        { label: "Tipos de Documento", key: "tipoDocumento", icon: "pi-file" },
        { label: "Tipos de Concepto", key: "tipoConcepto", icon: "pi-tag" },
        {
          label: "Tipos de Movimiento",
          key: "tipoMovimientoAlmacen",
          icon: "pi-arrows-h",
        },
        { label: "Tipos de Almacén", key: "tipoAlmacen", icon: "pi-building" },
        {
          label: "Centros de Almacén",
          key: "centrosAlmacen",
          icon: "pi-sitemap",
        },
        { label: "Almacenes", key: "almacen", icon: "pi-warehouse" },
        { label: "Series de Documento", key: "serieDoc", icon: "pi-hashtag" },
      ],
    },
    {
      id: "mantenimiento",
      titulo: "MANTENIMIENTO",
      descripcion: "Órdenes de trabajo y gestión de mantenimiento",
      icono: "pi-wrench",
      modulos: 3,
      color: "#1E8449",
      size: "small",
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
      id: "flujoCaja",
      titulo: "FLUJO DE CAJA",
      descripcion:
        "Control financiero, cuentas corrientes y asientos contables",
      icono: "pi-wallet",
      modulos: 12,
      color: "#5DADE2",
      size: "medium",
      submenu: [
        {
          label: "Movimientos de Caja",
          key: "movimientoCaja",
          icon: "pi-money-bill",
        },
        {
          label: "Cuenta Corriente",
          key: "cuentaCorriente",
          icon: "pi-credit-card",
        },
        {
          label: "Saldo Cuenta Corriente",
          key: "saldoCuentaCorriente",
          icon: "pi-chart-line",
        },
        {
          label: "Configuración Cuenta Contable",
          key: "configuracionCuentaContable",
          icon: "pi-cog",
        },
        {
          label: "Asientos Contables",
          key: "asientoContableInterfaz",
          icon: "pi-book",
        },
        {
          label: "Tipos Movimiento Entregas a Rendir",
          key: "tipoMovEntregaRendir",
          icon: "pi-tag",
        },
        { label: "Centros de Costo", key: "centroCosto", icon: "pi-sitemap" },
        {
          label: "Categorías Centro Costo",
          key: "categoriaCCosto",
          icon: "pi-tags",
        },
        {
          label: "Empresa por Centro Costo",
          key: "empresaCentroCosto",
          icon: "pi-building",
        },
        {
          label: "Tipo Cuenta Corriente",
          key: "tipoCuentaCorriente",
          icon: "pi-tag",
        },
        {
          label: "Tipo Referencia",
          key: "tipoReferenciaMovimientoCaja",
          icon: "pi-hashtag",
        },
        { label: "Bancos", key: "banco", icon: "pi-building-columns" },
      ],
    },
       {
      id: "finanzas",
      titulo: "FINANZAS",
      descripcion: "Tesorería Avanzada: Préstamos, Créditos e Inversiones",
      icono: "pi-wallet",
      modulos: 10,
      color: "#8E44AD",
      size: "medium",
      submenu: [
        {
          label: "Cuenta Por Cobrar",
          key: "cuentaPorCobrar",
          icon: "pi-money-bill",
        },
        {
          label: "Cuenta Por Pagar",
          key: "cuentaPorPagar",
          icon: "pi-credit-card",
        },
        {
          label: "Pagos Cuentas por Pagar",
          key: "pagoCuentaPorPagar",
          icon: "pi-shopping-cart",
        },
        {
          label: "Pagos Cuentas Por Cobrar",
          key: "pagoCuentaPorCobrar",
          icon: "pi-shopping-cart",
        },
        { label: "Tipos de Préstamo", key: "tipoPrestamo", icon: "pi-tags" },
        {
          label: "Préstamo Bancario",
          key: "prestamoBancario",
          icon: "pi-briefcase",
        },
        {
          label: "Línea de Crédito",
          key: "lineaCredito",
          icon: "pi-credit-card",
        },
        {
          label: "Inversión Financiera",
          key: "inversionFinanciera",
          icon: "pi-chart-pie",
        },
        {
          label: "Reporte Líneas Disponibles",
          key: "reporteLineasDisponibles",
          icon: "pi-chart-bar",
        },
      ],
    },
    {
      id: "contabilidad",
      titulo: "CONTABILIDAD",
      descripcion: "Plan Contable, Asientos, Períodos y Reportes Financieros",
      icono: "pi-calculator",
      modulos: 10,
      color: "#E74C3C",
      size: "large",
      submenu: [
        { label: "Plan Contable", key: "planCuentasContable", icon: "pi-list" },
        {
          label: "Período Contable",
          key: "periodoContable",
          icon: "pi-calendar",
        },
        { label: "Asiento Contable", key: "asientoContable", icon: "pi-book" },
        {
          label: "Tipo Afectación IGV",
          key: "tipoAfectacionIGV",
          icon: "pi-percentage",
        },
        {
          label: "Flujo de Caja Financiero",
          key: "flujoCaja",
          icon: "pi-chart-line",
        },
        {
          label: "Conciliación Bancaria",
          key: "conciliacionBancaria",
          icon: "pi-check-square",
        },
        { label: "Letras de Cambio", key: "letraCambio", icon: "pi-file-edit" },
        { label: "Retenciones", key: "retencion", icon: "pi-minus-circle" },
        { label: "Percepciones", key: "percepcion", icon: "pi-plus-circle" },
        { label: "Presupuestos", key: "presupuesto", icon: "pi-chart-bar" },
      ],
    },
    {
      id: "maestros",
      titulo: "MAESTROS",
      descripcion: "Configuración de empresas, personal, productos y entidades",
      icono: "pi-database",
      modulos: 33,
      color: "#2874A6",
      size: "small",
      submenu: [
        { label: "Empresas", key: "empresas", icon: "pi-building" },
        { label: "Sedes Empresa", key: "sedesEmpresa", icon: "pi-map-marker" },
        {
          label: "Áreas Físicas Sede",
          key: "areasFisicasSede",
          icon: "pi-th-large",
        },
        { label: "Personal", key: "personal", icon: "pi-users" },
        {
          label: "Cargos Personal",
          key: "cargosPersonal",
          icon: "pi-briefcase",
        },
        { label: "Tipo Contrato", key: "tipoContrato", icon: "pi-file" },
        {
          label: "Aprobadores",
          key: "parametroAprobador",
          icon: "pi-check-circle",
        },
        {
          label: "Tipos Documento Identidad",
          key: "tiposDocIdentidad",
          icon: "pi-id-card",
        },
        {
          label: "Entidad Comercial",
          key: "entidadComercial",
          icon: "pi-briefcase",
        },
        { label: "Tipo Entidad", key: "tipoEntidad", icon: "pi-tag" },
        {
          label: "Agrupaciones Entidad",
          key: "agrupacionEntidad",
          icon: "pi-sitemap",
        },
        { label: "Productos y Servicios", key: "producto", icon: "pi-box" },
        { label: "Familia Producto", key: "familiaProducto", icon: "pi-tags" },
        {
          label: "Subfamilia Producto",
          key: "subfamiliaProducto",
          icon: "pi-tag",
        },
        {
          label: "Tipo Almacenamiento",
          key: "tipoAlmacenamiento",
          icon: "pi-warehouse",
        },
        { label: "Marca", key: "marca", icon: "pi-bookmark" },
        { label: "Unidad Medida", key: "unidadMedida", icon: "pi-chart-bar" },
        { label: "Tipo Material", key: "tipoMaterial", icon: "pi-box" },
        { label: "Color", key: "color", icon: "pi-palette" },
        { label: "Tipo Vehículos", key: "tipoVehiculo", icon: "pi-car" },
        { label: "País", key: "pais", icon: "pi-globe" },
        { label: "Departamento", key: "departamento", icon: "pi-map" },
        { label: "Provincia", key: "provincia", icon: "pi-map-marker" },
        { label: "Ubigeo", key: "ubigeo", icon: "pi-map" },
        { label: "Activos", key: "activo", icon: "pi-server" },
        { label: "Tipo Activo", key: "tipoActivo", icon: "pi-tag" },
        {
          label: "Detalle Permiso Activo",
          key: "detallePermisoActivo",
          icon: "pi-lock",
        },
        {
          label: "Permiso Autorización",
          key: "permisoAutorizacion",
          icon: "pi-shield",
        },
        {
          label: "Estado Multi Función",
          key: "estadoMultiFuncion",
          icon: "pi-circle",
        },
        {
          label: "Tipo Proviene De",
          key: "tipoProvieneDe",
          icon: "pi-arrow-right",
        },
        { label: "Monedas", key: "monedas", icon: "pi-dollar" },
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
        item.label.toLowerCase().includes(query)
      );

      return matchTitle || matchDescription || matchSubmenu;
    }
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
        (m) => m.id === moduloId
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
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "60px 40px",
        }}
      >
        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            marginBottom: "40px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            <i
              className="pi pi-search"
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                fontSize: "18px",
                zIndex: 2,
              }}
            />
            <input
              type="text"
              placeholder="Buscar módulos, procesos o funcionalidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px 16px 52px",
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(93, 173, 226, 0.3)",
                borderRadius: "16px",
                color: "#ffffff",
                fontSize: "1rem",
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid #5DADE2";
                e.target.style.boxShadow = "0 0 0 3px rgba(93, 173, 226, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(93, 173, 226, 0.3)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(93, 173, 226, 0.2)",
                  border: "none",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#5DADE2",
                  transition: "all 0.2s ease",
                }}
                whileHover={{
                  background: "rgba(93, 173, 226, 0.3)",
                  scale: 1.1,
                }}
              >
                <i className="pi pi-times" style={{ fontSize: "14px" }} />
              </motion.button>
            )}
          </div>
        </motion.div>

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

        {/* Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            gridAutoFlow: "dense",
          }}
        >
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
                    border: `1px solid ${
                      hoveredCard === modulo.id || expandedCard === modulo.id
                        ? modulo.color
                        : "rgba(51, 65, 85, 0.5)"
                    }`,
                    borderRadius: "24px",
                    padding: "32px",
                    minHeight:
                      expandedCard === modulo.id
                        ? "auto"
                        : modulo.size === "large"
                        ? "280px"
                        : "220px",
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
                      gap: "20px",
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
                        width: "64px",
                        height: "64px",
                        borderRadius: "16px",
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
                          fontSize: "28px",
                          color: modulo.color,
                        }}
                      />
                    </motion.div>

                    <div style={{ flex: 1 }}>
                      {/* Título */}
                      <h3
                        style={{
                          fontSize: "1.4rem",
                          fontWeight: "700",
                          color: "#ffffff",
                          marginBottom: "8px",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {modulo.titulo}
                      </h3>

                      {/* Descripción */}
                      <p
                        style={{
                          fontSize: "0.95rem",
                          color: "#94a3b8",
                          lineHeight: "1.6",
                          marginBottom: "12px",
                        }}
                      >
                        {modulo.descripcion}
                      </p>

                      {/* Contador de módulos */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.9rem",
                          color: "#64748b",
                        }}
                      >
                        <i className="pi pi-box" style={{ fontSize: "14px" }} />
                        <span>{modulo.modulos} módulos</span>
                        <motion.i
                          className={`pi ${
                            expandedCard === modulo.id
                              ? "pi-chevron-up"
                              : "pi-chevron-down"
                          }`}
                          style={{
                            fontSize: "14px",
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
                          marginTop: "24px",
                          paddingTop: "24px",
                          borderTop: `1px solid ${modulo.color}30`,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          {modulo.submenu.map((item, idx) => (
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
                                padding: "12px 16px",
                                background: "rgba(15, 23, 42, 0.4)",
                                border: `1px solid ${modulo.color}20`,
                                borderRadius: "12px",
                                color: "#cbd5e1",
                                fontSize: "0.9rem",
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
                                  fontSize: "16px",
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
