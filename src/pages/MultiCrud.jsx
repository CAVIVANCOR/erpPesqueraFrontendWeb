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
import { Menubar } from "primereact/menubar";
import { Sidebar } from "primereact/sidebar";
import { useIsMobile } from "../shared/hooks/useIsMobile";

// Importa tus módulos CRUD desacoplados
import Empresas from "./Empresas";
import AreasFisicasSede from "./AreasFisicasSede";
import SedesEmpresa from "./SedesEmpresa";
import Usuarios from "./Usuarios";
import Personal from "./Personal";
import TipoDocumento from "./TipoDocumento";
import TipoContrato from "./TipoContrato";
import CargosPersonal from "./CargosPersonal";
import ModulosSistema from "./ModulosSistema";
import SubmodulosSistema from "./SubmodulosSistema";


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
    personal: { label: "Personal", componente: <Personal /> },
    cargosPersonal: { label: "Cargos del Personal", componente: <CargosPersonal /> },
    tipoContrato: { label: "Tipo Contrato", componente: <TipoContrato /> },
    tipoDocumento: { label: "Tipo Documento", componente: <TipoDocumento /> },
    usuarios: { label: "Usuarios", componente: <Usuarios /> },
    modulosSistema: { label: "Módulos Sistema", componente: <ModulosSistema /> },
    SubmodulosSistema: { label: "Submódulos Sistema", componente: <SubmodulosSistema /> },
    empresas: { label: "Empresas", componente: <Empresas /> },
    sedesEmpresa: { label: "Sedes Empresa", componente: <SedesEmpresa /> },
    areasFisicas: { label: "Áreas Físicas", componente: <AreasFisicasSede /> },
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
        { label: "Registro de Acceso", icon: "pi pi-leaf", command: () => abrirModulo("AccesoInstalaciones", "Registro de Acceso") },
        { label: "Motivos", icon: "pi pi-ship", command: () => abrirModulo("motivos", "Motivos") },
        { label: "Tipo Acceso", icon: "pi pi-snowflake", command: () => abrirModulo("tipoAcceso", "Tipo Acceso") },
        { label: "Tipo Equipos", icon: "pi pi-snowflake", command: () => abrirModulo("tipoEquipos", "Tipo Equipos") },
        { label: "Tipo Movimiento", icon: "pi pi-snowflake", command: () => abrirModulo("tipoMovimiento", "Tipo Movimiento") },
        { label: "Tipo Visitantes", icon: "pi pi-snowflake", command: () => abrirModulo("tipoVisitantes", "Tipo Visitantes") },
      ]
    },
    {
      label: "Pesca",
      icon: "pi pi-cog",
      items: [
        { label: "Pesca Industrial", icon: "pi pi-leaf", command: () => abrirModulo("pescaIndustrial", "Pesca Industrial") },
        { label: "Pesca Consumo", icon: "pi pi-ship", command: () => abrirModulo("pescaConsumo", "Pesca Consumo") },
        { label: "Acciones previas", icon: "pi pi-archive", command: () => abrirModulo("accionesPrevias", "Acciones previas") },
        { label: "Documentacion Embarcacion", icon: "pi pi-snowflake", command: () => abrirModulo("docEmbarcacion", "Documentación Embarcación") },
        { label: "Documentacion Pesca", icon: "pi pi-snowflake", command: () => abrirModulo("docPesca", "Documentación Pesca") },
        { label: "Embarcaciones", icon: "pi pi-snowflake", command: () => abrirModulo("embarcaciones", "Embarcaciones") },
        { label: "Boliches de Red", icon: "pi pi-snowflake", command: () => abrirModulo("bolichesRed", "Boliches de Red") },
        { label: "Puertos", icon: "pi pi-snowflake", command: () => abrirModulo("puertos", "Puertos") },
      ]
    },
    {
      label: "Compras",
      icon: "pi pi-cog",
      items: [
        { label: "Cotizacion Compra", icon: "pi pi-leaf", command: () => abrirModulo("compras", "Cotización Compra") },
        { label: "Requerimiento Compra", icon: "pi pi-ship", command: () => abrirModulo("requerimientoCompra", "Requerimiento Compra") },
        { label: "Orden de Compra", icon: "pi pi-archive", command: () => abrirModulo("ordenCompra", "Orden de Compra") },
        { label: "Entregas a Rendir", icon: "pi pi-snowflake", command: () => abrirModulo("entregasRendir", "Entregas a Rendir") },
        { label: "Liquidacion", icon: "pi pi-snowflake", command: () => abrirModulo("liquidacion", "Liquidación") },
      ]
    },
    {
      label: "Ventas",
      icon: "pi pi-cog",
      items: [
        { label: "Cotizacion Venta", icon: "pi pi-leaf", command: () => abrirModulo("ventas", "Cotización Venta") },
        { label: "Documentacion Requerida", icon: "pi pi-ship", command: () => abrirModulo("docRequerida", "Documentación Requerida") },
        { label: "Pre Venta", icon: "pi pi-ship", command: () => abrirModulo("preVenta", "Pre Venta") },
        { label: "Entrega a Rendir", icon: "pi pi-archive", command: () => abrirModulo("entregaRendir", "Entrega a Rendir") },
        { label: "Destino Mercaderia", icon: "pi pi-snowflake", command: () => abrirModulo("destinoMercaderia", "Destino Mercadería") },
        { label: "Forma Transaccion mercaderia", icon: "pi pi-snowflake", command: () => abrirModulo("formaTransaccion", "Forma Transacción Mercadería") },
        { label: "Incoterms", icon: "pi pi-snowflake", command: () => abrirModulo("incoterms", "Incoterms") },
        { label: "Modo Despacho Mercaderia", icon: "pi pi-snowflake", command: () => abrirModulo("modoDespacho", "Modo Despacho Mercadería") },
        { label: "Tipo Estado Mercaderia", icon: "pi pi-snowflake", command: () => abrirModulo("tipoEstadoMercaderia", "Tipo Estado Mercadería") },
        { label: "Tipo Mercaderia", icon: "pi pi-snowflake", command: () => abrirModulo("tipoMercaderia", "Tipo Mercadería") },
      ]
    },
    {
      label: "Inventarios",
      icon: "pi pi-warehouse",
      items: [
        { label: "Registro Movimientos", icon: "pi pi-leaf", command: () => abrirModulo("registroMovimientos", "Registro Movimientos") },
        { label: "Kardex Productos", icon: "pi pi-ship", command: () => abrirModulo("kardexProductos", "Kardex Productos") },
        { label: "Saldos por Producto", icon: "pi pi-archive", command: () => abrirModulo("saldosProducto", "Saldos por Producto") },
        { label: "Saldos por Producto y Variables Control", icon: "pi pi-snowflake", command: () => abrirModulo("saldosProductoVariables", "Saldos por Producto y Variables Control") },
        { label: "Serie Documentos", icon: "pi pi-snowflake", command: () => abrirModulo("serieDocumentos", "Serie Documentos") },
        { label: "Tipos de Almacen", icon: "pi pi-snowflake", command: () => abrirModulo("tiposAlmacen", "Tipos de Almacén") },
        { label: "Tipos de Concepto Almacen", icon: "pi pi-snowflake", command: () => abrirModulo("tiposConceptoAlmacen", "Tipos de Concepto Almacén") },
        { label: "Tipos de Documentos", icon: "pi pi-snowflake", command: () => abrirModulo("tipoDocumento", "Tipos de Documentos") },
        { label: "Tipo de Movimientos Almacen", icon: "pi pi-snowflake", command: () => abrirModulo("tipoMovimientosAlmacen", "Tipo de Movimientos Almacén") },
        { label: "Conceptos de Movimiento Almacen", icon: "pi pi-snowflake", command: () => abrirModulo("conceptosMovimientoAlmacen", "Conceptos de Movimiento Almacén") },
      ]
    },
    {
      label: "Mantenimiento",
      icon: "pi pi-truck",
      items: [
        { label: "Registro de Ordenes de Trabajo", icon: "pi pi-leaf", command: () => abrirModulo("ordenesTrabajo", "Órdenes de Trabajo") },
        { label: "Motivo origino OT", icon: "pi pi-ship", command: () => abrirModulo("motivoOT", "Motivo origino OT") },
        { label: "Tipo de Mantenimiento", icon: "pi pi-archive", command: () => abrirModulo("tipoMantenimiento", "Tipo de Mantenimiento") },
      ]
    },
    {
      label: "Flujo Caja",
      icon: "pi pi-dollar",
      items: [
        { label: "Registro de Transacciones", icon: "pi pi-leaf", command: () => abrirModulo("registroTransacciones", "Registro de Transacciones") },
        { label: "Cuentas Corrientes", icon: "pi pi-ship", command: () => abrirModulo("cuentasCorrientes", "Cuentas Corrientes") },
        { label: "Tipos de Cuenta Corriente", icon: "pi pi-archive", command: () => abrirModulo("tiposCuentaCorriente", "Tipos de Cuenta Corriente") },
        { label: "Tipos de Referencia", icon: "pi pi-snowflake", command: () => abrirModulo("tiposReferencia", "Tipos de Referencia") },
        { label: "Bancos", icon: "pi pi-snowflake", command: () => abrirModulo("bancos", "Bancos") },
      ]
    },
    {
      label: "Usuarios",
      icon: "pi pi-users",
      items: [
        { label: "Registro de Usuarios", icon: "pi pi-leaf", command: () => abrirModulo("usuarios", "Registro de Usuarios") },
        { label: "Personal", icon: "pi pi-ship", command: () => abrirModulo("personal", "Personal") },
        { label: "Cargos Personal", icon: "pi pi-sitemap", command: () => abrirModulo("cargosPersonal", "Cargos del Personal") },
        { label: "Tipo Contrato", icon: "pi pi-ship", command: () => abrirModulo("tipoContrato", "Tipo Contrato") },
        { label: "Documentacion Personal", icon: "pi pi-archive", command: () => abrirModulo("docPersonal", "Documentación Personal") },
        { label: "Ubigeos", icon: "pi pi-snowflake", command: () => abrirModulo("ubigeos", "Ubigeos") },
        { label: "Pais", icon: "pi pi-snowflake", command: () => abrirModulo("pais", "País") },
        { label: "Departamento", icon: "pi pi-snowflake", command: () => abrirModulo("departamento", "Departamento") },
        { label: "Provincia", icon: "pi pi-snowflake", command: () => abrirModulo("provincia", "Provincia") },
        { label: "Distrito", icon: "pi pi-snowflake", command: () => abrirModulo("distrito", "Distrito") },
        { label: "Modulos Sistema", icon: "pi pi-snowflake", command: () => abrirModulo("modulosSistema", "Módulos Sistema") },
        { label: "Submodulos Sistema", icon: "pi pi-snowflake", command: () => abrirModulo("SubmodulosSistema", "Submódulos Sistema") },
      ]
    },
    {
      label: "Maestros",
      icon: "pi pi-users",
      items: [
        { label: "Clientes y/o Proveedores", icon: "pi pi-leaf", command: () => abrirModulo("maestros", "Clientes y/o Proveedores") },
        { label: "Empresas", icon: "pi pi-ship", command: () => abrirModulo("empresas", "Empresas") },
        { label: "Sedes", icon: "pi pi-ship", command: () => abrirModulo("sedesEmpresa", "Sedes Empresa") },
        { label: "Areas Fisicas", icon: "pi pi-ship", command: () => abrirModulo("areasFisicas", "Áreas Físicas") },
        { label: "Especies", icon: "pi pi-archive", command: () => abrirModulo("especies", "Especies") },
        { label: "Monedas", icon: "pi pi-snowflake", command: () => abrirModulo("monedas", "Monedas") },
        { label: "Aprobadores", icon: "pi pi-snowflake", command: () => abrirModulo("aprobadores", "Aprobadores") },
        { label: "Productos & Servicios", icon: "pi pi-snowflake", command: () => abrirModulo("productosServicios", "Productos & Servicios") },
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
        Menú profesional de módulos multitarea:
        - En desktop: Menubar horizontal PrimeReact
        - En móvil: Botón hamburguesa que abre Sidebar tipo Drawer con los módulos
        Documentado en español técnico.
      */}
      {isMobile ? (
        <>
          <Button icon="pi pi-bars" className="p-button-text p-button-lg" onClick={() => setVisibleSidebar(true)} style={{ marginBottom: 12 }} aria-label="Abrir menú de módulos" />
          <Sidebar visible={visibleSidebar} onHide={() => setVisibleSidebar(false)} position="left" style={{ width: 260 }} showCloseIcon>
            <h3 style={{ marginTop: 0 }}>Módulos</h3>
            {/* Renderizado profesional del menú jerárquico también en móvil (Drawer/Sidebar). */}
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <Button
                  label={item.label}
                  icon={item.icon}
                  className="p-button-text p-button-lg"
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }}
                  onClick={() => {
                    if (item.command) {
                      item.command();
                      setVisibleSidebar(false);
                    }
                  }}
                  disabled={!item.command && !item.items}
                />
                {/* Si tiene submenús, renderizarlos como grupo anidado */}
                {item.items && (
                  <div style={{ paddingLeft: 18, borderLeft: '2px solid #e0e0e0', marginBottom: 8 }}>
                    {item.items.map((sub, subIdx) => (
                      <Button
                        key={subIdx}
                        label={sub.label}
                        icon={sub.icon}
                        className="p-button-text p-button-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                        onClick={() => {
                          if (sub.command) {
                            sub.command();
                            setVisibleSidebar(false);
                          }
                        }}
                        disabled={!sub.command && !sub.items}
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </Sidebar>
        </>
      ) : (
        <Menubar model={menuItems} style={{ marginBottom: 12 }} />
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
