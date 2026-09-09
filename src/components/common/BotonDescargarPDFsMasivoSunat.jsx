import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Panel } from 'primereact/panel';
import * as sireAPI from '../../api/sire';

/**
 * Componente genérico para descarga masiva de PDFs desde SUNAT
 * Reutilizable en Compras, Ventas y cualquier módulo
 * 
 * PATRÓN: Replica la lógica de BotonDescargarPDFSunat.jsx pero para múltiples documentos
 */
export default function BotonDescargarPDFsMasivoSunat({
  documentosSeleccionados = [],
  onComplete,
  onError,
  disabled = false,
  label = "PDFs Masivo",
  icon = "pi pi-file-pdf",
  className = "p-button-warning",
  tooltip,
  toast: toastPadre
}) {
  const toastLocal = useRef(null);
  const toast = toastPadre || toastLocal;

  const [showDialog, setShowDialog] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState({
    total: 0,
    procesados: 0,
    exitosos: 0,
    errores: 0,
    log: []
  });

  const handleDescargarMasivo = async () => {
    try {
      if (!documentosSeleccionados || documentosSeleccionados.length === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Debe seleccionar al menos un documento para generar PDFs',
          life: 3000
        });
        return;
      }

      setProgreso({
        total: documentosSeleccionados.length,
        procesados: 0,
        exitosos: 0,
        errores: 0,
        log: []
      });
      setShowDialog(true);
      setProcesando(true);

      let exitosos = 0;
      let errores = 0;
      const resultados = [];

      for (let i = 0; i < documentosSeleccionados.length; i++) {
        const doc = documentosSeleccionados[i];
        const numeroActual = i + 1;

        try {
          setProgreso(prev => ({
            ...prev,
            log: [...prev.log, {
              tipo: 'info',
              mensaje: `[${numeroActual}/${documentosSeleccionados.length}] Procesando ${doc.serie}-${doc.numero}...`,
              timestamp: new Date().toLocaleTimeString()
            }]
          }));

          if (!doc.empresaId || !doc.rucEmisorReceptor || !doc.tipoDocCodigo || !doc.serie || !doc.numero || !doc.fechaEmision || !doc.id) {
            throw new Error('Faltan datos requeridos del documento');
          }

          // PATRÓN: Replica construcción de CAR de BotonDescargarPDFSunat.jsx
          const ruc = String(doc.rucEmisorReceptor).padStart(11, '0');
          const tipo = String(doc.tipoDocCodigo).padStart(2, '0');
          const serieFormateada = String(doc.serie).padStart(4, '0');
          const numeroFormateado = String(doc.numero).padStart(10, '0');
          const car = `${ruc}${tipo}${serieFormateada}${numeroFormateado}`;

          const fecha = new Date(doc.fechaEmision);
          const periodo = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;

          let resultado;
          
          // PATRÓN: Replica llamada API de BotonDescargarPDFSunat.jsx
          if (doc.moduloDestino === 'orden-compra') {
            resultado = await sireAPI.descargarPDFParaOrdenCompra(doc.empresaId, periodo, car, doc.id);
          } else {
            throw new Error('Módulo no soportado');
          }

          if (resultado.success) {
            exitosos++;
            resultados.push({ ...doc, success: true, pdfUrl: resultado.pdfUrl });

            setProgreso(prev => ({
              ...prev,
              procesados: numeroActual,
              exitosos: exitosos,
              log: [...prev.log, {
                tipo: 'success',
                mensaje: `✓ PDF generado exitosamente`,
                timestamp: new Date().toLocaleTimeString()
              }]
            }));
          } else {
            errores++;
            resultados.push({ ...doc, success: false, error: resultado.mensaje });

            setProgreso(prev => ({
              ...prev,
              procesados: numeroActual,
              errores: errores,
              log: [...prev.log, {
                tipo: 'error',
                mensaje: `✗ Error: ${resultado.mensaje}`,
                timestamp: new Date().toLocaleTimeString()
              }]
            }));
          }

        } catch (error) {
          errores++;
          resultados.push({ ...doc, success: false, error: error.message });

          setProgreso(prev => ({
            ...prev,
            procesados: numeroActual,
            errores: errores,
            log: [...prev.log, {
              tipo: 'error',
              mensaje: `✗ Excepción: ${error.message}`,
              timestamp: new Date().toLocaleTimeString()
            }]
          }));
        }
      }

      setProgreso(prev => ({
        ...prev,
        log: [...prev.log, {
          tipo: exitosos === documentosSeleccionados.length ? 'success' : 'warn',
          mensaje: `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROCESO COMPLETADO\n✓ Exitosos: ${exitosos}\n✗ Errores: ${errores}\nTotal procesados: ${documentosSeleccionados.length}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          timestamp: new Date().toLocaleTimeString()
        }]
      }));

      toast.current?.show({
        severity: errores === 0 ? 'success' : 'warn',
        summary: errores === 0 ? 'Éxito Total' : 'Completado con errores',
        detail: `${exitosos} PDFs generados, ${errores} errores`,
        life: 5000
      });

      if (onComplete) {
        onComplete({ exitosos, errores, resultados });
      }

    } catch (error) {
      console.error('Error en proceso masivo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error en proceso masivo',
        life: 5000
      });
      if (onError) {
        onError(error.message);
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <Button
        label={label}
        icon={icon}
        className={className}
        onClick={handleDescargarMasivo}
        disabled={disabled || procesando || documentosSeleccionados.length === 0}
        loading={procesando}
        tooltip={tooltip || `Generar PDFs de ${documentosSeleccionados.length} documentos seleccionados`}
        style={{ width: '100%' }}
      />

      <Dialog
        visible={showDialog}
        onHide={() => !procesando && setShowDialog(false)}
        header="Generación Masiva de PDFs desde SUNAT"
        style={{ width: '70vw', maxWidth: '900px' }}
        modal
        closable={!procesando}
        closeOnEscape={!procesando}
      >
        <div className="mb-3">
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="font-semibold">Progreso: {progreso.procesados} / {progreso.total}</span>
            <span className="text-sm text-600">
              <i className="pi pi-check-circle text-green-500 mr-1"></i>
              {progreso.exitosos} exitosos
              <i className="pi pi-times-circle text-red-500 ml-3 mr-1"></i>
              {progreso.errores} errores
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${(progreso.procesados / progreso.total) * 100}%`,
              height: '100%',
              backgroundColor: progreso.errores === 0 ? '#22c55e' : '#f59e0b',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}>
              {progreso.total > 0 ? Math.round((progreso.procesados / progreso.total) * 100) : 0}%
            </div>
          </div>
        </div>

        <Panel header="Registro de Operaciones" className="mb-3">
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {progreso.log.map((entrada, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '0.5rem',
                  color: entrada.tipo === 'success' ? '#4ade80' :
                         entrada.tipo === 'error' ? '#f87171' :
                         entrada.tipo === 'warn' ? '#fbbf24' :
                         '#d4d4d4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>
                  [{entrada.timestamp}]
                </span>
                {entrada.mensaje}
              </div>
            ))}
            {progreso.log.length === 0 && (
              <div style={{ color: '#9ca3af', textAlign: 'center' }}>
                Esperando inicio del proceso...
              </div>
            )}
          </div>
        </Panel>

        <div className="flex justify-content-end gap-2">
          <Button
            label="Cerrar"
            icon="pi pi-times"
            onClick={() => setShowDialog(false)}
            className="p-button-secondary"
            disabled={procesando}
          />
        </div>
      </Dialog>
    </>
  );
}