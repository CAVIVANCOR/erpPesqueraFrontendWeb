import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";

import { Toast } from 'primereact/toast';
import logotipoMegui from "../assets/Isotipo/Isotipo_Megui_Positivo.png";
import apiBackend from "../api/axios";
import { useAuthStore } from '../shared/stores/useAuthStore';
import { useLocation } from 'react-router-dom';
import { getAccesosPorUsuario } from '../api/accesosUsuario';

/**
 * Componente Login
 *
 * Este componente implementa la pantalla de inicio de sesión del ERP Megui.
 * Utiliza PrimeReact para la UI, maneja el flujo de autenticación real contra el backend
 * y gestiona la sesión de usuario usando Zustand (useAuthStore) como store global persistente.
 *
 * Props:
 * - onLogin: callback opcional que se ejecuta tras login exitoso.
 */
export default function Login({ onLogin }) {
  // Hook para obtener el estado de navegación (detecta expiración de sesión)
  const location = useLocation();
  // Detecta expiración de sesión por query string (?expired=1)
  const expired = window.location.search.includes('expired=1');

  // Referencia para el Toast de PrimeReact
  const toast = useRef(null);

  // useEffect para mostrar Toast si la sesión expiró/cerró automáticamente
  useEffect(() => {

    // Toast real de expiración de sesión
    if (expired && toast.current) {
      toast.current.show({
        severity: 'warn',
        summary: 'Sesión finalizada',
        detail: 'Tu sesión ha expirado o fue cerrada automáticamente. Por favor, inicia sesión nuevamente.',
        life: 5000
      });
    }
  }, [expired]);

  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(""); // Mensaje de error para login
  const [loading, setLoading] = useState(false);

  const loginStore = useAuthStore();
  /**
   * handleSubmit
   *
   * Maneja el envío del formulario de login.
   * Realiza la petición real al backend (/auth/login), guarda el usuario y token en el store Zustand,
   * y ejecuta onLogin si se provee para actualizar el estado global/rutas.
   * Muestra errores claros en caso de fallo de autenticación.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiBackend.post("/auth/login", {
        username: usuario,
        password: clave
      });
      // Log de diagnóstico: respuesta completa del backend tras login

      // Compatibilidad: acepta refreshToken o refresh_token según lo que envíe el backend
      const { token, refreshToken, refresh_token, usuario: usuarioData } = res.data;

      // Usa el valor que no sea undefined
      const rt = refreshToken || refresh_token;
      
      // Cargar accesos del usuario para control de permisos
      let accesos = [];
      try {
        console.log('🔄 Cargando accesos para usuario ID:', usuarioData.id);
        // Pasar el token recién obtenido para autenticar la petición
        accesos = await getAccesosPorUsuario(usuarioData.id, token);
        console.log('✅ Accesos cargados:', accesos.length, 'accesos');
        console.log('Detalle accesos:', accesos);
      } catch (accesosErr) {
        console.error('❌ Error al cargar accesos del usuario:', accesosErr);
        console.error('Detalle del error:', accesosErr.response?.data || accesosErr.message);
        // No bloqueamos el login si falla la carga de accesos
      }
      
      // Guardar usuario, tokens y accesos en el store
      console.log('💾 Guardando en store - Usuario:', usuarioData.username, 'Accesos:', accesos.length);
      loginStore.login(usuarioData, token, rt, accesos);
      
      setLoading(false);
      onLogin && onLogin({ token, refreshToken, usuario: usuarioData });
    } catch (err) {
      setLoading(false);
      // Muestra el error de login como Toast visual
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de autenticación',
          detail: err.response?.data?.message || 'Usuario o contraseña incorrectos',
          life: 5000
        });
      }
      setError(err.response?.data?.message || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "var(--background-color)" }}>
      {/* Toast global para notificaciones visuales tipo pop-up */}
      <Toast ref={toast} position="top-center" />
      <Card style={{ width: 400, margin: "0 auto", marginTop: 40, background: "#fff", boxShadow: "0 2px 8px #00305722" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <img src={logotipoMegui} alt="Logo Megui" style={{ height: 80, marginBottom: 8 }} />
          <h2 style={{ margin: 0, color: "var(--primary-color)", fontWeight: 800 }}>ERP MEGUI</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <span className="p-float-label" style={{ marginBottom: 16, display: "block" }}>
            <InputText id="usuario" value={usuario} onChange={e => setUsuario(e.target.value)} style={{ width: "100%" }} />
            <label htmlFor="usuario">Usuario</label>
          </span>
          <span className="p-float-label" style={{ marginBottom: 16, display: "block" }}>
            <Password id="clave" value={clave} onChange={e => setClave(e.target.value)} toggleMask feedback={false} style={{ width: "100%" }} inputStyle={{ width: "100%" }} />
            <label htmlFor="clave">Contraseña</label>
          </span>
          {/* El error de login ahora se muestra como Toast visual, no como mensaje en línea */}
          <Button label={loading ? "Ingresando..." : "Ingresar"} icon="pi pi-sign-in" type="submit" loading={loading} style={{ width: "100%", fontWeight: 700, marginBottom: 12 }} />
        </form>
        {/* Botón Salir visible debajo del formulario */}
        <Button
          label="Salir de la aplicación"
          icon="pi pi-power-off"
          className="p-button-text p-button-danger"
          style={{ width: "100%", fontWeight: 700, marginTop: 8 }}
          // Botón para cerrar completamente la sesión desde la pantalla de login.
          // Limpia el estado y storage de sesión usando el método logout del store Zustand.
          onClick={() => {
            loginStore.logout();
            window.location.reload();
          }}
        />
      </Card>
    </div>
  );
}
