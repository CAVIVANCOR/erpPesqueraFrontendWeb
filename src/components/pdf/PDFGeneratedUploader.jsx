import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import PDFViewerV2 from './PDFViewerV2';
import PDFActionButtons from './PDFActionButtons';

export default function PDFGeneratedUploader({
  generatePdfFunction,
  pdfData,
  moduleName,
  entityId,
  fileName,
  buttonLabel = 'Generar PDF',
  buttonIcon = 'pi pi-file-pdf',
  buttonClassName = 'p-button-success',
  onGenerateStart,
  onGenerateComplete,
  onError,
  showViewer = true,
  showButtons = true,
  viewerHeight = '800px',
  autoGenerate = false,
  disabled = false,
  warningMessage = null,
  infoMessage = null,
  className = '',
  toast: externalToast,
  customControls = null,
  initialPdfUrl = null,
}) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [generatedFileName, setGeneratedFileName] = useState(null);
  const internalToast = useRef(null);
  
  const toast = externalToast || internalToast;

  // ✅ Actualizar pdfUrl cuando cambia initialPdfUrl
  useEffect(() => {
    if (initialPdfUrl) {
      setPdfUrl(initialPdfUrl);
    }
  }, [initialPdfUrl]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      if (onGenerateStart) {
        onGenerateStart();
      }

      const resultado = await generatePdfFunction(pdfData);

      if (resultado?.success && resultado?.urlPdf) {
        setPdfUrl(resultado.urlPdf);
        setGeneratedFileName(resultado.fileName || fileName || `${moduleName}-${Date.now()}.pdf`);
        
        toast?.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'PDF generado y guardado correctamente',
          life: 3000
        });

        if (onGenerateComplete) {
          onGenerateComplete(resultado.urlPdf);
        }
      } else {
        throw new Error(resultado?.error || 'Error al generar el PDF');
      }

    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al generar el PDF',
        life: 4000
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && generatePdfFunction && pdfData && !disabled) {
      handleGenerate();
    }
  }, [autoGenerate]);

  return (
    <div className={`pdf-generated-uploader ${className}`}>
      {!externalToast && <Toast ref={internalToast} />}
      
      <div className="p-fluid">
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {customControls && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              {customControls}
            </div>
          )}

          <div style={{ flex: 2, minWidth: '300px' }}>
            <label htmlFor="urlPdfGenerado">
              URL del PDF (se genera automáticamente)
            </label>
            <div className="p-inputgroup">
              <input
                id="urlPdfGenerado"
                type="text"
                className="p-inputtext p-component"
                value={pdfUrl || ''}
                readOnly
                placeholder="No hay PDF generado"
                style={{
                  backgroundColor: '#f8f9fa',
                  cursor: 'not-allowed',
                }}
              />
              <Button
                icon={buttonIcon}
                label={buttonLabel}
                className={buttonClassName}
                onClick={handleGenerate}
                disabled={disabled || loading || !generatePdfFunction}
                loading={loading}
              />
            </div>
          </div>

          {pdfUrl && showButtons && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <PDFActionButtons
                pdfUrl={pdfUrl}
                moduleName={moduleName}
                fileName={generatedFileName || fileName || 'documento.pdf'}
                viewButtonLabel="Ver"
                downloadButtonLabel="Descargar"
                toast={toast}
              />
            </div>
          )}
        </div>

        {warningMessage && (
          <Message
            severity="warn"
            text={warningMessage}
            className="mb-3"
            style={{ width: '100%' }}
          />
        )}

        {infoMessage && (
          <Message
            severity="info"
            text={infoMessage}
            className="mb-3"
            style={{ width: '100%' }}
          />
        )}

        {loading && (
          <div className="flex flex-column align-items-center gap-3 my-4">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <span className="text-600">Generando PDF...</span>
          </div>
        )}

        {pdfUrl && showViewer && !loading && (
          <div className="mt-3">
            <PDFViewerV2
              pdfUrl={pdfUrl}
              moduleName={moduleName}
              height={viewerHeight}
            />
          </div>
        )}

        {!pdfUrl && !loading && (
          <div className="mt-3">
            <div
              className="text-center p-4"
              style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}
            >
              <i
                className="pi pi-file-pdf text-gray-400"
                style={{ fontSize: '3rem' }}
              ></i>
              <p className="text-600 mt-3 mb-2">
                No hay PDF generado
              </p>
              <small className="text-500">
                Use el botón "{buttonLabel}" para generar el documento.
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}