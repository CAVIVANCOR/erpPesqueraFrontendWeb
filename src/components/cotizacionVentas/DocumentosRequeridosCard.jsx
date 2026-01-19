// src/components/cotizacionVentas/DocumentosRequeridosCard.jsx
/**
 * Card de Documentos Requeridos para Cotización de Ventas
 *
 * @author ERP Megui
 * @version 2.0.0 - Refactorización profesional
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import DocumentoRequeridoDialog from "./DocumentoRequeridoDialog";
import {
  getDocumentosPorCotizacion,
  crearDetalleDocReqCotizaVentas,
  actualizarDetalleDocReqCotizaVentas,
  eliminarDetalleDocReqCotizaVentas,
} from "../../api/detDocsReqCotizaVentas";
import { generarDocumentosRequeridos } from "../../api/cotizacionVentas";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";

const DocumentosRequeridosCard = ({
  formData,
  handleChange,
  documentos = [],
  setDocumentos,
  bancos = [],
  formasTransaccion = [],
  modosDespacho = [],
  monedasOptions = [],
  docRequeridaVentasOptions = [],
  readOnly = false,
  disabled = false,
  cotizacionId = null,
  toast = null,
  onDocumentosGenerados = null,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);
  const [loadingGenerar, setLoadingGenerar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Función para cargar documentos desde la BD
  const cargarDocumentos = async () => {
    if (!cotizacionId) return;

    try {
      const docs = await getDocumentosPorCotizacion(cotizacionId);
      setDocumentos(docs);

      // Notificar al componente padre si existe callback
      if (onDocumentosGenerados) {
        onDocumentosGenerados();
      }
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    }
  };

  // Cargar documentos cuando cambia el cotizacionId
  useEffect(() => {
    if (cotizacionId) {
      cargarDocumentos();
    }
  }, [cotizacionId]);

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
    const documento = documentos[index];
    const nombreDoc =
      documento.docRequeridaVentas?.nombre ||
      documento.nombre ||
      "este documento";

    confirmDialog({
      message: `¿Está seguro de eliminar "${nombreDoc}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        if (!documento.id) {
          // Si no tiene ID, solo remover del estado local
          const nuevosDocumentos = documentos.filter((_, i) => i !== index);
          setDocumentos(nuevosDocumentos);
          toast?.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Documento eliminado correctamente",
            life: 3000,
          });
          return;
        }

        try {
          // Eliminar de la base de datos
          await eliminarDetalleDocReqCotizaVentas(documento.id);

          toast?.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Documento eliminado correctamente",
            life: 3000,
          });

          // Recargar documentos desde BD
          await cargarDocumentos();
        } catch (error) {
          console.error("Error al eliminar documento:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.error || "No se pudo eliminar el documento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSaveDocumento = async () => {
    if (!editingDocumento.docRequeridaVentasId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un tipo de documento",
        life: 3000,
      });
      return;
    }

    if (!cotizacionId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Cotización no guardada",
        detail:
          "Debe guardar la cotización primero antes de agregar documentos",
        life: 4000,
      });
      return;
    }

    try {
      setSaving(true);

      if (editingDocumento.id) {
        // Actualizar documento existente en BD
        // Solo enviar campos actualizables (sin IDs de relación)
        const dataToUpdate = {
          numeroDocumento: editingDocumento.numeroDocumento?.trim() || null,
          urlDocumento: editingDocumento.urlDocumento?.trim() || null,
          fechaEmision: editingDocumento.fechaEmision,
          fechaVencimiento: editingDocumento.fechaVencimiento,
          esObligatorio: Boolean(editingDocumento.esObligatorio),
          verificado: Boolean(editingDocumento.verificado),
          fechaVerificacion: editingDocumento.verificado
            ? editingDocumento.fechaVerificacion || new Date()
            : null,
          verificadoPorId: editingDocumento.verificadoPorId
            ? Number(editingDocumento.verificadoPorId)
            : null,
          observacionesVerificacion:
            editingDocumento.observacionesVerificacion?.trim() || null,
          costoDocumento: editingDocumento.costoDocumento || null,
          monedaId: editingDocumento.monedaId
            ? Number(editingDocumento.monedaId)
            : null,
        };

        await actualizarDetalleDocReqCotizaVentas(
          editingDocumento.id,
          dataToUpdate,
        );
        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Documento actualizado correctamente",
          life: 3000,
        });
      } else {
        // Crear nuevo documento en BD
        // Incluir IDs de relación solo en CREATE
        const dataToCreate = {
          cotizacionVentasId: Number(cotizacionId),
          docRequeridaVentasId: Number(editingDocumento.docRequeridaVentasId),
          numeroDocumento: editingDocumento.numeroDocumento?.trim() || null,
          urlDocumento: editingDocumento.urlDocumento?.trim() || null,
          fechaEmision: editingDocumento.fechaEmision,
          fechaVencimiento: editingDocumento.fechaVencimiento,
          esObligatorio: Boolean(editingDocumento.esObligatorio),
          verificado: Boolean(editingDocumento.verificado),
          fechaVerificacion: editingDocumento.verificado
            ? editingDocumento.fechaVerificacion || new Date()
            : null,
          verificadoPorId: editingDocumento.verificadoPorId
            ? Number(editingDocumento.verificadoPorId)
            : null,
          observacionesVerificacion:
            editingDocumento.observacionesVerificacion?.trim() || null,
          costoDocumento: editingDocumento.costoDocumento || null,
          monedaId: editingDocumento.monedaId
            ? Number(editingDocumento.monedaId)
            : null,
        };

        await crearDetalleDocReqCotizaVentas(dataToCreate);
        toast?.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Documento creado correctamente",
          life: 3000,
        });
      }

      // Recargar documentos desde BD
      await cargarDocumentos();

      setShowAddDialog(false);
      setEditingDocumento(null);
    } catch (error) {
      console.error("Error al guardar documento:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error || "No se pudo guardar el documento",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeDocumento = (field, value) => {
    setEditingDocumento((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerarDocumentosAutomaticos = async () => {
    if (!cotizacionId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Cotización no guardada",
        detail:
          "Debe guardar la cotización primero antes de generar documentos automáticamente",
        life: 4000,
      });
      return;
    }

    if (!formData.esExportacion) {
      toast?.current?.show({
        severity: "warn",
        summary: "No es exportación",
        detail:
          "Esta función solo aplica para cotizaciones de exportación. Marque el checkbox 'Es Exportación' en la pestaña Generales.",
        life: 5000,
      });
      return;
    }

    if (!formData.paisDestinoId || !formData.tipoProductoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Datos incompletos",
        detail:
          "Debe seleccionar País Destino y Tipo de Producto en la pestaña Generales antes de generar documentos",
        life: 5000,
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
      <i
        className="pi pi-check-circle"
        style={{ color: "green", fontSize: "1.2rem" }}
      />
    ) : (
      <i
        className="pi pi-times-circle"
        style={{ color: "gray", fontSize: "1.2rem" }}
      />
    );
  };

  const costoBodyTemplate = (rowData) => {
    if (!rowData.costoDocumento) return "-";
    
    // Usar moneda del documento, o la moneda de la cotización como fallback
    const monedaId = rowData.monedaId || formData.monedaId;
    const moneda = monedasOptions.find((m) => m.value === monedaId);
    
    return `${moneda?.simbolo || "S/"} ${formatearNumero(rowData.costoDocumento, 2)}`;
  };

  const nombreDocumentoBodyTemplate = (rowData) => {
    const nombre =
      rowData.docRequeridaVentas?.nombre ||
      rowData.nombre ||
      rowData.observacionesVerificacion ||
      "Sin nombre";
    const esIncompleto = !rowData.numeroDocumento && !rowData.urlDocumento;

    return (
      <div className="flex align-items-center gap-2">
        <span>{nombre}</span>
        {esIncompleto && (
          <i
            className="pi pi-exclamation-triangle"
            style={{ color: "orange", fontSize: "0.9rem" }}
            title="Documento incompleto - Sin número ni archivo"
          />
        )}
      </div>
    );
  };

  const accionesBodyTemplate = (rowData, { rowIndex }) => {
    return (
      <div className="flex gap-2 justify-content-center">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditDocumento(rowData, rowIndex);
          }}
          disabled={disabled || readOnly}
          tooltip="Editar documento"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          type="button"
          icon="pi pi-eye"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (rowData.urlDocumento) {
              window.open(rowData.urlDocumento, "_blank");
            } else {
              toast?.current?.show({
                severity: "warn",
                summary: "Sin PDF",
                detail: "Este documento no tiene un archivo PDF cargado",
                life: 3000,
              });
            }
          }}
          disabled={!rowData.urlDocumento}
          tooltip={rowData.urlDocumento ? "Ver PDF" : "Sin PDF cargado"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteDocumento(rowIndex);
          }}
          disabled={disabled || readOnly}
          tooltip="Eliminar documento"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Determinar tooltip dinámico para el botón Generar Automáticamente
  const getTooltipGenerarAutomatico = () => {
    if (!cotizacionId) return "Debe guardar la cotización primero";
    if (!formData.esExportacion) return "Solo para cotizaciones de exportación";
    if (!formData.paisDestinoId || !formData.tipoProductoId)
      return "Falta País Destino o Tipo de Producto";
    if (readOnly) return "Modo solo lectura";
    return "Genera documentos según país, tipo de producto e incoterm";
  };

  // Verificar si hay documentos incompletos
  const documentosIncompletos = documentos.filter(
    (doc) => !doc.numeroDocumento && !doc.urlDocumento,
  );
  const hayDocumentosIncompletos = documentosIncompletos.length > 0;

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          gap: 5,
          alignItems: "center",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>Documentos Requeridos</h3>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Generar Automáticamente"
            icon="pi pi-bolt"
            severity="success"
            onClick={handleGenerarDocumentosAutomaticos}
            disabled={
              readOnly ||
              loadingGenerar ||
              !cotizacionId ||
              !formData.esExportacion ||
              !formData.paisDestinoId ||
              !formData.tipoProductoId
            }
            loading={loadingGenerar}
            tooltip={getTooltipGenerarAutomatico()}
            tooltipOptions={{ position: "top" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Agregar Manual"
            icon="pi pi-plus"
            onClick={handleAddDocumento}
            disabled={disabled || readOnly}
            tooltip={
              readOnly ? "Modo solo lectura" : "Agregar documento manualmente"
            }
            tooltipOptions={{ position: "top" }}
          />
        </div>
        {hayDocumentosIncompletos && (
          <div style={{ flex: 3 }}>
            <div className="flex align-items-center gap-2">
              <div>
                <strong style={{ color: "#856404" }}>
                  Documentos incompletos detectados (
                  {documentosIncompletos.length})
                </strong>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#856404",
                    fontSize: "0.9rem",
                  }}
                >
                  Hay documentos sin número ni archivo. Puede eliminarlos usando
                  el botón{" "}
                  <i className="pi pi-trash" style={{ fontSize: "0.8rem" }} />y
                  luego usar "Generar Automáticamente" para crear documentos
                  completos según el país y tipo de producto.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        value={documentos}
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => {
          if (!disabled && !readOnly) {
            const index = documentos.findIndex((doc) => doc === e.data);
            handleEditDocumento(e.data, index);
          }
        }}
        style={{
          cursor: disabled || readOnly ? "default" : "pointer",
          fontSize: getResponsiveFontSize(),
        }}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 40, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
        emptyMessage="No hay documentos agregados"
      >
        <Column field="id" header="ID" style={{ minWidth: "100px" }} sortable />
        <Column
          field="docRequeridaVentas.nombre"
          sortField="docRequeridaVentas.nombre"
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
          field="costoDocumento"
          sortField="costoDocumento"
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
        <Column
          header="Acciones"
          body={accionesBodyTemplate}
          style={{ minWidth: "160px", textAlign: "center" }}
          frozen
          alignFrozen="right"
        />
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
        saving={saving}
        toast={toast}
      />
    </div>
  );
};

export default DocumentosRequeridosCard;
