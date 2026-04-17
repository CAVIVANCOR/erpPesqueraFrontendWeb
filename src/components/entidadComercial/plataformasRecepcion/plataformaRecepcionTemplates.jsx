import React from "react";
import { Tag } from "primereact/tag";

export const nombreTemplate = (rowData) => {
  return rowData.nombre || "N/A";
};

export const puertoTemplate = (rowData, puertosOptions) => {
  if (rowData.puertoPesca) {
    return rowData.puertoPesca.nombre || "";
  }
  const puerto = puertosOptions.find(
    (p) => Number(p.value) === Number(rowData.puertoPescaId)
  );
  return puerto?.label || rowData.puertoPescaId;
};

export const coordenadasTemplate = (rowData) => {
  if (rowData.latitud && rowData.longitud) {
    return `${Number(rowData.latitud).toFixed(6)}, ${Number(rowData.longitud).toFixed(6)}`;
  }
  return "Sin coordenadas";
};

export const latitudTemplate = (rowData) => {
  if (rowData.latitud) {
    return Number(rowData.latitud).toFixed(6);
  }
  return "N/A";
};

export const longitudTemplate = (rowData) => {
  if (rowData.longitud) {
    return Number(rowData.longitud).toFixed(6);
  }
  return "N/A";
};

export const estadoTemplate = (rowData) => {
  return (
    <Tag
      value={rowData.activo ? "Activo" : "Inactivo"}
      severity={rowData.activo ? "success" : "danger"}
    />
  );
};