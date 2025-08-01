/**
 * Componente para captura y upload de documentos de visitantes
 * Versión simplificada usando solo APIs nativas del navegador y PrimeReact
 * Integrado con el sistema de upload del ERP Megui
 */

import React, { useState, useRef, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const DocumentoVisitanteCapture = ({ 
  visible, 
  onHide, 
  onDocumentoSubido,
  numeroDocumento,
  nombrePersona 
}) => {
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  // Iniciar cámara
  const iniciarCamara = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCamaraActiva(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error de Cámara',
        detail: 'No se pudo acceder a la cámara. Verifique los permisos.',
        life: 5000
      });
    }
  }, []);

  // Detener cámara
  const detenerCamara = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCamaraActiva(false);
    }
  }, [stream]);

  // Capturar foto desde cámara
  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const archivo = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setArchivosSeleccionados(prev => [...prev, archivo]);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Foto Capturada',
        detail: `Foto agregada (${archivosSeleccionados.length + 1} total)`,
        life: 3000
      });
    }, 'image/jpeg', 0.8);
  }, [archivosSeleccionados.length]);

  // Manejar selección de archivos
  const onFileSelect = (e) => {
    const files = Array.from(e.files);
    setArchivosSeleccionados(prev => [...prev, ...files]);
  };

  // Eliminar archivo
  const eliminarArchivo = (index) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  // Subir archivos directamente
  const subirDocumento = async () => {
    if (archivosSeleccionados.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos una imagen',
        life: 3000
      });
      return;
    }

    setProcesando(true);

    try {
      let archivoParaSubir;

      if (archivosSeleccionados.length === 1) {
        // Si es solo una imagen, usar directamente
        archivoParaSubir = archivosSeleccionados[0];
      } else {
        // Si son múltiples imágenes, generar archivo combinado
        archivoParaSubir = await generarArchivoCombinadoDesdeImagenes(archivosSeleccionados);
      }
      
      const formData = new FormData();
      formData.append('documento', archivoParaSubir);
      formData.append('numeroDocumento', numeroDocumento || '');
      formData.append('nombrePersona', nombrePersona || '');

      // Obtener token JWT desde Zustand siguiendo patrón ERP Megui
      const token = useAuthStore.getState().token;

      const response = await fetch('/api/documentos-visitantes/upload', {
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
        detail: `${archivosSeleccionados.length > 1 ? 'Archivo combinado generado y ' : ''}archivo guardado exitosamente`,
        life: 4000
      });

      onDocumentoSubido?.(resultado.urlDocumento);
      limpiarYCerrar();

    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir el documento',
        life: 5000
      });
    } finally {
      setProcesando(false);
    }
  };

  // Función para generar un PDF desde múltiples imágenes
  const generarArchivoCombinadoDesdeImagenes = async (imagenes) => {
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
        const numeroDoc = numeroDocumento || 'sin-doc';
        
        // Crear archivo PDF con nombre descriptivo
        const fileName = `documento-visitante-${timestamp}-${numeroDoc}-${imagenes.length}imgs.pdf`;
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

  // Función para cargar jsPDF dinámicamente desde CDN
  const cargarJsPDF = () => {
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

  // Función auxiliar para cargar una imagen
  const cargarImagen = (archivo) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(archivo);
    });
  };

  // Limpiar y cerrar
  const limpiarYCerrar = useCallback(() => {
    setArchivosSeleccionados([]);
    detenerCamara();
    onHide?.();
  }, [detenerCamara, onHide]);

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={limpiarYCerrar}
        header="Subir Documento de Visitante"
        style={{ width: '90vw', maxWidth: '700px' }}
        breakpoints={{ '960px': '95vw' }}
        modal
        closable={!procesando}
        className="dialog-responsive"
      >
        <div className="grid">
          {/* Información del visitante */}
          <div className="col-12">
            <Message 
              severity="info" 
              text={`Visitante: ${nombrePersona || 'Sin nombre'} - Documento: ${numeroDocumento || 'Sin número'}`}
              className="mb-3"
            />
          </div>

          {/* Sección de Cámara */}
          <div className="col-12 md:col-6">
            <Card title="Capturar con Cámara" className="h-full">
              {!camaraActiva ? (
                <div className="text-center p-4">
                  <i className="pi pi-camera text-6xl text-300 mb-3"></i>
                  <p className="text-500 mb-4">
                    Active la cámara para tomar fotos
                  </p>
                  <Button
                    label="Activar Cámara"
                    icon="pi pi-camera"
                    onClick={iniciarCamara}
                    className="p-button-success"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '2px solid var(--primary-color)'
                    }}
                  />
                  <div className="mt-3">
                    <Button
                      label="Capturar"
                      icon="pi pi-camera"
                      onClick={capturarFoto}
                      className="p-button-primary mr-2"
                    />
                    <Button
                      label="Detener"
                      icon="pi pi-stop"
                      onClick={detenerCamara}
                      className="p-button-secondary"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sección de Selección de Archivos */}
          <div className="col-12 md:col-6">
            <Card title="Seleccionar Archivos" className="h-full">
              <div className="text-center p-4">
                <FileUpload
                  ref={fileUploadRef}
                  mode="basic"
                  name="documentos"
                  accept="image/*,application/pdf"
                  multiple
                  maxFileSize={10000000}
                  onSelect={onFileSelect}
                  chooseLabel="Seleccionar Archivos"
                  className="p-button-outlined"
                />
                <p className="text-500 mt-2 text-sm">
                  Imágenes o PDFs (máx. 10MB)
                </p>
              </div>
            </Card>
          </div>

          {/* Lista de archivos seleccionados */}
          {archivosSeleccionados.length > 0 && (
            <div className="col-12">
              <Card title={`Archivos Seleccionados (${archivosSeleccionados.length})`}>
                <div className="grid">
                  {archivosSeleccionados.map((archivo, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-4">
                      <div className="border-300 border-round p-2 flex align-items-center justify-content-between">
                        <div className="flex align-items-center">
                          <i className="pi pi-file text-primary mr-2"></i>
                          <div>
                            <div className="font-semibold text-sm">
                              {archivo.name.length > 20 
                                ? archivo.name.substring(0, 20) + '...' 
                                : archivo.name}
                            </div>
                            <small className="text-500">
                              {(archivo.size / 1024 / 1024).toFixed(2)} MB
                            </small>
                          </div>
                        </div>
                        <Button
                          icon="pi pi-times"
                          className="p-button-rounded p-button-text p-button-danger p-button-sm"
                          onClick={() => eliminarArchivo(index)}
                          tooltip="Eliminar"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-3">
                  <Button
                    label="Subir Documentos"
                    icon="pi pi-upload"
                    onClick={subirDocumento}
                    loading={procesando}
                    className="p-button-success"
                    disabled={archivosSeleccionados.length === 0}
                  />
                </div>
                
                {procesando && (
                  <div className="mt-3">
                    <ProgressBar mode="indeterminate" />
                    <small className="text-center block mt-2">
                      Subiendo documento al servidor...
                    </small>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Dialog>
    </>
  );
};

export default DocumentoVisitanteCapture;
