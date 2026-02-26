import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

/**
 * Componente genérico para seleccionar el formato de un reporte (PDF o Excel)
 * @param {boolean} visible - Controla la visibilidad del dialog
 * @param {function} onHide - Callback al cerrar el dialog
 * @param {function} onSelectPDF - Callback al seleccionar formato PDF
 * @param {function} onSelectExcel - Callback al seleccionar formato Excel
 * @param {string} title - Título del dialog
 */
const ReportFormatSelector = ({ 
  visible, 
  onHide, 
  onSelectPDF, 
  onSelectExcel,
  title = "Seleccione el formato del reporte"
}) => {
  const handlePDFClick = () => {
    onSelectPDF();
    onHide();
  };

  const handleExcelClick = () => {
    onSelectExcel();
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={title}
      style={{ width: '500px' }}
      modal
      closable
      draggable={false}
    >
      <div className="text-center mb-4">
        <p className="text-lg text-700">
          ¿En qué formato desea generar el reporte?
        </p>
      </div>

      <div className="flex gap-3 justify-content-center mb-3">
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          onClick={handlePDFClick}
          className="p-button-danger p-button-lg"
          style={{ 
            width: '200px', 
            height: '120px', 
            fontSize: '1.3rem',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        />

        <Button
          label="EXCEL"
          icon="pi pi-file-excel"
          onClick={handleExcelClick}
          className="p-button-success p-button-lg"
          style={{ 
            width: '200px', 
            height: '120px', 
            fontSize: '1.3rem',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        />
      </div>

      <div className="text-center mt-3">
        <small className="text-500">
          <i className="pi pi-info-circle mr-1"></i>
          El reporte se generará temporalmente y se eliminará automáticamente al cerrar
        </small>
      </div>
    </Dialog>
  );
};

export default ReportFormatSelector;