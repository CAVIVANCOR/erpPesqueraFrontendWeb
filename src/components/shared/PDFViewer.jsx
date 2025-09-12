import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { ProgressSpinner } from 'primereact/progressspinner';

/**
 * Componente genérico para visualizar PDFs protegidos con autenticación JWT
 * @param {string} urlDocumento - URL del documento PDF a mostrar
 * @param {string} tipoDocumento - Tipo de documento para construcción de URL (opcional)
 */
const PDFViewer = ({ urlDocumento, tipoDocumento = "documentos-visitantes" }) => {
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

        // Construcción de URL basada en el tipo de documento
        if (urlDocumento.startsWith(`/uploads/${tipoDocumento}/`)) {
          const rutaArchivo = urlDocumento.replace(`/uploads/${tipoDocumento}/`, '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/${tipoDocumento}/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/uploads/documentos-visitantes/')) {
          // Mantener compatibilidad con formato antiguo
          const rutaArchivo = urlDocumento.replace('/uploads/documentos-visitantes/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/documentos-visitantes/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/uploads/confirmaciones-acciones-previas/')) {
          // Soporte para confirmaciones de acciones previas
          const rutaArchivo = urlDocumento.replace('/uploads/confirmaciones-acciones-previas/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/confirmaciones-acciones-previas/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/uploads/documentacion-personal/')) {
          // Soporte para documentación personal
          const rutaArchivo = urlDocumento.replace('/uploads/documentacion-personal/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/documentacion-personal/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith('/uploads/documentacion-embarcacion/')) {
          // Soporte para documentación de embarcación
          const rutaArchivo = urlDocumento.replace('/uploads/documentacion-embarcacion/', '');
          urlCompleta = `${import.meta.env.VITE_API_URL}/pesca/documentaciones-embarcacion/archivo/${rutaArchivo}`;
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
  }, [urlDocumento, tipoDocumento]);

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
        title="Documento PDF"
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
