import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

/**
 * Componente genérico para visualizar PDFs temporales
 * @param {boolean} visible - Controla la visibilidad del dialog
 * @param {function} onHide - Callback al cerrar el dialog
 * @param {function} generatePDF - Función que genera el PDF (debe retornar un Blob)
 * @param {object} data - Datos para generar el reporte
 * @param {string} fileName - Nombre del archivo para descarga
 * @param {string} title - Título del dialog
 */
const TemporaryPDFViewer = ({
  visible,
  onHide,
  generatePDF,
  data,
  fileName = 'reporte.pdf',
  title = 'Reporte PDF'
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let blobUrl = null;

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generar PDF usando la función proporcionada
        const pdfBlob = await generatePDF(data);
        
        // Crear URL temporal del blob
        blobUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(blobUrl);
      } catch (err) {
        console.error('Error generando PDF:', err);
        setError(err.message || 'Error al generar el PDF');
      } finally {
        setLoading(false);
      }
    };

    generate();

    // Cleanup: Revocar URL al desmontar o cerrar
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        console.log('✅ PDF temporal eliminado');
      }
      setPdfUrl(null);
    };
  }, [visible, data, generatePDF]);

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-viewer-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setPdfUrl(null);
    setError(null);
    onHide();
  };

  const footerContent = (
    <div className="flex gap-2">
      <Button
        label="Imprimir"
        icon="pi pi-print"
        onClick={handlePrint}
        className="p-button-outlined"
        disabled={!pdfUrl || loading}
      />
      <Button
        label="Descargar"
        icon="pi pi-download"
        onClick={handleDownload}
        className="p-button-outlined p-button-success"
        disabled={!pdfUrl || loading}
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-outlined p-button-secondary"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={title}
      footer={footerContent}
      maximizable
      style={{ width: '90vw', height: '90vh' }}
      contentStyle={{ height: 'calc(90vh - 150px)' }}
    >
      {loading && (
        <div 
          className="flex flex-column justify-content-center align-items-center" 
          style={{ height: '100%' }}
        >
          <ProgressSpinner />
          <p className="mt-3 text-600">Generando reporte PDF...</p>
        </div>
      )}

      {error && !loading && (
        <Message 
          severity="error" 
          text={`Error: ${error}`}
          style={{ width: '100%' }}
        />
      )}

      {!loading && !error && pdfUrl && (
        <iframe
          id="pdf-viewer-iframe"
          src={pdfUrl}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            borderRadius: '6px'
          }}
          title="PDF Viewer"
        />
      )}

      {!loading && !error && !pdfUrl && (
        <div className="text-center p-5">
          <i className="pi pi-file-pdf" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <p className="mt-3 text-600">No hay PDF para mostrar</p>
        </div>
      )}
    </Dialog>
  );
};

export default TemporaryPDFViewer;