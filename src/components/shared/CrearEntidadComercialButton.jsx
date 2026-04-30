// src/components/shared/CrearEntidadComercialButton.jsx
/**
 * Componente wrapper que incluye botón + dialog para crear EntidadComercial
 * Simplifica el uso cuando solo se necesita un botón simple
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Button } from "primereact/button";
import CrearEntidadComercialDialog from "./CrearEntidadComercialDialog";

/**
 * Botón con Dialog integrado para crear EntidadComercial
 * 
 * @param {number} empresaId - ID de la empresa
 * @param {string} tipoEntidad - 'proveedor' | 'cliente' | 'ambos'
 * @param {function} onEntidadCreada - Callback cuando se crea (entidad) => void
 * @param {string} label - Texto del botón
 * @param {string} icon - Icono del botón (PrimeIcons)
 * @param {string} severity - Severidad del botón (info, success, warning, etc.)
 * @param {boolean} outlined - Si el botón es outlined
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} className - Clases CSS adicionales
 * @param {string} tooltip - Texto del tooltip
 * @param {object} tooltipOptions - Opciones del tooltip
 * @param {object} toast - Referencia al Toast del padre
 * @param {object} defaultValues - Valores por defecto para EntidadComercial
 * @param {string} headerTitle - Título del dialog
 * @param {object} permisos - Permisos del usuario
 * @param {string} buttonStyle - Estilos inline del botón
 */
export default function CrearEntidadComercialButton({
  empresaId,
  tipoEntidad = "proveedor",
  onEntidadCreada,
  label,
  icon = "pi pi-building",
  severity = "info",
  outlined = true,
  disabled = false,
  className = "",
  tooltip,
  tooltipOptions = { position: "top" },
  toast,
  defaultValues,
  headerTitle,
  permisos,
  buttonStyle,
}) {
  const [visible, setVisible] = useState(false);

  // Determinar label por defecto según tipo
  const getDefaultLabel = () => {
    switch (tipoEntidad) {
      case "proveedor":
        return "Crear Proveedor";
      case "cliente":
        return "Crear Cliente";
      case "ambos":
        return "Crear Entidad";
      default:
        return "Crear";
    }
  };

  // Determinar tooltip por defecto
  const getDefaultTooltip = () => {
    switch (tipoEntidad) {
      case "proveedor":
        return "Abrir formulario para crear un nuevo proveedor";
      case "cliente":
        return "Abrir formulario para crear un nuevo cliente";
      case "ambos":
        return "Abrir formulario para crear una nueva entidad comercial";
      default:
        return "Crear entidad comercial";
    }
  };

  const handleEntidadCreada = (entidad) => {
    setVisible(false);
    if (onEntidadCreada && typeof onEntidadCreada === "function") {
      onEntidadCreada(entidad);
    }
  };

  return (
    <>
      <Button
        type="button"
        label={label || getDefaultLabel()}
        icon={icon}
        severity={severity}
        outlined={outlined}
        onClick={() => setVisible(true)}
        disabled={disabled}
        className={className}
        tooltip={tooltip || getDefaultTooltip()}
        tooltipOptions={tooltipOptions}
        style={buttonStyle}
      />
      
      <CrearEntidadComercialDialog
        visible={visible}
        onHide={() => setVisible(false)}
        empresaId={empresaId}
        tipoEntidad={tipoEntidad}
        onEntidadCreada={handleEntidadCreada}
        toast={toast}
        defaultValues={defaultValues}
        headerTitle={headerTitle}
        permisos={permisos}
      />
    </>
  );
}