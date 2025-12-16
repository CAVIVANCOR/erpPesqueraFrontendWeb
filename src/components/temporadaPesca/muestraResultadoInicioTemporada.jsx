import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

const MuestraResultadoInicioTemporada = ({ visible, onHide, data }) => {
  if (!data) return null;

  return (
    <Dialog
      visible={visible}
      modal
      closable={false}
      showHeader={false}
      onHide={onHide}
      style={{ width: '900px', maxHeight: '90vh' }}
    >
      <div style={{ padding: '0', fontFamily: 'var(--font-family)' }}>
        {/* Header con gradiente verde - compacto */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i 
              className="pi pi-check" 
              style={{ 
                fontSize: '1.75rem', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '1.25rem',
              fontWeight: '600',
              lineHeight: '1.3'
            }}>
              Temporada Iniciada Exitosamente - Operación completada correctamente
            </h2>
          </div>
        </div>

        {/* Contenido con estadísticas en 2 columnas */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            {/* Temporada de Pesca */}
            <div style={{
              background: '#dbeafe',
              border: '2px solid #93c5fd',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-calendar" style={{ 
                  fontSize: '1.5rem', 
                  color: '#3b82f6'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#1e40af',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Temporada de Pesca
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>
                    <strong>Estado:</strong> {data.estadoNuevo}
                    {data.numeroResolucion && (
                      <> | <strong>Res:</strong> {data.numeroResolucion}</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Faena de Pesca */}
            <div style={{
              background: '#dcfce7',
              border: '2px solid #86efac',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-compass" style={{ 
                  fontSize: '1.5rem', 
                  color: '#16a34a'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#15803d',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Faena de Pesca Creada
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: '1.3' }}>
                    <div><strong>ID:</strong> {data.faenaId}</div>
                    {data.embarcacionNombre && (
                      <div><strong>Emb:</strong> {data.embarcacionNombre}</div>
                    )}
                    {data.patronNombre && (
                      <div><strong>Pat:</strong> {data.patronNombre}</div>
                    )}
                    {data.motoristaNombre && (
                      <div><strong>Mot:</strong> {data.motoristaNombre}</div>
                    )}
                    {data.bahiaNombre && (
                      <div><strong>Bah:</strong> {data.bahiaNombre}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tripulantes */}
            <div style={{
              background: '#cffafe',
              border: '2px solid #67e8f9',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-users" style={{ 
                  fontSize: '1.5rem', 
                  color: '#0891b2'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#0e7490',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Tripulantes de Faena
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0891b2' }}>
                        {data.tripulantesRegistrados}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0e7490', marginLeft: '0.3rem' }}>
                        Total
                      </span>
                    </div>
                    {data.tripulantesPorCargo && (
                      <>
                        <div style={{ fontSize: '0.75rem', color: '#0e7490' }}>
                          {data.tripulantesPorCargo.tripulantes} Trip
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0e7490' }}>
                          {data.tripulantesPorCargo.patrones} Pat
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0e7490' }}>
                          {data.tripulantesPorCargo.motoristas} Mot
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Previas */}
            <div style={{
              background: '#fef3c7',
              border: '2px solid #fcd34d',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-list-check" style={{ 
                  fontSize: '1.5rem', 
                  color: '#d97706'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#b45309',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Acciones Previas
                  </div>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d97706' }}>
                      {data.accionesPreviasAsignadas}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#b45309', marginLeft: '0.3rem' }}>
                      Asignadas con responsables
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos Tripulantes */}
            <div style={{
              background: '#fed7aa',
              border: '2px solid #fdba74',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-id-card" style={{ 
                  fontSize: '1.5rem', 
                  color: '#ea580c'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#c2410c',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Docs Tripulantes
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c' }}>
                        {data.docTripulantesTotal}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#c2410c', marginLeft: '0.3rem' }}>
                        Total
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                      ✓ {data.docTripulantesVigentes} Vig
                    </div>
                    {data.docTripulantesVencidos > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                        ⚠ {data.docTripulantesVencidos} Venc
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos Embarcación */}
            <div style={{
              background: '#fce7f3',
              border: '2px solid #f9a8d4',
              borderRadius: '8px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-file" style={{ 
                  fontSize: '1.5rem', 
                  color: '#db2777'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#be185d',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Docs Embarcación
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#db2777' }}>
                        {data.docEmbarcacionTotal}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#be185d', marginLeft: '0.3rem' }}>
                        Total
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                      ✓ {data.docEmbarcacionVigentes} Vig
                    </div>
                    {data.docEmbarcacionVencidos > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                        ⚠ {data.docEmbarcacionVencidos} Venc
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Entrega a Rendir */}
            <div style={{
              background: '#f3e8ff',
              border: '2px solid #c4b5fd',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              gridColumn: 'span 2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-wallet" style={{ 
                  fontSize: '1.5rem', 
                  color: '#7c3aed'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#6d28d9',
                    fontWeight: '600',
                    marginBottom: '0.15rem'
                  }}>
                    Entrega a Rendir
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5b21b6' }}>
                    Registro creado exitosamente
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencias si existen documentos vencidos */}
          {data.tieneAdvertencias && (
            <div style={{
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className="pi pi-exclamation-triangle" style={{ 
                fontSize: '1.25rem', 
                color: '#f59e0b'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold',
                  color: '#92400e',
                  fontSize: '0.875rem',
                  marginBottom: '0.15rem'
                }}>
                  Documentos Vencidos Detectados
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: '#b45309'
                }}>
                  {data.totalDocumentosVencidos} documento(s) vencido(s). Revise antes de continuar.
                </div>
              </div>
              <div style={{
                background: '#f59e0b',
                color: 'white',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {data.totalDocumentosVencidos}
              </div>
            </div>
          )}

          {/* Botón de cerrar */}
          <Button 
            label="Cerrar" 
            icon="pi pi-check"
            onClick={onHide}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default MuestraResultadoInicioTemporada;
