/**
 * useReportesTemporada.js
 * Hook personalizado para gestionar todos los reportes de la temporada
 * Incluye estados y funciones para generar reportes en PDF y Excel
 */

import { useState } from "react";

export const useReportesTemporada = () => {
  // Estados para reporte de Distribución
  const [showFormatSelectorDistribucion, setShowFormatSelectorDistribucion] = useState(false);
  const [showPDFViewerDistribucion, setShowPDFViewerDistribucion] = useState(false);
  const [showExcelViewerDistribucion, setShowExcelViewerDistribucion] = useState(false);
  const [reportDataDistribucion, setReportDataDistribucion] = useState(null);

  // Estados para reporte de Pesca
  const [showFormatSelectorPesca, setShowFormatSelectorPesca] = useState(false);
  const [showPDFViewerPesca, setShowPDFViewerPesca] = useState(false);
  const [showExcelViewerPesca, setShowExcelViewerPesca] = useState(false);
  const [reportDataPesca, setReportDataPesca] = useState(null);

  // Estados para reporte de Liquidación Tripulantes
  const [showFormatSelectorLiqTripulantes, setShowFormatSelectorLiqTripulantes] = useState(false);
  const [showPDFViewerLiqTripulantes, setShowPDFViewerLiqTripulantes] = useState(false);
  const [showExcelViewerLiqTripulantes, setShowExcelViewerLiqTripulantes] = useState(false);
  const [reportDataLiqTripulantes, setReportDataLiqTripulantes] = useState(null);

  // Estados para reporte de Liquidación Armadores
  const [showFormatSelectorLiqArmadores, setShowFormatSelectorLiqArmadores] = useState(false);
  const [showPDFViewerLiqArmadores, setShowPDFViewerLiqArmadores] = useState(false);
  const [showExcelViewerLiqArmadores, setShowExcelViewerLiqArmadores] = useState(false);
  const [reportDataLiqArmadores, setReportDataLiqArmadores] = useState(null);

  // Estados para reporte de Liquidación Comisionista
  const [showFormatSelectorLiqComisionista, setShowFormatSelectorLiqComisionista] = useState(false);
  const [showPDFViewerLiqComisionista, setShowPDFViewerLiqComisionista] = useState(false);
  const [showExcelViewerLiqComisionista, setShowExcelViewerLiqComisionista] = useState(false);
  const [reportDataLiqComisionista, setReportDataLiqComisionista] = useState(null);

   // Estados para reporte de Comisiones PMM
  const [showFormatSelectorComisionesPMM, setShowFormatSelectorComisionesPMM] = useState(false);
  const [showPDFViewerComisionesPMM, setShowPDFViewerComisionesPMM] = useState(false);
  const [showExcelViewerComisionesPMM, setShowExcelViewerComisionesPMM] = useState(false);
  const [reportDataComisionesPMM, setReportDataComisionesPMM] = useState(null);

  // Estados para reporte de Consolidado Pesca
  const [showFormatSelectorConsolidadoPesca, setShowFormatSelectorConsolidadoPesca] = useState(false);
  const [showPDFViewerConsolidadoPesca, setShowPDFViewerConsolidadoPesca] = useState(false);
  const [showExcelViewerConsolidadoPesca, setShowExcelViewerConsolidadoPesca] = useState(false);
  const [reportDataConsolidadoPesca, setReportDataConsolidadoPesca] = useState(null);

  // Objeto con todos los estados de reportes
  const reportStates = {
    distribucion: {
      showFormatSelector: showFormatSelectorDistribucion,
      setShowFormatSelector: setShowFormatSelectorDistribucion,
      showPDFViewer: showPDFViewerDistribucion,
      setShowPDFViewer: setShowPDFViewerDistribucion,
      showExcelViewer: showExcelViewerDistribucion,
      setShowExcelViewer: setShowExcelViewerDistribucion,
      reportData: reportDataDistribucion,
      setReportData: setReportDataDistribucion,
    },
    pesca: {
      showFormatSelector: showFormatSelectorPesca,
      setShowFormatSelector: setShowFormatSelectorPesca,
      showPDFViewer: showPDFViewerPesca,
      setShowPDFViewer: setShowPDFViewerPesca,
      showExcelViewer: showExcelViewerPesca,
      setShowExcelViewer: setShowExcelViewerPesca,
      reportData: reportDataPesca,
      setReportData: setReportDataPesca,
    },
    liquidacionTripulantes: {
      showFormatSelector: showFormatSelectorLiqTripulantes,
      setShowFormatSelector: setShowFormatSelectorLiqTripulantes,
      showPDFViewer: showPDFViewerLiqTripulantes,
      setShowPDFViewer: setShowPDFViewerLiqTripulantes,
      showExcelViewer: showExcelViewerLiqTripulantes,
      setShowExcelViewer: setShowExcelViewerLiqTripulantes,
      reportData: reportDataLiqTripulantes,
      setReportData: setReportDataLiqTripulantes,
    },
    liquidacionArmadores: {
      showFormatSelector: showFormatSelectorLiqArmadores,
      setShowFormatSelector: setShowFormatSelectorLiqArmadores,
      showPDFViewer: showPDFViewerLiqArmadores,
      setShowPDFViewer: setShowPDFViewerLiqArmadores,
      showExcelViewer: showExcelViewerLiqArmadores,
      setShowExcelViewer: setShowExcelViewerLiqArmadores,
      reportData: reportDataLiqArmadores,
      setReportData: setReportDataLiqArmadores,
    },
    liquidacionComisionista: {
      showFormatSelector: showFormatSelectorLiqComisionista,
      setShowFormatSelector: setShowFormatSelectorLiqComisionista,
      showPDFViewer: showPDFViewerLiqComisionista,
      setShowPDFViewer: setShowPDFViewerLiqComisionista,
      showExcelViewer: showExcelViewerLiqComisionista,
      setShowExcelViewer: setShowExcelViewerLiqComisionista,
      reportData: reportDataLiqComisionista,
      setReportData: setReportDataLiqComisionista,
    },
        comisionesPMM: {
      showFormatSelector: showFormatSelectorComisionesPMM,
      setShowFormatSelector: setShowFormatSelectorComisionesPMM,
      showPDFViewer: showPDFViewerComisionesPMM,
      setShowPDFViewer: setShowPDFViewerComisionesPMM,
      showExcelViewer: showExcelViewerComisionesPMM,
      setShowExcelViewer: setShowExcelViewerComisionesPMM,
      reportData: reportDataComisionesPMM,
      setReportData: setReportDataComisionesPMM,
    },
    consolidadoPesca: {
      showFormatSelector: showFormatSelectorConsolidadoPesca,
      setShowFormatSelector: setShowFormatSelectorConsolidadoPesca,
      showPDFViewer: showPDFViewerConsolidadoPesca,
      setShowPDFViewer: setShowPDFViewerConsolidadoPesca,
      showExcelViewer: showExcelViewerConsolidadoPesca,
      setShowExcelViewer: setShowExcelViewerConsolidadoPesca,
      reportData: reportDataConsolidadoPesca,
      setReportData: setReportDataConsolidadoPesca,
    },
  };

  return {
    reportStates,
  };
};