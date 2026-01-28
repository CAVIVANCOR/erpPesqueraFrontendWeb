// src/components/ordenCompra/DatosAdicionalesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
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

import PDFMultiCapture from "../pdf/PDFMultiCapture";
import PDFViewerV2 from "../pdf/PDFViewerV2";
import PDFActionButtons from "../pdf/PDFActionButtons";

export default function DatosAdicionalesTab({
  ordenCompraId,
  puedeEditar,
  toast,
  onCountChange,
  readOnly = false,
  permisos = {},
  estadoId,
  onRecargarRegistro,
}) {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDato, setEditingDato] = useState(null);
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    nombreDato: "",
    esDocumento: false,
    imprimirEnOC: false,
    valorDato: "",
    urlDocumento: "",
  });

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
      console.log("📋 [DatosAdicionalesTab] Datos cargados:", data);
      setDatos(data);
    } catch (err) {
      console.error("❌ [DatosAdicionalesTab] Error al cargar datos:", err);
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
    console.log("✏️ [DatosAdicionalesTab] Editando dato:", dato);
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
    console.log(
      "💾 [DatosAdicionalesTab] Intentando guardar dato adicional...",
    );
    console.log("📝 [DatosAdicionalesTab] formData:", formData);
    console.log("🔑 [DatosAdicionalesTab] editingDato:", editingDato);

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
        valorDato: formData.esDocumento
          ? null
          : formData.valorDato?.trim() || null,
        urlDocumento: formData.esDocumento
          ? formData.urlDocumento?.trim() || null
          : null,
      };

      console.log("📤 [DatosAdicionalesTab] Datos a guardar:", dataToSave);

      if (editingDato) {
        await actualizarDatoAdicional(editingDato.id, dataToSave);
        console.log("✅ [DatosAdicionalesTab] Dato actualizado exitosamente");
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Dato adicional actualizado correctamente",
        });
      } else {
        const resultado = await crearDatoAdicional(dataToSave);
        console.log(
          "✅ [DatosAdicionalesTab] Dato creado exitosamente:",
          resultado,
        );
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Dato adicional creado correctamente",
        });
      }

      await cargarDatos();

      console.log("🔄 [DatosAdicionalesTab] Llamando a onRecargarRegistro...");
      if (onRecargarRegistro) {
        await onRecargarRegistro();
        console.log("✅ [DatosAdicionalesTab] onRecargarRegistro ejecutado");
      } else {
        console.warn(
          "⚠️ [DatosAdicionalesTab] onRecargarRegistro no está definido",
        );
      }

      setShowDialog(false);
    } catch (err) {
      console.error("❌ [DatosAdicionalesTab] Error al guardar:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo guardar el dato adicional",
      });
    }
  };

  const handlePdfComplete = async (url) => {
    console.log("📎 [DatosAdicionalesTab] PDF subido exitosamente:", url);
    console.log("📝 [DatosAdicionalesTab] editingDato actual:", editingDato);

    setFormData((prev) => ({ ...prev, urlDocumento: url }));
    setPdfRefreshKey((k) => k + 1);
    setMostrarCaptura(false);

    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail:
        "El documento se consolidó y subió correctamente. Ahora guarde el dato adicional.",
      life: 5000,
    });

    if (editingDato?.id) {
      console.log(
        "💾 [DatosAdicionalesTab] Auto-guardando dato adicional con PDF...",
      );
      try {
        const dataToSave = {
          ordenCompraId: Number(ordenCompraId),
          nombreDato: formData.nombreDato.trim(),
          esDocumento: formData.esDocumento,
          imprimirEnOC: formData.imprimirEnOC,
          valorDato: null,
          urlDocumento: url,
        };

        console.log(
          "📤 [DatosAdicionalesTab] Auto-guardando con datos:",
          dataToSave,
        );
        await actualizarDatoAdicional(editingDato.id, dataToSave);
        console.log("✅ [DatosAdicionalesTab] PDF guardado en dato adicional");

        await cargarDatos();

        console.log(
          "🔄 [DatosAdicionalesTab] Llamando a onRecargarRegistro después de PDF...",
        );
        if (onRecargarRegistro) {
          await onRecargarRegistro();
          console.log(
            "✅ [DatosAdicionalesTab] Orden recargada después de subir PDF",
          );
        }

        toast.current?.show({
          severity: "success",
          summary: "Guardado Automático",
          detail: "El documento se guardó automáticamente en el dato adicional",
          life: 3000,
        });
      } catch (err) {
        console.error(
          "❌ [DatosAdicionalesTab] Error al auto-guardar PDF:",
          err,
        );
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "PDF subido pero debe hacer clic en Guardar para confirmar",
          life: 4000,
        });
      }
    } else {
      console.warn(
        "⚠️ [DatosAdicionalesTab] No hay editingDato.id, no se puede auto-guardar",
      );
    }
  };

  const handlePdfError = (error) => {
    console.error("❌ [DatosAdicionalesTab] Error al subir PDF:", error);
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: error?.message || "No se pudo subir el documento",
      life: 4000,
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
        <span className="text-sm text-500">
          {rowData.urlDocumento || "Sin documento"}
        </span>
      );
    }
    return rowData.valorDato || "-";
  };

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2 align-items-center">
      {rowData.esDocumento && rowData.urlDocumento && (
        <div style={{ display: "inline-block" }}>
          <PDFActionButtons
            pdfUrl={rowData.urlDocumento}
            moduleName="datos-adicionales-oc"
            fileName={`${rowData.nombreDato}.pdf`}
            showViewButton={true}
            showDownloadButton={false}
            viewButtonLabel=""
            className="p-0"
            toast={toast.current}
          />
        </div>
      )}
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
          style={{ width: "180px" }}
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
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esDocumento"
            >
              Tipo de Dato
            </label>
            <Button
              label={
                formData.esDocumento ? "DOCUMENTO ADJUNTO" : "DATO DE TEXTO"
              }
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
                setFormData({
                  ...formData,
                  imprimirEnOC: !formData.imprimirEnOC,
                })
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

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-end",
                marginBottom: "1rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
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

              <div style={{ flex: 1 }}>
                <Button
                  type="button"
                  label="Capturar/Subir"
                  icon="pi pi-upload"
                  className="p-button-info"
                  size="small"
                  onClick={() => setMostrarCaptura(true)}
                  disabled={!puedeEditar || !editingDato?.id}
                />
              </div>

              <div style={{ flex: 2 }}>
                {formData.urlDocumento && (
                  <PDFActionButtons
                    pdfUrl={formData.urlDocumento}
                    moduleName="datos-adicionales-oc"
                    fileName={`datos-adicionales-oc-${editingDato?.id || "sin-id"}.pdf`}
                    viewButtonLabel="Ver"
                    downloadButtonLabel="Descargar"
                    toast={toast}
                  />
                )}
              </div>
            </div>

            {formData.urlDocumento && (
              <div style={{ marginTop: "1rem" }}>
                <PDFViewerV2
                  pdfUrl={formData.urlDocumento}
                  moduleName="datos-adicionales-oc"
                  height="600px"
                  key={pdfRefreshKey}
                />
              </div>
            )}

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

      <PDFMultiCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        moduleName="datos-adicionales-oc"
        entityId={editingDato?.id}
        dialogTitle="Subir Documento"
        onComplete={handlePdfComplete}
        onError={handlePdfError}
      />
    </div>
  );
}
