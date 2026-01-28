/**
 * pdfUtilsV2.js - Utilidades para sistema PDF V2
 */

import { getModuleConfig, buildApiUrl } from './pdfConfigV2';

export async function uploadPdfToServer(pdfBlob, moduleName, metadata = {}) {
  try {
    const formData = new FormData();
    const fileName = metadata.fileName || `${moduleName}-${Date.now()}.pdf`;
    formData.append('file', pdfBlob, fileName);
    formData.append('moduleName', moduleName);
    
    Object.keys(metadata).forEach(key => {
      if (key !== 'fileName') {
        formData.append(key, metadata[key]);
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al subir el PDF al servidor');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al subir el PDF');
    }

    return result;

  } catch (error) {
    console.error('Error en uploadPdfToServer:', error);
    throw error;
  }
}

export async function mergeAndUploadFiles(files, moduleName, metadata = {}) {
  try {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('moduleName', moduleName);
    
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/merge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al consolidar archivos en el servidor');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al consolidar archivos');
    }

    return result;

  } catch (error) {
    console.error('Error en mergeAndUploadFiles:', error);
    throw error;
  }
}

export function buildPdfUrl(relativePath) {
  if (!relativePath) return null;
  
  if (relativePath.startsWith('http')) {
    return relativePath;
  }

  let url = relativePath;
  if (!url.startsWith('/')) {
    url = `/${url}`;
  }

  url = `${import.meta.env.VITE_API_URL}${url}`;

  return url;
}

export function openPdfInNewTab(pdfUrl) {
  if (!pdfUrl) return;
  
  const fullUrl = buildPdfUrl(pdfUrl);
  window.open(fullUrl, '_blank');
}

export function downloadPdf(pdfUrl, fileName = 'documento.pdf') {
  if (!pdfUrl) return;
  
  const fullUrl = buildPdfUrl(pdfUrl);
  
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function deletePdfFromServer(moduleName, fileName) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/pdf/${moduleName}/${fileName}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al eliminar el archivo');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar el archivo');
    }

    return result;

  } catch (error) {
    console.error('Error en deletePdfFromServer:', error);
    throw error;
  }
}

export function validateFileType(file, allowedTypes) {
  return allowedTypes.some(type => {
    if (type === 'application/pdf') return file.type === 'application/pdf';
    if (type === 'image/jpeg') return file.type === 'image/jpeg' || file.type === 'image/jpg';
    if (type === 'image/png') return file.type === 'image/png';
    return false;
  });
}

export function validateFileSize(file, maxSize) {
  return file.size <= maxSize;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isPdfFile(file) {
  return file.type === 'application/pdf' || getFileExtension(file.name).toLowerCase() === 'pdf';
}

export function isImageFile(file) {
  return file.type.startsWith('image/');
}

export default {
  uploadPdfToServer,
  mergeAndUploadFiles,
  buildPdfUrl,
  openPdfInNewTab,
  downloadPdf,
  deletePdfFromServer,
  validateFileType,
  validateFileSize,
  formatFileSize,
  getFileExtension,
  isPdfFile,
  isImageFile
};
