import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { obtenerPlanReversion, revertirOperacionCaja } from "../../../api/tesoreria/operaciones";
import { formatearNumero } from "../../../utils/utils";

export const EVENTO_OPERACION_REVERTIDA = "operacionCajaRevertida";

const ESTADOS = {
  100: "PENDIENTE", 101: "PAGO PARCIAL", 102: "PAGADO", 103: "VENCIDO",
  106: "PENDIENTE", 107: "PAGO PARCIAL", 108: "PAGADO", 109: "VENCIDO",
  114: "PENDIENTE", 115: "PAGO PARCIAL", 116: "PAGADO", 117: "VENCIDO",
  120: "PENDIENTE", 121: "PAGO PARCIAL", 122: "PAGADO", 123: "VENCIDO",
  126: "PENDIENTE", 127: "PAGADO",
  129: "PENDIENTE", 130: "PAGADO",
  132: "PENDIENTE", 133: "PAGADO",
};
const nombreEstado = (id) => ESTADOS[id] || `Estado ${id}`;
const flecha = (antes, despues) => `${formatearNumero(antes, 2)} → ${formatearNumero(despues, 2)}`;
const mensajeError = (error) =>
  error?.response?.data?.error || error?.response?.data?.mensaje || error?.response?.data?.message || error?.message || "Error desconocido";

const Seccion = ({ titulo, color, children }) => (
  <div className="mb-3">
    <div className="font-bold mb-2" style={{ color }}>{titulo}</div>
    {children}
  </div>
);

/**
 * Diálogo de reversión de una operación especializada de caja.
 * Muestra primero TODO lo que se eliminará y se restaurará (plan de solo lectura del servidor) y
 * exige escribir REVERTIR. Identificación: movimientoId, o empresaId + correlativo.
 */
const RevertirOperacionDialog = ({ visible, onHide, movimientoId = null, empresaId = null, correlativo = null, onRevertida }) => {
  const toast = useRef(null);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [errorPlan, setErrorPlan] = useState(null);

  useEffect(() => {
    if (!visible) return;
    let activo = true;
    setPlan(null);
    setErrorPlan(null);
    setCargando(true);
    obtenerPlanReversion(movimientoId ? { movimientoId } : { empresaId, correlativo })
      .then((datos) => activo && setPlan(datos))
      .catch((error) => activo && setErrorPlan(mensajeError(error)))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [visible, movimientoId, empresaId, correlativo]);

  const puedeEjecutar = !!plan?.puedeRevertir && !ejecutando;

  const revertir = async () => {
    if (!puedeEjecutar) return;
    setEjecutando(true);
    try {
      const respuesta = await revertirOperacionCaja({
        movimientoId: movimientoId || undefined,
        empresaId: movimientoId ? undefined : empresaId,
        correlativo: movimientoId ? undefined : correlativo,
      });
      const resultado = respuesta.data;
      toast.current?.show({
        severity: "success",
        summary: "Operación revertida",
        detail: `Operación #${resultado.correlativo}: ${resultado.movimientosEliminados} movimiento(s) y ${resultado.asientosEliminados} asiento(s) eliminados; ${resultado.deudasRestauradas} deuda(s) restaurada(s).`,
        life: 6000,
      });
      window.dispatchEvent(new CustomEvent(EVENTO_OPERACION_REVERTIDA, { detail: resultado }));
      onRevertida?.(resultado);
      onHide?.();
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "No se pudo revertir", detail: mensajeError(error), life: 10000 });
    } finally {
      setEjecutando(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" onClick={onHide} disabled={ejecutando} />
      <Button label="Revertir operación" icon="pi pi-undo" severity="danger" onClick={revertir} disabled={!puedeEjecutar} loading={ejecutando} />
    </div>
  );

  const hayRestauraciones = plan && (plan.deudas.length + plan.impuestos.length + plan.prestamos.length + plan.asignaciones.length > 0);

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={ejecutando ? () => {} : onHide}
        header={`Revertir operación #${plan?.operacion?.correlativo ?? correlativo ?? ""}`}
        style={{ width: "90vw", maxWidth: "1100px" }}
        footer={footer}
        modal
        maximizable
      >
        {cargando && (
          <div className="flex justify-content-center p-4">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          </div>
        )}

        {errorPlan && <Message severity="error" className="w-full" text={errorPlan} />}

        {plan && (
          <>
            <div className="mb-3 text-600">
              {plan.operacion.empresa} · {plan.operacion.fecha ? new Date(plan.operacion.fecha).toLocaleDateString("es-PE") : ""}
            </div>

            {plan.bloqueos.length > 0 && (
              <Message
                severity="error"
                className="w-full mb-3"
                content={
                  <div>
                    <div className="font-bold mb-1">No se puede revertir esta operación:</div>
                    <ul className="m-0 pl-3">{plan.bloqueos.map((b) => <li key={b}>{b}</li>)}</ul>
                  </div>
                }
              />
            )}

            <Seccion titulo="SE ELIMINARÁ" color="#c62828">
              <div className="mb-2">
                {plan.movimientos.length} movimiento(s) de caja · {plan.asientos.length} asiento(s) contable(s)
              </div>
              <DataTable value={plan.movimientos} size="small" stripedRows emptyMessage="Operación sin movimiento de caja (canje de facturas): solo se eliminan sus pagos de canje y asientos.">
                <Column field="id" header="Mov." style={{ width: "5rem" }} />
                <Column field="tipo" header="Tipo" />
                <Column field="empresa" header="Empresa" />
                <Column header="Monto" body={(m) => `${m.simbolo} ${formatearNumero(m.monto, 2)}`} style={{ textAlign: "right" }} />
                <Column field="descripcion" header="Descripción" />
              </DataTable>
              {plan.asientos.length > 0 && (
                <div className="mt-2 text-600" style={{ fontSize: "0.85rem" }}>
                  Asientos: {plan.asientos.map((a) => a.numeroAsiento).join(", ")}
                </div>
              )}
            </Seccion>

            {hayRestauraciones && (
              <Seccion titulo="SE RESTAURARÁ" color="#2e7d32">
                {plan.deudas.length > 0 && (
                  <DataTable value={plan.deudas} size="small" stripedRows className="mb-2">
                    <Column field="tipo" header="Deuda" />
                    <Column field="documento" header="Documento" />
                    <Column header="Pagado" body={(d) => flecha(d.pagadoAntes, d.pagadoDespues)} />
                    <Column header="Saldo pendiente" body={(d) => flecha(d.saldoAntes, d.saldoDespues)} />
                    <Column header="Estado" body={(d) => `${nombreEstado(d.estadoAntes)} → ${nombreEstado(d.estadoDespues)}`} />
                  </DataTable>
                )}
                {plan.impuestos.length > 0 && (
                  <DataTable value={plan.impuestos} size="small" stripedRows className="mb-2">
                    <Column field="tipo" header="Impuesto" />
                    <Column field="documento" header="Documento" />
                    <Column header="Pagado" body={(d) => flecha(d.pagadoAntes, d.pagadoDespues)} />
                    <Column header="Saldo pendiente" body={(d) => flecha(d.saldoAntes, d.saldoDespues)} />
                    <Column header="Estado" body={(d) => `${nombreEstado(d.estadoAntes)} → ${nombreEstado(d.estadoDespues)}`} />
                  </DataTable>
                )}
                {plan.prestamos.map((p) => (
                  <div key={String(p.id)} className="mb-1">• {p.etiqueta || "Préstamo"} {p.numeroPrestamo}: {p.accion}</div>
                ))}
                {plan.asignaciones.map((a) => (
                  <div key={String(a.id)} className="mb-1">
                    • Asignación #{a.id} ({formatearNumero(a.monto, 2)}): vuelve a "por entregar"
                  </div>
                ))}
              </Seccion>
            )}

            {plan.cuentas.length > 0 && (
              <Seccion titulo="SALDOS DE CUENTAS" color="#1565c0">
                <DataTable value={plan.cuentas} size="small" stripedRows>
                  <Column field="cuenta" header="Cuenta" />
                  <Column header="Saldo" body={(c) => `${c.simbolo} ${flecha(c.saldoAntes, c.saldoDespues)}`} />
                  <Column field="posteriores" header="Registros posteriores a recalcular" style={{ textAlign: "center" }} />
                </DataTable>
              </Seccion>
            )}

            {plan.avisos.length > 0 && (
              <Message
                severity="warn"
                className="w-full mb-3"
                content={
                  <div>
                    <div className="font-bold mb-1">Avisos:</div>
                    <ul className="m-0 pl-3">{plan.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
                  </div>
                }
              />
            )}

          </>
        )}
      </Dialog>
    </>
  );
};

export default RevertirOperacionDialog;
