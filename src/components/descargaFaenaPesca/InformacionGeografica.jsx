// src/components/descargaFaenaPesca/InformacionGeografica.jsx
// Componente para mostrar información geográfica de coordenadas GPS
// Documentado en español

import React from 'react';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';

/**
 * Componente InformacionGeografica
 * 
 * Muestra información geográfica completa obtenida del análisis de coordenadas GPS
 * 
 * Props:
 * - data: Objeto con información geográfica (ubicacion, distancias, informacionMaritima)
 * - loading: Boolean indicando si está cargando
 * - error: String con mensaje de error (opcional)
 */
export default function InformacionGeografica({ data, loading, error }) {
  
  // Si está cargando
  if (loading) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <p style={{ marginTop: '1rem', color: '#6c757d' }}>
            Analizando coordenadas...
          </p>
        </div>
      </Panel>
    );
  }

  // Si hay error
  if (error) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
          <p style={{ marginTop: '0.5rem', color: '#dc2626' }}>
            {error}
          </p>
        </div>
      </Panel>
    );
  }

  // Si no hay datos
  if (!data) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: 'center', padding: '1rem', color: '#6c757d' }}>
          <i className="pi pi-info-circle" style={{ fontSize: '2rem' }}></i>
          <p style={{ marginTop: '0.5rem' }}>
            Capture las coordenadas GPS para ver la información geográfica
          </p>
        </div>
      </Panel>
    );
  }

  // Función para obtener color del Tag según clasificación de aguas
  const getClasificacionAguasColor = (clasificacion) => {
    if (clasificacion.includes('Territoriales')) return 'danger';
    if (clasificacion.includes('Económica')) return 'success';
    return 'info';
  };

  return (
    <Panel 
      header="📍 Información Geográfica y Marítima" 
      className="mb-3"
      toggleable
      collapsed={false}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        
        {/* SECCIÓN 1: UBICACIÓN */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="pi pi-map" style={{ color: '#3b82f6' }}></i>
            Ubicación Geográfica
          </h4>
          
          <div style={{ fontSize: '12px' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Ciudad:</strong> {data.ubicacion?.ciudad || 'N/A'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Provincia:</strong> {data.ubicacion?.provincia || 'N/A'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Departamento:</strong> {data.ubicacion?.departamento || 'N/A'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Cuerpo de Agua:</strong> {data.ubicacion?.cuerpoAgua || 'N/A'}
            </div>
            <Divider style={{ margin: '0.5rem 0' }} />
            <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
              {data.ubicacion?.direccionCompleta || 'N/A'}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DISTANCIAS */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="pi pi-compass" style={{ color: '#10b981' }}></i>
            Distancias
          </h4>
          
          <div style={{ fontSize: '12px' }}>
            {/* Distancia a la costa */}
            <div style={{ 
              marginBottom: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#ecfdf5',
              borderRadius: '4px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#065f46' }}>
                📏 A la Costa
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{data.distancias?.aCosta?.distanciaKm?.toFixed(2) || '0.00'} km</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>
                  {data.distancias?.aCosta?.distanciaMillasNauticas?.toFixed(2) || '0.00'} MN
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '0.25rem' }}>
                Punto más cercano: {data.distancias?.aCosta?.puntoCosteroMasCercano || 'N/A'}
              </div>
            </div>

            {/* Puerto más cercano */}
            <div style={{ 
              marginBottom: '0.75rem',
              padding: '0.5rem',
              backgroundColor: '#eff6ff',
              borderRadius: '4px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#1e40af' }}>
                ⚓ Puerto Más Cercano
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                {data.distancias?.aPuertoMasCercano?.nombrePuerto || 'N/A'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>{data.distancias?.aPuertoMasCercano?.km?.toFixed(2) || '0.00'} km</span>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                  {data.distancias?.aPuertoMasCercano?.millasNauticas?.toFixed(2) || '0.00'} MN
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '0.25rem' }}>
                {data.distancias?.aPuertoMasCercano?.zona || 'N/A'} - {data.distancias?.aPuertoMasCercano?.provincia || 'N/A'}
              </div>
            </div>

            {/* Distancia desde puerto de salida */}
            {data.distancias?.desdePuertoSalida && (
              <div style={{ 
                padding: '0.5rem',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#92400e' }}>
                  🚢 Desde Puerto de Salida
                </div>
                <div style={{ marginBottom: '0.25rem', fontSize: '11px' }}>
                  {data.distancias?.desdePuertoSalida?.puertoSalida || 'N/A'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>{data.distancias?.desdePuertoSalida?.distanciaKm?.toFixed(2) || '0.00'} km</span>
                  <span style={{ fontWeight: 'bold', color: '#b45309' }}>
                    {data.distancias?.desdePuertoSalida?.distanciaMillasNauticas?.toFixed(2) || '0.00'} MN
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: INFORMACIÓN MARÍTIMA */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="pi pi-globe" style={{ color: '#8b5cf6' }}></i>
            Información Marítima
          </h4>
          
          <div style={{ fontSize: '12px' }}>
            {/* Zona de Pesca */}
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Zona de Pesca:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                <Tag 
                  value={data.informacionMaritima?.zonaPesca || 'N/A'} 
                  severity="info"
                  style={{ fontSize: '11px' }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '0.25rem' }}>
                {data.informacionMaritima?.region || 'N/A'}
              </div>
            </div>

            {/* Clasificación de Aguas */}
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Clasificación de Aguas:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                <Tag 
                  value={data.informacionMaritima?.clasificacionAguas || 'N/A'} 
                  severity={getClasificacionAguasColor(data.informacionMaritima?.clasificacionAguas || '')}
                  style={{ fontSize: '11px' }}
                />
              </div>
              <div style={{ fontSize: '11px', marginTop: '0.25rem' }}>
                {data.informacionMaritima?.enAguasTerritoriales && (
                  <span style={{ color: '#dc2626' }}>⚠️ Aguas Territoriales (0-12 MN)</span>
                )}
                {!data.informacionMaritima?.enAguasTerritoriales && data.informacionMaritima?.enZEE && (
                  <span style={{ color: '#059669' }}>✓ Zona Económica Exclusiva (12-200 MN)</span>
                )}
                {!data.informacionMaritima?.enZEE && (
                  <span style={{ color: '#3b82f6' }}>🌊 Aguas Internacionales (&gt;200 MN)</span>
                )}
              </div>
            </div>

            {/* Profundidad del Mar */}
            {data.informacionMaritima?.profundidad && data.informacionMaritima.profundidad.profundidadMetros > 0 && (
              <div style={{ 
                padding: '0.5rem',
                backgroundColor: '#dbeafe',
                borderRadius: '4px',
                border: '1px solid #93c5fd'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#1e40af' }}>
                  🌊 Profundidad del Mar
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{data.informacionMaritima.profundidad.profundidadMetros?.toFixed(2) || '0.00'} m</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    {data.informacionMaritima.profundidad.profundidadBrazas?.toFixed(2) || '0.00'} brazas
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  Fuente: {data.informacionMaritima.profundidad.fuente || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 4: COORDENADAS */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1rem',
          backgroundColor: '#f9fafb',
          gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 1'
        }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="pi pi-map-marker" style={{ color: '#ef4444' }}></i>
            Coordenadas GPS
          </h4>
          
          <div style={{ fontSize: '12px' }}>
            <div style={{ 
              padding: '0.5rem',
              backgroundColor: '#fee2e2',
              borderRadius: '4px',
              border: '1px solid #fecaca',
              marginBottom: '0.5rem'
            }}>
              <div style={{ fontWeight: '600', color: '#991b1b' }}>Latitud</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626', fontFamily: 'monospace' }}>
                {data.coordenadas?.latitud?.toFixed(6) || '0.000000'}°
              </div>
            </div>
            
            <div style={{ 
              padding: '0.5rem',
              backgroundColor: '#dbeafe',
              borderRadius: '4px',
              border: '1px solid #93c5fd'
            }}>
              <div style={{ fontWeight: '600', color: '#1e40af' }}>Longitud</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', fontFamily: 'monospace' }}>
                {data.coordenadas?.longitud?.toFixed(6) || '0.000000'}°
              </div>
            </div>
          </div>
        </div>

      </div>
    </Panel>
  );
}
