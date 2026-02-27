import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import * as XLSX from "xlsx";

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
  fileName = "reporte.xlsx",
  title = "Reporte Excel",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [excelBlob, setExcelBlob] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  useEffect(() => {
    if (!visible) {
      return;
    }

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Cargar logo y datos de empresa usando endpoint genérico
        const empresaId = data?.temporada?.empresa?.id;
        let logoBase64Data = null;

        if (empresaId) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/empresas-logo/${empresaId}/logo-base64`,
            );

            if (response.ok) {
              const result = await response.json();
              logoBase64Data = result.logoBase64;
            }
          } catch (logoError) {
            console.warn("No se pudo cargar el logo:", logoError);
          }
        }

        setLogoBase64(logoBase64Data);

        // 2. Generar Excel
        const blob = await generateExcel(data);
        setExcelBlob(blob);

        // 3. Convertir blob a ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();

        // 4. Leer Excel con SheetJS
        const workbook = XLSX.read(arrayBuffer, {
          type: "array",
          cellStyles: true,
        });

        // 5. Obtener primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 6. Convertir a array de arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: false,
        });

        setTableData(jsonData);
      } catch (err) {
        console.error("Error generando Excel:", err);
        setError(err.message || "Error al generar el archivo Excel");
      } finally {
        setLoading(false);
      }
    };

    generate();

    // Cleanup
    return () => {
      setExcelBlob(null);
      setTableData(null);
      setLogoBase64(null);
    };
  }, [visible, data, generateExcel]);

  const handleDownload = () => {
    if (!excelBlob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(excelBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleClose = () => {
    setExcelBlob(null);
    setTableData(null);
    setError(null);
    onHide();
  };

  const renderTable = () => {
    if (!tableData || tableData.length === 0) return null;

    // Separar header/títulos de la tabla de datos
    let headerEndIndex = 0;
    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];
      if (
        row.some(
          (cell) => cell === "N°" || cell === "Zona" || cell === "Tipo Cuota",
        )
      ) {
        headerEndIndex = i;
        break;
      }
    }

    const headerRows = tableData.slice(0, headerEndIndex);
    const tableRows = tableData.slice(headerEndIndex);

    // Obtener datos de empresa desde data
    const empresa = data?.temporada?.empresa;

    // Construir URL del logo usando VITE_API_URL
    // El endpoint /empresas-logo/:id/logo ya tiene CORS configurado correctamente
    const logoUrl =
      empresa?.logo && empresa?.id
        ? `${import.meta.env.VITE_API_URL}/empresas-logo/${empresa.id}/logo`
        : null;

    return (
      <>
        {/* HEADER Y TÍTULOS */}
        {headerRows.length > 0 && (
          <div className="excel-header-section">
            {/* LOGO Y DATOS DE EMPRESA */}
            {/* LOGO Y DATOS DE EMPRESA */}
            <div className="excel-header-empresa">
              {logoBase64 && (
                <div className="excel-logo-container">
                  <img
                    src={logoBase64}
                    alt="Logo empresa"
                    className="excel-logo"
                  />
                </div>
              )}
              <div className="excel-empresa-info">
                {headerRows.slice(0, 3).map((row, rowIndex) => {
                  const cellContent = row[0] || "";
                  const isEmpresaRow = rowIndex === 0;
                  const isRucRow = cellContent.includes("RUC:");
                  const isDireccionRow = cellContent.includes("Dirección:");

                  return (
                    <div
                      key={rowIndex}
                      className={`
                        excel-header-row
                        ${isEmpresaRow ? "empresa-row" : ""}
                        ${isRucRow ? "ruc-row" : ""}
                        ${isDireccionRow ? "direccion-row" : ""}
                      `}
                    >
                      {cellContent}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TÍTULOS DEL REPORTE */}
            <div className="excel-header-titulos">
              {headerRows.slice(3).map((row, rowIndex) => {
                const cellContent = row[0] || "";
                const isTituloRow = cellContent.includes(
                  "DISTRIBUCION EMBARCACIONES",
                );
                const isNombreTemporadaRow =
                  !cellContent.includes("DISTRIBUCION") &&
                  !cellContent.includes("Maxima Captura") &&
                  cellContent.trim() !== "";
                const isMaximaCapturaRow =
                  cellContent.includes("Maxima Captura");

                if (!cellContent.trim()) return null;

                return (
                  <div
                    key={rowIndex}
                    className={`
                      excel-header-row
                      ${isTituloRow ? "titulo-principal-row" : ""}
                      ${isNombreTemporadaRow ? "nombre-temporada-row" : ""}
                      ${isMaximaCapturaRow ? "maxima-captura-row" : ""}
                    `}
                  >
                    {cellContent}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TABLA DE DATOS */}
        <table className="excel-preview-table">
          <tbody>
            {tableRows.map((row, rowIndex) => {
              const isHeaderRow = row.some(
                (cell) =>
                  cell === "N°" || cell === "Zona" || cell === "Tipo Cuota",
              );

              const isSubtotalRow = row.some(
                (cell) =>
                  typeof cell === "string" &&
                  (cell.includes("Subtotal") || cell === "Total"),
              );

              return (
                <tr
                  key={rowIndex}
                  className={`
                    ${isHeaderRow ? "header-row" : ""}
                    ${isSubtotalRow ? "subtotal-row" : ""}
                    ${!isHeaderRow && !isSubtotalRow && rowIndex % 2 === 0 ? "even-row" : ""}
                  `}
                >
                  {row.map((cell, cellIndex) => {
                    let cellContent = cell || "";

                    const isNumberCell =
                      typeof cell === "number" ||
                      (typeof cell === "string" && /^\d+(\.\d+)?$/.test(cell));

                    return (
                      <td
                        key={cellIndex}
                        className={`
                          ${cellIndex === 0 ? "col-numero" : ""}
                          ${cellIndex === 5 ? "col-precio" : ""}
                          ${cellIndex === 6 ? "col-pmce" : ""}
                          ${cellIndex === 7 ? "col-limite" : ""}
                          ${isNumberCell ? "number-cell" : ""}
                        `}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };

  const footerContent = (
    <div className="flex gap-2">
      <Button
        label="Descargar Excel"
        icon="pi pi-download"
        onClick={handleDownload}
        className="p-button-success"
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
      style={{ width: "95vw", height: "95vh" }}
      contentStyle={{ height: "calc(95vh - 150px)", padding: 0 }}
    >
      {loading && (
        <div
          className="flex flex-column justify-content-center align-items-center"
          style={{ height: "100%" }}
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
            style={{ width: "100%" }}
          />
        </div>
      )}

      {!loading && !error && tableData && (
        <div
          style={{
            height: "100%",
            width: "100%",
            overflow: "auto",
            padding: "1.5rem",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div
            className="mb-3 p-3"
            style={{
              backgroundColor: "#e3f2fd",
              borderLeft: "4px solid #2196f3",
              borderRadius: "4px",
            }}
          >
            <div className="flex align-items-center gap-2">
              <i
                className="pi pi-info-circle"
                style={{ color: "#2196f3", fontSize: "1.2rem" }}
              ></i>
              <div>
                <strong>Vista Previa del Reporte</strong>
                <p className="m-0 mt-1 text-sm text-600">
                  Para ver el formato completo con todos los colores, bordes y
                  estilos de ExcelJS,
                  <strong> descarga el archivo</strong> y ábrelo en Microsoft
                  Excel.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {renderTable()}
          </div>

          <style>{`
            /* HEADER Y TÍTULOS */
            .excel-header-section {
              margin-bottom: 1.5rem;
              background-color: white;
              padding: 1.5rem 2rem 1rem 2rem;
              border-radius: 4px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            }
            
            /* LOGO Y DATOS DE EMPRESA */
            .excel-header-empresa {
              display: flex;
              align-items: flex-start;
              gap: 1rem;
              margin-bottom: 1rem;
              padding-bottom: 0.8rem;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .excel-logo-container {
              flex-shrink: 0;
            }
            
            .excel-logo {
              max-width: 80px;
              max-height: 80px;
              object-fit: contain;
            }
            
            .excel-empresa-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            /* TÍTULOS DEL REPORTE */
            .excel-header-titulos {
              margin-top: 0.8rem;
            }
            
            .excel-header-row {
              text-align: center;
              margin-bottom: 0.3rem;
            }
            
            .excel-header-row.empresa-row {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 0.2rem;
              text-align: left;
            }
            
            .excel-header-row.ruc-row,
            .excel-header-row.direccion-row {
              font-size: 10px;
              color: #333;
              margin-bottom: 0.2rem;
              text-align: left;
            }
            
            .excel-header-row.titulo-principal-row {
              font-weight: bold;
              font-size: 11px;
              margin-top: 0.5rem;
              margin-bottom: 0.3rem;
            }
            
            .excel-header-row.nombre-temporada-row {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 0.3rem;
            }
            
            .excel-header-row.maxima-captura-row {
              font-weight: bold;
              font-size: 10px;
              margin-bottom: 0.5rem;
            }
            
            /* TABLA */
            .excel-preview-table {
              border-collapse: collapse;
              width: 100%;
              font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
            }
            
            .excel-preview-table td {
              border: 1px solid #CCCCCC;
              padding: 6px 8px;
              text-align: left;
              vertical-align: middle;
              background-color: white;
            }
            
            /* Fila de header de tabla - EXACTO A EXCELJS */
            .excel-preview-table .header-row td {
              background-color: #ADD8E6;
              color: #000000;
              font-weight: bold;
              text-align: center;
              border: 1px solid #000000;
              padding: 8px 6px;
              vertical-align: middle;
            }
            
            /* Filas de datos - Bordes grises claros */
            .excel-preview-table tr:not(.header-row):not(.subtotal-row) td {
              border: 1px solid #CCCCCC;
            }
            
            /* Filas de datos alternadas - Fondo gris muy claro */
            .excel-preview-table .even-row td {
              background-color: #F5F5F5;
            }
            
            /* Hover en filas de datos */
            .excel-preview-table tr:not(.header-row):not(.subtotal-row):hover td {
              background-color: #E8F4F8;
            }
            
            /* Filas de subtotal - EXACTO A EXCELJS */
            .excel-preview-table .subtotal-row td {
              background-color: #D9EDF7;
              font-weight: bold;
              border: 1px solid #000000;
              padding: 6px 8px;
            }
            
            /* Fila de total - EXACTO A EXCELJS */
            .excel-preview-table tbody tr:last-child td {
              background-color: #ADD8E6;
              font-weight: bold;
              border-top: 2px solid #000000;
              border-bottom: 2px solid #000000;
              border-left: 1px solid #000000;
              border-right: 1px solid #000000;
              font-size: 11px;
            }
            
            /* Alineaciones por columna - EXACTO A EXCELJS */
            .excel-preview-table .col-numero {
              text-align: center;
              width: 48px;
            }
            
            .excel-preview-table td:nth-child(2) {
              text-align: left;
              width: 80px;
            }
            
            .excel-preview-table td:nth-child(3) {
              text-align: left;
              width: 112px;
            }
            
            .excel-preview-table td:nth-child(4) {
              text-align: left;
              width: 104px;
            }
            
            .excel-preview-table td:nth-child(5) {
              text-align: left;
              width: 280px;
            }
            
            .excel-preview-table .col-precio {
              text-align: center;
              width: 144px;
            }
            
            .excel-preview-table .col-pmce {
              text-align: center;
              width: 112px;
            }
            
            .excel-preview-table .col-limite {
              text-align: right;
              width: 160px;
              font-weight: normal;
            }
            
            /* Formato de números con separador de miles */
            .excel-preview-table td.number-cell {
              font-variant-numeric: tabular-nums;
            }
          `}</style>
        </div>
      )}

      {!loading && !error && !tableData && (
        <div className="text-center p-5">
          <i
            className="pi pi-file-excel"
            style={{ fontSize: "3rem", color: "#ccc" }}
          ></i>
          <p className="mt-3 text-600">No hay archivo Excel para mostrar</p>
        </div>
      )}
    </Dialog>
  );
};

export default TemporaryExcelViewer;
