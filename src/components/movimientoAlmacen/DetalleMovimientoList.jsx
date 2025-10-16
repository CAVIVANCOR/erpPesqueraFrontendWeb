// Componente modular para mostrar y gestionar detalles de movimiento
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

export default function DetalleMovimientoList({ 
  detalles = [], 
  onEdit, 
  onDelete, 
  readOnly = false 
}) {
  
  const productoTemplate = (rowData) => {
    return rowData.producto?.descripcionArmada || `ID: ${rowData.productoId}`;
  };

  const cantidadTemplate = (rowData) => {
    return rowData.cantidad?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const pesoTemplate = (rowData) => {
    return rowData.peso ? rowData.peso.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg' : '-';
  };

  const custodiaTemplate = (rowData) => {
    return (
      <span className={rowData.esCustodia ? "text-blue-600 font-semibold" : "text-gray-600"}>
        {rowData.esCustodia ? "Sí" : "No"}
      </span>
    );
  };

  const accionesTemplate = (rowData) => {
    if (readOnly) return null;
    
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button 
          icon="pi pi-pencil" 
          className="p-button-text p-button-sm p-button-info" 
          onClick={() => onEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-text p-button-danger p-button-sm" 
          onClick={() => onDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  return (
    <div>
      <DataTable 
        value={detalles} 
        emptyMessage="No hay detalles agregados. Haga clic en 'Agregar Detalle' para comenzar."
        size="small"
        stripedRows
        showGridlines
      >
        <Column field="productoId" header="Producto" body={productoTemplate} style={{ minWidth: '250px' }} />
        <Column field="cantidad" header="Cantidad" body={cantidadTemplate} style={{ width: '120px', textAlign: 'right' }} />
        <Column field="peso" header="Peso" body={pesoTemplate} style={{ width: '120px', textAlign: 'right' }} />
        <Column field="lote" header="Lote" style={{ width: '120px' }} />
        <Column field="esCustodia" header="Custodia" body={custodiaTemplate} style={{ width: '100px', textAlign: 'center' }} />
        {!readOnly && <Column header="Acciones" body={accionesTemplate} style={{ width: '120px', textAlign: 'center' }} />}
      </DataTable>
    </div>
  );
}