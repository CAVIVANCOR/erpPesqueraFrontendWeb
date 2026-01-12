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
import {
  getDatosAdicionalesOrdenCompra,
  crearDatoAdicional,
  actualizarDatoAdicional,
  eliminarDatoAdicional,
} from "../../api/detDatosAdicionalesOrdenCompra";
import { getResponsiveFontSize } from "../../utils/utils";

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

  const [formData, setFormData] = useState({
    nombreDato: "",
    esDocumento: false,
    imprimirEnOC: false,
    valorDato: "",
    urlDocumento: "",
  });

  // Verificar si la orden está aprobada (39), con kardex generado (50) o anulada (40)
  const estaAprobada = Number(estadoId) === 39;
  const kardexGenerado = Number(estadoId) === 50;
  const estaAnulada = Number(estadoId) === 40;
  const noSePuedeEditar = estaAprobada || kardexGenerado || estaAnulada;

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
        <a
          href={rowData.urlDocumento}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          <i className="pi pi-external-link mr-1"></i>
          Ver documento
        </a>
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
        disabled={!puedeEditar || noSePuedeEditar}
        tooltip={
          noSePuedeEditar 
            ? "No se puede editar una orden aprobada, con kardex generado o anulada" 
            : ""
        }
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        disabled={!puedeEditar || noSePuedeEditar}
        tooltip={
          noSePuedeEditar 
            ? "No se puede eliminar de una orden aprobada, con kardex generado o anulada" 
            : ""
        }
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
        disabled={!puedeEditar || noSePuedeEditar}
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
          disabled={!puedeEditar || noSePuedeEditar}
          tooltip={
            noSePuedeEditar 
              ? "No se pueden agregar datos a una orden aprobada, con kardex generado o anulada" 
              : ""
          }
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
        style={{ width: "600px" }}
        header={editingDato ? "Editar Dato Adicional" : "Nuevo Dato Adicional"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
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

        <div className="field-checkbox">
          <Checkbox
            inputId="esDocumento"
            checked={formData.esDocumento}
            onChange={(e) =>
              setFormData({ ...formData, esDocumento: e.checked })
            }
            disabled={!puedeEditar}
          />
          <label htmlFor="esDocumento">Es un documento adjunto</label>
        </div>

        <div className="field-checkbox">
          <Checkbox
            inputId="imprimirEnOC"
            checked={formData.imprimirEnOC}
            onChange={(e) =>
              setFormData({ ...formData, imprimirEnOC: e.checked })
            }
            disabled={!puedeEditar}
          />
          <label htmlFor="imprimirEnOC">Imprimir en la Orden de Compra</label>
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
              URL del Documento <span style={{ color: "red" }}>*</span>
            </label>
            <InputText
              id="urlDocumento"
              value={formData.urlDocumento}
              onChange={(e) =>
                setFormData({ ...formData, urlDocumento: e.target.value })
              }
              placeholder="Ej: /uploads/ordenes-compra/1234/guia_remision.pdf"
              disabled={!puedeEditar}
            />
            <small className="p-text-secondary">
              Ruta relativa o URL completa del documento adjunto
            </small>
          </div>
        )}
      </Dialog>
    </div>
  );
}