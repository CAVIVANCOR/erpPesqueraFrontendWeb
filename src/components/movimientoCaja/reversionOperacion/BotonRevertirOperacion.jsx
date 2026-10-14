import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";
import RevertirOperacionDialog from "./RevertirOperacionDialog";

/**
 * Obtiene de la respuesta de una operación especializada el identificador de un movimiento
 * (o empresa + correlativo). Todos los servicios de Tesorería devuelven el número de operación
 * y al menos un movimiento.
 */
const extraerIdentificacion = (resultado) => {
  const r = resultado?.correlativo === undefined && resultado?.data ? resultado.data : resultado;
  if (!r) return null;

  let movimientoId =
    r.movimientoEgresoId ?? r.movimientoIngresoId ?? r.movimientoPrincipalId ?? r.movimientoId ?? null;

  if (!movimientoId && r.movimientos) {
    const lista = Array.isArray(r.movimientos) ? r.movimientos : Object.values(r.movimientos);
    movimientoId = lista.find((m) => m && m.id)?.id ?? null;
  }
  if (movimientoId) return { movimientoId: String(movimientoId) };
  return null;
};

/** Botón "Revertir esta operación" para el pie de los diálogos de confirmación. */
const BotonRevertirOperacion = ({ resultado, onRevertida, disabled = false }) => {
  const [abierto, setAbierto] = useState(false);
  const identificacion = useMemo(() => extraerIdentificacion(resultado), [resultado]);

  if (!identificacion) return null;

  return (
    <>
      <Button
        label="Revertir esta operación"
        icon="pi pi-undo"
        severity="danger"
        outlined
        onClick={() => setAbierto(true)}
        disabled={disabled}
        tooltip="Deshace todo lo que generó esta operación"
        tooltipOptions={{ position: "top" }}
      />
      <RevertirOperacionDialog
        visible={abierto}
        onHide={() => setAbierto(false)}
        movimientoId={identificacion.movimientoId}
        onRevertida={(datos) => {
          setAbierto(false);
          onRevertida?.(datos);
        }}
      />
    </>
  );
};

export default BotonRevertirOperacion;
