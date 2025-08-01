// src/components/accesoInstalacion/SalidaDialog.jsx
// Componente para procesar salida de visitantes mediante ID manual o escaneo QR
// Documentado en español técnico.

import React, { useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getAccesoInstalacionById } from '../../api/accesoInstalacion';

/**
 * Componente para procesar salida de visitantes
 * Permite búsqueda por ID manual o escaneo de código QR
 * @param {Function} onClose - Callback para cerrar el diálogo
 * @param {Function} onRegistroEncontrado - Callback cuando se encuentra un registro
 * @param {Object} toast - Referencia al componente Toast para notificaciones
 */
const SalidaDialog = ({ onClose, onRegistroEncontrado, toast }) => {
  const [idBusqueda, setIdBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [modoEscaneo, setModoEscaneo] = useState(false);

  /**
   * Buscar registro por ID
   */
  const buscarRegistro = async (id) => {
    if (!id || id.trim() === '') {
      setError('Ingrese un ID válido');
      return;
    }

    setBuscando(true);
    setError('');

    try {
      const registro = await getAccesoInstalacionById(parseInt(id));
      if (registro) {
        toast.current?.show({
          severity: 'success',
          summary: 'Registro encontrado',
          detail: `Visitante: ${registro.nombrePersona}`,
        });
        
        // Cerrar diálogo y abrir formulario de edición
        onClose();
        onRegistroEncontrado(registro);
      } else {
        setError('No se encontró ningún registro con ese ID');
      }
    } catch (err) {
      console.error('Error buscando registro:', err);
      setError('Error al buscar el registro. Verifique el ID e intente nuevamente.');
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo buscar el registro',
      });
    }

    setBuscando(false);
  };

  /**
   * Manejar búsqueda manual por ID
   */
  const handleBuscarManual = () => {
    buscarRegistro(idBusqueda);
  };

  /**
   * Procesar datos del QR escaneado
   */
  const procesarQR = (qrData) => {
    try {
      const datos = JSON.parse(qrData);
      if (datos.id) {
        setIdBusqueda(datos.id.toString());
        buscarRegistro(datos.id.toString());
      } else {
        setError('El código QR no contiene un ID válido');
      }
    } catch (err) {
      setError('Error al procesar el código QR. Verifique que sea un QR válido del sistema.');
    }
  };

  /**
   * Formatear fecha y hora
   */
  const formatearFechaHora = (fechaHora) => {
    if (!fechaHora) return 'N/A';
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-PE');
  };

  return (
    <div className="p-4">
      {/* Sección de búsqueda */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Buscar Visitante</h3>
        
        {/* Búsqueda manual por ID */}
        <div className="mb-3">
          <label htmlFor="idBusqueda" className="block text-sm font-medium mb-2">
            ID del Acceso
          </label>
          <div className="flex gap-2">
            <InputText
              id="idBusqueda"
              value={idBusqueda}
              onChange={(e) => setIdBusqueda(e.target.value)}
              placeholder="Ingrese el ID (ej: 00000001)"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBuscarManual();
                }
              }}
            />
            <Button
              label="Buscar"
              icon="pi pi-search"
              onClick={handleBuscarManual}
              disabled={buscando}
              className="p-button-primary"
            />
          </div>
        </div>

        <Divider align="center">
          <span className="text-sm text-500">O</span>
        </Divider>

        {/* Botón para escanear QR */}
        <div className="text-center">
          <Button
            label={modoEscaneo ? "Cancelar Escaneo" : "Escanear Código QR"}
            icon={modoEscaneo ? "pi pi-times" : "pi pi-qrcode"}
            onClick={() => setModoEscaneo(!modoEscaneo)}
            className={modoEscaneo ? "p-button-secondary" : "p-button-info"}
            disabled={buscando}
          />
        </div>

        {/* Área de escaneo QR (placeholder por ahora) */}
        {modoEscaneo && (
          <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <i className="pi pi-camera text-4xl text-gray-400 mb-2"></i>
            <p className="text-gray-500">
              Funcionalidad de escaneo QR en desarrollo
            </p>
            <p className="text-sm text-gray-400">
              Por ahora, use la búsqueda manual por ID
            </p>
          </div>
        )}
      </div>

      {/* Spinner de carga */}
      {buscando && (
        <div className="text-center mb-4">
          <ProgressSpinner style={{ width: '30px', height: '30px' }} />
          <p className="text-sm text-gray-500 mt-2">Buscando registro...</p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default SalidaDialog;
