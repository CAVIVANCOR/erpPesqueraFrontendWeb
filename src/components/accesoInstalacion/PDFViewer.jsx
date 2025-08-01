import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { ProgressSpinner } from 'primereact/progressspinner';

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

        console.log('🔍 PDFViewer Debug:');
        console.log('  - URL original:', urlDocumento);
        console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
        console.log('  - URL completa construida:', urlCompleta);

        // Obtener token JWT
        const token = useAuthStore.getState().token;
        
        if (!token) {
          throw new Error('No hay token de autenticación disponible');
        }

        console.log('  - Token disponible:', token ? 'Sí' : 'No');
        console.log('  - Longitud del token:', token?.length || 0);

        // Realizar petición con autenticación
        const response = await fetch(urlCompleta, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/pdf'
          }
        });

        console.log('  - Status de respuesta:', response.status);
        console.log('  - Headers de respuesta:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Token de autenticación inválido o expirado');
          } else if (response.status === 404) {
            throw new Error(`Documento no encontrado en: ${urlCompleta}`);
          } else {
            const errorText = await response.text();
            console.log('  - Error del servidor:', errorText);
            throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
          }
        }

        // Convertir respuesta a blob
        const blob = await response.blob();
        console.log('  - Blob creado:', blob.size, 'bytes, tipo:', blob.type);
        
        // Verificar que sea un PDF válido
        if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
          console.warn('El archivo no parece ser un PDF válido:', blob.type);
        }

        // Crear URL del blob para el iframe
        const blobUrl = window.URL.createObjectURL(blob);
        console.log('  - Blob URL creada:', blobUrl);
        setPdfUrl(blobUrl);

      } catch (err) {
        console.error('❌ Error cargando PDF:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarPDF();

    // Cleanup: revocar URL del blob al desmontar
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [urlDocumento]);

  // Cleanup adicional cuando cambia la URL del PDF
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '600px' }}>
        <div className="text-center">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
          <p className="mt-3 text-600">Cargando documento PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '600px' }}>
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-orange-500" style={{ fontSize: '3rem' }}></i>
          <h6 className="mt-3 text-orange-600">Error al cargar el documento</h6>
          <p className="text-600 mt-2">{error}</p>
          <small className="text-500">
            Verifique su conexión e intente nuevamente
          </small>
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
        onError={() => {
          console.error('Error mostrando PDF en iframe');
          setError('Error al mostrar el documento en el navegador');
        }}
      />
    </div>
  );
};

export default PDFViewer;
