import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getAsientoContableById } from '../../api/contabilidad/asientoContable';
import { formatearNumero, formatearFecha } from '../../utils/utils';

/**
 * Componente genérico para visualizar asientos contables en forma de T
 * 
 * @param {Object} props
 * @param {BigInt|number} props.asientoContableId - ID del asiento contable a cargar
 * @param {Object} props.asientoData - Datos del asiento contable (opcional, si ya los tienes)
 * @param {boolean} props.showHeader - Mostrar encabezado del asiento (default: true)
 * @param {string} props.className - Clase CSS adicional
 * @param {Object} props.style - Estilos inline adicionales
 */
const AsientoContableViewer = ({
  asientoContableId,
  asientoData,
  showHeader = true,
  className = '',
  style = {}
}) => {
  const [asiento, setAsiento] = useState(asientoData || null);
  const [loading, setLoading] = useState(!asientoData && !!asientoContableId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (asientoData) {
      setAsiento(asientoData);
      setLoading(false);
    } else if (asientoContableId) {
      cargarAsiento();
    }
  }, [asientoContableId, asientoData]);

  const cargarAsiento = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAsientoContableById(asientoContableId);
      setAsiento(data);
    } catch (err) {
      console.error('Error al cargar asiento contable:', err);
      setError('No se pudo cargar el asiento contable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
    return <Message severity="error" text={error} />;
  }

  if (!asiento) {
    return <Message severity="info" text="No hay asiento contable para mostrar" />;
  }

  // Separar detalles en DEBE y HABER
  const detallesDebe = asiento.detalles?.filter(d => Number(d.debe) > 0) || [];
  const detallesHaber = asiento.detalles?.filter(d => Number(d.haber) > 0) || [];

  const totalDebe = Number(asiento.totalDebe || 0);
  const totalHaber = Number(asiento.totalHaber || 0);
  const estaCuadrado = asiento.estaCuadrado || Math.abs(totalDebe - totalHaber) < 0.01;
  
  // Obtener símbolo de moneda del asiento
  const simboloMoneda = asiento.moneda?.simbolo || asiento.moneda?.codigo || 'S/.';

  // Template para mostrar cuenta y monto
  const cuentaTemplate = (rowData, tipo) => {
    const monto = tipo === 'debe' ? Number(rowData.debe) : Number(rowData.haber);
    return (
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
          {rowData.codigoCuenta} - {rowData.nombreCuenta}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '4px' }}>
          {rowData.glosa}
        </div>
        <div style={{ 
          fontSize: '1.1rem', 
          fontWeight: 'bold', 
          marginTop: '8px',
          color: tipo === 'debe' ? '#2196F3' : '#4CAF50'
        }}>
          {simboloMoneda} {formatearNumero(monto, 2)}
        </div>
      </div>
    );
  };

  return (
    <Card 
      className={`asiento-contable-viewer ${className}`}
      style={{ ...style }}
    >
      {showHeader && (
        <div className="mb-1 pb-3" style={{ borderBottom: '2px solid #dee2e6' }}>
          <div className="flex justify-content-between align-items-center">
            <div>
              <h3 className="m-0 mb-1" style={{ color: '#495057' }}>
                {asiento.numeroAsiento}
              </h3>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <strong>Fecha:</strong> {formatearFecha(asiento.fechaAsiento)}
                {' | '}
                <strong>Período:</strong> {asiento.periodoContable?.nombre || 'N/A'}
              </div>
            </div>
            <div className="flex gap-2">
              <Tag 
                value={asiento.origenAsiento} 
                severity={asiento.origenAsiento === 'AUTOMATICO' ? 'success' : 'info'}
              />
              <Tag 
                value={asiento.tipoLibro} 
                severity={asiento.tipoLibro === 'FISCAL' ? 'warning' : 'secondary'}
              />
              <Tag 
                value={estaCuadrado ? 'CUADRADO' : 'DESCUADRADO'} 
                severity={estaCuadrado ? 'success' : 'danger'}
              />
            </div>
          </div>
          {asiento.glosa && (
            <div className="mt-1 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Glosa:</strong> {asiento.glosa}
            </div>
          )}
        </div>
      )}

      {/* VISUALIZACIÓN EN FORMA DE T */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* COLUMNA DEBE */}
        <div>
          <div style={{ 
            border: '2px solid #2196F3', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              backgroundColor: '#2196F3', 
              color: 'white', 
              padding: '12px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              DEBE
            </div>
            <div style={{ padding: '16px', minHeight: '200px' }}>
              {detallesDebe.length > 0 ? (
                detallesDebe.map((detalle, index) => (
                  <div 
                    key={detalle.id || index}
                    className="mb-3 pb-3"
                    style={{ 
                      borderBottom: index < detallesDebe.length - 1 ? '1px solid #dee2e6' : 'none'
                    }}
                  >
                    {cuentaTemplate(detalle, 'debe')}
                  </div>
                ))
              ) : (
                <div className="text-center text-500" style={{ padding: '40px 0' }}>
                  Sin movimientos en el DEBE
                </div>
              )}
            </div>
            <div style={{ 
              backgroundColor: '#E3F2FD', 
              padding: '12px',
              borderTop: '2px solid #2196F3',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#1976D2',
              textAlign: 'right'
            }}>
              TOTAL: {simboloMoneda} {formatearNumero(totalDebe, 2)}
            </div>
          </div>
        </div>

        {/* COLUMNA HABER */}
        <div>
          <div style={{ 
            border: '2px solid #4CAF50', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              padding: '12px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              HABER
            </div>
            <div style={{ padding: '16px', minHeight: '200px' }}>
              {detallesHaber.length > 0 ? (
                detallesHaber.map((detalle, index) => (
                  <div 
                    key={detalle.id || index}
                    className="mb-3 pb-3"
                    style={{ 
                      borderBottom: index < detallesHaber.length - 1 ? '1px solid #dee2e6' : 'none'
                    }}
                  >
                    {cuentaTemplate(detalle, 'haber')}
                  </div>
                ))
              ) : (
                <div className="text-center text-500" style={{ padding: '40px 0' }}>
                  Sin movimientos en el HABER
                </div>
              )}
            </div>
            <div style={{ 
              backgroundColor: '#E8F5E9', 
              padding: '12px',
              borderTop: '2px solid #4CAF50',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#388E3C',
              textAlign: 'right'
            }}>
              TOTAL: {simboloMoneda} {formatearNumero(totalHaber, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* VALIDACIÓN DE CUADRE */}
      {!estaCuadrado && (
        <Message 
          severity="error" 
          text={`Asiento descuadrado. Diferencia: ${simboloMoneda} ${Math.abs(totalDebe - totalHaber).toFixed(2)}`}
          className="mt-3"
        />
      )}
    </Card>
  );
};

export default AsientoContableViewer;
