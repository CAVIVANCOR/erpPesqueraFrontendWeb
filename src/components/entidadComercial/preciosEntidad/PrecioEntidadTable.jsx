/**
 * PrecioEntidadTable.jsx
 * 
 * Componente de tabla para mostrar precios especiales.
 * Incluye columnas, búsqueda y acciones.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { getResponsiveFontSize } from "../../../utils/utils";
import {
  productoTemplate,
  unidadEmpaqueTemplate,
  monedaTemplate,
  precioTemplate,
  fechaTemplate,
  estadoTemplate,
} from "./precioEntidadTemplates";

export default function PrecioEntidadTable({
  data,
  loading,
  onEdit,
  onDelete,
  onNew,
  globalFilter,
  onGlobalFilterChange,
  productosOptions,
  monedasOptions,
  monedas,
  permisos,
  readOnly,
}) {
  /**
   * Renderizado de botones de acción
   */
  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={(ev) => {
          ev.stopPropagation();
          if (permisos.puedeVer || permisos.puedeEditar) {
            onEdit(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        type="button"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={(ev) => {
          ev.stopPropagation();
          if (permisos.puedeEliminar) {
            onDelete(rowData);
          }
        }}
        tooltip="Eliminar"
        type="button"
      />
    </div>
  );

  return (
    <DataTable
      value={data}
      loading={loading}
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      onRowClick={(e) => onEdit(e.data)}
      selectionMode="single"
      className="p-datatable-hover cursor-pointer"
      emptyMessage="No se encontraron precios especiales"
      globalFilter={globalFilter}
      header={
        <div className="flex align-items-center gap-2">
          <h2>Gestión de Precios Especiales</h2>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            size="small"
            raised
            tooltip="Nuevo Precio Especial"
            outlined
            className="p-button-success"
            onClick={onNew}
            type="button"
            disabled={readOnly || loading}
          />
          <span className="p-input-icon-left">
            <InputText
              value={globalFilter}
              onChange={onGlobalFilterChange}
              placeholder="Buscar precios especiales..."
              style={{ width: "300px" }}
            />
          </span>
        </div>
      }
      scrollable
      scrollHeight="600px"
      style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
    >
      <Column
        field="productoId"
        header="Producto"
        body={(rowData) => productoTemplate(rowData, productosOptions)}
        sortable
      />
      <Column
        field="unidadMedida"
        header="Unidad/Empaque"
        body={unidadEmpaqueTemplate}
        sortable
      />
      <Column
        field="monedaId"
        header="Moneda"
        body={(rowData) => monedaTemplate(rowData, monedasOptions)}
        sortable
      />
      <Column
        field="precioUnitario"
        header="Valor Unitario"
        body={(rowData) => precioTemplate(rowData, monedas)}
        sortable
        style={{ textAlign: "right", width: "60px" }}
      />
      <Column
        field="vigenteDesde"
        header="Desde"
        body={(rowData) => fechaTemplate(rowData, "vigenteDesde")}
        sortable
      />
      <Column
        field="vigenteHasta"
        header="Hasta"
        body={(rowData) => fechaTemplate(rowData, "vigenteHasta")}
        sortable
      />
      <Column
        field="activo"
        header="Estado"
        body={estadoTemplate}
        sortable
      />
      <Column
        body={accionesTemplate}
        header="Acciones"
        style={{ width: "8rem" }}
      />
    </DataTable>
  );
}