import React from 'react';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

/**
 * Página que se muestra cuando el usuario no tiene acceso a un módulo
 */
export default function SinAcceso() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '100px 20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <i 
        className="pi pi-lock" 
        style={{ 
          fontSize: '6rem', 
          color: '#e74c3c',
          marginBottom: '20px'
        }} 
      />
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
        Acceso Denegado
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
        No tienes permisos para acceder a este módulo.
        <br />
        Contacta al administrador del sistema si necesitas acceso.
      </p>
      <Button 
        label="Volver al Inicio" 
        icon="pi pi-home" 
        onClick={() => navigate('/')} 
        size="large"
      />
    </div>
  );
}