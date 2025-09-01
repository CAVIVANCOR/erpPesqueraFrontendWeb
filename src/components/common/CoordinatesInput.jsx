/**
 * CoordinatesInput.jsx - Versión de prueba simplificada
 */

import React from 'react';

export default function CoordinatesInput({ 
  latitud, 
  longitud, 
  onLatitudChange, 
  onLongitudChange, 
  disabled = false 
}) {
  console.log('🔍 CoordinatesInput renderizado:', { latitud, longitud, disabled });
  
  return (
    <div style={{ 
      border: '2px solid blue', 
      padding: '20px', 
      backgroundColor: '#f0f0f0',
      margin: '10px 0'
    }}>
      <h3>📍 Coordenadas GPS (Versión Test)</h3>
      <p>Latitud: {latitud || 'No definida'}</p>
      <p>Longitud: {longitud || 'No definida'}</p>
      <button 
        onClick={() => {
          console.log('Botón test clickeado');
          onLatitudChange(-12.345678);
          onLongitudChange(-77.123456);
        }}
        disabled={disabled}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        Test: Establecer Coordenadas
      </button>
    </div>
  );
}
