import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';

/**
 * Componente para visualizar PDFs protegidos con autenticación JWT
 * @param {string} urlDocumento - URL del documento PDF a mostrar
 */
const PDFViewer = ({ urlDocumento }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!urlDocumento) {
      setLoading(false);
      return;
    }

    const cargarPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construir URL completa si es relativa
        let urlCompleta;

        // Convertir URLs antiguas al formato correcto
        if (urlDocumento.startsWith('/uploads/documentos-visitantes/')) {
          // Formato antiguo: /uploads/documentos-visitantes/2025/07/archivo.pdf
          // Convertir a: /documentos-visitantes/archivo/2025/07/archivo.pdf (sin /api/ porque VITE_API_URL ya lo incluye)
          const rutaArchivo = urlDocumento.replace('/uploads/documentos-visitantes/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/documentos-visitantes/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/api/')) {
          // Remover /api/ del inicio porque VITE_API_URL ya lo incluye
          const rutaSinApi = urlDocumento.substring(4); // Quitar '/api'
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
        const response = await fetch(urlCompleta, {
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

    // Cleanup: liberar URL del blob cuando el componente se desmonte
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [urlDocumento]);

  // Cleanup adicional cuando cambia pdfUrl
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '600px' }}>
        <div className="text-center">
          <ProgressSpinner size="50" strokeWidth="4" />
          <p className="mt-3 text-600">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '600px' }}>
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3 text-600">Error al cargar el documento</p>
          <p className="text-sm text-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '600px' }}>
        <div className="text-center">
          <i className="pi pi-file-pdf text-gray-400" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3 text-600">No hay documento para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        width="100%"
        height="600px"
        style={{ 
          border: "none", 
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        title="Documento del Visitante"
        onLoad={() => {
          console.log('✅ PDF cargado correctamente en iframe');
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
