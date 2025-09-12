/**
 * Componente genérico para captura y upload de documentos
 * Versión mejorada que soporta imágenes y PDFs usando funciones genéricas de pdfUtils
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
import { procesarYSubirDocumentos, validarTiposArchivo } from '../../utils/pdfUtils';

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

  // Manejar selección de archivos con validación mejorada
  const onFileSelect = (e) => {
    const files = Array.from(e.files);
    
    // Validar tipos de archivo
    const validacion = validarTiposArchivo(files);
    
    if (!validacion.esValido) {
      toast.current?.show({
        severity: 'error',
        summary: 'Archivos no válidos',
        detail: `Se encontraron ${validacion.invalidos.length} archivo(s) con formato no soportado. Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y PDFs.`,
        life: 4000
      });
      return;
    }

    // Verificar si ya hay archivos seleccionados y el tipo
    if (archivosSeleccionados.length > 0) {
      const tipoExistente = archivosSeleccionados[0].type.startsWith('image/') ? 'imagen' : 'pdf';
      const tipoNuevo = validacion.validos[0].type.startsWith('image/') ? 'imagen' : 'pdf';
      
      if (tipoExistente !== tipoNuevo) {
        toast.current?.show({
          severity: 'error',
          summary: 'Tipos mixtos no permitidos',
          detail: 'No se pueden mezclar imágenes y PDFs. Elimine los archivos actuales o seleccione el mismo tipo.',
          life: 4000
        });
        return;
      }
    }

    setArchivosSeleccionados(prev => [...prev, ...validacion.validos]);
  };

  // Eliminar archivo
  const eliminarArchivo = (index) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  // Limpiar todos los archivos
  const limpiarArchivos = () => {
    setArchivosSeleccionados([]);
  };

  // Subir documento usando la nueva función genérica mejorada
  const subirDocumento = async () => {
    if (archivosSeleccionados.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar al menos un archivo',
        life: 3000
      });
      return;
    }

    setProcesando(true);

    try {
      // Usar la nueva función genérica que maneja imágenes y PDFs
      const resultado = await procesarYSubirDocumentos(
        archivosSeleccionados,
        endpoint,
        datosAdicionales,
        toast.current,
        prefijo,
        identificador
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

  // Obtener información del tipo de archivos seleccionados
  const getTipoArchivos = () => {
    if (archivosSeleccionados.length === 0) return '';
    
    const esImagen = archivosSeleccionados[0].type.startsWith('image/');
    return esImagen ? 'imágenes' : 'PDF';
  };

  // Obtener icono según el tipo de archivo
  const getIconoArchivo = (archivo) => {
    if (archivo.type.startsWith('image/')) {
      return 'pi pi-image';
    } else if (archivo.type === 'application/pdf') {
      return 'pi pi-file-pdf';
    }
    return 'pi pi-file';
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

          {/* Información sobre tipos de archivo soportados */}
          <div className="col-12">
            <Message 
              severity="info" 
              text="Puede subir imágenes (que se convertirán automáticamente a PDF) o un archivo PDF directamente. No se pueden mezclar tipos."
              className="mb-3"
            />
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
                  Imágenes (JPG, PNG, GIF, WEBP) o PDFs (máx. 10MB)
                </p>
                <p className="text-400 mt-1 text-xs">
                  • Imágenes: Se generará un PDF automáticamente<br/>
                  • PDF: Se subirá directamente con nombre estandarizado
                </p>
              </div>
            </Card>
          </div>

          {/* Lista de archivos seleccionados */}
          {archivosSeleccionados.length > 0 && (
            <div className="col-12">
              <Card title={`Archivos Seleccionados (${archivosSeleccionados.length}) - ${getTipoArchivos()}`}>
                <div className="flex justify-content-between align-items-center mb-3">
                  <span className="text-sm text-600">
                    Tipo: {getTipoArchivos()}
                  </span>
                  <Button
                    label="Limpiar Todo"
                    icon="pi pi-trash"
                    className="p-button-outlined p-button-danger p-button-sm"
                    onClick={limpiarArchivos}
                    disabled={procesando}
                  />
                </div>
                
                <div className="grid">
                  {archivosSeleccionados.map((archivo, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-4">
                      <div className="border-300 border-round p-2 flex align-items-center justify-content-between">
                        <div className="flex align-items-center">
                          <i className={`${getIconoArchivo(archivo)} text-primary mr-2`}></i>
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
                          disabled={procesando}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-3">
                  <Button
                    label={`Subir ${getTipoArchivos()}`}
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
                      {getTipoArchivos() === 'imágenes' 
                        ? 'Generando PDF desde imágenes y subiendo al servidor...' 
                        : 'Procesando PDF y subiendo al servidor...'}
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
