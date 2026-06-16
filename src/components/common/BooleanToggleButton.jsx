// src/components/shared/BooleanToggleButton.jsx
import React from "react";
import { Button } from "primereact/button";

/**
 * Componente genérico para campos booleanos con toggle visual
 * Muestra un botón que cambia de label, color e icono según el valor
 * 
 * @param {boolean} value - Valor actual del campo booleano
 * @param {function} onChange - Callback que recibe el nuevo valor al hacer clic
 * @param {string} labelTrue - Texto a mostrar cuando value es true
 * @param {string} labelFalse - Texto a mostrar cuando value es false
 * @param {string} severityTrue - Severity de PrimeReact cuando value es true (success, info, warning, danger, help, secondary)
 * @param {string} severityFalse - Severity de PrimeReact cuando value es false
 * @param {string} icon - Icono de PrimeReact (opcional, ej: "pi-check-circle")
 * @param {string} size - Tamaño del botón: "small" o "large" (opcional, sin especificar = tamaño normal)
 * @param {boolean} disabled - Si el botón está deshabilitado (opcional)
 * @param {object} style - Estilos adicionales (opcional)
 */
export default function BooleanToggleButton({
  value,
  onChange,
  labelTrue,
  labelFalse,
  severityTrue = "success",
  severityFalse = "secondary",
  icon = null,
  size,
  disabled = false,
  style = {},
}) {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!value);
    }
  };

  const currentLabel = value ? labelTrue : labelFalse;
  const currentSeverity = value ? severityTrue : severityFalse;
  const currentIcon = icon || (value ? "pi-check" : "pi-times");

  return (
    <Button
      type="button"
      label={currentLabel}
      icon={currentIcon}
      severity={currentSeverity}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: "100%",
        fontWeight: "bold",
        transition: "all 0.3s ease",
        ...style,
      }}
      tooltip={`Clic para cambiar a: ${value ? labelFalse : labelTrue}`}
      tooltipOptions={{ position: "top" }}
    />
  );
}