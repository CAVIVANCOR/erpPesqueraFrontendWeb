// src/components/ordenCompra/DatosAdicionalesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import {
  getDatosAdicionalesOrdenCompra,
  crearDatoAdicional,
  actualizarDatoAdicional,
  eliminarDatoAdicional,
} from "../../api/detDatosAdicionalesOrdenCompra";
import { getResponsiveFontSize } from "../../utils/utils";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

export default function DatosAdicionalesTab({
  ordenCompraId,
  puedeEditar,
  toast,
  onCountChange,
  readOnly = false,
  permisos = {},
  estadoId,
}) {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDato, setEditingDato] = useState(null);
  const [mostrarCaptura, setMostrarCaptura] = useState(false);

  const [formData, setFormData] = useState({
    nombreDato: "",
    esDocumento: false,
    imprimirEnOC: false,
    valorDato: "",
    urlDocumento: "",
  });

  // ⭐ CAMBIO: Datos adicionales siempre editables (pueden surgir a último momento)
  // Ya no se restringe por estado de la orden
  const noSePuedeEditar = false;

  useEffect(() => {
    if (ordenCompraId) {
      cargarDatos();
    }
  }, [ordenCompraId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(datos.length);
    }
  }, [datos, onCountChange]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getDatosAdicionalesOrdenCompra(ordenCompraId);
      setDatos(data);
    } catch (err) {
      console.error("Error al cargar datos adicionales:", err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingDato(null);
    setFormData({
      nombreDato: "",
      esDocumento: false,
      imprimirEnOC: false,
      valorDato: "",
      urlDocumento: "",
    });
    setShowDialog(true);
  };

  const handleEdit = (dato) => {
    setEditingDato(dato);
    setFormData({
      nombreDato: dato.nombreDato || "",
      esDocumento: dato.esDocumento || false,
      imprimirEnOC: dato.imprimirEnOC || false,
      valorDato: dato.valorDato || "",
      urlDocumento: dato.urlDocumento || "",
    });
    setShowDialog(true);
  };

  const handleDelete = (dato) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el dato "${dato.nombreDato}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarDatoAdicional(dato.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Dato adicional eliminado correctamente",
          });
          cargarDatos();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.error ||
              "No se pudo eliminar el dato adicional",
          });
        }
      },
    });
  };

  const handleSave = async () => {
    if (!formData.nombreDato?.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El nombre del dato es obligatorio",
      });
      return;
    }

    if (!formData.esDocumento && !formData.valorDato?.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El valor del dato es obligatorio",
      });
      return;
    }

    if (formData.esDocumento && !formData.urlDocumento?.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La URL del documento es obligatoria",
      });
      return;
    }

    try {
      const dataToSave = {
        ordenCompraId: Number(ordenCompraId),
        nombreDato: formData.nombreDato.trim(),
        esDocumento: formData.esDocumento,
        imprimirEnOC: formData.imprimirEnOC,
        valorDato: formData.esDocumento ? null : formData.valorDato?.trim() || null,
        urlDocumento: formData.esDocumento ? formData.urlDocumento?.trim() || null : null,
      };

      if (editingDato) {
        await actualizarDatoAdicional(editingDato.id, dataToSave);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Dato adicional actualizado correctamente",
        });
      } else {
        await crearDatoAdicional(dataToSave);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Dato adicional creado correctamente",
        });
      }

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo guardar el dato adicional",
      });
    }
  };

  // Función para ver PDF
  const handleVerPDF = (urlDocumento) => {
    if (urlDocumento) {
      abrirPdfEnNuevaPestana(
        urlDocumento,
        toast,
        "No hay documento disponible"
      );
    }
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    setFormData({ ...formData, urlDocumento });
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento se ha subido correctamente",
      life: 3000,
    });
  };

  const tipoTemplate = (rowData) => {
    return rowData.esDocumento ? (
      <Tag value="Documento" severity="info" icon="pi pi-file" />
    ) : (
      <Tag value="Dato" severity="success" icon="pi pi-info-circle" />
    );
  };

  const imprimirTemplate = (rowData) => {
    return rowData.imprimirEnOC ? (
      <Tag value="Sí" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="No" severity="danger" icon="pi pi-times" />
    );
  };

  const valorTemplate = (rowData) => {
    if (rowData.esDocumento) {
      return (
        <div className="flex gap-2 align-items-center">
          <Button
            icon="pi pi-eye"
            className="p-button-text p-button-sm p-button-success"
            onClick={() => handleVerPDF(rowData.urlDocumento)}
            tooltip="Ver documento"
          />
          <span className="text-sm text-500">{rowData.urlDocumento}</span>
        </div>
      );
    }
    return rowData.valorDato || "-";
  };

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        disabled={!puedeEditar}
        tooltip="Editar dato adicional"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        disabled={!puedeEditar}
        tooltip="Eliminar dato adicional"
      />
    </div>
  );

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setShowDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleSave}
        disabled={!puedeEditar}
      />
    </div>
  );

  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          label="Agregar Dato Adicional"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleAdd}
          disabled={!puedeEditar}
          tooltip="Agregar nuevo dato adicional"
        />
      </div>

      <DataTable
        value={datos}
        loading={loading}
        emptyMessage="No hay datos adicionales agregados"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} datos"
        size="small"
        showGridlines
        stripedRows
        sortField="id"
        sortOrder={-1}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="nombreDato" header="Nombre del Dato" />
        <Column
          field="esDocumento"
          header="Tipo"
          body={tipoTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="valorDato"
          header="Valor / Documento"
          body={valorTemplate}
        />
        <Column
          field="imprimirEnOC"
          header="Imprimir en OC"
          body={imprimirTemplate}
          style={{ width: "140px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{ width: "1300px" }}
        header={editingDato ? "Editar Dato Adicional" : "Nuevo Dato Adicional"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
        maximizable
      >
        <div className="field">
          <label htmlFor="nombreDato">
            Nombre del Dato <span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="nombreDato"
            value={formData.nombreDato}
            onChange={(e) =>
              setFormData({ ...formData, nombreDato: e.target.value })
            }
            placeholder="Ej: Guía de Remisión, CLP, Fecha de Cosecha"
            disabled={!puedeEditar}
          />
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* ES DOCUMENTO */}
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esDocumento"
            >
              Tipo de Dato
            </label>
            <Button
              label={formData.esDocumento ? "DOCUMENTO ADJUNTO" : "DATO DE TEXTO"}
              icon={formData.esDocumento ? "pi pi-file" : "pi pi-info-circle"}
              severity={formData.esDocumento ? "info" : "success"}
              onClick={() =>
                setFormData({ ...formData, esDocumento: !formData.esDocumento })
              }
              disabled={!puedeEditar}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
              }}
            />
          </div>

          {/* IMPRIMIR EN OC */}
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="imprimirEnOC"
            >
              Imprimir en OC
            </label>
            <Button
              label={formData.imprimirEnOC ? "SÍ IMPRIMIR" : "NO IMPRIMIR"}
              icon={formData.imprimirEnOC ? "pi pi-check" : "pi pi-times"}
              severity={formData.imprimirEnOC ? "success" : "danger"}
              onClick={() =>
                setFormData({ ...formData, imprimirEnOC: !formData.imprimirEnOC })
              }
              disabled={!puedeEditar}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
              }}
            />
          </div>
        </div>

        {!formData.esDocumento ? (
          <div className="field">
            <label htmlFor="valorDato">
              Valor del Dato <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              id="valorDato"
              value={formData.valorDato}
              onChange={(e) =>
                setFormData({ ...formData, valorDato: e.target.value })
              }
              rows={3}
              placeholder="Ej: 09/01/2024 14:30, Don José II, LOTE-2024-001"
              disabled={!puedeEditar}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="urlDocumento">
              Documento Adjunto <span style={{ color: "red" }}>*</span>
            </label>
            {/* URL del documento con botones */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-end",
                marginBottom: "1rem",
              }}
            >
              <div style={{ flex: 2 }}>
                <InputText
                  id="urlDocumento"
                  value={formData.urlDocumento}
                  placeholder="URL del documento adjunto"
                  style={{ fontWeight: "bold" }}
                  readOnly
                  disabled={!puedeEditar}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ flex: 0.5 }}>
                <Button
                  type="button"
                  label="Capturar/Subir"
                  icon="pi pi-camera"
                  className="p-button-info"
                  size="small"
                  onClick={() => setMostrarCaptura(true)}
                  disabled={!puedeEditar}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                {formData.urlDocumento && (
                  <Button
                    type="button"
                    label="Ver PDF"
                    icon="pi pi-eye"
                    className="p-button-success"
                    size="small"
                    onClick={() => handleVerPDF(formData.urlDocumento)}
                  />
                )}
              </div>
            </div>

            {/* Visor de PDF */}
            {formData.urlDocumento && (
              <div style={{ marginTop: "1rem" }}>
                <PDFViewer urlDocumento={formData.urlDocumento} />
              </div>
            )}

            {/* Mensaje si no hay documento */}
            {!formData.urlDocumento && (
              <div style={{ marginTop: "1rem" }}>
                <Message
                  severity="warn"
                  text="No hay documento adjunto. Use el botón 'Capturar/Subir' para agregar uno."
                />
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Modal de captura de documento */}
      <DocumentoCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        onDocumentoSubido={handleDocumentoSubido}
        endpoint="/api/det-datos-adicionales-orden-compra/upload-documento"
        titulo="Capturar Documento Adjunto"
        toast={toast}
        extraData={{ detDatosAdicionalesOrdenCompraId: editingDato?.id }}
      />
    </div>
  );
}