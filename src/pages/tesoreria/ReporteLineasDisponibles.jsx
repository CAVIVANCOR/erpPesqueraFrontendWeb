// src/pages/tesoreria/ReporteLineasDisponibles.jsx
import React from 'react';
import ReporteLineasDisponibles from '../../components/tesoreria/ReporteLineasDisponibles';

/**
 * Página wrapper para el Reporte de Líneas de Crédito Disponibles
 */
export default function ReporteLineasDisponiblesPage() {
  return (
    <div className="p-4">
      <div className="card">
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '8px 8px 0 0',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <i className="pi pi-chart-bar" style={{ marginRight: '0.5rem' }}></i>
            Reporte de Líneas de Crédito Disponibles
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
            Visualiza el estado y disponibilidad de las líneas de crédito por empresa
          </p>
        </div>
        
        <ReporteLineasDisponibles />
      </div>
    </div>
  );
}
