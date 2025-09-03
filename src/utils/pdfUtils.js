import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Función genérica para abrir archivos PDF en una nueva pestaña
 * @param {string} urlPdf - URL del archivo PDF
 * @param {Object} toast - Referencia al componente Toast para mostrar mensajes
 * @param {string} mensajeError - Mensaje personalizado de error (opcional)
 */
export const abrirPdfEnNuevaPestana = async (urlPdf, toast, mensajeError = "No hay PDF disponible") => {
  if (!urlPdf) {
    toast?.show({
      severity: "warn",
      summary: "Advertencia",
      detail: mensajeError,
      life: 3000,
    });
    return;
  }

  try {
    let urlCompleta;

    // Construcción de URL siguiendo el patrón funcional
    if (urlPdf.startsWith("/uploads/resoluciones-temporada/")) {
      const rutaArchivo = urlPdf.replace("/uploads/resoluciones-temporada/", "");
      urlCompleta = `${import.meta.env.VITE_API_URL}/temporada-pesca-resolucion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/confirmaciones-acciones-previas/")) {
      const rutaArchivo = urlPdf.replace("/uploads/confirmaciones-acciones-previas/", "");
      urlCompleta = `${import.meta.env.VITE_API_URL}/confirmaciones-acciones-previas/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/")) {
      // Para otros tipos de uploads (archivos de confirmación, etc.)
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else if (urlPdf.startsWith("/api/")) {
      const rutaSinApi = urlPdf.substring(4);
      urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
    } else if (urlPdf.startsWith("/")) {
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else {
      urlCompleta = urlPdf;
    }

    // Obtener token y hacer fetch con autenticación
    const token = useAuthStore.getState().token;
    const response = await fetch(urlCompleta, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Crear blob y abrir en nueva ventana
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      // Limpiar blob después de 10 segundos
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);

      if (!newWindow) {
        toast?.show({
          severity: "warn",
          summary: "Aviso",
          detail: "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
          life: 4000,
        });
      }
    } else {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: `No se pudo abrir el documento (${response.status})`,
        life: 3000,
      });
    }
  } catch (error) {
    toast?.show({
      severity: "error",
      summary: "Error",
      detail: `Error al abrir el documento: ${error.message}`,
      life: 3000,
    });
  }
};

/**
 * Función genérica para descargar archivos PDF
 * @param {string} urlPdf - URL del archivo PDF
 * @param {Object} toast - Referencia al componente Toast
 * @param {string} nombreArchivo - Nombre del archivo para descarga
 * @param {string} tipoUpload - Tipo de upload para construcción de URL
 */
export const descargarPdf = async (urlPdf, toast, nombreArchivo = "documento.pdf", tipoUpload = "documentos-visitantes") => {
  if (!urlPdf) {
    toast.current?.show({
      severity: "warn",
      summary: "Advertencia",
      detail: "No hay PDF disponible para descargar",
      life: 3000,
    });
    return;
  }

  try {
    let urlCompleta;

    // Construcción de URL basada en el tipo de upload
    if (urlPdf.startsWith(`/uploads/${tipoUpload}/`)) {
      const rutaArchivo = urlPdf.replace(`/uploads/${tipoUpload}/`, "");
      urlCompleta = `${import.meta.env.VITE_API_URL}/${tipoUpload}/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/api/")) {
      const rutaSinApi = urlPdf.substring(4);
      urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
    } else if (urlPdf.startsWith("/")) {
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else {
      urlCompleta = urlPdf;
    }

    const token = useAuthStore.getState().token;
    const response = await fetch(urlCompleta, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo descargar el documento",
        life: 3000,
      });
    }
  } catch (error) {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: `Error al descargar el documento: ${error.message}`,
      life: 3000,
    });
  }
};

/**
 * Función genérica para cargar jsPDF dinámicamente desde CDN
 */
export const cargarJsPDF = () => {
  return new Promise((resolve, reject) => {
    if (window.jsPDF) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      // jsPDF se carga en window.jspdf, necesitamos moverlo a window.jsPDF
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
      }
      resolve();
    };
    script.onerror = () => reject(new Error('Error al cargar jsPDF'));
    document.head.appendChild(script);
  });
};

/**
 * Función auxiliar para cargar una imagen
 * @param {File} archivo - Archivo de imagen
 */
export const cargarImagen = (archivo) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(archivo);
  });
};

/**
 * Función genérica para generar un PDF desde múltiples imágenes
 * @param {Array} imagenes - Array de archivos de imagen
 * @param {string} prefijo - Prefijo para el nombre del archivo
 * @param {string} identificador - Identificador único para el archivo
 */
export const generarPdfDesdeImagenes = async (imagenes, prefijo = "documento", identificador = "sin-id") => {
  return new Promise(async (resolve, reject) => {
    try {
      // Cargar jsPDF dinámicamente desde CDN
      if (!window.jsPDF) {
        await cargarJsPDF();
      }

      const { jsPDF } = window;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Procesar cada imagen
      for (let i = 0; i < imagenes.length; i++) {
        const img = await cargarImagen(imagenes[i]);
        
        // Agregar nueva página si no es la primera imagen
        if (i > 0) {
          pdf.addPage();
        }
        
        // Configuración de página A4 (210 x 297 mm)
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        
        // Calcular dimensiones manteniendo aspecto
        const aspectRatio = img.width / img.height;
        let imgWidth = maxWidth;
        let imgHeight = maxWidth / aspectRatio;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = maxHeight * aspectRatio;
        }
        
        // Centrar la imagen en la página
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        
        // Convertir imagen a base64 para jsPDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Agregar la imagen al PDF
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        
        // Agregar información de página
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Página ${i + 1} de ${imagenes.length}`, pageWidth - 30, pageHeight - 5);
        
        // Agregar fecha
        pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 5);
      }
      
      // Generar el PDF como blob
      const pdfBlob = pdf.output('blob');
      const timestamp = Date.now();
      
      // Crear archivo PDF con nombre descriptivo
      const fileName = `${prefijo}-${timestamp}-${identificador}-${imagenes.length}imgs.pdf`;
      const archivo = new File([pdfBlob], fileName, {
        type: 'application/pdf'
      });
      
      resolve(archivo);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      reject(error);
    }
  });
};

/**
 * Función genérica para subir documento PDF
 * @param {File} archivo - Archivo PDF a subir
 * @param {string} endpoint - Endpoint de la API para subir
 * @param {Object} datosAdicionales - Datos adicionales para el FormData
 * @param {Object} toast - Referencia al componente Toast
 */
export const subirDocumentoPdf = async (archivo, endpoint, datosAdicionales = {}, toast) => {
  try {
    const formData = new FormData();
    formData.append('documento', archivo);
    
    // Agregar datos adicionales al FormData
    Object.keys(datosAdicionales).forEach(key => {
      formData.append(key, datosAdicionales[key] || '');
    });

    // Obtener token JWT desde Zustand siguiendo patrón ERP Megui
    const token = useAuthStore.getState().token;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al subir el documento');
    }

    const resultado = await response.json();

    toast.current?.show({
      severity: 'success',
      summary: 'Documento Subido',
      detail: 'Archivo guardado exitosamente',
      life: 4000
    });

    return resultado;

  } catch (error) {
    console.error('Error al subir archivo:', error);
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo subir el documento',
      life: 5000
    });
    throw error;
  }
};
