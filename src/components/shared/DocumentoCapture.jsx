/**
 * Componente genérico para captura y upload de documentos
 * Versión reutilizable usando funciones genéricas de pdfUtils
 * Integrado con el sistema de upload del ERP Megui
 */

import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { generarPdfDesdeImagenes, subirDocumentoPdf } from '../../utils/pdfUtils';

const DocumentoCapture = ({ 
  visible, 
  onHide, 
  onDocumentoSubido,
  endpoint,
  datosAdicionales = {},
  titulo = "Subir Documento",
  prefijo = "documento",
  identificador = "sin-id",
  mensajeInfo = ""
}) => {
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  // Manejar selección de archivos
  const onFileSelect = (e) => {
    const files = Array.from(e.files);
    setArchivosSeleccionados(prev => [...prev, ...files]);
  };

  // Eliminar archivo
  const eliminarArchivo = (index) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  // Subir documento usando funciones genéricas
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
      // Generar PDF desde imágenes usando función genérica
      const archivoParaSubir = await generarPdfDesdeImagenes(
        archivosSeleccionados, 
        prefijo, 
        identificador
      );
      
      // Subir documento usando función genérica
      const resultado = await subirDocumentoPdf(
        archivoParaSubir,
        endpoint,
        datosAdicionales,
        toast
      );

      onDocumentoSubido?.(resultado.urlDocumento || resultado.url);
      limpiarYCerrar();

    } catch (error) {
      // El error ya se maneja en la función genérica
      console.error('Error en DocumentoCapture:', error);
    } finally {
      setProcesando(false);
    }
  };

  // Limpiar y cerrar
  const limpiarYCerrar = () => {
    setArchivosSeleccionados([]);
    onHide?.();
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={limpiarYCerrar}
        header={titulo}
        style={{ width: '90vw', maxWidth: '700px' }}
        breakpoints={{ '960px': '95vw' }}
        modal
        closable={!procesando}
        className="dialog-responsive"
      >
        <div className="grid">
          {/* Información adicional */}
          {mensajeInfo && (
            <div className="col-12">
              <Message 
                severity="info" 
                text={mensajeInfo}
                className="mb-3"
              />
            </div>
          )}

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
      </Dialog>
    </>
  );
};

export default DocumentoCapture;
