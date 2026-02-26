import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import * as XLSX from 'xlsx';

/**
 * Componente genérico para visualizar archivos Excel temporales
 * @param {boolean} visible - Controla la visibilidad del dialog
 * @param {function} onHide - Callback al cerrar el dialog
 * @param {function} generateExcel - Función que genera el Excel (debe retornar un Blob)
 * @param {object} data - Datos para generar el reporte
 * @param {string} fileName - Nombre del archivo para descarga
 * @param {string} title - Título del dialog
 */
const TemporaryExcelViewer = ({
  visible,
  onHide,
  generateExcel,
  data,
  fileName = 'reporte.xlsx',
  title = 'Reporte Excel'
}) => {
  const [excelData, setExcelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [excelBlob, setExcelBlob] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let blobUrl = null;

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generar Excel usando la función proporcionada
        const blob = await generateExcel(data);
        setExcelBlob(blob);
        
        // Convertir blob a ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Leer el archivo Excel con SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Convertir a formato FortuneSheet
        const fortuneData = convertWorkbookToFortuneSheet(workbook);
        setExcelData(fortuneData);
        
        blobUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.error('Error generando Excel:', err);
        setError(err.message || 'Error al generar el archivo Excel');
      } finally {
        setLoading(false);
      }
    };

    generate();

    // Cleanup: Revocar URL al desmontar o cerrar
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        console.log('✅ Excel temporal eliminado');
      }
      setExcelData(null);
      setExcelBlob(null);
    };
  }, [visible, data, generateExcel]);

  /**
   * Convierte un workbook de SheetJS al formato de FortuneSheet
   */
  const convertWorkbookToFortuneSheet = (workbook) => {
    const sheets = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: null 
      });
      
      // Convertir a formato de celdas de FortuneSheet
      const celldata = [];
      jsonData.forEach((row, r) => {
        if (Array.isArray(row)) {
          row.forEach((cell, c) => {
            if (cell !== null && cell !== undefined && cell !== '') {
              celldata.push({
                r,
                c,
                v: {
                  v: cell,
                  m: String(cell),
                  ct: { fa: 'General', t: 'g' }
                }
              });
            }
          });
        }
      });
      
      sheets.push({
        name: sheetName,
        celldata,
        row: jsonData.length || 10,
        column: Math.max(...jsonData.map(row => row?.length || 0), 10),
        config: {
          columnlen: {}
        }
      });
    });
    
    return sheets;
  };

  const handleDownload = () => {
    if (!excelBlob) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(excelBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setExcelData(null);
    setExcelBlob(null);
    setError(null);
    onHide();
  };

  const footerContent = (
    <div className="flex gap-2">
      <Button
        label="Descargar"
        icon="pi pi-download"
        onClick={handleDownload}
        className="p-button-outlined p-button-success"
        disabled={!excelBlob || loading}
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-outlined p-button-secondary"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={title}
      footer={footerContent}
      maximizable
      style={{ width: '90vw', height: '90vh' }}
      contentStyle={{ height: 'calc(90vh - 150px)', padding: 0 }}
    >
      {loading && (
        <div 
          className="flex flex-column justify-content-center align-items-center" 
          style={{ height: '100%' }}
        >
          <ProgressSpinner />
          <p className="mt-3 text-600">Generando reporte Excel...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-3">
          <Message 
            severity="error" 
            text={`Error: ${error}`}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {!loading && !error && excelData && (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
          <Workbook
            data={excelData}
            settings={{
              allowEdit: false,
              showToolbar: false,
              showFormulaBar: false,
              showSheetTabs: true,
              enableAddRow: false,
              enableAddCol: false,
              showtoolbarConfig: {
                undoRedo: false,
                paintFormat: false,
                currencyFormat: false,
                percentageFormat: false,
                numberDecrease: false,
                numberIncrease: false,
                moreFormats: false,
                font: false,
                fontSize: false,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                textColor: false,
                fillColor: false,
                border: false,
                mergeCell: false,
                horizontalAlignMode: false,
                verticalAlignMode: false,
                textWrapMode: false,
                textRotateMode: false,
                image: false,
                link: false,
                chart: false,
                postil: false,
                pivotTable: false,
                function: false,
                frozenMode: false,
                sortAndFilter: false,
                conditionalFormat: false,
                dataVerification: false,
                splitColumn: false,
                screenshot: false,
                findAndReplace: false,
                protection: false,
                print: false
              }
            }}
          />
        </div>
      )}

      {!loading && !error && !excelData && (
        <div className="text-center p-5">
          <i className="pi pi-file-excel" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <p className="mt-3 text-600">No hay archivo Excel para mostrar</p>
        </div>
      )}
    </Dialog>
  );
};

export default TemporaryExcelViewer;