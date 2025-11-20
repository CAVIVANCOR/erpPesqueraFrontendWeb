// src/components/cotizacionVentas/DocumentosRequeridosCard.jsx
/**
 * Card de Documentos Requeridos para Cotización de Ventas
 *
 * @author ERP Megui
 * @version 2.0.0 - Refactorización profesional
 */

import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { generarDocumentosRequeridos } from "../../api/cotizacionVentas";
import { formatearNumero, getResponsiveFontSize } from "../../utils/utils";
import DocumentoRequeridoDialog from "./DocumentoRequeridoDialog";

const DocumentosRequeridosCard = ({
  formData,
  handleChange,
  documentos,
  setDocumentos,
  disabled = false,
  cotizacionId = null,
  toast = null,
  onDocumentosGenerados = null,
  monedasOptions = [],
  docRequeridaVentasOptions = [],
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);
  const [loadingGenerar, setLoadingGenerar] = useState(false);

  const handleAddDocumento = () => {
    setEditingDocumento({
      docRequeridaVentasId: null,
      esObligatorio: true,
      numeroDocumento: "",
      fechaEmision: null,
      fechaVencimiento: null,
      urlDocumento: "",
      verificado: false,
      fechaVerificacion: null,
      verificadoPorId: null,
      observacionesVerificacion: "",
      costoDocumento: 0,
      monedaId: null,
      index: undefined,
    });
    setShowAddDialog(true);
  };

  const handleEditDocumento = (documento, index) => {
    setEditingDocumento({ ...documento, index });
    setShowAddDialog(true);
  };

  const handleDeleteDocumento = (index) => {
    const nuevosDocumentos = documentos.filter((_, i) => i !== index);
    setDocumentos(nuevosDocumentos);
  };

  const handleSaveDocumento = () => {
    if (!editingDocumento.docRequeridaVentasId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un tipo de documento",
        life: 3000,
      });
      return;
    }

    // Preparar el documento con la fecha de verificación si está verificado
    const documentoToSave = {
      ...editingDocumento,
      fechaVerificacion: editingDocumento.verificado ? new Date() : null,
    };
    delete documentoToSave.index;

    if (editingDocumento.index !== undefined) {
      // Editar documento existente
      const nuevosDocumentos = [...documentos];
      nuevosDocumentos[editingDocumento.index] = documentoToSave;
      setDocumentos(nuevosDocumentos);
      
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Documento actualizado correctamente",
        life: 3000,
      });
    } else {
      // Agregar nuevo documento
      setDocumentos([...documentos, documentoToSave]);
      
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Documento agregado correctamente",
        life: 3000,
      });
    }
    
    setShowAddDialog(false);
    setEditingDocumento(null);
  };

  const handleChangeDocumento = (field, value) => {
    setEditingDocumento(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerarDocumentosAutomaticos = async () => {
    if (!cotizacionId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail:
          "Debe guardar la cotización primero antes de generar documentos automáticamente",
        life: 4000,
      });
      return;
    }

    if (!formData.esExportacion) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Esta función solo aplica para cotizaciones de exportación",
        life: 4000,
      });
      return;
    }

    if (!formData.paisDestinoId || !formData.tipoProductoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail:
          "Debe seleccionar País Destino y Tipo de Producto antes de generar documentos",
        life: 4000,
      });
      return;
    }

    try {
      setLoadingGenerar(true);
      const resultado = await generarDocumentosRequeridos(cotizacionId);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail:
          resultado.mensaje ||
          `Se generaron ${resultado.totalCreados} documentos automáticamente`,
        life: 5000,
      });

      // Notificar al padre para que recargue los documentos
      if (resultado.totalCreados > 0 && onDocumentosGenerados) {
        onDocumentosGenerados();
      }
    } catch (error) {
      console.error("Error al generar documentos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje ||
          "Error al generar documentos automáticamente",
        life: 5000,
      });
    } finally {
      setLoadingGenerar(false);
    }
  };

  const obligatorioBodyTemplate = (rowData) => {
    return rowData.esObligatorio ? (
      <span className="p-tag p-tag-success">Sí</span>
    ) : (
      <span className="p-tag p-tag-warning">No</span>
    );
  };

  const verificadoBodyTemplate = (rowData) => {
    return rowData.verificado ? (
      <i className="pi pi-check-circle" style={{ color: "green", fontSize: "1.2rem" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "gray", fontSize: "1.2rem" }} />
    );
  };

  const costoBodyTemplate = (rowData) => {
    if (!rowData.costoDocumento) return "-";
    const moneda = monedasOptions.find(m => m.value === rowData.monedaId);
    return `${moneda?.simbolo || ""} ${formatearNumero(rowData.costoDocumento, 2)}`;
  };

  const nombreDocumentoBodyTemplate = (rowData) => {
    return rowData.docRequeridaVentas?.nombre || rowData.nombre || "-";
  };

  const accionesBodyTemplate = (rowData, { rowIndex }) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-info p-button-text"
          onClick={() => handleEditDocumento(rowData, rowIndex)}
          disabled={disabled}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => handleDeleteDocumento(rowIndex)}
          disabled={disabled}
        />
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3">
        <h3>Documentos Requeridos</h3>
        <div className="flex gap-2">
          <Button
            label="Generar Automáticamente"
            icon="pi pi-bolt"
            className="p-button-success"
            onClick={handleGenerarDocumentosAutomaticos}
            disabled={disabled || loadingGenerar || !cotizacionId}
            loading={loadingGenerar}
            tooltip="Genera documentos según país, tipo de producto e incoterm"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            label="Agregar Manual"
            icon="pi pi-plus"
            onClick={handleAddDocumento}
            disabled={disabled}
          />
        </div>
      </div>

      <DataTable
        value={documentos}
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => handleEditDocumento(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
        emptyMessage="No hay documentos agregados"
      >
        <Column
          header="Documento"
          body={nombreDocumentoBodyTemplate}
          style={{ minWidth: "200px" }}
          sortable
        />
        <Column
          field="numeroDocumento"
          header="Número"
          style={{ minWidth: "120px" }}
          sortable
        />
        <Column
          header="Obligatorio"
          body={obligatorioBodyTemplate}
          style={{ minWidth: "100px" }}
          sortable
        />
        <Column
          header="Verificado"
          body={verificadoBodyTemplate}
          style={{ minWidth: "100px", textAlign: "center" }}
          sortable
        />
        <Column
          header="Costo"
          body={costoBodyTemplate}
          style={{ minWidth: "120px", textAlign: "right" }}
          sortable
        />
        <Column
          field="observacionesVerificacion"
          header="Observaciones"
          style={{ minWidth: "200px" }}
          sortable
        />
        <Column body={accionesBodyTemplate} style={{ minWidth: "100px" }} />
      </DataTable>

      {/* Diálogo para agregar/editar documento */}
      <DocumentoRequeridoDialog
        visible={showAddDialog}
        documento={editingDocumento}
        onHide={() => {
          setShowAddDialog(false);
          setEditingDocumento(null);
        }}
        onSave={handleSaveDocumento}
        onChange={handleChangeDocumento}
        monedasOptions={monedasOptions}
        docRequeridaVentasOptions={docRequeridaVentasOptions}
        saving={false}
      />
    </div>
  );
};

export default DocumentosRequeridosCard;
