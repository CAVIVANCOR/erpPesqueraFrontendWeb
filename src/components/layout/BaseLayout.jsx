import React from "react";
import { Menubar } from "primereact/menubar";
import { useNavigate } from "react-router-dom";
import logotipoMegui from "../../assets/Logotipo/Logotipo_Megui_Negativo.png";
import logotipoMeguiCuadrado from "../../assets/Isotipo/Isotipo_Megui_Negativo.png";
import { useIsMobile } from "../../shared/hooks/useIsMobile";
import logoCerebro13 from "../../assets/LogoCerebro13.png";
import Pilares from "../../assets/Pilares.png";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { useAuthRefresh } from '../../shared/hooks/useAuthRefresh';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { Outlet } from "react-router-dom";


// Componente Avatar de usuario autenticado
function UserAvatar({ usuario }) {
  let nombre = usuario?.personal?.nombres || usuario?.nombres || "";
  let apellidos = usuario?.personal?.apellidos || usuario?.apellidos || "";
  let foto = usuario?.personal?.fotoUrl || usuario?.fotoUrl || null;
  let iniciales = "";
  if (nombre || apellidos) {
    iniciales = (nombre[0] || "").toUpperCase() + (apellidos[0] || "").toUpperCase();
  } else if (usuario?.username) {
    iniciales = usuario.username.slice(0, 2).toUpperCase();
  } else {
    iniciales = "US";
  }
  return (
    <Avatar
      image={foto || undefined}
      label={!foto ? iniciales : undefined}
      shape="circle"
      style={{ width: 40, height: 40, background: !foto ? "#009fe3" : undefined, color: !foto ? "#fff" : undefined, border: "2px solid #fff", fontWeight: 700, fontSize: 18 }}
      title={nombre && apellidos ? `${nombre} ${apellidos}` : usuario?.username || "Usuario"}
    />
  );
}

/**
 * Componente BaseLayout
 *
 * Este layout esqueleto define la estructura principal de la interfaz web del ERP Megui.
 * Utiliza exclusivamente componentes de PrimeReact para la barra superior, avatar, botón de logout y footer.
 * Integra el avatar del usuario autenticado y el botón de cierre de sesión, ambos conectados al store global Zustand (useAuthStore).
 *
 * Props:
 * - children: contenido principal de cada página.
 * - onLogout: callback opcional que permite lógica adicional al cerrar sesión.
 */
/**
 * Componente BaseLayout
 *
 * Este layout esqueleto define la estructura principal de la interfaz web del ERP Megui.
 * Utiliza exclusivamente componentes de PrimeReact para la barra superior, avatar, botón de logout y footer.
 * Integra el avatar del usuario autenticado y el botón de cierre de sesión, ambos conectados al store global Zustand (useAuthStore).
 *
 * Ahora el usuario y la foto de avatar se obtienen directamente del store global Zustand.
 */
export default function BaseLayout({ children, onLogout }) {
  // Referencia profesional para el Toast global de PrimeReact
  const toast = useRef(null);

  // Log detallado del estado de autenticación justo antes de usar el hook
  const authState = useAuthStore.getState();
  // Hook de navegación de React Router
  const navigate = useNavigate();

  /**
   * Muestra una notificación profesional cuando la sesión expira.
   * Usa colores y mensajes estándar de seguridad UX.
   * @param {string} motivo - Motivo de expiración de sesión (expiracion o inactividad)
   */
  const mostrarToastExpiracion = (motivo = 'expiracion') => {
    let detail = 'Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    if (motivo === 'inactividad') {
      detail = 'Tu sesión ha expirado por inactividad prolongada. Ingresa nuevamente para continuar.';
    }
    toast.current?.show({
      severity: 'warn',
      summary: 'Sesión expirada',
      detail,
      life: 9000, // 9 segundos
      closable: true,
      icon: 'pi pi-exclamation-triangle'
    });
  };

  /**
   * Callback de expiración de sesión (ejecutado por useAuthRefresh)
   */
  const onSessionExpired = () => {
    mostrarToastExpiracion();
    // Da tiempo a que el usuario vea el Toast antes de redirigir
    setTimeout(() => {
      navigate('/login?expired=1', { replace: true });
    }, 1200);
  };

  // Hook profesional para refresco automático de sesión y cierre por expiración
  useAuthRefresh(onSessionExpired);

  // Definición del menú con navegación real para cada módulo (debe estar dentro del componente para usar navigate)
  const menuItems = [
    {
      label: "Inicio",
      icon: "pi pi-home",
      command: () => window.location.href = "/"
    },
    {
      label: "Acceso Instalaciones",
      icon: "pi pi-shield",
      items: [
        { label: "Inventario", icon: "pi pi-leaf", command: () => navigate("/inventarios") },
        { label: "Motivos", icon: "pi pi-ship" },
        { label: "Tipo Acceso", icon: "pi pi-snowflake" },
        { label: "Tipo Equipos", icon: "pi pi-snowflake" },
        { label: "Tipo Movimiento", icon: "pi pi-snowflake" },
        { label: "Tipo Visitantes", icon: "pi pi-snowflake" }
      ]
    },
    {
      label: "Pesca",
      icon: "pi pi-cog",
      items: [
        { label: "Pesca Industrial", icon: "pi pi-leaf", command: () => navigate("/pesca-industrial") },
        { label: "Pesca Consumo", icon: "pi pi-ship", command: () => navigate("/pesca-consumo") },
        { label: "Acciones previas", icon: "pi pi-archive" },
        { label: "Documentacion Embarcacion", icon: "pi pi-snowflake" },
        { label: "Documentacion Pesca", icon: "pi pi-snowflake" },
        { label: "Embarcaciones", icon: "pi pi-snowflake" },
        { label: "Boliches de Red", icon: "pi pi-snowflake" },
        { label: "Puertos", icon: "pi pi-snowflake" }
      ]
    },
    {
      label: "Compras",
      icon: "pi pi-cog",
      items: [
        { label: "Cotizacion Compra", icon: "pi pi-leaf", command: () => navigate("/compras") },
        { label: "Requerimiento Compra", icon: "pi pi-ship" },
        { label: "Orden de Compra", icon: "pi pi-archive" },
        { label: "Entregas a Rendir", icon: "pi pi-snowflake" },
        { label: "Liquidacion", icon: "pi pi-snowflake" }
      ]
    },
    {
      label: "Ventas",
      icon: "pi pi-cog",
      items: [
        { label: "Cotizacion Venta", icon: "pi pi-leaf", command: () => navigate("/ventas") },
        { label: "Documentacion Requerida", icon: "pi pi-ship" },
        { label: "Pre Venta", icon: "pi pi-ship" },
        { label: "Entrega a Rendir", icon: "pi pi-archive" },
        { label: "Destino Mercaderia", icon: "pi pi-snowflake" },
        { label: "Forma Transaccion mercaderia", icon: "pi pi-snowflake" },
        { label: "Incoterms", icon: "pi pi-snowflake" },
        { label: "Modo Despacho Mercaderia", icon: "pi pi-snowflake" },
        { label: "Tipo Estado Mercaderia", icon: "pi pi-snowflake" },
        { label: "Tipo Mercaderia", icon: "pi pi-snowflake" }
      ]
    },
    {
      label: "Inventarios",
      icon: "pi pi-warehouse",
      items: [
        { label: "Registro Movimientos", icon: "pi pi-leaf" },
        { label: "Kardex Productos", icon: "pi pi-ship" },
        { label: "Saldos por Producto", icon: "pi pi-archive" },
        { label: "Saldos por Producto y Variables Control", icon: "pi pi-snowflake" },
        { label: "Serie Documentos", icon: "pi pi-snowflake" },
        { label: "Tipos de Almacen", icon: "pi pi-snowflake" },
        { label: "Tipos de Concepto Almacen", icon: "pi pi-snowflake" },
        { label: "Tipos de Documentos", icon: "pi pi-snowflake" },
        { label: "Tipo de Movimientos Almacen", icon: "pi pi-snowflake" },
        { label: "Conceptos de Movimiento Almacen", icon: "pi pi-snowflake" },
      ]
    },
    {
      label: "Mantenimiento",
      icon: "pi pi-truck",
      items: [
        { label: "Registro de Ordenes de Trabajo", icon: "pi pi-leaf" },
        { label: "Motivo origino OT", icon: "pi pi-ship" },
        { label: "Tipo de Mantenimiento", icon: "pi pi-archive" }
      ]
    },
    {
      label: "Flujo Caja",
      icon: "pi pi-dollar",
      items: [
        { label: "Registro de Transacciones", icon: "pi pi-leaf" },
        { label: "Cuentas Corrientes", icon: "pi pi-ship" },
        { label: "Tipos de Cuenta Corriente", icon: "pi pi-archive" },
        { label: "Tipos de Referencia", icon: "pi pi-snowflake" },
        { label: "Bancos", icon: "pi pi-snowflake" }
      ]
    },
    {
      label: "Usuarios",
      icon: "pi pi-users",
      items: [
        // Navegación interna profesional al módulo de usuarios
        { label: "Registro de Usuarios", icon: "pi pi-leaf", command: () => navigate("/usuarios") },
        { label: "Personal", icon: "pi pi-ship" },
        { label: "Documentacion Personal", icon: "pi pi-archive" },
        { label: "Cargos del Personal", icon: "pi pi-snowflake" },
        { label: "Ubigeos", icon: "pi pi-snowflake" },
        { label: "Pais", icon: "pi pi-snowflake" },
        { label: "Departamento", icon: "pi pi-snowflake" },
        { label: "Provincia", icon: "pi pi-snowflake" },
        { label: "Modulos de ERP", icon: "pi pi-snowflake" },
        { label: "Submodulos ERP", icon: "pi pi-snowflake" },
      ]
    },
    {
      label: "Maestros",
      icon: "pi pi-users",
      items: [
        { label: "Clientes y/o Proveedores", icon: "pi pi-leaf", command: () => navigate("/maestros") },
        { label: "Empresas", icon: "pi pi-ship", command: () => navigate("/empresas") },
        { label: "Sedes", icon: "pi pi-ship", command: () => navigate("/sedes") },
        { label: "Areas Fisicas", icon: "pi pi-ship", command: () => navigate("/areas-fisicas") },
        { label: "Especies", icon: "pi pi-archive" },
        { label: "Monedas", icon: "pi pi-snowflake" },
        { label: "Aprobadores", icon: "pi pi-snowflake" },
        { label: "Productos & Servicios", icon: "pi pi-snowflake" },
      ]
    }
  ];
  // Obtiene el usuario autenticado y el método logout desde el store global Zustand
  const usuario = useAuthStore(state => state.usuario);
  const logout = useAuthStore(state => state.logout);

  /**
   * handleLogout
   *
   * Lógica profesional de cierre de sesión global:
   * - Limpia el estado y storage de sesión usando el método logout del store Zustand.
   * - Redirige de forma reactiva a /login para forzar el flujo de autenticación.
   * - Muestra un Toast visual confirmando el cierre de sesión.
   */
  const handleLogout = () => {
    logout();
    if (toast.current) {
      toast.current.show({
        severity: 'info',
        summary: 'Sesión cerrada',
        detail: 'Has cerrado sesión correctamente.',
        life: 3000
      });
    }
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        navigate("/login", { replace: true });
      }
    }, 500); // Espera breve para mostrar el Toast antes de redirigir
  };


  // Detecta si es móvil usando el hook profesional
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background-color)" }}>
      {/* Toast global siempre visible en la parte superior central para máxima visibilidad UX */}
      <Toast ref={toast} position="top-center" />
      {/* Header */}
      <header style={{ width: "100%", background: "var(--secondary-color)", color: "var(--secondary-color-text)", boxShadow: "0 2px 8px #00305722" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={Pilares}
              alt="Pilares"
              style={{ height: 96, marginRight: 16, borderRadius: 4 }}
            />
            {/* Logo responsivo: horizontal en desktop, cuadrado pequeño en móvil */}
            <img
              src={isMobile ? logotipoMeguiCuadrado : logotipoMegui}
              alt="Logotipo Megui"
              style={{ height: isMobile ? 120 : 96, marginRight: 16, borderRadius: 4 }}
            />
          </div>
          {/* Avatar del usuario autenticado y botón de logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar PrimeReact: ahora más grande y visualmente destacado */}
            <UserAvatar usuario={usuario} />
            {/* Botón de cerrar sesión: ahora exactamente del mismo tamaño que el avatar */}
            {/* Botón de cerrar sesión: fondo y borde blancos, icono gris oscuro para máxima visibilidad UX */}
            <Button
              icon="pi pi-sign-out"
              className="p-button-rounded p-button-text"
              onClick={handleLogout}
              style={{
                fontSize: 32,
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff !important', // Fondo blanco absoluto
                border: '2px solid #fff',
                color: '#fff', // Fuerza el icono/signo de logout a blanco
                boxShadow: '0 2px 8px #00305722'
              }}
              aria-label="Cerrar sesión"
              tooltip="Cerrar sesión"
              tooltipOptions={{ position: 'bottom' }}
              // Truco: fuerza el color blanco del icono usando CSS inline sobre el span generado por PrimeReact
              pt={{ icon: { style: { color: '#fff !important' } } }}
            />
          </div>
        </div>
        {/* Menubar global eliminado: ahora toda la navegación de módulos se gestiona exclusivamente desde el menú interno de MultiCrud, siguiendo el patrón multitarea profesional. */}
      </header>

      {/* Main content */}
      <main style={{ flex: 1, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem", color: "var(--text-color)", background: "var(--background-color)" }}>
        {/*
          Lógica profesional: Si el contenido principal es el sistema de pestañas dinámicas (MultiCrud),
          se oculta el breadcrumb tradicional para evitar confusión, ya que la navegación es paralela y no jerárquica.
          Opcionalmente, se puede mostrar el nombre de la pestaña activa como encabezado dentro de MultiCrud.
        */}
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ width: "100%", background: "var(--accent-color)", color: "var(--secondary-color-text)", padding: "1rem 0", marginTop: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center", fontSize: "0.95rem" }}>
          &copy; {new Date().getFullYear()} Megui Investment SAC. Todos los derechos reservados.<br />
          <span style={{ fontSize: '0.8rem' }}>Desarrollado por <a href="https://13elfuturohoy.com/" style={{ textDecoration: 'none', display: 'inline-block', verticalAlign: 'middle' }} target="_blank" rel="noopener noreferrer"><img src={logoCerebro13} alt="13 El Futuro Hoy" style={{ height: 20, border: 0, verticalAlign: 'middle', borderRadius: '50%' }} /></a></span>
        </div>
      </footer>
    </div>
  );
}
// Fin del componente BaseLayout: layout principal con gestión profesional de sesión y notificaciones Toast UX
