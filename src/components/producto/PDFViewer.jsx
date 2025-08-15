/**
 * PDFViewer.jsx - Componente específico para productos
 *
 * Componente para visualizar PDFs de fichas técnicas de productos con autenticación JWT.
 * Maneja únicamente URLs de fichas técnicas sin mezclar lógica de otros módulos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../shared/stores/useAuthStore';

/**
 * Componente para visualizar PDFs de fichas técnicas protegidos con autenticación JWT
 * @param {string} urlDocumento - URL del documento PDF a mostrar
 */
const PDFViewer = ({ urlDocumento }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!urlDocumento) {
      setLoading(false);
      setPdfUrl(null);
      return;
    }

    const cargarPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Limpiar PDF anterior para forzar actualización
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }

        // Construir URL completa para fichas técnicas
        let urlCompleta;

        if (urlDocumento.startsWith('/uploads/fichas-tecnicas/')) {
          // Formato fichas técnicas: /uploads/fichas-tecnicas/ficha-tecnica-123.pdf
          // Convertir a: /producto-ficha-tecnica/archivo/ficha-tecnica-123.pdf
          const rutaArchivo = urlDocumento.replace('/uploads/fichas-tecnicas/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/producto-ficha-tecnica/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/api/')) {
          // Remover /api/ del inicio porque VITE_API_URL ya lo incluye
          const rutaSinApi = urlDocumento.substring(4);
          urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
        } else if (urlDocumento.startsWith('/')) {
          // Ruta relativa sin /api/
          urlCompleta = `${import.meta.env.VITE_API_URL}${urlDocumento}`;
        } else {
          // URL absoluta
          urlCompleta = urlDocumento;
        }

        // Obtener token JWT
        const token = useAuthStore.getState().token;
        
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        // Realizar petición con autenticación
        const response = await fetch(`${urlCompleta}?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/pdf'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Convertir respuesta a blob
        const blob = await response.blob();
        
        // Crear URL del blob para el iframe
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);

      } catch (error) {
        console.error('Error cargando PDF:', error);
        setError(error.message || 'Error al cargar el documento');
      } finally {
        setLoading(false);
      }
    };

    cargarPDF();

    // Cleanup: revocar URL del blob cuando el componente se desmonte
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [urlDocumento, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-4">
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        <span className="ml-2">Cargando ficha técnica...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4" style={{ backgroundColor: '#fee', borderRadius: '6px' }}>
        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }}></i>
        <p className="text-red-600 mt-2 mb-0">Error al cargar la ficha técnica</p>
        <small className="text-red-500">{error}</small>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="text-center p-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <i className="pi pi-file-pdf text-gray-400" style={{ fontSize: '2rem' }}></i>
        <p className="text-600 mt-2 mb-0">No hay ficha técnica disponible</p>
      </div>
    );
  }

  return (
    <div key={refreshKey}>
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        width="100%"
        height="600px"
        style={{ 
          border: "none", 
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        title="Ficha Técnica PDF"
        onLoad={() => {
        }}
        onError={() => {
          console.error('❌ Error mostrando PDF en iframe');
          setError('Error al mostrar el documento en el navegador');
        }}
      />
    </div>
  );
};

export default PDFViewer;
