import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";

/**
 * Reemplazo masivo del tipo de movimiento de los registros seleccionados (DetMovsEntregaRendir y MovimientoCaja).
 *
 * El diálogo solo ofrece tipos que el servidor aceptará: activos, del catálogo nuevo (sin " XXX"), sin función del
 * sistema, del mismo sentido (ingreso/egreso) y misma condición de transferencia que lo seleccionado. El servidor
 * vuelve a validar todo: es todo o nada.
 *
 * @param {Array} registrosSeleccionados - Filas seleccionadas (cada una con tipoMovimientoId)
 * @param {Function} onReasignar - async (tipoMovimientoId, ids) => boolean; true si se aplicó (cierra el diálogo)
 */
export default function ReasignarTipoMovimientoMasivo({
  visible,
  onHide,
  registrosSeleccionados = [],
  onReasignar,
  nombreModulo = "registros",
}) {
  const [tipos, setTipos] = useState([]);
  const [tipoDestinoId, setTipoDestinoId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let activo = true;
    getAllTipoMovEntregaRendir()
      .then((lista) => activo && setTipos(lista || []))
      .catch((error) => console.error("No se pudieron cargar los tipos de movimiento:", error));
    return () => {
      activo = false;
    };
  }, [visible]);

  // Tipos actuales de la selección, para fijar el sentido y la condición de transferencia del reemplazo
  const origenes = useMemo(() => {
    const ids = new Set(registrosSeleccionados.map((r) => Number(r.tipoMovimientoId)));
    return tipos.filter((t) => ids.has(Number(t.id)));
  }, [tipos, registrosSeleccionados]);

  // Resumen de lo que se va a reemplazar: tipo actual y cantidad de registros (para que el usuario verifique su selección)
  const resumen = useMemo(() => {
    const conteo = new Map();
    registrosSeleccionados.forEach((r) => conteo.set(Number(r.tipoMovimientoId), (conteo.get(Number(r.tipoMovimientoId)) || 0) + 1));
    return [...conteo.entries()].map(([id, cantidad]) => ({
      id,
      cantidad,
      nombre: tipos.find((t) => Number(t.id) === id)?.nombre || `Tipo ${id}`,
    }));
  }, [tipos, registrosSeleccionados]);

  const sentidos = new Set(origenes.map((t) => t.esIngreso));
  const mezclaSentidos = sentidos.size > 1;
  // Los tipos antiguos (" XXX") no tienen la marca de transferencia: solo cuentan los del catálogo nuevo
  const origenesConMarca = origenes.filter((t) => !/ XXX$/.test(t.nombre));
  const mezclaTransferencias = new Set(origenesConMarca.map((t) => Boolean(t.esTransferencia))).size > 1;
  const origenesConFuncion = origenes.filter((t) => t.codigoSistema);

  const opciones = useMemo(() => {
    if (origenes.length === 0 || mezclaSentidos || mezclaTransferencias) return [];
    const esIngreso = origenes[0].esIngreso;
    const exigeTransferencia = origenesConMarca.length > 0;
    const esTransferencia = exigeTransferencia && Boolean(origenesConMarca[0].esTransferencia);
    return tipos
      .filter(
        (t) =>
          t.activo &&
          !/ XXX$/.test(t.nombre) &&
          !t.codigoSistema &&
          t.esIngreso === esIngreso &&
          (!exigeTransferencia || Boolean(t.esTransferencia) === esTransferencia),
      )
      .map((t) => ({ value: Number(t.id), label: `${t.nombre}${t.categoria?.nombre ? ` — ${t.categoria.nombre}` : ""}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tipos, origenes, origenesConMarca, mezclaSentidos, mezclaTransferencias]);

  const advertencia = mezclaSentidos
    ? "La selección mezcla ingresos y egresos: seleccione solo de un sentido."
    : mezclaTransferencias
      ? "La selección mezcla transferencias con otros movimientos: seleccione solo de un grupo."
      : origenesConFuncion.length > 0
        ? `Hay movimientos cuyo tipo cumple una función del sistema (${origenesConFuncion.map((t) => t.nombre).join(", ")}): no se reemplazan de forma masiva.`
        : null;

  const handleReasignar = async () => {
    if (!tipoDestinoId) return;
    setLoading(true);
    try {
      const aplicado = await onReasignar(tipoDestinoId, registrosSeleccionados.map((r) => r.id));
      if (aplicado) {
        setTipoDestinoId(null);
        onHide();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    setTipoDestinoId(null);
    onHide();
  };

  return (
    <Dialog header="Reemplazar Tipo de Movimiento" visible={visible} style={{ width: "640px" }} onHide={handleHide} modal>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ fontSize: "1rem", margin: 0 }}>
          <strong>Registros seleccionados:</strong> {registrosSeleccionados.length} {nombreModulo}
        </p>

        {resumen.length > 0 && (
          <div style={{ background: "#f1f3f5", padding: "0.75rem", borderRadius: 6, fontSize: "0.9rem" }}>
            <strong>Tipos actuales de la selección:</strong>
            <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
              {resumen.map((r) => (
                <li key={r.id}>
                  {r.nombre} ({r.cantidad})
                </li>
              ))}
            </ul>
          </div>
        )}

        {advertencia && (
          <div style={{ background: "#fff3cd", color: "#664d03", padding: "0.75rem", borderRadius: 6 }}>{advertencia}</div>
        )}

        <div>
          <label htmlFor="tipoDestinoMasivo" style={{ fontWeight: "bold" }}>
            Nuevo tipo de movimiento *
          </label>
          <Dropdown
            id="tipoDestinoMasivo"
            value={tipoDestinoId}
            options={opciones}
            onChange={(e) => setTipoDestinoId(e.value)}
            placeholder={opciones.length === 0 ? "No hay tipos disponibles para esta selección" : "Seleccionar el nuevo tipo"}
            filter
            showClear
            disabled={loading || opciones.length === 0}
            style={{ width: "100%" }}
          />
          <small style={{ color: "#6c757d" }}>
            Solo se muestran tipos activos del catálogo nuevo, del mismo sentido que la selección. El asiento contable no
            guarda el tipo de movimiento, por eso no se modifica.
          </small>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <Button label="Cancelar" icon="pi pi-times" onClick={handleHide} className="p-button-text" disabled={loading} />
          <Button
            label={`Reemplazar en ${registrosSeleccionados.length} ${nombreModulo}`}
            icon="pi pi-check"
            onClick={handleReasignar}
            disabled={!tipoDestinoId || loading || Boolean(advertencia)}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  );
}
