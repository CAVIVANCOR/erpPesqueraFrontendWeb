import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { addLocale } from 'primereact/api';

addLocale('es', {
  firstDayOfWeek: 1,
  dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  monthNames: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ],
  monthNamesShort: [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ],
  today: 'Hoy',
  clear: 'Limpiar'
});
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from 'primereact/toast';
import logotipoMegui from "../assets/Isotipo/Isotipo_Megui_Positivo.png";
import apiBackend from "../api/axios";
import { useAuthStore } from '../shared/stores/useAuthStore';
import { format } from "date-fns";

/**
 * Componente SetupSuperUser
 *
 * Este componente implementa el formulario de configuración inicial del ERP Megui para crear el primer superusuario.
 * Incluye validaciones exhaustivas, integración con PrimeReact para UI, manejo de fechas y lógica de autenticación.
 * Tras crear el superusuario, realiza login automático y actualiza el estado global de sesión usando Zustand.
 *
 * Props:
 * - onSuccess: callback opcional que se ejecuta tras login automático exitoso.
 */
export default function SetupSuperUser({ onSuccess }) {
  // Referencia para el Toast de PrimeReact
  const toast = React.useRef(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [sexo, setSexo] = useState(null); // true = masculino, false = femenino
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * handleSubmit
   *
   * Maneja el envío del formulario para crear el superusuario.
   * Realiza validaciones de todos los campos requeridos, muestra errores claros y realiza las siguientes acciones:
   * 1. Envía los datos al backend para crear el superusuario.
   * 2. Si la creación es exitosa, realiza login automático llamando a la API de autenticación.
   * 3. Al autenticarse, guarda el usuario y token en el store global Zustand (useAuthStore),
   *    asegurando que toda la app reconozca la sesión activa.
   * 4. Llama a onSuccess si se provee, permitiendo que el router o layout principal reaccionen.
   *
   * En caso de error, muestra mensajes específicos para facilitar el diagnóstico al usuario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Validar campos obligatorios
    if (!nombres.trim() || !apellidos.trim() || !correo.trim() || !numeroDocumento.trim() || !fechaNacimiento || sexo === null || !username.trim() || !password || !password2) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'Todos los campos son obligatorios',
          life: 5000
        });
      }
      setError("Todos los campos son obligatorios");
      return;
    }
    // Validar nombres y apellidos no vacíos
    if (nombres.trim().length < 2) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'El campo nombres debe tener al menos 2 caracteres',
          life: 5000
        });
      }
      setError("El campo nombres debe tener al menos 2 caracteres");
      return;
    }
    if (apellidos.trim().length < 2) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'El campo apellidos debe tener al menos 2 caracteres',
          life: 5000
        });
      }
      setError("El campo apellidos debe tener al menos 2 caracteres");
      return;
    }
    // Validar correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'El correo electrónico no es válido',
          life: 5000
        });
      }
      setError("El correo electrónico no es válido");
      return;
    }
    // Validar longitud de contraseña
    if (password.length < 6) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'La contraseña debe tener al menos 6 caracteres',
          life: 5000
        });
      }
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== password2) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: 'Las contraseñas no coinciden',
          life: 5000
        });
      }
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await apiBackend.post("/usuarios/superusuario", {
        nombres,
        apellidos,
        correo,
        numeroDocumento,
        fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : null,
        sexo,
        empresaId: 1,
        username,
        password
      });
      // Login automático tras crear superusuario
      try {
        const loginRes = await apiBackend.post("/auth/login", {
          username,
          password
        });
        const { token, usuario } = loginRes.data;
        const loginStore = useAuthStore.getState();
        loginStore.login(usuario, token);
        setLoading(false);
        onSuccess && onSuccess({ username, password, token, usuario });
      } catch (loginError) {
        setLoading(false);
        if (toast.current) {
          toast.current.show({
            severity: 'error',
            summary: 'Error de login automático',
            detail: loginError.response?.data?.message || loginError.message,
            life: 5000
          });
        }
        setError("Superusuario creado pero error en login automático: " + (loginError.response?.data?.message || loginError.message));
      }
    } catch (err) {
      setLoading(false);
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error del backend',
          detail: err.response?.data?.message || 'Error al crear el superusuario',
          life: 5000
        });
      }
      setError(err.response?.data?.message || "Error al crear el superusuario");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background-color)" }}>
      <Card style={{ width: 400, padding: "2rem 2rem 1.5rem 2rem", borderRadius: 18, boxShadow: "0 6px 32px #00305722" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={logotipoMegui} alt="Logotipo Megui" style={{ height: 64, marginBottom: 8 }} />
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem", color: "var(--primary-color)" }}>Configurar Superusuario</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="nombres" style={{ display: 'block', marginBottom: 4 }}>Nombres</label>
            <InputText id="nombres" value={nombres} onChange={e => setNombres(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="apellidos" style={{ display: 'block', marginBottom: 4 }}>Apellidos</label>
            <InputText id="apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="correo" style={{ display: 'block', marginBottom: 4 }}>Correo electrónico</label>
            <InputText id="correo" value={correo} onChange={e => setCorreo(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="numeroDocumento" style={{ display: 'block', marginBottom: 4 }}>N° Documento</label>
            <InputText id="numeroDocumento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="fechaNacimiento" style={{ display: 'block', marginBottom: 4 }}>Fecha de nacimiento</label>
            <Calendar
              id="fechaNacimiento"
              value={fechaNacimiento}
              onChange={e => setFechaNacimiento(e.value)}
              dateFormat="dd/mm/yy"
              locale="es"
              showIcon
              placeholder="dd/mm/yyyy"
              style={{ width: "100%" }}
              inputStyle={{ width: "100%" }}
              maxDate={new Date()}
              showButtonBar
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sexo" style={{ display: 'block', marginBottom: 4 }}>Sexo</label>
            <select id="sexo" value={sexo === null ? "" : sexo ? "masculino" : "femenino"} onChange={e => setSexo(e.target.value === "masculino" ? true : false)} style={{ width: "100%", minHeight: 38, borderRadius: 4, border: '1px solid var(--surface-border)', padding: '0 8px' }}>
              <option value="">Selecciona sexo</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>Usuario</label>
            <InputText id="username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>Contraseña</label>
            <Password id="password" value={password} onChange={e => setPassword(e.target.value)} toggleMask feedback={false} style={{ width: "100%" }} inputStyle={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="password2" style={{ display: 'block', marginBottom: 4 }}>Repetir contraseña</label>
            <Password id="password2" value={password2} onChange={e => setPassword2(e.target.value)} toggleMask feedback={false} style={{ width: "100%" }} inputStyle={{ width: "100%" }} />
          </div>
          {/* Los errores ahora se muestran como Toast visual, no como mensaje en línea */}
          <Toast ref={toast} position="top-center" />
          <Button label={loading ? "Guardando..." : "Crear Superusuario"} icon="pi pi-user-plus" type="submit" loading={loading} style={{ width: "100%", fontWeight: 700 }} />
        </form>
      </Card>
    </div>
  );
}
