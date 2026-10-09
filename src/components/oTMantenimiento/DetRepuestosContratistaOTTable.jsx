/**
 * DetRepuestosContratistaOTTable.jsx
 *
 * DataTable puro de los ítems (repuestos y servicios) de un presupuesto
 * de contratista. Muestra editar/eliminar por fila.
 *
 * Props:
 *  items       {Array}
 *  loading     {boolean}
 *  onEdit      {function(item)}
 *  onDelete    {function(item)}
 *  readOnly    {boolean}
 *  puedeEditar {boolean}
 */

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { formatearNumero } from "../../utils/utils";

export default function DetRepuestosContratistaOTTable({
  items = [],
  loading = false,
  onEdit,
  onDelete,
  readOnly = false,
  puedeEditar = true,
  monedaId,
  monedas = [],
}) {
  const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
  const simbolo = moneda?.simbolo || "";
  const bg = moneda?.colorFondo;
  const nombreLargo = moneda?.nombreLargo || moneda?.descripcion || simbolo;

  const itemsConMoneda = items.map((item) => ({
    ...item,
    monedaId: Number(monedaId),
    simbolo,
    colorFondo: bg,
  }));

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-warning"
        onClick={() => onEdit && onEdit(rowData)}
        disabled={readOnly || !puedeEditar}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        onClick={() => onDelete && onDelete(rowData)}
        disabled={readOnly || !puedeEditar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const numberStyle = {
    display: "inline-block",
    width: "100%",
    textAlign: "right",
    backgroundColor: bg || "transparent",
    padding: "0.25rem 0.5rem",
  };

  const cantidadTemplate = (rowData) => (
    <span style={numberStyle}>
      {formatearNumero(rowData.cantidad)}
    </span>
  );

  const precioTemplate = (rowData) => (
    <span style={numberStyle}>
      {formatearNumero(rowData.precioUnitario)}
    </span>
  );

  const totalTemplate = (rowData) => (
    <span style={numberStyle}>
      {rowData.simbolo} {formatearNumero(rowData.total)}
    </span>
  );

  const subtotalPorMoneda = (monedaIdFilter, campo) =>
    itemsConMoneda
      .filter((i) => Number(i.monedaId) === Number(monedaIdFilter))
      .reduce((suma, i) => suma + Number(i[campo] || 0), 0);

  const rowGroupHeaderTemplate = () => (
    <span
      style={{
        display: "inline-block",
        width: "100%",
        backgroundColor: bg || "#e9ecef",
        padding: "0.5rem",
        fontWeight: "bold",
      }}
    >
      {nombreLargo}
    </span>
  );

  const rowGroupFooterTemplate = () => {
    const cellStyle = {
      backgroundColor: bg || "#e9ecef",
      fontWeight: "bold",
      textAlign: "right",
    };
    const labelStyle = {
      backgroundColor: bg || "#e9ecef",
      fontWeight: "bold",
      textAlign: "left",
    };
    const emptyStyle = { backgroundColor: bg || "#e9ecef" };
    const monedaIdVal = Number(monedaId);
    return (
      <>
        <td style={emptyStyle}></td>
        <td style={emptyStyle}></td>
        <td style={labelStyle}>Subtotal {simbolo}</td>
        <td style={cellStyle}>
          {formatearNumero(subtotalPorMoneda(monedaIdVal, "cantidad"))}
        </td>
        <td style={emptyStyle}></td>
        <td style={cellStyle}>
          {simbolo} {formatearNumero(subtotalPorMoneda(monedaIdVal, "total"))}
        </td>
        <td style={emptyStyle}></td>
      </>
    );
  };

  const totalCantidad = itemsConMoneda.reduce(
    (suma, i) => suma + Number(i.cantidad || 0),
    0,
  );
  const totalGeneral = itemsConMoneda.reduce(
    (suma, i) => suma + Number(i.total || 0),
    0,
  );

  return (
    <DataTable
      value={itemsConMoneda}
      loading={loading}
      size="small"
      showGridlines
      stripedRows
      emptyMessage="No hay ítems registrados"
      rowGroupMode="subheader"
      groupRowsBy="monedaId"
      sortField="monedaId"
      sortOrder={1}
      rowGroupHeaderTemplate={rowGroupHeaderTemplate}
      rowGroupFooterTemplate={rowGroupFooterTemplate}
    >
      <Column
        field="numeroLinea"
        header="Línea"
        style={{ width: "70px", textAlign: "center" }}
      />
      <Column
        header="Producto"
        body={(rowData) =>
          rowData.producto?.descripcionArmada ||
          rowData.producto?.descripcionBase ||
          "N/A"
        }
      />
      <Column
        field="descripcion"
        header="Descripción"
        footer="TOTAL"
      />
      <Column
        field="cantidad"
        header="Cantidad"
        body={cantidadTemplate}
        footer={formatearNumero(totalCantidad)}
        style={{ width: "100px", textAlign: "right" }}
      />
      <Column
        header="P. Unitario"
        body={precioTemplate}
        style={{ width: "120px", textAlign: "right" }}
      />
      <Column
        header="Total"
        body={totalTemplate}
        footer={`${simbolo} ${formatearNumero(totalGeneral)}`}
        style={{ width: "120px", textAlign: "right" }}
      />
      <Column
        header="Acciones"
        body={accionesTemplate}
        style={{ width: "100px" }}
      />
    </DataTable>
  );
}
