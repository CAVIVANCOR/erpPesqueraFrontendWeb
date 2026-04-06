import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getPlanCuentasContable } from '../../api/contabilidad/planCuentasContable';
import { formatearNumero } from '../../utils/utils';

/**
 * Componente para editar asientos contables antes de guardarlos
 * Permite al usuario modificar las cuentas contables sugeridas automáticamente
 * 
 * @param {Object} props
 * @param {Object} props.borradorAsiento - Borrador del asiento generado automáticamente
 * @param {Function} props.onGuardar - Callback cuando se guarda el asiento
 * @param {Function} props.onCancelar - Callback cuando se cancela
 * @param {boolean} props.loading - Estado de carga
 */
const AsientoContableEditor = ({
  borradorAsiento,
  onGuardar,
  onCancelar,
  loading = false
}) => {
  const [asiento, setAsiento] = useState(null);
  const [cuentasContables, setCuentasContables] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(true);
  const [totalDebe, setTotalDebe] = useState(0);
  const [totalHaber, setTotalHaber] = useState(0);
  const [estaCuadrado, setEstaCuadrado] = useState(false);
  
  // Obtener símbolo de moneda del asiento
  const simboloMoneda = asiento?.moneda?.simbolo || asiento?.moneda?.codigo || 'S/.';

  useEffect(() => {
    if (borradorAsiento) {
      setAsiento({ ...borradorAsiento });
      calcularTotales(borradorAsiento.detalles);
    }
  }, [borradorAsiento]);

  useEffect(() => {
    cargarCuentasContables();
  }, []);

  const cargarCuentasContables = async () => {
    try {
      setLoadingCuentas(true);
      const cuentas = await getPlanCuentasContable();
      setCuentasContables(cuentas.map(c => ({
        label: `${c.codigoCuenta} - ${c.nombreCuenta}`,
        value: c.id,
        codigoCuenta: c.codigoCuenta,
        nombreCuenta: c.nombreCuenta
      })));
    } catch (error) {
      console.error('Error al cargar cuentas contables:', error);
    } finally {
      setLoadingCuentas(false);
    }
  };

  const calcularTotales = (detalles) => {
    const debe = detalles.reduce((sum, d) => sum + Number(d.debe || 0), 0);
    const haber = detalles.reduce((sum, d) => sum + Number(d.haber || 0), 0);
    setTotalDebe(debe);
    setTotalHaber(haber);
    setEstaCuadrado(Math.abs(debe - haber) < 0.01);
  };

  const actualizarCuenta = (index, planCuentaId) => {
    const cuenta = cuentasContables.find(c => c.value === planCuentaId);
    if (!cuenta) return;

    const nuevosDetalles = [...asiento.detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      planCuentaId: cuenta.value,
      codigoCuenta: cuenta.codigoCuenta,
      nombreCuenta: cuenta.nombreCuenta
    };

    setAsiento({ ...asiento, detalles: nuevosDetalles });
  };

  const actualizarGlosa = (index, glosa) => {
    const nuevosDetalles = [...asiento.detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      glosa
    };
    setAsiento({ ...asiento, detalles: nuevosDetalles });
  };

  const actualizarGlosaGeneral = (glosa) => {
    setAsiento({ ...asiento, glosa });
  };

  const handleGuardar = () => {
    if (!estaCuadrado) {
      return;
    }
    onGuardar(asiento);
  };

  if (!asiento || loadingCuentas) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  const detallesDebe = asiento.detalles.filter(d => Number(d.debe) > 0);
  const detallesHaber = asiento.detalles.filter(d => Number(d.haber) > 0);

  return (
    <Card className="asiento-contable-editor">
      {/* Encabezado */}
      <div className="mb-4 pb-3" style={{ borderBottom: '2px solid #dee2e6' }}>
        <h3 className="m-0 mb-3" style={{ color: '#495057' }}>
          Editar Asiento Contable
        </h3>
        <div className="mb-3">
          <label htmlFor="glosaGeneral" className="font-bold mb-2 block">
            Glosa General:
          </label>
          <InputText
            id="glosaGeneral"
            value={asiento.glosa}
            onChange={(e) => actualizarGlosaGeneral(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Tag value="BORRADOR" severity="warning" />
          <Tag value={asiento.tipoLibro} severity={asiento.tipoLibro === 'FISCAL' ? 'info' : 'secondary'} />
          <Tag 
            value={estaCuadrado ? 'CUADRADO' : 'DESCUADRADO'} 
            severity={estaCuadrado ? 'success' : 'danger'}
          />
        </div>
      </div>

      {!estaCuadrado && (
        <Message 
          severity="error" 
          text={`El asiento debe estar cuadrado. Diferencia: ${simboloMoneda} ${Math.abs(totalDebe - totalHaber).toFixed(2)}`}
          className="mb-3"
        />
      )}

      {/* Visualización en forma de T EDITABLE */}
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
            <div style={{ padding: '16px', minHeight: '300px' }}>
              {detallesDebe.map((detalle, index) => {
                const detalleIndex = asiento.detalles.findIndex(d => d.numeroLinea === detalle.numeroLinea);
                return (
                  <div 
                    key={detalle.numeroLinea}
                    className="mb-3"
                    style={{ 
                      borderBottom: index < detallesDebe.length - 1 ? '1px solid #dee2e6' : 'none',
                      paddingBottom: index < detallesDebe.length - 1 ? '12px' : '0'
                    }}
                  >
                    {/* Cuenta Contable */}
                    <Dropdown
                      value={detalle.planCuentaId}
                      options={cuentasContables}
                      onChange={(e) => actualizarCuenta(detalleIndex, e.value)}
                      filter
                      filterBy="label"
                      placeholder="Seleccionar cuenta"
                      className="w-full mb-2"
                      showClear
                      style={{ fontWeight: '600', fontSize: '0.95rem' }}
                    />
                    
                    {/* Glosa */}
                    <InputText
                      value={detalle.glosa}
                      onChange={(e) => actualizarGlosa(detalleIndex, e.target.value)}
                      className="w-full mb-2"
                      placeholder="Glosa del movimiento"
                      style={{ fontSize: '0.9rem', color: '#666' }}
                    />
                    
                    {/* Monto */}
                    <InputNumber
                      value={detalle.debe}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      disabled
                      className="w-full"
                      inputStyle={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        color: '#2196F3',
                        backgroundColor: '#E3F2FD',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                );
              })}
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
            <div style={{ padding: '16px', minHeight: '300px' }}>
              {detallesHaber.map((detalle, index) => {
                const detalleIndex = asiento.detalles.findIndex(d => d.numeroLinea === detalle.numeroLinea);
                return (
                  <div 
                    key={detalle.numeroLinea}
                    className="mb-3"
                    style={{ 
                      borderBottom: index < detallesHaber.length - 1 ? '1px solid #dee2e6' : 'none',
                      paddingBottom: index < detallesHaber.length - 1 ? '12px' : '0'
                    }}
                  >
                    {/* Cuenta Contable */}
                    <Dropdown
                      value={detalle.planCuentaId}
                      options={cuentasContables}
                      onChange={(e) => actualizarCuenta(detalleIndex, e.value)}
                      filter
                      filterBy="label"
                      placeholder="Seleccionar cuenta"
                      className="w-full mb-2"
                      showClear
                      style={{ fontWeight: '600', fontSize: '0.95rem' }}
                    />
                    
                    {/* Glosa */}
                    <InputText
                      value={detalle.glosa}
                      onChange={(e) => actualizarGlosa(detalleIndex, e.target.value)}
                      className="w-full mb-2"
                      placeholder="Glosa del movimiento"
                      style={{ fontSize: '0.9rem', color: '#666' }}
                    />
                    
                    {/* Monto */}
                    <InputNumber
                      value={detalle.haber}
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      disabled
                      className="w-full"
                      inputStyle={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        color: '#4CAF50',
                        backgroundColor: '#E8F5E9',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                );
              })}
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

      {/* Botones de acción */}
      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          label="GUARDAR ASIENTO"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleGuardar}
          disabled={!estaCuadrado || loading}
          loading={loading}
        />
      </div>
    </Card>
  );
};

export default AsientoContableEditor;
