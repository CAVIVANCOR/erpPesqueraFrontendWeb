// src/components/common/productoSelectorConStock/components/ProductoSelectedDisplay.jsx
import React from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

/**
 * Componente genérico para mostrar un producto seleccionado
 * Parte del sistema ProductoSelector
 * 
 * @param {Object} producto - Producto seleccionado (debe tener familia, subfamilia, descripcionArmada)
 * @param {Function} onChangeClick - Callback al hacer clic en cambiar
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} label - Label del campo (default: "Producto *")
 */
export const ProductoSelectedDisplay = ({
  producto,
  onChangeClick,
  disabled = false,
  label = "Producto *",
}) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor="productoId">{label}</label>
      <Button
        icon="pi pi-search"
        onClick={onChangeClick}
        disabled={disabled}
        style={{
          width: "100%",
          justifyContent: "flex-start",
          backgroundColor: "#2196F3",
          borderColor: "#2196F3",
          padding: "0.75rem",
          minHeight: "45px",
        }}
      >
        {producto ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            {producto.familia?.nombre && (
              <Tag
                value={producto.familia.nombre}
                style={{
                  backgroundColor: "#2196F3",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                }}
              />
            )}
            {producto.subfamilia?.nombre && (
              <Tag
                value={producto.subfamilia.nombre}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                }}
              />
            )}
            {producto.descripcionArmada && (
              <Tag
                value={producto.descripcionArmada}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                }}
              />
            )}
          </div>
        ) : (
          <span style={{ color: "white" }}>Seleccionar Producto</span>
        )}
      </Button>
    </div>
  );
};
