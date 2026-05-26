// src/components/movimientoAlmacen/productoSelector/components/ProductoSelectorHeader.jsx
import React from "react";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button"; // ⭐ NUEVO

/**
 * Header con tags informativos del selector de productos
 */
export const ProductoSelectorHeader = ({
  modo,
  esCustodia,
  filteredItemsCount,
  esIngreso,
  soloConSaldo = true, // ⭐ NUEVO
  onToggleSaldo, // ⭐ NUEVO
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
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
          value={`${filteredItemsCount} ${soloConSaldo ? "productos con saldo" : "productos"}`}
          severity="info"
        />
      )}
      {!esIngreso && ( // ⭐ NUEVO: Botón SIEMPRE visible en modo egreso
        <Button
          label={soloConSaldo ? "Solo con Saldo" : "Todos los Productos"}
          icon={soloConSaldo ? "pi pi-check-circle" : "pi pi-circle"}
          severity={soloConSaldo ? "success" : "secondary"}
          onClick={onToggleSaldo}
          size="small"
          outlined
        />
      )}
    </div>
  );
};
