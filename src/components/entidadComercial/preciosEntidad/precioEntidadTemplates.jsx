import React from "react";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../../utils/utils";

export const productoTemplate = (rowData, productosOptions) => {
  if (rowData.producto) {
    return (
      rowData.producto.descripcionArmada ||
      rowData.producto.descripcionBase ||
      ""
    );
  }
  const producto = productosOptions.find(
    (p) => Number(p.value) === Number(rowData.productoId)
  );
  return producto?.label || rowData.productoId;
};

export const unidadEmpaqueTemplate = (rowData) => {
  if (rowData.producto?.unidadMedida) {
    return rowData.producto.unidadMedida.nombre || "";
  }
  return "N/A";
};

export const monedaTemplate = (rowData, monedasOptions) => {
  if (rowData.moneda) {
    return `${rowData.moneda.simbolo || ""} - ${rowData.moneda.codigoSunat || ""}`;
  }
  const moneda = monedasOptions.find(
    (m) => Number(m.value) === Number(rowData.monedaId)
  );
  return moneda?.label || rowData.monedaId;
};

export const precioTemplate = (rowData, monedas) => {
  const moneda = monedas.find(
    (m) => Number(m.id) === Number(rowData.monedaId)
  );

  const simboloMoneda = moneda?.simbolo || "S/";
  const numeroFormateado = formatearNumero(rowData.precioUnitario);

  return `${simboloMoneda} ${numeroFormateado}`;
};

export const fechaTemplate = (rowData, field) => {
  const fecha = rowData[field];
  return formatearFecha(fecha, "N/A");
};

export const estadoTemplate = (rowData) => {
  return (
    <Tag
      value={rowData.activo ? "Activo" : "Inactivo"}
      severity={rowData.activo ? "success" : "danger"}
    />
  );
};
