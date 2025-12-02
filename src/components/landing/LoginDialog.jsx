// src/components/landing/LoginDialog.jsx
import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import './LoginDialog.css';

const LoginDialog = ({ visible, onHide, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Llamar a la función onLogin del padre con las credenciales
      await onLogin({ username, password });
      
      // Limpiar campos después del login exitoso
      setUsername('');
      setPassword('');
    } catch (error) {
      // El error ya se maneja en el componente padre con Toast
      console.error('Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      closable={false}
      className="login-dialog-spectacular"
      style={{ width: '500px' }}
      showHeader={false}
    >
      <div className="login-spectacular-container">
        {/* Fondo animado con partículas */}
        <div className="login-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* Contenido del login */}
        <div className="login-content">
          {/* Icono central animado */}
          <div className="login-icon-container">
            <div className="login-icon-circle">
              <i className="pi pi-lock" />
            </div>
            <div className="login-icon-ring"></div>
            <div className="login-icon-ring-2"></div>
          </div>

          {/* Título */}
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form-spectacular">
            {/* Campo Usuario */}
            <div className="login-field">
              <div className="login-field-icon">
                <i className="pi pi-user" />
              </div>
              <InputText
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="login-input"
                autoFocus
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div className="login-field">
              <div className="login-field-icon">
                <i className="pi pi-key" />
              </div>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="login-input"
                feedback={false}
                toggleMask
                required
              />
            </div>

            {/* Botón de ingreso */}
            <Button
              type="submit"
              label="INGRESAR"
              icon="pi pi-sign-in"
              className="login-button-spectacular"
              loading={loading}
              disabled={loading}
            />

            {/* Botón cancelar */}
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="login-button-cancel"
              onClick={onHide}
              outlined
              disabled={loading}
            />
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default LoginDialog;