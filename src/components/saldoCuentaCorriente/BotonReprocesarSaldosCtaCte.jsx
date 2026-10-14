import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { reprocesarSaldosCuentasConProgreso } from "../../api/saldoCuentaCorriente";
import { formatearNumero } from "../../utils/utils";

const MAXIMO_FILAS_VISIBLES = 500;
const INTERVALO_REFRESCO_MS = 120;

const ESTADOS = {
  corregido: { etiqueta: "Corregido", severidad: "warning" },
  reprocesado: { etiqueta: "Reprocesado", severidad: "info" },
  correcto: { etiqueta: "Correcto", severidad: "success" },
};

const flecha = (antes, despues) =>
  Math.abs(antes - despues) < 0.005 ? formatearNumero(despues, 2) : `${formatearNumero(antes, 2)} → ${formatearNumero(despues, 2)}`;

const estadoInicial = {
  fase: "inactivo", // inactivo | procesando | terminado | error
  cuentas: [],
  totalFilas: 0,
  procesadas: 0,
  reprocesadas: 0,
  corregidas: 0,
  cuentaActual: null,
  cuentasTerminadas: [],
  resultado: null,
  error: null,
};

/**
 * Botón genérico y autónomo para reprocesar los saldos de cuentas corrientes.
 *
 * Recalcula la cadena de saldos (saldo anterior / saldo actual) de cada cuenta indicada, completa y
 * en orden de fecha e id (el id desempata filas con la misma fecha: como un kardex, la de mayor id es
 * la más reciente). Corrige los saldos anteriores calculados con el orden antiguo, que solo usaba la fecha.
 * Con `forzar` (por defecto) reescribe los registros indicados en `saldoIds` aunque ya estén correctos.
 * Ingresos, egresos y conciliación no se modifican.
 *
 * Incluye su propia confirmación y un diálogo que muestra el avance en tiempo real: porcentaje, cuenta
 * en proceso y cada registro a medida que se procesa. No depende de la pantalla donde se coloque.
 *
 * @param {Object} props
 * @param {Array<number|string>} props.cuentaCorrienteIds - Cuentas a reprocesar
 * @param {Array<number|string>} [props.saldoIds] - Registros a reescribir con `forzar` (por defecto, los de las cuentas)
 * @param {boolean} [props.forzar] - Reescribe los registros aunque ya estén correctos (por defecto true)
 * @param {Function} [props.onReprocesado] - Se ejecuta al terminar con éxito; recibe el resultado del servidor
 * @param {boolean} [props.disabled] - Deshabilita el botón (por ejemplo, sin permiso)
 * @param {string} [props.label] - Texto del botón
 */
const BotonReprocesarSaldosCtaCte = ({
  cuentaCorrienteIds = [],
  saldoIds = null,
  forzar = true,
  onReprocesado,
  disabled = false,
  label = "Reprocesar saldos",
  icon = "pi pi-sync",
  className = "p-button-warning",
  size = "small",
  outlined = true,
}) => {
  const toast = useRef(null);
  const [confirmar, setConfirmar] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [estado, setEstado] = useState(estadoInicial);
  const [filas, setFilas] = useState([]);

  // Los eventos llegan muy rápido: se acumulan y se pintan a intervalos para no saturar la pantalla
  const bufferFilas = useRef([]);
  const acumulado = useRef({ ...estadoInicial });
  const temporizador = useRef(null);

  const cuentas = [...new Set((cuentaCorrienteIds || []).map((id) => Number(id)))].filter(Boolean);
  const procesando = estado.fase === "procesando";

  const volcar = useCallback(() => {
    setEstado({ ...acumulado.current });
    if (bufferFilas.current.length > 0) {
      const nuevas = bufferFilas.current;
      bufferFilas.current = [];
      setFilas((previas) => [...nuevas.reverse(), ...previas].slice(0, MAXIMO_FILAS_VISIBLES));
    }
  }, []);

  useEffect(() => () => clearInterval(temporizador.current), []);

  const alRecibirEvento = (evento) => {
    const a = acumulado.current;
    if (evento.tipo === "inicio") {
      a.cuentas = evento.cuentas;
      a.totalFilas = evento.totalFilas;
    } else if (evento.tipo === "cuenta") {
      a.cuentaActual = { nombre: evento.nombre, indice: a.cuentasTerminadas.length + 1, indiceFila: 0, totalFilas: 0 };
    } else if (evento.tipo === "fila") {
      a.procesadas += 1;
      if (evento.estado !== "correcto") a.reprocesadas += 1;
      if (evento.estado === "corregido") a.corregidas += 1;
      if (a.cuentaActual) {
        a.cuentaActual = { ...a.cuentaActual, indiceFila: evento.indice, totalFilas: evento.totalCuenta };
      }
      bufferFilas.current.push(evento);
    } else if (evento.tipo === "cuenta_fin") {
      a.cuentasTerminadas = [...a.cuentasTerminadas, evento];
    }
  };

  const reprocesar = async () => {
    setConfirmar(false);
    if (cuentas.length === 0) return;

    acumulado.current = { ...estadoInicial, fase: "procesando" };
    bufferFilas.current = [];
    setFilas([]);
    setEstado({ ...acumulado.current });
    setDialogoVisible(true);
    clearInterval(temporizador.current);
    temporizador.current = setInterval(volcar, INTERVALO_REFRESCO_MS);

    try {
      const resultado = await reprocesarSaldosCuentasConProgreso(cuentas, { forzar, saldoIds }, alRecibirEvento);
      acumulado.current = { ...acumulado.current, fase: "terminado", resultado };
      toast.current?.show({
        severity: "success",
        summary: "Saldos reprocesados",
        detail: `${resultado.cuentasProcesadas} cuenta(s), ${resultado.filasReprocesadas} registro(s) reprocesados, ${resultado.filasCorregidas} cambiaron de valor.`,
        life: 6000,
      });
      await onReprocesado?.(resultado);
    } catch (err) {
      acumulado.current = { ...acumulado.current, fase: "error", error: err?.message || "No se pudieron reprocesar los saldos." };
    } finally {
      clearInterval(temporizador.current);
      volcar();
    }
  };

  const porcentaje =
    estado.fase === "terminado"
      ? 100
      : estado.totalFilas > 0
        ? Math.min(99, Math.floor((estado.procesadas / estado.totalFilas) * 100))
        : 0;

  const cuentaEnCurso = estado.cuentaActual;

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={confirmar}
        onHide={() => setConfirmar(false)}
        header="Reprocesar saldos"
        modal
        draggable={false}
        resizable={false}
        style={{ width: "26rem" }}
        breakpoints={{ "575px": "92vw" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={() => setConfirmar(false)} />
            <Button label="Reprocesar" icon="pi pi-sync" onClick={reprocesar} autoFocus />
          </div>
        }
      >
        <div className="flex align-items-start gap-3">
          <i className="pi pi-sync" style={{ fontSize: "2rem", color: "var(--primary-color)" }} />
          <div style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
            Se recalculará la cadena de saldos de <b>{cuentas.length}</b> cuenta(s), en orden de fecha e id
            {forzar && saldoIds ? (
              <>
                , y se reprocesarán los <b>{saldoIds.length}</b> registro(s) mostrados aunque ya estén correctos
              </>
            ) : null}
            .
            <div className="text-600 mt-2" style={{ fontSize: "0.85rem" }}>
              Ingresos, egresos y conciliación no se modifican. Verá el avance en tiempo real.
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={dialogoVisible}
        onHide={() => !procesando && setDialogoVisible(false)}
        closable={!procesando}
        closeOnEscape={!procesando}
        header="Reprocesando saldos de cuentas corrientes"
        style={{ width: "92vw", maxWidth: "1150px" }}
        modal
        footer={
          <Button label="Cerrar" icon="pi pi-times" severity="secondary" onClick={() => setDialogoVisible(false)} disabled={procesando} />
        }
      >
        <div className="mb-2 flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="font-bold">
            {estado.fase === "terminado" && "Proceso terminado"}
            {estado.fase === "error" && "El proceso se interrumpió"}
            {procesando && (cuentaEnCurso ? `Cuenta ${cuentaEnCurso.indice} de ${estado.cuentas.length}: ${cuentaEnCurso.nombre}` : "Iniciando...")}
          </span>
          <span>
            {estado.procesadas} de {estado.totalFilas} registros
          </span>
        </div>

        <ProgressBar value={porcentaje} showValue style={{ height: "1.6rem" }} />

        {procesando && cuentaEnCurso && cuentaEnCurso.totalFilas > 0 && (
          <div className="text-600 mt-1" style={{ fontSize: "0.85rem" }}>
            Registro {cuentaEnCurso.indiceFila} de {cuentaEnCurso.totalFilas} de esta cuenta
          </div>
        )}

        <div className="flex gap-2 flex-wrap my-3">
          <Tag value={`Reprocesados: ${estado.reprocesadas}`} severity="info" />
          <Tag value={`Cambiaron de valor: ${estado.corregidas}`} severity="warning" />
          <Tag value={`Sin cambio: ${estado.procesadas - estado.reprocesadas}`} severity="success" />
        </div>

        {estado.fase === "error" && (
          <div className="p-3 mb-3 border-round" style={{ background: "#fdecea", color: "#b71c1c" }}>
            {estado.error}
            <div style={{ fontSize: "0.85rem" }}>
              Los registros de la cuenta que se estaba procesando no se guardaron. Las cuentas ya terminadas sí quedaron actualizadas.
            </div>
          </div>
        )}

        {estado.cuentasTerminadas.length > 0 && (
          <div className="mb-3" style={{ fontSize: "0.9rem" }}>
            {estado.cuentasTerminadas.map((c) => (
              <div key={c.cuentaCorrienteId}>
                <i className="pi pi-check-circle mr-2" style={{ color: "#2e7d32" }} />
                {c.nombre}: {c.filas} registros, {c.filasReprocesadas} reprocesados, {c.filasCorregidas} cambiaron de valor. Saldo final:{" "}
                {flecha(c.saldoFinalAntes, c.saldoFinalDespues)}
              </div>
            ))}
          </div>
        )}

        <DataTable
          value={filas}
          size="small"
          stripedRows
          scrollable
          scrollHeight="340px"
          emptyMessage="Esperando registros..."
          rowClassName={(f) => (f.estado === "corregido" ? "font-bold" : "")}
        >
          <Column header="Fecha" style={{ width: "10rem" }} body={(f) => new Date(f.fecha).toLocaleString("es-PE")} />
          <Column header="Mov." style={{ width: "5rem" }} body={(f) => (f.movimientoCajaId ? `#${f.movimientoCajaId}` : "-")} />
          <Column header="Ingresos" style={{ textAlign: "right" }} body={(f) => formatearNumero(f.ingresos, 2)} />
          <Column header="Egresos" style={{ textAlign: "right" }} body={(f) => formatearNumero(f.egresos, 2)} />
          <Column header="Saldo anterior" style={{ textAlign: "right" }} body={(f) => flecha(f.saldoAnteriorAntes, f.saldoAnterior)} />
          <Column header="Saldo actual" style={{ textAlign: "right" }} body={(f) => flecha(f.saldoActualAntes, f.saldoActual)} />
          <Column
            header="Estado"
            style={{ width: "8rem" }}
            body={(f) => <Tag value={ESTADOS[f.estado].etiqueta} severity={ESTADOS[f.estado].severidad} />}
          />
        </DataTable>
        {estado.procesadas > MAXIMO_FILAS_VISIBLES && (
          <div className="text-600 mt-1" style={{ fontSize: "0.8rem" }}>
            Se muestran los últimos {MAXIMO_FILAS_VISIBLES} registros procesados.
          </div>
        )}
      </Dialog>

      <Button
        label={label}
        icon={icon}
        className={className}
        size={size}
        outlined={outlined}
        loading={procesando}
        disabled={disabled || procesando || cuentas.length === 0}
        onClick={() => setConfirmar(true)}
        tooltip="Recalcula la cadena de saldos de las cuentas indicadas (orden fecha e id)"
        tooltipOptions={{ position: "top" }}
      />
    </>
  );
};

export default BotonReprocesarSaldosCtaCte;
