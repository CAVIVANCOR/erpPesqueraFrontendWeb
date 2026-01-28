import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { DataView } from 'primereact/dataview';
import { Image } from 'primereact/image';
import { getModuleConfig } from '../../utils/pdf/pdfConfigV2';
import { useAuthStore } from '../../shared/stores/useAuthStore';

export default function PDFMultiCapture({
  moduleName,
  entityId,
  visible = true,
  onHide,
  onComplete,
  onError,
  maxFiles = 20,
  allowReorder = true,
  dialogTitle = 'Subir y Consolidar Documentos',
  className = ''
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  const config = getModuleConfig(moduleName);

  const onFileSelect = (e) => {
    const selectedFiles = Array.from(e.files);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Límite excedido',
        detail: `Máximo ${maxFiles} archivos permitidos`,
        life: 3000
      });
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      const isValidType = config.allowedTypes.some(type => {
        if (type === 'application/pdf') return file.type === 'application/pdf';
        if (type === 'image/jpeg') return file.type === 'image/jpeg' || file.type === 'image/jpg';
        if (type === 'image/png') return file.type === 'image/png';
        return false;
      });

      const isValidSize = file.size <= config.maxFileSize;

      if (!isValidType) {
        toast.current?.show({
          severity: 'error',
          summary: 'Tipo no permitido',
          detail: `${file.name} no es un tipo de archivo válido`,
          life: 3000
        });
        return false;
      }

      if (!isValidSize) {
        toast.current?.show({
          severity: 'error',
          summary: 'Archivo muy grande',
          detail: `${file.name} excede el tamaño máximo`,
          life: 3000
        });
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles.map((file, idx) => ({
      file,
      id: Date.now() + idx,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))]);

    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const moveFile = (fileId, direction) => {
    setFiles(prev => {
      const index = prev.findIndex(f => f.id === fileId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newFiles = [...prev];
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles;
    });
  };

  const handleMergeAndUpload = async () => {
    if (files.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin archivos',
        detail: 'Debe seleccionar al menos un archivo',
        life: 3000
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });
      formData.append('moduleName', moduleName);
      
      if (entityId) {
        formData.append('entityId', entityId);
      }

      setProgress(30);

      const token = useAuthStore.getState().token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error('Error al procesar los archivos en el servidor');
      }

      const result = await response.json();

      setProgress(100);

      if (result.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `${result.filesProcessed} archivos consolidados correctamente`,
          life: 3000
        });

        // Limpiar archivos y cerrar diálogo
        files.forEach(f => {
          if (f.preview) {
            URL.revokeObjectURL(f.preview);
          }
        });
        setFiles([]);

        // Llamar callback con la URL del PDF consolidado
        if (onComplete) {
          onComplete(result.url);
        }

        // Cerrar diálogo
        if (onHide) {
          onHide();
        }
      } else {
        throw new Error(result.message || 'Error al consolidar archivos');
      }

    } catch (error) {
      console.error('Error al consolidar archivos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al consolidar los archivos',
        life: 4000
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    files.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    if (onHide) {
      onHide();
    }
  };

  const fileItemTemplate = (fileObj) => {
    return (
      <div className="col-12 md:col-6 lg:col-4 p-2">
        <div className="border-1 surface-border border-round p-3">
          <div className="flex flex-column gap-2">
            {fileObj.preview ? (
              <Image 
                src={fileObj.preview} 
                alt={fileObj.file.name}
                width="100%"
                preview
              />
            ) : (
              <div className="flex align-items-center justify-content-center bg-gray-100 border-round" style={{ height: '150px' }}>
                <i className="pi pi-file-pdf text-6xl text-red-500"></i>
              </div>
            )}
            
            <div className="text-sm font-semibold text-overflow-ellipsis overflow-hidden white-space-nowrap">
              {fileObj.file.name}
            </div>
            
            <div className="text-xs text-500">
              {(fileObj.file.size / 1024).toFixed(2)} KB
            </div>

            <div className="flex gap-2">
              {allowReorder && (
                <>
                  <Button
                    icon="pi pi-arrow-up"
                    className="p-button-sm p-button-outlined"
                    onClick={() => moveFile(fileObj.id, 'up')}
                    disabled={files[0].id === fileObj.id}
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    className="p-button-sm p-button-outlined"
                    onClick={() => moveFile(fileObj.id, 'down')}
                    disabled={files[files.length - 1].id === fileObj.id}
                  />
                </>
              )}
              <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-danger p-button-outlined"
                onClick={() => removeFile(fileObj.id)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const dialogFooter = (
    <div className="flex justify-content-between">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-text"
        disabled={uploading}
      />
      <Button
        label={`Consolidar ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
        icon="pi pi-check"
        onClick={handleMergeAndUpload}
        disabled={files.length === 0 || uploading}
        loading={uploading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      
      <Dialog
        visible={visible}
        onHide={handleClose}
        header={dialogTitle}
        style={{ width: '90vw', maxWidth: '1200px' }}
        footer={dialogFooter}
        className={className}
        modal
      >
        <div className="flex flex-column gap-3">
          <div className="p-3 bg-blue-50 border-round">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-info-circle text-blue-500"></i>
              <span className="font-semibold">Instrucciones:</span>
            </div>
            <ul className="m-0 pl-4">
              <li>Seleccione múltiples archivos (PDFs e imágenes)</li>
              <li>Los archivos se consolidarán en un único PDF</li>
              <li>Puede reordenar los archivos antes de consolidar</li>
              <li>Máximo {maxFiles} archivos</li>
            </ul>
          </div>

          <FileUpload
            ref={fileUploadRef}
            multiple
            accept="application/pdf,image/jpeg,image/png"
            maxFileSize={config.maxFileSize}
            onSelect={onFileSelect}
            auto={false}
            chooseLabel="Seleccionar Archivos"
            uploadLabel="Subir"
            cancelLabel="Cancelar"
            emptyTemplate={
              <p className="text-center text-500">
                Arrastre archivos aquí o haga clic para seleccionar
              </p>
            }
          />

          {uploading && (
            <div className="flex flex-column gap-2">
              <span className="text-center">Consolidando archivos...</span>
              <ProgressBar value={progress} />
            </div>
          )}

          {files.length > 0 && !uploading && (
            <div>
              <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="m-0">Archivos seleccionados ({files.length})</h3>
                <Button
                  label="Limpiar todo"
                  icon="pi pi-trash"
                  className="p-button-sm p-button-danger p-button-outlined"
                  onClick={() => {
                    files.forEach(f => {
                      if (f.preview) URL.revokeObjectURL(f.preview);
                    });
                    setFiles([]);
                  }}
                />
              </div>
              
              <DataView
                value={files}
                itemTemplate={fileItemTemplate}
                layout="grid"
              />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}