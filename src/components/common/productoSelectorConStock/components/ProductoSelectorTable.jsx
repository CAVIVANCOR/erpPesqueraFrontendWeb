// src/components/movimientoAlmacen/productoSelector/components/ProductoSelectorTable.jsx
import React, { useState, useEffect } from "react";
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
  productoIdSeleccionado = null, // ⭐ NUEVO
}) => {
  const [selectedRow, setSelectedRow] = useState(null);

  // ⭐ NUEVO: Seleccionar automáticamente el producto cuando se abre el dialog
  useEffect(() => {

    if (productoIdSeleccionado && items.length > 0) {
      const productoEncontrado = items.find((item) => {
        const itemProductoId = item.productoId; // En modo ingreso también es productoId
        return Number(itemProductoId) === Number(productoIdSeleccionado);
      });

      setSelectedRow(productoEncontrado || null);
    } else {
      setSelectedRow(null);
    }
  }, [productoIdSeleccionado, items, esIngreso]);

  // ⭐ NUEVO: Función para aplicar estilo a la fila seleccionada
  const rowClassName = (rowData) => {
    if (!selectedRow) return "";
    const rowProductoId = rowData.productoId;
    const selectedProductoId = selectedRow.productoId;
    const isSelected = Number(rowProductoId) === Number(selectedProductoId);
    return isSelected ? "p-highlight" : "";
  };

  return (
    <DataTable
      value={items}
      loading={loading}
      stripedRows
      showGridlines
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      header={header}
      emptyMessage={`No se encontraron ${esIngreso ? "productos" : "productos con saldo"}`}
      onRowClick={onRowClick}
      onRowDoubleClick={(e) => onSelect(e.data)}
      selection={selectedRow} // ⭐ NUEVO: Producto seleccionado
      onSelectionChange={(e) => setSelectedRow(e.value)} // ⭐ NUEVO: Actualizar selección
      selectionMode="single"
      rowClassName={rowClassName} // ⭐ NUEVO: Aplicar estilo
      style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
    >
      <Column
        field="id"
        header="ID"
        style={{ width: "80px", verticalAlign: "top" }}
        body={(rowData) => rowData.productoId}
      />
      <Column
        header="Familia"
        body={(rowData) => {
          const producto = esIngreso ? rowData.producto : rowData.producto;
          return producto?.familia?.nombre || "-";
        }}
        style={{ width: "150px", verticalAlign: "top" }}
      />
      <Column
        header="Subfamilia"
        body={(rowData) => {
          const producto = esIngreso ? rowData.producto : rowData.producto;
          return producto?.subfamilia?.nombre || "-";
        }}
        style={{ width: "150px", verticalAlign: "top" }}
      />
      <Column
        header="Producto"
        body={(rowData) => productoTemplate(rowData, esIngreso)}
        style={{ minWidth: "250px", verticalAlign: "top" }}
      />
      <Column
        header={esIngreso ? "Stock Disponible" : "Stock"}
        body={(rowData) => stockTemplate(rowData, esIngreso)}
        style={{ width: "120px", verticalAlign: "top" }}
      />
      <Column
        header="Unidad"
        body={(rowData) => unidadMedidaTemplate(rowData, esIngreso)}
        style={{ width: "150px", verticalAlign: "top" }}
      />
      <Column
        header="Acciones"
        body={(rowData) => accionesTemplate(rowData, onSelect)}
        style={{ width: "120px", textAlign: "center", verticalAlign: "top" }}
      />
    </DataTable>
  );
};