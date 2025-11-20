// src/components/movimientoAlmacen/productoSelector/components/ProductoSelectorTable.jsx
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getResponsiveFontSize } from "../../../../utils/utils";
import {
  productoTemplate,
  unidadMedidaTemplate,
  saldoTemplate,
  loteTemplate,
  fechasTemplate,
  stockTemplate,
  accionesTemplate,
} from "./ProductoTableColumns";

/**
 * Tabla de productos con columnas dinámicas según modo
 */
export const ProductoSelectorTable = ({
  items,
  loading,
  esIngreso,
  header,
  onRowClick,
  onSelect,
}) => {
  return (
    <DataTable
      value={items}
      loading={loading}
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      header={header}
      emptyMessage={`No se encontraron ${esIngreso ? "productos" : "productos con saldo"}`}
      onRowClick={onRowClick}
      onRowDoubleClick={(e) => onSelect(e.data)}
      selectionMode="single"
      style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
    >
      <Column
        field="id"
        header="ID"
        style={{ width: "80px" }}
        body={(rowData) => (esIngreso ? rowData.id : rowData.productoId)}
      />
      <Column
        header="Producto"
        body={(rowData) => productoTemplate(rowData, esIngreso)}
        style={{ minWidth: "300px" }}
      />
      <Column
        header="Unidad"
        body={(rowData) => unidadMedidaTemplate(rowData, esIngreso)}
        style={{ width: "120px" }}
      />
      <Column
        header={esIngreso ? "Stock Disponible" : "Stock"}
        body={(rowData) => stockTemplate(rowData, esIngreso)}
        style={{ width: "150px" }}
      />
      <Column
        header="Acciones"
        body={(rowData) => accionesTemplate(rowData, onSelect)}
        style={{ width: "150px", textAlign: "center" }}
      />
    </DataTable>
  );
};