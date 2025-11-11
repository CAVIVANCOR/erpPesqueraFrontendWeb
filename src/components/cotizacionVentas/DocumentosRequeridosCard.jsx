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
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

const DocumentosRequeridosCard = ({
  formData,
  handleChange,
  documentos,
  setDocumentos,
  disabled = false,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);

  const handleAddDocumento = () => {
    setEditingDocumento({
      nombre: "",
      tipo: "REQUERIDO",
      obligatorio: true,
      descripcion: "",
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
    if (editingDocumento.nombre) {
      if (editingDocumento.index !== undefined) {
        // Editar documento existente
        const nuevosDocumentos = [...documentos];
        nuevosDocumentos[editingDocumento.index] = editingDocumento;
        setDocumentos(nuevosDocumentos);
      } else {
        // Agregar nuevo documento
        setDocumentos([...documentos, editingDocumento]);
      }
      setShowAddDialog(false);
      setEditingDocumento(null);
    }
  };

  const obligatorioBodyTemplate = (rowData) => {
    return rowData.obligatorio ? 
      <span className="p-tag p-tag-success">Sí</span> : 
      <span className="p-tag p-tag-warning">No</span>;
  };

  const accionesBodyTemplate = (rowData, { rowIndex }) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-text"
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
        <Button
          label="Agregar Documento"
          icon="pi pi-plus"
          onClick={handleAddDocumento}
          disabled={disabled}
        />
      </div>

      <DataTable
        value={documentos}
        emptyMessage="No hay documentos agregados"
        responsiveLayout="scroll"
      >
        <Column field="nombre" header="Nombre Documento" style={{ minWidth: '200px' }} />
        <Column field="tipo" header="Tipo" style={{ minWidth: '150px' }} />
        <Column 
          field="obligatorio" 
          header="Obligatorio" 
          body={obligatorioBodyTemplate}
          style={{ minWidth: '120px' }} 
        />
        <Column field="descripcion" header="Descripción" style={{ minWidth: '250px' }} />
        <Column 
          body={accionesBodyTemplate}
          style={{ minWidth: '100px' }}
        />
      </DataTable>

      {/* Dialog para agregar/editar documento */}
      <Dialog
        header={editingDocumento?.index !== undefined ? "Editar Documento" : "Agregar Documento"}
        visible={showAddDialog}
        style={{ width: '50vw' }}
        onHide={() => {
          setShowAddDialog(false);
          setEditingDocumento(null);
        }}
      >
        {editingDocumento && (
          <div className="grid">
            <div className="col-12">
              <label htmlFor="nombre" style={{ fontWeight: 'bold' }}>
                Nombre Documento *
              </label>
              <InputText
                id="nombre"
                value={editingDocumento.nombre}
                onChange={(e) => setEditingDocumento({ ...editingDocumento, nombre: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="tipo" style={{ fontWeight: 'bold' }}>
                Tipo Documento *
              </label>
              <Dropdown
                id="tipo"
                value={editingDocumento.tipo}
                options={[
                  { label: "REQUERIDO", value: "REQUERIDO" },
                  { label: "OPCIONAL", value: "OPCIONAL" },
                  { label: "INFORMATIVO", value: "INFORMATIVO" },
                ]}
                onChange={(e) => setEditingDocumento({ ...editingDocumento, tipo: e.value })}
                placeholder="Seleccionar tipo"
                style={{ width: '100%' }}
              />
            </div>

            <div className="col-12 md:col-6">
              <div className="flex align-items-center mt-4">
                <Checkbox
                  inputId="obligatorio"
                  checked={editingDocumento.obligatorio}
                  onChange={(e) => setEditingDocumento({ ...editingDocumento, obligatorio: e.checked })}
                />
                <label htmlFor="obligatorio" className="ml-2" style={{ fontWeight: 'bold' }}>
                  Es Obligatorio
                </label>
              </div>
            </div>

            <div className="col-12">
              <label htmlFor="descripcion" style={{ fontWeight: 'bold' }}>
                Descripción
              </label>
              <InputText
                id="descripcion"
                value={editingDocumento.descripcion}
                onChange={(e) => setEditingDocumento({ ...editingDocumento, descripcion: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={() => {
              setShowAddDialog(false);
              setEditingDocumento(null);
            }}
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            onClick={handleSaveDocumento}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default DocumentosRequeridosCard;