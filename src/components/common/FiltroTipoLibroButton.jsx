import React from "react";
import { Button } from "primereact/button";

/**
 * Componente genérico para filtrar por tipo de libro contable
 * Cicla entre 4 estados: FISCAL S/SI → FISCAL C/SI → GERENCIAL → TODOS
 * 
 * @param {string} value - Estado actual ('FISCAL_SSI' | 'FISCAL_CSI' | 'GERENCIAL' | 'TODOS')
 * @param {function} onChange - Callback que recibe el nuevo estado
 * @param {boolean} disabled - Si el botón está deshabilitado (opcional)
 * @param {object} style - Estilos adicionales (opcional)
 */
export default function FiltroTipoLibroButton({
  value = "FISCAL_SSI",
  onChange,
  disabled = false,
  style = {},
}) {
  const estados = ["FISCAL_SSI", "FISCAL_CSI", "GERENCIAL", "TODOS"];

  const handleClick = () => {
    if (!disabled && onChange) {
      const currentIndex = estados.indexOf(value);
      const nextIndex = (currentIndex + 1) % estados.length;
      onChange(estados[nextIndex]);
    }
  };

  const getConfig = () => {
    switch (value) {
      case "FISCAL_SSI":
        return {
          label: "FISCAL S/SI",
          icon: "pi-book",
          severity: "info",
          tooltip: "Mostrando: Facturas, Boletas, NC, ND (sin saldos iniciales). Clic para ver Fiscales con SI",
        };
      case "FISCAL_CSI":
        return {
          label: "FISCAL C/SI",
          icon: "pi-bookmark",
          severity: "warning",
          tooltip: "Mostrando: Saldos Iniciales Fiscales. Clic para ver Gerenciales",
        };
      case "GERENCIAL":
        return {
          label: "GERENCIAL",
          icon: "pi-briefcase",
          severity: "success",
          tooltip: "Mostrando: PreFacturas Negras (Gerenciales). Clic para ver Todos",
        };
      case "TODOS":
        return {
          label: "TODOS",
          icon: "pi-list",
          severity: "secondary",
          tooltip: "Mostrando: Todos los registros. Clic para ver solo Fiscales S/SI",
        };
      default:
        return {
          label: "FISCAL S/SI",
          icon: "pi-book",
          severity: "info",
          tooltip: "Mostrando: Facturas, Boletas, NC, ND (sin saldos iniciales)",
        };
    }
  };

  const config = getConfig();

  return (
    <Button
      type="button"
      label={config.label}
      icon={config.icon}
      severity={config.severity}
      onClick={handleClick}
      disabled={disabled}
      style={{
        fontWeight: "bold",
        transition: "all 0.3s ease",
        ...style,
      }}
      tooltip={config.tooltip}
      tooltipOptions={{ position: "top" }}
    />
  );
}