/**
 * ColorTag - Componente reutilizable para mostrar etiquetas con colores de fondo
 * basados en severity colors de EstadoMultiFuncion
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { getSeverityColors } from "../../utils/utils";

/**
 * ColorTag Component
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.value - Texto o contenido a mostrar
 * @param {string} props.severity - Severity color (success, info, warning, danger, secondary, contrast)
 * @param {string} props.size - Tamaño: 'small', 'normal', 'large' (default: 'normal')
 * @param {string} props.align - Alineación del texto: 'left', 'center', 'right' (default: 'center')
 * @param {Object} props.style - Estilos adicionales personalizados
 * @param {string} props.className - Clases CSS adicionales
 */
const ColorTag = ({ 
  value, 
  severity = "secondary", 
  size = "normal",
  align = "center",
  style = {},
  className = ""
}) => {
  const colors = getSeverityColors(severity);

  // Mapear tamaños a estilos
  const sizeStyles = {
    small: {
      fontSize: "0.75rem",
      padding: "4px 8px",
    },
    normal: {
      fontSize: "0.9rem",
      padding: "6px 10px",
    },
    large: {
      fontSize: "1rem",
      padding: "8px 12px",
    },
  };

  const selectedSize = sizeStyles[size] || sizeStyles.normal;

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: "6px",
        fontWeight: "bold",
        display: "block",
        width: "100%",
        textAlign: align,
        ...selectedSize,
        ...style, // Permitir sobrescribir estilos
      }}
    >
      {value}
    </div>
  );
};

export default ColorTag;