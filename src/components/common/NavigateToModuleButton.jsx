// src/components/common/NavigateToModuleButton.jsx
import React from "react";
import { Button } from "primereact/button";

/**
 * Botón reutilizable para navegar a otro módulo con retorno automático
 *
 * @param {Object} props
 * @param {Function} props.abrirModulo - Función para abrir módulos (desde ModuloContext)
 * @param {string} props.targetModule - Módulo destino (ej: 'entidadComercial')
 * @param {string} props.targetLabel - Label del módulo destino
 * @param {string} props.returnModule - Módulo de retorno (ej: 'requerimientoCompra')
 * @param {string} props.reloadAction - Acción a ejecutar al volver (ej: 'reloadProveedores')
 * @param {any} props.contextData - Datos adicionales del contexto (opcional)
 * @param {string} props.label - Texto del botón
 * @param {string} props.icon - Icono del botón (opcional)
 * @param {string} props.severity - Severidad del botón (opcional)
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {boolean} props.outlined - Si el botón es outlined (opcional)
 * @param {string} props.tooltip - Tooltip del botón (opcional)
 */
export default function NavigateToModuleButton({
  abrirModulo,
  onCloseDialog, // ✅ AGREGAR ESTA LÍNEA
  targetModule,
  targetLabel,
  returnModule,
  reloadAction,
  contextData = null,
  label = "Ir a Módulo",
  icon = "pi pi-external-link",
  severity = "info",
  className = "",
  outlined = true,
  tooltip = null,
  ...rest
}) {
  const handleClick = () => {
    // Guardar contexto de retorno en sessionStorage
    const returnContext = {
      returnModule,
      reloadAction,
      contextData,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(
      "navigationReturnContext",
      JSON.stringify(returnContext),
    );

    // ✅ SOLUCIÓN: Cerrar Dialog ANTES de navegar
    if (onCloseDialog && typeof onCloseDialog === "function") {
      onCloseDialog();
    }

    // Esperar que el Dialog se cierre antes de navegar
    setTimeout(() => {
      // Navegar al módulo destino
      if (abrirModulo && typeof abrirModulo === "function") {
        abrirModulo(targetModule, targetLabel);
      } else {
        console.error(
          "❌ NavigateToModuleButton: abrirModulo no está disponible o no es una función",
        );
        console.error("❌ Tipo de abrirModulo:", typeof abrirModulo);
        console.error("❌ Valor de abrirModulo:", abrirModulo);
      }
    }, 200);
  };

  return (
    <Button
      type="button"
      label={label}
      icon={icon}
      severity={severity}
      outlined={outlined}
      onClick={handleClick}
      className={className}
      tooltip={tooltip}
      tooltipOptions={{ position: "top" }}
      {...rest}
    />
  );
}
