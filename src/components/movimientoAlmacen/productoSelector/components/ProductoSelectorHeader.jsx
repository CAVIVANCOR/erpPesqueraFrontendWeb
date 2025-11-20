// src/components/movimientoAlmacen/productoSelector/components/ProductoSelectorHeader.jsx
import React from "react";
import { Tag } from "primereact/tag";

/**
 * Header con tags informativos del selector de productos
 */
export const ProductoSelectorHeader = ({ modo, esCustodia, filteredItemsCount, esIngreso }) => {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      <Tag
        value={esIngreso ? "INGRESO" : modo.toUpperCase()}
        severity={esIngreso ? "success" : modo === "egreso" ? "danger" : "info"}
      />
      <Tag
        value={esCustodia ? "CUSTODIA" : "PROPIA"}
        severity={esCustodia ? "warning" : "info"}
      />
      {!esIngreso && (
        <Tag
          value={`${filteredItemsCount} productos con saldo`}
          severity="info"
        />
      )}
    </div>
  );
};