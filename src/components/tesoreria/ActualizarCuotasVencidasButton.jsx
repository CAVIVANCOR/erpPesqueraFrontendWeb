import React, { useState } from "react";
import { Button } from "primereact/button";
import { procesarCuotasVencidas } from "../../api/tesoreria/tareasAutomaticas";

/**
 * Botón reutilizable para actualizar cuotas vencidas
 * Ejecuta el proceso de actualización de estados de cuotas
 */
export default function ActualizarCuotasVencidasButton({
  toast,
  onSuccess,
  label = "Actualizar Cuotas Vencidas",
  icon = "pi pi-refresh",
  severity = "warning",
  className = "",
  outlined = false,
  size = "small",
  tooltip = "Actualiza el estado de las cuotas vencidas y recalcula saldos",
  ...rest
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const resultado = await procesarCuotasVencidas();

      toast.current?.show({
        severity: "success",
        summary: "Proceso completado",
        detail: `${resultado.cuotasActualizadas} cuotas actualizadas en ${resultado.prestamosAfectados} préstamos`,
        life: 3000,
      });

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess(resultado);
      }
    } catch (error) {
      console.error("Error al procesar cuotas vencidas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar cuotas vencidas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      label={label}
      icon={icon}
      severity={severity}
      outlined={outlined}
      size={size}
      onClick={handleClick}
      loading={loading}
      className={className}
      tooltip={tooltip}
      tooltipOptions={{ position: "top" }}
      {...rest}
    />
  );
}