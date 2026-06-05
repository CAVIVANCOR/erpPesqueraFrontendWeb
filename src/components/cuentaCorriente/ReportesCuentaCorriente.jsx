/**
 * ReportesCuentaCorriente.jsx
 * 
 * Componente para gestionar todos los reportes del módulo de Cuentas Corrientes
 * Diseño horizontal tipo grid similar a DatosLiquidacionPersonalPesca.jsx
 * 
 * @author ERP Megui
 * @version 1.0.0
 */
import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

// Componentes de reportes genéricos
import ReportFormatSelector from '../reports/ReportFormatSelector';
import TemporaryPDFViewer from '../reports/TemporaryPDFViewer';
import TemporaryExcelViewer from '../reports/TemporaryExcelViewer';

// Generadores de reportes - Estado de Cuentas
import { generarEstadoCuentasPDF } from './reports/generarEstadoCuentasPDF';
import { generarEstadoCuentasExcel } from './reports/generarEstadoCuentasExcel';

const ReportesCuentaCorriente = ({ 
  visible, 
  onHide, 
  cuentas = [],
  empresas = [],
  bancos = [],
  filtros = {}
}) => {
  // ⭐ ESTADOS PARA REPORTE ESTADO DE CUENTAS
  const [showFormatSelectorEstado, setShowFormatSelectorEstado] = useState(false);
  const [showPDFViewerEstado, setShowPDFViewerEstado] = useState(false);
  const [showExcelViewerEstado, setShowExcelViewerEstado] = useState(false);
  const [reportDataEstado, setReportDataEstado] = useState(null);

  const handleReporteEstadoCuentas = () => {
    const data = {
      cuentas: cuentas,
      empresas: empresas,
      bancos: bancos,
      filtros: filtros,
      fechaGeneracion: new Date(),
      titulo: 'Estado de Cuentas Corrientes'
    };
    setReportDataEstado(data);
    setShowFormatSelectorEstado(true);
  };

  const reportes = [
    {
      id: 'estado-cuentas',
      titulo: 'Estado de Cuentas',
      icon: 'pi pi-file',
      color: '#2196f3',
      handler: handleReporteEstadoCuentas
    },
  ];

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Reportes"
        style={{ width: '900px' }}
        modal
        draggable={false}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {reportes.map((reporte) => (
              <Button
                key={reporte.id}
                onClick={reporte.handler}
                style={{
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: `2px solid ${reporte.color}`,
                  backgroundColor: 'white',
                  color: reporte.color,
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: '15px'
                }}
                className="hover:shadow-3"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = reporte.color;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = reporte.color;
                }}
              >
                <i className={reporte.icon} style={{ fontSize: '24px' }}></i>
                <span>{reporte.titulo}</span>
              </Button>
            ))}
          </div>
        </div>
      </Dialog>

      {/* ⭐ COMPONENTES PARA REPORTE ESTADO DE CUENTAS */}
      <ReportFormatSelector
        visible={showFormatSelectorEstado}
        onHide={() => setShowFormatSelectorEstado(false)}
        onSelectPDF={() => {
          setShowFormatSelectorEstado(false);
          setShowPDFViewerEstado(true);
        }}
        onSelectExcel={() => {
          setShowFormatSelectorEstado(false);
          setShowExcelViewerEstado(true);
        }}
        title="Estado de Cuentas Corrientes"
      />
      <TemporaryPDFViewer
        visible={showPDFViewerEstado}
        onHide={() => {
          setShowPDFViewerEstado(false);
          setShowFormatSelectorEstado(false);
        }}
        data={reportDataEstado}
        generatePDF={generarEstadoCuentasPDF}
        fileName={`estado-cuentas-${new Date().toISOString().split('T')[0]}.pdf`}
        title="Estado de Cuentas Corrientes"
      />
      <TemporaryExcelViewer
        visible={showExcelViewerEstado}
        onHide={() => {
          setShowExcelViewerEstado(false);
          setShowFormatSelectorEstado(false);
        }}
        data={reportDataEstado}
        generateExcel={generarEstadoCuentasExcel}
        fileName={`estado-cuentas-${new Date().toISOString().split('T')[0]}.xlsx`}
        title="Estado de Cuentas Corrientes"
      />
    </>
  );
};

export default ReportesCuentaCorriente;