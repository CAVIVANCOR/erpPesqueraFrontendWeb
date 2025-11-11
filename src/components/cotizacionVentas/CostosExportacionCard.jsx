// src/components/cotizacionVentas/CostosExportacionCard.jsx
/**
 * Card de Costos de Exportación para Cotización de Ventas
 *
 * @author ERP Megui
 * @version 2.0.0 - Refactorización profesional
 */

import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

const CostosExportacionCard = ({
  formData,
  handleChange,
  costos,
  setCostos,
  incoterms = [],
  puertos = [],
  navieras = [],
  tiposContenedor = [],
  disabled = false,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCosto, setEditingCosto] = useState(null);

  const handleAddCosto = () => {
    setEditingCosto({
      concepto: "",
      monto: 0,
      tipoCosto: "FLETE",
      moneda: "USD",
    });
    setShowAddDialog(true);
  };

  const handleEditCosto = (costo, index) => {
    setEditingCosto({ ...costo, index });
    setShowAddDialog(true);
  };

  const handleDeleteCosto = (index) => {
    const nuevosCostos = costos.filter((_, i) => i !== index);
    setCostos(nuevosCostos);
  };

  const handleSaveCosto = () => {
    if (editingCosto.concepto && editingCosto.monto > 0) {
      if (editingCosto.index !== undefined) {
        // Editar costo existente
        const nuevosCostos = [...costos];
        nuevosCostos[editingCosto.index] = editingCosto;
        setCostos(nuevosCostos);
      } else {
        // Agregar nuevo costo
        setCostos([...costos, editingCosto]);
      }
      setShowAddDialog(false);
      setEditingCosto(null);
    }
  };

  const montoBodyTemplate = (rowData) => {
    return `${rowData.moneda || 'USD'} ${Number(rowData.monto || 0).toFixed(2)}`;
  };

  const accionesBodyTemplate = (rowData, { rowIndex }) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-text"
          onClick={() => handleEditCosto(rowData, rowIndex)}
          disabled={disabled}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => handleDeleteCosto(rowIndex)}
          disabled={disabled}
        />
      </div>
    );
  };

  const calcularTotalCostos = () => {
    return costos.reduce((sum, costo) => sum + (Number(costo.monto) || 0), 0);
  };

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3">
        <h3>Costos de Exportación</h3>
        <Button
          label="Agregar Costo"
          icon="pi pi-plus"
          onClick={handleAddCosto}
          disabled={disabled}
        />
      </div>

      <DataTable
        value={costos}
        emptyMessage="No hay costos agregados"
        responsiveLayout="scroll"
      >
        <Column field="concepto" header="Concepto" style={{ minWidth: '200px' }} />
        <Column field="tipoCosto" header="Tipo Costo" style={{ minWidth: '150px' }} />
        <Column 
          field="monto" 
          header="Monto" 
          body={montoBodyTemplate}
          style={{ minWidth: '120px' }} 
        />
        <Column 
          body={accionesBodyTemplate}
          style={{ minWidth: '100px' }}
        />
      </DataTable>

      {/* Resumen de totales */}
      <div className="flex justify-content-end mt-4">
        <div style={{ minWidth: '300px' }}>
          <div className="flex justify-content-between" style={{ borderTop: '2px solid #dee2e6', paddingTop: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Total Costos:</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              USD {calcularTotalCostos().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Dialog para agregar/editar costo */}
      <Dialog
        header={editingCosto?.index !== undefined ? "Editar Costo" : "Agregar Costo"}
        visible={showAddDialog}
        style={{ width: '50vw' }}
        onHide={() => {
          setShowAddDialog(false);
          setEditingCosto(null);
        }}
      >
        {editingCosto && (
          <div className="grid">
            <div className="col-12">
              <label htmlFor="concepto" style={{ fontWeight: 'bold' }}>
                Concepto *
              </label>
              <InputText
                id="concepto"
                value={editingCosto.concepto}
                onChange={(e) => setEditingCosto({ ...editingCosto, concepto: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="tipoCosto" style={{ fontWeight: 'bold' }}>
                Tipo Costo *
              </label>
              <Dropdown
                id="tipoCosto"
                value={editingCosto.tipoCosto}
                options={[
                  { label: "FLETE", value: "FLETE" },
                  { label: "SEGURO", value: "SEGURO" },
                  { label: "ADUANAS", value: "ADUANAS" },
                  { label: "OTROS", value: "OTROS" },
                ]}
                onChange={(e) => setEditingCosto({ ...editingCosto, tipoCosto: e.value })}
                placeholder="Seleccionar tipo"
                style={{ width: '100%' }}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="moneda" style={{ fontWeight: 'bold' }}>
                Moneda *
              </label>
              <Dropdown
                id="moneda"
                value={editingCosto.moneda}
                options={[
                  { label: "USD - Dólares", value: "USD" },
                  { label: "PEN - Soles", value: "PEN" },
                ]}
                onChange={(e) => setEditingCosto({ ...editingCosto, moneda: e.value })}
                placeholder="Seleccionar moneda"
                style={{ width: '100%' }}
              />
            </div>

            <div className="col-12">
              <label htmlFor="monto" style={{ fontWeight: 'bold' }}>
                Monto *
              </label>
              <InputNumber
                id="monto"
                value={editingCosto.monto}
                onValueChange={(e) => setEditingCosto({ ...editingCosto, monto: e.value })}
                mode="decimal"
                minFractionDigits={2}
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
              setEditingCosto(null);
            }}
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            onClick={handleSaveCosto}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default CostosExportacionCard;