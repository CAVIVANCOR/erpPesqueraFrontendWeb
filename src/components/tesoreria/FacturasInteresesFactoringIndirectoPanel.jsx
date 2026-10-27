// src/components/tesoreria/FacturasInteresesFactoringIndirectoPanel.jsx
// Factoring indirecto (compras): el banco cobra el interés al proveedor y el proveedor lo factura a MEGUI (compra "INTERES FINANCIEROS").
// Esa factura se enlaza con la cuota (y con su compra origen); se paga como cualquier cuenta por pagar, al proveedor.
import React, { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { getInteresesFactoringIndirecto, enlazarFacturaInteresesCuota } from "../../api/tesoreria/operacionPrestamo";
import { mensajeDeError } from "../../utils/mensajeError";
import { formatearNumero, formatearFecha } from "../../utils/utils";

export default function FacturasInteresesFactoringIndirectoPanel({ prestamoId, toast, disabled = false }) {
  const [datos, setDatos] = useState({ cuotas: [], facturasIntereses: [] });
  const [seleccion, setSeleccion] = useState({});
  const [guardando, setGuardando] = useState(null);

  const cargar = async () => {
    try {
      const res = await getInteresesFactoringIndirecto(prestamoId);
      setDatos(res);
      setSeleccion(Object.fromEntries(res.cuotas.map((c) => [String(c.cuotaId), c.facturaIntereses ? Number(c.facturaIntereses.id) : null])));
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "Facturas de intereses", detail: mensajeDeError(err, "No se pudieron cargar las cuotas del factoring"), life: 8000 });
    }
  };

  useEffect(() => {
    if (prestamoId) cargar();
  }, [prestamoId]);

  const guardar = async (cuota) => {
    setGuardando(cuota.cuotaId);
    try {
      await enlazarFacturaInteresesCuota(cuota.cuotaId, seleccion[String(cuota.cuotaId)] || null);
      toast?.current?.show({ severity: "success", summary: "Factura de intereses", detail: `Cuota ${cuota.numeroCuota}: ${seleccion[String(cuota.cuotaId)] ? "factura enlazada" : "factura soltada"}.`, life: 4000 });
      await cargar();
    } catch (err) {
      toast?.current?.show({ severity: "error", summary: "No se pudo enlazar", detail: mensajeDeError(err, "Error al enlazar la factura de intereses con la cuota"), life: 9000 });
    }
    setGuardando(null);
  };

  if (datos.cuotas.length === 0) return null;

  return (
    <Panel header="🧾 Facturas de intereses del proveedor (se enlazan con la compra origen)" className="mt-3" toggleable>
      <small style={{ display: "block", marginBottom: 8, color: "#6c757d" }}>
        El banco cobra el interés al proveedor y el proveedor lo factura a MEGUI. Registre esa factura como compra (servicio INTERES FINANCIEROS) y enlácela con la cuota; se paga al proveedor como cualquier cuenta por pagar.
      </small>
      <DataTable value={datos.cuotas} dataKey="cuotaId" size="small" showGridlines stripedRows>
        <Column field="numeroCuota" header="Cuota" style={{ width: "5rem" }} />
        <Column field="factura" header="Compra origen" style={{ fontWeight: "bold" }} />
        <Column field="proveedor" header="Proveedor" />
        <Column header="Vence" body={(c) => formatearFecha(c.fechaVencimiento)} />
        <Column
          header="Factura de intereses"
          body={(c) => (
            <Dropdown
              value={seleccion[String(c.cuotaId)] ?? null}
              options={datos.facturasIntereses
                .filter((f) => String(f.proveedorId) === String(c.proveedorId))
                .map((f) => ({ label: `${f.numeroDocumento} · total ${formatearNumero(f.montoTotal, 2)} · saldo ${formatearNumero(f.saldoPendiente, 2)}`, value: Number(f.id) }))}
              onChange={(e) => setSeleccion((previa) => ({ ...previa, [String(c.cuotaId)]: e.value }))}
              placeholder="Seleccione la factura de intereses"
              filter
              showClear
              disabled={disabled}
              emptyMessage="El proveedor no tiene otras compras"
              style={{ width: "100%" }}
            />
          )}
          style={{ minWidth: "22rem" }}
        />
        <Column
          header="Estado"
          body={(c) =>
            c.facturaIntereses ? (
              <Tag value={`Enlazada: ${c.facturaIntereses.numeroDocumento} (saldo ${formatearNumero(c.facturaIntereses.saldoPendiente, 2)})`} severity={c.facturaIntereses.saldoPendiente > 0 ? "warning" : "success"} />
            ) : (
              <Tag value="Pendiente de factura" severity="secondary" />
            )
          }
        />
        <Column
          header=""
          body={(c) => <Button type="button" icon="pi pi-link" label="Guardar" size="small" outlined onClick={() => guardar(c)} loading={guardando === c.cuotaId} disabled={disabled} />}
          style={{ width: "8rem" }}
        />
      </DataTable>
    </Panel>
  );
}
